// =============================================================================
// إدارة بيانات وسجلات التعلم عن بعد (Distance Learning Data Management)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني
// ربط متكامل مع شعب وفصول صفحة "تحليل الشعب والمواد" (SECTIONS_LMS_STATS)
// =============================================================================

import { SECTIONS_LMS_STATS } from './lmsReportSeptember2026';

export type DistanceLearningReason =
  | 'عذر طبي'
  | 'السفر لمسابقة'
  | 'السفر لمؤتمر'
  | 'يوم التعلم عن بعد';

export type DistanceLearningStatus =
  | 'مكتمل'
  | 'قيد المتابعة'
  | 'معتمد'
  | 'ملغى';

export interface DistanceLearningRecord {
  id: string;
  eventTitle: string; // فعالية التعلم عن بعد
  studentName: string; // اسم الطالب
  grade: string; // الصف (مثل: الصف 7، الصف 9، الصف 10، الصف 11، الصف 12)
  section: string; // الشعبة (مثل: 1، 2، 3، 4، 5)
  gradeSection: string; // الصف والشعبة المعتمَد (مثل: 7/1، 9/2، 10/4، 11/2، 12/5)
  fromDate: string; // من تاريخ YYYY-MM-DD
  toDate: string; // إلى تاريخ YYYY-MM-DD
  daysCount: number; // عدد الأيام
  reason: DistanceLearningReason; // السبب
  reasonDetails?: string; // تفاصيل إضافية عن السبب
  status: DistanceLearningStatus; // حالة المتابعة
  subjects?: string[]; // المواد الدراسية المشمولة
  supervisor?: string; // المشرف / المعلم المتابع
  platform?: string; // المنصة المستخدمة
  commitmentRate?: number; // نسبة الحضور / إنجاز الواجبات %
  notes?: string; // ملاحظات وتوصيات
  academicYear: string; // العام الأكاديمي
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// استخراج الشعب والصفوف المعتمدة من صفحة "تحليل الشعب والمواد" (19 شعبة و5 صفوف)
// ─────────────────────────────────────────────────────────────────────────────
export interface SchoolSectionInfo {
  section: string;      // رمز الشعبة مثل "7/1", "10/4"
  grade: string;        // الصف مثل "الصف 7", "الصف 10"
  gradeLabel: string;   // مسمى توضيحي مثل "الصف 7 (السابع)"
  sectionNum: string;   // رقم الشعبة مثل "1", "4"
  studentsCount: number;
}

// توليد قائمة الشعب المعتمدة وترتيبها تصاعدياً
export const LMS_SECTIONS: SchoolSectionInfo[] = SECTIONS_LMS_STATS.map(s => {
  const parts = s.section.split('/');
  const gradeNum = parts[0];
  const secNum = parts[1] || '1';

  let gradeLabel = s.grade;
  if (gradeNum === '7') gradeLabel = 'الصف 7 (السابع)';
  else if (gradeNum === '9') gradeLabel = 'الصف 9 (التاسع)';
  else if (gradeNum === '10') gradeLabel = 'الصف 10 (العاشر)';
  else if (gradeNum === '11') gradeLabel = 'الصف 11 (الحادي عشر)';
  else if (gradeNum === '12') gradeLabel = 'الصف 12 (الثاني عشر)';

  return {
    section: s.section,
    grade: s.grade,
    gradeLabel,
    sectionNum: secNum,
    studentsCount: s.studentsCount,
  };
}).sort((a, b) => {
  const [gA, sA] = a.section.split('/').map(Number);
  const [gB, sB] = b.section.split('/').map(Number);
  if (gA !== gB) return gA - gB;
  return sA - sB;
});

// قائمة الصفوف المعتمدة مرتبة (الصف 7، الصف 9، الصف 10، الصف 11، الصف 12)
export const GRADE_OPTIONS = Array.from(new Set(LMS_SECTIONS.map(s => s.grade)));

// قائمة كافة الشعب المعتمدة بالكامل
export const ALL_SECTIONS = LMS_SECTIONS.map(s => s.section);

// جلب الشعب التابعة لصف معين
export function getSectionsForGrade(grade: string): SchoolSectionInfo[] {
  if (!grade || grade === 'all') return LMS_SECTIONS;
  return LMS_SECTIONS.filter(s => s.grade === grade || s.gradeLabel === grade);
}

// جلب الصف من كود الشعبة مثل "10/4" -> "الصف 10"
export function getGradeFromSection(sectionCode: string): string {
  const found = LMS_SECTIONS.find(s => s.section === sectionCode);
  if (found) return found.grade;
  const gradeNum = sectionCode.split('/')[0];
  return `الصف ${gradeNum}`;
}

// تنسيق اسم الصف
export function formatGradeLabel(grade: string): string {
  const found = LMS_SECTIONS.find(s => s.grade === grade);
  if (found) return found.gradeLabel;
  if (grade.includes('7') || grade.includes('سابع')) return 'الصف 7 (السابع)';
  if (grade.includes('9') || grade.includes('تاسع')) return 'الصف 9 (التاسع)';
  if (grade.includes('10') || grade.includes('عاشر')) return 'الصف 10 (العاشر)';
  if (grade.includes('11') || grade.includes('حادي')) return 'الصف 11 (الحادي عشر)';
  if (grade.includes('12') || grade.includes('ثاني')) return 'الصف 12 (الثاني عشر)';
  return grade;
}

// ─────────────────────────────────────────────────────────────────────────────
// إعدادات وتصنيفات الأسباب (Reason Configuration)
// ─────────────────────────────────────────────────────────────────────────────
export const REASON_CONFIG: Record<
  DistanceLearningReason,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    tagBg: string;
    description: string;
  }
