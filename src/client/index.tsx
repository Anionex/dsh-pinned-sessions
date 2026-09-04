import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  Button,
  IconArchiveOutline20,
  IconBranchOutline16,
  IconEditOutline16,
  IconEllipsisOutline16,
  IconTrashOutline16,
  Menu,
  Modal,
  Toast,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { Pin, PinOff } from 'lucide-react'
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

interface ResultLike {
  readonly ok: boolean
  readonly error?: { readonly message: string } | undefined
}

interface ClientSessionsLike extends SessionsForCapture {
  binding(sessionId: string): { readonly session: { rename(title: string): Promise<ResultLike> } } | undefined
  fork(input: { readonly sessionId: string; readonly increaseTitle: boolean }): Promise<string>
}

interface WorkspacesServiceLike {
  archiveSession(sessionId: string): Promise<void>
}

interface DeleteSessionServiceLike {
  deleteSession(sessionId: string): Promise<ResultLike>
}

interface BooleanStoreLike {
  readonly getSnapshot: () => boolean
  readonly subscribe: (listener: () => void) => () => void
}

class BooleanStore implements BooleanStoreLike {
  private value = false
  private readonly listeners = new Set<() => void>()

  readonly getSnapshot = (): boolean => this.value
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  set(value: boolean): void {
    if (value === this.value) return
    this.value = value
    for (const listener of this.listeners) listener()
  }
}

interface ClientContextLike {
  readonly slots: SlotsLike
  readonly sessions: ClientSessionsLike
  readonly locale: LocaleLike
  get(name: string): unknown
  inject(dependencies: readonly string[], setup: (ctx: ClientContextLike) => void): unknown
  effect(setup: () => (() => void), label?: string): unknown
}

export interface PinnedSessionActions {
  readonly renameSession: (sessionId: string, title: string) => Promise<void>
  readonly forkSession: (sessionId: string) => Promise<void>
  readonly archiveSession: (sessionId: string) => Promise<void>
  readonly deleteAvailability: BooleanStoreLike
  readonly deleteSession: (sessionId: string) => Promise<void>
}

