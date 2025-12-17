
import { Student, Grade, Teacher, Announcement, DailyLog, QuranAssignment } from './types';

export const APP_VERSION = "2.9.8"; // Bump version

export const MONTHS_LIST = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export const DAYS_OF_WEEK = [
  "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
];

// NEW: Available Badge Types Expanded
export const BADGE_TYPES = [
    // أوسمة الإنجاز (الحفظ)
    { id: 'b_khatma_juz', name: 'ختمة جزء', icon: '🏆', description: 'إتمام حفظ جزء كامل', category: 'ACHIEVEMENT' },
    { id: 'b_iron_memory', name: 'الذاكرة الحديدية', icon: '🧠', description: 'تسميع بدون أي خطأ', category: 'ACHIEVEMENT' },
    { id: 'b_speed', name: 'سريع الحفظ', icon: '⚡', description: 'إنجاز الحفظ في وقت قياسي', category: 'ACHIEVEMENT' },
    { id: 'b_golden_throat', name: 'الحنجرة الذهبية', icon: '🎙️', description: 'جمال الصوت وإتقان الأحكام', category: 'ACHIEVEMENT' },
    { id: 'b_excellent', name: 'وسام التميز', icon: '👑', description: 'الحصول على تقدير ممتاز 5 مرات', category: 'ACHIEVEMENT' },

    // أوسمة السلوك والمواظبة
    { id: 'b_mosque', name: 'محب المسجد', icon: '🕌', description: 'الحضور قبل الموعد', category: 'BEHAVIOR' },
    { id: 'b_helper', name: 'المساعد الصغير', icon: '🤝', description: 'مساعدة الشيخ والزملاء', category: 'BEHAVIOR' },
    { id: 'b_peacemaker', name: 'الحمامة البيضاء', icon: '🕊️', description: 'الهدوء والأدب في الحلقة', category: 'BEHAVIOR' },
    { id: 'b_adab', name: 'نجم الآداب', icon: '🌟', description: 'التفاعل في درس الآداب', category: 'BEHAVIOR' },

    // أوسمة التحدي
    { id: 'b_flame', name: 'شعلة الأسبوع', icon: '🔥', description: 'حضور أسبوع كامل دون غياب', category: 'CHALLENGE' },
    { id: 'b_persistent', name: 'المثابر', icon: '🧗', description: 'تحسن ملحوظ في المستوى', category: 'CHALLENGE' },
];

const MOCK_ADAB_QUESTIONS = [
  { q: "ما هو حق المسلم على المسلم؟", c: "رد السلام", w: ["تجاهله", "مقاطعته"] },
  { q: "كيف نبر الوالدين؟", c: "بالطاعة والإحسان", w: ["برفع الصوت", "بالعقوق"] },
  { q: "من هو خاتم الأنبياء؟", c: "محمد صلى الله عليه وسلم", w: ["عيسى عليه السلام", "موسى عليه السلام"] },
  { q: "ماذا نقول عند العطس؟", c: "الحمد لله", w: ["سبحان الله", "أستغفر الله"] },
  { q: "ما هي عقوبة الكذب؟", c: "يحيق بصاحبه", w: ["ينجيه", "يرفع شأنه"] }
];

