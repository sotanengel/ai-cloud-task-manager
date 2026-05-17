import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createInMemoryDb } from "../db.js";
import { TaskRepository } from "../task-repository.js";
import type { Task, TaskScript } from "../../types/index.js";

const SAMPLE_SCRIPT: TaskScript = {
  apiVersion: "cloudpilot.dev/v1",
  kind: "DeploymentTask",
  metadata: { name: "test-deploy" },
  spec: {
    provider: "aws",
    region: "ap-northeast-1",
    environment: "development",
    dryRun: false,
    approvalRequired: false,
    resources: [{ type: "container_service", name: "svc" }],
  },
};

describe("TaskRepository", () => {
  let repo: TaskRepository;

  beforeEach(() => {
    const db = createInMemoryDb();
    repo = new TaskRepository(db);
  });

  afterEach(() => {
    // in-memory DB is GC'd automatically
  });

  it("creates a task and returns it with a unique id", () => {
    const task = repo.create({ script: SAMPLE_SCRIPT, rawInput: "yaml", source: "api" });
    expect(task.id).toBeTruthy();
    expect(task.status).toBe("pending");
    expect(task.source).toBe("api");
  });

  it("finds a task by id", () => {
    const created = repo.create({ script: SAMPLE_SCRIPT, rawInput: "yaml", source: "mcp" });
    const found = repo.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });

  it("returns null for unknown id", () => {
    const found = repo.findById("non-existent-id");
    expect(found).toBeNull();
  });

  it("lists all tasks", () => {
    repo.create({ script: SAMPLE_SCRIPT, rawInput: "y1", source: "api" });
    repo.create({ script: SAMPLE_SCRIPT, rawInput: "y2", source: "mcp" });
    const all = repo.findAll();
    expect(all).toHaveLength(2);
  });

  it("updates task status", () => {
    const task = repo.create({ script: SAMPLE_SCRIPT, rawInput: "yaml", source: "api" });
    const updated = repo.updateStatus(task.id, "running");
    expect(updated?.status).toBe("running");
  });

  it("appends to execution log", () => {
    const task = repo.create({ script: SAMPLE_SCRIPT, rawInput: "yaml", source: "api" });
    repo.appendLog(task.id, "starting deployment...");
    repo.appendLog(task.id, "deploying resource web-api");
    const found = repo.findById(task.id);
    expect(found?.executionLog).toContain("starting deployment...");
    expect(found?.executionLog).toContain("deploying resource web-api");
  });

  it("findAll returns tasks ordered by createdAt desc", async () => {
    const t1 = repo.create({ script: SAMPLE_SCRIPT, rawInput: "y1", source: "api" });
    // slight delay so timestamps differ
    await new Promise((r) => setTimeout(r, 5));
    const t2 = repo.create({ script: SAMPLE_SCRIPT, rawInput: "y2", source: "api" });
    const all = repo.findAll();
    // Most recent first
    const ids = all.map((t: Task) => t.id);
    expect(ids.indexOf(t2.id)).toBeLessThan(ids.indexOf(t1.id));
  });
});
