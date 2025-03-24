# PrePostTEST - Interactive Quiz Platform

![PrePostTEST Banner](https://i.imgur.com/XyPZCnL.png)

PrePostTEST is a modern, real-time quiz application designed for educators, trainers, and event organizers to create interactive quiz sessions. With support for both live quizzes and self-paced assessments, it offers a flexible platform for knowledge testing in various environments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fpreposttest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Features

- **Real-time Quiz Experience**: Live quiz sessions with instant results
- **Admin Dashboard**: Create, manage, and control quizzes with ease
- **Participant Management**: Track participant engagement and performance
- **Dynamic Leaderboards**: Real-time rankings and performance metrics
- **Question Bank**: Create and reuse questions across multiple quizzes
- **Dark/Light Mode**: Stylish interface with theme support
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Results Analytics**: Detailed insights into quiz performance
- **Multi-format Questions**: Support for various question types (coming soon)
- **Customizable Timer**: Set time limits for questions

## 🚀 Demo

Try the application: [https://prepost-test-v3.vercel.app/](https://prepost-test-v3.vercel.app/)

**Demo Admin Credentials:**
- Email: admin@example.com
- Password: admin123

## 🛠️ Technologies

- **Frontend**:
  - Next.js 15.x (React 19.x)
  - TailwindCSS for styling
  - React Context API for state management
  - Real-time updates with Pusher

- **Backend**:
  - Next.js API Routes
  - MongoDB with Mongoose ODM
  - NextAuth.js for authentication
  - Pusher for real-time communication

- **Infrastructure**:
  - Vercel for hosting and deployment
  - MongoDB Atlas for database

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB database (local or MongoDB Atlas)
- Pusher account for real-time functionality

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/preposttest.git
cd preposttest
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

4. **Create an admin user**

```bash
npm run create-admin
# or
yarn create-admin
```

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage Guide

### For Quiz Creators (Admins)

1. **Login to the admin panel**
   - Navigate to `/login`
   - Enter your admin credentials

2. **Create a new quiz**
   - From the admin panel, click "Create New Quiz"
   - Optionally specify a custom quiz ID

3. **Add questions**
   - Add questions with multiple-choice options
   - Set the correct answer and time limit for each question

4. **Share the quiz**
   - Get the quiz ID or direct link to share with participants

5. **Start and control the quiz**
   - Use the control panel to start the quiz when ready
   - Monitor participants in real-time
   - Advance questions manually or use auto-advance

6. **View results**
   - Access detailed analytics after the quiz completes
   - Export results as CSV if needed

### For Participants

1. **Join a quiz**
   - Enter the quiz ID on the homepage
   - Provide your name to join

2. **Wait for the quiz to start**
   - You'll be placed in a waiting room until the admin starts the quiz

3. **Answer questions**
   - Each question has a time limit
   - Select your answer before time runs out

4. **View your results**
   - See your score and correct answers after the quiz
   - Compare your ranking on the leaderboard

## 🏗️ Architecture

PrePostTEST uses a modern architecture based on Next.js with App Router:

```
app/                    # App Router directory
├── admin/              # Admin panel routes
│   ├── panel/          # Main admin dashboard
│   ├── control/        # Quiz control interface
│   ├── create-question/# Question creation
│   └── leaderboard/    # Admin leaderboard view
├── api/                # API routes
│   ├── auth/           # Authentication endpoints
│   ├── quiz/           # Quiz management endpoints
│   └── user/           # User management endpoints
├── components/         # React components
│   ├── common/         # Shared components
│   └── quiz/           # Quiz-specific components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and libraries
├── models/             # Mongoose data models
├── page.js             # Home page
└── layout.js           # Root layout
```

### Data Flow

1. **Authentication**: NextAuth.js handles user authentication with JWT tokens
2. **Quiz Creation**: Admins create quizzes stored in MongoDB
3. **Participant Joining**: Participants join via unique quiz IDs
4. **Real-time Updates**: Pusher channels manage real-time communication
5. **State Management**: Context API manages application state
6. **Results Processing**: Server computes scores and generates leaderboards

## 🌐 API Endpoints

The application exposes several API endpoints:

### Quiz Management
- `GET /api/quiz` - Get all quizzes (admin only)
- `POST /api/quiz` - Create a new quiz (admin only)
- `GET /api/quiz/[id]` - Get quiz by ID
- `DELETE /api/quiz/[id]` - Delete quiz (admin only)

### Question Management
- `GET /api/quiz/[id]/questions` - Get quiz questions
- `POST /api/quiz/[id]/questions` - Add questions to quiz (admin only)

### Quiz Control
- `POST /api/quiz/[id]/start` - Start quiz (admin only)
- `POST /api/quiz/[id]/stop` - Stop quiz (admin only)
- `POST /api/quiz/[id]/next-question` - Move to next question (admin only)

### Participant Management
- `POST /api/user` - Create a participant
- `GET /api/user/quiz/[quizId]` - Get participants for a quiz

### Answers
- `POST /api/quiz/answer` - Submit an answer for a question
- `GET /api/quiz/[id]/user-answers` - Get a user's answers for a quiz

## 📊 Database Schema

The application uses MongoDB with the following main collections:

- **Users**: Stores admin users and participants
- **QuizState**: Manages quiz configuration and state
- **Questions**: Stores quiz questions and options
- **Answers**: Records participant answers
- **Leaderboard**: Stores quiz results and rankings

## 🚀 Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure you set the following environment variables in your production environment:

- `MONGODB_URI`: Your MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Your production URL
- `PUSHER_APP_ID`: Pusher app ID
- `PUSHER_SECRET`: Pusher secret key
- `NEXT_PUBLIC_PUSHER_KEY`: Pusher public key
- `NEXT_PUBLIC_PUSHER_CLUSTER`: Pusher cluster region

## 🧪 Testing

Run tests using Jest and React Testing Library:

```bash
npm test
# or
yarn test
```

## 🔄 Roadmap

- [ ] Multi-language support
- [ ] More question types (matching, fill-in-the-blank, etc.)
- [ ] Custom quiz themes and branding
- [ ] Integration with LMS platforms
- [ ] Offline mode with sync
- [ ] Team-based quizzes

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Created by Aidil Saputra Kirsan
- Icon designs by [Heroicons](https://heroicons.com/)
- Animations inspired by [Framer Motion](https://www.framer.com/motion/)

---

## 📞 Contact

Aidil Saputra Kirsan - [your-email@example.com](mailto:your-email@example.com)

Project Link: [https://github.com/yourusername/preposttest](https://github.com/yourusername/preposttest)