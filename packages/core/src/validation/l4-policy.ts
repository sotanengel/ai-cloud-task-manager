import type { TaskScript, ValidationResult, ResourceType } from "../types/index.js";
import { ErrorCodes } from "./errors/error-codes.js";

type PolicyOk = { ok: true };
type PolicyErr = { ok: false; error: ValidationResult };

export function validatePolicy(script: TaskScript): PolicyOk | PolicyErr {
  const errors: ValidationResult["errors"] = [];
  const constraints = script.spec.constraints;

  // リソース種別の許可リストチェック
  if (constraints?.allowedResourceTypes && constraints.allowedResourceTypes.length > 0) {
    const allowed = new Set<ResourceType>(constraints.allowedResourceTypes);
    for (const [i, resource] of script.spec.resources.entries()) {
      if (!allowed.has(resource.type)) {
        errors.push({
          code: ErrorCodes.E3002,
          field: `spec.resources[${i}].type`,
          severity: "error",
          message: `Resource type '${resource.type}' is not in allowedResourceTypes`,
          received: resource.type,
          suggestion: `許可されたリソース種別は [${constraints.allowedResourceTypes.join(", ")}] です。`,
        });
      }
    }
  }

  // コスト上限はドライラン結果が必要なため、ここでは設定値の存在確認のみ
  // 実際のコスト比較は L5 (dry-run) 後に行う

  if (errors.length > 0) {
    return {
      ok: false,
      error: { status: "rejected", phase: "policy_validation", taskId: null, errors },
    };
  }

  return { ok: true };
}
