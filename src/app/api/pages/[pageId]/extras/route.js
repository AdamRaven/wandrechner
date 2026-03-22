import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { pageId } = await params;
  const { name, type, width, height, height2, count } = await request.json();

  const extra = await prisma.extra.create({
    data: {
      name: name || "Neuer Eintrag",
      type: type || "standard",
      width: width != null ? parseFloat(width) : null,
      height: height != null ? parseFloat(height) : null,
      height2: height2 != null ? parseFloat(height2) : null,
      count: parseInt(count) || 1,
      pageId,
    },
  });

  return NextResponse.json(extra, { status: 201 });
}
