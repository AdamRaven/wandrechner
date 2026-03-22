import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { pageId } = await params;

  await prisma.page.delete({ where: { id: pageId } });

  return NextResponse.json({ message: "Seite gelöscht" });
}

export async function PUT(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { pageId } = await params;
  const { name } = await request.json();

  const page = await prisma.page.update({
    where: { id: pageId },
    data: { name },
  });

  return NextResponse.json(page);
}
