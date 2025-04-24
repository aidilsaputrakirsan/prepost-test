// app/api/quiz/[id]/answer-count/[questionId]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Answer from "@/app/models/Answer";
import QuizState from "@/app/models/QuizState";

export async function GET(request, { params }) {
  try {
    const quizId = params.id;
    const questionId = params.questionId;
    
    if (!quizId || !questionId) {
      return NextResponse.json(
        { success: false, message: "Quiz ID and Question ID are required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the quiz to get total participants
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    const participantCount = quiz.participants?.length || 0;
    
    // Find answers for this question
    const answers = await Answer.find({
      quiz: quizId,
      question: questionId
    });
    
    // Count unique users who answered
    const uniqueRespondents = new Set();
    answers.forEach(answer => {
      uniqueRespondents.add(answer.user.toString());
    });
    
    const answeredCount = uniqueRespondents.size;
    
    // Determine if all have answered (at least 90% for large groups)
    const allAnswered = participantCount > 0 && 
                      (answeredCount >= participantCount || 
                       (participantCount > 5 && answeredCount >= Math.ceil(participantCount * 0.9)));
    
    return NextResponse.json({
      success: true,
      data: {
        participantCount,
        answeredCount,
        allAnswered,
        questionId
      }
    });
  } catch (error) {
    console.error("Error getting answer count:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get answer count" },
      { status: 500 }
    );
  }
}