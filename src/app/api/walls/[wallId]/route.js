import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { wallId } = await params;
  const { name, width, height, count } = await request.json();

  const wall = await prisma.wall.update({
    where: { id: wallId },
    data: {
      name,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      count: parseInt(count) || 1,
    },
  });

  return NextResponse.json(wall);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { wallId } = await params;

  await prisma.wall.delete({ where: { id: wallId } });

  return NextResponse.json({ message: "Wand gelöscht" });
}
