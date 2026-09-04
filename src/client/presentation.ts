interface SessionPresentationInput {
  readonly id: string
  readonly title?: string | undefined
  readonly cwd?: string | undefined
}

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}

/** Match the native sidebar's useful fallback for sessions without a title. */
export function sessionDisplayTitle(
  session: SessionPresentationInput,
  workspaceTitle: string | undefined,
): string {
  const explicit = nonBlank(session.title)
  if (explicit !== undefined) return explicit
  const workspace = nonBlank(workspaceTitle)
  if (workspace !== undefined) return workspace
  const cwd = nonBlank(session.cwd)
  if (cwd !== undefined) {
    const leaf = cwd.replace(/[\\/]+$/u, '').split(/[\\/]/u).at(-1)
    if (leaf !== undefined && leaf.length > 0) return leaf
  }
  return session.id
}
