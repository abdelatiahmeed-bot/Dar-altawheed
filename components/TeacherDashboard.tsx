import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, DailyLog, Grade, QuranAssignment, Announcement, Payment, QuizItem, Teacher, AttendanceRecord, MultiSurahDetail, ExamDayDetail, AdabSession } from '../types';
import { SURAH_NAMES, JUZ_LIST, SURAH_DATA, formatDateDual, formatTime12Hour, formatSimpleDate, formatDateWithDay } from '../constants';
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

// --- STYLED COMPONENTS ---

const AssignmentForm = ({ data, onChange, title, colorClass, canRemove, onRemove, hideGrade }: any) => {
    const isSurah = data.type === 'SURAH';
    const isRange = data.type === 'RANGE';
    const isMulti = data.type === 'MULTI';
    const maxAyahs = useMemo(() => {
        if (isSurah) { const s = SURAH_DATA.find(x => x.name === data.name); return s ? s.count : 286; } return 286;
    }, [data.name, isSurah]);
    const ayahOptions = useMemo(() => Array.from({ length: maxAyahs }, (_, i) => i + 1), [maxAyahs]);

    const handleUpdateMultiSurah = (index: number, field: string, val: any) => {
        const list = [...(data.multiSurahs || [])]; list[index] = { ...list[index], [field]: val }; onChange('multiSurahs', list);
    };

    return (
        <div className={`p-4 rounded-xl border mb-3 relative animate-fade-in card-paper ${colorClass}`}>
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[#3f4f24]">{title}</h4>
                {canRemove && <button onClick={onRemove} className="text-red-600 hover:text-red-800 text-xs font-bold bg-white px-2 py-1 rounded border border-red-200 shadow-sm">حذف ✖</button>}
            </div>
            <div className="flex gap-2 mb-3">
                {['SURAH', 'RANGE', 'JUZ', 'MULTI'].map(type => (
                    <button key={type} onClick={() => onChange('type', type)} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${data.type === type ? 'bg-[#3f4f24] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                        {type === 'SURAH' ? 'سورة' : type === 'RANGE' ? 'نطاق' : type === 'JUZ' ? 'جزء' : 'متعدد'}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                {data.type === 'JUZ' ? (
                     <select className="w-full p-2 border rounded-lg bg-white text-sm" value={data.juzNumber || 1} onChange={(e) => { onChange('juzNumber', parseInt(e.target.value)); onChange('name', JUZ_LIST[parseInt(e.target.value) - 1]); }}>{JUZ_LIST.map((j, i) => <option key={i} value={i+1}>{j}</option>)}</select>
                ) : isMulti ? (
                    <div className="bg-white/50 p-2 rounded-lg border border-gray-200">
                        {(data.multiSurahs || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select className="flex-1 p-1 border rounded text-xs" value={item.name} onChange={e => handleUpdateMultiSurah(idx, 'name', e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                <button onClick={() => {const l=[...data.multiSurahs]; l.splice(idx,1); onChange('multiSurahs', l)}} className="text-red-500 font-bold px-2">×</button>
                            </div>
                        ))}
                        <button onClick={() => onChange('multiSurahs', [...(data.multiSurahs||[]), {name:SURAH_NAMES[0]}])} className="text-xs text-[#556b2f] font-bold border border-dashed border-[#556b2f] p-1 rounded w-full hover:bg-[#556b2f] hover:text-white transition">+ إضافة سورة</button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2">
                            <select className="flex-1 p-2 border rounded-lg bg-white text-sm" value={data.name} onChange={e => onChange('name', e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            {isRange && <select className="flex-1 p-2 border rounded-lg bg-white text-sm" value={data.endName || data.name} onChange={e => onChange('endName', e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select>}
                        </div>
                        {isSurah && (
                            <div className="flex gap-2 items-center bg-white/50 p-2 rounded-lg border border-gray-200">
                                <select className="flex-1 p-1 border rounded text-center font-bold bg-white" value={data.ayahFrom} onChange={e => onChange('ayahFrom', parseInt(e.target.value))}>{ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}</select>
                                <span className="text-gray-400 text-xs">إلى</span>
                                <select className="flex-1 p-1 border rounded text-center font-bold bg-white" value={data.ayahTo} onChange={e => onChange('ayahTo', parseInt(e.target.value))}>{ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}</select>
                            </div>
                        )}
                    </>
                )}
                {!hideGrade && !isMulti && (
                    <select className="w-full p-2 border rounded-lg bg-white text-sm font-bold text-[#3f4f24]" value={data.grade} onChange={e => onChange('grade', e.target.value)}>{Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}</select>
                )}
            </div>
        </div>
    );
};

const TabButton = ({ id, label, icon, isActive, onClick, compact }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ${
            compact 
            ? 'p-2 min-w-[60px] ' + (isActive ? 'bg-[#3f4f24] text-white shadow-md' : 'bg-transparent text-[#3f4f24] border border-[#3f4f24]/20') 
            : 'p-3 min-w-[80px] ' + (isActive ? 'bg-gradient-to-b from-[#556b2f] to-[#3f4f24] text-white shadow-lg transform scale-105 border border-[#6b8c42]' : 'bg-[#f4f1ea] text-[#3f4f24] border border-[#dcdcdc] hover:bg-white')
        }`}
    >
        <span className={`${compact ? 'text-lg' : 'text-2xl'} mb-1`}>{icon}</span>
        <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold whitespace-nowrap`}>{label}</span>
    </button>
);

const ConfirmDeleteButton = ({ label, onConfirm, className }: any) => {
    const [confirming, setConfirming] = useState(false);
    if (confirming) {
        return (
            <div className="flex gap-2">
                <button onClick={onConfirm} className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-sm hover:bg-red-700">تأكيد ✅</button>
                <button onClick={() => setConfirming(false)} className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold hover:bg-gray-300">إلغاء</button>
            </div>
        )
    }
    return <button onClick={() => setConfirming(true)} className={`bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded text-xs font-bold border border-red-100 transition ${className}`}>{label}</button>
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = (props) => {
  const { teacherName, teacherId, students, allTeachers = [], announcements, adabArchive, onUpdateStudent, onAddStudent, onDeleteStudents, onMarkAbsences, onAddAnnouncement, onDeleteAnnouncement, onLogout, onShowNotification, onPublishAdab, onEditAdab, onDeleteAdab, onQuickAnnouncement } = props;

  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'DELETE' | 'ANNOUNCEMENTS' | 'ADAB' | 'ATTENDANCE' | 'STATS'>('LIST');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<'ALPHABETICAL' | 'CODE'>('ALPHABETICAL');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');

  // Adab State
  const [adabTitle, setAdabTitle] = useState('مجلس الآداب');
  const [adabQuestionsList, setAdabQuestionsList] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentCorrect, setCurrentCorrect] = useState('');
  const [currentWrong1, setCurrentWrong1] = useState('');
  const [currentWrong2, setCurrentWrong2] = useState('');
  const [editingAdabId, setEditingAdabId] = useState<string | null>(null);

  // Announcement State
  const [announcementType, setAnnouncementType] = useState<'GENERAL' | 'EXAM'>('GENERAL');
  const [announcementText, setAnnouncementText] = useState('');
  const [examTesterId, setExamTesterId] = useState('');
  const [examDays, setExamDays] = useState<ExamDayDetail[]>([]);
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExamDesc, setNewExamDesc] = useState('حفظ');

  // Student Log State
  const [logDate, setLogDate] = useState(formatSimpleDate(new Date().toISOString()));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([{ id: '1', arrival: '16:00', departure: '18:00' }]);
  const [jadeed, setJadeed] = useState<QuranAssignment>({ ...emptyAssignment });
  const [murajaahList, setMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
  const [notes, setNotes] = useState('');
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [nextJadeed, setNextJadeed] = useState<QuranAssignment>({ ...emptyAssignment, grade: Grade.GOOD });
  const [nextMurajaahList, setNextMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment }]);
  
  const [studentTab, setStudentTab] = useState<'LOG' | 'PLAN' | 'ARCHIVE' | 'CALC' | 'SCHEDULE' | 'FEES'>('LOG');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'ABSENT' | 'EXCUSED' | null>>({});
  
  // Computed
  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const sortedStudents = useMemo(() => {
      const sorted = [...students];
      if (sortMethod === 'CODE') sorted.sort((a, b) => a.parentCode.localeCompare(b.parentCode));
      else sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      return sorted;
  }, [students, sortMethod]);
  const unloggedStudents = useMemo(() => {
    const todayStr = new Date().toDateString();
    return students.filter(s => !s.logs.some(l => new Date(l.date).toDateString() === todayStr));
  }, [students]);

  // Handlers
  const handleOpenStudent = (s: Student) => {
    setSelectedStudentId(s.id);
    setStudentTab('LOG');
    const todayStr = new Date().toDateString();
    const existingLog = s.logs.find(l => new Date(l.date).toDateString() === todayStr);
    
    if (existingLog && !existingLog.isAbsent && !existingLog.isAdab) {
        setCurrentLogId(existingLog.id);
        setJadeed(existingLog.jadeed || { ...emptyAssignment });
        setMurajaahList(existingLog.murajaah || []);
        setNotes(existingLog.notes || '');
        setAttendanceRecords(existingLog.attendance && existingLog.attendance.length > 0 ? existingLog.attendance : [{ id: '1', arrival: '16:00', departure: '18:00' }]);
    } else {
        setCurrentLogId(null);
        setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]);
        if (s.nextPlan) {
            setJadeed({...s.nextPlan.jadeed, grade: Grade.GOOD});
            setMurajaahList(s.nextPlan.murajaah || []);
        } else {
            setJadeed({ ...emptyAssignment });
            setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
        }
        setNotes('');
    }
    if (s.nextPlan) {
        setNextJadeed(s.nextPlan.jadeed);
        setNextMurajaahList(s.nextPlan.murajaah || []);
    } else {
        setNextJadeed({ ...emptyAssignment, grade: Grade.GOOD });
        setNextMurajaahList([{ ...emptyAssignment }]);
    }
  };

  const handleSaveLog = () => {
      if (!selectedStudent) return;
      const newLog: DailyLog = {
          id: currentLogId || `log_${Date.now()}`,
          date: new Date().toISOString(),
          teacherId, teacherName, seenByParent: false,
          attendance: attendanceRecords, jadeed, murajaah: murajaahList, notes,
          isAbsent: false, isAdab: false
      };
      
      const updatedLogs = currentLogId ? selectedStudent.logs.map(l => l.id === currentLogId ? newLog : l) : [newLog, ...selectedStudent.logs];
      onUpdateStudent({ ...selectedStudent, logs: updatedLogs, nextPlan: { jadeed: nextJadeed, murajaah: nextMurajaahList } });
      onShowNotification('تم حفظ السجل بنجاح', 'success');
      if (!currentLogId) setCurrentLogId(newLog.id);
  };

  const handleAddToQuestionList = () => {
      if (!currentQuestion || !currentCorrect) return;
      setAdabQuestionsList([...adabQuestionsList, { id: 'q_'+Date.now(), question: currentQuestion, correctAnswer: currentCorrect, wrongAnswers: [currentWrong1, currentWrong2].filter(x=>x) }]);
      setCurrentQuestion(''); setCurrentCorrect(''); setCurrentWrong1(''); setCurrentWrong2('');
  };

  const handlePublishAdabLesson = () => {
      if(adabQuestionsList.length === 0) { onShowNotification("أضف سؤالاً واحداً على الأقل", "error"); return; }
      if(editingAdabId) { onEditAdab(editingAdabId, adabTitle, adabQuestionsList); setEditingAdabId(null); }
      else { onPublishAdab(adabTitle, adabQuestionsList); }
      setAdabQuestionsList([]); setAdabTitle('مجلس الآداب');
      onShowNotification("تم نشر الدرس", "success");
  };

  const toggleStudentStatus = (id: string) => {
      setAttendanceMap(prev => {
          const c = prev[id];
          if (!c) return { ...prev, [id]: 'ABSENT' };
          if (c === 'ABSENT') return { ...prev, [id]: 'EXCUSED' };
          const n = { ...prev }; delete n[id]; return n;
      });
  };

  const renderStudentCard = (student: Student) => {
    const todayStr = new Date().toDateString();
    const todayLog = student.logs.find(l => new Date(l.date).toDateString() === todayStr);
    let statusText = "لم يحضر بعد";
    let statusColor = "text-gray-400";
    if (todayLog) {
        if (todayLog.isAbsent) { statusText = "غياب ❌"; statusColor = "text-red-500"; }
        else if (todayLog.isAdab) { statusText = "مجلس آداب ✨"; statusColor = "text-amber-500"; }
        else { statusText = "تم التسميع ✅"; statusColor = "text-[#556b2f]"; }
    }

    return (
      <div key={student.id} onClick={() => handleOpenStudent(student)} className="card-paper mb-3 relative overflow-hidden rounded-2xl transition-transform active:scale-[0.98] cursor-pointer group">
        <div className="flex items-center justify-between p-4">
           <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                    {student.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-[#3f4f24] text-lg leading-tight">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-[#3f4f24]/10 text-[#3f4f24] px-2 py-0.5 rounded-full font-bold font-mono">#{student.parentCode}</span>
                        <span className={`text-[10px] font-bold ${statusColor}`}>{statusText}</span>
                    </div>
                </div>
           </div>
           <div className="w-8 h-8 rounded-full bg-[#f4f1ea] flex items-center justify-center text-[#c5a059] group-hover:bg-[#3f4f24] group-hover:text-white transition-colors shadow-sm">⬅</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      
      {/* --- HEADER & TABS --- */}
      <div className="bg-transparent sticky top-0 z-50 px-4 py-4">
        <div className="flex justify-between items-center mb-4 card-paper p-3 rounded-2xl shadow-sm">
            {!selectedStudentId ? (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3f4f24] border-2 border-[#c5a059] flex items-center justify-center text-white">👳‍♂️</div>
                    <div>
                        <h1 className="font-bold text-[#3f4f24] text-sm">مرحباً، {teacherName}</h1>
                        <p className="text-[10px] text-[#c5a059] font-bold">لوحة المعلم</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 w-full animate-slide-right">
                    <button onClick={() => setSelectedStudentId(null)} className="p-2 bg-[#f4f1ea] rounded-full text-[#3f4f24] hover:bg-gray-200">➜</button>
                    <h1 className="font-bold text-[#3f4f24] flex-1 text-center truncate">{selectedStudent?.name}</h1>
                </div>
            )}
            {!selectedStudentId && (
                <button onClick={onLogout} className="bg-red-50 text-red-500 px-3 py-1 rounded-xl text-xs font-bold border border-red-100 hover:bg-red-100 transition">خروج</button>
            )}
        </div>

        {!selectedStudentId && (
            <div className="flex gap-2 overflow-x-auto pb-2 pt-2 justify-start md:justify-center no-scrollbar px-1">
                <TabButton id="LIST" label="القائمة" icon="📋" isActive={activeTab === 'LIST'} onClick={() => setActiveTab('LIST')} />
                <TabButton id="ADD" label="إضافة" icon="➕" isActive={activeTab === 'ADD'} onClick={() => setActiveTab('ADD')} />
                <TabButton id="ADAB" label="الآداب" icon="🌟" isActive={activeTab === 'ADAB'} onClick={() => setActiveTab('ADAB')} />
                <TabButton id="ATTENDANCE" label="الغياب" icon="🚫" isActive={activeTab === 'ATTENDANCE'} onClick={() => setActiveTab('ATTENDANCE')} />
                <TabButton id="STATS" label="الإحصائيات" icon="📊" isActive={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
                <TabButton id="ANNOUNCEMENTS" label="إعلانات" icon="📢" isActive={activeTab === 'ANNOUNCEMENTS'} onClick={() => setActiveTab('ANNOUNCEMENTS')} />
                <TabButton id="DELETE" label="حذف" icon="🗑️" isActive={activeTab === 'DELETE'} onClick={() => setActiveTab('DELETE')} />
            </div>
        )}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="px-4 max-w-lg mx-auto">
        {!selectedStudentId ? (
            <div className="animate-slide-up">
                
                {/* LIST TAB */}
                {activeTab === 'LIST' && (
                    <div>
                        <div className="bg-[#f4f1ea] p-3 rounded-xl border border-[#dcdcdc] flex justify-between items-center mb-4">
                            <span className="font-bold text-[#3f4f24] text-sm">عدد الطلاب: {students.length}</span>
                            <div className="flex gap-1">
                                <button onClick={() => setSortMethod('ALPHABETICAL')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${sortMethod === 'ALPHABETICAL' ? 'bg-[#3f4f24] text-white' : 'bg-white text-gray-500'}`}>أبجدي</button>
                                <button onClick={() => setSortMethod('CODE')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${sortMethod === 'CODE' ? 'bg-[#3f4f24] text-white' : 'bg-white text-gray-500'}`}>بالكود</button>
                            </div>
                        </div>
                        {sortedStudents.length === 0 ? <p className="text-center text-gray-400 py-10">القائمة فارغة</p> : sortedStudents.map(renderStudentCard)}
                    </div>
                )}

                {/* ADD TAB */}
                {activeTab === 'ADD' && (
                    <div className="card-paper p-6 rounded-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-[#f4f1ea] rounded-full flex items-center justify-center text-3xl mx-auto mb-2 border-2 border-[#c5a059]">👤</div>
                            <h3 className="font-bold text-[#3f4f24]">إضافة طالب جديد</h3>
                        </div>
                        <div className="space-y-4">
                            <input className="w-full p-3 rounded-xl border border-[#dcdcdc] bg-[#f9f9f9] focus:ring-2 focus:ring-[#c5a059] outline-none" placeholder="الاسم الثلاثي" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                            <input className="w-full p-3 rounded-xl border border-[#dcdcdc] bg-[#f9f9f9] text-center font-mono tracking-widest focus:ring-2 focus:ring-[#c5a059] outline-none" placeholder="الكود (مثال: 101)" value={newStudentCode} onChange={e => setNewStudentCode(e.target.value)} />
                            <Button onClick={() => { if(newStudentName && newStudentCode){onAddStudent(newStudentName, newStudentCode); setNewStudentName(''); setNewStudentCode(''); onShowNotification('تمت الإضافة', 'success');} }}>حفظ الطالب</Button>
                        </div>
                    </div>
                )}

                {/* ADAB TAB */}
                {activeTab === 'ADAB' && (
                    <div className="space-y-4">
                        <div className="card-paper p-5 rounded-2xl border border-[#c5a059]">
                            <h3 className="font-bold text-[#3f4f24] text-lg mb-2 text-center">{editingAdabId ? "تعديل مجلس" : "مجلس آداب جديد"}</h3>
                            <input className="w-full p-2 mb-3 rounded-lg border border-[#dcdcdc] text-center font-bold text-[#3f4f24]" value={adabTitle} onChange={e => setAdabTitle(e.target.value)} />
                            
                            <div className="bg-[#f9f9f9] p-3 rounded-xl border border-[#dcdcdc] mb-3">
                                <h4 className="text-xs font-bold text-gray-500 mb-2">إضافة سؤال</h4>
                                <input className="w-full p-2 mb-2 rounded border text-sm" placeholder="السؤال..." value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className="p-2 rounded border border-green-200 bg-green-50 text-sm" placeholder="الإجابة الصحيحة" value={currentCorrect} onChange={e => setCurrentCorrect(e.target.value)} />
                                    <input className="p-2 rounded border border-red-200 bg-red-50 text-sm" placeholder="إجابة خاطئة" value={currentWrong1} onChange={e => setCurrentWrong1(e.target.value)} />
                                </div>
                                <Button variant="secondary" onClick={handleAddToQuestionList} className="w-full mt-2 text-xs py-2">أضف للسائمة ⬇️</Button>
                            </div>

                            {adabQuestionsList.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {adabQuestionsList.map((q, i) => (
                                        <div key={q.id} className="text-xs bg-white p-2 rounded border flex justify-between">
                                            <span>{i+1}. {q.question}</span>
                                            <button onClick={() => setAdabQuestionsList(prev => prev.filter(x => x.id !== q.id))} className="text-red-500 font-bold">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button onClick={handlePublishAdabLesson} className="w-full">نشر الدرس الآن 🚀</Button>
                        </div>
                        
                        {adabArchive.length > 0 && (
                            <div className="card-paper p-4 rounded-xl">
                                <h4 className="font-bold text-[#3f4f24] mb-2 border-b pb-1">الأرشيف</h4>
                                {adabArchive.map(s => (
                                    <div key={s.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                        <span className="text-sm font-bold text-gray-700">{s.title}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingAdabId(s.id); setAdabTitle(s.title); setAdabQuestionsList(s.quizzes); window.scrollTo(0,0); }} className="text-blue-500 text-xs font-bold">تعديل</button>
                                            <button onClick={() => onDeleteAdab(s.id)} className="text-red-500 text-xs font-bold">حذف</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === 'ATTENDANCE' && (
                    <div className="card-paper p-5 rounded-2xl">
                        <h3 className="font-bold text-[#3f4f24] mb-4 text-center">الغياب السريع</h3>
                        {unloggedStudents.length === 0 ? <p className="text-center text-green-600 font-bold">تم تسجيل الجميع اليوم!</p> : (
                            <>
                                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto mb-4">
                                    {unloggedStudents.map(s => {
                                        const status = attendanceMap[s.id];
                                        const bg = status === 'ABSENT' ? 'bg-red-50 border-red-500' : status === 'EXCUSED' ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-gray-200';
                                        return (
                                            <div key={s.id} onClick={() => toggleStudentStatus(s.id)} className={`p-3 rounded-xl border-2 cursor-pointer transition ${bg}`}>
                                                <p className="font-bold text-sm text-[#3f4f24] truncate">{s.name}</p>
                                                <p className="text-[10px] text-gray-500">{status === 'ABSENT' ? 'غياب' : status === 'EXCUSED' ? 'عذر' : 'حاضر'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button onClick={() => {
                                    const abs: string[] = [], exc: string[] = [];
                                    Object.entries(attendanceMap).forEach(([id, st]) => { if(st==='ABSENT') abs.push(id); else if(st==='EXCUSED') exc.push(id); });
                                    if(abs.length||exc.length) { onMarkAbsences(abs, exc); setAttendanceMap({}); onShowNotification('تم الحفظ', 'success'); }
                                }} variant="danger" className="w-full">حفظ الغياب المحدد</Button>
                            </>
                        )}
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === 'STATS' && (
                    <div className="card-paper p-5 rounded-2xl">
                        <h3 className="font-bold text-[#3f4f24] mb-4 text-center">إحصائيات اليوم</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                                <span className="block text-2xl font-black text-emerald-700">{students.filter(s => s.logs.some(l => !l.isAbsent && new Date(l.date).toDateString() === new Date().toDateString())).length}</span>
                                <span className="text-xs font-bold text-emerald-800">حضور</span>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                                <span className="block text-2xl font-black text-red-700">{students.filter(s => s.logs.some(l => l.isAbsent && new Date(l.date).toDateString() === new Date().toDateString())).length}</span>
                                <span className="text-xs font-bold text-red-800">غياب</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANNOUNCEMENTS TAB */}
                {activeTab === 'ANNOUNCEMENTS' && (
                    <div className="space-y-4">
                        <div className="card-paper p-5 rounded-2xl">
                            <h3 className="font-bold text-[#3f4f24] text-center mb-4">إضافة إعلان</h3>
                            <select className="w-full p-2 mb-2 border rounded bg-white text-sm" value={announcementType} onChange={(e:any) => setAnnouncementType(e.target.value)}>
                                <option value="GENERAL">عام</option>
                                <option value="EXAM">اختبار</option>
                            </select>
                            {announcementType === 'GENERAL' ? (
                                <textarea className="w-full p-2 border rounded mb-2 text-sm h-20" placeholder="نص الإعلان..." value={announcementText} onChange={e => setAnnouncementText(e.target.value)}></textarea>
                            ) : (
                                <div className="space-y-2 mb-2">
                                    <select className="w-full p-2 border rounded" value={examTesterId} onChange={e => setExamTesterId(e.target.value)}>
                                        <option value="">-- اختر المختبر --</option>
                                        {allTeachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <div className="flex gap-1">
                                        <input type="date" className="flex-1 border rounded p-1 text-xs" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} />
                                        <button onClick={() => setExamDays([...examDays, {id: Date.now().toString(), date: newExamDate, description: newExamDesc}])} className="bg-[#3f4f24] text-white px-2 rounded text-xs">إضافة</button>
                                    </div>
                                    {examDays.map(d => <div key={d.id} className="text-xs bg-gray-50 p-1 flex justify-between">{d.date} ({d.description})</div>)}
                                </div>
                            )}
                            <Button onClick={() => {
                                if(announcementType==='GENERAL' && announcementText){ onAddAnnouncement({id:'a_'+Date.now(), teacherId, teacherName, content: announcementText, date: new Date().toISOString(), type:'GENERAL'}); setAnnouncementText(''); onShowNotification('تم النشر','success'); }
                                else if(announcementType==='EXAM' && examTesterId && examDays.length) { onAddAnnouncement({id:'a_'+Date.now(), teacherId, teacherName, content:'جدول اختبار', date: new Date().toISOString(), type:'EXAM', examDetails: {testerTeacherId: examTesterId, testerTeacherName: allTeachers?.find(t=>t.id===examTesterId)?.name||'', schedule: examDays}}); setExamTesterId(''); setExamDays([]); onShowNotification('تم نشر الجدول','success'); }
                            }} className="w-full">نشر الإعلان</Button>
                        </div>
                        {announcements.map(a => (
                            <div key={a.id} className="card-paper p-3 rounded-xl relative">
                                <button onClick={() => onDeleteAnnouncement(a.id)} className="absolute top-2 left-2 text-red-400 font-bold">×</button>
                                <p className="font-bold text-[#3f4f24] text-sm">{a.teacherName} <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{a.type}</span></p>
                                <p className="text-sm text-gray-700 mt-1">{a.type === 'EXAM' ? 'جدول اختبارات...' : a.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* DELETE TAB */}
                {activeTab === 'DELETE' && (
                    <div className="space-y-2">
                        {sortedStudents.map(s => (
                            <div key={s.id} className="card-paper p-3 rounded-xl flex justify-between items-center">
                                <span className="font-bold text-[#3f4f24]">{s.name}</span>
                                <ConfirmDeleteButton label="حذف" onConfirm={() => onDeleteStudents([s.id])} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            // --- SELECTED STUDENT DETAIL VIEW ---
            <div className="animate-slide-up pb-10">
                
                {/* SUB-TABS (Log, Plan, Archive...) */}
                <div className="flex gap-2 mb-4 bg-white/50 p-1 rounded-xl justify-center overflow-x-auto no-scrollbar">
                    <button onClick={() => setStudentTab('LOG')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${studentTab === 'LOG' ? 'bg-[#3f4f24] text-white shadow' : 'text-[#3f4f24]'}`}>اليوم</button>
                    <button onClick={() => setStudentTab('PLAN')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${studentTab === 'PLAN' ? 'bg-[#c5a059] text-white shadow' : 'text-[#3f4f24]'}`}>الخطة</button>
                    <button onClick={() => setStudentTab('ARCHIVE')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${studentTab === 'ARCHIVE' ? 'bg-gray-600 text-white shadow' : 'text-[#3f4f24]'}`}>السجل</button>
                    <button onClick={() => setStudentTab('CALC')} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${studentTab === 'CALC' ? 'bg-indigo-600 text-white shadow' : 'text-[#3f4f24]'}`}>الحاسبة</button>
                </div>

                {studentTab === 'LOG' && (
                    <div className="space-y-4">
                        <AssignmentForm title="📖 الحفظ الجديد" data={jadeed} onChange={(f:any,v:any) => setJadeed({...jadeed, [f]:v})} colorClass="bg-emerald-50/50 border-emerald-100" />
                        
                        <div className="card-paper p-4 rounded-xl border-amber-100 bg-amber-50/30">
                            <div className="flex justify-between mb-2 items-center">
                                <h4 className="font-bold text-[#3f4f24]">🔄 المراجعة</h4>
                                <button onClick={() => setMurajaahList([...murajaahList, {...emptyAssignment}])} className="text-xs bg-[#c5a059] text-white px-2 py-1 rounded font-bold hover:bg-[#b08d4b] transition">+ إضافة</button>
                            </div>
                            {murajaahList.map((m, i) => (
                                <AssignmentForm key={i} title={`مراجعة ${i+1}`} data={m} onChange={(f:any,v:any)=>{const l=[...murajaahList]; l[i]={...l[i],[f]:v}; setMurajaahList(l)}} colorClass="bg-white" canRemove onRemove={()=>setMurajaahList(murajaahList.filter((_,x)=>x!==i))} />
                            ))}
                        </div>

                        <div className="card-paper p-4 rounded-xl">
                             <label className="text-xs font-bold text-gray-500 mb-1 block">ملاحظات / رسالة لولي الأمر</label>
                             <textarea className="w-full p-3 rounded-xl border border-[#dcdcdc] text-sm h-24 focus:ring-2 focus:ring-[#c5a059] outline-none" placeholder="اكتب ملاحظاتك هنا..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                             <div className="flex gap-2 mt-2">
                                <button onClick={async () => {
                                    if(!selectedStudent) return;
                                    const msg = await generateEncouragement(selectedStudent.name, { jadeed, murajaah: murajaahList } as any);
                                    setNotes(prev => (prev ? prev + '\n\n' + msg : msg));
                                }} className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg text-xs font-bold hover:bg-purple-200">✨ إنشاء رسالة ذكية</button>
                             </div>
                        </div>

                        <Button onClick={handleSaveLog} className="w-full text-lg py-4 shadow-xl">💾 حفظ السجل</Button>
                    </div>
                )}
                
                {studentTab === 'PLAN' && (
                    <div className="card-paper p-5 rounded-2xl border-blue-100 bg-blue-50/20">
                        <h3 className="font-bold text-[#3f4f24] mb-4 text-center text-lg">الواجب القادم (اللوح)</h3>
                        <p className="text-xs text-gray-500 text-center mb-4">حدد ما يجب حفظه للمرة القادمة ليظهر لولي الأمر.</p>
                        
                        <AssignmentForm title="حفظ الغد" data={nextJadeed} onChange={(f:any,v:any)=>setNextJadeed({...nextJadeed,[f]:v})} colorClass="bg-white" hideGrade />
                        
                        <div className="mt-4">
                            <div className="flex justify-between mb-2"><h4 className="font-bold text-[#3f4f24] text-sm">مراجعة الغد</h4><button onClick={() => setNextMurajaahList([...nextMurajaahList, {...emptyAssignment}])} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">+</button></div>
                            {nextMurajaahList.map((m, i) => <AssignmentForm key={i} title={`مراجعة ${i+1}`} data={m} onChange={(f:any,v:any)=>{const l=[...nextMurajaahList]; l[i]={...l[i],[f]:v}; setNextMurajaahList(l)}} colorClass="bg-white" canRemove onRemove={()=>setNextMurajaahList(nextMurajaahList.filter((_,x)=>x!==i))} hideGrade />)}
                        </div>
                        
                        <Button onClick={handleSaveLog} variant="secondary" className="w-full mt-6">حفظ الخطة</Button>
                    </div>
                )}

                {studentTab === 'ARCHIVE' && (
                    <div className="space-y-3">
                        {selectedStudent.logs.length === 0 && <p className="text-center text-gray-400 py-10">لا يوجد سجلات</p>}
                        {selectedStudent.logs.map(log => (
                            <div key={log.id} className={`card-paper p-4 rounded-xl border-r-4 ${log.isAbsent ? 'border-r-red-500' : log.isAdab ? 'border-r-amber-500' : 'border-r-[#556b2f]'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-[#3f4f24] text-sm">{formatSimpleDate(log.date)}</span>
                                    {log.isAbsent ? <span className="text-red-500 text-xs font-bold">غياب</span> : log.isAdab ? <span className="text-amber-600 text-xs font-bold">آداب</span> : <span className="text-[#556b2f] text-xs font-bold">حضور</span>}
                                </div>
                                {!log.isAbsent && !log.isAdab && (
                                    <div className="text-xs text-gray-600 space-y-1">
                                        {log.jadeed && <p><span className="font-bold">حفظ:</span> {log.jadeed.name} ({log.jadeed.grade})</p>}
                                        {log.murajaah && log.murajaah.length > 0 && <p><span className="font-bold">مراجعة:</span> {log.murajaah.map(m => m.name).join('، ')}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {studentTab === 'CALC' && (
                    <div className="card-paper p-6 rounded-2xl text-center">
                        <h3 className="font-bold text-[#3f4f24] mb-4">حاسبة الإنجاز (قريباً)</h3>
                        <p className="text-sm text-gray-500">سيتم إضافة الحاسبة هنا بنفس التصميم الجديد.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Decorative Background */}
      <div className="islamic-pattern-bg"></div>
    </div>
  );
};