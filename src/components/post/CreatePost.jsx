import React, { useState } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Box,
    Avatar,
    Typography,
    IconButton,
    ImageList,
    ImageListItem,
    Chip,
} from '@mui/material';
import {
    PhotoCamera as PhotoIcon,
    Close as CloseIcon,
    Public as PublicIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import api from '../../config/api';
import toast from 'react-hot-toast';

const CreatePost = ({ onPostCreated }) => {
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    const { user } = useAuth();

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: 4,
        maxSize: 5 * 1024 * 1024, // 5MB
        onDrop: (acceptedFiles) => {
            const newImages = acceptedFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setImages(prev => [...prev, ...newImages].slice(0, 4));
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(rejection => {
                rejection.errors.forEach(error => {
                    if (error.code === 'file-too-large') {
                        toast.error('File is too large. Max size is 5MB.');
                    } else if (error.code === 'file-invalid-type') {
                        toast.error('Invalid file type. Only images are allowed.');
                    }
                });
            });
        }
    });

    const removeImage = (index) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleAddTag = (event) => {
        if (event.key === 'Enter' && tagInput.trim()) {
            event.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag) && tags.length < 5) {
                setTags(prev => [...prev, newTag]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!content.trim()) {
            toast.error('Post content is required');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('content', content.trim());
            formData.append('tags', JSON.stringify(tags));

            images.forEach((image, index) => {
                formData.append('images', image.file);
            });

            const response = await api.post('/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Post created successfully!');

            // Reset form
            setContent('');
            setImages([]);
            setTags([]);
            setTagInput('');

            // Notify parent component
            if (onPostCreated) {
                onPostCreated(response.data.post);
            }

        } catch (error) {
            console.error('Create post error:', error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                        src={user?.photoURL}
                        alt={user?.displayName}
                        sx={{ mr: 2 }}
                    >
                        {user?.displayName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            <PublicIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Public
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'transparent',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'transparent',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
                        />
                    </Box>
                </Box>

                {/* Tags Input */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Add tags (press Enter)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleAddTag}
                        disabled={tags.length >= 5}
                    />
                    {tags.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={`#${tag}`}
                                    size="small"
                                    onDelete={() => removeTag(tag)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Image Upload Area */}
                <Box
                    {...getRootProps()}
                    sx={{
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        p: 2,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                        },
                    }}
                >
                    <input {...getInputProps()} />
                    <Box sx={{ textAlign: 'center' }}>
                        <PhotoIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Drop images here or click to select (max 4 images, 5MB each)
                        </Typography>
                    </Box>
                </Box>

                {/* Image Preview */}
                {images.length > 0 && (
                    <ImageList sx={{ mb: 2 }} cols={2} rowHeight={164}>
                        {images.map((image, index) => (
                            <ImageListItem key={index} sx={{ position: 'relative' }}>
                                <img
                                    src={image.preview}
                                    alt={`Preview ${index + 1}`}
                                    loading="lazy"
                                    style={{ objectFit: 'cover' }}
                                />
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        },
                                    }}
                                    size="small"
                                    onClick={() => removeImage(index)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </ImageListItem>
                        ))}
                    </ImageList>
                )}

                {/* Submit Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        sx={{ minWidth: 100 }}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CreatePost;
