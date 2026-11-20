@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist venv (echo 먼저 setup_windows.bat 을 실행하세요. & pause & exit /b 1)
call venv\Scripts\activate.bat
rem 다른 PC(학생)에서도 접속하게 하려면: start_server.bat --host 0.0.0.0
python realface_server.py %*
pause
