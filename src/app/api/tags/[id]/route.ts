import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { label, value, description, color } = await req.json();

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: {
        label: label ?? undefined,
        value: value ?? undefined,
        description: description ?? undefined,
        color: color ?? undefined,
      },
    });

    return NextResponse.json({ success: true, tag }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.tag.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Tag deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
