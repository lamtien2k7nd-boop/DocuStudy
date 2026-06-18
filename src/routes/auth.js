// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// ==================== ĐĂNG NHẬP/ĐĂNG KÝ THÔNG THƯỜNG ====================
router.post('/login', authController.postLogin);
router.post('/register', authController.postRegister);
router.get('/logout', authController.logout);

// ==================== TRANG PROFILE ====================
router.get('/profile', isLoggedIn, authController.getProfile);
router.post('/profile/update', isLoggedIn, authController.postUpdateProfile);
router.post('/profile/change-password', isLoggedIn, authController.postChangePassword);

// ==================== KIỂM TRA TRẠNG THÁI ====================
router.get('/status', authController.getAuthStatus);

// ==================== OAUTH: GOOGLE ====================
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user) {
            req.session.user = {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                full_name: req.user.full_name || req.user.username,
                avatar_url: req.user.avatar_url || '/images/default-avatar.png',
                role: req.user.role || 'user'
            };
        }
        res.redirect('/');
    }
);

// ==================== OAUTH: FACEBOOK ====================
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user) {
            req.session.user = {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                full_name: req.user.full_name || req.user.username,
                avatar_url: req.user.avatar_url || '/images/default-avatar.png',
                role: req.user.role || 'user'
            };
        }
        res.redirect('/');
    }
);

// ==================== OAUTH: DISCORD ====================
router.get('/discord', passport.authenticate('discord', { scope: ['identify', 'email'] }));

router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user) {
            req.session.user = {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                full_name: req.user.full_name || req.user.username,
                avatar_url: req.user.avatar_url || '/images/default-avatar.png',
                role: req.user.role || 'user'
            };
        }
        res.redirect('/');
    }
);

// ==================== OAUTH: GITHUB ====================
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        if (req.user) {
            req.session.user = {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                full_name: req.user.full_name || req.user.username,
                avatar_url: req.user.avatar_url || '/images/default-avatar.png',
                role: req.user.role || 'user'
            };
        }
        res.redirect('/');
    }
);

module.exports = router;