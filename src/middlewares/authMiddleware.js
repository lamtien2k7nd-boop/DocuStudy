// src/middlewares/authMiddleware.js

exports.isLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    
    // If it's an AJAX request, return JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện hành động này!' });
    }
    
    // Otherwise redirect to home (where the login modal can be triggered)
    res.redirect('/');
};

exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập trang này!' });
    }
    
    res.status(403).send('Access Denied: Admin only');
};
