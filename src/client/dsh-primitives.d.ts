declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ReactNode } from 'react'

  export interface MenuItem {
    readonly id: string
    readonly label: ReactNode
    readonly icon?: ReactNode
    readonly danger?: boolean
  }

  export type MenuEntry = MenuItem

  export function Menu(props: {
    readonly open: boolean
    readonly anchor: ReactNode
    readonly items: readonly MenuEntry[]
    readonly onSelect: (id: string) => void
    readonly onClose: () => void
    readonly portal?: boolean
    readonly closeOnPointerLeave?: boolean
    readonly className?: string
  }): ReactNode

  export function Modal(props: {
    readonly open: boolean
    readonly onClose: () => void
    readonly closeLabel: string
    readonly title: string
    readonly description?: string
    readonly children?: ReactNode
    readonly footer?: ReactNode
  }): ReactNode

  export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & {
    readonly variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
  }): ReactNode

  export function IconArchiveOutline20(props: { readonly size?: number }): ReactNode
  export function IconBranchOutline16(): ReactNode
  export function IconEditOutline16(): ReactNode
  export function IconEllipsisOutline16(): ReactNode
  export function IconTrashOutline16(): ReactNode
}
