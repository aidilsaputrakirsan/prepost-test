// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const adminRoutes = [
    "/admin",
    "/admin/panel",
    "/admin/create-question",
    "/admin/participants",
    "/admin/control",
  ];
  
  const userProtectedRoutes = [
    "/waiting-room",
    "/quiz",
    "/results",
    "/leaderboard",
  ];
  
  const apiAdminRoutes = [
    "/api/quiz",
    "/api/user",
  ];

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Check user protected routes
  if (userProtectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Check admin API routes
  if (apiAdminRoutes.some(route => pathname.startsWith(route)) && request.method !== "GET") {
    if (!token || !token.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    // User protected routes
    "/waiting-room/:path*",
    "/quiz/:path*",
    "/results/:path*",
    "/leaderboard/:path*",
    // API routes that need protection
    "/api/quiz/:path*",
    "/api/user/:path*",
  ],
};