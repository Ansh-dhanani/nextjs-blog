import cloudinary from "@/lib/config/cloudinary";
import prisma from "@/lib/db";
import { getDataFromToken } from "@/utils/getDataFromToken";

import { NextRequest, NextResponse } from "next/server";

//@description     Create a new post
//@route           POST /api/posts
//@access          protected
export async function POST(req: NextRequest) {
  try {
    const userID = await getDataFromToken(req);
    if (!userID) {
      return NextResponse.json(
        { success: false, message: "Please login first!" },
        { status: 401 }
      );
    }

    const { title, content, image, type, tags } = await req.json(); // tags: string[] of tag values (labels)

    const makePath = title.split(" ").join("-").toLowerCase();

    let uploadedImage = null;
    if (image !== null) {
      uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "blog/articles",
      });
    }

    // handle tags: tags is optional array of tag values
    let connectTags: Array<{ id: string }> = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const val of tags) {
        const existing = await prisma.tag.findFirst({ where: { value: val } });
        if (existing) connectTags.push({ id: existing.id });
        else {
          const created = await prisma.tag.create({
            data: {
              label: val,
              value: val,
              description: "",
              color: "#7C3AED",
            },
          });
          connectTags.push({ id: created.id });
        }
      }
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        path: makePath,
        authorId: userID,
        image: image !== null ? uploadedImage.secure_url : null,
        type,
        tags: connectTags.length > 0 ? { connect: connectTags } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Post created successfully", newPost },
      { status: 201 }
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

//@description     Get all post for home feed
//@route           GET /api/posts
//@access          Not protected
export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const sort = req.nextUrl.searchParams.get("sort") || "latest";

    const skip = (page - 1) * limit;

    let where = { NOT: { type: "DRAFT" as const } };
    let orderBy: any = { createdAt: "desc" };
    let takeLimit = limit;
    let totalPages = 1;
    let totalPostsCount = 0;

    if (sort === "trending") {
      orderBy = { views: "desc" };
      takeLimit = 3; // Top 3 most viewed
      totalPostsCount = 3;
      totalPages = 1;
    } else if (sort === "latest") {
      orderBy = { createdAt: "desc" };
      takeLimit = 3; // Top 3 latest
      totalPostsCount = 3;
      totalPages = 1;
    } else {
      totalPostsCount = await prisma.post.count({ where });
      totalPages = Math.ceil(totalPostsCount / limit);
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        saved: {
          select: {
            id: true,
            userId: true,
          },
        },
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: { select: { comments: true } },
        tags: true,
      },
      skip: sort === "trending" ? 0 : skip,
      take: takeLimit,
    });

    // Replace null avatars with placeholder
    const placeholderImage = "https://res.cloudinary.com/dayo1mpv0/image/upload/v1683686792/default/profile.jpg";
    const processedPosts = posts.map(post => ({
      ...post,
      author: {
        ...post.author,
        avatar: post.author.avatar || placeholderImage,
      },
    }));

    return NextResponse.json(
      { posts: processedPosts, totalPages, currentPage: page },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("GET /api/posts error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
