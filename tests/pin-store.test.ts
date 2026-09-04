import { describe, expect, it, vi } from 'vitest'
import { decodePins, PIN_STORAGE_KEY, PinStore, type StorageLike } from '../src/client/pin-store.js'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('decodePins', () => {
  it('rejects malformed and unknown-version payloads', () => {
    expect(decodePins('{')).toEqual([])
    expect(decodePins(JSON.stringify({ version: 2, pins: [] }))).toEqual([])
  })

  it('deduplicates by Session ID and sorts newest first', () => {
    expect(decodePins(JSON.stringify({
      version: 1,
      pins: [
        { id: 'older', pinnedAt: 1 },
        { id: 'newer', pinnedAt: 8 },
        { id: 'older', pinnedAt: 4 },
        { id: '', pinnedAt: 10 },
      ],
    }))).toEqual([
      { id: 'newer', pinnedAt: 8 },
      { id: 'older', pinnedAt: 4 },
    ])
  })
})

describe('PinStore', () => {
  it('persists toggle order and notifies subscribers', () => {
    const storage = new MemoryStorage()
    const store = new PinStore(storage)
    const listener = vi.fn()
    store.subscribe(listener)

    store.toggle('one', 10)
    store.toggle('two', 20)

    expect(store.getSnapshot()).toEqual([
      { id: 'two', pinnedAt: 20 },
      { id: 'one', pinnedAt: 10 },
    ])
    expect(JSON.parse(storage.values.get(PIN_STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      pins: store.getSnapshot(),
    })
    expect(listener).toHaveBeenCalledTimes(2)

    store.toggle('two', 30)
    expect(store.getSnapshot()).toEqual([{ id: 'one', pinnedAt: 10 }])
  })

  it('prunes missing or archived sessions and reloads external changes', () => {
    const storage = new MemoryStorage()
    const store = new PinStore(storage)
    store.toggle('keep', 1)
    store.toggle('drop', 2)
    store.prune(id => id === 'keep')
    expect(store.getSnapshot()).toEqual([{ id: 'keep', pinnedAt: 1 }])

    storage.values.set(PIN_STORAGE_KEY, JSON.stringify({
      version: 1,
      pins: [{ id: 'external', pinnedAt: 7 }],
    }))
    store.reload()
    expect(store.getSnapshot()).toEqual([{ id: 'external', pinnedAt: 7 }])
  })

  it('keeps working when browser storage throws', () => {
    const storage: StorageLike = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('quota') },
    }
    const store = new PinStore(storage)
    store.toggle('memory-only', 3)
    expect(store.isPinned('memory-only')).toBe(true)
  })
})
