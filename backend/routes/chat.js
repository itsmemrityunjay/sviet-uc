import express from 'express';
import { body, validationResult } from 'express-validator';
import { Chat, Message } from '../models/Chat.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all chats for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', 'displayName photoURL isOnline lastSeen')
    .populate('lastMessage')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'displayName photoURL'
      }
    })
    .sort({ lastActivity: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Failed to get chats' });
  }
});

// Create a new chat or get existing one
router.post('/', [
  authenticateToken,
  body('participantId').notEmpty().withMessage('Participant ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantId, isGroupChat, groupName } = req.body;

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!isGroupChat) {
      // Check if chat already exists for these two users
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: [req.user._id, participantId] }
      })
      .populate('participants', 'displayName photoURL isOnline lastSeen')
      .populate('lastMessage');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    // Create new chat
    const chat = new Chat({
      participants: isGroupChat ? [req.user._id, ...participantId] : [req.user._id, participantId],
      isGroupChat: isGroupChat || false,
      groupName: isGroupChat ? groupName : undefined,
      admin: isGroupChat ? req.user._id : undefined
    });

    await chat.save();
    await chat.populate('participants', 'displayName photoURL isOnline lastSeen');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'displayName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ chat: chatId });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasMore: skip + messages.length < total
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

// Send a message
router.post('/:chatId/messages', [
  authenticateToken,
  body('content').notEmpty().withMessage('Message content is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName } = req.body;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      content,
      messageType,
      fileUrl,
      fileName
    });

    await message.save();
    await message.populate('sender', 'displayName photoURL');

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:chatId/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Delete a chat
router.delete('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // For group chats, only admin can delete
    if (chat.isGroupChat && chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can delete the chat' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

export default router;
