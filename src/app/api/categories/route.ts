import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: tgUser.telegramId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.category.aggregate({
    where: { userId: user.id },
    _max: { order: true },
  });

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name: name.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
