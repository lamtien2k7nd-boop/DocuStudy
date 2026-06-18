const express = require('express');
const router = express.Router();
const path = require('path');
const trangchuController = require ("../controllers/trangchuController")
const authController = require("../controllers/authController");
const { isLoggedIn } = require("../middlewares/authMiddleware");

router.get('/', trangchuController.getTrangchu);

// Auth routes
router.post('/login', authController.postLogin);
router.post('/register', authController.postRegister);
router.get('/logout', authController.logout);
router.get('/profile', isLoggedIn, authController.getProfile);
router.post('/change-password', isLoggedIn, authController.postChangePassword);

module.exports = router;