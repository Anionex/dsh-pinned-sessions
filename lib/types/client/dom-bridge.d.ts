export declare const SIDEBAR_SLOT_SELECTOR = "[data-slot=\"sidebar.workspaces\"]";
export declare const PINNED_HOST_ATTRIBUTE = "data-dsh-pinned-sessions-host";
export declare const MENU_HOST_ATTRIBUTE = "data-dsh-pinned-session-menu-host";
export declare const MENU_OWNER_ATTRIBUTE = "data-dsh-pinned-session-menu";
export interface SessionsForCapture {
    readonly list: {
        getSnapshot(): {
            readonly current?: string | undefined;
        };
    };
    open(sessionId: string): void;
}
export interface SessionActionTarget {
    readonly button: HTMLButtonElement;
    readonly row: HTMLElement;
}
export interface SessionMenuTarget {
    readonly host: HTMLDivElement;
    readonly menu: HTMLElement;
    readonly sessionId: string;
    readonly button: HTMLButtonElement;
    readonly icon: HTMLSpanElement;
    readonly label: HTMLSpanElement;
}
export interface TriggerRect {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    readonly width: number;
    readonly height: number;
}
/** Identify a native ellipsis trigger inside a real Session row. */
export declare function findSessionActionTarget(target: EventTarget | null): SessionActionTarget | null;
/**
 * Ask the native row closure for its Session ID without changing selection.
 * The Workspace browser's row callback calls sessions.open(node.id), so a
 * synchronous, verified interceptor captures the exact ID and is restored
 * before the user's original ellipsis click continues.
 */
export declare function captureSessionId(row: HTMLElement, sessions: SessionsForCapture): string | null;
/** Insert the pinned region immediately after the native Workspace header. */
export declare function ensurePinnedHost(doc: Document): HTMLDivElement | null;
/** List direct-body portal menus so one trigger can exclude every pre-existing menu. */
export declare function listPortalMenus(doc: Document): readonly HTMLElement[];
/** Find only a new, geometrically associated portal menu after one trigger click. */
export declare function findUnclaimedPortalMenu(doc: Document, excluded?: ReadonlySet<HTMLElement>, trigger?: TriggerRect): HTMLElement | null;
/** Update the unmanaged item without moving it into the plugin's React tree. */
export declare function updateSessionMenuItem(target: SessionMenuTarget, pinned: boolean, label: string): void;
/** Add an unmanaged native-styled row before the Session menu's archive tail. */
export declare function attachSessionMenuHost(menu: HTMLElement, sessionId: string): SessionMenuTarget | null;
/** Restore useful keyboard focus after a pinned row removes itself. */
export declare function focusAfterPinnedRemoval(doc: Document, host: HTMLElement | null, removedIndex: number): boolean;
export declare function removeBridgeArtifacts(doc: Document): void;
