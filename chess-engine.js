/**
 * ChessEngine - Full rules, move generation, evaluation, and Minimax AI bot.
 * Supports: Castling, En Passant, Pawn Promotion, Check/Checkmate, Stalemate,
 * 50-move rule, Threefold Repetition, SAN notation, FEN import/export,
 * Minimax with Alpha-Beta Pruning, Quiescence Search, and Move Ordering.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ChessEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Piece-Square Tables (from White's perspective; flipped for Black)
  const PST = {
    p: [
       0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ],
    n: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ],
    b: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  0, 10, 15, 15, 10,  0,-10,
      -10,  5,  5, 15, 15,  5,  5,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ],
    r: [
        0,  0,  0,  5,  5,  0,  0,  0,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
        5, 10, 10, 10, 10, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ],
    q: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -10,  5,  5,  5,  5,  5,  0,-10,
        0,  0,  5,  5,  5,  5,  0, -5,
       -5,  0,  5,  5,  5,  5,  0, -5,
      -10,  0,  5,  5,  5,  5,  0,-10,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ],
    k: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ],
    k_endgame: [
      -50,-40,-30,-20,-20,-30,-40,-50,
      -30,-20,-10,  0,  0,-10,-20,-30,
      -30,-10, 20, 30, 30, 20,-10,-30,
      -30,-10, 30, 40, 40, 30,-10,-30,
      -30,-10, 30, 40, 40, 30,-10,-30,
      -30,-10, 20, 30, 30, 20,-10,-30,
      -30,-30,  0,  0,  0,  0,-30,-30,
      -50,-30,-30,-30,-30,-30,-30,-50
    ]
  };

  // Opening book moves in UCI format
  const OPENING_BOOK = {
    // Starting position
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": [
      { move: "e2e4", weight: 45 },
      { move: "d2d4", weight: 35 },
      { move: "g1f3", weight: 12 },
      { move: "c2c4", weight: 8 }
    ],
    // 1. e4
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": [
      { move: "e7e5", weight: 40 },
      { move: "c7c5", weight: 35 },
      { move: "e7e6", weight: 15 },
      { move: "c7c6", weight: 10 }
    ],
    // 1. d4
    "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1": [
      { move: "d7d5", weight: 45 },
      { move: "g8f6", weight: 40 },
      { move: "e7e6", weight: 15 }
    ],
    // 1. e4 e5
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2": [
      { move: "g1f3", weight: 70 },
      { move: "f1c4", weight: 20 },
      { move: "b1c3", weight: 10 }
    ],
    // 1. e4 e5 2. Nf3
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2": [
      { move: "b8c6", weight: 75 },
      { move: "g8f6", weight: 20 },
      { move: "d7d6", weight: 5 }
    ],
    // 1. e4 e5 2. Nf3 Nc6
    "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3": [
      { move: "f1b5", weight: 50 }, // Ruy Lopez
      { move: "f1c4", weight: 35 }, // Italian
      { move: "d2d4", weight: 15 }  // Scotch
    ],
    // 1. e4 c5 (Sicilian)
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2": [
      { move: "g1f3", weight: 75 },
      { move: "b1c3", weight: 15 },
      { move: "c2c3", weight: 10 }
    ],
    // 1. d4 d5
    "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2": [
      { move: "c2c4", weight: 65 }, // Queen's Gambit
      { move: "g1f3", weight: 25 },
      { move: "c1f4", weight: 10 }  // London System
    ],
    // 1. d4 Nf6
    "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2": [
      { move: "c2c4", weight: 65 },
      { move: "g1f3", weight: 25 },
      { move: "c1g5", weight: 10 }
    ]
  };

  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  function isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  function isBlack(piece) {
    return piece && piece === piece.toLowerCase();
  }

  function squareToCoord(sq) {
    const f = sq.charCodeAt(0) - 97;
    const r = 8 - parseInt(sq[1], 10);
    return { r, c: f };
  }

  function coordToSquare(r, c) {
    return FILES[c] + (8 - r);
  }

  class ChessEngine {
    constructor(fen) {
      this.reset();
      if (fen) {
        this.loadFen(fen);
      }
    }

    reset() {
      // 8x8 Board. Row 0 = 8th rank, Row 7 = 1st rank.
      this.board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];
      this.turn = 'w';
      this.castling = { K: true, Q: true, k: true, q: true };
      this.enPassant = null; // { r, c }
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;
      this.history = [];
      this.positionHistory = [];
      this.savePositionHash();
    }

    savePositionHash() {
      this.positionHistory.push(this.getPositionKey());
    }

    getPositionKey() {
      let b = '';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          b += this.board[r][c] || '.';
        }
      }
      const c = (this.castling.K ? 'K' : '') + (this.castling.Q ? 'Q' : '') +
                (this.castling.k ? 'k' : '') + (this.castling.q ? 'q' : '');
      const ep = this.enPassant ? coordToSquare(this.enPassant.r, this.enPassant.c) : '-';
      return `${b} ${this.turn} ${c || '-'} ${ep}`;
    }

    clone() {
      const copy = new ChessEngine();
      copy.board = this.board.map(row => row.slice());
      copy.turn = this.turn;
      copy.castling = { ...this.castling };
      copy.enPassant = this.enPassant ? { ...this.enPassant } : null;
      copy.halfmoveClock = this.halfmoveClock;
      copy.fullmoveNumber = this.fullmoveNumber;
      copy.history = this.history.map(h => ({ ...h }));
      copy.positionHistory = this.positionHistory.slice();
      return copy;
    }

    getPiece(r, c) {
      if (r < 0 || r > 7 || c < 0 || c > 7) return null;
      return this.board[r][c];
    }

    getFen() {
      let fen = '';
      for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c];
          if (!piece) {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            fen += piece;
          }
        }
        if (empty > 0) fen += empty;
        if (r < 7) fen += '/';
      }

      fen += ' ' + this.turn;
      let castling = '';
      if (this.castling.K) castling += 'K';
      if (this.castling.Q) castling += 'Q';
      if (this.castling.k) castling += 'k';
      if (this.castling.q) castling += 'q';
      fen += ' ' + (castling || '-');

      if (this.enPassant) {
        fen += ' ' + coordToSquare(this.enPassant.r, this.enPassant.c);
      } else {
        fen += ' -';
      }

      fen += ' ' + this.halfmoveClock + ' ' + this.fullmoveNumber;
      return fen;
    }

    loadFen(fen) {
      const parts = fen.trim().split(/\s+/);
      if (parts.length < 2) return false;

      const rows = parts[0].split('/');
      if (rows.length !== 8) return false;

      const newBoard = [];
      for (let r = 0; r < 8; r++) {
        const row = [];
        for (let ch of rows[r]) {
          if (/\d/.test(ch)) {
            const count = parseInt(ch, 10);
            for (let i = 0; i < count; i++) row.push(null);
          } else {
            row.push(ch);
          }
        }
        if (row.length !== 8) return false;
        newBoard.push(row);
      }

      this.board = newBoard;
      this.turn = parts[1] === 'b' ? 'b' : 'w';
      this.castling = {
        K: parts[2] ? parts[2].includes('K') : false,
        Q: parts[2] ? parts[2].includes('Q') : false,
        k: parts[2] ? parts[2].includes('k') : false,
        q: parts[2] ? parts[2].includes('q') : false
      };

      if (parts[3] && parts[3] !== '-') {
        this.enPassant = squareToCoord(parts[3]);
      } else {
        this.enPassant = null;
      }

      this.halfmoveClock = parts[4] ? parseInt(parts[4], 10) : 0;
      this.fullmoveNumber = parts[5] ? parseInt(parts[5], 10) : 1;
      this.history = [];
      this.positionHistory = [this.getPositionKey()];
      return true;
    }

    isSquareAttacked(targetR, targetC, byColor) {
      // 1. Pawn attacks
      if (byColor === 'w') {
        if (targetR + 1 <= 7) {
          if (targetC - 1 >= 0 && this.board[targetR + 1][targetC - 1] === 'P') return true;
          if (targetC + 1 <= 7 && this.board[targetR + 1][targetC + 1] === 'P') return true;
        }
      } else {
        if (targetR - 1 >= 0) {
          if (targetC - 1 >= 0 && this.board[targetR - 1][targetC - 1] === 'p') return true;
          if (targetC + 1 <= 7 && this.board[targetR - 1][targetC + 1] === 'p') return true;
        }
      }

      // 2. Knight attacks
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      const knightChar = byColor === 'w' ? 'N' : 'n';
      for (let [dr, dc] of knightMoves) {
        const nr = targetR + dr, nc = targetC + dc;
        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          if (this.board[nr][nc] === knightChar) return true;
        }
      }

      // 3. King attacks
      const kingChar = byColor === 'w' ? 'K' : 'k';
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = targetR + dr, nc = targetC + dc;
          if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
            if (this.board[nr][nc] === kingChar) return true;
          }
        }
      }

      // 4. Straight slider attacks (Rook, Queen)
      const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const rookChar = byColor === 'w' ? 'R' : 'r';
      const queenChar = byColor === 'w' ? 'Q' : 'q';
      for (let [dr, dc] of straightDirs) {
        let nr = targetR + dr, nc = targetC + dc;
        while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const p = this.board[nr][nc];
          if (p) {
            if (p === rookChar || p === queenChar) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }

      // 5. Diagonal slider attacks (Bishop, Queen)
      const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      const bishopChar = byColor === 'w' ? 'B' : 'b';
      for (let [dr, dc] of diagDirs) {
        let nr = targetR + dr, nc = targetC + dc;
        while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const p = this.board[nr][nc];
          if (p) {
            if (p === bishopChar || p === queenChar) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }

      return false;
    }

    findKing(color) {
      const kingChar = color === 'w' ? 'K' : 'k';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.board[r][c] === kingChar) return { r, c };
        }
      }
      return null;
    }

    isInCheck(color = this.turn) {
      const king = this.findKing(color);
      if (!king) return false;
      const opponentColor = color === 'w' ? 'b' : 'w';
      return this.isSquareAttacked(king.r, king.c, opponentColor);
    }

    generatePseudoLegalMoves(onlyCaptures = false) {
      const moves = [];
      const isWhiteTurn = this.turn === 'w';

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c];
          if (!piece) continue;
          if (isWhiteTurn && !isWhite(piece)) continue;
          if (!isWhiteTurn && !isBlack(piece)) continue;

          const pLower = piece.toLowerCase();

          // PAWN
          if (pLower === 'p') {
            const dir = isWhiteTurn ? -1 : 1;
            const startRow = isWhiteTurn ? 6 : 1;
            const promoRow = isWhiteTurn ? 0 : 7;

            // Single forward step
            const nextR = r + dir;
            if (!onlyCaptures && nextR >= 0 && nextR <= 7 && !this.board[nextR][c]) {
              if (nextR === promoRow) {
                const promos = isWhiteTurn ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];
                for (let promo of promos) {
                  moves.push({ from: { r, c }, to: { r: nextR, c }, piece, promotion: promo });
                }
              } else {
                moves.push({ from: { r, c }, to: { r: nextR, c }, piece });
                // Double step
                const doubleR = r + 2 * dir;
                if (r === startRow && !this.board[doubleR][c]) {
                  moves.push({ from: { r, c }, to: { r: doubleR, c }, piece, isDoublePawn: true });
                }
              }
            }

            // Captures
            for (let dc of [-1, 1]) {
              const capC = c + dc;
              if (capC >= 0 && capC <= 7 && nextR >= 0 && nextR <= 7) {
                const targetPiece = this.board[nextR][capC];
                if (targetPiece && (isWhiteTurn ? isBlack(targetPiece) : isWhite(targetPiece))) {
                  if (nextR === promoRow) {
                    const promos = isWhiteTurn ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];
                    for (let promo of promos) {
                      moves.push({ from: { r, c }, to: { r: nextR, c: capC }, piece, captured: targetPiece, promotion: promo });
                    }
                  } else {
                    moves.push({ from: { r, c }, to: { r: nextR, c: capC }, piece, captured: targetPiece });
                  }
                } else if (this.enPassant && this.enPassant.r === nextR && this.enPassant.c === capC) {
                  // En Passant
                  const capturedPawn = isWhiteTurn ? 'p' : 'P';
                  moves.push({
                    from: { r, c },
                    to: { r: nextR, c: capC },
                    piece,
                    captured: capturedPawn,
                    isEnPassant: true
                  });
                }
              }
            }
          }

          // KNIGHT
          else if (pLower === 'n') {
            const knightDeltas = [
              [-2, -1], [-2, 1], [-1, -2], [-1, 2],
              [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (let [dr, dc] of knightDeltas) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const target = this.board[nr][nc];
                if (!target) {
                  if (!onlyCaptures) moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
                } else if (isWhiteTurn ? isBlack(target) : isWhite(target)) {
                  moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
                }
              }
            }
          }

          // BISHOP, ROOK, QUEEN
          else if (pLower === 'b' || pLower === 'r' || pLower === 'q') {
            let directions = [];
            if (pLower === 'b' || pLower === 'q') {
              directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
            }
            if (pLower === 'r' || pLower === 'q') {
              directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
            }

            for (let [dr, dc] of directions) {
              let nr = r + dr, nc = c + dc;
              while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                const target = this.board[nr][nc];
                if (!target) {
                  if (!onlyCaptures) moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
                } else {
                  if (isWhiteTurn ? isBlack(target) : isWhite(target)) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
                  }
                  break;
                }
                nr += dr;
                nc += dc;
              }
            }
          }

          // KING
          else if (pLower === 'k') {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                  const target = this.board[nr][nc];
                  if (!target) {
                    if (!onlyCaptures) moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece });
                  } else if (isWhiteTurn ? isBlack(target) : isWhite(target)) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
                  }
                }
              }
            }

            // CASTLING (only when not in check & not restricted to onlyCaptures)
            if (!onlyCaptures) {
              const enemy = isWhiteTurn ? 'b' : 'w';
              if (isWhiteTurn) {
                // Kingside O-O
                if (this.castling.K &&
                    !this.board[7][5] && !this.board[7][6] &&
                    !this.isSquareAttacked(7, 4, enemy) &&
                    !this.isSquareAttacked(7, 5, enemy) &&
                    !this.isSquareAttacked(7, 6, enemy)) {
                  moves.push({ from: { r: 7, c: 4 }, to: { r: 7, c: 6 }, piece, isCastleKingside: true });
                }
                // Queenside O-O-O
                if (this.castling.Q &&
                    !this.board[7][3] && !this.board[7][2] && !this.board[7][1] &&
                    !this.isSquareAttacked(7, 4, enemy) &&
                    !this.isSquareAttacked(7, 3, enemy) &&
                    !this.isSquareAttacked(7, 2, enemy)) {
                  moves.push({ from: { r: 7, c: 4 }, to: { r: 7, c: 2 }, piece, isCastleQueenside: true });
                }
              } else {
                // Kingside o-o
                if (this.castling.k &&
                    !this.board[0][5] && !this.board[0][6] &&
                    !this.isSquareAttacked(0, 4, enemy) &&
                    !this.isSquareAttacked(0, 5, enemy) &&
                    !this.isSquareAttacked(0, 6, enemy)) {
                  moves.push({ from: { r: 0, c: 4 }, to: { r: 0, c: 6 }, piece, isCastleKingside: true });
                }
                // Queenside o-o-o
                if (this.castling.q &&
                    !this.board[0][3] && !this.board[0][2] && !this.board[0][1] &&
                    !this.isSquareAttacked(0, 4, enemy) &&
                    !this.isSquareAttacked(0, 3, enemy) &&
                    !this.isSquareAttacked(0, 2, enemy)) {
                  moves.push({ from: { r: 0, c: 4 }, to: { r: 0, c: 2 }, piece, isCastleQueenside: true });
                }
              }
            }
          }
        }
      }

      return moves;
    }

    makeMove(move) {
      const fromR = move.from.r, fromC = move.from.c;
      const toR = move.to.r, toC = move.to.c;
      const movingPiece = this.board[fromR][fromC];

      // Save undo snapshot
      const snapshot = {
        move,
        movingPiece,
        capturedPiece: move.captured || this.board[toR][toC],
        castling: { ...this.castling },
        enPassant: this.enPassant ? { ...this.enPassant } : null,
        halfmoveClock: this.halfmoveClock,
        fullmoveNumber: this.fullmoveNumber,
        san: ''
      };

      // Halfmove clock: reset on pawn move or capture, otherwise increment
      if (movingPiece.toLowerCase() === 'p' || snapshot.capturedPiece) {
        this.halfmoveClock = 0;
      } else {
        this.halfmoveClock++;
      }

      if (this.turn === 'b') {
        this.fullmoveNumber++;
      }

      // Execute on board
      this.board[fromR][fromC] = null;

      if (move.isCastleKingside) {
        this.board[toR][toC] = movingPiece;
        this.board[toR][5] = this.board[toR][7]; // Move Rook
        this.board[toR][7] = null;
      } else if (move.isCastleQueenside) {
        this.board[toR][toC] = movingPiece;
        this.board[toR][3] = this.board[toR][0]; // Move Rook
        this.board[toR][0] = null;
      } else if (move.isEnPassant) {
        this.board[toR][toC] = movingPiece;
        const pawnR = this.turn === 'w' ? toR + 1 : toR - 1;
        this.board[pawnR][toC] = null;
      } else if (move.promotion) {
        this.board[toR][toC] = move.promotion;
      } else {
        this.board[toR][toC] = movingPiece;
      }

      // Update En Passant target
      if (move.isDoublePawn) {
        this.enPassant = { r: (fromR + toR) / 2, c: fromC };
      } else {
        this.enPassant = null;
      }

      // Update castling rights
      if (movingPiece === 'K') {
        this.castling.K = false;
        this.castling.Q = false;
      } else if (movingPiece === 'k') {
        this.castling.k = false;
        this.castling.q = false;
      } else if (movingPiece === 'R') {
        if (fromR === 7 && fromC === 0) this.castling.Q = false;
        if (fromR === 7 && fromC === 7) this.castling.K = false;
      } else if (movingPiece === 'r') {
        if (fromR === 0 && fromC === 0) this.castling.q = false;
        if (fromR === 0 && fromC === 7) this.castling.k = false;
      }

      // If a rook is captured on its starting square
      if (toR === 7 && toC === 0) this.castling.Q = false;
      if (toR === 7 && toC === 7) this.castling.K = false;
      if (toR === 0 && toC === 0) this.castling.q = false;
      if (toR === 0 && toC === 7) this.castling.k = false;

      // Switch turn
      const movedColor = this.turn;
      this.turn = this.turn === 'w' ? 'b' : 'w';

      this.history.push(snapshot);
      this.savePositionHash();
      return true;
    }

    undoMove() {
      if (this.history.length === 0) return null;

      const snapshot = this.history.pop();
      this.positionHistory.pop();

      const { move, movingPiece, capturedPiece } = snapshot;
      const fromR = move.from.r, fromC = move.from.c;
      const toR = move.to.r, toC = move.to.c;

      // Restore piece to original square
      this.board[fromR][fromC] = movingPiece;
      this.board[toR][toC] = null;

      // Revert special moves
      if (move.isCastleKingside) {
        this.board[toR][7] = this.board[toR][5];
        this.board[toR][5] = null;
      } else if (move.isCastleQueenside) {
        this.board[toR][0] = this.board[toR][3];
        this.board[toR][3] = null;
      } else if (move.isEnPassant) {
        const pawnR = movingPiece === 'P' ? toR + 1 : toR - 1;
        this.board[pawnR][toC] = capturedPiece;
      } else if (capturedPiece) {
        this.board[toR][toC] = capturedPiece;
      }

      // Restore state
      this.castling = snapshot.castling;
      this.enPassant = snapshot.enPassant;
      this.halfmoveClock = snapshot.halfmoveClock;
      this.fullmoveNumber = snapshot.fullmoveNumber;
      this.turn = this.turn === 'w' ? 'b' : 'w';

      return snapshot;
    }

    getLegalMoves(onlyCaptures = false) {
      const pseudo = this.generatePseudoLegalMoves(onlyCaptures);
      const legal = [];
      const currentTurn = this.turn;

      for (let move of pseudo) {
        this.makeMove(move);
        // After makeMove, check if currentTurn king is attacked
        if (!this.isInCheck(currentTurn)) {
          legal.push(move);
        }
        this.undoMove();
      }

      return legal;
    }

    isGameOver() {
      const legalMoves = this.getLegalMoves();
      if (legalMoves.length === 0) {
        if (this.isInCheck()) {
          return {
            over: true,
            reason: 'checkmate',
            winner: this.turn === 'w' ? 'b' : 'w'
          };
        } else {
          return {
            over: true,
            reason: 'stalemate',
            winner: null
          };
        }
      }

      // 50-move rule
      if (this.halfmoveClock >= 100) {
        return {
          over: true,
          reason: '50-move-rule',
          winner: null
        };
      }

      // Threefold repetition
      const currentKey = this.getPositionKey();
      let repCount = 0;
      for (let key of this.positionHistory) {
        if (key === currentKey) repCount++;
      }
      if (repCount >= 3) {
        return {
          over: true,
          reason: 'threefold-repetition',
          winner: null
        };
      }

      // Insufficient material
      if (this.isInsufficientMaterial()) {
        return {
          over: true,
          reason: 'insufficient-material',
          winner: null
        };
      }

      return { over: false };
    }

    isInsufficientMaterial() {
      const pieces = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p) pieces.push({ p, r, c });
        }
      }

      // King vs King
      if (pieces.length === 2) return true;

      // King + Minor vs King
      if (pieces.length === 3) {
        const hasMinor = pieces.some(item => ['n', 'b', 'N', 'B'].includes(item.p));
        if (hasMinor) return true;
      }

      // King + Bishop vs King + Bishop (same colored squares)
      if (pieces.length === 4) {
        const whiteBishops = pieces.filter(item => item.p === 'B');
        const blackBishops = pieces.filter(item => item.p === 'b');
        if (whiteBishops.length === 1 && blackBishops.length === 1) {
          const wSquareColor = (whiteBishops[0].r + whiteBishops[0].c) % 2;
          const bSquareColor = (blackBishops[0].r + blackBishops[0].c) % 2;
          if (wSquareColor === bSquareColor) return true;
        }
      }

      return false;
    }

    moveToUci(move) {
      const from = coordToSquare(move.from.r, move.from.c);
      const to = coordToSquare(move.to.r, move.to.c);
      const promo = move.promotion ? move.promotion.toLowerCase() : '';
      return from + to + promo;
    }

    uciToMove(uci) {
      if (!uci || uci.length < 4) return null;
      const from = squareToCoord(uci.substring(0, 2));
      const to = squareToCoord(uci.substring(2, 4));
      const promo = uci.length >= 5 ? uci[4].toLowerCase() : null;

      const legalMoves = this.getLegalMoves();
      for (let m of legalMoves) {
        if (m.from.r === from.r && m.from.c === from.c &&
            m.to.r === to.r && m.to.c === to.c) {
          if (!promo || (m.promotion && m.promotion.toLowerCase() === promo)) {
            return m;
          }
        }
      }
      return null;
    }

    moveToSan(move) {
      if (move.isCastleKingside) return 'O-O';
      if (move.isCastleQueenside) return 'O-O-O';

      const p = move.piece.toUpperCase();
      const dest = coordToSquare(move.to.r, move.to.c);
      let san = '';

      if (p === 'P') {
        if (move.captured) {
          san += FILES[move.from.c] + 'x' + dest;
        } else {
          san += dest;
        }
        if (move.promotion) {
          san += '=' + move.promotion.toUpperCase();
        }
      } else {
        san += p;
        // Disambiguation
        const allLegal = this.getLegalMoves();
        const ambiguities = allLegal.filter(m =>
          m.piece.toUpperCase() === p &&
          m.to.r === move.to.r && m.to.c === move.to.c &&
          (m.from.r !== move.from.r || m.from.c !== move.from.c)
        );

        if (ambiguities.length > 0) {
          const sameFile = ambiguities.some(m => m.from.c === move.from.c);
          const sameRank = ambiguities.some(m => m.from.r === move.from.r);
          if (!sameFile) {
            san += FILES[move.from.c];
          } else if (!sameRank) {
            san += (8 - move.from.r);
          } else {
            san += FILES[move.from.c] + (8 - move.from.r);
          }
        }

        if (move.captured) san += 'x';
        san += dest;
      }

      // Check / Checkmate suffix
      this.makeMove(move);
      const isCheck = this.isInCheck();
      const legalNext = this.getLegalMoves();
      if (isCheck) {
        san += legalNext.length === 0 ? '#' : '+';
      }
      this.undoMove();

      return san;
    }

    evaluate() {
      let whiteScore = 0;
      let blackScore = 0;
      let pieceCount = 0;

      // Count pieces to determine game stage (middlegame vs endgame)
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p && p.toLowerCase() !== 'p' && p.toLowerCase() !== 'k') {
            pieceCount++;
          }
        }
      }
      const isEndgame = pieceCount <= 6;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (!p) continue;

          const pLow = p.toLowerCase();
          const baseVal = PIECE_VALUES[pLow];
          const isW = isWhite(p);

          // PST index
          const pstR = isW ? r : 7 - r;
          const pstIdx = pstR * 8 + c;

          let pstVal = 0;
          if (pLow === 'k') {
            pstVal = isEndgame ? PST.k_endgame[pstIdx] : PST.k[pstIdx];
          } else if (PST[pLow]) {
            pstVal = PST[pLow][pstIdx];
          }

          const totalPieceVal = baseVal + pstVal;
          if (isW) {
            whiteScore += totalPieceVal;
          } else {
            blackScore += totalPieceVal;
          }
        }
      }

      // Advantage relative to White
      return whiteScore - blackScore;
    }

    getCapturedPieces() {
      const initialWhite = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
      const initialBlack = { p: 8, n: 2, b: 2, r: 2, q: 1 };

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (!p) continue;
          if (isWhite(p) && initialWhite[p] !== undefined) {
            initialWhite[p]--;
          } else if (isBlack(p) && initialBlack[p] !== undefined) {
            initialBlack[p]--;
          }
        }
      }

      const capturedByWhite = [];
      for (let [piece, count] of Object.entries(initialBlack)) {
        for (let i = 0; i < count; i++) capturedByWhite.push(piece);
      }

      const capturedByBlack = [];
      for (let [piece, count] of Object.entries(initialWhite)) {
        for (let i = 0; i < count; i++) capturedByBlack.push(piece);
      }

      return {
        white: capturedByWhite,
        black: capturedByBlack
      };
    }
  }

  // --- REINFORCEMENT LEARNING AGENT (TD-LEARNING / NEUROPAWN) ---
  const DEFAULT_RL_WEIGHTS = {
    pawn: 100,
    knight: 318,
    bishop: 334,
    rook: 502,
    queen: 915,
    mobility: 6.2,
    center_control: 18.5,
    pawn_advance: 8.2,
    king_shelter: 24.0,
    bishop_pair: 48.0,
    threats: 22.0
  };

  const RL_FEATURE_NAMES = Object.keys(DEFAULT_RL_WEIGHTS);

  class RLChessAgent {
    constructor(engine, options = {}) {
      this.engine = engine;
      this.weights = { ...DEFAULT_RL_WEIGHTS, ...(options.weights || {}) };
      this.gamma = options.gamma !== undefined ? options.gamma : 0.98;
      this.lambda = options.lambda !== undefined ? options.lambda : 0.7;
      this.alpha = options.alpha !== undefined ? options.alpha : 0.04;
      this.epsilon = options.epsilon !== undefined ? options.epsilon : 0.12;
      this.episodesTrained = options.episodesTrained || 0;
      this.stats = options.stats || { winsWhite: 0, winsBlack: 0, draws: 0, totalGames: 0 };
      this.isTraining = false;
      this.stopRequested = false;

      // Automatically load saved weights if in browser environment
      this.loadFromStorage();
    }

    extractFeatures(board = this.engine.board) {
      let pW = 0, pB = 0;
      let nW = 0, nB = 0;
      let bW = 0, bB = 0;
      let rW = 0, rB = 0;
      let qW = 0, qB = 0;

      let whitePawnRanks = 0, blackPawnRanks = 0;
      let whiteCenter = 0, blackCenter = 0;
      let whiteKingPos = null, blackKingPos = null;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (!p) continue;

          const isCenter = (r >= 3 && r <= 4 && c >= 3 && c <= 4);
          const isExtendedCenter = (r >= 2 && r <= 5 && c >= 2 && c <= 5);

          switch (p) {
            case 'P':
              pW++;
              whitePawnRanks += (7 - r);
              if (isCenter) whiteCenter += 2;
              else if (isExtendedCenter) whiteCenter += 1;
              break;
            case 'p':
              pB++;
              blackPawnRanks += r;
              if (isCenter) blackCenter += 2;
              else if (isExtendedCenter) blackCenter += 1;
              break;
            case 'N':
              nW++;
              if (isCenter) whiteCenter += 2;
              else if (isExtendedCenter) whiteCenter += 1;
              break;
            case 'n':
              nB++;
              if (isCenter) blackCenter += 2;
              else if (isExtendedCenter) blackCenter += 1;
              break;
            case 'B':
              bW++;
              if (isCenter) whiteCenter += 2;
              break;
            case 'b':
              bB++;
              if (isCenter) blackCenter += 2;
              break;
            case 'R': rW++; break;
            case 'r': rB++; break;
            case 'Q': qW++; break;
            case 'q': qB++; break;
            case 'K': whiteKingPos = { r, c }; break;
            case 'k': blackKingPos = { r, c }; break;
          }
        }
      }

      // King shelter
      let whiteKingShelter = 0;
      if (whiteKingPos) {
        for (let dc = -1; dc <= 1; dc++) {
          const kc = whiteKingPos.c + dc;
          if (kc >= 0 && kc <= 7) {
            for (let dr = 1; dr <= 2; dr++) {
              const kr = whiteKingPos.r - dr;
              if (kr >= 0 && board[kr][kc] === 'P') whiteKingShelter += 1;
            }
          }
        }
      }

      let blackKingShelter = 0;
      if (blackKingPos) {
        for (let dc = -1; dc <= 1; dc++) {
          const kc = blackKingPos.c + dc;
          if (kc >= 0 && kc <= 7) {
            for (let dr = 1; dr <= 2; dr++) {
              const kr = blackKingPos.r + dr;
              if (kr <= 7 && board[kr][kc] === 'p') blackKingShelter += 1;
            }
          }
        }
      }

      const whiteLegal = this.engine.getLegalMoves ? this.engine.getLegalMoves().length : 20;

      return {
        pawn: pW - pB,
        knight: nW - nB,
        bishop: bW - bB,
        rook: rW - rB,
        queen: qW - qB,
        mobility: (this.engine.turn === 'w' ? whiteLegal : -whiteLegal) * 0.1,
        center_control: whiteCenter - blackCenter,
        pawn_advance: (whitePawnRanks - blackPawnRanks) * 0.1,
        king_shelter: whiteKingShelter - blackKingShelter,
        bishop_pair: (bW >= 2 ? 1 : 0) - (bB >= 2 ? 1 : 0),
        threats: 0
      };
    }

    evaluate(engine = this.engine) {
      const phi = this.extractFeatures(engine.board);
      let score = 0;
      for (const key of RL_FEATURE_NAMES) {
        score += (this.weights[key] || 0) * (phi[key] || 0);
      }
      return score;
    }

    computeValueFromFeatures(phi) {
      let v = 0;
      for (const k of RL_FEATURE_NAMES) {
        v += (this.weights[k] || 0) * (phi[k] || 0);
      }
      return v;
    }

    selectAction(engine = this.engine, explore = false) {
      const legalMoves = engine.getLegalMoves();
      if (legalMoves.length === 0) return null;
      if (legalMoves.length === 1) return legalMoves[0];

      if (explore && Math.random() < this.epsilon) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }

      const isWhiteTurn = engine.turn === 'w';
      let bestMove = legalMoves[0];
      let bestScore = isWhiteTurn ? -Infinity : Infinity;

      for (const move of legalMoves) {
        engine.makeMove(move);
        const score = this.evaluate(engine);
        engine.undoMove();

        if (isWhiteTurn) {
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        } else {
          if (score < bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      }

      return bestMove;
    }

    updateFromTrajectory(trajectory, reward) {
      if (!trajectory || trajectory.length === 0) return;

      const T = trajectory.length;
      const eligibility = {};
      for (const k of RL_FEATURE_NAMES) eligibility[k] = 0;

      for (let t = 0; t < T; t++) {
        const phiCurrent = trajectory[t];
        const vCurrent = this.computeValueFromFeatures(phiCurrent);

        let target = 0;
        if (t === T - 1) {
          target = reward * 1000;
        } else {
          const vNext = this.computeValueFromFeatures(trajectory[t + 1]);
          target = this.gamma * vNext;
        }

        const delta = target - vCurrent;

        for (const k of RL_FEATURE_NAMES) {
          eligibility[k] = this.gamma * this.lambda * eligibility[k] + (phiCurrent[k] || 0);
          const update = this.alpha * delta * (eligibility[k] / 1000);
          this.weights[k] += update;
        }
      }

      this.clampWeights();
      this.episodesTrained++;
      this.saveToStorage();
    }

    clampWeights() {
      this.weights.pawn = Math.max(50, Math.min(180, this.weights.pawn));
      this.weights.knight = Math.max(200, Math.min(450, this.weights.knight));
      this.weights.bishop = Math.max(220, Math.min(480, this.weights.bishop));
      this.weights.rook = Math.max(350, Math.min(700, this.weights.rook));
      this.weights.queen = Math.max(700, Math.min(1400, this.weights.queen));
      this.weights.mobility = Math.max(1, Math.min(25, this.weights.mobility));
      this.weights.center_control = Math.max(5, Math.min(45, this.weights.center_control));
      this.weights.pawn_advance = Math.max(1, Math.min(30, this.weights.pawn_advance));
      this.weights.king_shelter = Math.max(5, Math.min(50, this.weights.king_shelter));
      this.weights.bishop_pair = Math.max(10, Math.min(90, this.weights.bishop_pair));
      this.weights.threats = Math.max(0, Math.min(50, this.weights.threats));
    }

    async trainSelfPlayBatch(numGames, progressCallback) {
      this.isTraining = true;
      this.stopRequested = false;

      for (let i = 0; i < numGames; i++) {
        if (this.stopRequested) break;

        const simEngine = new ChessEngine();
        const trajectory = [];
        let movesCount = 0;
        const maxMoves = 100;

        while (movesCount < maxMoves) {
          const status = simEngine.isGameOver();
          if (status.over) break;

          trajectory.push(this.extractFeatures(simEngine.board));
          const move = this.selectAction(simEngine, true);
          if (!move) break;
          simEngine.makeMove(move);
          movesCount++;
        }

        const endStatus = simEngine.isGameOver();
        let reward = 0;
        if (endStatus.over && endStatus.reason === 'checkmate') {
          reward = endStatus.winner === 'w' ? 1 : -1;
          if (endStatus.winner === 'w') this.stats.winsWhite++;
          else this.stats.winsBlack++;
        } else {
          this.stats.draws++;
        }
        this.stats.totalGames++;

        this.updateFromTrajectory(trajectory, reward);
        this.epsilon = Math.max(0.04, this.epsilon * 0.998);

        if (progressCallback && (i % 2 === 0 || i === numGames - 1)) {
          progressCallback({
            completed: i + 1,
            total: numGames,
            reward,
            moves: movesCount,
            winner: endStatus.over && endStatus.reason === 'checkmate' ? endStatus.winner : 'draw',
            weights: { ...this.weights },
            stats: { ...this.stats },
            epsilon: this.epsilon,
            episodesTrained: this.episodesTrained
          });
          await new Promise(r => setTimeout(r, 0));
        }
      }

      this.isTraining = false;
      return { stats: this.stats, weights: this.weights };
    }

    saveToStorage() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('deep_pawn_rl_weights', JSON.stringify({
            weights: this.weights,
            episodesTrained: this.episodesTrained,
            stats: this.stats,
            epsilon: this.epsilon
          }));
        }
      } catch (e) {}
    }

    loadFromStorage() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('deep_pawn_rl_weights');
          if (raw) {
            const data = JSON.parse(raw);
            if (data.weights) this.weights = { ...DEFAULT_RL_WEIGHTS, ...data.weights };
            if (data.episodesTrained) this.episodesTrained = data.episodesTrained;
            if (data.stats) this.stats = data.stats;
            if (data.epsilon) this.epsilon = data.epsilon;
          }
        }
      } catch (e) {}
    }

    resetWeights() {
      this.weights = { ...DEFAULT_RL_WEIGHTS };
      this.episodesTrained = 0;
      this.stats = { winsWhite: 0, winsBlack: 0, draws: 0, totalGames: 0 };
      this.epsilon = 0.12;
      this.saveToStorage();
    }
  }

  // --- BOT SEARCH AI ---
  class ChessBot {
    constructor(engine, options = {}) {
      this.engine = engine;
      this.nodesVisited = 0;
      this.killerMoves = [];
      this.historyTable = {};
      this.stopSearch = false;
      this.rlAgent = options.rlAgent || new RLChessAgent(this.engine);
    }

    findBestMove(options = {}) {
      const difficulty = options.difficulty || 'master'; // beginner, casual, intermediate, master
      const customDepth = options.depth || null;

      this.nodesVisited = 0;
      this.killerMoves = [[], [], [], [], [], [], [], []];
      this.historyTable = {};

      const legalMoves = this.engine.getLegalMoves();
      if (legalMoves.length === 0) return null;
      if (legalMoves.length === 1) return { move: legalMoves[0], score: 0, depth: 1, nodes: 1 };

      // Check Opening Book first (Master / Intermediate / Casual)
      if (difficulty !== 'beginner') {
        const fen = this.engine.getFen();
        const bookEntries = OPENING_BOOK[fen];
        if (bookEntries && bookEntries.length > 0) {
          const totalWeight = bookEntries.reduce((sum, e) => sum + e.weight, 0);
          let rnd = Math.random() * totalWeight;
          for (let entry of bookEntries) {
            if (rnd < entry.weight) {
              const move = this.engine.uciToMove(entry.move);
              if (move) {
                return {
                  move,
                  score: 0,
                  depth: 1,
                  nodes: 1,
                  fromBook: true
                };
              }
            }
            rnd -= entry.weight;
          }
        }
      }

      // Configure Search Parameters based on difficulty
      let targetDepth = 3;
      let randomness = 0;
      const isRLBot = difficulty === 'rl_bot' || options.useRL;

      if (customDepth) {
        targetDepth = customDepth;
      } else if (isRLBot) {
        targetDepth = 3;
        randomness = 0;
      } else if (difficulty === 'beginner') {
        targetDepth = 1;
        randomness = 0.35; // 35% random blunder rate
      } else if (difficulty === 'casual') {
        targetDepth = 2;
        randomness = 0.08;
      } else if (difficulty === 'intermediate') {
        targetDepth = 3;
        randomness = 0;
      } else { // Master
        targetDepth = 4;
        randomness = 0;
      }

      // Beginner Random Move injection
      if (randomness > 0 && Math.random() < randomness) {
        const rndMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        return {
          move: rndMove,
          score: 0,
          depth: targetDepth,
          nodes: legalMoves.length,
          blunder: true
        };
      }

      // Iterative Deepening
      let bestMove = legalMoves[0];
      let bestScore = 0;
      const isWhiteToMove = this.engine.turn === 'w';

      const startTime = Date.now();

      for (let depth = 1; depth <= targetDepth; depth++) {
        let currentBestMove = null;
        let alpha = -Infinity;
        let beta = Infinity;

        const orderedMoves = this.orderMoves(legalMoves, depth, bestMove);

        if (isWhiteToMove) {
          let maxEval = -Infinity;
          for (let move of orderedMoves) {
            this.engine.makeMove(move);
            const score = this.minimax(depth - 1, alpha, beta, false, isRLBot);
            this.engine.undoMove();

            if (score > maxEval) {
              maxEval = score;
              currentBestMove = move;
            }
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
          }
          if (currentBestMove) {
            bestMove = currentBestMove;
            bestScore = maxEval;
          }
        } else {
          let minEval = Infinity;
          for (let move of orderedMoves) {
            this.engine.makeMove(move);
            const score = this.minimax(depth - 1, alpha, beta, true, isRLBot);
            this.engine.undoMove();

            if (score < minEval) {
              minEval = score;
              currentBestMove = move;
            }
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
          }
          if (currentBestMove) {
            bestMove = currentBestMove;
            bestScore = minEval;
          }
        }

        // Time cutoff (e.g. max 1800ms)
        if (Date.now() - startTime > 1800 && depth >= 3) break;
      }

      return {
        move: bestMove,
        score: bestScore,
        depth: targetDepth,
        nodes: this.nodesVisited,
        timeMs: Date.now() - startTime,
        isRL: isRLBot
      };
    }

    minimax(depth, alpha, beta, isMaximizing, isRLBot = false) {
      this.nodesVisited++;

      if (depth === 0) {
        return this.quiescence(alpha, beta, isMaximizing, 3, isRLBot);
      }

      const legalMoves = this.engine.getLegalMoves();
      if (legalMoves.length === 0) {
        if (this.engine.isInCheck()) {
          return isMaximizing ? -20000 - depth : 20000 + depth;
        }
        return 0; // Stalemate
      }

      const orderedMoves = this.orderMoves(legalMoves, depth);

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of orderedMoves) {
          this.engine.makeMove(move);
          const score = this.minimax(depth - 1, alpha, beta, false, isRLBot);
          this.engine.undoMove();

          maxEval = Math.max(maxEval, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) {
            this.storeKiller(depth, move);
            break;
          }
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (let move of orderedMoves) {
          this.engine.makeMove(move);
          const score = this.minimax(depth - 1, alpha, beta, true, isRLBot);
          this.engine.undoMove();

          minEval = Math.min(minEval, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) {
            this.storeKiller(depth, move);
            break;
          }
        }
        return minEval;
      }
    }

    quiescence(alpha, beta, isMaximizing, maxDepth, isRLBot = false) {
      this.nodesVisited++;
      const standPat = isRLBot ? this.rlAgent.evaluate(this.engine) : this.engine.evaluate();

      if (maxDepth === 0) return standPat;

      if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;

        const captures = this.engine.getLegalMoves(true);
        const ordered = this.orderMoves(captures, 0);

        for (let move of ordered) {
          this.engine.makeMove(move);
          const score = this.quiescence(alpha, beta, false, maxDepth - 1, isRLBot);
          this.engine.undoMove();

          if (score >= beta) return beta;
          if (score > alpha) alpha = score;
        }
        return alpha;
      } else {
        if (standPat <= alpha) return alpha;
        if (beta > standPat) beta = standPat;

        const captures = this.engine.getLegalMoves(true);
        const ordered = this.orderMoves(captures, 0);

        for (let move of ordered) {
          this.engine.makeMove(move);
          const score = this.quiescence(alpha, beta, true, maxDepth - 1, isRLBot);
          this.engine.undoMove();

          if (score <= alpha) return alpha;
          if (score < beta) beta = score;
        }
        return beta;
      }
    }

    orderMoves(moves, depth, bestMove = null) {
      return moves.map(move => {
        let score = 0;

        // 1. Previous best move gets top priority
        if (bestMove && move.from.r === bestMove.from.r && move.from.c === bestMove.from.c &&
            move.to.r === bestMove.to.r && move.to.c === bestMove.to.c) {
          score += 20000;
        }

        // 2. MVV-LVA for Captures (Most Valuable Victim - Least Valuable Attacker)
        if (move.captured) {
          const victimVal = PIECE_VALUES[move.captured.toLowerCase()] || 0;
          const attackerVal = PIECE_VALUES[move.piece.toLowerCase()] || 0;
          score += 10000 + (victimVal * 10 - attackerVal);
        }

        // 3. Pawn Promotion
        if (move.promotion) {
          score += 9000;
        }

        // 4. Killer Moves
        if (depth > 0 && this.killerMoves[depth]) {
          const km = this.killerMoves[depth];
          if (km.some(k => k.from.r === move.from.r && k.from.c === move.from.c &&
                          k.to.r === move.to.r && k.to.c === move.to.c)) {
            score += 5000;
          }
        }

        // 5. Center control preference
        const centerDist = Math.abs(3.5 - move.to.r) + Math.abs(3.5 - move.to.c);
        score += (7 - centerDist) * 10;

        return { move, score };
      }).sort((a, b) => b.score - a.score).map(item => item.move);
    }

    storeKiller(depth, move) {
      if (!move.captured && depth < 8) {
        if (!this.killerMoves[depth]) this.killerMoves[depth] = [];
        this.killerMoves[depth].unshift(move);
        if (this.killerMoves[depth].length > 2) this.killerMoves[depth].pop();
      }
    }
  }

  return {
    ChessEngine,
    ChessBot,
    RLChessAgent,
    DEFAULT_RL_WEIGHTS,
    RL_FEATURE_NAMES,
    coordToSquare,
    squareToCoord
  };
});
