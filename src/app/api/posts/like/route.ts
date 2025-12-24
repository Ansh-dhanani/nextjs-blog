import prisma from "@/lib/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Post ID is required" },
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

    const existingLike = await prisma.postLike.findFirst({
      where: { userId: userID, postId },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });

      // Delete notification
      await prisma.notification.deleteMany({
        where: {
          userId: post.authorId,
          fromUserId: userID,
          postId,
          type: "like",
        },
      });

      return NextResponse.json(
        { success: true, message: "Post unliked", liked: false },
        { status: 200 }
      );
    } else {
      // Like
      await prisma.postLike.create({
        data: { userId: userID, postId },
      });

      // Create notification if not liking own post
      if (post.authorId !== userID) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            fromUserId: userID,
            postId,
            type: "like",
          },
        });
      }

      return NextResponse.json(
        { success: true, message: "Post liked", liked: true },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
