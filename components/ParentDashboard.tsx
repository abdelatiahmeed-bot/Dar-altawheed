
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Grade, WeeklySchedule, Announcement, DailyLog, CalendarEvent, QuizItem, QuranAssignment, Teacher } from '../types';
import { Button } from './Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MONTHS_LIST, formatTime12Hour, JUZ_LIST, formatSimpleDate, DAYS_OF_WEEK, SURAH_DATA } from '../constants';
import { TimePicker } from './TimePicker';

interface ParentDashboardProps {
  student: Student;
  announcements: Announcement[];
  onUpdateStudent: (student: Student) => void;
  onLogout: () => void;
  onMarkSeen: (studentId: string, logIds: string[]) => void;
  teachers?: Teacher[]; 
}

const gradeToScore = (g: Grade) => {
  switch(g) {
    case Grade.EXCELLENT: return 5;
    case Grade.VERY_GOOD: return 4;
    case Grade.GOOD: return 3;
    case Grade.ACCEPTABLE: return 2;
    case Grade.NEEDS_WORK: return 1;
    default: return 0;
  }
};

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ 
    student, 
    announcements, 
    onUpdateStudent, 
    onLogout, 
    onMarkSeen,
    teachers
}) => {
    const [activeTab, setActiveTab] = useState<'timeline' | 'schedule' | 'fees' | 'next'>('timeline');
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState(student.parentPhone || '');

    // Quiz State
    const [activeQuizLogId, setActiveQuizLogId] = useState<string | null>(null);
    const [quizStep, setQuizStep] = useState(0); 
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [quizStatus, setQuizStatus] = useState<'IDLE' | 'CONFIRMING' | 'RESULT'>('IDLE');
    const [currentScore, setCurrentScore] = useState(0);
    const [currentShuffledAnswers, setCurrentShuffledAnswers] = useState<string[]>([]);
    const [showQuizSuccess, setShowQuizSuccess] = useState(false);
    
    // Schedule Editing State
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [tempSchedule, setTempSchedule] = useState<WeeklySchedule[]>([]);

    useEffect(() => {
        setTempSchedule(JSON.parse(JSON.stringify(student.weeklySchedule)));
    }, [student.weeklySchedule]);

    const sortedLogs = useMemo(() => {
        return [...student.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [student.logs]);

    const latestLog = sortedLogs.length > 0 ? sortedLogs[0] : null;
    const isLatestAbsent = latestLog && latestLog.isAbsent && !latestLog.seenByParent;

    const myAnnouncements = useMemo(() => {
        const now = new Date();
        const activeAnnouncements = announcements.filter(a => {
            // 1. Target check
            const isTargeted = a.teacherId === student.teacherId || a.type === 'GENERAL';
            if (!isTargeted) return false;

            // 2. Expiry check
            if (a.expiresAt) {
                if (new Date(a.expiresAt).getTime() < now.getTime()) return false;
            }

            // 3. Adab Completion Check
            // If announcement is about Adab (starts with ***), and we have a log for THAT day with completed quiz, hide it.
            if (a.content.startsWith("***")) {
                const adabLogForDate = student.logs.find(l => 
                    l.isAdab && 
                    new Date(l.date).toDateString() === new Date(a.date).toDateString()
                );
                
                if (adabLogForDate && adabLogForDate.parentQuizScore !== undefined) {
                    return false; // Hide if quiz done
                }
            }

            return true;
        });

        // 4. Fee Reminder check (Always show if feeReminder exists)
        if (student.feeReminder) {
            const feeAnnouncement: Announcement = {
                id: `fee_${student.id}_${Date.now()}`,
                teacherId: 'admin',
                teacherName: 'الإدارة',
                content: `الرجاء من سيادتكم التكرم بسداد رسوم شهر ${student.feeReminder.month} وجزاكم الله خيراً`,
                date: student.feeReminder.dateSet,
                type: 'FEE_REMINDER'
            };
            return [feeAnnouncement, ...activeAnnouncements];
        }

        return activeAnnouncements;
    }, [announcements, student.teacherId, student.feeReminder, student.logs]);

    const handleSavePhone = () => {
        if(newPhone && newPhone.length >= 10) {
            onUpdateStudent({ ...student, parentPhone: newPhone });
            setIsEditingPhone(false);
        }
    };

    const handleSaveSchedule = () => {
        onUpdateStudent({ ...student, weeklySchedule: tempSchedule });
        setIsEditingSchedule(false);
    };

    // Schedule Multi-Add Logic
    const addEventToDay = (dayIndex: number) => {
        const newSched = [...tempSchedule];
        newSched[dayIndex].events.push({ id: `evt_${Date.now()}`, title: 'إضافة درس', time: '16:00' });
        setTempSchedule(newSched);
    };

    const updateEventTime = (dayIndex: number, eventIndex: number, time: string) => {
        const newSched = [...tempSchedule];
        newSched[dayIndex].events[eventIndex].time = time;
        setTempSchedule(newSched);
    };

    const updateEventTitle = (dayIndex: number, eventIndex: number, title: string) => {
        const newSched = [...tempSchedule];
        newSched[dayIndex].events[eventIndex].title = title;
        setTempSchedule(newSched);
    };

    const removeEvent = (dayIndex: number, eventIndex: number) => {
        const newSched = [...tempSchedule];
        newSched[dayIndex].events.splice(eventIndex, 1);
        setTempSchedule(newSched);
    };

    // Helper to format assignments fully
    const formatAssignment = (ass: QuranAssignment, hideGrade?: boolean, largeFont?: boolean) => {
        if (!ass) return '';
        if (ass.type === 'MULTI') {
             return (
                 <div className="space-y-1">
                     {(ass.multiSurahs || []).map((ms, idx) => (
                         <div key={idx} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-1">
                             <span className={`${largeFont ? 'text-lg' : 'text-sm'} font-bold text-darkBrown`}>{ms.name}</span>
                             {!hideGrade && ms.grade && (<span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ms.grade === Grade.EXCELLENT ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>{ms.grade}</span>)}
                         </div>
                     ))}
                 </div>
             );
        }
        
        let title = ass.name;
        let subtitle = '';

        if (ass.type === 'JUZ') {
            const juzIdx = (ass.juzNumber || 1) - 1;
            title = JUZ_LIST[juzIdx] || `الجزء ${ass.juzNumber}`;
        } else if (ass.type === 'RANGE') {
            title = `من ${ass.name} إلى ${ass.endName}`;
        } else if (ass.type === 'SURAH') {
            title = `سورة ${ass.name}`;
            
            // Check for "Full Surah" logic
            const sData = SURAH_DATA.find(x => x.name === ass.name);
            if (sData && ass.ayahFrom === 1 && ass.ayahTo >= sData.count) {
                subtitle = `(كاملة)`;
            } else {
                subtitle = `(${ass.ayahFrom} - ${ass.ayahTo})`;
            }
        }

        if (largeFont) {
            return (
                <div className="flex flex-col items-center justify-center p-2">
                    <span className="font-bold text-2xl text-darkBrown font-serif mb-1">{title}</span>
                    {subtitle && <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{subtitle}</span>}
                </div>
            );
        }

        return (
            <div className="flex justify-between items-center w-full">
                <div>
                    <span className="font-bold text-darkBrown text-sm block">{title}</span>
                    {subtitle && <span className="text-xs text-mutedBrown font-bold">{subtitle}</span>}
                </div>
                {!hideGrade && ass.grade && (<span className={`px-2 py-1 rounded text-xs font-bold ${ass.grade === Grade.EXCELLENT ? 'bg-primary text-white' : ass.grade === Grade.VERY_GOOD ? 'bg-secondary text-white' : ass.grade === Grade.NEEDS_WORK ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{ass.grade}</span>)}
            </div>
        );
    };

    const isQuizCompleted = (log: DailyLog) => {
        return log.parentQuizScore != null; 
    };

    const currentQuizLog = useMemo(() => {
        return student.logs.find(l => l.id === activeQuizLogId);
    }, [student.logs, activeQuizLogId]);

    useEffect(() => {
        if (currentQuizLog && currentQuizLog.adabSession && currentQuizLog.adabSession.quizzes[quizStep]) {
             const q = currentQuizLog.adabSession.quizzes[quizStep];
             const answers = [q.correctAnswer, ...q.wrongAnswers];
             // Simple shuffle
             for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
             }
             setCurrentShuffledAnswers(answers);
        }
    }, [currentQuizLog?.id, quizStep]);

    const stats = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay(); 
        const daysSinceSaturday = (currentDay + 1) % 7; 
        const saturdayDate = new Date(now);
        saturdayDate.setDate(now.getDate() - daysSinceSaturday);
        saturdayDate.setHours(0,0,0,0);
        const weekPresence = student.logs.filter(l => {
            const d = new Date(l.date);
            return !l.isAbsent && d >= saturdayDate;
        }).length;
        const currentMonth = now.getMonth();
        const monthPresence = student.logs.filter(l => {
            const d = new Date(l.date);
            return !l.isAbsent && d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear();
        }).length;
        return { weekPresence, monthPresence };
    }, [student.logs]);
  
    const handleStartQuiz = (logId: string) => {
        setQuizStep(0);
        setCurrentScore(0);
        setQuizStatus('IDLE');
        setSelectedAnswer(null);
        setShowQuizSuccess(false);
        setActiveQuizLogId(logId);
    };

    const handleSubmitAnswer = () => {
        if (!currentQuizLog || !currentQuizLog.adabSession) return;
        setQuizStatus('CONFIRMING');
    };

    const handleConfirmAnswer = () => {
        if (!currentQuizLog || !currentQuizLog.adabSession) return;
        const currentQ = currentQuizLog.adabSession.quizzes[quizStep];
        const isCorrect = selectedAnswer === currentQ.correctAnswer;
        
        if (isCorrect) {
            setCurrentScore(prev => prev + 1);
        }
        setQuizStatus('RESULT');
    };

    const handleNextQuestion = () => {
        if (!currentQuizLog || !currentQuizLog.adabSession) return;
        
        if (quizStep < currentQuizLog.adabSession.quizzes.length - 1) {
            setQuizStep(prev => prev + 1);
            setQuizStatus('IDLE');
            setSelectedAnswer(null);
        } else {
            const updatedLogs = student.logs.map(l => {
                if (l.id === currentQuizLog.id) {
                    return { 
                        ...l, 
                        parentQuizScore: currentScore + (selectedAnswer === currentQuizLog.adabSession!.quizzes[quizStep].correctAnswer && quizStatus === 'RESULT' ? 0 : 0), // Score already updated in confirm
                        parentQuizMax: currentQuizLog.adabSession!.quizzes.length,
                        seenByParent: true,
                        seenAt: new Date().toISOString()
                    };
                }
                return l;
            });
            onUpdateStudent({ ...student, logs: updatedLogs });
            setShowQuizSuccess(true);
            setTimeout(() => {
                setShowQuizSuccess(false);
                setActiveQuizLogId(null);
            }, 3000);
        }
    };

    // Find teacher phone
    const teacherPhone = teachers?.find(t => t.id === student.teacherId)?.phone;

    return (
        <div className="min-h-screen bg-texture pb-20 font-sans">
             <div className="bg-paper shadow-sm sticky top-0 z-20 px-4 py-4 flex justify-between items-center border-b border-darkBrown/5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md border-2 border-white">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-bold text-darkBrown text-lg font-serif">{student.name}</h1>
                        <div className="flex items-center gap-2">
                            {isEditingPhone ? (
                                <div className="flex items-center bg-gray-100 rounded px-1">
                                    <input 
                                        type="tel" 
                                        value={newPhone} 
                                        onChange={e => setNewPhone(e.target.value)} 
                                        className="w-24 text-xs bg-transparent outline-none p-1"
                                    />
                                    <button onClick={handleSavePhone} className="text-green-600 text-xs font-bold px-1">✓</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-mutedBrown font-bold">{student.parentPhone || 'لا يوجد رقم'}</p>
                                    <button onClick={() => setIsEditingPhone(true)} className="text-gray-400 text-xs">✏️</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <Button onClick={onLogout} variant="danger" className="text-xs px-3 py-2 shadow-sm rounded-xl">خروج 🚪</Button>
             </div>

             <div className="p-4 max-w-lg mx-auto animate-fade-in relative min-h-[60vh]">
                
                {/* Announcements Banner Redesigned */}
                {myAnnouncements.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {myAnnouncements.map(ann => {
                            if (ann.type === 'FEE_REMINDER') {
                                return (
                                    <div key={ann.id} className="bg-white border-l-4 border-l-red-500 rounded-lg p-4 shadow-sm relative overflow-hidden flex items-start gap-3">
                                        <div className="bg-red-50 p-2 rounded-full text-red-600 shrink-0 text-xl">💰</div>
                                        <div>
                                            <h4 className="font-bold text-red-700 text-sm mb-1">تذكير بالرسوم</h4>
                                            <p className="text-gray-700 text-xs leading-relaxed font-semibold">{ann.content}</p>
                                        </div>
                                    </div>
                                );
                            }
                            
                            const isExam = ann.type === 'EXAM';
                            return (
                                <div key={ann.id} className={`bg-white border-l-4 rounded-lg p-4 shadow-sm relative flex items-start gap-3 ${isExam ? 'border-l-amber-500' : 'border-l-sky-500'}`}>
                                    <div className={`p-2 rounded-full shrink-0 text-xl ${isExam ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                                        {isExam ? '📝' : '📢'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-sm ${isExam ? 'text-amber-700' : 'text-sky-700'}`}>
                                                {isExam ? 'جدول اختبارات' : `تنبيه من ${ann.teacherName}`}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{formatSimpleDate(ann.date)}</span>
                                        </div>
                                        <p className="text-darkBrown text-sm whitespace-pre-wrap leading-relaxed">
                                            {isExam ? ann.content.replace("📢 **إعلان اختبار الشهر** 📢", "").trim() : ann.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-paper p-1.5 rounded-2xl w-full max-w-md shadow-inner overflow-x-auto no-scrollbar border border-white">
                        <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown hover:bg-gray-100'}`}>📊 التقارير</button>
                        <button onClick={() => setActiveTab('next')} className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'next' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown hover:bg-gray-100'}`}>📝 اللوح</button>
                        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'schedule' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown hover:bg-gray-100'}`}>📅 المواعيد</button>
                        <button onClick={() => setActiveTab('fees')} className={`flex-1 py-3 px-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'fees' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown hover:bg-gray-100'}`}>💰 الرسوم</button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-paper p-4 rounded-3xl shadow-sm border border-primary/20 text-center"><p className="text-primaryDark font-bold text-sm">حضور الأسبوع</p><p className="text-3xl font-bold text-primary mt-1">{stats.weekPresence} أيام</p></div>
                            <div className="bg-paper p-4 rounded-3xl shadow-sm border border-secondary/20 text-center"><p className="text-secondaryDark font-bold text-sm">حضور الشهر</p><p className="text-3xl font-bold text-secondary mt-1">{stats.monthPresence} يوم</p></div>
                        </div>

                        {sortedLogs.length === 0 ? (<div className="text-center py-10 text-mutedBrown bg-paper rounded-3xl shadow-sm border border-dashed border-gray-300">لا توجد سجلات حتى الآن</div>) : (sortedLogs.map(log => {
                                const isAdabLog = log.isAdab;
                                return (
                                <div key={log.id} className={`bg-paper rounded-3xl shadow-sm border overflow-hidden relative transition-all duration-500 mb-4 ${!log.seenByParent ? 'border-red-300 ring-2 ring-red-100' : 'border-white'}`}>
                                    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center"><div><span className="font-bold text-darkBrown block">📅 {formatSimpleDate(log.date)}</span><span className="text-xs text-mutedBrown">المعلم: {log.teacherName}</span></div>{log.seenByParent && (<span className="text-primary text-xs font-bold border border-primary/20 px-2 py-1 rounded bg-primary/5">تم الاطلاع ✅</span>)}</div>
                                    
                                    {isAdabLog ? (
                                        <div className="p-6 bg-gradient-to-br from-secondary to-secondaryDark text-white text-center">
                                            <h3 className="font-bold text-xl mb-1">✨ {log.adabSession?.title}</h3>
                                            <p className="opacity-90 text-sm mb-4">مجلس تربوي وسلوكيات</p>
                                            
                                            {isQuizCompleted(log) ? (
                                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                                    <p className="font-bold">درجة الاختبار: {log.parentQuizScore}/{log.parentQuizMax}</p>
                                                    <p className="text-xs mt-1">جزاكم الله خيراً على المشاركة</p>
                                                </div>
                                            ) : (
                                                <Button onClick={() => handleStartQuiz(log.id)} className="bg-white text-secondaryDark hover:bg-gray-100 w-full font-bold shadow-lg">ابدأ الاختبار القصير</Button>
                                            )}
                                        </div>
                                    ) : log.isAbsent ? (
                                        <div className={`p-6 text-center ${log.notes?.includes('عذر') ? 'bg-orange-50' : 'bg-red-50'}`}>
                                            <p className={`font-bold text-lg ${log.notes?.includes('عذر') ? 'text-orange-700' : 'text-red-600'}`}>
                                                {log.notes?.includes('عذر') || log.notes?.includes('تبليغ') ? 'غائب بعذر - جزاكم الله خيراً على تبليغ الشيخ' : 'غائب ❌'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 grid gap-4">
                                            {log.attendance && log.attendance.length > 0 && (
                                                <div className="bg-white border p-2 rounded-lg text-xs text-gray-500 flex gap-2 justify-center font-bold tracking-wide">
                                                    <span>⏰</span>
                                                    {log.attendance.map((a, i) => (
                                                        <span key={i}>{formatTime12Hour(a.arrival)} - {formatTime12Hour(a.departure || '')}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {log.jadeed && (<div className="bg-primary/5 p-4 rounded-2xl border border-primary/10"><p className="text-xs text-primary font-bold mb-2">الحفظ الجديد</p>{formatAssignment(log.jadeed)}</div>)}
                                            {log.murajaah && log.murajaah.length > 0 && (<div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10"><p className="text-xs text-secondaryDark font-bold mb-2">المراجعة</p>{log.murajaah.map((m, idx) => (<div key={idx} className="mb-2 last:mb-0 border-b border-secondary/10 pb-2 last:pb-0">{formatAssignment(m)}</div>))}</div>)}
                                            {log.notes && (
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                                                    <span className="font-bold block text-gray-400 text-xs mb-1">ملاحظات المعلم:</span>
                                                    {log.notes}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )})
                        )}
                    </div>
                )}

                {activeTab === 'next' && (
                    <div className="bg-paper rounded-3xl shadow-lg p-6 animate-slide-up border border-white">
                        <h3 className="text-xl font-bold text-primary mb-6 text-center">الواجب القادم (غداً)</h3>
                        {student.nextPlan ? (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-3xl border border-primary/20 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-xl font-bold">حفظ جديد</div>
                                    {/* Large Centered Font for Jadeed */}
                                    {formatAssignment(student.nextPlan.jadeed, true, true)}
                                </div>
                                
                                {student.nextPlan.murajaah && student.nextPlan.murajaah.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200">
                                        <p className="text-secondaryDark font-bold mb-3 text-center text-sm border-b pb-2">↺ المراجعة</p>
                                        {student.nextPlan.murajaah.map((m, idx) => (
                                            <div key={idx} className="mb-2 last:mb-0 pb-2 last:pb-0 text-center">
                                                {/* Centered but slightly smaller than Jadeed */}
                                                {formatAssignment(m, true, true)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : <p className="text-gray-400 text-center">لم يحدد بعد</p>}
                    </div>
                )}

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <div className="space-y-3 animate-slide-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-darkBrown">جدول الحضور</h3>
                            <button onClick={() => setIsEditingSchedule(!isEditingSchedule)} className="text-xs bg-primary text-white px-3 py-1 rounded-xl shadow-sm">{isEditingSchedule ? 'حفظ الجدول' : 'تعديل الجدول'}</button>
                        </div>
                        {isEditingSchedule && (
                            <p className="text-xs text-gray-500 mb-2">اضغط "إضافة درس" لإضافة موعد جديد.</p>
                        )}
                        {tempSchedule.map((daySched, idx) => (
                            <div key={idx} className="bg-paper p-3 rounded-xl shadow-sm border border-white mb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700">{daySched.day}</span>
                                    {isEditingSchedule && (
                                        <button onClick={() => addEventToDay(idx)} className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200">+ إضافة درس</button>
                                    )}
                                </div>
                                
                                {daySched.events.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-2">راحة (لا يوجد دروس)</p>
                                ) : (
                                    <div className="space-y-2">
                                        {daySched.events.map((ev, evIdx) => (
                                            <div key={ev.id} className="flex items-center gap-2">
                                                {isEditingSchedule ? (
                                                    <>
                                                        <div className="flex-1">
                                                            <input 
                                                                type="text" 
                                                                className="w-full text-xs p-1 border rounded mb-1 text-right" 
                                                                placeholder="مثال: قرآن" 
                                                                value={ev.title || ''} 
                                                                onChange={(e) => updateEventTitle(idx, evIdx, e.target.value)} 
                                                            />
                                                            <TimePicker value={ev.time} onChange={(v) => updateEventTime(idx, evIdx, v)} />
                                                        </div>
                                                        <button onClick={() => removeEvent(idx, evIdx)} className="text-red-500 text-lg font-bold">×</button>
                                                    </>
                                                ) : (
                                                    <div className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 w-full text-center flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-600">{ev.title || 'درس'}</span>
                                                        <span className="font-bold text-primary text-base">{formatTime12Hour(ev.time)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isEditingSchedule && (
                            <Button onClick={handleSaveSchedule} className="w-full mt-4">حفظ التغييرات</Button>
                        )}
                    </div>
                )}

                {/* FEES TAB */}
                {activeTab === 'fees' && (
                    <div className="animate-slide-up space-y-4">
                        {student.feeReminder ? (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm animate-pulse text-center">
                                <h4 className="font-bold text-red-800 mb-2">🔔 رسالة من الإدارة</h4>
                                <p className="text-sm text-red-700">
                                    الرجاء من سيادتكم التكرم بسداد رسوم شهر <strong>{student.feeReminder.month}</strong> وجزاكم الله خيراً.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm text-center">
                                <p className="text-green-800 font-bold">✅ لا توجد مستحقات حالياً</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">سجل المدفوعات:</h4>
                            {student.payments.length === 0 ? <p className="text-center text-gray-400 text-sm">السجل فارغ</p> : 
                            student.payments.map(p => (
                                <div key={p.id} className="bg-paper p-3 rounded-xl border border-white shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-darkBrown">تم الاستلام بواسطة {p.recordedBy}</p>
                                        <p className="text-xs text-gray-500">{formatSimpleDate(p.date)} - {p.title}</p>
                                    </div>
                                    <span className="font-bold text-lg text-primary">{p.amount} ج.م</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ADAB QUIZ MODAL */}
                {activeQuizLogId && currentQuizLog && currentQuizLog.adabSession && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-paper p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-slide-up border-2 border-secondary">
                            {showQuizSuccess ? (
                                <div className="text-center py-10">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-2xl font-bold text-primary mb-2">جزاكم الله خيراً على المشاركة</h3>
                                    <p className="text-gray-500">تم تسجيل النتيجة بنجاح.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6 border-b pb-2">
                                        <h3 className="font-bold text-darkBrown">{currentQuizLog.adabSession.title}</h3>
                                        <span className="bg-secondary/20 text-secondaryDark text-xs font-bold px-2 py-1 rounded">سؤال {quizStep + 1}/{currentQuizLog.adabSession.quizzes.length}</span>
                                    </div>
                                    
                                    <p className="text-lg font-bold text-center mb-8">{currentQuizLog.adabSession.quizzes[quizStep].question}</p>
                                    
                                    <div className="space-y-3 mb-6">
                                        {currentShuffledAnswers.map((ans, idx) => (
                                            <button
                                                key={idx}
                                                disabled={quizStatus === 'RESULT'}
                                                onClick={() => setSelectedAnswer(ans)}
                                                className={`w-full p-4 rounded-xl border-2 font-bold transition-all ${
                                                    quizStatus === 'RESULT' 
                                                        ? ans === currentQuizLog.adabSession!.quizzes[quizStep].correctAnswer 
                                                            ? 'bg-green-100 border-green-500 text-green-800' 
                                                            : ans === selectedAnswer ? 'bg-red-100 border-red-500 text-red-800' : 'bg-gray-50 border-gray-100 text-gray-400'
                                                        : selectedAnswer === ans 
                                                            ? 'bg-secondary text-white border-secondary' 
                                                            : 'bg-white border-gray-200 hover:border-secondary/50'
                                                }`}
                                            >
                                                {ans}
                                            </button>
                                        ))}
                                    </div>

                                    {quizStatus === 'IDLE' && (
                                        <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="w-full rounded-xl py-3 shadow-lg">تأكيد الإجابة</Button>
                                    )}
                                    {quizStatus === 'CONFIRMING' && (
                                        <Button onClick={handleConfirmAnswer} variant="secondary" className="w-full rounded-xl py-3 shadow-lg">هل أنت متأكد؟</Button>
                                    )}
                                    {quizStatus === 'RESULT' && (
                                        <Button onClick={handleNextQuestion} className="w-full rounded-xl py-3 shadow-lg">
                                            {quizStep < currentQuizLog.adabSession.quizzes.length - 1 ? 'السؤال التالي ⬅' : 'إنهاء الاختبار 🏁'}
                                        </Button>
                                    )}
                                </>
                            )}
                            
                            {!showQuizSuccess && (
                                <button onClick={() => setActiveQuizLogId(null)} className="absolute top-4 left-4 text-gray-400 hover:text-red-500 font-bold">✕</button>
                            )}
                        </div>
                    </div>
                )}

                {/* CONTACT BUTTON */}
                <div className="fixed bottom-4 left-4 z-50">
                    <button 
                        onClick={() => {
                            const phone = teacherPhone || "201000000000"; 
                            window.open(`https://wa.me/${phone}`, '_blank');
                        }}
                        className="bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:bg-[#20b85a] transition-all transform hover:scale-110 flex items-center justify-center"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </button>
                </div>
             </div>
        </div>
    );
};
