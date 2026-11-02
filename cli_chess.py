#!/usr/bin/env python3
"""
CLI Chess Bot - A standalone, zero-dependency Chess game and AI in Python.
Features:
- Full Chess rules: Castling, En Passant, Promotion, Check/Checkmate, Stalemate.
- Beautiful ANSI-colored terminal board with Unicode pieces.
- Minimax AI with Alpha-Beta pruning, Move Ordering, and Piece-Square Tables.
- Human vs Bot, Human vs Human, and Bot vs Bot modes.
"""

import copy
import sys
import time

# Ensure safe UTF-8 encoding on Windows command prompt
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

UNICODE_PIECES = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    '.': '·'
}

PIECE_VALUES = {
    'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000,
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
}

# Piece-Square Tables (White perspective)
PST_PAWN = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
]

PST_KNIGHT = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
]

PST_BISHOP = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  0, 10, 15, 15, 10,  0,-10,
    -10,  5,  5, 15, 15,  5,  5,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
]

PST_ROOK = [
      0,  0,  0,  5,  5,  0,  0,  0,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      5, 10, 10, 10, 10, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0
]

PST_QUEEN = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -10,  5,  5,  5,  5,  5,  0,-10,
      0,  0,  5,  5,  5,  5,  0, -5,
     -5,  0,  5,  5,  5,  5,  0, -5,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
]

PST_KING = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
]

PST_MAP = {
    'p': PST_PAWN,
    'n': PST_KNIGHT,
    'b': PST_BISHOP,
    'r': PST_ROOK,
    'q': PST_QUEEN,
    'k': PST_KING
}

def square_to_coord(sq):
    c = ord(sq[0].lower()) - ord('a')
    r = 8 - int(sq[1])
    return r, c

def coord_to_square(r, c):
    return chr(ord('a') + c) + str(8 - r)

