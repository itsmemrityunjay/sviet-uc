import admin from '../config/firebase.js';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find user in database
    const user = await User.findOne({ uid: decodedToken.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ uid: decodedToken.uid });
      if (user) {
        req.user = user;
        req.firebaseUser = decodedToken;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
