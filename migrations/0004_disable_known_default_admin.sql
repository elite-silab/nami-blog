-- 禁用仍在使用公开默认密码的管理员账号。
-- 已修改密码的账号不会匹配此哈希；新环境的 0003 已不再创建该账号。
UPDATE users
SET status = 'disabled', updated_at = datetime('now')
WHERE username = 'admin'
  AND password_hash = '$2b$10$nyhhqa07kaOJOHNGeEQxIu6cxauFp608ZqJwQuxO7mFEMZH/ICWhu';
