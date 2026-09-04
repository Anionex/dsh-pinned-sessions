import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PinnedSessionsBridge } from '../src/client/index.js'
import { MENU_HOST_ATTRIBUTE, type SessionsForCapture } from '../src/client/dom-bridge.js'
import { PinStore } from '../src/client/pin-store.js'

function makeMenu(labels: readonly string[]): HTMLElement {
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')
  const viewport = document.createElement('div')
  viewport.setAttribute('role', 'presentation')
  for (const label of labels) {
    const wrapper = document.createElement('div')
    wrapper.className = 'native-wrapper'
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'menuitem')
    button.className = 'native-button'
    const icon = document.createElement('span')
    icon.className = 'native-icon'
    const text = document.createElement('span')
    text.className = 'native-label'
    text.textContent = label
    button.append(icon, text)
    wrapper.appendChild(button)
    viewport.appendChild(wrapper)
  }
  menu.appendChild(viewport)
  document.body.appendChild(menu)
  return menu
}

async function clickAndFlush(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.click()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function makeBridgeProps(store: PinStore, deleteAvailable = true) {
  const sessions: SessionsForCapture = {
    list: { getSnapshot: () => ({ current: 'session-a' }) },
    open: vi.fn(),
  }
  const sessionSnapshot = {
    ids: ['session-a'],
    byId: { 'session-a': { id: 'session-a', title: 'Session A' } },
    current: 'session-a',
    phase: 'ready',
  }
  const workspaceSnapshot = {
    items: [{ workspaceId: 'workspace-a', title: 'Workspace A', sessionIds: ['session-a'] }],
    archivedSessionIds: [],
    phase: 'ready',
  }
  const labels: Record<string, string> = {
    'menu.rename': 'Rename',
    'menu.fork': 'Fork session',
    'menu.pin': 'Pin session',
    'menu.unpin': 'Unpin session',
    'menu.archive': 'Archive session',
    'menu.delete': 'Delete session',
    'section.label': 'Pinned sessions',
    'session.actions': 'Actions for pinned session “{name}”',
    'session.open': 'Open pinned session “{name}”',
    'session.unpin': 'Unpin “{name}”',
    'dialog.close': 'Close',
    'dialog.cancel': 'Cancel',
    'session.archiveFailed': 'Could not archive session: {detail}',
    'session.forkFailed': 'Could not fork session: {detail}',
    'rename.title': 'Rename session',
    'rename.field': 'Session name',
    'rename.confirm': 'Rename',
    'delete.title': 'Delete session',
    'delete.description': 'Delete “{name}” permanently.',
    'delete.pending': 'Deleting session…',
  }
  const useSessions = <S,>(selector: (snapshot: typeof sessionSnapshot) => S): S => selector(sessionSnapshot)
  const useWorkspaces = <S,>(selector: (snapshot: typeof workspaceSnapshot) => S): S => selector(workspaceSnapshot)
  const t = (key: string, params?: Readonly<Record<string, unknown>>): string => (labels[key] ?? key)
    .replace('{name}', String(params?.name ?? ''))
    .replace('{detail}', String(params?.detail ?? ''))
  let deleteCapability = deleteAvailable
  const deleteListeners = new Set<() => void>()
  const deleteAvailability = {
    getSnapshot: (): boolean => deleteCapability,
    subscribe: (listener: () => void): (() => void) => {
      deleteListeners.add(listener)
      return () => { deleteListeners.delete(listener) }
    },
  }
  const setDeleteAvailable = (value: boolean): void => {
    if (deleteCapability === value) return
    deleteCapability = value
    for (const listener of deleteListeners) listener()
  }
  const actions = {
    renameSession: vi.fn<(sessionId: string, title: string) => Promise<void>>().mockResolvedValue(undefined),
    forkSession: vi.fn<(sessionId: string) => Promise<void>>().mockResolvedValue(undefined),
    archiveSession: vi.fn<(sessionId: string) => Promise<void>>().mockResolvedValue(undefined),
    deleteAvailability,
    deleteSession: vi.fn<(sessionId: string) => Promise<void>>().mockResolvedValue(undefined),
  }
  return { store, sessions, actions, setDeleteAvailable, useSessions, useWorkspaces, t }
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  document.body.innerHTML = `
    <div data-slot="sidebar.workspaces">
      <div id="sidebar-root">
        <div id="workspace-header"></div>
        <div role="tree">
          <div role="treeitem" aria-selected="true" tabindex="-1" id="session-row">
            <button type="button" id="session-action"></button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" id="view-options"></button>
    <div id="overlay-root"></div>`
})

