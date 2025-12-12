import React, { useState, useEffect } from 'react';
import { Student, AppState, Teacher, Announcement, AdabSession } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, DAYS_OF_WEEK } from './constants';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Button } from './components/Button';
// استيراد دوال قاعدة البيانات
import { 
  getStudentsFromDB, saveStudentToDB, deleteStudentFromDB,
  getTeachersFromDB, saveTeacherToDB, deleteTeacherFromDB,
  getAnnouncementsFromDB, saveAnnouncementToDB, deleteAnnouncementFromDB,
  getAdabFromDB, saveAdabToDB, deleteAdabFromDB,
  getOrgNameFromDB, saveOrgNameToDB
} from './services/firestore';

// --- VISUAL COMPONENTS ---

const LogoHeader = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center mb-8 animate-fade-in">
    <div className="mb-4 relative">
        <div className="text-6xl filter drop-shadow-md">🕌</div>
    </div>
    <h1 className="text-4xl font-black text-[#3f4f24] text-center mb-1 drop-shadow-sm">{title}</h1>
    <p className="text-[#8b7e60] text-lg font-bold">نظام المتابعة القرآني الذكي</p>
  </div>
);

const SelectionCard = ({ title, subtitle, icon, colorTheme, onClick }: any) => {
    const bgClass = colorTheme === 'olive' 
        ? "bg-gradient-to-r from-[#3f4f24] to-[#556b2f] text-white border-[#2f3d1b]" 
        : "bg-gradient-to-r from-[#c5a059] to-[#d4af37] text-white border-[#b08d4b]";
    const iconBg = colorTheme === 'olive' ? "bg-[#ffffff]/20" : "bg-[#ffffff]/30";
    return (
        <button onClick={onClick} className={`w-full mb-4 p-4 rounded-3xl border-b-4 shadow-lg transition-transform transform active:scale-95 flex items-center justify-between group ${bgClass}`}>
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-[#3f4f24] transition-colors`}>➜</div>
            <div className="flex flex-col items-end mr-4 flex-1">
                <h3 className="font-bold text-xl">{title}</h3>
                <p className="text-xs text-white/80 font-medium">{subtitle}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-3xl border-2 border-white/10`}>{icon}</div>
        </button>
    );
};

const NotificationToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[100] flex items-center gap-3 animate-slide-up font-bold text-sm ${type === 'success' ? 'bg-[#3f4f24] text-white' : 'bg-red-600 text-white'}`}>
      <span>{type === 'success' ? '✅' : '⚠️'}</span>
      <span>{message}</span>
    </div>
  );
};

const normalizeArabicNumbers = (str: string) => str.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

