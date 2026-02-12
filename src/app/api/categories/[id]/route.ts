import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateRequest } from "@/lib/telegram";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = parseInt(id);
  const { name } = await req.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, user: { telegramId: tgUser.telegramId } },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { name: name.trim() },
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tgUser = authenticateRequest(req);
  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = parseInt(id);

  const category = await prisma.category.findFirst({
    where: { id: categoryId, user: { telegramId: tgUser.telegramId } },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: categoryId } });

  return NextResponse.json({ success: true });
}
