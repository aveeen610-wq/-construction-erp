const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, getJournalEntries, createJournalEntry, getBalanceSheet, getIncomeStatement } = require('../controllers/accountingController');
const { authenticate, checkRole } = require('../middleware/auth');

router.get('/accounts', authenticate, checkRole('owner', 'manager', 'accountant'), getAccounts);
router.post('/accounts', authenticate, checkRole('owner', 'manager', 'accountant'), createAccount);
router.get('/journal-entries', authenticate, checkRole('owner', 'manager', 'accountant'), getJournalEntries);
router.post('/journal-entries', authenticate, checkRole('owner', 'manager', 'accountant'), createJournalEntry);
router.get('/reports/balance-sheet', authenticate, checkRole('owner', 'manager', 'accountant'), getBalanceSheet);
router.get('/reports/income-statement', authenticate, checkRole('owner', 'manager', 'accountant'), getIncomeStatement);

module.exports = router;
