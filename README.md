# ♚ Deep Pawn - Playable Chess Bot

A complete, responsive, and standalone Chess application featuring a smart AI bot powered by **Minimax with Alpha-Beta Pruning**, **Quiescence Search**, **Move Ordering**, and **Piece-Square Evaluation Tables**.

Zero external npm or pip dependencies required! Runs immediately in any modern web browser or terminal.

---

## 🚀 Quick Start

### Option 1: Modern Web UI (Recommended)
You can play immediately using either of these methods:

1. **One-Click Python Launcher**:
   ```powershell
   python app.py
   ```
   *Automatically starts a local lightweight web server and opens the game in your default browser.*

2. **Direct Browser Open**:
   Simply double-click `index.html` in File Explorer or right-click `index.html` -> **Open with Chrome / Edge / Firefox**.

---

### Option 2: Terminal / Console CLI
For keyboard and command-line lovers, play directly in your terminal with colored Unicode chess pieces:
```powershell
python cli_chess.py
```
- Enter moves in standard coordinate format: `e2e4`, `g1f3`, `e7e8q` (for promotion).
- Type `moves` to inspect legal moves, `eval` to see engine score, `undo` to take back a move.

---

## 🌟 Key Features

### 1. Complete Chess Rule Engine
- **Castling**: Kingside ($O-O$) and Queenside ($O-O-O$), with accurate check restrictions (cannot castle through or into check).
- **En Passant**: Fully supported with correct expiration rules.
- **Pawn Promotion**: Interactive modal for choosing Queen, Rook, Bishop, or Knight.
- **Game-Ending Conditions**: Checkmate, Stalemate, 50-move rule, Threefold Repetition, and Insufficient Material draws.
- **Algebraic Notation (SAN)**: Standard PGN move notation (e.g., `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6`).

### 2. Intelligent AI Chess Bot
- **Minimax Search with $\alpha$-$\beta$ Pruning**: Prunes unpromising branches to evaluate deep positions efficiently.
- **Quiescence Search**: Evaluates capture sequences at the horizon to eliminate tactical blunders and piece-hanging oversights.
- **Move Ordering**:
  - **MVV-LVA** (Most Valuable Victim - Least Valuable Attacker) for captures.
  - **Killer Move Heuristic** for quiet cutoffs.
  - Center control and pawn advancement priorities.
- **Built-in Opening Book**: Plays classic theoretical openings (Ruy Lopez, Italian Game, Sicilian Defense, Queen's Gambit, etc.) instantly.
- **4 Skill Levels**:
  - **Beginner (~800 ELO)**: Depth 1 with casual blunders, great for learning.
  - **Casual (~1200 ELO)**: Depth 2, makes tactical errors under pressure.
  - **Intermediate (~1600 ELO)**: Depth 3 with quiescence search, solid positional play.
  - **Master (~2000+ ELO)**: Depth 4+ with deep tactical calculation and opening theory.

### 3. Sleek Interactive Experience
- **Live Evaluation Bar**: Real-time vertical advantage indicator (+1.5, -2.4, etc.).
- **Move Hints**: Click the **Hint** button to have the bot recommend the best move.
- **Procedural Sound Effects**: Pure Web Audio API synthesized sounds for moves, captures, castling, check, and game-over (100% offline, zero audio loading latency).
- **Multiple Board Themes**: Classic Tournament, Walnut Wood, Modern Slate, and Midnight Dark.
- **Drag & Drop and Click-to-Move**: Fluid piece interactions on both desktop and mobile screens.
- **Captured Piece Trays**: Real-time material differential (+3, +5, etc.).
- **PGN & FEN Tools**: One-click PGN copy and custom FEN board loader.

---

## 📦 Compilation & Distribution

You can re-compile the entire project at any time into the `dist/` directory by running:
```powershell
python build.py
```

### Compiled Artifacts in `dist/`:
- **`dist/index.html`**: Fully standalone, single-file compiled release. Inlines all CSS, SVG pieces, audio synthesizer, and JavaScript engine into one portable file. Can be emailed, shared, or opened anywhere without a server.
- **`dist/web/`**: Modular web distribution with bundled JavaScript (`chess.bundle.js`), stylesheet, and HTML. Ready for static hosting (GitHub Pages, Vercel, Netlify).
- **`dist/cli_chess.pyz`**: Standalone compiled Python executable ZipApp for terminal chess. Run with `python cli_chess.pyz`.
- **`dist/chess_web.pyz`**: Standalone compiled Python ZipApp for local web launcher.
- **`dist/Play-Web.bat`**: One-click Windows batch launcher to launch the Web GUI.
- **`dist/Play-CLI.bat`**: One-click Windows batch launcher to launch the CLI.
- **`dist/pyc/`**: Bytecode-optimized `.pyc` compiled files.
- **`dist/chess-bot-standalone.zip`**: Portable distribution zip file containing all compiled artifacts.

---

## 📂 Project Architecture

```
chess-bot/
├── index.html        # Main web application entry point
├── style.css         # Responsive styling, themes, animations
├── app.js            # Frontend game controller & interaction handler
├── chess-engine.js   # Core Chess rules, move generator, and Minimax AI
├── pieces.js         # Crisp, vector SVG chess piece definitions
├── audio.js          # Procedural Web Audio API sound synthesizer
├── app.py            # Local HTTP server launcher with automatic browser open
├── cli_chess.py      # Standalone Terminal/CLI Chess game in pure Python
├── build.py          # Project compiler and packager
├── dist/             # Compiled distribution folder
│   ├── index.html    # Standalone single-file build
│   ├── web/          # Modular web package
│   ├── cli_chess.pyz # Compiled Python CLI executable
│   ├── chess_web.pyz # Compiled Python Web launcher
│   ├── Play-Web.bat  # Windows Web launcher
│   ├── Play-CLI.bat  # Windows CLI launcher
│   └── chess-bot-standalone.zip
└── README.md         # Documentation and guide
```

---

## 🎯 Recommended Antigravity Workspace
To set this folder as your active workspace in Antigravity:
1. Open folder: `C:\Users\world\.gemini\antigravity\scratch\chess-bot`
2. You can freely edit files, customize the AI weights in `chess-engine.js`, or enhance board themes!
