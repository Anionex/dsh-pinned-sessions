import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { Pin, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import {
  attachSessionMenuHost,
  captureSessionId,
  ensurePinnedHost,
  findSessionActionTarget,
  findUnclaimedPortalMenu,
  focusAfterPinnedRemoval,
  listPortalMenus,
  MENU_OWNER_ATTRIBUTE,
  removeBridgeArtifacts,
  SIDEBAR_SLOT_SELECTOR,
  updateSessionMenuItem,
  type SessionMenuTarget,
  type TriggerRect,
  type SessionsForCapture,
} from './dom-bridge.js'
import { PIN_STORAGE_KEY, PinStore } from './pin-store.js'
import { sessionDisplayTitle } from './presentation.js'

interface SessionSummaryLike {
  readonly id: string
  readonly title?: string | undefined
  readonly cwd?: string | undefined
  readonly blank?: boolean | undefined
  readonly running?: boolean | undefined
  readonly completed?: boolean | undefined
}

interface SessionsSnapshotLike {
  readonly ids: readonly string[]
  readonly byId: Readonly<Record<string, SessionSummaryLike | undefined>>
  readonly current?: string | undefined
  readonly phase: string
}

interface WorkspaceLike {
  readonly workspaceId: string
  readonly title: string
  readonly sessionIds: readonly string[]
}

interface WorkspacesSnapshotLike {
  readonly items: readonly WorkspaceLike[]
  readonly archivedSessionIds: readonly string[]
  readonly phase: string
}

type SelectorHook<T> = <S>(selector: (snapshot: T) => S, equal?: (left: S, right: S) => boolean) => S
type Translate = (key: string, params?: Readonly<Record<string, unknown>>) => string

interface SlotsLike {
  inject(name: string, install: () => unknown): void
  register<I, P>(
    entry: {
      readonly name: string
      readonly id: string
      readonly order?: number
      readonly locale?: string
      readonly inject?: () => I
    },
    component: (props: P) => ReactNode,
  ): () => void
}

interface LocaleLike {
  register(namespace: string, dictionaries: Readonly<Record<string, Readonly<Record<string, string>>>>): () => void
}

interface ClientContextLike {
  readonly slots: SlotsLike
  readonly sessions: SessionsForCapture
  readonly locale: LocaleLike
  effect(setup: () => (() => void), label?: string): unknown
}

interface BridgeProps {
  readonly store: PinStore
  readonly sessions: SessionsForCapture
  readonly useSessions: SelectorHook<SessionsSnapshotLike>
  readonly useWorkspaces: SelectorHook<WorkspacesSnapshotLike>
  readonly t: Translate
}

interface PinIconProps {
  readonly size?: number
}

interface PendingMenuRequest {
  readonly sessionId: string
  readonly createdAt: number
  readonly existingMenus: ReadonlySet<HTMLElement>
  readonly triggerRect: TriggerRect
}

interface ActiveMenuBinding {
  readonly target: SessionMenuTarget
  readonly onClick: (event: MouseEvent) => void
}

const NS = 'pinnedSessions'
const STYLE_ID = '@anionex/dsh-pinned-sessions'
const MENU_ASSOCIATION_MS = 2_000

const zh = {
  'menu.pin': '置顶会话',
  'menu.unpin': '取消置顶',
  'section.label': '置顶会话',
  'session.open': '打开置顶会话“{name}”',
  'session.unpin': '取消置顶“{name}”',
  'workspace.ungrouped': '未分组',
}

const en = {
  'menu.pin': 'Pin session',
  'menu.unpin': 'Unpin session',
  'section.label': 'Pinned sessions',
  'session.open': 'Open pinned session “{name}”',
  'session.unpin': 'Unpin “{name}”',
  'workspace.ungrouped': 'Ungrouped',
}

const styles = `
[${'data-dsh-pinned-sessions-host'}]{box-sizing:border-box;min-width:0;flex:none}
.dsh-pins-section{box-sizing:border-box;min-width:0;margin:0 4px 6px;padding:0 0 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-pins-header{display:flex;align-items:center;gap:6px;height:28px;padding:0 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-weight:500}
.dsh-pins-header svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-list{box-sizing:border-box;max-height:192px;min-width:0;margin:0;padding:0;overflow-y:auto;overscroll-behavior:contain;list-style:none}
.dsh-pins-row{box-sizing:border-box;display:flex;align-items:center;gap:0;height:32px;min-width:0;border-radius:6px;color:var(--dsw-alias-label-primary)}
.dsh-pins-row:hover,.dsh-pins-row[data-current="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-pins-open{box-sizing:border-box;display:flex;align-items:center;gap:6px;min-width:0;height:32px;padding:0 4px 0 8px;border:0;background:transparent;color:inherit;cursor:pointer;flex:1;text-align:left}
.dsh-pins-open:focus-visible,.dsh-pins-remove:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-pins-open>svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;flex:1}
.dsh-pins-workspace{max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;flex:none}
.dsh-pins-remove{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin-right:3px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;flex:none}
.dsh-pins-row:hover .dsh-pins-remove,.dsh-pins-remove:focus-visible{opacity:1}
.dsh-pins-remove:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-pins-menu-button{letter-spacing:0}
@media (max-width:767px){.dsh-pins-workspace{display:none}.dsh-pins-remove{opacity:1}}
`

export const inject = ['slots', 'sessions', 'locale']

/** Register the lifecycle bridge in the additive frame overlay slot. */
export function apply(ctx: ClientContextLike): void {
  let storage: Storage | undefined
  try {
    storage = window.localStorage
  } catch {
    storage = undefined
  }
  const store = new PinStore(storage)

  ctx.effect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === PIN_STORAGE_KEY || event.key === null) store.reload()
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, 'pinned-sessions: cross-tab state')

  ctx.effect(() => {
    if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {}
    const tag = document.createElement('style')
    tag.dataset.plugin = '@anionex/dsh-pinned-sessions'
    tag.dataset.pluginCss = STYLE_ID
    tag.textContent = styles
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'pinned-sessions: styles')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'pinned-sessions: dictionaries')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'pinned-sessions-bridge',
    order: 40,
    locale: NS,
    inject: () => ({ store, sessions: ctx.sessions }),
  }, PinnedSessionsBridge))
}

