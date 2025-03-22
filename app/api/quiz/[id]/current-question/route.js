// app/api/quiz/[id]/current-question/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";

export async function GET(request, { params }) {
  try {
    // Access id directly without destructuring
    const id = params.id;
    const quizId = String(id || '');
    
    await connectToDatabase();
    
    console.log(`Getting current question for quiz: ${quizId}`);
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      console.log(`Quiz not found: ${quizId}`);
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    if (quiz.status !== 'active') {
      console.log(`Quiz is not active: ${quizId}, status: ${quiz.status}`);
      return NextResponse.json(
        { success: false, message: `Quiz is in ${quiz.status} status` },
        { status: 400 }
      );
    }
    
    if (quiz.questions.length === 0) {
      console.log(`No questions for quiz: ${quizId}`);
      return NextResponse.json(
        { success: false, message: "No questions available" },
        { status: 400 }
      );
    }
    
    const currentQuestionIndex = quiz.currentQuestionIndex || 0;
    console.log(`Current question index: ${currentQuestionIndex}`);
    
    if (currentQuestionIndex >= quiz.questions.length) {
      console.log(`Invalid question index: ${currentQuestionIndex}`);
      return NextResponse.json(
        { success: false, message: "Invalid question index" },
        { status: 400 }
      );
    }
    
    const question = await Question.findById(quiz.questions[currentQuestionIndex]);
    
    if (!question) {
      console.log(`Question not found for index ${currentQuestionIndex}`);
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }
    
    // Return a safe version without the correct answer
    const safeQuestion = {
      id: question._id,
      text: question.text,
      options: question.options,
      timeLimit: question.timeLimit,
      questionNumber: currentQuestionIndex + 1,
      totalQuestions: quiz.questions.length
    };
    
    console.log(`Returning question: ${safeQuestion.id}`);
    
    return NextResponse.json({
      success: true,
      data: safeQuestion
    });
  } catch (error) {
    console.error("Error getting current question:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get current question" },
      { status: 500 }
    );
  }
}