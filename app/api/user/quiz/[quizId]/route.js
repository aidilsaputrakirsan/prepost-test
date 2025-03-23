// app/api/user/quiz/[quizId]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

// Get participants for a quiz
export async function GET(request, { params }) {
  try {
    // Properly handle the quizId parameter
    const quizId = String(params.quizId || '');
    
    // IMPORTANT: Accept either session auth OR header auth
    const session = await getServerSession(authOptions);
    const headerParticipantId = request.headers.get('x-participant-id');
    const headerQuizId = request.headers.get('x-quiz-id');
    const hasLocalStorage = request.headers.get('x-has-local-storage') === 'true';
    
    console.log(`Getting participants for quiz: ${quizId}`);
    console.log(`Auth info - session: ${session?.user?.id ? 'Yes' : 'No'}, headers: ${headerParticipantId ? 'Yes' : 'No'}`);
    
    // Check if authenticated either via session or headers
    const isAuthenticated = 
      // Admin session
      (session?.user?.isAdmin) || 
      // Valid participant session for this quiz
      (session?.user?.id && session?.user?.currentQuiz === quizId) ||
      // Valid participant header for this quiz
      (headerParticipantId && headerQuizId === quizId && hasLocalStorage);
    
    if (!isAuthenticated) {
      console.log(`Not authenticated for quiz ${quizId}`);
      return NextResponse.json(
        { 
          success: false, 
          message: "Not authenticated",
          authInfo: {
            sessionUser: session?.user?.id ? true : false,
            headerParticipant: headerParticipantId ? true : false,
            quizMatch: session?.user?.currentQuiz === quizId || headerQuizId === quizId
          }
        },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      console.log(`Quiz not found: ${quizId}`);
      return NextResponse.json(
        { success: false, message: "Quiz not found", data: [] },
        { status: 404 }
      );
    }
    
    console.log(`Found quiz with ${quiz.participants?.length || 0} participants`);
    
    // Return empty array if no participants (don't use 404)
    if (!quiz.participants || quiz.participants.length === 0) {
      console.log("No participants found, returning empty array");
      return NextResponse.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    const participants = await User.find({ _id: { $in: quiz.participants } })
      .select('_id name score')
      .exec();
    
    console.log(`Found ${participants.length} participant documents`);
    
    return NextResponse.json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.error("Error getting participants:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get participants", data: [] },
      { status: 500 }
    );
  }
}