export const SURAH_DATA = [
  { name: "الفاتحة", count: 7, juz: 1 },
  { name: "البقرة", count: 286, juz: 1 },
  { name: "آل عمران", count: 200, juz: 3 },
  { name: "النساء", count: 176, juz: 4 },
  { name: "المائدة", count: 120, juz: 6 },
  { name: "الأنعام", count: 165, juz: 7 },
  { name: "الأعراف", count: 206, juz: 8 },
  { name: "الأنفال", count: 75, juz: 9 },
  { name: "التوبة", count: 129, juz: 10 },
  { name: "يونس", count: 109, juz: 11 },
  { name: "هود", count: 123, juz: 12 },
  { name: "يوسف", count: 111, juz: 12 },
  { name: "الرعد", count: 43, juz: 13 },
  { name: "إبراهيم", count: 52, juz: 13 },
  { name: "الحجر", count: 99, juz: 14 },
  { name: "النحل", count: 128, juz: 14 },
  { name: "الإسراء", count: 111, juz: 15 },
  { name: "الكهف", count: 110, juz: 15 },
  { name: "مريم", count: 98, juz: 16 },
  { name: "طه", count: 135, juz: 16 },
  { name: "الأنبياء", count: 112, juz: 17 },
  { name: "الحج", count: 78, juz: 17 },
  { name: "المؤمنون", count: 118, juz: 18 },
  { name: "النور", count: 64, juz: 18 },
  { name: "الفرقان", count: 77, juz: 18 },
  { name: "الشعراء", count: 227, juz: 19 },
  { name: "النمل", count: 93, juz: 19 },
  { name: "القصص", count: 88, juz: 20 },
  { name: "العنكبوت", count: 69, juz: 20 },
  { name: "الروم", count: 60, juz: 21 },
  { name: "لقمان", count: 34, juz: 21 },
  { name: "السجدة", count: 30, juz: 21 },
  { name: "الأحزاب", count: 73, juz: 21 },
  { name: "سبأ", count: 54, juz: 22 },
  { name: "فاطر", count: 45, juz: 22 },
  { name: "يس", count: 83, juz: 22 },
  { name: "الصافات", count: 182, juz: 23 },
  { name: "ص", count: 88, juz: 23 },
  { name: "الزمر", count: 75, juz: 23 },
  { name: "غافر", count: 85, juz: 24 },
  { name: "فصلت", count: 54, juz: 24 },
  { name: "الشورى", count: 53, juz: 25 },
  { name: "الزخرف", count: 89, juz: 25 },
  { name: "الدخان", count: 59, juz: 25 },
  { name: "الجاثية", count: 37, juz: 25 },
  { name: "الأحقاف", count: 35, juz: 26 },
  { name: "محمد", count: 38, juz: 26 },
  { name: "الفتح", count: 29, juz: 26 },
  { name: "الحجرات", count: 18, juz: 26 },
  { name: "ق", count: 45, juz: 26 },
  { name: "الذاريات", count: 60, juz: 26 },
  { name: "الطور", count: 49, juz: 27 },
  { name: "النجم", count: 62, juz: 27 },
  { name: "القمر", count: 55, juz: 27 },
  { name: "الرحمن", count: 78, juz: 27 },
  { name: "الواقعة", count: 96, juz: 27 },
  { name: "الحديد", count: 29, juz: 27 },
  { name: "المجادلة", count: 22, juz: 28 },
  { name: "الحشر", count: 24, juz: 28 },
  { name: "الممتحنة", count: 13, juz: 28 },
  { name: "الصف", count: 14, juz: 28 },
  { name: "الجمعة", count: 11, juz: 28 },
  { name: "المنافقون", count: 11, juz: 28 },
  { name: "التغابن", count: 18, juz: 28 },
  { name: "الطلاق", count: 12, juz: 28 },
  { name: "التحريم", count: 12, juz: 28 },
  { name: "الملك", count: 30, juz: 29 },
  { name: "القلم", count: 52, juz: 29 },
  { name: "الحاقة", count: 52, juz: 29 },
  { name: "المعارج", count: 44, juz: 29 },
  { name: "نوح", count: 28, juz: 29 },
  { name: "الجن", count: 28, juz: 29 },
  { name: "المزمل", count: 20, juz: 29 },
  { name: "المدثر", count: 56, juz: 29 },
  { name: "القيامة", count: 40, juz: 29 },
  { name: "الإنسان", count: 31, juz: 29 },
  { name: "المرسلات", count: 50, juz: 29 },
  { name: "النبأ", count: 40, juz: 30 },
  { name: "النازعات", count: 46, juz: 30 },
  { name: "عبس", count: 42, juz: 30 },
  { name: "التكوير", count: 29, juz: 30 },
  { name: "الانفطار", count: 19, juz: 30 },
  { name: "المطففين", count: 36, juz: 30 },
  { name: "الانشقاق", count: 25, juz: 30 },
  { name: "البروج", count: 22, juz: 30 },
  { name: "الطارق", count: 17, juz: 30 },
  { name: "الأعلى", count: 19, juz: 30 },
  { name: "الغاشية", count: 26, juz: 30 },
  { name: "الفجر", count: 30, juz: 30 },
  { name: "البلد", count: 20, juz: 30 },
  { name: "الشمس", count: 15, juz: 30 },
  { name: "الليل", count: 21, juz: 30 },
  { name: "الضحى", count: 11, juz: 30 },
  { name: "الشرح", count: 8, juz: 30 },
  { name: "التين", count: 8, juz: 30 },
  { name: "العلق", count: 19, juz: 30 },
  { name: "القدر", count: 5, juz: 30 },
  { name: "الزلزلة", count: 8, juz: 30 },
  { name: "البينة", count: 8, juz: 30 },
  { name: "العاديات", count: 11, juz: 30 },
  { name: "القارعة", count: 11, juz: 30 },
  { name: "التكاثر", count: 8, juz: 30 },
  { name: "العصر", count: 3, juz: 30 },
  { name: "الهمزة", count: 9, juz: 30 },
  { name: "الفيل", count: 5, juz: 30 },
  { name: "قريش", count: 4, juz: 30 },
  { name: "الماعون", count: 7, juz: 30 },
  { name: "الكوثر", count: 3, juz: 30 },
  { name: "الكافرون", count: 6, juz: 30 },
  { name: "النصر", count: 3, juz: 30 },
  { name: "المسد", count: 5, juz: 30 },
  { name: "الإخلاص", count: 4, juz: 30 },
  { name: "الفلق", count: 5, juz: 30 },
  { name: "الناس", count: 6, juz: 30 }
];

