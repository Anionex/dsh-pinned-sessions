import { Pin as PinNode, PinOff as PinOffNode, type IconNode } from 'lucide'

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

export interface SessionMenuTarget {
  readonly host: HTMLDivElement
  readonly menu: HTMLElement
  readonly sessionId: string
  readonly button: HTMLButtonElement
  readonly icon: HTMLSpanElement
  readonly label: HTMLSpanElement
}

export interface TriggerRect {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
  readonly width: number
  readonly height: number
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

/** List direct-body portal menus so one trigger can exclude every pre-existing menu. */
export function listPortalMenus(doc: Document): readonly HTMLElement[] {
  return [...doc.body.children].filter((node): node is HTMLElement => (
    node instanceof HTMLElement && node.getAttribute('role') === 'menu'
  ))
}

function belongsToTrigger(menu: HTMLElement, trigger: TriggerRect | undefined): boolean {
  if (trigger === undefined || trigger.width === 0 || trigger.height === 0) return true
  const menuRect = menu.getBoundingClientRect()
  if (menuRect.width === 0 || menuRect.height === 0) return true
  const horizontalGap = Math.min(
    Math.abs(menuRect.left - trigger.left),
    Math.abs(menuRect.right - trigger.right),
  )
  const verticalGap = Math.max(
    0,
    menuRect.top - trigger.bottom,
    trigger.top - menuRect.bottom,
  )
  return horizontalGap <= 64 && verticalGap <= 32
}

/** Find only a new, geometrically associated portal menu after one trigger click. */
export function findUnclaimedPortalMenu(
  doc: Document,
  excluded: ReadonlySet<HTMLElement> = new Set(),
  trigger?: TriggerRect,
): HTMLElement | null {
  const menus = listPortalMenus(doc).filter(menu => (
    !excluded.has(menu)
    && !menu.hasAttribute(MENU_OWNER_ATTRIBUTE)
    && belongsToTrigger(menu, trigger)
  ))
  return menus.at(-1) ?? null
}

function createLucideIcon(doc: Document, node: IconNode, name: string): SVGSVGElement {
  const [, attributes, children = []] = node
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, String(value))
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('stroke-width', '1.8')
  svg.setAttribute('class', `lucide lucide-${name}`)
  svg.setAttribute('aria-hidden', 'true')
  for (const [tag, childAttributes] of children) {
    const child = doc.createElementNS('http://www.w3.org/2000/svg', tag)
    for (const [key, value] of Object.entries(childAttributes)) child.setAttribute(key, String(value))
    svg.appendChild(child)
  }
  return svg
}

/** Update the unmanaged item without moving it into the plugin's React tree. */
export function updateSessionMenuItem(target: SessionMenuTarget, pinned: boolean, label: string): void {
  target.button.setAttribute('aria-label', label)
  target.label.textContent = label
  target.icon.replaceChildren(createLucideIcon(
    target.menu.ownerDocument,
    pinned ? PinOffNode : PinNode,
    pinned ? 'pin-off' : 'pin',
  ))
}

/** Add an unmanaged native-styled row before the Session menu's archive tail. */
export function attachSessionMenuHost(menu: HTMLElement, sessionId: string): SessionMenuTarget | null {
  if (menu.hasAttribute(MENU_OWNER_ATTRIBUTE)) return null
  const viewport = [...menu.children].find((node): node is HTMLElement => (
    node instanceof HTMLElement && node.getAttribute('role') === 'presentation'
  ))
  if (viewport === undefined) return null
  const wrappers = [...viewport.children].filter((node): node is HTMLElement => (
    node instanceof HTMLElement
    && node.querySelector(':scope > button[role="menuitem"]') instanceof HTMLButtonElement
  ))
  if (wrappers.length < 3 || wrappers.length > 4) return null
  const templateButton = wrappers[0]?.querySelector<HTMLButtonElement>(':scope > button[role="menuitem"]')
  if (templateButton === null || templateButton === undefined) return null
  const spans = [...templateButton.children].filter((node): node is HTMLSpanElement => node instanceof HTMLSpanElement)
  if (spans.length < 2) return null

  const doc = menu.ownerDocument
  const host = doc.createElement('div')
  host.className = wrappers[0]?.className ?? ''
  host.setAttribute(MENU_HOST_ATTRIBUTE, '')
  const button = doc.createElement('button')
  button.type = 'button'
  button.setAttribute('role', 'menuitem')
  button.className = `${templateButton.className} dsh-pins-menu-button`
  const icon = doc.createElement('span')
  icon.className = spans[0]?.className ?? ''
  icon.setAttribute('aria-hidden', 'true')
  const label = doc.createElement('span')
  label.className = spans.at(-1)?.className ?? ''
  button.append(icon, label)
  host.appendChild(button)
  viewport.insertBefore(host, wrappers[2] ?? null)
  menu.setAttribute(MENU_OWNER_ATTRIBUTE, sessionId)

  const target = { host, menu, sessionId, button, icon, label }
  const view = doc.defaultView
  if (view !== null) view.dispatchEvent(new view.Event('resize'))
  return target
}

/** Restore useful keyboard focus after a pinned row removes itself. */
export function focusAfterPinnedRemoval(doc: Document, host: HTMLElement | null, removedIndex: number): boolean {
  const remaining = host === null ? [] : [...host.querySelectorAll<HTMLButtonElement>('.dsh-pins-open')]
  const next = remaining[Math.min(removedIndex, remaining.length - 1)]
  if (next !== undefined) {
    next.focus({ preventScroll: true })
    return true
  }
  const nativeRow = doc.querySelector<HTMLElement>(`${SIDEBAR_SLOT_SELECTOR} [role="treeitem"][aria-selected="true"]`)
    ?? doc.querySelector<HTMLElement>(`${SIDEBAR_SLOT_SELECTOR} [role="treeitem"]`)
  if (nativeRow === null) return false
  const hadTabIndex = nativeRow.hasAttribute('tabindex')
  if (!hadTabIndex) nativeRow.tabIndex = -1
  nativeRow.focus({ preventScroll: true })
  if (doc.activeElement === nativeRow) return true
  if (!hadTabIndex) nativeRow.removeAttribute('tabindex')
  return false
}

export function removeBridgeArtifacts(doc: Document): void {
  for (const node of doc.querySelectorAll(`[${PINNED_HOST_ATTRIBUTE}], [${MENU_HOST_ATTRIBUTE}]`)) node.remove()
  for (const menu of doc.querySelectorAll(`[${MENU_OWNER_ATTRIBUTE}]`)) menu.removeAttribute(MENU_OWNER_ATTRIBUTE)
}
