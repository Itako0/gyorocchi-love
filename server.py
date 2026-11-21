#!/usr/bin/env python3
"""
いいね用の小さなAPIサーバー（SQLite保存）。標準ライブラリだけで動くので pip install 不要。

  起動:   python3 server.py
  既定:   http://0.0.0.0:8000   （環境変数 PORT で変更）
  DB:     likes.db              （環境変数 DB_PATH で場所を変更）
  CORS:   環境変数 ALLOWED_ORIGIN で許可するサイトを指定（例: https://itako0.github.io）

  GET  /api/likes/<記事ID>  -> {"id": "...", "count": 12}
  POST /api/likes/<記事ID>  -> {"id": "...", "count": 13}   （1つ増やして新しい数を返す）
"""
import json
import os
import re
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "likes.db"))
PORT = int(os.environ.get("PORT", "8000"))
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
MAX_POSTS = 1000          # DBが肥大化しないよう、記録する記事IDの上限
MIN_INTERVAL = 0.1        # 同じIPが同じ記事に連打できる間隔（秒）

ID_RE = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")
ROUTE_RE = re.compile(r"^/api/likes/([^/?]+)$")

_lock = threading.Lock()
_last = {}                # (ip, post_id) -> 最後に押された時刻


def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.execute(
        "CREATE TABLE IF NOT EXISTS likes ("
        " post_id TEXT PRIMARY KEY,"
        " count   INTEGER NOT NULL DEFAULT 0,"
        " updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    return con


def get_count(post_id):
    con = db()
    try:
        row = con.execute("SELECT count FROM likes WHERE post_id = ?", (post_id,)).fetchone()
        return row[0] if row else 0
    finally:
        con.close()


def add_like(post_id):
    """1つ増やして新しい数を返す。上限超えの新規IDは None。"""
    con = db()
    try:
        with con:  # トランザクション（同時に押されても数が狂わない）
            row = con.execute("SELECT count FROM likes WHERE post_id = ?", (post_id,)).fetchone()
            if row is None:
                total = con.execute("SELECT COUNT(*) FROM likes").fetchone()[0]
                if total >= MAX_POSTS:
                    return None
                con.execute("INSERT INTO likes (post_id, count) VALUES (?, 1)", (post_id,))
                return 1
            con.execute(
                "UPDATE likes SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?",
                (post_id,),
            )
            return row[0] + 1
    finally:
        con.close()


class Handler(BaseHTTPRequestHandler):
    server_version = "LikesAPI/1.0"

    def _send(self, status, body=None):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else b""
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        if body is not None:
            self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _post_id(self):
        m = ROUTE_RE.match(self.path)
        if not m or not ID_RE.match(m.group(1)):
            return None
        return m.group(1)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {"ok": True})
        pid = self._post_id()
        if not pid:
            return self._send(404, {"error": "not found"})
        self._send(200, {"id": pid, "count": get_count(pid)})

    def do_POST(self):
        pid = self._post_id()
        if not pid:
            return self._send(404, {"error": "not found"})
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        now = time.monotonic()
        with _lock:
            if now - _last.get((ip, pid), 0) < MIN_INTERVAL:
                return self._send(429, {"error": "too fast", "count": get_count(pid)})
            _last[(ip, pid)] = now
            if len(_last) > 5000:
                _last.clear()
        count = add_like(pid)
        if count is None:
            return self._send(400, {"error": "too many posts"})
        self._send(200, {"id": pid, "count": count})

    def log_message(self, fmt, *args):
        print("%s %s" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    db().close()  # 起動時にテーブルを作っておく
    print(f"Likes API: http://0.0.0.0:{PORT}  (DB: {DB_PATH})")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