export const SURAH_NAMES = SURAH_DATA.map(s => s.name);

export const JUZ_LIST = [
  "الجزء الأول", "الجزء الثاني", "الجزء الثالث", "الجزء الرابع", "الجزء الخامس",
  "الجزء السادس", "الجزء السابع", "الجزء الثامن", "الجزء التاسع", "الجزء العاشر",
  "الجزء الحادي عشر", "الجزء الثاني عشر", "الجزء الثالث عشر", "الجزء الرابع عشر", "الجزء الخامس عشر",
  "الجزء السادس عشر", "الجزء السابع عشر", "الجزء الثامن عشر", "الجزء التاسع عشر", "الجزء العشرون",
  "الجزء الحادي والعشرون", "الجزء الثاني والعشرون", "الجزء الثالث والعشرون", "الجزء الرابع والعشرون", "الجزء الخامس والعشرون",
  "الجزء السادس والعشرون", "الجزء السابع والعشرون", "الجزء الثامن والعشرون", "الجزء التاسع والعشرون (تبارك)", "الجزء الثلاثون (عم)"
];

// Start pages for all 114 Surahs (Based on standard Madani Mushaf)
export const SURAH_START_PAGES = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 
  586, 587, 589, 590, 591, 592, 593, 594, 595, 596, 
  596, 597, 597, 598, 598, 599, 599, 600, 600, 601, 
  601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 
  604
];

export const getSurahByPage = (page: number): string => {
    if (!page || page < 1) return "";
    if (page > 604) return SURAH_NAMES[113];
    
    // Iterate backwards to find the first surah that starts at or before page
    for (let i = SURAH_START_PAGES.length - 1; i >= 0; i--) {
        if (page >= SURAH_START_PAGES[i]) {
            return SURAH_NAMES[i];
        }
    }
    return SURAH_NAMES[0];
};

export const formatTime12Hour = (time24: string) => {
    if (!time24) return '-- : --';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes} ${ampm}`;
};

export const formatDateDual = (dateIso: string) => {
    const d = new Date(dateIso);
    // Format: DD/MM/YYYY
    const gregorian = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hijri = new Intl.DateTimeFormat('ar-TN-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(d);
    return { gregorian, hijri };
};

export const formatSimpleDate = (dateIso: string) => {
    return new Date(dateIso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateWithDay = (dateIso: string) => {
    return new Date(dateIso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
};

export const ENCOURAGEMENT_MESSAGES = {
  HIGH: [
    "ما شاء الله! أداء ممتاز يا بطل.", 
    "بارك الله فيك، استمرار رائع.", 
    "أحسنت صنعاً.", 
    "مجهود رائع اليوم.", 
    "تلاوة مميزة.",
    "فتح الله عليك وزادك نوراً.",
    "هنيئاً لك هذا الإتقان.",
    "قراءة تشرح الصدر، بارك الله فيك.",
    "بطل القرآن، استمر يا مبدع.",
    "فخورون بك جداً."
  ],
  SUPPORTIVE: [
    "لا بأس، نعوض ما فات.", 
    "ثابر ولا تيأس.", 
    "راجع جيداً.", 
    "تشجع يا بطل.", 
    "حاول مرة أخرى.",
    "بداية جيدة، وتحتاج لمزيد من التركيز.",
    "أنت قادر على الأفضل، نثق بك.",
    "لا تستسلم، المراجعة سر الإتقان.",
    "كلنا نتعلم، المهم الاستمرار.",
    "اجعل القرآن رفيقك يومياً."
  ]
};

const getRandomGrade = (): Grade => {
    const r = Math.random();
    if (r > 0.4) return Grade.EXCELLENT;
    if (r > 0.2) return Grade.VERY_GOOD;
    return Grade.GOOD;
};

// --- MOCK DATA ---
const FIRST_NAMES = ["أحمد", "محمد", "عمر", "يوسف", "علي", "إبراهيم", "خالد", "حسن"];
const MIDDLE_NAMES = ["محمود", "سيد", "أحمد", "علي", "مصطفى"];
const LAST_NAMES = ["المصري", "النجار", "السيد", "عامر", "سليم"];

const generateUniqueName = (usedNames: Set<string>): string => {
    let name = "";
    do {
        name = `${FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)]} ${MIDDLE_NAMES[Math.floor(Math.random()*MIDDLE_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)]}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
};

