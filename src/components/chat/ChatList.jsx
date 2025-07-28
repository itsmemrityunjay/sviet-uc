import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    TextField,
    IconButton,
    Badge,
    Divider,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../config/api';

const ChatList = ({ selectedChat, onChatSelect, onNewChat }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();

    // Fetch chats
    const fetchChats = async () => {
        try {
            const response = await api.get('/chat');
            setChats(response.data);
        } catch (error) {
            console.error('Fetch chats error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    // Listen for new messages
    useEffect(() => {
        if (socket) {
            const handleNewMessage = (message) => {
                setChats(prevChats => {
                    return prevChats.map(chat => {
                        if (chat._id === message.chat) {
                            return {
                                ...chat,
                                lastMessage: message,
                                lastActivity: message.createdAt
                            };
                        }
                        return chat;
                    }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
                });
            };

            socket.on('newMessage', handleNewMessage);

            return () => {
                socket.off('newMessage', handleNewMessage);
            };
        }
    }, [socket]);

    const filteredChats = chats.filter(chat => {
        const otherParticipant = chat.participants.find(p => p._id !== user._id);
        return otherParticipant?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getOtherParticipant = (chat) => {
        return chat.participants.find(p => p._id !== user._id);
    };

    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Messages</Typography>
                    <IconButton onClick={onNewChat} color="primary">
                        <AddIcon />
                    </IconButton>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Chat List */}
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                {filteredChats.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'No conversations found' : 'No conversations yet'}
                        </Typography>
                    </Box>
                ) : (
                    filteredChats.map((chat) => {
                        const otherParticipant = getOtherParticipant(chat);
                        const isSelected = selectedChat?._id === chat._id;
                        const isOnline = isUserOnline(otherParticipant?._id);

                        return (
                            <React.Fragment key={chat._id}>
                                <ListItem
                                    button
                                    selected={isSelected}
                                    onClick={() => onChatSelect(chat)}
                                    sx={{
                                        py: 1.5,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.light',
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                            },
                                        },
                                    }}
                                >
                                    <ListItemAvatar>
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
                                            >
                                                {otherParticipant?.displayName?.charAt(0)}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" noWrap>
                                                {otherParticipant?.displayName}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {chat.lastMessage ? (
                                                        chat.lastMessage.sender === user._id ?
                                                            `You: ${chat.lastMessage.content}` :
                                                            chat.lastMessage.content
                                                    ) : (
                                                        'Start a conversation'
                                                    )}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {chat.lastActivity && formatDistanceToNow(
                                                        new Date(chat.lastActivity),
                                                        { addSuffix: true }
                                                    )}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </React.Fragment>
                        );
                    })
                )}
            </List>
        </Paper>
    );
};

export default ChatList;
