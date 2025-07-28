# PowerShell Installation Script
Write-Host "🚀 Installing Sviet Uncensored..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies." -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Firebase settings in .env file" -ForegroundColor White
Write-Host "2. Configure MongoDB URL in backend/.env file" -ForegroundColor White
Write-Host "3. Configure Cloudinary settings in backend/.env file" -ForegroundColor White
Write-Host "4. Start backend: cd backend; npm run dev" -ForegroundColor White
Write-Host "5. Start frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed setup instructions, see README.md" -ForegroundColor White
