/**
 * Deep Pawn — Chess Bot Web Application Controller
 * Handles user interactions, drag & drop, rendering, bot execution, and game UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = new ChessEngine.ChessEngine();
  const bot    = new ChessEngine.ChessBot(engine);
  const audio  = new ChessAudio();

  // ── Game State ─────────────────────────────────────────
  let playerColor           = 'w';          // 'w', 'b', or 'random'
  let boardFlipped          = false;
  let selectedSquare        = null;         // { r, c }
  let legalMovesForSelected = [];
  let lastMove              = null;         // { from: {r,c}, to: {r,c} }
  let bestHintMove          = null;         // { from, to }
  let isBotThinking         = false;
  let pendingPromotion      = null;         // { from, to, piece }
  let gameMode              = 'vs-bot';     // 'vs-bot', 'pass-and-play', 'bot-vs-bot'
  let difficulty            = 'intermediate';// 'beginner', 'casual', 'intermediate', 'master', 'rl_bot'
  let lastBotTo             = null;         // { r, c } for animation

  // ── DOM Elements ───────────────────────────────────────
  const chessboardEl       = document.getElementById('chessboard');
  const evalWhiteEl        = document.getElementById('evalWhite');
  const evalBlackEl        = document.getElementById('evalBlack');
  const evalScoreTopEl     = document.getElementById('evalScoreTop');
  const evalScoreBottomEl  = document.getElementById('evalScoreBottom');
  const botStatusBadge     = document.getElementById('botStatusBadge');
  const playerStatusBadge  = document.getElementById('playerStatusBadge');
  const botMaterialEl      = document.getElementById('botMaterial');
  const playerMaterialEl   = document.getElementById('playerMaterial');
  const botCapturedEl      = document.getElementById('botCaptured');
  const playerCapturedEl   = document.getElementById('playerCaptured');
  const movesTableEl       = document.getElementById('movesTable');
  const statDepthEl        = document.getElementById('statDepth');
  const statNodesEl        = document.getElementById('statNodes');
  const statTimeEl         = document.getElementById('statTime');
  const statEvalEl         = document.getElementById('statEval');
  const moveCountBadge     = document.getElementById('moveCountBadge');
  const botNameEl          = document.getElementById('botName');
  const opponentCard       = document.getElementById('opponentCard');
  const playerCardEl       = document.getElementById('playerCard');

  // Coordinate gutters (outside board squares)
  const coordFileTop    = document.getElementById('coordFileTop');
  const coordFileBottom = document.getElementById('coordFileBottom');
  const coordRankLeft   = document.getElementById('coordRankLeft');
  const coordRankRight  = document.getElementById('coordRankRight');

  // Controls
  const newGameBtn       = document.getElementById('newGameBtn');
  const undoBtn          = document.getElementById('undoBtn');
  const hintBtn          = document.getElementById('hintBtn');
  const flipBtn          = document.getElementById('flipBtn');
  const soundBtn         = document.getElementById('soundBtn');
  const pgnBtn           = document.getElementById('pgnBtn');
  const fenBtn           = document.getElementById('fenBtn');
  const difficultySelect = document.getElementById('difficultySelect');
  const sideSelect       = document.getElementById('sideSelect');
  const modeSelect       = document.getElementById('modeSelect');
  const themeSelect      = document.getElementById('themeSelect');

  // Modals & Toast
  const promoModal       = document.getElementById('promoModal');
  const promoOptions     = document.getElementById('promoOptions');
  const gameOverModal    = document.getElementById('gameOverModal');
  const gameOverTitle    = document.getElementById('gameOverTitle');
  const gameOverReason   = document.getElementById('gameOverReason');
  const gameOverIcon     = document.getElementById('gameOverIcon');
  const rematchBtn       = document.getElementById('rematchBtn');
  const closeGameOverBtn = document.getElementById('closeGameOverBtn');
  const fenModal         = document.getElementById('fenModal');
  const fenInput         = document.getElementById('fenInput');
  const loadFenSubmitBtn = document.getElementById('loadFenSubmitBtn');
  const closeFenBtn      = document.getElementById('closeFenBtn');
  const toastEl          = document.getElementById('toast');

  // ── Toast System ───────────────────────────────────────
  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  // ── External Coordinate Gutters ────────────────────────
  function renderCoords() {
    const files  = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks  = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const fOrder = boardFlipped ? [...files].reverse() : files;
    const rOrder = boardFlipped ? [...ranks].reverse() : ranks;

    const makeCell = (text, cls = '') => {
      const el = document.createElement('div');
      el.className = 'coord-cell' + (cls ? ' ' + cls : '');
      if (text) el.textContent = text;
      return el;
    };

    if (coordFileTop && coordFileBottom) {
      [coordFileTop, coordFileBottom].forEach(row => {
        row.innerHTML = '';
        row.appendChild(makeCell('', 'coord-corner'));
        fOrder.forEach(f => row.appendChild(makeCell(f)));
        row.appendChild(makeCell('', 'coord-corner'));
      });
    }

    if (coordRankLeft && coordRankRight) {
      [coordRankLeft, coordRankRight].forEach(col => {
        col.innerHTML = '';
        rOrder.forEach(r => col.appendChild(makeCell(r)));
      });
    }
  }

  // ── Board Rendering ────────────────────────────────────
  function renderBoard() {
    chessboardEl.innerHTML = '';
    renderCoords();

    const inCheck = engine.isInCheck();
    const checkKingCoord = inCheck ? engine.findKing(engine.turn) : null;

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      for (let cIdx = 0; cIdx < 8; cIdx++) {
        const r = boardFlipped ? 7 - rIdx : rIdx;
        const c = boardFlipped ? 7 - cIdx : cIdx;

        const sq = document.createElement('div');
        sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        sq.dataset.r = r;
        sq.dataset.c = c;

        // Last move highlight
        if (lastMove &&
            ((lastMove.from.r === r && lastMove.from.c === c) ||
             (lastMove.to.r   === r && lastMove.to.c   === c))) {
          sq.classList.add('last-move');
        }

        // Selection highlight
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          sq.classList.add('selected');
        }

        // King in check highlight
        if (checkKingCoord && checkKingCoord.r === r && checkKingCoord.c === c) {
          sq.classList.add('in-check');
        }

        // Hint highlight
        if (bestHintMove &&
            ((bestHintMove.from.r === r && bestHintMove.from.c === c) ||
             (bestHintMove.to.r   === r && bestHintMove.to.c   === c))) {
          sq.classList.add('best-hint');
        }

        // Legal move indicators
        if (selectedSquare) {
          const isLegal = legalMovesForSelected.some(m => m.to.r === r && m.to.c === c);
          if (isLegal) {
            const pieceOnDest = engine.getPiece(r, c);
            const isEP = legalMovesForSelected.some(m =>
              m.to.r === r && m.to.c === c && m.isEnPassant
            );
            if (pieceOnDest || isEP) {
              const ring = document.createElement('div');
              ring.className = 'legal-capture-ring';
              sq.appendChild(ring);
            } else {
              const dot = document.createElement('div');
              dot.className = 'legal-dot';
              sq.appendChild(dot);
            }
          }
        }

        // Piece element
        const piece = engine.getPiece(r, c);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          if (lastBotTo && lastBotTo.r === r && lastBotTo.c === c) {
            pieceEl.classList.add('just-landed');
          }
          pieceEl.innerHTML = (typeof PIECE_SVGS !== 'undefined' && PIECE_SVGS[piece]) || piece;
          pieceEl.draggable = true;

          pieceEl.addEventListener('dragstart', (e) => onDragStart(e, r, c));
          pieceEl.addEventListener('dragend',   onDragEnd);
          sq.appendChild(pieceEl);
        }

        // Square events
        sq.addEventListener('click',    () => onSquareClick(r, c));
        sq.addEventListener('dragover', (e) => {
          e.preventDefault();
          sq.classList.add('drag-over');
        });
        sq.addEventListener('dragleave', () => sq.classList.remove('drag-over'));
        sq.addEventListener('drop',     (e) => {
          sq.classList.remove('drag-over');
          onDrop(e, r, c);
        });

        chessboardEl.appendChild(sq);
      }
    }

    lastBotTo = null;
    updateUI();
  }

  // ── User Interaction Handlers ──────────────────────────
  function onSquareClick(r, c) {
    if (isBotThinking) return;

    const clickedPiece = engine.getPiece(r, c);
    const isPlayerTurn = isHumanTurn();

    if (!isPlayerTurn && gameMode !== 'pass-and-play') return;

    // If a piece is already selected
    if (selectedSquare) {
      // Check if clicked square is legal move destination
      const targetMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (targetMove) {
        handleMoveAttempt(targetMove);
        return;
      }

      // If clicked on own piece again, re-select it
      if (clickedPiece && isOwnPiece(clickedPiece)) {
        selectSquare(r, c);
        return;
      }

      // Otherwise deselect
      deselectSquare();
      return;
    }

    // Select clicked piece
    if (clickedPiece && isOwnPiece(clickedPiece)) {
      selectSquare(r, c);
    }
  }

  function selectSquare(r, c) {
    selectedSquare = { r, c };
    bestHintMove = null;
    const allLegal = engine.getLegalMoves();
    legalMovesForSelected = allLegal.filter(m => m.from.r === r && m.from.c === c);
    renderBoard();
  }

  function deselectSquare() {
    selectedSquare = null;
    legalMovesForSelected = [];
    renderBoard();
  }

  // ── Drag & Drop ────────────────────────────────────────
  let draggedFrom = null;

  function onDragStart(e, r, c) {
    if (isBotThinking || (!isHumanTurn() && gameMode !== 'pass-and-play')) {
      e.preventDefault();
      return;
    }
    const piece = engine.getPiece(r, c);
    if (!piece || !isOwnPiece(piece)) {
      e.preventDefault();
      return;
    }

    draggedFrom = { r, c };
    selectSquare(r, c);
    e.dataTransfer.setData('text/plain', `${r},${c}`);
    e.dataTransfer.effectAllowed = 'move';
    if (e.target) e.target.classList.add('dragging');
  }

  function onDragEnd(e) {
    draggedFrom = null;
    if (e.target) e.target.classList.remove('dragging');
  }

  function onDrop(e, r, c) {
    e.preventDefault();
    if (!draggedFrom) return;

    const targetMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
    if (targetMove) {
      handleMoveAttempt(targetMove);
    } else {
      deselectSquare();
    }
  }

  function isHumanTurn() {
    if (gameMode === 'bot-vs-bot') return false;
    if (gameMode === 'pass-and-play') return true;
    return engine.turn === playerColor;
  }

  function isOwnPiece(piece) {
    if (!piece) return false;
    if (gameMode === 'pass-and-play') {
      return (engine.turn === 'w' && piece === piece.toUpperCase()) ||
             (engine.turn === 'b' && piece === piece.toLowerCase());
    }
    return (playerColor === 'w' && piece === piece.toUpperCase()) ||
           (playerColor === 'b' && piece === piece.toLowerCase());
  }

  // ── Move Execution & Promotion ─────────────────────────
  function handleMoveAttempt(move) {
    const isPawn = move.piece.toLowerCase() === 'p';
    const isPromoRank = (move.piece === 'P' && move.to.r === 0) ||
                        (move.piece === 'p' && move.to.r === 7);

    if (isPawn && isPromoRank && !move.promotion) {
      pendingPromotion = { from: move.from, to: move.to, piece: move.piece };
      showPromotionModal(move.piece === 'P' ? 'w' : 'b');
      return;
    }

    executeMove(move);
  }

  function showPromotionModal(color) {
    promoOptions.innerHTML = '';
    const choices = color === 'w' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

    choices.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      btn.innerHTML = (typeof PIECE_SVGS !== 'undefined' && PIECE_SVGS[p]) || p;
      btn.onclick = () => {
        promoModal.classList.remove('open');
        if (pendingPromotion) {
          const promoMove = engine.getLegalMoves().find(m =>
            m.from.r === pendingPromotion.from.r &&
            m.from.c === pendingPromotion.from.c &&
            m.to.r   === pendingPromotion.to.r &&
            m.to.c   === pendingPromotion.to.c &&
            m.promotion === p
          );
          pendingPromotion = null;
          if (promoMove) executeMove(promoMove);
        }
      };
      promoOptions.appendChild(btn);
    });

    promoModal.classList.add('open');
  }

  function executeMove(move) {
    const isCapture = !!move.captured;
    const isCastle  = !!(move.isCastleKingside || move.isCastleQueenside);
    const isPromo   = !!move.promotion;

    // Generate SAN before state changes
    const san = engine.moveToSan(move);

    engine.makeMove(move);
    lastMove = { from: move.from, to: move.to };
    selectedSquare = null;
    legalMovesForSelected = [];
    bestHintMove = null;

    // Procedural Audio
    if (isPromo) audio.playPromote();
    else if (engine.isInCheck()) audio.playCheck();
    else if (isCastle) audio.playCastle();
    else if (isCapture) audio.playCapture();
    else audio.playMove();

    // Attach SAN to history
    if (engine.history.length > 0) {
      engine.history[engine.history.length - 1].san = san;
    }

    renderBoard();

    // Check game over
    const status = engine.isGameOver();
    if (status.over) {
      handleGameOver(status);
      return;
    }

    // Trigger AI response if needed
    checkAndTriggerBot();
  }

  // ── AI Bot Engine ──────────────────────────────────────
  function checkAndTriggerBot() {
    if (engine.isGameOver().over) return;

    const shouldBotMove = (gameMode === 'vs-bot' && engine.turn !== playerColor) ||
                          (gameMode === 'bot-vs-bot');

    if (shouldBotMove) {
      isBotThinking = true;
      botStatusBadge.textContent = 'Thinking...';
      botStatusBadge.className   = 'status-badge thinking';

      const thinkDelay = gameMode === 'bot-vs-bot' ? 380 : 150;
      setTimeout(() => {
        const result = bot.findBestMove({ difficulty });

        isBotThinking = false;
        botStatusBadge.textContent = 'Ready';
        botStatusBadge.className   = 'status-badge';

        if (result && result.move) {
          statDepthEl.textContent = result.depth || '-';
          statNodesEl.textContent = result.nodes ? result.nodes.toLocaleString() : '-';
          statTimeEl.textContent  = (result.timeMs !== undefined ? result.timeMs : 0) + ' ms';
          statEvalEl.textContent  = result.fromBook ? 'Book' : (result.score / 100).toFixed(2);

          lastBotTo = { r: result.move.to.r, c: result.move.to.c };
          executeMove(result.move);
        }
      }, thinkDelay);
    }
  }

  // ── UI Updates ─────────────────────────────────────────
  function updateUI() {
    const isWhiteTurn  = engine.turn === 'w';
    const isPlayerTurn = isHumanTurn();

    // Turn Badges
    playerStatusBadge.textContent = isPlayerTurn ? 'Your Turn' : 'Waiting';
    playerStatusBadge.className   = 'status-badge ' + (isPlayerTurn ? 'active' : '');

    // Highlight active card
    if (playerCardEl && opponentCard) {
      if (isPlayerTurn) {
        playerCardEl.classList.add('active-turn');
        opponentCard.classList.remove('active-turn');
      } else {
        opponentCard.classList.add('active-turn');
        playerCardEl.classList.remove('active-turn');
      }
    }

    // Captured Pieces
    const captured = engine.getCapturedPieces();
    renderCaptured(playerCapturedEl, playerColor === 'w' ? captured.black : captured.white);
    renderCaptured(botCapturedEl,    playerColor === 'w' ? captured.white : captured.black);

    // Material Lead Score
    const evalScore = engine.evaluate();
    const whiteAdvantage = Math.round(evalScore / 100);
    const playerAdvantage = playerColor === 'w' ? whiteAdvantage : -whiteAdvantage;

    if (playerAdvantage > 0) {
      playerMaterialEl.textContent = `+${playerAdvantage}`;
      playerMaterialEl.style.display = 'inline';
      botMaterialEl.style.display    = 'none';
    } else if (playerAdvantage < 0) {
      botMaterialEl.textContent = `+${Math.abs(playerAdvantage)}`;
      botMaterialEl.style.display    = 'inline';
      playerMaterialEl.style.display = 'none';
    } else {
      playerMaterialEl.style.display = 'none';
      botMaterialEl.style.display    = 'none';
    }

    // Evaluation Bar
    updateEvalBar(evalScore);

    // Moves Table & Counter
    renderMovesTable();
    if (moveCountBadge) {
      moveCountBadge.textContent = engine.history.length;
    }

    // Button states
    undoBtn.disabled = engine.history.length === 0 || isBotThinking;
  }

  function renderCaptured(container, pieces) {
    if (!container) return;
    container.innerHTML = '';
    const sorted = [...pieces].sort((a, b) => {
      const order = { q: 1, r: 2, b: 3, n: 4, p: 5 };
      return (order[a.toLowerCase()] || 9) - (order[b.toLowerCase()] || 9);
    });

    sorted.forEach(p => {
      const span = document.createElement('span');
      span.className = 'captured-icon';
      span.innerHTML = (typeof PIECE_SVGS !== 'undefined' && PIECE_SVGS[p]) || p;
      container.appendChild(span);
    });
  }

  function updateEvalBar(evalScore) {
    if (!evalBlackEl || !evalWhiteEl) return;
    const clampedCp   = Math.max(-1500, Math.min(1500, evalScore));
    const winRate     = 1 / (1 + Math.pow(10, -clampedCp / 400));
    const whitePct    = Math.round(winRate * 100);

    evalBlackEl.style.height = `${100 - whitePct}%`;
    evalWhiteEl.style.height = `${whitePct}%`;

    const scoreFormatted = (Math.abs(evalScore) / 100).toFixed(1);
    if (evalScore >= 0) {
      if (evalScoreBottomEl) evalScoreBottomEl.textContent = `+${scoreFormatted}`;
      if (evalScoreTopEl)    evalScoreTopEl.textContent    = '';
    } else {
      if (evalScoreTopEl)    evalScoreTopEl.textContent    = `+${scoreFormatted}`;
      if (evalScoreBottomEl) evalScoreBottomEl.textContent = '';
    }
  }

  function renderMovesTable() {
    if (!movesTableEl) return;
    movesTableEl.innerHTML = '';
    const moves = engine.history;

    for (let i = 0; i < moves.length; i += 2) {
      const row = document.createElement('tr');

      const moveNumTd = document.createElement('td');
      moveNumTd.textContent = `${Math.floor(i / 2) + 1}.`;
      row.appendChild(moveNumTd);

      const whiteTd = document.createElement('td');
      whiteTd.textContent = moves[i].san || '-';
      if (i === moves.length - 1) whiteTd.classList.add('active');
      row.appendChild(whiteTd);

      const blackTd = document.createElement('td');
      if (moves[i + 1]) {
        blackTd.textContent = moves[i + 1].san || '-';
        if (i + 1 === moves.length - 1) blackTd.classList.add('active');
      }
      row.appendChild(blackTd);

      movesTableEl.appendChild(row);
    }

    const container = movesTableEl.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }

  // ── Game Over Handling ─────────────────────────────────
  function handleGameOver(status) {
    let title = 'Game Over';
    let reason = '';
    let isVictory = false;
    let icon = '🏁';

    if (status.reason === 'checkmate') {
      const isPlayerWinner = status.winner === playerColor;
      title = isPlayerWinner ? 'Victory! 🎉' : 'Checkmate! ♟️';
      reason = `${status.winner === 'w' ? 'White' : 'Black'} won by checkmate.`;
      isVictory = isPlayerWinner;
      icon = isVictory ? '🏆' : '♟️';
    } else if (status.reason === 'stalemate') {
      title = 'Draw! 🤝';
      reason = 'Game ended in stalemate (no legal moves).';
      icon = '🤝';
    } else if (status.reason === '50-move-rule') {
      title = 'Draw! 🤝';
      reason = 'Game drawn by 50-move rule without captures or pawn moves.';
      icon = '🤝';
    } else if (status.reason === 'threefold-repetition') {
      title = 'Draw! 🤝';
      reason = 'Game drawn by threefold position repetition.';
      icon = '🤝';
    } else if (status.reason === 'insufficient-material') {
      title = 'Draw! 🤝';
      reason = 'Game drawn due to insufficient material to checkmate.';
      icon = '🤝';
    }

    audio.playGameOver(isVictory);

    if (gameOverIcon)   gameOverIcon.textContent   = icon;
    if (gameOverTitle)  gameOverTitle.textContent  = title;
    if (gameOverReason) gameOverReason.textContent = reason;
    if (gameOverModal)  gameOverModal.classList.add('open');
  }

  // ── Game Controls Listeners ────────────────────────────
  newGameBtn.onclick = () => {
    engine.reset();
    lastMove = null;
    selectedSquare = null;
    legalMovesForSelected = [];
    bestHintMove = null;
    boardFlipped = playerColor === 'b';
    renderBoard();
    showToast('New game started!');
    checkAndTriggerBot();
  };

  undoBtn.onclick = () => {
    if (engine.history.length === 0 || isBotThinking) return;

    if (gameMode === 'vs-bot') {
      engine.undoMove();
      if (engine.turn !== playerColor) {
        engine.undoMove();
      }
    } else {
      engine.undoMove();
    }

    lastMove = engine.history.length > 0 ? engine.history[engine.history.length - 1].move : null;
    selectedSquare = null;
    legalMovesForSelected = [];
    bestHintMove = null;
    renderBoard();
    showToast('Move undone');
  };

  hintBtn.onclick = () => {
    if (isBotThinking) return;
    const result = bot.findBestMove({ difficulty: 'master' });
    if (result && result.move) {
      bestHintMove = result.move;
      const san = engine.moveToSan(result.move);
      renderBoard();
      showToast(`Hint: ${san}`);
    }
  };

  flipBtn.onclick = () => {
    boardFlipped = !boardFlipped;
    renderBoard();
    showToast('Board flipped');
  };

  soundBtn.onclick = () => {
    const isMuted = audio.toggleMute();
    soundBtn.textContent = isMuted ? '🔇' : '🔊';
    showToast(isMuted ? 'Sound muted' : 'Sound unmuted');
  };

  difficultySelect.onchange = (e) => {
    difficulty = e.target.value;
    showToast(`Difficulty: ${e.target.options[e.target.selectedIndex].text}`);

    if (botNameEl) {
      botNameEl.textContent = difficulty === 'rl_bot' ? 'NeuroPawn RL' : 'Deep Pawn AI';
    }
    const botRatingEl = document.querySelector('.player-meta .player-rating');
    if (botRatingEl) {
      const eloMap = {
        beginner:     'ELO ~800',
        casual:       'ELO ~1200',
        intermediate: 'ELO ~1600',
        master:       'ELO ~2000+',
        rl_bot:       'RL Self-Trained'
      };
      botRatingEl.textContent = eloMap[difficulty] || 'ELO ~1600';
    }
    if (difficulty === 'rl_bot' && typeof updateRLStudioUI === 'function') {
      updateRLStudioUI();
    }
  };

  sideSelect.onchange = (e) => {
    const val = e.target.value;
    playerColor = val === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : val;
    boardFlipped = playerColor === 'b';
    newGameBtn.click();
  };

  modeSelect.onchange = (e) => {
    gameMode = e.target.value;
    newGameBtn.click();
  };

  themeSelect.onchange = (e) => {
    document.body.className = `theme-${e.target.value}`;
  };

  rematchBtn.onclick = () => {
    gameOverModal.classList.remove('open');
    newGameBtn.click();
  };

  closeGameOverBtn.onclick = () => {
    gameOverModal.classList.remove('open');
  };

  // ── PGN & FEN ──────────────────────────────────────────
  pgnBtn.onclick = () => {
    const pgn = generatePgn();
    navigator.clipboard.writeText(pgn).then(() => {
      showToast('PGN copied to clipboard!');
    }).catch(() => {
      prompt('Copy PGN:', pgn);
    });
  };

  fenBtn.onclick = () => {
    fenInput.value = engine.getFen();
    fenModal.classList.add('open');
  };

  loadFenSubmitBtn.onclick = () => {
    const success = engine.loadFen(fenInput.value);
    if (success) {
      fenModal.classList.remove('open');
      lastMove = null;
      selectedSquare = null;
      legalMovesForSelected = [];
      bestHintMove = null;
      renderBoard();
      showToast('FEN position loaded!');
      checkAndTriggerBot();
    } else {
      alert('Invalid FEN string. Please check the format.');
    }
  };

  closeFenBtn.onclick = () => {
    fenModal.classList.remove('open');
  };

  function generatePgn() {
    let pgn = `[Event "Casual Game"]\n[Date "${new Date().toISOString().slice(0, 10)}"]\n`;
    pgn += `[White "${playerColor === 'w' ? 'Human' : 'ChessBot'}"]\n`;
    pgn += `[Black "${playerColor === 'b' ? 'Human' : 'ChessBot'}"]\n\n`;

    const moves = engine.history;
    for (let i = 0; i < moves.length; i += 2) {
      pgn += `${Math.floor(i / 2) + 1}. ${moves[i].san} `;
      if (moves[i + 1]) {
        pgn += `${moves[i + 1].san} `;
      }
    }
    return pgn.trim();
  }

  // ───────────────────────────────────────────────────────
  //   RL STUDIO CONTROLLER
  // ───────────────────────────────────────────────────────
  const rlAgent           = bot.rlAgent;
  const rlModal           = document.getElementById('rlModal');
  const rlStudioBtn       = document.getElementById('rlStudioBtn');
  const closeRlBtn        = document.getElementById('closeRlBtn');
  const rlTrain25Btn      = document.getElementById('rlTrain25Btn');
  const rlTrain100Btn     = document.getElementById('rlTrain100Btn');
  const rlStopTrainBtn    = document.getElementById('rlStopTrainBtn');
  const rlProgressContainer = document.getElementById('rlProgressContainer');
  const rlProgressBar     = document.getElementById('rlProgressBar');
  const rlProgressText    = document.getElementById('rlProgressText');
  const rlLog             = document.getElementById('rlLog');
  const rlWeightsGrid     = document.getElementById('rlWeightsGrid');
  const rlEpisodesVal     = document.getElementById('rlEpisodesVal');
  const rlRecordVal       = document.getElementById('rlRecordVal');
  const rlEpsilonVal      = document.getElementById('rlEpsilonVal');
  const rlLossVal         = document.getElementById('rlLossVal');
  const rlExportBtn       = document.getElementById('rlExportBtn');
  const rlImportBtn       = document.getElementById('rlImportBtn');
  const rlFileInput       = document.getElementById('rlFileInput');
  const rlResetBtn        = document.getElementById('rlResetBtn');
  const rlStatusBadge     = document.getElementById('rlStatusBadge');

  let isRLTraining = false;

  function updateRLStudioUI() {
    if (!rlAgent) return;

    if (rlEpisodesVal) rlEpisodesVal.textContent = rlAgent.episodesTrained || 0;
    if (rlEpsilonVal)  rlEpsilonVal.textContent  = (rlAgent.epsilon || 0).toFixed(3);
    if (rlRecordVal) {
      const stats = rlAgent.stats || {};
      const w = stats.wins || 0, d = stats.draws || 0, l = stats.losses || 0;
      rlRecordVal.textContent = `${w}W / ${d}D / ${l}L`;
    }
    if (rlLossVal) {
      const lastLoss = rlAgent.lastLoss !== undefined ? rlAgent.lastLoss.toFixed(4) : '—';
      rlLossVal.textContent = lastLoss;
    }

    if (rlWeightsGrid && rlAgent.weights) {
      rlWeightsGrid.innerHTML = '';
      const weights = rlAgent.weights;
      const featureNames = (typeof ChessEngine !== 'undefined' && ChessEngine.RL_FEATURE_NAMES) || Object.keys(weights);
      const vals = featureNames.map(k => Math.abs(weights[k] || 0));
      const maxVal = Math.max(...vals, 1);

      featureNames.forEach(name => {
        const val = weights[name] !== undefined ? weights[name] : 0;
        const pct = Math.min(100, (Math.abs(val) / maxVal) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'rl-weight-item';
        item.innerHTML = `
          <div class="rl-weight-label">${name}</div>
          <div class="rl-weight-bar-bg">
            <div class="rl-weight-bar" style="width:${pct}%"></div>
          </div>
          <div class="rl-weight-value">${val.toFixed(1)}</div>`;
        rlWeightsGrid.appendChild(item);
      });
    }

    if (rlStatusBadge) {
      rlStatusBadge.textContent = isRLTraining ? 'Training…' : 'Idle';
      rlStatusBadge.className   = 'rl-status-badge ' + (isRLTraining ? 'training' : '');
    }
  }

  function rlAppendLog(msg) {
    if (!rlLog) return;
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    rlLog.appendChild(line);
    rlLog.scrollTop = rlLog.scrollHeight;
    while (rlLog.children.length > 200) rlLog.removeChild(rlLog.firstChild);
  }

  async function runRLTraining(episodes) {
    if (!rlAgent || isRLTraining) return;
    isRLTraining = true;
    if (rlStopTrainBtn)  rlStopTrainBtn.disabled  = false;
    if (rlTrain25Btn)   rlTrain25Btn.disabled   = true;
    if (rlTrain100Btn)  rlTrain100Btn.disabled  = true;
    if (rlProgressContainer) rlProgressContainer.style.display = 'flex';
    rlAppendLog(`Starting ${episodes}-episode training session…`);
    updateRLStudioUI();

    const startEp = rlAgent.episodesTrained || 0;

    try {
      await rlAgent.trainSelfPlayBatch(episodes, (info) => {
        const done  = info.episode || 0;
        const total = episodes;
        const pct   = Math.round((done / total) * 100);
        if (rlProgressBar)  rlProgressBar.style.width  = pct + '%';
        if (rlProgressText) rlProgressText.textContent = `${done} / ${total} episodes`;

        if (info.log) rlAppendLog(info.log);
        updateRLStudioUI();
      });
    } catch (err) {
      rlAppendLog(`Training error: ${err.message}`);
    }

    const finalEp = rlAgent.episodesTrained || 0;
    rlAppendLog(`Training complete! Ran ${finalEp - startEp} episodes. Total: ${finalEp}`);

    isRLTraining = false;
    if (rlStopTrainBtn)  rlStopTrainBtn.disabled  = true;
    if (rlTrain25Btn)   rlTrain25Btn.disabled   = false;
    if (rlTrain100Btn)  rlTrain100Btn.disabled  = false;
    if (rlProgressContainer) rlProgressContainer.style.display = 'none';
    updateRLStudioUI();
    showToast(`RL training done — ${finalEp} episodes total`);
  }

  if (rlStudioBtn) {
    rlStudioBtn.onclick = () => {
      if (rlModal) {
        rlModal.classList.add('open');
        updateRLStudioUI();
        rlAppendLog('RL Studio opened. Agent ready.');
      }
    };
  }

  if (closeRlBtn) {
    closeRlBtn.onclick = () => {
      if (rlModal) rlModal.classList.remove('open');
    };
  }

  if (rlModal) {
    rlModal.addEventListener('click', (e) => {
      if (e.target === rlModal) rlModal.classList.remove('open');
    });
  }

  if (rlTrain25Btn)  rlTrain25Btn.onclick  = () => runRLTraining(25);
  if (rlTrain100Btn) rlTrain100Btn.onclick = () => runRLTraining(100);

  if (rlStopTrainBtn) {
    rlStopTrainBtn.disabled = true;
    rlStopTrainBtn.onclick = () => {
      if (rlAgent) rlAgent.stopRequested = true;
      rlAppendLog('Stop requested — finishing current episode…');
    };
  }

  if (rlExportBtn) {
    rlExportBtn.onclick = () => {
      if (!rlAgent) return;
      const data = {
        weights:         rlAgent.weights,
        episodesTrained: rlAgent.episodesTrained || 0,
        epsilon:         rlAgent.epsilon,
        stats:           rlAgent.stats || {},
        exportedAt:      new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `neuropawn_weights_ep${data.episodesTrained}.json`;
      a.click();
      URL.revokeObjectURL(url);
      rlAppendLog('Weights exported to JSON file.');
      showToast('RL weights exported!');
    };
  }

  if (rlImportBtn) {
    rlImportBtn.onclick = () => { if (rlFileInput) rlFileInput.click(); };
  }

  if (rlFileInput) {
    rlFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file || !rlAgent) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.weights) {
            rlAgent.weights = Object.assign({}, rlAgent.weights, data.weights);
            if (data.episodesTrained !== undefined) rlAgent.episodesTrained = data.episodesTrained;
            if (data.epsilon         !== undefined) rlAgent.epsilon         = data.epsilon;
            if (data.stats           !== undefined) rlAgent.stats           = data.stats;
            rlAgent.saveToStorage();
            updateRLStudioUI();
            rlAppendLog(`Imported weights from "${file.name}" (${data.episodesTrained || '?'} episodes).`);
            showToast('RL weights imported!');
          } else {
            rlAppendLog('Import failed: no "weights" key found in file.');
          }
        } catch (err) {
          rlAppendLog(`Import error: ${err.message}`);
        }
      };
      reader.readAsText(file);
      rlFileInput.value = '';
    };
  }

  if (rlResetBtn) {
    rlResetBtn.onclick = () => {
      if (!rlAgent) return;
      if (!confirm('Reset RL weights to defaults? This cannot be undone.')) return;
      rlAgent.resetWeights();
      updateRLStudioUI();
      rlAppendLog('Weights reset to defaults.');
      showToast('RL weights reset to defaults.');
    };
  }

  // Load saved weights from localStorage
  if (rlAgent && typeof rlAgent.loadFromStorage === 'function') {
    rlAgent.loadFromStorage();
  }

  // Initial render
  renderBoard();
});