afterEach(() => {
  delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT
  vi.restoreAllMocks()
})

describe('PinnedSessionsBridge menu association', () => {
  it('does not attach a stale Session action to a later unrelated menu', async () => {
    const store = new PinStore(undefined)
    const props = makeBridgeProps(store)
    const { sessions } = props

    const row = document.querySelector<HTMLElement>('#session-row')
    const action = document.querySelector<HTMLButtonElement>('#session-action')
    const viewOptions = document.querySelector<HTMLButtonElement>('#view-options')
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    if (row === null || action === null || viewOptions === null || overlay === null) throw new Error('test DOM missing')

    row.addEventListener('click', event => {
      if (event.target === row) sessions.open('session-a')
    })
    let sessionMenu: HTMLElement | null = null
    action.addEventListener('click', () => {
      if (sessionMenu?.isConnected === true) {
        sessionMenu.remove()
        sessionMenu = null
      } else {
        sessionMenu = makeMenu(['Rename', 'Fork', 'Archive'])
      }
    })
    let unrelatedMenu: HTMLElement | null = null
    viewOptions.addEventListener('click', () => {
      unrelatedMenu = makeMenu(['Newest', 'Oldest', 'Expanded', 'Compact'])
    })

    const root = createRoot(overlay)
    await act(async () => {
      root.render(createElement(PinnedSessionsBridge, props))
    })

    await clickAndFlush(action)
    expect(sessionMenu?.querySelector(`[${MENU_HOST_ATTRIBUTE}] button`)?.getAttribute('aria-label')).toBe('Pin session')

    await clickAndFlush(action)
    expect(sessionMenu).toBeNull()

    await clickAndFlush(viewOptions)
    expect(unrelatedMenu?.querySelector(`[${MENU_HOST_ATTRIBUTE}]`)).toBeNull()
    expect(store.getSnapshot()).toEqual([])

    await act(async () => { root.unmount() })
  })

  it('matches the standard Web Session menu before unpinning', async () => {
    const store = new PinStore(undefined)
    store.toggle('session-a')
    const props = makeBridgeProps(store, false)
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    const sidebarRoot = document.querySelector<HTMLElement>('#sidebar-root')
    const viewOptions = document.querySelector<HTMLButtonElement>('#view-options')
    if (overlay === null || sidebarRoot === null || viewOptions === null) throw new Error('test DOM missing')
    vi.spyOn(sidebarRoot, 'getBoundingClientRect').mockReturnValue({ width: 260 } as DOMRect)

    const root = createRoot(overlay)
    await act(async () => {
      root.render(createElement(PinnedSessionsBridge, props))
    })

    const trigger = document.querySelector<HTMLButtonElement>('.dsh-pins-actions')
    if (trigger === null) throw new Error('pinned actions missing')
    expect(document.querySelector('.dsh-pins-remove')).toBeNull()
    expect(trigger.querySelector('svg')).not.toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-label')).toBe('Actions for pinned session “Session A”')

    await clickAndFlush(trigger)
    let menu = document.querySelector<HTMLElement>('[role="menu"]')
    expect([...menu?.querySelectorAll('[role="menuitem"]') ?? []].map(item => item.textContent)).toEqual([
      'Rename',
      'Fork session',
      'Unpin session',
      'Archive session',
    ])

    await act(async () => {
      viewOptions.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
      await Promise.resolve()
    })
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    trigger.focus()
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await Promise.resolve()
    })
    expect(document.querySelector('[role="menu"]')).not.toBeNull()
    expect(document.activeElement?.textContent).toBe('Rename')
    const pressMenuKey = async (key: string): Promise<void> => {
      await act(async () => {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        await Promise.resolve()
      })
    }
    await pressMenuKey('ArrowUp')
    expect(document.activeElement?.textContent).toBe('Archive session')
    await pressMenuKey('Home')
    expect(document.activeElement?.textContent).toBe('Rename')
    await pressMenuKey('End')
    expect(document.activeElement?.textContent).toBe('Archive session')
    await pressMenuKey('ArrowDown')
    expect(document.activeElement?.textContent).toBe('Rename')
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await Promise.resolve()
    })
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)

    await clickAndFlush(trigger)
    menu = document.querySelector<HTMLElement>('[role="menu"]')
    const unpin = [...menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []]
      .find(item => item.textContent === 'Unpin session')
    if (unpin === undefined) throw new Error('unpin action missing')
    await clickAndFlush(unpin)
    expect(store.getSnapshot()).toEqual([])
    expect(document.querySelector('.dsh-pins-section')).toBeNull()
    expect(document.activeElement?.id).toBe('session-row')

    await act(async () => { root.unmount() })
  })

  it('routes the extended Desktop menu actions through native services', async () => {
    const store = new PinStore(undefined)
    store.toggle('session-a')
    const props = makeBridgeProps(store, true)
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    const sidebarRoot = document.querySelector<HTMLElement>('#sidebar-root')
    if (overlay === null || sidebarRoot === null) throw new Error('test DOM missing')
    vi.spyOn(sidebarRoot, 'getBoundingClientRect').mockReturnValue({ width: 260 } as DOMRect)

    const root = createRoot(overlay)
    await act(async () => { root.render(createElement(PinnedSessionsBridge, props)) })
    const trigger = document.querySelector<HTMLButtonElement>('.dsh-pins-actions')
    if (trigger === null) throw new Error('pinned actions missing')
    const selectMenuItem = async (label: string): Promise<void> => {
      await clickAndFlush(trigger)
      const menu = document.querySelector<HTMLElement>('[role="menu"]')
      const item = [...menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []]
        .find(candidate => candidate.textContent === label)
      if (item === undefined) throw new Error(`${label} action missing`)
      await clickAndFlush(item)
    }

    await clickAndFlush(trigger)
    const labels = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].map(item => item.textContent)
    expect(labels).toEqual(['Rename', 'Fork session', 'Unpin session', 'Archive session', 'Delete session'])
    await clickAndFlush(trigger)

    await selectMenuItem('Rename')
    const renameDialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const renameInput = renameDialog?.querySelector<HTMLInputElement>('[aria-label="Session name"]') ?? null
    expect(document.activeElement).toBe(renameInput)
    const renameConfirm = [...renameDialog?.querySelectorAll<HTMLButtonElement>('button') ?? []]
      .find(button => button.textContent === 'Rename')
    if (renameConfirm === undefined) throw new Error('rename confirmation missing')
    await clickAndFlush(renameConfirm)
    expect(props.actions.renameSession).toHaveBeenCalledWith('session-a', 'Session A')
    expect(document.activeElement).toBe(trigger)

    await selectMenuItem('Fork session')
    expect(props.actions.forkSession).toHaveBeenCalledWith('session-a')
    expect(document.activeElement).toBe(trigger)

    await selectMenuItem('Archive session')
    expect(props.actions.archiveSession).toHaveBeenCalledWith('session-a')
    expect(document.activeElement).toBe(trigger)

    await selectMenuItem('Delete session')
    const deleteDialog = document.querySelector<HTMLElement>('[role="dialog"]')
    expect(document.activeElement?.textContent).toBe('Cancel')
    const deleteConfirm = [...deleteDialog?.querySelectorAll<HTMLButtonElement>('button') ?? []]
      .find(button => button.textContent === 'Delete session')
    if (deleteConfirm === undefined) throw new Error('delete confirmation missing')
    await clickAndFlush(deleteConfirm)
    expect(props.actions.deleteSession).toHaveBeenCalledWith('session-a')
    expect(document.activeElement).toBe(trigger)

    await act(async () => { root.unmount() })
  })

  it('reacts when the optional Desktop delete service activates or unloads', async () => {
    const store = new PinStore(undefined)
    store.toggle('session-a')
    const props = makeBridgeProps(store, false)
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    const sidebarRoot = document.querySelector<HTMLElement>('#sidebar-root')
    if (overlay === null || sidebarRoot === null) throw new Error('test DOM missing')
    vi.spyOn(sidebarRoot, 'getBoundingClientRect').mockReturnValue({ width: 260 } as DOMRect)

    const root = createRoot(overlay)
    await act(async () => { root.render(createElement(PinnedSessionsBridge, props)) })
    const trigger = document.querySelector<HTMLButtonElement>('.dsh-pins-actions')
    if (trigger === null) throw new Error('pinned actions missing')
    const labels = (): Array<string | null> => [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
      .map(item => item.textContent)

    await clickAndFlush(trigger)
    expect(labels()).not.toContain('Delete session')
    await clickAndFlush(trigger)

    await act(async () => { props.setDeleteAvailable(true) })
    await clickAndFlush(trigger)
    expect(labels()).toContain('Delete session')
    await clickAndFlush(trigger)

    await act(async () => { props.setDeleteAvailable(false) })
    await clickAndFlush(trigger)
    expect(labels()).not.toContain('Delete session')

    await act(async () => { root.unmount() })
  })

  it('matches Desktop failure feedback for fork and archive actions', async () => {
    const store = new PinStore(undefined)
    store.toggle('session-a')
    const props = makeBridgeProps(store, true)
    props.actions.forkSession.mockRejectedValueOnce(new Error('fork broke'))
    props.actions.archiveSession.mockRejectedValueOnce(new Error('archive broke'))
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    const sidebarRoot = document.querySelector<HTMLElement>('#sidebar-root')
    if (overlay === null || sidebarRoot === null) throw new Error('test DOM missing')
    vi.spyOn(sidebarRoot, 'getBoundingClientRect').mockReturnValue({ width: 260 } as DOMRect)

    const root = createRoot(overlay)
    await act(async () => { root.render(createElement(PinnedSessionsBridge, props)) })
    const trigger = document.querySelector<HTMLButtonElement>('.dsh-pins-actions')
    if (trigger === null) throw new Error('pinned actions missing')
    const selectMenuItem = async (label: string): Promise<void> => {
      await clickAndFlush(trigger)
      const item = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
        .find(candidate => candidate.textContent === label)
      if (item === undefined) throw new Error(`${label} action missing`)
      await clickAndFlush(item)
    }

    await selectMenuItem('Fork session')
    expect(document.querySelector('[role="status"]')?.textContent).toBe('Could not fork session: fork broke')
    await selectMenuItem('Archive session')
    expect(document.querySelector('[role="status"]')?.textContent).toBe('Could not archive session: archive broke')
    expect(document.activeElement).toBe(trigger)

    await act(async () => { root.unmount() })
  })

  it.each(['Archive session', 'Delete session'])('hands focus off after %s removes a pinned row', async label => {
    const store = new PinStore(undefined)
    store.toggle('session-a')
    const props = makeBridgeProps(store, true)
    const overlay = document.querySelector<HTMLElement>('#overlay-root')
    const sidebarRoot = document.querySelector<HTMLElement>('#sidebar-root')
    const nativeRow = document.querySelector<HTMLElement>('#session-row')
    if (overlay === null || sidebarRoot === null || nativeRow === null) throw new Error('test DOM missing')
    vi.spyOn(sidebarRoot, 'getBoundingClientRect').mockReturnValue({ width: 260 } as DOMRect)

    const root = createRoot(overlay)
    await act(async () => { root.render(createElement(PinnedSessionsBridge, props)) })
    const trigger = document.querySelector<HTMLButtonElement>('.dsh-pins-actions')
    if (trigger === null) throw new Error('pinned actions missing')
    await clickAndFlush(trigger)
    const item = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
      .find(candidate => candidate.textContent === label)
    if (item === undefined) throw new Error(`${label} action missing`)
    await clickAndFlush(item)
    if (label === 'Delete session') {
      const confirm = [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
        .find(button => button.textContent === 'Delete session')
      if (confirm === undefined) throw new Error('delete confirmation missing')
      await clickAndFlush(confirm)
    }

    const removedSessionSnapshot = { ids: [], byId: {}, current: 'session-a', phase: 'ready' }
    const removedWorkspaceSnapshot = {
      items: [{ workspaceId: 'workspace-a', title: 'Workspace A', sessionIds: [] }],
      archivedSessionIds: label === 'Archive session' ? ['session-a'] : [],
      phase: 'ready',
    }
    const removedProps = {
      ...props,
      useSessions: <S,>(selector: (snapshot: typeof removedSessionSnapshot) => S): S => selector(removedSessionSnapshot),
      useWorkspaces: <S,>(selector: (snapshot: typeof removedWorkspaceSnapshot) => S): S => selector(removedWorkspaceSnapshot),
    }
    await act(async () => {
      root.render(createElement(PinnedSessionsBridge, removedProps))
      await Promise.resolve()
    })
    expect(document.querySelector('.dsh-pins-section')).toBeNull()
    expect(document.activeElement).toBe(nativeRow)

    await act(async () => { root.unmount() })
  })
})
