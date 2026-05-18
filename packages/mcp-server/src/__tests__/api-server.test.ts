import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApiServer } from "../api/server.js";
import { createInMemoryDb, TaskRepository, TaskOrchestrator } from "@cloudpilot/core";

describe("Task API", () => {
  let app: ReturnType<typeof buildApiServer>;

  beforeAll(async () => {
    const db = createInMemoryDb();
    const repo = new TaskRepository(db);
    const orch = new TaskOrchestrator(repo);
    app = buildApiServer(orch);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe("ok");
  });

  it("GET /schema returns the JSON Schema", async () => {
    const res = await app.inject({ method: "GET", url: "/schema" });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ $schema?: string; title?: string }>();
    expect(body).toHaveProperty("title");
  });

  it("POST /tasks with valid YAML returns 202 accepted", async () => {
    const yaml = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: test-deploy
spec:
  provider: aws
  region: ap-northeast-1
  environment: development
  dryRun: false
  approvalRequired: false
  resources:
    - type: container_service
      name: web-api
`.trim();

    const res = await app.inject({
      method: "POST",
      url: "/tasks",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ script: yaml, source: "api" }),
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ taskId?: string; status?: string }>();
    expect(body.taskId).toBeTruthy();
    expect(body.status).toBe("accepted");
  });

  it("POST /tasks with invalid YAML returns 422 with structured error", async () => {
    const badScript = "not: yaml: valid: [";
    const res = await app.inject({
      method: "POST",
      url: "/tasks",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ script: badScript, source: "api" }),
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{ phase?: string; errors?: unknown[] }>();
    expect(body.phase).toBe("syntax_validation");
    expect(body.errors).toBeInstanceOf(Array);
    expect((body.errors?.length ?? 0)).toBeGreaterThan(0);
  });

  it("GET /tasks returns list", async () => {
    const res = await app.inject({ method: "GET", url: "/tasks" });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(body).toBeInstanceOf(Array);
  });

  it("GET /tasks/:id returns task details", async () => {
    // First create a task
    const yaml = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: detail-test
spec:
  provider: gcp
  region: asia-northeast1
  environment: development
  dryRun: false
  approvalRequired: false
  resources:
    - type: container_service
      name: svc
`.trim();

    const createRes = await app.inject({
      method: "POST",
      url: "/tasks",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ script: yaml, source: "api" }),
    });
    const { taskId } = createRes.json<{ taskId: string }>();

    const res = await app.inject({ method: "GET", url: `/tasks/${taskId}` });
    expect(res.statusCode).toBe(200);
    const task = res.json<{ id: string }>();
    expect(task.id).toBe(taskId);
  });

  it("GET /tasks/:id returns 404 for unknown id", async () => {
    const res = await app.inject({ method: "GET", url: "/tasks/nonexistent-id" });
    expect(res.statusCode).toBe(404);
  });
});
