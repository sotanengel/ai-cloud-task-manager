// Error code strings — keys and values are identical so code can be used as both ID and label
export const ErrorCodes = {
  // L1: Syntax validation
  E1001: "E1001",

  // L2: Schema validation
  E1002: "E1002",
  E1003: "E1003",
  E1004: "E1004",
  E1005: "E1005",
  E1006: "E1006",
  E1007: "E1007",

  // L3: Semantic validation
  E2001: "E2001",
  E2002: "E2002",
  E2003: "E2003",

  // L4: Policy / security validation
  E3001: "E3001",
  E3002: "E3002",
  E3003: "E3003",
  E3004: "E3004",
  E3005: "E3005",

  // L5: Dry run
  E4001: "E4001",
  E4002: "E4002",
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  E1001: "Invalid YAML/JSON syntax",
  E1002: "Required field is missing",
  E1003: "Value is not in allowed enum",
  E1004: "Unknown field is not allowed",
  E1005: "Type mismatch",
  E1006: "Format is invalid",
  E1007: "Value is out of allowed range",
  E2001: "Name format is invalid",
  E2002: "Referenced resource not found",
  E2003: "Approval is required for production environment",
  E3001: "Provider is not in allowed list",
  E3002: "Resource type is not allowed",
  E3003: "Estimated cost exceeds maxMonthlyCostUsd",
  E3004: "Security policy violation detected",
  E3005: "Destructive operation requires human approval",
  E4001: "Dry run apply failed",
  E4002: "Insufficient permissions for this operation",
};

export const ERROR_SUGGESTIONS: Partial<Record<ErrorCode, string>> = {
  E1003: "列挙値の一覧を確認し、許可された値を指定してください。",
  E1004: "未定義のフィールドを削除してください。スキーマで定義されたフィールドのみ使用できます。",
  E1005: "フィールドの型を確認してください。",
  E2003: "production 環境では approvalRequired を true に設定してください。",
  E3001: "spec.provider に 'aws', 'gcp', 'azure' のいずれかを指定してください。",
  E3002: "spec.constraints.allowedResourceTypes で許可されたリソース種別のみ使用できます。",
  E3003: "spec.constraints.maxMonthlyCostUsd を超えないようリソース数・サイズを削減してください。",
};
