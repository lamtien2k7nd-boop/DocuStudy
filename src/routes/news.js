// routes/news.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Danh sách tin tức
router.get('/', newsController.getNewsList);

// Chi tiết tin tức
router.get('/:slug', newsController.getNewsDetail);

module.exports = router;