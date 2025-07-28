import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    CircularProgress,
    Box,
    Typography,
    InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

const NewChatDialog = ({ open, onClose, onChatCreated }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const { user } = useAuth();

    // Search users
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/users?search=${encodeURIComponent(query)}&limit=10`);
            // Filter out current user
            const filteredUsers = response.data.users.filter(u => u._id !== user._id);
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Search users error:', error);
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchUsers(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Create new chat
    const handleCreateChat = async (participantId) => {
        try {
            setCreating(true);
            const response = await api.post('/chat', { participantId });

            toast.success('Chat created successfully!');
            onChatCreated(response.data);
            handleClose();
        } catch (error) {
            console.error('Create chat error:', error);
            toast.error('Failed to create chat');
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setUsers([]);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { height: '60vh' }
            }}
        >
            <DialogTitle>Start New Conversation</DialogTitle>

            <DialogContent>
                <TextField
                    fullWidth
                    placeholder="Search for users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : searchTerm && users.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            No users found
                        </Typography>
                    </Box>
                ) : !searchTerm ? (
                    <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                            Start typing to search for users
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {users.map((userData) => (
                            <ListItem
                                key={userData._id}
                                button
                                onClick={() => handleCreateChat(userData._id)}
                                disabled={creating}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={userData.photoURL}
                                        alt={userData.displayName}
                                    >
                                        {userData.displayName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={userData.displayName}
                                    secondary={
                                        <Box>
                                            {userData.bio && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {userData.bio}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                {userData.followersCount} followers • {userData.followingCount} following
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={creating}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewChatDialog;
