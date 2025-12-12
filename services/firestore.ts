import { db } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Student, Teacher, Announcement, AdabSession } from '../types';

// --- STUDENTS ---
export const getStudentsFromDB = async (): Promise<Student[]> => {
  const snapshot = await getDocs(collection(db, "students"));
  return snapshot.docs.map(doc => doc.data() as Student);
};

export const saveStudentToDB = async (student: Student) => {
  await setDoc(doc(db, "students", student.id), student);
};

export const deleteStudentFromDB = async (studentId: string) => {
  await deleteDoc(doc(db, "students", studentId));
};

// --- TEACHERS ---
export const getTeachersFromDB = async (): Promise<Teacher[]> => {
  const snapshot = await getDocs(collection(db, "teachers"));
  return snapshot.docs.map(doc => doc.data() as Teacher);
};

export const saveTeacherToDB = async (teacher: Teacher) => {
  await setDoc(doc(db, "teachers", teacher.id), teacher);
};

export const deleteTeacherFromDB = async (teacherId: string) => {
  await deleteDoc(doc(db, "teachers", teacherId));
};

// --- ANNOUNCEMENTS ---
export const getAnnouncementsFromDB = async (): Promise<Announcement[]> => {
  const snapshot = await getDocs(collection(db, "announcements"));
  return snapshot.docs.map(doc => doc.data() as Announcement);
};

export const saveAnnouncementToDB = async (announcement: Announcement) => {
  await setDoc(doc(db, "announcements", announcement.id), announcement);
};

export const deleteAnnouncementFromDB = async (id: string) => {
  await deleteDoc(doc(db, "announcements", id));
};

// --- ADAB ARCHIVE ---
export const getAdabFromDB = async (): Promise<AdabSession[]> => {
  const snapshot = await getDocs(collection(db, "adabArchive"));
  return snapshot.docs.map(doc => doc.data() as AdabSession);
};

export const saveAdabToDB = async (session: AdabSession) => {
  await setDoc(doc(db, "adabArchive", session.id), session);
};

export const deleteAdabFromDB = async (id: string) => {
  await deleteDoc(doc(db, "adabArchive", id));
};

// --- ORG NAME ---
export const saveOrgNameToDB = async (name: string) => {
    await setDoc(doc(db, "settings", "general"), { orgName: name });
};

export const getOrgNameFromDB = async (): Promise<string | null> => {
    try {
        const snapshot = await getDocs(collection(db, "settings"));
        const data = snapshot.docs.find(d => d.id === 'general')?.data();
        return data ? data.orgName : null;
    } catch (e) {
        return null;
    }
};