// middlewares/adminAuth.js
module.exports = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    // Nếu chưa đăng nhập admin, chuyển hướng về trang login
    res.redirect('/admin/login');
};
