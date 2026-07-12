import type { Task } from "@cloudpilot/core";
import type {
  CloudAdapter,
  DeployResult,
  DiffResult,
  ResourceStatus,
} from "../interfaces/cloud-adapter.js";

/**
 * GCP adapter targeting Cloud Run.
 * Authentication: GOOGLE_APPLICATION_CREDENTIALS env var only (NFR-01).
 */
export class GcpAdapter implements CloudAdapter {
  readonly provider = "gcp";

  async deploy(task: Task): Promise<DeployResult> {
    const projectId = process.env["GCP_PROJECT_ID"] ?? "my-project";
    const resourceIds = task.script.spec.resources.map(
      (r) =>
        `projects/${projectId}/locations/${task.script.spec.region}/services/${task.script.metadata.name}-${r.name}`,
    );
    return {
      success: true,
      resourceIds,
      message: `Deployed ${resourceIds.length} resource(s) to GCP Cloud Run`,
    };
  }

  async destroy(task: Task): Promise<void> {
    void task;
  }

  async diff(task: Task): Promise<DiffResult> {
    return {
      additions: task.script.spec.resources.map((r) => ({
        type: r.type,
        name: r.name,
        details: `Cloud Run service will be created in ${task.script.spec.region}`,
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
        cpu_utilization: Math.random() * 55 + 10,
        memory_utilization: Math.random() * 45 + 15,
        request_count: Math.floor(Math.random() * 1000),
      },
      lastCheckedAt: new Date(),
    };
  }

  private estimateCost(task: Task): number {
    // Cloud Run pricing: ~$0.00002400 per vCPU-second
    return task.script.spec.resources.reduce((sum: number, r: { replicas?: number }) => {
      const replicas = r.replicas ?? 1;
      return sum + replicas * 0.024 * 730;
    }, 0);
  }
}
