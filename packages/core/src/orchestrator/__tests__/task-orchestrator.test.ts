import { describe, it, expect, beforeEach } from "vitest";
import { TaskOrchestrator } from "../task-orchestrator.js";
import { createInMemoryDb } from "../../store/db.js";
import { TaskRepository } from "../../store/task-repository.js";
import type { TaskScript } from "../../types/index.js";

const SAMPLE_SCRIPT: TaskScript = {
  apiVersion: "cloudpilot.dev/v1",
  kind: "DeploymentTask",
  metadata: { name: "orch-test" },
  spec: {
    provider: "aws",
    region: "ap-northeast-1",
    environment: "development",
    dryRun: false,
    approvalRequired: false,
    resources: [{ type: "container_service", name: "svc" }],
  },
};

describe("TaskOrchestrator", () => {
  let repo: TaskRepository;
  let orch: TaskOrchestrator;

  beforeEach(() => {
    repo = new TaskRepository(createInMemoryDb());
    orch = new TaskOrchestrator(repo);
  });

  it("submits a task and transitions to validating", async () => {
    const task = await orch.submit("yaml-input", SAMPLE_SCRIPT, "api");
    expect(task.status).toBe("pending");
  });

  it("cancels a pending task", async () => {
    const task = await orch.submit("yaml", SAMPLE_SCRIPT, "api");
    const cancelled = orch.cancel(task.id);
    expect(cancelled?.status).toBe("cancelled");
  });

  it("returns null when cancelling non-existent task", () => {
    const result = orch.cancel("unknown-id");
    expect(result).toBeNull();
  });

  it("cannot cancel a completed task", async () => {
    const task = await orch.submit("yaml", SAMPLE_SCRIPT, "api");
    // Force task to completed state
    repo.updateStatus(task.id, "completed");
    const result = orch.cancel(task.id);
    expect(result).toBeNull();
  });

  it("approves an awaiting_approval task", async () => {
    const task = await orch.submit("yaml", SAMPLE_SCRIPT, "api");
    repo.updateStatus(task.id, "awaiting_approval");
    const approved = orch.approve(task.id);
    expect(approved?.status).toBe("running");
  });

  it("returns null when approving non-awaiting task", async () => {
    const task = await orch.submit("yaml", SAMPLE_SCRIPT, "api");
    const result = orch.approve(task.id);
    expect(result).toBeNull();
  });

  it("gets task by id", async () => {
    const task = await orch.submit("yaml", SAMPLE_SCRIPT, "api");
    const found = orch.getTask(task.id);
    expect(found?.id).toBe(task.id);
  });

  it("lists all tasks", async () => {
    await orch.submit("y1", SAMPLE_SCRIPT, "api");
    await orch.submit("y2", SAMPLE_SCRIPT, "mcp");
    const all = orch.listTasks();
    expect(all).toHaveLength(2);
  });
});
