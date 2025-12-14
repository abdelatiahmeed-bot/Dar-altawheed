
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, DailyLog, Grade, QuranAssignment, Announcement, Payment, QuizItem, Teacher, AttendanceRecord, MultiSurahDetail, ExamDayDetail, AdabSession, FeeReminder } from '../types';
import { SURAH_NAMES, JUZ_LIST, SURAH_DATA, formatDateDual, formatTime12Hour, formatSimpleDate, formatDateWithDay, DAYS_OF_WEEK, MONTHS_LIST } from '../constants';
import { Button } from './Button';
import { TimePicker } from './TimePicker';
import { generateEncouragement } from '../services/geminiService';

interface TeacherDashboardProps {
  teacherName: string;
  teacherId: string;
  students: Student[];
  allTeachers?: Teacher[];
  announcements: Announcement[];
  adabArchive: AdabSession[];
  onUpdateStudent: (student: Student) => void;
  onAddStudent: (name: string, code: string) => Promise<Student> | Student; 
  onDeleteStudents: (ids: string[]) => void;
  onMarkAbsences: (absentIds: string[], excusedIds: string[]) => void;
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onLogout: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
  onPublishAdab: (title: string, quizzes: QuizItem[]) => void;
  onEditAdab: (sessionId: string, title: string, quizzes: QuizItem[]) => void;
  onDeleteAdab: (sessionId: string) => void;
  onQuickAnnouncement: (type: 'ADAB' | 'HOLIDAY', payload?: any) => void;
}

const emptyAssignment: QuranAssignment = {
  type: 'SURAH',
  name: SURAH_NAMES[0],
  ayahFrom: 1,
  ayahTo: 7,
  grade: Grade.GOOD,
  multiSurahs: []
};

