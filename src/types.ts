/**
 * File: /src/types.ts
 * Type definitions matching the user database schema
 */

export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface LectureNote {
  id: number;
  user_id: number;
  title: string;
  source_type: 'youtube' | 'audio' | 'ppt';
  source_url?: string;
  raw_text?: string;
  summary?: string;
  cheat_sheet?: string;
  created_at?: string;
  is_fallback?: boolean;
}

export interface Quiz {
  id: number;
  note_id: number;
  question: string;
  options: string[]; // Options array, e.g., ["A. ...", "B. ...", "C. ...", "D. ..."]
  correct_answer: string; // "A", "B", "C", or "D"
  explanation: string;
}

export interface DatabaseState {
  users: User[];
  lecture_notes: LectureNote[];
  quizzes: Quiz[];
}
