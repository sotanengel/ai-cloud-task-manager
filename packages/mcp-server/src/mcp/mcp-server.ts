import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { runValidationPipeline } from "@cloudpilot/core";
import { validateSyntax } from "@cloudpilot/core";
import type { TaskScript , TaskOrchestrator } from "@cloudpilot/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "../../../../", "schemas", "task-script.v1.json");

export function createMcpServer(orchestrator: TaskOrchestrator): McpServer {
  const server = new McpServer({
    name: "cloudpilot",
    version: "0.1.0",
  });

  // Tool: submit_task
  server.tool(
    "submit_task",
    "Submit a CloudPilot deployment task script (YAML or JSON). The script will be validated through a multi-layer pipeline before execution.",
    {
      script: z.string().describe("Task script in YAML or JSON format"),
      source: z.enum(["mcp", "api"]).optional().default("mcp"),
    },
    async ({ script, source }) => {
      const validationResult = await runValidationPipeline(script);

      if (validationResult.status === "rejected") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(validationResult, null, 2),
            },
          ],
          isError: true,
        };
      }

      const syntaxResult = validateSyntax(script);
      if (!syntaxResult.ok) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(syntaxResult.error, null, 2) }],
          isError: true,
        };
      }

      const taskScript = syntaxResult.parsed as unknown as TaskScript;
      const task = await orchestrator.submit(script, taskScript, source ?? "mcp");

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                taskId: task.id,
                status: "accepted",
                message: `Task ${task.id} submitted. Use get_task_status to monitor progress.`,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Tool: get_task_status
  server.tool(
    "get_task_status",
    "Get the current status of a CloudPilot task by its ID.",
    { taskId: z.string().describe("The task ID returned by submit_task") },
    async ({ taskId }) => {
      const task = orchestrator.getTask(taskId);
      if (!task) {
        return {
          content: [{ type: "text" as const, text: `Task ${taskId} not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(task, null, 2) }],
      };
    },
  );

  // Tool: list_tasks
  server.tool(
    "list_tasks",
    "List all CloudPilot tasks with their current status.",
    {},
    async () => {
      const tasks = orchestrator.listTasks();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              tasks.map((t: { id: string; status: string; script: { metadata: { name: string }; spec: { provider: string; environment: string } }; createdAt: unknown }) => ({
                id: t.id,
                status: t.status,
                name: t.script.metadata.name,
                provider: t.script.spec.provider,
                environment: t.script.spec.environment,
                createdAt: t.createdAt,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Tool: get_script_schema
  server.tool(
    "get_script_schema",
    "Get the JSON Schema for CloudPilot task scripts. Use this to understand the required format before calling submit_task.",
    {},
    async () => {
      const schema = readFileSync(SCHEMA_PATH, "utf-8");
      return {
        content: [{ type: "text" as const, text: schema }],
      };
    },
  );

  return server;
}

export async function startMcpServer(orchestrator: TaskOrchestrator): Promise<void> {
  const server = createMcpServer(orchestrator);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
