import { openDb, TaskRepository, TaskOrchestrator } from "@cloudpilot/core";
import { startServer } from "./api/server.js";
import { startMcpServer } from "./mcp/mcp-server.js";

const DB_PATH = process.env["DATABASE_PATH"] ?? "./data/cloudpilot.db";
const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const MODE = process.env["CLOUDPILOT_MODE"] ?? "api"; // 'api' | 'mcp'

async function main(): Promise<void> {
  const db = openDb(DB_PATH);
  const repo = new TaskRepository(db);
  const orch = new TaskOrchestrator(repo);

  if (MODE === "mcp") {
    await startMcpServer(orch);
  } else {
    await startServer(orch, PORT);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
