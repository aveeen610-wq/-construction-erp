const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const Company = require('../models/Company');
const PlatformAdmin = require('../models/PlatformAdmin');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const login = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const company = user.companyId ? await Company.findById(user.companyId) : null;
    if (user.companyId && (!company || company.status !== 'active')) {
      return res.status(401).json({ error: 'Your company is not active yet. Please wait for admin approval.' });
    }

    const token = generateToken({
      userId: user._id,
      companyId: user.companyId || null,
      role: user.role,
      permissions: user.permissions || [],
      companyName: company?.name || ''
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        companyId: user.companyId || null,
        companyName: company?.name || ''
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const register = async (req, res) => {
  try {
    const schema = Joi.object({
      fullName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      companyName: Joi.string().required(),
      phone: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const company = await Company.create({
      name: req.body.companyName,
      commercialReg: 'TEMP-' + Date.now(),
      description: '',
      contactInfo: { phone: req.body.phone || '', email: req.body.email },
      status: 'pending'
    });

    const user = await User.create({
      companyId: company._id,
      fullName: req.body.fullName,
      email: req.body.email,
      username: req.body.email.split('@')[0],
      password: req.body.password,
      phone: req.body.phone || '',
      role: 'owner',
      permissions: ['all'],
      status: 'active'
    });

    company.ownerId = user._id;
    await company.save();

    res.status(201).json({
      message: 'Company registered successfully. Please wait for admin approval to activate your account.',
      companyId: company._id,
      companyName: company.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const admin = await PlatformAdmin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({
      userId: admin._id,
      role: 'super_admin',
      permissions: ['all']
    });

    res.json({
      token,
      user: { id: admin._id, fullName: admin.fullName, email: admin.email, role: 'super_admin' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    if (req.user.role === 'super_admin') {
      const admin = await PlatformAdmin.findById(req.user.userId);
      if (admin) delete admin.password;
      return res.json(admin);
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    delete user.password;
    const company = user.companyId ? await Company.findById(user.companyId) : null;
    res.json({ ...user, companyName: company?.name || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, register, adminLogin, getMe };
