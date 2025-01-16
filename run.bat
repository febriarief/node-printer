@echo off
start ngrok http --url={NGROK_STATIC_URL} 3000
timeout /t 3 >nul
node app.js
pause