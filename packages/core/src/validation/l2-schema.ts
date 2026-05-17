import { Ajv } from "ajv";
import type { ErrorObject } from "ajv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import type { ValidationError, ValidationResult } from "../types/index.js";
import { ErrorCodes } from "./errors/error-codes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "../../../../", "schemas", "task-script.v1.json");

// Our schema uses pattern/enum/range — no format keywords, so ajv-formats is not needed
const ajv = new Ajv({ allErrors: true, strict: false });

let _validate: ReturnType<typeof ajv.compile> | null = null;

function getValidator(): ReturnType<typeof ajv.compile> {
  if (!_validate) {
    const schemaText = readFileSync(SCHEMA_PATH, "utf-8");
    const schema = JSON.parse(schemaText) as object;
    _validate = ajv.compile(schema);
  }
  return _validate;
}

type SchemaOk = { ok: true; validated: Record<string, unknown> };
type SchemaErr = { ok: false; error: ValidationResult };

export function validateSchema(input: Record<string, unknown>): SchemaOk | SchemaErr {
  const validate = getValidator();
  const valid = validate(input);

  if (valid) {
    return { ok: true, validated: input };
  }

  const errors = (validate.errors ?? []).map(ajvErrorToValidationError.bind(null, input));

  return {
    ok: false,
    error: {
      status: "rejected",
      phase: "schema_validation",
      taskId: null,
      errors,
    },
  };
}

function ajvErrorToValidationError(
  input: Record<string, unknown>,
  err: ErrorObject,
): ValidationError {
  const field = normalizeField(err.instancePath || err.schemaPath);
  const received = getValueAtPath(input, err.instancePath);

  switch (err.keyword) {
    case "required":
      return {
        code: ErrorCodes.E1002,
        field: `${field}.${(err.params as { missingProperty: string }).missingProperty}`,
        severity: "error",
        message: `Required field is missing: ${(err.params as { missingProperty: string }).missingProperty}`,
        suggestion: `'${(err.params as { missingProperty: string }).missingProperty}' フィールドを追加してください。`,
      };

    case "enum": {
      const allowed = ((err.params as { allowedValues: unknown[] }).allowedValues as string[]).join(
        ", ",
      );
      return {
        code: ErrorCodes.E1003,
        field,
        severity: "error",
        message: `${field} must be one of [${allowed}]`,
        received,
        suggestion: `${field} に [${allowed}] のいずれかを指定してください。`,
      };
    }

    case "additionalProperties":
      return {
        code: ErrorCodes.E1004,
        field: `${field}.${(err.params as { additionalProperty: string }).additionalProperty}`,
        severity: "error",
        message: `Unknown field '${(err.params as { additionalProperty: string }).additionalProperty}' is not allowed`,
        received: (err.params as { additionalProperty: string }).additionalProperty,
        suggestion: `未定義のフィールド '${(err.params as { additionalProperty: string }).additionalProperty}' を削除してください。`,
      };

    case "type":
      return {
        code: ErrorCodes.E1005,
        field,
        severity: "error",
        message: `${field} must be of type ${(err.params as { type: string }).type}, got ${typeof received}`,
        received,
        suggestion: `${field} の型を ${(err.params as { type: string }).type} に修正してください。`,
      };

    case "minimum":
    case "maximum":
    case "exclusiveMinimum":
    case "exclusiveMaximum":
      return {
        code: ErrorCodes.E1007,
        field,
        severity: "error",
        message: err.message ?? `${field} is out of range`,
        received,
        suggestion: `${field} の値が許可された範囲内であることを確認してください。`,
      };

    default:
      return {
        code: ErrorCodes.E1006,
        field,
        severity: "error",
        message: err.message ?? `Validation failed at ${field}`,
        received,
      };
  }
}

function normalizeField(instancePath: string): string {
  if (!instancePath) return "(root)";
  return instancePath.replace(/^\//, "").replace(/\//g, ".");
}

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj;
  const parts = path.replace(/^\//, "").split("/");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
