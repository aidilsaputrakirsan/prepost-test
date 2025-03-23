// app/api/quiz/[id]/user-answers/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Answer from "@/app/models/Answer";
import Question from "@/app/models/Question";
import User from "@/app/models/User";

export async function GET(request, { params }) {
  try {
    const quizId = String(params.id || '');
    
    // Get user ID from header
    const participantId = request.headers.get('x-participant-id');
    const hasLocalStorage = request.headers.get('x-has-local-storage') === 'true';
    
    console.log(`Fetching answers for quiz ${quizId}, participant ${participantId}, localStorage: ${hasLocalStorage}`);
    
    if (!participantId) {
      console.error("No participant ID provided");
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Verify the user exists
    const user = await User.findById(participantId);
    if (!user) {
      console.error(`User ${participantId} not found`);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    console.log(`Found user ${user.name}, fetching answers`);
    
    // Find all answers by this user for this quiz
    const answers = await Answer.find({
      user: participantId,
      quiz: quizId
    }).sort({ createdAt: 1 }).exec();
    
    console.log(`Found ${answers.length} answers`);
    
    if (!answers || answers.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Get all the question IDs
    const questionIds = answers.map(answer => answer.question);
    
    // Fetch all the related questions
    const questions = await Question.find({
      _id: { $in: questionIds }
    }).exec();
    
    console.log(`Found ${questions.length} questions`);
    
    // Map questions by ID for easy access
    const questionsMap = {};
    questions.forEach(question => {
      questionsMap[question._id.toString()] = question;
    });
    
    // Combine answers with questions
    const detailedAnswers = answers.map(answer => {
      const question = questionsMap[answer.question.toString()];
      
      return {
        answerId: answer._id.toString(),
        questionId: answer.question.toString(),
        questionText: question?.text || "Question not found",
        options: question?.options || [],
        selectedOption: answer.selectedOption,
        correctOption: question?.correctOption,
        isCorrect: answer.isCorrect,
        responseTime: answer.responseTime,
        createdAt: answer.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: detailedAnswers
    });
  } catch (error) {
    console.error("Error fetching user answers:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user answers" },
      { status: 500 }
    );
  }
}