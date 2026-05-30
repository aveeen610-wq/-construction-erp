const express = require('express');
const router = express.Router();
const { getPortfolio, createPortfolio } = require('../controllers/portfolioController');
const { authenticate, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, getPortfolio);
router.post('/', authenticate, checkRole('owner', 'manager'), upload.array('images', 10), createPortfolio);

module.exports = router;
