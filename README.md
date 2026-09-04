# DSH Pinned Sessions

Pin important DeepSeek Harness sessions at the top of the Workspace sidebar.

## Features

- Adds **Pin session** / **Unpin session** to the native Session actions menu.
- Keeps pinned Sessions in a compact list above the native Workspace tree.
- Opens a pinned Session through the official DSH Session service.
- Preserves the original Session in its Workspace and keeps search, grouping, drag ordering, fork, rename, and archive behavior unchanged.
- Stores pins in versioned browser-profile storage and removes stale or archived entries after DSH data is ready.
- Supports both the DSH `web` profile and DSH Desktop's embedded Web client.

## Install

From a checkout:

```bash
dsh plugin --profile web add .
dsh plugin --profile desktop add .
```

Restart each long-running profile after installation. Open a Session's `...` menu and choose **Pin session**. The pinned list appears directly below the Workspace header.

Pins persist independently in each browser/Desktop profile. They are UI preferences and are not written into Session logs or Workspace files.

## Compatibility

DSH currently exposes additive root overlays but no row-level Session menu or Workspace-list header slot. This plugin mounts through the official `shell.overlay` lifecycle, then uses DSH's stable `[data-slot="sidebar.workspaces"]` and ARIA roles for placement. It captures a row's real Session ID from the native `sessions.open(node.id)` callback without navigating; if that verified capture is unavailable, the plugin fails closed and does not add a menu action.

No title or list-position matching is used. All observers, listeners, portal hosts, and styles are removed on plugin disposal/HMR.

## Development

```bash
pnpm install
pnpm run check
```

The repository commits `lib/` so a Git checkout can be installed directly.

## License

MIT
