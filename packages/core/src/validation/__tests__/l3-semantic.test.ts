import { describe, it, expect } from "vitest";
import { validateSemantic } from "../l3-semantic.js";

const BASE = {
  apiVersion: "cloudpilot.dev/v1",
  kind: "DeploymentTask",
  metadata: { name: "deploy-web-api" },
  spec: {
    provider: "aws" as const,
    region: "ap-northeast-1",
    environment: "development" as const,
    dryRun: false,
    approvalRequired: false,
    resources: [{ type: "container_service" as const, name: "web-api" }],
  },
};

describe("L3: semantic validation", () => {
  it("accepts valid script", () => {
    const result = validateSemantic(BASE);
    expect(result.ok).toBe(true);
  });

  it("rejects production without approvalRequired=true", () => {
    const script = {
      ...BASE,
      spec: { ...BASE.spec, environment: "production" as const, approvalRequired: false },
    };
    const result = validateSemantic(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error.errors[0];
      expect(err?.code).toBe("E2003");
      expect(err?.field).toContain("approvalRequired");
    }
  });

  it("accepts production with approvalRequired=true", () => {
    const script = {
      ...BASE,
      spec: { ...BASE.spec, environment: "production" as const, approvalRequired: true },
    };
    const result = validateSemantic(script);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid metadata name (uppercase)", () => {
    const script = { ...BASE, metadata: { name: "Deploy-Web-API" } };
    const result = validateSemantic(script);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errors[0]?.code).toBe("E2001");
    }
  });

  it("rejects metadata name too short (< 3 chars)", () => {
    const script = { ...BASE, metadata: { name: "ab" } };
    const result = validateSemantic(script);
    expect(result.ok).toBe(false);
  });

  it("accepts staging without approvalRequired", () => {
    const script = {
      ...BASE,
      spec: { ...BASE.spec, environment: "staging" as const, approvalRequired: false },
    };
    const result = validateSemantic(script);
    expect(result.ok).toBe(true);
  });
});
