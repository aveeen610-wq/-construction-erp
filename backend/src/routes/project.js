const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, updateProgress, uploadFile, getTeam, addExpense, getProjectReport, addMaterial } = require('../controllers/projectController');
const { authenticate, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
router.post('/', authenticate, checkRole('owner', 'manager'), createProject);
router.put('/:id', authenticate, checkRole('owner', 'manager'), updateProject);
router.put('/:id/progress', authenticate, updateProgress);
router.post('/:id/files', authenticate, upload.single('file'), uploadFile);
router.post('/:id/expenses', authenticate, checkRole('owner', 'manager'), addExpense);
router.post('/:id/materials', authenticate, checkRole('owner', 'manager'), addMaterial);
router.get('/:id/report', authenticate, getProjectReport);
router.get('/:id/team', authenticate, getTeam);

module.exports = router;
