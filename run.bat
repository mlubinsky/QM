@echo off
setlocal

:: ── Backend ──────────────────────────────────────────────────────────────────
cd backend
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q
start "QM Backend" cmd /k "uvicorn app:app --port 8000"
cd ..

:: ── Frontend ─────────────────────────────────────────────────────────────────
cd frontend
npm install --silent
start "QM Frontend" cmd /k "npm run dev"
cd ..

echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173  ^<-- open this
echo.
echo   Close the "QM Backend" and "QM Frontend" windows to stop the servers.
pause
