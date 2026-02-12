import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function PUT(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryId, orderedIds } = await req.json();
  if (!categoryId || !Array.isArray(orderedIds)) {
    return NextResponse.json(
      { error: "categoryId and orderedIds array are required" },
      { status: 400 }
    );
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, user: { telegramId: tgUser.telegramId } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await prisma.$transaction(
    orderedIds.map((id: number, index: number) =>
      prisma.task.updateMany({
        where: { id, categoryId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
