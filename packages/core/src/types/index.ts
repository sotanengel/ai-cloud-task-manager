// Core domain types — shared across all packages

export type CloudProvider = "aws" | "gcp" | "azure";
export type Environment = "development" | "staging" | "production";
export type ResourceType = "container_service" | "load_balancer" | "storage_bucket" | "database";

export type TaskStatus =
  | "pending"
  | "validating"
  | "awaiting_approval"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface TaskScript {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  spec: {
    provider: CloudProvider;
    region: string;
    environment: Environment;
    dryRun: boolean;
    approvalRequired: boolean;
    resources: ResourceSpec[];
    monitoring?: MonitoringSpec;
    constraints?: ConstraintsSpec;
  };
}

export interface ResourceSpec {
  type: ResourceType;
  name: string;
  image?: string;
  replicas?: number;
  cpu?: string;
  memory?: string;
}

export interface MonitoringSpec {
  alerts?: AlertSpec[];
}

export interface AlertSpec {
  metric: string;
  threshold: number;
  window: string;
}

export interface ConstraintsSpec {
  maxMonthlyCostUsd?: number;
  allowedResourceTypes?: ResourceType[];
}

export interface ValidationError {
  code: string;
  field: string;
  severity: "error" | "warning";
  message: string;
  received?: unknown;
  suggestion?: string;
}

export type ValidationPhase =
  | "syntax_validation"
  | "schema_validation"
  | "semantic_validation"
  | "policy_validation"
  | "dry_run";

export interface ValidationResult {
  status: "accepted" | "rejected";
  phase: ValidationPhase;
  taskId: string | null;
  errors: ValidationError[];
}

export interface Task {
  id: string;
  status: TaskStatus;
  script: TaskScript;
  rawInput: string;
  source: "mcp" | "api";
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  validationResult?: ValidationResult;
  executionLog?: string[];
}
