import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const { name, date } = await request.json();

  if (!name || !date) {
    return NextResponse.json(
      { error: "Name und Datum erforderlich" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      date: new Date(date),
      userId: user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
