// @ts-nocheck
import type { Task } from "@cloudpilot/core";
import type {
  CloudAdapter,
  DeployResult,
  DiffResult,
  ResourceStatus,
} from "../interfaces/cloud-adapter.js";

/**
 * AWS adapter targeting ECS/Fargate.
 * Cloud API calls are mocked; real implementation added in E2E phase.
 * Authentication: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars only (NFR-01).
 */
export class AwsAdapter implements CloudAdapter {
  readonly provider = "aws";

  async deploy(task: Task): Promise<DeployResult> {
    const resourceIds = task.script.spec.resources.map(
      (r) =>
        `arn:aws:ecs:${task.script.spec.region}:123456789:service/${task.script.metadata.name}-${r.name}`,
    );
    return {
      success: true,
      resourceIds,
      message: `Deployed ${resourceIds.length} resource(s) to AWS ECS`,
    };
  }

  async destroy(task: Task): Promise<void> {
    // Mock: real ECS DeleteService call would go here
    void task;
  }

  async diff(task: Task): Promise<DiffResult> {
    return {
      additions: task.script.spec.resources.map((r) => ({
        type: r.type,
        name: r.name,
        details: `ECS service will be created in ${task.script.spec.region}`,
      })),
      modifications: [],
      deletions: [],
      estimatedMonthlyCostUsd: this.estimateCost(task),
    };
  }

  async getStatus(resourceId: string): Promise<ResourceStatus> {
    return {
      resourceId,
      healthy: true,
      metrics: {
        cpu_utilization: Math.random() * 60 + 10,
        memory_utilization: Math.random() * 50 + 20,
        error_rate: Math.random() * 2,
      },
      lastCheckedAt: new Date(),
    };
  }

  private estimateCost(task: Task): number {
    const vCpuPerReplica = 0.25;
    const costPerVcpuHour = 0.04048;
    const hoursPerMonth = 730;
    return task.script.spec.resources.reduce((sum, r) => {
      const replicas = r.replicas ?? 1;
      return sum + replicas * vCpuPerReplica * costPerVcpuHour * hoursPerMonth;
    }, 0);
  }
}
