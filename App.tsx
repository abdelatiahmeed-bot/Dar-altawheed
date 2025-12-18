import React, { useState, useEffect } from 'react';
// 👇 استدعاء أدوات الفاير بيز
import { db } from './firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

import { Student, AppState, UserRole, Teacher, DailyLog, Announcement, QuizItem, AdabSession, OrgSettings } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, DAYS_OF_WEEK, APP_VERSION } from './constants';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/Button';

// --- COMPONENTS ---

// Text-Based Decorative Logo with Dynamic Styling
const Logo = ({ title, settings }: { title: string, settings: OrgSettings }) => {
    // Style Mapping
    const fontClass = settings.font === 'Amiri' ? 'font-serif' : 'font-sans';
    
    const colorClasses = {
        Gold: 'text-darkBrown',
        Green: 'text-emerald-900',
        Blue: 'text-blue-900'
    };
    
    // Style Rendering
    if (settings.styleType === 'Calligraphy') {
        return (
            <div className="flex flex-col items-center mb-10 relative z-10">
                <div className="relative mb-4 p-4">
                <h1 className={`text-6xl font-bold ${fontClass} ${colorClasses[settings.colorTheme]} text-center tracking-tighter leading-tight drop-shadow-md`} 
                    style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                    {title}
                </h1>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${colorClasses[settings.colorTheme]}`}></div>
                </div>
                <div className="flex items-center gap-3 opacity-70 mt-2">
                    <span className={`h-[1px] w-8 bg-current opacity-50 ${colorClasses[settings.colorTheme]}`}></span>
                    <p className={`text-xs font-bold tracking-widest uppercase ${colorClasses[settings.colorTheme]}`}>نظام المتابعة القرآني</p>
                    <span className={`h-[1px] w-8 bg-current opacity-50 ${colorClasses[settings.colorTheme]}`}></span>
                </div>
            </div>
        );
    } else if (settings.styleType === 'Modern') {
        return (
            <div className="flex flex-col items-center mb-10 relative z-10">
                <div className={`bg-white/80 p-4 rounded-2xl shadow-sm border border-white/50 backdrop-blur-sm`}>
                    <h1 className={`text-4xl font-black ${fontClass} ${colorClasses[settings.colorTheme]} text-center tracking-wide`}>
                        {title}
                    </h1>
                </div>
                <p className="text-gray-500 text-xs mt-2 font-bold tracking-wider">SYSTEM V{APP_VERSION}</p>
            </div>
        );
    } else {
        // Simple
        return (
            <div className="flex flex-col items-center mb-8 relative z-10">
                <h1 className={`text-3xl font-bold ${fontClass} ${colorClasses[settings.colorTheme]} text-center`}>
                    {title}
                </h1>
            </div>
        );
    }
};

const NotificationToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-down min-w-[300px] justify-center border-2 ${
      type === 'success' ? 'bg-primary text-white border-primaryDark' : 'bg-red-600 text-white border-red-800'
    }`}>
      <span className="text-2xl">{type === 'success' ? '✨' : '⚠️'}</span>
      <span className="font-bold font-serif">{message}</span>
    </div>
  );
};

const normalizeArabicNumbers = (str: string) => {
  return str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
};

