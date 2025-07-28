# 🚀 Vercel Deployment Guide

## ✅ Fixed Issues
- Fixed `vercel.json` routing from `index.js` to `server.js`
- Updated server configuration for Vercel compatibility
- Added production environment handling

## 🔧 Vercel Deployment Steps

### 1. Backend Deployment
```bash
cd backend
vercel --prod
```

### 2. Environment Variables (Set in Vercel Dashboard)
```
MONGODB_URI=your-mongodb-atlas-connection-string
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

### 3. Frontend Deployment
Update your frontend `.env` with the Vercel backend URL:
```
VITE_API_URL=https://your-backend.vercel.app
```

Then deploy frontend:
```bash
cd ..
vercel --prod
```

## 🔗 Important Notes

1. **MongoDB Atlas**: Use MongoDB Atlas (cloud) instead of local MongoDB
2. **CORS**: Backend is configured to accept requests from any origin
3. **Socket.io**: May need additional configuration for Vercel (consider using Vercel's WebSocket support)
4. **File Uploads**: Cloudinary is configured for image uploads

## 🆘 Troubleshooting

- **404 Error**: Ensure `vercel.json` points to correct entry file
- **Environment Variables**: Double-check all env vars are set in Vercel dashboard
- **MongoDB Connection**: Use MongoDB Atlas connection string
- **Firebase**: Ensure Firebase credentials are properly formatted

## 🌐 After Deployment
Your API will be available at: `https://your-project.vercel.app`
Update your frontend to use this URL instead of `localhost:5000`
