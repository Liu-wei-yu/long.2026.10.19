@echo off
chcp 65001 >nul
title 云海小镇 Cloud Town
cd /d "%~dp0"
echo.
echo   云海小镇 · Cloud Town
echo   启动本地服务器... 浏览器访问 http://localhost:5178/
echo   （关闭这个窗口即停止服务）
echo.
start "" http://localhost:5178/
"C:\Program Files\nodejs\node.exe" server.mjs 5178
pause
