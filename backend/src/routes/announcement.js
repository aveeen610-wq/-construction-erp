const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticate, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, async (req, res) => {
  try {
    const all = await Announcement.find({ companyId: req.user.companyId });
    const now = new Date();
    const announcements = all.filter(a => {
      if (a.targetRole && a.targetRole !== 'all' && a.targetRole !== req.user.role) return false;
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;
      return true;
    });
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, checkRole('owner', 'manager'), upload.array('images', 10), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => '/' + f.path.replace(/\\/g, '/')) : [];
    const announcement = await Announcement.create({
      ...req.body,
      images,
      companyId: req.user.companyId,
      createdBy: req.user.userId
    });
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
