# UI 视觉与交互规范文档

> 文档版本：v1.2  
> 创建日期：2026-07-24  
> 适用范围：Nami 娜美 CF 博客（前台 + 管理后台）  
> 项目状态：**已初始化，主题系统已实现**  
> 样式方案：Tailwind CSS 4 + CSS 变量（Design Token）+ 三套二次元主题

---

> **适合谁读**：编写 UI 组件、调整视觉样式、或维护 Design Token 系统的贡献者。

## 1. 设计理念

| 原则     | 说明                                                       |
| -------- | ---------------------------------------------------------- |
| 简洁优先 | 博客以内容为王，UI 不喧宾夺主，留白充足                    |
| 阅读舒适 | 正文行高 1.75、字号 16px、最大宽度 680px，保证长文阅读体验 |
| 轻量快速 | 零冗余装饰，减少视觉噪音，首屏加载无阻塞                   |
| 一致统一 | 前台与后台共享设计 Token，组件行为可预测                   |
| 暗色友好 | 明暗双主题，暗色不是反色，独立设计配色                     |
| 主题可换 | 三套二次元风格主题，管理后台一键切换，实时预览             |

---

## 2. 颜色系统

### 2.1 语义色彩 Token

所有颜色通过 CSS 变量定义，Tailwind 通过 `theme.extend.colors` 引用。

```css
:root {
  /* 品牌色 */
  --color-primary: #3b82f6; /* 蓝-500，主要操作 */
  --color-primary-hover: #2563eb; /* 蓝-600 */
  --color-primary-light: #dbeafe; /* 蓝-100，浅背景 */

  /* 语义色 */
  --color-success: #10b981; /* 绿-500 */
  --color-warning: #f59e0b; /* 黄-500 */
  --color-danger: #ef4444; /* 红-500 */
  --color-info: #3b82f6; /* 蓝-500 */

  /* 中性色 — 明色主题 */
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb; /* 灰-50，卡片/区块背景 */
  --color-bg-tertiary: #f3f4f6; /* 灰-100 */
  --color-text: #111827; /* 灰-900，正文 */
  --color-text-secondary: #6b7280; /* 灰-500，辅助文字 */
  --color-text-tertiary: #9ca3af; /* 灰-400，占位符 */
  --color-border: #e5e7eb; /* 灰-200 */
  --color-border-strong: #d1d5db; /* 灰-300 */
}

/* 暗色主题 */
[data-theme="dark"] {
  --color-bg: #0f172a; /* 石板-900 */
  --color-bg-secondary: #1e293b; /* 石板-800 */
  --color-bg-tertiary: #334155; /* 石板-700 */
  --color-text: #f1f5f9; /* 石板-100 */
  --color-text-secondary: #94a3b8; /* 石板-400 */
  --color-text-tertiary: #64748b; /* 石板-500 */
  --color-border: #334155; /* 石板-700 */
  --color-border-strong: #475569; /* 石板-600 */

  --color-primary-light: #1e3a5f;
}
```

### 2.2 颜色使用规则

| 场景      | 变量                     | 禁止                   |
| --------- | ------------------------ | ---------------------- |
| 正文文字  | `--color-text`           | 不用纯黑 `#000`        |
| 辅助文字  | `--color-text-secondary` | 不直接写 hex           |
| 主要按钮  | `--color-primary`        | 不用其他颜色           |
| 删除/危险 | `--color-danger`         | 不用 `--color-primary` |
| 背景      | `--color-bg`             | 不用纯白 `#FFF`        |
| 分割线    | `--color-border`         | 不用灰色硬编码         |

### 2.3 三套二次元主题

项目提供三套二次元风格主题，通过 `data-theme` 属性切换 CSS 变量，管理后台「站点设置 → 主题外观」可切换。

| 主题    | ID       | 风格     | 主色调         | 背景色调       | 明暗 |
| ------- | -------- | -------- | -------------- | -------------- | ---- |
| 🌸 樱花 | `sakura` | 温柔浪漫 | `#ec4899` 粉红 | `#fffafc` 暖白 | 明   |
| 🌊 海洋 | `ocean`  | 清凉通透 | `#0891b2` 蓝绿 | `#f8fdfe` 冷白 | 明   |
| ✨ 星空 | `starry` | 深邃神秘 | `#8b5cf6` 紫蓝 | `#0a0a1a` 深夜 | 暗   |

**切换机制：**

- 服务端：从 D1 `site_settings` 表的 `site_theme` 字段读取，通过 `data-theme` 属性注入 HTML
- 客户端：内联脚本从 `localStorage` 读取并提前设置，避免闪烁
- 用户切换：点击主题卡片即时预览 + 自动保存到 DB

**主题相关 CSS 变量（新增）：**

