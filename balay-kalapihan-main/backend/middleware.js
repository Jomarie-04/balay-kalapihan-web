import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.fullName = decoded.fullName;
    req.isAdmin = decoded.isAdmin;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId, username, fullName = '', isAdmin = false) {
  return jwt.sign(
    { userId, username, fullName, isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
