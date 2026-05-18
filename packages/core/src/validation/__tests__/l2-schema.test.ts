import { describe, it, expect } from "vitest";
import { validateSchema } from "../l2-schema.js";

const VALID_SCRIPT = {
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

describe("L2: schema validation", () => {
  it("accepts a valid script object", () => {
    const result = validateSchema(VALID_SCRIPT);
    expect(result.ok).toBe(true);
  });

  it("rejects missing required field (spec.provider)", () => {
    const { provider: _p, ...specWithoutProvider } = VALID_SCRIPT.spec;
    const script = { ...VALID_SCRIPT, spec: specWithoutProvider };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe("schema_validation");
      const err = result.error.errors.find((e) => e.field.includes("provider"));
      expect(err).toBeDefined();
      expect(err?.code).toBe("E1002");
    }
  });

  it("rejects invalid provider value (enum violation)", () => {
    const script = { ...VALID_SCRIPT, spec: { ...VALID_SCRIPT.spec, provider: "aws-east" } };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error.errors[0];
      expect(err?.code).toBe("E1003");
      expect(err?.field).toContain("provider");
      expect(err?.received).toBe("aws-east");
      expect(err?.suggestion).toBeTruthy();
    }
  });

  it("rejects invalid environment value", () => {
    const script = {
      ...VALID_SCRIPT,
      spec: { ...VALID_SCRIPT.spec, environment: "test" },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown top-level field (additionalProperties)", () => {
    const script = { ...VALID_SCRIPT, unknownField: "oops" };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors[0]?.code).toBe("E1004");
    }
  });

  it("rejects unknown spec field", () => {
    const script = { ...VALID_SCRIPT, spec: { ...VALID_SCRIPT.spec, unknownSpec: true } };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("rejects wrong type (dryRun as string instead of boolean)", () => {
    const script = { ...VALID_SCRIPT, spec: { ...VALID_SCRIPT.spec, dryRun: "false" } };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error.errors[0];
      expect(err?.code).toBe("E1005");
      expect(err?.field).toContain("dryRun");
    }
  });

  it("rejects replicas out of range (> 20)", () => {
    const script = {
      ...VALID_SCRIPT,
      spec: {
        ...VALID_SCRIPT.spec,
        resources: [{ type: "container_service", name: "web-api", replicas: 999 }],
      },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("rejects replicas out of range (< 1)", () => {
    const script = {
      ...VALID_SCRIPT,
      spec: {
        ...VALID_SCRIPT.spec,
        resources: [{ type: "container_service", name: "web-api", replicas: 0 }],
      },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid resource type", () => {
    const script = {
      ...VALID_SCRIPT,
      spec: {
        ...VALID_SCRIPT.spec,
        resources: [{ type: "virtual_machine", name: "vm-1" }],
      },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("rejects alert threshold out of range (> 100)", () => {
    const script = {
      ...VALID_SCRIPT,
      spec: {
        ...VALID_SCRIPT.spec,
        monitoring: {
          alerts: [{ metric: "cpu_utilization", threshold: 150, window: "5m" }],
        },
      },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
  });

  it("includes received value and suggestion in error", () => {
    const script = { ...VALID_SCRIPT, spec: { ...VALID_SCRIPT.spec, provider: "gke" } };
    const result = validateSchema(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error.errors.find((e) => e.field.includes("provider"));
      expect(err?.received).toBe("gke");
      expect(typeof err?.suggestion).toBe("string");
    }
  });

  it("accepts optional fields (monitoring, constraints, labels)", () => {
    const script = {
      ...VALID_SCRIPT,
      metadata: { ...VALID_SCRIPT.metadata, labels: { team: "platform" } },
      spec: {
        ...VALID_SCRIPT.spec,
        monitoring: {
          alerts: [{ metric: "cpu_utilization", threshold: 80, window: "5m" }],
        },
        constraints: {
          maxMonthlyCostUsd: 500,
          allowedResourceTypes: ["container_service"],
        },
      },
    };
    const result = validateSchema(script);
    expect(result.ok).toBe(true);
  });
});