const App: React.FC = () => {
  // --- DATA LOADING & STATE FROM LOCAL STORAGE ---
  const [students, setStudents] = useState<Student[]>(() => {
      try {
          const saved = localStorage.getItem('muhaffiz_students_v3');
          return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      } catch { return INITIAL_STUDENTS; }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
      try {
          const saved = localStorage.getItem('muhaffiz_teachers_v3');
          return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
      } catch { return INITIAL_TEACHERS; }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
      try {
          const saved = localStorage.getItem('muhaffiz_announcements_v3');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  const [adabArchive, setAdabArchive] = useState<AdabSession[]>(() => {
      try {
          const saved = localStorage.getItem('muhaffiz_adab_archive_v3');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });
  
  // Org Settings State
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(() => {
      try {
          const saved = localStorage.getItem('muhaffiz_settings_v3');
          return saved ? JSON.parse(saved) : { 
              name: "دار التوحيد", 
              font: 'Amiri', 
              colorTheme: 'Gold', 
              styleType: 'Calligraphy' 
          };
      } catch {
          return { name: "دار التوحيد", font: 'Amiri', colorTheme: 'Gold', styleType: 'Calligraphy' };
      }
  });

  // PERSISTENCE EFFECTS (LOCAL STORAGE)
  useEffect(() => { localStorage.setItem('muhaffiz_students_v3', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('muhaffiz_teachers_v3', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('muhaffiz_announcements_v3', JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem('muhaffiz_adab_archive_v3', JSON.stringify(adabArchive)); }, [adabArchive]);
  useEffect(() => { localStorage.setItem('muhaffiz_settings_v3', JSON.stringify(orgSettings)); }, [orgSettings]);

  // 🔥 ADDED: جلب البيانات من الفاير بيز عند فتح التطبيق
  useEffect(() => {
    const syncData = async () => {
      try {
        // جلب الطلاب
        const studentSnap = await getDocs(collection(db, 'students'));
        if (!studentSnap.empty) setStudents(studentSnap.docs.map(d => d.data() as Student));
        
        // جلب المعلمين
        const teacherSnap = await getDocs(collection(db, 'teachers'));
        if (!teacherSnap.empty) setTeachers(teacherSnap.docs.map(d => d.data() as Teacher));
        
        // جلب الإعلانات
        const annSnap = await getDocs(collection(db, 'announcements'));
        if (!annSnap.empty) setAnnouncements(annSnap.docs.map(d => d.data() as Announcement));
        
        // جلب أرشيف الآداب
        const adabSnap = await getDocs(collection(db, 'adabArchive'));
        if (!adabSnap.empty) setAdabArchive(adabSnap.docs.map(d => d.data() as AdabSession));
        
        // جلب الإعدادات
        const settingSnap = await getDocs(collection(db, 'settings'));
        if (!settingSnap.empty) {
           const s = settingSnap.docs.find(d => d.id === 'orgSettings');
           if (s) setOrgSettings(s.data() as OrgSettings);
        }

      } catch (error) {
        console.log("Working offline or initial load error:", error);
      }
    };
    syncData();
  }, []);

  useEffect(() => {
      document.title = `${orgSettings.name} - متابعة القرآن الكريم`;
  }, [orgSettings]);

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

  const [appState, setAppState] = useState<AppState>({ students: students, teachers: teachers, announcements: announcements, adabArchive: adabArchive, orgSettings: orgSettings, currentUser: { role: 'GUEST' } });

  // Update appState when data changes
  useEffect(() => {
      setAppState(prev => ({
          ...prev,
          students,
          teachers,
          announcements,
          adabArchive,
          orgSettings
      }));
  }, [students, teachers, announcements, adabArchive, orgSettings]);

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
  
  const handleCompleteParentProfile = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      const cleanPhone = normalizeArabicNumbers(parentPhoneInput.trim());
      if (!cleanPhone || cleanPhone.length < 10) { setLoginError('يرجى كتابة رقم هاتف صحيح'); return; } 
      
      if (pendingStudentId) { 
          const updatedStudent = { ...students.find(s => s.id === pendingStudentId)!, parentPhone: cleanPhone };
          updateStudent(updatedStudent);
          setAppState(prev => ({ ...prev, currentUser: { role: 'PARENT', id: updatedStudent.id, name: updatedStudent.name } })); 
          setShowPhoneSetup(false); 
          setPendingStudentId(null); 
      } 
  };
  
  const handleAdminLogin = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const savedPass = localStorage.getItem('admin_password') || '456888'; 
      if (adminPassword === savedPass) { 
          setAppState(prev => ({ ...prev, currentUser: { role: 'ADMIN', name: 'المبرمج' }})); 
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

  // --- DATA OPERATIONS (LOCAL STORAGE + FIREBASE) ---
  const updateStudent = (updatedStudent: Student) => { 
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      // 🔥 Firebase Save
      setDoc(doc(db, 'students', updatedStudent.id), updatedStudent).catch(e => console.log(e));
  };
  
  const deleteStudents = (studentIds: string[]) => { 
      setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
      // 🔥 Firebase Delete
      studentIds.forEach(id => {
          deleteDoc(doc(db, 'students', id)).catch(e => console.log(e));
      });
      showNotification('تم حذف الطالب بنجاح'); 
  };
  
  const markRemainingStudentsAbsent = (absentIds: string[], excusedIds: string[]) => { 
    const teacherId = appState.currentUser.id || 'unknown'; 
    const teacherName = appState.currentUser.name || 'المعلم'; 
    
    // Create batch to update multiple docs
    const batch = writeBatch(db);

    setStudents(prev => {
        const nextState = prev.map(student => {
            if (absentIds.includes(student.id) || excusedIds.includes(student.id)) {
                let note = "";
                if (absentIds.includes(student.id)) note = "غياب غير مبرر";
                else note = "غائب بعذر - جزاكم الله خيراً على تبليغ الشيخ";
                
                const log: DailyLog = { 
                    id: 'absent_' + Date.now() + Math.random(), 
                    date: new Date().toISOString(), 
                    teacherId, 
                    teacherName, 
                    seenByParent: false, 
                    isAbsent: true, 
                    notes: note 
                };
                const updated = { ...student, logs: [log, ...student.logs] };
                // 🔥 Add to batch
                batch.set(doc(db, 'students', updated.id), updated);
                return updated;
            }
            return student;
        });
        // 🔥 Commit batch
        batch.commit().catch(e => console.log(e));
        return nextState;
    });

    showNotification(`تم تسجيل الغياب لـ ${absentIds.length + excusedIds.length} طالب`, 'success'); 
  };
  
  const addStudent = (name: string, code: string) => { 
      const newStudent: Student = { 
          id: 's_' + Date.now() + Math.random(), 
          teacherId: appState.currentUser.id || 't1', 
          name: name, 
          parentCode: code, 
          weeklySchedule: DAYS_OF_WEEK.map(d => ({ day: d, events: [] })), 
          payments: [], 
          logs: [] 
      }; 
      setStudents(prev => [newStudent, ...prev]);
      // 🔥 Firebase Save
      setDoc(doc(db, 'students', newStudent.id), newStudent).catch(e => console.log(e));
      return newStudent; 
  };
  
  const addTeacher = (name: string, loginCode: string, phone: string) => { 
      const newTeacher: Teacher = { id: 't_' + Date.now(), name, loginCode, phone }; 
      setTeachers(prev => [...prev, newTeacher]);
      // 🔥 Firebase Save
      setDoc(doc(db, 'teachers', newTeacher.id), newTeacher).catch(e => console.log(e));
      showNotification('تم إضافة المحفظ بنجاح'); 
  };
  
  const updateTeacher = (id: string, name: string, loginCode: string, phone: string) => { 
      const updatedData = { id, name, loginCode, phone };
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, name, loginCode, phone } : t));
      // 🔥 Firebase Update
      updateDoc(doc(db, 'teachers', id), updatedData).catch(e => console.log(e));
      showNotification('تم تعديل بيانات المحفظ بنجاح'); 
  };
  
  const deleteTeacher = (id: string) => { 
      setTeachers(prev => prev.filter(t => t.id !== id));
      // 🔥 Firebase Delete
      deleteDoc(doc(db, 'teachers', id)).catch(e => console.log(e));
      showNotification('تم حذف المحفظ بنجاح'); 
  };
  
  const markLogsAsSeen = (studentId: string, logIds: string[]) => { 
      setStudents(prev => {
          const nextState = prev.map(s => {
            if (s.id === studentId) {
                const newLogs = s.logs.map(log => logIds.includes(log.id) ? { ...log, seenByParent: true, seenAt: new Date().toISOString() } : log);
                const updated = { ...s, logs: newLogs };
                // 🔥 Firebase Save
                setDoc(doc(db, 'students', updated.id), updated).catch(e => console.log(e));
                return updated;
            }
            return s;
          });
          return nextState;
      });
      showNotification('تم تأكيد الاطلاع', 'success'); 
  };
  
  const addAnnouncement = (ann: Announcement) => { 
      setAnnouncements(prev => [ann, ...prev]);
      // 🔥 Firebase Save
      setDoc(doc(db, 'announcements', ann.id), ann).catch(e => console.log(e));
  };
  
  const deleteAnnouncement = (id: string) => { 
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      // 🔥 Firebase Delete
      deleteDoc(doc(db, 'announcements', id)).catch(e => console.log(e));
      showNotification('تم حذف الإعلان'); 
  };
  
  const updateOrgSettings = (settings: OrgSettings) => {
      setOrgSettings(settings);
      // 🔥 Firebase Save
      setDoc(doc(db, 'settings', 'orgSettings'), settings).catch(e => console.log(e));
  };

  const handlePublishAdab = (title: string, quizzes: QuizItem[]) => { 
      const teacherId = appState.currentUser.id; const teacherName = appState.currentUser.name || 'المعلم'; if (!teacherId) return;
      const todayIso = new Date().toISOString(); const todayDateStr = new Date().toDateString(); const newSessionId = 'adab_sess_' + Date.now();
      
      const newAnnouncement: Announcement = { id: 'ann_' + Date.now(), teacherId, teacherName, content: `***${title}\nيرجى من ولي الأمر مشاركة الطالب في حل أسئلة يوم الآداب الآن!`, date: todayIso, type: 'GENERAL' }; 
      addAnnouncement(newAnnouncement);
      // 🔥 Firebase handled in addAnnouncement
      
      const newAdabSession: AdabSession = { id: newSessionId, title, quizzes, date: todayIso }; 
      setAdabArchive(prev => [newAdabSession, ...prev]);
      // 🔥 Firebase Save Archive
      setDoc(doc(db, 'adabArchive', newSessionId), newAdabSession).catch(e => console.log(e));
      
      const batch = writeBatch(db);

      setStudents(prev => {
          const nextState = prev.map(s => {
              if (s.teacherId === teacherId) {
                  const existingLogIndex = s.logs.findIndex(l => new Date(l.date).toDateString() === todayDateStr); 
                  const adabSessionData: AdabSession = { id: newSessionId, title: title, quizzes: quizzes, date: todayIso }; 
                  
                  let updatedLogs = [...s.logs];
                  if (existingLogIndex >= 0) { 
                      updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], isAdab: true, adabSession: adabSessionData, }; 
                  } else { 
                      const newLog: DailyLog = { id: 'adab_' + Date.now() + Math.random(), date: todayIso, teacherId, teacherName, isAbsent: false, isAdab: true, adabSession: adabSessionData, seenByParent: false, notes: "" }; 
                      updatedLogs = [newLog, ...s.logs]; 
                  }
                  const updated = { ...s, logs: updatedLogs };
                  // 🔥 Add to batch
                  batch.set(doc(db, 'students', updated.id), updated);
                  return updated;
              }
              return s;
          });
          // 🔥 Commit batch
          batch.commit().catch(e => console.log(e));
          return nextState;
      });
  };
  
  const handleEditAdab = (sessionId: string, title: string, quizzes: QuizItem[]) => { 
      setAdabArchive(prev => prev.map(s => s.id === sessionId ? { ...s, title, quizzes } : s));
      // 🔥 Firebase Update
      updateDoc(doc(db, 'adabArchive', sessionId), { title, quizzes }).catch(e => console.log(e));
      
      const batch = writeBatch(db);
      setStudents(prev => {
          const nextState = prev.map(student => { 
              const newLogs = student.logs.map(log => { 
                  if (log.adabSession?.id === sessionId) { 
                      return { ...log, adabSession: { ...log.adabSession!, title, quizzes }, seenByParent: false, parentQuizScore: undefined, parentQuizMax: undefined }; 
                  } return log; 
              }); 
              const updated = { ...student, logs: newLogs };
              // Simple check to avoid empty updates, but generally safe to overwrite
              batch.set(doc(db, 'students', updated.id), updated);
              return updated; 
          }); 
          batch.commit().catch(e => console.log(e));
          return nextState;
      });
  };
  
  const handleDeleteAdab = (sessionId: string) => { 
      setAdabArchive(prev => prev.filter(s => s.id !== sessionId));
      // 🔥 Firebase Delete
      deleteDoc(doc(db, 'adabArchive', sessionId)).catch(e => console.log(e));
      
      const batch = writeBatch(db);
      setStudents(prev => {
          const nextState = prev.map(student => { 
              const newLogs = student.logs.map(log => { 
                  if (log.adabSession?.id === sessionId) { 
                      if (log.isAbsent === false && !log.jadeed && !log.attendance) { return null; } 
                      else { const { adabSession, parentQuizScore, parentQuizMax, ...rest } = log; return { ...rest, isAdab: false }; } 
                  } return log; 
              }).filter(l => l !== null) as DailyLog[]; 
              
              const updated = { ...student, logs: newLogs };
              batch.set(doc(db, 'students', updated.id), updated);
              return updated; 
          }); 
          batch.commit().catch(e => console.log(e));
          return nextState;
      });
      showNotification('تم حذف درس الآداب بنجاح', 'success');
  };
  
  const handleQuickAnnouncement = (type: 'ADAB' | 'HOLIDAY', payload?: any) => { 
      const teacherId = appState.currentUser.id; const teacherName = appState.currentUser.name || 'المعلم'; if (!teacherId) return;
      let content = ""; if (type === 'ADAB') { content = `***${payload?.title || "يوم الآداب الرائع"}\nتأكد من حضور ابنك اليوم حتى لا يقل في اختبار الشهر`; } else { content = "🎉 تنبيه هام: غداً إجازة رسمية للحلقة."; }
      const newAnnouncement: Announcement = { id: 'ann_' + Date.now(), teacherId, teacherName, content, date: new Date().toISOString(), type: 'GENERAL' }; 
      addAnnouncement(newAnnouncement);
      if (type === 'ADAB') { } else { showNotification('تم إرسال تنبيه الإجازة', 'success'); }
  };

  return (
      <>
        {!isOnline && (
            <div className="bg-darkBrown text-paper text-center text-xs p-1 fixed top-0 left-0 right-0 z-[110] border-b border-secondary">
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
                orgSettings={orgSettings}
                onUpdateOrgSettings={updateOrgSettings}
            />
        ) : appState.currentUser.role === 'TEACHER' ? (
            <TeacherDashboard 
                teacherName={appState.currentUser.name || 'المعلم'}
                teacherId={appState.currentUser.id || 't1'}
                students={students.filter(s => s.teacherId === appState.currentUser.id)}
                allTeachers={teachers} 
                announcements={announcements}
                adabArchive={adabArchive.filter(s => { return true; })}
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
                teachers={teachers}
            />
        ) : (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-y-auto relative font-sans">
              {/* Login View */}
              
              <div className="max-w-md w-full relative z-10 animate-fade-in pb-12">
                <div className="bg-paper p-8 rounded-[40px] shadow-2xl border-2 border-white/50 backdrop-blur-sm relative overflow-hidden">
                   
                   {/* Top decorative element */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-primary/20 rounded-b-full"></div>

                   <Logo title={orgSettings.name} settings={orgSettings} />

                   <div className="text-center mb-8">
                      <h2 className="text-lg font-bold text-darkBrown/80 font-serif">اختر طريقة الدخول للمتابعة</h2>
                   </div>

                   {!showPhoneSetup ? (
                       <div className="space-y-6">
                           {loginView === 'SELECTION' && (
                               <div className="space-y-5">
                                   {/* BUTTON 1: PARENT */}
                                   <button 
                                       onClick={() => { setLoginView('PARENT'); setLoginError(''); }}
                                       className="w-full bg-gradient-to-br from-primary to-primaryDark text-white p-6 rounded-3xl shadow-soft transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center group relative overflow-hidden border border-white/10"
                                   >
                                       {/* Texture */}
                                       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                       
                                       <div className="flex flex-col items-center relative z-10 gap-2">
                                           <h3 className="font-bold text-3xl font-serif">ولي الأمر</h3>
                                           <p className="text-xs text-white/80 opacity-90 tracking-wide">متابعة مستوى الأبناء</p>
                                       </div>
                                       
                                       {/* Decorative Circles */}
                                       <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                                       <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                                   </button>
                                   
                                   {/* BUTTON 2: TEACHER */}
                                   <button 
                                       onClick={() => { setLoginView('TEACHER'); setLoginError(''); }}
                                       className="w-full bg-gradient-to-br from-secondary to-secondaryDark text-white p-6 rounded-3xl shadow-soft transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center group relative overflow-hidden border border-white/10"
                                   >
                                       {/* Texture */}
                                       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                       
                                       <div className="flex flex-col items-center relative z-10 gap-2">
                                           <h3 className="font-bold text-3xl font-serif">المعلم</h3>
                                           <p className="text-xs text-white/80 opacity-90 tracking-wide">إدارة الحلقة والطلاب</p>
                                       </div>

                                        {/* Decorative Circles */}
                                       <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                                       <div className="absolute -left-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                                   </button>

                                   <div className="pt-6 text-center">
                                       <button onClick={() => setLoginView('ADMIN')} className="text-xs text-mutedBrown hover:text-darkBrown font-bold transition flex items-center justify-center gap-1 mx-auto bg-white/50 px-3 py-1 rounded-full">
                                           <span>🔐</span> الدخول للإدارة
                                       </button>
                                       
                                       <div className="mt-8 flex justify-center opacity-40">
                                            <div className="text-center">
                                                <p className="font-serif text-2xl text-darkBrown">{orgSettings.name}</p>
                                                <p className="text-[10px] text-mutedBrown mt-1">وفقكم الله لكل خير</p>
                                            </div>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {/* PARENT LOGIN FORM */}
                           {loginView === 'PARENT' && (
                               <form onSubmit={handleParentLogin} className="space-y-5 animate-slide-up">
                                   <div className="flex items-center mb-6">
                                       <button type="button" onClick={() => setLoginView('SELECTION')} className="bg-texture hover:bg-gray-300 text-darkBrown w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm border border-darkBrown/10">
                                           <span className="text-xl font-bold">➜</span>
                                       </button>
                                       <h3 className="flex-1 text-center font-bold font-serif text-darkBrown text-2xl">دخول ولي الأمر</h3>
                                       <div className="w-10"></div>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-mutedBrown mb-2">اسم الشيخ (المحفظ)</label>
                                       <div className="relative">
                                           <select 
                                           className="w-full p-4 border-2 border-texture rounded-2xl bg-white focus:border-primary focus:ring-0 outline-none transition appearance-none text-darkBrown font-bold text-lg"
                                           value={parentSelectedTeacher}
                                           onChange={(e) => setParentSelectedTeacher(e.target.value)}
                                           >
                                           <option value="">-- اضغط للاختيار --</option>
                                           {teachers.map(t => (
                                               <option key={t.id} value={t.id}>{t.name}</option>
                                           ))}
                                           </select>
                                           <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-mutedBrown text-xs">▼</div>
                                       </div>
                                   </div>
                                   <div>
                                   <label className="block text-xs font-bold text-mutedBrown mb-2">كود الطالب</label>
                                   <input 
                                       type="text"
                                       placeholder="رقم الطالب"
                                       className="w-full p-4 border-2 border-texture rounded-2xl text-center text-xl tracking-widest focus:border-primary focus:ring-0 outline-none transition bg-white text-darkBrown font-serif placeholder:text-gray-300"
                                       value={parentCodeInput}
                                       onChange={(e) => setParentCodeInput(e.target.value)}
                                   />
                                   </div>
                                   {loginError && <p className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{loginError}</p>}
                                   <button type="submit" className="w-full text-xl bg-primary hover:bg-primaryDark text-white font-bold py-4 rounded-2xl shadow-card hover:shadow-lg transition font-serif transform active:scale-95">تسجيل الدخول</button>
                               </form>
                           )}

                           {/* TEACHER LOGIN FORM */}
                           {loginView === 'TEACHER' && (
                               <form onSubmit={handleTeacherLogin} className="space-y-5 animate-slide-up">
                                   <div className="flex items-center mb-6">
                                       <button type="button" onClick={() => setLoginView('SELECTION')} className="bg-texture hover:bg-gray-300 text-darkBrown w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm border border-darkBrown/10">
                                           <span className="text-xl font-bold">➜</span>
                                       </button>
                                       <h3 className="flex-1 text-center font-bold font-serif text-darkBrown text-2xl">دخول المعلم</h3>
                                       <div className="w-10"></div>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-mutedBrown mb-2">اسم المعلم</label>
                                       <div className="relative">
                                           <select 
                                           className="w-full p-4 border-2 border-texture rounded-2xl bg-white focus:border-secondary focus:ring-0 outline-none transition appearance-none text-darkBrown font-bold text-lg"
                                           value={selectedTeacherId}
                                           onChange={(e) => setSelectedTeacherId(e.target.value)}
                                           >
                                           <option value="">-- اضغط للاختيار --</option>
                                           {teachers.map(t => (
                                               <option key={t.id} value={t.id}>{t.name}</option>
                                           ))}
                                           </select>
                                           <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-mutedBrown text-xs">▼</div>
                                       </div>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-mutedBrown mb-2">الرقم السري</label>
                                       <input 
                                           type="password"
                                           className="w-full p-4 border-2 border-texture rounded-2xl text-center focus:border-secondary focus:ring-0 outline-none font-mono bg-white text-darkBrown text-xl placeholder:text-gray-300"
                                           value={teacherCodeInput}
                                           onChange={(e) => setTeacherCodeInput(e.target.value)}
                                           placeholder="******"
                                       />
                                   </div>
                                   {loginError && <p className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{loginError}</p>}
                                   <button type="submit" className="w-full text-xl bg-secondary hover:bg-secondaryDark text-white font-bold py-4 rounded-2xl shadow-card hover:shadow-lg transition font-serif transform active:scale-95" disabled={!selectedTeacherId}>
                                       تسجيل الدخول
                                   </button>
                               </form>
                           )}

                           {/* ADMIN LOGIN */}
                           {loginView === 'ADMIN' && (
                               <form onSubmit={handleAdminLogin} className="space-y-4 animate-slide-up pt-4">
                                   <div className="flex justify-between items-center mb-4">
                                      <h3 className="font-bold text-darkBrown font-serif text-lg">دخول المبرمج</h3>
                                      <button type="button" onClick={() => setLoginView('SELECTION')} className="text-mutedBrown hover:text-darkBrown font-bold text-xs bg-texture px-3 py-1 rounded-full">إلغاء</button>
                                   </div>
                                   <input 
                                       type="password"
                                       placeholder="كلمة المرور"
                                       className="w-full p-3 border-2 border-texture rounded-xl text-center bg-white focus:border-darkBrown focus:outline-none"
                                       value={adminPassword}
                                       onChange={e => setAdminPassword(e.target.value)}
                                   />
                                   {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                                   <Button variant="danger" type="submit" className="w-full py-3 rounded-xl">دخول المسؤول</Button>
                               </form> 
                           )}
                       </div>
                   ) : (
                       <div className="animate-fade-in space-y-6">
                           <div className="text-center">
                                <h3 className="text-xl font-bold mb-2 font-serif text-darkBrown">إكمال البيانات</h3>
                                <p className="text-sm text-mutedBrown">يرجى إدخال رقم الهاتف لمرة واحدة فقط.</p>
                           </div>
                           <form onSubmit={handleCompleteParentProfile} className="space-y-4">
                               <div>
                                   <label className="block text-xs font-bold text-mutedBrown mb-2">رقم هاتف ولي الأمر</label>
                                   <input 
                                       type="tel"
                                       placeholder="01xxxxxxxxx"
                                       className="w-full p-5 border-2 border-texture rounded-2xl text-center text-4xl font-black tracking-[0.2em] text-darkBrown focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition shadow-sm placeholder:text-gray-200 h-20 bg-white"
                                       value={parentPhoneInput}
                                       onChange={(e) => setParentPhoneInput(e.target.value)}
                                   />
                               </div>
                               {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                               <div className="flex flex-col gap-3">
                                   <button type="submit" className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-4 rounded-xl shadow-md transition font-serif text-lg">حفظ ودخول</button>
                                   <button type="button" onClick={handleLogout} className="w-full bg-transparent border-2 border-texture text-mutedBrown font-bold py-3 rounded-xl hover:bg-texture transition">إلغاء</button>
                               </div>
                           </form>
                       </div>
                   )}
                </div>

                {deferredPrompt && (
                  <div className="mt-8 text-center animate-bounce px-4">
                    <Button onClick={handleInstallClick} className="w-full bg-darkBrown hover:bg-black shadow-lg text-white py-4 rounded-xl text-lg font-serif border border-white/20">
                      📲 تثبيت التطبيق
                    </Button>
                  </div>
                )}
              </div>
            </div>
        )}
      </>
  );
};

export default App;