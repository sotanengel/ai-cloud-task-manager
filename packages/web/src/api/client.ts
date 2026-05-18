const BASE = "/api";

export interface TaskSummary {
  id: string;
  status: string;
  script: {
    metadata: { name: string };
    spec: { provider: string; environment: string };
  };
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  code: string;
  field: string;
  severity: "error" | "warning";
  message: string;
  received?: unknown;
  suggestion?: string;
}

export interface TaskDetail extends TaskSummary {
  rawInput: string;
  executionLog: string[];
  validationResult?: {
    status: string;
    phase: string;
    errors: ValidationError[];
  };
}

export async function listTasks(): Promise<TaskSummary[]> {
  const res = await fetch(`${BASE}/tasks`);
  return res.json() as Promise<TaskSummary[]>;
}

export async function getTask(id: string): Promise<TaskDetail> {
  const res = await fetch(`${BASE}/tasks/${id}`);
  return res.json() as Promise<TaskDetail>;
}

export async function approveTask(id: string): Promise<TaskDetail> {
  const res = await fetch(`${BASE}/tasks/${id}/approve`, { method: "POST" });
  return res.json() as Promise<TaskDetail>;
}

export async function cancelTask(id: string): Promise<TaskDetail> {
  const res = await fetch(`${BASE}/tasks/${id}/cancel`, { method: "POST" });
  return res.json() as Promise<TaskDetail>;
}

export async function submitTask(script: string): Promise<{ taskId: string; status: string }> {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ script, source: "api" }),
  });
  return res.json() as Promise<{ taskId: string; status: string }>;
}
