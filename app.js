/**
 * Chess Bot Web Application Controller
 * Handles user interactions, drag & drop, rendering, bot execution, and game UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = new ChessEngine.ChessEngine();
  const bot = new ChessEngine.ChessBot(engine);
  const audio = new ChessAudio();

  // State
  let playerColor = 'w';       // 'w', 'b', or 'both' (pass and play), 'bot' (bot vs bot)
  let boardFlipped = false;
  let selectedSquare = null;   // { r, c }
  let legalMovesForSelected = [];
  let lastMove = null;         // { from, to }
  let bestHintMove = null;
  let isBotThinking = false;
  let pendingPromotion = null; // { from, to }
  let gameMode = 'vs-bot';     // 'vs-bot', 'pass-and-play', 'bot-vs-bot'
  let difficulty = 'intermediate'; // 'beginner', 'casual', 'intermediate', 'master'

  // DOM Elements
  const chessboardEl = document.getElementById('chessboard');
  const evalWhiteEl = document.getElementById('evalWhite');
  const evalBlackEl = document.getElementById('evalBlack');
  const evalScoreTopEl = document.getElementById('evalScoreTop');
  const evalScoreBottomEl = document.getElementById('evalScoreBottom');
  const botStatusBadge = document.getElementById('botStatusBadge');
  const playerStatusBadge = document.getElementById('playerStatusBadge');
  const botMaterialEl = document.getElementById('botMaterial');
  const playerMaterialEl = document.getElementById('playerMaterial');
  const botCapturedEl = document.getElementById('botCaptured');
  const playerCapturedEl = document.getElementById('playerCaptured');
  const movesTableEl = document.getElementById('movesTable');
  const statDepthEl = document.getElementById('statDepth');
  const statNodesEl = document.getElementById('statNodes');
  const statTimeEl = document.getElementById('statTime');
  const statEvalEl = document.getElementById('statEval');

  // Controls
  const newGameBtn = document.getElementById('newGameBtn');
  const undoBtn = document.getElementById('undoBtn');
  const hintBtn = document.getElementById('hintBtn');
  const flipBtn = document.getElementById('flipBtn');
  const soundBtn = document.getElementById('soundBtn');
  const pgnBtn = document.getElementById('pgnBtn');
  const fenBtn = document.getElementById('fenBtn');
  const difficultySelect = document.getElementById('difficultySelect');
  const sideSelect = document.getElementById('sideSelect');
  const modeSelect = document.getElementById('modeSelect');
  const themeSelect = document.getElementById('themeSelect');

  // Modals & Toast
  const promoModal = document.getElementById('promoModal');
  const promoOptions = document.getElementById('promoOptions');
  const gameOverModal = document.getElementById('gameOverModal');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverReason = document.getElementById('gameOverReason');
  const rematchBtn = document.getElementById('rematchBtn');
  const closeGameOverBtn = document.getElementById('closeGameOverBtn');
  const fenModal = document.getElementById('fenModal');
  const fenInput = document.getElementById('fenInput');
  const loadFenSubmitBtn = document.getElementById('loadFenSubmitBtn');
  const closeFenBtn = document.getElementById('closeFenBtn');
  const toastEl = document.getElementById('toast');

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2400);
  }

  // --- BOARD RENDERING ---
  function renderBoard() {
    chessboardEl.innerHTML = '';

    const checkKingCoord = engine.isInCheck() ? engine.findKing(engine.turn) : null;

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      for (let cIdx = 0; cIdx < 8; cIdx++) {
        // Handle board orientation
        const r = boardFlipped ? 7 - rIdx : rIdx;
        const c = boardFlipped ? 7 - cIdx : cIdx;

        const squareEl = document.createElement('div');
        squareEl.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        squareEl.dataset.r = r;
        squareEl.dataset.c = c;

        // Last move highlight
        if (lastMove &&
            ((lastMove.from.r === r && lastMove.from.c === c) ||
             (lastMove.to.r === r && lastMove.to.c === c))) {
          squareEl.classList.add('last-move');
        }

        // Selected square highlight
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          squareEl.classList.add('selected');
        }

        // King in check highlight
        if (checkKingCoord && checkKingCoord.r === r && checkKingCoord.c === c) {
          squareEl.classList.add('in-check');
        }

        // Best move hint highlight
        if (bestHintMove &&
            ((bestHintMove.from.r === r && bestHintMove.from.c === c) ||
             (bestHintMove.to.r === r && bestHintMove.to.c === c))) {
          squareEl.classList.add('best-hint');
        }

        // Coordinates notation
        if (cIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = 8 - r;
          squareEl.appendChild(rankLabel);
        }
        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = ChessEngine.coordToSquare(r, c)[0];
          squareEl.appendChild(fileLabel);
        }

        // Legal move indicators
        if (selectedSquare) {
          const isLegal = legalMovesForSelected.some(m => m.to.r === r && m.to.c === c);
          if (isLegal) {
            const pieceOnDest = engine.getPiece(r, c);
            const isEnPassant = legalMovesForSelected.some(m => m.to.r === r && m.to.c === c && m.isEnPassant);
            if (pieceOnDest || isEnPassant) {
              const ring = document.createElement('div');
              ring.className = 'legal-capture-ring';
              squareEl.appendChild(ring);
            } else {
              const dot = document.createElement('div');
              dot.className = 'legal-dot';
              squareEl.appendChild(dot);
            }
          }
        }

        // Piece
        const piece = engine.getPiece(r, c);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          pieceEl.innerHTML = PIECE_SVGS[piece] || '';
          pieceEl.draggable = true;

          // Drag and drop listeners
          pieceEl.addEventListener('dragstart', (e) => onDragStart(e, r, c));
          pieceEl.addEventListener('dragend', onDragEnd);

          squareEl.appendChild(pieceEl);
        }

        // Square Click & Drop listeners
        squareEl.addEventListener('click', () => onSquareClick(r, c));
        squareEl.addEventListener('dragover', (e) => e.preventDefault());
        squareEl.addEventListener('drop', (e) => onDrop(e, r, c));

        chessboardEl.appendChild(squareEl);
      }
    }

    updateUI();
  }

  // --- INTERACTION HANDLERS ---
  function onSquareClick(r, c) {
    if (isBotThinking) return;

    const clickedPiece = engine.getPiece(r, c);
    const isCurrentPlayerTurn = isHumanTurn();

    if (!isCurrentPlayerTurn && gameMode !== 'pass-and-play') return;

    // If already have selected square
    if (selectedSquare) {
      // Check if clicked square is destination for a legal move
      const targetMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (targetMove) {
        handleMoveAttempt(targetMove);
        return;
      }

      // If clicked on own piece again, reselect
      if (clickedPiece && isOwnPiece(clickedPiece)) {
        selectSquare(r, c);
        return;
      }

      // Otherwise deselect
      deselectSquare();
      return;
    }

    // Select piece
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

  // Drag & drop
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
  }

  function onDragEnd() {
    draggedFrom = null;
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
    if (gameMode === 'pass-and-play') {
      return (engine.turn === 'w' && piece === piece.toUpperCase()) ||
             (engine.turn === 'b' && piece === piece.toLowerCase());
    }
    return (playerColor === 'w' && piece === piece.toUpperCase()) ||
           (playerColor === 'b' && piece === piece.toLowerCase());
  }

  // Handle Move & Promotion
  function handleMoveAttempt(move) {
    const isPawn = move.piece.toLowerCase() === 'p';
    const isPromoRank = (move.piece === 'P' && move.to.r === 0) || (move.piece === 'p' && move.to.r === 7);

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
      btn.innerHTML = PIECE_SVGS[p];
      btn.onclick = () => {
        promoModal.classList.remove('open');
        if (pendingPromotion) {
          const promoMove = engine.getLegalMoves().find(m =>
            m.from.r === pendingPromotion.from.r &&
            m.from.c === pendingPromotion.from.c &&
            m.to.r === pendingPromotion.to.r &&
            m.to.c === pendingPromotion.to.c &&
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
    const isCastle = move.isCastleKingside || move.isCastleQueenside;
    const isPromo = !!move.promotion;

    // Generate SAN before making move
    const san = engine.moveToSan(move);

    engine.makeMove(move);
    lastMove = { from: move.from, to: move.to };
    selectedSquare = null;
    legalMovesForSelected = [];
    bestHintMove = null;

    // Play appropriate sound
    if (isPromo) audio.playPromote();
    else if (engine.isInCheck()) audio.playCheck();
    else if (isCastle) audio.playCastle();
    else if (isCapture) audio.playCapture();
    else audio.playMove();

    // Record SAN to history
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

    // Bot move if required
    checkAndTriggerBot();
  }

  // --- BOT EXECUTION ---
  function checkAndTriggerBot() {
    if (engine.isGameOver().over) return;

    const shouldBotMove = (gameMode === 'vs-bot' && engine.turn !== playerColor) ||
                          (gameMode === 'bot-vs-bot');

    if (shouldBotMove) {
      isBotThinking = true;
      botStatusBadge.textContent = 'Thinking...';
      botStatusBadge.className = 'status-badge thinking';

      // Yield UI frame with setTimeout
      const thinkDelay = gameMode === 'bot-vs-bot' ? 400 : 150;
      setTimeout(() => {
        const result = bot.findBestMove({ difficulty });

        isBotThinking = false;
        botStatusBadge.textContent = 'Ready';
        botStatusBadge.className = 'status-badge';

        if (result && result.move) {
          // Update stats
          statDepthEl.textContent = result.depth || '-';
          statNodesEl.textContent = result.nodes ? result.nodes.toLocaleString() : '-';
          statTimeEl.textContent = (result.timeMs !== undefined ? result.timeMs : 0) + ' ms';
          statEvalEl.textContent = result.fromBook ? 'Book' : (result.score / 100).toFixed(2);

          executeMove(result.move);
        }
      }, thinkDelay);
    }
  }

  // --- UI UPDATES ---
  function updateUI() {
    // Turn indicators
    const isWhiteTurn = engine.turn === 'w';
    if (playerColor === 'w') {
      playerStatusBadge.textContent = isWhiteTurn ? 'Your Turn' : 'Waiting';
      playerStatusBadge.className = 'status-badge ' + (isWhiteTurn ? 'active' : '');
    } else {
      playerStatusBadge.textContent = !isWhiteTurn ? 'Your Turn' : 'Waiting';
      playerStatusBadge.className = 'status-badge ' + (!isWhiteTurn ? 'active' : '');
    }

    // Update captured pieces & material advantage
    const captured = engine.getCapturedPieces();
    renderCaptured(playerCapturedEl, playerColor === 'w' ? captured.black : captured.white);
    renderCaptured(botCapturedEl, playerColor === 'w' ? captured.white : captured.black);

    // Calculate score advantage
    const evalScore = engine.evaluate();
    const whiteAdvantage = Math.round(evalScore / 100);

    const playerAdvantage = playerColor === 'w' ? whiteAdvantage : -whiteAdvantage;
    if (playerAdvantage > 0) {
      playerMaterialEl.textContent = `+${playerAdvantage}`;
      playerMaterialEl.style.display = 'inline';
      botMaterialEl.style.display = 'none';
    } else if (playerAdvantage < 0) {
      botMaterialEl.textContent = `+${Math.abs(playerAdvantage)}`;
      botMaterialEl.style.display = 'inline';
      playerMaterialEl.style.display = 'none';
    } else {
      playerMaterialEl.style.display = 'none';
      botMaterialEl.style.display = 'none';
    }

    // Update Evaluation Bar
    updateEvalBar(evalScore);

    // Update Moves Table
    renderMovesTable();

    // Button states
    undoBtn.disabled = engine.history.length === 0 || isBotThinking;
  }

  function renderCaptured(container, pieces) {
    container.innerHTML = '';
    pieces.sort((a, b) => {
      const order = { q: 1, r: 2, b: 3, n: 4, p: 5 };
      return (order[a.toLowerCase()] || 9) - (order[b.toLowerCase()] || 9);
    });

    pieces.forEach(p => {
      const span = document.createElement('span');
      span.className = 'captured-icon';
      span.innerHTML = PIECE_SVGS[p];
      container.appendChild(span);
    });
  }

  function updateEvalBar(evalScore) {
    // Sigmoid mapping for smooth bar percentage
    // 0 -> 50%, +1000 cp -> 95%, -1000 cp -> 5%
    const clampedCp = Math.max(-1500, Math.min(1500, evalScore));
    const winRate = 1 / (1 + Math.pow(10, -clampedCp / 400));
    const whitePercent = Math.round(winRate * 100);

    evalBlackEl.style.height = `${100 - whitePercent}%`;
    evalWhiteEl.style.height = `${whitePercent}%`;

    const scoreFormatted = (Math.abs(evalScore) / 100).toFixed(1);
    if (evalScore >= 0) {
      evalScoreBottomEl.textContent = `+${scoreFormatted}`;
      evalScoreTopEl.textContent = '';
    } else {
      evalScoreTopEl.textContent = `+${scoreFormatted}`;
      evalScoreBottomEl.textContent = '';
    }
  }

  function renderMovesTable() {
    movesTableEl.innerHTML = '';
    const moves = engine.history;

    for (let i = 0; i < moves.length; i += 2) {
      const row = document.createElement('tr');

      // Move number
      const moveNumTd = document.createElement('td');
      moveNumTd.className = 'move-num';
      moveNumTd.textContent = `${Math.floor(i / 2) + 1}.`;
      row.appendChild(moveNumTd);

      // White move
      const whiteTd = document.createElement('td');
      whiteTd.className = 'move-san' + (i === moves.length - 1 ? ' active' : '');
      whiteTd.textContent = moves[i].san || '-';
      row.appendChild(whiteTd);

      // Black move
      const blackTd = document.createElement('td');
      if (moves[i + 1]) {
        blackTd.className = 'move-san' + (i + 1 === moves.length - 1 ? ' active' : '');
        blackTd.textContent = moves[i + 1].san || '-';
      }
      row.appendChild(blackTd);

      movesTableEl.appendChild(row);
    }

    const container = movesTableEl.parentElement;
    container.scrollTop = container.scrollHeight;
  }

  // --- GAME OVER ---
  function handleGameOver(status) {
    let title = 'Game Over';
    let reason = '';
    let isVictory = false;

    if (status.reason === 'checkmate') {
      const isPlayerWinner = status.winner === playerColor;
      title = isPlayerWinner ? 'Victory! 🎉' : 'Checkmate! ♟️';
      reason = `${status.winner === 'w' ? 'White' : 'Black'} won by checkmate.`;
      isVictory = isPlayerWinner;
    } else if (status.reason === 'stalemate') {
      title = 'Draw! 🤝';
      reason = 'Game ended in stalemate (no legal moves).';
    } else if (status.reason === '50-move-rule') {
      title = 'Draw! 🤝';
      reason = 'Game drawn by 50-move rule without captures or pawn moves.';
    } else if (status.reason === 'threefold-repetition') {
      title = 'Draw! 🤝';
      reason = 'Game drawn by threefold position repetition.';
    } else if (status.reason === 'insufficient-material') {
      title = 'Draw! 🤝';
      reason = 'Game drawn due to insufficient material to checkmate.';
    }

    audio.playGameOver(isVictory);

    gameOverTitle.textContent = title;
    gameOverReason.textContent = reason;
    gameOverModal.classList.add('open');
  }

  // --- CONTROLS LISTENERS ---
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
      // Undo both bot move and player move
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
  };

  soundBtn.onclick = () => {
    const isMuted = audio.toggleMute();
    soundBtn.textContent = isMuted ? '🔇 Sound' : '🔊 Sound';
    showToast(isMuted ? 'Sound muted' : 'Sound unmuted');
  };

  difficultySelect.onchange = (e) => {
    difficulty = e.target.value;
    showToast(`Difficulty set to ${e.target.options[e.target.selectedIndex].text}`);
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

  // PGN & FEN
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

  // Initial render
  renderBoard();
});
