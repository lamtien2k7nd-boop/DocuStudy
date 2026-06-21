require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Import middlewares
const errorLog = require('./middlewares/error_log');
const requestLog = require('./middlewares/request_log');

// Import Passport config
require('./config/passport');

const app = express();

// ===== SESSION & PASSPORT =====
// Chỉ dùng MỘT middleware session
app.use(session({
    secret: process.env.SESSION_SECRET || 'docustudy_secret_key_098123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // nếu dùng HTTPS thì set true
}));

// Passport (đặt NGAY SAU session)
app.use(passport.initialize());
app.use(passport.session());

// Middleware inject user vào tất cả view (đặt SAU Passport)
// Middleware inject user vào tất cả view (đặt SAU Passport)
app.use((req, res, next) => {
    const user = req.user || req.session.user || null;
    res.locals.user = user;
    res.locals.isLoggedIn = !!user;
    next();
});

// ===== QUAN TRỌNG: Middlewares phải khai báo TRƯỚC routes =====

// 1. Middleware xử lý JSON (đặt trước routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Middleware phục vụ file tĩnh
app.use(express.static(path.join(__dirname, '/public')));
app.use('/doccuments', express.static(path.join(__dirname, '../doccuments')));


// 3. Middleware log request
app.use(requestLog.enhancedTimeLogger);

// 4. View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ===== Routes =====
const trangchuRouter = require('./routes/trangchu');
app.use('/', trangchuRouter);

const phanloaiRouter = require('./routes/phanloai');
app.use('/phanloai', phanloaiRouter);

const congdongRouter = require('./routes/congdong');
app.use('/congdong', congdongRouter);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// server.js - thêm sau các route khác
const newsRouter = require('./routes/news');
app.use('/tin-tuc', newsRouter);

// Download route
const authController = require('./controllers/authController');
app.get('/download/:id', async (req, res) => {
    try {
        const db = require('./config/database');
        const doc = await db.get(`
            SELECT d.*, s.target_id as sub_target 
            FROM documents d 
            LEFT JOIN subcategories s ON d.subcategory_id = s.id 
            WHERE d.id = ?`, [req.params.id]);

        if (!doc) return res.status(404).send('File not found');
        
        // Prevent redirect loop if link is '#' or empty
        if (!doc.download_link || doc.download_link === '#' || doc.download_link.trim() === '') {
            if (doc.sub_target && doc.slug) {
                return res.redirect(`/phanloai/${doc.sub_target}/${doc.slug}?msg=Link+đang+được+cập+nhật`);
            }
            return res.status(400).send('Tài liệu hiện chưa có link tải. Vui lòng quay lại sau.');
        }
        
        // Log download
        db.run('UPDATE documents SET download_count = download_count + 1 WHERE id = ?', [doc.id]);
        if (req.user || req.session.user) {
            const userId = (req.user ? req.user.id : req.session.user.id);
            db.run('INSERT INTO access_logs (user_id, document_id, type) VALUES (?, ?, "download")', 
                [userId, doc.id]);
        }
        
        // Redirect to actual file link
        res.redirect(doc.download_link);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).send('Server Error');
    }
});

const adminRouter = require('./routes/adminRoute');
app.use('/admin', adminRouter);

// ===== Error handlers (đặt SAU routes) =====
// 404 handler
errorLog.setupNotFoundHandler(app);
// Error logging middleware
errorLog.setupErrorLogging(app);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log('Nhấn Ctrl+C để dừng server');
});