const Company = require('../models/Company');
const User = require('../models/User');
const Project = require('../models/Project');
const Attendance = require('../models/Attendance');
const InventoryItem = require('../models/InventoryItem');
const Joi = require('joi');

const ROLE_DEFAULT_PERMISSIONS = {
  owner: ['all'],
  manager: ['can_view_accounting', 'can_edit_accounting', 'can_view_inventory', 'can_edit_inventory', 'can_view_hr', 'can_edit_hr', 'can_view_projects', 'can_edit_projects', 'can_view_attendance', 'can_mark_attendance'],
  accountant: ['can_view_accounting', 'can_edit_accounting'],
  hr: ['can_view_hr', 'can_edit_hr', 'can_view_attendance', 'can_mark_attendance'],
  inventory: ['can_view_inventory', 'can_edit_inventory'],
  engineer: ['can_view_projects', 'can_edit_projects'],
  employee: ['can_view_projects', 'can_view_attendance']
};

const getDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const allUsers = await User.find({ companyId, status: 'active' });
    const allProjects = await Project.find({ companyId });
    const todayAttendance = await Attendance.find({ companyId, date: today });
    const allItems = await InventoryItem.find({ companyId });
    const allAttendance = await Attendance.find({ companyId });

    const activeProjects = allProjects.filter(p => p.status === 'active');
    const completedProjects = allProjects.filter(p => p.status === 'completed');
    const totalBudget = allProjects.reduce((s, p) => s + (parseFloat(p.budget) || 0), 0);
    const totalExpenses = allProjects.reduce((s, p) => {
      if (Array.isArray(p.expenses)) {
        return s + p.expenses.reduce((es, e) => es + (parseFloat(e.amount) || 0), 0);
      }
      return s;
    }, 0);

    const lowStock = allItems.filter(i => i.currentQty <= i.minQty);

    const pendingLeaves = allAttendance.filter(a => a.status === 'leave' && a.leaveStatus === 'pending');
    const presentToday = todayAttendance.filter(a => a.status === 'present');
    const absentToday = allUsers.filter(u => {
      const hasCheckIn = todayAttendance.find(a => a.userId === u._id && a.status === 'present');
      return !hasCheckIn && u.role !== 'owner';
    });

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentAttendance = allAttendance.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return d >= sevenDaysAgo;
    });

    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayAttendance = recentAttendance.filter(a => a.date === dateStr);
      const present = dayAttendance.filter(a => a.status === 'present').length;
      const absent = allUsers.filter(u => {
        const has = dayAttendance.find(a => a.userId === u._id && a.status === 'present');
        return !has && u.role !== 'owner';
      }).length;
      weeklyStats.push({ date: dateStr, day: d.toLocaleDateString('ar-SA', { weekday: 'short' }), present, absent });
    }

    const recentProjects = activeProjects.slice(0, 5).map(p => {
      const spent = Array.isArray(p.expenses)
        ? p.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
        : 0;
      return { _id: p._id, name: p.name, progress: p.progress || 0, budget: parseFloat(p.budget) || 0, spent };
    });

    const lowStockItems = lowStock.slice(0, 5).map(i => ({
      _id: i._id, name: i.name, currentQty: i.currentQty, minQty: i.minQty, unit: i.unit || ''
    }));

    res.json({
      stats: {
        employees: allUsers.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        todayPresent: presentToday.length,
        todayAbsent: absentToday.length,
        totalBudget,
        totalExpenses,
        lowStockCount: lowStock.length,
        pendingLeaves: pendingLeaves.length
      },
      weeklyStats,
      recentProjects,
      lowStockItems,
      pendingLeaves: pendingLeaves.slice(0, 5).map(a => ({
        _id: a._id, userId: a.userId, date: a.date, leaveType: a.leaveType
      })),
      absentToday: absentToday.slice(0, 5).map(u => ({
        _id: u._id, fullName: u.fullName, role: u.role
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const filter = { companyId: req.user.companyId };

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      const all = await User.find(filter);
      const filtered = all.filter(u =>
        (u.fullName && u.fullName.includes(search)) ||
        (u.email && u.email.includes(search)) ||
        (u.username && u.username.includes(search))
      );
      const total = filtered.length;
      const paged = filtered.slice((page - 1) * limit, page * limit);
      const employees = [];
      for (let emp of paged) {
        delete emp.password;
        if (emp.createdBy) {
          const creator = await User.findById(emp.createdBy);
          emp.createdByName = creator ? creator.fullName : '';
        }
        employees.push(emp);
      }
      return res.json({ employees, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    }

    const result = await User.paginate(filter, { page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 } });
    const employees = [];
    for (let emp of result.docs) {
      delete emp.password;
      if (emp.createdBy) {
        const creator = await User.findById(emp.createdBy);
        emp.createdByName = creator ? creator.fullName : '';
      }
      employees.push(emp);
    }
    res.json({ employees, total: result.total, page: result.page, pages: result.pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addEmployee = async (req, res) => {
  try {
    const schema = Joi.object({
      fullName: Joi.string().required(),
      fullNameAr: Joi.string().allow(''),
      email: Joi.string().email().required(),
      username: Joi.string().required(),
      password: Joi.string().min(6).required(),
      phone: Joi.string().allow(''),
      role: Joi.string().valid('manager', 'accountant', 'hr', 'inventory', 'engineer', 'employee').required(),
      permissions: Joi.array().items(Joi.string()),
      department: Joi.string().allow(''),
      jobTitle: Joi.string().allow(''),
      salary: Joi.number().default(0)
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Only owner or manager can add employees' });
    }

    if (req.body.role === 'owner' || (req.body.role === 'manager' && req.user.role !== 'owner')) {
      return res.status(403).json({ error: 'Cannot create owner or manager accounts' });
    }

    const existing = await User.find({ companyId: req.user.companyId });
    const dup = existing.find(u => u.username === req.body.username || u.email === req.body.email);
    if (dup) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const maxId = existing.reduce((max, u) => {
      if (!u.employeeId) return max;
      const num = parseInt(u.employeeId.replace('EMP-', ''));
      return num > max ? num : max;
    }, 0);
    const employeeId = `EMP-${String(maxId + 1).padStart(3, '0')}`;

    const employee = await User.create({
      ...req.body,
      employeeId,
      permissions: req.body.permissions || ROLE_DEFAULT_PERMISSIONS[req.body.role] || [],
      companyId: req.user.companyId,
      createdBy: req.user.userId,
      status: 'active'
    });
    delete employee.password;

    res.status(201).json({ message: 'Employee added successfully', employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const updatableFields = ['fullName', 'fullNameAr', 'email', 'phone', 'role', 'permissions', 'department', 'jobTitle', 'salary', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'role' && (req.body[field] === 'owner' || req.body[field] === 'manager') && req.user.role !== 'owner') {
          return;
        }
        employee[field] = req.body[field];
      }
    });

    if (req.body.role && !req.body.permissions) {
      employee.permissions = ROLE_DEFAULT_PERMISSIONS[req.body.role] || [];
    }

    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      employee.password = await bcrypt.hash(req.body.password, 12);
    }

    await employee.save();
    delete employee.password;
    res.json({ message: 'Employee updated', employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete employees' });
    }

    const employee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (employee.role === 'owner') return res.status(400).json({ error: 'Cannot delete owner' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const employee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    if (employee.role === 'owner') {
      return res.status(400).json({ error: 'Cannot change owner permissions' });
    }

    employee.permissions = permissions || ROLE_DEFAULT_PERMISSIONS[employee.role] || [];
    await employee.save();

    res.json({ message: 'Permissions updated', permissions: employee.permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string(),
      nameAr: Joi.string().allow(''),
      description: Joi.string().allow(''),
      descriptionAr: Joi.string().allow(''),
      commercialReg: Joi.string(),
      taxNumber: Joi.string().allow(''),
      contactInfo: Joi.object({
        phone: Joi.string().allow(''),
        email: Joi.string().allow(''),
        address: Joi.string().allow('')
      }),
      specialization: Joi.array().items(Joi.string())
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const company = await Company.findOneAndUpdate(
      { _id: req.user.companyId },
      req.body,
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const logoPath = '/' + req.file.path.replace(/\\/g, '/');
    const company = await Company.findOneAndUpdate(
      { _id: req.user.companyId },
      { logo: logoPath },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ logo: logoPath, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const alerts = [];

    const allItems = await InventoryItem.find({ companyId });
    const lowStock = allItems.filter(i => i.currentQty <= i.minQty);
    lowStock.forEach(item => {
      alerts.push({
        type: 'low_stock',
        severity: 'warning',
        titleAr: 'مخزون منخفض',
        titleEn: 'Low Stock',
        messageAr: `${item.name} - الكمية المتبقية: ${item.currentQty} (الحد الأدنى: ${item.minQty})`,
        messageEn: `${item.name} - Remaining: ${item.currentQty} (Min: ${item.minQty})`,
        link: '/inventory',
        data: { itemId: item._id, currentQty: item.currentQty, minQty: item.minQty }
      });
    });

    const allAttendance = await Attendance.find({ companyId });
    const pendingLeaves = allAttendance.filter(a => a.status === 'leave' && a.leaveStatus === 'pending');
    for (let att of pendingLeaves) {
      let userName = 'Unknown';
      if (att.userId) {
        const u = await User.findById(att.userId);
        if (u) userName = u.fullName;
      }
      alerts.push({
        type: 'pending_leave',
        severity: 'info',
        titleAr: 'طلب إجازة pending',
        titleEn: 'Pending Leave Request',
        messageAr: `${userName} - ${att.date} (${att.leaveType === 'sick' ? 'مرضية' : att.leaveType === 'annual' ? 'سنوية' : 'استثنائية'})`,
        messageEn: `${userName} - ${att.date} (${att.leaveType})`,
        link: '/attendance',
        data: { attendanceId: att._id, userId: att.userId, date: att.date, leaveType: att.leaveType }
      });
    }

    const allProjects = await Project.find({ companyId });
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    allProjects.forEach(project => {
      if (project.endDate) {
        const endDate = new Date(project.endDate);
        if (endDate >= now && endDate <= sevenDaysLater) {
          alerts.push({
            type: 'project_deadline',
            severity: 'warning',
            titleAr: 'مشروع يقترب من الموعد النهائي',
            titleEn: 'Project Nearing Deadline',
            messageAr: `${project.name} - الموعد: ${project.endDate}`,
            messageEn: `${project.name} - Due: ${project.endDate}`,
            link: `/projects/${project._id}`,
            data: { projectId: project._id, endDate: project.endDate }
          });
        }
      }

      if (project.budget && project.expenses) {
        const totalExpenses = Array.isArray(project.expenses)
          ? project.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
          : 0;
        if (totalExpenses > parseFloat(project.budget)) {
          alerts.push({
            type: 'over_budget',
            severity: 'danger',
            titleAr: 'تجاوز الميزانية',
            titleEn: 'Over Budget',
            messageAr: `${project.name} - الميزانية: ${project.budget}، المصروفات: ${totalExpenses}`,
            messageEn: `${project.name} - Budget: ${project.budget}, Expenses: ${totalExpenses}`,
            link: `/projects/${project._id}/report`,
            data: { projectId: project._id, budget: project.budget, expenses: totalExpenses }
          });
        }
      }
    });

    alerts.sort((a, b) => {
      const order = { danger: 0, warning: 1, info: 2 };
      return (order[a.severity] || 3) - (order[b.severity] || 3);
    });

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboard, getAlerts, getEmployees, addEmployee, updateEmployee, deleteEmployee, updatePermissions, getProfile, updateProfile, uploadLogo };
