import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const taskId = parseInt(id);

  const task = await prisma.task.findFirst({
    where: { id: taskId, category: { user: { telegramId: tgUser.telegramId } } },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentlyDone = task.lastCompletedAt
    ? isToday(task.lastCompletedAt)
    : false;

  let newStreak: number;
  let newLastCompletedAt: Date | null;

  if (currentlyDone) {
    // Toggle OFF
    newStreak = Math.max(task.streak - 1, 0);
    newLastCompletedAt = null;
  } else {
    // Toggle ON
    if (task.lastCompletedAt && isYesterday(task.lastCompletedAt)) {
      newStreak = task.streak + 1;
    } else {
      newStreak = 1;
    }
    newLastCompletedAt = new Date();
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      streak: newStreak,
      lastCompletedAt: newLastCompletedAt,
    },
  });

  return NextResponse.json({
    task: {
      id: updated.id,
      done: newLastCompletedAt ? isToday(newLastCompletedAt) : false,
      streak: updated.streak,
    },
  });
}
