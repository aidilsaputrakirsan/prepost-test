// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectToDatabase();
          
          // Find user
          const user = await User.findOne({ email: credentials.email }).select("+password");
          
          if (!user) {
            return null; // Return null instead of throwing error
          }
          
          // Check password
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!isMatch) {
            return null; // Return null instead of throwing error
          }
          
          // Return user without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            currentQuiz: user.currentQuiz,
            score: user.score
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null; // Return null to trigger default error handling
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.currentQuiz = user.currentQuiz;
        token.score = user.score;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.isAdmin = token.isAdmin;
      session.user.currentQuiz = token.currentQuiz;
      session.user.score = token.score;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };