const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const Project = require('../models/Project');
const User = require('../models/User');
const Joi = require('joi');

const getItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    let items = await InventoryItem.find({ companyId: req.user.companyId });

    if (category) items = items.filter(i => i.category === category);
    if (search) {
      items = items.filter(i =>
        (i.name && i.name.includes(search)) ||
        (i.code && i.code.includes(search))
      );
    }

    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);

    res.json({ items: paged, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createItem = async (req, res) => {
  try {
    const schema = Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
      nameAr: Joi.string().allow(''),
      unit: Joi.string().default('piece'),
      minQty: Joi.number().default(0),
      maxQty: Joi.number().default(0),
      currentQty: Joi.number().default(0),
      category: Joi.string().allow(''),
      unitPrice: Joi.number().default(0),
      description: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const item = await InventoryItem.create({ ...req.body, companyId: req.user.companyId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, itemId, type } = req.query;
    let transactions = await InventoryTransaction.find({ companyId: req.user.companyId });

    if (itemId) transactions = transactions.filter(t => t.itemId === itemId);
    if (type) transactions = transactions.filter(t => t.type === type);

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = transactions.length;
    const paged = transactions.slice((page - 1) * limit, page * limit);

    for (let t of paged) {
      if (t.itemId) {
        const item = await InventoryItem.findById(t.itemId);
        t.itemName = item ? item.name : '';
        t.itemCode = item ? item.code : '';
      }
      if (t.projectId) {
        const proj = await Project.findById(t.projectId);
        t.projectTitle = proj ? proj.title : '';
      }
      if (t.createdBy) {
        const u = await User.findById(t.createdBy);
        t.createdByName = u ? u.fullName : '';
      }
    }

    res.json({ transactions: paged, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const schema = Joi.object({
      itemId: Joi.string().required(),
      type: Joi.string().valid('in', 'out', 'transfer').required(),
      qty: Joi.number().required().min(1),
      warehouseId: Joi.string().allow(''),
      toWarehouseId: Joi.string().allow(''),
      projectId: Joi.string().allow(''),
      notes: Joi.string().allow(''),
      unitPrice: Joi.number().default(0)
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const item = await InventoryItem.findOne({ _id: req.body.itemId, companyId: req.user.companyId });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const transaction = await InventoryTransaction.create({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.userId
    });

    if (req.body.type === 'in') {
      item.currentQty = (item.currentQty || 0) + req.body.qty;
    } else if (req.body.type === 'out') {
      if ((item.currentQty || 0) < req.body.qty) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      item.currentQty = (item.currentQty || 0) - req.body.qty;
    }

    await item.save();

    res.status(201).json({ transaction, currentQty: item.currentQty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLowStock = async (req, res) => {
  try {
    const items = await InventoryItem.find({ companyId: req.user.companyId });
    const low = items.filter(i => (i.currentQty || 0) <= (i.minQty || 0));
    res.json(low);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLedger = async (req, res) => {
  try {
    let transactions = await InventoryTransaction.find({
      companyId: req.user.companyId,
      itemId: req.params.itemId
    });

    for (let t of transactions) {
      if (t.createdBy) {
        const u = await User.findById(t.createdBy);
        t.createdByName = u ? u.fullName : '';
      }
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getItems, createItem, getTransactions, createTransaction, getLowStock, getLedger };
