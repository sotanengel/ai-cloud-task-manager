import { describe, it, expect, vi, beforeEach } from "vitest";
import { AwsAdapter } from "../aws/aws-adapter.js";
import type { Task } from "@cloudpilot/core";

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: "task-001",
    status: "running",
    rawInput: "yaml",
    source: "api",
    createdAt: new Date(),
    updatedAt: new Date(),
    script: {
      apiVersion: "cloudpilot.dev/v1",
      kind: "DeploymentTask",
      metadata: { name: "test-deploy" },
      spec: {
        provider: "aws",
        region: "ap-northeast-1",
        environment: "development",
        dryRun: false,
        approvalRequired: false,
        resources: [{ type: "container_service", name: "web-api", replicas: 2 }],
      },
    },
    ...overrides,
  };
}

describe("AwsAdapter", () => {
  let adapter: AwsAdapter;

  beforeEach(() => {
    adapter = new AwsAdapter();
  });

  it("has provider = aws", () => {
    expect(adapter.provider).toBe("aws");
  });

  it("deploy returns success result (mocked)", async () => {
    const result = await adapter.deploy(makeTask());
    expect(result.success).toBe(true);
    expect(result.resourceIds).toBeInstanceOf(Array);
    expect(result.resourceIds.length).toBeGreaterThan(0);
  });

  it("diff returns addition entries", async () => {
    const result = await adapter.diff(makeTask());
    expect(result.additions).toBeInstanceOf(Array);
    expect(result.additions.length).toBeGreaterThan(0);
  });

  it("getStatus returns healthy status", async () => {
    const status = await adapter.getStatus("arn:aws:ecs:ap-northeast-1:123:service/web-api");
    expect(status.healthy).toBe(true);
    expect(typeof status.metrics["cpu_utilization"]).toBe("number");
  });

  it("destroy resolves without error", async () => {
    await expect(adapter.destroy(makeTask())).resolves.toBeUndefined();
  });
});