```css
/* 每套主题额外提供的装饰变量 */
--color-accent: #xxx; /* 辅助强调色 */
--color-accent-light: #xxx; /* 辅助色浅底 */
--theme-gradient-from/via/to:  /* 装饰渐变背景 */ --theme-glow: /* 发光效果 */;
```

**主题预览卡片设计：**

- 尺寸：三列网格（sm: 单列）
- 预览区：高度 112px，展示主题背景 + 主色/辅助色圆点 + 模拟文字线条
- 底部：主题 emoji + 名称 + 描述 + 当前选中的 ✓ 标记
- 交互：点击即时切换，边框高亮 + ring 动画

---

## 3. 字体系统

### 3.1 字体栈

```css
:root {
  --font-sans:
    "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  --font-serif: "Noto Serif SC", "Georgia", serif; /* 文章正文可选 */
  --font-mono: "JetBrains Mono", "Fira Code", "Menlo", monospace;
}
```

- 中文回退到系统默认无衬线，通过 `Noto Sans SC` 统一
- 中文字体子集化（常用 6500 字），体积控制在 200KB 内
- `font-display: swap` 避免 FOIT

### 3.2 字号层级

| 级别    | Tailwind    | 大小 | 行高 | 用途                 |
| ------- | ----------- | ---- | ---- | -------------------- |
| Display | `text-4xl`  | 36px | 1.2  | 首页大标题           |
| H1      | `text-3xl`  | 30px | 1.3  | 文章标题             |
| H2      | `text-2xl`  | 24px | 1.35 | 文章 H2 / 页面标题   |
| H3      | `text-xl`   | 20px | 1.4  | 文章 H3              |
| H4      | `text-lg`   | 18px | 1.5  | 卡片标题             |
| Body    | `text-base` | 16px | 1.75 | 正文（阅读优化行高） |
| Small   | `text-sm`   | 14px | 1.5  | 辅助文字、标签       |
| XS      | `text-xs`   | 12px | 1.5  | 时间戳、徽标         |

### 3.3 文章排版

- 正文最大宽度 `max-w-prose`（680px），居中
- 段落间距 `space-y-6`（24px）
- 列表缩进 `pl-6`，项目符号使用 `·` 或 `—`（自定义）
- 引用块：左侧 4px 蓝色边线 + 浅蓝背景
- 代码内联：`bg-gray-100 dark:bg-slate-800` + 圆角 4px + 等宽字体

---

## 4. 间距与布局

### 4.1 间距规范

统一使用 Tailwind 默认间距（4px 基础单位）：

| 场景       | 类名                   | 实际值      |
| ---------- | ---------------------- | ----------- |
| 组件内间距 | `p-4` / `p-6`          | 16px / 24px |
| 卡片间距   | `gap-6`                | 24px        |
| 页面外边距 | `px-4 md:px-8`         | 16px / 32px |
| 区块间距   | `space-y-12` / `my-16` | 48px / 64px |
| 列表项间距 | `space-y-4`            | 16px        |

### 4.2 容器宽度

```css
--container-sm: 640px; /* 文章正文 */
--container-md: 768px; /* 列表页 */
--container-lg: 1024px; /* 后台内容区 */
--container-xl: 1280px; /* 全局最大宽度 */
```

### 4.3 栅格

- 前台文章列表：单列（移动端）/ 双列卡片（≥ md）
- 后台侧边栏：固定 240px（折叠 64px）+ 剩余弹性区域
- 不使用 12 列栅格，按业务用 `flex` / `grid` 直接布局

---

## 5. 组件规范

### 5.1 按钮

| 类型      | 样式                                                                 | 用途                   |
| --------- | -------------------------------------------------------------------- | ---------------------- |
| Primary   | `bg-primary text-white hover:bg-primary-hover`                       | 主要操作（发布、保存） |
| Secondary | `bg-transparent border border-border text-text hover:bg-bg-tertiary` | 次要操作（取消、返回） |
| Danger    | `bg-danger text-white hover:bg-red-600`                              | 危险操作（删除）       |
| Ghost     | `bg-transparent text-text-secondary hover:bg-bg-tertiary`            | 工具栏图标按钮         |
| Disabled  | `opacity-50 cursor-not-allowed`                                      | 不可操作态             |

尺寸：

| 尺寸 | 高度 | 内边距 | 字号        | 用途         |
| ---- | ---- | ------ | ----------- | ------------ |
| sm   | 32px | `px-3` | `text-sm`   | 表格行内操作 |
| md   | 40px | `px-4` | `text-base` | 默认按钮     |
| lg   | 48px | `px-6` | `text-lg`   | 页面主 CTA   |

