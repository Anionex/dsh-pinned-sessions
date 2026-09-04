interface SessionPresentationInput {
    readonly id: string;
    readonly title?: string | undefined;
    readonly cwd?: string | undefined;
}
/** Match the native sidebar's useful fallback for sessions without a title. */
export declare function sessionDisplayTitle(session: SessionPresentationInput, workspaceTitle: string | undefined): string;
export {};
