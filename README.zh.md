# DSH 置顶会话

把重要的 DeepSeek Harness 会话固定在左侧工作区列表顶部。

## 功能

- 在原生会话“...”菜单中增加“置顶会话 / 取消置顶”。
- 在原生工作区树上方显示紧凑的置顶会话列表。
- 置顶行的“...”菜单与原生会话行保持相同操作，并用“取消置顶”替换“置顶会话”。
- 点击置顶项时通过 DSH 官方 Session 服务打开会话。
- 原会话仍保留在原工作区中，搜索、分组、拖拽排序、分叉、重命名、归档和可选的删除操作全部保持原样。
- 使用带版本号的浏览器 profile 存储；DSH 数据就绪后自动移除已归档或已消失的条目。
- 同时支持 DSH `web` profile 和 DSH Desktop 内嵌的 Web 客户端。

## 安装

从 npm 安装：

```bash
dsh plugin --profile web add @anionex/dsh-pinned-sessions
dsh plugin --profile desktop add @anionex/dsh-pinned-sessions
```

如需从源码 checkout 安装，把包名替换为 `.`。安装后重启对应的长期运行 profile。打开任意会话的“...”菜单并选择“置顶会话”，置顶区会出现在“工作区”标题正下方。

Web 与 Desktop 各自在自己的浏览器 profile 中持久化置顶状态；该状态不会写入会话日志或工作区文件。

## 兼容实现

当前 DSH 提供可叠加的根级 overlay slot，但没有逐会话菜单或工作区列表头部 slot。本插件通过官方 `shell.overlay` 生命周期挂载，再使用 DSH 稳定的 `[data-slot="sidebar.workspaces"]` 和 ARIA role 完成精确放置。插件通过原生 `sessions.open(node.id)` 回调无导航地捕获真实 Session ID；如果无法验证该捕获路径，就直接不添加菜单项。

实现不会按标题或列表序号猜测会话。插件卸载或热重载时会完整清理 observer、事件监听、portal 宿主和样式。

## 开发

```bash
pnpm install
pnpm run check
```

仓库提交 `lib/` 构建产物，因此 Git checkout 可以直接安装。

## 许可证

MIT
