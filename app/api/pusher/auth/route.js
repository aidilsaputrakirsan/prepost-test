// app/api/pusher/auth/route.js
import { NextResponse } from "next/server";
import { pusher } from "@/app/lib/pusher";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const data = await request.formData();
    const socketId = data.get('socket_id');
    const channel = data.get('channel_name');
    
    // Extra validation for private channels
    if (channel.startsWith('private-')) {
      const channelParts = channel.split('-');
      
      // For admin channels, check if user is admin
      if (channelParts[1] === 'admin' && !session.user.isAdmin) {
        return NextResponse.json(
          { success: false, message: "Not authorized for admin channel" },
          { status: 403 }
        );
      }
      
      // For quiz channels, check if user is part of quiz
      if (channelParts[1] === 'quiz') {
        const quizId = channelParts[2];
        
        if (session.user.currentQuiz !== quizId && !session.user.isAdmin) {
          return NextResponse.json(
            { success: false, message: "Not authorized for this quiz channel" },
            { status: 403 }
          );
        }
      }
    }
    
    // Generate auth signature
    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        isAdmin: session.user.isAdmin
      }
    });
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}