/** Keep native behavior intact while mounting the sidebar portal and unmanaged menu item. */
export function PinnedSessionsBridge({ store, sessions, useSessions, useWorkspaces, t }: BridgeProps): ReactNode {
  const sessionSnapshot = useSessions(snapshot => snapshot)
  const workspaceSnapshot = useWorkspaces(snapshot => snapshot)
  const pins = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const [sidebarHost, setSidebarHost] = useState<HTMLDivElement | null>(null)
  const [sidebarWide, setSidebarWide] = useState(true)
  const pending = useRef<PendingMenuRequest | null>(null)
  const activeMenu = useRef<ActiveMenuBinding | null>(null)
  const focusAfterUnpin = useRef<number | null>(null)

  useLayoutEffect(() => {
    let active = true
    let queued = false
    let settleTimer: number | undefined
    let observedSidebar: Element | null = null
    const sidebarObserver = new MutationObserver(() => { queueRefresh() })

    const disposeActiveMenu = (): void => {
      const binding = activeMenu.current
      if (binding === null) return
      activeMenu.current = null
      binding.target.button.removeEventListener('click', binding.onClick)
      binding.target.host.remove()
      if (binding.target.menu.getAttribute(MENU_OWNER_ATTRIBUTE) === binding.target.sessionId) {
        binding.target.menu.removeAttribute(MENU_OWNER_ATTRIBUTE)
      }
    }
    const updateActiveMenu = (): void => {
      const binding = activeMenu.current
      if (binding === null) return
      const pinned = store.isPinned(binding.target.sessionId)
      updateSessionMenuItem(binding.target, pinned, t(pinned ? 'menu.unpin' : 'menu.pin'))
    }
    const observeSidebar = (): void => {
      const slot = document.querySelector(SIDEBAR_SLOT_SELECTOR)
      if (slot === observedSidebar) return
      sidebarObserver.disconnect()
      observedSidebar = slot
      if (slot !== null) {
        sidebarObserver.observe(slot, {
          attributes: true,
          attributeFilter: ['class', 'style'],
          childList: true,
          subtree: true,
        })
      }
    }
    const refresh = (): void => {
      if (!active) return
      const nextHost = ensurePinnedHost(document)
      setSidebarHost(current => current === nextHost ? current : nextHost)
      observeSidebar()
      const rootWidth = nextHost?.parentElement?.getBoundingClientRect().width
      if (rootWidth !== undefined) setSidebarWide(rootWidth >= 160)

      const binding = activeMenu.current
      if (binding !== null && (!binding.target.host.isConnected || !binding.target.menu.isConnected)) {
        disposeActiveMenu()
      }
      const request = pending.current
      if (request === null) return
      if (Date.now() - request.createdAt > MENU_ASSOCIATION_MS) {
        pending.current = null
        return
      }
      const menu = findUnclaimedPortalMenu(document, request.existingMenus, request.triggerRect)
      if (menu === null) return
      const target = attachSessionMenuHost(menu, request.sessionId)
      if (target === null) return
      const onClick = (event: MouseEvent): void => {
        event.preventDefault()
        event.stopPropagation()
        store.toggle(target.sessionId)
        disposeActiveMenu()
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }
      target.button.addEventListener('click', onClick)
      activeMenu.current = { target, onClick }
      pending.current = null
      updateActiveMenu()
    }
    function queueRefresh(): void {
      if (!active) return
      if (settleTimer === undefined) {
        settleTimer = window.setTimeout(() => {
          settleTimer = undefined
          refresh()
        }, 250)
      }
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        refresh()
      })
    }
    const onClickCapture = (event: MouseEvent): void => {
      pending.current = null
      const target = findSessionActionTarget(event.target)
      if (target === null) return
      const sessionId = captureSessionId(target.row, sessions)
      if (sessionId === null) return
      const rect = target.button.getBoundingClientRect()
      pending.current = {
        sessionId,
        createdAt: Date.now(),
        existingMenus: new Set(listPortalMenus(document)),
        triggerRect: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      }
      queueRefresh()
    }
    const onKeyDownCapture = (): void => { pending.current = null }

    refresh()
    document.addEventListener('click', onClickCapture, true)
    document.addEventListener('keydown', onKeyDownCapture, true)
    const bodyObserver = new MutationObserver(() => { queueRefresh() })
    bodyObserver.observe(document.body, { childList: true })
    const unsubscribe = store.subscribe(updateActiveMenu)
    return () => {
      active = false
      pending.current = null
      if (settleTimer !== undefined) window.clearTimeout(settleTimer)
      unsubscribe()
      bodyObserver.disconnect()
      sidebarObserver.disconnect()
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('keydown', onKeyDownCapture, true)
      disposeActiveMenu()
      removeBridgeArtifacts(document)
    }
  }, [sessions, store, t])

  useLayoutEffect(() => {
    if (sidebarHost === null) return
    const root = sidebarHost.parentElement
    if (root === null) return
    const update = (): void => { setSidebarWide(root.getBoundingClientRect().width >= 160) }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => { observer.disconnect() }
  }, [sidebarHost])

  useEffect(() => {
    if (sessionSnapshot.phase !== 'ready' || workspaceSnapshot.phase !== 'ready') return
    const valid = new Set(sessionSnapshot.ids)
    const archived = new Set(workspaceSnapshot.archivedSessionIds)
    store.prune(sessionId => valid.has(sessionId) && !archived.has(sessionId))
  }, [sessionSnapshot, store, workspaceSnapshot])

  const rows = useMemo(() => {
    const workspaceBySession = new Map<string, string>()
    for (const workspace of workspaceSnapshot.items) {
      for (const sessionId of workspace.sessionIds) {
        if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title)
      }
    }
    return pins.flatMap(pin => {
      const session = sessionSnapshot.byId[pin.id]
      if (session === undefined || session.blank === true) return []
      const workspaceTitle = workspaceBySession.get(pin.id)
      const workspace = workspaceTitle ?? t('workspace.ungrouped')
      return [{ session, title: sessionDisplayTitle(session, workspaceTitle), workspace }]
    })
  }, [pins, sessionSnapshot.byId, t, workspaceSnapshot.items])

  useLayoutEffect(() => {
    const removedIndex = focusAfterUnpin.current
    if (removedIndex === null) return
    focusAfterUnpin.current = null
    focusAfterPinnedRemoval(document, sidebarHost, removedIndex)
  }, [rows, sidebarHost])

  return sidebarHost !== null && sidebarHost.isConnected && sidebarWide && rows.length > 0
    ? createPortal(
        <PinnedSessionSection
          currentId={sessionSnapshot.current}
          rows={rows}
          open={sessionId => { sessions.open(sessionId) }}
          unpin={(sessionId, index) => {
            focusAfterUnpin.current = index
            store.toggle(sessionId)
          }}
          t={t}
        />,
        sidebarHost,
      )
    : null
}

