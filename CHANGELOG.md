# Changelog

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) while its public API remains pre-1.0.

## [Unreleased]

## [0.1.1] - 2026-09-04

### Added

- A hover/focus ellipsis menu on every pinned Session row.
- Native Rename, Fork, Unpin, and Archive actions on Web.
- Optional Delete and action-failure Toasts when the Desktop Archive Manager capability is active.
- Keyboard menu navigation and focus handoff after a pinned row disappears.
- English and Chinese product visuals, setup guidance, compatibility notes, and project policies.

### Changed

- Replaced the direct unpin control with the same Menu, Modal, Button, and icon primitives used by DSH.
- Made Desktop delete availability react to service activation and disposal.

## [0.1.0] - 2026-09-04

### Added

- Initial Web and Desktop profile bundle.
- Exact Session ID capture from native menus.
- Local pinned-session storage and a compact Workspace-header section.

[Unreleased]: https://github.com/Anionex/dsh-pinned-sessions/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Anionex/dsh-pinned-sessions/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Anionex/dsh-pinned-sessions/releases/tag/v0.1.0
