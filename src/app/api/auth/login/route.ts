import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const reqBody = await req.json();
    const { email, password } = reqBody;

    const user = await prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found!" },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 400 }
      );
    }

    const tokenData = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    };

    const token = await jwt.sign(tokenData, process.env.JWT_SECRET!, {
      expiresIn: "30 days",
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as "lax" | "strict" | "none",
      path: "/",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const response = NextResponse.json(
      { 
        success: true, 
        message: "Login successful",
        user: { id: user.id, name: user.name, username: user.username, email: user.email }
      },
      { status: 200 }
    );
    response.cookies.set("token", token, options);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
