import { describe, it, expect, beforeEach } from "vitest";
import { AzureAdapter } from "../azure/azure-adapter.js";
import type { Task } from "@cloudpilot/core";

function makeTask(): Task {
  return {
    id: "task-az-001",
    status: "running",
    rawInput: "yaml",
    source: "api",
    createdAt: new Date(),
    updatedAt: new Date(),
    script: {
      apiVersion: "cloudpilot.dev/v1",
      kind: "DeploymentTask",
      metadata: { name: "azure-deploy" },
      spec: {
        provider: "azure",
        region: "japaneast",
        environment: "development",
        dryRun: false,
        approvalRequired: false,
        resources: [{ type: "container_service", name: "container-app" }],
      },
    },
  };
}

describe("AzureAdapter", () => {
  let adapter: AzureAdapter;

  beforeEach(() => {
    adapter = new AzureAdapter();
  });

  it("has provider = azure", () => {
    expect(adapter.provider).toBe("azure");
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
    const status = await adapter.getStatus("/subscriptions/xxx/resourceGroups/rg/providers/app");
    expect(status.healthy).toBe(true);
  });

  it("destroy resolves", async () => {
    await expect(adapter.destroy(makeTask())).resolves.toBeUndefined();
  });
});
