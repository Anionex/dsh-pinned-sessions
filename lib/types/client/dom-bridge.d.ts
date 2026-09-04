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
export interface MenuPortalTarget {
    readonly host: HTMLDivElement;
    readonly menu: HTMLElement;
    readonly sessionId: string;
    readonly buttonClassName: string;
    readonly iconClassName: string;
    readonly labelClassName: string;
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
/** Find the newest unclaimed native portal menu after a Session trigger click. */
export declare function findUnclaimedPortalMenu(doc: Document): HTMLElement | null;
/** Add one host row to a native Session menu, before its destructive/archive tail. */
export declare function attachSessionMenuHost(menu: HTMLElement, sessionId: string): MenuPortalTarget | null;
export declare function removeBridgeArtifacts(doc: Document): void;
