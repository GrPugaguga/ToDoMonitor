import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryId, name } = await req.json();
  if (!categoryId || !name || typeof name !== "string") {
    return NextResponse.json(
      { error: "categoryId and name are required" },
      { status: 400 }
    );
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, user: { telegramId: tgUser.telegramId } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const maxOrder = await prisma.task.aggregate({
    where: { categoryId },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      categoryId,
      name: name.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
