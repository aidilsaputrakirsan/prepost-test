// app/api/quiz/[id]/leaderboard/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Leaderboard from "@/app/models/Leaderboard";
import QuizState from "@/app/models/QuizState";
import Answer from "@/app/models/Answer";
import User from "@/app/models/User";
import Question from "@/app/models/Question";

export async function GET(request, { params }) {
  try {
    // Access id directly without destructuring
    const id = params.id;
    const quizId = String(id || '');
    
    await connectToDatabase();
    
    console.log(`Getting leaderboard for quiz: ${quizId}`);
    
    // Try to find existing leaderboard
    let leaderboard = await Leaderboard.findOne({ quiz: quizId })
      .populate('entries.user', 'name')
      .exec();
    
    // If no leaderboard exists, calculate it
    if (!leaderboard) {
      console.log("No existing leaderboard, creating one");
      
      const quiz = await QuizState.findById(quizId)
        .populate('questions participants')
        .exec();
      
      if (!quiz) {
        return NextResponse.json(
          { success: false, message: "Quiz not found" },
          { status: 404 }
        );
      }
      
      // Get answers
      const answers = await Answer.find({ quiz: quizId }).exec();
      console.log(`Found ${answers.length} answers`);
      
      // Get participants
      const participants = await User.find({ 
        _id: { $in: quiz.participants } 
      }).select('_id name score');
      console.log(`Found ${participants.length} participants`);
      
      // Calculate scores
      const entries = [];
      
      for (const participant of participants) {
        const userAnswers = answers.filter(answer => 
          answer.user.toString() === participant._id.toString()
        );
        
        const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
        const totalResponseTime = userAnswers.reduce((total, answer) => total + answer.responseTime, 0);
        const averageResponseTime = userAnswers.length > 0 ? totalResponseTime / userAnswers.length : 0;
        
        // Calculate score
        const baseScore = correctAnswers * 100;
        
        // Speed bonus
        const speedBonus = userAnswers.reduce((bonus, answer) => {
          if (answer.isCorrect) {
            // Find the question
            const question = quiz.questions.find(q => 
              q._id.toString() === answer.question.toString()
            );
            
            // Default to 15 seconds if question not found
            const timeLimit = question ? question.timeLimit * 1000 : 15000;
            
            return bonus + Math.max(0, Math.round(50 * (1 - (answer.responseTime / timeLimit))));
          }
          return bonus;
        }, 0);
        
        // Calculate total score
        const totalScore = baseScore + speedBonus;
        
        const entry = {
          user: participant._id,
          userId: participant._id.toString(),
          name: participant.name,
          score: totalScore,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          averageResponseTime
        };
        
        entries.push(entry);
        
        // Update user's score
        await User.findByIdAndUpdate(participant._id, { 
          score: totalScore
        });
      }
      
      // Sort by score
      entries.sort((a, b) => b.score - a.score);
      
      // Create temporary leaderboard
      leaderboard = {
        quiz: quizId,
        entries: entries
      };
      
      // Save leaderboard
      try {
        console.log("Saving leaderboard to database");
        await Leaderboard.create({
          quiz: quizId,
          entries: entries
        });
      } catch (error) {
        console.warn('Could not save leaderboard:', error.message);
      }
    } else {
      console.log("Using existing leaderboard");
    }
    
    return NextResponse.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}