> = {
  'عذر طبي': {
    label: 'عذر طبي',
    icon: '🏥',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    tagBg: '#FEE2E2',
    description: 'غياب بعذر طبي معتمد ومتابعة الدروس عن بعد عبر المنصة',
  },
  'السفر لمسابقة': {
    label: 'السفر لمسابقة',
    icon: '🏆',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    tagBg: '#FEF3C7',
    description: 'تمثيل المدرسة والدولة في مسابقات وأولمبيادات علمية وتكنولوجية خارجية',
  },
  'السفر لمؤتمر': {
    label: 'السفر لمؤتمر',
    icon: '🌐',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    tagBg: '#DBEAFE',
    description: 'حضور والمشاركة في مؤتمرات وندوات دولية ومحلية متخصصة',
  },
  'يوم التعلم عن بعد': {
    label: 'يوم التعلم عن بعد',
    icon: '💻',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    tagBg: '#D1FAE5',
    description: 'يوم تعلم عن بعد رسمي معتمد من الوزارة أو إدارة المدرسة لجميع الطلاب',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// إعدادات وتصنيفات الحالات (Status Configuration)
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  DistanceLearningStatus,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  'مكتمل': {
    label: 'مكتمل',
    icon: '✅',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  'قيد المتابعة': {
    label: 'قيد المتابعة',
    icon: '⏳',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  'معتمد': {
    label: 'معتمد',
    icon: '📋',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  'ملغى': {
    label: 'ملغى',
    icon: '❌',
    color: '#94A3B8',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
};

export const SUBJECT_OPTIONS = [
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'علوم الحاسوب والروبوت',
  'التصميم والتكنولوجيا والابتكار',
  'اللغة الإنجليزية',
  'اللغة العربية',
  'التربية الإسلامية',
  'تاريخ قطر والتربية الوطنية',
];

// دالة لحساب عدد الأيام بين تاريخين
export function calculateDaysCount(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 1;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // شامل يوم البداية والنهاية
  return diffDays > 0 ? diffDays : 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// البيانات الأولية الافتراضية متوافقة بالكامل مع شعب SECTIONS_LMS_STATS
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_DISTANCE_LEARNING_RECORDS: DistanceLearningRecord[] = [
  {
    id: 'DL-2026-001',
    eventTitle: 'المشاركة في أولمبياد العلوم الدولي للناشئين (IJSO)',
    studentName: 'صالح علي المري',
    grade: 'الصف 10',
    section: '2',
    gradeSection: '10/2',
    fromDate: '2026-09-03',
    toDate: '2026-09-11',
    daysCount: 9,
    reason: 'السفر لمسابقة',
    reasonDetails: 'تمثيل دولة قطر في الأولمبياد الدولي ومتابعة حصص الرياضيات والفيزياء عبر تيمز',
    status: 'مكتمل',
    subjects: ['الفيزياء', 'الكيمياء', 'الرياضيات', 'اللغة الإنجليزية'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'نظام قطر للتعليم و Microsoft Teams',
    commitmentRate: 95,
    notes: 'تم تقديم جميع الواجبات والتقييمات الأسبوعية بنجاح وتسجيل الحضور الافتراضي اليومي',
    academicYear: '2026-2027',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'DL-2026-002',
    eventTitle: 'تمثيل المدرسة في معرض آيسف الدولي للعلوم والهندسة (ISEF)',
    studentName: 'عبدالله محمد الكواري',
    grade: 'الصف 11',
    section: '1',
    gradeSection: '11/1',
    fromDate: '2026-09-08',
    toDate: '2026-09-15',
    daysCount: 8,
    reason: 'السفر لمسابقة',
    reasonDetails: 'المشاركة بمشروع الذكاء الاصطناعي في الطاقة المتجددة في الولايات المتحدة الأمريكية',
    status: 'مكتمل',
    subjects: ['علوم الحاسوب والروبوت', 'الفيزياء', 'الرياضيات', 'اللغة الإنجليزية'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'Microsoft Teams',
    commitmentRate: 98,
    notes: 'حضور متزامن وغير متزامن مع تقارير أداء ممتازة من المعلمين',
    academicYear: '2026-2027',
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-16T11:00:00.000Z',
  },
  {
    id: 'DL-2026-003',
    eventTitle: 'متابعة الحصص الدراسية إثر عملية جراحية بالقدم',
    studentName: 'خالد جاسم المناعي',
    grade: 'الصف 9',
    section: '1',
    gradeSection: '9/1',
    fromDate: '2026-09-10',
    toDate: '2026-09-17',
    daysCount: 8,
    reason: 'عذر طبي',
    reasonDetails: 'تقرير طبي معتمد من مؤسسة حمد الطبية - راحة منزلية ومتابعة عن بعد',
    status: 'مكتمل',
    subjects: ['الرياضيات', 'اللغة العربية', 'اللغة الإنجليزية', 'الأحياء'],
    supervisor: 'النائب الأكاديمي د. راني التوم',
    platform: 'نظام قطر للتعليم',
    commitmentRate: 92,
    notes: 'تم توفير تسجيلات الحصص ومتابعة تسليم الواجبات بالتنسيق مع منسقي المواد',
    academicYear: '2026-2027',
    createdAt: '2026-09-09T07:30:00.000Z',
    updatedAt: '2026-09-18T12:00:00.000Z',
  },
  {
    id: 'DL-2026-004',
    eventTitle: 'المشاركة في المؤتمر الدولي لتطبيقات الذكاء الاصطناعي والروبوت',
    studentName: 'ناصر راشد الهاجري',
    grade: 'الصف 12',
    section: '2',
    gradeSection: '12/2',
    fromDate: '2026-09-14',
    toDate: '2026-09-18',
    daysCount: 5,
    reason: 'السفر لمؤتمر',
    reasonDetails: 'تقديم ورقة بحثية طلابية حول الروبوتات الطبية في مؤتمر IEEE الدولي',
    status: 'مكتمل',
    subjects: ['التصميم والتكنولوجيا والابتكار', 'الرياضيات', 'الفيزياء'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'نظام قطر للتعليم و Teams',
    commitmentRate: 100,
    notes: 'إشادة واسعة من المنظمين وتفوق دراسي مستمر والتزام كامل بالتقييمات',
    academicYear: '2026-2027',
    createdAt: '2026-09-12T08:00:00.000Z',
    updatedAt: '2026-09-19T09:00:00.000Z',
  },
  {
    id: 'DL-2026-005',
    eventTitle: 'يوم التعلم عن بعد الشامل لتعزيز البنية الرقمية وحالات الطوارئ',
    studentName: 'جميع طلاب المدرسة (سجل عام معتمد)',
    grade: 'الصف 10',
    section: '1',
    gradeSection: '10/1',
    fromDate: '2026-09-22',
    toDate: '2026-09-22',
    daysCount: 1,
    reason: 'يوم التعلم عن بعد',
    reasonDetails: 'تطبيق يوم التعلم عن بعد المعتمد من وزارة التربية والتعليم والتعليم العالي لاختبار الجاهزية الرقمية',
    status: 'مكتمل',
    subjects: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة الإنجليزية', 'اللغة العربية'],
    supervisor: 'إدارة المدرسة ومنسق المشاريع',
    platform: 'نظام قطر للتعليم و Microsoft Teams',
    commitmentRate: 97,
    notes: 'حضور استثنائي بنسبة 97% وتفعيل كامل للبث المباشر والأنشطة التفاعلية والواجبات اليومية',
    academicYear: '2026-2027',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-23T10:00:00.000Z',
  },
  {
    id: 'DL-2026-006',
    eventTitle: 'فترة نقاهة صحية - عذر طبي معتمد من المستشفى الأهلي',
    studentName: 'محمد أحمد السليطي',
    grade: 'الصف 10',
    section: '3',
    gradeSection: '10/3',
    fromDate: '2026-09-15',
    toDate: '2026-09-21',
    daysCount: 7,
    reason: 'عذر طبي',
    reasonDetails: 'إجازة مرضية معتمدة من القومسيون الطبي لمتابعة العلاج المنزلي',
    status: 'مكتمل',
    subjects: ['الرياضيات', 'الكيمياء', 'اللغة الإنجليزية', 'التربية الإسلامية'],
    supervisor: 'أخصائي التعليم الإلكتروني',
    platform: 'نظام قطر للتعليم',
    commitmentRate: 90,
    notes: 'تمت متابعة حضور الحصص المسجلة والتواصل مع ولي الأمر أسبوعياً',
    academicYear: '2026-2027',
    createdAt: '2026-09-14T09:00:00.000Z',
    updatedAt: '2026-09-22T11:00:00.000Z',
  },
  {
    id: 'DL-2026-007',
    eventTitle: 'المشاركة في أولمبياد الروبوت العالمي (WRO International)',
    studentName: 'حمد سلطان النعيمي',
    grade: 'الصف 11',
    section: '2',
    gradeSection: '11/2',
    fromDate: '2026-09-24',
    toDate: '2026-09-29',
    daysCount: 6,
    reason: 'السفر لمسابقة',
    reasonDetails: 'المنافسة ضمن الفريق القطري في نهائيات الروبوت الدولية',
    status: 'قيد المتابعة',
    subjects: ['علوم الحاسوب والروبوت', 'الفيزياء', 'الرياضيات'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'Microsoft Teams',
    commitmentRate: 94,
    notes: 'متابعة مستمرة وجدول حصص افتراضية مسائية يناسب فارق التوقيت',
    academicYear: '2026-2027',
    createdAt: '2026-09-23T10:00:00.000Z',
    updatedAt: '2026-09-28T08:00:00.000Z',
  },
  {
    id: 'DL-2026-008',
    eventTitle: 'المشاركة في منتدى القيادات الشبابية للتكنولوجيا والابتكار',
    studentName: 'فيصل عبدالرحمن فخرو',
    grade: 'الصف 12',
    section: '1',
    gradeSection: '12/1',
    fromDate: '2026-09-25',
    toDate: '2026-09-28',
    daysCount: 4,
    reason: 'السفر لمؤتمر',
    reasonDetails: 'حضور ورش العمل وجلسات القيادة التكنولوجية المتقدمة لطلاب المدارس العلمية',
    status: 'معتمد',
    subjects: ['اللغة الإنجليزية', 'التصميم والتكنولوجيا والابتكار', 'الرياضيات'],
    supervisor: 'النائب الأكاديمي د. راني التوم',
    platform: 'نظام قطر للتعليم',
    commitmentRate: 96,
    notes: 'تم اعتماد خطة التقييمات البديلة وإشعار جميع المعلمين المعنيين',
    academicYear: '2026-2027',
    createdAt: '2026-09-24T08:30:00.000Z',
    updatedAt: '2026-09-27T13:00:00.000Z',
  },
  {
    id: 'DL-2026-009',
    eventTitle: 'عذر طبي - اشتباه وعكة صحية وراحة منزلية مؤقتة',
    studentName: 'راشد جابر المري',
    grade: 'الصف 9',
    section: '2',
    gradeSection: '9/2',
    fromDate: '2026-09-27',
    toDate: '2026-09-30',
    daysCount: 4,
    reason: 'عذر طبي',
    reasonDetails: 'عذر طبي معتمد صادر من المركز الصحي لمتابعة الدراسة المنزلية',
    status: 'قيد المتابعة',
    subjects: ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية'],
    supervisor: 'أخصائي التعليم الإلكتروني',
    platform: 'نظام قطر للتعليم',
    commitmentRate: 88,
    notes: 'جاري التنسيق لحل التقييمات الأسبوعية عبر المنصة فور استقرار الحالة',
    academicYear: '2026-2027',
    createdAt: '2026-09-26T11:00:00.000Z',
    updatedAt: '2026-09-28T09:00:00.000Z',
  },
  {
    id: 'DL-2026-010',
    eventTitle: 'المشاركة في هاكاثون الابتكار المدرسي الخليجي',
    studentName: 'سعود عبدالعزيز الباكر',
    grade: 'الصف 10',
    section: '4',
    gradeSection: '10/4',
    fromDate: '2026-09-18',
    toDate: '2026-09-21',
    daysCount: 4,
    reason: 'السفر لمسابقة',
    reasonDetails: 'المشاركة ضمن فريق المدرسة لتطوير حلول المدن الذكية المستدامة',
    status: 'مكتمل',
    subjects: ['علوم الحاسوب والروبوت', 'التصميم والتكنولوجيا والابتكار'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'Microsoft Teams',
    commitmentRate: 100,
    notes: 'فاز الفريق بالمركز الثاني خليجياً مع إنجاز جميع المهام الدراسية دون أي تأخير',
    academicYear: '2026-2027',
    createdAt: '2026-09-16T08:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'DL-2026-011',
    eventTitle: 'عذر طبي - متابعة الحصص الدراسية من المنزل بعد وعكة صحية',
    studentName: 'تميم جابر العذبة',
    grade: 'الصف 7',
    section: '1',
    gradeSection: '7/1',
    fromDate: '2026-09-12',
    toDate: '2026-09-16',
    daysCount: 5,
    reason: 'عذر طبي',
    reasonDetails: 'عذر طبي معتمد من المركز الصحي - متابعة البث التفاعلي عبر المنصة',
    status: 'مكتمل',
    subjects: ['الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'اللغة العربية'],
    supervisor: 'أخصائي التعليم الإلكتروني',
    platform: 'نظام قطر للتعليم',
    commitmentRate: 91,
    notes: 'تم تسليم كافة الأنشطة الصفية والواجبات اليومية عبر نظام قطر للتعليم',
    academicYear: '2026-2027',
    createdAt: '2026-09-11T08:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'DL-2026-012',
    eventTitle: 'المشاركة في مسابقة الروبوت والذكاء الاصطناعي للمرحلة الإعدادية',
    studentName: 'غانم حمد الرميحي',
    grade: 'الصف 7',
    section: '2',
    gradeSection: '7/2',
    fromDate: '2026-09-20',
    toDate: '2026-09-24',
    daysCount: 5,
    reason: 'السفر لمسابقة',
    reasonDetails: 'تمثيل المدرسة في البطولة الإقليمية للروبوت وتصميم المسارات',
    status: 'مكتمل',
    subjects: ['علوم الحاسوب والروبوت', 'الرياضيات', 'العلوم'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'Microsoft Teams',
    commitmentRate: 96,
    notes: 'أداء متميز والتزام كامل بمتابعة الدروس عبر المنصة',
    academicYear: '2026-2027',
    createdAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
  {
    id: 'DL-2026-013',
    eventTitle: 'المشاركة في الأولمبياد الدولي للفيزياء التطبيقية',
    studentName: 'سلطان خالد الكعبي',
    grade: 'الصف 11',
    section: '4',
    gradeSection: '11/4',
    fromDate: '2026-09-15',
    toDate: '2026-09-22',
    daysCount: 8,
    reason: 'السفر لمسابقة',
    reasonDetails: 'معسكر تدريبي مكثف والتنافس في المرحلة النهائية للأولمبياد',
    status: 'مكتمل',
    subjects: ['الفيزياء', 'الرياضيات', 'الكيمياء'],
    supervisor: 'النائب الأكاديمي د. راني التوم',
    platform: 'نظام قطر للتعليم و Teams',
    commitmentRate: 98,
    notes: 'تحقيق الميدالية الفضية والتزام متكامل بكافة التقييمات المدرسية',
    academicYear: '2026-2027',
    createdAt: '2026-09-13T08:30:00.000Z',
    updatedAt: '2026-09-23T12:00:00.000Z',
  },
  {
    id: 'DL-2026-014',
    eventTitle: 'المشاركة في مؤتمر الطاقة المستدامة والمدن الخضراء',
    studentName: 'جاسم عيسى المناعي',
    grade: 'الصف 12',
    section: '5',
    gradeSection: '12/5',
    fromDate: '2026-09-26',
    toDate: '2026-09-29',
    daysCount: 4,
    reason: 'السفر لمؤتمر',
    reasonDetails: 'عرض نموذج تخرج مصغر حول تحلية المياه بالطاقة الشمسية',
    status: 'قيد المتابعة',
    subjects: ['الفيزياء', 'الكيمياء', 'التصميم والتكنولوجيا والابتكار'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'Microsoft Teams',
    commitmentRate: 94,
    notes: 'متابعة يومية للواجبات والتقييمات البديلة المعتمدة',
    academicYear: '2026-2027',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-28T09:00:00.000Z',
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// التخزين واسترجاع البيانات (Local Persistence)
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_PREFIX = 'qstss_distance_learning_records_';

export function getDistanceLearningStorageKey(academicYear: string = '2026-2027'): string {
  return `${STORAGE_PREFIX}${academicYear}`;
}

export function loadDistanceLearningRecords(academicYear: string = '2026-2027'): DistanceLearningRecord[] {
  if (typeof window === 'undefined') return INITIAL_DISTANCE_LEARNING_RECORDS;
  try {
    const key = getDistanceLearningStorageKey(academicYear);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // حفظ البيانات الأولية إذا لم تكن موجودة
    saveDistanceLearningRecords(INITIAL_DISTANCE_LEARNING_RECORDS, academicYear);
    return INITIAL_DISTANCE_LEARNING_RECORDS;
  } catch (error) {
    console.error('Error loading distance learning records:', error);
    return INITIAL_DISTANCE_LEARNING_RECORDS;
  }
}

export function saveDistanceLearningRecords(
  records: DistanceLearningRecord[],
  academicYear: string = '2026-2027'
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getDistanceLearningStorageKey(academicYear);
    localStorage.setItem(key, JSON.stringify(records));
    // إرسال حدث مخصص لتحديث أي مكونات أخرى تستمع
    window.dispatchEvent(new CustomEvent('qstss_distance_learning_updated', { detail: { academicYear, count: records.length } }));
  } catch (error) {
    console.error('Error saving distance learning records:', error);
  }
}

export function resetDistanceLearningRecords(academicYear: string = '2026-2027'): DistanceLearningRecord[] {
  saveDistanceLearningRecords(INITIAL_DISTANCE_LEARNING_RECORDS, academicYear);
  return INITIAL_DISTANCE_LEARNING_RECORDS;
}