interface BridgeProps {
  readonly store: PinStore
  readonly sessions: SessionsForCapture
  readonly actions: PinnedSessionActions
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

interface PendingFocusRemoval {
  readonly sessionId: string
  readonly index: number
}

const NS = 'pinnedSessions'
const STYLE_ID = '@anionex/dsh-pinned-sessions'
const MENU_ASSOCIATION_MS = 2_000

const zh = {
  'menu.rename': '重命名',
  'menu.fork': '分叉会话',
  'menu.pin': '置顶会话',
  'menu.unpin': '取消置顶',
  'menu.archive': '归档会话',
  'menu.delete': '删除会话',
  'section.label': '置顶会话',
  'session.open': '打开置顶会话“{name}”',
  'session.actions': '置顶会话“{name}”的操作',
  'session.archiveFailed': '归档会话失败：{detail}',
  'session.forkFailed': '分叉会话失败：{detail}',
  'session.unpin': '取消置顶“{name}”',
  'dialog.close': '关闭',
  'dialog.cancel': '取消',
  'rename.title': '重命名会话',
  'rename.field': '会话名称',
  'rename.confirm': '重命名',
  'delete.title': '删除会话',
  'delete.description': '将永久删除会话“{name}”及其子代理（含正在运行的）和全部记录（对话内容、统计、缓存），此操作不可恢复。',
  'delete.pending': '正在删除会话…',
  'workspace.ungrouped': '未分组',
}

const en = {
  'menu.rename': 'Rename',
  'menu.fork': 'Fork session',
  'menu.pin': 'Pin session',
  'menu.unpin': 'Unpin session',
  'menu.archive': 'Archive session',
  'menu.delete': 'Delete session',
  'section.label': 'Pinned sessions',
  'session.open': 'Open pinned session “{name}”',
  'session.actions': 'Actions for pinned session “{name}”',
  'session.archiveFailed': 'Could not archive session: {detail}',
  'session.forkFailed': 'Could not fork session: {detail}',
  'session.unpin': 'Unpin “{name}”',
  'dialog.close': 'Close',
  'dialog.cancel': 'Cancel',
  'rename.title': 'Rename session',
  'rename.field': 'Session name',
  'rename.confirm': 'Rename',
  'delete.title': 'Delete session',
  'delete.description': 'This permanently deletes session “{name}”, its child agents (including any that are still running), and all of its records (conversation, stats, cache). This cannot be undone.',
  'delete.pending': 'Deleting session…',
  'workspace.ungrouped': 'Ungrouped',
}

const styles = `
[${'data-dsh-pinned-sessions-host'}]{box-sizing:border-box;min-width:0;flex:none}
.dsh-pins-section{box-sizing:border-box;min-width:0;margin:0 4px 6px;padding:0 0 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-pins-header{display:flex;align-items:center;gap:6px;height:28px;padding:0 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-weight:500}
.dsh-pins-header svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-list{box-sizing:border-box;max-height:192px;min-width:0;margin:0;padding:0;overflow-y:auto;overscroll-behavior:contain;list-style:none}
.dsh-pins-row{box-sizing:border-box;display:flex;align-items:center;gap:0;height:32px;min-width:0;border-radius:6px;color:var(--dsw-alias-label-primary)}
.dsh-pins-row:hover,.dsh-pins-row[data-current="true"],.dsh-pins-row[data-menu-open="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-pins-open{box-sizing:border-box;display:flex;align-items:center;gap:6px;min-width:0;height:32px;padding:0 4px 0 8px;border:0;background:transparent;color:inherit;cursor:pointer;flex:1;text-align:left}
.dsh-pins-open:focus-visible,.dsh-pins-actions:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-pins-open>svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;flex:1}
.dsh-pins-workspace{max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;flex:none}
.dsh-pins-actions{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin-right:3px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;pointer-events:none;flex:none}
.dsh-pins-row:hover .dsh-pins-actions,.dsh-pins-row:focus-within .dsh-pins-actions,.dsh-pins-row[data-menu-open="true"] .dsh-pins-actions{opacity:1;pointer-events:auto}
.dsh-pins-actions:hover,.dsh-pins-row[data-menu-open="true"] .dsh-pins-actions{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-pins-action-menu{display:inline-flex;flex:none}
.dsh-pins-rename-input{box-sizing:border-box;width:100%;height:36px;padding:0 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;outline:0;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit}
.dsh-pins-rename-input:focus{border-color:var(--dsw-alias-state-business-primary)}
.dsh-pins-dialog-error{margin-top:8px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.dsh-pins-dialog-status{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-pins-delete-action{color:var(--dsw-alias-state-error-primary)!important;border-color:var(--dsw-alias-state-error-primary)!important}
@media (max-width:767px){.dsh-pins-workspace{display:none}}
@media (hover:none),(max-width:767px){.dsh-pins-actions{opacity:1;pointer-events:auto}}
`

export const inject = ['slots', 'sessions', 'workspaces', 'locale']

function deleteSessionService(ctx: ClientContextLike): DeleteSessionServiceLike | null {
  try {
    const service = ctx.get('remote.workspaceRegistry') as Partial<DeleteSessionServiceLike> | undefined
    return typeof service?.deleteSession === 'function' ? service as DeleteSessionServiceLike : null
  } catch {
    return null
  }
}

function makePinnedSessionActions(ctx: ClientContextLike, deleteAvailability: BooleanStoreLike): PinnedSessionActions {
  const workspaces = ctx.get('workspaces') as WorkspacesServiceLike
  return {
    renameSession: async (sessionId, title) => {
      const session = ctx.sessions.binding(sessionId)?.session
      if (session === undefined) throw new Error(`unknown session "${sessionId}"`)
      const result = await session.rename(title)
      if (!result.ok) throw new Error(result.error?.message ?? 'Session rename failed')
    },
    forkSession: async sessionId => {
      const childId = await ctx.sessions.fork({ sessionId, increaseTitle: true })
      ctx.sessions.open(childId)
    },
    archiveSession: async sessionId => { await workspaces.archiveSession(sessionId) },
    deleteAvailability,
    deleteSession: async sessionId => {
      const service = deleteSessionService(ctx)
      if (service === null) throw new Error('Session deletion is unavailable')
      const result = await service.deleteSession(sessionId)
      if (!result.ok) throw new Error(result.error?.message ?? 'Session deletion failed')
    },
  }
}

/** Register the lifecycle bridge in the additive frame overlay slot. */
export function apply(ctx: ClientContextLike): void {
  let storage: Storage | undefined
  try {
    storage = window.localStorage
  } catch {
    storage = undefined
  }
  const store = new PinStore(storage)
  const deleteAvailability = new BooleanStore()
  const actions = makePinnedSessionActions(ctx, deleteAvailability)

  ctx.inject(['remote.workspaceRegistry'], serviceCtx => {
    const available = deleteSessionService(serviceCtx) !== null
    deleteAvailability.set(available)
    serviceCtx.effect(() => () => { deleteAvailability.set(false) }, 'pinned-sessions: delete capability')
  })

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
    inject: () => ({ store, sessions: ctx.sessions, actions }),
  }, PinnedSessionsBridge))
}

