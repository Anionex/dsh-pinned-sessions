import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  attachSessionMenuHost,
  captureSessionId,
  ensurePinnedHost,
  findSessionActionTarget,
  findUnclaimedPortalMenu,
  focusAfterPinnedRemoval,
  listPortalMenus,
  MENU_HOST_ATTRIBUTE,
  MENU_OWNER_ATTRIBUTE,
  PINNED_HOST_ATTRIBUTE,
  removeBridgeArtifacts,
  updateSessionMenuItem,
  type SessionsForCapture,
} from '../src/client/dom-bridge.js'

function makeSessions(current = 'current'): SessionsForCapture & { open: ReturnType<typeof vi.fn> } {
  return {
    list: { getSnapshot: () => ({ current }) },
    open: vi.fn(),
  }
}

function makeSessionMenu(labels = ['Rename', 'Fork', 'Archive']): HTMLElement {
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')
  const viewport = document.createElement('div')
  viewport.setAttribute('role', 'presentation')
  for (const label of labels) {
    const wrap = document.createElement('div')
    wrap.className = 'native-wrap'
    const button = document.createElement('button')
    button.className = 'native-button'
    button.setAttribute('role', 'menuitem')
    const icon = document.createElement('span')
    icon.className = 'native-icon'
    const text = document.createElement('span')
    text.className = 'native-label'
    text.textContent = label
    button.append(icon, text)
    wrap.append(button)
    viewport.append(wrap)
  }
  menu.append(viewport)
  document.body.append(menu)
  return menu
}

beforeEach(() => {
  document.body.replaceChildren()
})

describe('Session action discovery', () => {
  it('accepts only a nested button in a Session tree row', () => {
    document.body.innerHTML = `
      <div data-slot="sidebar.workspaces">
        <div role="treeitem" aria-selected="false"><button id="session"><svg id="icon"></svg></button></div>
        <button role="treeitem" aria-selected="false" id="search-result"></button>
        <div role="treeitem" aria-expanded="true"><button id="workspace"></button></div>
      </div>`
    expect(findSessionActionTarget(document.querySelector('#icon'))?.button.id).toBe('session')
    expect(findSessionActionTarget(document.querySelector('#search-result'))).toBeNull()
    expect(findSessionActionTarget(document.querySelector('#workspace'))).toBeNull()
  })

  it('captures a selected row from its native callback even if the snapshot is stale', () => {
    const row = document.createElement('div')
    row.setAttribute('aria-selected', 'true')
    const sessions = makeSessions('different-current-id')
    row.addEventListener('click', () => { sessions.open('selected-row-id') })
    expect(captureSessionId(row, sessions)).toBe('selected-row-id')
    expect(sessions.open).not.toHaveBeenCalled()
  })

  it('captures a non-current row ID from the native callback without navigation', () => {
    const row = document.createElement('div')
    row.setAttribute('aria-selected', 'false')
    const sessions = makeSessions()
    row.addEventListener('click', () => { sessions.open('exact-row-id') })

    expect(captureSessionId(row, sessions)).toBe('exact-row-id')
    expect(sessions.open).not.toHaveBeenCalled()
    sessions.open('after-restore')
    expect(sessions.open).toHaveBeenCalledWith('after-restore')
  })

  it('fails closed when sessions.open cannot be intercepted', () => {
    const row = document.createElement('div')
    row.setAttribute('aria-selected', 'false')
    const sessions = makeSessions()
    const clicked = vi.fn()
    row.addEventListener('click', clicked)
    Object.defineProperty(sessions, 'open', {
      configurable: false,
      writable: false,
      value: sessions.open,
    })

    expect(captureSessionId(row, sessions)).toBeNull()
    expect(clicked).not.toHaveBeenCalled()
  })
})

