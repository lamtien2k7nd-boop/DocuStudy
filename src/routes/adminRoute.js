// routes/adminRoute.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');
const upload = require('../utils/fileUpload');

// Public Auth Routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected Admin Routes
router.use(adminAuth);

router.get('/dashboard', adminController.getDashboard);
router.get('/documents', adminController.getDocuments);
router.post('/documents/upload', upload.single('file'), adminController.postUploadDocument);
router.post('/documents/:id/delete', adminController.deleteDocument);
router.post('/documents/add-tag', adminController.addTopicItem);

// Exam Content Structure Management (Old Topics/Items)
router.get('/structure', adminController.getStructure);
router.post('/structure/topic/add', adminController.addStructureTopic);
router.post('/structure/topic/:id/delete', adminController.deleteStructureTopic);
router.post('/structure/item/add', adminController.addStructureItem);
router.post('/structure/item/:id/delete', adminController.deleteStructureItem);

// New Tag Management (Categories/Subcategories as tags)
router.get('/tags', adminController.getTags);
router.post('/tags/add', adminController.postAddTag);
router.post('/tags/delete', adminController.postDeleteTag);

module.exports = router;
