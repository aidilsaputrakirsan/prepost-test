// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Debug information
  console.log("Middleware processing:", pathname);
  console.log("User token:", token ? "Present" : "Not present");
  if (token) {
    console.log("User is admin:", token.isAdmin ? "Yes" : "No");
  }

  // Define protected routes
  const adminPaths = [
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

  // Check admin routes - now we need to handle the route group approach
  // Next.js interprets app/(admin)/panel/page.js as /panel in the URL
  // So we need a more flexible check

  // Admin check for route groups
  const isAdminRoute = adminPaths.some(path => pathname.includes(path)) || 
                      pathname.startsWith("/panel") || 
                      pathname.startsWith("/create-question") ||
                      pathname.startsWith("/participants") ||
                      pathname.startsWith("/control");
                      
  if (isAdminRoute) {
    console.log("Admin route detected:", pathname);
    
    if (!token) {
      console.log("Redirecting to login - no token");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (!token.isAdmin) {
      console.log("Redirecting to home - not admin");
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    console.log("Admin access granted for:", pathname);
  }
  
  // Check user protected routes
  if (userProtectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      console.log("Redirecting to home - no token for protected route");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Check admin API routes
  if (apiAdminRoutes.some(route => pathname.startsWith(route)) && request.method !== "GET") {
    if (!token || !token.isAdmin) {
      console.log("API access denied - admin only");
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
  }
  
  // Continue with the request
  console.log("Middleware allowing request");
  return NextResponse.next();
}

// Update the matcher to be more comprehensive
export const config = {
  matcher: [
    // Admin routes with both standard and route group formats
    "/admin/:path*",
    "/panel",
    "/panel/:path*", 
    "/create-question/:path*",
    "/participants/:path*",
    "/control/:path*",
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