describe('Portal hosts', () => {
  it('inserts the pinned section after the native Workspace header', () => {
    document.body.innerHTML = `
      <div data-slot="sidebar.workspaces">
        <div id="workspace-root"><div id="header"></div><div id="list"></div></div>
      </div>`
    const host = ensurePinnedHost(document)
    expect(host?.hasAttribute(PINNED_HOST_ATTRIBUTE)).toBe(true)
    expect(host?.previousElementSibling?.id).toBe('header')
    expect(host?.nextElementSibling?.id).toBe('list')
    expect(ensurePinnedHost(document)).toBe(host)
  })

  it('adds one unmanaged native-styled pin row and repositions the menu', () => {
    const menu = makeSessionMenu()
    const resize = vi.fn()
    window.addEventListener('resize', resize)
    expect(findUnclaimedPortalMenu(document)).toBe(menu)
    const target = attachSessionMenuHost(menu, 'session-1')
    expect(target).toMatchObject({ menu, sessionId: 'session-1' })
    expect(menu.getAttribute(MENU_OWNER_ATTRIBUTE)).toBe('session-1')
    expect(target?.host.hasAttribute(MENU_HOST_ATTRIBUTE)).toBe(true)
    expect(target?.button.classList.contains('native-button')).toBe(true)
    expect(target?.button.classList.contains('dsh-pins-menu-button')).toBe(true)
    expect(target?.host.nextElementSibling?.textContent).toBe('Archive')
    expect(resize).toHaveBeenCalledOnce()

    if (target !== null) updateSessionMenuItem(target, false, 'Pin session')
    expect(target?.button.getAttribute('aria-label')).toBe('Pin session')
    expect(target?.label.textContent).toBe('Pin session')
    expect(target?.icon.querySelector('svg.lucide-pin')).not.toBeNull()
    expect(attachSessionMenuHost(menu, 'session-1')).toBeNull()
    window.removeEventListener('resize', resize)
  })

  it('claims only a newly created menu and rejects non-Session menu structure', () => {
    const oldMenu = makeSessionMenu()
    const beforeClick = new Set(listPortalMenus(document))
    expect(findUnclaimedPortalMenu(document, beforeClick)).toBeNull()

    const viewOptions = makeSessionMenu(['Newest first', 'Oldest first', 'Expanded', 'Compact'])
    expect(findUnclaimedPortalMenu(document, beforeClick)).toBe(viewOptions)
    expect(attachSessionMenuHost(viewOptions, 'stale-session')).toBeNull()

    const sessionMenu = makeSessionMenu()
    expect(findUnclaimedPortalMenu(document, new Set([...beforeClick, viewOptions]))).toBe(sessionMenu)
    expect(oldMenu.isConnected).toBe(true)
  })

  it('rejects a new menu that is not positioned by the triggering Session action', () => {
    const menu = makeSessionMenu()
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      right: 500,
      bottom: 560,
      left: 280,
      width: 220,
      height: 160,
      x: 280,
      y: 400,
      toJSON: () => ({}),
    })
    expect(findUnclaimedPortalMenu(document, new Set(), {
      top: 100,
      right: 260,
      bottom: 116,
      left: 244,
      width: 16,
      height: 16,
    })).toBeNull()
  })

  it('hands focus to the next pin or the selected native row after unpin', () => {
    document.body.innerHTML = `
      <div data-slot="sidebar.workspaces">
        <div role="treeitem" aria-selected="true" id="native"></div>
        <div data-dsh-pinned-sessions-host>
          <button class="dsh-pins-open" id="first"></button>
          <button class="dsh-pins-open" id="second"></button>
        </div>
      </div>`
    const host = document.querySelector<HTMLElement>(`[${PINNED_HOST_ATTRIBUTE}]`)
    expect(focusAfterPinnedRemoval(document, host, 1)).toBe(true)
    expect(document.activeElement?.id).toBe('second')
    host?.replaceChildren()
    expect(focusAfterPinnedRemoval(document, host, 0)).toBe(true)
    const native = document.querySelector<HTMLElement>('#native')
    expect(document.activeElement).toBe(native)
    expect(native?.getAttribute('tabindex')).toBe('-1')
  })

  it('removes every plugin-owned bridge artifact on disposal', () => {
    document.body.innerHTML = `
      <div ${PINNED_HOST_ATTRIBUTE}></div>
      <div role="menu" ${MENU_OWNER_ATTRIBUTE}="s"><div ${MENU_HOST_ATTRIBUTE}></div></div>`
    removeBridgeArtifacts(document)
    expect(document.querySelector(`[${PINNED_HOST_ATTRIBUTE}]`)).toBeNull()
    expect(document.querySelector(`[${MENU_HOST_ATTRIBUTE}]`)).toBeNull()
    expect(document.querySelector(`[${MENU_OWNER_ATTRIBUTE}]`)).toBeNull()
  })
})
