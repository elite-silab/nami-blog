/**
 * 主题系统测试
 */
import { describe, it, expect } from "vitest";
import {
  THEMES,
  DEFAULT_THEME,
  isThemeId,
  readThemePreference,
  THEME_INIT_SCRIPT,
  type ThemeId,
} from "./theme";

describe("主题系统", () => {
  describe("THEMES 数组", () => {
    it("应包含 3 套主题", () => {
      expect(THEMES).toHaveLength(3);
    });

    it("每套主题应有完整的元数据", () => {
      for (const theme of THEMES) {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.emoji).toBeDefined();
        expect(theme.description).toBeDefined();
        expect(theme.colors).toBeDefined();
        expect(theme.darkColors).toBeDefined();
      }
    });

    it("应包含 sakura / ocean / starry 三个主题 ID", () => {
      const ids = THEMES.map((t) => t.id);
      expect(ids).toContain("sakura");
      expect(ids).toContain("ocean");
      expect(ids).toContain("starry");
    });

    it("每套主题的颜色字段必须完整", () => {
      const requiredColorKeys = [
        "primary",
        "bg",
        "bgSecondary",
        "text",
        "accent",
      ];
      for (const theme of THEMES) {
        for (const key of requiredColorKeys) {
          expect(theme.colors).toHaveProperty(key);
          expect(theme.darkColors).toHaveProperty(key);
        }
      }
    });

    it("颜色值应为有效的 hex 格式", () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      for (const theme of THEMES) {
        for (const color of Object.values(theme.colors)) {
          expect(color).toMatch(hexRegex);
        }
        for (const color of Object.values(theme.darkColors)) {
          expect(color).toMatch(hexRegex);
        }
      }
    });
  });

  describe("DEFAULT_THEME", () => {
    it("默认主题应为 sakura", () => {
      expect(DEFAULT_THEME).toBe("sakura");
    });

    it("默认主题应在 THEMES 中存在", () => {
      const found = THEMES.find((t) => t.id === DEFAULT_THEME);
      expect(found).toBeDefined();
    });
  });

  describe("ThemeId 类型约束", () => {
    it("只允许三个有效 ID", () => {
      const validIds: ThemeId[] = ["sakura", "ocean", "starry"];
      expect(validIds).toHaveLength(3);
    });

    it("应拒绝未知的主题 ID", () => {
      expect(isThemeId("ocean")).toBe(true);
      expect(isThemeId("dark")).toBe(false);
      expect(isThemeId(null)).toBe(false);
    });
  });

  describe("访客主题偏好", () => {
    it("应读取三个有效的本机主题", () => {
      expect(readThemePreference("sakura")).toBe("sakura");
      expect(readThemePreference("ocean")).toBe("ocean");
      expect(readThemePreference("starry")).toBe("starry");
    });

    it("未设置或值无效时应跟随站点", () => {
      expect(readThemePreference(null)).toBe("site");
      expect(readThemePreference("")).toBe("site");
      expect(readThemePreference("unknown")).toBe("site");
    });

    it("首屏脚本只应应用有效主题", () => {
      expect(THEME_INIT_SCRIPT).toContain("theme === 'sakura'");
      expect(THEME_INIT_SCRIPT).toContain("theme === 'ocean'");
      expect(THEME_INIT_SCRIPT).toContain("theme === 'starry'");
    });
  });

  describe("主题名称和 emoji", () => {
    it("sakura 应为樱花主题", () => {
      const sakura = THEMES.find((t) => t.id === "sakura")!;
      expect(sakura.name).toBe("樱花");
      expect(sakura.emoji).toBe("🌸");
    });

    it("ocean 应为海洋主题", () => {
      const ocean = THEMES.find((t) => t.id === "ocean")!;
      expect(ocean.name).toBe("海洋");
      expect(ocean.emoji).toBe("🌊");
    });

    it("starry 应为星空主题", () => {
      const starry = THEMES.find((t) => t.id === "starry")!;
      expect(starry.name).toBe("星空");
      expect(starry.emoji).toBe("✨");
    });
  });
});
