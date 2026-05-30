const Account = require('../models/Account');
const JournalEntry = require('../models/JournalEntry');
const User = require('../models/User');
const Joi = require('joi');

const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ companyId: req.user.companyId });
    accounts.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || ''));
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAccount = async (req, res) => {
  try {
    const schema = Joi.object({
      accountCode: Joi.string().required(),
      accountName: Joi.string().required(),
      accountNameAr: Joi.string().allow(''),
      type: Joi.string().valid('asset', 'liability', 'equity', 'revenue', 'expense').required(),
      parentId: Joi.string().allow(null),
      balance: Joi.number().default(0)
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const account = await Account.create({ ...req.body, companyId: req.user.companyId });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getJournalEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    let entries = await JournalEntry.find({ companyId: req.user.companyId });

    if (startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      entries = entries.filter(e => {
        const d = new Date(e.date);
        return d >= sd && d <= ed;
      });
    }

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = entries.length;
    const paged = entries.slice((page - 1) * limit, page * limit);

    for (let e of paged) {
      if (e.createdBy) {
        const u = await User.findById(e.createdBy);
        e.createdByName = u ? u.fullName : '';
      }
    }

    res.json({ entries: paged, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createJournalEntry = async (req, res) => {
  try {
    const schema = Joi.object({
      entryNumber: Joi.string().required(),
      date: Joi.date().required(),
      description: Joi.string().allow(''),
      lines: Joi.array().items(Joi.object({
        accountId: Joi.string().required(),
        debit: Joi.number().default(0),
        credit: Joi.number().default(0),
        description: Joi.string().allow('')
      })).min(2).required(),
      attachments: Joi.array().items(Joi.string())
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const totalDebit = req.body.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = req.body.lines.reduce((sum, l) => sum + l.credit, 0);

    if (totalDebit !== totalCredit) {
      return res.status(400).json({ error: 'Total debit must equal total credit' });
    }

    const entry = await JournalEntry.create({
      ...req.body,
      totalDebit,
      totalCredit,
      companyId: req.user.companyId,
      createdBy: req.user.userId
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBalanceSheet = async (req, res) => {
  try {
    const allAccounts = await Account.find({ companyId: req.user.companyId });
    const assets = allAccounts.filter(a => a.type === 'asset');
    const liabilities = allAccounts.filter(a => a.type === 'liability');
    const equity = allAccounts.filter(a => a.type === 'equity');

    res.json({
      assets: { accounts: assets, total: assets.reduce((s, a) => s + (a.balance || 0), 0) },
      liabilities: { accounts: liabilities, total: liabilities.reduce((s, a) => s + (a.balance || 0), 0) },
      equity: { accounts: equity, total: equity.reduce((s, a) => s + (a.balance || 0), 0) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getIncomeStatement = async (req, res) => {
  try {
    const allAccounts = await Account.find({ companyId: req.user.companyId });
    const revenues = allAccounts.filter(a => a.type === 'revenue');
    const expenses = allAccounts.filter(a => a.type === 'expense');

    const totalRevenue = revenues.reduce((s, a) => s + (a.balance || 0), 0);
    const totalExpense = expenses.reduce((s, a) => s + (a.balance || 0), 0);

    res.json({
      revenues: { accounts: revenues, total: totalRevenue },
      expenses: { accounts: expenses, total: totalExpense },
      netIncome: totalRevenue - totalExpense
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAccounts, createAccount, getJournalEntries, createJournalEntry, getBalanceSheet, getIncomeStatement };
