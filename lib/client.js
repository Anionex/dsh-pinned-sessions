window.__ModuleLoader__.load({ id: "@anionex/dsh-pinned-sessions", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  PinnedSessionsBridge: () => PinnedSessionsBridge,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react3 = require("react");

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react2 = require("react");

// node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// node_modules/lucide-react/dist/esm/Icon.js
var import_react = require("react");

// node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/Icon.js
var Icon = (0, import_react.forwardRef)(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return (0, import_react.createElement)(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component = (0, import_react2.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
      ...props
    })
  );
  Component.displayName = `${iconName}`;
  return Component;
};

// node_modules/lucide-react/dist/esm/icons/pin.js
var Pin = createLucideIcon("Pin", [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  [
    "path",
    {
      d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
      key: "1nkz8b"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/x.js
var X = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);

// src/client/index.tsx
var import_react_dom = require("react-dom");

// node_modules/lucide/dist/esm/defaultAttributes.js
var defaultAttributes2 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

// node_modules/lucide/dist/esm/icons/pin-off.js
var PinOff = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M12 17v5" }],
    ["path", { d: "M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" }],
    ["path", { d: "m2 2 20 20" }],
    ["path", { d: "M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" }]
  ]
];

// node_modules/lucide/dist/esm/icons/pin.js
var Pin2 = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M12 17v5" }],
    [
      "path",
      {
        d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
      }
    ]
  ]
];

