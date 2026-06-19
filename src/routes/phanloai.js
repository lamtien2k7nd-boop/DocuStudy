// routes/phanloai.js
const express = require('express');
const router = express.Router();
const phanloaiController = require('../controllers/phanloaiController');
const detheophanloaiController = require('../controllers/detheophanloaiController');
const chitietdeController = require('../controllers/chitietdeController');
const searchController = require('../controllers/searchController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// Route tìm kiếm
router.get('/api/search', searchController.apiSearch);

// Route thêm comment
router.post('/:slug/comment', isLoggedIn, chitietdeController.postComment);

// Route chi tiết đề: /phanloai/:subcategorySlug/:docSlug (Ưu tiên trước)
router.get('/:subcategorySlug/:docSlug', chitietdeController.getChiTietDe);

// Route danh sách theo subcategory: /phanloai/:target_id
router.get('/:target_id', detheophanloaiController.getDetheophanloai);

// Route trang danh mục chính: /phanloai
router.get('/', phanloaiController.getPhanloai);

module.exports = router;