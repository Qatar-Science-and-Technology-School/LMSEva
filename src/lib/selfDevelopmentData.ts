// =============================================================================
// إدارة سجلات وبيانات التطوير الذاتي لمنسق المشاريع (Self Development Data Management)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني والحلول الرقمية
// خاص بالشهادات المهنية والدورات التخصصية لمنسق المشاريع: م. أحمد عادل طبيشات
// =============================================================================

import { getCollection, saveCollection, isAuthorizedToSave, COLLECTIONS } from './firestoreDb';

export type SelfDevelopmentCategory =
  | 'الذكاء الاصطناعي والحلول الرقمية'
  | 'القيادة والتحول الرقمي المدرسي'
  | 'تكنولوجيا التعليم ومنصات LMS'
  | 'الحوسبة السحابية والبنية التقنية'
  | 'الأمن السيبراني وحماية البيانات'
  | 'إدارة المشاريع التعليمية والابتكار';

export type SelfDevelopmentStatus = 'معتمدة وسارية' | 'مكتملة' | 'قيد التدريب';

export interface SelfDevelopmentRecord {
  id: string;
  coordinatorName: string; // م. أحمد عادل طبيشات / Ahmad Adel Tubaishat
  role: string; // منسق مشروع التعلم الإلكتروني والحلول الرقمية
  title: string; // اسم الشهادة أو الدورة أو الورشة
  titleEn?: string; // الاسم بالإنجليزية
  issuer: string; // الجهة المنظمة / المانحة (Microsoft, Canva, UNESCO, QSTSS, الوزارة...)
  category: SelfDevelopmentCategory; // المجال التخصصي
  hours: number; // عدد الساعات التدريبية
  issueDate: string; // تاريخ الإنجاز / الحصول عليها YYYY-MM-DD
  expiryDate?: string; // تاريخ الانتهاء أو "سارية المفعول"
  academicYear: string; // العام الأكاديمي مثل 2026-2027
  status: SelfDevelopmentStatus; // معتمدة وسارية / مكتملة / قيد التدريب
  pdType?: 'داخلي' | 'خارجي'; // نوع التطوير المهني: داخلي (مدرسي QSTSS) / خارجي (وزاري ودولي)
  credentialId?: string; // رقم الاعتماد / كود التحقق
  credentialUrl?: string; // رابط الشهادة الرقمية أو التحقق
  skillsAcquired: string[]; // المهارات التخصصية المكتسبة
  impactOnWork: string; // ملخص التعلم والأثر / الأثر والتطبيق العملي
  notes?: string; // ملاحظات إضافية
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// إعدادات التصنيفات والألوان
// ─────────────────────────────────────────────────────────────────────────────
export const SELF_DEV_CATEGORIES: {
  category: SelfDevelopmentCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}[] = [
  {
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    iconName: 'Sparkles',
  },
  {
    category: 'القيادة والتحول الرقمي المدرسي',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    borderColor: '#DDD6FE',
    iconName: 'Award',
  },
  {
    category: 'تكنولوجيا التعليم ومنصات LMS',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    iconName: 'Monitor',
  },
  {
    category: 'الحوسبة السحابية والبنية التقنية',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    iconName: 'Globe',
  },
  {
    category: 'الأمن السيبراني وحماية البيانات',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FECACA',
    iconName: 'ShieldCheck',
  },
  {
    category: 'إدارة المشاريع التعليمية والابتكار',
    color: '#0F2044',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    iconName: 'Briefcase',
  },
];

export const SELF_DEV_STATUS_CONFIG: Record<
  SelfDevelopmentStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  'معتمدة وسارية': {
    label: 'معتمدة وسارية',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  'مكتملة': {
    label: 'مكتملة وموثقة',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  'قيد التدريب': {
    label: 'قيد التدريب والدراسة',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// دوال التحقق من التكرار وتطبيع العناوين (Deduplication & Title Normalization)
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeRecordTitle(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/^(workshop\s*:\s*|ورشة\s*(عمل)?\s*:\s*|دورة\s*:\s*|برنامج\s*:\s*|محاضرة\s*:\s*)/i, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
}

/**
 * يتحقق مما إذا كان السجل موجوداً مسبقاً في القائمة لتجنب أي تكرار
 */
export function isDuplicateSelfDevRecord(
  candidate: Partial<SelfDevelopmentRecord>,
  existingList: SelfDevelopmentRecord[]
): boolean {
  if (!candidate) return false;
  const cId = candidate.id;
  const cTitle = normalizeRecordTitle(candidate.title);
  const cTitleEn = normalizeRecordTitle(candidate.titleEn);

  return existingList.some(r => {
    // تطابق المعرف المباشر
    if (cId && r.id === cId) return true;

    const rTitle = normalizeRecordTitle(r.title);
    const rTitleEn = normalizeRecordTitle(r.titleEn);

    // تطابق العنوان العربي أو الإنجليزي
    if (cTitle && (rTitle === cTitle || rTitleEn === cTitle)) return true;
    if (cTitleEn && (rTitle === cTitleEn || rTitleEn === cTitleEn)) return true;

    return false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// سجل التطوير المهني الرسمي المعتمد (PD Log - 2026/2027)
// مدرسة قطر للعلوم والتكنولوجيا الإعدادية الثانوية للبنين — أم السنيم
// منسق مشروع التعلم الإلكتروني: Ahmad Adel Tubaishat (م. أحمد عادل طبيشات)
// إجمالي السجلات: 22 سجلاً | إجمالي الساعات: 65 ساعة مكتملة
// ─────────────────────────────────────────────────────────────────────────────
export const OFFICIAL_PD_LOG_2026_RECORDS: SelfDevelopmentRecord[] = [
  {
    id: 'sdev-log-01',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Microsoft Elevate Educator Expert',
    titleEn: 'Microsoft Elevate Educator Expert',
    issuer: 'Microsoft',
    category: 'تكنولوجيا التعليم ومنصات LMS',
    hours: 2,
    issueDate: '2026-09-08',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MS-EEE-2026-01',
    skillsAcquired: ['Microsoft Showcase School', 'برامج مايكروسوفت التعليمية المتقدمة', 'استراتيجيات المعلم الخبير'],
    impactOnWork: 'Microsoft Showcase School - تطبيق وتطوير معايير مدارس مايكروسوفت النموذجية وتفعيل البرامج التعليمية المتقدمة بالمدرسة.',
    notes: 'السجل 1 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-09-08T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-02',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Global MOOC on the Ethics of AI',
    titleEn: 'Global MOOC on the Ethics of AI',
    issuer: 'UNESCO',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 2,
    issueDate: '2026-09-11',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'UNESCO-AI-ETHICS-2026',
    skillsAcquired: ['AI Unisco Certificate', 'أخلاقيات الذكاء الاصطناعي في التعليم', 'المواطنة الرقمية العالمية'],
    impactOnWork: 'AI Unisco Certificate - توظيف المبادئ الأخلاقية المعتمدة من منظمة اليونسكو في استخدام وتوجيه أدوات الذكاء الاصطناعي في البيئة المدرسية.',
    notes: 'السجل 2 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-09-11T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-03',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Ai Essentials 2026',
    titleEn: 'Ai Essentials 2026',
    issuer: 'Canva',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 2,
    issueDate: '2026-09-14',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'CANVA-AIE-2026-03',
    skillsAcquired: ['Certificate', 'Canva Magic Studio', 'تصميم الوسائط التعليمية بالذكاء الاصطناعي'],
    impactOnWork: 'Certificate - تمكين المعلمين والطلاب من استخدام أدوات الذكاء الاصطناعي في منصة كانفا لإنتاج ملصقات وعروض تعليمية مبتكرة.',
    notes: 'السجل 3 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-09-14T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-04',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Ai in The Classroom',
    titleEn: 'Ai in The Classroom',
    issuer: 'Canva',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 2,
    issueDate: '2026-09-16',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'CANVA-AIC-2026-04',
    skillsAcquired: ['Certificate', 'تطبيقات الذكاء الاصطناعي الصفية', 'إشراك الطلاب التفاعلي'],
    impactOnWork: 'Certificate - تطبيق استراتيجيات الدمج الصفي للذكاء الاصطناعي لرفع دافعية الطلاب وتطوير الممارسات التدريسية.',
    notes: 'السجل 4 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-09-16T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-05',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'دورة إدارة وحماية البيانات الشخصية',
    titleEn: 'Personal Data Management and Protection Course',
    issuer: 'الوكالة الوطنية للأمن السيبراني',
    category: 'الأمن السيبراني وحماية البيانات',
    hours: 6,
    issueDate: '2026-09-18',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'NCSA-PDP-2026-05',
    skillsAcquired: ['نشر وتوعية أطراف العملية التعليمية بالمواطنة الرقمية', 'حماية الخصوصية المدرسية', 'إدارة البيانات الشخصية'],
    impactOnWork: 'نشر وتوعية اطراف العملية التعليمية بالمواطنة الرقمية وحماية البيانات الشخصية للطلبة والكادر المدرسي.',
    notes: 'السجل 5 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (6 ساعات).',
    createdAt: '2026-09-18T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-06',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'مجتمع التعلم المهني الأول لمنسقي المشاريع الإلكترونية للعام 2026-2027م',
    titleEn: 'First Professional Learning Community for E-Learning Coordinators 2026-2027',
    issuer: 'ادارة التعليم الالكتروني والحلول الرقمية',
    category: 'تكنولوجيا التعليم ومنصات LMS',
    hours: 8,
    issueDate: '2026-09-21',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MOEHE-PLC1-2026-06',
    skillsAcquired: ['استراتيجيات التدريس', 'قيادة المشاريع الإلكترونية المدرسية', 'متابعة مؤشرات التفعيل'],
    impactOnWork: 'استراتيجيات التدريس - مواءمة خطط التعليم الإلكتروني بالمدرسة مع موجهات الوزارة ومشاركة أفضل الممارسات التدريسية.',
    notes: 'السجل 6 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (8 ساعات).',
    createdAt: '2026-09-21T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-07',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'حضور ورشة برنامج الذكاء الاصطناعي في التعليم والتعلم لمنسقي المشاريع الإلكترونية',
    titleEn: 'AI in Teaching and Learning Workshop for E-Learning Project Coordinators',
    issuer: 'ادارة التعليم الالكتروني والحلول الرقمية',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 8,
    issueDate: '2026-09-23',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MOEHE-AI-COORD-2026-07',
    skillsAcquired: ['سياسة الذكاء الاصطناعي في التعليم', 'أدوات التعليم الذكية التوليدية', 'ضوابط الاستخدام والحوكمة'],
    impactOnWork: 'سياسة الذكاء الاصطناعي في التعليم - صياغة التوجيهات المدرسية للاستخدام الرشيد لأدوات AI وتطبيق السياسات الوزارية.',
    notes: 'السجل 7 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (8 ساعات).',
    createdAt: '2026-09-23T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-08',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Edpuzzle training',
    titleEn: 'Edpuzzle training',
    issuer: 'Edpuzzle',
    category: 'تكنولوجيا التعليم ومنصات LMS',
    hours: 2,
    issueDate: '2026-09-26',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'EDPUZZLE-CERT-2026-08',
    skillsAcquired: ['Edpuzzle', 'إنتاج الفيديوهات التعليمية التفاعلية', 'التقييم البنائي الذكي'],
    impactOnWork: 'Edpuzzle - تمكين كادر المدرسة من دمج الفيديوهات التفاعلية ونقاط التقييم الذاتي ضمن دروس نظام قطر للتعليم والفرق الصفية.',
    notes: 'السجل 8 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-09-26T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-09',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'شبكة الشباب العالمية للجودة والتميز في التعليم',
    titleEn: 'Global Youth Network for Quality and Excellence in Education',
    issuer: 'UNESCO',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 8,
    issueDate: '2026-09-29',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'UNESCO-GYN-2026-09',
    skillsAcquired: ['الانظمام الى الشبكة', 'معايير الجودة والتميز في التعليم', 'الشبكات الشبابية الدولية'],
    impactOnWork: 'الانظمام الى الشبكة - تعزيز حضور المدرسة في الفعاليات الدولية للجودة والتميز ونقل التجارب الرائدة للطلاب.',
    notes: 'السجل 9 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (8 ساعات).',
    createdAt: '2026-09-29T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-10',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Installing & Programming Solar Charge Controllers',
    titleEn: 'Workshop: Installing & Programming Solar Charge Controllers',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-02',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-SOLAR-2026-10',
    skillsAcquired: ['PROJECT RESEARCH', 'تركيب منظمات الشحن الشمسية', 'برمجة أنظمة الطاقة المتجددة'],
    impactOnWork: 'PROJECT RESEARCH - توظيف المفاهيم الهندسية والبرمجية في الإشراف على بحوث ومشاريع الطلاب في مختبرات الطاقة والاستدامة.',
    notes: 'السجل 10 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-11',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Introduction to 3D Design Modeling with Onshape for Teachers',
    titleEn: 'Workshop: Introduction to 3D Design Modeling with Onshape for Teachers',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-04',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-ONSHAPE-2026-11',
    skillsAcquired: ['PROJECT RESEARCH', 'التصميم ثلاثي الأبعاد Onshape', 'النمذجة السحابية والتصنيع الرقمي'],
    impactOnWork: 'PROJECT RESEARCH - إسناد المعلمين في استخدام منصة Onshape وتطوير نماذج المشاريع الابتكارية للطلاب بالمختبرات.',
    notes: 'السجل 11 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-04T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-12',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Introduction to the School Scientific Research & Innovation Program (Grades 10–11)',
    titleEn: 'Introduction to the School Scientific Research & Innovation Program (Grades 10–11)',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-06',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-SRIP-G1011-2026-12',
    skillsAcquired: ['PROJECT RESEARCH', 'منهجية البحث العلمي للصفين 10 و 11', 'الابتكار العلمي والتقني'],
    impactOnWork: 'PROJECT RESEARCH - تأطير برنامج البحث العلمي والابتكار لطلاب الصفين العاشر والحادي عشر وتحكيم المخرجات البحثية.',
    notes: 'السجل 12 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-06T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-13',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Arduino Projects & Applications in Integrated STEM Education',
    titleEn: 'Arduino Projects & Applications in Integrated STEM Education',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-08',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-ARDUINO-2026-13',
    skillsAcquired: ['PROJECT RESEARCH', 'برمجة الأردوينو في التعليم التكاملي STEM', 'تطبيقات المستشعرات والمتحكمات'],
    impactOnWork: 'PROJECT RESEARCH - دمج تطبيقات الأردوينو العملية في مناهج ومشاريع STEM المدرسية ودعم الفرق المشاركة بالمسابقات.',
    notes: 'السجل 13 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-08T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-14',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Introduction to ESP32 Microcontroller Programming',
    titleEn: 'Introduction to ESP32 Microcontroller Programming',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-10',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-ESP32-2026-14',
    skillsAcquired: ['PROJECT RESEARCH', 'برمجة متحكم ESP32', 'تطبيقات الاتصال اللاسلكي وإنترنت الأشياء'],
    impactOnWork: 'PROJECT RESEARCH - توجيه الطلاب في بناء نماذج أجهزة متصلة بالإنترنت وإنترنت الأشياء لمشاريع المعارض والمسابقات العلمية.',
    notes: 'السجل 14 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-15',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'إطار الكفايات الرقمية للمعلمين',
    titleEn: 'Digital Competency Framework for Teachers',
    issuer: 'ادارة التعليم الالكتروني والحلول الرقمية',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 2,
    issueDate: '2026-10-12',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MOEHE-DCF-2026-15',
    skillsAcquired: ['الكفايات الرقمية للمعلمين', 'معايير التمكين الرقمي الصفي', 'تقييم الممارسات التدريسية التكنولوجية'],
    impactOnWork: 'الكفايات الرقمية للمعلمين - تطبيق إطار المعايير الوزارية في تقييم احتياجات المعلمين وبناء خطط الدعم الفردي والورش التخصصية.',
    notes: 'السجل 15 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: خارجي (2 ساعة).',
    createdAt: '2026-10-12T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-16',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'PD Workshop Invitation: Creating Interactive Digital Walkthroughs with LLM',
    titleEn: 'PD Workshop Invitation: Creating Interactive Digital Walkthroughs with LLM',
    issuer: 'QSTSS',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 2,
    issueDate: '2026-10-14',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-LLM-WALK-2026-16',
    skillsAcquired: ['PROJECT RESEARCH', 'النماذج اللغوية الكبيرة LLM', 'بناء الجولات التفاعلية الرقمية'],
    impactOnWork: 'PROJECT RESEARCH - تطوير أدلة ومسارات تفاعلية للمناهج الرقمية والأنظمة التعليمية بالمدرسة بالاعتماد على أدوات LLM.',
    notes: 'السجل 16 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-14T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-17',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Introduction to the Grade 7 Research and Innovation Program',
    titleEn: 'Workshop: Introduction to the Grade 7 Research and Innovation Program',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-15',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-G7-RIP-2026-17',
    skillsAcquired: ['PROJECT RESEARCH', 'منهجية البحث العلمي لطلاب الصف السابع', 'التفكير التصميمي والابتكاري'],
    impactOnWork: 'PROJECT RESEARCH - إعداد وتهيئة طلبة الصف السابع للمهارات البحثية الأساسية ومشاريع STEM المتقدمة.',
    notes: 'السجل 17 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-18',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Introduction to the Shell NXplorers 2026 Program',
    titleEn: 'Workshop: Introduction to the Shell NXplorers 2026 Program',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-16',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-NXPLORERS-2026-18',
    skillsAcquired: ['PROJECT RESEARCH', 'برنامج Shell NXplorers', 'أدوات التفكير المعقد واستشراف الحلول المستدامة'],
    impactOnWork: 'PROJECT RESEARCH - تدريب وتأهيل الفرق الطلابية على منهجية Shell NXplorers لحل مشكلات الطاقة والمياه والغذاء.',
    notes: 'السجل 18 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-16T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-19',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Introduction to the School Scientific Research & Innovation Program',
    titleEn: 'Workshop: Introduction to the School Scientific Research & Innovation Program',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 2,
    issueDate: '2026-10-18',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-SRIP-GEN-2026-19',
    skillsAcquired: ['PROJECT RESEARCH', 'البرنامج العام للبحث والابتكار المدرسي', 'معايير جودة الأبحاث التنافسية'],
    impactOnWork: 'PROJECT RESEARCH - توحيد معايير وأطر البحث العلمي والابتكار عبر كافة الأقسام الأكاديمية بالمدرسة.',
    notes: 'السجل 19 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-18T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-20',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'Workshop: Arduino Projects & Applications in Integrated STEM Education (Advanced)',
    titleEn: 'Workshop: Arduino Projects & Applications in Integrated STEM Education',
    issuer: 'QSTSS',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 1,
    issueDate: '2026-10-19',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-ARDUINO-ADV-2026-20',
    skillsAcquired: ['PROJECT RESEARCH', 'التطبيقات العملية والمحاكاة التفاعلية', 'معالجة الأعطال البرمجية والكهربائية'],
    impactOnWork: 'PROJECT RESEARCH - جلسة تدريبية مكثفة لحل المشكلات البرمجية ومتابعة الدوائر الإلكترونية التنافسية لفرق الروبوت.',
    notes: 'السجل 20 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (1 ساعة).',
    createdAt: '2026-10-19T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-21',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'الإسعافات الأولية والإصابات الشائعة في المدارس First Aid and Common Injuries in Schools',
    titleEn: 'First Aid and Common Injuries in Schools',
    issuer: 'QSTSS',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 2,
    issueDate: '2026-10-20',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-FIRSTAID-2026-21',
    skillsAcquired: ['الاسعافات الاولية', 'التعامل مع الطوارئ المخبرية والصفية', 'إجراءات السلامة المدرسية'],
    impactOnWork: 'الاسعافات الاولية - رفع مستوى الجاهزية للسلامة المهنية والصحية بمختبرات التكنولوجيا والمشاغل الهندسية.',
    notes: 'السجل 21 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
  {
    id: 'sdev-log-22',
    coordinatorName: 'Ahmad Adel Tubaishat',
    role: 'منسق مشروع التعلم الإلكتروني',
    title: 'محاضرة لغة الجسد ومهارات التواصل (Body Language Lecture)',
    titleEn: 'Body Language Lecture',
    issuer: 'QSTSS',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 2,
    issueDate: '2026-10-22',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'داخلي',
    credentialId: 'QSTSS-BODYLANG-2026-22',
    skillsAcquired: ['مهارات التواصل', 'لغة الجسد والعرض الإلقائي', 'التفاعل الإيجابي مع المعلمين والطلاب'],
    impactOnWork: 'مهارات التواصل - تعزيز مهارات الإلقاء والتأثير أثناء تقديم الورش وإدارة الاجتماعات التقنية والتربوية.',
    notes: 'السجل 22 في سجل التطوير المهني الرسمي (PD Log) - نوع التطوير: داخلي (2 ساعة).',
    createdAt: '2026-10-22T08:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// الشهادات التخصصية القيادية والدولية السابقة المعتمدة
// ─────────────────────────────────────────────────────────────────────────────
export const PREVIOUS_MAJOR_CERTIFICATIONS: SelfDevelopmentRecord[] = [
  {
    id: 'sdev-01',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'خبير مايكروسوفت العالمي للتعليم المبتكر (MIE Expert 2026-2027)',
    titleEn: 'Microsoft Innovative Educator Expert (MIEE)',
    issuer: 'Microsoft Global Education',
    category: 'تكنولوجيا التعليم ومنصات LMS',
    hours: 60,
    issueDate: '2026-08-15',
    expiryDate: '2027-08-31',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MS-MIEE-2026-QSTSS-0982',
    credentialUrl: 'https://learn.microsoft.com/en-us/credentials/',
    skillsAcquired: [
      'دمج أدوات M365 في التعليم المتقدم',
      'توظيف Teams وOneNote في إدارة التعليم الرقمي',
      'قيادة التمكين الرقمي لكادر المدرسة',
    ],
    impactOnWork: 'دعم وتمكين كادر المعلمين والطلاب في تفعيل نظام قطر للتعليم والمنصات التخصصية، ومتابعة حصول معلمي الأقسام على شهادات MEEE.',
    notes: 'شهادة الاعتماد العالمي السنوية المعتمدة من شركة مايكروسوفت كخبير تعليمي مبتكر.',
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'sdev-02',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'تطبيقات الذكاء الاصطناعي التوليدي لمنسقي المشاريع والتعليم الرقمي',
    titleEn: 'Generative AI Applications in STEM Education & Leadership',
    issuer: 'وزارة التربية والتعليم والتعليم العالي بالتعاون مع Microsoft',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 25,
    issueDate: '2026-09-02',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MOEHE-AI-COORD-2026-044',
    credentialUrl: 'https://qstssschools.web.app',
    skillsAcquired: [
      'استخدام النماذج اللغوية الكبيرة في إعداد الخطط والمشاريع',
      'ضوابط الأمان والخصوصية وحماية البيانات في أدوات AI',
      'هندسة الأوامر Prompt Engineering للمحتوى العلمي',
    ],
    impactOnWork: 'حضور الورشة الوزارية التخصصية بفندق ميريديان وتطبيق موجهات الوزارة في المدرسة وبناء أدوات مساندة لخطط المعلمين والطلاب.',
    notes: 'معتمدة رسمياً وموثقة في تقرير فعاليات واجتماعات شهر سبتمبر 2026م.',
    createdAt: '2026-09-02T14:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
  {
    id: 'sdev-03',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'قيادة التحول الرقمي وإدارة الأنظمة المدرسية الذكية',
    titleEn: 'Leading Digital Transformation in STEM Schools',
    issuer: 'Harvard Graduate School of Education / EdX',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 45,
    issueDate: '2026-08-20',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'HVD-EDX-LDTS-88712',
    credentialUrl: 'https://credentials.edx.org',
    skillsAcquired: [
      'التخطيط الاستراتيجي الرقمي للمدارس التخصصية',
      'قياس مؤشرات الأداء والتحول التكنولوجي المؤسسي',
      'إدارة التغيير ومقاومة التقنية ورفع الكفاءة التشغيلية',
    ],
    impactOnWork: 'تطوير الخطة التشغيلية الإجرائية لقسم المشاريع والتعليم الإلكتروني وبناء لوحات المؤشرات الرقمية المدرسية.',
    notes: 'برنامج قيادي دولي معتمد يركز على بيئات STEM والمدارس التخصصية المتقدمة.',
    createdAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'sdev-04',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'إدارة البنية السحابية وشبكات الأنظمة التعليمية (Microsoft Certified: Azure Fundamentals)',
    titleEn: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
    issuer: 'Microsoft Corporation',
    category: 'الحوسبة السحابية والبنية التقنية',
    hours: 40,
    issueDate: '2026-05-18',
    expiryDate: 'سارية المفعول',
    academicYear: '2025-2026',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MS-AZ900-7762145',
    credentialUrl: 'https://learn.microsoft.com/credentials/',
    skillsAcquired: [
      'إدارة الموارد السحابية والحسابات والخدمات المدرسية',
      'أمان البنية التحتية والنسخ الاحتياطي السحابي',
      'إدارة الهوية والوصول الموحد SSO',
    ],
    impactOnWork: 'ضمان استقرار الخوادم والمنصات وتكامل قواعد البيانات السحابية لنظام تتبع مؤشرات المعلمين والمشاريع.',
    notes: 'شهادة مهنية احترافية معتمدة دولياً في الحوسبة السحابية والبنى التحتية.',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sdev-05',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'الأمن السيبراني وحماية البيانات في البيئات المدرسية الذكية',
    titleEn: 'Cybersecurity & Data Privacy in Educational Institutions',
    issuer: 'الوكالة الوطنية للأمن السيبراني (NCSA) - دولة قطر',
    category: 'الأمن السيبراني وحماية البيانات',
    hours: 30,
    issueDate: '2026-09-12',
    expiryDate: '2028-09-12',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'NCSA-EDU-QATAR-2026-118',
    credentialUrl: 'https://ncsa.gov.qa/ar/training',
    skillsAcquired: [
      'سياسات حماية البيانات المدرسية وقانون الخصوصية القطري',
      'إدارة الثغرات ومكافحة التصيد الإلكتروني بالمدارس',
      'تأمين الأجهزة التفاعلية وحسابات الطلاب والمعلمين',
    ],
    impactOnWork: 'إعداد سياسة الاستخدام المقبول للأدوات التكنولوجية ونشر الدليل الإرشادي للأمن السيبراني لكادر المدرسة والطلاب.',
    notes: 'برنامج وطني معتمد من الوكالة الوطنية للأمن السيبراني بدولة قطر.',
    createdAt: '2026-09-12T11:00:00.000Z',
    updatedAt: '2026-09-26T14:00:00.000Z',
  },
  {
    id: 'sdev-06',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'إدارة المشاريع التعليمية والحلول الرقمية (PMP in Digital Education)',
    titleEn: 'Project Management Professional in Digital Learning (PMI)',
    issuer: 'Project Management Institute (PMI) / Coursera',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 50,
    issueDate: '2026-07-28',
    expiryDate: '2029-07-28',
    academicYear: '2025-2026',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'PMI-PMP-ED-554190',
    credentialUrl: 'https://www.pmi.org/certifications',
    skillsAcquired: [
      'التخطيط الزمني والموارد لخطة المشاريع المدرسية',
      'إدارة المخاطر التقنية وجودة المخرجات الرقمية',
      'التنسيق والتواصل الفعال مع أصحاب المصلحة والإدارة',
    ],
    impactOnWork: 'هيكلة وإدارة الخطة الإجرائية السنوية والتقارير الشهرية ومتابعة تنفيذ الفعاليات والمشاريع التكنولوجية بدقة عالية.',
    notes: 'منهجية معتمدة لإدارة المشاريع التكنولوجية والتعليمية وفق أفضل الممارسات العالمية.',
    createdAt: '2026-07-28T09:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'sdev-07',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'تصميم وإدارة الفصول الافتراضية والتعلم عن بعد المتقدم لمدارس STEM',
    titleEn: 'Mastering Virtual Classrooms & Distance Learning Platforms',
    issuer: 'وزارة التربية والتعليم والتعليم العالي — قسم التعليم الإلكتروني',
    category: 'تكنولوجيا التعليم ومنصات LMS',
    hours: 35,
    issueDate: '2026-09-08',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'MOEHE-DL-SPEC-2026-319',
    credentialUrl: 'https://qstssschools.web.app',
    skillsAcquired: [
      'بناء وتكوين فصول الفرق الافتراضية والواجبات البديلة',
      'متابعة وإحصاء مؤشرات الالتزام وحضور حصص البث المباشر',
      'الربط التلقائي للشعب وفصول نظام قطر للتعليم والتقييمات',
    ],
    impactOnWork: 'تأسيس نظام متكامل لإدارة سجلات وإحصاءات وتقارير التعلم عن بعد بمدرسة قطر للعلوم والتكنولوجيا وربطه بالشعب الدراسية.',
    notes: 'برنامج وزاري تخصصي معتمد لتأهيل منسقي المشاريع لإدارة حالات التعلم عن بعد بكفاءة.',
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-28T16:00:00.000Z',
  },
  {
    id: 'sdev-08',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'تحليل البيانات التعليمية المتقدم ولوحات المؤشرات التفاعلية (Power BI & Analytics)',
    titleEn: 'Advanced Educational Analytics & Interactive Dashboards',
    issuer: 'Google Cloud & Coursera',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 35,
    issueDate: '2026-08-30',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'GC-PBI-EDU-88129',
    credentialUrl: 'https://coursera.org/verify/GC-PBI-88129',
    skillsAcquired: [
      'تحليل مؤشرات تفاعل المعلمين والطلاب على منصات LMS',
      'بناء الرسوم البيانية التفاعلية ومخططات المقارنة المؤسسية',
      'التنبؤ الأكاديمي والتدخل المبكر المبني على البيانات',
    ],
    impactOnWork: 'بناء وتطوير منظومة تقارير تقييم نظام قطر للتعليم ورسوم تحليل الشعب والعبء التدريسي وتكريم المتميزين.',
    notes: 'برنامج متقدم يركز على تحويل البيانات المدرسية الضخمة إلى قرارات تعليمية وإدارية ذكية.',
    createdAt: '2026-08-30T10:00:00.000Z',
    updatedAt: '2026-09-22T13:00:00.000Z',
  },
  {
    id: 'sdev-09',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'تطبيقات الواقع الافتراضي والمعزز والطباعة ثلاثية الأبعاد في مختبرات STEM',
    titleEn: 'VR/AR & 3D Prototyping in STEM Laboratories',
    issuer: 'النادي العلمي القطري & جامعة قطر',
    category: 'إدارة المشاريع التعليمية والابتكار',
    hours: 30,
    issueDate: '2026-09-18',
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'QSC-STEM-VR-2026-091',
    credentialUrl: 'https://qsc.org.qa/workshops',
    skillsAcquired: [
      'تشغيل وبرمجة منصات zSpace والواقع الافتراضي',
      'دمج برمجيات التصميم الرقمي والطباعة ثلاثية الأبعاد في المناهج',
      'إدارة مختبر التصنيع الرقمي FabLab ومختبرات الطاقة والشبكات',
    ],
    impactOnWork: 'دعم المعلمين والطلاب في تفعيل مختبرات STEM المتقدمة بالمدرسة والإشراف على المشاريع التنافسية للأولمبياد والمسابقات الوطنية.',
    notes: 'برنامج تطبيقي عملي مكثف يواكب المعايير الدولية لمختبرات مدارس العلوم والتكنولوجيا.',
    createdAt: '2026-09-18T14:00:00.000Z',
    updatedAt: '2026-09-27T09:00:00.000Z',
  },
  {
    id: 'sdev-10',
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: 'دبلوم تدريب المدربين المعتمد في استراتيجيات التعليم الرقمي (Certified Master Trainer)',
    titleEn: 'Certified Master Trainer in Digital Learning Methodologies',
    issuer: 'مركز التدريب والتطوير التربوي - وزارة التربية والتعليم والتعليم العالي',
    category: 'القيادة والتحول الرقمي المدرسي',
    hours: 50,
    issueDate: '2026-06-10',
    expiryDate: '2029-06-10',
    academicYear: '2025-2026',
    status: 'معتمدة وسارية',
    pdType: 'خارجي',
    credentialId: 'TEDC-CMT-QATAR-2026-015',
    credentialUrl: 'https://www.edu.gov.qa',
    skillsAcquired: [
      'تصميم الحقائب التدريبية التخصصية للمعلمين',
      'منهجيات تدريب الكبار وتيسير الورش التفاعلية',
      'تقييم أثر التدريب وقياس العائد على التطوير المهني',
    ],
    impactOnWork: 'إعداد وتقديم الورش التدريبية لكادر المعلمين والإداريين بالمدارس التخصصية الجديدة وتمكينهم من استخدام الأدوات التقنية.',
    notes: 'شهادة تدريب مدربين رسمية معتمدة من مركز التدريب والتطوير التربوي بوزارة التربية والتعليم.',
    createdAt: '2026-06-10T08:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
];

// دمج السجلات الرسمية مع الشهادات السابقة بدون أي تكرار
export const INITIAL_SELF_DEVELOPMENT_RECORDS: SelfDevelopmentRecord[] = (() => {
  const list: SelfDevelopmentRecord[] = [...OFFICIAL_PD_LOG_2026_RECORDS];
  for (const prev of PREVIOUS_MAJOR_CERTIFICATIONS) {
    if (!isDuplicateSelfDevRecord(prev, list)) {
      list.push(prev);
    }
  }
  return list;
})();

// ─────────────────────────────────────────────────────────────────────────────
// التخزين واسترجاع البيانات (Local Persistence + Firebase Firestore Cloud Sync)
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_PREFIX = 'qstss_self_development_records_v1_';

export function getSelfDevelopmentStorageKey(academicYear: string = '2026-2027'): string {
  return `${STORAGE_PREFIX}${academicYear}`;
}

// مزامنة فورية في الخلفية مع Firebase Firestore
if (typeof window !== 'undefined') {
  try {
    getCollection<SelfDevelopmentRecord>(COLLECTIONS.selfDevelopment).then(cloudItems => {
      if (cloudItems && cloudItems.length > 0 && localStorage.getItem('qstss_pending_self_development') !== '1') {
        const key = getSelfDevelopmentStorageKey('2026-2027');
        localStorage.setItem(key, JSON.stringify(cloudItems));
        window.dispatchEvent(
          new CustomEvent('qstss_self_development_updated', {
            detail: { academicYear: '2026-2027', count: cloudItems.length },
          })
        );
      }
    }).catch(() => {});
  } catch (e) {}
}

export function loadSelfDevelopmentRecords(academicYear: string = '2026-2027'): SelfDevelopmentRecord[] {
  if (typeof window === 'undefined') return INITIAL_SELF_DEVELOPMENT_RECORDS;
  try {
    const key = getSelfDevelopmentStorageKey(academicYear);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // فحص السجلات وتضمين أي ورشة جديدة من القائمة المعتمدة دون أي تكرار
        let isUpdated = false;
        const mergedList = [...parsed];
        for (const candidate of INITIAL_SELF_DEVELOPMENT_RECORDS) {
          if (!isDuplicateSelfDevRecord(candidate, mergedList)) {
            mergedList.push(candidate);
            isUpdated = true;
          }
        }
        if (isUpdated) {
          try {
            localStorage.setItem(key, JSON.stringify(mergedList));
          } catch (e) {}
          return mergedList;
        }
        return parsed;
      }
    }
    // حفظ البيانات الأولية إذا لم تكن موجودة محلياً وسحابياً
    saveSelfDevelopmentRecords(INITIAL_SELF_DEVELOPMENT_RECORDS, academicYear);
    return INITIAL_SELF_DEVELOPMENT_RECORDS;
  } catch (error) {
    console.error('Error loading self development records:', error);
    return INITIAL_SELF_DEVELOPMENT_RECORDS;
  }
}

export function saveSelfDevelopmentRecords(
  records: SelfDevelopmentRecord[],
  academicYear: string = '2026-2027'
): void {
  if (typeof window === 'undefined') return;
  if (!isAuthorizedToSave()) {
    console.warn('[Security] Unauthorized attempt to save self development records blocked.');
    return;
  }
  try {
    const key = getSelfDevelopmentStorageKey(academicYear);
    localStorage.setItem(key, JSON.stringify(records));
    // إرسال حدث مخصص لتحديث الخطة الإجرائية وبقية المكونات
    window.dispatchEvent(
      new CustomEvent('qstss_self_development_updated', {
        detail: { academicYear, count: records.length },
      })
    );
  } catch (error) {
    console.error('Error saving self development records to localStorage:', error);
  }

  // حفظ التعديلات في سحابة Firebase Firestore
  try {
    saveCollection(COLLECTIONS.selfDevelopment, records).catch(err => {
      console.warn('Error saving self development records to Firestore:', err);
    });
  } catch (err) {
    console.warn('Error triggering Firestore save for self development:', err);
  }
}

export function resetSelfDevelopmentRecords(academicYear: string = '2026-2027'): SelfDevelopmentRecord[] {
  if (!isAuthorizedToSave()) return INITIAL_SELF_DEVELOPMENT_RECORDS;
  saveSelfDevelopmentRecords(INITIAL_SELF_DEVELOPMENT_RECORDS, academicYear);
  return INITIAL_SELF_DEVELOPMENT_RECORDS;
}

// ─────────────────────────────────────────────────────────────────────────────
// حساب الإحصاءات والمؤشرات الرقمية لسجل التطوير الذاتي
// ─────────────────────────────────────────────────────────────────────────────
export function calculateSelfDevelopmentStats(records: SelfDevelopmentRecord[]) {
  const totalCertificates = records.length;
  const totalHours = records.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
  const activeCount = records.filter(r => r.status === 'معتمدة وسارية').length;
  const completedCount = records.filter(r => r.status === 'مكتملة').length;
  const inProgressCount = records.filter(r => r.status === 'قيد التدريب').length;

  const internalRecords = records.filter(r => r.pdType === 'داخلي');
  const externalRecords = records.filter(r => r.pdType !== 'داخلي');
  const internalCount = internalRecords.length;
  const externalCount = externalRecords.length;
  const internalHours = internalRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
  const externalHours = externalRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

  const uniqueIssuers = Array.from(new Set(records.map(r => r.issuer).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(records.map(r => r.category).filter(Boolean)));

  // توزيع الساعات والشهادات حسب المجال
  const categoryStats = SELF_DEV_CATEGORIES.map(cfg => {
    const catRecords = records.filter(r => r.category === cfg.category);
    const count = catRecords.length;
    const hours = catRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    return {
      name: cfg.category,
      count,
      hours,
      color: cfg.color,
      bgColor: cfg.bgColor,
      percentage: totalCertificates > 0 ? Math.round((count / totalCertificates) * 100) : 0,
    };
  }).filter(c => c.count > 0);

  // توزيع الساعات والشهادات حسب الجهة المانحة
  const issuerStats = uniqueIssuers.map(issuer => {
    const issuerRecords = records.filter(r => r.issuer === issuer);
    const count = issuerRecords.length;
    const hours = issuerRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    return {
      issuer,
      count,
      hours,
    };
  }).sort((a, b) => b.hours - a.hours);

  return {
    totalCertificates,
    totalHours,
    internalCount,
    externalCount,
    internalHours,
    externalHours,
    activeCount,
    completedCount,
    inProgressCount,
    uniqueIssuersCount: uniqueIssuers.length,
    uniqueCategoriesCount: uniqueCategories.length,
    categoryStats,
    issuerStats,
    averageHoursPerCert: totalCertificates > 0 ? Math.round(totalHours / totalCertificates) : 0,
  };
}