/** Keep native behavior intact while mounting the sidebar portal and unmanaged menu item. */
export function PinnedSessionsBridge({ store, sessions, actions, useSessions, useWorkspaces, t }: BridgeProps): ReactNode {
  const sessionSnapshot = useSessions(snapshot => snapshot)
  const workspaceSnapshot = useWorkspaces(snapshot => snapshot)
  const pins = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const [sidebarHost, setSidebarHost] = useState<HTMLDivElement | null>(null)
  const [sidebarWide, setSidebarWide] = useState(true)
  const pending = useRef<PendingMenuRequest | null>(null)
  const activeMenu = useRef<ActiveMenuBinding | null>(null)
  const focusAfterRemoval = useRef<PendingFocusRemoval | null>(null)

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
    const pendingRemoval = focusAfterRemoval.current
    if (pendingRemoval === null || rows.some(row => row.session.id === pendingRemoval.sessionId)) return
    focusAfterRemoval.current = null
    focusAfterPinnedRemoval(document, sidebarHost, pendingRemoval.index)
  }, [rows, sidebarHost])

  return sidebarHost !== null && sidebarHost.isConnected && sidebarWide && rows.length > 0
    ? createPortal(
        <PinnedSessionSection
          actions={actions}
          cancelRemoval={sessionId => {
            if (focusAfterRemoval.current?.sessionId === sessionId) focusAfterRemoval.current = null
          }}
          currentId={sessionSnapshot.current}
          rows={rows}
          open={sessionId => { sessions.open(sessionId) }}
          prepareRemoval={(sessionId, index) => {
            focusAfterRemoval.current = { sessionId, index }
          }}
          unpin={(sessionId, index) => {
            focusAfterRemoval.current = { sessionId, index }
            store.toggle(sessionId)
          }}
          t={t}
        />,
        sidebarHost,
      )
    : null
}

interface PinnedSessionSectionProps {
  readonly actions: PinnedSessionActions
  readonly cancelRemoval: (sessionId: string) => void
  readonly currentId?: string | undefined
  readonly rows: readonly { readonly session: SessionSummaryLike; readonly title: string; readonly workspace: string }[]
  readonly open: (sessionId: string) => void
  readonly prepareRemoval: (sessionId: string, index: number) => void
  readonly unpin: (sessionId: string, index: number) => void
  readonly t: Translate
}

function PinnedSessionSection({ actions, cancelRemoval, currentId, rows, open, prepareRemoval, unpin, t }: PinnedSessionSectionProps): ReactNode {
  return <section className="dsh-pins-section" aria-label={t('section.label')}>
    <div className="dsh-pins-header">
      <PinIcon size={13} />
      <span>{t('section.label')}</span>
    </div>
    <ul className="dsh-pins-list">
      {rows.map(({ session, title, workspace }, index) => <PinnedSessionRow
        actions={actions}
        cancelRemoval={cancelRemoval}
        current={session.id === currentId}
        index={index}
        key={session.id}
        open={open}
        prepareRemoval={prepareRemoval}
        session={session}
        t={t}
        title={title}
        unpin={unpin}
        workspace={workspace}
      />)}
    </ul>
  </section>
}

interface PinnedSessionRowProps {
  readonly actions: PinnedSessionActions
  readonly cancelRemoval: (sessionId: string) => void
  readonly current: boolean
  readonly index: number
  readonly open: (sessionId: string) => void
  readonly prepareRemoval: (sessionId: string, index: number) => void
  readonly session: SessionSummaryLike
  readonly t: Translate
  readonly title: string
  readonly unpin: (sessionId: string, index: number) => void
  readonly workspace: string
}

