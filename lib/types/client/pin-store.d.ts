export declare const PIN_STORAGE_KEY = "dsh.pinned-sessions.v1";
export interface PinRecord {
    readonly id: string;
    readonly pinnedAt: number;
}
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/** Decode, de-duplicate, and normalize one persisted pin snapshot. */
export declare function decodePins(raw: string | null): readonly PinRecord[];
/** Browser-local, versioned pin state with React-compatible subscriptions. */
export declare class PinStore {
    private readonly storage;
    private snapshot;
    private readonly listeners;
    constructor(storage: StorageLike | undefined);
    readonly getSnapshot: () => readonly PinRecord[];
    readonly subscribe: (listener: () => void) => (() => void);
    isPinned(id: string): boolean;
    toggle(id: string, now?: number): void;
    prune(keep: (id: string) => boolean): void;
    reload(): void;
    private read;
    private publish;
    private emit;
}
