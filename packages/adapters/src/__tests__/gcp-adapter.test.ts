import { describe, it, expect, beforeEach } from "vitest";
import { GcpAdapter } from "../gcp/gcp-adapter.js";
import type { Task } from "@cloudpilot/core";

function makeTask(): Task {
  return {
    id: "task-gcp-001",
    status: "running",
    rawInput: "yaml",
    source: "api",
    createdAt: new Date(),
    updatedAt: new Date(),
    script: {
      apiVersion: "cloudpilot.dev/v1",
      kind: "DeploymentTask",
      metadata: { name: "gcp-deploy" },
      spec: {
        provider: "gcp",
        region: "asia-northeast1",
        environment: "development",
        dryRun: false,
        approvalRequired: false,
        resources: [{ type: "container_service", name: "cloud-run-svc" }],
      },
    },
  };
}

describe("GcpAdapter", () => {
  let adapter: GcpAdapter;

  beforeEach(() => {
    adapter = new GcpAdapter();
  });

  it("has provider = gcp", () => {
    expect(adapter.provider).toBe("gcp");
  });

  it("deploy returns success", async () => {
    const result = await adapter.deploy(makeTask());
    expect(result.success).toBe(true);
  });

  it("diff returns additions", async () => {
    const result = await adapter.diff(makeTask());
    expect(result.additions.length).toBeGreaterThan(0);
  });

  it("getStatus returns healthy", async () => {
    const status = await adapter.getStatus("projects/my-project/services/cloud-run-svc");
    expect(status.healthy).toBe(true);
  });

  it("destroy resolves", async () => {
    await expect(adapter.destroy(makeTask())).resolves.toBeUndefined();
  });
});
