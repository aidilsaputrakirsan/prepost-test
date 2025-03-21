// app/api/quiz/[id]/next-question/route.js
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
    
    // Check if quiz is active
    if (quiz.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Quiz is not active" },
        { status: 400 }
      );
    }
    
    // Get current index and increment
    const currentIndex = quiz.currentQuestionIndex;
    const nextIndex = currentIndex + 1;
    
    // Check if we've reached the end of questions
    if (nextIndex >= quiz.questions.length) {
      // End the quiz
      quiz.status = 'finished';
      quiz.endTime = new Date();
      await quiz.save();
      
      // Trigger quiz ended event
      await pusher.trigger(
        channelNames.quiz(quizId),
        eventNames.quizEnded,
        { status: 'finished' }
      );
      
      return NextResponse.json({
        success: true,
        data: {
          quizId,
          status: 'finished',
          message: 'Quiz completed'
        }
      });
    }
    
    // Move to next question
    quiz.currentQuestionIndex = nextIndex;
    await quiz.save();
    
    // Get next question
    const question = await Question.findById(quiz.questions[nextIndex]);
    
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
      questionNumber: nextIndex + 1,
      totalQuestions: quiz.questions.length
    };
    
    // Send next question
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
          { questionIndex: nextIndex }
        );
      }
    }, 1000);
    
    return NextResponse.json({
      success: true,
      data: {
        quizId,
        status: 'active',
        currentQuestionIndex: nextIndex
      }
    });
  } catch (error) {
    console.error("Error moving to next question:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to move to next question" },
      { status: 500 }
    );
  }
}