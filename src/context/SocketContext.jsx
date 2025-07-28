import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getIdToken } from 'firebase/auth';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [connected, setConnected] = useState(false);
    const { user, firebaseUser } = useAuth();

    useEffect(() => {
        if (user && firebaseUser) {
            const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            const newSocket = io(socketUrl);

            newSocket.on('connect', async () => {
                console.log('Connected to server');
                setConnected(true);

                try {
                    // Authenticate with the server
                    const token = await getIdToken(firebaseUser);
                    newSocket.emit('authenticate', token);
                } catch (error) {
                    console.error('Socket authentication error:', error);
                }
            });

            newSocket.on('authenticated', (data) => {
                console.log('Socket authenticated:', data);
            });

            newSocket.on('authError', (error) => {
                console.error('Socket auth error:', error);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
                setConnected(false);
            });

            newSocket.on('userOnline', (data) => {
                setOnlineUsers(prev => new Set([...prev, data.userId]));
            });

            newSocket.on('userOffline', (data) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.userId);
                    return newSet;
                });
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            // If user is not authenticated, cleanup socket
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
                setOnlineUsers(new Set());
            }
        }
    }, [user, firebaseUser]);

    // Join a chat room
    const joinChat = (chatId) => {
        if (socket && connected) {
            socket.emit('joinChat', chatId);
        }
    };

    // Leave a chat room
    const leaveChat = (chatId) => {
        if (socket && connected) {
            socket.emit('leaveChat', chatId);
        }
    };

    // Send a message
    const sendMessage = (messageData) => {
        if (socket && connected) {
            socket.emit('sendMessage', messageData);
        }
    };

    // Send typing indicator
    const sendTyping = (chatId) => {
        if (socket && connected) {
            socket.emit('typing', { chatId });
        }
    };

    // Stop typing indicator
    const stopTyping = (chatId) => {
        if (socket && connected) {
            socket.emit('stopTyping', { chatId });
        }
    };

    // Mark message as read
    const markAsRead = (chatId, messageId) => {
        if (socket && connected) {
            socket.emit('markAsRead', { chatId, messageId });
        }
    };

    // Emit post interactions
    const likePost = (postData) => {
        if (socket && connected) {
            socket.emit('likePost', postData);
        }
    };

    const commentOnPost = (commentData) => {
        if (socket && connected) {
            socket.emit('commentOnPost', commentData);
        }
    };

    const value = {
        socket,
        connected,
        onlineUsers,
        joinChat,
        leaveChat,
        sendMessage,
        sendTyping,
        stopTyping,
        markAsRead,
        likePost,
        commentOnPost,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
