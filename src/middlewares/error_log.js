// middlewares/error_log.js

// Middleware xử lý lỗi tổng quát
const errorHandler = (err, req, res, next) => {
    // Kiểm tra nếu headers đã được gửi
    if (res.headersSent) {
        return next(err);
    }
    
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Middleware xử lý 404
const notFoundHandler = (req, res, next) => {
    // Chỉ xử lý nếu chưa có response nào được gửi
    if (!res.headersSent) {
        res.status(404).json({
            success: false,
            message: 'Không tìm thấy đường dẫn: ' + req.originalUrl
        });
    }
};

// Thiết lập error logging cho app
const setupErrorLogging = (app) => {
    // Sử dụng error handler middleware
    app.use(errorHandler);
};

// Thiết lập 404 handler
const setupNotFoundHandler = (app) => {
    // 404 handler phải đặt TRƯỚC error handler
    app.use(notFoundHandler);
};

module.exports = {
    setupErrorLogging,
    setupNotFoundHandler,
    errorHandler,
    notFoundHandler
};