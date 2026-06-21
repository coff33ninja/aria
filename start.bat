@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Verifying build...
call npx next build
if errorlevel 1 (
    echo.
    echo === BUILD FAILED ===
    echo Scroll up to see errors, then fix them and run this script again.
    pause
    exit /b 1
)
echo.
echo Starting Aria dev server...
echo.
call npm run dev
pause
