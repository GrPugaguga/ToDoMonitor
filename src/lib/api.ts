const headers = () => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) {
    h["X-Telegram-Init-Data"] = window.Telegram.WebApp.initData;
  }
  return h;
};

export interface TaskData {
  id: number;
  name: string;
  order: number;
  done: boolean;
  streak: number;
}

export interface CategoryData {
  id: number;
  name: string;
  order: number;
  tasks: TaskData[];
}

export interface AppData {
  user: { firstName: string; username?: string };
  categories: CategoryData[];
}

export const api = {
  auth: () =>
    fetch("/api/auth", { method: "POST", headers: headers() }).then((r) =>
      r.json()
    ),

  getData: (): Promise<AppData> =>
    fetch("/api/data", { headers: headers() }).then((r) => r.json()),

  createCategory: (name: string) =>
    fetch("/api/categories", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name }),
    }).then((r) => r.json()),

  renameCategory: (id: number, name: string) =>
    fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ name }),
    }).then((r) => r.json()),

  deleteCategory: (id: number) =>
    fetch(`/api/categories/${id}`, {
      method: "DELETE",
      headers: headers(),
    }).then((r) => r.json()),

  reorderCategories: (orderedIds: number[]) =>
    fetch("/api/categories/reorder", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ orderedIds }),
    }).then((r) => r.json()),

  createTask: (categoryId: number, name: string) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ categoryId, name }),
    }).then((r) => r.json()),

  renameTask: (id: number, name: string) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ name }),
    }).then((r) => r.json()),

  deleteTask: (id: number) =>
    fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      headers: headers(),
    }).then((r) => r.json()),

  toggleTask: (id: number) =>
    fetch(`/api/tasks/${id}/toggle`, {
      method: "POST",
      headers: headers(),
    }).then((r) => r.json()),

  reorderTasks: (categoryId: number, orderedIds: number[]) =>
    fetch("/api/tasks/reorder", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ categoryId, orderedIds }),
    }).then((r) => r.json()),
};
