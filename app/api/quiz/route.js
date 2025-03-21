// app/api/quiz/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// Get all quizzes (admin only)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    const quizzes = await QuizState.find({})
      .select('_id status createdAt participants questions')
      .sort({ createdAt: -1 })
      .exec();
    
    const formattedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      status: quiz.status,
      createdAt: quiz.createdAt,
      participantCount: quiz.participants ? quiz.participants.length : 0,
      questionCount: quiz.questions ? quiz.questions.length : 0
    }));
    
    return NextResponse.json({
      success: true,
      count: formattedQuizzes.length,
      data: formattedQuizzes
    });
  } catch (error) {
    console.error("Error getting quizzes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get quizzes" },
      { status: 500 }
    );
  }
}

// Create a new quiz (admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
    
    const { quizId } = await request.json();
    
    await connectToDatabase();
    
    // Get custom ID or generate random ID
    const customId = quizId || `quiz${Math.floor(Math.random() * 10000)}`;
    
    // Check if quiz already exists
    const existingQuiz = await QuizState.findById(customId);
    if (existingQuiz) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Quiz with ID ${customId} already exists. Please use a different ID.` 
        },
        { status: 400 }
      );
    }
    
    // Create a new quiz
    const quiz = await QuizState.create({
      _id: customId,
      status: 'waiting',
      questions: []
    });
    
    return NextResponse.json(
      { success: true, data: quiz },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create quiz" },
      { status: 500 }
    );
  }
}