import prisma from "@/lib/db";
import { deleteFileFromCloudinary } from "@/utils/deleteFileFromCloudinary";
import { getDataFromToken } from "@/utils/getDataFromToken";
import { getPublicIdCloudinary } from "@/utils/getPublicIdCloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { uploadImageToCloudinary } from "@/utils/uploadImageToCloudinary";

// In-memory cache for view throttling (userId_or_ip -> postId -> lastViewTime)
const viewCache = new Map<string, Map<string, number>>();
const VIEW_COOLDOWN = 20 * 60 * 1000; // 20 minutes in milliseconds

//@description     Get a single post
//@route           GET /api/posts/[post.path]
//@access          Not protected
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string[] } }
) {
  try {
    const userId = getDataFromToken(req);
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'anonymous';

    // Use userId if logged in, otherwise use IP
    const viewerId = userId || clientIP;
    const path = params.postId.join("/");
    const post = await prisma.post.findFirst({
      where: { path },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            followerIDs: true,
            followingIDs: true,
            posts: {
              take: 4,
              select: {
                id: true,
                path: true,
                title: true,
              },
            },
          },
        },
        tags: {
          select: {
            id: true,
            label: true,
            value: true,
            color: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found!" },
        { status: 404 }
      );
    }

    // Check if user liked the post
    let isLiked = false;
    if (userId) {
      const like = await prisma.postLike.findFirst({
        where: { userId, postId: post.id },
      });
      isLiked = !!like;
    }

    // Handle view increment with throttling
    const shouldIncrementViews = (() => {
      if (!viewCache.has(viewerId)) {
        viewCache.set(viewerId, new Map());
      }
      const userViews = viewCache.get(viewerId)!;
      const now = Date.now();
      const lastViewTime = userViews.get(post.id);
      
      // If never viewed or cooldown passed, allow increment
      if (!lastViewTime || (now - lastViewTime) >= VIEW_COOLDOWN) {
        userViews.set(post.id, now);
        return true;
      }
      
      return false;
    })();

    if (shouldIncrementViews) {
      await prisma.post.update({
        where: { id: post.id },
        data: { views: post.views + 1 }, // Increment the views by 1
      });
    }

    return NextResponse.json({
      ...post,
      isLiked,
      views: shouldIncrementViews ? post.views + 1 : post.views,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

//@description     Update a single post
//@route           PATCH /api/posts/[post.path]
//@access          protected
export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string[] } }
) {
  try {
    const { title, content, image, userId, postId, type } = await req.json();

    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "You are not authorize!" },
        { status: 401 }
      );
    }

    if (userID !== userId) {
      return NextResponse.json(
        { success: false, message: "UserId not match" },
        { status: 404 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || !postId) {
      return NextResponse.json(
        { success: false, message: "Invalid post ID!" },
        { status: 404 }
      );
    }

    const updatedData: Prisma.PostUpdateInput = {};

    if (title !== undefined) updatedData.title = title;
    if (content !== undefined) updatedData.content = content;
    if (type !== undefined) updatedData.type = type;

    // Handle image update
    if (image !== undefined) {
      if (image === null && post.image) {
        // Delete existing image from Cloudinary
        const publicId = getPublicIdCloudinary(post.image);
        if (publicId) {
          await deleteFileFromCloudinary(publicId, "articles");
        }
        updatedData.image = null;
      } else if (image && image !== post.image) {
        // Upload new image and delete old if exists
        if (post.image) {
          const publicId = getPublicIdCloudinary(post.image);
          if (publicId) {
            await deleteFileFromCloudinary(publicId, "articles");
          }
        }
        const uploadedImage = await uploadImageToCloudinary(image, "blog/articles");
        updatedData.image = uploadedImage.secure_url;
      }
    }

    // handle tags update (replace existing tags with provided tags array of values)
    const body = await req.json();
    const newTags: string[] | undefined = body.tags;
    if (Array.isArray(newTags)) {
      // find or create tags and prepare connect list
      const connectTags: Array<{ id: string }> = [];
      for (const val of newTags) {
        const existing = await prisma.tag.findFirst({ where: { value: val } });
        if (existing) connectTags.push({ id: existing.id });
        else {
          const created = await prisma.tag.create({
            data: { label: val, value: val, description: "", color: "#7C3AED" },
          });
          connectTags.push({ id: created.id });
        }
      }
      updatedData.tags = { set: connectTags } as any;
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.post.update({
        where: { id: postId },
        data: updatedData,
      });
    }

    return NextResponse.json(
      { success: true, message: "Post updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

//@description     Delete a single post
//@route           DELETE /api/posts/[post.path]
//@access          protected
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string[] } }
) {
  try {
    const postId = req.nextUrl.searchParams.get("id");
    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Invalid post ID!" },
        { status: 404 }
      );
    }

    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "You are not authorize!" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, authorId: userID },
      include: {
        comments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found or you are not the author!" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if exists
    if (post.image) {
      const publicId = getPublicIdCloudinary(post.image);
      if (publicId) {
        await deleteFileFromCloudinary(publicId, "articles");
      }
    }

    // Delete all likes associated with the post
    await prisma.postLike.deleteMany({
      where: { postId: post.id },
    });

    // Get all comments associated with the post
    const deleteToComment = await prisma.comment.findMany({
      where: { postId: post.id },
    });

    // Delete all comments and there replies associated with the post
    for (const deleteId of deleteToComment) {
      const repliesToDelete = await prisma.comment.findMany({
        where: { parentId: deleteId.id },
      });
      for (const deleteReply of repliesToDelete) {
        await prisma.comment.delete({
          where: { id: deleteReply.id },
        });
      }

      await prisma.comment.delete({
        where: { id: deleteId.id },
      });
    }

    await prisma.post.delete({
      where: { id: post.id, authorId: userID },
    });

    return NextResponse.json(
      { success: true, message: "Your post deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}