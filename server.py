#!/usr/bin/env python3
"""
Simple local development server for THE PENGUIN: BEYOND THE DOOR
"""
import http.server
import socketserver
import os
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"============================================================")
        print(f" 🐧 THE PENGUIN: BEYOND THE DOOR is running!")
        print(f" Open your browser at: http://localhost:{PORT}")
        print(f" Press Ctrl+C to stop the server.")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer terminated.")

if __name__ == '__main__':
    main()
