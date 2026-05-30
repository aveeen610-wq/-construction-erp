const express = require('express');
const router = express.Router();
const { login, adminLogin, getMe, register } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/register', register);
router.get('/me', authenticate, getMe);

module.exports = router;
