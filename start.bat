@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Verifying build...
npx next build
if %errorlevel% neq 0 (
    echo Build failed. Fix errors above before starting the dev server.
    pause
    exit /b %errorlevel%
)
echo Starting Aria dev server...
npm run dev
pause
