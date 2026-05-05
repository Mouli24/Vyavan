import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role guard — use after protect()
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userRole = (req.user.role || '').toLowerCase();
    
    // Admins have access to everything
    if (userRole === 'admin') {
      return next();
    }

    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      console.log(`[AUTH] Role mismatch: User has '${userRole}', needs one of [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}
