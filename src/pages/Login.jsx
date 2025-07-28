import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Container,
    Paper,
    CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { user, signInWithGoogle } = useAuth();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Redirect if already logged in
    if (user) {
        return <Navigate to={from} replace />;
    }

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            // Navigation will be handled by the auth state change
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: 400,
                    }}
                >
                    <Typography
                        component="h1"
                        variant="h3"
                        sx={{
                            mb: 2,
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Sviet Uncensored
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
                        Connect, Share, and Chat with Friends
                    </Typography>

                    <Card sx={{ width: '100%', mb: 3 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Welcome to Sviet Uncensored! Sign in to:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                <li>Share your thoughts and experiences</li>
                                <li>Connect with friends and meet new people</li>
                                <li>Chat in real-time with anyone</li>
                                <li>Discover interesting content</li>
                            </Box>
                        </CardContent>
                    </Card>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            background: 'linear-gradient(45deg, #4285f4 30%, #34a853 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #3367d6 30%, #2d8f47 90%)',
                            },
                        }}
                    >
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </Button>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 3, textAlign: 'center' }}
                    >
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
