import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { id } = await params;
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "Name erforderlich" },
      { status: 400 }
    );
  }

  const pageCount = await prisma.page.count({
    where: { projectId: id },
  });

  const page = await prisma.page.create({
    data: {
      name,
      order: pageCount,
      projectId: id,
    },
    include: {
      walls: true,
      windows: true,
    },
  });

  return NextResponse.json(page, { status: 201 });
}
