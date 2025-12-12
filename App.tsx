import React, { useState, useEffect, useMemo } from 'react';
import { Student, AppState, UserRole, Teacher, DailyLog, Announcement, QuizItem, AdabSession, QuranAssignment, Grade, AttendanceRecord, MultiSurahDetail, ExamDayDetail } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, DAYS_OF_WEEK, APP_VERSION, SURAH_NAMES, JUZ_LIST, SURAH_DATA, formatSimpleDate, formatTime12Hour, formatDateWithDay } from './constants';
import { firebaseConfig } from './firebaseConfig';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  setDoc,
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase Setup ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تفعيل الحفظ أثناء انقطاع الإنترنت (Offline Persistence)
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) { }

// دالة لتنظيف البيانات من القيم غير المعرفة (undefined) قبل الإرسال لفايربيز
const cleanData = (data: any) => JSON.parse(JSON.stringify(data));
const emptyAssignment: QuranAssignment = { type: 'SURAH', name: SURAH_NAMES[0], ayahFrom: 1, ayahTo: 7, grade: Grade.GOOD, multiSurahs: [] };

// ==========================================
// 🎨 UI COMPONENTS (تصميم الواجهة الاحترافي)
// ==========================================

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline', isLoading?: boolean }> = ({ 
  children, variant = 'primary', isLoading, className = '', disabled, ...props 
}) => {
  const baseStyles = "px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm";
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 border border-white/20",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-slate-200/50",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20 border border-white/20",
    outline: "bg-transparent border-2 border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? "جاري..." : children}
    </button>
  );
};

const TimePicker: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => (
    <div className="relative">
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-center cursor-pointer hover:bg-white" />
    </div>
);

