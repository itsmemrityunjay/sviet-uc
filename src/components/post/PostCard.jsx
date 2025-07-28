import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    Typography,
    IconButton,
    Box,
    Chip,
    ImageList,
    ImageListItem,
    Button,
    Collapse,
    TextField,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import {
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteIconBorder,
    Comment as CommentIcon,
    Share as ShareIcon,
    MoreVert as MoreVertIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Verified as VerifiedIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

const PostCard = ({ post, onPostUpdate, onPostDelete }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const { user } = useAuth();
    const { likePost, commentOnPost } = useSocket();

    // Check if current user has liked the post
    React.useEffect(() => {
        if (user && post.likes) {
            const userLiked = post.likes.some(like => like.user?._id === user._id);
            setLiked(userLiked);
        }
    }, [post.likes, user]);

    const handleLike = async () => {
        try {
            const response = await api.put(`/posts/${post._id}/like`);

            const newLiked = !liked;
            setLiked(newLiked);
            setLikesCount(response.data.likes.length);

            // Emit socket event for real-time updates
            likePost({
                postId: post._id,
                userId: user._id,
                liked: newLiked,
                likesCount: response.data.likes.length
            });

        } catch (error) {
            console.error('Like error:', error);
            toast.error('Failed to like post');
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;

        try {
            setLoading(true);
            const response = await api.post(`/posts/${post._id}/comment`, {
                content: newComment.trim()
            });

            const newCommentObj = response.data.comment;
            setComments(prev => [...prev, newCommentObj]);
            setNewComment('');

            // Emit socket event for real-time updates
            commentOnPost({
                postId: post._id,
                comment: newCommentObj
            });

            toast.success('Comment added successfully');
        } catch (error) {
            console.error('Comment error:', error);
            toast.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${post._id}`);
            toast.success('Post deleted successfully');
            if (onPostDelete) {
                onPostDelete(post._id);
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete post');
        } finally {
            setDeleteDialog(false);
        }
    };

    const isAuthor = user && post.author._id === user._id;

    return (
        <>
            <Card sx={{ mb: 3, maxWidth: '100%' }}>
                <CardHeader
                    avatar={
                        <Avatar
                            src={post.author.photoURL}
                            alt={post.author.displayName}
                        >
                            {post.author.displayName.charAt(0)}
                        </Avatar>
                    }
                    action={
                        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                            <MoreVertIcon />
                        </IconButton>
                    }
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" component="span">
                                {post.author.displayName}
                            </Typography>
                            {post.author.verified && (
                                <VerifiedIcon sx={{ ml: 0.5, fontSize: 16, color: 'primary.main' }} />
                            )}
                        </Box>
                    }
                    subheader={formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                />

                <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {post.content}
                    </Typography>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {post.tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={`#${tag}`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            ))}
                        </Box>
                    )}

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <ImageList
                            cols={post.images.length === 1 ? 1 : 2}
                            rowHeight={300}
                            sx={{ mb: 2 }}
                        >
                            {post.images.map((image, index) => (
                                <ImageListItem key={index}>
                                    <img
                                        src={image.url}
                                        alt={`Post image ${index + 1}`}
                                        loading="lazy"
                                        style={{ objectFit: 'cover', borderRadius: 8 }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    )}
                </CardContent>

                <CardActions sx={{ px: 2, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <IconButton onClick={handleLike} color={liked ? 'error' : 'default'}>
                            {liked ? <FavoriteIcon /> : <FavoriteIconBorder />}
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            {likesCount}
                        </Typography>

                        <IconButton onClick={() => setShowComments(!showComments)}>
                            <CommentIcon />
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            {comments.length}
                        </Typography>

                        <IconButton>
                            <ShareIcon />
                        </IconButton>
                    </Box>

                    <Button
                        size="small"
                        onClick={() => setShowComments(!showComments)}
                        endIcon={showComments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {showComments ? 'Hide' : 'Show'} Comments
                    </Button>
                </CardActions>

                {/* Comments Section */}
                <Collapse in={showComments} timeout="auto" unmountOnExit>
                    <CardContent sx={{ pt: 0 }}>
                        {/* Add Comment */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                src={user?.photoURL}
                                alt={user?.displayName}
                                sx={{ width: 32, height: 32, mr: 1 }}
                            >
                                {user?.displayName?.charAt(0)}
                            </Avatar>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleComment();
                                    }
                                }}
                                multiline
                                maxRows={3}
                            />
                            <Button
                                onClick={handleComment}
                                disabled={!newComment.trim() || loading}
                                sx={{ ml: 1 }}
                            >
                                Post
                            </Button>
                        </Box>

                        {/* Comments List */}
                        {comments.map((comment) => (
                            <Box key={comment._id} sx={{ display: 'flex', mb: 2 }}>
                                <Avatar
                                    src={comment.user.photoURL}
                                    alt={comment.user.displayName}
                                    sx={{ width: 32, height: 32, mr: 1 }}
                                >
                                    {comment.user.displayName.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box
                                        sx={{
                                            backgroundColor: 'grey.100',
                                            borderRadius: 2,
                                            px: 2,
                                            py: 1,
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {comment.user.displayName}
                                        </Typography>
                                        <Typography variant="body2">
                                            {comment.content}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </CardContent>
                </Collapse>
            </Card>

            {/* More Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                {isAuthor && (
                    <MenuItem
                        onClick={() => {
                            setMenuAnchor(null);
                            setDeleteDialog(true);
                        }}
                    >
                        <DeleteIcon sx={{ mr: 1 }} />
                        Delete Post
                    </MenuItem>
                )}
                <MenuItem onClick={() => setMenuAnchor(null)}>
                    <ShareIcon sx={{ mr: 1 }} />
                    Share Post
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
            >
                <DialogTitle>Delete Post</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this post? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PostCard;
