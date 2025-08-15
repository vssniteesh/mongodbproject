const jwt = require('jsonwebtoken');

function authMiddleware(requiredRole) {
  return (req, res, next) => {
    // Prefer token from httpOnly cookie, fall back to Authorization header
    const tokenFromCookie = req.cookies && req.cookies.token;
    const header = req.headers['authorization'];
    const tokenFromHeader = header && header.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = authMiddleware;
