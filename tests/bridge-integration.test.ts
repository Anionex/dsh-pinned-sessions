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
    const useSessions = <S,>(selector: (snapshot: typeof sessionSnapshot) => S): S => selector(sessionSnapshot)
    const useWorkspaces = <S,>(selector: (snapshot: typeof workspaceSnapshot) => S): S => selector(workspaceSnapshot)
    const t = (key: string): string => key === 'menu.pin' ? 'Pin session' : key

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
      root.render(createElement(PinnedSessionsBridge, { store, sessions, useSessions, useWorkspaces, t }))
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
})