interface PinnedSessionSectionProps {
  readonly currentId?: string | undefined
  readonly rows: readonly { readonly session: SessionSummaryLike; readonly title: string; readonly workspace: string }[]
  readonly open: (sessionId: string) => void
  readonly unpin: (sessionId: string, index: number) => void
  readonly t: Translate
}

function PinnedSessionSection({ currentId, rows, open, unpin, t }: PinnedSessionSectionProps): ReactNode {
  return <section className="dsh-pins-section" aria-label={t('section.label')}>
    <div className="dsh-pins-header">
      <PinIcon size={13} />
      <span>{t('section.label')}</span>
    </div>
    <ul className="dsh-pins-list">
      {rows.map(({ session, title, workspace }, index) => <li
        className="dsh-pins-row"
        data-current={session.id === currentId ? 'true' : 'false'}
        key={session.id}
      >
        <button
          type="button"
          className="dsh-pins-open"
          aria-current={session.id === currentId ? 'page' : undefined}
          aria-label={t('session.open', { name: title })}
          onClick={() => { open(session.id) }}
        >
          <PinIcon size={13} />
          <span className="dsh-pins-title">{title}</span>
          <span className="dsh-pins-workspace">{workspace}</span>
        </button>
        <button
          type="button"
          className="dsh-pins-remove"
          aria-label={t('session.unpin', { name: title })}
          title={t('session.unpin', { name: title })}
          onClick={() => { unpin(session.id, index) }}
        >
          <CloseIcon />
        </button>
      </li>)}
    </ul>
  </section>
}

function PinIcon({ size = 16 }: PinIconProps): ReactNode {
  return <Pin size={size} strokeWidth={1.8} aria-hidden="true" />
}

function CloseIcon(): ReactNode {
  return <X size={14} strokeWidth={2} aria-hidden="true" />
}
