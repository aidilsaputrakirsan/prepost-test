// app/api/quiz/[id]/next-question/route.js - Perbaikan untuk pertanyaan yang tidak dijawab
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import Answer from "@/app/models/Answer"; // Tambahkan import Answer
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
    // Bisa berupa interval atau timeout
    const timerIds = activeTimers.get(quizId);
    
    if (Array.isArray(timerIds)) {
      // Jika array, clear semua timer IDs
      timerIds.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
    } else {
      // Jika single ID, clear timer
      clearTimeout(timerIds);
      clearInterval(timerIds);
    }
    
    activeTimers.delete(quizId);
    console.log(`Cleared existing timer(s) for quiz ${quizId}`);
  }
};

// BARU: Fungsi untuk membuat jawaban otomatis bagi peserta yang tidak menjawab
async function createMissingAnswers(quizId, questionId, timeLimit) {
  try {
    console.log(`Creating default answers for participants who didn't answer question ${questionId}`);
    
    // Dapatkan semua peserta quiz
    const quiz = await QuizState.findById(quizId);
    if (!quiz || !quiz.participants) return;
    
    // Dapatkan peserta yang sudah menjawab
    const submittedAnswers = await Answer.find({
      quiz: quizId,
      question: questionId
    });
    
    // Buat Set dari ID peserta yang sudah menjawab
    const answeredParticipants = new Set();
    submittedAnswers.forEach(answer => {
      answeredParticipants.add(answer.user.toString());
    });
    
    // Temukan peserta yang belum menjawab
    const missingParticipants = quiz.participants.filter(
      participantId => !answeredParticipants.has(participantId.toString())
    );
    
    console.log(`Found ${missingParticipants.length} participants who didn't answer`);
    
    // Buat jawaban default untuk peserta yang tidak menjawab
    if (missingParticipants.length > 0) {
      const defaultAnswers = missingParticipants.map(participantId => ({
        user: participantId,
        quiz: quizId,
        question: questionId,
        selectedOption: -1, // -1 menandakan tidak ada jawaban
        isCorrect: false,
        responseTime: timeLimit * 1000 // Waktu maksimal
      }));
      
      // Simpan ke database
      await Answer.insertMany(defaultAnswers);
      console.log(`Created ${defaultAnswers.length} default answers for missing participants`);
    }
  } catch (error) {
    console.error(`Error creating missing answers:`, error);
  }
}

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
    
    // BARU: Pertama, buat jawaban kosong untuk peserta yang belum menjawab
    if (currentIndex >= 0 && currentIndex < quiz.questions.length) {
      const currentQuestionId = quiz.questions[currentIndex];
      
      // Ambil timeLimit untuk perhitungan response time
      const currentQuestion = await Question.findById(currentQuestionId);
      const timeLimit = currentQuestion ? currentQuestion.timeLimit : 15; // Default 15 detik jika tidak ditemukan
      
      // Buat jawaban otomatis untuk peserta yang tidak menjawab
      await createMissingAnswers(quizId, currentQuestionId, timeLimit);
    }
    
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
    // Set start time untuk pertanyaan ini
    quiz.questionStartTime = new Date();
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
    
    // Reset timer dulu dengan initial value sebelum mengirim event pertanyaan baru
    await pusher.trigger(
      channelNames.quiz(quizId),
      eventNames.timerUpdate,
      { timeLeft: question.timeLimit }
    );
    
    // Delay pengiriman pertanyaan untuk memastikan reset timer telah diterima
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Send next question
    await pusher.trigger(
      channelNames.quiz(quizId),
      eventNames.questionSent,
      safeQuestion
    );
    
    // Also send the explicit next-question event for better client handling
    await pusher.trigger(
      channelNames.quiz(quizId),
      'next-question',
      { 
        questionId: question._id,
        message: 'New question is available'
      }
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
    
    // Array untuk menyimpan semua timer IDs
    const timerIds = [];
    
    // Save quiz metadata
    quizMetadata.set(quizId, {
      currentQuestionIndex: questionIndex,
      autoAdvance: true,
      startTime: Date.now(),
      timeLimit: timeLimit
    });
    
    console.log(`Setting up auto-advancement for quiz ${quizId} with ${timeLimit} seconds`);
    
    // Start timer
    let timeLeft = timeLimit;
    
    // Set interval for timer updates
    const timerInterval = setInterval(async () => {
      timeLeft -= 1;
      
      try {
        // Kirim timer update dengan throttling (untuk mengurangi event duplikat)
        // Hanya kirim pada detik tertentu atau setiap detik jika di bawah 10 detik
        const importantSeconds = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120];
        
        if (timeLeft <= 10 || importantSeconds.includes(timeLeft)) {
          await pusher.trigger(
            channelNames.quiz(quizId),
            eventNames.timerUpdate,
            { timeLeft }
          );
        }
      } catch (e) {
        console.error("Error sending timer update:", e);
      }
      
      // When timer ends
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        
        try {
          // Let admin know time is up for this question
          await pusher.trigger(
            channelNames.admin(quizId),
            'question-time-up',
            { questionIndex }
          );
          
          // Notify clients that time is up
          await pusher.trigger(
            channelNames.quiz(quizId),
            'time-up',
            { 
              questionIndex,
              nextAction: 'auto-advance'
            }
          );
        } catch (e) {
          console.error("Error sending time-up notification:", e);
        }
        
        console.log(`Timer expired for quiz ${quizId}, scheduling auto-advancement`);
        
        // BARU: Segera lanjutkan ke pertanyaan berikutnya setelah delay singkat (3 detik)
        try {
          const delayTimer = setTimeout(async () => {
            // Cek metadata quiz untuk auto-advance
            const metadata = quizMetadata.get(quizId) || {};
            if (metadata.autoAdvance) {
              const success = await moveToNextQuestion(quizId);
              console.log(`Auto-advancement to next question: ${success ? 'successful' : 'failed'}`);
            }
          }, 3000); // Setelah 3 detik, lanjutkan ke pertanyaan berikutnya
          
          // Tambahkan timer ID ke array
          timerIds.push(delayTimer);
        } catch (e) {
          console.error("Error scheduling auto advancement:", e);
        }
      }
    }, 1000);
    
    // Store timer IDs so we can clear them if needed
    timerIds.push(timerInterval);
    activeTimers.set(quizId, timerIds);
    
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