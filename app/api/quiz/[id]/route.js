// app/api/quiz/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import Answer from "@/app/models/Answer";
import Leaderboard from "@/app/models/Leaderboard";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get quiz by ID
export async function GET(request, { params }) {
  try {
    // Properly handle the ID parameter - don't destructure directly
    const quizId = String(params.id || '');
    
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

// Add this DELETE method to your existing file
export async function DELETE(request, { params }) {
  try {
    // Access the quiz ID from params
    const quizId = String(params.id || '');
    
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    // Find the quiz to verify it exists
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Perform cascading deletion of all associated data
    
    // 1. Delete all questions associated with this quiz
    if (quiz.questions && quiz.questions.length > 0) {
      await Question.deleteMany({
        _id: { $in: quiz.questions }
      });
    }
    
    // 2. Delete all answers associated with this quiz
    await Answer.deleteMany({ quiz: quizId });
    
    // 3. Delete leaderboard data
    await Leaderboard.deleteOne({ quiz: quizId });
    
    // 4. Remove quiz references from users
    await User.updateMany(
      { currentQuiz: quizId },
      { $set: { currentQuiz: null, score: 0 } }
    );
    
    // 5. Finally, delete the quiz itself
    await QuizState.findByIdAndDelete(quizId);
    
    return NextResponse.json({
      success: true,
      message: "Quiz and all associated data deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete quiz" },
      { status: 500 }
    );
  }
}