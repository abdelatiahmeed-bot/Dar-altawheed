export enum Grade {
  EXCELLENT = 'ممتاز',
  VERY_GOOD = 'جيد جداً',
  GOOD = 'جيد',
  ACCEPTABLE = 'مقبول',
  NEEDS_WORK = 'ضعيف'
}

export interface MultiSurahDetail {
    name: string;
    grade?: Grade;
}

export interface QuranAssignment {
  type: 'SURAH' | 'RANGE' | 'JUZ' | 'MULTI';
  name: string;
  endName?: string;
  ayahFrom?: number;
  ayahTo?: number;
  juzNumber?: number;
  grade?: Grade;
  multiSurahs?: MultiSurahDetail[];
}

export interface AttendanceRecord {
    id: string;
    arrival: string;
    departure?: string;
}

export interface QuizItem {
    id: string;
    question: string;
    correctAnswer: string;
    wrongAnswers: string[];
}

export interface AdabSession {
    id: string;
    title: string;
    quizzes: QuizItem[];
    date: string;
}

export interface DailyLog {
  id: string;
  date: string;
  teacherId: string;
  teacherName: string;
  seenByParent: boolean;
  seenAt?: string;
  attendance?: AttendanceRecord[];
  jadeed?: QuranAssignment;
  murajaah?: QuranAssignment[];
  notes?: string;
  isAbsent?: boolean;
  isAdab?: boolean;
  adabSession?: AdabSession;
  parentQuizScore?: number;
  parentQuizMax?: number;
}

export interface WeeklyEvent {
  id: string;
  title: string;
  time: string;
}

export interface WeeklySchedule {
  day: string;
  isDayOff?: boolean;
  events?: WeeklyEvent[];
}

export interface Payment {
    id: string;
    amount: number;
    date: string;
    title: string;
    recordedBy: string;
    notes?: string;
}

export interface ExamDayDetail {
    id: string;
    date: string;
    description: string;
}

export interface Announcement {
  id: string;
  teacherId: string;
  teacherName: string;
  content: string;
  date: string;
  type?: 'GENERAL' | 'EXAM';
  examDetails?: {
      testerTeacherId: string;
      testerTeacherName: string;
      schedule: ExamDayDetail[];
  };
}

export interface NextPlan {
    jadeed: QuranAssignment;
    murajaah: QuranAssignment[];
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  parentCode: string;
  parentPhone?: string;
  logs: DailyLog[];
  weeklySchedule: WeeklySchedule[];
  payments: Payment[];
  isFeeOverdue?: boolean;
  nextPlan?: NextPlan;
  calculatorNotes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  loginCode: string;
}

export interface User {
  role: 'GUEST' | 'PARENT' | 'TEACHER' | 'ADMIN';
  id?: string;
  name?: string;
}

export interface AppState {
  students: Student[];
  teachers: Teacher[];
  announcements: Announcement[];
  adabArchive: AdabSession[];
  currentUser: User;
}