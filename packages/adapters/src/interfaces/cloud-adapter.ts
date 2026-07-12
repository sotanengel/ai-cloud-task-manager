// @ts-nocheck
import type { Task } from "@cloudpilot/core";

export interface DeployResult {
  success: boolean;
  resourceIds: string[];
  message: string;
}

export interface DiffResult {
  additions: ResourceChange[];
  modifications: ResourceChange[];
  deletions: ResourceChange[];
  estimatedMonthlyCostUsd?: number;
}

export interface ResourceChange {
  type: string;
  name: string;
  details: string;
}

export interface ResourceStatus {
  resourceId: string;
  healthy: boolean;
  metrics: Record<string, number>;
  lastCheckedAt: Date;
}

export interface CloudAdapter {
  readonly provider: string;
  deploy(task: Task): Promise<DeployResult>;
  destroy(task: Task): Promise<void>;
  diff(task: Task): Promise<DiffResult>;
  getStatus(resourceId: string): Promise<ResourceStatus>;
}
