#!/usr/bin/env python3
"""
RL Chess - Reinforcement Learning Chess Agent in Python (TD-Learning / TD(lambda)).
Uses Temporal Difference learning with eligibility traces to optimize feature evaluation weights
through self-play and gameplay experience.

Usage:
  python rl_chess.py --train --episodes 100    # Train through self-play
  python rl_chess.py --play                    # Play interactive game against RL agent
  python rl_chess.py --stats                   # View current learned weights and stats
"""

import argparse
import json
import math
import os
import random
import sys
import time

from cli_chess import Board, coord_to_square, square_to_coord

# Baseline / default trained weights
DEFAULT_WEIGHTS = {
    "pawn": 100.0,
    "knight": 318.0,
    "bishop": 334.0,
    "rook": 502.0,
    "queen": 915.0,
    "mobility": 6.2,
    "center_control": 18.5,
    "pawn_advance": 8.2,
    "king_shelter": 24.0,
    "bishop_pair": 48.0,
    "threats": 22.0
}

WEIGHT_BOUNDS = {
    "pawn": (50.0, 180.0),
    "knight": (200.0, 450.0),
    "bishop": (220.0, 480.0),
    "rook": (350.0, 700.0),
    "queen": (700.0, 1400.0),
    "mobility": (1.0, 25.0),
    "center_control": (5.0, 45.0),
    "pawn_advance": (1.0, 30.0),
    "king_shelter": (5.0, 50.0),
    "bishop_pair": (10.0, 90.0),
    "threats": (0.0, 50.0)
}

MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rl_model.json")


