import type { CloudProvider } from "@cloudpilot/core";
import type { CloudAdapter } from "../interfaces/cloud-adapter.js";

export interface NormalizedMetrics {
  cpu_utilization: number;
  memory_utilization: number;
  healthy: number;
  [key: string]: number;
}

export interface AlertEvaluation {
  triggered: boolean;
  metric: string;
  threshold: number;
  value: number;
}

export class MonitoringCollector {
  private readonly adapterMap: Map<string, CloudAdapter>;

  constructor(adapters: CloudAdapter[]) {
    this.adapterMap = new Map(adapters.map((a) => [a.provider, a]));
  }

  async collect(provider: CloudProvider, resourceId: string): Promise<NormalizedMetrics> {
    const adapter = this.adapterMap.get(provider);
    if (!adapter) {
      return this.emptyMetrics(resourceId);
    }

    const status = await adapter.getStatus(resourceId);
    return this.normalize(status.healthy, status.metrics);
  }

  evaluateAlert(
    alert: { metric: string; threshold: number; window: string },
    metrics: NormalizedMetrics,
  ): AlertEvaluation {
    const value = metrics[alert.metric] ?? 0;
    return {
      triggered: value >= alert.threshold,
      metric: alert.metric,
      threshold: alert.threshold,
      value,
    };
  }

  private normalize(healthy: boolean, raw: Record<string, number>): NormalizedMetrics {
    return {
      cpu_utilization: raw["cpu_utilization"] ?? 0,
      memory_utilization: raw["memory_utilization"] ?? 0,
      healthy: healthy ? 1 : 0,
      ...raw,
    };
  }

  private emptyMetrics(_resourceId: string): NormalizedMetrics {
    return { cpu_utilization: 0, memory_utilization: 0, healthy: 0 };
  }
}
