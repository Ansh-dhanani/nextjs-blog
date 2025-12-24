import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: params.username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        followerIDs: true,
        followingIDs: true,
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        comment: true,
        followingTags: true,
        posts: {
          orderBy: {
            createdAt: "desc",
          },
          where: { NOT: { type: "DRAFT" } },
          include: {
            _count: { select: { comments: true } },
            saved: true,
            likes: true,
            tags: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Replace null avatars with placeholder
    const placeholderImage = "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg";
    
    const processedUser = {
      ...user,
      avatar: user.avatar || placeholderImage,
      follower: user.follower?.map(f => ({
        ...f,
        avatar: f.avatar || placeholderImage,
      })) || [],
      following: user.following?.map(f => ({
        ...f,
        avatar: f.avatar || placeholderImage,
      })) || [],
      posts: user.posts?.map(post => ({
        ...post,
        author: {
          ...post.author,
          avatar: post.author.avatar || placeholderImage,
        },
      })) || [],
    };

    return NextResponse.json(processedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
