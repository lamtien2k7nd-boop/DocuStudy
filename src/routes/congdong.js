// routes/congdong.js
const express = require('express');
const router = express.Router();
const congdongController = require('../controllers/congdongController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// Trang chính cộng đồng
router.get('/', congdongController.getCongDong);

// Xử lý đăng bài (yêu cầu đăng nhập)
router.post('/dang-bai', isLoggedIn, congdongController.postBaiViet);

// Chi tiết bài viết
router.get('/bai-viet/:id', congdongController.getChiTietBaiViet);

module.exports = router;