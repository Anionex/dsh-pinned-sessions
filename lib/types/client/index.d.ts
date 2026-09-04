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
interface ClientContextLike {
    readonly slots: SlotsLike;
    readonly sessions: SessionsForCapture;
    readonly locale: LocaleLike;
    effect(setup: () => (() => void), label?: string): unknown;
}
interface BridgeProps {
    readonly store: PinStore;
    readonly sessions: SessionsForCapture;
    readonly useSessions: SelectorHook<SessionsSnapshotLike>;
    readonly useWorkspaces: SelectorHook<WorkspacesSnapshotLike>;
    readonly t: Translate;
}
export declare const inject: string[];
/** Register the lifecycle bridge in the additive frame overlay slot. */
export declare function apply(ctx: ClientContextLike): void;
/** Keep native sidebar behavior intact while portalling the two added surfaces. */
export declare function PinnedSessionsBridge({ store, sessions, useSessions, useWorkspaces, t }: BridgeProps): ReactNode;
export {};