- 圆角：`rounded-lg`（8px）
- 图标按钮：正方形，`p-2`
- 点击反馈：`active:scale-[0.97] transition-transform`

### 5.2 输入框

- 高度：`h-10`（40px）默认
- 边框：`border border-border rounded-lg`
- 聚焦：`focus:ring-2 focus:ring-primary/50 focus:border-primary`
- 错误：`border-danger focus:ring-danger/50`
- 占位文字：`placeholder:text-text-tertiary`
- 禁用：`bg-bg-tertiary cursor-not-allowed`

### 5.3 卡片

```
┌──────────────────────────────────┐
│  [封面图 — aspect 16:9]          │  ← 可选
├──────────────────────────────────┤
│  标题 (H4, line-clamp-2)         │  ← 最多 2 行
│  摘要 (text-secondary, line-3)   │  ← 最多 3 行
│  [标签] [标签]                   │
│  日期 · 阅读时间                  │
└──────────────────────────────────┘
```

- 背景：`bg-bg-secondary`
- 圆角：`rounded-xl`（12px）
- 边框：`border border-border`（可选，暗色模式下优先使用边框区分）
- 悬停：`hover:-translate-y-0.5 hover:shadow-md transition-all`（仅前台卡片）
- 内边距：`p-5`（20px）

### 5.4 标签（Tag / Badge）

- 小号：`text-xs px-2 py-0.5 rounded-full`
- 默认：`bg-primary-light text-primary`
- 自定义颜色标签：使用 `--color-xxx` 内联样式

### 5.5 弹窗（Modal / Dialog）

- 基于 Radix Dialog 原语
- 背景遮罩：`bg-black/50 backdrop-blur-sm`
- 内容区：`bg-bg rounded-2xl p-6 max-w-md`
- 进入动画：缩放 `scale-95 → scale-100` + 透明度 `0 → 1`，200ms
- Esc 关闭 + 点击遮罩关闭
- 焦点陷阱（Focus Trap）

### 5.6 Toast 通知

- 位置：右上角（桌面），底部居中（移动）
- 最大同时显示 3 个，新通知从顶部插入
- 成功：绿色左侧边线
- 错误：红色左侧边线 + 不自动关闭
- 信息/警告：3 秒自动关闭
- 进入动画：从右侧滑入

### 5.7 导航栏（Header）

- 高度：64px（桌面），56px（移动）
- 背景：`bg-bg/80 backdrop-blur-md`（毛玻璃）
- 固定顶部：`sticky top-0 z-50`
- 滚动后：添加底部分割线 `border-b border-border`
- Logo 左，导航中（桌面），操作区右

### 5.8 侧边栏（后台 Sidebar）

- 宽度：240px 展开 / 64px 折叠
- 背景：`bg-bg-secondary`
- 当前路由：`bg-primary-light text-primary` 高亮
- 分组标题：`text-xs uppercase text-text-tertiary`
- 折叠态只显示图标 + Tooltip

---

## 6. 图标

- **图标库**：Lucide Icons（`lucide-react`）
- **尺寸**：16px（内联）/ 20px（按钮）/ 24px（导航）/ 32px（空状态）
- **描边**：统一 1.5px stroke
- **颜色**：继承文字颜色 `currentColor`
- **不使用**：填充风格图标、多色图标（除品牌 Logo）

---

## 7. 阴影与圆角

### 7.1 阴影层级

| 层级 | Tailwind    | 用途               |
| ---- | ----------- | ------------------ |
| 无   | —           | 大部分元素         |
| sm   | `shadow-sm` | 输入框聚焦         |
| md   | `shadow-md` | 卡片悬停、弹窗     |
| lg   | `shadow-lg` | 下拉菜单、命令面板 |
| xl   | `shadow-xl` | 全屏模态           |

- 暗色模式阴影更柔和（背景本身已深）
- 不使用 `box-shadow` 硬编码，统一走 Tailwind

### 7.2 圆角

| 尺寸   | Tailwind       | 用途                 |
| ------ | -------------- | -------------------- |
| 4px    | `rounded`      | 内联代码、小按钮     |
| 8px    | `rounded-lg`   | 按钮、输入框、小卡片 |
| 12px   | `rounded-xl`   | 卡片、图片容器       |
| 16px   | `rounded-2xl`  | 弹窗、大面板         |
| 9999px | `rounded-full` | 头像、标签、圆形按钮 |

---

## 8. 动效规范

### 8.1 过渡时长

| 时长  | 用途                             |
| ----- | -------------------------------- |
| 100ms | 微交互（按钮缩放、颜色变化）     |
| 200ms | 弹出层（Toast、Dropdown）        |
| 300ms | 页面元素（侧边栏折叠、主题切换） |
| 500ms | 页面级过渡（view-transition）    |

