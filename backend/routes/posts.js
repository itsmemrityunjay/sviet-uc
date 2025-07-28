import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create a new post
router.post('/', [
  authenticateToken,
  upload.array('images', 4),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, tags } = req.body;
    const images = [];

    // Upload images to Cloudinary if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'sviet-uncensored/posts',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        images.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    const post = new Post({
      author: req.user._id,
      content,
      images,
      tags: tags ? JSON.parse(tags) : []
    });

    await post.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    // Populate author information
    await post.populate('author', 'displayName photoURL verified');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Get all posts (feed)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'displayName photoURL verified')
      .populate('comments.user', 'displayName photoURL')
      .populate('likes.user', 'displayName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'displayName photoURL verified')
      .populate('comments.user', 'displayName photoURL')
      .populate('likes.user', 'displayName photoURL');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Failed to get post' });
  }
});

// Like/Unlike a post
router.put('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = post.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike the post
      post.likes = post.likes.filter(like => 
        like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like the post
      post.likes.push({ user: req.user._id });
    }

    await post.save();
    await post.populate('likes.user', 'displayName photoURL');

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likes: post.likes
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Failed to like/unlike post' });
  }
});

// Add comment to post
router.post('/:id/comment', [
  authenticateToken,
  body('content').isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.user._id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'displayName photoURL');

    res.status(201).json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: req.params.id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Get posts by user
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'displayName photoURL verified')
      .populate('comments.user', 'displayName photoURL')
      .populate('likes.user', 'displayName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: req.params.userId });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to get user posts' });
  }
});

export default router;
