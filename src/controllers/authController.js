// controllers/authController.js
const { get, run, query } = require('../config/database');
const bcrypt = require('bcryptjs');

// ==================== ĐĂNG NHẬP ====================
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        // Tìm người dùng theo email hoặc username
        const user = await get('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
        
        if (!user) {
            return res.json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        // Kiểm tra nếu user đăng nhập bằng OAuth (không có password_hash)
        if (!user.password_hash) {
            return res.json({ 
                success: false, 
                message: 'Tài khoản này được đăng ký bằng mạng xã hội. Vui lòng đăng nhập bằng Google/Facebook/Discord/GitHub!' 
            });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.json({ success: false, message: 'Mật khẩu không chính xác!' });
        }

        // Lưu thông tin vào session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name || user.username,
            avatar_url: user.avatar_url || '/images/default-avatar.png'
        };

        // ✅ Thêm logic kiểm tra admin
        if (user.role === 'admin') {
            req.session.isAdmin = true;
            return res.json({ success: true, redirect: '/admin/dashboard' });
        }

        res.json({ success: true, redirect: '/' });
    } catch (error) {
        console.error('Login Error:', error);
        res.json({ success: false, message: 'Lỗi hệ thống!' });
    }
};

// ==================== ĐĂNG KÝ ====================
exports.postRegister = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.json({ success: false, message: 'Email này đã được sử dụng!' });
        }

        // Tạo username từ full_name hoặc email
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu người dùng mới
        const result = await run(
            'INSERT INTO users (username, email, password_hash, full_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, 'user', '/images/default-avatar.png']
        );

        const newUser = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);

        // Tự động đăng nhập
        req.session.user = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            full_name: newUser.full_name || newUser.username,
            avatar_url: newUser.avatar_url || '/images/default-avatar.png'
        };

        res.json({ success: true, message: 'Đăng ký thành công!', redirect: '/' });
    } catch (error) {
        console.error('Register Error:', error);
        res.json({ success: false, message: 'Đăng ký thất bại! Lỗi hệ thống.' });
    }
};

// ==================== ĐĂNG XUẤT ====================
exports.logout = (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        // Hủy session
        req.session.destroy((destroyErr) => {
            if (destroyErr) console.error('Session destroy error:', destroyErr);
            res.redirect('/');
        });
    });
};

// ==================== HỒ SƠ NGƯỜI DÙNG ====================
exports.getProfile = async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/');
        }

        // Thống kê (nếu có bảng access_logs)
        let stats = { views: 0, downloads: 0 };
        try {
            const views = await get('SELECT COUNT(*) as count FROM access_logs WHERE user_id = ? AND type = "view"', [user.id]);
            const downloads = await get('SELECT COUNT(*) as count FROM access_logs WHERE user_id = ? AND type = "download"', [user.id]);
            stats = {
                views: views?.count || 0,
                downloads: downloads?.count || 0
            };
        } catch (e) {
            // Bỏ qua nếu chưa có bảng access_logs
        }

        // Lấy số bài viết đã đăng
        let postCount = 0;
        try {
            const posts = await get('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [user.id]);
            postCount = posts?.count || 0;
        } catch (e) {
            // Bỏ qua nếu chưa có bảng posts
        }

        res.render('profile', { 
            title: 'Hồ sơ người dùng',
            profileUser: {
                ...user,
                full_name: user.full_name || user.username
            },
            stats: {
                views: stats.views,
                downloads: stats.downloads,
                posts: postCount
            },
            isLoggedIn: !!req.session.user
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).render('error', {
            title: 'Lỗi',
            message: 'Không thể tải hồ sơ người dùng',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// ==================== ĐỔI MẬT KHẨU ====================
exports.postChangePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!req.session.user) {
        return res.json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const userId = req.session.user.id;

    try {
        const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
        
        // Nếu user không có password_hash (đăng ký bằng OAuth)
        if (!user || !user.password_hash) {
            return res.json({ 
                success: false, 
                message: 'Tài khoản này đăng ký bằng mạng xã hội. Không thể đổi mật khẩu!' 
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, userId]);
        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.json({ success: false, message: 'Đổi mật khẩu thất bại!' });
    }
};

// ==================== CẬP NHẬT HỒ SƠ ====================
exports.postUpdateProfile = async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const { full_name, avatar_url } = req.body;
    const userId = req.session.user.id;

    try {
        await run(
            'UPDATE users SET full_name = ?, avatar_url = ? WHERE id = ?',
            [full_name || null, avatar_url || '/images/default-avatar.png', userId]
        );

        // Cập nhật session
        req.session.user.full_name = full_name || req.session.user.username;
        req.session.user.avatar_url = avatar_url || '/images/default-avatar.png';

        res.json({ success: true, message: 'Cập nhật hồ sơ thành công!' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.json({ success: false, message: 'Cập nhật thất bại!' });
    }
};

// ==================== KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ====================
exports.getAuthStatus = (req, res) => {
    if (req.session.user) {
        return res.json({
            success: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                email: req.session.user.email,
                full_name: req.session.user.full_name || req.session.user.username,
                avatar_url: req.session.user.avatar_url || '/images/default-avatar.png',
                role: req.session.user.role
            }
        });
    }
    res.json({ success: false, user: null });
};