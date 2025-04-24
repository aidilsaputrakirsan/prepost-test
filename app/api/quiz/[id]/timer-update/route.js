// app/api/quiz/[id]/timer-update/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";

// Hapus dependensi pada event database untuk timer - gunakan perhitungan waktu yang lebih tepat
export async function GET(request, { params }) {
  try {
    const quizId = params.id;
    
    await connectToDatabase();
    
    // Dapatkan data quiz termasuk waktu mulai pertanyaan saat ini
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Jika quiz tidak active, kembalikan status
    if (quiz.status !== 'active') {
      return NextResponse.json({
        success: true,
        data: {
          quizStatus: quiz.status,
          timeLeft: 0
        }
      });
    }
    
    // Jika tidak ada questionStartTime, atur ke waktu mulai quiz
    const questionStartTime = quiz.questionStartTime || quiz.startTime;
    
    // Jika tidak ada current question, return error
    if (quiz.currentQuestionIndex === undefined || !quiz.questions || quiz.currentQuestionIndex >= quiz.questions.length) {
      return NextResponse.json(
        { success: false, message: "No active question" },
        { status: 400 }
      );
    }
    
    // Ambil current question dan time limit
    const currentQuestionId = quiz.questions[quiz.currentQuestionIndex];
    
    // Ambil time limit untuk current question (dalam detik)
    const Question = (await import('@/app/models/Question')).default;
    const question = await Question.findById(currentQuestionId);
    
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }
    
    const timeLimit = question.timeLimit; // dalam detik
    
    // Hitung waktu berlalu sejak questionStartTime
    const now = new Date();
    const elapsedSeconds = Math.floor((now - questionStartTime) / 1000);
    
    // Hitung sisa waktu
    const timeLeft = Math.max(0, timeLimit - elapsedSeconds);
    
    // Kembalikan informasi timer
    return NextResponse.json({
      success: true,
      data: {
        timeLeft,
        timeLimit,
        questionId: currentQuestionId,
        questionNumber: quiz.currentQuestionIndex + 1,
        totalQuestions: quiz.questions.length,
        elapsedSeconds,
        serverTime: now.toISOString()
      }
    });
    
  } catch (error) {
    console.error("Error getting timer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get timer" },
      { status: 500 }
    );
  }
}