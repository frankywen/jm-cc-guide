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

export interface GameRecord {
  id: string;
  roomId: string;
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