// ... AssignmentForm Component ...
interface AssignmentFormProps {
  data: QuranAssignment;
  onChange: (field: keyof QuranAssignment, val: any) => void;
  title: string;
  colorClass: string;
  canRemove?: boolean;
  onRemove?: () => void;
  hideGrade?: boolean;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ 
  data, onChange, title, colorClass, canRemove, onRemove, hideGrade
}) => {
  const isSurah = data.type === 'SURAH';
  const isRange = data.type === 'RANGE';
  const isMulti = data.type === 'MULTI';

  const maxAyahs = useMemo(() => {
    if (isSurah) {
      const s = SURAH_DATA.find(x => x.name === data.name);
      return s ? s.count : 286;
    }
    return 286;
  }, [data.name, isSurah]);

  const ayahOptions = useMemo(() => Array.from({ length: maxAyahs }, (_, i) => i + 1), [maxAyahs]);

  const handleAddMultiSurah = () => {
      const currentList = data.multiSurahs || [];
      onChange('multiSurahs', [...currentList, { name: SURAH_NAMES[0], grade: undefined }]);
  };

  const handleUpdateMultiSurah = (index: number, field: keyof MultiSurahDetail, val: any) => {
      const currentList = [...(data.multiSurahs || [])];
      currentList[index] = { ...currentList[index], [field]: val };
      onChange('multiSurahs', currentList);
  };

  const handleRemoveMultiSurah = (index: number) => {
      const currentList = [...(data.multiSurahs || [])];
      currentList.splice(index, 1);
      onChange('multiSurahs', currentList);
  };

  return (
    <div className={`p-3 rounded-xl border-2 ${colorClass} mb-2 relative animate-fade-in`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-gray-700 text-sm">{title}</h4>
        {canRemove && (
          <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm">
             ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        {['SURAH', 'RANGE', 'JUZ', 'MULTI'].map(type => (
          <button
            key={type}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${data.type === type ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
            onClick={() => onChange('type', type)}
          >
            {type === 'SURAH' ? 'سورة' : type === 'RANGE' ? 'نطاق' : type === 'JUZ' ? 'جزء' : 'متعدد'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {data.type === 'JUZ' ? (
           <select 
             className="w-full p-2 border rounded-lg bg-white text-base font-bold text-right"
             value={data.juzNumber || 1}
             onChange={(e) => {
                 onChange('juzNumber', parseInt(e.target.value));
                 onChange('name', JUZ_LIST[parseInt(e.target.value) - 1]);
             }}
           >
             {JUZ_LIST.map((j, i) => <option key={i} value={i+1}>{j}</option>)}
           </select>
        ) : isMulti ? (
            <div className="bg-white p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] text-gray-400 mb-2">اختر السور المتفرقة مع التقدير:</p>
                <div className="space-y-2 mb-2">
                    {(data.multiSurahs || []).map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-b border-gray-100 pb-2 last:border-0">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold w-4 text-gray-500">{idx + 1}.</span>
                                <select 
                                    className="flex-1 p-1 border rounded text-base font-bold text-right"
                                    value={item.name}
                                    onChange={(e) => handleUpdateMultiSurah(idx, 'name', e.target.value)}
                                >
                                    {SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => handleRemoveMultiSurah(idx)} className="text-red-500 font-bold px-2 bg-red-50 rounded">×</button>
                            </div>
                            {!hideGrade && (
                                <div className="flex items-center gap-2 mr-6">
                                    <span className="text-[10px] text-gray-400">التقدير:</span>
                                    <select
                                        className={`flex-1 p-2 border rounded text-xs font-bold h-auto min-h-[35px] text-right ${item.grade === Grade.EXCELLENT ? 'text-emerald-600' : item.grade === Grade.NEEDS_WORK ? 'text-red-600' : 'text-gray-700'}`}
                                        value={item.grade || ''}
                                        onChange={(e) => handleUpdateMultiSurah(idx, 'grade', e.target.value)}
                                    >
                                        <option value="">-- اختر --</option>
                                        {Object.values(Grade).map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={handleAddMultiSurah} className="w-full py-1 text-xs border border-dashed border-gray-400 text-gray-600 rounded hover:bg-gray-50">+ إضافة سورة أخرى</button>
            </div>
        ) : (
          <>
            <div className="flex gap-2">
               <div className="flex-1">
                 <label className="text-[10px] font-bold text-gray-500 block mb-1">من سورة</label>
                 <select 
                   className="w-full p-2 border rounded-lg bg-white text-base font-bold text-right h-auto min-h-[40px] appearance-none pr-8"
                   style={{ 
                     backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                     backgroundPosition: 'left 0.5rem center',
                     backgroundRepeat: 'no-repeat',
                     backgroundSize: '1.5em 1.5em',
                     paddingLeft: '2.5rem'
                   }}
                   value={data.name}
                   onChange={(e) => onChange('name', e.target.value)}
                 >
                   {SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               {isRange && (
                 <div className="flex-1">
                   <label className="text-[10px] font-bold text-gray-500 block mb-1">إلى سورة</label>
                   <select 
                     className="w-full p-2 border rounded-lg bg-white text-base font-bold text-right h-auto min-h-[40px] appearance-none pr-8"
                     style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'left 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingLeft: '2.5rem'
                      }}
                     value={data.endName || data.name}
                     onChange={(e) => onChange('endName', e.target.value)}
                   >
                     {SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
               )}
            </div>

            {isSurah && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                 <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">من آية</label>
                    <select
                        className="w-full p-1 border rounded text-center font-bold bg-gray-50 text-xl h-8 appearance-none"
                        value={data.ayahFrom}
                        onChange={(e) => onChange('ayahFrom', parseInt(e.target.value))}
                    >
                        {ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
                <span className="text-gray-400 mt-4 font-bold text-xs">إلى</span>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-0.5">إلى آية</label>
                    <select
                        className="w-full p-1 border rounded text-center font-bold bg-gray-50 text-xl h-8 appearance-none"
                        value={data.ayahTo}
                        onChange={(e) => onChange('ayahTo', parseInt(e.target.value))}
                    >
                         {ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
              </div>
            )}
          </>
        )}

        {!hideGrade && !isMulti && (
          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-1">التقييم</label>
            <select
                className="w-full p-2 border rounded-lg bg-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none h-auto min-h-[42px] text-right appearance-none pr-8"
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'left 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingLeft: '2.5rem'
                }}
                value={data.grade}
                onChange={(e) => onChange('grade', e.target.value)}
            >
                {Object.values(Grade).map(g => (
                    <option key={g} value={g}>{g}</option>
                ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ACTION BUTTON COMPONENT ---
const ActionButton = ({ id, label, icon, isActive, onClick, colorClass }: { id: string, label: string, icon?: string, isActive: boolean, onClick: () => void, colorClass: string }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-4 px-2 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-lg shadow-md transition-transform transform active:scale-95 ${colorClass} ${isActive ? 'ring-2 ring-white ring-offset-2' : 'opacity-90'}`}
    >
        {label}
        {icon && <span className="text-xl">{icon}</span>}
    </button>
);

const ConfirmDeleteButton = ({ label, onConfirm, className }: { label: string, onConfirm: () => void, className?: string }) => {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="flex gap-2">
                <Button variant="danger" onClick={onConfirm} className={`text-xs px-2 py-1 ${className}`}>تأكيد ✅</Button>
                <Button variant="outline" onClick={() => setConfirming(false)} className={`text-xs px-2 py-1 ${className}`}>إلغاء</Button>
            </div>
        )
    }
    return (
        <Button variant="danger" onClick={() => setConfirming(true)} className={`text-xs px-2 py-1 ${className}`}>{label}</Button>
    )
};

interface DraftState {
    logId: string | null;
    attendance: AttendanceRecord[];
    jadeed: QuranAssignment;
    murajaah: QuranAssignment[];
    notes: string;
    nextJadeed: QuranAssignment;
    nextMurajaah: QuranAssignment[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherName,
  teacherId,
  students,
  allTeachers = [],
  announcements,
  adabArchive,
  onUpdateStudent,
  onAddStudent,
  onDeleteStudents,
  onMarkAbsences,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onLogout,
  onShowNotification,
  onPublishAdab,
  onEditAdab,
  onDeleteAdab,
  onQuickAnnouncement
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'DELETE' | 'ANNOUNCEMENTS' | 'ADAB' | 'ATTENDANCE' | 'STATS'>('LIST');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<'ALPHABETICAL' | 'CODE'>('ALPHABETICAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0]);

  // Student Detail Tabs
  const [studentTab, setStudentTab] = useState<'LOG' | 'PLAN' | 'ARCHIVE' | 'CALC' | 'SCHEDULE' | 'FEES'>('LOG');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');

  // Adab State
  const [adabTab, setAdabTab] = useState<'PUBLISH' | 'ARCHIVE' | 'LEADERBOARD'>('PUBLISH'); 
  const [adabTitle, setAdabTitle] = useState('مجلس الآداب');
  const [adabQuestionsList, setAdabQuestionsList] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentCorrect, setCurrentCorrect] = useState('');
  const [currentWrong1, setCurrentWrong1] = useState('');
  const [currentWrong2, setCurrentWrong2] = useState('');
  const [editingAdabId, setEditingAdabId] = useState<string | null>(null);
  const [selectedAdabForLeaderboard, setSelectedAdabForLeaderboard] = useState<string>('');

  // Announcement State
  const [announcementTab, setAnnouncementTab] = useState<'GENERAL' | 'EXAM'>('GENERAL');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementExpiry, setAnnouncementExpiry] = useState('');
  const [showExamArchive, setShowExamArchive] = useState(false);

  // Exam State
  const [examTesterId, setExamTesterId] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examDayName, setExamDayName] = useState(DAYS_OF_WEEK[new Date().getDay() === 6 ? 0 : new Date().getDay() + 1]); 
  const [newExamDesc, setNewExamDesc] = useState(''); 
  const [newExamNote, setNewExamNote] = useState(''); 
  const [examList, setExamList] = useState<{date: string, day: string, description: string}[]>([]); 

  // Plan Calculator State
  const [calcLines, setCalcLines] = useState('');
  const [calcDays, setCalcDays] = useState('');
  const [calcNotes, setCalcNotes] = useState('');

  // Fees State
  const [feeMonth, setFeeMonth] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeNote, setFeeNote] = useState('');

  // Log State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([{ id: '1', arrival: '16:00', departure: '18:00' }]);
  const [jadeed, setJadeed] = useState<QuranAssignment>({ ...emptyAssignment });
  const [murajaahList, setMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
  const [notes, setNotes] = useState('');
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState('');
  const [saveWarnings, setSaveWarnings] = useState<string[]>([]);
  
  const [nextJadeed, setNextJadeed] = useState<QuranAssignment>({ ...emptyAssignment, grade: Grade.GOOD });
  const [nextMurajaahList, setNextMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment }]);
  
  // Attendance Grid State
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'ABSENT' | 'EXCUSED' | null>>({});
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  // Update exam day name when date changes
  useEffect(() => {
      const d = new Date(examDate);
      setExamDayName(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
  }, [examDate]);

  const sortedStudents = useMemo(() => {
      let sorted = [...students];
      
      // Filter by Search
      if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          sorted = sorted.filter(s => s.name.includes(q) || s.parentCode.includes(q));
      }

      // Sort
      if (sortMethod === 'CODE') {
          sorted.sort((a, b) => a.parentCode.localeCompare(b.parentCode));
      } else {
          sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      }
      return sorted;
  }, [students, sortMethod, searchQuery]);

  const unloggedStudents = useMemo(() => {
    const todayStr = new Date().toDateString();
    return students.filter(s => !s.logs.some(l => new Date(l.date).toDateString() === todayStr));
  }, [students]);

  useEffect(() => {
      setAttendanceMap({});
      setIsSelectAllMode(false);
  }, [unloggedStudents.length]);

  const toggleStudentStatus = (id: string) => {
      setAttendanceMap(prev => {
          const current = prev[id];
          if (!current) return { ...prev, [id]: 'ABSENT' };
          if (current === 'ABSENT') return { ...prev, [id]: 'EXCUSED' };
          const next = { ...prev };
          delete next[id];
          return next;
      });
  };

  const handleBatchAttendanceSubmit = () => {
      const absentIds: string[] = [];
      const excusedIds: string[] = [];
      Object.entries(attendanceMap).forEach(([id, status]) => {
          if (status === 'ABSENT') absentIds.push(id);
          else if (status === 'EXCUSED') excusedIds.push(id);
      });
      if (absentIds.length === 0 && excusedIds.length === 0) {
          onShowNotification('لم يتم تحديد أي طالب', 'error');
          return;
      }
      onMarkAbsences(absentIds, excusedIds);
      setAttendanceMap({});
      setIsSelectAllMode(false);
  };

  const handleToggleSelectAllAbsent = () => {
      if (isSelectAllMode) {
          setAttendanceMap({});
          setIsSelectAllMode(false);
          onShowNotification('تم إلغاء التحديد', 'success');
      } else {
          const newMap = { ...attendanceMap };
          unloggedStudents.forEach(s => {
              if (!newMap[s.id]) newMap[s.id] = 'ABSENT';
          });
          setAttendanceMap(newMap);
          setIsSelectAllMode(true);
          onShowNotification('تم تحديد الجميع كغياب', 'success');
      }
  };

  const saveCurrentDraft = (studentId: string) => {
      // Always save draft if opened, regardless of isDirty, to preserve state on back navigation as requested
      const draft: DraftState = {
          logId: currentLogId,
          attendance: attendanceRecords,
          jadeed,
          murajaah: murajaahList,
          notes,
          nextJadeed,
          nextMurajaah: nextMurajaahList
      };
      setDrafts(prev => ({ ...prev, [studentId]: draft }));
  };

  const handleCloseStudent = () => {
      if (selectedStudentId) {
          saveCurrentDraft(selectedStudentId);
      }
      setSelectedStudentId(null);
      setIsDirty(false); 
      setSaveWarnings([]);
  };

  const handleOpenStudent = (s: Student) => {
    // If opening a different student, save draft for current (if any)
    if (selectedStudentId && selectedStudentId !== s.id) {
        saveCurrentDraft(selectedStudentId);
    }
    
    setSelectedStudentId(s.id);
    setStudentTab('LOG'); 
    setIsDirty(false); 
    setSaveWarnings([]);
    setEncouragementMsg('');
    setCalcNotes(s.calculatorNotes || '');
    
    // 1. Check if we have a draft in memory
    if (drafts[s.id]) {
        const draft = drafts[s.id];
        setCurrentLogId(draft.logId);
        setAttendanceRecords(draft.attendance);
        setJadeed(draft.jadeed);
        setMurajaahList(draft.murajaah);
        setNotes(draft.notes);
        setNextJadeed(draft.nextJadeed);
        setNextMurajaahList(draft.nextMurajaah);
        return;
    }

    const todayStr = new Date().toDateString();
    const existingLog = s.logs.find(l => new Date(l.date).toDateString() === todayStr);

    if (existingLog && !existingLog.isAbsent && !existingLog.isAdab) {
        // --- VIEWING/EDITING TODAY'S LOG ---
        setCurrentLogId(existingLog.id);
        setJadeed(existingLog.jadeed || { ...emptyAssignment });
        setMurajaahList(existingLog.murajaah || [{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
        setNotes(existingLog.notes || '');
        if (existingLog.attendance && existingLog.attendance.length > 0) {
            setAttendanceRecords(existingLog.attendance);
        } else {
             // @ts-ignore
            if (existingLog.attendance && existingLog.attendance.arrivalTime) {
                 // @ts-ignore
                setAttendanceRecords([{ id: '1', arrival: existingLog.attendance.arrivalTime, departure: existingLog.attendance.departureTime }]);
            } else {
                setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]);
            }
        }
    } else {
        // --- NEW LOG (12 AM TRANSFER LOGIC) ---
        setCurrentLogId(null);
        setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]);
        
        // AUTO-FILL JADEED FROM NEXT PLAN (Template)
        if (s.nextPlan) {
            const transferredJadeed = { ...s.nextPlan.jadeed, grade: Grade.GOOD };
            if (transferredJadeed.type === 'MULTI' && transferredJadeed.multiSurahs) {
                transferredJadeed.multiSurahs = transferredJadeed.multiSurahs.map(ms => ({ ...ms, grade: undefined }));
            }
            setJadeed(transferredJadeed);

            if (s.nextPlan.murajaah && s.nextPlan.murajaah.length > 0) {
                 const transferredMurajaah = s.nextPlan.murajaah.map(m => {
                     const mCopy = { ...m, grade: Grade.VERY_GOOD };
                     if (mCopy.type === 'MULTI' && mCopy.multiSurahs) {
                         mCopy.multiSurahs = mCopy.multiSurahs.map(ms => ({ ...ms, grade: undefined }));
                     }
                     return mCopy;
                 });
                 setMurajaahList(transferredMurajaah);
            } else {
                 setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
            }
        } else {
            setJadeed({ ...emptyAssignment });
            setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
        }
        setNotes('');
    }

    // --- KEEP NEXT PLAN TEMPLATE STATIC (FIXED) ---
    // Whether it's a new day or existing log, populate the Next Plan tab 
    // with the student's sticky Next Plan
    if (s.nextPlan) {
        setNextJadeed(s.nextPlan.jadeed);
        if (s.nextPlan.murajaah && s.nextPlan.murajaah.length > 0) {
            setNextMurajaahList(s.nextPlan.murajaah);
        } else {
            setNextMurajaahList([{ ...emptyAssignment }]);
        }
    } else {
        setNextJadeed({ ...emptyAssignment, grade: Grade.GOOD });
        setNextMurajaahList([{ ...emptyAssignment }]);
    }
  };

  // ARCHIVE ACTIONS
  const handleEditLog = (log: DailyLog) => {
      if(!selectedStudent) return;
      
      setCurrentLogId(log.id);
      setJadeed(log.jadeed || { ...emptyAssignment });
      setMurajaahList(log.murajaah || [{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
      setNotes(log.notes || '');
      setAttendanceRecords(log.attendance || [{ id: '1', arrival: '16:00', departure: '18:00' }]);
      setStudentTab('LOG');
      onShowNotification("تم تحميل السجل للتعديل", "success");
  };

  const handleDeleteLog = (logId: string) => {
      if(!selectedStudent) return;
      if(window.confirm("هل أنت متأكد من حذف هذا السجل؟")) {
          const updatedLogs = selectedStudent.logs.filter(l => l.id !== logId);
          onUpdateStudent({ ...selectedStudent, logs: updatedLogs });
          onShowNotification("تم حذف السجل", "success");
      }
  };

  const markAsDirty = () => {
      if (!isDirty) setIsDirty(true);
  };

  const executeSaveLog = () => {
      if (!selectedStudent) return;
      let updatedLogs = [...selectedStudent.logs]; 
      
      if (currentLogId) { 
          updatedLogs = updatedLogs.map(log => { 
              if (log.id === currentLogId) { 
                  return { ...log, attendance: attendanceRecords, jadeed: jadeed, murajaah: murajaahList, notes: notes, seenByParent: false }; 
              } 
              return log; 
          }); 
          onShowNotification('تم تحديث السجل اليومي بنجاح', 'success'); 
      } else { 
          const newLog: DailyLog = { 
              id: `log_${Date.now()}`, 
              date: new Date().toISOString(), 
              teacherId: selectedStudent.teacherId, 
              teacherName: teacherName, 
              seenByParent: false, 
              attendance: attendanceRecords, 
              jadeed: jadeed, 
              murajaah: murajaahList, 
              notes: notes, 
              isAbsent: false, 
              isAdab: false 
          }; 
          updatedLogs = [newLog, ...updatedLogs]; 
          onShowNotification('تم حفظ السجل اليومي بنجاح', 'success'); 
      } 
      
      const nextPlan = { jadeed: nextJadeed, murajaah: nextMurajaahList }; 
      const updatedStudent = { ...selectedStudent, logs: updatedLogs, nextPlan: nextPlan }; 
      
      onUpdateStudent(updatedStudent); 
      
      if (!currentLogId) { setCurrentLogId(updatedLogs[0].id); } 
      
      // Clear draft for this student after successful save
      const newDrafts = { ...drafts }; 
      delete newDrafts[selectedStudent.id]; 
      setDrafts(newDrafts); 
      setIsDirty(false); 
      setSaveWarnings([]);
  }

  const handleSaveLog = () => { 
      if (!selectedStudent) return; 
      
      const warnings: string[] = []; 
      const isAttDefault = attendanceRecords.length === 1 && attendanceRecords[0].arrival === '16:00' && attendanceRecords[0].departure === '18:00'; 
      const isNextPlanEmpty = nextJadeed.name === SURAH_NAMES[0] && nextJadeed.ayahFrom === 1 && nextJadeed.ayahTo === 7 && nextJadeed.type === 'SURAH'; 
      
      if (isAttDefault) warnings.push("لم يتم تسجيل الحضور والانصراف الفعلي"); 
      if (isNextPlanEmpty) warnings.push("لم يتم تحديد لوح الحفظ القادم (الواجب)"); 
      
      if (warnings.length > 0) { 
          setSaveWarnings(warnings);
      } else {
          executeSaveLog();
      }
  };
  
  const handleGenerateEncouragement = async () => {
      if(!selectedStudent) return;
      const fakeLog: DailyLog = {
          id: 'temp', date: new Date().toISOString(), teacherId, teacherName, seenByParent: false,
          jadeed, murajaah: murajaahList
      };
      const msg = await generateEncouragement(selectedStudent.name, fakeLog);
      // Append to Notes instead of separate state
      const newNotes = notes ? notes + "\n\n" + msg : msg;
      setNotes(newNotes);
      markAsDirty();
      onShowNotification("تم إضافة الرسالة للملاحظات", "success");
  };

  const handleSendWhatsAppReport = () => {
      if(!selectedStudent || !selectedStudent.parentPhone) {
          onShowNotification("لا يوجد رقم هاتف لولي الأمر", "error");
          return;
      }
      
      const formatAss = (ass: QuranAssignment) => {
          if(ass.type === 'SURAH') return `سورة ${ass.name} (${ass.ayahFrom}-${ass.ayahTo}) - التقدير: ${ass.grade || ''}`;
          if(ass.type === 'RANGE') return `من ${ass.name} إلى ${ass.endName} - التقدير: ${ass.grade || ''}`;
          return `مراجعة ${ass.name} - التقدير: ${ass.grade || ''}`;
      };

      const jadeedText = jadeed ? `📖 الحفظ الجديد: ${formatAss(jadeed)}` : '';
      const murajaahText = murajaahList.length > 0 ? `↺ المراجعة: ${murajaahList.map(m => formatAss(m)).join('، ')}` : '';
      
      const nextJadeedText = nextJadeed ? `واجب غداً: سورة ${nextJadeed.name} (${nextJadeed.ayahFrom}-${nextJadeed.ayahTo})` : '';
      
      const fullMsg = `
*تقرير يومي للطالب: ${selectedStudent.name}* 🕌

${jadeedText}
${murajaahText}

📅 *الواجب القادم:*
${nextJadeedText}

📝 *ملاحظات المعلم:*
${notes || 'لا توجد ملاحظات'}

تاريخ: ${formatSimpleDate(new Date().toISOString())}
      `.trim();

      const url = `https://wa.me/2${selectedStudent.parentPhone}?text=${encodeURIComponent(fullMsg)}`;
      window.open(url, '_blank');
  };

  const handleAddToQuestionList = () => { if (!currentQuestion || !currentCorrect || !currentWrong1) { onShowNotification("يرجى ملء السؤال والإجابات", "error"); return; } const newQuiz: QuizItem = { id: 'q_' + Date.now(), question: currentQuestion, correctAnswer: currentCorrect, wrongAnswers: [currentWrong1, currentWrong2].filter(w => w.trim() !== '') }; setAdabQuestionsList([...adabQuestionsList, newQuiz]); setCurrentQuestion(''); setCurrentCorrect(''); setCurrentWrong1(''); setCurrentWrong2(''); onShowNotification("تم إضافة السؤال للقائمة", "success"); };
  const handleEditQuestionFromList = (q: QuizItem) => { setCurrentQuestion(q.question); setCurrentCorrect(q.correctAnswer); setCurrentWrong1(q.wrongAnswers[0] || ''); setCurrentWrong2(q.wrongAnswers[1] || ''); setAdabQuestionsList(prev => prev.filter(x => x.id !== q.id)); onShowNotification("تم تعبئة البيانات للتعديل", "success"); };
  
  const handlePublishAdabLesson = () => { if (adabQuestionsList.length === 0) { onShowNotification("يجب إضافة سؤال واحد على الأقل", "error"); return; } if (editingAdabId) { onEditAdab(editingAdabId, adabTitle, adabQuestionsList); setEditingAdabId(null); } else { onPublishAdab(adabTitle, adabQuestionsList); } setAdabQuestionsList([]); setAdabTitle('مجلس الآداب'); onShowNotification(editingAdabId ? "تم تعديل الدرس بنجاح" : "تم نشر الدرس بنجاح", "success"); };
  const handleEditAdabSession = (session: AdabSession) => { setEditingAdabId(session.id); setAdabTitle(session.title); setAdabQuestionsList(session.quizzes); setAdabTab('PUBLISH'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelEditAdab = () => { setEditingAdabId(null); setAdabTitle('مجلس الآداب'); setAdabQuestionsList([]); };
  
  // EXAM LOGIC UPDATED
  const handleAddExamDayToList = () => {
      if(!newExamDesc) { onShowNotification("يرجى كتابة المقرر للحفظ", "error"); return; }
      setExamList([...examList, { date: examDate, day: examDayName, description: newExamDesc }]);
      setNewExamDesc('');
      onShowNotification('تم إضافة اليوم للقائمة', 'success');
  };
  const handleRemoveExamDayFromList = (idx: number) => {
      const newList = [...examList];
      newList.splice(idx, 1);
      setExamList(newList);
  };
  const handlePublishExamAnnouncement = () => {
      if(!examTesterId) { onShowNotification('يرجى اختيار المعلم المختبر', 'error'); return; }
      if(examList.length === 0) { onShowNotification('يرجى إضافة يوم واحد على الأقل', 'error'); return; }
      
      let content = `📢 **إعلان اختبار الشهر** 📢\n\n`;
      content += `مع الشيخ: ${allTeachers?.find(t => t.id === examTesterId)?.name}\n\n`;
      
      if (newExamNote) {
          content += `⚠️ ملاحظة عامة: ${newExamNote}\n\n`;
      }

      content += `المواعيد المتاحة والمقرر:\n`;
      examList.forEach(e => {
          content += `🗓️ ${e.day} (${formatSimpleDate(e.date)})\n   📖 المقرر: ${e.description}\n`;
      });
      
      content += `\nيرجى الاستعداد والحضور في الموعد المحدد. بالتوفيق!`;

      // Pass type EXAM for differentiation
      onAddAnnouncement({ id: Date.now().toString(), teacherId, teacherName, content, date: new Date().toISOString(), type: 'EXAM' });
      setExamList([]);
      setNewExamNote('');
      setExamTesterId('');
      onShowNotification('تم نشر جدول الاختبارات', 'success');
  };

  const handleSendFeeReminder = () => {
      if(!selectedStudent || !feeMonth) {
          onShowNotification("يرجى اختيار الشهر", "error");
          return;
      }
      const updatedStudent = {
          ...selectedStudent,
          feeReminder: {
              month: feeMonth,
              amount: 0, // Not used in display
              dateSet: new Date().toISOString()
          }
      };
      onUpdateStudent(updatedStudent);
      onShowNotification("تم إرسال التذكير لولي الأمر", "success");
  };

  const handleAddPayment = () => {
      if(!selectedStudent || !feeMonth || !feeAmount) {
          onShowNotification("يرجى تعبئة البيانات", "error");
          return;
      }
      const newPayment: Payment = {
          id: 'pay_' + Date.now(),
          title: `رسوم شهر ${feeMonth}`,
          amount: parseFloat(feeAmount),
          date: new Date().toISOString(),
          recordedBy: teacherName,
          notes: feeNote
      };
      
      const updatedStudent = {
          ...selectedStudent,
          payments: [newPayment, ...selectedStudent.payments],
          feeReminder: undefined // Remove reminder on payment
      };
      onUpdateStudent(updatedStudent);
      setFeeAmount(''); setFeeNote('');
      onShowNotification("تم تسجيل الدفعة وإلغاء التذكير", "success");
  };

  const saveCalculatorNotes = () => {
      if(!selectedStudent) return;
      onUpdateStudent({ ...selectedStudent, calculatorNotes: calcNotes });
      onShowNotification("تم حفظ ملاحظات الخطة", "success");
  };

  const getStudentStatusForToday = (s: Student) => {
      const todayStr = new Date().toDateString();
      const log = s.logs.find(l => new Date(l.date).toDateString() === todayStr);
      
      if (log) {
          if (log.isAbsent) {
              if (log.notes?.includes('عذر') || log.notes?.includes('تبليغ')) {
                  return { text: "غائب بعذر", color: "text-orange-600", bg: "bg-orange-50" };
              }
              return { text: "غائب اليوم", color: "text-red-500", bg: "bg-red-50" };
          }
          return { text: "تم التسميع", color: "text-emerald-600", bg: "bg-emerald-50" };
      }
      
      // Check Drafts
      if (drafts[s.id]) {
          return { text: "قيد التسجيل...", color: "text-amber-600", bg: "bg-amber-50" };
      }
      
      return { text: "لم يسجل بعد", color: "text-gray-400", bg: "bg-gray-100" };
  };

  const renderStudentCard = (student: Student, idx: number) => {
    const status = getStudentStatusForToday(student);
    
    return (
      <div 
        key={student.id} 
        onClick={() => handleOpenStudent(student)}
        className="bg-paper p-4 rounded-3xl shadow-sm border border-transparent hover:border-secondary/30 transition-all cursor-pointer group relative overflow-hidden mb-3 text-center"
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')] pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center mb-2">
             {/* Name */}
             <h3 className="font-bold text-darkBrown text-2xl font-serif mb-1">{student.name}</h3>
             
             {/* Code */}
             <div className="bg-[#e8e4d9] px-2 py-0.5 rounded text-xs font-mono font-bold text-mutedBrown tracking-widest">
                 {student.parentCode}
             </div>
        </div>

        {/* Status */}
        <div className="flex justify-center mt-3">
            <span className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-sm ${status.bg} ${status.color}`}>
                {status.text}
            </span>
        </div>
      </div>
    );
  };

  const getSurahLabel = (name: string, from: number, to: number) => {
      const s = SURAH_DATA.find(x => x.name === name);
      if(s && from === 1 && to >= s.count) return "كاملة";
      return `(${from} - ${to})`;
  };

  return (
    <div className="min-h-screen bg-texture pb-20 relative font-sans">
       
       {/* Background Decoration */}
       <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-paper to-transparent pointer-events-none z-0"></div>

       {/* HEADER & MAIN NAV */}
       <div className="sticky top-0 z-30 bg-texture/95 backdrop-blur-md pt-6 pb-4 px-4 shadow-sm border-b border-darkBrown/5">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onLogout} className="bg-[#c2a266] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#b09055] transition flex items-center gap-1">
                   <span>خروج</span>
                   <span className="text-lg">🚪</span>
                </button>
                <div className="flex flex-col items-end">
                    <h2 className="font-bold text-darkBrown font-serif text-xl">أهلاً، {teacherName}</h2>
                    <p className="text-xs text-mutedBrown font-bold">لوحة المعلم</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white border-2 border-[#e8e4d9] shadow-md ml-2">
                    👳‍♂️
                </div>
            </div>

            {!selectedStudentId && (
                <div className="flex gap-3 mb-2">
                    <ActionButton 
                        id="LIST" 
                        label="الطلاب" 
                        icon="👥"
                        isActive={activeTab === 'LIST'} 
                        onClick={() => setActiveTab('LIST')} 
                        colorClass="bg-[#8f964d]" 
                    />
                    <ActionButton 
                        id="ADD" 
                        label="إضافة +" 
                        isActive={activeTab === 'ADD'} 
                        onClick={() => setActiveTab('ADD')} 
                        colorClass="bg-[#8f964d]" 
                    />
                    <ActionButton 
                        id="ATTENDANCE" 
                        label="الغياب" 
                        icon="📅"
                        isActive={activeTab === 'ATTENDANCE'} 
                        onClick={() => setActiveTab('ATTENDANCE')} 
                        colorClass="bg-[#788247]" 
                    />
                </div>
            )}
       </div>

       <div className="p-4 max-w-lg mx-auto relative z-10 min-h-[60vh]">
            
            {!selectedStudentId ? (
                <>
                    {/* STUDENTS LIST */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Search Bar matching Image 0 */}
                            <div className="flex gap-2 mb-2">
                                 <button onClick={() => setSortMethod(sortMethod === 'ALPHABETICAL' ? 'CODE' : 'ALPHABETICAL')} className="bg-[#dcd9cf] w-12 h-12 rounded-xl flex items-center justify-center text-darkBrown shadow-sm shrink-0">
                                     {sortMethod === 'ALPHABETICAL' ? 'أ-ي' : '123'}
                                 </button>
                                 <div className="flex-1 bg-[#dcd9cf] rounded-xl flex items-center px-4 shadow-inner">
                                    <input 
                                        type="text" 
                                        placeholder="ابحث بالاسم أو الكود..." 
                                        className="w-full bg-transparent outline-none text-darkBrown placeholder:text-gray-500 font-bold text-right py-3" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="text-gray-500 text-lg ml-2">🔍</span>
                                 </div>
                            </div>

                            {sortedStudents.length === 0 ? (
                                <div className="text-center py-10 bg-paper rounded-3xl border border-dashed border-gray-300 mx-4">
                                    <p className="text-gray-400 mb-2">لا يوجد طلاب مطابقين.</p>
                                    <Button onClick={() => setActiveTab('ADD')} variant="secondary">إضافة طالب جديد</Button>
                                </div>
                            ) : (
                                <div className="pb-2">
                                    {sortedStudents.map((s, idx) => renderStudentCard(s, idx))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD STUDENT */}
                    {activeTab === 'ADD' && (
                        <div className="bg-paper p-6 rounded-3xl shadow-lg border border-white animate-slide-up">
                            <h3 className="text-xl font-bold text-darkBrown font-serif mb-6 text-center border-b pb-4">إضافة طالب جديد</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-mutedBrown mb-2">اسم الطالب</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-secondary outline-none text-darkBrown font-bold"
                                        placeholder="الاسم الثلاثي"
                                        value={newStudentName}
                                        onChange={e => setNewStudentName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-mutedBrown mb-2">كود الطالب (لولي الأمر)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-secondary outline-none text-center text-lg tracking-widest font-mono"
                                        placeholder="مثال: 1005"
                                        value={newStudentCode}
                                        onChange={e => setNewStudentCode(e.target.value)}
                                    />
                                </div>
                                <Button 
                                    onClick={() => {
                                        if(newStudentName && newStudentCode) {
                                            const exists = students.some(s => s.parentCode === newStudentCode);
                                            if (exists) { onShowNotification('هذا الكود مستخدم بالفعل!', 'error'); return; }
                                            onAddStudent(newStudentName, newStudentCode);
                                            setNewStudentName(''); setNewStudentCode('');
                                            onShowNotification('تمت إضافة الطالب بنجاح', 'success');
                                            setActiveTab('LIST');
                                        } else {
                                            onShowNotification('يرجى ملء البيانات', 'error');
                                        }
                                    }} 
                                    className="w-full py-4 text-lg font-serif mt-4 bg-primary hover:bg-primaryDark rounded-2xl shadow-xl"
                                >
                                    حفظ وإضافة
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ATTENDANCE */}
                    {activeTab === 'ATTENDANCE' && (
                        <div className="bg-paper p-4 rounded-3xl shadow-lg border border-white animate-slide-up">
                             <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-xl">
                                <h3 className="font-bold text-darkBrown mr-2">تسجيل الغياب اليومي</h3>
                                <button 
                                    onClick={handleToggleSelectAllAbsent} 
                                    className={`text-xs px-3 py-2 rounded-lg font-bold transition-all shadow-sm ${isSelectAllMode ? 'bg-gray-200 text-gray-700' : 'bg-red-50 text-red-600 border border-red-200'}`}
                                >
                                    {isSelectAllMode ? 'إلغاء التحديد ❌' : 'تحديد الكل غياب ✅'}
                                </button>
                            </div>
                            
                            {unloggedStudents.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-emerald-600 font-bold mb-2">✅ تم تسجيل الجميع</p>
                                    <p className="text-xs text-gray-400">جميع الطلاب لديهم سجلات لهذا اليوم.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {unloggedStudents.map(s => {
                                        const status = attendanceMap[s.id];
                                        return (
                                            <div key={s.id} onClick={() => toggleStudentStatus(s.id)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${status === 'ABSENT' ? 'bg-red-50 border-red-300 shadow-inner' : status === 'EXCUSED' ? 'bg-orange-50 border-orange-300 shadow-inner' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                                <span className="font-bold text-gray-700">{s.name}</span>
                                                <div className="flex gap-1">
                                                    {status === 'ABSENT' ? <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">غياب</span> :
                                                     status === 'EXCUSED' ? <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold">عذر</span> :
                                                     <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-xs">--</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {unloggedStudents.length > 0 && (
                                 <Button onClick={handleBatchAttendanceSubmit} className="w-full py-4 shadow-xl bg-darkBrown text-white font-bold text-lg rounded-2xl">
                                     حفظ الغياب ({Object.keys(attendanceMap).length})
                                 </Button>
                            )}
                        </div>
                    )}

                    {/* NEW: SECONDARY TABS AT BOTTOM AS GRID */}
                    {['ANNOUNCEMENTS', 'ADAB', 'STATS', 'DELETE'].includes(activeTab) && (
                        <div className="bg-paper p-4 rounded-3xl shadow-lg border border-white animate-slide-up min-h-[300px] mb-8">
                            
                            {/* ANNOUNCEMENTS TAB */}
                            {activeTab === 'ANNOUNCEMENTS' && (
                                <div>
                                    <div className="flex gap-2 mb-4">
                                        <button onClick={() => setAnnouncementTab('GENERAL')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${announcementTab === 'GENERAL' ? 'bg-darkBrown text-white' : 'bg-gray-100 text-gray-600'}`}>عام</button>
                                        <button onClick={() => setAnnouncementTab('EXAM')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${announcementTab === 'EXAM' ? 'bg-darkBrown text-white' : 'bg-gray-100 text-gray-600'}`}>اختبار شهر</button>
                                    </div>

                                    {announcementTab === 'GENERAL' ? (
                                        <>
                                            <h3 className="font-bold text-center mb-4">📢 نشر إعلان عام</h3>
                                            <textarea className="w-full p-3 border rounded-xl text-sm bg-gray-50 focus:bg-white transition mb-2 min-h-[100px]" placeholder="اكتب نص الإعلان هنا..." value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)}></textarea>
                                            
                                            {/* EXPIRY DATE INPUT */}
                                            <div className="flex gap-2 mb-2">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-500 block mb-1">تاريخ انتهاء الإعلان (اختفاء تلقائي)</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full p-2 border rounded-xl bg-gray-50 text-sm" 
                                                        value={announcementExpiry} 
                                                        onChange={(e) => setAnnouncementExpiry(e.target.value)} 
                                                    />
                                                </div>
                                            </div>

                                            <Button onClick={() => { 
                                                if(announcementText) { 
                                                    const expiresAt = announcementExpiry ? new Date(announcementExpiry) : undefined;
                                                    if (expiresAt) expiresAt.setHours(23, 59, 59, 999); // End of selected day

                                                    onAddAnnouncement({ 
                                                        id: Date.now().toString(), 
                                                        teacherId, 
                                                        teacherName, 
                                                        content: announcementText, 
                                                        date: new Date().toISOString(), 
                                                        type: 'GENERAL',
                                                        expiresAt: expiresAt?.toISOString()
                                                    }); 
                                                    setAnnouncementText(''); 
                                                    setAnnouncementExpiry('');
                                                    onShowNotification('تم النشر', 'success'); 
                                                } 
                                            }} className="w-full rounded-xl py-3">نشر الإعلان</Button>
                                            
                                            <div className="mt-6 space-y-2">
                                                <h4 className="font-bold text-xs text-gray-500 mb-2">الإعلانات السابقة:</h4>
                                                {announcements.filter(a => a.type === 'GENERAL').map(a => (
                                                    <div key={a.id} className="bg-gray-50 p-3 rounded-xl text-sm relative border border-gray-100">
                                                        <p>{a.content}</p>
                                                        {a.expiresAt && <p className="text-[10px] text-gray-400 mt-1">ينتهي في: {formatSimpleDate(a.expiresAt)}</p>}
                                                        <button onClick={() => onDeleteAnnouncement(a.id)} className="absolute top-1 left-2 text-red-500 font-bold bg-white px-2 rounded-full shadow-sm">×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-center mb-4">📝 جدول اختبارات الشهر</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500">اسم المحفظ المختبر</label>
                                                    <select className="w-full p-3 border rounded-xl bg-gray-50" value={examTesterId} onChange={e => setExamTesterId(e.target.value)}>
                                                        <option value="">-- اختر --</option>
                                                        {allTeachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500">ملاحظة عامة للإعلان</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-3 border rounded-xl bg-white" 
                                                        placeholder="مثال: الحضور بالزي الرسمي" 
                                                        value={newExamNote} 
                                                        onChange={e => setNewExamNote(e.target.value)} 
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-gray-500">التاريخ</label>
                                                        <input type="date" className="w-full p-3 border rounded-xl bg-gray-50" value={examDate} onChange={e => setExamDate(e.target.value)} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-gray-500">اليوم</label>
                                                        <input type="text" className="w-full p-3 border rounded-xl bg-gray-200 text-gray-600" value={examDayName} readOnly />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500">ماذا سيسمع (المقرر)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-3 border rounded-xl bg-gray-50" 
                                                        placeholder="مثال: الجديد، المراجعة، أو جزء عم كاملاً" 
                                                        value={newExamDesc} 
                                                        onChange={e => setNewExamDesc(e.target.value)} 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleAddExamDayToList} 
                                                    className="w-full bg-[#a38650] hover:bg-[#8c7343] text-white font-bold py-3 rounded-xl shadow-md transition transform active:scale-95 text-sm"
                                                >
                                                    إضافة هذا اليوم للقائمة +
                                                </button>

                                                {examList.length > 0 && (
                                                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 mt-2">
                                                        <h5 className="font-bold text-xs mb-2">الأيام المضافة:</h5>
                                                        {examList.map((ex, i) => (
                                                            <div key={i} className="flex flex-col text-sm border-b border-yellow-100 last:border-0 py-2 relative">
                                                                <button onClick={() => handleRemoveExamDayFromList(i)} className="absolute top-2 left-0 text-red-500 font-bold text-xs">حذف</button>
                                                                <span className="block font-bold">{ex.day} ({formatSimpleDate(ex.date)})</span>
                                                                <span className="text-xs text-gray-600 mt-1">📖 {ex.description}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <Button onClick={handlePublishExamAnnouncement} className="w-full py-3 rounded-xl mt-4">نشر الجدول النهائي</Button>
                                                
                                                <div className="pt-4 border-t mt-4">
                                                    <button onClick={() => setShowExamArchive(!showExamArchive)} className="text-xs text-mutedBrown font-bold flex items-center gap-1">
                                                        {showExamArchive ? '🔽 إخفاء الأرشيف' : '▶️ عرض أرشيف الاختبارات السابقة'}
                                                    </button>
                                                    {showExamArchive && (
                                                        <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded-xl border">
                                                            {announcements.filter(a => a.type === 'EXAM').length === 0 ? <p className="text-center text-xs text-gray-400">لا يوجد اختبارات سابقة</p> : 
                                                            announcements.filter(a => a.type === 'EXAM').map(a => (
                                                                <div key={a.id} className="text-xs bg-white p-2 rounded border flex justify-between items-center">
                                                                    <span>{formatSimpleDate(a.date)}</span>
                                                                    <ConfirmDeleteButton label="حذف" onConfirm={() => onDeleteAnnouncement(a.id)} className="bg-red-50 text-red-500 border border-red-100" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* STATS TAB */}
                            {activeTab === 'STATS' && (
                                <div>
                                    <h3 className="font-bold text-center mb-4">📊 التقرير اليومي</h3>
                                    <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-xl">
                                        <span className="text-xs font-bold text-gray-500">تاريخ التقرير:</span>
                                        <input type="date" className="flex-1 p-2 border rounded-lg bg-white text-sm" value={statsDate} onChange={e => setStatsDate(e.target.value)} />
                                    </div>

                                    {(() => {
                                        const targetDate = new Date(statsDate).toDateString();
                                        const presentList = students.filter(s => s.logs.some(l => !l.isAbsent && new Date(l.date).toDateString() === targetDate));
                                        const absentList = students.filter(s => s.logs.some(l => l.isAbsent && new Date(l.date).toDateString() === targetDate));
                                        
                                        const totalStudents = students.length;
                                        const attendancePercentage = totalStudents > 0 ? Math.round((presentList.length / totalStudents) * 100) : 0;

                                        return (
                                            <div>
                                                <div className="flex justify-center mb-6">
                                                    <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-inner border-4 border-gray-100">
                                                        <div className="text-center">
                                                            <span className={`text-xl font-black ${attendancePercentage > 75 ? 'text-green-600' : attendancePercentage > 50 ? 'text-yellow-600' : 'text-red-600'}`}>{attendancePercentage}%</span>
                                                            <p className="text-[10px] text-gray-400 font-bold">نسبة الحضور</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                                                        <h4 className="font-bold text-emerald-800 text-sm mb-2 text-center border-b border-emerald-200 pb-1">الحضور ({presentList.length})</h4>
                                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                                            {presentList.map(s => <p key={s.id} className="text-xs text-emerald-700 font-bold">{s.name}</p>)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                                                        <h4 className="font-bold text-red-800 text-sm mb-2 text-center border-b border-red-200 pb-1">الغياب ({absentList.length})</h4>
                                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                                            {absentList.map(s => <p key={s.id} className="text-xs text-red-700 font-bold">{s.name}</p>)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* WhatsApp Button */}
                                                <button 
                                                    onClick={() => {
                                                        const msg = `تقرير الحضور - ${targetDate}\n✅ حضور: ${presentList.length}\n❌ غياب: ${absentList.length}\n📊 نسبة الحضور: ${attendancePercentage}%`;
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                    className="w-full bg-[#1e5233] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#163d26] transition"
                                                >
                                                    <span className="text-xl">💬</span> إرسال تقرير واتساب
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* DELETE TAB */}
                            {activeTab === 'DELETE' && (
                                <div>
                                    <h3 className="font-bold text-center mb-4 text-red-600">🗑️ حذف طلاب</h3>
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {sortedStudents.map(s => (
                                            <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <span className="font-bold text-sm">{s.name}</span>
                                                <ConfirmDeleteButton label="حذف" onConfirm={() => onDeleteStudents([s.id])} className="bg-white shadow-sm border" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* NEW: Bottom Navigation Grid */}
                    {!selectedStudentId && (
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            <ActionButton 
                                id="ANNOUNCEMENTS" 
                                label="إعلانات" 
                                icon="📢" 
                                isActive={activeTab === 'ANNOUNCEMENTS'} 
                                onClick={() => setActiveTab('ANNOUNCEMENTS')} 
                                colorClass="bg-[#8f964d]"
                            />
                            <ActionButton 
                                id="ADAB" 
                                label="الآداب" 
                                icon="🌟" 
                                isActive={activeTab === 'ADAB'} 
                                onClick={() => setActiveTab('ADAB')} 
                                colorClass="bg-[#8f964d]"
                            />
                            <ActionButton 
                                id="STATS" 
                                label="إحصاء" 
                                icon="📊" 
                                isActive={activeTab === 'STATS'} 
                                onClick={() => setActiveTab('STATS')} 
                                colorClass="bg-[#8f964d]"
                            />
                            <ActionButton 
                                id="DELETE" 
                                label="حذف" 
                                icon="🗑️" 
                                isActive={activeTab === 'DELETE'} 
                                onClick={() => setActiveTab('DELETE')} 
                                colorClass="bg-red-500"
                            />
                        </div>
                    )}
                </>
            ) : (
                // STUDENT DETAIL VIEW
                <div className="animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handleCloseStudent} className="bg-paper p-2 rounded-full shadow-sm text-darkBrown font-bold">⬅ رجوع</button>
                        {/* Edit Mode Indicator */}
                        {currentLogId && (
                            <div className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 animate-pulse">
                                ✏️ وضع تعديل سجل سابق
                            </div>
                        )}
                    </div>
                    
                    {/* PHONE NUMBER & WHATSAPP DISPLAY (MOVED HERE) */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <h2 className="font-bold text-3xl text-darkBrown font-serif mb-1">{selectedStudent?.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-mono font-bold text-darkBrown tracking-widest">{selectedStudent?.parentPhone}</span>
                            <div className="flex gap-1">
                                <button onClick={() => {
                                    const newP = prompt("تعديل رقم الهاتف:", selectedStudent?.parentPhone);
                                    if (newP) onUpdateStudent({...selectedStudent!, parentPhone: newP});
                                }} className="text-secondary hover:text-secondaryDark text-lg">✏️</button>
                                <button onClick={() => {
                                    if(selectedStudent?.parentPhone) window.open(`https://wa.me/2${selectedStudent.parentPhone}`, '_blank');
                                }} className="text-green-600 hover:text-green-700 text-lg bg-white rounded-full p-1 shadow-sm">💬</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Student Tabs */}
                    <div className="flex overflow-x-auto gap-2 pb-2 mb-2 touch-pan-x bg-paper p-2 rounded-2xl shadow-sm border border-white no-scrollbar">
                        <button onClick={() => setStudentTab('LOG')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'LOG' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>📝 تسجيل</button>
                        <button onClick={() => setStudentTab('PLAN')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'PLAN' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>📅 اللوح</button>
                        <button onClick={() => setStudentTab('ARCHIVE')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'ARCHIVE' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>🗄️ الأرشيف</button>
                        <button onClick={() => setStudentTab('CALC')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'CALC' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>🔢 الحاسبة</button>
                        <button onClick={() => setStudentTab('SCHEDULE')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'SCHEDULE' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>🕒 المواعيد</button>
                        <button onClick={() => setStudentTab('FEES')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'FEES' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-500'}`}>💰 الرسوم</button>
                    </div>

                    <div className="bg-paper rounded-3xl shadow-lg p-3 border border-white relative min-h-[300px]">
                        
                        {/* IN-APP WARNING MODAL - SMALLER */}
                        {saveWarnings.length > 0 && (
                            <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-4 rounded-3xl animate-fade-in text-center max-w-sm mx-auto">
                                <div className="text-3xl mb-2">⚠️</div>
                                <h4 className="font-bold text-red-600 text-sm mb-2">تنبيه هام</h4>
                                <ul className="text-xs text-gray-700 mb-4 space-y-1 list-disc list-inside text-right w-full font-bold">
                                    {saveWarnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                                <div className="flex gap-2 w-full">
                                    <Button onClick={() => setSaveWarnings([])} variant="outline" className="flex-1 text-xs py-2">تراجع</Button>
                                    <Button onClick={executeSaveLog} variant="danger" className="flex-1 text-xs py-2">حفظ وتجاهل</Button>
                                </div>
                            </div>
                        )}

                        {studentTab === 'LOG' && (
                            <div className="space-y-3">
                                {/* ATTENDANCE SECTION */}
                                <div className="bg-white border-2 border-gray-200 p-2 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                                        <h4 className="text-xs font-bold text-darkBrown">الحضور والانصراف 🕒</h4>
                                        <button onClick={() => setAttendanceRecords([...attendanceRecords, { id: Date.now().toString(), arrival: '16:00', departure: '17:00' }])} className="text-[10px] bg-primary text-white px-2 py-1 rounded hover:bg-primaryDark">+</button>
                                    </div>
                                    <div className="grid gap-2">
                                        {attendanceRecords.map((att, idx) => (
                                            <div key={att.id} className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-100">
                                                {/* Button moved to Start (Right in RTL) */}
                                                <button 
                                                    onClick={() => setAttendanceRecords(attendanceRecords.filter((_, i) => i !== idx))} 
                                                    className="bg-red-50 text-red-500 w-6 h-6 flex items-center justify-center rounded-full border border-red-100 hover:bg-red-100 transition text-xs font-bold"
                                                >
                                                    ✕
                                                </button>
                                                <div className="scale-90 origin-right">
                                                    <TimePicker value={att.arrival} onChange={(v) => { const n = [...attendanceRecords]; n[idx].arrival = v; setAttendanceRecords(n); }} />
                                                </div>
                                                <span className="text-gray-400 font-bold text-xs">-</span>
                                                <div className="scale-90 origin-right">
                                                    <TimePicker value={att.departure || ''} onChange={(v) => { const n = [...attendanceRecords]; n[idx].departure = v; setAttendanceRecords(n); }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <AssignmentForm title="📖 الحفظ الجديد" data={jadeed} onChange={(f, v) => { setJadeed({ ...jadeed, [f]: v }); markAsDirty(); }} colorClass="border-primary/20 bg-primary/5" />
                                <div className="space-y-2">
                                    {murajaahList.map((m, idx) => (
                                        <AssignmentForm key={idx} title={`مراجعة ${idx + 1}`} data={m} onChange={(f, v) => { const newList = [...murajaahList]; newList[idx] = { ...newList[idx], [f]: v }; setMurajaahList(newList); markAsDirty(); }} colorClass="border-secondary/20 bg-secondary/5" canRemove onRemove={() => { setMurajaahList(murajaahList.filter((_, i) => i !== idx)); markAsDirty(); }} />
                                    ))}
                                    <button onClick={() => setMurajaahList([...murajaahList, { ...emptyAssignment, grade: Grade.VERY_GOOD }])} className="text-xs bg-secondary text-white px-3 py-1 rounded-full">+ إضافة مراجعة</button>
                                </div>
                                
                                {/* Notes & Encouragement */}
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-gray-500">ملاحظات المعلم (تظهر لولي الأمر)</h4>
                                        <Button onClick={handleGenerateEncouragement} variant="outline" className="text-[10px] px-2 py-1 h-auto">رسالة تشجيعية ✨</Button>
                                    </div>
                                    <textarea className="w-full p-2 border rounded-lg text-sm bg-white" rows={5} value={notes} onChange={e => { setNotes(e.target.value); markAsDirty(); }} placeholder="اكتب ملاحظاتك هنا..."></textarea>
                                </div>

                                <Button onClick={handleSaveLog} className="w-full py-4 text-lg bg-primary hover:bg-primaryDark rounded-2xl shadow-lg mt-4">
                                    {currentLogId ? '💾 حفظ التعديلات' : '💾 حفظ السجل'}
                                </Button>
                                {currentLogId && (
                                     <p className="text-center text-[10px] text-gray-400 mt-2">يتم تعديل سجل محفوظ مسبقاً</p>
                                )}

                                <button 
                                    onClick={handleSendWhatsAppReport}
                                    className="w-full bg-[#0a451d] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#073315] transition mt-2"
                                >
                                    <span className="text-xl">💬</span> إرسال التقرير لولي الأمر
                                </button>
                            </div>
                        )}
                        {studentTab === 'PLAN' && (
                            <div className="space-y-4 text-center">
                                <h3 className="font-bold text-darkBrown">الواجب القادم</h3>
                                <AssignmentForm title="حفظ قادم" data={nextJadeed} onChange={(f, v) => setNextJadeed({ ...nextJadeed, [f]: v })} colorClass="border-gray-200 bg-gray-50" hideGrade />
                                <div className="space-y-2">
                                    {nextMurajaahList.map((m, idx) => (
                                        <AssignmentForm key={idx} title={`مراجعة قادمة ${idx+1}`} data={m} onChange={(f, v) => {const l=[...nextMurajaahList]; l[idx]={...l[idx],[f]:v}; setNextMurajaahList(l);}} colorClass="border-gray-200 bg-gray-50" hideGrade canRemove onRemove={() => setNextMurajaahList(nextMurajaahList.filter((_, i) => i !== idx))} />
                                    ))}
                                    <button onClick={() => setNextMurajaahList([...nextMurajaahList, { ...emptyAssignment }])} className="text-xs bg-gray-400 text-white px-3 py-1 rounded-full">+ مراجعة</button>
                                </div>
                                <Button onClick={handleSaveLog} className="w-full py-3 bg-secondary hover:bg-secondaryDark rounded-xl mt-4">حفظ الخطة (ثابت)</Button>
                            </div>
                        )}
                        
                        {/* IMPROVED ARCHIVE: FULL DETAILS */}
                        {studentTab === 'ARCHIVE' && (
                             <div className="space-y-4">
                                 {selectedStudent?.logs.length === 0 ? <p className="text-center text-gray-400">لا يوجد سجلات سابقة</p> : 
                                 selectedStudent?.logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                                     // Helper to format assignments in archive
                                     const formatArchAss = (a: QuranAssignment) => {
                                         if(!a) return "";
                                         if(a.type === 'MULTI') {
                                             return a.multiSurahs?.map(s => `${s.name} [${s.grade || '-'}]`).join(' + ');
                                         }
                                         const label = a.type === 'SURAH' ? getSurahLabel(a.name, a.ayahFrom, a.ayahTo) : `(${a.ayahFrom} - ${a.ayahTo})`;
                                         return `${a.name} ${label} [${a.grade || '-'}]`;
                                     };

                                     return (
                                     <div key={log.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm relative shadow-sm">
                                         <div className="flex justify-between font-bold mb-2 items-center border-b pb-2 border-gray-200">
                                             <span className="text-darkBrown">{formatSimpleDate(log.date)}</span>
                                             <div className="flex gap-2">
                                                 <span className={`px-2 rounded text-xs ${log.isAbsent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                     {log.isAbsent ? 'غائب' : 'حضور'}
                                                 </span>
                                                 <button onClick={() => handleEditLog(log)} className="text-blue-600 px-1 font-bold">تعديل ✏️</button>
                                                 <button onClick={() => handleDeleteLog(log.id)} className="text-red-600 px-1 font-bold">حذف 🗑️</button>
                                             </div>
                                         </div>
                                         
                                         {!log.isAbsent && (
                                             <div className="space-y-2 mt-2">
                                                 {log.attendance && log.attendance.length > 0 && (
                                                     <div className="text-xs font-bold text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                         🕒 الحضور: {log.attendance.map(a => `${formatTime12Hour(a.arrival)}-${formatTime12Hour(a.departure || '')}`).join(', ')}
                                                     </div>
                                                 )}
                                                 
                                                 <div className="grid grid-cols-1 gap-1">
                                                     {log.jadeed && (
                                                         <div className="bg-primary/5 p-2 rounded border border-primary/10">
                                                             <span className="text-primary font-bold">📖 حفظ جديد: </span>
                                                             <span className="text-darkBrown">{formatArchAss(log.jadeed)}</span>
                                                         </div>
                                                     )}
                                                     {log.murajaah && log.murajaah.length > 0 && (
                                                         <div className="bg-secondary/5 p-2 rounded border border-secondary/10">
                                                             <span className="text-secondaryDark font-bold">↺ مراجعة: </span>
                                                             {log.murajaah.map((m, i) => (
                                                                 <div key={i} className="text-darkBrown mr-4 border-r-2 border-secondary/20 pr-2 my-1">{formatArchAss(m)}</div>
                                                             ))}
                                                         </div>
                                                     )}
                                                 </div>

                                                 {log.notes && <div className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border italic">📝 {log.notes}</div>}
                                             </div>
                                         )}
                                         {log.isAbsent && log.notes && <p className="text-xs text-red-500 mt-1">{log.notes}</p>}
                                     </div>
                                 )})}
                             </div>
                        )}

                        {/* PLAN CALCULATOR TAB */}
                        {studentTab === 'CALC' && (
                            <div className="text-center">
                                <h3 className="font-bold text-darkBrown mb-4">حاسبة الخطة الشهرية</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-1">كمية الحفظ اليومي (بالأسطر)</label>
                                        <input type="number" className="w-full p-3 border rounded-xl text-center font-bold" placeholder="مثال: 15" value={calcLines} onChange={e => setCalcLines(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-1">عدد أيام الحضور في الأسبوع</label>
                                        <input type="number" className="w-full p-3 border rounded-xl text-center font-bold" placeholder="مثال: 3" value={calcDays} onChange={e => setCalcDays(e.target.value)} />
                                    </div>
                                    
                                    {calcLines && calcDays && (
                                        <div className="mt-6 bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                                            <p className="text-xs text-secondaryDark font-bold mb-2">إجمالي الحفظ المتوقع نهاية الشهر:</p>
                                            {(() => {
                                                const lines = parseInt(calcLines);
                                                const weeklyAttendance = parseInt(calcDays);
                                                
                                                if (weeklyAttendance > 0) {
                                                    const today = new Date();
                                                    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                                                    let workingDays = 0;
                                                    
                                                    for (let d = today.getDate(); d <= lastDay; d++) {
                                                        const date = new Date(today.getFullYear(), today.getMonth(), d);
                                                        const dayOfWeek = date.getDay(); // 0 Sun, 3 Wed, 5 Fri
                                                        if (dayOfWeek !== 3 && dayOfWeek !== 5) {
                                                            workingDays++;
                                                        }
                                                    }
                                                    const totalLines = workingDays * lines;
                                                    const pages = (totalLines / 15).toFixed(1);

                                                    return (
                                                        <div>
                                                            <p className="text-3xl font-bold text-darkBrown">{totalLines} سطر</p>
                                                            <p className="text-sm text-gray-500">حوالي {pages} صفحة</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">تم استبعاد الجمعة والأربعاء من الحساب</p>
                                                        </div>
                                                    );
                                                }
                                                return <p>--</p>;
                                            })()}
                                        </div>
                                    )}

                                    {/* CALCULATOR NOTES */}
                                    <div className="mt-4 text-left">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">ملاحظات الخطة (حفظ)</label>
                                        <textarea 
                                            className="w-full p-2 border rounded-lg text-sm bg-gray-50" 
                                            rows={3} 
                                            placeholder="اكتب تفاصيل الخطة هنا لحفظها..." 
                                            value={calcNotes} 
                                            onChange={e => setCalcNotes(e.target.value)}
                                        ></textarea>
                                        <Button onClick={saveCalculatorNotes} className="mt-2 w-full text-xs">حفظ الملاحظة</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SCHEDULE TAB */}
                        {studentTab === 'SCHEDULE' && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-center mb-4 text-darkBrown">جدول المواعيد</h3>
                                {selectedStudent?.weeklySchedule?.map((daySched, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="font-bold text-sm text-gray-700">{daySched.day}</span>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {daySched.events.length > 0 ? (
                                                daySched.events.map((ev, idx) => (
                                                    <span key={idx} className="bg-white px-2 py-1 rounded text-xs border text-primary font-bold shadow-sm">{formatTime12Hour(ev.time)}</span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400">--</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FEES TAB */}
                        {studentTab === 'FEES' && (
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-sm mb-3">تسجيل دفعة جديدة / تذكير</h4>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <select className="p-2 border rounded text-sm" value={feeMonth} onChange={e => setFeeMonth(e.target.value)}>
                                            <option value="">اختر الشهر</option>
                                            {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <input type="number" className="p-2 border rounded text-sm" placeholder="المبلغ (للدفع)" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} />
                                    </div>
                                    <input type="text" className="w-full p-2 border rounded text-sm mb-3" placeholder="ملاحظات (للدفع)" value={feeNote} onChange={e => setFeeNote(e.target.value)} />
                                    
                                    <div className="flex gap-2">
                                        <Button onClick={handleSendFeeReminder} variant="outline" className="flex-1 text-xs">إرسال تذكير 🔔</Button>
                                        <Button onClick={handleAddPayment} className="flex-1 text-xs">تسجيل الدفعة 💰</Button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 text-center">التذكير يرسل الشهر فقط. الدفع يتطلب المبلغ.</p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-xs text-gray-500 mb-2">سجل المدفوعات:</h4>
                                    {selectedStudent?.payments.length === 0 ? <p className="text-center text-gray-400 text-sm">لا يوجد مدفوعات</p> : 
                                    selectedStudent?.payments.map(p => (
                                        <div key={p.id} className="bg-green-50 p-3 rounded-xl border border-green-100 mb-2 text-sm flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-green-800">{p.title}</span>
                                                <span className="text-xs text-green-600 block">{formatSimpleDate(p.date)}</span>
                                            </div>
                                            <span className="font-bold text-lg">{p.amount} ج.م</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Branding */}
            {!selectedStudentId && (
                <div className="mt-8 text-center pb-8">
                    <h1 className="font-serif text-2xl text-darkBrown opacity-30">دار التوحيد</h1>
                    <p className="text-[10px] text-mutedBrown opacity-50">وفقكم الله لكل خير</p>
                </div>
            )}
       </div>
    </div>
  );
};
