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
  ];

  // Allow public access to participant creation endpoint
  if (pathname === "/api/user" && request.method === "POST") {
    console.log("Allowing public access to user creation");
    return NextResponse.next();
  }

  // In middleware.js, ensure the '/api/quiz/answer' path is allowed
  if (pathname === "/api/quiz/answer" && request.method === "POST") {
    console.log("Allowing answer submission");
    return NextResponse.next();
  }
  
  // Check admin routes
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
    // Check for client-side stored participant data
    const hasLocalStorage = request.headers.get('x-has-local-storage') === 'true';
    const participantId = request.headers.get('x-participant-id');
    const quizId = request.headers.get('x-quiz-id');
    
    console.log("Middleware quiz route check:", {
      hasLocalStorage,
      participantId,
      quizId,
      pathname
    });
    
    // Get the quiz ID from the path for redirect purposes
    let pathQuizId = '';
    
    if (pathname.split('/').length >= 3) {
      pathQuizId = pathname.split('/')[2];
    }
    
    // IMPROVED: More flexible checks for authentication
    // We now check headers first, but if headers aren't present, 
    // we'll let the page component handle authentication checks from localStorage
    if (!token && !hasLocalStorage) {
      console.log("No authentication found in headers");
      
      // Only redirect for waiting room and quiz pages that need auth before content load
      // Allow results and leaderboard pages to check auth client-side first
      if (pathname.startsWith('/waiting-room/') || pathname.startsWith('/quiz/')) {
        // If we have a quiz ID in the URL, use it for redirecting
        if (pathQuizId) {
          console.log(`Redirecting to join page with quiz ID: ${pathQuizId}`);
          return NextResponse.redirect(new URL(`/join/${pathQuizId}`, request.url));
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
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
    "/api/:path*",
  ],
};