import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import Layout from '../components/layout/Layout';
import CreatePost from '../components/post/CreatePost';
import PostCard from '../components/post/PostCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../config/api';
import toast from 'react-hot-toast';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Fetch posts
    const fetchPosts = async (pageNum = 1, reset = false) => {
        try {
            const response = await api.get(`/posts?page=${pageNum}&limit=10`);
            const { posts: newPosts, pagination } = response.data;

            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setHasMore(pagination.hasMore);
            setPage(pageNum + 1);
        } catch (error) {
            console.error('Fetch posts error:', error);
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchPosts(1, true);
    }, []);

    // Load more posts
    const loadMorePosts = () => {
        fetchPosts(page);
    };

    // Handle new post creation
    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    // Handle post deletion
    const handlePostDelete = (postId) => {
        setPosts(prev => prev.filter(post => post._id !== postId));
    };

    if (loading && posts.length === 0) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Container maxWidth="md" sx={{ py: 2 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Home Feed
                </Typography>

                {/* Create Post */}
                <CreatePost onPostCreated={handlePostCreated} />

                {/* Posts Feed */}
                <InfiniteScroll
                    dataLength={posts.length}
                    next={loadMorePosts}
                    hasMore={hasMore}
                    loader={
                        <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress />
                        </Box>
                    }
                    endMessage={
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ py: 2 }}
                        >
                            You've seen all posts!
                        </Typography>
                    }
                >
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onPostDelete={handlePostDelete}
                        />
                    ))}
                </InfiniteScroll>

                {posts.length === 0 && !loading && (
                    <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            No posts yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Be the first to share something!
                        </Typography>
                    </Box>
                )}
            </Container>
        </Layout>
    );
};

export default Home;
