
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Grade, WeeklySchedule, Announcement, DailyLog, CalendarEvent, QuizItem, QuranAssignment, Teacher, Badge } from '../types';
import { Button } from './Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MONTHS_LIST, formatTime12Hour, JUZ_LIST, formatSimpleDate, DAYS_OF_WEEK, SURAH_DATA, BADGE_TYPES } from '../constants';
import { TimePicker } from './TimePicker';

interface ParentDashboardProps {
  student: Student;
  announcements: Announcement[];
  onUpdateStudent: (student: Student) => void;
  onLogout: () => void;
  onMarkSeen: (studentId: string, logIds: string[]) => void;
  teachers?: Teacher[]; 
  allStudents?: Student[]; // Added to support leaderboard
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

// Celebration Modal for New Badge
const CelebrationModal = ({ badgeName, studentName, onClose }: { badgeName: string, studentName: string, onClose: () => void }) => {
    useEffect(() => {
        // Trigger confetti
        // @ts-ignore
        if (window.confetti) {
            // @ts-ignore
            const duration = 3000;
            const end = Date.now() + duration;
            (function frame() {
                // @ts-ignore
                window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#c2a266', '#637353'] });
                // @ts-ignore
                window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#c2a266', '#637353'] });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
    }, []);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] w-full max-w-sm text-center relative border-4 border-[#c2a266] shadow-2xl animate-bounce-slow">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg">🎉</div>
                <h2 className="text-2xl font-bold text-primary dark:text-emerald-400 mb-2 mt-4 font-serif">مبروك يا {studentName.split(' ')[0]}!</h2>
                <p className="text-gray-600 dark:text-gray-300 font-bold mb-6">
                    حصلت على وسام جديد: <br/>
                    <span className="text-xl text-secondaryDark dark:text-yellow-500 font-black mt-2 block">{badgeName}</span>
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-2xl mb-6 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-darkBrown dark:text-yellow-100 leading-relaxed font-bold">
                        "نسأل الله أن يجعلك من الفائزين في الدنيا والآخرة. استمر في التميز واجمع باقي الأوسمة!" 🚀
                    </p>
                </div>
                <Button onClick={onClose} className="w-full py-4 text-lg rounded-2xl shadow-lg bg-gradient-to-r from-secondary to-secondaryDark hover:from-yellow-600 hover:to-yellow-700 border-none text-white">
                    استلام الجائزة ✨
                </Button>
            </div>
        </div>
    );
};

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ 
    student, 
    announcements, 
    onUpdateStudent, 
    onLogout, 
    onMarkSeen,
    teachers,
    allStudents = []
}) => {
    const [activeTab, setActiveTab] = useState<'timeline' | 'schedule' | 'fees' | 'next' | 'honor'>('timeline');
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
    
    // Celebration State
    const [newBadgeEarned, setNewBadgeEarned] = useState<Badge | null>(null);
    
    // Schedule Editing State
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [tempSchedule, setTempSchedule] = useState<WeeklySchedule[]>([]);

    useEffect(() => {
        setTempSchedule(JSON.parse(JSON.stringify(student.weeklySchedule)));
    }, [student.weeklySchedule]);

    // Check for new badges on mount
    useEffect(() => {
        if (student.badges && student.badges.length > 0) {
            // Sort badges by date descending
            const sortedBadges = [...student.badges].sort((a, b) => new Date(b.dateEarned).getTime() - new Date(a.dateEarned).getTime());
            const latestBadge = sortedBadges[0];
            
            // If badge was earned today
            const today = new Date().toDateString();
            const badgeDate = new Date(latestBadge.dateEarned).toDateString();
            
            if (today === badgeDate) {
                // Check if already shown this session
                const sessionKey = `badge_shown_${latestBadge.id}_${latestBadge.dateEarned}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    setNewBadgeEarned(latestBadge);
                    sessionStorage.setItem(sessionKey, 'true');
                }
            }
        }
    }, [student.badges]);

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
        if (!ass) return null; 
        if (ass.type === 'MULTI') {
             return (
                 <div className="space-y-1">
                     {(ass.multiSurahs || []).map((ms, idx) => (
                         <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 pb-1">
                             <span className={`${largeFont ? 'text-lg' : 'text-sm'} font-bold text-darkBrown dark:text-white`}>{ms.name}</span>
                             {!hideGrade && ms.grade && (<span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ms.grade === Grade.EXCELLENT ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white'}`}>{ms.grade}</span>)}
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
                    <span className="font-bold text-2xl text-darkBrown dark:text-white font-serif mb-1">{title}</span>
                    {subtitle && <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{subtitle}</span>}
                </div>
            );
        }

