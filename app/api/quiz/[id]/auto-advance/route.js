// app/api/quiz/[id]/auto-advance/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { moveToNextQuestion } from "../next-question/route";

// This endpoint will be called by a scheduled client-side request
// to advance to the next question, working around Vercel's function timeouts
export async function POST(request, { params }) {
  try {
    const quizId = params.id;
    
    // Check if this is an admin request or an auto-advance request
    const { autoAdvanceToken } = await request.json().catch(() => ({}));
    const isAutoAdvance = autoAdvanceToken === process.env.NEXTAUTH_SECRET;
    
    // For admin requests, require authentication
    if (!isAutoAdvance) {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user.isAdmin) {
        return NextResponse.json(
          { success: false, message: "Not authorized" },
          { status: 403 }
        );
      }
    }
    
    console.log(`Auto-advancement triggered for quiz ${quizId} (token: ${isAutoAdvance ? 'valid' : 'admin'})`);
    
    // Check if quiz exists and is active
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    if (quiz.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Quiz is not active" },
        { status: 400 }
      );
    }
    
    // Trigger the next question
    const success = await moveToNextQuestion(quizId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to move to next question" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        quizId,
        status: 'advanced',
        message: 'Successfully advanced to next question'
      }
    });
  } catch (error) {
    console.error("Error in auto-advance:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to auto-advance" },
      { status: 500 }
    );
  }
}