### 8.2 缓动函数

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1); /* 通用 */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* 消失 */
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* 进入 */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性（少用） */
```

### 8.3 动效清单

| 元素       | 动画                                               |
| ---------- | -------------------------------------------------- |
| 页面切换   | `opacity 0→1` + `translateY 8px→0`，300ms ease-out |
| 卡片悬停   | `translateY 0→-2px` + `shadow` 增强，200ms         |
| 按钮点击   | `scale 1→0.97`，100ms                              |
| 侧边栏折叠 | `width` 过渡，300ms ease                           |
| Toast 进入 | `translateX 100%→0`，200ms ease-out                |
| 弹窗进入   | `scale 0.95→1` + `opacity 0→1`，200ms ease-out     |
| 列表项进入 | `opacity 0→1` + `translateY 12px→0`，stagger 50ms  |
| 主题切换   | `background-color` + `color` 过渡，300ms           |

### 8.4 无障碍

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 响应式设计

### 9.1 断点定义

Tailwind CSS 4 内置默认断点，无需额外配置。默认值如下：

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

如需自定义，可在 CSS 中通过 `@theme` 覆盖：

```css
@theme {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  /* ... */
}
```

### 9.2 适配策略

| 元素       | 移动 (< 768px)  | 平板 (≥ 768px) | 桌面 (≥ 1024px) |
| ---------- | --------------- | -------------- | --------------- |
| 导航       | 汉堡菜单 + 抽屉 | 横向导航       | 横向导航        |
| 文章列表   | 单列            | 双列           | 双列            |
| TOC 目录   | 折叠在文章顶部  | 右侧悬浮       | 右侧悬浮        |
| 后台侧边栏 | 抽屉模式        | 折叠图标       | 展开完整        |
| 弹窗       | 全屏 / 底部抽屉 | 居中弹窗       | 居中弹窗        |
| 图片网格   | 2 列            | 3 列           | 4 列            |

---

## 10. 设计 Token 与 Tailwind CSS 4 配置

### 10.1 CSS-first 配置（推荐）

Tailwind CSS 4 采用 CSS-first 配置方式，不再使用 `tailwind.config.ts`。所有 Design Token 通过 `@theme` 指令在 CSS 中定义：

```css
@import "tailwindcss";

/* ── Design Token 定义 ── */
@theme {
  /* 品牌色 */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-light: #dbeafe;

  /* 语义色 */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* 中性色 */
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  /* 字体 */
  --font-sans:
    "Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: "Noto Serif SC", "Georgia", serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Menlo", monospace;

  /* 容器 */
  --container-prose: 680px;

  /* 动效 */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── 暗色主题 Token ── */
[data-theme="dark"] {
  --color-primary-light: #1e3a5f;
  --color-bg: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;
  --color-border: #334155;
  --color-border-strong: #475569;
}
```

### 10.2 astro.config.mjs 中的 Tailwind 集成

Tailwind CSS 4 通过 Vite 插件集成，不使用 `@astrojs/tailwind`：

```js
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 10.3 排版插件

Tailwind CSS 4 使用 CSS 导入方式引入插件：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography"; /* 文章排版 prose 类 */
```

---

## 11. 可访问性（A11y）清单

| 要求       | 实现                                                         |
| ---------- | ------------------------------------------------------------ |
| 颜色对比度 | 正文 ≥ 4.5:1，大字 ≥ 3:1（WCAG AA）                          |
| 键盘导航   | 所有交互元素 `tabIndex` 可达，Enter/Space 触发               |
| 焦点指示   | `focus-visible:ring-2 ring-primary` 自定义 outline           |
| 图标标注   | 纯图标按钮必须有 `aria-label`                                |
| 图片替代   | `<img>` 必须有 `alt`，装饰图 `alt=""`                        |
| 表单关联   | `<label htmlFor>` 与 `<input id>` 配对                       |
| 错误提示   | `aria-describedby` 指向错误信息元素                          |
| 动态内容   | Toast 使用 `role="alert"` + `aria-live="polite"`             |
| 语义结构   | `<header>` `<main>` `<nav>` `<article>` `<aside>` `<footer>` |
| 减少动画   | `prefers-reduced-motion` 媒体查询                            |

---

## 12. 设计交付规范

- **设计稿工具**：Figma（推荐）或手写 SVG 线框
- **交付内容**：明/暗双主题、桌面/移动双尺寸、所有交互状态（hover/focus/active/disabled/loading/error/empty）
- **组件命名**：与 Tailwind 类名和 React 组件名保持一致
- **间距标注**：使用 4px 基础单位的倍数，不出现奇数值
- **颜色引用**：必须使用 Token 变量名，不直接标注 hex 值