const Card = ({ children, className = "", onClick }: any) => (
    <div onClick={onClick} className={`bg-white rounded-3xl shadow-sm border border-slate-100 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-emerald-100' : ''} ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ title, icon, color = "text-slate-800" }: { title: string, icon: string, color?: string }) => (
    <h3 className={`font-bold ${color} text-lg mb-4 flex items-center gap-2 pb-2 border-b border-slate-50`}>
        <span className="bg-slate-100 p-1.5 rounded-lg text-xl shadow-sm">{icon}</span> {title}
    </h3>
);

const Logo = ({ title, small = false }: { title: string, small?: boolean }) => (
  <div className={`flex flex-col items-center ${small ? 'mb-6' : 'mb-10'} relative z-10 transition-all duration-500`}>
    <div className={`${small ? 'w-16 h-16 text-2xl border-2' : 'w-24 h-24 text-4xl border-4'} bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl mb-4 border-white/50 text-white animate-fade-in`}>🕌</div>
    <h1 className={`${small ? 'text-xl' : 'text-3xl'} font-bold text-white text-center drop-shadow-lg tracking-wide`}>{title}</h1>
    {!small && <p className="text-emerald-100/80 mt-2 text-sm font-light tracking-wider">نظام المتابعة القرآني الذكي</p>}
  </div>
);

const NotificationToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[200] flex items-center gap-3 min-w-[300px] justify-center text-center animate-slide-down backdrop-blur-xl border border-white/20 ${type === 'success' ? 'bg-emerald-900/90 text-white' : 'bg-red-900/90 text-white'}`}>
      <span className="text-xl">{type === 'success' ? '✅' : '⚠️'}</span><span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const TabButton = ({ id, label, icon, isActive, onClick }: any) => (
    <button onClick={onClick} className={`relative px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isActive ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}>
        <span className="text-lg">{icon}</span><span className="text-xs font-bold">{label}</span>
    </button>
);

const AssignmentForm: React.FC<any> = ({ data, onChange, title, colorClass, canRemove, onRemove, hideGrade }) => {
  const isSurah = data.type === 'SURAH';
  const isMulti = data.type === 'MULTI';
  const maxAyahs = useMemo(() => isSurah ? (SURAH_DATA.find(x => x.name === data.name)?.count || 286) : 286, [data.name, isSurah]);
  const ayahOptions = useMemo(() => Array.from({ length: maxAyahs }, (_, i) => i + 1), [maxAyahs]);

  return (
    <div className={`p-5 rounded-2xl border mb-3 relative transition-all ${colorClass} bg-white/60 backdrop-blur-sm shadow-sm`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">📌 {title}</h4>
        {canRemove && <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-[10px] font-bold bg-white px-2 py-1 rounded shadow-sm">حذف</button>}
      </div>
      <div className="flex gap-1 mb-3 bg-white p-1 rounded-xl w-fit shadow-sm border border-slate-100">
        {['SURAH', 'RANGE', 'JUZ', 'MULTI'].map(type => (
          <button key={type} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${data.type === type ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => onChange('type', type)}>
            {type === 'SURAH' ? 'سورة' : type === 'RANGE' ? 'نطاق' : type === 'JUZ' ? 'جزء' : 'متعدد'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {data.type === 'JUZ' ? (
           <select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" value={data.juzNumber || 1} onChange={(e) => { onChange('juzNumber', parseInt(e.target.value)); onChange('name', JUZ_LIST[parseInt(e.target.value) - 1]); }}>{JUZ_LIST.map((j, i) => <option key={i} value={i+1}>{j}</option>)}</select>
        ) : isMulti ? (
            <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="space-y-2 mb-3">{(data.multiSurahs || []).map((item: any, idx: number) => (<div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span><select className="flex-1 p-1 text-sm bg-transparent outline-none font-bold text-slate-700" value={item.name} onChange={(e) => {const l=[...data.multiSurahs]; l[idx].name=e.target.value; onChange('multiSurahs', l)}}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select>{!hideGrade && <select className="w-20 p-1 text-[10px] bg-white rounded border border-slate-200 outline-none font-bold text-slate-500" value={item.grade||''} onChange={(e) => {const l=[...data.multiSurahs]; l[idx].grade=e.target.value; onChange('multiSurahs', l)}}><option value="">التقدير</option>{Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}</select>}<button onClick={() => {const l=[...data.multiSurahs]; l.splice(idx,1); onChange('multiSurahs', l)}} className="text-red-300 hover:text-red-500 font-bold px-1">×</button></div>))}</div>
                <button onClick={() => onChange('multiSurahs', [...(data.multiSurahs||[]), { name: SURAH_NAMES[0] }])} className="w-full py-2 text-xs border border-dashed border-slate-300 text-slate-400 rounded-lg hover:bg-white hover:border-emerald-400 hover:text-emerald-600 transition font-bold">+ سورة أخرى</button>
            </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
             <div className="col-span-2 sm:col-span-1"><label className="text-[10px] font-bold text-slate-400 mb-1 block">من</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none" value={data.name} onChange={(e) => onChange('name', e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             {data.type === 'RANGE' && (<div className="col-span-2 sm:col-span-1"><label className="text-[10px] font-bold text-slate-400 mb-1 block">إلى</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none" value={data.endName || data.name} onChange={(e) => onChange('endName', e.target.value)}>{SURAH_NAMES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>)}
             {isSurah && (<div className="col-span-2 flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200"><div className="flex-1"><select className="w-full bg-transparent text-center font-bold text-slate-700 outline-none text-sm" value={data.ayahFrom} onChange={(e) => onChange('ayahFrom', parseInt(e.target.value))}>{ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}</select></div><span className="text-slate-300 font-bold">➜</span><div className="flex-1"><select className="w-full bg-transparent text-center font-bold text-slate-700 outline-none text-sm" value={data.ayahTo} onChange={(e) => onChange('ayahTo', parseInt(e.target.value))}>{ayahOptions.map(n => <option key={n} value={n}>{n}</option>)}</select></div></div>)}
          </div>
        )}
        {!hideGrade && !isMulti && (<div><label className="text-[10px] font-bold text-slate-400 mb-1 block">التقييم</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-100" value={data.grade} onChange={(e) => onChange('grade', e.target.value)}>{Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}</select></div>)}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all`}>
        <div className={`absolute right-0 top-0 w-1.5 h-full ${color}`}></div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color.replace('bg-', 'text-').replace('500', '600')} bg-slate-50 group-hover:scale-110 transition-transform`}>{icon}</div>
        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p><p className="text-2xl font-black text-slate-800">{value}</p></div>
    </div>
);

const StatBox = ({ label, val, color }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-all duration-300 group">
        <h3 className="text-4xl font-black text-slate-800 mb-2 group-hover:scale-110 transition-transform">{val}</h3>
        <p className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</p>
    </div>
);

// ==========================================
// 🚀 MAIN APPLICATION
// ==========================================

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adabArchive, setAdabArchive] = useState<AdabSession[]>([]);
  const [organizationName, setOrganizationName] = useState(() => localStorage.getItem('muhaffiz_org_name') || "دار التوحيد");
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // تشخيص الاتصال
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');
  const [detailedError, setDetailedError] = useState('');

  // حالة لوحات التحكم الداخلية
  const [activeTab, setActiveTab] = useState<'LIST'|'ADD'|'ADAB'|'ATTENDANCE'|'STATS'|'ANNOUNCEMENTS'|'DELETE'>('LIST');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentTab, setStudentTab] = useState<'LOG'|'PLAN'|'ARCHIVE'|'CALC'|'SCHEDULE'|'FEES'>('LOG');
  const [sortMethod, setSortMethod] = useState<'ALPHABETICAL' | 'CODE'>('ALPHABETICAL');
  const [activeParentTab, setActiveParentTab] = useState<'HOME'|'LOGS'>('HOME');
  const [activeAdminView, setActiveAdminView] = useState<'TEACHERS' | 'SETTINGS'>('TEACHERS');

  // حقول الإدخال
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherCode, setNewTeacherCode] = useState('');
  
  // حقول السجل
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([{ id: '1', arrival: '16:00', departure: '18:00' }]);
  const [jadeed, setJadeed] = useState<QuranAssignment>({ ...emptyAssignment });
  const [murajaahList, setMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]);
  const [nextJadeed, setNextJadeed] = useState<QuranAssignment>({ ...emptyAssignment, grade: Grade.GOOD });
  const [nextMurajaahList, setNextMurajaahList] = useState<QuranAssignment[]>([{ ...emptyAssignment }]);
  const [notes, setNotes] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => setNotification({ message, type });

  // --- الاتصال ---
  useEffect(() => {
    const signIn = async () => {
      try {
        await signInAnonymously(auth);
        setConnectionStatus('CONNECTED');
      } catch (error: any) {
        if (error.code !== 'auth/network-request-failed') {
             setConnectionStatus('ERROR');
             setDetailedError(error.message);
        }
      }
    };
    signIn();
    onAuthStateChanged(auth, (user) => { if(user) setConnectionStatus('CONNECTED'); });
    window.addEventListener('online', () => setIsOnline(true)); 
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  // --- جلب البيانات ---
  useEffect(() => {
    const qStudents = query(collection(db, "students"));
    const unsubS = onSnapshot(qStudents, { includeMetadataChanges: true }, (snap) => setStudents(snap.docs.map(d => d.data() as Student)));
    const unsubT = onSnapshot(query(collection(db, "teachers")), (snap) => setTeachers(snap.docs.map(d => d.data() as Teacher)));
    const unsubA = onSnapshot(query(collection(db, "announcements")), (snap) => {
        const d = snap.docs.map(doc => doc.data() as Announcement);
        d.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAnnouncements(d);
    });
    return () => { unsubS(); unsubT(); unsubA(); };
  }, []);

  useEffect(() => { localStorage.setItem('muhaffiz_org_name', organizationName); document.title = `${organizationName}`; }, [organizationName]);

  // PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const handleInstallClick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); }};

  const [appState, setAppState] = useState<AppState>({ students, teachers, announcements, adabArchive, currentUser: { role: 'GUEST' } });
  useEffect(() => setAppState(prev => ({ ...prev, students, teachers, announcements, adabArchive })), [students, teachers, announcements, adabArchive]);

  // Login Logic
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

  const handleTeacherLogin = (e: React.FormEvent) => { e.preventDefault(); const t = teachers.find(x => x.id === selectedTeacherId); if(t && t.loginCode === normalizeArabicNumbers(teacherCodeInput)) { setAppState(prev => ({...prev, currentUser: { role: 'TEACHER', id: t.id, name: t.name }})); setLoginError(''); } else { setLoginError('بيانات الدخول غير صحيحة'); } };
  const handleParentLogin = (e: React.FormEvent) => { e.preventDefault(); const cleanCode = normalizeArabicNumbers(parentCodeInput.trim()); const s = students.find(st => st.parentCode === cleanCode && st.teacherId === parentSelectedTeacher); if(s) { if(s.parentPhone) { setAppState(prev => ({...prev, currentUser: { role: 'PARENT', id: s.id, name: s.name }})); setLoginError(''); } else { setPendingStudentId(s.id); setShowPhoneSetup(true); setLoginError(''); } } else { setLoginError('الكود غير صحيح أو المعلم غير صحيح'); } };
  const handleCompleteParentProfile = async (e: React.FormEvent) => { e.preventDefault(); const phone = normalizeArabicNumbers(parentPhoneInput); if(pendingStudentId && phone.length >= 10) { const s = students.find(x => x.id === pendingStudentId); if(s) { await setDoc(doc(db, "students", s.id), cleanData({ ...s, parentPhone: phone })); setAppState(prev => ({...prev, currentUser: { role: 'PARENT', id: s.id, name: s.name }})); setShowPhoneSetup(false); } } else { setLoginError('رقم هاتف غير صحيح'); } };
  const handleAdminLogin = (e: React.FormEvent) => { e.preventDefault(); if(adminPassword === '456888') { setAppState(prev => ({...prev, currentUser: { role: 'ADMIN', name: 'المبرمج' }})); setLoginError(''); } else { setLoginError('كلمة المرور خطأ'); } };
  const handleLogout = () => { setAppState(prev => ({...prev, currentUser: { role: 'GUEST' }})); setLoginView('SELECTION'); setSelectedStudentId(null); setLoginError(''); };

  // --- CRUD WRAPPERS ---
  const updateStudent = async (s: Student) => { try { await setDoc(doc(db, "students", s.id), cleanData(s)); showNotification('تم الحفظ بنجاح ✅', 'success'); } catch(e) { showNotification('خطأ في الحفظ', 'error'); } };
  const addStudent = async (name: string, code: string) => { const s: Student = { id: 's_'+Date.now(), teacherId: appState.currentUser.id!, name, parentCode: code, logs: [], payments: [], weeklySchedule: DAYS_OF_WEEK.map(d => ({day: d, events: []})) }; await updateStudent(s); setNewStudentName(''); setNewStudentCode(''); };
  const deleteStudent = async (id: string) => { if(window.confirm('حذف؟')) await deleteDoc(doc(db, "students", id)); };
  const addTeacher = async (name: string, code: string) => { const t: Teacher = { id: 't_'+Date.now(), name, loginCode: code }; await setDoc(doc(db, "teachers", t.id), cleanData(t)); setNewTeacherName(''); setNewTeacherCode(''); showNotification('تمت الإضافة'); };
  const deleteTeacher = async (id: string) => { if(window.confirm('حذف؟')) await deleteDoc(doc(db, "teachers", id)); };

  // --- Teacher Dashboard Specific ---
  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const sortedStudents = useMemo(() => {
      const list = students.filter(s => s.teacherId === appState.currentUser.id);
      if (sortMethod === 'CODE') return list.sort((a, b) => a.parentCode.localeCompare(b.parentCode));
      return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [students, appState.currentUser.id, sortMethod]);

  const handleOpenStudent = (s: Student) => {
      setSelectedStudentId(s.id); setStudentTab('LOG');
      const todayStr = new Date().toDateString(); const existingLog = s.logs.find(l => new Date(l.date).toDateString() === todayStr);
      if(existingLog && !existingLog.isAbsent && !existingLog.isAdab) { setCurrentLogId(existingLog.id); setJadeed(existingLog.jadeed || { ...emptyAssignment }); setMurajaahList(existingLog.murajaah || []); setNotes(existingLog.notes || ''); setAttendanceRecords(existingLog.attendance || [{ id: '1', arrival: '16:00', departure: '18:00' }]); } 
      else { setCurrentLogId(null); if (s.nextPlan) { setJadeed({ ...s.nextPlan.jadeed, grade: Grade.GOOD }); setMurajaahList(s.nextPlan.murajaah?.map(m => ({...m, grade: Grade.VERY_GOOD})) || []); } else { setJadeed({ ...emptyAssignment }); setMurajaahList([{ ...emptyAssignment, grade: Grade.VERY_GOOD }]); } setNotes(''); setAttendanceRecords([{ id: '1', arrival: '16:00', departure: '18:00' }]); }
      if(s.nextPlan) { setNextJadeed(s.nextPlan.jadeed); setNextMurajaahList(s.nextPlan.murajaah || []); } else { setNextJadeed({ ...emptyAssignment }); setNextMurajaahList([{ ...emptyAssignment }]); }
  };

  const handleSaveLog = () => {
      if(!selectedStudent) return;
      const logData = { attendance: attendanceRecords, jadeed, murajaah: murajaahList, notes, seenByParent: false, isAbsent: false, isAdab: false };
      let newLogs = [...selectedStudent.logs];
      if(currentLogId) newLogs = newLogs.map(l => l.id === currentLogId ? { ...l, ...logData } : l);
      else newLogs = [{ id: 'log_'+Date.now(), date: new Date().toISOString(), teacherId: appState.currentUser.id!, teacherName: appState.currentUser.name!, ...logData }, ...newLogs];
      updateStudent({ ...selectedStudent, logs: newLogs, nextPlan: { jadeed: nextJadeed, murajaah: nextMurajaahList } });
      if(!currentLogId) setCurrentLogId(newLogs[0].id);
  };

  const handleSendWhatsApp = () => {
      handleSaveLog();
      if(!selectedStudent?.parentPhone) { showNotification('لا يوجد رقم هاتف', 'error'); return; }
      const formatAss = (a: QuranAssignment) => a.type === 'MULTI' ? 'سور متعددة' : a.name;
      const msg = `*🕌 تقرير متابعة الطالب - دار التوحيد 🕌*\n\n👤 *الاسم:* ${selectedStudent.name}\n📅 *التاريخ:* ${formatSimpleDate(new Date().toISOString())}\n\n✅ *الحفظ الجديد:* ${formatAss(jadeed)} (${jadeed.grade})\n🔄 *المراجعة:* ${murajaahList.map(m=>formatAss(m)).join('، ')}\n\n📝 *الواجب القادم:*\n📌 حفظ: ${formatAss(nextJadeed)}\n📌 مراجعة: ${nextMurajaahList.map(m=>formatAss(m)).join('، ')}\n\n🌷 *نسأل الله أن يجعله من أهل القرآن.*`;
      window.open(`https://wa.me/2${selectedStudent.parentPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- RENDER ---
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans text-gray-900 overflow-x-hidden selection:bg-emerald-200">
        {!isOnline && <div className="bg-gray-800/90 backdrop-blur text-white text-center text-xs p-1.5 fixed top-0 w-full z-[200] font-medium tracking-wide shadow-md">📡 وضع الأوفلاين (يتم الحفظ تلقائياً)</div>}
        {notification && <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

        {appState.currentUser.role === 'GUEST' ? (
            <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4 py-6">
                <div className="fixed inset-0 bg-gradient-to-tr from-emerald-900 via-emerald-800 to-slate-900 z-0"></div>
                <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 z-0 pointer-events-none"></div>
                <div className="w-full max-w-md relative z-10">
                    <Logo title={organizationName} />
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-black/5">
                        {!showPhoneSetup && loginView !== 'SELECTION' && (
                             <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">{loginView === 'PARENT' ? 'دخول ولي الأمر' : loginView === 'TEACHER' ? 'دخول المعلم' : 'دخول المسؤول'}</h3><button onClick={() => { setLoginView('SELECTION'); setLoginError(''); }} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow">عودة ➜</button></div>
                        )}
                        <div className="p-8">
                            {!showPhoneSetup ? (
                                <>
                                    {loginView === 'SELECTION' && (
                                        <div className="space-y-4">
                                            <p className="text-center text-gray-500 mb-6 font-medium text-sm">اختر طريقة الدخول للمتابعة</p>
                                            <button onClick={() => { setLoginView('PARENT'); setLoginError(''); }} className="w-full bg-gradient-to-r from-emerald-50 to-white hover:from-emerald-100 hover:to-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group"><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">👨‍👩‍👧‍👦</div><div className="text-right flex-1"><h3 className="font-bold text-gray-800 group-hover:text-emerald-800">ولي الأمر</h3><p className="text-xs text-gray-500">متابعة مستوى الأبناء</p></div><span className="text-gray-300 group-hover:text-emerald-500">➜</span></button>
                                            <button onClick={() => { setLoginView('TEACHER'); setLoginError(''); }} className="w-full bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group"><div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">👳‍♂️</div><div className="text-right flex-1"><h3 className="font-bold text-gray-800 group-hover:text-blue-800">المعلم</h3><p className="text-xs text-gray-500">إدارة الحلقة والطلاب</p></div><span className="text-gray-300 group-hover:text-blue-500">➜</span></button>
                                            <div className="pt-6 text-center"><button onClick={() => setLoginView('ADMIN')} className="text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors">الدخول للإدارة</button></div>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {loginView === 'PARENT' && (<form onSubmit={handleParentLogin} className="space-y-5 animate-fade-in"><div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">المعلم</label><div className="relative"><select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none font-bold text-gray-700" value={parentSelectedTeacher} onChange={(e) => setParentSelectedTeacher(e.target.value)}><option value="">اختر اسم الشيخ...</option>{teachers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div></div></div><div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">كود الطالب</label><input type="text" placeholder="أدخل الكود هنا" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-center text-lg font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-sm" value={parentCodeInput} onChange={(e) => setParentCodeInput(e.target.value)} /></div>{loginError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 text-center animate-shake">{loginError}</div>}<Button type="submit" className="w-full py-3.5 text-base font-bold shadow-lg shadow-emerald-500/20">تسجيل الدخول</Button></form>)}
                                        {loginView === 'TEACHER' && (<form onSubmit={handleTeacherLogin} className="space-y-5 animate-fade-in"><div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">الاسم</label><div className="relative"><select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none font-bold text-gray-700" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}><option value="">اختر اسمك...</option>{teachers.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</div></div></div><div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">الرقم السري</label><input type="password" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center text-lg font-mono tracking-widest placeholder:text-sm" value={teacherCodeInput} onChange={(e) => setTeacherCodeInput(e.target.value)} placeholder="******" /></div>{loginError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 text-center animate-shake">{loginError}</div>}<Button variant="secondary" type="submit" className="w-full py-3.5 text-base font-bold shadow-lg shadow-blue-500/20" disabled={!selectedTeacherId}>دخول</Button></form>)}
                                        {loginView === 'ADMIN' && (<form onSubmit={handleAdminLogin} className="space-y-5 animate-fade-in"><div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">كلمة المرور</label><input type="password" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 outline-none transition-all text-center" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} /></div>{loginError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 text-center animate-shake">{loginError}</div>}<Button variant="danger" type="submit" className="w-full py-3.5 font-bold shadow-lg">دخول</Button></form>)}
                                    </div>
                                </>
                            ) : (
                                <div className="animate-fade-in text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">👋</div><h3 className="text-xl font-bold text-gray-800 mb-2">مرحباً بك لأول مرة</h3><p className="text-sm text-gray-500 mb-6 leading-relaxed">لتسهيل التواصل، يرجى تسجيل رقم الواتساب الخاص بولي الأمر لمرة واحدة.</p><form onSubmit={async (e) => { e.preventDefault(); const phone = normalizeArabicNumbers(parentPhoneInput); if(pendingStudentId && phone.length >= 10) { const s = students.find(x => x.id === pendingStudentId); if(s) { await updateStudent({ ...s, parentPhone: phone }); setAppState(prev => ({...prev, currentUser: { role: 'PARENT', id: s.id, name: s.name }})); setShowPhoneSetup(false); } } else { setLoginError('رقم هاتف غير صحيح'); } }} className="space-y-5"><div className="relative"><input type="tel" placeholder="01xxxxxxxxx" className="w-full p-4 border-2 border-emerald-100 rounded-2xl text-center text-2xl font-black tracking-widest text-emerald-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all shadow-inner bg-emerald-50/30" value={parentPhoneInput} onChange={(e) => setParentPhoneInput(e.target.value)} /><span className="absolute top-2 right-4 text-[10px] text-emerald-600 font-bold uppercase">رقم الموبايل</span></div>{loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}<Button type="submit" className="w-full py-3.5 text-lg font-bold shadow-xl shadow-emerald-500/30">حفظ ودخول 🚀</Button><button type="button" onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 font-bold">إلغاء</button></form></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : appState.currentUser.role === 'ADMIN' ? (
             <div className="relative z-10">
                 <div className="bg-slate-900 text-white p-8 pb-32 shadow-xl relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div><div className="flex justify-between items-center mb-10 relative z-10"><h1 className="text-3xl font-bold tracking-tight">لوحة الإدارة 🛠️</h1><button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition backdrop-blur-md">خروج</button></div><div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto relative z-10"><StatBox label="المعلمون" val={teachers.length} color="text-blue-500" /><StatBox label="الطلاب" val={students.length} color="text-emerald-500" /></div></div>
                 <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-10 pb-20"><div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden min-h-[500px]"><div className="flex border-b border-slate-100 p-2"><button onClick={() => setActiveAdminView('TEACHERS')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeAdminView === 'TEACHERS' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>المحفظين</button><button onClick={() => setActiveAdminView('SETTINGS')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeAdminView === 'SETTINGS' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>الإعدادات</button></div><div className="p-8">{activeAdminView === 'TEACHERS' && (<div className="space-y-8 animate-fade-in"><div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">✨ إضافة محفظ جديد</h3><div className="space-y-3"><input className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm" placeholder="الاسم" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} /><input className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition font-mono text-center tracking-widest text-sm" placeholder="كود الدخول (4 أرقام)" value={newTeacherCode} onChange={e => setNewTeacherCode(e.target.value)} /><Button onClick={() => { if(newTeacherName && newTeacherCode) addTeacher(newTeacherName, newTeacherCode); }} className="w-full py-4 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-2xl font-bold">إضافة +</Button></div></div><div className="space-y-3">{teachers.map(t => (<div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition group hover:border-slate-200"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl shadow-sm">👳‍♂️</div><div><p className="font-bold text-slate-800">{t.name}</p><p className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit mt-1">كود: {t.loginCode}</p></div></div><button onClick={() => deleteTeacher(t.id)} className="text-red-300 hover:text-red-600 bg-red-50 p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100">🗑️</button></div>))}</div></div>)}{activeAdminView === 'SETTINGS' && (<div className="space-y-6 animate-fade-in text-center py-10"><label className="block text-sm font-bold text-slate-500">اسم الدار / المؤسسة</label><input className="w-full p-5 text-2xl font-black text-center border-2 border-slate-100 rounded-3xl focus:border-slate-800 outline-none transition bg-slate-50 focus:bg-white text-slate-800" value={organizationName} onChange={e => setOrganizationName(e.target.value)} /><p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl inline-block border border-slate-100">سيظهر هذا الاسم في أعلى جميع الشاشات.</p></div>)}</div></div></div>
             </div>
        ) : appState.currentUser.role === 'TEACHER' ? (
             <div className="relative z-10">
                 {/* HEADER */}
                 <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm px-4 py-3"><div className="max-w-2xl mx-auto flex justify-between items-center">{!selectedStudentId ? (<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-md border-2 border-white ring-2 ring-emerald-50">👳‍♂️</div><div><h1 className="font-bold text-slate-800 text-sm">أهلاً، {appState.currentUser.name}</h1><p className="text-[10px] text-slate-500 font-medium">لوحة المعلم</p></div></div>) : (<div className="flex items-center gap-3 w-full animate-slide-right"><button onClick={() => setSelectedStudentId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-600">➜</button><div><h1 className="font-bold text-slate-800 text-lg">{selectedStudent?.name}</h1><span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">كود: {selectedStudent?.parentCode}</span></div></div>)}{!selectedStudentId && (<button onClick={handleLogout} className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition">خروج 🚪</button>)}</div></div>
                 {/* CONTENT */}
                 <div className="max-w-2xl mx-auto p-4">
                     {!selectedStudentId ? (
                         <>
                             <div className="flex overflow-x-auto gap-3 pb-4 mb-2 no-scrollbar px-1"><TabButton id="LIST" label="الطلاب" icon="👥" isActive={activeTab==='LIST'} onClick={()=>setActiveTab('LIST')} /><TabButton id="ADD" label="إضافة" icon="➕" isActive={activeTab==='ADD'} onClick={()=>setActiveTab('ADD')} /><TabButton id="ATTENDANCE" label="الغياب" icon="📅" isActive={activeTab==='ATTENDANCE'} onClick={()=>setActiveTab('ATTENDANCE')} /></div>
                             {activeTab === 'LIST' && (
                                 <div className="animate-fade-in space-y-3">{sortedStudents.length === 0 ? (<div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300"><p className="text-slate-400 text-sm">لا يوجد طلاب بعد</p><button onClick={()=>setActiveTab('ADD')} className="text-emerald-600 font-bold text-sm mt-2">+ أضف طلابك</button></div>) : sortedStudents.map(s => { const hasLog = s.logs.some(l => new Date(l.date).toDateString() === new Date().toDateString()); return (<Card key={s.id} onClick={() => handleOpenStudent(s)} className="p-4 flex items-center gap-4 cursor-pointer group border-l-4 border-l-transparent hover:border-l-emerald-500"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${hasLog ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-50' : 'bg-slate-100 text-slate-500'}`}>{s.name.charAt(0)}</div><div className="flex-1"><h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{s.name}</h3><p className="text-xs text-slate-400 font-mono">كود: {s.parentCode}</p></div>{hasLog ? <span className="text-emerald-500 text-xl">✅</span> : <span className="text-slate-200 text-xl group-hover:text-slate-400">➜</span>}</Card>); })}</div>
                             )}
                             {activeTab === 'ADD' && (<Card className="p-6 animate-slide-up"><SectionTitle title="تسجيل طالب جديد" icon="👤" /><div className="space-y-4"><div><label className="text-xs font-bold text-slate-500 mb-1 block">الاسم الثلاثي</label><input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} placeholder="اسم الطالب..." /></div><div><label className="text-xs font-bold text-slate-500 mb-1 block">كود ولي الأمر</label><input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition font-mono text-center tracking-widest" placeholder="مثال: 105" value={newStudentCode} onChange={e=>setNewStudentCode(e.target.value)} /></div><Button onClick={() => { if(newStudentName && newStudentCode) addStudent(newStudentName, newStudentCode); }} className="w-full py-3.5 shadow-lg shadow-emerald-200 mt-2 text-lg">إضافة للقائمة ✨</Button></div></Card>)}
                         </>
                     ) : (
                         <div className="animate-slide-up pb-20">
                             <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-x-auto no-scrollbar sticky top-[70px] z-30">{[{id:'LOG',l:'اليوم'}, {id:'PLAN',l:'الخطة'}, {id:'ARCHIVE',l:'السجل'}].map(t => (<button key={t.id} onClick={() => setStudentTab(t.id as any)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap px-4 ${studentTab === t.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{t.l}</button>))}</div>
                             {studentTab === 'LOG' && (
                                 <div className="space-y-6">
                                     <Card className="p-5 border-l-4 border-l-blue-500"><SectionTitle title="الحضور والانصراف" icon="⏰" color="text-blue-900" />{attendanceRecords.map((rec, i) => (<div key={rec.id} className="flex gap-4 items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100"><div className="flex-1"><label className="text-[10px] font-bold text-blue-400 mb-1 block">وقت الحضور</label><TimePicker value={rec.arrival} onChange={(v) => {const n=[...attendanceRecords]; n[i].arrival=v; setAttendanceRecords(n)}} /></div><span className="text-blue-300 font-bold">➜</span><div className="flex-1"><label className="text-[10px] font-bold text-blue-400 mb-1 block">وقت الانصراف</label><TimePicker value={rec.departure||''} onChange={(v) => {const n=[...attendanceRecords]; n[i].departure=v; setAttendanceRecords(n)}} /></div></div>))}</Card>
                                     <AssignmentForm title="الحفظ الجديد" data={jadeed} onChange={(f: any, v: any) => setJadeed({...jadeed, [f]: v})} colorClass="border-emerald-200 bg-emerald-50/20" />
                                     <div className="relative"><div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><span className="bg-amber-100 p-1 rounded">🔄</span> المراجعة</h3><button onClick={() => setMurajaahList([...murajaahList, { ...emptyAssignment, grade: Grade.VERY_GOOD }])} className="text-[10px] bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 shadow-sm transition font-bold text-slate-600">+ إضافة</button></div>{murajaahList.map((m, i) => (<AssignmentForm key={i} title={`مراجعة ${i+1}`} data={m} onChange={(f:any,v:any)=>{const l=[...murajaahList];l[i]={...l[i],[f]:v};setMurajaahList(l)}} colorClass="border-amber-200 bg-amber-50/20" canRemove onRemove={()=>{setMurajaahList(murajaahList.filter((_,x)=>x!==i))}} />))}</div>
                                     <Card className="p-4"><label className="text-xs font-bold text-slate-400 mb-2 block">ملاحظات / رسالة لولي الأمر</label><textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-purple-400 outline-none h-24 mb-3" placeholder="اكتب ملاحظاتك..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea></Card>
                                     <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto flex gap-3 z-50"><button onClick={handleSaveLog} className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-300 hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-700/50 backdrop-blur-md"><span>💾</span> حفظ</button>{selectedStudent?.parentPhone && (<button onClick={() => { handleSaveLog(); window.open(`https://wa.me/2${selectedStudent.parentPhone}`, '_blank'); }} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-green-200 hover:shadow-green-300 transition flex items-center justify-center gap-2 border-t border-white/20"><span>📱</span> حفظ وإرسال واتساب</button>)}</div><div className="h-16"></div> 
                                 </div>
                             )}
                             {studentTab === 'PLAN' && (
                                 <Card className="p-6 border-t-4 border-t-purple-500"><SectionTitle title="واجب المرة القادمة" icon="📅" color="text-purple-900" /><p className="text-xs text-purple-600/80 mb-6 bg-purple-50 p-3 rounded-xl border border-purple-100 leading-relaxed">ما تحدده هنا سيظهر تلقائياً في خانة "الحفظ الجديد" في المرة القادمة.</p><AssignmentForm title="حفظ قادم" data={nextJadeed} onChange={(f:any, v:any) => setNextJadeed({...nextJadeed, [f]: v})} colorClass="border-purple-200 bg-purple-50/20" hideGrade />{nextMurajaahList.map((m, i) => (<AssignmentForm key={i} title={`مراجعة قادمة ${i+1}`} data={m} onChange={(f:any,v:any)=>{const l=[...nextMurajaahList];l[i]={...l[i],[f]:v};setNextMurajaahList(l)}} colorClass="border-purple-100 bg-white" hideGrade canRemove onRemove={()=>{setNextMurajaahList(nextMurajaahList.filter((_,x)=>x!==i))}} />))}<button onClick={() => setNextMurajaahList([...nextMurajaahList, {...emptyAssignment}])} className="w-full py-3 mt-2 border border-dashed border-purple-200 rounded-xl text-purple-400 text-xs font-bold hover:bg-purple-50 transition">+ إضافة مراجعة أخرى</button><Button onClick={handleSaveLog} className="w-full mt-6 py-3.5 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">حفظ الخطة 💾</Button></Card>
                             )}
                         </div>
                     )}
                 </div>
             </div>
        ) : appState.currentUser.role === 'PARENT' ? (
             <div className="relative z-10">
                 {(() => {
                     const student = students.find(s => s.id === appState.currentUser.id)!;
                     const lastLog = student.logs[0];
                     const totalPresent = student.logs.filter(l => !l.isAbsent).length;
                     const totalAbsent = student.logs.filter(l => l.isAbsent).length;
                     return (
                         <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
                             <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 shadow-sm flex justify-between items-center border-b border-slate-100"><div><h1 className="font-bold text-lg text-slate-800">{student.name}</h1><span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">كود: {student.parentCode}</span></div><button onClick={handleLogout} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition">↪️</button></div>
                             <div className="p-4 max-w-lg mx-auto space-y-6">
                                 {activeParentTab === 'HOME' && (<div className="space-y-6 animate-slide-up"><div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden"><div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div><div className="relative z-10"><p className="text-emerald-100 text-xs font-medium mb-1 tracking-wide">آخر نشاط مسجل</p>{lastLog ? (<div><h2 className="text-3xl font-bold mb-3">{formatSimpleDate(lastLog.date)}</h2><div className={`flex items-center gap-2 text-sm w-fit px-4 py-1.5 rounded-full backdrop-blur-md font-bold ${lastLog.isAbsent ? 'bg-red-500/20 text-red-100 border border-red-500/30' : 'bg-emerald-400/20 text-emerald-50 border border-emerald-400/30'}`}>{lastLog.isAbsent ? '❌ غياب' : '✅ تم التسميع'}</div></div>) : <p className="text-lg font-bold opacity-80">لا يوجد سجلات بعد</p>}</div></div><div className="grid grid-cols-2 gap-3"><StatCard label="أيام الحضور" value={totalPresent} color="bg-blue-500" icon="📅" /><StatCard label="أيام الغياب" value={totalAbsent} color="bg-red-500" icon="🚫" /></div></div>)}
                                 {activeParentTab === 'LOGS' && (<div className="space-y-4 animate-slide-up"><h3 className="font-bold text-slate-700 px-2 text-sm">سجل المتابعة اليومي</h3>{student.logs.length === 0 ? <p className="text-center text-slate-400 py-10 text-sm">السجل فارغ</p> : student.logs.map(log => (<div key={log.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-md transition-all"><div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-50"><div className="flex items-center gap-3"><div className="bg-slate-50 p-2.5 rounded-xl text-center min-w-[50px]"><span className="block text-lg font-bold text-slate-700 leading-none">{new Date(log.date).getDate()}</span><span className="block text-[9px] font-bold text-slate-400 uppercase">{new Date(log.date).toLocaleDateString('en-US',{month:'short'})}</span></div><div><p className="font-bold text-sm text-slate-800">{formatSimpleDate(log.date)}</p><p className="text-[10px] text-slate-400 font-medium">{log.teacherName}</p></div></div>{log.isAbsent ? <span className="bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-red-100">غياب</span> : <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-100">حضور</span>}</div>{!log.isAbsent && !log.isAdab && (<div className="grid grid-cols-2 gap-3"><div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-50"><p className="text-[9px] text-emerald-600 font-bold mb-1 uppercase tracking-wide">الحفظ الجديد</p><p className="text-sm font-bold text-slate-700 truncate">{log.jadeed?.name}</p><span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-emerald-100 text-emerald-600 mt-1 inline-block font-bold shadow-sm">{log.jadeed?.grade}</span></div><div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-50"><p className="text-[9px] text-amber-600 font-bold mb-1 uppercase tracking-wide">المراجعة</p>{log.murajaah?.map((m,i) => (<div key={i} className="flex justify-between items-center text-sm font-bold text-slate-700 mb-1 last:mb-0"><span className="truncate max-w-[80px]">{m.name}</span><span className="text-[9px] text-amber-600 font-normal">({m.grade})</span></div>))}</div></div>)}{log.notes && <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl italic border border-slate-100 leading-relaxed">"{log.notes}"</div>}</div>))}</div>)}
                             </div>
                             <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-2 flex justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">{[{id:'HOME',l:'الرئيسية',i:'🏠'},{id:'LOGS',l:'السجل',i:'📋'}].map((item) => (<button key={item.id} onClick={() => setActiveParentTab(item.id as any)} className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeParentTab === item.id ? 'text-emerald-600 bg-emerald-50 -translate-y-2 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><span className="text-xl">{item.i}</span><span className="text-[9px] font-bold">{item.l}</span></button>))}</div>
                         </div>
                     );
                 })()}
             </div>
        )}
      </div>
  );
};

export default App;