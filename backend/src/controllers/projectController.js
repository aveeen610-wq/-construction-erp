const Project = require('../models/Project');
const User = require('../models/User');
const InventoryTransaction = require('../models/InventoryTransaction');
const InventoryItem = require('../models/InventoryItem');
const Joi = require('joi');

const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    let allProjects = await Project.find({ companyId: req.user.companyId });

    if (status) allProjects = allProjects.filter(p => p.status === status);
    if (req.user.role === 'engineer') {
      allProjects = allProjects.filter(p =>
        (p.assignedCivilEngineers || []).includes(req.user.userId) ||
        (p.assignedArchEngineers || []).includes(req.user.userId) ||
        (p.assignedEngineers || []).includes(req.user.userId)
      );
    }
    if (search) {
      allProjects = allProjects.filter(p =>
        (p.title && p.title.includes(search)) ||
        (p.clientName && p.clientName.includes(search)) ||
        (p.location && p.location.includes(search))
      );
    }

    allProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = allProjects.length;
    const paged = allProjects.slice((page - 1) * limit, page * limit);

    for (let p of paged) {
      p.totalSpent = (p.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      if (p.assignedCivilEngineers && p.assignedCivilEngineers.length) {
        const civils = [];
        for (let eid of p.assignedCivilEngineers) {
          const eng = await User.findById(eid);
          if (eng) civils.push({ _id: eng._id, fullName: eng.fullName });
        }
        p.civilEngineers = civils;
      }
      if (p.assignedArchEngineers && p.assignedArchEngineers.length) {
        const archs = [];
        for (let eid of p.assignedArchEngineers) {
          const eng = await User.findById(eid);
          if (eng) archs.push({ _id: eng._id, fullName: eng.fullName });
        }
        p.archEngineers = archs;
      }
    }

    res.json({ projects: paged, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.totalSpent = (project.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

    const resolveUsers = async (ids) => {
      if (!ids || !ids.length) return [];
      const result = [];
      for (let id of ids) {
        const u = await User.findById(id);
        if (u) result.push({ _id: u._id, fullName: u.fullName, email: u.email, phone: u.phone, jobTitle: u.jobTitle });
      }
      return result;
    };

    project.civilEngineers = await resolveUsers(project.assignedCivilEngineers);
    project.archEngineers = await resolveUsers(project.assignedArchEngineers);
    project.engineers = await resolveUsers(project.assignedEngineers);
    project.workers = await resolveUsers(project.assignedWorkers);

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().required(),
      titleAr: Joi.string().allow(''),
      description: Joi.string().allow(''),
      descriptionAr: Joi.string().allow(''),
      clientName: Joi.string().allow(''),
      clientPhone: Joi.string().allow(''),
      location: Joi.string().allow(''),
      budget: Joi.number().default(0),
      startDate: Joi.date(),
      endDate: Joi.date(),
      status: Joi.string().valid('planned', 'active', 'on_hold', 'completed', 'cancelled').default('planned'),
      assignedCivilEngineers: Joi.array().items(Joi.string()),
      assignedArchEngineers: Joi.array().items(Joi.string()),
      assignedEngineers: Joi.array().items(Joi.string()),
      assignedWorkers: Joi.array().items(Joi.string()),
      workshops: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        specialization: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        contactPerson: Joi.string().allow('')
      })),
      machinery: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        type: Joi.string().allow(''),
        quantity: Joi.number().default(1),
        rentalCost: Joi.number().default(0),
        hoursWorked: Joi.number().default(0)
      })),
      phases: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        nameAr: Joi.string().allow(''),
        progress: Joi.number().default(0),
        cost: Joi.number().default(0),
        notes: Joi.string().allow(''),
        startDate: Joi.date(),
        endDate: Joi.date()
      }))
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.create({
      ...req.body,
      expenses: [],
      companyId: req.user.companyId
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.progress = progress;
    if (progress >= 100) {
      project.status = 'completed';
    } else if (project.status === 'completed') {
      project.status = 'active';
    }
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.attachments) project.attachments = [];
    project.attachments.push('/' + req.file.path.replace(/\\/g, '/'));
    await project.save();

    res.json({ message: 'File uploaded', file: req.file.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const schema = Joi.object({
      description: Joi.string().required(),
      amount: Joi.number().required().min(0),
      date: Joi.date().default(new Date()),
      category: Joi.string().valid('materials', 'labor', 'machinery', 'workshop', 'transport', 'permits', 'other').default('other')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.expenses) project.expenses = [];
    project.expenses.push({
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      description: req.body.description,
      amount: req.body.amount,
      date: req.body.date || new Date().toISOString().split('T')[0],
      category: req.body.category
    });
    await project.save();

    res.status(201).json({ message: 'Expense added', expenses: project.expenses, totalSpent: project.expenses.reduce((s, e) => s + e.amount, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProjectReport = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const totalSpent = (project.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const budgetRemaining = (project.budget || 0) - totalSpent;

    const materialTransactions = await InventoryTransaction.find({
      companyId: req.user.companyId,
      projectId: req.params.id,
      type: 'out'
    });

    let totalMaterialsCost = 0;
    const materialsUsed = [];
    for (let t of materialTransactions) {
      const item = t.itemId ? await InventoryItem.findById(t.itemId) : null;
      const cost = (t.qty || 0) * (t.unitPrice || 0);
      totalMaterialsCost += cost;
      if (item) {
        materialsUsed.push({ itemName: item.name, itemCode: item.code, qty: t.qty, unitPrice: t.unitPrice, cost, date: t.date });
      }
    }

    const expenseByCategory = {};
    for (let e of (project.expenses || [])) {
      const cat = e.category || 'other';
      if (!expenseByCategory[cat]) expenseByCategory[cat] = 0;
      expenseByCategory[cat] += e.amount;
    }

    const phasesSummary = (project.phases || []).map(p => ({
      name: p.name,
      nameAr: p.nameAr,
      progress: p.progress,
      cost: p.cost
    }));

    res.json({
      project: {
        _id: project._id,
        title: project.title,
        titleAr: project.titleAr,
        status: project.status,
        progress: project.progress,
        clientName: project.clientName,
        location: project.location,
        startDate: project.startDate,
        endDate: project.endDate
      },
      budget: project.budget || 0,
      totalSpent,
      budgetRemaining,
      phasesSummary,
      expenseByCategory,
      expenses: project.expenses || [],
      materialsUsed,
      totalMaterialsCost,
      workshopsCount: (project.workshops || []).length,
      machineryCount: (project.machinery || []).length,
      civilEngineersCount: (project.assignedCivilEngineers || []).length,
      archEngineersCount: (project.assignedArchEngineers || []).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const resolveUsers = async (ids) => {
      if (!ids || !ids.length) return [];
      const result = [];
      for (let id of ids) {
        const u = await User.findById(id);
        if (u) result.push({ _id: u._id, fullName: u.fullName, email: u.email, jobTitle: u.jobTitle });
      }
      return result;
    };

    res.json({
      civilEngineers: await resolveUsers(project.assignedCivilEngineers),
      archEngineers: await resolveUsers(project.assignedArchEngineers),
      engineers: await resolveUsers(project.assignedEngineers),
      workers: await resolveUsers(project.assignedWorkers),
      workshops: project.workshops || [],
      machinery: project.machinery || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMaterial = async (req, res) => {
  try {
    const schema = Joi.object({
      itemId: Joi.string().required(),
      quantity: Joi.number().required().min(1),
      unitPrice: Joi.number().required().min(0)
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const item = await InventoryItem.findOne({ _id: req.body.itemId, companyId: req.user.companyId });
    if (!item) return res.status(404).json({ error: 'Item not found in inventory' });

    if (item.currentQty < req.body.quantity) {
      return res.status(400).json({ error: `الكمية المتبقية في المخزون ${item.currentQty} ${item.unit || ''} فقط` });
    }

    item.currentQty -= req.body.quantity;
    await item.save();

    await InventoryTransaction.create({
      companyId: req.user.companyId,
      itemId: item._id,
      itemName: item.name,
      type: 'out',
      quantity: req.body.quantity,
      unitPrice: req.body.unitPrice,
      total: req.body.quantity * req.body.unitPrice,
      projectId: project._id,
      projectName: project.title || project.name,
      userId: req.user.userId,
      date: new Date().toISOString().split('T')[0],
      notes: `صرف للمشروع: ${project.title || project.name}`
    });

    if (!project.materials) project.materials = [];
    project.materials.push({
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      itemId: item._id,
      itemName: item.name,
      itemCode: item.code,
      quantity: req.body.quantity,
      unitPrice: req.body.unitPrice,
      total: req.body.quantity * req.body.unitPrice,
      date: new Date().toISOString().split('T')[0]
    });

    if (!project.expenses) project.expenses = [];
    project.expenses.push({
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      description: `مادة: ${item.name} (${req.body.quantity} ${item.unit || 'قطعة'} × ${req.body.unitPrice})`,
      amount: req.body.quantity * req.body.unitPrice,
      date: new Date().toISOString().split('T')[0],
      category: 'materials'
    });

    await project.save();

    res.status(201).json({
      message: 'تمت إضافة المادة وخصمها من المخزون',
      material: project.materials[project.materials.length - 1],
      remainingQty: item.currentQty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, updateProgress, uploadFile, getTeam, addExpense, getProjectReport, addMaterial };
