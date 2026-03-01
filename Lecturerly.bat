@echo off
title Lecturely PUBLIC Edition
color 0B

echo ==========================================
echo    启动 Lecturely [Public 独立版]...
echo ==========================================

:: 🚨 注意：把下面这行引号里的路径，换成你真实 Public 文件夹的完整路径！

cd /d "D:\Lecturely\Lecturely(Public Edition)"

echo 正在启动本地服务器 (端口 3001)...
echo.
:: 强制它运行在 3001 端口，绝对不和 Private 版的 3000 端口打架！
npm run dev -- -p 3001

pause