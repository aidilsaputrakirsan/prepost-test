// app/api/quiz/[id]/questions/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import QuizState from "@/app/models/QuizState";
import Question from "@/app/models/Question";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

// Get questions for a quiz
export async function GET(request, { params }) {
  try {
    const quizId = params.id;
    const session = await getServerSession(authOptions);
    
    // Check if admin (to show all question details)
    const isAdmin = session?.user?.isAdmin || false;
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId)
      .populate('questions')
      .exec();
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // If admin, return full question details
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        data: quiz.questions
      });
    }
    
    // For regular users, remove correctOption
    const safeQuestions = quiz.questions.map(q => ({
      _id: q._id,
      text: q.text,
      options: q.options,
      timeLimit: q.timeLimit
    }));
    
    return NextResponse.json({
      success: true,
      data: safeQuestions
    });
  } catch (error) {
    console.error("Error getting questions:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get questions" },
      { status: 500 }
    );
  }
}

// Add questions to a quiz
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
    
    const { questions } = await request.json();
    
    await connectToDatabase();
    
    const quiz = await QuizState.findById(quizId);
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found" },
        { status: 404 }
      );
    }
    
    // Only add questions if quiz is in 'waiting' state
    if (quiz.status !== 'waiting') {
      return NextResponse.json(
        { success: false, message: "Cannot add questions after quiz has started" },
        { status: 400 }
      );
    }
    
    // Validate questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid question format" },
        { status: 400 }
      );
    }
    
    // Add new questions
    const questionIds = await Promise.all(
      questions.map(async (q) => {
        if (!q.text || !q.options || q.options.length < 2) {
          throw new Error('Invalid question format');
        }
        
        const question = await Question.create({
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          timeLimit: q.timeLimit || 15
        });
        
        return question._id;
      })
    );
    
    // Add question IDs to quiz
    quiz.questions.push(...questionIds);
    await quiz.save();
    
    return NextResponse.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error("Error adding questions:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add questions" },
      { status: 500 }
    );
  }
}