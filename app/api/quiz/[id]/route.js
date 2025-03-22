// app/api/quiz/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question"; 

// Get quiz by ID
export async function GET(request, { params }) {
  try {
    // Properly destructure and handle the ID parameter
    const { id } = params;
    const quizId = String(id || '');
    
    await connectToDatabase();
    
    // First, find the quiz without populating to check if it exists
    const quizExists = await QuizState.findById(quizId);
    
    if (!quizExists) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Then populate if it exists
    const quiz = await QuizState.findById(quizId)
      .populate('questions')
      .exec();
    
    // Don't send correct answers to clients
    const safeQuiz = {
      _id: quiz._id,
      status: quiz.status,
      currentQuestionIndex: quiz.currentQuestionIndex,
      questionCount: quiz.questions ? quiz.questions.length : 0,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      participantCount: quiz.participants ? quiz.participants.length : 0
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