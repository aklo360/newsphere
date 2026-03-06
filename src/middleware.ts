import { NextRequest, NextResponse } from "next/server";

// Routes that require password protection
const PROTECTED_ROUTES = ["/dashboard", "/import", "/create", "/account", "/brand"];

// Routes that are always public
const PUBLIC_ROUTES = ["/", "/api/waitlist", "/access"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // API routes for the app (extract, extract-pdf) should also be protected
  const isProtectedAPI = pathname.startsWith("/api/") && 
    !pathname.startsWith("/api/waitlist");
  
  if (!isProtected && !isProtectedAPI) {
    return NextResponse.next();
  }

  // Check for access cookie
  const accessCookie = request.cookies.get("newsphere-access");
  
  if (accessCookie?.value === process.env.ACCESS_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to access page
  const accessUrl = new URL("/access", request.url);
  accessUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|og-image.jpg|.*\\.svg$).*)",
  ],
};
