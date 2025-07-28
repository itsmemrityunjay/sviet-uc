import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Home as HomeIcon,
    Person as PersonIcon,
    Message as MessageIcon,
    Explore as ExploreIcon,
    Bookmark as BookmarkIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const menuItems = [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Explore', icon: <ExploreIcon />, path: '/explore' },
        { text: 'Messages', icon: <MessageIcon />, path: '/messages' },
        { text: 'Bookmarks', icon: <BookmarkIcon />, path: '/bookmarks' },
        { text: 'Profile', icon: <PersonIcon />, path: `/profile/${user?._id}` },
    ];

    if (isMobile) {
        return null; // Sidebar is hidden on mobile, using drawer in Navbar instead
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    top: '64px', // Height of AppBar
                    height: 'calc(100% - 64px)',
                },
            }}
        >
            <Box sx={{ overflow: 'auto', mt: 2 }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => navigate(item.path)}
                            selected={location.pathname === item.path}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.light,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.light,
                                    },
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path ?
                                        theme.palette.primary.main : 'inherit'
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        color: location.pathname === item.path ?
                                            theme.palette.primary.main : 'inherit',
                                    },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
