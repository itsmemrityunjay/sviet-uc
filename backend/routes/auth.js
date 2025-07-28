import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import admin from '../config/firebase.js';

const router = express.Router();

// Register/Login user
router.post('/register', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idToken } = req.body;

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists
    let user = await User.findOne({ uid });

    if (!user) {
      // Create new user
      user = new User({
        uid,
        email,
        displayName: name || email.split('@')[0],
        photoURL: picture || '',
      });
      await user.save();
    }

    // Update last seen and online status
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();

    res.status(201).json({
      message: 'User authenticated successfully',
      user: {
        _id: user._id,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        bio: user.bio,
        verified: user.verified,
        followers: user.followers.length,
        following: user.following.length,
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'displayName photoURL')
      .populate('following', 'displayName photoURL');

    res.json({
      _id: user._id,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      bio: user.bio,
      verified: user.verified,
      followers: user.followers,
      following: user.following,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('displayName').optional().isLength({ min: 1, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { displayName, bio, photoURL } = req.body;
    const user = await User.findById(req.user._id);

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (photoURL) user.photoURL = photoURL;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        displayName: user.displayName,
        photoURL: user.photoURL,
        bio: user.bio,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
});

export default router;
