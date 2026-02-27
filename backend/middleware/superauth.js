const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin')
      return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
    req.superadmin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
