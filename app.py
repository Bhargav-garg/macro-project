#!/usr/bin/env python3
"""
Deep Pawn Web Launcher
Starts a local web server and automatically opens the chess game in your browser.
"""

import http.server
import os
import socket
import socketserver
import threading
import time
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Quiet logging
        pass


def find_available_port(start_port=8000):
    port = start_port
    while port < 9000:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
        port += 1
    return start_port


def start_server():
    port = find_available_port(PORT)
    url = f"http://localhost:{port}/index.html"

    print("=" * 60)
    print("       ♚  DEEP PAWN CHESS BOT - WEB LAUNCHER  ♚")
    print("=" * 60)
    print(f"\n Serving Chess App at: \033[1;32m{url}\033[0m")
    print(" Opening your web browser automatically...")
    print(" Press Ctrl+C in this terminal to stop the server.\n")

    # Open browser slightly after server bind
    def open_browser():
        time.sleep(0.5)
        webbrowser.open(url)

    threading.Thread(target=open_browser, daemon=True).start()

    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server. Thanks for playing!")


if __name__ == '__main__':
    start_server()
