import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Badge,
    List,
    ListItem,
    Divider,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    EmojiEmotions as EmojiIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

const ChatWindow = ({ chat, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());

    const { user } = useAuth();
    const { socket, joinChat, leaveChat, sendMessage, sendTyping, stopTyping, onlineUsers } = useSocket();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const otherParticipant = chat?.participants?.find(p => p._id !== user._id);
    const isOnline = onlineUsers.has(otherParticipant?._id);

    // Fetch messages
    const fetchMessages = async () => {
        if (!chat) return;

        try {
            setLoading(true);
            const response = await api.get(`/chat/${chat._id}/messages`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Fetch messages error:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    // Join chat room when chat changes
    useEffect(() => {
        if (chat && socket) {
            joinChat(chat._id);
            fetchMessages();

            return () => {
                leaveChat(chat._id);
            };
        }
    }, [chat, socket]);

    // Listen for new messages and typing indicators
    useEffect(() => {
        if (socket) {
            const handleNewMessage = (message) => {
                if (message.chat === chat?._id) {
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                }
            };

            const handleUserTyping = ({ userId, isTyping }) => {
                if (userId !== user._id) {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        if (isTyping) {
                            newSet.add(userId);
                        } else {
                            newSet.delete(userId);
                        }
                        return newSet;
                    });
                }
            };

            socket.on('newMessage', handleNewMessage);
            socket.on('userTyping', handleUserTyping);

            return () => {
                socket.off('newMessage', handleNewMessage);
                socket.off('userTyping', handleUserTyping);
            };
        }
    }, [socket, chat, user]);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle typing indicator
    const handleTyping = () => {
        if (!typing && socket) {
            setTyping(true);
            sendTyping(chat._id);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
            stopTyping(chat._id);
        }, 2000);
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !chat) return;

        const messageData = {
            chatId: chat._id,
            content: newMessage.trim(),
        };

        try {
            // Send via socket for real-time delivery
            sendMessage(messageData);

            // Also send via API for persistence
            await api.post(`/chat/${chat._id}/messages`, {
                content: newMessage.trim(),
            });

            setNewMessage('');

            // Stop typing indicator
            if (typing) {
                setTyping(false);
                stopTyping(chat._id);
            }
        } catch (error) {
            console.error('Send message error:', error);
            toast.error('Failed to send message');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        } else {
            handleTyping();
        }
    };

    const formatMessageTime = (date) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) {
            return format(messageDate, 'HH:mm');
        } else if (isYesterday(messageDate)) {
            return `Yesterday ${format(messageDate, 'HH:mm')}`;
        } else {
            return format(messageDate, 'MMM dd, HH:mm');
        }
    };

    const groupMessagesByDate = (messages) => {
        const groups = [];
        let currentGroup = null;

        messages.forEach((message) => {
            const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd');

            if (!currentGroup || currentGroup.date !== messageDate) {
                currentGroup = {
                    date: messageDate,
                    messages: [message]
                };
                groups.push(currentGroup);
            } else {
                currentGroup.messages.push(message);
            }
        });

        return groups;
    };

    if (!chat) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                sx={{ color: 'text.secondary' }}
            >
                <Typography variant="h6">Select a conversation to start messaging</Typography>
            </Box>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color="success"
                        invisible={!isOnline}
                    >
                        <Avatar
                            src={otherParticipant?.photoURL}
                            alt={otherParticipant?.displayName}
                            sx={{ mr: 2 }}
                        >
                            {otherParticipant?.displayName?.charAt(0)}
                        </Avatar>
                    </Badge>

                    <Box>
                        <Typography variant="h6">
                            {otherParticipant?.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(otherParticipant?.lastSeen), { addSuffix: true })}`}
                        </Typography>
                    </Box>
                </Box>

                <IconButton>
                    <MoreVertIcon />
                </IconButton>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Loading messages...</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {messageGroups.map((group) => (
                            <React.Fragment key={group.date}>
                                {/* Date Divider */}
                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                        backgroundColor: 'background.paper',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: 'divider'
                                    }}>
                                        {isToday(new Date(group.date)) ? 'Today' :
                                            isYesterday(new Date(group.date)) ? 'Yesterday' :
                                                format(new Date(group.date), 'MMM dd, yyyy')}
                                    </Typography>
                                </Box>

                                {/* Messages */}
                                {group.messages.map((message) => {
                                    const isOwn = message.sender._id === user._id;

                                    return (
                                        <ListItem
                                            key={message._id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                                px: 1,
                                                py: 0.5,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    maxWidth: '70%',
                                                    backgroundColor: isOwn ? 'primary.main' : 'grey.200',
                                                    color: isOwn ? 'primary.contrastText' : 'text.primary',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    py: 1,
                                                    position: 'relative',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {message.content}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        opacity: 0.7,
                                                        fontSize: '0.75rem',
                                                        display: 'block',
                                                        textAlign: 'right',
                                                        mt: 0.5
                                                    }}
                                                >
                                                    {formatMessageTime(message.createdAt)}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {/* Typing Indicator */}
                        {typingUsers.size > 0 && (
                            <ListItem sx={{ justifyContent: 'flex-start' }}>
                                <Box
                                    sx={{
                                        backgroundColor: 'grey.200',
                                        borderRadius: 2,
                                        px: 2,
                                        py: 1,
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                        {otherParticipant?.displayName} is typing...
                                    </Typography>
                                </Box>
                            </ListItem>
                        )}

                        <div ref={messagesEndRef} />
                    </List>
                )}
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={4}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Tooltip title="Attach file">
                                    <IconButton size="small">
                                        <AttachFileIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Emoji">
                                    <IconButton size="small">
                                        <EmojiIcon />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="Send message">
                                    <IconButton
                                        color="primary"
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
        </Paper>
    );
};

export default ChatWindow;
