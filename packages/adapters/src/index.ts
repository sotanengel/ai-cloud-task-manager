// @cloudpilot/adapters — cloud adapter implementations
export * from "./interfaces/cloud-adapter.js";
export { AwsAdapter } from "./aws/aws-adapter.js";
export { GcpAdapter } from "./gcp/gcp-adapter.js";
export { AzureAdapter } from "./azure/azure-adapter.js";
export { MonitoringCollector } from "./monitoring/monitoring-collector.js";
export type { NormalizedMetrics, AlertEvaluation } from "./monitoring/monitoring-collector.js";
