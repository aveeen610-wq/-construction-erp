const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyLog, getReport, leaveRequest, approveLeave } = require('../controllers/attendanceController');
const { authenticate, checkRole } = require('../middleware/auth');

router.post('/check-in', authenticate, checkIn);
router.post('/check-out', authenticate, checkOut);
router.get('/my-log', authenticate, getMyLog);
router.get('/report', authenticate, checkRole('owner', 'manager', 'hr'), getReport);
router.post('/leave-request', authenticate, leaveRequest);
router.put('/leave-approve', authenticate, checkRole('owner', 'manager', 'hr'), approveLeave);

module.exports = router;
