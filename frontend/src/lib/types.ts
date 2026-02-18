export type TaskStatusFilter = "all" | "done" | "todo";

export type TaskRead = {
  id: number;
  user_id: number;
  cat_id: number;
  title: string;
  description: string | null;
  status: 0 | 1;
  finish_date: string | null;
  is_done: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskCreate = {
  title: string;
  description?: string | null;
  user_id?: number;
  cat_id?: number;
  status?: 0 | 1;
  finish_date?: string | null;
};

export type TaskUpdate = {
  title?: string;
  description?: string | null;
  is_done?: boolean;
};

export type TaskListResponse = {
  items: TaskRead[];
  total: number;
  limit: number;
  offset: number;
};