const generateLogsForStudent = (teacherId: string, teacherName: string): DailyLog[] => {
    const logs: DailyLog[] = [];
    const today = new Date();
    
    // START FROM i = 1 (YESTERDAY) TO 21 (3 WEEKS AGO)
    for (let i = 1; i <= 21; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const isFriday = date.getDay() === 5;
        const isWednesday = date.getDay() === 3; 

        if (isFriday) continue;

        let log: DailyLog;
        const logId = `log_${teacherId}_${Date.now()}_${i}_${Math.random()}`;

        if (isWednesday) {
             const mockQ1 = MOCK_ADAB_QUESTIONS[Math.floor(Math.random() * MOCK_ADAB_QUESTIONS.length)];
             const mockQ2 = MOCK_ADAB_QUESTIONS[Math.floor(Math.random() * MOCK_ADAB_QUESTIONS.length)];
             
             log = {
                id: logId,
                date: date.toISOString(),
                teacherId,
                teacherName,
                isAbsent: false,
                isAdab: true,
                adabSession: {
                    id: 'adab_' + logId, // Added ID
                    date: date.toISOString(), // Added Date
                    title: "مجلس آداب عام",
                    quizzes: [
                        { id: 'q1', question: mockQ1.q, correctAnswer: mockQ1.c, wrongAnswers: mockQ1.w },
                        { id: 'q2', question: mockQ2.q, correctAnswer: mockQ2.c, wrongAnswers: mockQ1.w }
                    ]
                },
                parentQuizScore: Math.random() > 0.5 ? 2 : 1, 
                parentQuizMax: 2,
                seenByParent: Math.random() > 0.4,
                notes: '',
                attendance: [{ id: 'att1', arrival: '16:00', departure: '17:30' }]
             };
        } else {
            const isAbsent = Math.random() < 0.1;
            if (isAbsent) {
                log = { id: logId + '_absent', date: date.toISOString(), teacherId, teacherName, isAbsent: true, seenByParent: Math.random() > 0.5, notes: 'غياب' };
            } else {
                log = {
                    id: logId,
                    date: date.toISOString(),
                    teacherId,
                    teacherName,
                    isAbsent: false,
                    isAdab: false,
                    seenByParent: Math.random() > 0.3,
                    jadeed: { type: 'SURAH', name: 'النبأ', ayahFrom: 1, ayahTo: 10, grade: Grade.EXCELLENT, juzNumber: 30 },
                    murajaah: [{ type: 'SURAH', name: 'النازعات', ayahFrom: 1, ayahTo: 40, grade: Grade.VERY_GOOD, juzNumber: 30 }],
                    attendance: [{ id: 'att1', arrival: '16:00', departure: '18:00' }]
                };
            }
        }
        logs.push(log);
    }
    return logs;
};

const generateMockData = () => {
    const teachers: Teacher[] = [];
    const students: Student[] = [];
    const usedNames = new Set<string>();
    
    let studentIdCounter = 1;
    // Reduced to 2 teachers
    for (let t = 1; t <= 2; t++) { 
        const tId = `t${t}`;
        teachers.push({ id: tId, name: `الشيخ ${FIRST_NAMES[t-1] || 'محمد'}`, loginCode: `100${t}` });
        // Reduced to 5 students per teacher
        for (let s = 1; s <= 5; s++) { 
            const sName = generateUniqueName(usedNames);
            students.push({
                id: `s${studentIdCounter++}`,
                teacherId: tId,
                name: sName,
                parentCode: `${t}${String(s).padStart(3, '0')}`,
                parentPhone: `0100000000${s}`,
                // Updated WeeklySchedule Mock Data
                weeklySchedule: DAYS_OF_WEEK.map(d => ({ 
                    day: d, 
                    events: d === "الجمعة" ? [] : [{ id: 'evt_1', title: 'موعد الحلقة', time: '16:00' }]
                })),
                payments: [],
                logs: generateLogsForStudent(tId, `الشيخ ${FIRST_NAMES[t-1] || 'محمد'}`),
                nextPlan: undefined,
                badges: []
            });
        }
    }
    return { students, teachers };
};

const mockData = generateMockData();
export const INITIAL_TEACHERS = mockData.teachers;
export const INITIAL_STUDENTS = mockData.students;
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
