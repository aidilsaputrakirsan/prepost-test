// app/api/quiz/[id]/start/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { pusher, channelNames, eventNames } from "@/app/lib/pusher";

export async function POST(request, { params }) {
  try {
    const quizId = params.id;
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
    
    // Check if the quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cannot start quiz without questions" },
        { status: 400 }
      );
    }
    
    // Update quiz status
    quiz.status = 'active';
    quiz.startTime = new Date();
    quiz.currentQuestionIndex = 0;
    await quiz.save();
    
    // Get first question
    const question = await Question.findById(quiz.questions[0]);
    
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }
    
    // Format question for participants (hide correct answer)
    const safeQuestion = {
      id: question._id,
      text: question.text,
      options: question.options,
      timeLimit: question.timeLimit,
      questionNumber: 1,
      totalQuestions: quiz.questions.length
    };
    
    // Trigger Pusher event to notify participants
    await pusher.trigger(
      channelNames.quiz(quizId),
      eventNames.quizStarted,
      { status: 'active' }
    );
    
    // Send first question after a short delay
    setTimeout(async () => {
      await pusher.trigger(
        channelNames.quiz(quizId),
        eventNames.questionSent,
        safeQuestion
      );
      
      // Start timer
      let timeLeft = question.timeLimit;
      const timerInterval = setInterval(async () => {
        timeLeft -= 1;
        
        // Send timer update
        await pusher.trigger(
          channelNames.quiz(quizId),
          eventNames.timerUpdate,
          { timeLeft }
        );
        
        // When timer ends
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          
          // Let admin know time is up for this question
          await pusher.trigger(
            channelNames.admin(quizId),
            'question-time-up',
            { questionIndex: 0 }
          );
        }
      }, 1000);
    }, 2000);
    
    return NextResponse.json({
      success: true,
      data: {
        quizId,
        status: 'active',
        currentQuestionIndex: 0
      }
    });
  } catch (error) {
    console.error("Error starting quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to start quiz" },
      { status: 500 }
    );
  }
}