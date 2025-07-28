# Sviet Uncensored - Social Media Platform

A complete MERN stack social media platform with real-time chat functionality using Firebase authentication.

## Features

- 🔐 **Firebase Google Authentication** - Secure login with Google accounts
- 📱 **Social Media Posts** - Create, like, comment, and share posts with images
- 💬 **Real-time Chat** - Instant messaging with online status indicators
- 👤 **User Profiles** - Follow/unfollow users, view profiles and posts
- 🔍 **Search** - Find users and posts
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Material-UI components with clean design
- ⚡ **Real-time Updates** - Socket.io for live notifications and messages

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Material-UI (MUI)** - Component library for beautiful UI
- **React Router** - Navigation and routing
- **Firebase Auth** - Authentication system
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client for API requests
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **Firebase Admin** - Server-side Firebase integration
- **Cloudinary** - Image upload and storage
- **Multer** - File upload handling
- **JWT** - Additional token security
- **Helmet** - Security middleware

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Firebase project
- Cloudinary account

### 1. Clone and Setup

```bash
# Navigate to project directory
cd "c:\Users\amans\Desktop\Mern"

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Backend (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sviet-uncensored
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Sign-in method → Google
4. Go to Project Settings → Service accounts
5. Generate new private key (download JSON)
6. Extract the required fields for your .env file

### 4. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from dashboard
3. Add them to your backend .env file

### 5. Run the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
Sviet-Uncensored/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Configuration files
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── socket/            # Socket.io handlers
│   └── server.js          # Main server file
├── src/                   # React frontend
│   ├── components/        # Reusable components
│   ├── context/          # React context providers
│   ├── pages/            # Page components
│   ├── config/           # Configuration files
│   └── main.jsx          # Entry point
├── public/               # Static assets
└── package.json         # Frontend dependencies
```

## Key Features Explained

### Authentication
- Google OAuth integration via Firebase
- Automatic user creation on first login
- JWT tokens for API security
- Session persistence

### Posts
- Rich text content with image support
- Like and comment functionality
- Real-time updates via Socket.io
- Image upload to Cloudinary

### Chat System
- One-on-one messaging
- Real-time message delivery
- Online status indicators
- Typing indicators
- Message history

### Real-time Features
- Live post likes/comments
- Instant messaging
- Online user status
- Push-like notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register/login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `DELETE /api/posts/:id` - Delete post

### Users
- `GET /api/users` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/follow` - Follow/unfollow user

### Chat
- `GET /api/chat` - Get user's chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/:id/messages` - Get chat messages
- `POST /api/chat/:id/messages` - Send message

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in platform settings

### Backend (Railway/Heroku)
1. Set environment variables
2. Ensure MongoDB connection
3. Deploy backend code
4. Update frontend API URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed description

---

**Note**: This is a complete, production-ready social media platform. Make sure to secure your environment variables and never commit sensitive data to version control.
