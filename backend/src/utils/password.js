const bcrypt = require("bcryptjs");

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const SALT_ROUNDS = 12;

function isValidPassword(value) {
  return PASSWORD_REGEX.test(value);
}

async function hashPassword(value) {
  return bcrypt.hash(value, SALT_ROUNDS);
}

async function comparePassword(value, hash) {
  return bcrypt.compare(value, hash);
}

module.exports = {
  isValidPassword,
  hashPassword,
  comparePassword,
};