const App: React.FC = () => {
  // --- STATE ---
  // نبدأ بمصفوفات فارغة ثم نملأها من الفايربيس
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adabArchive, setAdabArchive] = useState<AdabSession[]>([]);
  const [organizationName, setOrganizationName] = useState("جار التحميل...");
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => setNotification({ message, type });

  // --- FIREBASE LOADING (The "Online" Engine) ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [sData, tData, aData, adabData, orgName] = await Promise.all([
                getStudentsFromDB(),
                getTeachersFromDB(),
                getAnnouncementsFromDB(),
                getAdabFromDB(),
                getOrgNameFromDB()
            ]);

            setStudents(sData.length ? sData : INITIAL_STUDENTS); // Fallback to initial if empty
            setTeachers(tData.length ? tData : INITIAL_TEACHERS);
            setAnnouncements(aData);
            setAdabArchive(adabData);
            setOrganizationName(orgName || "دار التوحيد");
        } catch (error) {
            console.error("Error fetching data:", error);
            showNotification("حدث خطأ في تحميل البيانات، تأكد من الإنترنت", "error");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- HANDLERS (Updated to save to DB) ---
  
  // 1. Students
  const updateStudent = async (s: Student) => {
      // تحديث الواجهة فوراً (Optimistic UI)
      setStudents(prev => prev.map(old => old.id === s.id ? s : old));
      // الحفظ في الخلفية
      await saveStudentToDB(s);
  };
  
  const addStudent = async (n: string, c: string) => {
      const newS: Student = { 
          id: 's_'+Date.now(), 
          teacherId: appState.currentUser.id||'', 
          name: n, parentCode: c, 
          weeklySchedule: DAYS_OF_WEEK.map(d=>({day:d, events:[]})), 
          payments:[], logs:[] 
      };
      setStudents([newS, ...students]);
      await saveStudentToDB(newS);
      return newS;
  };

  const deleteStudents = async (ids: string[]) => {
      setStudents(prev => prev.filter(s => !ids.includes(s.id)));
      for (const id of ids) await deleteStudentFromDB(id);
  };

  // 2. Teachers
  const handleAddTeacher = async (n: string, c: string) => {
      const newT = {id:'t_'+Date.now(), name:n, loginCode:c};
      setTeachers([...teachers, newT]);
      await saveTeacherToDB(newT);
  };
  const handleUpdateTeacher = async (id: string, n: string, c: string) => {
      const t = teachers.find(x=>x.id===id);
      if(t) {
          const updated = {...t, name:n, loginCode:c};
          setTeachers(teachers.map(x=>x.id===id?updated:x));
          await saveTeacherToDB(updated);
      }
  };
  const handleDeleteTeacher = async (id: string) => {
      setTeachers(teachers.filter(t=>t.id!==id));
      await deleteTeacherFromDB(id);
  };

  // 3. Announcements & Adab
  const handleAddAnnouncement = async (a: Announcement) => {
      setAnnouncements([a, ...announcements]);
      await saveAnnouncementToDB(a);
  };
  const handleDeleteAnnouncement = async (id: string) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      await deleteAnnouncementFromDB(id);
  };
  
  const handleUpdateOrgName = async (name: string) => {
      setOrganizationName(name);
      await saveOrgNameToDB(name);
  };

  // Login State
  const [appState, setAppState] = useState<AppState>({ students, teachers, announcements, adabArchive, currentUser: { role: 'GUEST' } });
  const [loginView, setLoginView] = useState<'SELECTION' | 'PARENT' | 'TEACHER' | 'ADMIN'>('SELECTION');
  
  // Sync State needed for Dashboard props
  useEffect(() => {
      setAppState(prev => ({...prev, students, teachers, announcements, adabArchive}));
  }, [students, teachers, announcements, adabArchive]);

  // Login Inputs
  const [parentCodeInput, setParentCodeInput] = useState('');
  const [parentSelectedTeacher, setParentSelectedTeacher] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState('');
  const [showPhoneSetup, setShowPhoneSetup] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);

  // Auth Handlers
  const handleTeacherLogin = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const teacher = teachers.find(t => t.id === selectedTeacherId); 
      if (teacher && teacher.loginCode === normalizeArabicNumbers(teacherCodeInput)) { 
          setAppState(prev => ({ ...prev, currentUser: { role: 'TEACHER', id: teacher.id, name: teacher.name } })); setLoginError(''); 
      } else setLoginError("بيانات الدخول غير صحيحة"); 
  };
  
  const handleParentLogin = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const cleanCode = normalizeArabicNumbers(parentCodeInput.trim());
      const student = students.find(s => s.parentCode === cleanCode && s.teacherId === parentSelectedTeacher); 
      if (student) { 
          if (student.parentPhone) { setAppState(prev => ({ ...prev, currentUser: { role: 'PARENT', id: student.id, name: student.name } })); setLoginError(''); }
          else { setPendingStudentId(student.id); setShowPhoneSetup(true); setLoginError(''); }
      } else setLoginError('كود الطالب أو المعلم غير صحيح.'); 
  };

  const handleCompleteParentProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if(pendingStudentId && parentPhoneInput.length >= 10) {
          const s = students.find(x=>x.id===pendingStudentId);
          if(s) {
              const updatedS = {...s, parentPhone: normalizeArabicNumbers(parentPhoneInput)};
              await updateStudent(updatedS); // Save to DB
              setAppState(prev => ({ ...prev, currentUser: { role: 'PARENT', id: s.id, name: s.name } }));
              setShowPhoneSetup(false);
          }
      } else setLoginError('يرجى إدخال رقم صحيح');
  };

  const handleAdminLogin = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (adminPassword === '456888') { setAppState(prev => ({ ...prev, currentUser: { role: 'ADMIN', name: 'المبرمج' }})); setLoginError(''); }
      else setLoginError('خطأ في كلمة المرور'); 
  };
  
  const handleLogout = () => { 
      setAppState(prev => ({ ...prev, currentUser: { role: 'GUEST' } })); setLoginView('SELECTION'); 
      setParentCodeInput(''); setTeacherCodeInput(''); setLoginError(''); setShowPhoneSetup(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#3f4f24] font-bold">جاري تحميل البيانات...</div>;

  return (
      <>
        {notification && <NotificationToast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

        {appState.currentUser.role === 'ADMIN' ? (
            <AdminDashboard 
                teachers={teachers} students={students} organizationName={organizationName}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onUpdateOrganizationName={handleUpdateOrgName}
                onLogout={handleLogout} onShowNotification={showNotification}
            />
        ) : appState.currentUser.role === 'TEACHER' ? (
            <TeacherDashboard 
                teacherName={appState.currentUser.name || ''} teacherId={appState.currentUser.id || ''}
                students={students.filter(s => s.teacherId === appState.currentUser.id)}
                allTeachers={teachers} announcements={announcements} adabArchive={adabArchive}
                onUpdateStudent={updateStudent} onAddStudent={addStudent} onDeleteStudents={deleteStudents}
                onMarkAbsences={()=>{}} 
                onAddAnnouncement={handleAddAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement}
                onLogout={handleLogout} onShowNotification={showNotification}
                onPublishAdab={async (t,q) => { const sess={id:'adab_'+Date.now(), title:t, quizzes:q, date:new Date().toISOString()}; setAdabArchive([sess,...adabArchive]); await saveAdabToDB(sess); }} 
                onEditAdab={()=>{}} onDeleteAdab={async(id)=>{setAdabArchive(prev=>prev.filter(x=>x.id!==id)); await deleteAdabFromDB(id);}} onQuickAnnouncement={()=>{}}
            />
        ) : appState.currentUser.role === 'PARENT' ? (
             <ParentDashboard 
                student={students.find(s => s.id === appState.currentUser.id)!}
                announcements={announcements}
                onUpdateStudent={updateStudent}
                onLogout={handleLogout}
                onMarkSeen={(sid, lids) => {
                    const st = students.find(s=>s.id===sid);
                    if(st) updateStudent({...st, logs: st.logs.map(l=>lids.includes(l.id)?{...l, seenByParent:true}:l)});
                }}
            />
        ) : (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="islamic-pattern-bg"></div>
                <div className="w-full max-w-md z-10">
                    <LogoHeader title={organizationName} />
                    <div className="card-paper p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                         {!showPhoneSetup && loginView === 'SELECTION' && (
                             <p className="text-center text-[#3f4f24] font-bold mb-6 opacity-80">اختر طريقة الدخول للمتابعة</p>
                         )}
                         {!showPhoneSetup && loginView === 'SELECTION' && (
                            <div className="animate-slide-up">
                                <SelectionCard title="ولي الأمر" subtitle="متابعة مستوى الأبناء" icon="👨‍👩‍👧‍👦" colorTheme="olive" onClick={() => setLoginView('PARENT')} />
                                <SelectionCard title="المعلم" subtitle="إدارة الحلقة والطلاب" icon="👳‍♂️" colorTheme="gold" onClick={() => setLoginView('TEACHER')} />
                                <div className="mt-6 text-center"><button onClick={() => setLoginView('ADMIN')} className="text-xs text-[#c5a059] font-bold hover:underline">دخول الإدارة</button></div>
                            </div>
                         )}
                         {!showPhoneSetup && loginView !== 'SELECTION' && (
                             <div className="animate-slide-up">
                                 <button onClick={() => {setLoginView('SELECTION'); setLoginError('')}} className="mb-4 text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">➜ رجوع</button>
                                 {loginView === 'PARENT' && (
                                     <form onSubmit={handleParentLogin} className="space-y-4">
                                         <h3 className="text-2xl font-bold text-[#3f4f24] text-center mb-6">دخول ولي الأمر</h3>
                                         <div><label className="text-xs font-bold text-gray-500 mr-2">اسم المحفظ</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-[#f9f9f9] outline-none focus:border-[#3f4f24]" value={parentSelectedTeacher} onChange={e => setParentSelectedTeacher(e.target.value)}><option value="">-- اختر --</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                                         <div><label className="text-xs font-bold text-gray-500 mr-2">كود الطالب</label><input type="text" className="w-full p-3 rounded-xl border border-gray-200 bg-[#f9f9f9] text-center font-bold tracking-widest outline-none focus:border-[#3f4f24]" placeholder="مثال: 105" value={parentCodeInput} onChange={e => setParentCodeInput(e.target.value)} /></div>
                                         {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
                                         <Button type="submit" className="w-full mt-4 py-4 text-lg">تسجيل الدخول</Button>
                                     </form>
                                 )}
                                 {loginView === 'TEACHER' && (
                                     <form onSubmit={handleTeacherLogin} className="space-y-4">
                                         <h3 className="text-2xl font-bold text-[#c5a059] text-center mb-6">دخول المعلم</h3>
                                         <select className="w-full p-3 rounded-xl border border-gray-200 bg-[#f9f9f9] outline-none" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}><option value="">-- اختر اسمك --</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                                         <input type="password" className="w-full p-3 rounded-xl border border-gray-200 bg-[#f9f9f9] text-center font-bold tracking-widest outline-none" placeholder="الرقم السري" value={teacherCodeInput} onChange={e => setTeacherCodeInput(e.target.value)} />
                                         {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
                                         <Button variant="secondary" type="submit" className="w-full mt-4 py-4 text-lg">دخول</Button>
                                     </form>
                                 )}
                                 {loginView === 'ADMIN' && (
                                     <form onSubmit={handleAdminLogin} className="space-y-4">
                                         <h3 className="text-xl font-bold text-gray-600 text-center mb-4">المبرمج / المسؤول</h3>
                                         <input type="password" className="w-full p-3 rounded-xl border border-gray-200 bg-[#f9f9f9] text-center" placeholder="كلمة المرور" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                                         {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
                                         <Button variant="danger" type="submit" className="w-full">دخول</Button>
                                     </form>
                                 )}
                             </div>
                         )}
                         {showPhoneSetup && (
                             <div className="animate-fade-in text-center">
                                 <h3 className="text-xl font-bold text-[#3f4f24] mb-2">تحديث البيانات</h3>
                                 <p className="text-xs text-gray-500 mb-6">يرجى إضافة رقم الهاتف للتواصل</p>
                                 <input type="tel" className="w-full p-4 rounded-xl border-2 border-[#3f4f24] text-center text-2xl font-bold tracking-widest mb-4" placeholder="01xxxxxxxxx" value={parentPhoneInput} onChange={e => setParentPhoneInput(e.target.value)} autoFocus />
                                 {loginError && <p className="text-red-500 text-xs font-bold mb-2">{loginError}</p>}
                                 <Button onClick={handleCompleteParentProfile} className="w-full">حفظ ومتابعة</Button>
                                 <button onClick={handleLogout} className="mt-4 text-xs text-gray-400 underline">إلغاء</button>
                             </div>
                         )}
                    </div>
                    <div className="mt-8 text-center opacity-60"><p className="font-['Cairo'] text-[#3f4f24] text-sm">جميع الحقوق محفوظة © 2025 دار التوحيد</p></div>
                </div>
            </div>
        )}
      </>
  );
};

export default App;