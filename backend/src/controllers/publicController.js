const Company = require('../models/Company');
const PortfolioWork = require('../models/PortfolioWork');
const PlatformAd = require('../models/PlatformAd');
const ContactMessage = require('../models/ContactMessage');
const Project = require('../models/Project');
const User = require('../models/User');
const Announcement = require('../models/Announcement');

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company || company.status !== 'active') {
      return res.status(404).json({ error: 'Company not found' });
    }
    const works = await PortfolioWork.find({ companyId: company._id, isFeatured: true });
    res.json({ company, works });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWorks = async (req, res) => {
  try {
    const { category, companyId } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (companyId) filter.companyId = companyId;

    let works = await PortfolioWork.find(filter);
    for (let w of works) {
      if (w.companyId) {
        w.company = await Company.findById(w.companyId);
      }
    }
    works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAds = async (req, res) => {
  try {
    const allAds = await PlatformAd.find({});
    const ads = allAds.filter(a => a.active && (a.target === 'all' || a.target === 'landing'));
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'الاسم والرسالة مطلوبان' });

    await ContactMessage.create({
      name, email: email || '', phone: phone || '', message,
      read: false,
      createdAt: new Date()
    });

    res.status(201).json({ message: 'تم إرسال رسالتك' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    let msgs = await ContactMessage.find({});
    msgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    const msg = await ContactMessage.findOneAndUpdate(
      { _id: req.params.id },
      { read: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    const allProjects = await Project.find({});
    const allUsers = await User.find({});
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'completed');

    res.json({
      companies: companies.length,
      projects: activeProjects.length,
      employees: allUsers.filter(u => u.role !== 'owner').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    const companyIds = companies.map(c => c._id);
    const all = await Announcement.find({});
    const now = new Date();
    const announcements = all.filter(a => {
      if (!companyIds.includes(a.companyId)) return false;
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;
      return true;
    });
    for (let ann of announcements) {
      if (ann.companyId) {
        ann.company = await Company.findById(ann.companyId);
      }
    }
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCompanyAnnouncements = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company || company.status !== 'active') {
      return res.status(404).json({ error: 'Company not found' });
    }
    const all = await Announcement.find({ companyId: req.params.id });
    const now = new Date();
    const announcements = all.filter(a => {
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;
      return true;
    });
    announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCompanies, getCompany, getWorks, getAds, getAllAnnouncements, getCompanyAnnouncements, sendContact, getMessages, markRead, getStats };
