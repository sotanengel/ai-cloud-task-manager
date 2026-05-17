import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Db } from "./db.js";
import { tasks } from "./schema.js";
import type { Task, TaskStatus, TaskScript, ValidationResult } from "../types/index.js";

interface CreateTaskInput {
  script: TaskScript;
  rawInput: string;
  source: "mcp" | "api";
}

export class TaskRepository {
  constructor(private readonly db: Db) {}

  create(input: CreateTaskInput): Task {
    const now = new Date();
    const id = uuidv4();

    this.db.insert(tasks).values({
      id,
      status: "pending",
      script: JSON.stringify(input.script),
      rawInput: input.rawInput,
      source: input.source,
      executionLog: JSON.stringify([]),
      createdAt: now,
      updatedAt: now,
    }).run();

    const created = this.findById(id);
    if (!created) throw new Error(`Task ${id} not found after creation`);
    return created;
  }

  findById(id: string): Task | null {
    const row = this.db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!row) return null;
    return this.rowToTask(row);
  }

  findAll(): Task[] {
    const rows = this.db.select().from(tasks).orderBy(desc(tasks.createdAt)).all();
    return rows.map(this.rowToTask);
  }

  updateStatus(id: string, status: TaskStatus): Task | null {
    const now = new Date();
    const completedAt =
      status === "completed" || status === "failed" || status === "cancelled" ? now : undefined;

    this.db.update(tasks).set({
      status,
      updatedAt: now,
      ...(completedAt !== undefined ? { completedAt } : {}),
    }).where(eq(tasks.id, id)).run();

    return this.findById(id);
  }

  appendLog(id: string, message: string): void {
    const task = this.findById(id);
    if (!task) return;
    const log = [...(task.executionLog ?? []), message];
    this.db.update(tasks).set({
      executionLog: JSON.stringify(log),
      updatedAt: new Date(),
    }).where(eq(tasks.id, id)).run();
  }

  saveValidationResult(id: string, result: ValidationResult): void {
    this.db.update(tasks).set({
      validationResult: JSON.stringify(result),
      updatedAt: new Date(),
    }).where(eq(tasks.id, id)).run();
  }

  private rowToTask(row: typeof tasks.$inferSelect): Task {
    // Build task without optional fields first, then add them conditionally
    // (required by exactOptionalPropertyTypes)
    const task: Task = {
      id: row.id,
      status: row.status as TaskStatus,
      script: JSON.parse(row.script) as TaskScript,
      rawInput: row.rawInput,
      source: row.source as "mcp" | "api",
      executionLog: row.executionLog ? (JSON.parse(row.executionLog) as string[]) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
    if (row.validationResult) {
      task.validationResult = JSON.parse(row.validationResult) as ValidationResult;
    }
    if (row.completedAt !== null && row.completedAt !== undefined) {
      task.completedAt = new Date(row.completedAt);
    }
    return task;
  }
}
