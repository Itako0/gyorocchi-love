/**
 * いいね用 Cloudflare Worker（D1 = SQLite互換データベースに保存）
 *
 *   GET  /api/likes/<記事ID>  -> {"id": "...", "count": 12}
 *   POST /api/likes/<記事ID>  -> {"id": "...", "count": 13}   （1つ増やして新しい数を返す）
 *
 * 必要な設定（Cloudflareのダッシュボードで）
 *   1. D1データベースを作り、このWorkerに「DB」という名前でバインドする
 *   2. （任意）環境変数 ALLOWED_ORIGIN に、サイトのドメインを入れる
 *        例: https://itako0.github.io   ← 入れない場合はどのサイトからも呼べます
 */

const MAX_POSTS = 1000; // 記録する記事IDの上限（DBが肥大化しないように）
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
let tableReady = false;

async function ensureTable(env) {
  if (tableReady) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS likes (" +
    " post_id TEXT PRIMARY KEY," +
    " count INTEGER NOT NULL DEFAULT 0," +
    " updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
  ).run();
  tableReady = true;
}

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    };
    const json = (status, body) => new Response(JSON.stringify(body), { status, headers });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const m = new URL(request.url).pathname.match(/^\/api\/likes\/([^/]+)$/);
    let id = null;
    try { id = m ? decodeURIComponent(m[1]) : null; } catch (e) { id = null; }
    if (!id || !ID_RE.test(id)) return json(404, { error: "not found" });

    try {
      await ensureTable(env);

      if (request.method === "GET") {
        const row = await env.DB.prepare("SELECT count FROM likes WHERE post_id = ?").bind(id).first();
        return json(200, { id, count: row ? row.count : 0 });
      }

      if (request.method === "POST") {
        const exists = await env.DB.prepare("SELECT 1 AS x FROM likes WHERE post_id = ?").bind(id).first();
        if (!exists) {
          const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM likes").first();
          if (total && total.n >= MAX_POSTS) return json(400, { error: "too many posts" });
        }
        // 1回のSQLで「なければ作る／あれば+1」。同時に押されても数が狂わない
        const row = await env.DB.prepare(
          "INSERT INTO likes (post_id, count) VALUES (?, 1) " +
          "ON CONFLICT(post_id) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP " +
          "RETURNING count"
        ).bind(id).first();
        return json(200, { id, count: row.count });
      }

      return json(405, { error: "method not allowed" });
    } catch (e) {
      return json(500, { error: "server error" });
    }
  },
};
