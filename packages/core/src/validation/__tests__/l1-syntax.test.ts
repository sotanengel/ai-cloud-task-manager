import { describe, it, expect } from "vitest";
import { validateSyntax } from "../l1-syntax.js";

const VALID_YAML = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: deploy-web-api
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

const VALID_JSON = JSON.stringify({
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
});

describe("L1: syntax validation", () => {
  it("accepts valid YAML", () => {
    const result = validateSyntax(VALID_YAML);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed).toMatchObject({ apiVersion: "cloudpilot.dev/v1" });
    }
  });

  it("accepts valid JSON", () => {
    const result = validateSyntax(VALID_JSON);
    expect(result.ok).toBe(true);
  });

  it("rejects broken YAML (unbalanced indent)", () => {
    const broken = "key:\n  nested:\n invalid";
    const result = validateSyntax(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe("syntax_validation");
      expect(result.error.errors[0]?.code).toBe("E1001");
    }
  });

  it("rejects broken JSON", () => {
    const broken = '{"key": "value"';
    const result = validateSyntax(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe("syntax_validation");
    }
  });

  it("rejects empty input", () => {
    const result = validateSyntax("");
    expect(result.ok).toBe(false);
  });

  it("rejects non-object YAML (scalar)", () => {
    const result = validateSyntax("just a string");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe("syntax_validation");
    }
  });

  it("rejects non-object JSON (array)", () => {
    const result = validateSyntax("[1, 2, 3]");
    expect(result.ok).toBe(false);
  });
});
