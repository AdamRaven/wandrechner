import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { pageId } = await params;
  const { name, width, height, count } = await request.json();

  const window = await prisma.window.create({
    data: {
      name: name || "Fenster",
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      count: parseInt(count) || 1,
      pageId,
    },
  });

  return NextResponse.json(window, { status: 201 });
}
