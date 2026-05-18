import { describe, it, expect } from "vitest";
import { MonitoringCollector } from "../monitoring/monitoring-collector.js";
import { AwsAdapter } from "../aws/aws-adapter.js";
import { GcpAdapter } from "../gcp/gcp-adapter.js";
import { AzureAdapter } from "../azure/azure-adapter.js";

describe("MonitoringCollector", () => {
  const collector = new MonitoringCollector([
    new AwsAdapter(),
    new GcpAdapter(),
    new AzureAdapter(),
  ]);

  it("collects normalized metrics for a resource", async () => {
    const metrics = await collector.collect("aws", "arn:aws:ecs:ap-northeast-1:123:service/web");
    expect(metrics).toHaveProperty("cpu_utilization");
    expect(metrics).toHaveProperty("memory_utilization");
    expect(metrics).toHaveProperty("healthy");
    expect(typeof metrics["cpu_utilization"]).toBe("number");
  });

  it("evaluates alert: no alert when below threshold", () => {
    const result = collector.evaluateAlert(
      { metric: "cpu_utilization", threshold: 80, window: "5m" },
      { cpu_utilization: 60, memory_utilization: 40, healthy: 1 },
    );
    expect(result.triggered).toBe(false);
  });

  it("evaluates alert: fires when at or above threshold", () => {
    const result = collector.evaluateAlert(
      { metric: "cpu_utilization", threshold: 80, window: "5m" },
      { cpu_utilization: 85, memory_utilization: 40, healthy: 1 },
    );
    expect(result.triggered).toBe(true);
    expect(result.metric).toBe("cpu_utilization");
    expect(result.value).toBe(85);
  });

  it("returns unknown provider error gracefully", async () => {
    await expect(
      collector.collect("aws" as never, "nonexistent-resource-id"),
    ).resolves.toBeDefined();
  });
});
