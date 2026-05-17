import yaml from "js-yaml";
import type { ValidationResult } from "../types/index.js";
import { ErrorCodes } from "./errors/error-codes.js";

type SyntaxOk = { ok: true; parsed: Record<string, unknown> };
type SyntaxErr = { ok: false; error: ValidationResult };

export function validateSyntax(input: string): SyntaxOk | SyntaxErr {
  if (!input.trim()) {
    return fail("Input is empty");
  }

  // Try JSON first (detected by leading `{`)
  if (input.trimStart().startsWith("{") || input.trimStart().startsWith("[")) {
    return parseJson(input);
  }

  // Try YAML
  return parseYaml(input);
}

function parseJson(input: string): SyntaxOk | SyntaxErr {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input) as unknown;
  } catch (e) {
    return fail(`Invalid JSON: ${String(e)}`);
  }
  return assertObject(parsed);
}

function parseYaml(input: string): SyntaxOk | SyntaxErr {
  let parsed: unknown;
  try {
    parsed = yaml.load(input);
  } catch (e) {
    return fail(`Invalid YAML: ${String(e)}`);
  }
  return assertObject(parsed);
}

function assertObject(parsed: unknown): SyntaxOk | SyntaxErr {
  if (parsed === null || parsed === undefined) {
    return fail("Input parsed to null/undefined");
  }
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    return fail(`Expected an object, got ${Array.isArray(parsed) ? "array" : typeof parsed}`);
  }
  return { ok: true, parsed: parsed as Record<string, unknown> };
}

function fail(message: string): SyntaxErr {
  return {
    ok: false,
    error: {
      status: "rejected",
      phase: "syntax_validation",
      taskId: null,
      errors: [
        {
          code: ErrorCodes.E1001,
          field: "(input)",
          severity: "error",
          message,
          suggestion: "入力が有効なYAMLまたはJSONであることを確認してください。",
        },
      ],
    },
  };
}
