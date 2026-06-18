-- Active: 1781695461359@@127.0.0.1@3306
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '/images/default-avatar.png',
    category_id INTEGER,
    view_count INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tạo chỉ mục để tăng tốc truy vấn
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_published ON posts(is_published);

-- Thêm cột user_id vào bảng posts
ALTER TABLE posts ADD COLUMN user_id INTEGER;

-- Tạo chỉ mục cho user_id (tùy chọn, giúp truy vấn nhanh hơn)
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Nếu muốn khóa ngoại tham chiếu đến bảng users
-- (tùy chọn, nhưng khuyến nghị)
-- PRAGMA foreign_keys=ON;
-- ALTER TABLE posts ADD FOREIGN KEY (user_id) REFERENCES users(id);

-- Tạo admin với mật khẩu đã hash (mật khẩu: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, avatar_url)
VALUES (
    'admin',
    'admin@docustudy.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrBvJfqD3hJFjWXxX5gJnF9xVr6y1U2', -- admin123
    'Quản trị viên',
    'admin',
    '/images/default-avatar.png'
);

DELETE FROM users WHERE username = 'admin';

ALTER TABLE news ADD COLUMN content TEXT;

ALTER TABLE news ADD COLUMN is_published INTEGER DEFAULT 1;

UPDATE news SET is_published = 1 WHERE is_published IS NULL;
