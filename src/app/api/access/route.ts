import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (password === process.env.ACCESS_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set cookie that expires in 30 days
      response.cookies.set("newsphere-access", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      
      return response;
    }
    
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
