const { getModel } = require('../utils/db');
const bcrypt = require('bcryptjs');

const User = getModel('User');

const originalCreate = User.create.bind(User);
User.create = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  }
  return originalCreate(data);
};

User.comparePassword = async (plainPwd, hashedPwd) => {
  return bcrypt.compare(plainPwd, hashedPwd);
};

module.exports = User;
