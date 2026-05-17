import { validateSyntax } from "./l1-syntax.js";
import { validateSchema } from "./l2-schema.js";
import { validateSemantic } from "./l3-semantic.js";
import { validatePolicy } from "./l4-policy.js";
import type { TaskScript, ValidationResult } from "../types/index.js";

/**
 * Runs L1→L4 validation in order; stops at the first failing layer (fail-fast).
 * L5 (dry-run) is intentionally excluded here — it runs asynchronously after task creation.
 */
export async function runValidationPipeline(rawInput: string): Promise<ValidationResult> {
  // L1: syntax
  const syntaxResult = validateSyntax(rawInput);
  if (!syntaxResult.ok) return syntaxResult.error;

  // L2: schema
  const schemaResult = validateSchema(syntaxResult.parsed);
  if (!schemaResult.ok) return schemaResult.error;

  // Cast is safe: AJV validated against our JSON Schema
  const script = schemaResult.validated as unknown as TaskScript;

  // L3: semantic
  const semanticResult = validateSemantic(script);
  if (!semanticResult.ok) return semanticResult.error;

  // L4: policy
  const policyResult = validatePolicy(script);
  if (!policyResult.ok) return policyResult.error;

  return {
    status: "accepted",
    phase: "policy_validation",
    taskId: null,
    errors: [],
  };
}
