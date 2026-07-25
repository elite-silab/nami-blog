/**
 * 主题系统
 *
 * 三套二次元风格主题 + 独立 Dark 模式开关。
 * - data-theme 选择主题色彩（sakura / ocean / starry）
 * - data-dark   切换明暗模式（true = 暗色）
 *
 * 两套属性独立运作，任意组合。
 */

export type ThemeId = "sakura" | "ocean" | "starry";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  colors: {
    primary: string;
    bg: string;
    bgSecondary: string;
    text: string;
    accent: string;
  };
  darkColors: {
    primary: string;
    bg: string;
    bgSecondary: string;
    text: string;
    accent: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "sakura",
    name: "樱花",
    emoji: "🌸",
    description: "春日樱花，温柔浪漫",
    colors: {
      primary: "#ec4899",
      bg: "#fffafc",
      bgSecondary: "#fef2f7",
      text: "#1a0a12",
      accent: "#f472b6",
    },
    darkColors: {
      primary: "#f472b6",
      bg: "#1a0a12",
      bgSecondary: "#2a1520",
      text: "#f5e0ea",
      accent: "#ec4899",
    },
  },
  {
    id: "ocean",
    name: "海洋",
    emoji: "🌊",
    description: "蔚蓝深海，清凉通透",
    colors: {
      primary: "#0891b2",
      bg: "#f8fdfe",
      bgSecondary: "#f0fdfa",
      text: "#0a1a1f",
      accent: "#06b6d4",
    },
    darkColors: {
      primary: "#22d3ee",
      bg: "#0a1a1f",
      bgSecondary: "#0f2a32",
      text: "#e0f5f8",
      accent: "#0891b2",
    },
  },
  {
    id: "starry",
    name: "星空",
    emoji: "✨",
    description: "深邃宇宙，星辰闪烁",
    colors: {
      primary: "#8b5cf6",
      bg: "#f8f7ff",
      bgSecondary: "#f0eeff",
      text: "#1a1a2e",
      accent: "#a78bfa",
    },
    darkColors: {
      primary: "#a78bfa",
      bg: "#0a0a1a",
      bgSecondary: "#12122a",
      text: "#e8e8f0",
      accent: "#8b5cf6",
    },
  },
];

export const DEFAULT_THEME: ThemeId = "sakura";

/**
 * 浏览器端初始化脚本（内联在 <head> 中执行，避免闪烁）
 * 同时处理主题 + Dark 模式
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('nami-theme');
    if (theme) document.documentElement.setAttribute('data-theme', theme);
    var dark = localStorage.getItem('nami-dark');
    if (dark === 'true') document.documentElement.setAttribute('data-dark', 'true');
  } catch(e) {}
})();
`;
