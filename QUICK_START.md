# 🚀 Quick Start Guide - Sviet Uncensored

## ✅ Dependencies Installed Successfully!

### 🔧 Setup Configuration

1. **Configure Firebase (.env file)**
   ```
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```

2. **Configure Backend (backend/.env file)**
   ```
   MONGODB_URI=mongodb://localhost:27017/sviet-uncensored
   FIREBASE_PROJECT_ID=your-project-id
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   ```

### 🏃‍♂️ Running the Application

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### 🌐 Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### 🔑 Firebase Setup (Required)
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable Authentication → Google Sign-in
4. Get your config from Project Settings
5. Update the .env file with your values

### 📱 Features Ready to Use
- ✅ Google Authentication
- ✅ Create/Share Posts
- ✅ Real-time Chat
- ✅ Like/Comment System
- ✅ User Profiles
- ✅ Responsive Design

### 🆘 Need Help?
- Check README.md for detailed instructions
- Ensure MongoDB is running (local or Atlas)
- Verify all environment variables are set

**Happy coding! 🎉**
