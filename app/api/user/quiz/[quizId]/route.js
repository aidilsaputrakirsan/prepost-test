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
    const quizId = params.quizId;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
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
    
    const participants = await User.find({ _id: { $in: quiz.participants } })
      .select('name score')
      .exec();
    
    return NextResponse.json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.error("Error getting participants:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get participants" },
      { status: 500 }
    );
  }
}
