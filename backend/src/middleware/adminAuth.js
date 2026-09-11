const { adminSecret } = require('../config/env');

module.exports = function adminAuth(req, res, next) {
  const key = req.headers['x-admin-secret'];
  if (!key || key !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized: invalid admin secret' });
  }
  next();
};
