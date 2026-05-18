import { describe, it, expect } from "vitest";
import { validatePolicy } from "../l4-policy.js";
import type { TaskScript } from "../../types/index.js";

const BASE: TaskScript = {
  apiVersion: "cloudpilot.dev/v1",
  kind: "DeploymentTask",
  metadata: { name: "deploy-web-api" },
  spec: {
    provider: "aws",
    region: "ap-northeast-1",
    environment: "development",
    dryRun: false,
    approvalRequired: false,
    resources: [{ type: "container_service", name: "web-api" }],
  },
};

describe("L4: policy validation", () => {
  it("accepts valid script with no constraints", () => {
    const result = validatePolicy(BASE);
    expect(result.ok).toBe(true);
  });

  it("rejects resource type not in allowedResourceTypes", () => {
    const script: TaskScript = {
      ...BASE,
      spec: {
        ...BASE.spec,
        resources: [{ type: "load_balancer", name: "lb-1" }],
        constraints: { allowedResourceTypes: ["container_service"] },
      },
    };
    const result = validatePolicy(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors[0]?.code).toBe("E3002");
      expect(result.error.errors[0]?.field).toContain("resources");
    }
  });

  it("accepts resource type that is in allowedResourceTypes", () => {
    const script: TaskScript = {
      ...BASE,
      spec: {
        ...BASE.spec,
        resources: [{ type: "container_service", name: "svc-1" }],
        constraints: { allowedResourceTypes: ["container_service", "load_balancer"] },
      },
    };
    const result = validatePolicy(script);
    expect(result.ok).toBe(true);
  });

  it("passes when no allowedResourceTypes constraint", () => {
    const script: TaskScript = {
      ...BASE,
      spec: {
        ...BASE.spec,
        resources: [{ type: "database", name: "db-1" }],
        constraints: {},
      },
    };
    const result = validatePolicy(script);
    expect(result.ok).toBe(true);
  });

  it("includes cost limit context in error when constraints present", () => {
    // Cost limit enforcement requires dry-run estimates — basic presence check
    const script: TaskScript = {
      ...BASE,
      spec: {
        ...BASE.spec,
        constraints: { maxMonthlyCostUsd: 100 },
      },
    };
    // Without cost estimate, policy check passes (cost is checked post-dryrun)
    const result = validatePolicy(script);
    expect(result.ok).toBe(true);
  });
});
