import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  script: text("script").notNull(),        // JSON-serialized TaskScript
  rawInput: text("raw_input").notNull(),
  source: text("source").notNull(),         // 'mcp' | 'api'
  executionLog: text("execution_log"),       // JSON array of strings
  validationResult: text("validation_result"), // JSON
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  taskId: text("task_id"),
  action: text("action").notNull(),
  actor: text("actor").notNull(),           // 'mcp' | 'api' | 'system'
  details: text("details"),                  // JSON
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