class Board:
    def __init__(self):
        self.grid = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['.', '.', '.', '.', '.', '.', '.', '.'],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ]
        self.turn = 'w'
        self.castling = {'K': True, 'Q': True, 'k': True, 'q': True}
        self.en_passant = None  # (r, c)
        self.halfmove_clock = 0
        self.fullmove_number = 1
        self.history = []

    def clone(self):
        b = Board()
        b.grid = [row[:] for row in self.grid]
        b.turn = self.turn
        b.castling = dict(self.castling)
        b.en_passant = self.en_passant
        b.halfmove_clock = self.halfmove_clock
        b.fullmove_number = self.fullmove_number
        b.history = [dict(h) for h in self.history]
        return b

    def is_white(self, piece):
        return piece.isupper()

    def is_black(self, piece):
        return piece.islower()

    def find_king(self, color):
        k_char = 'K' if color == 'w' else 'k'
        for r in range(8):
            for c in range(8):
                if self.grid[r][c] == k_char:
                    return r, c
        return None

    def is_attacked(self, target_r, target_c, by_color):
        # 1. Pawns
        if by_color == 'w':
            if target_r + 1 <= 7:
                if target_c - 1 >= 0 and self.grid[target_r + 1][target_c - 1] == 'P':
                    return True
                if target_c + 1 <= 7 and self.grid[target_r + 1][target_c + 1] == 'P':
                    return True
        else:
            if target_r - 1 >= 0:
                if target_c - 1 >= 0 and self.grid[target_r - 1][target_c - 1] == 'p':
                    return True
                if target_c + 1 <= 7 and self.grid[target_r - 1][target_c + 1] == 'p':
                    return True

        # 2. Knights
        knight_deltas = [(-2,-1), (-2,1), (-1,-2), (-1,2), (1,-2), (1,2), (2,-1), (2,1)]
        k_char = 'N' if by_color == 'w' else 'n'
        for dr, dc in knight_deltas:
            nr, nc = target_r + dr, target_c + dc
            if 0 <= nr < 8 and 0 <= nc < 8:
                if self.grid[nr][nc] == k_char:
                    return True

        # 3. King
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0: continue
                nr, nc = target_r + dr, target_c + dc
                if 0 <= nr < 8 and 0 <= nc < 8:
                    if self.grid[nr][nc] == ('K' if by_color == 'w' else 'k'):
                        return True

        # 4. Straight (Rook, Queen)
        r_char = 'R' if by_color == 'w' else 'r'
        q_char = 'Q' if by_color == 'w' else 'q'
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = target_r + dr, target_c + dc
            while 0 <= nr < 8 and 0 <= nc < 8:
                p = self.grid[nr][nc]
                if p != '.':
                    if p == r_char or p == q_char:
                        return True
                    break
                nr += dr
                nc += dc

        # 5. Diagonal (Bishop, Queen)
        b_char = 'B' if by_color == 'w' else 'b'
        for dr, dc in [(-1,-1), (-1,1), (1,-1), (1,1)]:
            nr, nc = target_r + dr, target_c + dc
            while 0 <= nr < 8 and 0 <= nc < 8:
                p = self.grid[nr][nc]
                if p != '.':
                    if p == b_char or p == q_char:
                        return True
                    break
                nr += dr
                nc += dc

        return False

    def in_check(self, color=None):
        if color is None:
            color = self.turn
        king_pos = self.find_king(color)
        if not king_pos:
            return False
        enemy = 'b' if color == 'w' else 'w'
        return self.is_attacked(king_pos[0], king_pos[1], enemy)

    def generate_pseudo_legal_moves(self, captures_only=False):
        moves = []
        is_w = self.turn == 'w'

        for r in range(8):
            for c in range(8):
                piece = self.grid[r][c]
                if piece == '.':
                    continue
                if is_w and not piece.isupper():
                    continue
                if not is_w and not piece.islower():
                    continue

                p_low = piece.lower()

                # PAWN
                if p_low == 'p':
                    dir_r = -1 if is_w else 1
                    start_r = 6 if is_w else 1
                    promo_r = 0 if is_w else 7

                    # Single step
                    nr = r + dir_r
                    if not captures_only and 0 <= nr < 8 and self.grid[nr][c] == '.':
                        if nr == promo_r:
                            for promo in (['Q', 'R', 'B', 'N'] if is_w else ['q', 'r', 'b', 'n']):
                                moves.append({'from': (r, c), 'to': (nr, c), 'promo': promo, 'piece': piece})
                        else:
                            moves.append({'from': (r, c), 'to': (nr, c), 'promo': None, 'piece': piece})
                            # Double step
                            nnr = r + 2 * dir_r
                            if r == start_r and self.grid[nnr][c] == '.':
                                moves.append({'from': (r, c), 'to': (nnr, c), 'promo': None, 'piece': piece, 'double': True})

                    # Captures
                    for dc in (-1, 1):
                        nc = c + dc
                        if 0 <= nc < 8 and 0 <= nr < 8:
                            target = self.grid[nr][nc]
                            if target != '.' and (piece.isupper() != target.isupper()):
                                if nr == promo_r:
                                    for promo in (['Q', 'R', 'B', 'N'] if is_w else ['q', 'r', 'b', 'n']):
                                        moves.append({'from': (r, c), 'to': (nr, nc), 'promo': promo, 'piece': piece, 'captured': target})
                                else:
                                    moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece, 'captured': target})
                            elif self.en_passant == (nr, nc):
                                # En passant
                                ep_cap = 'p' if is_w else 'P'
                                moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece, 'captured': ep_cap, 'ep': True})

                # KNIGHT
                elif p_low == 'n':
                    for dr, dc in [(-2,-1), (-2,1), (-1,-2), (-1,2), (1,-2), (1,2), (2,-1), (2,1)]:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < 8 and 0 <= nc < 8:
                            target = self.grid[nr][nc]
                            if target == '.':
                                if not captures_only:
                                    moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece})
                            elif piece.isupper() != target.isupper():
                                moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece, 'captured': target})

                # BISHOP, ROOK, QUEEN
                elif p_low in ('b', 'r', 'q'):
                    dirs = []
                    if p_low in ('b', 'q'):
                        dirs.extend([(-1,-1), (-1,1), (1,-1), (1,1)])
                    if p_low in ('r', 'q'):
                        dirs.extend([(-1,0), (1,0), (0,-1), (0,1)])

                    for dr, dc in dirs:
                        nr, nc = r + dr, c + dc
                        while 0 <= nr < 8 and 0 <= nc < 8:
                            target = self.grid[nr][nc]
                            if target == '.':
                                if not captures_only:
                                    moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece})
                            else:
                                if piece.isupper() != target.isupper():
                                    moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece, 'captured': target})
                                break
                            nr += dr
                            nc += dc

                # KING
                elif p_low == 'k':
                    for dr in (-1, 0, 1):
                        for dc in (-1, 0, 1):
                            if dr == 0 and dc == 0: continue
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < 8 and 0 <= nc < 8:
                                target = self.grid[nr][nc]
                                if target == '.':
                                    if not captures_only:
                                        moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece})
                                elif piece.isupper() != target.isupper():
                                    moves.append({'from': (r, c), 'to': (nr, nc), 'promo': None, 'piece': piece, 'captured': target})

                    # Castling
                    if not captures_only:
                        enemy = 'b' if is_w else 'w'
                        if is_w:
                            # Kingside O-O
                            if (self.castling['K'] and
                                self.grid[7][5] == '.' and self.grid[7][6] == '.' and
                                not self.is_attacked(7, 4, enemy) and
                                not self.is_attacked(7, 5, enemy) and
                                not self.is_attacked(7, 6, enemy)):
                                moves.append({'from': (7, 4), 'to': (7, 6), 'promo': None, 'piece': piece, 'castle': 'K'})
                            # Queenside O-O-O
                            if (self.castling['Q'] and
                                self.grid[7][3] == '.' and self.grid[7][2] == '.' and self.grid[7][1] == '.' and
                                not self.is_attacked(7, 4, enemy) and
                                not self.is_attacked(7, 3, enemy) and
                                not self.is_attacked(7, 2, enemy)):
                                moves.append({'from': (7, 4), 'to': (7, 2), 'promo': None, 'piece': piece, 'castle': 'Q'})
                        else:
                            # Kingside o-o
                            if (self.castling['k'] and
                                self.grid[0][5] == '.' and self.grid[0][6] == '.' and
                                not self.is_attacked(0, 4, enemy) and
                                not self.is_attacked(0, 5, enemy) and
                                not self.is_attacked(0, 6, enemy)):
                                moves.append({'from': (0, 4), 'to': (0, 6), 'promo': None, 'piece': piece, 'castle': 'k'})
                            # Queenside o-o-o
                            if (self.castling['q'] and
                                self.grid[0][3] == '.' and self.grid[0][2] == '.' and self.grid[0][1] == '.' and
                                not self.is_attacked(0, 4, enemy) and
                                not self.is_attacked(0, 3, enemy) and
                                not self.is_attacked(0, 2, enemy)):
                                moves.append({'from': (0, 4), 'to': (0, 2), 'promo': None, 'piece': piece, 'castle': 'q'})

        return moves

    def make_move(self, move):
        fr, fc = move['from']
        tr, tc = move['to']
        moving_piece = self.grid[fr][fc]
        target_piece = self.grid[tr][tc]

        snapshot = {
            'move': move,
            'moving_piece': moving_piece,
            'captured_piece': move.get('captured') or (target_piece if target_piece != '.' else None),
            'castling': dict(self.castling),
            'en_passant': self.en_passant,
            'halfmove_clock': self.halfmove_clock,
            'fullmove_number': self.fullmove_number
        }

        # Halfmove clock
        if moving_piece.lower() == 'p' or snapshot['captured_piece']:
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1

        if self.turn == 'b':
            self.fullmove_number += 1

        self.grid[fr][fc] = '.'

        # Special moves
        if move.get('castle') == 'K':
            self.grid[tr][tc] = moving_piece
            self.grid[7][5] = self.grid[7][7]
            self.grid[7][7] = '.'
        elif move.get('castle') == 'Q':
            self.grid[tr][tc] = moving_piece
            self.grid[7][3] = self.grid[7][0]
            self.grid[7][0] = '.'
        elif move.get('castle') == 'k':
            self.grid[tr][tc] = moving_piece
            self.grid[0][5] = self.grid[0][7]
            self.grid[0][7] = '.'
        elif move.get('castle') == 'q':
            self.grid[tr][tc] = moving_piece
            self.grid[0][3] = self.grid[0][0]
            self.grid[0][0] = '.'
        elif move.get('ep'):
            self.grid[tr][tc] = moving_piece
            pawn_r = tr + 1 if self.turn == 'w' else tr - 1
            self.grid[pawn_r][tc] = '.'
        elif move.get('promo'):
            self.grid[tr][tc] = move['promo']
        else:
            self.grid[tr][tc] = moving_piece

        # En passant target
        if move.get('double'):
            self.en_passant = ((fr + tr) // 2, fc)
        else:
            self.en_passant = None

        # Castling rights updates
        if moving_piece == 'K':
            self.castling['K'] = False
            self.castling['Q'] = False
        elif moving_piece == 'k':
            self.castling['k'] = False
            self.castling['q'] = False
        elif moving_piece == 'R':
            if fr == 7 and fc == 0: self.castling['Q'] = False
            if fr == 7 and fc == 7: self.castling['K'] = False
        elif moving_piece == 'r':
            if fr == 0 and fc == 0: self.castling['q'] = False
            if fr == 0 and fc == 7: self.castling['k'] = False

        if tr == 7 and tc == 0: self.castling['Q'] = False
        if tr == 7 and tc == 7: self.castling['K'] = False
        if tr == 0 and tc == 0: self.castling['q'] = False
        if tr == 0 and tc == 7: self.castling['k'] = False

        self.turn = 'b' if self.turn == 'w' else 'w'
        self.history.append(snapshot)

    def undo_move(self):
        if not self.history:
            return
        snapshot = self.history.pop()
        move = snapshot['move']
        fr, fc = move['from']
        tr, tc = move['to']
        moving_piece = snapshot['moving_piece']
        captured = snapshot['captured_piece']

        self.grid[fr][fc] = moving_piece
        self.grid[tr][tc] = '.'

        if move.get('castle') == 'K':
            self.grid[7][7] = self.grid[7][5]
            self.grid[7][5] = '.'
        elif move.get('castle') == 'Q':
            self.grid[7][0] = self.grid[7][3]
            self.grid[7][3] = '.'
        elif move.get('castle') == 'k':
            self.grid[0][7] = self.grid[0][5]
            self.grid[0][5] = '.'
        elif move.get('castle') == 'q':
            self.grid[0][0] = self.grid[0][3]
            self.grid[0][3] = '.'
        elif move.get('ep'):
            pawn_r = tr + 1 if moving_piece == 'P' else tr - 1
            self.grid[pawn_r][tc] = captured
        elif captured:
            self.grid[tr][tc] = captured

        self.castling = snapshot['castling']
        self.en_passant = snapshot['en_passant']
        self.halfmove_clock = snapshot['halfmove_clock']
        self.fullmove_number = snapshot['fullmove_number']
        self.turn = 'b' if self.turn == 'w' else 'w'

    def get_legal_moves(self, captures_only=False):
        pseudo = self.generate_pseudo_legal_moves(captures_only)
        legal = []
        cur_turn = self.turn
        for m in pseudo:
            self.make_move(m)
            if not self.in_check(cur_turn):
                legal.append(m)
            self.undo_move()
        return legal

    def evaluate(self):
        white_val = 0
        black_val = 0

        for r in range(8):
            for c in range(8):
                p = self.grid[r][c]
                if p == '.':
                    continue

                p_low = p.lower()
                base = PIECE_VALUES[p]
                pst = PST_MAP.get(p_low)

                pst_r = r if p.isupper() else (7 - r)
                pst_val = pst[pst_r * 8 + c] if pst else 0

                val = base + pst_val
                if p.isupper():
                    white_val += val
                else:
                    black_val += val

        return white_val - black_val

    def move_to_uci(self, move):
        s1 = coord_to_square(move['from'][0], move['from'][1])
        s2 = coord_to_square(move['to'][0], move['to'][1])
        promo = move.get('promo', '') or ''
        return s1 + s2 + promo.lower()

    def print_board(self, flipped=False):
        print("\n    a   b   c   d   e   f   g   h")
        print("  ┌───┬───┬───┬───┬───┬───┬───┬───┐")
        ranks = range(7, -1, -1) if not flipped else range(8)
        files = range(8) if not flipped else range(7, -1, -1)

        for r in (range(8) if not flipped else range(7, -1, -1)):
            rank_label = str(8 - r)
            row_str = f"{rank_label} │"
            for c in files:
                piece = self.grid[r][c]
                glyph = UNICODE_PIECES.get(piece, piece)
                # ANSI styling
                if piece.isupper():
                    colored_glyph = f"\033[1;37m{glyph}\033[0m"
                elif piece.islower():
                    colored_glyph = f"\033[1;34m{glyph}\033[0m"
                else:
                    colored_glyph = "\033[90m·\033[0m"
                row_str += f" {colored_glyph} │"
            print(row_str + f" {rank_label}")
            if (r < 7 if not flipped else r > 0):
                print("  ├───┼───┼───┼───┼───┼───┼───┼───┤")
        print("  └───┴───┴───┴───┴───┴───┴───┴───┘")
        print("    a   b   c   d   e   f   g   h\n")


class Bot:
    def __init__(self, depth=3):
        self.depth = depth
        self.nodes = 0

    def find_best_move(self, board):
        self.nodes = 0
        legal = board.get_legal_moves()
        if not legal:
            return None

        is_w = board.turn == 'w'
        best_move = legal[0]
        alpha = -999999
        beta = 999999

        # Order moves: captures first
        ordered = sorted(legal, key=lambda m: (1 if m.get('captured') else 0), reverse=True)

        if is_w:
            max_eval = -999999
            for m in ordered:
                board.make_move(m)
                val = self.minimax(board, self.depth - 1, alpha, beta, False)
                board.undo_move()
                if val > max_eval:
                    max_eval = val
                    best_move = m
                alpha = max(alpha, val)
                if beta <= alpha:
                    break
        else:
            min_eval = 999999
            for m in ordered:
                board.make_move(m)
                val = self.minimax(board, self.depth - 1, alpha, beta, True)
                board.undo_move()
                if val < min_eval:
                    min_eval = val
                    best_move = m
                beta = min(beta, val)
                if beta <= alpha:
                    break

        return best_move

    def minimax(self, board, depth, alpha, beta, is_max):
        self.nodes += 1
        if depth == 0:
            return board.evaluate()

        legal = board.get_legal_moves()
        if not legal:
            if board.in_check():
                return -20000 - depth if is_max else 20000 + depth
            return 0  # Stalemate

        ordered = sorted(legal, key=lambda m: (1 if m.get('captured') else 0), reverse=True)

        if is_max:
            max_val = -999999
            for m in ordered:
                board.make_move(m)
                val = self.minimax(board, depth - 1, alpha, beta, False)
                board.undo_move()
                max_val = max(max_val, val)
                alpha = max(alpha, val)
                if beta <= alpha:
                    break
            return max_val
        else:
            min_val = 999999
            for m in ordered:
                board.make_move(m)
                val = self.minimax(board, depth - 1, alpha, beta, True)
                board.undo_move()
                min_val = min(min_val, val)
                beta = min(beta, val)
                if beta <= alpha:
                    break
            return min_val


def safe_input(prompt, default=""):
    try:
        val = input(prompt).strip()
        return val if val else default
    except (EOFError, KeyboardInterrupt):
        print("\nExiting.")
        sys.exit(0)


def run_cli_game():
    print("=" * 55)
    print("       ♚  DEEP PAWN CHESS BOT (CLI EDITION)  ♚")
    print("=" * 55)

    board = Board()

    print("\nSelect Mode:")
    print("  1. Human (White) vs Bot (Black)")
    print("  2. Bot (White) vs Human (Black)")
    print("  3. Human vs Human")
    print("  4. Bot vs Bot (Spectate)")
    mode_choice = safe_input("Enter choice [1-4, default 1]: ", "1")

    if mode_choice == "2":
        human_color = 'b'
        bot_mode = True
    elif mode_choice == "3":
        human_color = 'both'
        bot_mode = False
    elif mode_choice == "4":
        human_color = 'none'
        bot_mode = True
    else:
        human_color = 'w'
        bot_mode = True

    depth = 3
    if bot_mode:
        print("\nSelect Bot Difficulty:")
        print("  1. Easy   (Depth 1)")
        print("  2. Medium (Depth 2)")
        print("  3. Hard   (Depth 3)")
        print("  4. Master (Depth 4)")
        d_choice = safe_input("Enter depth [1-4, default 3]: ", "3")
        depth = {'1': 1, '2': 2, '3': 3, '4': 4}.get(d_choice, 3)

    bot = Bot(depth=depth)

    print("\nCommands during game:")
    print("  - Move: e2e4, g1f3, e7e8q (for promotion)")
    print("  - 'moves' to see all legal moves")
    print("  - 'undo' to take back move")
    print("  - 'eval' to check score")
    print("  - 'quit' to exit")

    while True:
        board.print_board(flipped=(human_color == 'b'))

        legal_moves = board.get_legal_moves()
        if not legal_moves:
            if board.in_check():
                winner = "Black" if board.turn == 'w' else "White"
                print(f"\n Checkmate! {winner} wins!")
            else:
                print("\n Stalemate! The game is drawn.")
            break

        turn_str = "White (♔)" if board.turn == 'w' else "Black (♚)"
        is_human = (human_color == 'both') or (human_color == board.turn)

        if is_human:
            user_input = safe_input(f"{turn_str} to move > ", "quit").lower()

            if user_input in ('quit', 'exit', 'q'):
                print("Game ended.")
                break
            elif user_input == 'undo':
                board.undo_move()
                if bot_mode and human_color in ('w', 'b'):
                    board.undo_move()
                continue
            elif user_input == 'moves':
                print("Legal moves:", ", ".join(board.move_to_uci(m) for m in legal_moves))
                continue
            elif user_input == 'eval':
                score = board.evaluate() / 100.0
                print(f"Current Evaluation: {score:+.2f}")
                continue

            # Parse user move (e.g. e2e4 or e7e8q)
            chosen_move = None
            for m in legal_moves:
                if board.move_to_uci(m) == user_input:
                    chosen_move = m
                    break

            if not chosen_move:
                print(" Invalid move! Type 'moves' to see options or enter UCI like 'e2e4'.")
                continue

            board.make_move(chosen_move)
        else:
            print(f"{turn_str} (Bot) is calculating (Depth {depth})...")
            start_t = time.time()
            best_m = bot.find_best_move(board)
            elapsed = time.time() - start_t

            if not best_m:
                print("No moves available.")
                break

            uci_str = board.move_to_uci(best_m)
            print(f"Bot played: {uci_str} ({bot.nodes} nodes in {elapsed:.2f}s)")
            board.make_move(best_m)
            time.sleep(0.3)


if __name__ == '__main__':
    run_cli_game()
