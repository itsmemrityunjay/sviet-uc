import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    getIdToken
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import api from '../config/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState(null);

    // Google Sign In
    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await getIdToken(result.user);

            // Send token to backend
            const response = await api.post('/auth/register', { idToken });

            localStorage.setItem('authToken', idToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            setUser(response.data.user);
            setFirebaseUser(result.user);

            toast.success('Successfully signed in!');
            return response.data.user;
        } catch (error) {
            console.error('Sign in error:', error);
            toast.error('Failed to sign in. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign Out
    const logout = async () => {
        try {
            setLoading(true);

            // Notify backend about logout
            if (user) {
                await api.post('/auth/logout');
            }

            await signOut(auth);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            setUser(null);
            setFirebaseUser(null);

            toast.success('Successfully signed out!');
        } catch (error) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        } finally {
            setLoading(false);
        }
    };

    // Update user profile
    const updateUserProfile = async (profileData) => {
        try {
            const response = await api.put('/auth/profile', profileData);
            const updatedUser = { ...user, ...response.data.user };

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated successfully!');
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Failed to update profile');
            throw error;
        }
    };

    // Get fresh user data
    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/profile');
            const updatedUser = response.data;

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            return updatedUser;
        } catch (error) {
            console.error('Refresh user error:', error);
            throw error;
        }
    };

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setFirebaseUser(firebaseUser);

                    // Get fresh token
                    const idToken = await getIdToken(firebaseUser);
                    localStorage.setItem('authToken', idToken);

                    // Get user data from localStorage or fetch from backend
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    } else {
                        // Fetch user data from backend
                        try {
                            const response = await api.get('/auth/profile');
                            setUser(response.data);
                            localStorage.setItem('user', JSON.stringify(response.data));
                        } catch (error) {
                            console.error('Failed to fetch user profile:', error);
                            // If profile fetch fails, clear everything
                            await signOut(auth);
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('user');
                        }
                    }
                } else {
                    setFirebaseUser(null);
                    setUser(null);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('Auth state change error:', error);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        logout,
        updateUserProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
