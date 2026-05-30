import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  getMe: () => api.get('/auth/me')
};

export const publicApi = {
  getCompanies: () => api.get('/public/companies'),
  getCompany: (id) => api.get(`/public/companies/${id}`),
  getCompanyAnnouncements: (id) => api.get(`/public/companies/${id}/announcements`),
  getAllAnnouncements: () => api.get('/public/announcements'),
  getWorks: (params) => api.get('/public/works', { params }),
  getAds: () => api.get('/public/ads'),
  getStats: () => api.get('/public/stats'),
  sendContact: (data) => api.post('/public/contact', data),
  getMessages: () => api.get('/public/messages'),
  markMessageRead: (id) => api.put(`/public/messages/${id}/read`)
};

export const company = {
  getDashboard: () => api.get('/company/dashboard'),
  getAlerts: () => api.get('/company/alerts'),
  getEmployees: (params) => api.get('/company/employees', { params }),
  addEmployee: (data) => api.post('/company/employees', data),
  updateEmployee: (id, data) => api.put(`/company/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/company/employees/${id}`),
  updatePermissions: (id, data) => api.put(`/company/permissions/${id}`, data),
  register: (data) => api.post('/company/register', data),
  getAll: () => api.get('/company/all'),
  updateStatus: (id, status) => api.put(`/company/${id}/status`, { status }),
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.put('/company/profile', data),
  uploadLogo: (formData) => api.post('/company/logo', formData)
};

export const attendance = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getMyLog: (params) => api.get('/attendance/my-log', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  leaveRequest: (data) => api.post('/attendance/leave-request', data),
  approveLeave: (data) => api.put('/attendance/leave-approve', data)
};

export const projects = {
  getAll: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  updateProgress: (id, progress) => api.put(`/projects/${id}/progress`, { progress }),
  uploadFile: (id, formData) => api.post(`/projects/${id}/files`, formData),
  addExpense: (id, data) => api.post(`/projects/${id}/expenses`, data),
  addMaterial: (id, data) => api.post(`/projects/${id}/materials`, data),
  getReport: (id) => api.get(`/projects/${id}/report`),
  getTeam: (id) => api.get(`/projects/${id}/team`)
};

export const accounting = {
  getAccounts: () => api.get('/accounts'),
  createAccount: (data) => api.post('/accounts', data),
  getJournalEntries: (params) => api.get('/journal-entries', { params }),
  createJournalEntry: (data) => api.post('/journal-entries', data),
  getBalanceSheet: () => api.get('/reports/balance-sheet'),
  getIncomeStatement: () => api.get('/reports/income-statement')
};

export const inventory = {
  getItems: (params) => api.get('/inventory/items', { params }),
  createItem: (data) => api.post('/inventory/items', data),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  createTransaction: (data) => api.post('/inventory/transactions', data),
  getLowStock: () => api.get('/inventory/reports/low-stock'),
  getLedger: (itemId) => api.get(`/inventory/reports/ledger/${itemId}`)
};

export const portfolio = {
  getAll: () => api.get('/portfolio'),
  create: (data) => api.post('/portfolio', data)
};

export const announcements = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data)
};

export const jobCosting = {
  getCostCodes: () => api.get('/job-costing/cost-codes'),
  createCostCode: (data) => api.post('/job-costing/cost-codes', data),
  deleteCostCode: (id) => api.delete(`/job-costing/cost-codes/${id}`),
  getJobBudget: (projectId) => api.get(`/job-costing/budget/${projectId}`),
  updateJobBudget: (id, data) => api.put(`/job-costing/budget/${id}`, data),
  addCostEntry: (data) => api.post('/job-costing/entries', data),
  getProjectCosts: (id) => api.get(`/job-costing/projects/${id}/costs`),
  getBudgetVsActual: (id) => api.get(`/job-costing/projects/${id}/budget-vs-actual`),
  createProgressBill: (projectId, data) => api.post(`/job-costing/billing/${projectId}`, data),
  getProgressBills: (params) => api.get('/job-costing/billing', { params }),
  approveBill: (id, data) => api.put(`/job-costing/billing/${id}/approve`, data),
  createChangeOrder: (data) => api.post('/job-costing/change-orders', data),
  getChangeOrders: (params) => api.get('/job-costing/change-orders', { params }),
  approveChangeOrder: (id, data) => api.put(`/job-costing/change-orders/${id}/approve`, data),
  getWipReport: () => api.get('/job-costing/wip-report')
};

export default api;
