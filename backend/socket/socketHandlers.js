import { Message, Chat } from '../models/Chat.js';
import User from '../models/User.js';
import admin from '../config/firebase.js';

const connectedUsers = new Map();

export const handleSocketConnection = (socket, io) => {
  console.log('New socket connection:', socket.id);

  // Handle user authentication and connection
  socket.on('authenticate', async (token) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ uid: decodedToken.uid });
      
      if (user) {
        socket.userId = user._id.toString();
        connectedUsers.set(user._id.toString(), socket.id);
        
        // Update user online status
        await User.findByIdAndUpdate(user._id, { 
          isOnline: true,
          lastSeen: new Date()
        });

        socket.emit('authenticated', { success: true });
        
        // Notify user's contacts about online status
        io.emit('userOnline', { userId: user._id });
        
        console.log(`User ${user.displayName} connected`);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  });

  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle new message
  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, content, messageType = 'text', fileUrl, fileName } = data;

      // Verify user is part of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId
      });

      if (!chat) {
        socket.emit('messageError', { message: 'Chat not found or access denied' });
        return;
      }

      // Create and save message
      const message = new Message({
        chat: chatId,
        sender: socket.userId,
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

      // Send message to all users in the chat room
      io.to(chatId).emit('newMessage', message);

      // Send push notifications to offline users
      const offlineParticipants = await User.find({
        _id: { $in: chat.participants },
        isOnline: false,
        _id: { $ne: socket.userId }
      });

      // Here you could implement push notifications for offline users
      // using Firebase Cloud Messaging or other notification services

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('messageError', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('userTyping', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.chatId).emit('userTyping', {
      userId: socket.userId,
      isTyping: false
    });
  });

  // Handle message read receipts
  socket.on('markAsRead', async (data) => {
    try {
      const { chatId, messageId } = data;

      await Message.findByIdAndUpdate(messageId, {
        $addToSet: {
          readBy: {
            user: socket.userId,
            readAt: new Date()
          }
        }
      });

      socket.to(chatId).emit('messageRead', {
        messageId,
        userId: socket.userId,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // Handle real-time post interactions
  socket.on('likePost', (data) => {
    io.emit('postLiked', data);
  });

  socket.on('commentOnPost', (data) => {
    io.emit('newComment', data);
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify user's contacts about offline status
      io.emit('userOffline', { userId: socket.userId });
    }
  });
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};