        return (
            <div className="flex justify-between items-center w-full">
                <div>
                    <span className="font-bold text-darkBrown dark:text-white text-sm block">{title}</span>
                    {subtitle && <span className="text-xs text-mutedBrown dark:text-gray-400 font-bold">{subtitle}</span>}
                </div>
                {!hideGrade && ass.grade && (<span className={`px-2 py-1 rounded text-xs font-bold ${ass.grade === Grade.EXCELLENT ? 'bg-primary text-white' : ass.grade === Grade.VERY_GOOD ? 'bg-secondary text-white' : ass.grade === Grade.NEEDS_WORK ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white'}`}>{ass.grade}</span>)}
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

    // --- LEADERBOARD CALCULATION ---
    const leaderboard = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
        // Calculate last Saturday (Start of Week)
        const daysSinceSaturday = (currentDay + 1) % 7; 
        const weekStartDate = new Date(now);
        weekStartDate.setDate(now.getDate() - daysSinceSaturday);
        weekStartDate.setHours(0,0,0,0);

        const scores = allStudents.map(s => {
            let weeklyScore = 0;
            let recentBadge = null;

            s.logs.forEach(log => {
                const logDate = new Date(log.date);
                if (logDate >= weekStartDate) {
                    if (!log.isAbsent) weeklyScore += 10; // Presence
                    if (log.jadeed?.grade === Grade.EXCELLENT) weeklyScore += 5;
                }
            });

            // Badges score
            s.badges?.forEach(b => {
                const badgeDate = new Date(b.dateEarned);
                if (badgeDate >= weekStartDate) {
                    weeklyScore += 20; // Each badge is 20 points
                    recentBadge = b;
                }
            });

            return { id: s.id, name: s.name, score: weeklyScore, recentBadge };
        });

        return scores.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5
    }, [allStudents]);

    // Group Badges for Trophy Case
    const badgeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        (student.badges || []).forEach(b => {
            counts[b.id] = (counts[b.id] || 0) + 1;
        });
        return counts;
    }, [student.badges]);

    return (
        <div className="min-h-screen bg-texture dark:bg-gray-900 pb-20 font-sans transition-colors duration-300">
             {newBadgeEarned && (
                 <CelebrationModal 
                    badgeName={newBadgeEarned.name} 
                    studentName={student.name} 
                    onClose={() => setNewBadgeEarned(null)} 
                 />
             )}

             <div className="bg-paper dark:bg-gray-800 shadow-sm sticky top-0 z-20 px-4 py-4 flex justify-between items-center border-b border-darkBrown/5 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md border-2 border-white dark:border-gray-600">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-bold text-darkBrown dark:text-white text-lg font-serif">{student.name}</h1>
                        <div className="flex items-center gap-2">
                            {isEditingPhone ? (
                                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded px-1">
                                    <input 
                                        type="tel" 
                                        value={newPhone} 
                                        onChange={e => setNewPhone(e.target.value)} 
                                        className="w-24 text-xs bg-transparent outline-none p-1 dark:text-white"
                                    />
                                    <button onClick={handleSavePhone} className="text-green-600 dark:text-green-400 text-xs font-bold px-1">✓</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-mutedBrown dark:text-gray-400 font-bold">{student.parentPhone || 'لا يوجد رقم'}</p>
                                    <button onClick={() => setIsEditingPhone(true)} className="text-gray-400 dark:text-gray-500 text-xs">✏️</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <Button onClick={onLogout} variant="danger" className="text-xs px-3 py-2 shadow-sm rounded-xl">خروج 🚪</Button>
             </div>

             <div className="p-4 max-w-lg mx-auto animate-fade-in relative min-h-[60vh]">
                
                {/* NEW: Trophy Case (Collapsible or Horizontal Scroll) */}
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">خزانة الجوائز 🏆</h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm flex gap-3 overflow-x-auto no-scrollbar">
                        {BADGE_TYPES.map(type => {
                            const count = badgeCounts[type.id] || 0;
                            const isOwned = count > 0;
                            return (
                                <div key={type.id} className={`flex flex-col items-center min-w-[70px] transition-all ${isOwned ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-90'}`} title={type.description}>
                                    <div className="relative">
                                        <div className="text-4xl mb-1 drop-shadow-sm">{type.icon}</div>
                                        {count > 1 && (
                                            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-white shadow-sm">
                                                x{count}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-darkBrown dark:text-yellow-100 whitespace-nowrap text-center w-full overflow-hidden text-ellipsis">{type.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Announcements Banner Redesigned */}
                {myAnnouncements.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {myAnnouncements.map(ann => {
                            if (ann.type === 'FEE_REMINDER') {
                                return (
                                    <div key={ann.id} className="bg-white dark:bg-gray-800 border-l-4 border-l-red-500 rounded-lg p-4 shadow-sm relative overflow-hidden flex items-start gap-3">
                                        <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400 shrink-0 text-xl">💰</div>
                                        <div>
                                            <h4 className="font-bold text-red-700 dark:text-red-300 text-sm mb-1">تذكير بالرسوم</h4>
                                            <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed font-semibold">{ann.content}</p>
                                        </div>
                                    </div>
                                );
                            }
                            
                            const isExam = ann.type === 'EXAM';
                            return (
                                <div key={ann.id} className={`bg-white dark:bg-gray-800 border-l-4 rounded-lg p-4 shadow-sm relative flex items-start gap-3 ${isExam ? 'border-l-amber-500' : 'border-l-sky-500'}`}>
                                    <div className={`p-2 rounded-full shrink-0 text-xl ${isExam ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'}`}>
                                        {isExam ? '📝' : '📢'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-sm ${isExam ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300'}`}>
                                                {isExam ? 'جدول اختبارات' : `تنبيه من ${ann.teacherName}`}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded">{formatSimpleDate(ann.date)}</span>
                                        </div>
                                        <p className="text-darkBrown dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                                            {isExam ? ann.content.replace("📢 **إعلان اختبار الشهر** 📢", "").trim() : ann.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tabs - Reordered as requested */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-paper dark:bg-gray-800 p-1.5 rounded-2xl w-full max-w-md shadow-inner overflow-x-auto no-scrollbar border border-white dark:border-gray-700">
                        <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📊 التقارير</button>
                        <button onClick={() => setActiveTab('next')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'next' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📝 اللوح</button>
                        {/* Honor Board moved here */}
                        <button onClick={() => setActiveTab('honor')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'honor' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>🏅 الشرف</button>
                        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'schedule' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>📅 المواعيد</button>
                        <button onClick={() => setActiveTab('fees')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'fees' ? 'bg-primary text-white shadow-md' : 'text-mutedBrown dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>💰 الرسوم</button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-paper dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-primary/20 dark:border-primary/40 text-center"><p className="text-primaryDark dark:text-emerald-400 font-bold text-sm">حضور الأسبوع</p><p className="text-3xl font-bold text-primary dark:text-emerald-300 mt-1">{stats.weekPresence} أيام</p></div>
                            <div className="bg-paper dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-secondary/20 dark:border-secondary/40 text-center"><p className="text-secondaryDark dark:text-yellow-500 font-bold text-sm">حضور الشهر</p><p className="text-3xl font-bold text-secondary dark:text-yellow-400 mt-1">{stats.monthPresence} يوم</p></div>
                        </div>

                        {sortedLogs.length === 0 ? (<div className="text-center py-10 text-mutedBrown dark:text-gray-500 bg-paper dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">لا توجد سجلات حتى الآن</div>) : (sortedLogs.map(log => {
                                const isAdabLog = log.isAdab;
                                return (
                                <div key={log.id} className={`bg-paper dark:bg-gray-800 rounded-3xl shadow-sm border overflow-hidden relative transition-all duration-500 mb-4 ${!log.seenByParent ? 'border-red-300 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/30' : 'border-white dark:border-gray-700'}`}>
                                    <div className="bg-gray-50/50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center"><div><span className="font-bold text-darkBrown dark:text-white block">📅 {formatSimpleDate(log.date)}</span><span className="text-xs text-mutedBrown dark:text-gray-400">المعلم: {log.teacherName}</span></div>{log.seenByParent && (<span className="text-primary dark:text-emerald-400 text-xs font-bold border border-primary/20 dark:border-emerald-800 px-2 py-1 rounded bg-primary/5 dark:bg-emerald-900/20">تم الاطلاع ✅</span>)}</div>
                                    
                                    {isAdabLog ? (
                                        <div className="p-6 bg-gradient-to-br from-secondary to-secondaryDark dark:from-yellow-800 dark:to-yellow-900 text-white text-center">
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
                                        <div className={`p-6 text-center ${log.notes?.includes('عذر') ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                            <p className={`font-bold text-lg ${log.notes?.includes('عذر') ? 'text-orange-700 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {log.notes?.includes('عذر') || log.notes?.includes('تبليغ') ? 'غائب بعذر - جزاكم الله خيراً على تبليغ الشيخ' : 'غائب عساه أن يكون بخير'}
                                            </p>
                                            {/* Confirm view button even for absence */}
                                            {!log.seenByParent && (
                                                <button 
                                                    onClick={() => onMarkSeen(student.id, [log.id])} 
                                                    className="mt-3 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30"
                                                >
                                                    تأكيد الاطلاع ✅
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 grid gap-4">
                                            {log.attendance && log.attendance.length > 0 && (
                                                <div className="bg-white dark:bg-gray-700 border dark:border-gray-600 p-2 rounded-lg text-xs text-gray-500 dark:text-gray-300 flex gap-2 justify-center font-bold tracking-wide">
                                                    <span>⏰</span>
                                                    {log.attendance.map((a, i) => (
                                                        <span key={i}>{formatTime12Hour(a.arrival)} - {formatTime12Hour(a.departure || '')}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {log.jadeed && log.jadeed.name !== 'الفاتحة' && (<div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10 dark:border-primary/20"><p className="text-xs text-primary dark:text-emerald-400 font-bold mb-2">الحفظ الجديد</p>{formatAssignment(log.jadeed)}</div>)}
                                            {log.murajaah && log.murajaah.length > 0 && (<div className="bg-secondary/5 dark:bg-secondary/10 p-4 rounded-2xl border border-secondary/10 dark:border-secondary/20"><p className="text-xs text-secondaryDark dark:text-yellow-500 font-bold mb-2">المراجعة</p>{log.murajaah.map((m, idx) => (<div key={idx} className="mb-2 last:mb-0 border-b border-secondary/10 dark:border-gray-700 pb-2 last:pb-0">{formatAssignment(m)}</div>))}</div>)}
                                            {log.notes && (
                                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                                    <span className="font-bold block text-gray-400 text-xs mb-1">ملاحظات المعلم:</span>
                                                    {log.notes}
                                                </div>
                                            )}
                                            
                                            {/* Confirm View Button */}
                                            {!log.seenByParent && (
                                                <button 
                                                    onClick={() => onMarkSeen(student.id, [log.id])} 
                                                    className="w-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 py-3 rounded-xl font-bold shadow-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition mt-2"
                                                >
                                                    تأكيد الاطلاع ✅
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )})
                        )}
                    </div>
                )}

                {/* NEW: Honor Board Tab */}
                {activeTab === 'honor' && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-secondaryDark dark:text-yellow-500 font-serif mb-1">لوحة الشرف الأسبوعية</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">أبطال الحلقة لهذا الأسبوع</p>
                        </div>

                        {/* Top 3 Podium */}
                        <div className="flex justify-center items-end gap-2 mb-8 px-4 h-48">
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.2s'}}>
                                    <div className="mb-2 text-center">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block truncate w-20">{leaderboard[1].name.split(' ')[0]}</span>
                                        <span className="text-[10px] text-gray-400">{leaderboard[1].score} نقطة</span>
                                    </div>
                                    <div className="w-full h-24 bg-gray-300 dark:bg-gray-600 rounded-t-lg flex items-end justify-center pb-2 relative shadow-lg">
                                        <span className="text-2xl font-bold text-white opacity-50">2</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <div className="flex flex-col items-center w-1/3 z-10 animate-slide-up">
                                    <div className="mb-2 text-center">
                                        <span className="text-2xl mb-1 block">👑</span>
                                        <span className="text-sm font-bold text-secondaryDark dark:text-yellow-400 block truncate w-24">{leaderboard[0].name.split(' ')[0]}</span>
                                        <span className="text-xs text-secondary font-bold">{leaderboard[0].score} نقطة</span>
                                    </div>
                                    <div className="w-full h-32 bg-gradient-to-t from-secondaryDark to-secondary dark:from-yellow-700 dark:to-yellow-500 rounded-t-lg flex items-end justify-center pb-2 relative shadow-xl border-t-4 border-yellow-200">
                                        <span className="text-4xl font-bold text-white">1</span>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.4s'}}>
                                    <div className="mb-2 text-center">
                                        <span className="text-xs font-bold text-orange-700 dark:text-orange-300 block truncate w-20">{leaderboard[2].name.split(' ')[0]}</span>
                                        <span className="text-[10px] text-gray-400">{leaderboard[2].score} نقطة</span>
                                    </div>
                                    <div className="w-full h-16 bg-orange-200 dark:bg-orange-800 rounded-t-lg flex items-end justify-center pb-2 relative shadow-lg">
                                        <span className="text-xl font-bold text-orange-800 dark:text-orange-200 opacity-50">3</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Achievements List */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 border-b dark:border-gray-700 pb-2">أحدث الإنجازات</h4>
                            <div className="space-y-3">
                                {leaderboard.map((s, i) => (
                                    s.recentBadge && (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="text-2xl bg-white dark:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                                                {s.recentBadge.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">حصل <span className="font-bold text-darkBrown dark:text-white">{s.name}</span> على وسام</p>
                                                <p className="text-sm font-bold text-secondaryDark dark:text-yellow-500">{s.recentBadge.name}</p>
                                            </div>
                                        </div>
                                    )
                                ))}
                                {leaderboard.length === 0 && <p className="text-center text-xs text-gray-400">لا توجد إنجازات هذا الأسبوع بعد.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'next' && (
                    <div className="bg-paper dark:bg-gray-800 rounded-3xl shadow-lg p-6 animate-slide-up border border-white dark:border-gray-700">
                        <h3 className="text-xl font-bold text-primary dark:text-emerald-400 mb-6 text-center">الواجب القادم (غداً)</h3>
                        {student.nextPlan ? (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-3xl border border-primary/20 dark:border-emerald-700/30 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-xl font-bold">حفظ جديد</div>
                                    {/* Large Centered Font for Jadeed */}
                                    {formatAssignment(student.nextPlan.jadeed, true, true)}
                                </div>
                                
                                {student.nextPlan.murajaah && student.nextPlan.murajaah.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-3xl border border-gray-200 dark:border-gray-600">
                                        <p className="text-secondaryDark dark:text-yellow-500 font-bold mb-3 text-center text-sm border-b dark:border-gray-600 pb-2">↺ المراجعة</p>
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
                            <h3 className="font-bold text-darkBrown dark:text-white">جدول الحضور</h3>
                            <button onClick={() => setIsEditingSchedule(!isEditingSchedule)} className="text-xs bg-primary text-white px-3 py-1 rounded-xl shadow-sm">{isEditingSchedule ? 'حفظ الجدول' : 'تعديل الجدول'}</button>
                        </div>
                        {isEditingSchedule && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">اضغط "إضافة درس" لإضافة موعد جديد.</p>
                        )}
                        {tempSchedule.map((daySched, idx) => (
                            <div key={idx} className="bg-paper dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-white dark:border-gray-700 mb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-700 dark:text-white">{daySched.day}</span>
                                    {isEditingSchedule && (
                                        <button onClick={() => addEventToDay(idx)} className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800">+ إضافة درس</button>
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
                                                                className="w-full text-xs p-1 border rounded mb-1 text-right dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                                                                placeholder="مثال: قرآن" 
                                                                value={ev.title || ''} 
                                                                onChange={(e) => updateEventTitle(idx, evIdx, e.target.value)} 
                                                            />
                                                            <TimePicker value={ev.time} onChange={(v) => updateEventTime(idx, evIdx, v)} />
                                                        </div>
                                                        <button onClick={() => removeEvent(idx, evIdx)} className="text-red-500 text-lg font-bold">×</button>
                                                    </>
                                                ) : (
                                                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 w-full text-center flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{ev.title || 'درس'}</span>
                                                        <span className="font-bold text-primary dark:text-emerald-400 text-base">{formatTime12Hour(ev.time)}</span>
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
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-sm animate-pulse text-center">
                                <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">🔔 رسالة من الإدارة</h4>
                                <p className="text-sm text-red-700 dark:text-red-200">
                                    الرجاء من سيادتكم التكرم بسداد رسوم شهر <strong>{student.feeReminder.month}</strong> وجزاكم الله خيراً.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-xl shadow-sm text-center">
                                <p className="text-green-800 dark:text-green-300 font-bold">✅ لا توجد مستحقات حالياً</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">سجل المدفوعات:</h4>
                            {student.payments.length === 0 ? <p className="text-center text-gray-400 text-sm">السجل فارغ</p> : 
                            student.payments.map(p => (
                                <div key={p.id} className="bg-paper dark:bg-gray-800 p-3 rounded-xl border border-white dark:border-gray-700 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-darkBrown dark:text-white">تم الاستلام بواسطة {p.recordedBy}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSimpleDate(p.date)} - {p.title}</p>
                                    </div>
                                    <span className="font-bold text-lg text-primary dark:text-emerald-400">{p.amount} ج.م</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ADAB QUIZ MODAL - Unchanged ... */}
                {activeQuizLogId && currentQuizLog && currentQuizLog.adabSession && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-paper dark:bg-gray-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-slide-up border-2 border-secondary dark:border-yellow-700">
                            {showQuizSuccess ? (
                                <div className="text-center py-10">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-2xl font-bold text-primary dark:text-emerald-400 mb-2">جزاكم الله خيراً على المشاركة</h3>
                                    <p className="text-gray-500 dark:text-gray-300">تم تسجيل النتيجة بنجاح.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-2">
                                        <h3 className="font-bold text-darkBrown dark:text-white">{currentQuizLog.adabSession.title}</h3>
                                        <span className="bg-secondary/20 dark:bg-yellow-900/30 text-secondaryDark dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded">سؤال {quizStep + 1}/{currentQuizLog.adabSession.quizzes.length}</span>
                                    </div>
                                    
                                    <p className="text-lg font-bold text-center mb-8 dark:text-white">{currentQuizLog.adabSession.quizzes[quizStep].question}</p>
                                    
                                    <div className="space-y-3 mb-6">
                                        {currentShuffledAnswers.map((ans, idx) => (
                                            <button
                                                key={idx}
                                                disabled={quizStatus === 'RESULT'}
                                                onClick={() => setSelectedAnswer(ans)}
                                                className={`w-full p-4 rounded-xl border-2 font-bold transition-all ${
                                                    quizStatus === 'RESULT' 
                                                        ? ans === currentQuizLog.adabSession!.quizzes[quizStep].correctAnswer 
                                                            ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                                            : ans === selectedAnswer ? 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-gray-50 border-gray-100 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                                                        : selectedAnswer === ans 
                                                            ? 'bg-secondary text-white border-secondary' 
                                                            : 'bg-white dark:bg-gray-700 dark:text-white border-gray-200 dark:border-gray-600 hover:border-secondary/50'
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
                                        // CHANGED: Explicit color for visibility
                                        <button 
                                            onClick={handleConfirmAnswer} 
                                            className="w-full rounded-xl py-3 shadow-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                        >
                                            هل أنت متأكد؟
                                        </button>
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
                            window.open(`https://wa.me/2${phone}`, '_blank');
                        }}
                        className="bg-[#134e28] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#0f3d1f] transition-all transform hover:scale-105 flex items-center gap-2 border border-white/20"
                    >
                        <span className="text-sm font-bold">التواصل مع المحفظ</span>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </button>
                </div>
             </div>
        </div>
    );
};
