import React, { useState } from 'react';
import { Grid, useTheme, useMediaQuery, Box } from '@mui/material';
import Layout from '../components/layout/Layout';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatDialog from '../components/chat/NewChatDialog';

const Messages = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
    const [showChatList, setShowChatList] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        if (isMobile) {
            setShowChatList(false);
        }
    };

    const handleNewChat = () => {
        setNewChatDialogOpen(true);
    };

    const handleChatCreated = (newChat) => {
        setSelectedChat(newChat);
        if (isMobile) {
            setShowChatList(false);
        }
    };

    const handleBackToList = () => {
        setShowChatList(true);
        setSelectedChat(null);
    };

    return (
        <Layout>
            <Box sx={{ height: 'calc(100vh - 88px)', overflow: 'hidden' }}>
                {isMobile ? (
                    // Mobile view - show either chat list or chat window
                    showChatList ? (
                        <ChatList
                            selectedChat={selectedChat}
                            onChatSelect={handleChatSelect}
                            onNewChat={handleNewChat}
                        />
                    ) : (
                        <ChatWindow
                            chat={selectedChat}
                            onBack={handleBackToList}
                        />
                    )
                ) : (
                    // Desktop view - show both side by side
                    <Grid container sx={{ height: '100%' }}>
                        <Grid item xs={4}>
                            <ChatList
                                selectedChat={selectedChat}
                                onChatSelect={handleChatSelect}
                                onNewChat={handleNewChat}
                            />
                        </Grid>
                        <Grid item xs={8}>
                            <ChatWindow chat={selectedChat} />
                        </Grid>
                    </Grid>
                )}
            </Box>

            <NewChatDialog
                open={newChatDialogOpen}
                onClose={() => setNewChatDialogOpen(false)}
                onChatCreated={handleChatCreated}
            />
        </Layout>
    );
};

export default Messages;
