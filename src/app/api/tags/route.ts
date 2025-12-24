import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      include: { Post: { select: { _count: true } } },
    });

    return NextResponse.json(tags, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { label, value, description, color } = await req.json();

    if (!label || !value) {
      return NextResponse.json({ success: false, message: "Invalid tag data" }, { status: 400 });
    }

    // prevent duplicate by value
    const existing = await prisma.tag.findFirst({ where: { value } });
    if (existing) {
      return NextResponse.json({ success: true, message: "Tag exists", tag: existing }, { status: 200 });
    }

    const tag = await prisma.tag.create({ data: { label, value, description: description || "", color: color || "#7C3AED" } });

    return NextResponse.json({ success: true, message: "Tag created", tag }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
