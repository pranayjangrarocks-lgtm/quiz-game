require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  adminSecret: process.env.ADMIN_SECRET || 'change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
