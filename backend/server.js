const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const publicRoutes = require('./src/routes/public');
const companyRoutes = require('./src/routes/company');
const attendanceRoutes = require('./src/routes/attendance');
const projectRoutes = require('./src/routes/project');
const accountingRoutes = require('./src/routes/accounting');
const inventoryRoutes = require('./src/routes/inventory');
const portfolioRoutes = require('./src/routes/portfolio');
const announcementRoutes = require('./src/routes/announcement');
const jobCostingRoutes = require('./src/routes/jobCosting');

const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const { seedData } = require('./src/utils/seed');
seedData().then(() => console.log('Seed data ready')).catch(console.error);

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later' }
});

app.use('/api/auth/login', authLimiter);

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', accountingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/job-costing', jobCostingRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
