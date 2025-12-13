import React, { useState, useEffect } from 'react';
import { Student, AppState, Teacher, DailyLog, Announcement, QuizItem, AdabSession } from '../types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, DAYS_OF_WEEK, APP_VERSION } from '../constants';
import { TeacherDashboard } from './TeacherDashboard';
import { ParentDashboard } from './ParentDashboard';
import { AdminDashboard } from './AdminDashboard';
import { Button } from './Button';

// --- STYLES & ASSETS (Embedded for ease of use) ---
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

body {
  font-family: 'Cairo', sans-serif;
  background-color: #f4f1ea; /* Parchment Color */
  color: #333;
}

.bg-parchment {
  background-color: #f4f1ea;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23dcd9cd' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
}

/* Islamic Geometric Footer Pattern */
.islamic-footer {
  background-color: #2f4f38; /* Dark Olive Green */
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a89060' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  border-top: 3px solid #a89060;
  clip-path: polygon(0 20%, 50% 0, 100% 20%, 100% 100%, 0 100%);
}
`;

// Logo Component with Updated Design
const Logo = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center mb-10 z-10 relative">
        {/* Mosque Icon / Logo Place holder - using emoji for now but styled */}
        <div className="relative mb-4">
            <div className="text-6xl filter drop-shadow-md">🕌</div>
            <div className="absolute -top-6 -right-6 text-yellow-500 text-4xl opacity-80">🌙</div>
        </div>
        <h1 className="text-4xl font-extrabold text-[#3d2e18] text-center tracking-wide drop-shadow-sm">{title}</h1>
        <p className="text-[#6b5a42] mt-2 text-md font-bold">نظام المتابعة القرآني الذكي</p>
    </div>
);

const NotificationToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-down min-w-[300px] justify-center ${type === 'success' ? 'bg-[#2f4f38] text-white border-2 border-[#a89060]' : 'bg-red-700 text-white border-2 border-red-300'
            }`}>
            <span className="text-2xl">{type === 'success' ? '✅' : '⚠️'}</span>
            <span className="font-bold">{message}</span>
        </div>
    );
};

const normalizeArabicNumbers = (str: string) => {
    return str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
};

