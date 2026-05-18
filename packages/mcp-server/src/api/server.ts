import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { runValidationPipeline, TaskOrchestrator } from "@cloudpilot/core";
import type { TaskScript } from "@cloudpilot/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "../../../../", "schemas", "task-script.v1.json");

export function buildApiServer(orchestrator: TaskOrchestrator) {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // Script schema — allows AI agents to discover the expected format
  app.get("/schema", async () => {
    const raw = readFileSync(SCHEMA_PATH, "utf-8");
    return JSON.parse(raw) as object;
  });

  // Submit a task script
  app.post<{
    Body: { script: string; source?: "api" | "mcp" };
  }>("/tasks", async (request, reply) => {
    const { script: rawInput, source = "api" } = request.body;

    const validationResult = await runValidationPipeline(rawInput);

    if (validationResult.status === "rejected") {
      return reply.status(422).send(validationResult);
    }

    // Parse the validated script for task creation
    const parsed = JSON.parse(
      JSON.stringify(validationResult),
    ) as typeof validationResult;
    void parsed;

    // Re-parse raw input to get the TaskScript object
    const { validateSyntax } = await import("@cloudpilot/core");
    const syntaxResult = validateSyntax(rawInput);
    if (!syntaxResult.ok) {
      return reply.status(422).send(syntaxResult.error);
    }
    const script = syntaxResult.parsed as unknown as TaskScript;

    const task = await orchestrator.submit(rawInput, script, source);

    return reply.status(202).send({
      taskId: task.id,
      status: validationResult.status,
      phase: validationResult.phase,
    });
  });

  // List tasks
  app.get("/tasks", async () => orchestrator.listTasks());

  // Get task by id
  app.get<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const task = orchestrator.getTask(request.params.id);
    if (!task) return reply.status(404).send({ error: "Task not found" });
    return task;
  });

  // Approve a task
  app.post<{ Params: { id: string } }>("/tasks/:id/approve", async (request, reply) => {
    const task = orchestrator.approve(request.params.id);
    if (!task) {
      return reply.status(409).send({ error: "Task is not in awaiting_approval state" });
    }
    return task;
  });

  // Cancel a task
  app.post<{ Params: { id: string } }>("/tasks/:id/cancel", async (request, reply) => {
    const task = orchestrator.cancel(request.params.id);
    if (!task) {
      return reply.status(409).send({ error: "Task cannot be cancelled in its current state" });
    }
    return task;
  });

  return app;
}

export async function startServer(orchestrator: TaskOrchestrator, port = 3000): Promise<void> {
  const app = buildApiServer(orchestrator);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`CloudPilot API server listening on port ${port}`);
}
