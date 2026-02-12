import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function PUT(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json(
      { error: "orderedIds array is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: tgUser.telegramId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.$transaction(
    orderedIds.map((id: number, index: number) =>
      prisma.category.updateMany({
        where: { id, userId: user.id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
