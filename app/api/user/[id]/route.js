// app/api/user/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Get user by ID
export async function GET(request, { params }) {
  try {
    const userId = params.id;
    
    await connectToDatabase();
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get user" },
      { status: 500 }
    );
  }
}
