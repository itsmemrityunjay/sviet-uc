import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Messages from './pages/Messages';

// Components
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Private Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      <Route path="/messages" element={
        <PrivateRoute>
          <Messages />
        </PrivateRoute>
      } />

      {/* Profile Route - will be added later */}
      <Route path="/profile/:userId" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      {/* Explore Route - will be added later */}
      <Route path="/explore" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      {/* Search Route - will be added later */}
      <Route path="/search" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      {/* Settings Route - will be added later */}
      <Route path="/settings" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
