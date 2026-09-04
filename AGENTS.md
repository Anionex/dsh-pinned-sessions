# DSH Pinned Sessions

- Keep the plugin as an additive Web client loaded by both `web` and `desktop` profiles. Do not replace the single-occupant `sidebar.workspaces` slot.
- The only supported DOM anchors are DSH renderer `[data-slot]` wrappers and ARIA roles. Never depend on CSS Module hashes or localized labels.
- Session identity must come from the official sessions snapshot or the verified synchronous `sessions.open(node.id)` capture. Fail closed if capture is unavailable; never match by title or row index.
- Every observer, listener, portal host, and stylesheet must be removed by the Cordis/React disposer so client HMR remains safe.
- Run `pnpm run check`, clean-profile install checks for both profiles, and real Web/Desktop interaction verification before release.
