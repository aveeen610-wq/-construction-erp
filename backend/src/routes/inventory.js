const express = require('express');
const router = express.Router();
const { getItems, createItem, getTransactions, createTransaction, getLowStock, getLedger } = require('../controllers/inventoryController');
const { authenticate, checkRole } = require('../middleware/auth');

router.get('/items', authenticate, checkRole('owner', 'manager', 'inventory'), getItems);
router.post('/items', authenticate, checkRole('owner', 'manager', 'inventory'), createItem);
router.get('/transactions', authenticate, checkRole('owner', 'manager', 'inventory'), getTransactions);
router.post('/transactions', authenticate, checkRole('owner', 'manager', 'inventory'), createTransaction);
router.get('/reports/low-stock', authenticate, checkRole('owner', 'manager', 'inventory'), getLowStock);
router.get('/reports/ledger/:itemId', authenticate, checkRole('owner', 'manager', 'inventory'), getLedger);

module.exports = router;
