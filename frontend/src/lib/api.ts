import type { TaskCreate, TaskListResponse, TaskRead, TaskStatusFilter, TaskUpdate } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  // 204 etc.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function listTasks(params: {
  status: TaskStatusFilter;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<TaskListResponse> {
  const sp = new URLSearchParams();
  sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  return await request(`/v1/tasks?${sp.toString()}`);
}

export async function createTask(data: TaskCreate): Promise<TaskRead> {
  return await request("/v1/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTask(taskId: number, data: TaskUpdate): Promise<TaskRead> {
  return await request(`/v1/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function toggleTask(taskId: number): Promise<TaskRead> {
  return await request(`/v1/tasks/${taskId}/toggle`, { method: "PATCH" });
}

export async function deleteTask(taskId: number): Promise<void> {
  await request(`/v1/tasks/${taskId}`, { method: "DELETE" });
}


