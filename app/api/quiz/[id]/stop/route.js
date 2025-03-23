// app/api/quiz/[id]/stop/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { pusher, channelNames, eventNames } from "@/app/lib/pusher";

export async function POST(request, { params }) {
  try {
    const quizId = String(params.id || '');
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 403 }
      );
    }
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Check if quiz is active
    if (quiz.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Quiz is not active" },
        { status: 400 }
      );
    }
    
    // Update quiz status
    quiz.status = 'finished';
    quiz.endTime = new Date();
    await quiz.save();
    
    // Trigger Pusher event to notify participants - send multiple for reliability
    await Promise.all([
      // Standard event
      pusher.trigger(
        channelNames.quiz(quizId),
        eventNames.quizStopped,
        { status: 'finished' }
      ),
      // Duplicate event to improve reliability
      pusher.trigger(
        `quiz-${quizId}`,  // Direct channel name
        'quiz-stopped',    // Direct event name
        { status: 'finished' }
      ),
      // Additional event with slightly different name for redundancy
      pusher.trigger(
        `quiz-${quizId}`,
        'quiz-ended',
        { status: 'finished' }
      )
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        quizId,
        status: 'finished'
      }
    });
  } catch (error) {
    console.error("Error stopping quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to stop quiz" },
      { status: 500 }
    );
  }
}