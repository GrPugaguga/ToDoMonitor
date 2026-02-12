import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { telegramId: tgUser.telegramId },
    update: {
      firstName: tgUser.firstName,
      lastName: tgUser.lastName,
      username: tgUser.username,
    },
    create: {
      telegramId: tgUser.telegramId,
      firstName: tgUser.firstName,
      lastName: tgUser.lastName,
      username: tgUser.username,
    },
  });

  return NextResponse.json({
    user: {
      ...user,
      telegramId: Number(user.telegramId),
    },
  });
}
