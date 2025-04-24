// app/api/quiz/answer/route.js - Tambahan penanganan jawaban kosong
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Answer from "@/app/models/Answer";
import Question from "@/app/models/Question";
import User from "@/app/models/User";
import QuizState from "@/app/models/QuizState";
import { pusher, channelNames } from "@/app/lib/pusher";

export async function POST(request) {
  try {
    // Get data from request
    const data = await request.json();
    const { quizId, questionId, selectedOption, responseTime } = data;
    
    // Get participant ID from custom header
    const participantId = request.headers.get('x-participant-id');
    
    // Debug logs
    console.log("Answer submission received:", { 
      quizId, 
      questionId, 
      selectedOption, 
      responseTime,
      participantId: participantId || 'Not provided'
    });
    
    if (!participantId) {
      console.log("No participant ID found in headers");
      return NextResponse.json(
        { success: false, message: "Not authorized - missing participant ID" },
        { status: 401 }
      );
    }
    
    // Validate input - Perbaikan: Terima selectedOption = -1 untuk jawaban kosong
    if (selectedOption === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Get question to check if the answer is correct
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }
    
    // Check if answer is correct - Jawaban -1 (kosong) selalu salah
    const isCorrect = selectedOption !== -1 && selectedOption === question.correctOption;
    console.log(`Answer is ${isCorrect ? 'correct' : 'incorrect'}, selected: ${selectedOption}, correct: ${question.correctOption}`);
    
    // Look up quiz to get participant count
    const quiz = await QuizState.findById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    const participantCount = quiz.participants?.length || 0;
    
    // Save the answer
    let answer;
    try {
      // Check if this participant already answered this question
      const existingAnswer = await Answer.findOne({
        user: participantId,
        quiz: quizId,
        question: questionId
      });
      
      if (existingAnswer) {
        console.log("Participant already answered this question, updating answer");
        existingAnswer.selectedOption = selectedOption;
        existingAnswer.isCorrect = isCorrect;
        existingAnswer.responseTime = responseTime;
        answer = await existingAnswer.save();
      } else {
        answer = await Answer.create({
          user: participantId,
          quiz: quizId,
          question: questionId,
          selectedOption,
          isCorrect,
          responseTime
        });
      }
      
      console.log("Answer saved to database:", answer._id);
    } catch (err) {
      console.error("Error saving answer:", err);
      // Continue even if saving fails - we'll still return correct/incorrect
    }
    
    // Update user score - partial update for immediate feedback
    // PENTING: Hanya berikan poin jika jawaban benar
    try {
      if (isCorrect) {
        const baseScore = 100; // Base score for correct answer
        
        // Speed bonus (faster answer = more points)
        const timeLimit = question.timeLimit * 1000; // Convert to ms
        const speedBonus = Math.max(0, Math.round(50 * (1 - (responseTime / timeLimit))));
        
        const totalScore = baseScore + speedBonus;
        console.log(`Updating user ${participantId} score with +${totalScore} points`);
        
        // Update the user's score - increment instead of set
        const updatedUser = await User.findByIdAndUpdate(
          participantId, 
          { $inc: { score: totalScore } },
          { new: true }
        );
        
        console.log(`User score updated, new score: ${updatedUser.score}`);
      } else {
        console.log(`Answer is incorrect or empty, no points awarded`);
      }
    } catch (err) {
      console.error("Error updating user score:", err);
      // Continue even if score update fails
    }
    
    // Get all answers for this question to see how many have answered
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
    
    // Check if all participants have answered
    const allAnswered = participantCount > 0 && 
                        (answeredCount >= participantCount || 
                        (participantCount > 5 && answeredCount >= Math.ceil(participantCount * 0.9)));
    
    // Notify clients about the new answer count
    try {
      await pusher.trigger(
        channelNames.quiz(quizId),
        'participant-answered',
        {
          questionId,
          answeredCount,
          participantCount,
          allAnswered
        }
      );
      
      // Also send to the admin channel
      await pusher.trigger(
        channelNames.admin(quizId),
        'participant-answered',
        {
          questionId,
          answeredCount,
          participantCount,
          allAnswered,
          participantId
        }
      );
      
      console.log(`Notified participants and admin about new answer count: ${answeredCount}/${participantCount}`);
    } catch (err) {
      console.error("Error triggering Pusher event:", err);
      // Continue even if notification fails
    }
    
    // Return result with correct answer for feedback
    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        selectedOption,
        correctOption: question.correctOption,
        responseTime
      }
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit answer" },
      { status: 500 }
    );
  }
}