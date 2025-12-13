import React, { useState, useEffect } from 'react';
import { Teacher, Student } from '../types';
import { Button } from './Button';

interface AdminDashboardProps {
    teachers: Teacher[];
    // Added students prop to calculate counts
    students: Student[];
    onAddTeacher: (name: string, loginCode: string) => void;
    onUpdateTeacher: (id: string, name: string, loginCode: string) => void;
    onDeleteTeacher: (id: string) => void;
    onLogout: () => void;
    onShowNotification: (message: string, type: 'success' | 'error') => void;
    organizationName: string;
    onUpdateOrganizationName: (name: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    teachers,
    students,
    onAddTeacher,
    onUpdateTeacher,
    onDeleteTeacher,
    onLogout,
    onShowNotification,
    organizationName,
    onUpdateOrganizationName
}) => {
    const [name, setName] = useState('');
    const [loginCode, setLoginCode] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Modal State for Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [teacherToDeleteId, setTeacherToDeleteId] = useState('');

    // Local state for editing org name and password
    const [tempOrgName, setTempOrgName] = useState(organizationName);
    const [newAdminPassword, setNewAdminPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && loginCode) {
            if (editingId) {
                onUpdateTeacher(editingId, name, loginCode);
                setEditingId(null);
            } else {
                onAddTeacher(name, loginCode);
            }
            setName('');
            setLoginCode('');
        }
    };

    const handleOrgNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempOrgName.trim()) {
            onUpdateOrganizationName(tempOrgName);
            onShowNotification('تم تحديث اسم المؤسسة بنجاح', 'success');
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAdminPassword.length < 4) {
            onShowNotification('كلمة المرور قصيرة جداً', 'error');
            return;
        }
        localStorage.setItem('admin_password', newAdminPassword);
        onShowNotification('تم تحديث كلمة مرور المسؤول بنجاح', 'success');
        setNewAdminPassword('');
    };

    const startEdit = (t: Teacher) => {
        setEditingId(t.id);
        setName(t.name);
        setLoginCode(t.loginCode);
        const el = document.getElementById('teacher-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setLoginCode('');
    };

    const handleDeleteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (teacherToDeleteId) {
            onDeleteTeacher(teacherToDeleteId);
            setShowDeleteModal(false);
            setTeacherToDeleteId('');
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f1ea] font-cairo pb-24 relative overflow-hidden">
            {/* Background Pattern Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-48 islamic-footer z-0 pointer-events-none"></div>

            <div className="max-w-2xl mx-auto relative z-10 p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur p-4 rounded-2xl border border-[#e6e2d3] shadow-sm">
                    <h1 className="text-xl font-bold text-[#3d2e18]">🛠️ لوحة المبرمج (المسؤول)</h1>
                    <Button variant="danger" onClick={onLogout} className="bg-[#a89060] hover:bg-[#8f7a50] border-none text-white shadow-sm">خروج</Button>
                </div>

                {/* Global Settings Section */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 relative border border-[#e6e2d3] overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#5c6b48]"></div>
                    <h2 className="text-xl font-bold text-[#3d2e18] mb-6 flex items-center gap-2">
                        <span className="text-2xl">⚙️</span> إعدادات التطبيق العامة
                    </h2>

                    {/* Org Name */}
                    <form onSubmit={handleOrgNameSubmit} className="flex flex-col sm:flex-row gap-4 items-end border-b border-[#e6e2d3] pb-6 mb-6">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-[#8c7b60] mb-2">اسم الدار / المؤسسة (يظهر في شاشة الدخول)</label>
                            <input
                                type="text"
                                value={tempOrgName}
                                onChange={e => setTempOrgName(e.target.value)}
                                className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl focus:border-[#5c6b48] outline-none transition bg-[#fdfcf8]"
                                placeholder="مثال: دار النور لتحفيظ القرآن"
                            />
                        </div>
                        <Button type="submit" className="bg-[#5c6b48] hover:bg-[#4a563a] h-12 px-6 shadow-md w-full sm:w-auto">حفظ الاسم</Button>
                    </form>

                    {/* Admin Password */}
                    <form onSubmit={handlePasswordChange} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-[#8c7b60] mb-2">تغيير كلمة مرور المسؤول</label>
                            <input
                                type="password"
                                value={newAdminPassword}
                                onChange={e => setNewAdminPassword(e.target.value)}
                                className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl focus:border-[#a89060] outline-none transition bg-[#fdfcf8]"
                                placeholder="أدخل كلمة المرور الجديدة"
                            />
                        </div>
                        <Button type="submit" className="bg-[#a89060] hover:bg-[#8f7a50] h-12 px-6 text-white shadow-md w-full sm:w-auto">تحديث كلمة المرور</Button>
                    </form>
                </div>

                {/* Delete Modal for Teachers */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in border border-[#e6e2d3]">
                            <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">🗑️ حذف محفظ</h2>
                            <p className="mb-4 text-gray-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">تحذير: سيتم حذف المحفظ وجميع الطلاب التابعين له نهائياً.</p>
                            <form onSubmit={handleDeleteSubmit}>
                                <label className="block mb-2 text-sm font-bold text-[#3d2e18]">اختر الاسم</label>
                                <select
                                    className="w-full p-3 border rounded-xl mb-6 bg-[#f4f1ea] outline-none focus:ring-2 focus:ring-red-200"
                                    value={teacherToDeleteId}
                                    onChange={e => setTeacherToDeleteId(e.target.value)}
                                    required
                                >
                                    <option value="">-- اختر المحفظ --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>

                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="border-[#e6e2d3] text-gray-500">إلغاء</Button>
                                    <Button type="submit" variant="danger" disabled={!teacherToDeleteId} className="bg-red-600 hover:bg-red-700 text-white">تأكيد الحذف</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div id="teacher-form" className="bg-white rounded-2xl p-6 shadow-lg mb-6 relative border border-[#e6e2d3]">
                    <div className="flex justify-between items-center mb-6 border-b border-[#e6e2d3] pb-4">
                        <h2 className="text-xl font-bold text-[#3d2e18] flex items-center gap-2">
                            <span className="text-2xl">👤</span> {editingId ? 'تعديل بيانات محفظ' : 'إضافة محفظ جديد'}
                        </h2>
                        <Button variant="danger" type="button" onClick={() => setShowDeleteModal(true)} className="bg-red-100 text-red-600 border border-red-200 hover:bg-red-200">حذف محفظ 🗑️</Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#3d2e18] mb-1">اسم المحفظ</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl focus:border-[#5c6b48] outline-none transition bg-[#fdfcf8]"
                                placeholder="الشيخ ...."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#3d2e18] mb-1">رقم الدخول الخاص (Access Code)</label>
                            <input
                                type="text"
                                value={loginCode}
                                onChange={e => setLoginCode(e.target.value)}
                                className="w-full p-3 border-2 border-[#e6e2d3] rounded-xl focus:border-[#5c6b48] outline-none transition bg-[#fdfcf8] font-mono tracking-widest text-center"
                                placeholder="أدخل رقماً مميزاً"
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="bg-[#5c6b48] hover:bg-[#4a563a] flex-1 py-3 text-lg shadow-md">{editingId ? 'حفظ التعديلات' : 'إضافة للقائمة'}</Button>
                            {editingId && <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 border-2 border-[#a89060] text-[#a89060] hover:bg-[#f4f1ea]">إلغاء</Button>}
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e6e2d3]">
                    <h2 className="text-xl font-bold text-[#3d2e18] mb-4 flex items-center gap-2">
                        <span className="text-2xl">📋</span> قائمة المحفظين الحاليين
                    </h2>
                    <div className="space-y-3">
                        {teachers.length === 0 ? (
                            <p className="text-gray-400 text-center py-8 border-2 border-dashed border-[#e6e2d3] rounded-xl">لا يوجد محفظين مسجلين.</p>
                        ) : (
                            teachers.map(t => {
                                // Calculate student count per teacher
                                const studentCount = students.filter(s => s.teacherId === t.id).length;
                                return (
                                    <div key={t.id} className="flex justify-between items-center p-4 bg-[#fdfcf8] rounded-xl border border-[#e6e2d3] shadow-sm transition hover:shadow-md">
                                        <div>
                                            <p className="font-bold text-[#3d2e18] text-lg flex items-center gap-2">
                                                {t.name}
                                                <span className="text-xs bg-[#f4f1ea] text-[#5c6b48] px-2 py-1 rounded-full border border-[#e6e2d3]">({studentCount} طالب)</span>
                                            </p>
                                            <p className="text-sm text-[#8c7b60] font-mono mt-1">كود الدخول: {t.loginCode}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="bg-[#f4f1ea] text-[#5c6b48] px-4 py-2 rounded-lg text-sm font-bold border border-[#e6e2d3] hover:bg-[#e6e2d3] transition"
                                                onClick={(e) => { e.preventDefault(); startEdit(t); }}
                                            >
                                                تعديل ✎
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};