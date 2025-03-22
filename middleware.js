// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const adminPaths = [
    "/admin/panel",
    "/admin/create-question",
    "/admin/participants",
    "/admin/control",
    "/admin/leaderboard",
    "/admin/results",
  ];
  
  const userProtectedRoutes = [
    "/waiting-room",
    "/quiz",
    "/results",
    "/leaderboard",
  ];
  
  const apiAdminRoutes = [
    "/api/quiz",
  ];

  // Allow access to API endpoints that need custom auth
  const publicApiEndpoints = [
    "/api/user",              // For participant creation
    "/api/quiz/answer",       // For submitting answers
    "/api/quiz/*/current-question"  // For getting the current question
  ];
  
  // Check if it's a public API endpoint
  const isPublicApi = publicApiEndpoints.some(endpoint => {
    if (endpoint.includes('*')) {
      const pattern = new RegExp(endpoint.replace('*', '.*'));
      return pattern.test(pathname);
    }
    return pathname === endpoint;
  });
  
  if (isPublicApi && request.method === "POST" || 
      pathname.includes('/current-question') && request.method === "GET") {
    return NextResponse.next();
  }
  
  // Check admin routes
  const isAdminRoute = adminPaths.some(path => pathname.includes(path)) || 
                       pathname.startsWith("/panel") || 
                       pathname.startsWith("/create-question") ||
                       pathname.startsWith("/participants") ||
                       pathname.startsWith("/control");
                      
  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Check user protected routes - more permissive to allow localStorage auth
  if (userProtectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for client-side stored participant data
    const hasLocalStorage = request.headers.get('x-has-local-storage') === 'true';
    const participantId = request.headers.get('x-participant-id');
    
    // If no token and no localStorage headers, let the page handle auth
    // The client-side will check localStorage and redirect if needed
    if (!token && !hasLocalStorage && !participantId) {
      // No middleware redirect - client will handle redirection
      return NextResponse.next();
    }
  }
  
  // Check admin API routes
  if (apiAdminRoutes.some(route => pathname.startsWith(route)) && 
      !pathname.includes('/current-question') && 
      request.method !== "GET") {
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
    "/api/:path*",
  ],
};