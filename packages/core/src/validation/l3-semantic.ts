import type { TaskScript, ValidationResult } from "../types/index.js";
import { ErrorCodes } from "./errors/error-codes.js";

type SemanticOk = { ok: true };
type SemanticErr = { ok: false; error: ValidationResult };

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export function validateSemantic(script: TaskScript): SemanticOk | SemanticErr {
  const errors: ValidationResult["errors"] = [];

  // production 環境は approvalRequired=true が必須
  if (script.spec.environment === "production" && !script.spec.approvalRequired) {
    errors.push({
      code: ErrorCodes.E2003,
      field: "spec.approvalRequired",
      severity: "error",
      message: "approvalRequired must be true for production environment",
      received: false,
      suggestion: "spec.approvalRequired を true に設定してください。",
    });
  }

  // metadata.name の命名規則チェック（スキーマと重複するが意味的検証として）
  if (!NAME_PATTERN.test(script.metadata.name)) {
    errors.push({
      code: ErrorCodes.E2001,
      field: "metadata.name",
      severity: "error",
      message: `metadata.name must match pattern: lowercase alphanumeric and hyphens, 3-63 chars`,
      received: script.metadata.name,
      suggestion: "小文字英数字とハイフンのみ使用し、3〜63文字にしてください。",
    });
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: { status: "rejected", phase: "semantic_validation", taskId: null, errors },
    };
  }

  return { ok: true };
}
