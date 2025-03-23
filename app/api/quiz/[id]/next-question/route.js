// app/api/quiz/[id]/next-question/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { pusher, channelNames, eventNames } from "@/app/lib/pusher";

// Global map to store active timers for each quiz
const activeTimers = new Map();

// Store quiz metadata to track auto-advancement state
const quizMetadata = new Map();

// Function to clear any existing timer for a quiz
const clearExistingTimer = (quizId) => {
  if (activeTimers.has(quizId)) {
    const timerId = activeTimers.get(quizId);
    clearTimeout(timerId);
    activeTimers.delete(quizId);
    console.log(`Cleared existing timer for quiz ${quizId}`);
  }
};

// Function to handle moving to the next question automatically
export const moveToNextQuestion = async (quizId) => {
  try {
    console.log(`Auto-advancing quiz ${quizId} to next question`);
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      console.error(`Quiz not found: ${quizId}`);
      return false;
    }
    
    // Check if quiz is active
    if (quiz.status !== 'active') {
      console.error(`Quiz is not active: ${quizId}`);
      return false;
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
      
      // Clear any metadata
      if (quizMetadata.has(quizId)) {
        quizMetadata.delete(quizId);
      }
      
      // Trigger quiz ended event
      await pusher.trigger(
        channelNames.quiz(quizId),
        eventNames.quizEnded,
        { status: 'finished' }
      );
      
      console.log(`Quiz ${quizId} completed - all questions answered`);
      
      return true;
    }
    
    // Move to next question
    quiz.currentQuestionIndex = nextIndex;
    await quiz.save();
    
    // Get next question
    const question = await Question.findById(quiz.questions[nextIndex]);
    
    if (!question) {
      console.error(`Question not found for quiz ${quizId}, index ${nextIndex}`);
      return false;
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
    
    // Set up auto-advancement for the next question
    setupAutoAdvancement(quizId, question.timeLimit, nextIndex);
    
    return true;
  } catch (error) {
    console.error(`Error moving to next question for quiz ${quizId}:`, error);
    return false;
  }
};

// Function to set up auto-advancement with timer
export const setupAutoAdvancement = (quizId, timeLimit, questionIndex) => {
  try {
    // Clear any existing timer
    clearExistingTimer(quizId);
    
    // Save quiz metadata
    quizMetadata.set(quizId, {
      currentQuestionIndex: questionIndex,
      autoAdvance: true,
      startTime: Date.now()
    });
    
    console.log(`Setting up auto-advancement for quiz ${quizId} with ${timeLimit} seconds`);
    
    // Start timer
    let timeLeft = timeLimit;
    
    // Set interval for timer updates
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
          { questionIndex }
        );
        
        // Wait 5 seconds to allow last-moment answers to be submitted
        setTimeout(async () => {
          const metadata = quizMetadata.get(quizId);
          
          // Only auto advance if the setting is enabled and we're still on the same question
          if (metadata && metadata.autoAdvance && metadata.currentQuestionIndex === questionIndex) {
            // Move to next question automatically
            await moveToNextQuestion(quizId);
          }
        }, 5000);
      }
    }, 1000);
    
    // Store timer ID so we can clear it if needed
    activeTimers.set(quizId, timerInterval);
    
    return true;
  } catch (error) {
    console.error(`Error setting up auto-advancement for quiz ${quizId}:`, error);
    return false;
  }
};

// Handle manual next question request
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
    
    // Check if we need to toggle auto-advance
    const { autoAdvance } = await request.json().catch(() => ({}));
    
    // If autoAdvance is explicitly set, update the setting
    if (autoAdvance !== undefined) {
      const metadata = quizMetadata.get(quizId) || {};
      metadata.autoAdvance = autoAdvance;
      quizMetadata.set(quizId, metadata);
      
      console.log(`Auto-advancement for quiz ${quizId} set to: ${autoAdvance}`);
      
      return NextResponse.json({
        success: true,
        data: {
          quizId,
          autoAdvance
        }
      });
    }
    
    // Clear any existing timer
    clearExistingTimer(quizId);
    
    // Move to next question
    const success = await moveToNextQuestion(quizId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to move to next question" },
        { status: 500 }
      );
    }
    
    await connectToDatabase();
    const quiz = await QuizState.findById(quizId);
    
    return NextResponse.json({
      success: true,
      data: {
        quizId,
        status: quiz.status,
        currentQuestionIndex: quiz.currentQuestionIndex
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