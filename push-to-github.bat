@echo off
REM ================================================================
REM  DEEP PAWN CHESS BOT - GitHub Push Script
REM  Run this AFTER creating the GitHub repo (see README-DEPLOY.md)
REM ================================================================

SET GIT="C:\Program Files\Git\bin\git.exe"
SET REPO="C:\Users\world\.gemini\antigravity\scratch\chess-bot"

REM Replace YOUR_USERNAME with your actual GitHub username
SET GITHUB_USERNAME=YOUR_USERNAME
SET REPO_NAME=deep-pawn-chess-bot

echo.
echo Connecting to GitHub remote...
%GIT% -C %REPO% remote remove origin 2>nul
%GIT% -C %REPO% remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo.
echo Pushing to GitHub...
%GIT% -C %REPO% push -u origin main

echo.
echo Done! Your chess bot is now live at:
echo   https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
echo To enable GitHub Pages (free web hosting), go to:
echo   https://github.com/%GITHUB_USERNAME%/%REPO_NAME%/settings/pages
echo   Source: Deploy from branch - main - / (root)
echo.
pause