class RLChessAgent:
    def __init__(self, weights=None, gamma=0.98, lambda_param=0.7, alpha=0.04, epsilon=0.12):
        self.weights = dict(DEFAULT_WEIGHTS)
        if weights:
            self.weights.update(weights)
        self.gamma = gamma
        self.lambda_param = lambda_param
        self.alpha = alpha
        self.epsilon = epsilon
        self.episodes_trained = 0
        self.stats = {"wins_white": 0, "wins_black": 0, "draws": 0, "total_games": 0}
        self.load()

    def extract_features(self, board):
        p_w = p_b = 0
        n_w = n_b = 0
        b_w = b_b = 0
        r_w = r_b = 0
        q_w = q_b = 0

        white_pawn_ranks = 0
        black_pawn_ranks = 0
        white_center = 0
        black_center = 0
        white_king_pos = None
        black_king_pos = None

        for r in range(8):
            for c in range(8):
                p = board.grid[r][c]
                if p == '.':
                    continue

                is_center = (3 <= r <= 4 and 3 <= c <= 4)
                is_ext_center = (2 <= r <= 5 and 2 <= c <= 5)

                if p == 'P':
                    p_w += 1
                    white_pawn_ranks += (7 - r)
                    if is_center: white_center += 2
                    elif is_ext_center: white_center += 1
                elif p == 'p':
                    p_b += 1
                    black_pawn_ranks += r
                    if is_center: black_center += 2
                    elif is_ext_center: black_center += 1
                elif p == 'N':
                    n_w += 1
                    if is_center: white_center += 2
                    elif is_ext_center: white_center += 1
                elif p == 'n':
                    n_b += 1
                    if is_center: black_center += 2
                    elif is_ext_center: black_center += 1
                elif p == 'B':
                    b_w += 1
                    if is_center: white_center += 2
                elif p == 'b':
                    b_b += 1
                    if is_center: black_center += 2
                elif p == 'R': r_w += 1
                elif p == 'r': r_b += 1
                elif p == 'Q': q_w += 1
                elif p == 'q': q_b += 1
                elif p == 'K': white_king_pos = (r, c)
                elif p == 'k': black_king_pos = (r, c)

        # King shelter pawns
        white_shelter = 0
        if white_king_pos:
            kr, kc = white_king_pos
            for dc in (-1, 0, 1):
                col = kc + dc
                if 0 <= col < 8:
                    for dr in (1, 2):
                        row = kr - dr
                        if 0 <= row < 8 and board.grid[row][col] == 'P':
                            white_shelter += 1

        black_shelter = 0
        if black_king_pos:
            kr, kc = black_king_pos
            for dc in (-1, 0, 1):
                col = kc + dc
                if 0 <= col < 8:
                    for dr in (1, 2):
                        row = kr + dr
                        if 0 <= row < 8 and board.grid[row][col] == 'p':
                            black_shelter += 1

        legal_count = len(board.get_legal_moves())
        mobility = (legal_count if board.turn == 'w' else -legal_count) * 0.1

        return {
            "pawn": p_w - p_b,
            "knight": n_w - n_b,
            "bishop": b_w - b_b,
            "rook": r_w - r_b,
            "queen": q_w - q_b,
            "mobility": mobility,
            "center_control": white_center - black_center,
            "pawn_advance": (white_pawn_ranks - black_pawn_ranks) * 0.1,
            "king_shelter": white_shelter - black_shelter,
            "bishop_pair": (1 if b_w >= 2 else 0) - (1 if b_b >= 2 else 0),
            "threats": 0.0
        }

    def evaluate(self, board):
        phi = self.extract_features(board)
        return sum(self.weights.get(k, 0.0) * phi.get(k, 0.0) for k in self.weights)

    def select_action(self, board, explore=False):
        legal = board.get_legal_moves()
        if not legal:
            return None
        if len(legal) == 1:
            return legal[0]

        if explore and random.random() < self.epsilon:
            return random.choice(legal)

        is_w = board.turn == 'w'
        best_move = legal[0]
        best_score = -float('inf') if is_w else float('inf')

        for m in legal:
            board.make_move(m)
            score = self.evaluate(board)
            board.undo_move()

            if is_w:
                if score > best_score:
                    best_score = score
                    best_move = m
            else:
                if score < best_score:
                    best_score = score
                    best_move = m

        return best_move

    def update_from_trajectory(self, trajectory, reward):
        if not trajectory:
            return

        T = len(trajectory)
        eligibility = {k: 0.0 for k in self.weights}

        for t in range(T):
            phi_t = trajectory[t]
            v_t = sum(self.weights[k] * phi_t.get(k, 0.0) for k in self.weights)

            if t == T - 1:
                target = reward * 1000.0
            else:
                phi_next = trajectory[t + 1]
                v_next = sum(self.weights[k] * phi_next.get(k, 0.0) for k in self.weights)
                target = self.gamma * v_next

            delta = target - v_t

            for k in self.weights:
                eligibility[k] = self.gamma * self.lambda_param * eligibility[k] + phi_t.get(k, 0.0)
                update = self.alpha * delta * (eligibility[k] / 1000.0)
                self.weights[k] += update

        self.clamp_weights()
        self.episodes_trained += 1
        self.save()

    def clamp_weights(self):
        for k, (low, high) in WEIGHT_BOUNDS.items():
            if k in self.weights:
                self.weights[k] = max(low, min(high, self.weights[k]))

    def train_self_play(self, num_games=50, verbose=True):
        if verbose:
            print("=" * 65)
            print(f"  🧠 TRAINING NEUROPAWN RL AGENT ({num_games} Self-Play Episodes)")
            print("=" * 65)

        start_time = time.time()
        for i in range(1, num_games + 1):
            board = Board()
            trajectory = []
            moves_count = 0
            max_moves = 100

            while moves_count < max_moves:
                legal = board.get_legal_moves()
                if not legal:
                    break

                trajectory.append(self.extract_features(board))
                move = self.select_action(board, explore=True)
                if not move:
                    break
                board.make_move(move)
                moves_count += 1

            legal_final = board.get_legal_moves()
            reward = 0.0
            winner_str = "Draw"
            if not legal_final:
                if board.in_check():
                    winner = "b" if board.turn == "w" else "w"
                    reward = 1.0 if winner == "w" else -1.0
                    winner_str = f"White Won ({moves_count} moves)" if winner == "w" else f"Black Won ({moves_count} moves)"
                    if winner == "w": self.stats["wins_white"] += 1
                    else: self.stats["wins_black"] += 1
                else:
                    self.stats["draws"] += 1
            else:
                self.stats["draws"] += 1

            self.stats["total_games"] += 1
            self.update_from_trajectory(trajectory, reward)
            self.epsilon = max(0.04, self.epsilon * 0.998)

            if verbose and (i % 5 == 0 or i == num_games or i <= 3):
                elapsed = time.time() - start_time
                print(f"[{i:3d}/{num_games}] Result: {winner_str:<24} | Eps: {self.epsilon:.3f} | Pawn: {self.weights['pawn']:.1f} | Center: {self.weights['center_control']:.1f}")

        if verbose:
            print("-" * 65)
            print(f"Training Complete in {time.time() - start_time:.2f}s!")
            print(f"Total Trained Episodes: {self.episodes_trained}")
            print(f"Record: {self.stats['wins_white']}W (White) / {self.stats['wins_black']}W (Black) / {self.stats['draws']}D")
            self.print_weights()

    def print_weights(self):
        print("\n--- Current Learned Feature Weights ---")
        for k, v in self.weights.items():
            base = DEFAULT_WEIGHTS.get(k, v)
            diff = v - base
            print(f"  {k:<16}: {v:6.2f}  ({diff:+5.2f} from base)")
        print("-" * 40)

    def save(self, filepath=MODEL_FILE):
        try:
            data = {
                "weights": self.weights,
                "episodes_trained": self.episodes_trained,
                "stats": self.stats,
                "epsilon": self.epsilon
            }
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            pass

    def load(self, filepath=MODEL_FILE):
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "weights" in data:
                        self.weights.update(data["weights"])
                    self.episodes_trained = data.get("episodes_trained", 0)
                    self.stats = data.get("stats", self.stats)
                    self.epsilon = data.get("epsilon", self.epsilon)
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser(description="Deep Pawn Reinforcement Learning Agent")
    parser.add_argument("--train", action="store_true", help="Run self-play training")
    parser.add_argument("--episodes", type=int, default=50, help="Number of training episodes")
    parser.add_argument("--stats", action="store_true", help="Print current RL weights and stats")
    parser.add_argument("--play", action="store_true", help="Play interactively against RL agent")
    args = parser.parse_args()

    agent = RLChessAgent()

    if args.stats or (not args.train and not args.play):
        print("=" * 50)
        print("    🧠 DEEP PAWN REINFORCEMENT LEARNING AGENT")
        print("=" * 50)
        print(f"Episodes Trained: {agent.episodes_trained}")
        print(f"Exploration Epsilon: {agent.epsilon:.3f}")
        agent.print_weights()
        if not args.train and not args.play:
            print("Tip: Run 'python rl_chess.py --train --episodes 100' to train.")
            print("     Run 'python rl_chess.py --play' to challenge the RL agent.")
        return

    if args.train:
        agent.train_self_play(num_games=args.episodes)

    if args.play:
        print("\nStarting match against NeuroPawn RL Agent...")
        board = Board()
        print("You are playing White (♔). NeuroPawn is Black (♚).")

        while True:
            board.print_board()
            legal = board.get_legal_moves()
            if not legal:
                if board.in_check():
                    winner = "Black (NeuroPawn)" if board.turn == "w" else "White (You)"
                    print(f"\n Checkmate! {winner} wins!")
                else:
                    print("\n Stalemate! The game is drawn.")
                break

            if board.turn == 'w':
                user_m = input("Your move (e.g. e2e4) > ").strip().lower()
                if user_m in ('quit', 'exit', 'q'):
                    break
                chosen = next((m for m in legal if board.move_to_uci(m) == user_m), None)
                if not chosen:
                    print("Invalid move! Try again.")
                    continue
                board.make_move(chosen)
            else:
                print("NeuroPawn is choosing best move...")
                best_m = agent.select_action(board)
                if not best_m:
                    break
                print(f"NeuroPawn played: {board.move_to_uci(best_m)} (Eval: {agent.evaluate(board):+.1f})")
                board.make_move(best_m)


if __name__ == '__main__':
    main()