function PinnedSessionRow({ actions, cancelRemoval, current, index, open, prepareRemoval, session, t, title, unpin, workspace }: PinnedSessionRowProps): ReactNode {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [actionToast, setActionToast] = useState<{ readonly text: string; readonly seq: number } | null>(null)
  const toastSeq = useRef(0)
  const composing = useRef(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const menusBeforeOpen = useRef<ReadonlySet<HTMLElement>>(new Set())
  const focusMenuEdge = useRef<'first' | 'last' | null>(null)
  const actionLabel = t('session.actions', { name: title })
  const renameTrimmed = renameDraft.trim()
  const renameBlocked = renaming || renameTrimmed === ''
  const canDelete = useSyncExternalStore(
    actions.deleteAvailability.subscribe,
    actions.deleteAvailability.getSnapshot,
    actions.deleteAvailability.getSnapshot,
  )
  const showDesktopActionError = (key: string, reason: unknown): void => {
    if (!canDelete) return
    toastSeq.current += 1
    setActionToast({
      text: t(key, { detail: reason instanceof Error ? reason.message : String(reason) }),
      seq: toastSeq.current,
    })
  }

  const restoreTriggerFocus = (): void => {
    queueMicrotask(() => { trigger.current?.focus({ preventScroll: true }) })
  }
  const openActionMenu = (focusEdge: 'first' | 'last' | null): void => {
    menusBeforeOpen.current = new Set(document.querySelectorAll<HTMLElement>('[role="menu"]'))
    focusMenuEdge.current = focusEdge
    setMenuOpen(true)
  }

  useLayoutEffect(() => {
    if (!menuOpen) return
    let menu: HTMLElement | undefined
    let observer: MutationObserver | undefined
    let disposed = false
    const items = (): HTMLButtonElement[] => menu === undefined
      ? []
      : [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')]
    const onMenuKeyDown = (event: KeyboardEvent): void => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const available = items()
      if (available.length === 0) return
      const currentIndex = available.indexOf(document.activeElement as HTMLButtonElement)
      let nextIndex: number
      if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = available.length - 1
      else if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % available.length
      else nextIndex = currentIndex <= 0 ? available.length - 1 : currentIndex - 1
      event.preventDefault()
      available[nextIndex]?.focus({ preventScroll: true })
    }
    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') restoreTriggerFocus()
    }
    const install = (): void => {
      if (disposed) return
      menu = [...document.querySelectorAll<HTMLElement>('[role="menu"]')]
        .find(candidate => !menusBeforeOpen.current.has(candidate))
      if (menu === undefined) return
      observer?.disconnect()
      menu.addEventListener('keydown', onMenuKeyDown)
      const edge = focusMenuEdge.current
      focusMenuEdge.current = null
      if (edge === null) return
      const available = items()
      const target = edge === 'first' ? available[0] : available.at(-1)
      queueMicrotask(() => {
        if (!disposed && target?.isConnected === true) target.focus({ preventScroll: true })
      })
    }
    document.addEventListener('keydown', onDocumentKeyDown, true)
    install()
    if (menu === undefined) {
      observer = new MutationObserver(install)
      observer.observe(document.body, { childList: true, subtree: true })
      install()
    }
    return () => {
      disposed = true
      observer?.disconnect()
      menu?.removeEventListener('keydown', onMenuKeyDown)
      document.removeEventListener('keydown', onDocumentKeyDown, true)
    }
  }, [menuOpen])

  const menuItems: MenuEntry[] = [
    { id: 'rename', label: t('menu.rename'), icon: <IconEditOutline16 /> },
    { id: 'fork', label: t('menu.fork'), icon: <IconBranchOutline16 /> },
    { id: 'unpin', label: t('menu.unpin'), icon: <PinOff size={16} strokeWidth={1.8} aria-hidden="true" /> },
    { id: 'archive', label: t('menu.archive'), icon: <IconArchiveOutline20 size={16} /> },
    ...(canDelete ? [{ id: 'delete', label: t('menu.delete'), icon: <IconTrashOutline16 />, danger: true }] : []),
  ]

  const closeRename = (): void => {
    if (renaming) return
    setRenameOpen(false)
    setRenameError(null)
    restoreTriggerFocus()
  }
  const confirmRename = (): void => {
    if (renameBlocked) return
    setRenaming(true)
    setRenameError(null)
    void actions.renameSession(session.id, renameTrimmed).then(() => {
      setRenaming(false)
      setRenameOpen(false)
      restoreTriggerFocus()
    }).catch(reason => {
      setRenaming(false)
      setRenameError(reason instanceof Error ? reason.message : String(reason))
    })
  }
  const closeDelete = (): void => {
    if (deleting) return
    setDeleteOpen(false)
    setDeleteError(null)
    restoreTriggerFocus()
  }
  const confirmDelete = (): void => {
    if (deleting) return
    prepareRemoval(session.id, index)
    setDeleting(true)
    setDeleteError(null)
    void actions.deleteSession(session.id).then(() => {
      setDeleting(false)
      setDeleteOpen(false)
      restoreTriggerFocus()
    }).catch(reason => {
      cancelRemoval(session.id)
      setDeleting(false)
      setDeleteError(reason instanceof Error ? reason.message : String(reason))
    })
  }
  const onSelect = (id: string): void => {
    setMenuOpen(false)
    if (id === 'rename') {
      setRenameDraft(session.title ?? title)
      setRenameError(null)
      setRenameOpen(true)
    }
    if (id === 'fork') {
      restoreTriggerFocus()
      void actions.forkSession(session.id).catch(reason => {
        showDesktopActionError('session.forkFailed', reason)
      })
    }
    if (id === 'unpin') unpin(session.id, index)
    if (id === 'archive') {
      prepareRemoval(session.id, index)
      restoreTriggerFocus()
      void actions.archiveSession(session.id).catch(reason => {
        cancelRemoval(session.id)
        restoreTriggerFocus()
        showDesktopActionError('session.archiveFailed', reason)
        if (!canDelete) console.warn('session archive rejected:', reason)
      })
    }
    if (id === 'delete' && canDelete) {
      setDeleteError(null)
      setDeleteOpen(true)
    }
  }

  return <>
    <li
      className="dsh-pins-row"
      data-current={current ? 'true' : 'false'}
      data-menu-open={menuOpen ? 'true' : undefined}
    >
      <button
        type="button"
        className="dsh-pins-open"
        aria-current={current ? 'page' : undefined}
        aria-label={t('session.open', { name: title })}
        onClick={() => { open(session.id) }}
      >
        <PinIcon size={13} />
        <span className="dsh-pins-title">{title}</span>
        <span className="dsh-pins-workspace">{workspace}</span>
      </button>
      <Menu
        className="dsh-pins-action-menu"
        open={menuOpen}
        onClose={() => { setMenuOpen(false) }}
        items={menuItems}
        onSelect={onSelect}
        portal
        closeOnPointerLeave
        anchor={<button
          ref={trigger}
          type="button"
          className="dsh-pins-actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={actionLabel}
          title={actionLabel}
          onClick={event => {
            event.stopPropagation()
            if (menuOpen) setMenuOpen(false)
            else openActionMenu(null)
          }}
          onKeyDown={event => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            openActionMenu(event.key === 'ArrowDown' ? 'first' : 'last')
          }}
        >
          <IconEllipsisOutline16 />
        </button>}
      />
    </li>
    <Modal
      open={renameOpen}
      onClose={closeRename}
      closeLabel={t('dialog.close')}
      title={t('rename.title')}
      footer={<>
        <Button variant="outline" disabled={renaming} onClick={closeRename}>{t('dialog.cancel')}</Button>
        <Button variant="primary" disabled={renameBlocked} onClick={confirmRename}>{t('rename.confirm')}</Button>
      </>}
    >
      <input
        className="dsh-pins-rename-input"
        value={renameDraft}
        aria-label={t('rename.field')}
        autoFocus
        disabled={renaming}
        onFocus={event => { event.currentTarget.select() }}
        onChange={event => {
          setRenameDraft(event.currentTarget.value)
          setRenameError(null)
        }}
        onCompositionStart={() => { composing.current = true }}
        onCompositionEnd={() => { composing.current = false }}
        onKeyDown={event => {
          if (event.key !== 'Enter' || composing.current) return
          event.preventDefault()
          confirmRename()
        }}
      />
      {renameError !== null && <div className="dsh-pins-dialog-error" role="alert">{renameError}</div>}
    </Modal>
    <Modal
      open={deleteOpen}
      onClose={closeDelete}
      closeLabel={t('dialog.close')}
      title={t('delete.title')}
      description={t('delete.description', { name: title })}
      footer={<>
        <Button variant="outline" autoFocus disabled={deleting} onClick={closeDelete}>{t('dialog.cancel')}</Button>
        <Button variant="outline" className="dsh-pins-delete-action" disabled={deleting} onClick={confirmDelete}>{t('delete.title')}</Button>
      </>}
    >
      {deleting && <div className="dsh-pins-dialog-status" role="status">{t('delete.pending')}</div>}
      {deleteError !== null && <div className="dsh-pins-dialog-error" role="alert">{deleteError}</div>}
    </Modal>
    {actionToast !== null && <Toast
      key={actionToast.seq}
      text={actionToast.text}
      onDone={() => { setActionToast(null) }}
    />}
  </>
}

function PinIcon({ size = 16 }: PinIconProps): ReactNode {
  return <Pin size={size} strokeWidth={1.8} aria-hidden="true" />
}
