// app/api/quiz/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get quiz by ID
export async function GET(request, { params }) {
  try {
    const quizId = params.id;
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId)
      .populate('questions')
      .exec();
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Don't send correct answers to clients
    const safeQuiz = {
      _id: quiz._id,
      status: quiz.status,
      currentQuestionIndex: quiz.currentQuestionIndex,
      questionCount: quiz.questions.length,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      participantCount: quiz.participants.length
    };
    
    return NextResponse.json({
      success: true,
      data: safeQuiz
    });
  } catch (error) {
    console.error("Error getting quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get quiz" },
      { status: 500 }
    );
  }
}