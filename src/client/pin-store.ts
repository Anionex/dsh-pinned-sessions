export const PIN_STORAGE_KEY = 'dsh.pinned-sessions.v1'
const MAX_PINS = 500

export interface PinRecord {
  readonly id: string
  readonly pinnedAt: number
}

interface PersistedPins {
  readonly version: 1
  readonly pins: readonly PinRecord[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function isPinRecord(value: unknown): value is PinRecord {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row.id === 'string'
    && row.id.length > 0
    && Number.isFinite(row.pinnedAt)
    && (row.pinnedAt as number) >= 0
}

/** Decode, de-duplicate, and normalize one persisted pin snapshot. */
export function decodePins(raw: string | null): readonly PinRecord[] {
  if (raw === null) return []
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPins>
    if (parsed.version !== 1 || !Array.isArray(parsed.pins)) return []
    const byId = new Map<string, PinRecord>()
    for (const candidate of parsed.pins) {
      if (!isPinRecord(candidate)) continue
      const previous = byId.get(candidate.id)
      if (previous === undefined || candidate.pinnedAt > previous.pinnedAt) {
        byId.set(candidate.id, { id: candidate.id, pinnedAt: candidate.pinnedAt })
      }
    }
    return [...byId.values()]
      .sort((left, right) => right.pinnedAt - left.pinnedAt || left.id.localeCompare(right.id))
      .slice(0, MAX_PINS)
  } catch {
    return []
  }
}

/** Browser-local, versioned pin state with React-compatible subscriptions. */
export class PinStore {
  private snapshot: readonly PinRecord[]
  private readonly listeners = new Set<() => void>()

  constructor(private readonly storage: StorageLike | undefined) {
    this.snapshot = this.read()
  }

  readonly getSnapshot = (): readonly PinRecord[] => this.snapshot

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  isPinned(id: string): boolean {
    return this.snapshot.some(row => row.id === id)
  }

  toggle(id: string, now = Date.now()): void {
    if (id.length === 0) return
    const without = this.snapshot.filter(row => row.id !== id)
    this.publish(this.isPinned(id) ? without : [{ id, pinnedAt: now }, ...without])
  }

  prune(keep: (id: string) => boolean): void {
    const next = this.snapshot.filter(row => keep(row.id))
    if (next.length !== this.snapshot.length) this.publish(next)
  }

  reload(): void {
    const next = this.read()
    if (samePins(this.snapshot, next)) return
    this.snapshot = next
    this.emit()
  }

  private read(): readonly PinRecord[] {
    try {
      return decodePins(this.storage?.getItem(PIN_STORAGE_KEY) ?? null)
    } catch {
      return []
    }
  }

  private publish(next: readonly PinRecord[]): void {
    this.snapshot = [...next]
      .sort((left, right) => right.pinnedAt - left.pinnedAt || left.id.localeCompare(right.id))
      .slice(0, MAX_PINS)
    try {
      this.storage?.setItem(PIN_STORAGE_KEY, JSON.stringify({ version: 1, pins: this.snapshot }))
    } catch {
      // Storage can be unavailable in hardened or quota-constrained browser profiles.
    }
    this.emit()
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener()
  }
}

function samePins(left: readonly PinRecord[], right: readonly PinRecord[]): boolean {
  return left.length === right.length
    && left.every((row, index) => row.id === right[index]?.id && row.pinnedAt === right[index]?.pinnedAt)
}
