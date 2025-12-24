import prisma from "@/lib/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { commentId, replyText } = await req.json();

    if (!commentId || !replyText) {
      return NextResponse.json(
        { success: false, message: "Invalid data sent." },
        { status: 400 }
      );
    }

    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "Please log in first!" },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true, authorId: true },
    });
    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found." },
        { status: 404 }
      );
    }

    const reply = await prisma.comment.create({
      data: { content: replyText, parentId: commentId, postId: comment.postId, authorId: userID },
    });

    // Create notification for the post author if not replying to own comment/post
    if (comment.authorId !== userID) {
      await prisma.notification.create({
        data: {
          userId: comment.authorId,
          fromUserId: userID,
          postId: comment.postId,
          commentId: reply.id,
          type: "reply",
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Reply added successfully", reply },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const replyId = req.nextUrl.searchParams.get("id");
    if (!replyId) {
      return NextResponse.json(
        { success: false, message: "Invalid data sent." },
        { status: 400 }
      );
    }

    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "Please log in first!" },
        { status: 401 }
      );
    }

    const existReply = await prisma.comment.findUnique({
      where: { id: replyId, authorId: userID },
    });
    if (!existReply) {
      return NextResponse.json(
        { success: false, message: "Reply not found!" },
        { status: 404 }
      );
    }

    const replyToDelete = await prisma.comment.delete({
      where: { id: replyId, authorId: userID },
    });

    return NextResponse.json(
      { success: true, message: "Reply deleted successfully", replyToDelete },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
