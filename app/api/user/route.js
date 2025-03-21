// app/api/user/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import QuizState from "@/app/models/QuizState";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// Create a new participant
export async function POST(request) {
  try {
    const { name, quizId } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if quiz exists and is in waiting state
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    if (quiz.status !== 'waiting') {
      return NextResponse.json(
        { success: false, message: "Quiz has already started or finished" },
        { status: 400 }
      );
    }
    
    // Create user (non-admin)
    const user = await User.create({
      name,
      currentQuiz: quizId,
      isAdmin: false
    });
    
    // Add user to participants
    quiz.participants.push(user._id);
    await quiz.save();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        currentQuiz: user.currentQuiz,
        score: user.score
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Create participant error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create participant" },
      { status: 500 }
    );
  }
}