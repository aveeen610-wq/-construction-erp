const PlatformAdmin = require('../models/PlatformAdmin');

async function seedData() {
  const existing = await PlatformAdmin.findOne({ email: 'admin@platform.com' });
  if (existing) return;

  await PlatformAdmin.create({
    username: 'superadmin',
    email: 'admin@platform.com',
    password: 'admin123',
    fullName: 'Super Admin',
    role: 'super_admin'
  });
  console.log('Super admin created: admin@platform.com / admin123');
  console.log('No pre-made companies. Register via /register to create one.');
}

module.exports = { seedData };
