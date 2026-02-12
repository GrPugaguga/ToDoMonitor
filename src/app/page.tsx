"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import Category from "@/components/Category";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api, AppData, CategoryData } from "@/lib/api";

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notTelegram, setNotTelegram] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [confirm, setConfirm] = useState<{
    message: string;
    action: () => void;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  useEffect(() => {
    const init = async () => {
      // In dev mode, skip Telegram check
      const skipValidation = process.env.NEXT_PUBLIC_SKIP_TG_VALIDATION === "true";

      if (!skipValidation && !window.Telegram?.WebApp?.initData) {
        setNotTelegram(true);
        setLoading(false);
        return;
      }

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }

      await api.auth();
      const appData = await api.getData();
      setData(appData);
      setLoading(false);
    };

    init();
  }, []);

  const reload = useCallback(async () => {
    const appData = await api.getData();
    setData(appData);
  }, []);

  // --- Handlers ---
  const handleToggleTask = useCallback(
    async (taskId: number) => {
      if (!data) return;
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            tasks: cat.tasks.map((t) =>
              t.id === taskId ? { ...t, done: !t.done } : t
            ),
          })),
        };
      });
      const result = await api.toggleTask(taskId);
      // Update streak from server
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map((cat) => ({
            ...cat,
            tasks: cat.tasks.map((t) =>
              t.id === taskId
                ? { ...t, done: result.task.done, streak: result.task.streak }
                : t
            ),
          })),
        };
      });
    },
    [data]
  );

  const handleDeleteTask = useCallback(
    (taskId: number) => {
      setConfirm({
        message: "Удалить задачу? Streak будет потерян.",
        action: async () => {
          await api.deleteTask(taskId);
          setConfirm(null);
          reload();
        },
      });
    },
    [reload]
  );

  const handleDeleteCategory = useCallback(
    (categoryId: number) => {
      setConfirm({
        message: "Удалить категорию и все задачи внутри?",
        action: async () => {
          await api.deleteCategory(categoryId);
          setConfirm(null);
          reload();
        },
      });
    },
    [reload]
  );

  const handleAddTask = useCallback(
    async (categoryId: number, name: string) => {
      await api.createTask(categoryId, name);
      reload();
    },
    [reload]
  );

  const handleAddCategory = useCallback(
    async (name: string) => {
      await api.createCategory(name);
      setAddingCategory(false);
      reload();
    },
    [reload]
  );

  const handleRenameCategory = useCallback(
    async (categoryId: number, name: string) => {
      await api.renameCategory(categoryId, name);
      reload();
    },
    [reload]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!data) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Category drag
      if (activeId.startsWith("cat-") && overId.startsWith("cat-")) {
        const oldIndex = data.categories.findIndex(
          (c) => `cat-${c.id}` === activeId
        );
        const newIndex = data.categories.findIndex(
          (c) => `cat-${c.id}` === overId
        );
        if (oldIndex === -1 || newIndex === -1) return;

        const newCategories = arrayMove(data.categories, oldIndex, newIndex);
        setData({ ...data, categories: newCategories });
        await api.reorderCategories(newCategories.map((c) => c.id));
        return;
      }

      // Task drag (within same category)
      if (activeId.startsWith("task-") && overId.startsWith("task-")) {
        const activeTaskId = parseInt(activeId.replace("task-", ""));
        const overTaskId = parseInt(overId.replace("task-", ""));

        // Find which category contains both
        const catIndex = data.categories.findIndex(
          (c) =>
            c.tasks.some((t) => t.id === activeTaskId) &&
            c.tasks.some((t) => t.id === overTaskId)
        );
        if (catIndex === -1) return;

        const cat = data.categories[catIndex];
        const oldIndex = cat.tasks.findIndex((t) => t.id === activeTaskId);
        const newIndex = cat.tasks.findIndex((t) => t.id === overTaskId);

        const newTasks = arrayMove(cat.tasks, oldIndex, newIndex);
        const newCategories = [...data.categories];
        newCategories[catIndex] = { ...cat, tasks: newTasks };
        setData({ ...data, categories: newCategories });

        await api.reorderTasks(
          cat.id,
          newTasks.map((t) => t.id)
        );
      }
    },
    [data]
  );

  // --- Render ---
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-400">Загрузка...</div>
      </main>
    );
  }

  if (notTelegram) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">
            Откройте в Telegram
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Это приложение работает только как Telegram Mini App
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen px-4 pt-24 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">
          Привет, {data.user.firstName}
        </h1>
        <button
          onClick={() => setAddingCategory(true)}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm text-slate-400 hover:text-blue-500 hover:bg-slate-100/50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2V12M2 7H12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          категорию
        </button>
      </div>

      {/* Categories */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={data.categories.map((c) => `cat-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {data.categories.map((category) => (
              <Category
                key={category.id}
                category={category}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onDeleteCategory={handleDeleteCategory}
                onAddTask={handleAddTask}
                onRenameCategory={handleRenameCategory}
              />
            ))}
            {addingCategory && (
              <Category
                key="new-category"
                isNew
                category={{ id: 0, name: "", order: 0, tasks: [] }}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onDeleteCategory={handleDeleteCategory}
                onAddTask={handleAddTask}
                onRenameCategory={(_id, name) => handleAddCategory(name)}
                onCancelNew={() => setAddingCategory(false)}
              />
            )}
          </div>
        </SortableContext>
      </DndContext>

      {data.categories.length === 0 && !addingCategory && (
        <div className="mt-16 text-center text-sm text-slate-300">
          Нажмите &quot;+ категорию&quot; чтобы начать
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}
