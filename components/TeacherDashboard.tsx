
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, DailyLog, Grade, QuranAssignment, Announcement, Payment, QuizItem, Teacher, AttendanceRecord, MultiSurahDetail, ExamDayDetail, AdabSession, FeeReminder, Badge } from '../types';
import { SURAH_NAMES, JUZ_LIST, SURAH_DATA, formatDateDual, formatTime12Hour, formatSimpleDate, formatDateWithDay, DAYS_OF_WEEK, MONTHS_LIST, getSurahByPage, SURAH_START_PAGES, BADGE_TYPES } from '../constants';
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

  // Helper for Surah presets (Full, Half 1, Half 2)
  const applySurahPreset = (mode: 'FULL' | 'HALF_1' | 'HALF_2') => {
      if (!isSurah) return;
      const count = maxAyahs;
      const mid = Math.floor(count / 2);

      if (mode === 'FULL') {
          onChange('ayahFrom', 1);
          onChange('ayahTo', count);
      } else if (mode === 'HALF_1') {
          onChange('ayahFrom', 1);
          onChange('ayahTo', mid);
      } else if (mode === 'HALF_2') {
          // Fix: Start from mid + 1, End at count
          onChange('ayahFrom', mid + 1);
          onChange('ayahTo', count);
      }
  };

  return (
    <div className={`p-3 rounded-xl border-2 ${colorClass} mb-2 relative animate-fade-in dark:bg-opacity-10`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">{title}</h4>
        {canRemove && (
          <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded shadow-sm">
             ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2">
        {['SURAH', 'RANGE', 'JUZ', 'MULTI'].map(type => (
          <button
            key={type}
            className={`py-1 px-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${data.type === type ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-white text-gray-600 border dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}
            onClick={() => onChange('type', type)}
          >
            {type === 'SURAH' ? 'سورة' : type === 'RANGE' ? 'نطاق' : type === 'JUZ' ? 'جزء' : 'متعدد'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {data.type === 'JUZ' ? (
           <select 
             className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-base font-bold text-right"
             value={data.juzNumber || 1}
             onChange={(e) => {
                 const jNum = parseInt(e.target.value);
                 onChange('juzNumber', jNum);
                 onChange('name', JUZ_LIST[jNum - 1]);
             }}
           >
             {JUZ_LIST.map((j, i) => <option key={i} value={i+1}>{j}</option>)}
           </select>
        ) : isMulti ? (
            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-[10px] text-gray-400 mb-2">اختر السور المتفرقة مع التقدير:</p>
                <div className="space-y-2 mb-2">
                    {(data.multiSurahs || []).map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-600 pb-2 last:border-0">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold w-4 text-gray-500">{idx + 1}.</span>
                                <select 
                                    className="flex-1 p-1 border rounded text-base font-bold text-right dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                    value={item.name}
                                    onChange={(e) => handleUpdateMultiSurah(idx, 'name', e.target.value)}
                                >
                                    {SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => handleRemoveMultiSurah(idx)} className="text-red-500 font-bold px-2 bg-red-50 dark:bg-red-900/30 rounded">×</button>
                            </div>
                            {!hideGrade && (
                                <div className="flex items-center gap-2 mr-6">
                                    <span className="text-[10px] text-gray-400">التقدير:</span>
                                    <select
                                        className={`flex-1 p-2 border rounded text-xs font-bold h-auto min-h-[35px] text-right dark:bg-gray-600 dark:border-gray-500 ${item.grade === Grade.EXCELLENT ? 'text-emerald-600 dark:text-emerald-400' : item.grade === Grade.NEEDS_WORK ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}
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
                <button onClick={handleAddMultiSurah} className="w-full py-1 text-xs border border-dashed border-gray-400 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600">+ إضافة سورة أخرى</button>
            </div>
        ) : (
          <>
            <div className="flex gap-2">
               <div className="flex-1">
                 <label className="text-[10px] font-bold text-gray-500 block mb-1">من سورة</label>
                 <select 
                   className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-base font-bold text-right h-auto min-h-[40px] appearance-none pr-8"
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
                     className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-base font-bold text-right h-auto min-h-[40px] appearance-none pr-8"
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
              <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded-lg border dark:border-gray-600">
                     <div className="flex-1">
                        <label className="text-[10px] text-gray-400 block mb-0.5">من آية</label>
                        <select
                            className="w-full p-1 border rounded text-center font-bold bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 text-xl h-8 appearance-none"
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
                            className="w-full p-1 border rounded text-center font-bold bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 text-xl h-8 appearance-none"
                            value={data.ayahTo}
                            onChange={(e) => onChange('ayahTo', parseInt(e.target.value))}
                        >
                             {ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                  </div>
                  
                  {/* Quick Select Buttons */}
                  <div className="flex gap-1 justify-center">
                      <button onClick={() => applySurahPreset('HALF_1')} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600">النصف 1 (1-الوسط)</button>
                      <button onClick={() => applySurahPreset('FULL')} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600">كاملة</button>
                      <button onClick={() => applySurahPreset('HALF_2')} className="flex-1 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600">النصف 2 (الوسط-النهاية)</button>
                  </div>
              </div>
            )}
          </>
        )}

        {!hideGrade && !isMulti && (
          <div>
            <label className="text-[10px] font-bold text-gray-500 block mb-1">التقييم</label>
            <select
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none h-auto min-h-[42px] text-right appearance-none pr-8"
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

const ActionButton = ({ id, label, icon, isActive, onClick, colorClass, labelClassName }: { id: string, label: string, icon?: string, isActive: boolean, onClick: () => void, colorClass: string, labelClassName?: string }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-white font-bold text-xs sm:text-sm shadow-md transition-transform transform active:scale-95 ${colorClass} ${isActive ? 'ring-2 ring-white ring-offset-2 dark:ring-gray-800' : 'opacity-90'}`}
    >
        {icon && <span className="text-xl mb-1">{icon}</span>}
        <span className={`text-center w-full ${labelClassName}`}>{label}</span>
    </button>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm border-2 border-red-100 dark:border-red-900 text-center animate-slide-up">
                <div className="bg-red-50 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
                <h3 className="text-xl font-bold text-darkBrown dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex gap-3">
                    <Button onClick={onCancel} variant="outline" className="flex-1 py-3">إلغاء</Button>
                    <Button onClick={onConfirm} variant="danger" className="flex-1 py-3">تأكيد الحذف</Button>
                </div>
            </div>
        </div>
    );
};

const CertificateModal = ({ isOpen, onClose, studentName, achievement, teacherName }: { isOpen: boolean, onClose: () => void, studentName: string, achievement: string, teacherName: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-lg bg-white p-2 rounded-lg shadow-2xl animate-slide-up overflow-hidden">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">✕</button>
                
                {/* Certificate Design */}
                <div className="border-[10px] border-double border-[#c2a266] p-8 text-center bg-[#fffdf5] relative">
                    <div className="absolute top-2 left-2 text-4xl text-[#c2a266] opacity-50">❋</div>
                    <div className="absolute top-2 right-2 text-4xl text-[#c2a266] opacity-50">❋</div>
                    <div className="absolute bottom-2 left-2 text-4xl text-[#c2a266] opacity-50">❋</div>
                    <div className="absolute bottom-2 right-2 text-4xl text-[#c2a266] opacity-50">❋</div>

                    <h2 className="text-4xl font-serif font-bold text-[#43302b] mb-2">شهادة تقدير</h2>
                    <div className="w-32 h-1 bg-[#c2a266] mx-auto mb-6"></div>
                    
                    <p className="text-lg text-gray-600 font-serif mb-4">
                        تسر إدارة المسجد والشيخ <span className="font-bold text-[#1e5233]">{teacherName}</span> أن تمنح الطالب المتفوق
                    </p>
                    <h3 className="text-3xl font-bold text-[#1e5233] mb-4 font-serif">{studentName}</h3>
                    <p className="text-lg text-gray-600 font-serif mb-8">هذه الشهادة نظير تفوقه وتميزه في:</p>
                    <p className="text-2xl font-bold text-[#c2a266] mb-12 font-serif border-b-2 border-dashed border-gray-300 pb-2 inline-block min-w-[200px]">{achievement}</p>
                    
                    <div className="flex justify-between items-end mt-8 px-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-400 font-bold mb-2">التاريخ</p>
                            <p className="text-sm font-serif">{formatSimpleDate(new Date().toISOString())}</p>
                        </div>
                        <div className="w-16 h-16 bg-[#c2a266] rounded-full flex items-center justify-center text-white text-2xl shadow-inner border-4 border-double border-white">
                            🎖️
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-400 font-bold mb-2">توقيع الشيخ {teacherName}</p>
                            <p className="font-serif font-bold text-[#43302b]">..................</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-500 font-bold">💡 نصيحة: التقط صورة للشاشة (Screenshot) وشاركها مع ولي الأمر!</p>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Quick Badge Modal ---
const QuickBadgeModal = ({ isOpen, onClose, onGrant }: { isOpen: boolean, onClose: () => void, onGrant: (badgeId: string) => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up border-2 border-yellow-400 dark:border-yellow-600 relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl">×</button>
                <h3 className="text-center font-bold text-lg text-darkBrown dark:text-white mb-1">منح وسام سريع 🌟</h3>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">اضغط على الوسام لمنحه للطالب فوراً</p>
                
                <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
                    {BADGE_TYPES.map(badge => (
                        <button 
                            key={badge.id}
                            onClick={() => onGrant(badge.id)}
                            className="flex flex-col items-center p-2 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 transition active:scale-95"
                        >
                            <span className="text-3xl mb-1">{badge.icon}</span>
                            <span className="text-[10px] font-bold text-center leading-tight dark:text-gray-200">{badge.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

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
  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'DELETE' | 'ANNOUNCEMENTS' | 'ADAB' | 'ATTENDANCE' | 'STATS' | 'FEES'>('LIST');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<'ALPHABETICAL' | 'CODE'>('ALPHABETICAL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState('');

  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0]);

  const [studentTab, setStudentTab] = useState<'LOG' | 'PLAN' | 'ARCHIVE' | 'CALC' | 'SCHEDULE' | 'MONTHLY_REPORT' | 'BADGES'>('LOG');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');

  const [adabTab, setAdabTab] = useState<'PUBLISH' | 'ARCHIVE' | 'LEADERBOARD'>('PUBLISH'); 
  const [adabTitle, setAdabTitle] = useState('مجلس الآداب');
  const [adabQuestionsList, setAdabQuestionsList] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentCorrect, setCurrentCorrect] = useState('');
  const [currentWrong1, setCurrentWrong1] = useState('');
  const [currentWrong2, setCurrentWrong2] = useState('');
  const [editingAdabId, setEditingAdabId] = useState<string | null>(null);

  const [announcementTab, setAnnouncementTab] = useState<'GENERAL' | 'EXAM'>('GENERAL');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementExpiry, setAnnouncementExpiry] = useState('');
  const [showExamArchive, setShowExamArchive] = useState(false);

  const [examTesterId, setExamTesterId] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examDayName, setExamDayName] = useState(DAYS_OF_WEEK[new Date().getDay() === 6 ? 0 : new Date().getDay() + 1]); 
  const [newExamDesc, setNewExamDesc] = useState(''); 
  const [newExamNote, setNewExamNote] = useState(''); 
  const [examList, setExamList] = useState<{date: string, day: string, description: string}[]>([]); 

  const [calcLines, setCalcLines] = useState('');
  const [calcDays, setCalcDays] = useState('');
  const [calcNotes, setCalcNotes] = useState('');
  const [calcStartSurah, setCalcStartSurah] = useState(SURAH_NAMES[0]);
  const [calcStartAyah, setCalcStartAyah] = useState(1);
  const [calcDirection, setCalcDirection] = useState<'F2N' | 'N2F'>('F2N');

  const [activeFeePage, setActiveFeePage] = useState<string>(''); 
  const [newFeePageMonth, setNewFeePageMonth] = useState<string>(MONTHS_LIST[new Date().getMonth()]);
  const [newFeePageYear, setNewFeePageYear] = useState<number>(new Date().getFullYear());
  const initialPage = `${MONTHS_LIST[new Date().getMonth()]} ${new Date().getFullYear()}`;
  const [feePages, setFeePages] = useState<string[]>([initialPage]); 
  const [paymentEntries, setPaymentEntries] = useState<Record<string, { amount: string, date: string, notes: string }>>({});
  const [closedPages, setClosedPages] = useState<string[]>([]); 
  const [feeSearchQuery, setFeeSearchQuery] = useState(''); 

  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateAchievement, setCertificateAchievement] = useState('');
  
  // NEW: Quick Badge
  const [showQuickBadge, setShowQuickBadge] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'ABSENT' | 'EXCUSED' | null>>({});
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  const calcAyahOptions = useMemo(() => {
      const s = SURAH_DATA.find(x => x.name === calcStartSurah);
      if (!s) return [1];
      return Array.from({length: s.count}, (_, i) => i + 1);
  }, [calcStartSurah]);

  useEffect(() => { const d = new Date(examDate); setExamDayName(d.toLocaleDateString('ar-EG', { weekday: 'long' })); }, [examDate]);
  useEffect(() => { if (!activeFeePage) { setActiveFeePage(initialPage); } }, []);
  const sortedStudents = useMemo(() => { let sorted = [...students]; if (searchQuery.trim()) { const q = searchQuery.trim().toLowerCase(); sorted = sorted.filter(s => s.name.includes(q) || s.parentCode.includes(q)); } if (sortMethod === 'CODE') { sorted.sort((a, b) => a.parentCode.localeCompare(b.parentCode)); } else { sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar')); } return sorted; }, [students, sortMethod, searchQuery]);
  const unloggedStudents = useMemo(() => { const todayStr = new Date().toDateString(); return students.filter(s => !s.logs.some(l => new Date(l.date).toDateString() === todayStr)); }, [students]);
  useEffect(() => { setAttendanceMap({}); setIsSelectAllMode(false); }, [unloggedStudents.length]);

  const toggleStudentStatus = (id: string) => { setAttendanceMap(prev => { const current = prev[id]; if (!current) return { ...prev, [id]: 'ABSENT' }; if (current === 'ABSENT') return { ...prev, [id]: 'EXCUSED' }; const next = { ...prev }; delete next[id]; return next; }); };

  const handleBatchAttendanceSubmit = () => { const absentIds: string[] = []; const excusedIds: string[] = []; Object.entries(attendanceMap).forEach(([id, status]) => { if (status === 'ABSENT') absentIds.push(id); else if (status === 'EXCUSED') excusedIds.push(id); }); if (absentIds.length === 0 && excusedIds.length === 0) { onShowNotification('لم يتم تحديد أي طالب', 'error'); return; } onMarkAbsences(absentIds, excusedIds); setAttendanceMap({}); setIsSelectAllMode(false); };
  const handleToggleSelectAllAbsent = () => { if (isSelectAllMode) { setAttendanceMap({}); setIsSelectAllMode(false); onShowNotification('تم إلغاء التحديد', 'success'); } else { const newMap = { ...attendanceMap }; unloggedStudents.forEach(s => { if (!newMap[s.id]) newMap[s.id] = 'ABSENT'; }); setAttendanceMap(newMap); setIsSelectAllMode(true); onShowNotification('تم تحديد الجميع كغياب', 'success'); } };
  const saveCurrentDraft = (studentId: string) => { const draft: DraftState = { logId: currentLogId, attendance: attendanceRecords, jadeed, murajaah: murajaahList, notes, nextJadeed, nextMurajaah: nextMurajaahList }; setDrafts(prev => ({ ...prev, [studentId]: draft })); };
  const handleCloseStudent = () => { if (selectedStudentId) { saveCurrentDraft(selectedStudentId); } setSelectedStudentId(null); setIsDirty(false); setSaveWarnings([]); setEditingPhoneId(null); };

  const handleOpenStudent = (s: Student) => { if (selectedStudentId && selectedStudentId !== s.id) { saveCurrentDraft(selectedStudentId); } setSelectedStudentId(s.id); setStudentTab('LOG'); setIsDirty(false); setSaveWarnings([]); setEncouragementMsg(''); setCalcNotes(s.calculatorNotes || ''); setEditingPhoneId(null); if (drafts[s.id]) { const draft = drafts[s.id]; setCurrentLogId(draft.logId); setAttendanceRecords(draft.attendance); setJadeed(draft.jadeed); setMurajaahList(draft.murajaah); setNotes(draft.notes); setNextJadeed(draft.nextJadeed); setNextMurajaahList(draft.nextMurajaah); return; } const todayStr = new Date().toDateString(); const existingLog = s.logs.find(l => new Date(l.date).toDateString() === todayStr); if (existingLog && !existingLog.isAbsent && !existingLog.isAdab) { setCurrentLogId(existingLog.id); setJadeed(existingLog.jadeed || { ...emptyAssignment }); setMurajaahList(existingLog.murajaah || [{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); setNotes(existingLog.notes || ''); if (existingLog.attendance && existingLog.attendance.length > 0) { setAttendanceRecords(existingLog.attendance); } else {  setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]); } } else { setCurrentLogId(null); setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]); if (s.nextPlan) { const transferredJadeed = { ...s.nextPlan.jadeed, grade: Grade.GOOD }; if (transferredJadeed.type === 'MULTI' && transferredJadeed.multiSurahs) { transferredJadeed.multiSurahs = transferredJadeed.multiSurahs.map(ms => ({ ...ms, grade: undefined })); } setJadeed(transferredJadeed); if (s.nextPlan.murajaah && s.nextPlan.murajaah.length > 0) { const transferredMurajaah = s.nextPlan.murajaah.map(m => { const mCopy = { ...m, grade: Grade.VERY_GOOD }; if (mCopy.type === 'MULTI' && mCopy.multiSurahs) { mCopy.multiSurahs = mCopy.multiSurahs.map(ms => ({ ...ms, grade: undefined })); } return mCopy; }); setMurajaahList(transferredMurajaah); } else { setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); } } else { setJadeed({ ...emptyAssignment }); setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); } setNotes(''); } if (s.nextPlan) { setNextJadeed(s.nextPlan.jadeed); if (s.nextPlan.murajaah && s.nextPlan.murajaah.length > 0) { setNextMurajaahList(s.nextPlan.murajaah); } else { setNextMurajaahList([{ ...emptyAssignment }]); } } else { setNextJadeed({ ...emptyAssignment, grade: Grade.GOOD }); setNextMurajaahList([{ ...emptyAssignment }]); } };
  
  const handleEditLog = (log: DailyLog) => { if(!selectedStudent) return; setCurrentLogId(log.id); setJadeed(log.jadeed || { ...emptyAssignment }); setMurajaahList(log.murajaah || [{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); setNotes(log.notes || ''); setAttendanceRecords(log.attendance || [{ id: '1', arrival: '16:00', departure: '18:00' }]); setStudentTab('LOG'); onShowNotification("تم تحميل السجل للتعديل", "success"); };
  const handleDeleteLog = (logId: string) => { if (!selectedStudent) return; const updatedLogs = selectedStudent.logs.filter(l => l.id !== logId); if (currentLogId === logId) { setCurrentLogId(null); setJadeed({ ...emptyAssignment }); setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); setNotes(''); setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]); } const updatedStudent = { ...selectedStudent, logs: updatedLogs }; onUpdateStudent(updatedStudent); onShowNotification("تم حذف السجل", "success"); };
  
  const openDeleteModal = (title: string, message: string, confirmAction: () => void) => { setDeleteModal({ isOpen: true, title, message, onConfirm: confirmAction }); };
  const closeDeleteModal = () => { setDeleteModal({ ...deleteModal, isOpen: false }); };
  const markAsDirty = () => { if (!isDirty) setIsDirty(true); };
  
  const executeSaveLog = () => { 
      if (!selectedStudent) return; 
      let updatedLogs = [...selectedStudent.logs]; 
      const now = new Date();
      const logDate = currentLogId ? (updatedLogs.find(l => l.id === currentLogId)?.date || now.toISOString()) : now.toISOString();

      if (currentLogId) { 
          updatedLogs = updatedLogs.map(log => { 
              if (log.id === currentLogId) { 
                  return { ...log, attendance: attendanceRecords, jadeed: jadeed, murajaah: murajaahList, notes: notes, seenByParent: false }; 
              } 
              return log; 
          }); 
      } else { 
          const newLog: DailyLog = { 
              id: `log_${Date.now()}`, 
              date: logDate, 
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
      } 
      
      const nextPlan = { jadeed: nextJadeed, murajaah: nextMurajaahList }; 
      const updatedStudent = { ...selectedStudent, logs: updatedLogs, nextPlan: nextPlan }; 
      
      onUpdateStudent(updatedStudent); 
      if (!currentLogId) { setCurrentLogId(updatedLogs[0].id); } 
      const newDrafts = { ...drafts }; delete newDrafts[selectedStudent.id]; setDrafts(newDrafts); 
      setIsDirty(false); setSaveWarnings([]);
      if (navigator.onLine) { onShowNotification('تم حفظ السجل اليومي بنجاح', 'success'); } else { onShowNotification('تم الحفظ محلياً (لا يوجد إنترنت) ✅', 'success'); }
  }

  const handleSaveLog = () => { if (!selectedStudent) return; const warnings: string[] = []; const isAttDefault = attendanceRecords.length === 1 && attendanceRecords[0].arrival === '16:00' && attendanceRecords[0].departure === '18:00'; const isNextPlanEmpty = nextJadeed.name === SURAH_NAMES[0] && nextJadeed.ayahFrom === 1 && nextJadeed.ayahTo === 7 && nextJadeed.type === 'SURAH'; if (isAttDefault) warnings.push("لم يتم تسجيل الحضور والانصراف الفعلي"); if (isNextPlanEmpty) warnings.push("لم يتم تحديد لوح الحفظ القادم (الواجب)"); if (warnings.length > 0) { setSaveWarnings(warnings); } else { executeSaveLog(); } };
  const handleGenerateEncouragement = async () => { if(!selectedStudent) return; const fakeLog: DailyLog = { id: 'temp', date: new Date().toISOString(), teacherId, teacherName, seenByParent: false, jadeed, murajaah: murajaahList }; const msg = await generateEncouragement(selectedStudent.name, fakeLog); const newNotes = notes ? notes + "\n\n" + msg : msg; setNotes(newNotes); markAsDirty(); onShowNotification("تم إضافة الرسالة للملاحظات", "success"); };
  const handleSendWhatsAppReport = () => { if(!selectedStudent || !selectedStudent.parentPhone) { onShowNotification("لا يوجد رقم هاتف لولي الأمر", "error"); return; } const getGradeString = (g: Grade) => g ? `[${g}]` : ''; const formatAss = (ass: QuranAssignment) => { if (ass.type === 'MULTI' && ass.multiSurahs) { return ass.multiSurahs.map(s => `- ${s.name} ${getGradeString(s.grade || Grade.GOOD)}`).join('\n'); } if (ass.type === 'SURAH') return `- سورة ${ass.name} (${ass.ayahFrom}-${ass.ayahTo}) ${getGradeString(ass.grade)}`; if (ass.type === 'RANGE') return `- من ${ass.name} إلى ${ass.endName} ${getGradeString(ass.grade)}`; if (ass.type === 'JUZ') { const jName = JUZ_LIST[(ass.juzNumber || 1) - 1] || `جزء ${ass.juzNumber}`; return `- ${jName} ${getGradeString(ass.grade)}`; } return `- ${ass.name} ${getGradeString(ass.grade)}`; }; let jadeedText = jadeed.type === 'MULTI' ? formatAss(jadeed) : formatAss(jadeed); let murajaahText = murajaahList.length > 0 ? murajaahList.map(m => formatAss(m)).join('\n') : '- لا يوجد مراجعة اليوم'; const formatNextAss = (ass: QuranAssignment) => { if (ass.type === 'MULTI' && ass.multiSurahs) { return ass.multiSurahs.map(s => `${s.name}`).join(' + '); } if (ass.type === 'SURAH') return `سورة ${ass.name} (${ass.ayahFrom}-${ass.ayahTo})`; return `${ass.name}`; }; const nextJadeedText = nextJadeed ? formatNextAss(nextJadeed) : 'لم يحدد'; let nextPlanWarning = ""; const isNextSameAsCurrent = ( jadeed.name === nextJadeed.name && jadeed.ayahFrom === nextJadeed.ayahFrom && jadeed.ayahTo === nextJadeed.ayahTo && jadeed.type === nextJadeed.type ); const isNextEmpty = nextJadeed.name === SURAH_NAMES[0] && nextJadeed.ayahFrom === 1 && nextJadeed.ayahTo === 7; let timeWarning = ""; if (attendanceRecords.length === 1 && attendanceRecords[0].arrival === '16:00' && attendanceRecords[0].departure === '18:00') { timeWarning = "\n⚠️ لم يتم تسجيل وقت الحضور بدقة."; } if (isNextSameAsCurrent) { nextPlanWarning = `\n⚠️ *تنبيه:* لم يتم تغيير الواجب الجديد لغد (تكرار/تثبيت).${timeWarning}`; } else if (isNextEmpty) { nextPlanWarning = `\n⚠️ *تنبيه:* لم يتم تحديد واجب جديد لغد.${timeWarning}`; } const fullMsg = `*التقرير اليومي للطالب: ${selectedStudent.name}* 🕌\n----------------------------\n📖 *الحفظ الجديد:*\n${jadeedText}\n\n↺ *المراجعة:*\n${murajaahText}\n----------------------------\n📅 *واجب الغد (اللوح):*\n${nextJadeedText}\n${nextPlanWarning}\n\n📝 *ملاحظات المعلم:*\n${notes || 'لا توجد ملاحظات'}\n\nتاريخ: ${formatSimpleDate(new Date().toISOString())}`.trim(); const url = `https://wa.me/2${selectedStudent.parentPhone}?text=${encodeURIComponent(fullMsg)}`; window.open(url, '_blank'); };

  // Adab Handlers
  const handleAddToQuestionList = () => { if (!currentQuestion || !currentCorrect || !currentWrong1) { onShowNotification("يرجى ملء السؤال والإجابات", "error"); return; } const newQuiz: QuizItem = { id: 'q_' + Date.now(), question: currentQuestion, correctAnswer: currentCorrect, wrongAnswers: [currentWrong1, currentWrong2].filter(w => w.trim() !== '') }; setAdabQuestionsList([...adabQuestionsList, newQuiz]); setCurrentQuestion(''); setCurrentCorrect(''); setCurrentWrong1(''); setCurrentWrong2(''); onShowNotification("تم إضافة السؤال للقائمة", "success"); };
  const handleEditQuestionFromList = (q: QuizItem) => { setCurrentQuestion(q.question); setCurrentCorrect(q.correctAnswer); setCurrentWrong1(q.wrongAnswers[0] || ''); setCurrentWrong2(q.wrongAnswers[1] || ''); setAdabQuestionsList(prev => prev.filter(x => x.id !== q.id)); onShowNotification("تم تعبئة البيانات للتعديل", "success"); };
  const handlePublishAdabLesson = () => { if (adabQuestionsList.length === 0) { onShowNotification("يجب إضافة سؤال واحد على الأقل", "error"); return; } if (editingAdabId) { onEditAdab(editingAdabId, adabTitle, adabQuestionsList); setEditingAdabId(null); } else { onPublishAdab(adabTitle, adabQuestionsList); } setAdabQuestionsList([]); setAdabTitle('مجلس الآداب'); onShowNotification(editingAdabId ? "تم تعديل الدرس بنجاح" : "تم نشر الدرس بنجاح", "success"); };
  const handleEditAdabSession = (session: AdabSession) => { setEditingAdabId(session.id); setAdabTitle(session.title); setAdabQuestionsList(session.quizzes); setAdabTab('PUBLISH'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCancelEditAdab = () => { setEditingAdabId(null); setAdabTitle('مجلس الآداب'); setAdabQuestionsList([]); };
  
  // Exam & Fee Handlers
  const handleAddExamDayToList = () => { if(!newExamDesc) { onShowNotification("يرجى كتابة المقرر للحفظ", "error"); return; } setExamList([...examList, { date: examDate, day: examDayName, description: newExamDesc }]); setNewExamDesc(''); onShowNotification('تم إضافة اليوم للقائمة', 'success'); };
  const handleRemoveExamDayFromList = (idx: number) => { const newList = [...examList]; newList.splice(idx, 1); setExamList(newList); };
  const handlePublishExamAnnouncement = () => { if(!examTesterId) { onShowNotification('يرجى اختيار المعلم المختبر', 'error'); return; } if(examList.length === 0) { onShowNotification('يرجى إضافة يوم واحد على الأقل', 'error'); return; } let content = `📢 **إعلان اختبار الشهر** 📢\n\n`; content += `مع الشيخ: ${allTeachers?.find(t => t.id === examTesterId)?.name}\n\n`; if (newExamNote) { content += `⚠️ ملاحظة عامة: ${newExamNote}\n\n`; } content += `المواعيد المتاحة والمقرر:\n`; examList.forEach(e => { content += `🗓️ ${e.day} (${formatSimpleDate(e.date)})\n   📖 المقرر: ${e.description}\n`; }); content += `\nيرجى الاستعداد والحضور في الموعد المحدد. بالتوفيق!`; onAddAnnouncement({ id: Date.now().toString(), teacherId, teacherName, content, date: new Date().toISOString(), type: 'EXAM' }); setExamList([]); setNewExamNote(''); setExamTesterId(''); onShowNotification('تم نشر جدول الاختبارات', 'success'); };
  const handleCreateNewFeePage = () => { if (!newFeePageMonth) return; const pageTitle = `${newFeePageMonth} ${newFeePageYear}`; if (feePages.includes(pageTitle)) { onShowNotification("هذه الصفحة موجودة بالفعل", "error"); return; } setFeePages([...feePages, pageTitle]); setActiveFeePage(pageTitle); students.forEach(s => { let currentDebt = s.feeReminder?.month || ''; const newDebt = currentDebt ? `${currentDebt} + ${pageTitle}` : pageTitle; onUpdateStudent({ ...s, feeReminder: { month: newDebt, dateSet: new Date().toISOString() } }); }); onShowNotification(`تم فتح صفحة شهر ${pageTitle}`, "success"); };
  const handleBulkFeeReminder = () => { if(!activeFeePage) { onShowNotification("يرجى اختيار الصفحة", "error"); return; } let count = 0; students.forEach(s => { const hasPaid = s.payments.some(p => p.title.includes(activeFeePage)); if (!hasPaid) { let currentDebt = s.feeReminder?.month || ''; if (!currentDebt.includes(activeFeePage)) { currentDebt = currentDebt ? `${currentDebt} + ${activeFeePage}` : activeFeePage; } onUpdateStudent({ ...s, feeReminder: { month: currentDebt, dateSet: new Date().toISOString() } }); count++; } }); onShowNotification(count > 0 ? `تم إرسال تذكير لـ ${count} طالب` : "الجميع قام بالدفع", "success"); };
  const handleConfirmPaymentInline = (student: Student) => { const entry = paymentEntries[student.id]; if(!entry || !entry.amount) { onShowNotification("أدخل المبلغ", "error"); return; } const newPayment: Payment = { id: 'pay_' + Date.now(), title: `رسوم: ${activeFeePage}`, amount: parseFloat(entry.amount), date: entry.date || new Date().toISOString(), recordedBy: teacherName, notes: entry.notes }; let newDebt = (student.feeReminder?.month || '').split(' + ').filter(m => m !== activeFeePage).join(' + '); onUpdateStudent({ ...student, payments: [newPayment, ...student.payments], feeReminder: newDebt ? { ...student.feeReminder!, month: newDebt } : undefined }); const newEntries = { ...paymentEntries }; delete newEntries[student.id]; setPaymentEntries(newEntries); onShowNotification(`تم تأكيد دفع ${student.name}`, "success"); };
  const updatePaymentEntry = (studentId: string, field: 'amount' | 'date' | 'notes', value: string) => { setPaymentEntries(prev => ({ ...prev, [studentId]: { amount: field === 'amount' ? value : (prev[studentId]?.amount || ''), date: field === 'date' ? value : (prev[studentId]?.date || new Date().toISOString().split('T')[0]), notes: field === 'notes' ? value : (prev[studentId]?.notes || '') } })); };
  const calculateTotalCollectedForPage = () => { return students.reduce((sum, s) => { const relevant = s.payments.filter(p => p.title.includes(activeFeePage)); return sum + relevant.reduce((acc, curr) => acc + (curr.amount || 0), 0); }, 0); };
  const toggleClosePage = (pageTitle: string) => { setClosedPages(prev => prev.includes(pageTitle) ? prev.filter(p => p !== pageTitle) : [...prev, pageTitle]); };
  
  // Updated Calculator Logic with Target Page
  const saveCalculatorNotes = () => { if(!selectedStudent) return; onUpdateStudent({ ...selectedStudent, calculatorNotes: calcNotes }); onShowNotification("تم حفظ ملاحظات الخطة", "success"); };

  // --- NEW: Badge Handlers ---
  const toggleBadge = (badgeId: string) => {
      if (!selectedStudent) return;
      const existingBadges = selectedStudent.badges || [];
      
      const badgeType = BADGE_TYPES.find(b => b.id === badgeId);
      if (badgeType) {
          const newBadge: Badge = { ...badgeType, dateEarned: new Date().toISOString() };
          const newBadges = [...existingBadges, newBadge];
          onUpdateStudent({ ...selectedStudent, badges: newBadges });
          onShowNotification('تم منح الوسام بنجاح! 🌟', 'success');
          
          // Confetti Effect
          // @ts-ignore
          if (window.confetti) {
              // @ts-ignore
              window.confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#c2a266', '#637353', '#ffffff']
              });
          }
      }
      setShowQuickBadge(false);
  };

  const removeBadgeInstance = (badgeId: string) => {
      if (!selectedStudent || !selectedStudent.badges) return;
      const badges = [...selectedStudent.badges];
      // Find last index of this badge type to remove (LIFO)
      let indexToRemove = -1;
      for (let i = badges.length - 1; i >= 0; i--) {
          if (badges[i].id === badgeId) {
              indexToRemove = i;
              break;
          }
      }
      
      if (indexToRemove !== -1) {
          badges.splice(indexToRemove, 1);
          onUpdateStudent({ ...selectedStudent, badges });
          onShowNotification('تم حذف نسخة من الوسام', 'success');
      }
  };

  const handleGenerateCertificate = () => {
      if (!selectedStudent || !certificateAchievement) {
          onShowNotification('يرجى كتابة سبب التقدير', 'error');
          return;
      }
      setShowCertificateModal(true);
  };

  // Helper functions for UI
  const getStudentStatusForToday = (s: Student) => { 
      const todayStr = new Date().toDateString(); 
      const log = s.logs.find(l => new Date(l.date).toDateString() === todayStr); 
      if (log) { 
          if (log.isAbsent) return { text: "غائب اليوم", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/30" }; 
          return { text: "تم التسميع", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" }; 
      } 
      if (drafts[s.id]) return { text: "مسودة غير محفوظة", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" }; 
      return { text: "لم يسجل بعد", color: "text-gray-400 dark:text-gray-500", bg: "bg-gray-100 dark:bg-gray-700" }; 
  };
  
  const renderStudentCard = (student: Student, idx: number) => { const status = getStudentStatusForToday(student); return (<div key={student.id} onClick={() => handleOpenStudent(student)} className="bg-paper dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent hover:border-secondary/30 transition-all cursor-pointer group relative overflow-hidden mb-3 text-center"><div className="flex flex-col items-center justify-center mb-2"><h3 className="font-bold text-darkBrown dark:text-white text-2xl font-serif mb-1">{student.name}</h3><div className="bg-[#e8e4d9] dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold text-mutedBrown dark:text-gray-300 tracking-widest">{student.parentCode}</div></div><div className="flex justify-center mt-3"><span className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-sm ${status.bg} ${status.color}`}>{status.text}</span></div></div>); };
  const getSurahLabel = (name: string, from: number, to: number) => { const s = SURAH_DATA.find(x => x.name === name); if(s && from === 1 && to >= s.count) return "كاملة"; return `(${from} - ${to})`; };
  const handleStartPhoneEdit = (id: string, current: string) => { setEditingPhoneId(id); setTempPhone(current || ''); };
  const handleSavePhone = (studentId: string) => { if(!selectedStudent) return; if(tempPhone) { onUpdateStudent({...selectedStudent, parentPhone: tempPhone}); onShowNotification("تم تحديث الرقم", "success"); } setEditingPhoneId(null); };

  // Filtered Students for Fees
  const feeFilteredStudents = useMemo(() => {
      let result = sortedStudents;
      if (feeSearchQuery.trim()) {
          const q = feeSearchQuery.trim().toLowerCase();
          result = result.filter(s => s.name.includes(q) || s.parentCode.includes(q));
      }
      return result;
  }, [sortedStudents, feeSearchQuery]);

  return (
    <div className="min-h-screen bg-texture dark:bg-gray-900 pb-20 relative font-sans transition-colors duration-300">
       <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-paper to-transparent dark:from-gray-800 pointer-events-none z-0"></div>
       <ConfirmModal isOpen={deleteModal.isOpen} title={deleteModal.title} message={deleteModal.message} onConfirm={() => { deleteModal.onConfirm(); closeDeleteModal(); }} onCancel={closeDeleteModal} />
       
       <QuickBadgeModal isOpen={showQuickBadge} onClose={() => setShowQuickBadge(false)} onGrant={toggleBadge} />

       {selectedStudent && (
           <CertificateModal 
                isOpen={showCertificateModal} 
                onClose={() => setShowCertificateModal(false)}
                studentName={selectedStudent.name}
                achievement={certificateAchievement}
                teacherName={teacherName}
           />
       )}

       {/* ... (Previous code remains, skipping unchanged parts until Log section) ... */}
       <div className="sticky top-0 z-30 bg-texture/95 dark:bg-gray-900/95 backdrop-blur-md pt-6 pb-4 px-4 shadow-sm border-b border-darkBrown/5 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onLogout} className="bg-[#c2a266] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#b09055] transition flex items-center gap-1"><span>خروج</span>🚪</button>
                <div className="flex flex-col items-end">
                    <h2 className="font-bold text-darkBrown dark:text-white font-serif text-xl">أهلاً، {teacherName}</h2>
                    <p className="text-xs text-mutedBrown dark:text-gray-400 font-bold">لوحة المعلم</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white border-2 border-[#e8e4d9] dark:border-gray-600 shadow-md ml-2">👳‍♂️</div>
            </div>

            {!selectedStudentId && (
                <div className="flex gap-3 mb-2">
                    <ActionButton id="LIST" label="الطلاب" icon="👥" labelClassName="font-bold" isActive={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} colorClass="bg-[#8f964d]" />
                    <ActionButton id="ADD" label="إضافة +" labelClassName="font-bold" isActive={activeTab === 'ADD'} onClick={() => setActiveTab('ADD')} colorClass="bg-[#8f964d]" />
                    <ActionButton id="ATTENDANCE" label="الغياب" icon="📅" isActive={activeTab === 'ATTENDANCE'} onClick={() => setActiveTab('ATTENDANCE')} colorClass="bg-[#788247]" />
                </div>
            )}
       </div>

       <div className="p-4 max-w-lg mx-auto relative z-10 min-h-[60vh]">
            {/* ... (Error warnings and List Views remain same) ... */}
            {saveWarnings.length > 0 && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full border-2 border-red-100 dark:border-red-900 text-center animate-slide-up">
                        <h4 className="font-bold text-red-700 dark:text-red-400 text-lg mb-2">⚠️ تنبيه هام</h4>
                        <ul className="text-sm text-gray-800 dark:text-gray-300 mb-6 space-y-2 list-disc list-inside text-right w-full font-bold bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-100 dark:border-red-900">{saveWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                        <div className="flex gap-3 w-full"><Button onClick={() => setSaveWarnings([])} variant="outline" className="flex-1 text-sm py-2">تراجع</Button><Button onClick={executeSaveLog} variant="danger" className="flex-1 text-sm py-2">حفظ وتجاهل</Button></div>
                    </div>
                </div>
            )}

            {!selectedStudentId ? (
                <>
                    {/* ... (Existing List, Add, Attendance code - No Changes) ... */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex gap-2 mb-2">
                                 <button onClick={() => setSortMethod(sortMethod === 'ALPHABETICAL' ? 'CODE' : 'ALPHABETICAL')} className="bg-[#dcd9cf] dark:bg-gray-700 w-12 h-12 rounded-xl flex items-center justify-center text-darkBrown dark:text-white shadow-sm shrink-0">{sortMethod === 'ALPHABETICAL' ? 'أ-ي' : '123'}</button>
                                 <div className="flex-1 bg-[#dcd9cf] dark:bg-gray-700 rounded-xl flex items-center px-4 shadow-inner">
                                    <input type="text" placeholder="ابحث بالاسم أو الكود..." className="w-full bg-transparent outline-none text-darkBrown dark:text-white placeholder:text-gray-500 font-bold text-right py-3" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    <span className="text-gray-500 text-lg ml-2">🔍</span>
                                 </div>
                            </div>
                            {sortedStudents.length === 0 ? (<div className="text-center py-10 bg-paper dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 mx-4"><p className="text-gray-400 mb-2">لا يوجد طلاب.</p><Button onClick={() => setActiveTab('ADD')} variant="secondary">إضافة طالب جديد</Button></div>) : (<div className="pb-2">{sortedStudents.map((s, idx) => renderStudentCard(s, idx))}</div>)}
                        </div>
                    )}
                    
                    {/* ... (Other Tabs Content - No Changes to Logic) ... */}
                    {/* Simplified for brevity - Assume all tabs (ADD, ATTENDANCE, FEES, etc) are here as before */}
                    {activeTab === 'ADD' && (
                        <div className="bg-paper dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-white dark:border-gray-700 animate-slide-up">
                            <h3 className="text-xl font-bold text-darkBrown dark:text-white font-serif mb-6 text-center border-b dark:border-gray-700 pb-4">إضافة طالب جديد</h3>
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-mutedBrown dark:text-gray-400 mb-2">اسم الطالب</label><input type="text" className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-secondary outline-none text-darkBrown dark:text-white font-bold" placeholder="الاسم الثلاثي" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} /></div>
                                <div><label className="block text-xs font-bold text-mutedBrown dark:text-gray-400 mb-2">كود الطالب</label><input type="text" className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-secondary outline-none text-center text-lg tracking-widest font-mono dark:text-white" placeholder="مثال: 1005" value={newStudentCode} onChange={e => setNewStudentCode(e.target.value)} /></div>
                                <Button onClick={() => { if(newStudentName && newStudentCode) { const exists = students.some(s => s.parentCode === newStudentCode); if (exists) { onShowNotification('هذا الكود مستخدم بالفعل!', 'error'); return; } onAddStudent(newStudentName, newStudentCode); setNewStudentName(''); setNewStudentCode(''); onShowNotification('تمت الإضافة', 'success'); setActiveTab('LIST'); } else { onShowNotification('يرجى ملء البيانات', 'error'); } }} className="w-full py-4 text-lg font-serif mt-4 bg-primary hover:bg-primaryDark rounded-2xl shadow-xl">حفظ وإضافة</Button>
                            </div>
                        </div>
                    )}
                    
                    {/* ... (ATTENDANCE, FEES, ADAB, ANNOUNCEMENTS, STATS, DELETE - All same as before) ... */}
                    {activeTab === 'ATTENDANCE' && (
                        <div className="bg-paper dark:bg-gray-800 p-4 rounded-3xl shadow-lg border border-white dark:border-gray-700 animate-slide-up">
                             <div className="flex justify-between items-center mb-4 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl"><h3 className="font-bold text-darkBrown dark:text-white mr-2">تسجيل الغياب</h3><button onClick={handleToggleSelectAllAbsent} className={`text-xs px-3 py-2 rounded-lg font-bold transition-all shadow-sm ${isSelectAllMode ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>{isSelectAllMode ? 'إلغاء ❌' : 'تحديد الكل غياب ✅'}</button></div>
                            {unloggedStudents.length === 0 ? (<div className="text-center py-20"><p className="text-emerald-600 font-bold mb-2">✅ تم تسجيل الجميع</p></div>) : (<div className="space-y-2 mb-4">{unloggedStudents.map(s => { const status = attendanceMap[s.id]; return (<div key={s.id} onClick={() => toggleStudentStatus(s.id)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${status === 'ABSENT' ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800' : status === 'EXCUSED' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-800' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600'}`}><span className="font-bold text-gray-700 dark:text-gray-200">{s.name}</span><div className="flex gap-1">{status === 'ABSENT' ? <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">غياب</span> : status === 'EXCUSED' ? <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold">عذر</span> : <span className="bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-300 px-3 py-1 rounded-lg text-xs">--</span>}</div></div>); })}</div>)}
                            {unloggedStudents.length > 0 && (<Button onClick={handleBatchAttendanceSubmit} className="w-full py-4 shadow-xl bg-darkBrown text-white font-bold text-lg rounded-2xl">حفظ الغياب ({Object.keys(attendanceMap).length})</Button>)}
                        </div>
                    )}
                    
                    {/* ... (Including the long "Secondary Tabs Content" block for ANNOUNCEMENTS, ADAB, STATS, FEES, DELETE. Assuming it's preserved as in previous correct response) ... */}
                    {['ANNOUNCEMENTS', 'ADAB', 'STATS', 'DELETE', 'FEES'].includes(activeTab) && (
                        <div className="bg-paper dark:bg-gray-800 p-4 rounded-3xl shadow-lg border border-white dark:border-gray-700 animate-slide-up min-h-[300px] mb-8">
                            {/* ... (Existing Tabs Implementation) ... */}
                            {activeTab === 'FEES' && (
                                <div className="animate-fade-in">
                                    <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2"><h3 className="font-bold text-darkBrown dark:text-white">💰 إدارة الرسوم</h3><div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm">المحصل: {calculateTotalCollectedForPage()} ج.م</div></div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl border border-gray-200 dark:border-gray-600 mb-4 shadow-sm relative">
                                        {activeFeePage && (
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <button onClick={() => setActiveFeePage('')} className="px-2 py-1 rounded text-[10px] font-bold border bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500">✕ إغلاق</button>
                                            </div>
                                        )}
                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar snap-x">{feePages.map(p => (<button key={p} onClick={() => setActiveFeePage(p)} className={`snap-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all border ${activeFeePage === p ? 'bg-darkBrown text-white border-darkBrown shadow-md' : 'bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'}`}>{p} {closedPages.includes(p) && '🔒'}</button>))}</div>
                                        <div className="flex gap-2 items-end border-t dark:border-gray-600 pt-2"><div className="flex-1"><label className="text-[10px] text-gray-400 font-bold block mb-1">سجل جديد:</label><div className="flex gap-1"><select className="w-2/3 p-2 border rounded-xl text-xs font-bold bg-white dark:bg-gray-600 dark:text-white" value={newFeePageMonth} onChange={(e) => setNewFeePageMonth(e.target.value)}>{MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}</select><select className="w-1/3 p-2 border rounded-xl text-xs font-bold bg-white dark:bg-gray-600 dark:text-white" value={newFeePageYear} onChange={(e) => setNewFeePageYear(parseInt(e.target.value))}>{Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (<option key={y} value={y}>{y}</option>))}</select></div></div><Button onClick={handleCreateNewFeePage} className="py-2 text-[10px] h-[38px] bg-secondary hover:bg-secondaryDark">+ فتح</Button></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2"><h4 className="text-sm font-bold text-darkBrown dark:text-white">سجل: <span className="text-secondaryDark dark:text-yellow-500">{activeFeePage || 'لم يتم الاختيار'}</span></h4>{!closedPages.includes(activeFeePage) && activeFeePage && (<button onClick={handleBulkFeeReminder} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100 dark:hover:bg-red-900/50">🔔 تذكير للمتأخرين</button>)}</div>
                                        <input 
                                            type="text" 
                                            placeholder="🔍 بحث عن طالب..." 
                                            className="w-full p-2 border rounded-lg text-xs bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 mb-2"
                                            value={feeSearchQuery} 
                                            onChange={(e) => setFeeSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                    {activeFeePage && closedPages.includes(activeFeePage) && (<p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-900 text-center font-bold mb-3">⚠️ هذا السجل مغلق، لا يمكن التعديل عليه.</p>)}
                                    {activeFeePage ? (
                                        <div className="space-y-3">
                                            {feeFilteredStudents.length === 0 ? <p className="text-center text-gray-400 text-xs">لا يوجد نتائج</p> : 
                                            feeFilteredStudents.map(s => { 
                                                const hasPaidThisPage = s.payments.some(p => p.title.includes(activeFeePage)); 
                                                const debtString = s.feeReminder?.month || ''; 
                                                const isPageClosed = closedPages.includes(activeFeePage); 
                                                const entry = paymentEntries[s.id] || { amount: '', date: new Date().toISOString().split('T')[0], notes: '' }; 
                                                return (<div key={s.id} className={`bg-white dark:bg-gray-700 p-3 rounded-xl border shadow-sm relative ${hasPaidThisPage ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'} ${isPageClosed ? 'opacity-70' : ''}`}><div className="flex justify-between items-center mb-2"><span className="font-bold text-sm text-darkBrown dark:text-white">{s.name}</span>{debtString && !hasPaidThisPage && (<span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">مطلوب: {debtString}</span>)}{hasPaidThisPage && <span className="text-green-600 font-bold text-xs">✅ تم الدفع</span>}</div>{!hasPaidThisPage && (<><div className="flex gap-2 items-center mb-1"><input type="number" placeholder="المبلغ" className="w-20 p-2 border rounded-lg text-xs text-center font-bold bg-gray-50 dark:bg-gray-600 dark:text-white focus:bg-white transition" value={entry.amount} onChange={(e) => updatePaymentEntry(s.id, 'amount', e.target.value)} disabled={isPageClosed} /><input type="text" placeholder="ملاحظات" className="flex-1 p-2 border rounded-lg text-xs dark:bg-gray-600 dark:text-white" value={entry.notes} onChange={(e) => updatePaymentEntry(s.id, 'notes', e.target.value)} disabled={isPageClosed} /></div><div className="flex gap-2"><input type="date" className="w-1/3 p-1 border rounded text-[10px] bg-gray-50 dark:bg-gray-600 dark:text-white" value={entry.date} onChange={(e) => updatePaymentEntry(s.id, 'date', e.target.value)} disabled={isPageClosed} /><button onClick={() => handleConfirmPaymentInline(s)} className={`flex-1 text-white p-1 rounded-lg text-xs font-bold shadow-md ${isPageClosed ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`} disabled={isPageClosed}>{isPageClosed ? 'مغلق' : 'تأكيد واستلام 💰'}</button></div></>)}{hasPaidThisPage && (<p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold">{s.payments.find(p => p.title.includes(activeFeePage))?.amount} ج.م - بتاريخ {formatSimpleDate(s.payments.find(p => p.title.includes(activeFeePage))?.date || '')}</p>)}</div>); 
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 text-sm mt-8">الرجاء اختيار سجل شهر من الأعلى</p>
                                    )}
                                </div>
                            )}
                            
                            {/* ... (Other tabs: ADAB, ANNOUNCEMENTS, STATS, DELETE - preserving old logic) ... */}
                            {activeTab === 'ADAB' && (
                                <div>
                                    <h3 className="font-bold text-center mb-4 text-darkBrown dark:text-white">🌟 مجلس الآداب والتربية</h3>
                                    <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-600 p-1 rounded-xl"><button onClick={() => setAdabTab('PUBLISH')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${adabTab === 'PUBLISH' ? 'bg-white dark:bg-gray-700 shadow text-darkBrown dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>نشر الدرس</button><button onClick={() => setAdabTab('ARCHIVE')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${adabTab === 'ARCHIVE' ? 'bg-white dark:bg-gray-700 shadow text-darkBrown dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>الأرشيف</button><button onClick={() => setAdabTab('LEADERBOARD')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${adabTab === 'LEADERBOARD' ? 'bg-white dark:bg-gray-700 shadow text-darkBrown dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>أوائل الآداب 🏆</button></div>
                                    {adabTab === 'PUBLISH' && (<><div className="bg-white dark:bg-gray-700 p-3 rounded-2xl border border-gray-200 dark:border-gray-600 mb-4 shadow-sm"><label className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">عنوان الدرس</label><input type="text" className="w-full p-2 border rounded-xl mb-3 text-sm font-bold dark:bg-gray-600 dark:text-white" placeholder="مثال: آداب الاستئذان" value={adabTitle} onChange={e => setAdabTitle(e.target.value)} /><div className="bg-gray-50 dark:bg-gray-600 p-2 rounded-xl border border-gray-100 dark:border-gray-500"><p className="text-xs font-bold text-secondaryDark dark:text-yellow-500 mb-2">إضافة سؤال للاختبار:</p><input type="text" className="w-full p-2 border rounded-lg mb-2 text-xs dark:bg-gray-700 dark:text-white" placeholder="السؤال" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} /><input type="text" className="w-full p-2 border rounded-lg mb-2 text-xs border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800 dark:text-white" placeholder="الإجابة الصحيحة" value={currentCorrect} onChange={e => setCurrentCorrect(e.target.value)} /><div className="flex gap-2"><input type="text" className="flex-1 p-2 border rounded-lg mb-2 text-xs border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-white" placeholder="إجابة خاطئة 1" value={currentWrong1} onChange={e => setCurrentWrong1(e.target.value)} /><input type="text" className="flex-1 p-2 border rounded-lg mb-2 text-xs border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 dark:text-white" placeholder="إجابة خاطئة 2" value={currentWrong2} onChange={e => setCurrentWrong2(e.target.value)} /></div><Button onClick={handleAddToQuestionList} className="w-full text-xs py-2 bg-secondary hover:bg-secondaryDark">إضافة السؤال للقائمة +</Button></div></div>{adabQuestionsList.length > 0 && (<div className="mb-4"><h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">الأسئلة المضافة ({adabQuestionsList.length}):</h4><div className="space-y-2">{adabQuestionsList.map((q, i) => (<div key={q.id} className="bg-white dark:bg-gray-700 p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-xs flex justify-between items-center"><span className="font-bold truncate max-w-[70%] dark:text-white">{i+1}. {q.question}</span><div className="flex gap-1"><button onClick={() => handleEditQuestionFromList(q)} className="text-blue-500 px-1">✏️</button><button onClick={() => setAdabQuestionsList(adabQuestionsList.filter(x => x.id !== q.id))} className="text-red-500 px-1">🗑️</button></div></div>))}</div></div>)}<Button onClick={handlePublishAdabLesson} className="w-full py-3 rounded-xl shadow-md font-bold text-lg mb-4">{editingAdabId ? 'حفظ التعديلات' : 'نشر الدرس للطلاب 📢'}</Button></>)}
                                    {adabTab === 'ARCHIVE' && (<div className="space-y-2 max-h-60 overflow-y-auto">{adabArchive.length === 0 ? <p className="text-center text-xs text-gray-400">لا يوجد دروس سابقة</p> : adabArchive.map(s => (<div key={s.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border dark:border-gray-600"><div><span className="block font-bold text-xs dark:text-white">{s.title}</span><span className="text-[10px] text-gray-400">{formatSimpleDate(s.date)}</span></div><div className="flex gap-2"><button onClick={() => handleEditAdabSession(s)} className="text-blue-500 text-xs font-bold">تعديل</button><button onClick={() => openDeleteModal('حذف الدرس', 'هل أنت متأكد من حذف هذا الدرس وسجلاته؟', () => onDeleteAdab(s.id))} className="text-red-500 text-xs font-bold px-1">حذف</button></div></div>))}</div>)}
                                    {adabTab === 'LEADERBOARD' && (<div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800"><h4 className="text-center font-bold text-yellow-800 dark:text-yellow-500 mb-3">🎖️ لوحة الشرف (أوائل الآداب)</h4><div className="space-y-2 max-h-60 overflow-y-auto">{students.map(s => { const score = s.logs.reduce((acc, l) => { if (l.isAdab && l.parentQuizScore !== undefined) return acc + l.parentQuizScore; return acc; }, 0); return { ...s, score }; }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).map((s, idx) => (<div key={s.id} className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm border border-yellow-100 dark:border-gray-600"><div className="flex items-center gap-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}>{idx + 1}</span><span className="font-bold text-sm text-darkBrown dark:text-white">{s.name}</span></div><span className="font-bold text-secondaryDark dark:text-yellow-400 text-sm">{s.score} نقطة</span></div>))}{students.every(s => !s.logs.some(l => l.isAdab && l.parentQuizScore !== undefined)) && (<p className="text-center text-xs text-gray-400 py-4">لم يقم أحد بحل الاختبارات بعد.</p>)}</div></div>)}
                                </div>
                            )}
                            
                            {activeTab === 'ANNOUNCEMENTS' && (<div><div className="flex gap-2 mb-4"><button onClick={() => setAnnouncementTab('GENERAL')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${announcementTab === 'GENERAL' ? 'bg-darkBrown text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>عام</button><button onClick={() => setAnnouncementTab('EXAM')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${announcementTab === 'EXAM' ? 'bg-darkBrown text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>اختبار شهر</button></div>{announcementTab === 'GENERAL' ? (<><h3 className="font-bold text-center mb-4 dark:text-white">📢 نشر إعلان عام</h3><textarea className="w-full p-3 border rounded-xl text-sm bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition mb-2 min-h-[100px]" placeholder="اكتب نص الإعلان هنا..." value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)}></textarea><div className="flex gap-2 mb-2"><div className="flex-1"><label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mb-1">تاريخ انتهاء الإعلان</label><input type="date" className="w-full p-2 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" value={announcementExpiry} onChange={(e) => setAnnouncementExpiry(e.target.value)} /></div></div><Button onClick={() => { if(announcementText) { const expiresAt = announcementExpiry ? new Date(announcementExpiry) : undefined; if (expiresAt) expiresAt.setHours(23, 59, 59, 999); onAddAnnouncement({ id: Date.now().toString(), teacherId, teacherName, content: announcementText, date: new Date().toISOString(), type: 'GENERAL', expiresAt: expiresAt?.toISOString() }); setAnnouncementText(''); setAnnouncementExpiry(''); onShowNotification('تم النشر', 'success'); } }} className="w-full rounded-xl py-3">نشر الإعلان</Button><div className="mt-6 space-y-2"><h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 mb-2">الإعلانات السابقة:</h4>{announcements.filter(a => a.type === 'GENERAL').map(a => (<div key={a.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-sm relative border border-gray-100 dark:border-gray-600"><p className="dark:text-white">{a.content}</p>{a.expiresAt && <p className="text-[10px] text-gray-400 mt-1">ينتهي في: {formatSimpleDate(a.expiresAt)}</p>}<button onClick={() => onDeleteAnnouncement(a.id)} className="absolute top-1 left-2 text-red-500 font-bold bg-white dark:bg-gray-600 px-2 rounded-full shadow-sm">×</button></div>))}</div></>) : (<><h3 className="font-bold text-center mb-4 dark:text-white">📝 جدول اختبارات الشهر</h3><div className="space-y-3"><div><label className="text-xs font-bold text-gray-500 dark:text-gray-400">اسم المحفظ المختبر</label><select className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white" value={examTesterId} onChange={e => setExamTesterId(e.target.value)}><option value="">-- اختر --</option>{allTeachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 dark:text-gray-400">ملاحظة عامة</label><input type="text" className="w-full p-3 border rounded-xl bg-white dark:bg-gray-700 dark:text-white" placeholder="مثال: الحضور بالزي الرسمي" value={newExamNote} onChange={e => setNewExamNote(e.target.value)} /></div><div className="flex gap-2"><div className="flex-1"><label className="text-xs font-bold text-gray-500 dark:text-gray-400">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white" value={examDate} onChange={e => setExamDate(e.target.value)} /></div><div className="flex-1"><label className="text-xs font-bold text-gray-500 dark:text-gray-400">اليوم</label><input type="text" className="w-full p-3 border rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300" value={examDayName} readOnly /></div></div><div><label className="text-xs font-bold text-gray-500 dark:text-gray-400">المقرر</label><input type="text" className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white" placeholder="مثال: جزء عم" value={newExamDesc} onChange={e => setNewExamDesc(e.target.value)} /></div><button onClick={handleAddExamDayToList} className="w-full bg-[#a38650] hover:bg-[#8c7343] text-white font-bold py-3 rounded-xl shadow-md transition transform active:scale-95 text-sm">إضافة هذا اليوم للقائمة +</button>{examList.length > 0 && (<div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 mt-2"><h5 className="font-bold text-xs mb-2 dark:text-white">الأيام المضافة:</h5>{examList.map((ex, i) => (<div key={i} className="flex flex-col text-sm border-b border-yellow-100 dark:border-yellow-800 last:border-0 py-2 relative"><button onClick={() => handleRemoveExamDayFromList(i)} className="absolute top-2 left-0 text-red-500 font-bold text-xs">حذف</button><span className="block font-bold dark:text-white">{ex.day} ({formatSimpleDate(ex.date)})</span><span className="text-xs text-gray-600 dark:text-gray-300 mt-1">📖 {ex.description}</span></div>))}</div>)}<Button onClick={handlePublishExamAnnouncement} className="w-full py-3 rounded-xl mt-4">نشر الجدول النهائي</Button><div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"><button onClick={() => setShowExamArchive(!showExamArchive)} className="text-xs text-mutedBrown dark:text-gray-400 font-bold flex items-center gap-1">{showExamArchive ? '🔽 إخفاء الأرشيف' : '▶️ عرض أرشيف الاختبارات السابقة'}</button>{showExamArchive && (<div className="mt-2 space-y-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl border dark:border-gray-600">{announcements.filter(a => a.type === 'EXAM').length === 0 ? <p className="text-center text-xs text-gray-400">لا يوجد اختبارات سابقة</p> : announcements.filter(a => a.type === 'EXAM').map(a => (<div key={a.id} className="text-xs bg-white dark:bg-gray-600 p-2 rounded border dark:border-gray-500 flex justify-between items-center"><span className="dark:text-white">{formatSimpleDate(a.date)}</span><button onClick={() => openDeleteModal('حذف الاختبار', 'هل أنت متأكد؟', () => onDeleteAnnouncement(a.id))} className="bg-red-50 dark:bg-red-900/30 text-red-500 border border-red-100 dark:border-red-900 px-2 py-1 rounded text-xs font-bold">حذف</button></div>))}</div>)}</div></div></>)}</div>
                            )}

                            {activeTab === 'STATS' && (
                                <div><h3 className="font-bold text-center mb-4 dark:text-white">📊 التقرير اليومي</h3><div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl"><span className="text-xs font-bold text-gray-500 dark:text-gray-300">تاريخ التقرير:</span><input type="date" className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-600 dark:text-white text-sm" value={statsDate} onChange={e => setStatsDate(e.target.value)} /></div>{(() => { const targetDate = new Date(statsDate).toDateString(); const presentList = students.filter(s => s.logs.some(l => !l.isAbsent && new Date(l.date).toDateString() === targetDate)); const absentList = students.filter(s => s.logs.some(l => l.isAbsent && new Date(l.date).toDateString() === targetDate)); const totalStudents = students.length; const attendancePercentage = totalStudents > 0 ? Math.round((presentList.length / totalStudents) * 100) : 0; return (<div><div className="flex justify-center mb-6"><div className="relative w-24 h-24 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full shadow-inner border-4 border-gray-100 dark:border-gray-600"><div className="text-center"><span className={`text-xl font-black ${attendancePercentage > 75 ? 'text-green-600 dark:text-green-400' : attendancePercentage > 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{attendancePercentage}%</span><p className="text-[10px] text-gray-400 font-bold">نسبة الحضور</p></div></div></div><div className="grid grid-cols-2 gap-4 mb-4"><div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800"><h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-2 text-center border-b border-emerald-200 dark:border-emerald-700 pb-1">الحضور ({presentList.length})</h4><div className="max-h-60 overflow-y-auto space-y-1">{presentList.map(s => <p key={s.id} className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{s.name}</p>)}</div></div><div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-2xl border border-red-100 dark:border-red-800"><h4 className="font-bold text-red-800 dark:text-red-300 text-sm mb-2 text-center border-b border-red-200 dark:border-red-700 pb-1">الغياب ({absentList.length})</h4><div className="max-h-60 overflow-y-auto space-y-1">{absentList.map(s => <p key={s.id} className="text-xs text-red-700 dark:text-red-400 font-bold">{s.name}</p>)}</div></div></div><button onClick={() => { const msg = `تقرير الحضور - ${targetDate}\n✅ حضور: ${presentList.length}\n❌ غياب: ${absentList.length}\n📊 نسبة الحضور: ${attendancePercentage}%`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); }} className="w-full bg-[#1e5233] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#163d26] transition"><span className="text-xl">💬</span> إرسال تقرير واتساب</button></div>); })()}</div>
                            )}

                            {activeTab === 'DELETE' && (
                                <div><h3 className="font-bold text-center mb-4 text-red-600">🗑️ حذف طلاب</h3><div className="space-y-2 max-h-80 overflow-y-auto">{sortedStudents.map(s => (<div key={s.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600"><span className="font-bold text-sm dark:text-white">{s.name}</span><Button onClick={() => openDeleteModal('حذف الطالب', 'هل أنت متأكد من حذف الطالب نهائياً؟', () => onDeleteStudents([s.id]))} variant="danger" className="text-xs px-3 py-1">حذف</Button></div>))}</div></div>
                            )}
                        </div>
                    )}
                    
                    {!selectedStudentId && (
                        <div className="grid grid-cols-5 gap-1 mb-8">
                            <ActionButton id="ANNOUNCEMENTS" label="إعلانات" icon="📢" isActive={activeTab === 'ANNOUNCEMENTS'} onClick={() => setActiveTab('ANNOUNCEMENTS')} colorClass="bg-[#8f964d]" />
                            <ActionButton id="ADAB" label="الآداب" icon="🌟" isActive={activeTab === 'ADAB'} onClick={() => setActiveTab('ADAB')} colorClass="bg-[#8f964d]" />
                            <ActionButton id="FEES" label="الرسوم" icon="💰" isActive={activeTab === 'FEES'} onClick={() => setActiveTab('FEES')} colorClass="bg-[#8f964d]" />
                            <ActionButton id="STATS" label="إحصاء" icon="📊" isActive={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} colorClass="bg-[#8f964d]" />
                            <ActionButton id="DELETE" label="حذف" icon="🗑️" isActive={activeTab === 'DELETE'} onClick={() => setActiveTab('DELETE')} colorClass="bg-red-500" />
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handleCloseStudent} className="bg-paper dark:bg-gray-800 dark:text-white p-2 rounded-full shadow-sm text-darkBrown font-bold">⬅ رجوع</button>
                        {currentLogId && <div className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 animate-pulse">✏️ وضع تعديل سجل سابق</div>}
                        {drafts[selectedStudentId] && !currentLogId && <div className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-200">💾 مسودة</div>}
                    </div>
                    
                    <div className="flex flex-col items-center justify-center mb-6">
                        <h2 className="font-bold text-3xl text-darkBrown dark:text-white font-serif mb-1">{selectedStudent?.name}</h2>
                        <div className="flex items-center gap-2">
                            {editingPhoneId === selectedStudent?.id ? (
                                <div className="flex items-center gap-1"><input type="text" className="w-32 p-1 border rounded text-lg font-mono text-center" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} autoFocus /><button onClick={() => handleSavePhone(selectedStudent.id)} className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">✓</button></div>
                            ) : (
                                <span className="text-lg font-mono font-bold text-darkBrown dark:text-gray-300 tracking-widest">{selectedStudent?.parentPhone}</span>
                            )}
                            {!editingPhoneId && (<div className="flex gap-1"><button onClick={() => handleStartPhoneEdit(selectedStudent?.id || '', selectedStudent?.parentPhone || '')} className="text-secondary hover:text-secondaryDark text-lg">✏️</button><button onClick={() => { if(selectedStudent?.parentPhone) window.open(`https://wa.me/2${selectedStudent.parentPhone}`, '_blank'); }} className="text-green-600 hover:text-green-700 text-lg bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm">💬</button></div>)}
                        </div>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-2 pb-2 mb-2 touch-pan-x bg-paper dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-white dark:border-gray-700 no-scrollbar">
                        <button onClick={() => setStudentTab('LOG')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'LOG' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>📝 تسجيل</button>
                        <button onClick={() => setStudentTab('PLAN')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'PLAN' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>📅 اللوح</button>
                        <button onClick={() => setStudentTab('BADGES')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'BADGES' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>🏅 الجوائز</button>
                        <button onClick={() => setStudentTab('ARCHIVE')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'ARCHIVE' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>🗄️ الأرشيف</button>
                        <button onClick={() => setStudentTab('MONTHLY_REPORT')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'MONTHLY_REPORT' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>📅 الحصاد</button>
                        <button onClick={() => setStudentTab('CALC')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'CALC' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>🔢 الحاسبة</button>
                        <button onClick={() => setStudentTab('SCHEDULE')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border text-sm font-bold ${studentTab === 'SCHEDULE' ? 'bg-secondary text-white border-secondary' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>🕒 المواعيد</button>
                    </div>

                    <div className="bg-paper dark:bg-gray-800 rounded-3xl shadow-lg p-3 border border-white dark:border-gray-700 relative min-h-[300px]">
                        {studentTab === 'LOG' && (
                            <div className="space-y-3">
                                {/* Log Form with Dark Mode classes */}
                                <div className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 p-2 rounded-xl shadow-sm"><div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100 dark:border-gray-600"><h4 className="text-xs font-bold text-darkBrown dark:text-white">الحضور والانصراف 🕒</h4><button onClick={() => setAttendanceRecords([...attendanceRecords, { id: Date.now().toString(), arrival: '16:00', departure: '17:00' }])} className="text-[10px] bg-primary text-white px-2 py-1 rounded hover:bg-primaryDark">+</button></div><div className="grid gap-2">{attendanceRecords.map((att, idx) => (<div key={att.id} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-600 p-1 rounded border border-gray-100 dark:border-gray-500"><button onClick={() => setAttendanceRecords(attendanceRecords.filter((_, i) => i !== idx))} className="bg-red-50 text-red-500 w-6 h-6 flex items-center justify-center rounded-full border border-red-100 hover:bg-red-100 transition text-xs font-bold">✕</button><div className="scale-90 origin-right"><TimePicker value={att.arrival} onChange={(v) => { const n = [...attendanceRecords]; n[idx].arrival = v; setAttendanceRecords(n); }} /></div><span className="text-gray-400 font-bold text-xs">-</span><div className="scale-90 origin-right"><TimePicker value={att.departure || ''} onChange={(v) => { const n = [...attendanceRecords]; n[idx].departure = v; setAttendanceRecords(n); }} /></div></div>))}</div></div>
                                <AssignmentForm title="📖 الحفظ الجديد" data={jadeed} onChange={(f, v) => { setJadeed(prev => ({ ...prev, [f]: v })); markAsDirty(); }} colorClass="border-primary/20 bg-primary/5 dark:bg-primary/10" />
                                <div className="space-y-2">{murajaahList.map((m, idx) => (<AssignmentForm key={idx} title={`مراجعة ${idx + 1}`} data={m} onChange={(f, v) => { setMurajaahList(prev => { const newList = [...prev]; newList[idx] = { ...newList[idx], [f]: v }; return newList; }); markAsDirty(); }} colorClass="border-secondary/20 bg-secondary/5 dark:bg-secondary/10" canRemove onRemove={() => { setMurajaahList(prev => prev.filter((_, i) => i !== idx)); markAsDirty(); }} />))}<button onClick={() => setMurajaahList(prev => [...prev, { ...emptyAssignment, grade: Grade.VERY_GOOD }])} className="text-xs bg-secondary text-white px-3 py-1 rounded-full">+ إضافة مراجعة</button></div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 mt-2"><div className="flex justify-between items-center mb-2"><h4 className="text-xs font-bold text-gray-500 dark:text-gray-300">ملاحظات المعلم (تظهر لولي الأمر)</h4><Button onClick={handleGenerateEncouragement} variant="outline" className="text-[10px] px-2 py-1 h-auto">رسالة تشجيعية ✨</Button></div><textarea className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-600 dark:text-white" rows={5} value={notes} onChange={e => { setNotes(e.target.value); markAsDirty(); }} placeholder="اكتب ملاحظاتك هنا..."></textarea></div>
                                
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleSaveLog} className="flex-1 py-4 text-lg bg-primary hover:bg-primaryDark rounded-2xl shadow-lg">{currentLogId ? '💾 حفظ التعديلات' : '💾 حفظ السجل'}</Button>
                                    <button onClick={() => setShowQuickBadge(true)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 w-16 rounded-2xl flex items-center justify-center shadow-lg text-2xl border-2 border-yellow-200" title="منح وسام سريع">🏆</button>
                                </div>
                                {currentLogId && (<p className="text-center text-[10px] text-gray-400 mt-2">يتم تعديل سجل محفوظ مسبقاً</p>)}
                                <button onClick={handleSendWhatsAppReport} className="w-full bg-[#0a451d] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#073315] transition mt-2"><span className="text-xl">💬</span> إرسال التقرير لولي الأمر</button>
                            </div>
                        )}
                        
                        {/* NEW: Badges & Certificates Tab */}
                        {studentTab === 'BADGES' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl border border-gray-100 dark:border-gray-600">
                                    <h3 className="font-bold text-darkBrown dark:text-white mb-4 text-center">🏆 الأوسمة والتحفيز</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BADGE_TYPES.map(badge => {
                                            const badgeCount = (selectedStudent?.badges || []).filter(b => b.id === badge.id).length;
                                            const isOwned = badgeCount > 0;
                                            return (
                                                <div 
                                                    key={badge.id} 
                                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center relative overflow-hidden ${isOwned ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-600' : 'border-gray-200 dark:border-gray-600 grayscale opacity-70 hover:opacity-100'}`}
                                                >
                                                    <div className="text-3xl mb-1 cursor-pointer" onClick={() => toggleBadge(badge.id)}>{badge.icon}</div>
                                                    <p className="font-bold text-xs text-darkBrown dark:text-white">{badge.name}</p>
                                                    {isOwned && (
                                                        <div className="absolute top-0 right-0 flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 p-1 rounded-bl-lg">
                                                            <span className="text-[10px] font-bold text-darkBrown dark:text-white">x{badgeCount}</span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); removeBadgeInstance(badge.id); }}
                                                                className="w-4 h-4 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-[10px] font-bold"
                                                                title="إزالة واحدة"
                                                            >
                                                                -
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-[#fdfbf7] to-[#fffaf0] dark:from-gray-700 dark:to-gray-600 p-4 rounded-2xl border border-gray-200 dark:border-gray-500 shadow-sm">
                                    <h3 className="font-bold text-darkBrown dark:text-white mb-2 text-center">📜 شهادات التقدير</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-300 text-center mb-4">أنشئ شهادة تقدير احترافية للطالب</p>
                                    
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-xl text-center font-bold mb-3 dark:bg-gray-800 dark:text-white dark:border-gray-500" 
                                        placeholder="سبب التقدير (مثال: إتمام جزء عم)"
                                        value={certificateAchievement}
                                        onChange={(e) => setCertificateAchievement(e.target.value)}
                                    />
                                    
                                    <button 
                                        onClick={handleGenerateCertificate}
                                        className="w-full bg-[#c2a266] hover:bg-[#a38650] text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span>🎨</span> معاينة وإنشاء الشهادة
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ... (Rest of existing tabs: Plan, Archive, Report, Calc, Schedule - Unchanged) ... */}
                        {studentTab === 'PLAN' && (
                            <div className="space-y-4 text-center"><h3 className="font-bold text-darkBrown dark:text-white">الواجب القادم</h3><AssignmentForm title="حفظ قادم" data={nextJadeed} onChange={(f, v) => setNextJadeed(prev => ({ ...prev, [f]: v }))} colorClass="border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" hideGrade /><div className="space-y-2">{nextMurajaahList.map((m, idx) => (<AssignmentForm key={idx} title={`مراجعة قادمة ${idx+1}`} data={m} onChange={(f, v) => { setNextMurajaahList(prev => { const l=[...prev]; l[idx]={...l[idx],[f]:v}; return l; }); }} colorClass="border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" hideGrade canRemove onRemove={() => setNextMurajaahList(prev => prev.filter((_, i) => i !== idx))} />))}<button onClick={() => setNextMurajaahList(prev => [...prev, { ...emptyAssignment }])} className="text-xs bg-gray-400 text-white px-3 py-1 rounded-full">+ مراجعة</button></div><Button onClick={handleSaveLog} className="w-full py-3 bg-secondary hover:bg-secondaryDark rounded-xl mt-4">حفظ الخطة (ثابت)</Button></div>
                        )}
                        {studentTab === 'ARCHIVE' && (
                             <div className="space-y-4">
                                 {selectedStudent?.logs.length === 0 ? <p className="text-center text-gray-400">لا يوجد سجلات سابقة</p> : selectedStudent?.logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                                     const formatArchAss = (a: QuranAssignment) => { if(!a) return ""; if(a.type === 'MULTI') { return a.multiSurahs?.map(s => `${s.name} [${s.grade || '-'}]`).join(' + '); } const label = a.type === 'SURAH' ? getSurahLabel(a.name, a.ayahFrom, a.ayahTo) : `(${a.ayahFrom} - ${a.ayahTo})`; return `${a.name} ${label}`; };
                                     return (
                                        <div key={log.id} className="relative">
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600 text-sm relative shadow-sm flex flex-col items-center text-center gap-2">
                                                <div className="font-bold text-darkBrown dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 w-full flex justify-center relative">
                                                    {formatSimpleDate(log.date)}
                                                    {log.seenByParent && (<span className="absolute right-0 top-0 text-green-600 dark:text-green-400 text-[10px] font-bold border border-green-200 dark:border-green-800 px-1 rounded bg-green-50 dark:bg-green-900/20">تم الاطلاع ✅</span>)}
                                                    <div className="absolute left-0 flex gap-2"><button onClick={() => handleEditLog(log)} className="text-blue-600 dark:text-blue-400 px-1 font-bold text-xs">✏️</button><button onClick={() => openDeleteModal('حذف السجل', 'هل أنت متأكد؟', () => handleDeleteLog(log.id))} className="text-red-600 dark:text-red-400 px-1 font-bold text-xs">🗑️</button></div>
                                                </div>
                                                {!log.isAbsent && log.attendance && log.attendance.length > 0 && (<div className="text-xs font-bold text-gray-500 dark:text-gray-400">{log.attendance.map(a => `${formatTime12Hour(a.arrival)} - ${formatTime12Hour(a.departure || '')}`).join(', ')}</div>)}
                                                {log.isAbsent && (<span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">غائب</span>)}
                                                {!log.isAbsent && (<>{log.jadeed && (<div className="w-full"><span className="text-[10px] text-primary dark:text-emerald-300 block font-bold mb-1">الحفظ الجديد</span><span className="text-lg font-bold text-darkBrown dark:text-white bg-white dark:bg-gray-600 px-4 py-2 rounded-xl shadow-sm border border-primary/10 dark:border-gray-500 block w-full">{formatArchAss(log.jadeed)} {log.jadeed.grade ? `[${log.jadeed.grade}]` : ''}</span></div>)}{log.murajaah && log.murajaah.length > 0 && (<div className="w-full mt-1"><span className="text-[10px] text-secondaryDark dark:text-yellow-500 block font-bold mb-1">المراجعة</span><div className="flex flex-col gap-1">{log.murajaah.map((m, i) => (<span key={i} className="text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 px-3 py-1 rounded-lg border border-secondary/10 dark:border-gray-500">{formatArchAss(m)} {m.grade ? `[${m.grade}]` : ''}</span>))}</div></div>)}{log.notes && (<div className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 border-t dark:border-gray-600 pt-2 w-full">"{log.notes}"</div>)}</>)}
                                            </div>
                                            <div className="my-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 w-2/3 mx-auto opacity-50"></div>
                                        </div>
                                     );
                                 })}
                             </div>
                        )}
                        {studentTab === 'MONTHLY_REPORT' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-center text-darkBrown dark:text-white mb-2">حصاد الشهر الحالي ({MONTHS_LIST[new Date().getMonth()]})</h3>
                                {(() => {
                                    const currentMonth = new Date().getMonth();
                                    const currentYear = new Date().getFullYear();
                                    const monthlyLogs = selectedStudent?.logs.filter(l => { const d = new Date(l.date); return !l.isAbsent && d.getMonth() === currentMonth && d.getFullYear() === currentYear; }) || [];
                                    if(monthlyLogs.length === 0) return <p className="text-center text-gray-400 text-xs">لا يوجد سجلات لهذا الشهر</p>;
                                    const jadeedSummary: string[] = []; monthlyLogs.forEach(l => { if(l.jadeed) { const label = l.jadeed.type === 'SURAH' ? `${l.jadeed.name} (${l.jadeed.ayahFrom}-${l.jadeed.ayahTo})` : l.jadeed.name; jadeedSummary.push(label); } });
                                    const murajaahSummary: string[] = []; monthlyLogs.forEach(l => { if(l.murajaah) { l.murajaah.forEach(m => { const label = m.type === 'SURAH' ? m.name : m.name; if(!murajaahSummary.includes(label)) murajaahSummary.push(label); }); } });
                                    const sortByQuran = (a: string, b: string) => { const nameA = a.split(' ')[0].replace('سورة','').trim(); const nameB = b.split(' ')[0].replace('سورة','').trim(); const idxA = SURAH_NAMES.indexOf(nameA); const idxB = SURAH_NAMES.indexOf(nameB); if(idxA === -1 || idxB === -1) return 0; return idxA - idxB; };
                                    jadeedSummary.sort(sortByQuran); murajaahSummary.sort(sortByQuran);
                                    const shareSummary = () => { if (!selectedStudent?.parentPhone) { onShowNotification('لا يوجد رقم هاتف لولي الأمر', 'error'); return; } const monthName = MONTHS_LIST[currentMonth]; const msg = `*حصاد شهر ${monthName} للطالب: ${selectedStudent.name}* 🌙\n\n📖 *الحفظ الجديد:*\n${jadeedSummary.join('\n') || 'لا يوجد'}\n\n↺ *المراجعة:*\n${murajaahSummary.join('\n') || 'لا يوجد'}\n\nنسأل الله له التوفيق والسداد.`; window.open(`https://wa.me/2${selectedStudent.parentPhone}?text=${encodeURIComponent(msg)}`, '_blank'); };
                                    return (<div className="space-y-4"><div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-2xl border border-primary/20 dark:border-primary/40"><h4 className="font-bold text-primary dark:text-emerald-300 mb-3 text-center border-b border-primary/10 pb-2">ما تم حفظه (الجديد)</h4><ul className="space-y-2 text-sm text-right">{jadeedSummary.map((item, i) => (<li key={i} className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm border border-primary/5 dark:border-gray-600 font-bold text-darkBrown dark:text-white">📖 {item}</li>))}{jadeedSummary.length === 0 && <li className="text-gray-400 text-center text-xs">--</li>}</ul></div><div className="bg-secondary/5 dark:bg-secondary/20 p-4 rounded-2xl border border-secondary/20 dark:border-secondary/40"><h4 className="font-bold text-secondaryDark dark:text-yellow-500 mb-3 text-center border-b border-secondary/10 pb-2">ما تم مراجعته</h4><ul className="space-y-2 text-sm text-right">{murajaahSummary.map((item, i) => (<li key={i} className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm border border-secondary/5 dark:border-gray-600 font-bold text-gray-700 dark:text-gray-200">↺ {item}</li>))}{murajaahSummary.length === 0 && <li className="text-gray-400 text-center text-xs">--</li>}</ul></div><button onClick={shareSummary} className="w-full bg-[#1e5233] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#163d26] transition"><span className="text-xl">📊</span> إرسال الحصاد لولي الأمر</button></div>);
                                })()}
                            </div>
                        )}
                        {studentTab === 'CALC' && (
                            <div className="text-center"><h3 className="font-bold text-darkBrown dark:text-white mb-4">حاسبة الخطة الشهرية الدقيقة</h3><div className="space-y-3 bg-white dark:bg-gray-700 p-4 rounded-2xl border shadow-sm text-right dark:border-gray-600"><div><label className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">السورة الحالية</label><select className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500" value={calcStartSurah} onChange={(e) => setCalcStartSurah(e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">رقم الآية</label><select className="w-full p-2 border rounded-lg text-center font-bold bg-white dark:bg-gray-600 dark:text-white dark:border-gray-500" value={calcStartAyah} onChange={e => setCalcStartAyah(parseInt(e.target.value))}>{calcAyahOptions.map(n => <option key={n} value={n}>{n}</option>)}</select></div><div className="flex gap-2 bg-gray-100 dark:bg-gray-600 p-2 rounded-lg"><label className="flex-1 flex items-center justify-center gap-1 cursor-pointer"><input type="radio" name="direction" checked={calcDirection === 'F2N'} onChange={() => setCalcDirection('F2N')} /><span className="text-xs font-bold dark:text-white">⬇️ الفاتحة إلى الناس</span></label><label className="flex-1 flex items-center justify-center gap-1 cursor-pointer"><input type="radio" name="direction" checked={calcDirection === 'N2F'} onChange={() => setCalcDirection('N2F')} /><span className="text-xs font-bold dark:text-white">⬆️ الناس إلى الفاتحة</span></label></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">حفظ يومي (أسطر)</label><input type="number" className="w-full p-2 border rounded-lg text-center font-bold dark:bg-gray-600 dark:text-white dark:border-gray-500" placeholder="15" value={calcLines} onChange={e => setCalcLines(e.target.value)} /></div><div><label className="text-xs font-bold text-gray-500 dark:text-gray-300 block mb-1">أيام بالأسبوع</label><input type="number" className="w-full p-2 border rounded-lg text-center font-bold dark:bg-gray-600 dark:text-white dark:border-gray-500" placeholder="3" value={calcDays} onChange={e => setCalcDays(e.target.value)} /></div></div></div>{calcLines && calcDays && (<div className="mt-4 bg-secondary/10 dark:bg-secondary/20 p-4 rounded-xl border border-secondary/20 dark:border-secondary/40"><p className="text-xs text-secondaryDark dark:text-yellow-500 font-bold mb-2">النتيجة المتوقعة نهاية الشهر:</p>{(() => { const lines = parseInt(calcLines) || 0; const days = parseInt(calcDays) || 0; const startAyah = calcStartAyah || 1; if (lines > 0 && days > 0) { const totalLines = lines * days * 4; let remainingCapacityInPages = totalLines / 15; let currentSurahIdx = SURAH_NAMES.indexOf(calcStartSurah); if (currentSurahIdx === -1) currentSurahIdx = 0; let currentAyah = startAyah; let finalSurahName = calcStartSurah; let finalAyah = currentAyah; const surahStep = calcDirection === 'F2N' ? 1 : -1; let safetyCounter = 0; while (remainingCapacityInPages > 0 && safetyCounter < 115) { safetyCounter++; const surahData = SURAH_DATA[currentSurahIdx]; if (!surahData) break; finalSurahName = surahData.name; const startPage = SURAH_START_PAGES[currentSurahIdx]; const nextPage = SURAH_START_PAGES[currentSurahIdx + 1] || 604; let surahLengthPages = nextPage - startPage; if (surahLengthPages <= 0) surahLengthPages = 0.1; const fractionOfSurahLeft = (surahData.count - currentAyah) / surahData.count; const pagesLeftInSurah = surahLengthPages * fractionOfSurahLeft; if (remainingCapacityInPages < pagesLeftInSurah) { const fractionCovered = remainingCapacityInPages / surahLengthPages; const ayahsCovered = Math.floor(fractionCovered * surahData.count); finalAyah = currentAyah + ayahsCovered; if (finalAyah > surahData.count) finalAyah = surahData.count; remainingCapacityInPages = 0; } else { remainingCapacityInPages -= pagesLeftInSurah; currentSurahIdx += surahStep; currentAyah = 0; if (currentSurahIdx < 0 || currentSurahIdx >= SURAH_DATA.length) break; } } return (<div><p className="text-3xl font-bold text-darkBrown dark:text-white">{totalLines} سطر</p><p className="text-sm text-gray-500 dark:text-gray-400 mb-2">حوالي {(totalLines/15).toFixed(1)} صفحة</p><div className="mt-2 pt-2 border-t border-secondary/20 dark:border-gray-500"><p className="text-xs font-bold text-gray-600 dark:text-gray-300">سيصل الطالب بإذن الله إلى:</p><p className="text-xl font-bold text-secondaryDark dark:text-yellow-500">سورة {finalSurahName}</p><p className="text-lg font-bold text-darkBrown dark:text-white">الآية {finalAyah <= 0 ? 1 : finalAyah}</p></div></div>); } return <p>--</p>; })()}</div>)}<div className="mt-4 text-left"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">ملاحظات الخطة (حفظ)</label><textarea className="w-full p-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500" rows={3} placeholder="اكتب تفاصيل الخطة هنا لحفظها..." value={calcNotes} onChange={e => setCalcNotes(e.target.value)}></textarea><Button onClick={saveCalculatorNotes} className="mt-2 w-full text-xs">حفظ الملاحظة</Button></div></div>
                        )}
                        {studentTab === 'SCHEDULE' && (
                            <div className="space-y-2"><h3 className="font-bold text-center mb-4 text-darkBrown dark:text-white">جدول المواعيد</h3>{selectedStudent?.weeklySchedule?.map((daySched, i) => (<div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600"><span className="font-bold text-sm text-gray-700 dark:text-gray-200">{daySched.day}</span><div className="flex gap-1 flex-wrap justify-end">{daySched.events.length > 0 ? (daySched.events.map((ev, idx) => (<span key={idx} className="bg-white dark:bg-gray-600 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-500 text-primary dark:text-emerald-300 font-bold shadow-sm">{formatTime12Hour(ev.time)}</span>))) : (<span className="text-xs text-gray-400">--</span>)}</div></div>))}</div>
                        )}
                    </div>
                </div>
            )}

            {!selectedStudentId && (
                <div className="mt-8 text-center pb-8"><h1 className="font-serif text-2xl text-darkBrown dark:text-gray-500 opacity-30">دار التوحيد</h1><p className="text-[10px] text-mutedBrown opacity-50">وفقكم الله لكل خير</p></div>
            )}
       </div>
    </div>
  );
};
