import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export interface MenuEntry {
  readonly id: string
  readonly label: ReactNode
  readonly icon?: ReactNode
  readonly danger?: boolean
}

export function Menu({
  open,
  anchor,
  items,
  onSelect,
  onClose,
  className,
}: {
  readonly open: boolean
  readonly anchor: ReactNode
  readonly items: readonly MenuEntry[]
  readonly onSelect: (id: string) => void
  readonly onClose: () => void
  readonly className?: string | undefined
  readonly portal?: boolean | undefined
  readonly closeOnPointerLeave?: boolean | undefined
}): ReactNode {
  const root = useRef<HTMLSpanElement | null>(null)
  const list = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Node)) return
      if (root.current?.contains(event.target) === true || list.current?.contains(event.target) === true) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  return <span ref={root} className={className}>
    {anchor}
    {open && createPortal(
      <div ref={list} role="menu">
        {items.map(item => <button key={item.id} type="button" role="menuitem" onClick={() => { onSelect(item.id) }}>
          {item.icon}
          <span>{item.label}</span>
        </button>)}
      </div>,
      document.body,
    )}
  </span>
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly closeLabel: string
  readonly title: string
  readonly description?: string | undefined
  readonly children?: ReactNode
  readonly footer?: ReactNode
}): ReactNode {
  if (!open) return null
  return createPortal(
    <div role="dialog" aria-label={title}>
      {description !== undefined && <p>{description}</p>}
      {children}
      {footer}
      <button type="button" onClick={onClose}>close</button>
    </div>,
    document.body,
  )
}

export function Toast({ text }: { readonly text: string; readonly onDone: () => void }): ReactNode {
  return createPortal(<div role="status">{text}</div>, document.body)
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { readonly variant?: string }): ReactNode {
  const { variant: _variant, ...buttonProps } = props
  return <button type="button" {...buttonProps} />
}

function TestIcon(): ReactNode {
  return <svg aria-hidden="true" />
}

export const IconArchiveOutline20 = TestIcon
export const IconBranchOutline16 = TestIcon
export const IconEditOutline16 = TestIcon
export const IconEllipsisOutline16 = TestIcon
export const IconTrashOutline16 = TestIcon
