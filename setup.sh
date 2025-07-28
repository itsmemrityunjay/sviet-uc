#!/bin/bash

echo "Installing Sviet Uncensored..."
echo ""

echo "[1/4] Installing frontend dependencies..."
npm install

echo ""
echo "[2/4] Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "[3/4] Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Frontend .env file created from example"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Backend .env file created from example"
fi

echo ""
echo "[4/4] Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Firebase in .env file"
echo "2. Configure MongoDB in backend/.env file"
echo "3. Configure Cloudinary in backend/.env file"
echo "4. Run 'npm run dev' to start frontend"
echo "5. Run 'cd backend && npm run dev' to start backend"
echo ""
echo "For detailed setup instructions, see README.md"