// src/client/dom-bridge.ts
var SIDEBAR_SLOT_SELECTOR = '[data-slot="sidebar.workspaces"]';
var PINNED_HOST_ATTRIBUTE = "data-dsh-pinned-sessions-host";
var MENU_HOST_ATTRIBUTE = "data-dsh-pinned-session-menu-host";
var MENU_OWNER_ATTRIBUTE = "data-dsh-pinned-session-menu";
function elementFromTarget(target) {
  return target !== null && target.nodeType === 1 ? target : null;
}
function findSessionActionTarget(target) {
  const element = elementFromTarget(target);
  const button = element?.closest("button");
  if (!(button instanceof HTMLButtonElement)) return null;
  const row = button.closest('[role="treeitem"][aria-selected]');
  if (row === null || row === button) return null;
  if (row.closest(SIDEBAR_SLOT_SELECTOR) === null) return null;
  if (row.closest(`[${PINNED_HOST_ATTRIBUTE}]`) !== null) return null;
  return { button, row };
}
function captureSessionId(row, sessions) {
  const hadOwn = Object.prototype.hasOwnProperty.call(sessions, "open");
  const ownDescriptor = hadOwn ? Object.getOwnPropertyDescriptor(sessions, "open") : void 0;
  const original = sessions.open;
  let captured = null;
  const interceptor = (sessionId) => {
    if (typeof sessionId === "string" && sessionId.length > 0) captured = sessionId;
  };
  try {
    Object.defineProperty(sessions, "open", {
      configurable: true,
      enumerable: ownDescriptor?.enumerable ?? false,
      writable: true,
      value: interceptor
    });
    if (sessions.open !== interceptor) return null;
    row.click();
  } catch {
    return null;
  } finally {
    try {
      if (hadOwn && ownDescriptor !== void 0) Object.defineProperty(sessions, "open", ownDescriptor);
      else delete sessions.open;
    } catch {
      try {
        Object.defineProperty(sessions, "open", {
          configurable: true,
          writable: true,
          value: original
        });
      } catch {
      }
    }
  }
  return captured;
}
function ensurePinnedHost(doc) {
  const slot = doc.querySelector(SIDEBAR_SLOT_SELECTOR);
  const root = slot?.firstElementChild;
  if (!(root instanceof HTMLElement)) return null;
  const existing = root.querySelector(`:scope > [${PINNED_HOST_ATTRIBUTE}]`);
  if (existing !== null) return existing;
  const header = root.firstElementChild;
  if (header === null) return null;
  const host = doc.createElement("div");
  host.setAttribute(PINNED_HOST_ATTRIBUTE, "");
  header.insertAdjacentElement("afterend", host);
  return host;
}
function listPortalMenus(doc) {
  return [...doc.body.children].filter((node) => node instanceof HTMLElement && node.getAttribute("role") === "menu");
}
function belongsToTrigger(menu, trigger) {
  if (trigger === void 0 || trigger.width === 0 || trigger.height === 0) return true;
  const menuRect = menu.getBoundingClientRect();
  if (menuRect.width === 0 || menuRect.height === 0) return true;
  const horizontalGap = Math.min(
    Math.abs(menuRect.left - trigger.left),
    Math.abs(menuRect.right - trigger.right)
  );
  const verticalGap = Math.min(
    Math.abs(menuRect.top - trigger.bottom),
    Math.abs(menuRect.bottom - trigger.top)
  );
  return horizontalGap <= 64 && verticalGap <= 32;
}
function findUnclaimedPortalMenu(doc, excluded = /* @__PURE__ */ new Set(), trigger) {
  const menus = listPortalMenus(doc).filter((menu) => !excluded.has(menu) && !menu.hasAttribute(MENU_OWNER_ATTRIBUTE) && belongsToTrigger(menu, trigger));
  return menus.at(-1) ?? null;
}
function createLucideIcon2(doc, node, name) {
  const [, attributes, children = []] = node;
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, String(value));
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("class", `lucide lucide-${name}`);
  svg.setAttribute("aria-hidden", "true");
  for (const [tag, childAttributes] of children) {
    const child = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(childAttributes)) child.setAttribute(key, String(value));
    svg.appendChild(child);
  }
  return svg;
}
function updateSessionMenuItem(target, pinned, label) {
  target.button.setAttribute("aria-label", label);
  target.label.textContent = label;
  target.icon.replaceChildren(createLucideIcon2(
    target.menu.ownerDocument,
    pinned ? PinOff : Pin2,
    pinned ? "pin-off" : "pin"
  ));
}
function attachSessionMenuHost(menu, sessionId) {
  if (menu.hasAttribute(MENU_OWNER_ATTRIBUTE)) return null;
  const viewport = [...menu.children].find((node) => node instanceof HTMLElement && node.getAttribute("role") === "presentation");
  if (viewport === void 0) return null;
  const wrappers = [...viewport.children].filter((node) => node instanceof HTMLElement && node.querySelector(':scope > button[role="menuitem"]') instanceof HTMLButtonElement);
  if (wrappers.length !== 3) return null;
  const templateButton = wrappers[0]?.querySelector(':scope > button[role="menuitem"]');
  if (templateButton === null || templateButton === void 0) return null;
  const spans = [...templateButton.children].filter((node) => node instanceof HTMLSpanElement);
  if (spans.length < 2) return null;
  const doc = menu.ownerDocument;
  const host = doc.createElement("div");
  host.className = wrappers[0]?.className ?? "";
  host.setAttribute(MENU_HOST_ATTRIBUTE, "");
  const button = doc.createElement("button");
  button.type = "button";
  button.setAttribute("role", "menuitem");
  button.className = `${templateButton.className} dsh-pins-menu-button`;
  const icon = doc.createElement("span");
  icon.className = spans[0]?.className ?? "";
  icon.setAttribute("aria-hidden", "true");
  const label = doc.createElement("span");
  label.className = spans.at(-1)?.className ?? "";
  button.append(icon, label);
  host.appendChild(button);
  viewport.insertBefore(host, wrappers.at(-1) ?? null);
  menu.setAttribute(MENU_OWNER_ATTRIBUTE, sessionId);
  const target = { host, menu, sessionId, button, icon, label };
  const view = doc.defaultView;
  if (view !== null) view.dispatchEvent(new view.Event("resize"));
  return target;
}
function focusAfterPinnedRemoval(doc, host, removedIndex) {
  const remaining = host === null ? [] : [...host.querySelectorAll(".dsh-pins-open")];
  const next = remaining[Math.min(removedIndex, remaining.length - 1)];
  if (next !== void 0) {
    next.focus({ preventScroll: true });
    return true;
  }
  const nativeRow = doc.querySelector(`${SIDEBAR_SLOT_SELECTOR} [role="treeitem"][aria-selected="true"]`) ?? doc.querySelector(`${SIDEBAR_SLOT_SELECTOR} [role="treeitem"]`);
  if (nativeRow === null) return false;
  const hadTabIndex = nativeRow.hasAttribute("tabindex");
  if (!hadTabIndex) nativeRow.tabIndex = -1;
  nativeRow.focus({ preventScroll: true });
  if (doc.activeElement === nativeRow) return true;
  if (!hadTabIndex) nativeRow.removeAttribute("tabindex");
  return false;
}
function removeBridgeArtifacts(doc) {
  for (const node of doc.querySelectorAll(`[${PINNED_HOST_ATTRIBUTE}], [${MENU_HOST_ATTRIBUTE}]`)) node.remove();
  for (const menu of doc.querySelectorAll(`[${MENU_OWNER_ATTRIBUTE}]`)) menu.removeAttribute(MENU_OWNER_ATTRIBUTE);
}

