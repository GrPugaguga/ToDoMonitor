"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskRow from "./TaskRow";
import { CategoryData } from "@/lib/api";

interface CategoryProps {
  category: CategoryData;
  onToggleTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onDeleteCategory: (categoryId: number) => void;
  onAddTask: (categoryId: number, name: string) => void;
}

export default function Category({
  category,
  onToggleTask,
  onDeleteTask,
  onDeleteCategory,
  onAddTask,
}: CategoryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `cat-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddTask = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    onAddTask(category.id, trimmed);
    setNewTaskName("");
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTask();
    if (e.key === "Escape") {
      setAdding(false);
      setNewTaskName("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-slate-200/80 bg-white transition-shadow ${
        isDragging
          ? "shadow-lg shadow-blue-200/40 z-10 opacity-95"
          : "shadow-sm shadow-blue-100/20"
      }`}
    >
      {/* Category header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-400 transition-colors"
          aria-label="Перетащить категорию"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="5" cy="3" r="1.2" fill="currentColor" />
            <circle cx="11" cy="3" r="1.2" fill="currentColor" />
            <circle cx="5" cy="8" r="1.2" fill="currentColor" />
            <circle cx="11" cy="8" r="1.2" fill="currentColor" />
            <circle cx="5" cy="13" r="1.2" fill="currentColor" />
            <circle cx="11" cy="13" r="1.2" fill="currentColor" />
          </svg>
        </button>

        {/* Collapse toggle + name */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-1 items-center gap-1.5 text-left"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`text-slate-400 transition-transform ${
              collapsed ? "" : "rotate-90"
            }`}
          >
            <path
              d="M4 2L8 6L4 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-medium text-slate-800">
            {category.name}
          </span>
          <span className="text-xs text-slate-300">
            {category.tasks.length}
          </span>
        </button>

        {/* Delete category */}
        <button
          onClick={() => onDeleteCategory(category.id)}
          className="p-0.5 text-slate-200 hover:text-red-400 transition-colors"
          aria-label="Удалить категорию"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Tasks */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <SortableContext
            items={category.tasks.map((t) => `task-${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {category.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </SortableContext>

          {/* Add task */}
          {adding ? (
            <div className="mt-1.5 flex items-center gap-2 px-1">
              <input
                autoFocus
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTaskName.trim()) {
                    setAdding(false);
                  }
                }}
                placeholder="Название задачи"
                className="flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={handleAddTask}
                className="rounded-md bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 transition-colors"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs text-slate-400 hover:text-blue-500 hover:bg-slate-50/50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 2V10M2 6H10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              задачу
            </button>
          )}
        </div>
      )}
    </div>
  );
}
