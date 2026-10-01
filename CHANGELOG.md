# Changelog

## 0.1.2 — 2026-10-01

- Use DSH 0.2's official session-menu slot and workspace navigation service. Keep the legacy menu bridge for older hosts, and bundle icons whose old host export names were removed.
- 使用 DSH 0.2 的官方会话菜单 slot 和工作区导航服务；保留旧版菜单桥接，并打包已被宿主移除旧名称的图标。
- The plugin's top section remains independent of the new native workspace pin action. Menu labels explicitly name the top section.
- 插件顶部分组与新版宿主工作区内置置顶分别保留；菜单文字明确指向顶部分组。
- Verified DSH `0.2.0-rc.2` on Web and the official Electron Desktop: clean tarball installation, pin, restart persistence, navigation from the pinned section, and unpin.
- 已在 DSH `0.2.0-rc.2` Web 及官方 Electron Desktop 实测压缩包安装、置顶、重启持久化、置顶会话导航和取消置顶。

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
