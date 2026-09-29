// =============================================================================
// إدارة سجلات وبيانات التطوير الذاتي لمنسق المشاريع (Self Development Data Management)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني والحلول الرقمية
// خاص بالشهادات المهنية والدورات التخصصية لمنسق المشاريع: م. أحمد عادل طبيشات
// =============================================================================

import { getCollection, saveCollection, COLLECTIONS } from './firestoreDb';

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
  coordinatorName: string; // م. أحمد عادل طبيشات
  role: string; // منسق المشاريع الإلكترونية والحلول الرقمية
  title: string; // اسم الشهادة أو الدورة
  titleEn?: string; // الاسم بالإنجليزية
  issuer: string; // الجهة المانحة (Microsoft, Google, Ministry, Harvard, PMI...)
  category: SelfDevelopmentCategory; // المجال التخصصي
  hours: number; // عدد الساعات التدريبية
  issueDate: string; // تاريخ الإنجاز / الحصول عليها YYYY-MM-DD
  expiryDate?: string; // تاريخ الانتهاء أو "سارية المفعول"
  academicYear: string; // العام الأكاديمي مثل 2026-2027
  status: SelfDevelopmentStatus; // معتمدة وسارية / مكتملة / قيد التدريب
  credentialId?: string; // رقم الاعتماد / كود التحقق
  credentialUrl?: string; // رابط الشهادة الرقمية أو التحقق
  skillsAcquired: string[]; // المهارات التخصصية المكتسبة
  impactOnWork: string; // الأثر والتطبيق العملي في المدرسة والمشاريع
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
// البيانات الأولية المعتمدة لمنسق المشاريع م. أحمد عادل طبيشات
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_SELF_DEVELOPMENT_RECORDS: SelfDevelopmentRecord[] = [
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
      if (cloudItems && cloudItems.length > 0) {
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
