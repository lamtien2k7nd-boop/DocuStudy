// middlewares/request_log.js
const enhancedTimeLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log khi request bắt đầu
    console.log(`[BẮT ĐẦU - ${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    
    // Lắng nghe sự kiện 'finish' để log khi response hoàn tất
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        console.log(`[KẾT THÚC - ${new Date().toLocaleString()}] ${req.method} ${req.url} - ${status} - ${duration}ms`);
    });
    
    // Xử lý lỗi nếu có
    res.on('error', (error) => {
        console.error(`[LỖI - ${new Date().toLocaleString()}] ${req.method} ${req.url} - ${error.message}`);
    });
    
    next();
};

module.exports = {
    enhancedTimeLogger
};