const App: React.FC = () => {
    // --- DATA LOADING & STATE ---
    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('muhaffiz_students_v100');
        return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    });

    const [teachers, setTeachers] = useState<Teacher[]>(() => {
        const saved = localStorage.getItem('muhaffiz_teachers_v100');
        return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    });

    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
        const saved = localStorage.getItem('muhaffiz_announcements_v100');
        return saved ? JSON.parse(saved) : [];
    });

    const [adabArchive, setAdabArchive] = useState<AdabSession[]>(() => {
        const saved = localStorage.getItem('muhaffiz_adab_archive');
        return saved ? JSON.parse(saved) : [];
    });

    const [organizationName, setOrganizationName] = useState(() => {
        return localStorage.getItem('muhaffiz_org_name') || "دار التوحيد";
    });

    useEffect(() => {
        localStorage.setItem('muhaffiz_org_name', organizationName);
        document.title = `${organizationName} - متابعة القرآن الكريم`;
    }, [organizationName]);

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    };

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); showNotification('تم استعادة الاتصال بالإنترنت', 'success'); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') { setDeferredPrompt(null); }
    };

    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion && storedVersion !== APP_VERSION) { setUpdateAvailable(true); }
        localStorage.setItem('app_version', APP_VERSION);
    }, []);

    useEffect(() => { localStorage.setItem('muhaffiz_students_v100', JSON.stringify(students)); }, [students]);
    useEffect(() => { localStorage.setItem('muhaffiz_teachers_v100', JSON.stringify(teachers)); }, [teachers]);
    useEffect(() => { localStorage.setItem('muhaffiz_announcements_v100', JSON.stringify(announcements)); }, [announcements]);
    useEffect(() => { localStorage.setItem('muhaffiz_adab_archive', JSON.stringify(adabArchive)); }, [adabArchive]);

    const [appState, setAppState] = useState<AppState>({ students: students, teachers: teachers, announcements: announcements, adabArchive: adabArchive, currentUser: { role: 'GUEST' } });

    // --- LOGIN & NAVIGATION STATE ---
    const [loginView, setLoginView] = useState<'SELECTION' | 'PARENT' | 'TEACHER' | 'ADMIN'>('SELECTION');

    const [parentCodeInput, setParentCodeInput] = useState('');
    const [parentPhoneInput, setParentPhoneInput] = useState('');
    const [parentSelectedTeacher, setParentSelectedTeacher] = useState('');
    const [showPhoneSetup, setShowPhoneSetup] = useState(false);
    const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);

    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [teacherCodeInput, setTeacherCodeInput] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleTeacherLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        if (teacher) {
            const normalizedInput = normalizeArabicNumbers(teacherCodeInput);
            if (teacher.loginCode === normalizedInput) {
                setAppState(prev => ({ ...prev, currentUser: { role: 'TEACHER', id: teacher.id, name: teacher.name } }));
                setLoginError('');
            } else {
                setLoginError("رقم الدخول (الكود الخاص) غير صحيح");
            }
        } else {
            setLoginError("الرجاء اختيار اسم المعلم");
        }
    };

    const handleParentLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentSelectedTeacher) { setLoginError('يرجى اختيار المعلم أولاً'); return; }

        const cleanCode = normalizeArabicNumbers(parentCodeInput.trim());

        const student = students.find(s => s.parentCode === cleanCode && s.teacherId === parentSelectedTeacher);

        if (student) {
            if (student.parentPhone) {
                setAppState(prev => ({ ...prev, currentUser: { role: 'PARENT', id: student.id, name: student.name } }));
                setLoginError('');
            } else {
                setPendingStudentId(student.id);
                setShowPhoneSetup(true);
                setLoginError('');
            }
        } else {
            const codeExistsElsewhere = students.some(s => s.parentCode === cleanCode);
            if (codeExistsElsewhere) {
                setLoginError('كود الطالب صحيح ولكن المعلم المختار غير صحيح.');
            } else {
                setLoginError('كود الطالب غير صحيح. تأكد من الرقم وحاول مرة أخرى.');
            }
        }
    };

    const handleCompleteParentProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = normalizeArabicNumbers(parentPhoneInput.trim());
        if (!cleanPhone || cleanPhone.length < 10) { setLoginError('يرجى كتابة رقم هاتف صحيح'); return; }

        if (pendingStudentId) {
            const student = students.find(s => s.id === pendingStudentId);
            if (student) {
                const newStudents = students.map(s => s.id === student.id ? { ...s, parentPhone: cleanPhone } : s);
                setStudents(newStudents);
                setAppState(prev => ({ ...prev, currentUser: { role: 'PARENT', id: student.id, name: student.name } }));
                setShowPhoneSetup(false);
                setPendingStudentId(null);
            }
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const savedPass = localStorage.getItem('admin_password') || '456888';
        if (adminPassword === savedPass) {
            setAppState(prev => ({ ...prev, currentUser: { role: 'ADMIN', name: 'المبرمج' } }));
            setLoginError('');
        } else {
            setLoginError('كلمة المرور غير صحيحة');
        }
    };

    const handleLogout = () => {
        setAppState(prev => ({ ...prev, currentUser: { role: 'GUEST' } }));
        setLoginView('SELECTION');
        setParentCodeInput('');
        setParentPhoneInput('');
        setLoginError('');
        setSelectedTeacherId('');
        setTeacherCodeInput('');
        setAdminPassword('');
        setShowPhoneSetup(false);
    };

    // --- DATA OPERATIONS ---
    const updateStudent = (updatedStudent: Student) => { const newStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s); setStudents(newStudents); };
    const deleteStudents = (studentIds: string[]) => { setStudents(prevStudents => { const remaining = prevStudents.filter(s => !studentIds.includes(s.id)); return [...remaining]; }); showNotification('تم حذف الطالب بنجاح'); };

    const markRemainingStudentsAbsent = () => {
        const teacherId = appState.currentUser.id || 'unknown';
        const teacherName = appState.currentUser.name || 'المعلم';
        const todayString = new Date().toDateString();
        let count = 0;
        const studentsToMarkIds: string[] = [];

        students.forEach(student => {
            if (student.teacherId !== teacherId) return;
            const hasLogToday = student.logs.some(log => new Date(log.date).toDateString() === todayString);
            if (!hasLogToday) {
                studentsToMarkIds.push(student.id);
            }
        });

        if (studentsToMarkIds.length === 0) {
            showNotification("تم تسجيل جميع الطلاب لهذا اليوم بالفعل.", 'success');
            return;
        }

        if (!window.confirm(`سيتم تسجيل الغياب لـ ${studentsToMarkIds.length} طالب لم يسجلوا اليوم. هل أنت متأكد؟`)) {
            return;
        }

        setStudents(prevStudents => {
            return prevStudents.map(student => {
                if (studentsToMarkIds.includes(student.id)) {
                    count++;
                    const absentLog: DailyLog = {
                        id: 'absent_' + Date.now() + Math.random(),
                        date: new Date().toISOString(),
                        teacherId,
                        teacherName,
                        seenByParent: false,
                        isAbsent: true,
                        notes: 'تم تسجيل الغياب تلقائياً لعدم الحضور.'
                    };
                    return { ...student, logs: [absentLog, ...student.logs] };
                }
                return student;
            });
        });
        showNotification(`تم تسجيل الغياب لـ ${studentsToMarkIds.length} طالب بنجاح`, 'success');
    };

    const addStudent = (name: string, code: string) => { const newStudent: Student = { id: 's_' + Date.now() + Math.random(), teacherId: appState.currentUser.id || 't1', name: name, parentCode: code, weeklySchedule: DAYS_OF_WEEK.map(d => ({ day: d, events: [] })), payments: [], logs: [] }; setStudents([newStudent, ...students]); return newStudent; };
    const addTeacher = (name: string, loginCode: string) => { const newTeacher: Teacher = { id: 't_' + Date.now(), name, loginCode }; setTeachers(prev => [...prev, newTeacher]); showNotification('تم إضافة المحفظ بنجاح'); };
    const updateTeacher = (id: string, name: string, loginCode: string) => { setTeachers(prev => prev.map(t => t.id === id ? { ...t, name, loginCode } : t)); showNotification('تم تعديل بيانات المحفظ بنجاح'); };
    const deleteTeacher = (id: string) => { setTeachers(prevTeachers => { const remaining = prevTeachers.filter(t => t.id !== id); return [...remaining]; }); showNotification('تم حذف المحفظ بنجاح'); };
    const markLogsAsSeen = (studentId: string, logIds: string[]) => { const studentIndex = students.findIndex(s => s.id === studentId); if (studentIndex === -1) return; const student = students[studentIndex]; const studentLogs = student.logs.map(log => { if (logIds.includes(log.id)) { return { ...log, seenByParent: true, seenAt: new Date().toISOString() }; } return log; }); const updatedStudent = { ...student, logs: studentLogs }; updateStudent(updatedStudent); showNotification('تم تأكيد الاطلاع', 'success'); };
    const addAnnouncement = (ann: Announcement) => { setAnnouncements(prev => [ann, ...prev]); };
    const deleteAnnouncement = (id: string) => { setAnnouncements(prev => prev.filter(a => a.id !== id)); showNotification('تم حذف الإعلان'); };

    const handlePublishAdab = (title: string, quizzes: QuizItem[]) => {
        const teacherId = appState.currentUser.id;
        const teacherName = appState.currentUser.name || 'المعلم';
        if (!teacherId) return;

        const todayIso = new Date().toISOString();
        const todayDateStr = new Date().toDateString();
        const newSessionId = 'adab_sess_' + Date.now();

        const newAnnouncement: Announcement = {
            id: 'ann_' + Date.now(),
            teacherId,
            teacherName,
            content: `***${title}\nيرجى من ولي الأمر مشاركة الطالب في حل أسئلة يوم الآداب الآن!`,
            date: todayIso,
            type: 'GENERAL'
        };
        addAnnouncement(newAnnouncement);

        const newAdabSession: AdabSession = {
            id: newSessionId,
            title,
            quizzes,
            date: todayIso
        };
        setAdabArchive(prev => [newAdabSession, ...prev]);

        setStudents(prevStudents => prevStudents.map(s => {
            if (s.teacherId === teacherId) {
                const existingLogIndex = s.logs.findIndex(l => new Date(l.date).toDateString() === todayDateStr);
                const adabSessionData: AdabSession = {
                    id: newSessionId,
                    title: title,
                    quizzes: quizzes,
                    date: todayIso
                };

                if (existingLogIndex >= 0) {
                    const updatedLogs = [...s.logs];
                    updatedLogs[existingLogIndex] = {
                        ...updatedLogs[existingLogIndex],
                        isAdab: true,
                        adabSession: adabSessionData,
                    };
                    return { ...s, logs: updatedLogs };
                } else {
                    const newLog: DailyLog = {
                        id: 'adab_' + Date.now() + Math.random(),
                        date: todayIso,
                        teacherId,
                        teacherName,
                        isAbsent: false,
                        isAdab: true,
                        adabSession: adabSessionData,
                        seenByParent: false,
                        notes: ""
                    };
                    return { ...s, logs: [newLog, ...s.logs] };
                }
            }
            return s;
        }));
    };

    const handleEditAdab = (sessionId: string, title: string, quizzes: QuizItem[]) => {
        setAdabArchive(prev => prev.map(s => s.id === sessionId ? { ...s, title, quizzes } : s));
        setStudents(prevStudents => prevStudents.map(student => {
            const hasThisAdab = student.logs.some(l => l.adabSession?.id === sessionId);
            if (hasThisAdab) {
                const newLogs = student.logs.map(log => {
                    if (log.adabSession?.id === sessionId) {
                        return {
                            ...log,
                            adabSession: { ...log.adabSession!, title, quizzes },
                            seenByParent: false,
                            parentQuizScore: undefined,
                            parentQuizMax: undefined
                        };
                    }
                    return log;
                });
                return { ...student, logs: newLogs };
            }
            return student;
        }));
    };

    const handleDeleteAdab = (sessionId: string) => {
        setAdabArchive(prev => prev.filter(s => s.id !== sessionId));
        setStudents(prevStudents => prevStudents.map(student => {
            const newLogs = student.logs.map(log => {
                if (log.adabSession?.id === sessionId) {
                    if (log.isAbsent === false && !log.jadeed && !log.attendance) {
                        return null;
                    } else {
                        const { adabSession, parentQuizScore, parentQuizMax, ...rest } = log;
                        return { ...rest, isAdab: false };
                    }
                }
                return log;
            }).filter(l => l !== null) as DailyLog[];

            return { ...student, logs: newLogs };
        }));
        showNotification('تم حذف درس الآداب بنجاح', 'success');
    };

    const handleQuickAnnouncement = (type: 'ADAB' | 'HOLIDAY', payload?: any) => {
        const teacherId = appState.currentUser.id;
        const teacherName = appState.currentUser.name || 'المعلم';
        if (!teacherId) return;

        let content = "";
        if (type === 'ADAB') {
            content = `***${payload?.title || "يوم الآداب الرائع"}\nتأكد من حضور ابنك اليوم حتى لا يقل في اختبار الشهر`;
        } else {
            content = "🎉 تنبيه هام: غداً إجازة رسمية للحلقة.";
        }

        const newAnnouncement: Announcement = {
            id: 'ann_' + Date.now(),
            teacherId,
            teacherName,
            content,
            date: new Date().toISOString(),
            type: 'GENERAL'
        };

        addAnnouncement(newAnnouncement);
        if (type === 'HOLIDAY') {
            showNotification('تم إرسال تنبيه الإجازة', 'success');
        }
    };

    return (
        <>
            {/* Inject Global Styles */}
            <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

            {!isOnline && (
                <div className="bg-gray-800 text-white text-center text-sm p-1 fixed top-0 left-0 right-0 z-[110]">
                    📡 وضع عدم الاتصال: البيانات تحفظ محلياً
                </div>
            )}

            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {appState.currentUser.role === 'ADMIN' ? (
                <AdminDashboard
                    teachers={teachers}
                    students={students}
                    onAddTeacher={addTeacher}
                    onUpdateTeacher={updateTeacher}
                    onDeleteTeacher={deleteTeacher}
                    onLogout={handleLogout}
                    onShowNotification={showNotification}
                    organizationName={organizationName}
                    onUpdateOrganizationName={setOrganizationName}
                />
            ) : appState.currentUser.role === 'TEACHER' ? (
                <TeacherDashboard
                    teacherName={appState.currentUser.name || 'المعلم'}
                    teacherId={appState.currentUser.id || 't1'}
                    students={students.filter(s => s.teacherId === appState.currentUser.id)}
                    allTeachers={teachers}
                    announcements={announcements}
                    adabArchive={adabArchive}
                    onUpdateStudent={updateStudent}
                    onAddStudent={addStudent}
                    onDeleteStudents={deleteStudents}
                    onMarkAbsences={markRemainingStudentsAbsent}
                    onAddAnnouncement={addAnnouncement}
                    onDeleteAnnouncement={deleteAnnouncement}
                    onLogout={handleLogout}
                    onShowNotification={showNotification}
                    onPublishAdab={handlePublishAdab}
                    onEditAdab={handleEditAdab}
                    onDeleteAdab={handleDeleteAdab}
                    onQuickAnnouncement={handleQuickAnnouncement}
                />
            ) : appState.currentUser.role === 'PARENT' ? (
                <ParentDashboard
                    student={students.find(s => s.id === appState.currentUser.id)!}
                    announcements={announcements}
                    onUpdateStudent={updateStudent}
                    onLogout={handleLogout}
                    onMarkSeen={markLogsAsSeen}
                />
            ) : (
                <div className="min-h-screen flex flex-col relative overflow-hidden bg-parchment font-cairo">
                    {/* Background Pattern Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 islamic-footer z-0 pointer-events-none"></div>

                    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 z-10">
                        <Logo title={organizationName} />

                        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] shadow-xl max-w-sm w-full border border-[#e6e2d3] relative">
                            {/* Header Text for Card */}
                            {!showPhoneSetup && loginView === 'SELECTION' && (
                                <h3 className="text-center text-[#5c6b48] font-bold mb-6 text-lg">اختر طريقة الدخول المتابعة</h3>
                            )}

                            {!showPhoneSetup ? (
                                <>
                                    {/* MAIN SELECTION VIEW - Matching Screenshot 1 */}
                                    {loginView === 'SELECTION' && (
                                        <div className="space-y-4 animate-fade-in">
                                            {/* Parent Button */}
                                            <button
                                                onClick={() => { setLoginView('PARENT'); setLoginError(''); }}
                                                className="w-full bg-[#5c6b48] text-white p-2 rounded-full shadow-md transition-transform transform active:scale-[0.98] flex items-center justify-between group h-20 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition"></div>
                                                <div className="w-10 h-10 flex items-center justify-center bg-[#7a8a65] rounded-full ml-4 shadow-inner text-white/80 text-xl font-bold">➜</div>
                                                <div className="flex flex-col items-end mr-4 flex-1">
                                                    <h3 className="font-extrabold text-xl">ولي الأمر</h3>
                                                    <p className="text-xs text-white/80">متابعة مستوى الأبناء</p>
                                                </div>
                                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-2 border-4 border-[#5c6b48]">
                                                    <span className="text-3xl">👨‍👩‍👧‍👦</span>
                                                </div>
                                            </button>

                                            {/* Teacher Button */}
                                            <button
                                                onClick={() => { setLoginView('TEACHER'); setLoginError(''); }}
                                                className="w-full bg-[#a89060] text-white p-2 rounded-full shadow-md transition-transform transform active:scale-[0.98] flex items-center justify-between group h-20 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition"></div>
                                                <div className="w-10 h-10 flex items-center justify-center bg-[#c4b085] rounded-full ml-4 shadow-inner text-white/80 text-xl font-bold">➜</div>
                                                <div className="flex flex-col items-end mr-4 flex-1">
                                                    <h3 className="font-extrabold text-xl">المعلم</h3>
                                                    <p className="text-xs text-white/80">إدارة الحلقة والطلاب</p>
                                                </div>
                                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-2 border-4 border-[#a89060]">
                                                    <span className="text-3xl">👳‍♂️</span>
                                                </div>
                                            </button>

                                            <div className="mt-8 text-center pt-2">
                                                <button onClick={() => setLoginView('ADMIN')} className="text-[10px] text-gray-400 hover:text-[#5c6b48] transition font-bold">
                                                    🔐 دخول المسؤول (المبرمج)
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* LOGIN FORMS - Styled to match theme */}
                                    <div className="space-y-8">
                                        {loginView === 'PARENT' && (
                                            <form onSubmit={handleParentLogin} className="space-y-4 animate-slide-up relative pt-2">
                                                <div className="flex items-center mb-6 border-b border-[#e6e2d3] pb-4">
                                                    <button type="button" onClick={() => setLoginView('SELECTION')} className="bg-[#f4f1ea] hover:bg-[#e6e2d3] text-[#5c6b48] w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm">
                                                        <span className="text-xl font-bold">➜</span>
                                                    </button>
                                                    <h3 className="flex-1 text-center font-bold text-[#5c6b48] text-xl">دخول ولي الأمر</h3>
                                                    <div className="w-10"></div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 text-right">اختر اسم المعلم (الشيخ)</label>
                                                    <select
                                                        className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl bg-white focus:border-[#5c6b48] outline-none transition text-right"
                                                        value={parentSelectedTeacher}
                                                        onChange={(e) => setParentSelectedTeacher(e.target.value)}
                                                    >
                                                        <option value="">-- اختر الاسم --</option>
                                                        {teachers.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 text-right">كود الطالب</label>
                                                    <input
                                                        type="text"
                                                        placeholder="أدخل الكود"
                                                        className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl text-center text-lg tracking-widest focus:border-[#5c6b48] outline-none transition"
                                                        value={parentCodeInput}
                                                        onChange={(e) => setParentCodeInput(e.target.value)}
                                                    />
                                                </div>
                                                {loginError && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg border border-red-100">{loginError}</p>}
                                                <Button type="submit" className="w-full text-lg py-3 rounded-xl bg-[#5c6b48] hover:bg-[#4a563a] text-white shadow-lg">دخول</Button>
                                            </form>
                                        )}

                                        {loginView === 'TEACHER' && (
                                            <form onSubmit={handleTeacherLogin} className="space-y-4 animate-slide-up relative pt-2">
                                                <div className="flex items-center mb-6 border-b border-[#e6e2d3] pb-4">
                                                    <button type="button" onClick={() => setLoginView('SELECTION')} className="bg-[#f4f1ea] hover:bg-[#e6e2d3] text-[#a89060] w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm">
                                                        <span className="text-xl font-bold">➜</span>
                                                    </button>
                                                    <h3 className="flex-1 text-center font-bold text-[#a89060] text-xl">دخول المعلم</h3>
                                                    <div className="w-10"></div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 text-center">اختر اسم المعلم</label>
                                                    <select
                                                        className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl bg-white focus:border-[#a89060] outline-none transition text-center"
                                                        value={selectedTeacherId}
                                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                                    >
                                                        <option value="">-- اختر الاسم --</option>
                                                        {teachers.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 text-center">الرقم الخاص (كود الدخول)</label>
                                                    <input
                                                        type="password"
                                                        className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl text-center focus:border-[#a89060] outline-none font-mono tracking-widest"
                                                        value={teacherCodeInput}
                                                        onChange={(e) => setTeacherCodeInput(e.target.value)}
                                                        placeholder="******"
                                                    />
                                                </div>
                                                {loginError && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg border border-red-100">{loginError}</p>}
                                                <Button type="submit" className="w-full text-lg py-3 rounded-xl bg-[#a89060] hover:bg-[#8f7a50] text-white shadow-lg" disabled={!selectedTeacherId}>
                                                    دخول
                                                </Button>
                                            </form>
                                        )}

                                        {loginView === 'ADMIN' && (
                                            <form onSubmit={handleAdminLogin} className="space-y-4 animate-slide-up relative border-t pt-4 mt-4">
                                                <button type="button" onClick={() => setLoginView('SELECTION')} className="absolute -top-10 right-0 text-gray-400 hover:text-gray-600 font-bold text-xs bg-gray-100 px-2 py-1 rounded">إلغاء</button>
                                                <h3 className="text-center font-bold text-gray-600">دخول المبرمج</h3>
                                                <input
                                                    type="password"
                                                    placeholder="كلمة المرور"
                                                    className="w-full p-2 border rounded-lg text-center bg-[#f9f9f9]"
                                                    value={adminPassword}
                                                    onChange={e => setAdminPassword(e.target.value)}
                                                />
                                                {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                                                <Button variant="danger" type="submit" className="w-full">دخول المسؤول</Button>
                                            </form>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="animate-fade-in">
                                    <h3 className="text-xl font-bold text-center mb-2 text-[#5c6b48]">إكمال البيانات</h3>
                                    <p className="text-xs text-gray-500 text-center mb-6">يرجى إدخال رقم الهاتف لمرة واحدة فقط، لتمكين المحفظ من التواصل معكم.</p>
                                    <form onSubmit={handleCompleteParentProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1 text-center">رقم هاتف ولي الأمر</label>
                                            <input
                                                type="tel"
                                                placeholder="01xxxxxxxxx"
                                                className="w-full p-5 border-2 border-[#e6e2d3] rounded-2xl text-center text-4xl font-black tracking-[0.2em] text-[#5c6b48] focus:border-[#5c6b48] outline-none transition shadow-sm placeholder:text-gray-300 h-20 bg-[#faf9f6]"
                                                value={parentPhoneInput}
                                                onChange={(e) => setParentPhoneInput(e.target.value)}
                                            />
                                        </div>
                                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                                        <Button type="submit" className="w-full bg-[#5c6b48] hover:bg-[#4a563a] text-white py-3 rounded-xl">حفظ ودخول</Button>
                                        <Button type="button" variant="outline" onClick={handleLogout} className="w-full">إلغاء</Button>
                                    </form>
                                </div>
                            )}

                            {deferredPrompt && (
                                <div className="mt-6 text-center animate-bounce">
                                    <Button onClick={handleInstallClick} className="w-full bg-[#2f4f38] hover:bg-[#1f3626] shadow-lg border border-[#a89060]">
                                        📲 تثبيت التطبيق (أندرويد)
                                    </Button>
                                </div>
                            )}

                            {isIOS && !deferredPrompt && (
                                <div className="mt-6 text-center bg-[#f4f1ea] p-3 rounded-lg border border-[#e6e2d3]">
                                    <p className="text-xs text-[#6b5a42] font-bold mb-1">لتثبيت التطبيق على الآيفون:</p>
                                    <p className="text-xs text-[#8c7b60]">اضغط على زر المشاركة <span className="text-lg">⎋</span> ثم اختر "Add to Home Screen" (إضافة للشاشة الرئيسية)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Copyright Text */}
                    <div className="absolute bottom-4 w-full text-center z-20">
                        <div className="mb-1 text-[#a89060] opacity-80 text-xl font-serif font-bold">دار التوحيد</div>
                        <p className="text-[#a89060] text-[10px] opacity-60">جميع الحقوق محفوظة © 2025 دار التوحيد</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default App;