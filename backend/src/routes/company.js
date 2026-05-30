const express = require('express');
const router = express.Router();
const { getDashboard, getAlerts, getEmployees, addEmployee, updateEmployee, deleteEmployee, updatePermissions, getProfile, updateProfile, uploadLogo } = require('../controllers/companyController');
const { authenticate, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Company = require('../models/Company');
const User = require('../models/User');

router.get('/dashboard', authenticate, getDashboard);
router.get('/alerts', authenticate, getAlerts);
router.get('/employees', authenticate, getEmployees);
router.post('/employees', authenticate, checkRole('owner', 'manager'), addEmployee);
router.put('/employees/:id', authenticate, checkRole('owner', 'manager'), updateEmployee);
router.delete('/employees/:id', authenticate, checkRole('owner'), deleteEmployee);
router.put('/permissions/:id', authenticate, checkRole('owner'), updatePermissions);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, checkRole('owner'), updateProfile);
router.post('/logo', authenticate, checkRole('owner'), upload.single('logo'), uploadLogo);

router.post('/register', async (req, res) => {
  try {
    const company = await Company.create(req.body);

    const admin = await User.create({
      companyId: company._id,
      fullName: req.body.ownerName || 'Company Owner',
      email: req.body.contactInfo?.email || req.body.email || '',
      username: 'admin',
      password: req.body.ownerPassword || 'admin123',
      role: 'owner',
      permissions: ['all'],
      status: 'active'
    });

    company.ownerId = admin._id;
    await company.save();

    res.status(201).json({ message: 'Company registered, pending approval', companyId: company._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const { status } = req.body;
    const company = await Company.findByIdAndUpdate(req.params.id, { status });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    company.status = status;
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const companies = await Company.find({});
    companies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
