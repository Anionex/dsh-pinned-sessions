import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  attachSessionMenuHost,
  captureSessionId,
  ensurePinnedHost,
  findSessionActionTarget,
  findUnclaimedPortalMenu,
  MENU_HOST_ATTRIBUTE,
  MENU_OWNER_ATTRIBUTE,
  PINNED_HOST_ATTRIBUTE,
  removeBridgeArtifacts,
  type SessionsForCapture,
} from '../src/client/dom-bridge.js'

function makeSessions(current = 'current'): SessionsForCapture & { open: ReturnType<typeof vi.fn> } {
  return {
    list: { getSnapshot: () => ({ current }) },
    open: vi.fn(),
  }
}

function makeSessionMenu(): HTMLElement {
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')
  const viewport = document.createElement('div')
  viewport.setAttribute('role', 'presentation')
  for (const label of ['Rename', 'Fork', 'Archive']) {
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

  it('reads the selected Session directly from the official snapshot', () => {
    const row = document.createElement('div')
    row.setAttribute('aria-selected', 'true')
    const sessions = makeSessions('selected-id')
    expect(captureSessionId(row, sessions)).toBe('selected-id')
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

  it('adds one native-styled pin row before the archive item', () => {
    const menu = makeSessionMenu()
    expect(findUnclaimedPortalMenu(document)).toBe(menu)
    const target = attachSessionMenuHost(menu, 'session-1')
    expect(target).toMatchObject({
      menu,
      sessionId: 'session-1',
      buttonClassName: 'native-button',
      iconClassName: 'native-icon',
      labelClassName: 'native-label',
    })
    expect(menu.getAttribute(MENU_OWNER_ATTRIBUTE)).toBe('session-1')
    expect(target?.host.hasAttribute(MENU_HOST_ATTRIBUTE)).toBe(true)
    expect(target?.host.nextElementSibling?.textContent).toBe('Archive')
    expect(attachSessionMenuHost(menu, 'session-1')).toBeNull()
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
