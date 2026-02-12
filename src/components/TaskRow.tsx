"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskData } from "@/lib/api";

interface TaskRowProps {
  task: TaskData;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-2.5 transition-shadow ${
        isDragging
          ? "shadow-md shadow-blue-200/50 z-10 opacity-90"
          : "hover:shadow-sm hover:shadow-blue-100/30"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-400 transition-colors"
        aria-label="Перетащить"
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

      {/* Task name */}
      <span
        className={`flex-1 text-sm select-none ${
          task.done ? "text-slate-400 line-through" : "text-slate-700"
        }`}
      >
        {task.name}
      </span>

      {/* Streak */}
      {task.streak > 0 && (
        <span className="text-xs font-medium text-blue-500 tabular-nums min-w-[1.2rem] text-center">
          {task.streak}
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
          task.done
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-slate-300 hover:border-blue-400"
        }`}
        aria-label={task.done ? "Снять отметку" : "Отметить"}
      >
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="p-0.5 text-slate-200 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
        aria-label="Удалить задачу"
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
  );
}
