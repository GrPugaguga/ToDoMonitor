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

export async function GET(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: tgUser.telegramId },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const categories = user.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    order: cat.order,
    tasks: cat.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      order: task.order,
      done: task.lastCompletedAt ? isToday(task.lastCompletedAt) : false,
      streak: task.streak,
    })),
  }));

  return NextResponse.json({
    user: {
      firstName: user.firstName,
      username: user.username,
    },
    categories,
  });
}
