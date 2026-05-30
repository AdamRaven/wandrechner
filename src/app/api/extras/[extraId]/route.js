import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { extraId } = await params;
  const { name, type, width, height, height2, count } = await request.json();

  const extra = await prisma.extra.update({
    where: { id: extraId },
    data: {
      name,
      type: type || "standard",
      width: width != null ? parseFloat(width) : null,
      height: height != null ? parseFloat(height) : null,
      height2: height2 != null ? parseFloat(height2) : null,
      count: parseInt(count) || 1,
    },
  });

  return NextResponse.json(extra);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { extraId } = await params;

  await prisma.extra.delete({ where: { id: extraId } });

  return NextResponse.json({ message: "Eintrag gelöscht" });
}
