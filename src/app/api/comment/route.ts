import prisma from "@/lib/db";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { content, postID } = await req.json();

    if (!content || !postID) {
      return NextResponse.json(
        { success: false, message: "Something went wrong please try again!" },
        { status: 500 }
      );
    }

    const userID = await getDataFromToken(req);

    const user = await prisma.user.findUnique({ where: { id: userID } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please try login first!" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postID } });
    if (!post) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found please provide correct postID",
        },
        { status: 500 }
      );
    }

    const comment = await prisma.comment.create({
      data: { content: content, authorId: userID, postId: postID },
    });

    // Create notification if not commenting on own post
    if (post.authorId !== userID) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          fromUserId: userID,
          postId: postID,
          commentId: comment.id,
          type: "comment",
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "Comment added successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Invalid data send!" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        authorId: true,
        postId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: { select: { replies: true, likes: true } },
      },
    });

    // Replace null avatars with placeholder
    const placeholderImage = "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg";
    const processedComments = comments.map(comment => ({
      ...comment,
      author: {
        ...comment.author,
        avatar: comment.author.avatar || placeholderImage,
      },
    }));

    return NextResponse.json(processedComments, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE COMMENT WITH ALL REPLIES
export async function DELETE(req: NextRequest) {
  try {
    const commentId = req.nextUrl.searchParams.get("id");

    if (!commentId) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid comment Id" },
        { status: 500 }
      );
    }

    const userID = await getDataFromToken(req);

    // Check if the comment exists and if it belongs to the user
    const existingComment = await prisma.comment.findFirst({
      where: { id: commentId, authorId: userID },
    });

    if (!existingComment) {
      return NextResponse.json(
        {
          success: false,
          message: "Comment not found or doesn't belong to the user",
        },
        { status: 404 } // Not Found
      );
    }

    // Recursively delete comment and its replies
    const deleteCommentRecursively = async (commentId: string) => {
      const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
        select: { id: true },
      });
      for (const reply of replies) {
        await deleteCommentRecursively(reply.id);
      }
      await prisma.comment.delete({ where: { id: commentId } });
    };

    await deleteCommentRecursively(commentId);

    return NextResponse.json(
      { success: true, message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
