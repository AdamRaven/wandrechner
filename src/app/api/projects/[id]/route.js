import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { order: "asc" },
        include: {
          walls: true,
          windows: true,
          extras: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projekt nicht gefunden" },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ message: "Projekt gelöscht" });
}
