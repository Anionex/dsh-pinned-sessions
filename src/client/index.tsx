import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { Pin, PinOff, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import {
  attachSessionMenuHost,
  captureSessionId,
  ensurePinnedHost,
  findSessionActionTarget,
  findUnclaimedPortalMenu,
  removeBridgeArtifacts,
  type MenuPortalTarget,
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
  readonly crossed?: boolean
  readonly size?: number
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

/** Keep native sidebar behavior intact while portalling the two added surfaces. */
export function PinnedSessionsBridge({ store, sessions, useSessions, useWorkspaces, t }: BridgeProps): ReactNode {
  const sessionSnapshot = useSessions(snapshot => snapshot)
  const workspaceSnapshot = useWorkspaces(snapshot => snapshot)
  const pins = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const [sidebarHost, setSidebarHost] = useState<HTMLDivElement | null>(null)
  const [sidebarWide, setSidebarWide] = useState(true)
  const [menuTarget, setMenuTarget] = useState<MenuPortalTarget | null>(null)
  const pending = useRef<{ readonly sessionId: string; readonly createdAt: number } | null>(null)

  useLayoutEffect(() => {
    let active = true
    let queued = false
    let settleTimer: number | undefined
    const refresh = (): void => {
      if (!active) return
      const nextHost = ensurePinnedHost(document)
      setSidebarHost(current => current === nextHost ? current : nextHost)
      const rootWidth = nextHost?.parentElement?.getBoundingClientRect().width
      if (rootWidth !== undefined) setSidebarWide(rootWidth >= 160)
      setMenuTarget(current => {
        if (current === null || (current.host.isConnected && current.menu.isConnected)) return current
        current?.menu.removeAttribute('data-dsh-pinned-session-menu')
        return null
      })
      const request = pending.current
      if (request === null) return
      if (Date.now() - request.createdAt > MENU_ASSOCIATION_MS) {
        pending.current = null
        return
      }
      const menu = findUnclaimedPortalMenu(document)
      if (menu === null) return
      const target = attachSessionMenuHost(menu, request.sessionId)
      if (target === null) return
      pending.current = null
      setMenuTarget(target)
    }
    const queueRefresh = (): void => {
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
      const target = findSessionActionTarget(event.target)
      if (target === null) return
      const sessionId = captureSessionId(target.row, sessions)
      if (sessionId === null) return
      pending.current = { sessionId, createdAt: Date.now() }
      queueRefresh()
    }

    refresh()
    document.addEventListener('click', onClickCapture, true)
    const observer = new MutationObserver(queueRefresh)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true,
    })
    return () => {
      active = false
      if (settleTimer !== undefined) window.clearTimeout(settleTimer)
      observer.disconnect()
      document.removeEventListener('click', onClickCapture, true)
      removeBridgeArtifacts(document)
    }
  }, [sessions])

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

  const dismissMenu = (): void => {
    const target = menuTarget
    setMenuTarget(null)
    target?.host.remove()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }

  return <>
    {sidebarHost !== null && sidebarHost.isConnected && sidebarWide && rows.length > 0 && createPortal(
      <PinnedSessionSection
        currentId={sessionSnapshot.current}
        rows={rows}
        open={sessionId => { sessions.open(sessionId) }}
        unpin={sessionId => { store.toggle(sessionId) }}
        t={t}
      />,
      sidebarHost,
    )}
    {menuTarget !== null && menuTarget.host.isConnected && createPortal(
      <SessionPinMenuItem
        target={menuTarget}
        pinned={store.isPinned(menuTarget.sessionId)}
        toggle={() => {
          store.toggle(menuTarget.sessionId)
          dismissMenu()
        }}
        t={t}
      />,
      menuTarget.host,
    )}
  </>
}

interface PinnedSessionSectionProps {
  readonly currentId?: string | undefined
  readonly rows: readonly { readonly session: SessionSummaryLike; readonly title: string; readonly workspace: string }[]
  readonly open: (sessionId: string) => void
  readonly unpin: (sessionId: string) => void
  readonly t: Translate
}

function PinnedSessionSection({ currentId, rows, open, unpin, t }: PinnedSessionSectionProps): ReactNode {
  return <section className="dsh-pins-section" aria-label={t('section.label')}>
    <div className="dsh-pins-header">
      <PinIcon size={13} />
      <span>{t('section.label')}</span>
    </div>
    <ul className="dsh-pins-list">
      {rows.map(({ session, title, workspace }) => <li
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
          onClick={() => { unpin(session.id) }}
        >
          <CloseIcon />
        </button>
      </li>)}
    </ul>
  </section>
}

interface SessionPinMenuItemProps {
  readonly target: MenuPortalTarget
  readonly pinned: boolean
  readonly toggle: () => void
  readonly t: Translate
}

function SessionPinMenuItem({ target, pinned, toggle, t }: SessionPinMenuItemProps): ReactNode {
  const label = t(pinned ? 'menu.unpin' : 'menu.pin')
  return <button
    type="button"
    role="menuitem"
    className={`${target.buttonClassName} dsh-pins-menu-button`}
    aria-label={label}
    onClick={toggle}
  >
    <span className={target.iconClassName} aria-hidden="true"><PinIcon crossed={pinned} /></span>
    <span className={target.labelClassName}>{label}</span>
  </button>
}

function PinIcon({ crossed = false, size = 16 }: PinIconProps): ReactNode {
  const Icon = crossed ? PinOff : Pin
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}

function CloseIcon(): ReactNode {
  return <X size={14} strokeWidth={2} aria-hidden="true" />
}