// src/client/pin-store.ts
var PIN_STORAGE_KEY = "dsh.pinned-sessions.v1";
var MAX_PINS = 500;
function isPinRecord(value) {
  if (typeof value !== "object" || value === null) return false;
  const row = value;
  return typeof row.id === "string" && row.id.length > 0 && Number.isFinite(row.pinnedAt) && row.pinnedAt >= 0;
}
function decodePins(raw) {
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.pins)) return [];
    const byId = /* @__PURE__ */ new Map();
    for (const candidate of parsed.pins) {
      if (!isPinRecord(candidate)) continue;
      const previous = byId.get(candidate.id);
      if (previous === void 0 || candidate.pinnedAt > previous.pinnedAt) {
        byId.set(candidate.id, { id: candidate.id, pinnedAt: candidate.pinnedAt });
      }
    }
    return [...byId.values()].sort((left, right) => right.pinnedAt - left.pinnedAt || left.id.localeCompare(right.id)).slice(0, MAX_PINS);
  } catch {
    return [];
  }
}
var PinStore = class {
  constructor(storage) {
    this.storage = storage;
    this.snapshot = this.read();
  }
  snapshot;
  listeners = /* @__PURE__ */ new Set();
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  isPinned(id) {
    return this.snapshot.some((row) => row.id === id);
  }
  toggle(id, now = Date.now()) {
    if (id.length === 0) return;
    const without = this.snapshot.filter((row) => row.id !== id);
    this.publish(this.isPinned(id) ? without : [{ id, pinnedAt: now }, ...without]);
  }
  prune(keep) {
    const next = this.snapshot.filter((row) => keep(row.id));
    if (next.length !== this.snapshot.length) this.publish(next);
  }
  reload() {
    const next = this.read();
    if (samePins(this.snapshot, next)) return;
    this.snapshot = next;
    this.emit();
  }
  read() {
    try {
      return decodePins(this.storage?.getItem(PIN_STORAGE_KEY) ?? null);
    } catch {
      return [];
    }
  }
  publish(next) {
    this.snapshot = [...next].sort((left, right) => right.pinnedAt - left.pinnedAt || left.id.localeCompare(right.id)).slice(0, MAX_PINS);
    try {
      this.storage?.setItem(PIN_STORAGE_KEY, JSON.stringify({ version: 1, pins: this.snapshot }));
    } catch {
    }
    this.emit();
  }
  emit() {
    for (const listener of [...this.listeners]) listener();
  }
};
function samePins(left, right) {
  return left.length === right.length && left.every((row, index) => row.id === right[index]?.id && row.pinnedAt === right[index]?.pinnedAt);
}

