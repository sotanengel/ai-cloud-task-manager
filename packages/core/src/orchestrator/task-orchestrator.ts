import type { TaskRepository } from "../store/task-repository.js";
import type { Task, TaskScript, TaskStatus } from "../types/index.js";

const CANCELLABLE_STATUSES: TaskStatus[] = ["pending", "validating", "awaiting_approval"];
const APPROVABLE_STATUSES: TaskStatus[] = ["awaiting_approval"];

export class TaskOrchestrator {
  constructor(private readonly repo: TaskRepository) {}

  async submit(
    rawInput: string,
    script: TaskScript,
    source: "mcp" | "api",
  ): Promise<Task> {
    return this.repo.create({ script, rawInput, source });
  }

  cancel(taskId: string): Task | null {
    const task = this.repo.findById(taskId);
    if (!task) return null;
    if (!CANCELLABLE_STATUSES.includes(task.status)) return null;
    return this.repo.updateStatus(taskId, "cancelled");
  }

  approve(taskId: string): Task | null {
    const task = this.repo.findById(taskId);
    if (!task) return null;
    if (!APPROVABLE_STATUSES.includes(task.status)) return null;
    return this.repo.updateStatus(taskId, "running");
  }

  getTask(taskId: string): Task | null {
    return this.repo.findById(taskId);
  }

  listTasks(): Task[] {
    return this.repo.findAll();
  }
}
