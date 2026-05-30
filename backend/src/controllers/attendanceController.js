const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Joi = require('joi');

const checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const all = await Attendance.find({ companyId: req.user.companyId, userId: req.user.userId });
    const existing = all.find(a => a.date === today);

    if (existing && existing.checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const attendance = existing || {};
    attendance.companyId = req.user.companyId;
    attendance.userId = req.user.userId;
    attendance.date = today;
    attendance.checkIn = new Date().toTimeString().split(' ')[0];
    attendance.status = 'present';

    if (existing) {
      await Attendance.findOneAndUpdate({ _id: existing._id }, attendance);
    } else {
      await Attendance.create(attendance);
    }

    res.json({ message: 'Check-in recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const all = await Attendance.find({ companyId: req.user.companyId, userId: req.user.userId });
    const attendance = all.find(a => a.date === today);

    if (!attendance) return res.status(400).json({ error: 'No check-in found today' });
    if (attendance.checkOut) return res.status(400).json({ error: 'Already checked out' });

    attendance.checkOut = new Date().toTimeString().split(' ')[0];
    await Attendance.findOneAndUpdate({ _id: attendance._id }, attendance);

    res.json({ message: 'Check-out recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyLog = async (req, res) => {
  try {
    const { month, year } = req.query;
    let allRecords = await Attendance.find({ companyId: req.user.companyId, userId: req.user.userId });

    if (month && year) {
      const m = String(month).padStart(2, '0');
      allRecords = allRecords.filter(r => r.date && r.date.startsWith(`${year}-${m}`));
    }

    allRecords.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(allRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReport = async (req, res) => {
  try {
    const { userId, month, year, status } = req.query;
    let records = await Attendance.find({ companyId: req.user.companyId });

    if (userId) records = records.filter(r => r.userId === userId);
    if (status) records = records.filter(r => r.status === status);
    if (month && year) {
      const m = String(month).padStart(2, '0');
      records = records.filter(r => r.date && r.date.startsWith(`${year}-${m}`));
    }

    for (let r of records) {
      if (r.userId) {
        const u = await User.findById(r.userId);
        if (u) {
          r.userName = u.fullName;
          r.userDepartment = u.department;
          r.userJobTitle = u.jobTitle;
        }
      }
    }

    records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const leaveRequest = async (req, res) => {
  try {
    const schema = Joi.object({
      date: Joi.string().required(),
      leaveType: Joi.string().valid('annual', 'sick', 'exceptional').required(),
      notes: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const all = await Attendance.find({ companyId: req.user.companyId, userId: req.user.userId, date: req.body.date });
    const existing = all[0];

    const data = {
      companyId: req.user.companyId,
      userId: req.user.userId,
      date: req.body.date,
      status: 'leave',
      leaveType: req.body.leaveType,
      leaveStatus: 'pending',
      notes: req.body.notes
    };

    if (existing) {
      await Attendance.findOneAndUpdate({ _id: existing._id }, data);
    } else {
      await Attendance.create(data);
    }

    res.json({ message: 'Leave request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { attendanceId, status } = req.body;
    const attendance = await Attendance.findOne({ _id: attendanceId, companyId: req.user.companyId });

    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });

    attendance.leaveStatus = status === 'approve' ? 'approved' : 'rejected';
    await attendance.save();

    res.json({ message: `Leave ${status}d` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { checkIn, checkOut, getMyLog, getReport, leaveRequest, approveLeave };
