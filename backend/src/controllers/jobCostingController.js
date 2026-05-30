const CostCode = require('../models/CostCode');
const JobBudget = require('../models/JobBudget');
const JobCostEntry = require('../models/JobCostEntry');
const ProgressBill = require('../models/ProgressBill');
const ChangeOrder = require('../models/ChangeOrder');
const Project = require('../models/Project');
const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const Joi = require('joi');

const DEFAULT_COST_CODES = [
  { code: '01-1000', name: 'الخرسانة المسلحة', category: 'materials' },
  { code: '01-2000', name: 'حديد التسليح', category: 'materials' },
  { code: '01-3000', name: 'السبكة والأنابيب', category: 'materials' },
  { code: '02-1000', name: 'عمالة نجارة', category: 'labor' },
  { code: '02-2000', name: 'عمالة حدادة', category: 'labor' },
  { code: '02-3000', name: 'عمالة كهرباء', category: 'labor' },
  { code: '02-4000', name: 'عمالة سباكة', category: 'labor' },
  { code: '03-1000', name: 'تأجير معدات ثقيلة', category: 'equipment' },
  { code: '03-2000', name: 'وقود وصيانة المعدات', category: 'equipment' },
  { code: '04-1000', name: 'مقاولين من الباطن — كهرباء', category: 'subcontractor' },
  { code: '04-2000', name: 'مقاولين من الباطن — سباكة', category: 'subcontractor' },
  { code: '05-1000', name: 'مصاريف إدارية مشروع', category: 'overhead' },
  { code: '05-2000', name: 'تراخيص ورسوم', category: 'overhead' },
  { code: '06-1000', name: 'أعمال التشطيبات', category: 'materials' },
  { code: '07-1000', name: 'أعمال العزل', category: 'materials' }
];

const seedCostCodes = async (companyId) => {
  const existing = await CostCode.find({ companyId });
  if (existing.length > 0) return;
  for (const cc of DEFAULT_COST_CODES) {
    await CostCode.create({ ...cc, companyId });
  }
};

