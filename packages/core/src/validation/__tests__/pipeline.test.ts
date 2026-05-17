import { describe, it, expect } from "vitest";
import { runValidationPipeline } from "../pipeline.js";

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

describe("Validation pipeline (L1→L4 fail-fast)", () => {
  it("accepts a valid script and returns accepted status", async () => {
    const result = await runValidationPipeline(VALID_YAML);
    expect(result.status).toBe("accepted");
    expect(result.errors).toHaveLength(0);
  });

  it("stops at L1 and returns syntax_validation phase on broken YAML", async () => {
    const result = await runValidationPipeline("key:\n  bad:\n  bad2: [unclosed");
    expect(result.status).toBe("rejected");
    expect(result.phase).toBe("syntax_validation");
    expect(result.errors[0]?.code).toBe("E1001");
  });

  it("stops at L2 on schema violation (missing required field)", async () => {
    const missingProvider = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: test-task
spec:
  region: ap-northeast-1
  environment: development
  dryRun: false
  approvalRequired: false
  resources:
    - type: container_service
      name: svc
`.trim();
    const result = await runValidationPipeline(missingProvider);
    expect(result.status).toBe("rejected");
    expect(result.phase).toBe("schema_validation");
  });

  it("stops at L3 on semantic violation (production without approval)", async () => {
    const yaml = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: test-task
spec:
  provider: aws
  region: ap-northeast-1
  environment: production
  dryRun: false
  approvalRequired: false
  resources:
    - type: container_service
      name: svc
`.trim();
    const result = await runValidationPipeline(yaml);
    expect(result.status).toBe("rejected");
    expect(result.phase).toBe("semantic_validation");
    expect(result.errors[0]?.code).toBe("E2003");
  });

  it("stops at L4 on policy violation (disallowed resource type)", async () => {
    const yaml = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: test-task
spec:
  provider: aws
  region: ap-northeast-1
  environment: development
  dryRun: false
  approvalRequired: false
  resources:
    - type: load_balancer
      name: lb-1
  constraints:
    allowedResourceTypes:
      - container_service
`.trim();
    const result = await runValidationPipeline(yaml);
    expect(result.status).toBe("rejected");
    expect(result.phase).toBe("policy_validation");
    expect(result.errors[0]?.code).toBe("E3002");
  });

  it("returns all errors from a layer (not just the first)", async () => {
    // Two missing required fields
    const yaml = `
apiVersion: cloudpilot.dev/v1
kind: DeploymentTask
metadata:
  name: test
spec:
  provider: aws
  region: ap-northeast-1
  dryRun: false
  resources:
    - type: container_service
      name: svc
`.trim();
    const result = await runValidationPipeline(yaml);
    expect(result.status).toBe("rejected");
    // "environment" and "approvalRequired" are both missing
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
