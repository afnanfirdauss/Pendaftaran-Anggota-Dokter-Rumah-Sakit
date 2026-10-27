@echo off
title MediQueue Hospital Patient Registration System
echo ===================================================
echo     MediQueue - Hospital Patient Registration
echo ===================================================
echo Starting Laravel API Server on http://localhost:8000 ...
start "MediQueue Backend (Laravel API)" cmd /k "cd /d %~dp0backend && php artisan serve --port=8000"

echo Starting Vite Frontend on http://localhost:5173 ...
start "MediQueue Frontend (Vite + React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Kedua server telah dijalankan di jendela terpisah!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api
echo - Layar Display TV: http://localhost:5173/display
echo.
pause
