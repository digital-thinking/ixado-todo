import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { rmSync } from "node:fs";
import { join } from "node:path";

const testDbPath = join(
  process.cwd(),
  `.todos-api-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
);

Bun.env.TODO_DB_PATH = testDbPath;

let server: Bun.Server;
let db: Database;
let baseUrl = "";

beforeAll(async () => {
  const { startServer } = await import("../src/server");
  server = startServer(0);
  baseUrl = `http://127.0.0.1:${server.port}`;
  db = new Database(testDbPath, { create: true });
});

beforeEach(() => {
  db.exec("DELETE FROM todos;");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'todos';");
});

afterAll(() => {
  server.stop(true);
  db.close();
  rmSync(testDbPath, { force: true });
});

async function createTodo(title: string) {
  return fetch(`${baseUrl}/todos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

describe("Todos API", () => {
  test("create todo", async () => {
    const res = await createTodo("write tests");
    const body = (await res.json()) as {
      id: number;
      title: string;
      done: boolean;
      created_at: string;
    };

    expect(res.status).toBe(201);
    expect(body.id).toBe(1);
    expect(body.title).toBe("write tests");
    expect(body.done).toBe(false);
    expect(typeof body.created_at).toBe("string");
  });

  test("list todos", async () => {
    await createTodo("first");
    await createTodo("second");

    const res = await fetch(`${baseUrl}/todos`);
    const body = (await res.json()) as Array<{ title: string }>;

    expect(res.status).toBe(200);
    expect(body.length).toBe(2);
    expect(body.map((todo) => todo.title)).toEqual(["first", "second"]);
  });

  test("update done status", async () => {
    await createTodo("toggle me");

    const res = await fetch(`${baseUrl}/todos/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    const body = (await res.json()) as { done: boolean };

    expect(res.status).toBe(200);
    expect(body.done).toBe(true);
  });

  test("update title", async () => {
    await createTodo("old title");

    const res = await fetch(`${baseUrl}/todos/1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "new title" }),
    });
    const body = (await res.json()) as { title: string };

    expect(res.status).toBe(200);
    expect(body.title).toBe("new title");
  });

  test("delete todo", async () => {
    await createTodo("to delete");

    const delRes = await fetch(`${baseUrl}/todos/1`, { method: "DELETE" });
    const delBody = (await delRes.json()) as { deleted: boolean };
    expect(delRes.status).toBe(200);
    expect(delBody.deleted).toBe(true);

    const listRes = await fetch(`${baseUrl}/todos`);
    const listBody = (await listRes.json()) as unknown[];
    expect(listBody.length).toBe(0);
  });

  test("404 on missing id", async () => {
    const patchRes = await fetch(`${baseUrl}/todos/999`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    const patchBody = (await patchRes.json()) as { error: string };

    expect(patchRes.status).toBe(404);
    expect(patchBody.error).toBe("Todo not found");

    const deleteRes = await fetch(`${baseUrl}/todos/999`, {
      method: "DELETE",
    });
    const deleteBody = (await deleteRes.json()) as { error: string };

    expect(deleteRes.status).toBe(404);
    expect(deleteBody.error).toBe("Todo not found");
  });

  test("400 on bad input", async () => {
    const createRes = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "  " }),
    });
    const createBody = (await createRes.json()) as { error: string };
    expect(createRes.status).toBe(400);
    expect(createBody.error).toBe("Field 'title' is required");

    const patchRes = await fetch(`${baseUrl}/todos/not-a-number`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    const patchBody = (await patchRes.json()) as { error: string };
    expect(patchRes.status).toBe(400);
    expect(patchBody.error).toBe("Invalid todo id");
  });
});
