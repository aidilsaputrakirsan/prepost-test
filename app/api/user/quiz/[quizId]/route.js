// app/api/user/quiz/[quizId]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

// Get participants for a quiz
export async function GET(request, { params }) {
  try {
    // Access parameter directly without destructuring
    const quizId = String(params?.quizId || '');
    const session = await getServerSession(authOptions);
    
    console.log(`Getting participants for quiz: ${quizId}, user: ${session?.user?.id}`);
    
    if (!session) {
      console.log("No session found, returning 401");
      return NextResponse.json(
        { success: false, message: "Not authenticated", data: [] },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      console.log(`Quiz not found: ${quizId}`);
      return NextResponse.json(
        { success: false, message: "Quiz not found", data: [] },
        { status: 404 }
      );
    }
    
    console.log(`Found quiz with ${quiz.participants?.length || 0} participants`);
    
    // Return empty array if no participants (don't use 404)
    if (!quiz.participants || quiz.participants.length === 0) {
      console.log("No participants found, returning empty array");
      return NextResponse.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    const participants = await User.find({ _id: { $in: quiz.participants } })
      .select('name score')
      .exec();
    
    console.log(`Found ${participants.length} participant documents`);
    
    return NextResponse.json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.error("Error getting participants:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get participants", data: [] },
      { status: 500 }
    );
  }
}