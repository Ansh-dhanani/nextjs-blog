import prisma from "@/lib/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { commentId } = await req.json();

    if (!commentId) {
      return NextResponse.json(
        { success: false, message: "Comment ID is required" },
        { status: 400 }
      );
    }

    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    const existingLike = await prisma.commentLike.findFirst({
      where: { userId: userID, commentId },
    });

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      // Delete notification
      await prisma.notification.deleteMany({
        where: {
          userId: comment.authorId,
          fromUserId: userID,
          commentId,
          type: "like",
        },
      });

      return NextResponse.json(
        { success: true, message: "Comment unliked", liked: false },
        { status: 200 }
      );
    } else {
      // Like
      await prisma.commentLike.create({
        data: { userId: userID, commentId },
      });

      // Create notification if not liking own comment
      if (comment.authorId !== userID) {
        await prisma.notification.create({
          data: {
            userId: comment.authorId,
            fromUserId: userID,
            postId: comment.postId,
            commentId,
            type: "like",
          },
        });
      }

      return NextResponse.json(
        { success: true, message: "Comment liked", liked: true },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
