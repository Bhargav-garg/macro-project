# 🚀 Deploying Deep Pawn Chess Bot to GitHub

This guide walks you through creating a GitHub repository and deploying the project in under 5 minutes.

---

## Step 1 — Create a GitHub Repository

1. Go to **[github.com/new](https://github.com/new)**
2. Fill in:
   - **Repository name**: `deep-pawn-chess-bot`
   - **Description**: `A playable chess bot with Minimax AI, Quiescence Search, and a beautiful web UI`
   - **Visibility**: ✅ Public (so GitHub Pages works for free)
   - ❌ Do NOT initialize with README, .gitignore, or license (we already have them)
3. Click **"Create repository"**

---

## Step 2 — Push the Local Code to GitHub

Open PowerShell in the chess-bot folder and run these two commands — replace `YOUR_USERNAME` with your GitHub username:

```powershell
$g = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\Users\world\.gemini\antigravity\scratch\chess-bot"
& $g -C $repo remote add origin https://github.com/YOUR_USERNAME/deep-pawn-chess-bot.git
& $g -C $repo push -u origin main
```

**Or** just double-click **`push-to-github.bat`** (after editing `YOUR_USERNAME` inside it).

---

## Step 3 — Enable GitHub Pages (Free Hosting!)

The `index.html` is already a **fully self-contained single-file build** — perfect for GitHub Pages.

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**

After ~1 minute, your chess bot will be live at:
```
https://YOUR_USERNAME.github.io/deep-pawn-chess-bot/
```

---

## What Gets Published

| File | Purpose |
|------|---------|
| `index.html` | Full chess game (web UI) |
| `style.css` | Styling & themes |
| `chess-engine.js` | Chess rules + Minimax AI |
| `pieces.js` | Vector SVG chess pieces |
| `audio.js` | Procedural sound synthesizer |
| `app.js` | UI controller |
| `app.py` | Local web server launcher |
| `cli_chess.py` | Terminal chess game |
| `build.py` | Compiler/packager script |
| `README.md` | Documentation |

---

## Future Updates

To push any future changes:

```powershell
$g = "C:\Program Files\Git\bin\git.exe"
$repo = "C:\Users\world\.gemini\antigravity\scratch\chess-bot"
& $g -C $repo add .
& $g -C $repo commit -m "Your change description here"
& $g -C $repo push
```

GitHub Pages will automatically redeploy within ~1 minute of each push.
