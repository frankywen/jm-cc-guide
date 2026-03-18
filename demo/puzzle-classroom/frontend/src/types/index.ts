export interface User {
  id: string;
  username: string;
  role: 'student' | 'teacher';
}

export interface Room {
  id: string;
  name: string;
  teacherId: string;
  gameType: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface GameSession {
  id: string;
  roomId: string;
  totalQuestions: number;
  questions: string;
  status: string;
  createdAt: string;
}

export interface StudentProgress {
  studentId: string;
  username: string;
  currentIndex: number;
  completedCount: number;
  totalScore: number;
}

export interface GameRecord {
  id: string;
  roomId: string;
  sessionId?: string;
  questionIndex?: number;
  studentId: string;
  gameType: string;
  question: string;
  answer: string;
  correct: boolean;
  timeSpent: number;
  score: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}