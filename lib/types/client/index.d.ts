import { type ReactNode } from 'react';
import { type SessionsForCapture } from './dom-bridge.js';
import { PinStore } from './pin-store.js';
interface SessionSummaryLike {
    readonly id: string;
    readonly title?: string | undefined;
    readonly cwd?: string | undefined;
    readonly blank?: boolean | undefined;
    readonly running?: boolean | undefined;
    readonly completed?: boolean | undefined;
}
interface SessionsSnapshotLike {
    readonly ids: readonly string[];
    readonly byId: Readonly<Record<string, SessionSummaryLike | undefined>>;
    readonly current?: string | undefined;
    readonly phase: string;
}
interface WorkspaceLike {
    readonly workspaceId: string;
    readonly title: string;
    readonly sessionIds: readonly string[];
}
interface WorkspacesSnapshotLike {
    readonly items: readonly WorkspaceLike[];
    readonly archivedSessionIds: readonly string[];
    readonly phase: string;
}
type SelectorHook<T> = <S>(selector: (snapshot: T) => S, equal?: (left: S, right: S) => boolean) => S;
type Translate = (key: string, params?: Readonly<Record<string, unknown>>) => string;
interface SlotsLike {
    inject(name: string, install: () => unknown): void;
    register<I, P>(entry: {
        readonly name: string;
        readonly id: string;
        readonly order?: number;
        readonly locale?: string;
        readonly inject?: () => I;
    }, component: (props: P) => ReactNode): () => void;
}
interface LocaleLike {
    register(namespace: string, dictionaries: Readonly<Record<string, Readonly<Record<string, string>>>>): () => void;
}
interface ResultLike {
    readonly ok: boolean;
    readonly error?: {
        readonly message: string;
    } | undefined;
}
interface ClientSessionsLike extends SessionsForCapture {
    binding(sessionId: string): {
        readonly session: {
            rename(title: string): Promise<ResultLike>;
        };
    } | undefined;
    fork(input: {
        readonly sessionId: string;
        readonly increaseTitle: boolean;
    }): Promise<string>;
}
interface BooleanStoreLike {
    readonly getSnapshot: () => boolean;
    readonly subscribe: (listener: () => void) => () => void;
}
interface ClientContextLike {
    readonly slots: SlotsLike;
    readonly sessions: ClientSessionsLike;
    readonly locale: LocaleLike;
    get(name: string): unknown;
    inject(dependencies: readonly string[], setup: (ctx: ClientContextLike) => void): unknown;
    effect(setup: () => (() => void), label?: string): unknown;
}
export interface PinnedSessionActions {
    readonly renameSession: (sessionId: string, title: string) => Promise<void>;
    readonly forkSession: (sessionId: string) => Promise<void>;
    readonly archiveSession: (sessionId: string) => Promise<void>;
    readonly deleteAvailability: BooleanStoreLike;
    readonly deleteSession: (sessionId: string) => Promise<void>;
}
interface BridgeProps {
    readonly store: PinStore;
    readonly sessions: SessionsForCapture;
    readonly actions: PinnedSessionActions;
    readonly useSessions: SelectorHook<SessionsSnapshotLike>;
    readonly useWorkspaces: SelectorHook<WorkspacesSnapshotLike>;
    readonly t: Translate;
}
export declare const inject: string[];
/** Register the lifecycle bridge in the additive frame overlay slot. */
export declare function apply(ctx: ClientContextLike): void;
/** Keep native behavior intact while mounting the sidebar portal and unmanaged menu item. */
export declare function PinnedSessionsBridge({ store, sessions, actions, useSessions, useWorkspaces, t }: BridgeProps): ReactNode;
export {};