const getCostCodes = async (req, res) => {
  try {
    const codes = await CostCode.find({ companyId: req.user.companyId });
    codes.sort((a, b) => a.code.localeCompare(b.code));
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCostCode = async (req, res) => {
  try {
    const schema = Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      category: Joi.string().valid('materials', 'labor', 'equipment', 'subcontractor', 'overhead').required(),
      description: Joi.string().allow('')
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const exists = await CostCode.findOne({ code: req.body.code, companyId: req.user.companyId });
    if (exists) return res.status(400).json({ error: 'كود التكلفة موجود مسبقاً' });

    const code = await CostCode.create({ ...req.body, companyId: req.user.companyId });
    res.status(201).json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCostCode = async (req, res) => {
  try {
    await CostCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJobBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    let budgets = await JobBudget.find({ projectId, companyId: req.user.companyId });
    const codes = await CostCode.find({ companyId: req.user.companyId });

    if (budgets.length === 0) {
      for (const cc of codes) {
        await JobBudget.create({
          projectId,
          costCodeId: cc._id,
          costCode: cc.code,
          costCodeName: cc.name,
          costCategory: cc.category,
          budgetAmount: 0,
          committedCost: 0,
          actualCost: 0,
          projectedCost: 0,
          companyId: req.user.companyId
        });
      }
      budgets = await JobBudget.find({ projectId, companyId: req.user.companyId });
    }

    const entries = await JobCostEntry.find({ projectId, companyId: req.user.companyId });
    for (let b of budgets) {
      const codeEntries = entries.filter(e => e.costCodeId === b.costCodeId);
      b.actualCost = codeEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      if (b.actualCost > 0 || b.committedCost > 0) {
        await b.save();
      }
    }

    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateJobBudget = async (req, res) => {
  try {
    const { budgetAmount, committedCost, projectedCost, quantity, unit } = req.body;
    const budget = await JobBudget.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!budget) return res.status(404).json({ error: 'Budget line not found' });

    if (budgetAmount !== undefined) budget.budgetAmount = budgetAmount;
    if (committedCost !== undefined) budget.committedCost = committedCost;
    if (projectedCost !== undefined) budget.projectedCost = projectedCost;
    if (quantity !== undefined) budget.quantity = quantity;
    if (unit !== undefined) budget.unit = unit;
    await budget.save();

    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addCostEntry = async (req, res) => {
  try {
    const schema = Joi.object({
      projectId: Joi.string().required(),
      costCodeId: Joi.string().required(),
      amount: Joi.number().required().min(0),
      type: Joi.string().valid('material', 'labor', 'equipment', 'subcontractor', 'overhead').required(),
      source: Joi.string().valid('inventory', 'attendance', 'equipment', 'manual', 'subcontractor').default('manual'),
      sourceId: Joi.string().allow(''),
      description: Joi.string().allow(''),
      date: Joi.date().default(new Date())
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const entry = await JobCostEntry.create({
      ...req.body,
      companyId: req.user.companyId,
      userId: req.user.userId
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProjectCosts = async (req, res) => {
  try {
    const entries = await JobCostEntry.find({ projectId: req.params.id, companyId: req.user.companyId });
    const codes = await CostCode.find({ companyId: req.user.companyId });

    const grouped = {};
    for (const cc of codes) {
      const codeEntries = entries.filter(e => e.costCodeId === cc._id);
      grouped[cc._id] = {
        code: cc.code,
        name: cc.name,
        category: cc.category,
        total: codeEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
        count: codeEntries.length,
        entries: codeEntries
      };
    }

    res.json({ entries, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBudgetVsActual = async (req, res) => {
  try {
    const budgets = await JobBudget.find({ projectId: req.params.id, companyId: req.user.companyId });
    const project = await Project.findById(req.params.id);

    const totalBudget = budgets.reduce((s, b) => s + (parseFloat(b.budgetAmount) || 0), 0);
    const totalActual = budgets.reduce((s, b) => s + (parseFloat(b.actualCost) || 0), 0);
    const totalCommitted = budgets.reduce((s, b) => s + (parseFloat(b.committedCost) || 0), 0);
    const totalProjected = budgets.reduce((s, b) => s + (parseFloat(b.projectedCost) || 0), 0);

    const totalBilled = (project?.progress || 0) / 100 * (parseFloat(project?.budget) || 0);

    const overUnder = totalBilled - totalActual;

    res.json({
      budgets,
      summary: {
        totalBudget,
        totalActual,
        totalCommitted,
        totalProjected,
        totalBilled,
        overUnder,
        variance: totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProgressBill = async (req, res) => {
  try {
    const schema = Joi.object({
      projectId: Joi.string().required(),
      periodStart: Joi.date().required(),
      periodEnd: Joi.date().required(),
      retainagePercent: Joi.number().min(0).max(100).default(10),
      notes: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const previousBills = await ProgressBill.find({
      projectId: req.params.projectId,
      companyId: req.user.companyId,
      status: { $in: ['submitted', 'approved', 'paid'] }
    });
    const previousTotal = previousBills.reduce((s, b) => s + (parseFloat(b.currentDue) || 0), 0);

    const contractValue = parseFloat(project.budget) || 0;
    const progressPercent = parseFloat(project.progress) || 0;
    const totalCompleted = (progressPercent / 100) * contractValue;
    const retainageAmount = totalCompleted * (req.body.retainagePercent / 100);
    const currentDue = totalCompleted - retainageAmount - previousTotal;

    const count = await ProgressBill.countDocuments({ companyId: req.user.companyId });
    const billNumber = `BILL-${String(count + 1).padStart(3, '0')}`;

    const bill = await ProgressBill.create({
      projectId: req.params.projectId,
      projectName: project.title || project.name,
      billNumber,
      periodStart: req.body.periodStart,
      periodEnd: req.body.periodEnd,
      contractValue,
      totalCompleted,
      retainagePercent: req.body.retainagePercent,
      retainageAmount,
      previousBills: previousTotal,
      currentDue: Math.max(0, currentDue),
      notes: req.body.notes || '',
      status: 'draft',
      companyId: req.user.companyId,
      createdBy: req.user.userId
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProgressBills = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;
    const bills = await ProgressBill.find(filter);
    bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveBill = async (req, res) => {
  try {
    const bill = await ProgressBill.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.status = req.body.status || 'approved';
    await bill.save();
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createChangeOrder = async (req, res) => {
  try {
    const schema = Joi.object({
      projectId: Joi.string().required(),
      description: Joi.string().required(),
      type: Joi.string().valid('addition', 'deletion', 'adjustment').required(),
      estimatedCost: Joi.number().required(),
      approvedAmount: Joi.number().default(0),
      status: Joi.string().valid('pending', 'approved', 'rejected').default('pending')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const count = await ChangeOrder.countDocuments({ companyId: req.user.companyId });
    const coNumber = `CO-${String(count + 1).padStart(3, '0')}`;

    const co = await ChangeOrder.create({
      ...req.body,
      coNumber,
      companyId: req.user.companyId,
      createdBy: req.user.userId
    });

    res.status(201).json(co);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getChangeOrders = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;
    const orders = await ChangeOrder.find(filter);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveChangeOrder = async (req, res) => {
  try {
    const co = await ChangeOrder.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!co) return res.status(404).json({ error: 'Change order not found' });

    co.status = req.body.status || 'approved';
    if (req.body.approvedAmount !== undefined) co.approvedAmount = req.body.approvedAmount;
    await co.save();

    if (co.status === 'approved' && co.projectId) {
      const project = await Project.findById(co.projectId);
      if (project) {
        const impact = co.type === 'deletion' ? -co.approvedAmount : co.approvedAmount;
        project.budget = (parseFloat(project.budget) || 0) + impact;
        co.impactOnBudget = impact;
        await co.save();
        await project.save();
      }
    }

    res.json(co);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWipReport = async (req, res) => {
  try {
    const projects = await Project.find({ companyId: req.user.companyId, status: { $in: ['active', 'completed'] } });
    const wip = [];

    for (const project of projects) {
      const entries = await JobCostEntry.find({ projectId: project._id, companyId: req.user.companyId });
      const bills = await ProgressBill.find({ projectId: project._id, companyId: req.user.companyId, status: { $in: ['submitted', 'approved', 'paid'] } });
      const cos = await ChangeOrder.find({ projectId: project._id, companyId: req.user.companyId, status: 'approved' });

      const totalCosts = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      const totalBilled = bills.reduce((s, b) => s + (parseFloat(b.currentDue) || 0), 0);
      const totalRetainage = bills.reduce((s, b) => s + (parseFloat(b.retainageAmount) || 0), 0);
      const coImpact = cos.reduce((s, c) => s + (c.type === 'deletion' ? -c.approvedAmount : c.approvedAmount), 0);

      const originalBudget = parseFloat(project.budget) || 0;
      const adjustedBudget = originalBudget + coImpact;
      const profit = totalBilled - totalCosts;
      const profitPercent = totalBilled > 0 ? (profit / totalBilled * 100) : 0;
      const overUnder = totalBilled - totalCosts;

      wip.push({
        _id: project._id,
        name: project.title || project.name,
        status: project.status,
        progress: project.progress || 0,
        originalBudget,
        coImpact,
        adjustedBudget,
        totalCosts,
        totalBilled,
        totalRetainage,
        profit,
        profitPercent,
        overUnder,
        overUnderStatus: overUnder > 0 ? 'over' : overUnder < 0 ? 'under' : 'even'
      });
    }

    wip.sort((a, b) => a.profitPercent - b.profitPercent);

    res.json({ wip, summary: {
      totalProjects: wip.length,
      totalCosts: wip.reduce((s, w) => s + w.totalCosts, 0),
      totalBilled: wip.reduce((s, w) => s + w.totalBilled, 0),
      totalRetainage: wip.reduce((s, w) => s + w.totalRetainage, 0),
      profitableCount: wip.filter(w => w.profit > 0).length,
      lossCount: wip.filter(w => w.profit < 0).length
    }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  seedCostCodes, getCostCodes, createCostCode, deleteCostCode,
  getJobBudget, updateJobBudget, addCostEntry, getProjectCosts, getBudgetVsActual,
  createProgressBill, getProgressBills, approveBill,
  createChangeOrder, getChangeOrders, approveChangeOrder,
  getWipReport
};
