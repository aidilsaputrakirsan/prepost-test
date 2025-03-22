// app/api/quiz/answer/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Answer from "@/app/models/Answer";
import Question from "@/app/models/Question";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    // Get data from request
    const data = await request.json();
    const { quizId, questionId, selectedOption, responseTime } = data;
    
    // Get participant ID from custom header
    const participantId = request.headers.get('x-participant-id');
    
    if (!participantId) {
      console.log("No participant ID found in headers");
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }
    
    // Validate input
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
    
    // Check if answer is correct
    const isCorrect = selectedOption === question.correctOption;
    
    // Save the answer
    const answer = await Answer.create({
      user: participantId,
      quiz: quizId,
      question: questionId,
      selectedOption,
      isCorrect,
      responseTime
    });
    
    // Update user score - partial update for immediate feedback
    if (isCorrect) {
      try {
        const baseScore = 100; // Base score for correct answer
        
        // Speed bonus (faster answer = more points)
        const timeLimit = question.timeLimit * 1000; // Convert to ms
        const speedBonus = Math.max(0, Math.round(50 * (1 - (responseTime / timeLimit))));
        
        const totalScore = baseScore + speedBonus;
        
        // Update the user's score - increment instead of set
        await User.findByIdAndUpdate(
          participantId, 
          { $inc: { score: totalScore } },
          { new: true }
        );
      } catch (err) {
        console.error("Error updating user score:", err);
        // Continue even if score update fails
      }
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