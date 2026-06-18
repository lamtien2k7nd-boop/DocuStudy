// routes/adminRoute.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

// Public Auth Routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected Admin Routes
router.use(adminAuth);

router.get('/dashboard', adminController.getDashboard);
router.get('/documents', adminController.getDocuments);
router.post('/documents/:id/delete', adminController.deleteDocument);
router.post('/documents/add-tag', adminController.addTopicItem);

// Tag Management Routes
router.get('/tags', adminController.getTags);
router.post('/tags/topic/add', adminController.addTopic);
router.post('/tags/topic/:id/delete', adminController.deleteTopic);
router.post('/tags/item/add', adminController.addTagItem);
router.post('/tags/item/:id/delete', adminController.deleteTagItem);

module.exports = router;
