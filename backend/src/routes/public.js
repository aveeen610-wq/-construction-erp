const express = require('express');
const router = express.Router();
const { getCompanies, getCompany, getWorks, getAds, getStats, getAllAnnouncements, getCompanyAnnouncements, sendContact, getMessages, markRead } = require('../controllers/publicController');
const { authenticate, checkRole } = require('../middleware/auth');

router.get('/companies', getCompanies);
router.get('/announcements', getAllAnnouncements);
router.get('/companies/:id', getCompany);
router.get('/companies/:id/announcements', getCompanyAnnouncements);
router.get('/works', getWorks);
router.get('/ads', getAds);
router.get('/stats', getStats);
router.post('/contact', sendContact);
router.get('/messages', authenticate, checkRole('super_admin'), getMessages);
router.put('/messages/:id/read', authenticate, checkRole('super_admin'), markRead);

module.exports = router;
