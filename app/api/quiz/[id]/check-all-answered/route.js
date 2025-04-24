// app/api/quiz/[id]/check-all-answered/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import Answer from "@/app/models/Answer";
import { pusher, channelNames, eventNames } from "@/app/lib/pusher";
import { moveToNextQuestion } from "../next-question/route";

export async function POST(request, { params }) {
  try {
    const quizId = params.id;
    
    // Get question ID from the request body
    const { questionId } = await request.json();
    
    // Get participant ID from header
    const participantId = request.headers.get('x-participant-id');
    
    if (!participantId) {
      return NextResponse.json(
        { success: false, message: "Participant ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Checking if all participants answered question ${questionId} in quiz ${quizId}`);
    
    await connectToDatabase();
    
    // Get the quiz state
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
    
    // Get all participants
    const participantIds = quiz.participants || [];
    const participantCount = participantIds.length;
    
    if (participantCount === 0) {
      return NextResponse.json(
        { success: false, message: "No participants in this quiz" },
        { status: 400 }
      );
    }
    
    // Get all answers for this question
    const answers = await Answer.find({
      quiz: quizId,
      question: questionId
    });
    
    // Count unique participants who have answered
    const uniqueRespondents = new Set();
    answers.forEach(answer => {
      uniqueRespondents.add(answer.user.toString());
    });
    
    const answeredCount = uniqueRespondents.size;
    
    console.log(`${answeredCount} of ${participantCount} participants have answered question ${questionId}`);
    
    // Check if all participants have answered (or at least 90% have answered to prevent edge cases)
    const allAnswered = answeredCount >= participantCount || 
                         (participantCount > 5 && answeredCount >= Math.ceil(participantCount * 0.9));
    
    // If auto-advance is enabled and all participants have answered, move to next question
    if (allAnswered) {
      console.log("All participants have answered, triggering auto-advance");
      
      // Try to auto-advance (only if not the last question)
      const currentIndex = quiz.currentQuestionIndex;
      if (currentIndex < quiz.questions.length - 1) {
        // First, notify all clients that we'll be moving to the next question soon
        await pusher.trigger(
          channelNames.quiz(quizId),
          "preparing-next-question",
          { message: "All participants answered, preparing next question" }
        );
        
        // Then move to the next question
        const success = await moveToNextQuestion(quizId);
        
        if (success) {
          return NextResponse.json({
            success: true,
            data: {
              allAnswered: true,
              message: "All participants answered, moving to next question"
            }
          });
        }
      } else {
        // This was the last question
        console.log("All participants answered the last question");
        
        // End the quiz
        quiz.status = 'finished';
        quiz.endTime = new Date();
        await quiz.save();
        
        // Notify all clients
        await pusher.trigger(
          channelNames.quiz(quizId),
          eventNames.quizEnded,
          { status: 'finished' }
        );
        
        return NextResponse.json({
          success: true,
          data: {
            allAnswered: true,
            message: "All participants answered the last question, quiz finished"
          }
        });
      }
    }
    
    // If not all participants have answered yet, just return the status
    return NextResponse.json({
      success: true,
      data: {
        allAnswered: false,
        answeredCount,
        participantCount,
        message: "Not all participants have answered yet"
      }
    });
  } catch (error) {
    console.error("Error checking if all participants answered:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to check answers" },
      { status: 500 }
    );
  }
}