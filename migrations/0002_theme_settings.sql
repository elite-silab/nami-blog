-- 移除旧的 theme_default 设置
DELETE FROM site_settings WHERE key = 'theme_default';

-- 插入新的二次元主题设置（默认樱花）
INSERT OR IGNORE INTO site_settings (key, value) VALUES
    ('site_theme', '"sakura"');
