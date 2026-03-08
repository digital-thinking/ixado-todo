import { Database } from "bun:sqlite";

const dbPath = Bun.env.TODO_DB_PATH ?? "todos.sqlite";
const db = new Database(dbPath, { create: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at TEXT
  );
`);

type TodoRow = {
  id: number;
  title: string;
  done: number;
  created_at: string | null;
};

function toTodo(todo: TodoRow) {
  return {
    id: todo.id,
    title: todo.title,
    done: Boolean(todo.done),
    created_at: todo.created_at,
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(message: string) {
  return json({ error: message }, 400);
}

function notFound(message: string) {
  return json({ error: message }, 404);
}

function internalServerError() {
  return json({ error: "Internal server error" }, 500);
}

function parseTodoId(pathname: string): number | null {
  const match = pathname.match(/^\/todos\/([1-9]\d*)$/);
  if (!match) return null;

  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  return id;
}

export function startServer(port: number) {
  const server = Bun.serve({
    port,
    async fetch(req) {
      try {
        const pathname = new URL(req.url).pathname.replace(/\/+$/, "") || "/";

        if (req.method === "GET" && pathname === "/health") {
          return json({ status: "ok" });
        }

        if (req.method === "GET" && pathname === "/todos") {
          const rows = db
            .query("SELECT id, title, done, created_at FROM todos ORDER BY id ASC")
            .all() as TodoRow[];
          return json(rows.map(toTodo));
        }

        if (req.method === "POST" && pathname === "/todos") {
          let body: unknown;
          try {
            body = await req.json();
          } catch {
            return badRequest("Invalid JSON body");
          }

          if (!body || typeof body !== "object") {
            return badRequest("Body must be an object");
          }

          const titleValue = (body as { title?: unknown }).title;
          if (typeof titleValue !== "string" || titleValue.trim().length === 0) {
            return badRequest("Field 'title' is required");
          }

          const title = titleValue.trim();
          const createdAt = new Date().toISOString();

          const result = db
            .query("INSERT INTO todos (title, done, created_at) VALUES (?, 0, ?)")
            .run(title, createdAt);
          const id = Number(result.lastInsertRowid);
          const todo = db
            .query("SELECT id, title, done, created_at FROM todos WHERE id = ?")
            .get(id) as TodoRow | null;

          if (!todo) {
            throw new Error("Failed to read created todo");
          }

          return json(toTodo(todo), 201);
        }

        if (req.method === "PATCH" && pathname.startsWith("/todos/")) {
          const id = parseTodoId(pathname);
          if (id === null) {
            return badRequest("Invalid todo id");
          }

          let body: unknown;
          try {
            body = await req.json();
          } catch {
            return badRequest("Invalid JSON body");
          }

          if (!body || typeof body !== "object") {
            return badRequest("Body must be an object");
          }

          const maybeBody = body as { title?: unknown; done?: unknown };
          const hasTitle = Object.prototype.hasOwnProperty.call(maybeBody, "title");
          const hasDone = Object.prototype.hasOwnProperty.call(maybeBody, "done");

          if (!hasTitle && !hasDone) {
            return badRequest("Provide at least one field to update");
          }

          const updates: string[] = [];
          const values: (string | number)[] = [];

          if (hasTitle) {
            if (
              typeof maybeBody.title !== "string" ||
              maybeBody.title.trim().length === 0
            ) {
              return badRequest("Field 'title' must be a non-empty string");
            }
            updates.push("title = ?");
            values.push(maybeBody.title.trim());
          }

          if (hasDone) {
            if (typeof maybeBody.done !== "boolean") {
              return badRequest("Field 'done' must be a boolean");
            }
            updates.push("done = ?");
            values.push(maybeBody.done ? 1 : 0);
          }

          values.push(id);
          const result = db
            .query(`UPDATE todos SET ${updates.join(", ")} WHERE id = ?`)
            .run(...values);

          if (result.changes === 0) {
            return notFound("Todo not found");
          }

          const updated = db
            .query("SELECT id, title, done, created_at FROM todos WHERE id = ?")
            .get(id) as TodoRow | null;

          if (!updated) {
            throw new Error("Failed to read updated todo");
          }

          return json(toTodo(updated));
        }

        if (req.method === "DELETE" && pathname.startsWith("/todos/")) {
          const id = parseTodoId(pathname);
          if (id === null) {
            return badRequest("Invalid todo id");
          }

          const result = db.query("DELETE FROM todos WHERE id = ?").run(id);
          if (result.changes === 0) {
            return notFound("Todo not found");
          }

          return json({ deleted: true });
        }

        return notFound("Route not found");
      } catch (error) {
        console.error("Unhandled request error", error);
        return internalServerError();
      }
    },
  });

  console.log(`Server listening on http://localhost:${server.port}`);
  return server;
}

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? 3000);
  startServer(port);
}
