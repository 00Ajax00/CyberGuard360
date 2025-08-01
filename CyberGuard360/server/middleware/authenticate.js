import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export default function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  if (err) {
    console.error('JWT Verify Error:', err.message);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  req.user = decoded;
  next();
});
}