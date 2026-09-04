export const SIDEBAR_SLOT_SELECTOR = '[data-slot="sidebar.workspaces"]'
export const PINNED_HOST_ATTRIBUTE = 'data-dsh-pinned-sessions-host'
export const MENU_HOST_ATTRIBUTE = 'data-dsh-pinned-session-menu-host'
export const MENU_OWNER_ATTRIBUTE = 'data-dsh-pinned-session-menu'

export interface SessionsForCapture {
  readonly list: {
    getSnapshot(): { readonly current?: string | undefined }
  }
  open(sessionId: string): void
}

export interface SessionActionTarget {
  readonly button: HTMLButtonElement
  readonly row: HTMLElement
}

export interface MenuPortalTarget {
  readonly host: HTMLDivElement
  readonly menu: HTMLElement
  readonly sessionId: string
  readonly buttonClassName: string
  readonly iconClassName: string
  readonly labelClassName: string
}

function elementFromTarget(target: EventTarget | null): Element | null {
  return target !== null && (target as Node).nodeType === 1 ? target as Element : null
}

/** Identify a native ellipsis trigger inside a real Session row. */
export function findSessionActionTarget(target: EventTarget | null): SessionActionTarget | null {
  const element = elementFromTarget(target)
  const button = element?.closest('button')
  if (!(button instanceof HTMLButtonElement)) return null
  const row = button.closest<HTMLElement>('[role="treeitem"][aria-selected]')
  if (row === null || row === button) return null
  if (row.closest(SIDEBAR_SLOT_SELECTOR) === null) return null
  if (row.closest(`[${PINNED_HOST_ATTRIBUTE}]`) !== null) return null
  return { button, row }
}

/**
 * Ask the native row closure for its Session ID without changing selection.
 * The Workspace browser's row callback calls sessions.open(node.id), so a
 * synchronous, verified interceptor captures the exact ID and is restored
 * before the user's original ellipsis click continues.
 */
export function captureSessionId(row: HTMLElement, sessions: SessionsForCapture): string | null {
  const current = sessions.list.getSnapshot().current
  if (row.getAttribute('aria-selected') === 'true') {
    return typeof current === 'string' && current.length > 0 ? current : null
  }

  const hadOwn = Object.prototype.hasOwnProperty.call(sessions, 'open')
  const ownDescriptor = hadOwn ? Object.getOwnPropertyDescriptor(sessions, 'open') : undefined
  const original = sessions.open
  let captured: string | null = null
  const interceptor = (sessionId: string): void => {
    if (typeof sessionId === 'string' && sessionId.length > 0) captured = sessionId
  }

  try {
    Object.defineProperty(sessions, 'open', {
      configurable: true,
      enumerable: ownDescriptor?.enumerable ?? false,
      writable: true,
      value: interceptor,
    })
    if (sessions.open !== interceptor) return null
    row.click()
  } catch {
    return null
  } finally {
    try {
      if (hadOwn && ownDescriptor !== undefined) Object.defineProperty(sessions, 'open', ownDescriptor)
      else delete (sessions as { open?: SessionsForCapture['open'] }).open
    } catch {
      try {
        Object.defineProperty(sessions, 'open', {
          configurable: true,
          writable: true,
          value: original,
        })
      } catch {
        // The verified patch path is configurable; this is a defensive fallback.
      }
    }
  }
  return captured
}

/** Insert the pinned region immediately after the native Workspace header. */
export function ensurePinnedHost(doc: Document): HTMLDivElement | null {
  const slot = doc.querySelector<HTMLElement>(SIDEBAR_SLOT_SELECTOR)
  const root = slot?.firstElementChild
  if (!(root instanceof HTMLElement)) return null
  const existing = root.querySelector<HTMLDivElement>(`:scope > [${PINNED_HOST_ATTRIBUTE}]`)
  if (existing !== null) return existing
  const header = root.firstElementChild
  if (header === null) return null
  const host = doc.createElement('div')
  host.setAttribute(PINNED_HOST_ATTRIBUTE, '')
  header.insertAdjacentElement('afterend', host)
  return host
}

/** Find the newest unclaimed native portal menu after a Session trigger click. */
export function findUnclaimedPortalMenu(doc: Document): HTMLElement | null {
  const menus = [...doc.body.children].filter((node): node is HTMLElement => (
    node instanceof HTMLElement
    && node.getAttribute('role') === 'menu'
    && !node.hasAttribute(MENU_OWNER_ATTRIBUTE)
  ))
  return menus.at(-1) ?? null
}

/** Add one host row to a native Session menu, before its destructive/archive tail. */
export function attachSessionMenuHost(menu: HTMLElement, sessionId: string): MenuPortalTarget | null {
  if (menu.hasAttribute(MENU_OWNER_ATTRIBUTE)) return null
  const viewport = [...menu.children].find((node): node is HTMLElement => (
    node instanceof HTMLElement && node.getAttribute('role') === 'presentation'
  ))
  if (viewport === undefined) return null
  const wrappers = [...viewport.children].filter((node): node is HTMLElement => (
    node instanceof HTMLElement
    && node.querySelector(':scope > button[role="menuitem"]') instanceof HTMLButtonElement
  ))
  if (wrappers.length < 3) return null
  const templateButton = wrappers[0]?.querySelector<HTMLButtonElement>(':scope > button[role="menuitem"]')
  if (templateButton === null || templateButton === undefined) return null
  const spans = [...templateButton.children].filter((node): node is HTMLSpanElement => node instanceof HTMLSpanElement)
  const host = menu.ownerDocument.createElement('div')
  host.className = wrappers[0]?.className ?? ''
  host.setAttribute(MENU_HOST_ATTRIBUTE, '')
  viewport.insertBefore(host, wrappers[2] ?? null)
  menu.setAttribute(MENU_OWNER_ATTRIBUTE, sessionId)
  return {
    host,
    menu,
    sessionId,
    buttonClassName: templateButton.className,
    iconClassName: spans[0]?.className ?? '',
    labelClassName: spans.at(-1)?.className ?? '',
  }
}

export function removeBridgeArtifacts(doc: Document): void {
  for (const node of doc.querySelectorAll(`[${PINNED_HOST_ATTRIBUTE}], [${MENU_HOST_ATTRIBUTE}]`)) node.remove()
  for (const menu of doc.querySelectorAll(`[${MENU_OWNER_ATTRIBUTE}]`)) menu.removeAttribute(MENU_OWNER_ATTRIBUTE)
}
