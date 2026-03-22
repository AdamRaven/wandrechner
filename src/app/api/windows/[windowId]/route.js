import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { windowId } = await params;
  const { name, width, height, count } = await request.json();

  const window = await prisma.window.update({
    where: { id: windowId },
    data: {
      name,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      count: parseInt(count) || 1,
    },
  });

  return NextResponse.json(window);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { windowId } = await params;

  await prisma.window.delete({ where: { id: windowId } });

  return NextResponse.json({ message: "Fenster gelöscht" });
}
