#!/usr/bin/env python3
"""startpage-chat bridge — lets the hosted site (startpage.sitedoillan.com.br)
reach local Ollama. Sits on 127.0.0.1, proxies /api/* to Ollama, and answers
Chrome's Private Network Access preflight (Access-Control-Allow-Private-Network).
Zero dependencies (stdlib only).

Run:  /usr/bin/python3 bridge.py
Listens on: 127.0.0.1:<PORT>   (default 11435)
"""
import http.server
import json
import os
import socketserver
import urllib.error
import urllib.request

OLLAMA = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
PORT = int(os.environ.get("BRIDGE_PORT", os.environ.get("PORT", "11435")))
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "BRIDGE_ALLOWED_ORIGINS",
        "https://startpage.sitedoillan.com.br,https://illanrego.github.io",
    ).split(",")
    if o.strip()
}

def cors_ok(origin, method=""):
    """Return origin to allow, or "" if not allowed."""
    if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
        return "*" if "*" in ALLOWED_ORIGINS else origin
    return ""

class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _origin(self):
        return self.headers.get("Origin", "")

    def _headers(self, origin, body_len, is_options=False):
        self.send_response(204 if is_options else 200)
        ao = cors_ok(origin)
        if ao:
            self.send_header("Access-Control-Allow-Origin", ao)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Authorization,Content-Type,User-Agent,Accept,X-Requested-With",
        )
        # The critical header for Chrome PNA (public https -> private 127.0.0.1).
        self.send_header("Access-Control-Allow-Private-Network", "true")
        if not is_options:
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(body_len))
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        return self.rfile.read(length) if length else b""

    def _dispatch(self):
        origin = self._origin()
        if not cors_ok(origin):
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if self.command == "OPTIONS":
            self._headers(origin, 0, is_options=True)
            return
        body = self._read_body()
        upstream = OLLAMA + self.path
        req = urllib.request.Request(
            upstream,
            data=body,
            method=self.command,
            headers={"Content-Type": self.headers.get("Content-Type", "application/json")},
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                out = resp.read()
        except urllib.error.HTTPError as e:
            out = e.read() or e.reason.encode()
        except Exception as e:  # noqa: BLE001
            out = json.dumps({"error": str(e)}).encode()
        self._headers(origin, len(out))
        self.wfile.write(out)

    def do_OPTIONS(self): self._dispatch()
    def do_GET(self): self._dispatch()
    def do_POST(self): self._dispatch()
    def do_PUT(self): self._dispatch()
    def do_PATCH(self): self._dispatch()
    def do_DELETE(self): self._dispatch()

    def log_message(self, fmt, *args):  # quiet, but keep a trace via stdout
        print(f"[bridge] {self.command} {self.path}", flush=True)

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"startpage-chat bridge on 127.0.0.1:{PORT} -> {OLLAMA}", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass