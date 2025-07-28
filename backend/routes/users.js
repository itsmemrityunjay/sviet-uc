import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all users (search)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query = {
        $or: [
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('displayName photoURL bio verified followers following')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    const usersWithCounts = users.map(user => ({
      ...user.toObject(),
      followersCount: user.followers.length,
      followingCount: user.following.length,
      followers: undefined,
      following: undefined
    }));

    res.json({
      users: usersWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get user profile by ID
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'displayName photoURL verified')
      .populate('following', 'displayName photoURL verified')
      .select('-uid');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: req.params.userId });

    const userProfile = {
      ...user.toObject(),
      postsCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing: req.user ? user.followers.some(follower => 
        follower._id.toString() === req.user._id.toString()
      ) : false
    };

    res.json(userProfile);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Follow/Unfollow user
router.put('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: isFollowing ? 'User unfollowed' : 'User followed',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Failed to follow/unfollow user' });
  }
});

// Get user's followers
router.get('/:userId/followers', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'followers',
        select: 'displayName photoURL bio verified',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.followers.length;

    res.json({
      followers: user.followers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFollowers: total,
        hasMore: skip + user.followers.length < total
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Failed to get followers' });
  }
});

// Get user's following
router.get('/:userId/following', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'following',
        select: 'displayName photoURL bio verified',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.following.length;

    res.json({
      following: user.following,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFollowing: total,
        hasMore: skip + user.following.length < total
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Failed to get following' });
  }
});

export default router;
