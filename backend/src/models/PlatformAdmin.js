const { getModel } = require('../utils/db');
const bcrypt = require('bcryptjs');

const Admin = getModel('PlatformAdmin');

const originalCreate = Admin.create.bind(Admin);
Admin.create = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  }
  return originalCreate(data);
};

Admin.prototype = Admin;
Admin.comparePassword = async (plainPwd, hashedPwd) => {
  return bcrypt.compare(plainPwd, hashedPwd);
};

module.exports = Admin;
