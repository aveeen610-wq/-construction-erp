const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobCostingController');
const { authenticate, checkRole } = require('../middleware/auth');

router.get('/cost-codes', authenticate, ctrl.getCostCodes);
router.post('/cost-codes', authenticate, checkRole('owner', 'manager'), ctrl.createCostCode);
router.delete('/cost-codes/:id', authenticate, checkRole('owner'), ctrl.deleteCostCode);

router.get('/budget/:projectId', authenticate, ctrl.getJobBudget);
router.put('/budget/:id', authenticate, checkRole('owner', 'manager'), ctrl.updateJobBudget);

router.post('/entries', authenticate, checkRole('owner', 'manager', 'accountant'), ctrl.addCostEntry);
router.get('/projects/:id/costs', authenticate, ctrl.getProjectCosts);
router.get('/projects/:id/budget-vs-actual', authenticate, ctrl.getBudgetVsActual);

router.post('/billing/:projectId', authenticate, checkRole('owner', 'manager', 'accountant'), ctrl.createProgressBill);
router.get('/billing', authenticate, ctrl.getProgressBills);
router.put('/billing/:id/approve', authenticate, checkRole('owner', 'manager', 'accountant'), ctrl.approveBill);

router.post('/change-orders', authenticate, checkRole('owner', 'manager'), ctrl.createChangeOrder);
router.get('/change-orders', authenticate, ctrl.getChangeOrders);
router.put('/change-orders/:id/approve', authenticate, checkRole('owner', 'manager'), ctrl.approveChangeOrder);

router.get('/wip-report', authenticate, ctrl.getWipReport);

module.exports = router;
