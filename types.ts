
export enum Grade {
  EXCELLENT = 'ممتاز',
  VERY_GOOD = 'جيد جداً',
  GOOD = 'جيد',
  ACCEPTABLE = 'مقبول',
  NEEDS_WORK = 'يحتاج إعادة',
}

export type AssignmentType = 'SURAH' | 'JUZ' | 'RANGE' | 'MULTI';

export interface MultiSurahDetail {
  name: string;
  grade?: Grade;
}

export interface QuranAssignment {
  type: AssignmentType;
  name: string;
  endName?: string;
  ayahFrom: number;
  ayahTo: number;
  juzNumber?: number;
  multiSurahs?: MultiSurahDetail[]; 
  grade: Grade; 
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
  isAbsent?: boolean; 
  isAdab?: boolean; 
  
  adabSession?: AdabSession; 
  parentQuizScore?: number; 
  parentQuizMax?: number; 
  
  jadeed?: QuranAssignment; 
  murajaah?: QuranAssignment[]; 
  attendance?: AttendanceRecord[]; 
  notes?: string;
  teacherId: string;
  teacherName: string;
  seenByParent: boolean;
  seenAt?: string;
}

export interface Payment {
  id: string;
  title: string; 
  amount: number;
  date: string;
  recordedBy: string; 
  notes?: string; 
}

export interface CalendarEvent {
  id: string;
  title: string; 
  time: string;  
}

export interface WeeklySchedule {
  day: string; 
  events: CalendarEvent[]; 
  isDayOff?: boolean; 
}

export interface FeeReminder {
    month: string;
    dateSet: string;
}

export interface Student {
  id: string;
  teacherId: string; 
  name: string;
  parentCode: string; 
  parentPhone?: string; 
  logs: DailyLog[];
  payments: Payment[];
  weeklySchedule: WeeklySchedule[];
  nextPlan?: { 
    jadeed: QuranAssignment;
    murajaah: QuranAssignment[];
  }; 
  calculatorNotes?: string; 
  feeReminder?: FeeReminder; 
}

export interface Teacher {
  id: string;
  name: string;
  phone?: string; // Added phone number
  loginCode: string; 
}

export type AnnouncementType = 'EXAM' | 'COMPETITION' | 'GENERAL' | 'FEE_REMINDER';

export interface ExamDayDetail {
    id: string;
    date: string;
    description: string; 
    note?: string; 
}

export interface Announcement {
  id: string;
  teacherId: string;
  teacherName: string;
  content: string;
  date: string;
  type: AnnouncementType;
  expiresAt?: string;
  examDetails?: {
      testerTeacherId: string;
      testerTeacherName: string;
      schedule: ExamDayDetail[];
  };
}

export type UserRole = 'TEACHER' | 'PARENT' | 'ADMIN' | 'GUEST';

export interface OrgSettings {
    name: string;
    font: 'Amiri' | 'Cairo';
    colorTheme: 'Gold' | 'Green' | 'Blue';
    styleType: 'Calligraphy' | 'Modern' | 'Simple';
}

export interface AppState {
  students: Student[];
  teachers: Teacher[];
  announcements: Announcement[];
  adabArchive: AdabSession[]; 
  orgSettings: OrgSettings; // Added OrgSettings
  currentUser: {
    role: UserRole;
    id?: string; 
    name?: string; 
  };
}
