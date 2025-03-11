// scripts/migrate.js
const { google } = require('googleapis');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Leaderboard = require('../models/Leaderboard');
const dotenv = require('dotenv');

dotenv.config();

// Autentikasi Google Sheets API (memerlukan credentials.json)
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const SPREADSHEET_ID = '1UsDxZ1GzRtbj4sA8wSkRtjx95Hv6BX6s9eojUL0OFPk';

async function migrateQuestions() {
  console.log('Migrating questions...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Ambil data dari sheet SoalPostTest
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'SoalPostTest!A2:G', // Sesuaikan dengan range yang sesuai
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found in questions sheet.');
    return;
  }
  
  // Transformasi data dan simpan ke MongoDB
  const questions = rows.map((row, index) => ({
    questionId: parseInt(row[0]) || index + 1,
    question: row[1],
    optionA: row[2],
    optionB: row[3],
    optionC: row[4],
    optionD: row[5],
    correctAnswer: row[6]
  }));
  
  // Hapus data lama (opsional, hati-hati dengan ini)
  await Question.deleteMany({});
  
  // Simpan data baru
  await Question.insertMany(questions);
  console.log(`Migrated ${questions.length} questions.`);
}

async function migrateUsers() {
  console.log('Migrating users...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Ambil data dari sheet Peserta
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Peserta!A2:E', // Sesuaikan dengan range yang sesuai
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found in users sheet.');
    return;
  }
  
  // Transformasi data dan simpan ke MongoDB
  const users = rows.map(row => ({
    _id: row[0], // Gunakan ID yang sama dengan di Sheets
    name: row[1],
    joinTime: row[2] ? new Date(row[2]) : new Date(),
    avatar: row[3] || "",
    status: row[4] || "waiting"
  }));
  
  // Hapus data lama (opsional)
  await User.deleteMany({});
  
  // Simpan data baru
  await User.insertMany(users);
  console.log(`Migrated ${users.length} users.`);
}

async function migrateAnswers() {
  console.log('Migrating answers...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Ambil data dari sheet JawabanPeserta
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'JawabanPeserta!A2:I', // Sesuaikan dengan range yang sesuai
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found in answers sheet.');
    return;
  }
  
  // Dapatkan semua ID pertanyaan dari database
  const questionsMap = {};
  const questions = await Question.find({}, { questionId: 1 });
  questions.forEach(q => {
    questionsMap[q.questionId] = q._id;
  });
  
  // Transformasi data dan simpan ke MongoDB
  const answers = rows.map(row => {
    const questionId = parseInt(row[2]);
    const isCorrect = row[8] === "true" || row[8] === true;
    
    return {
      userId: row[1],
      questionId: questionsMap[questionId],
      answer: row[3],
      timestamp: row[4] ? new Date(row[4]) : new Date(),
      timeTaken: parseFloat(row[5]) || 0,
      score: parseFloat(row[6]) || 0,
      questionNumber: parseInt(row[7]) || 0,
      isCorrect: isCorrect
    };
  });
  
  // Hapus data lama (opsional)
  await Answer.deleteMany({});
  
  // Simpan data baru
  await Answer.insertMany(answers);
  console.log(`Migrated ${answers.length} answers.`);
}

async function migrateLeaderboard() {
  console.log('Migrating leaderboard...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Ambil data dari sheet Leaderboard
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leaderboard!A2:E', // Sesuaikan dengan range yang sesuai
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found in leaderboard sheet.');
    return;
  }
  
  // Transformasi data dan simpan ke MongoDB
  const leaderboardEntries = rows.map(row => ({
    userId: row[0],
    score: parseFloat(row[2]) || 0,
    correctAnswers: parseInt(row[4]) || 0
  }));
  
  // Hapus data lama (opsional)
  await Leaderboard.deleteMany({});
  
  // Simpan data baru
  await Leaderboard.insertMany(leaderboardEntries);
  console.log(`Migrated ${leaderboardEntries.length} leaderboard entries.`);
}

async function runMigration() {
  try {
    // Koneksi ke MongoDB
    await connectDB();
    
    // Jalankan migrasi
    await migrateQuestions();
    await migrateUsers();
    await migrateAnswers();
    await migrateLeaderboard();
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();