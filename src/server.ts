import { Database } from "bun:sqlite";

const db = new Database("todos.sqlite", { create: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at TEXT
  );
`);

export function startServer(port: number) {
  const server = Bun.serve({
    port,
    fetch(req) {
      if (req.method === "GET" && new URL(req.url).pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
        });
      }

      return new Response("Todo backend running", { status: 200 });
    },
  });

  console.log(`Server listening on http://localhost:${server.port}`);
  return server;
}

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? 3000);
  startServer(port);
}
