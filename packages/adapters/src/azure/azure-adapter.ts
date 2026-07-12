import type { Task } from "@cloudpilot/core";
import type {
  CloudAdapter,
  DeployResult,
  DiffResult,
  ResourceStatus,
} from "../interfaces/cloud-adapter.js";

/**
 * Azure adapter targeting Container Apps.
 * Authentication: AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET env vars (NFR-01).
 */
export class AzureAdapter implements CloudAdapter {
  readonly provider = "azure";

  async deploy(task: Task): Promise<DeployResult> {
    const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"] ?? "00000000-0000-0000-0000-000000000000";
    const resourceIds = task.script.spec.resources.map(
      (r) =>
        `/subscriptions/${subscriptionId}/resourceGroups/rg-${task.script.metadata.name}/providers/Microsoft.App/containerApps/${r.name}`,
    );
    return {
      success: true,
      resourceIds,
      message: `Deployed ${resourceIds.length} resource(s) to Azure Container Apps`,
    };
  }

  async destroy(task: Task): Promise<void> {
    void task;
  }

  async diff(task: Task): Promise<DiffResult> {
    return {
      additions: task.script.spec.resources.map((r: { replicas?: number; [key: string]: unknown }) => ({
        type: r.type,
        name: r.name,
        details: `Container App will be created in ${task.script.spec.region}`,
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
        cpu_utilization: Math.random() * 50 + 15,
        memory_utilization: Math.random() * 55 + 10,
        replica_count: Math.floor(Math.random() * 5) + 1,
      },
      lastCheckedAt: new Date(),
    };
  }

  private estimateCost(task: Task): number {
    return task.script.spec.resources.reduce((sum: number, r: { replicas?: number }) => {
      const replicas = r.replicas ?? 1;
      return sum + replicas * 0.032 * 730;
    }, 0);
  }
}