// src/client/presentation.ts
function nonBlank(value) {
  const trimmed = value?.trim();
  return trimmed === void 0 || trimmed.length === 0 ? void 0 : trimmed;
}
function sessionDisplayTitle(session, workspaceTitle) {
  const explicit = nonBlank(session.title);
  if (explicit !== void 0) return explicit;
  const workspace = nonBlank(workspaceTitle);
  if (workspace !== void 0) return workspace;
  const cwd = nonBlank(session.cwd);
  if (cwd !== void 0) {
    const leaf = cwd.replace(/[\\/]+$/u, "").split(/[\\/]/u).at(-1);
    if (leaf !== void 0 && leaf.length > 0) return leaf;
  }
  return session.id;
}

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "pinnedSessions";
var STYLE_ID = "@anionex/dsh-pinned-sessions";
var MENU_ASSOCIATION_MS = 2e3;
var zh = {
  "menu.pin": "\u7F6E\u9876\u4F1A\u8BDD",
  "menu.unpin": "\u53D6\u6D88\u7F6E\u9876",
  "section.label": "\u7F6E\u9876\u4F1A\u8BDD",
  "session.open": "\u6253\u5F00\u7F6E\u9876\u4F1A\u8BDD\u201C{name}\u201D",
  "session.unpin": "\u53D6\u6D88\u7F6E\u9876\u201C{name}\u201D",
  "workspace.ungrouped": "\u672A\u5206\u7EC4"
};
var en = {
  "menu.pin": "Pin session",
  "menu.unpin": "Unpin session",
  "section.label": "Pinned sessions",
  "session.open": "Open pinned session \u201C{name}\u201D",
  "session.unpin": "Unpin \u201C{name}\u201D",
  "workspace.ungrouped": "Ungrouped"
};
var styles = `
[${"data-dsh-pinned-sessions-host"}]{box-sizing:border-box;min-width:0;flex:none}
.dsh-pins-section{box-sizing:border-box;min-width:0;margin:0 4px 6px;padding:0 0 6px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-pins-header{display:flex;align-items:center;gap:6px;height:28px;padding:0 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-weight:500}
.dsh-pins-header svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-list{box-sizing:border-box;max-height:192px;min-width:0;margin:0;padding:0;overflow-y:auto;overscroll-behavior:contain;list-style:none}
.dsh-pins-row{box-sizing:border-box;display:flex;align-items:center;gap:0;height:32px;min-width:0;border-radius:6px;color:var(--dsw-alias-label-primary)}
.dsh-pins-row:hover,.dsh-pins-row[data-current="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.dsh-pins-open{box-sizing:border-box;display:flex;align-items:center;gap:6px;min-width:0;height:32px;padding:0 4px 0 8px;border:0;background:transparent;color:inherit;cursor:pointer;flex:1;text-align:left}
.dsh-pins-open:focus-visible,.dsh-pins-remove:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.dsh-pins-open>svg{flex:none;color:var(--dsw-alias-state-business-primary)}
.dsh-pins-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px;flex:1}
.dsh-pins-workspace{max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;flex:none}
.dsh-pins-remove{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin-right:3px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;flex:none}
.dsh-pins-row:hover .dsh-pins-remove,.dsh-pins-remove:focus-visible{opacity:1}
.dsh-pins-remove:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh-pins-menu-button{letter-spacing:0}
@media (max-width:767px){.dsh-pins-workspace{display:none}.dsh-pins-remove{opacity:1}}
`;
var inject = ["slots", "sessions", "locale"];
function apply(ctx) {
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    storage = void 0;
  }
  const store = new PinStore(storage);
  ctx.effect(() => {
    const onStorage = (event) => {
      if (event.key === PIN_STORAGE_KEY || event.key === null) store.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, "pinned-sessions: cross-tab state");
  ctx.effect(() => {
    if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {
    };
    const tag = document.createElement("style");
    tag.dataset.plugin = "@anionex/dsh-pinned-sessions";
    tag.dataset.pluginCss = STYLE_ID;
    tag.textContent = styles;
    document.head.appendChild(tag);
    return () => {
      tag.remove();
    };
  }, "pinned-sessions: styles");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "pinned-sessions: dictionaries");
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "pinned-sessions-bridge",
    order: 40,
    locale: NS,
    inject: () => ({ store, sessions: ctx.sessions })
  }, PinnedSessionsBridge));
}
function PinnedSessionsBridge({ store, sessions, useSessions, useWorkspaces, t }) {
  const sessionSnapshot = useSessions((snapshot) => snapshot);
  const workspaceSnapshot = useWorkspaces((snapshot) => snapshot);
  const pins = (0, import_react3.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [sidebarHost, setSidebarHost] = (0, import_react3.useState)(null);
  const [sidebarWide, setSidebarWide] = (0, import_react3.useState)(true);
  const pending = (0, import_react3.useRef)(null);
  const activeMenu = (0, import_react3.useRef)(null);
  const focusAfterUnpin = (0, import_react3.useRef)(null);
  (0, import_react3.useLayoutEffect)(() => {
    let active = true;
    let queued = false;
    let settleTimer;
    let observedSidebar = null;
    const sidebarObserver = new MutationObserver(() => {
      queueRefresh();
    });
    const disposeActiveMenu = () => {
      const binding = activeMenu.current;
      if (binding === null) return;
      activeMenu.current = null;
      binding.target.button.removeEventListener("click", binding.onClick);
      binding.target.host.remove();
      if (binding.target.menu.getAttribute(MENU_OWNER_ATTRIBUTE) === binding.target.sessionId) {
        binding.target.menu.removeAttribute(MENU_OWNER_ATTRIBUTE);
      }
    };
    const updateActiveMenu = () => {
      const binding = activeMenu.current;
      if (binding === null) return;
      const pinned = store.isPinned(binding.target.sessionId);
      updateSessionMenuItem(binding.target, pinned, t(pinned ? "menu.unpin" : "menu.pin"));
    };
    const observeSidebar = () => {
      const slot = document.querySelector(SIDEBAR_SLOT_SELECTOR);
      if (slot === observedSidebar) return;
      sidebarObserver.disconnect();
      observedSidebar = slot;
      if (slot !== null) {
        sidebarObserver.observe(slot, {
          attributes: true,
          attributeFilter: ["class", "style"],
          childList: true,
          subtree: true
        });
      }
    };
    const refresh = () => {
      if (!active) return;
      const nextHost = ensurePinnedHost(document);
      setSidebarHost((current) => current === nextHost ? current : nextHost);
      observeSidebar();
      const rootWidth = nextHost?.parentElement?.getBoundingClientRect().width;
      if (rootWidth !== void 0) setSidebarWide(rootWidth >= 160);
      const binding = activeMenu.current;
      if (binding !== null && (!binding.target.host.isConnected || !binding.target.menu.isConnected)) {
        disposeActiveMenu();
      }
      const request = pending.current;
      if (request === null) return;
      if (Date.now() - request.createdAt > MENU_ASSOCIATION_MS) {
        pending.current = null;
        return;
      }
      const menu = findUnclaimedPortalMenu(document, request.existingMenus, request.triggerRect);
      if (menu === null) return;
      const target = attachSessionMenuHost(menu, request.sessionId);
      if (target === null) return;
      const onClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        store.toggle(target.sessionId);
        disposeActiveMenu();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      };
      target.button.addEventListener("click", onClick);
      activeMenu.current = { target, onClick };
      pending.current = null;
      updateActiveMenu();
    };
    function queueRefresh() {
      if (!active) return;
      if (settleTimer === void 0) {
        settleTimer = window.setTimeout(() => {
          settleTimer = void 0;
          refresh();
        }, 250);
      }
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        refresh();
      });
    }
    const onClickCapture = (event) => {
      pending.current = null;
      const target = findSessionActionTarget(event.target);
      if (target === null) return;
      const sessionId = captureSessionId(target.row, sessions);
      if (sessionId === null) return;
      const rect = target.button.getBoundingClientRect();
      pending.current = {
        sessionId,
        createdAt: Date.now(),
        existingMenus: new Set(listPortalMenus(document)),
        triggerRect: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      };
      queueRefresh();
    };
    const onKeyDownCapture = () => {
      pending.current = null;
    };
    refresh();
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("keydown", onKeyDownCapture, true);
    const bodyObserver = new MutationObserver(() => {
      queueRefresh();
    });
    bodyObserver.observe(document.body, { childList: true });
    const unsubscribe = store.subscribe(updateActiveMenu);
    return () => {
      active = false;
      pending.current = null;
      if (settleTimer !== void 0) window.clearTimeout(settleTimer);
      unsubscribe();
      bodyObserver.disconnect();
      sidebarObserver.disconnect();
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("keydown", onKeyDownCapture, true);
      disposeActiveMenu();
      removeBridgeArtifacts(document);
    };
  }, [sessions, store, t]);
  (0, import_react3.useLayoutEffect)(() => {
    if (sidebarHost === null) return;
    const root = sidebarHost.parentElement;
    if (root === null) return;
    const update = () => {
      setSidebarWide(root.getBoundingClientRect().width >= 160);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => {
      observer.disconnect();
    };
  }, [sidebarHost]);
  (0, import_react3.useEffect)(() => {
    if (sessionSnapshot.phase !== "ready" || workspaceSnapshot.phase !== "ready") return;
    const valid = new Set(sessionSnapshot.ids);
    const archived = new Set(workspaceSnapshot.archivedSessionIds);
    store.prune((sessionId) => valid.has(sessionId) && !archived.has(sessionId));
  }, [sessionSnapshot, store, workspaceSnapshot]);
  const rows = (0, import_react3.useMemo)(() => {
    const workspaceBySession = /* @__PURE__ */ new Map();
    for (const workspace of workspaceSnapshot.items) {
      for (const sessionId of workspace.sessionIds) {
        if (!workspaceBySession.has(sessionId)) workspaceBySession.set(sessionId, workspace.title);
      }
    }
    return pins.flatMap((pin) => {
      const session = sessionSnapshot.byId[pin.id];
      if (session === void 0 || session.blank === true) return [];
      const workspaceTitle = workspaceBySession.get(pin.id);
      const workspace = workspaceTitle ?? t("workspace.ungrouped");
      return [{ session, title: sessionDisplayTitle(session, workspaceTitle), workspace }];
    });
  }, [pins, sessionSnapshot.byId, t, workspaceSnapshot.items]);
  (0, import_react3.useLayoutEffect)(() => {
    const removedIndex = focusAfterUnpin.current;
    if (removedIndex === null) return;
    focusAfterUnpin.current = null;
    focusAfterPinnedRemoval(document, sidebarHost, removedIndex);
  }, [rows, sidebarHost]);
  return sidebarHost !== null && sidebarHost.isConnected && sidebarWide && rows.length > 0 ? (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      PinnedSessionSection,
      {
        currentId: sessionSnapshot.current,
        rows,
        open: (sessionId) => {
          sessions.open(sessionId);
        },
        unpin: (sessionId, index) => {
          focusAfterUnpin.current = index;
          store.toggle(sessionId);
        },
        t
      }
    ),
    sidebarHost
  ) : null;
}
function PinnedSessionSection({ currentId, rows, open, unpin, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh-pins-section", "aria-label": t("section.label"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-pins-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinIcon, { size: 13 }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("section.label") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-pins-list", children: rows.map(({ session, title, workspace }, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "li",
      {
        className: "dsh-pins-row",
        "data-current": session.id === currentId ? "true" : "false",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: "dsh-pins-open",
              "aria-current": session.id === currentId ? "page" : void 0,
              "aria-label": t("session.open", { name: title }),
              onClick: () => {
                open(session.id);
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinIcon, { size: 13 }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-pins-title", children: title }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-pins-workspace", children: workspace })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "dsh-pins-remove",
              "aria-label": t("session.unpin", { name: title }),
              title: t("session.unpin", { name: title }),
              onClick: () => {
                unpin(session.id, index);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloseIcon, {})
            }
          )
        ]
      },
      session.id
    )) })
  ] });
}
function PinIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { size, strokeWidth: 1.8, "aria-hidden": "true" });
}
function CloseIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14, strokeWidth: 2, "aria-hidden": "true" });
}
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/pin.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide/dist/esm/defaultAttributes.js:
lucide/dist/esm/icons/pin-off.js:
lucide/dist/esm/icons/pin.js:
lucide/dist/esm/lucide.js:
  (**
   * @license lucide v0.468.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/

return module.exports; } });
//# sourceMappingURL=client.js.map
