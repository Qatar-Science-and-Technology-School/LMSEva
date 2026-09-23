import { SEED_TASKS, SEED_NOTES, SEED_ACHIEVEMENTS } from './seedData';
import { PD_WORKSHOPS, PD_INDIVIDUAL_RECORDS } from './pdData';
import { generateSeptember2026Evaluations } from './lmsReportSeptember2026';
export * from './lmsReportSeptember2026';

// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
export const SCHOOL_NAME = 'مدرسة قطر للعلوم والتكنولوجيا الاعدادية الثانوية للبنين - أم السنيم';
export const SYSTEM_TITLE = 'التعليم الالكتروني والحلول الرقمية';
export const SYSTEM_SUBTITLE = 'نظام إلكتروني لمتابعة وتقييم تفعيل المعلمين لنظام قطر للتعليم والمنصات التعليمية الرقمية';
export const DESIGNER_CREDIT = 'تصميم وتطوير: م.أحمد طبيشات - منسق المشاريع الإلكترونية';

export type Role = 'admin' | 'evaluator' | 'leader' | 'coordinator' | 'viewer';
export interface User {
  id:string; name:string; nameEn?:string;
  email:string; username?:string;
  password:string; role:Role;
  departmentId?:string;       // legacy single-dept (kept for compat)
  departmentIds?:string[];    // official: array supports multiple depts
  pendingEmail?:boolean;      // true = no official email yet
  status:'active'|'inactive'|'pending';
  employeeId?:string;
  teacherId?:string;
}
export interface Department { id:string; nameAr:string; nameEn:string; }
export interface Teacher { id:string; employeeId:string; nameAr:string; nameEn:string; departmentId:string; subject:string; email:string; jobCategory:string; status:'active'|'inactive'; createdAt:string; activeFromYear?:string; excludedYears?:string[]; }
export interface EvaluationCriterion { score:number; note:string; }
export interface Evaluation { id:string; teacherId:string; evaluatorId:string; month:string; academicYear:string; term?:string; evaluationDate:string; criteria:EvaluationCriterion[]; totalScore:number; averageScore:number; percentage:number; performanceLevel:string; strengths:string; improvementAreas:string; recommendations:string; actionPlan:string; hasWeeklyAssignment?:boolean; evidenceLinks:string[]; generalNotes:string; createdAt:string; updatedAt:string; }

export interface ModelLessonEvaluation {
  id: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn: string;
  departmentId: string;
  departmentName: string;
  academicYear: string;
  month?: string;
  date: string;
  period: string;
  classGrade: string;
  toolsUsed: string;
  scoreAssessmentFeedback: number;
  scoreTechDepth: number;
  scoreLmsClarity: number;
  scoreClassroomMgmt: number;
  scoreStudentEngagement: number;
  scoreTeacherTools: number;
  overallScore: number;
  strengths: string;
  improvements: string;
  recommendations: string;
  lessonPlanUrl?: string;
  attendees?: string;
  teacherSignature?: string;
  academicDeputySignature?: string;
  eProjectsCoordSignature?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelLessonScheduleItem {
  id: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn?: string;
  departmentId: string;
  departmentName?: string;
  subject?: string;
  academicYear: string;
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد, الإثنين, الثلاثاء, الأربعاء, الخميس
  period: string; // 1 to 7
  classGrade: string; // e.g. "9-1", "10-2", "11-AP"
  lessonTopic: string; // عنوان أو موضوع الحصة
  toolsPlanned: string; // الأدوات والتطبيقات الرقمية المقترحة
  roomVenue?: string; // المختبر أو القاعة الصفية
  notes?: string;
  status: 'مجدولة' | 'تم التنفيذ' | 'مؤجلة' | 'ملغاة';
  evaluatorId?: string;
  evaluatorName?: string;
  evaluationId?: string; // link to evaluation if executed
  createdAt: string;
  updatedAt: string;
}


// --- Daily Tasks ---
export type TaskStatus = 'مكتملة' | 'قيد التنفيذ' | 'مؤجلة' | 'تحتاج متابعة' | 'ملغاة' | 'يوجد دليل إنجاز';
export type TaskPriority = 'عالية' | 'متوسطة' | 'منخفضة';
export type TaskType = 'يومية' | 'أسبوعية' | 'شهرية' | 'مشروع';

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  taskDate: string;
  month: string;
  academicYear: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  completionPercentage: number;
  hasEvidence?: boolean;
  evidenceLabel?: string;
  evidenceStatus?: string;
  evidenceUrl?: string;
  evidenceFileUrl?: string;
  notes?: string;
  relatedEntityType?: string; 
  relatedEntityId?: string;
  taskType: TaskType;
  source: string;
  sourceSheet?: string;
  sourceRow?: number;
  executorName?: string;
  isApprovedByDeputy?: boolean;
  createdBy: string;
  approvedBy?: string;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyTaskNote {
  id: string;
  month: string;
  academicYear: string;
  note: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}


export interface ElearningSms {
  id: string;
  title: string;          // عنوان الرسالة
  messageText: string;    // نص الرسالة
  sentDate: string;       // تاريخ الإرسال (YYYY-MM-DD)
  academicYear?: string;
  senderName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  color: string;
  icon: string;
}

export interface CoordinatorFollowUpItem {
  criterion: string;
  score: number;
  notes?: string;
}

export interface CoordinatorFollowUpForm {
  id: string;
  employeeName: string;
  month: string;
  academicYear: string;
  formDate: string;
  totalScore: number;
  recommendations: string;
  notes: string;
  items: CoordinatorFollowUpItem[];
  evaluatorName?: string;
  evaluatorRole?: string;
  employeeSignature?: string;
  academicDeputySignature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  serialNumber: number;
  academicYear: string;
  organizer: string;
  level: 'عالمي' | 'إقليمي' | 'محلي';
  participationType: string;
  result: string;
  achievementName: string;
  smartCategory?: string;
  description?: string;
  achievementDate?: string;
  supervisorName?: string;
  supportingEntity?: string;
  evidenceLabel?: string;
  evidenceUrl?: string;
  evidenceFileUrl?: string;
  documentationStatus?: 'موثق' | 'يحتاج دليل' | 'قيد المراجعة';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const MONTHS = ['سبتمبر','أكتوبر','نوفمبر','يناير','فبراير','مارس','أبريل','مايو'];
export const ACADEMIC_YEARS = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027'];

export const ACHIEVEMENT_NAMES = [
  'مسابقة البحث العلمي والابتكار',
  'مسابقة البحث العلمي GYSTB – هونغ كونغ',
  'بطل مسابقة تحدي علوم المستقبل',
  'بطولة قطر للروبوت',
  'المؤتمر الدولي للذكاء الاصطناعي في كازاخستان',
  'المعرض الدولي للاختراعات في الشرق الأوسط - الكويت',
  'البطولة العربية للروبوت - ذراع الروبوت',
  'المسابقة الوطنية للذكاء الاصطناعي',
  'الأولمبياد الوطني للذكاء الاصطناعي والبرمجة',
  'مسابقة البحث العلمي للوكالة الوطنية لحظر أسلحة الدمار الشامل',
  'مسابقة قطر المستقبل للاستدامة',
  'باحث 5',
  'باحث 6',
  'باحث 7',
  'الأولمبياد الوطني للروبوت',
  'مسابقة جيل الإبداع الرقمي',
  'التأهل لنهائيات مسابقة البحث العلمي العالمية ISEF - USA',
  'The Earth Prize',
  'SDG Gamechanger Award',
  'الأولمبياد العربي للذكاء الاصطناعي والبرمجة والأمن السيبراني',
  'جائزة أفضل مهندس - مسابقة تحدي علوم المستقبل',
  'البطولة العربية للذكاء الاصطناعي',
  'هاكثون الذكاء الاصطناعي للمدارس التخصصية والتقنية',
  'مسابقة ترشيد كهرماء',
  'مسابقة USDT - Skills Day جامعة الدوحة للعلوم والتكنولوجيا',
  'مسابقة ابتكار',
  'بطولة قطر للذكاء الاصطناعي',
  'التأهل لمسابقة World Skills الآسيوية',
  'نشر بحث علمي في مجلة IEEE',
  'مسابقة البحث العلمي والتأهل إلى ITEX العالمية',
  'نشر بحث علمي في مجلة SmartNet',
  'نشر بحث علمي في موقع Google Scholar',
  'التأهل لمسابقة البحث العلمي والابتكار',
  'مسابقة التميز العلمي',
];

export const ACHIEVEMENT_RESULTS = [
  'المركز الأول',
  'المركز الثاني',
  'المركز الثالث',
  'المركز الأول والمركز الثاني',
  'الميدالية الذهبية',
  'الميدالية الفضية',
  'الميدالية البرونزية',
  'جائزة خاصة',
  'بحث علمي منشور',
  'تمثيل دولة قطر',
  'تأهل للمرحلة النهائية',
  'التأهل للمعرض',
  'المركز الثاني + التأهل العالمي',
  'أفضل خمس مشاريع في الشرق الأوسط',
  'شهادة تقدير',
  'مشاركة متميزة',
];
export interface EvaluationCriterion { score:number; note:string; value?:string|boolean; }
export interface Evaluation { id:string; teacherId:string; evaluatorId:string; month:string; academicYear:string; term?:string; evaluationDate:string; criteria:EvaluationCriterion[]; totalScore:number; averageScore:number; percentage:number; performanceLevel:string; strengths:string; improvementAreas:string; recommendations:string; actionPlan:string; hasWeeklyAssignment?:boolean; evidenceLinks:string[]; generalNotes:string; createdAt:string; updatedAt:string; }

export interface ModelLessonEvaluation {
  id: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn: string;
  departmentId: string;
  departmentName: string;
  academicYear: string;
  month?: string;
  date: string;
  period: string;
  classGrade: string;
  toolsUsed: string;
  scoreAssessmentFeedback: number;
  scoreTechDepth: number;
  scoreLmsClarity: number;
  scoreClassroomMgmt: number;
  scoreStudentEngagement: number;
  scoreTeacherTools: number;
  overallScore: number;
  strengths: string;
  improvements: string;
  recommendations: string;
  lessonPlanUrl?: string;
  attendees?: string;
  teacherSignature?: string;
  academicDeputySignature?: string;
  eProjectsCoordSignature?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export const EVALUATION_CRITERIA = [
  'تفعيل الدروس والخطط والمحتوى ومصادر التعلم',
  'تنظيم الدروس: رفع الأهداف وتخصيص صور الدروس',
  'تفاعل الطلاب وحلقات النقاش والتغذية الراجعة',
  'يقوم المعلم برفع الواجبات على النظام أسبوعياً',
  'يدخل المعلم باستمرار للنظام في الحصص الدراسية',
];

export interface QesLmsCriterionDef {
  id: string;
  num: string;
  name: string;
  short: string;
  max: number;
  type: 'scale' | 'boolean' | 'descriptive';
  measureType: string;
  scoreText: string;
  evidence: string;
  desc: string;
}

export const QES_LMS_CRITERIA: QesLmsCriterionDef[] = [
  {
    id: 'c1',
    num: '1',
    name: 'تفعيل الدروس والخطط والمحتوى ومصادر التعلم',
    short: 'الدروس والخطط والمحتوى',
    max: 20,
    type: 'scale',
    measureType: 'مقياس متدرج (1 - 20)',
    scoreText: 'من 20',
    evidence: 'شمولية رفع الخطط والمصادر الإثرائية بانتظام',
    desc: 'شمولية رفع الخطط والمصادر الإثرائية بانتظام'
  },
  {
    id: 'c2',
    num: '2',
    name: 'تنظيم الدروس: رفع الأهداف وتخصيص صور الدروس',
    short: 'تنظيم وأهداف وصور الدروس',
    max: 20,
    type: 'boolean',
    measureType: 'نعم / لا',
    scoreText: '20 أو 0',
    evidence: 'نعم = 20، لا = صفر (وضوح الأهداف وتعيين صور مناسبة للدروس)',
    desc: 'نعم = 20، لا = صفر (وضوح الأهداف وتعيين صور مناسبة للدروس)'
  },
  {
    id: 'c3',
    num: '3',
    name: 'تفاعل الطلاب وحلقات النقاش والتغذية الراجعة',
    short: 'تفاعل الطلاب والنقاش',
    max: 20,
    type: 'scale',
    measureType: 'مقياس متدرج (1 - 20)',
    scoreText: 'من 20',
    evidence: 'جودة التغذية الراجعة وتفاعل الطلبة في غرف النقاش',
    desc: 'جودة التغذية الراجعة وتفاعل الطلبة في غرف النقاش'
  },
  {
    id: 'c4',
    num: '4',
    name: 'يقوم المعلم برفع الواجبات على النظام أسبوعياً',
    short: 'رفع الواجبات الأسبوعية',
    max: 20,
    type: 'boolean',
    measureType: 'نعم / لا',
    scoreText: '20 أو 0',
    evidence: 'نعم = 20، لا = صفر (الالتزام بالجدول الزمني للواجبات الأسبوعية)',
    desc: 'نعم = 20، لا = صفر (الالتزام بالجدول الزمني للواجبات الأسبوعية)'
  },
  {
    id: 'c5',
    num: '5',
    name: 'يدخل المعلم باستمرار للنظام في الحصص الدراسية',
    short: 'دخول النظام في الحصص',
    max: 20,
    type: 'scale',
    measureType: 'مقياس متدرج (1 - 20)',
    scoreText: 'من 20',
    evidence: 'تفعيل النظام وتوظيفه المباشر داخل الحصة الصفية',
    desc: 'تفعيل النظام وتوظيفه المباشر داخل الحصة الصفية'
  },
  {
    id: 'c6',
    num: '-',
    name: 'يستخدم المعلم منصات تعليمية أخرى مساندة',
    short: 'المنصات المساندة',
    max: 0,
    type: 'descriptive',
    measureType: 'رصد وصفي (نعم / لا)',
    scoreText: 'بدون علامة',
    evidence: 'حصر الأدوات والمنصات المساندة (مثل: MS Teams وغيره)',
    desc: 'حصر الأدوات والمنصات المساندة (مثل: MS Teams وغيره)'
  }
];
export function getPerformanceLevel(score:number):{label:string;color:string;bg:string} {
  if(score>=90) return {label:'متميز',           color:'#065F46',bg:'#D1FAE5'};
  if(score>=80) return {label:'متقدم جدًا',       color:'#1E40AF',bg:'#DBEAFE'};
  return           {label:'يحتاج إلى متابعة وخطة تحسين',color:'#991B1B',bg:'#FEE2E2'};
}
export const SUBJECT_TO_DEPT:Record<string,string> = {
  'Arabic':'d_arabic','Islamic':'d_islamic','CS':'d_cs','Computer Science':'d_cs',
  'Math':'d_math','Mathematics':'d_math','Chemistry':'d_stem','Physics':'d_stem',
  'Biology':'d_stem','English':'d_english','STEM':'d_stem','Energy Lab':'d_energylab',
  'Fab Lab':'d_fablab','Robotic Lab':'d_robotlab','Social Studies':'d_social',
  'Administrative':'d_admin','Admin':'d_admin','PE':'d_pe','Physical Education':'d_pe',
  'Technology Design':'d_techdesign','Tech Design':'d_techdesign','Scientific Research':'d_research','Research':'d_research',
  'E-Learning':'d_elearning','ELearning':'d_elearning','التعليم الإلكتروني':'d_elearning','التعليم الالكتروني':'d_elearning',
  'التربية البدنية':'d_pe','التصميم التكنولوجي':'d_techdesign','البحث العلمي':'d_research','الإدارة':'d_admin',
};
export const initialDepartments:Department[] = [
  {id:'d_admin',      nameAr:'الإدارة',                nameEn:'Administration'},
  {id:'d_stem',       nameAr:'STEM',                   nameEn:'STEM'},
  {id:'d_research',   nameAr:'البحث العلمي',           nameEn:'Scientific Research'},
  {id:'d_cs',         nameAr:'الحاسوب',                nameEn:'Computer Science'},
  {id:'d_pe',         nameAr:'التربية البدنية',        nameEn:'Physical Education'},
  {id:'d_techdesign', nameAr:'التصميم التكنولوجي',     nameEn:'Technology Design'},
  {id:'d_arabic',     nameAr:'اللغة العربية',          nameEn:'Arabic Language'},
  {id:'d_islamic',    nameAr:'التربية الإسلامية',       nameEn:'Islamic Education'},
  {id:'d_english',    nameAr:'اللغة الإنجليزية',       nameEn:'English Language'},
  {id:'d_math',       nameAr:'الرياضيات',              nameEn:'Mathematics'},
  {id:'d_fablab',     nameAr:'مختبر التصنيع الرقمي',  nameEn:'Fab Lab'},
  {id:'d_robotlab',   nameAr:'مختبر الروبوت',          nameEn:'Robotic Lab'},
  {id:'d_energylab',  nameAr:'مختبر الطاقة',          nameEn:'Energy Lab'},
  {id:'d_social',     nameAr:'الدراسات الاجتماعية',    nameEn:'Social Studies'},
  {id:'d_elearning',  nameAr:'التعليم الإلكتروني',      nameEn:'E-Learning'},
];

// ── Official School Department Staff Counts & Canonical Mapping ───────────────
export const OFFICIAL_DEPARTMENT_STAFF: Record<string, { id: string; count: number; nameAr: string }> = {
  'التربية الإسلامية': { id: 'd_islamic', count: 5, nameAr: 'التربية الإسلامية' },
  'البحث العلمي': { id: 'd_research', count: 2, nameAr: 'البحث العلمي' },
  'مختبر الطاقة': { id: 'd_energylab', count: 2, nameAr: 'مختبر الطاقة' },
  'الرياضيات': { id: 'd_math', count: 7, nameAr: 'الرياضيات' },
  'اللغة الإنجليزية': { id: 'd_english', count: 5, nameAr: 'اللغة الإنجليزية' },
  'اللغة العربية': { id: 'd_arabic', count: 7, nameAr: 'اللغة العربية' },
  'STEM': { id: 'd_stem', count: 20, nameAr: 'STEM' },
  'الحاسوب': { id: 'd_cs', count: 5, nameAr: 'الحاسوب' },
  'مختبر التصنيع الرقمي': { id: 'd_fablab', count: 2, nameAr: 'مختبر التصنيع الرقمي' },
  'مختبر الروبوت': { id: 'd_robotlab', count: 2, nameAr: 'مختبر الروبوت' },
  'إداري': { id: 'd_admin', count: 2, nameAr: 'الإدارة' },
  'الإدارة': { id: 'd_admin', count: 2, nameAr: 'الإدارة' },
  'إدارة': { id: 'd_admin', count: 2, nameAr: 'الإدارة' },
  'التربية البدنية': { id: 'd_pe', count: 3, nameAr: 'التربية البدنية' },
  'التصميم التكنولوجي': { id: 'd_techdesign', count: 2, nameAr: 'التصميم التكنولوجي' },
  'الدراسات الاجتماعية': { id: 'd_social', count: 1, nameAr: 'الدراسات الاجتماعية' },
  'التعليم الإلكتروني': { id: 'd_elearning', count: 1, nameAr: 'التعليم الإلكتروني' },
  'التعليم الالكتروني': { id: 'd_elearning', count: 1, nameAr: 'التعليم الإلكتروني' },
  'E-Learning': { id: 'd_elearning', count: 1, nameAr: 'التعليم الإلكتروني' }
};

export function resolveTeacherDepartment(
  teacherId?: string,
  teacherName?: string,
  fallbackDept?: string,
  teachers: any[] = [],
  departments: any[] = []
): string {
  const normalizedName = (teacherName || '').trim().toLowerCase();
  const teacher = (teachers || []).find(t => 
    (teacherId && t.id === teacherId) || 
    (teacherName && (
      (t.nameAr && t.nameAr.trim().toLowerCase() === normalizedName) || 
      (t.nameEn && t.nameEn.trim().toLowerCase() === normalizedName)
    ))
  );
  if (teacher) {
    if (teacher.departmentId) {
      const dept = (departments || []).find(d => d.id === teacher.departmentId);
      if (dept) return dept.nameAr;
    }
    if (teacher.subject && SUBJECT_TO_DEPT[teacher.subject]) {
      const deptId = SUBJECT_TO_DEPT[teacher.subject];
      const dept = (departments || []).find(d => d.id === deptId);
      if (dept) return dept.nameAr;
      return teacher.subject;
    }
    if (teacher.department) return teacher.department;
  }
  return fallbackDept || 'أخرى';
}

export function getDepartmentStaffCount(
  deptName: string,
  teachers: any[] = [],
  departments: any[] = []
): { count: number; deptId: string; canonicalName: string } {
  const normalized = (deptName || '').trim();
  const official = OFFICIAL_DEPARTMENT_STAFF[normalized];

  let targetId = official ? official.id : '';
  if (!targetId && departments && departments.length > 0) {
    const matchedDept = departments.find(d => 
      d.nameAr === normalized || 
      d.nameEn?.toLowerCase() === normalized.toLowerCase() || 
      d.id === normalized
    );
    if (matchedDept) targetId = matchedDept.id;
  }
  if (!targetId && SUBJECT_TO_DEPT[normalized]) {
    targetId = SUBJECT_TO_DEPT[normalized];
  }

  let activeCount = 0;
  if (teachers && teachers.length > 0) {
    activeCount = teachers.filter(t => {
      if (t.status === 'inactive') return false;
      if (targetId && (t.departmentId === targetId || (Array.isArray(t.departmentIds) && t.departmentIds.includes(targetId)))) {
        return true;
      }
      if (t.department && (t.department === normalized || (official && t.department === official.nameAr))) {
        return true;
      }
      if (t.subject && SUBJECT_TO_DEPT[t.subject] && targetId && SUBJECT_TO_DEPT[t.subject] === targetId) {
        return true;
      }
      return false;
    }).length;
  }

  // If active teachers exist in the system, use activeCount. Otherwise fallback to official benchmark.
  const finalCount = activeCount > 0 ? activeCount : (official ? official.count : 1);
  const canonicalName = official ? official.nameAr : normalized;

  return {
    count: finalCount,
    deptId: targetId,
    canonicalName
  };
}

export interface InstitutionalEvaluation {
  label: string;
  shortLabel: string;
  tier: 'full' | 'advanced' | 'very_good' | 'good' | 'preliminary' | 'developing';
  color: string;
  bg: string;
  border: string;
}

export function getInstitutionalEvaluation(rate: number, certified: number = 0): InstitutionalEvaluation {
  if (rate >= 100) {
    return {
      label: '⭐ اعتماد كامل (100%)',
      shortLabel: '⭐ كامل 100%',
      tier: 'full',
      color: '#065F46',
      bg: '#D1FAE5',
      border: '#6EE7B7'
    };
  }
  if (rate >= 70) {
    return {
      label: `🟢 مستوى متقدم (${rate}%)`,
      shortLabel: `🟢 متقدم ${rate}%`,
      tier: 'advanced',
      color: '#047857',
      bg: '#ECFDF5',
      border: '#A7F3D0'
    };
  }
  if (rate >= 50) {
    return {
      label: `🔵 إنجاز جيد جداً (${rate}%)`,
      shortLabel: `🔵 جيد جداً ${rate}%`,
      tier: 'very_good',
      color: '#0369A1',
      bg: '#E0F2FE',
      border: '#BAE6FD'
    };
  }
  if (rate >= 30) {
    return {
      label: `🟣 مستوى جيد (${rate}%)`,
      shortLabel: `🟣 جيد ${rate}%`,
      tier: 'good',
      color: '#6D28D9',
      bg: '#EDE9FE',
      border: '#DDD6FE'
    };
  }
  if (rate > 0 || certified > 0) {
    return {
      label: `🟠 مستوى أولي (${rate}%)`,
      shortLabel: `🟠 أولي ${rate}%`,
      tier: 'preliminary',
      color: '#B45309',
      bg: '#FEF3C7',
      border: '#FDE68A'
    };
  }
  return {
    label: '⚪ قيد التطوير (0%)',
    shortLabel: '⚪ قيد التطوير',
    tier: 'developing',
    color: '#64748B',
    bg: '#F1F5F9',
    border: '#E2E8F0'
  };
}

export function classifyAchievement(name: string, organizer: string, result: string): string {
  const n = (name || '').toUpperCase();
  const o = (organizer || '').toUpperCase();
  const r = (result || '').toUpperCase();

  if (n.includes('نشر بحث علمي') || o.includes('IEEE') || o.includes('SMARTNET') || o.includes('GOOGLE SCHOLAR')) {
    return 'بحث علمي منشور';
  }
  if (r.includes('جائزة خاصة')) return 'جائزة خاصة';
  if (r.includes('المركز الأول')) return 'مركز أول';
  if (r.includes('المركز الثاني')) return 'مركز ثاني';
  if (r.includes('المركز الثالث')) return 'مركز ثالث';
  if (r.includes('الميدالية الذهبية')) return 'ميدالية ذهبية';
  if (r.includes('تأهل') || r.includes('تمثيل')) return 'تأهل وتمثيل';
  
  return 'إنجاز متنوع';
}

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'meetings', nameAr: 'الاجتماعات', nameEn: 'Meetings', color: '#3B82F6', icon: 'Users' },
  { id: 'pd', nameAr: 'التطوير المهني', nameEn: 'Professional Development', color: '#10B981', icon: 'GraduationCap' },
  { id: 'planning', nameAr: 'التخطيط والمتابعة', nameEn: 'Planning and Follow-up', color: '#F59E0B', icon: 'Calendar' },
  { id: 'achievements', nameAr: 'المشاركات والإنجازات', nameEn: 'Participations and Achievements', color: '#8B5CF6', icon: 'Trophy' },
  { id: 'monthly_reports', nameAr: 'التقارير الشهرية', nameEn: 'Monthly Reports', color: '#6B7280', icon: 'FileText' },
  { id: 'elearning', nameAr: 'التعليم الإلكتروني', nameEn: 'E-Learning', color: '#EF4444', icon: 'Laptop' },
  { id: 'qes', nameAr: 'نظام قطر للتعليم', nameEn: 'Qatar Education System', color: '#047857', icon: 'BookOpen' },
  { id: 'ai', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', color: '#7C3AED', icon: 'Cpu' },
  { id: 'platforms', nameAr: 'المنصات التعليمية', nameEn: 'Educational Platforms', color: '#EC4899', icon: 'Globe' },
  { id: 'cybersecurity', nameAr: 'الأمن السيبراني', nameEn: 'Cybersecurity', color: '#1F2937', icon: 'ShieldCheck' },
  { id: 'competitions', nameAr: 'المسابقات والبحث العلمي', nameEn: 'Competitions and Research', color: '#F43F5E', icon: 'Search' },
  { id: 'community', nameAr: 'الشراكات المجتمعية', nameEn: 'Community Partnerships', color: '#06B6D4', icon: 'Handshake' },
  { id: 'parents', nameAr: 'أولياء الأمور', nameEn: 'Parents', color: '#D97706', icon: 'UserGroup' },
  { id: 'students', nameAr: 'الطلاب', nameEn: 'Students', color: '#10B981', icon: 'User' },
  { id: 'support', nameAr: 'الدعم الفني', nameEn: 'Technical Support', color: '#3B82F6', icon: 'Settings' },
  { id: 'quality', nameAr: 'الاعتماد والجودة', nameEn: 'Accreditation and Quality', color: '#F59E0B', icon: 'CheckBadge' },
  { id: 'files', nameAr: 'ملفات منسق المشاريع', nameEn: 'Coordinator Files', color: '#6B7280', icon: 'Folder' },
  { id: 'other', nameAr: 'أخرى', nameEn: 'Other', color: '#9CA3AF', icon: 'MoreHorizontal' },
];
export const HIGH_PERF_DEPTS = new Set(['d_arabic','d_islamic','d_cs','d_math']);
export function getDeptName(id:string,depts:Department[]):string { return depts.find(d=>d.id===id)?.nameAr||id; }

// ── Centralized Leader Exclusion & Recognition Logic ───────────────────────
export function isExcludedTeacher(t: any): boolean {
  if (!t) return false;
  const nameAr = (t.nameAr || t.name || t.teacherName || t.teacherNameAr || '').trim();
  const nameEn = (t.nameEn || t.teacherNameEn || '').trim().toLowerCase();
  const email = (t.email || '').trim().toLowerCase();
  const role = (t.role || '').trim().toLowerCase();
  const job = (t.jobCategory || t.jobTitle || t.subject || '').trim().toLowerCase();

  // Exclude Dr. Rani Al-Toum (Academic Vice Principal)
  if (nameAr.includes('راني') && (nameAr.includes('توم') || nameAr.includes('التوم'))) return true;
  if (nameEn.includes('rani') && (nameEn.includes('toum') || nameEn.includes('al-toum'))) return true;
  if (email.includes('r.altoum') || email.includes('altoum1512')) return true;
  if (role === 'leader' || job.includes('نائب') || job.includes('مدير')) return true;

  return false;
}

export function getMonthlyDepartmentHonorees(
  evaluations: Evaluation[],
  teachers: Teacher[],
  departments: Department[],
  year: string,
  month: string
) {
  const honorees: any[] = [];
  const validTeachers = teachers.filter(t => !isExcludedTeacher(t));
  const validTeacherIds = new Set(validTeachers.map(t => t.id));
  const evals = evaluations.filter(e => e.academicYear === year && e.month === month && validTeacherIds.has(e.teacherId));
  
  departments.filter(d => d.id !== 'd_admin').forEach(dept => {
    const deptTeachers = validTeachers.filter(t => t.departmentId === dept.id);
    const teacherIds = new Set(deptTeachers.map(t => t.id));
    const deptEvals = evals.filter(e => teacherIds.has(e.teacherId));
    
    if (deptEvals.length > 0) {
      deptEvals.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        const a10 = a.criteria ? a.criteria.filter(c => c.score === 10).length : 0;
        const b10 = b.criteria ? b.criteria.filter(c => c.score === 10).length : 0;
        if (b10 !== a10) return b10 - a10;
        if ((b.criteria?.[0]?.score||0) !== (a.criteria?.[0]?.score||0)) return (b.criteria?.[0]?.score||0) - (a.criteria?.[0]?.score||0);
        if ((b.criteria?.[1]?.score||0) !== (a.criteria?.[1]?.score||0)) return (b.criteria?.[1]?.score||0) - (a.criteria?.[1]?.score||0);
        if ((b.criteria?.[3]?.score||0) !== (a.criteria?.[3]?.score||0)) return (b.criteria?.[3]?.score||0) - (a.criteria?.[3]?.score||0);
        if ((b.criteria?.[4]?.score||0) !== (a.criteria?.[4]?.score||0)) return (b.criteria?.[4]?.score||0) - (a.criteria?.[4]?.score||0);
        const tA = validTeachers.find(x => x.id === a.teacherId);
        const tB = validTeachers.find(x => x.id === b.teacherId);
        return (tA?.nameAr || '').localeCompare(tB?.nameAr || '', 'ar');
      });
      const winnerEv = deptEvals[0];
      const teacher = validTeachers.find(t => t.id === winnerEv.teacherId);
      if (teacher) {
        honorees.push({
          academicYear: year,
          month,
          departmentId: dept.id,
          departmentName: dept.nameAr,
          teacherId: teacher.id,
          teacherNameAr: teacher.nameAr,
          teacherNameEn: teacher.nameEn,
          subject: teacher.subject,
          totalScore: winnerEv.totalScore,
          averageScore: winnerEv.averageScore,
          performanceLevel: winnerEv.performanceLevel,
          recognitionReason: `تم تكريم المعلم لكونه الأعلى تقييمًا في قسم ${dept.nameAr} خلال شهر ${month} للعام الأكاديمي ${year}، وذلك وفق نتائج تقييم تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية.`,
          isHonored: true,
          evaluation: winnerEv
        });
      }
    }
  });
  return honorees;
}

export function getTeacherRecognitionHistory(
  evaluations: Evaluation[],
  teachers: Teacher[],
  departments: Department[],
  teacherId: string
) {
  const teacher = teachers.find(t => t.id === teacherId);
  if (teacher && isExcludedTeacher(teacher)) return [];
  const history: any[] = [];
  ACADEMIC_YEARS.forEach(year => {
    MONTHS.forEach(month => {
      const honorees = getMonthlyDepartmentHonorees(evaluations, teachers, departments, year, month);
      const record = honorees.find(h => h.teacherId === teacherId);
      if (record) history.push(record);
    });
  });
  return history;
}

export const initialUsers:User[] = [
  // ─ Admins ─────────────────────────────────────────────────────────────────
  {id:'u1',  name:'م.أحمد طبيشات',  nameEn:'Ahmad Tubaishat',      email:'a.tubaishat1704@education.qa', password:'Admin@QSTSS2026',  role:'admin',   status:'active'},
  {id:'u10', name:'م.أحمد طبيشات',  nameEn:'Ahmad Tubaishat',      email:'admin@school.qa',              password:'SysAdmin#2026!',  role:'admin',   status:'active'},
  // ─ School Leadership ──────────────────────────────────────────────────
  {id:'u2',  name:'د.راني التوم',   nameEn:'Dr. Rani Al-Toum',     email:'r.altoum1512@education.qa',    password:'Leader@QSTSS26', role:'leader',  status:'active'},
  {id:'u12', name:'قيادة المدرسة', nameEn:'School Leader',        email:'leader@school.qa',             password:'SchoolLead#2026', role:'leader',  status:'active'},
  // ─ Evaluator ──────────────────────────────────────────────────────────
  {id:'u11', name:'منسق إلكتروني', nameEn:'Evaluator',            email:'evaluator@school.qa',          password:'EvalCoord@2026',   role:'evaluator', status:'active'},
  // ─ E-Learning Specialist (View-Only) ──────────────────────────────────
  {id:'u13', name:'أخصائي التعليم الإلكتروني', nameEn:'E-Learning Specialist', email:'elearning@school.qa', password:'ELearn@View2026', role:'viewer', status:'active'},
  // ─ Official Coordinators ────────────────────────────────────────────
  {id:'uc1', name:'يامن فرح',          nameEn:'YAMEN FARAH FARAH',    email:'y.farah2507@education.qa', username:'y.farah2507',    password:'Yamen@QSTSS26', role:'coordinator', employeeId:'27976002886', departmentId:'d_math',    departmentIds:['d_math'],    status:'active'},
  {id:'uc2', name:'يوسف دحمان',        nameEn:'YOUSSEF DAHMAN',       email:'y.dahman0209@education.qa', username:'y.dahman0209',   password:'Youssef@QSTSS26', role:'coordinator', employeeId:'28852800073', departmentId:'d_english', departmentIds:['d_english'], status:'active'},
  {id:'uc3', name:'د. محمد عمر سلامة',  nameEn:'MOHAMMED OMAR MOHD SALAMEH', email:'m.salameh1301@education.qa', username:'m.salameh1301', password:'Salameh@QSTSS26', role:'coordinator', employeeId:'28240001674', departmentIds:['d_energylab','d_fablab','d_robotlab'], status:'active'},
  {id:'uc4', name:'د. ماهر علوان',      nameEn:'MAHER ISSA HASAN ELWAN', email:'m.elwan2704@education.qa', username:'m.elwan2704',   password:'Maher@QSTSS26', role:'coordinator', employeeId:'27440001203', departmentId:'d_islamic', departmentIds:['d_islamic'], status:'active'},
  {id:'uc5', name:'أ. أسعد ناعس',       nameEn:'ASAAD MAHMOUD NAIS',   email:'n.asaad0108@education.qa', username:'n.asaad0108',   password:'Asaad@QSTSS26', role:'coordinator', employeeId:'27376001799', departmentId:'d_arabic',  departmentIds:['d_arabic'],  status:'active'},
  {id:'uc6', name:'عيسى سويدان',        nameEn:'ESSA IBRAHEM MOUSA SWEIDAN', email:'e.sweidan0601@education.qa', username:'e.sweidan0601', password:'Essa@QSTSS26', role:'coordinator', employeeId:'28440000737', departmentId:'d_cs',      departmentIds:['d_cs'],      status:'active'},
  {id:'uc7', name:'أحمد عقله فارس',    nameEn:'AHMAD OQLAH FARIS',    email:'a.faris1404@education.qa', username:'a.faris1404', password:'Ahmad@QSTSS26', role:'coordinator', departmentId:'d_stem',    departmentIds:['d_stem'],    status:'active'},
];

// ── Helper: get coordinator’s department IDs as array ──────────────────────────
export function getUserDeptIds(user:User):string[] {
  if (user.departmentIds && user.departmentIds.length > 0) return user.departmentIds;
  if (user.departmentId) return [user.departmentId];
  return [];
}
export function getUserDeptLabel(user:User, depts:Department[]):string {
  const ids = getUserDeptIds(user);
  if (ids.length === 0) return '-';
  if (ids.length >= 2) {
    const labIds = new Set(['d_energylab','d_fablab','d_robotlab']);
    if (ids.every(id => labIds.has(id))) return 'المختبرات التخصصية';
  }
  return ids.map(id => getDeptName(id, depts)).join('، ');
}

const RAW:string[][] = [
  ['28881800075','الحسن علي محمد علي','ALHASSAN ALI MOHAMED ALI','Islamic','a.ali02011@education.qa'],
  ['29382600819','محمد ورسامي عمر','MOHAMED WARSAME OMAR','English','m.omar1011@education.qa'],
  ['29382600766','محمد عبدالمنعم حليمه','MUHAMMED ABDULMONEM HALIMAH','STEM','m.halimah1509@education.qa'],
  ['29040002523','انس عبدالكريم موسى جرادات','ANAS ABEDALKAREEM MOUSA JARADAT','Energy Lab','a.jaradat0402@education.qa'],
  ['29082600735','راجي ترابي','RAGEE TARABI','STEM','r.tarabi2103@education.qa'],
  ['28612400247','عبدالعزيز محمد','ABDIAZIZ MOHAMED','STEM','a.mohamed14101@education.qa'],
  ['28484000736','جوستون شيرود لويس','JUSTIN SHERROD LEWIS','STEM','j.lewis2406@education.qa'],
  ['28482600709','سليمان ميا','SULEMAN MIAH','STEM','s.miah2103@education.qa'],
  ['27782601147','امجد سهيل عزيز','AMJAD SUHAIL AZIZ','STEM','a.aziz2805@education.qa'],
  ['27412400337','زايد كاظم','ZAID J KADHEM','STEM','z.kadhem2511@education.qa'],
  ['29482600750','ايلفيس ايلوم تيتي','ELVIS ELOM TETTEY','English','e.tettey2711@education.qa'],
  ['29603100050','حجيبالله خاسييف','HAJIBALA KHASIYEV','Chemistry','h.khasiyev1802@education.qa'],
  ['28782601010','محمد عماد ازكول','MOHAMMED EMAD AZKOUL','Math','m.azkoul3006@education.qa'],
  ['29582600586','محمد سيد ميردادي','MOHAMED SAID MARDADI','English','m.mardadi0504@education.qa'],
  ['29188600078','على سالم على سالمين الصيعري','ALI SALEM ALI SALMEEN ALSEARI','Fab Lab','a.alsaari1611@education.qa'],
  ['29082600879','عبدالله كارش','ABDULLAHI KARSHE','English','a.karshe0101@education.qa'],
  ['29051200038','فيصل محمد مسلم الحضري','FAISAL MOHAMMED M ALHADHRI','Social Studies','f.alhadhri0611@education.qa'],
  ['28942201555','طارق يوسف رزق','TAREK YOUSSEF RIZK','Math','t.rizk2310@education.qa'],
  ['28940000290','اياد محمود علي سلامه','IYAD M ALI SALAMEH','Robotic Lab','i.salameh2107@education.qa'],
  ['28882600706','امداد علي','AMDAD ALI','CS','a.ali04022@education.qa'],
  ['28876200012','زوكير عبدالرحمانوف','ZOKIR ABDURAKHMANOV','Physics','z.abdurakhmanov1912@education.qa'],
  ['28852800073','يوسف دحمان','YOUSSEF DAHMAN','English','y.dahman0209@education.qa'],
  ['28840001589','ضرار حسن صادق ملاح','DERAR HASAN SADEQ MALLAH','Physics','d.mallah2206@education.qa'],
  ['28836800074','ابراهيم عونى عمر حسن النعيمى','IBRAHIM A O ALNUAIMI','Energy Lab','i.alnuaimi2109@education.qa'],
  ['28812400217','ديريك جوستين جاردنر','DEREK JUSTIN GARDNER','English','d.gardner0506@education.qa'],
  ['28799900308','اياد أحمد سلمان عبدالقادر','IYAD A S ABDALQADER','Fab Lab','i.abdalqader0211@education.qa'],
  ['28635628457','محمود علم اقبال احمد','MAHAMOOD ALAM IQBAL AHMED','Robotic Lab','m.ahmed30082@education.qa'],
  ['28582600990','زكي أحمد خالد','ZAKI AHMED KHALID','English','z.khalid0902@education.qa'],
  ['28482600419','سيد علي هايدور','SYED ALI HAYDOR','Biology','s.haydor1106@education.qa'],
  ['28442201873','فوزي عصام بو فخرالدين','FAWZI ESSAM BOUFAKHER','Chemistry','f.boufakher0312@education.qa'],
  ['28440001988','احمد صلاح رمضان حموده','AHMED SALAH RAMMADAN HAMMOUDEH','Math','a.hammoudeh2212@education.qa'],
  ['28382601047','شاكيل احمد رفيق','SHAKEEL AHMED RAFIQ','Chemistry','s.rafiq2406@education.qa'],
  ['28381809358','هشام محمد امام سليمان','HESHAM SOLIMAN','Arabic','h.soliman2507@education.qa'],
  ['28340002151','محمد سامي ابراهيم عبدالقادر الكفرى','MOHAMMAD SAMI IAQ ALKAFRI','CS','m.alkafri2702@education.qa'],
  ['28340001287','علاء حسني محمد موسى','ALA HUSNI MOHAMMAD MOUSA','Islamic','a.mousa1106@education.qa'],
  ['28258605547','عمران كاشف محمد حسين اسد','IMRAN KASHIF MUHAMMAD HUSSAIN ASAD','Chemistry','i.asad22071@education.qa'],
  ['28210000046','محمد كمال محمد زيد','MOHAMED KAMAL MOHAMED ZEID','Math','m.zeid2605@education.qa'],
  ['28140001682','نبيل صلاح الدين عطيه ايوب','NABEEL SALAHALDEEN ATIEH AYOUB','Chemistry','n.ayoub1410@education.qa'],
  ['28140001202','حسام حامد علي البنوي','HUSAM HAMID ALI AL BANWI','Islamic','h.banwi2903@education.qa'],
  ['28078800165','نزار بن عبدالله حاجي','NIZAR HAJJI','Physics','n.hajji1603@education.qa'],
  ['27976002886','يامن فرح فرح','YAMEN FARAH FARAH','Math','y.farah2507@education.qa'],
  ['27882601227','انس احمد','ANAS AHMED','CS','a.ahmed09123@education.qa'],
  ['27842201563','خالد عصام بارودي','KHALED ISSAM BAROUDI','CS','k.baroudi0206@education.qa'],
  ['27840001272','اشرف صالح محمد فدعوس','ASHRAF SALEH MOHAMMAD FADOUS','Physics','a.fadous0608@education.qa'],
  ['27684000920','جايمز انتوني مكيند','JAYMZ ANTHONY MCKIND','English','j.mckind0105@education.qa'],
  ['27642201189','روي جورج مخول','ROY GEORGES MAKHOUL','CS','r.makhoul0812@education.qa'],
  ['27581801911','ابراهيم حلمى ابراهيم جمعه','IBRAHIM GOMAA','Arabic','i.gomaa0511@education.qa'],
  ['27550400480','سمير بلفقي','SAMIR BELLAFQI','Arabic','s.bellafqi1101@education.qa'],
  ['27482600941','محمد قاسم','MUHAMMAD BIN QASIM','Math','m.qasim2808@education.qa'],
  ['27440001203','ماهر عيسى حسن علوان','MAHER ISSA HASAN ELWAN','Islamic','m.elwan2704@education.qa'],
  ['27384000793','عبدالغني عبيده','ABDELGHANI ABIDA','Math','a.abida3001@education.qa'],
  ['27382601243','كليفرد جورج بايلي','CLIFFORD GEORGE BAILEY','Math','c.bailey0810@education.qa'],
  ['27376001799','اسعد محمود ناعس','ASAAD MAHMOUD NAIS','Arabic','n.asaad0108@education.qa'],
  ['27281804414','سيد مصطفى السيد سليمان','SAYED MOSTAFA SOLIMAN','Arabic','s.soliman1509@education.qa'],
  ['27158601882','عمران الله معروفي','IMRAN ULLAH MARUFI','STEM','i.marufi1204@education.qa'],
  ['27040000493','ناصر احمد حسن حلوة','NASER AHMAD HASAN HULWEH','Islamic','n.hulweh2501@education.qa'],
  ['26979200995','اوزدن اوزغور','OZDEN OZGUR','Physics','o.ozgur2906@education.qa'],
];

// ── Scoring configuration ──────────────────────────────────────────────────

// Teachers excluded from 2023-2024 and 2024-2025 (only in 2025-2026)
const EARLY_EXCLUDED = new Set(['t1','t2','t3','t4','t12','t36']);

// TARGET HIGH performers for 2023-2024 and 2024-2025 (scores 92-100)
// Arabic teachers: t33,t47,t48,t55,t54
// Islamic teachers: t1,t35,t39,t50,t56
// Additional selected: t57(Physics→best), t46(CS→Roy), t17(Social→Faisal), t16(English→Karshe), t41(Math→Yamen)
const TOP_EARLY_TEACHERS = new Set([
  't4','t12','t13','t16','t17','t18','t22','t24','t27','t29','t31','t33','t34','t35','t36','t39','t41','t43','t46','t47','t48','t49','t50','t53','t54','t55','t56','t57'
]);

// ── STEM Specific 2025-2026 ────────────────────────────────────────────────
const STEM_TOP_2526 = ['t58','t36','t55','t12','t8','t32','t30'];
const STEM_FOLLOWUP_2526 = new Set(['t21','t10','t30','t19']);
// ── Follow-up Distribution 2025-2026 (10 per month) ────────────────────────
const FOLLOWUP_DIST_2526: Record<string, string[]> = {
  'سبتمبر': ['t51','t2','t3','t10','t25','t21','t27','t31','t37','t52'],
  'أكتوبر': ['t2','t3','t10','t25','t30','t31','t37','t38','t40','t52'],
  'نوفمبر': ['t51','t2','t10','t21','t27','t30','t31','t38','t40','t52'],
  'يناير':  ['t51','t3','t10','t25','t21','t27','t30','t37','t38','t40'],
  'فبراير': ['t51','t2','t3','t25','t21','t31','t37','t38','t40','t52'],
  'مارس':   ['t2','t3','t10','t25','t27','t30','t31','t37','t38','t52'],
  'أبريل':  ['t51','t2','t10','t21','t27','t30','t31','t37','t40','t52'],
  'مايو':    ['t51','t3','t10','t25','t21','t27','t30','t37','t38','t40'],
};
const FOLLOWUP_TARGET_TEACHERS = new Set(['t51','t2','t3','t10','t25','t21','t27','t30','t31','t37','t38','t40','t52']);

const ARABIC_TEACHERS = ['t33','t47','t48','t54','t55'];
const ISLAMIC_TEACHERS = ['t35','t39','t50','t56','t1','t12','t36']; // Removed t2, t3, t4 as they are target follow-up or early excluded

export const initialTeachers:Teacher[] = RAW.map(([empId,nameAr,nameEn,subj,email],i)=>{
  const id = `t${i+1}`;
  return {
    id, employeeId:empId, nameAr, nameEn,
    departmentId:SUBJECT_TO_DEPT[subj]||'d_stem',
    subject:subj, email, jobCategory:'معلم', status:'active' as const, createdAt:'2023-09-01',
    activeFromYear: EARLY_EXCLUDED.has(id) ? '2025-2026' : '2023-2024',
    excludedYears: EARLY_EXCLUDED.has(id) ? ['2023-2024','2024-2025'] : [],
  };
});

// Monthly target scores for top early performers (cycling through realistic variety)
const TOP_MONTHLY_SCORES = [94, 95.5, 96.25, 97, 93, 98.5, 92.5, 99];

// Top teachers config (used to boost specific teachers further or for 2025-2026)
const TOP_TEACHERS: Record<string,{base:number; bonus?:Record<string,number>}> = {
  't33': {base:98},  // هشام سليمان - Arabic
  't47': {base:99},  // ابراهيم حلمي - Arabic
  't48': {base:97},  // سمير بلفقي - Arabic
  't53': {base:96},  // اسعد ناعس - Arabic
  't54': {base:98},  // سيد مصطفى - Arabic
  't55': {base:97},  // عمران معروفي - STEM
  't1':  {base:94},  // الحسن علي - Islamic
  't35': {base:96},  // علاء حسني - Islamic
  't39': {base:98},  // حسام البنوي - Islamic
  't50': {base:94},  // ماهر علوان - Islamic
  't56': {base:99},  // ناصر حلوة - Islamic
  't57': {base:100}, // اوزدن اوزغور - Physics
  't36': {base:100}, // عمران كاشف - Chemistry
  't12': {base:100}, // حجيبالله - Chemistry
  't29': {base:100}, // سيد هيدور - Biology
  't46': {base:95},  // روي مخول - CS
  't17': {base:99},  // فيصل الحضري - Social
  't16': {base:98},  // عبدالله كارش - English
  't41': {base:97},  // يامن فرح - Math
  't30': {base:95},  // فوزي عصام - Chemistry
  't13': {base:99},  // محمد عماد - Math
  't34': {base:98},  // محمد الكفري - CS
  't4':  {base:99},  // انس جرادات - Energy Lab
  't24': {base:97},  // ابراهيم النعيمي - Energy Lab
  't18': {base:95},  // طارق رزق - Math
  't22': {base:94},  // يوسف دحمان - English
  't27': {base:94},  // محمود علم - Robot
  't31': {base:94},  // احمد صلاح - Math
  't43': {base:95},  // خالد بارودي - CS
  't49': {base:94},  // محمد قاسم - Math
};

// ── 2024-2025 Winners Rotation Mapping ─────────────────────────────────────

const WINNERS_2425: Record<string, Record<string, string>> = {
  'سبتمبر': { 'd_math':'t13', 'd_cs':'t34', 'd_english':'t16', 'd_stem':'t57', 'd_energylab':'t4',  'd_social':'t17', 'd_robotlab':'t27' },
  'أكتوبر': { 'd_math':'t13', 'd_cs':'t34', 'd_english':'t16', 'd_stem':'t57', 'd_energylab':'t4',  'd_social':'t17', 'd_robotlab':'t27' },
  'نوفمبر': { 'd_math':'t41', 'd_cs':'t46', 'd_english':'t22', 'd_stem':'t55', 'd_energylab':'t24', 'd_social':'t17', 'd_robotlab':'t27' },
  'يناير':  { 'd_math':'t18', 'd_cs':'t43', 'd_english':'t16', 'd_stem':'t36', 'd_energylab':'t4',  'd_social':'t17', 'd_robotlab':'t27' },
  'فبراير': { 'd_math':'t18', 'd_cs':'t43', 'd_english':'t16', 'd_stem':'t36', 'd_energylab':'t4',  'd_social':'t17', 'd_robotlab':'t27' },
  'مارس':   { 'd_math':'t31', 'd_cs':'t34', 'd_english':'t22', 'd_stem':'t57', 'd_energylab':'t24', 'd_social':'t17', 'd_robotlab':'t27' },
  'أبريل':  { 'd_math':'t49', 'd_cs':'t46', 'd_english':'t16', 'd_stem':'t55', 'd_energylab':'t4',  'd_social':'t17', 'd_robotlab':'t27' },
  'مايو':    { 'd_math':'t13', 'd_cs':'t43', 'd_english':'t22', 'd_stem':'t36', 'd_energylab':'t24', 'd_social':'t17', 'd_robotlab':'t27' },
};

// Low-dept exceptions (good despite being in STEM/Physics/English)
const LOW_EXCEPTIONS = new Set(['t16','t40','t44']); // كارش, نزار, اشرف فدعوس

// Teachers needing follow-up (scores < 70)
const FOLLOWUP_TEACHERS = new Set(['t2','t3','t5','t7','t9','t11','t14','t15']);

// Dept base scores (target total out of 100)
function deptBase(deptId:string, tid:string):number {
  if (tid in TOP_TEACHERS) return TOP_TEACHERS[tid].base;
  if (FOLLOWUP_TEACHERS.has(tid)) return 52;
  if (LOW_EXCEPTIONS.has(tid)) return 84;
  if (['d_arabic','d_islamic'].includes(deptId)) return 88;
  if (['d_cs','d_math'].includes(deptId)) return 86;
  if (['d_stem','d_social','d_energylab','d_fablab','d_robotlab'].includes(deptId)) return 81;
  return 74;
}

const YEAR_MULT: Record<string,number> = {
  '2021-2022': 0.78,
  '2022-2023': 0.82,
  '2023-2024': 0.86,
  '2024-2025': 0.93,
  '2025-2026': 1.00,
  '2026-2027': 1.00,
};

function seededRnd(seed:number):()=>number {
  let s = seed % 2147483647; if(s<=0) s+=2147483646;
  return ()=>{ s=s*16807%2147483647; return (s-1)/2147483646; };
}
function roundQ(v:number):number { return Math.round(v*4)/4; }
function clamp(v:number,mn:number,mx:number):number { return Math.max(mn,Math.min(mx,v)); }

const MONTH_DATES:Record<string,string> = {
  'سبتمبر':'09','أكتوبر':'10','نوفمبر':'11',
  'يناير':'01','فبراير':'02','مارس':'03','أبريل':'04','مايو':'05',
};
const EARLY_MONTHS = new Set(['يناير','فبراير','مارس','أبريل','مايو']);
const YEAR_START:Record<string,string> = {'2021-2022':'2021','2022-2023':'2022','2023-2024':'2023','2024-2025':'2024','2025-2026':'2025','2026-2027':'2026'};

// ── Official 2025-2026 annual scores by employee_id ────────────────────────
const OFFICIAL_2526: Record<string,number> = {
  '28881800075':90, '29382600819':70, '29382600766':80,
  '29082600735':80, '28612400247':89, '28484000736':70, '28482600709':90,
  '27782601147':90, '27412400337':90, '29482600750':90,
  '28782601010':100, '29582600586':90, '29188600078':90, '29082600879':100,
  '28942201555':90, '28940000290':80, '28882600706':94,
  '28876200012':80, '28852800073':90, '28840001589':70,
  '28812400217':75, '28799900308':90, '28635628457':80, '28582600990':80,
  '28442201873':90, '28440001988':85, '28382601047':85,
  '28258605547':100,'28210000046':80, '28140001682':90, '28140001202':100,'28078800165':90,
  '27976002886':100,'27882601227':94, '27842201563':92, '27840001272':89,
  '27684000920':90, '27642201189':100,'27581801911':100,'27550400480':100,
  '27482600941':90, '27440001203':90, '27384000793':90, '27382601243':80,
  '27376001799':100,'27281804414':100,'27158601882':100,'27040000493':100,
  '26979200995':100, '29603100050':100, '28482600419':100, '29040002523':100,
  '29051200038':100, '28381809358':100, '28340002151':100, '28836800074':100,
  '28340001287':100,
};

// Monthly variation offsets (8 months, avg ≈ 0)
const MONTH_OFFSETS = [-1.5, 1.0, -0.5, 2.0, -1.0, 0.5, -2.0, 1.5];

function makeCriteria(target:number, seed:number):EvaluationCriterion[] {
  const isPass = target >= 50;
  const c2 = isPass ? 20 : 0;
  const c4 = isPass ? 20 : 0;
  const fixedSum = c2 + c4;
  const remaining = Math.max(0, target - fixedSum);
  const avg = remaining / 3;
  const rng = seededRnd(seed);
  
  let c1 = roundQ(clamp(avg + (rng() - 0.5) * 2, 1, 20));
  let c3 = roundQ(clamp(avg + (rng() - 0.5) * 2, 1, 20));
  let c5 = roundQ(clamp(remaining - (c1 + c3), 1, 20));

  let diff = roundQ(remaining - (c1 + c3 + c5));
  if (Math.abs(diff) >= 0.25) {
    c1 = clamp(roundQ(c1 + diff), 1, 20);
    diff = roundQ(remaining - (c1 + c3 + c5));
    if (Math.abs(diff) >= 0.25) {
      c3 = clamp(roundQ(c3 + diff), 1, 20);
    }
  }

  return [
    { score: c1, note: '' },
    { score: c2, note: '', value: c2 === 20 ? 'نعم' : 'لا' },
    { score: c3, note: '' },
    { score: c4, note: '', value: c4 === 20 ? 'نعم' : 'لا' },
    { score: c5, note: '' },
    { score: 0, note: 'MS Teams, Forms', value: 'نعم' }
  ];
}

function makeCriteriaHigh(target:number, seed:number):EvaluationCriterion[] {
  const c2 = 20;
  const c4 = 20;
  const fixedSum = 40;
  const remaining = Math.max(0, target - fixedSum);
  const avg = remaining / 3;
  const rng = seededRnd(seed);
  
  let c1 = roundQ(clamp(avg + (rng() - 0.5) * 1.5, 16, 20));
  let c3 = roundQ(clamp(avg + (rng() - 0.5) * 1.5, 16, 20));
  let c5 = roundQ(clamp(remaining - (c1 + c3), 16, 20));

  let diff = roundQ(remaining - (c1 + c3 + c5));
  if (Math.abs(diff) >= 0.25) {
    c1 = clamp(roundQ(c1 + diff), 16, 20);
    diff = roundQ(remaining - (c1 + c3 + c5));
    if (Math.abs(diff) >= 0.25) {
      c3 = clamp(roundQ(c3 + diff), 16, 20);
    }
  }

  return [
    { score: c1, note: '' },
    { score: c2, note: '', value: 'نعم' },
    { score: c3, note: '' },
    { score: c4, note: '', value: 'نعم' },
    { score: c5, note: '' },
    { score: 0, note: 'MS Teams, ClassPoint', value: 'نعم' }
  ];
}

function buildSampleEvaluations():Evaluation[] {
  const out:Evaluation[] = [];
  let idx = 1;

  // Monthly target scores for top early performers
  const TOP_MONTHLY = [94, 95.5, 96.25, 97, 93, 98.5, 92.5, 99];

  // ── 2021-2022 through 2024-2025 ────────────────────────────────────────────────
  [0,1,2,3].forEach(yIdx => {
    const year = ACADEMIC_YEARS[yIdx];
    const yearStartVal = parseInt(YEAR_START[year]);
    MONTHS.forEach((month, mIdx) => {
      // Pick random winner for Arabic and Islamic each month
      const arbIdx = Math.floor(seededRnd(yearStartVal + mIdx * 7)() * ARABIC_TEACHERS.length);
      const islIdx = Math.floor(seededRnd(yearStartVal + mIdx * 11)() * ISLAMIC_TEACHERS.length);
      const arabicWinner = ARABIC_TEACHERS[arbIdx];
      const islamicWinner = ISLAMIC_TEACHERS[islIdx];

      initialTeachers.forEach((teacher) => {
        const tid = teacher.id;
        if (EARLY_EXCLUDED.has(tid)) return; // only in 2025-2026

        let clampedTotal: number;
        let criteria: EvaluationCriterion[];

        const isWinner2425 = year === '2024-2025' && WINNERS_2425[month]?.[teacher.departmentId] === tid;
        const isDepWinner = (tid === arabicWinner || tid === islamicWinner);

        if (TOP_EARLY_TEACHERS.has(tid) || isWinner2425 || isDepWinner) {
          const tidNum = parseInt(tid.replace('t',''));
          const seed = tidNum * 500 + mIdx * 31 + yIdx * 79;
          const rng = seededRnd(seed);

          if (isWinner2425 || isDepWinner) {
            // Designated winners get 95-100
            clampedTotal = roundQ(95 + (rng() * 5));
          } else {
            // HIGH performers: 92-100 range with monthly variation
            const baseTarget = TOP_MONTHLY_SCORES[mIdx] ?? 95;
            const teacherOffset = ((tidNum * 7 + yIdx * 13) % 5) * 0.25 - 0.5;
            clampedTotal = roundQ(clamp(baseTarget + teacherOffset, 92, 100));
          }
          criteria = makeCriteriaHigh(clampedTotal, seed);

        } else {
          const base = deptBase(teacher.departmentId, tid);
          const yearMult = YEAR_MULT[year];
          const monthBonus = mIdx * 0.2;
          const seed = parseInt(tid.replace('t','')) * 1000 + mIdx * 13 + yIdx * 97;
          const rng = seededRnd(seed);
          const noise = (rng() - 0.5) * 6;
          const isFollowup = FOLLOWUP_TEACHERS.has(tid);
          let targetTotal = clamp(base * yearMult + monthBonus + noise, isFollowup ? 40 : 70, 99);
          targetTotal = roundQ(targetTotal);

          criteria = makeCriteria(targetTotal, seed);
          clampedTotal = targetTotal;
        }

        const averageScore = roundQ(clampedTotal / 5);
        const perf = getPerformanceLevel(clampedTotal);
        const yr = YEAR_START[year];
        const calYr = EARLY_MONTHS.has(month) ? String(parseInt(yr)+1) : yr;
        const dateStr = `${calYr}-${MONTH_DATES[month]}-28`;
        const isTop = TOP_EARLY_TEACHERS.has(tid);

        out.push({
          id:`e${idx++}`, teacherId:tid, evaluatorId:'u1',
          month, academicYear:year, evaluationDate:dateStr,
          criteria, totalScore:clampedTotal, averageScore, percentage:clampedTotal,
          performanceLevel:perf.label,
          strengths: isTop
            ? 'التزام ممتاز بالمنصات الرقمية وتوظيفها بفاعلية عالية داخل الحصص الدراسية'
            : clampedTotal>=85 ? 'التزام ممتاز بالمنصات الرقمية وتوظيفها بفاعلية عالية' : 'حضور منتظم واستخدام جيد للمنصات التعليمية',
          improvementAreas: isTop
            ? 'الاستمرار في تطوير استخدام أدوات الذكاء الاصطناعي'
            : clampedTotal>=85 ? 'الاستمرار في تطوير استخدام أدوات الذكاء الاصطناعي' : 'زيادة رفع المصادر الرقمية وإنشاء تقييمات إلكترونية',
          recommendations: isTop
            ? 'الاستمرار في توثيق الممارسات الرقمية المتميزة ومشاركة الخبرات مع باقي المعلمين داخل القسم.'
            : clampedTotal>=85 ? 'الاستمرار والمشاركة في ورش تطوير المعلمين' : 'حضور دورة تدريبية متخصصة على نظام قطر للتعليم',
          actionPlan: clampedTotal<75 ? 'خطة تطوير شهرية مع المنسق الإلكتروني' : '',
          evidenceLinks:[],
          generalNotes: (isWinner2425 || isDepWinner)
            ? 'يُعد المعلم من المعلمين المتميزين في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية خلال هذا الشهر، وقد أظهر التزامًا واضحًا في نشر الدروس، رفع المصادر، متابعة الطلاب، وتوظيف الأدوات الرقمية بشكل فعّال داخل القسم.'
            : isTop ? 'يُعد المعلم من المعلمين المتميزين في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية، مع التزام واضح بنشر الدروس، رفع المصادر، متابعة الطلاب، وتوظيف الأدوات الرقمية بشكل فعّال.' : '',
          createdAt:dateStr, updatedAt:dateStr,
        });
      });
    });
  });

  const year26 = '2025-2026';
  MONTHS.forEach((month, mIdx) => {
    const yearSeed = 2025;
    const currentFollowupList = FOLLOWUP_DIST_2526[month] || [];
    const followupSet = new Set(currentFollowupList);

    // Winners must NOT be in the follow-up list for this month
    const validArabic = ARABIC_TEACHERS.filter(id => !followupSet.has(id));
    const validIslamic = ISLAMIC_TEACHERS.filter(id => !followupSet.has(id));
    const validStem = STEM_TOP_2526.filter(id => !followupSet.has(id));

    const arabicWinner = validArabic[Math.floor(seededRnd(yearSeed + mIdx * 7)() * validArabic.length)];
    const islamicWinner = validIslamic[Math.floor(seededRnd(yearSeed + mIdx * 11)() * validIslamic.length)];
    const stemWinner = validStem[Math.floor(seededRnd(yearSeed + mIdx * 13)() * validStem.length)];

    initialTeachers.forEach((teacher) => {
      const tid = teacher.id;
      const isStem = teacher.departmentId === 'd_stem';
      const annualScore = OFFICIAL_2526[teacher.employeeId];
      const isFollowup = followupSet.has(tid);
      const isDepWinner = (tid === arabicWinner || tid === islamicWinner || (isStem && tid === stemWinner));
      
      let targetBase: number;
      if (isDepWinner) {
        targetBase = 100;
      } else if (isFollowup) {
        // Force score between 65-79 for follow-up list
        const fNoise = (seededRnd(parseInt(tid.replace('t','')) * 200 + mIdx)() * 14); // 0-14
        targetBase = 65 + fNoise;
      } else {
        targetBase = (annualScore !== undefined ? annualScore : (isStem ? 82 : 78));
      }

      const offset = MONTH_OFFSETS[mIdx];
      let rawTotal: number;
      if (isDepWinner) {
        rawTotal = clamp(100 + offset * 0.5, 98.5, 100);
      } else if (isFollowup) {
        rawTotal = clamp(targetBase, 65, 79);
      } else if (isStem && !isDepWinner) {
        const stemNoise = (seededRnd(parseInt(tid.replace('t','')) * 100 + mIdx)() - 0.5) * 10;
        rawTotal = clamp(83 + stemNoise, 80, 88);
      } else {
        const noise = (seededRnd(parseInt(tid.replace('t','')) * 100 + mIdx)() - 0.5) * 4;
        rawTotal = clamp(targetBase + offset + noise, 80, 100);
      }
      const totalScore = roundQ(rawTotal);
      const averageScore = roundQ(totalScore / 5);
      const perf = getPerformanceLevel(totalScore);
      const seed26 = parseInt(tid.replace('t','')) * 500 + mIdx * 31;
      const criteria = makeCriteria(totalScore, seed26);
      const calYr = EARLY_MONTHS.has(month) ? '2026' : '2025';
      const dateStr = `${calYr}-${MONTH_DATES[month]}-28`;

      out.push({
        id:`e${idx++}`, teacherId:tid, evaluatorId:'u1',
        month, academicYear:year26, evaluationDate:dateStr,
        criteria, totalScore, averageScore, percentage:totalScore,
        performanceLevel: isFollowup ? 'يحتاج إلى متابعة وخطة تحسين' : perf.label,
        strengths: isFollowup 
          ? 'تفاعل محدود مع المنصات الرقمية' 
          : totalScore >= 90 ? 'التزام ممتاز بالمنصات الرقمية وتوظيفها بفاعلية عالية' : 'حضور منتظم واستخدام أساسي للمنصات التعليمية',
        improvementAreas: isFollowup
          ? 'رفع مستوى التفعيل الشهري لنظام قطر للتعليم وتحسين توظيف المنصات التعليمية في الحصص والأنشطة.'
          : totalScore < 65 ? 'تفعيل نظام قطر للتعليم بصورة منتظمة' : 'تطوير استخدام أدوات الذكاء الاصطناعي',
        recommendations: isFollowup
          ? 'إعداد خطة تحسين قصيرة للمعلم خلال الشهر التالي، تتضمن متابعة منسق القسم، تقديم دعم فني وتربوي، ومراجعة تقارير استخدام نظام قطر للتعليم.'
          : totalScore < 65 ? 'حضور دورة تدريبية متخصصة' : 'الاستمرار والمشاركة في ورش تطوير المعلمين',
        actionPlan: isFollowup
          ? '1. عقد جلسة متابعة فردية مع المعلم.\n2. مراجعة الدروس والمصادر المنشورة على نظام قطر للتعليم.\n3. تقديم دعم في إنشاء التقييمات والواجبات الإلكترونية.\n4. متابعة التحسن في الشهر التالي.\n5. توثيق الشواهد الرقمية بعد تنفيذ خطة التحسين.'
          : totalScore < 65 ? 'خطة تطوير شهرية مع المنسق الإلكتروني' : '',
        evidenceLinks:[],
        generalNotes: isFollowup
          ? 'يحتاج المعلم إلى متابعة إضافية في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية خلال هذا الشهر، مع ضرورة تحسين انتظام نشر الدروس، رفع المصادر، متابعة تفاعل الطلاب، وتوثيق الشواهد الرقمية.'
          : '',
        createdAt:dateStr, updatedAt:dateStr,
      });
    });
  });

  // Append official September 2026 evaluations for all teachers based on the comprehensive LMS report
  const sep26Evals = generateSeptember2026Evaluations(initialTeachers);
  out.push(...sep26Evals);

  return out;
}

export const initialEvaluations:Evaluation[] = buildSampleEvaluations();

// --- Daily Tasks Data Seeding ---
const createDailyTask = (data: Partial<DailyTask>): DailyTask => ({
  id: generateId(),
  title: '',
  description: '',
  taskDate: '',
  month: '',
  academicYear: '2025-2026',
  category: 'other',
  status: 'قيد التنفيذ',
  priority: 'متوسطة',
  completionPercentage: 0,
  taskType: 'يومية',
  source: 'إدخال يدوي',
  executorName: 'أحمد عادل طبيشات',
  createdBy: 'u1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...data
});

export const initialDailyTasks: DailyTask[] = [
  ...SEED_TASKS.map(t => createDailyTask({
    ...t,
    id: generateId(),
    description: t.title, // Use title as description if empty
    taskDate: t.taskDate || (t.month === 'أغسطس' ? '2025-08-01' : 
                            t.month === 'سبتمبر' ? '2025-09-01' : 
                            t.month === 'أكتوبر' ? '2025-10-01' : 
                            t.month === 'نوفمبر' ? '2025-11-01' : 
                            t.month === 'يناير' ? '2026-01-01' : 
                            t.month === 'فبراير' ? '2026-02-01' : 
                            t.month === 'مارس' ? '2026-03-01' : 
                            t.month === 'أبريل' ? '2026-04-01' : '2025-08-01'),
    status: (t.evidenceLabel === 'Click Here' || t.evidenceLabel === 'Here Click' || t.evidenceLabel === 'click Here') ? 'يوجد دليل إنجاز' : 
            (t.evidenceLabel === 'DONE' || t.evidenceLabel === 'Done') ? 'مكتملة' : 
            (t.evidenceUrl ? 'يوجد دليل إنجاز' : (t.status as any || 'قيد التنفيذ')),
    hasEvidence: !!t.evidenceUrl || t.evidenceLabel?.toLowerCase().includes('click'),
    completionPercentage: (t.evidenceLabel === 'Click Here' || t.evidenceLabel === 'DONE' || t.evidenceLabel === 'Done') ? 100 : (t.completionPercentage || 50),
    evidenceStatus: t.evidenceUrl ? 'يوجد دليل إنجاز' : '',
    source: t.source || 'تقرير المهام الشهرية.xlsx',
    priority: (t.priority as any) || 'متوسطة'
  } as any)),

  // September 2025
  createDailyTask({ title: 'اجتماع التحصيل الأكاديمي الثاني', category: 'الاجتماعات', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماع إتقان خطتي خطوة نحو ارتقاء مدرستي لإعداد خطة التدريب الداخلي', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماع قسم تقنية المعلومات مع إدارة المدرسة', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماعات مسابقة World Skills مع إدارة التعليم المهني والتقني', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الملتقى الأول لمنسقي المشاريع الإلكترونية للعام الأكاديمي 2025-2026', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'Cognia Meeting', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماع البرنامج التدريبي على منصة أعناب', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماع لجنة الأنشطة المدرسية الأول', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور اجتماع لجنة الأمن والسلامة مع إدارة المدرسة', category: 'الاجتماعات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'عقد ورش فردية لمعلمي المدرسة في نظام قطر للتعليم والذكاء الاصطناعي وكانفا وغيرها', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'ورش تدريبية متعددة للإداريين الجدد في أدوات Microsoft ونظام قطر للتعليم وكانفا وأدوات الذكاء الاصطناعي', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'عقد ورشة ClassPoint لجميع معلمي المدرسة', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حصول المدرسة على Microsoft Showcase School وإعداد ملف التقديم', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'عقد دورتين للطلاب في برمجة Minecraft وأساسيات الذكاء الاصطناعي ضمن الحصص اللامنهجية', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'ترشيح 7 معلمين للمشاركة في برنامج التعلم الذاتي بالتعاون مع WISE Qatar وMIT', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور الملتقى الأول لإدارة التعليم الإلكتروني والحلول الرقمية', category: 'التطوير المهني', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الحصول على شهادة القائد المؤثر من منصة أعناب', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حصول المعلمين على شهادة ClassPoint Certified Educator ورفع الشهادات على الملف المشترك', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الحصول على Canva Pro Education Version for all teachers', category: 'التطوير المهني', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'متابعة حصص التعليم الإلكتروني للمعلمين ونشر الجدول وكتابة التقارير ومشاركة التقرير', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء كتيب الأنظمة والمنصات التعليمية الإلكترونية ونشره لكافة موظفي المدرسة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء التوقيع الإلكتروني الرسمي المعتمد ونشره لكافة موظفي المدرسة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء مجموعات ClassDojo للصفوف وإضافة المعلمين لها', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'متابعة حصص التعلم عن بعد للطالب صالح علي المري مع جميع معلمي الصف 10-2', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'مشاركة الكتب الإلكترونية مع طلاب المدرسة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'مشاركة الكتب الإلكترونية مع أولياء أمور المدرسة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تحديث وتفعيل حسابات المعلمين على ClassPoint مع الشركة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'التنسيق مع شركة ClassPoint لتجديد الاشتراك والحصول على اعتماد مدرسي وShowcase School', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء فيديوهات التعليم الإلكتروني للحصص النموذجية', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تجهيز الصفوف والمعلمين والطلاب على نظام قطر للتعليم واعتماد الإضافات والوحدات والدروس', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'متابعة الطلاب لتفعيل حساباتهم على نظام قطر للتعليم وحل مشاكل الحسابات وأجهزة اللابتوب', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إرسال تقارير حصص التعليم الإلكتروني لمنسقي المواد للاطلاع والمتابعة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إرسال رسالة لأولياء الأمور عن الدليل الإرشادي للخدمات التكنولوجية', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إرسال رسالة لأولياء الأمور عن الكتب الإلكترونية', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إرسال رسالة لأولياء الأمور عن تغيير كلمة مرور الطالب', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إرسال إيميل للمعلمين للتذكير برفع الواجبات والدروس على منصة قطر للتعليم', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'نشر الميثاق الأخلاقي للطلاب وأولياء الأمور للاطلاع والتوقيع عليه', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'استخراج تقارير ClassDojo وطباعة الشهادات', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الاشتراك في موقع Worldwall وتنظيم العمل للمعلمين عليه', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'المشاركة مع م. علي الصيعري في مسابقة مبدعون في التعليم بالتعاون مع جامعة قطر', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تكريم الطلاب المشاركين في مسابقة ترشيد كهرماء', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حصول 40 معلم على شهادة ClassPoint للمعلم المعتمد', category: 'المشاركات والإنجازات', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حصول 47 معلم على شهادة Microsoft للمعلم المعتمد', category: 'المشاركات والإنجازات', status: 'يوجد دليل إنجاز', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء مسابقة أبطال نظام قطر للتعليم وتكريم ثلاثة طلاب حاصلين على أعلى العلامات', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حصول المدرسة على اعتماد وجهة مدارس Microsoft 2025-2026', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'مساعدة 3 معلمين في إنشاء مشاريعهم البحثية لمسابقة البحث العلمي 2025-2026', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'المشاركة في مسابقة حمدان الألكسو للابتكارات الرقمية في التعليم', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'سبتمبر', taskDate: '2025-09-01', source: 'تقرير شهري سابق' }),

  // October 2025
  createDailyTask({ title: 'اجتماع أولياء الأمور الأول مع إدارة المدرسة', category: 'الاجتماعات', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع مجلس آباء الطلبة الأول', category: 'الاجتماعات', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع رواد التعليم الإلكتروني الثاني', category: 'الاجتماعات', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع المدارس الجديدة', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع شركة iHorizon', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع مع لجنة تقييم جائزة قطر للتميز الحكومي', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع التحصيل الأكاديمي', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع لجنة الشراكة المجتمعية', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع مع منصة اقرأ بالعربية', category: 'الاجتماعات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور ورشة البحث العلمي المقامة في المدرسة', category: 'التطوير المهني', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'عقد ورش فردية لبرنامج Teams لبعض معلمي المدرسة', category: 'التطوير المهني', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'استخراج تقارير ClassDojo وتكريم الطلاب لشهر سبتمبر 2025', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إعلان نتائج مسابقة أبطال نظام قطر للتعليم والتنسيق لتكريمهم في الطابور الصباحي', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء جدول حصص التعليم الإلكتروني وإرساله للمنسقين للتعبئة', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'متابعة حصص التعليم الإلكتروني وتوثيقها بالتقارير والأدلة وإرسال تقارير التقييم', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تكريم الطلاب الفائزين في مسابقة أبطال نظام قطر للتعليم', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تكريم طلاب ClassDojo', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'متابعة المعلمين لاستكمال وإرسال الشهادات للتعليم الإلكتروني Survey Second Study AI MIT', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'التخطيط والمتابعة الأكاديمية للمنصات الرقمية', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'كونترول منتصف الفصل الدراسي الأول', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'نشر جداول الاختبارات', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'النشرة الإلكترونية للربع الأول 2025', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إنشاء فيديو حصة VR', category: 'التخطيط والمتابعة', status: 'يوجد دليل إنجاز', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'استخراج تقارير وشهادات ClassDojo', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'التأهل لمسابقة ITEX العالمية', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'مساعدة المعلمين في إنشاء مشاريع البحث العلمي والاشتراك في المسابقات: فوزي، يامن، طارق', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'أكتوبر', taskDate: '2025-10-01', source: 'تقرير شهري سابق' }),

  // January 2026
  createDailyTask({ title: 'الاجتماع العام للمدرسة لبداية الفصل الأول', category: 'الاجتماعات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع التحصيل الأكاديمي الأول للفصل الثاني', category: 'الاجتماعات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الاجتماع الثالث لمنسقي المشاريع الإلكترونية عن بعد', category: 'الاجتماعات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع لجنة مدارس قطر للعلوم والتكنولوجيا الجديدة', category: 'الاجتماعات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'اجتماع لجنة يوم التعلم عن بعد', category: 'الاجتماعات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'إعداد خطة التطوير المهني للمعلمين الجدد عدد 3 لتدريبهم على الأنظمة التكنولوجية والبدء بالتدريب ضمن الخطة', category: 'التطوير المهني', status: 'يوجد دليل إنجاز', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'حضور ورش داخلية: Arduino و ESP', category: 'التطوير المهني', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'التقارير الشهرية للمنصات الإلكترونية', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'الأعمال الشهرية لمنسق المشاريع', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'استمارة تقييم منسق المشاريع', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'دعوة المعلمين الجدد لكافة الأنظمة والمنصات التعليمية', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تكريم المعلمين المتميزين في استخدام الأدوات التكنولوجية', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'تكريم الطلاب للسلوك الإيجابي لشهر يناير', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'مساعدة المعلمين في الأبحاث العلمية والمسابقات المختصة بالذكاء الاصطناعي', category: 'التخطيط والمتابعة', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'المشاركة في الأولمبياد الوطني للذكاء الاصطناعي لفئة الرؤية الحاسوبية والذكاء الاصطناعي', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'المشاركة المجتمعية مع مدرسة المشاف الثانوية للبنات', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
  createDailyTask({ title: 'المشاركة في مؤتمر ICSEI 2026 التابع لوزارة التعليم', category: 'المشاركات والإنجازات', status: 'مكتملة', month: 'يناير', taskDate: '2026-01-01', source: 'تقرير شهري سابق' }),
];

export const initialFollowUpForms: CoordinatorFollowUpForm[] = [
  {
    id: 'f1', employeeName: 'أحمد عادل طبيشات', month: 'أغسطس - سبتمبر', academicYear: '2025-2026', formDate: '2025-09-30',
    totalScore: 90.90909091,
    recommendations: 'إنشاء سياسة استخدام الذكاء الاصطناعي وتعميمها، والتأكد من تحديث الأنظمة التعليمية واختبارها قبل بداية العام الأكاديمي، وتنظيم جلسات تدريبية لتعريف المستخدمين الجدد بالأنظمة المتاحة.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 9 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 10 },
      { criterion: 'الرفع على OneDrive', score: 10 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 7 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 10 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 8 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 9 },
      { criterion: 'عقد الشراكات المجتمعية', score: 10 },
      { criterion: 'التواصل مع أولياء الأمور', score: 7 },
    ],
    createdAt: '2025-09-30T10:00:00Z', updatedAt: '2025-09-30T10:00:00Z'
  },
  {
    id: 'f2', employeeName: 'أحمد عادل طبيشات', month: 'أكتوبر', academicYear: '2025-2026', formDate: '2025-10-31',
    totalScore: 92.72727273,
    recommendations: 'عقد ورشة التصميم Canva لكافة المعلمين والإداريين في المدرسة.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 10 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 10 },
      { criterion: 'الرفع على OneDrive', score: 9 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 10 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 9 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 8 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 9 },
      { criterion: 'عقد الشراكات المجتمعية', score: 10 },
      { criterion: 'التواصل مع أولياء الأمور', score: 7 },
    ],
    createdAt: '2025-10-31T10:00:00Z', updatedAt: '2025-10-31T10:00:00Z'
  },
  {
    id: 'f3', employeeName: 'أحمد عادل طبيشات', month: 'نوفمبر', academicYear: '2025-2026', formDate: '2025-11-30',
    totalScore: 90,
    recommendations: 'عقد ورش تدريبية ضمن خطة التطوير المهني للمعلمين الجدد في المدرسة.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 10 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 10 },
      { criterion: 'الرفع على OneDrive', score: 9 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 10 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 8 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 8 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 9 },
      { criterion: 'عقد الشراكات المجتمعية', score: 8 },
      { criterion: 'التواصل مع أولياء الأمور', score: 7 },
    ],
    createdAt: '2025-11-30T10:00:00Z', updatedAt: '2025-11-30T10:00:00Z'
  },
  {
    id: 'f4', employeeName: 'أحمد عادل طبيشات', month: 'يناير', academicYear: '2025-2026', formDate: '2026-01-31',
    totalScore: 90.90909091,
    recommendations: 'عقد الشراكات المجتمعية.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 9 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 8 },
      { criterion: 'الرفع على OneDrive', score: 9 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 10 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 8 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 8 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 9 },
      { criterion: 'عقد الشراكات المجتمعية', score: 9 },
      { criterion: 'التواصل مع أولياء الأمور', score: 10 },
    ],
    createdAt: '2026-01-31T10:00:00Z', updatedAt: '2026-01-31T10:00:00Z'
  },
  {
    id: 'f5', employeeName: 'أحمد عادل طبيشات', month: 'فبراير', academicYear: '2025-2026', formDate: '2026-02-28',
    totalScore: 92.72727273,
    recommendations: 'المشاركة في مسابقات البحث العلمي ومسابقات الذكاء الاصطناعي.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 9 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 8 },
      { criterion: 'الرفع على OneDrive', score: 9 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 10 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 9 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 9 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 10 },
      { criterion: 'عقد الشراكات المجتمعية', score: 9 },
      { criterion: 'التواصل مع أولياء الأمور', score: 9 },
    ],
    createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-02-28T10:00:00Z'
  },
  {
    id: 'f6', employeeName: 'أحمد عادل طبيشات', month: 'مارس', academicYear: '2025-2026', formDate: '2026-03-31',
    totalScore: 91.81818182,
    recommendations: 'رفع التقارير والتوثيق للتعلم عن بعد، وإنشاء الخطة التنفيذية للتعلم عن بعد، وإنشاء الخطة الاستراتيجية لتفعيل الخدمات التكنولوجية 2024-2026.',
    notes: '',
    items: [
      { criterion: 'تفعيل الأنظمة الإلكترونية في المدرسة ومتابعتها باستمرار', score: 9 },
      { criterion: 'تنمية مهارات أطراف العملية التعليمية في توظيف التكنولوجيا', score: 8 },
      { criterion: 'الرفع على OneDrive', score: 9 },
      { criterion: 'تقارير المتابعة', score: 10 },
      { criterion: 'عقد اجتماعات دورية', score: 10 },
      { criterion: 'متابعة تنفيذ توصيات اللجنة الدائمة للتعليم الإلكتروني', score: 8 },
      { criterion: 'تطوير الذات وتبادل الخبرات', score: 9 },
      { criterion: 'التوعية بالحلول الإلكترونية المعتمدة من الوزارة', score: 10 },
      { criterion: 'المشاركة في المسابقات', score: 9 },
      { criterion: 'عقد الشراكات المجتمعية', score: 9 },
      { criterion: 'التواصل مع أولياء الأمور', score: 10 },
    ],
    createdAt: '2026-03-31T10:00:00Z', updatedAt: '2026-03-31T10:00:00Z'
  },
];

// --- Firestore-based Storage ---
import { getCollection, saveCollection, saveDocument, deleteDocument, seedIfEmpty, invalidateCache, COLLECTIONS } from './firestoreDb';

// Keep currentUser key for localStorage session management
const CURRENT_USER_KEY = 'qstss_current_user';

export const initialElearningSms: ElearningSms[] = [
  {
    id: 'sms-001',
    title: 'تفعيل حسابات أولياء الأمور بنظام قطر للتعليم',
    messageText: 'أولياء الأمور الكرام، نرحب بكم في العام الأكاديمي الجديد ونحثكم على تسجيل الدخول وتفعيل حساباتكم على منصة نظام قطر للتعليم لمتابعة الخطط والواجبات والتقييمات الأسبوعية لأبنائكم الطلبة. مدرسة قطر للعلوم والتكنولوجيا.',
    sentDate: '2026-09-02',
    academicYear: '2026-2027',
    senderName: 'قسم التعليم الإلكتروني والمشاريع',
    createdAt: '2026-09-02T08:00:00.000Z',
    updatedAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'sms-002',
    title: 'إشعار نشر التقييمات الأسبوعية والواجبات الإلكترونية',
    messageText: 'السادة أولياء الأمور الأفاضل، تم إسناد التقييمات الإلكترونية الأسبوعية والواجبات المدرسية عبر نظام قطر للتعليم، يرجى حث أبنائكم على الحل والالتزام بالمواعيد المحددة للرصد والمتابعة. شاكرين حسن تعاونكم.',
    sentDate: '2026-09-10',
    academicYear: '2026-2027',
    senderName: 'قسم التعليم الإلكتروني والمشاريع',
    createdAt: '2026-09-10T09:30:00.000Z',
    updatedAt: '2026-09-10T09:30:00.000Z',
  },
  {
    id: 'sms-003',
    title: 'دليل الدخول والتطبيقات التفاعلية الداعمة للتعلم',
    messageText: 'أولياء الأمور الكرام، حرصاً على تعزيز التمكين الرقمي للطلبة، تم رفع أدلة استخدام منصة قطر للتعليم وتطبيقات الذكاء الاصطناعي المساندة على بوابة المدرسة، للاطلاع ودعم رحلة التعلم الذاتي لأبنائكم.',
    sentDate: '2026-09-14',
    academicYear: '2026-2027',
    senderName: 'قسم التعليم الإلكتروني والمشاريع',
    createdAt: '2026-09-14T08:15:00.000Z',
    updatedAt: '2026-09-14T08:15:00.000Z',
  }
];

export const SEED_WORKSHOPS_2627: any[] = [
  {
    id: 'PD-2627-W01',
    workshopNumber: 1,
    academicYear: '2026-2027',
    titleAr: 'تدريب المعلمين والإداريين بالمدارس التخصصية الجديدة',
    titleEn: 'Training for Teachers & Admins in New Specialized Schools',
    date: '2026-08-20',
    month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'جلسة تطويرية',
    deliveryMethod: 'حضوري',
    targetAudience: 'المعلمين والإداريين ومنسقي المشاريع الإلكترونية',
    procedure: 'إعداد الخطة التدريبية والبدء بتدريب المعلمين والإداريين الجدد ضمن جدول والخطة المعتمدة من المدرسة',
    executionLevel: 'تم',
    status: 'موثق',
    hours: '3',
    venue: 'مختبر الحاسوب',
    category: 'تطوير مهني',
    followUpNotes: 'تم تنفيذ ورش المعلمين الجدد ومنسقي المشاريع والإداريين وفق الخطة المعتمدة',
    reportAvailable: true,
    evidenceStatus: 'موثق',
    createdAt: '2026-08-20',
    updatedAt: '2026-08-20'
  },
  {
    id: 'PD-2627-W02',
    workshopNumber: 2,
    academicYear: '2026-2027',
    titleAr: 'برنامج الأنظمة التعليمية والتقنية',
    titleEn: 'Educational & Technical Systems Program',
    date: '2026-08-22',
    month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'جلسة تطويرية',
    deliveryMethod: 'حضوري',
    targetAudience: 'المعلمين الجدد',
    procedure: 'عقد ورش متعددة للمعلمين الجدد في المدرسة لتمكينهم من الأنظمة والمنصات التعليمية المعتمدة',
    executionLevel: 'تم',
    status: 'موثق',
    hours: '2.5',
    venue: 'مختبر الحاسوب',
    category: 'تطوير مهني',
    followUpNotes: 'تم عقد الورش التدريبية وتمكين المعلمين منها - للاطلاع على التقرير انقر هنا',
    reportAvailable: true,
    evidenceStatus: 'موثق',
    createdAt: '2026-08-22',
    updatedAt: '2026-08-22'
  },
  {
    id: 'PD-2627-W03',
    workshopNumber: 3,
    academicYear: '2026-2027',
    titleAr: 'ورشة الذكاء الاصطناعي لمنسقي المشاريع',
    titleEn: 'AI Workshop for E-Project Coordinators',
    date: '2026-09-02',
    month: 'سبتمبر',
    facilitatorName: 'قسم التعليم الإلكتروني والحلول الرقمية',
    trainerName: 'قسم التعليم الإلكتروني والحلول الرقمية',
    organizerType: 'تطوير مهني وزاري',
    organizerName: 'وزارة التربية والتعليم والتعليم العالي',
    organizedBy: 'وزارة التربية والتعليم والتعليم العالي',
    trainingMode: 'ورشة خارجية',
    deliveryMethod: 'حضوري',
    targetAudience: 'منسقي المشاريع الإلكترونية',
    procedure: 'حضور الورشة التخصصية بناءً على تعليمات وزارة التربية والتعليم والتعليم العالي',
    executionLevel: 'تم',
    status: 'موثق',
    hours: '7',
    venue: 'فندق ميريديان',
    category: 'الذكاء الاصطناعي',
    followUpNotes: 'تم حضور الورش في فندق ميريديان – من الساعة ٧:٠٠ ص إلى ٢:٠٠ م يوم ٢ سبتمبر ٢٠٢٦م',
    reportAvailable: true,
    evidenceStatus: 'موثق',
    createdAt: '2026-09-02',
    updatedAt: '2026-09-02'
  },
  {
    id: 'PD-2627-W04',
    workshopNumber: 4,
    academicYear: '2026-2027',
    titleAr: 'الدليل الإرشادي لتفعيل الأدوات التكنولوجية',
    titleEn: 'Guidebook for Activating Technological Tools',
    date: '2026-08-28',
    month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني ونشر معرفي',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'جلسة تدريبية',
    deliveryMethod: 'حضوري وعن بعد',
    targetAudience: 'الطلاب / أولياء الأمور / المعلمين والإداريين',
    procedure: 'إعداد الدليل الإرشادي وإرساله لكافة أطراف العملية التعليمية للاطلاع عليه وتمكينهم من استخدام الأدوات التكنولوجية في المدرسة والسياسات الخاصة بها',
    executionLevel: 'تم',
    status: 'موثق',
    hours: '2',
    venue: 'المنصة الرقمية',
    category: 'أدلة رقمية',
    followUpNotes: 'تم نشر الدليل الجديد ونشره للطلاب وأولياء الأمور عبر المنصة الرسمية: https://qstssschools.web.app',
    evidenceUrl: 'https://qstssschools.web.app',
    reportAvailable: true,
    evidenceStatus: 'موثق',
    createdAt: '2026-08-28',
    updatedAt: '2026-08-28'
  },
  {
    id: 'PD-2627-W05',
    workshopNumber: 5,
    academicYear: '2026-2027',
    titleAr: 'ورشة تعريفية لمنصة قطر للتعليم',
    titleEn: 'Introductory Workshop for Qatar Education LMS',
    date: '2026-09-08',
    month: 'سبتمبر',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'جلسة تطويرية تطبيقية',
    deliveryMethod: 'حضوري',
    targetAudience: 'جميع المعلمين والطلاب / الصف السابع والتاسع الجدد',
    procedure: 'عقد ورشة تعريفية للمعلمين والطلاب عن آخر المستجدات والتحديثات على سياسات الرفع وإنشاء الدروس على نظام قطر للتعليم ضمن العناوين المرفقة بالدليل الإرشادي للتعليم الإلكتروني',
    executionLevel: 'تم',
    status: 'موثق',
    hours: '2',
    venue: 'المسرح المدرسي / مختبر الحاسوب',
    category: 'نظام قطر للتعليم',
    followUpNotes: 'تم تنفيذ الورشة مرفق تقرير الورشة: انقر هنا',
    reportAvailable: true,
    evidenceStatus: 'موثق',
    createdAt: '2026-09-08',
    updatedAt: '2026-09-08'
  },
  {
    id: 'PD-2627-W06',
    workshopNumber: 6,
    academicYear: '2026-2027',
    titleAr: 'منصة ClassPoint التفاعلية',
    titleEn: 'Interactive ClassPoint Platform Workshop',
    date: '2026-09-22',
    month: 'سبتمبر',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني مشترك',
    organizerName: 'شركة Inkone',
    organizedBy: 'شركة Inkone',
    trainingMode: 'جلسة تدريبية تفاعلية',
    deliveryMethod: 'عن بعد',
    targetAudience: 'المعلمين',
    procedure: 'عقد الورش التدريبية المختلفة لمعلمي الأقسام لتمكينهم من ClassPoint من قبل شركة Inkone عن بعد',
    executionLevel: 'قيد التنفيذ',
    status: 'قيد التنفيذ',
    hours: '2',
    venue: 'Online',
    category: 'ClassPoint',
    followUpNotes: 'التنسيق مع شركة Inkone لعقد الورشة عن بعد ومتابعة التفعيل الصفي',
    reportAvailable: false,
    evidenceStatus: 'قيد التنفيذ',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-15'
  },
  {
    id: 'PD-2627-W07',
    workshopNumber: 7,
    academicYear: '2026-2027',
    titleAr: 'نظام قطر للتعليم وبرنامج التيمز وون درايف',
    titleEn: 'Qatar Education LMS, Teams & OneDrive for Grade 9',
    date: '2026-09-28',
    month: 'سبتمبر',
    facilitatorName: 'أحمد طبيشات / فيصل الحضري',
    trainerName: 'أحمد طبيشات / فيصل الحضري',
    organizerType: 'تطوير مهني وتمكين طلابي',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'ورشة عمل تطبيقية للطلاب',
    deliveryMethod: 'حضوري',
    targetAudience: 'الطلاب',
    targetClasses: 'الصف التاسع',
    procedure: 'عقد ورش لطلاب الصف التاسع الجدد لتمكينهم من نظام قطر للتعليم وبرنامج التيمز والحوسبة السحابية',
    executionLevel: 'مخطط',
    status: 'مخطط',
    hours: '1.5',
    venue: 'مختبر الحاسوب',
    category: 'نظام قطر للتعليم',
    followUpNotes: 'التنسيق مع الأخصائي وجدولة الحصص الميدانية في مختبر الحاسوب',
    reportAvailable: false,
    evidenceStatus: 'مخطط',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-15'
  },
  {
    id: 'PD-2627-W08',
    workshopNumber: 8,
    academicYear: '2026-2027',
    titleAr: 'تطبيقات الذكاء الاصطناعي في الإطار الإداري',
    titleEn: 'AI Applications for Administrative Workflow',
    date: '2026-10-15',
    month: 'أكتوبر',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    organizerType: 'تطوير مهني للإداريين',
    organizerName: 'قسم التعلم الإلكتروني',
    organizedBy: 'قسم التعلم الإلكتروني',
    trainingMode: 'ورشة عمل تطبيقية',
    deliveryMethod: 'حضوري',
    targetAudience: 'الإداريين',
    procedure: 'تدريب الإداريين على التمكين التكنولوجي على استخدام تطبيقات الذكاء الاصطناعي الحديثة والمتطورة لتسريع المهام الإدارية',
    executionLevel: 'مخطط',
    status: 'مخطط',
    hours: '2',
    venue: 'مختبر الابتكار',
    category: 'الذكاء الاصطناعي',
    followUpNotes: 'إعداد المادة التدريبية وتجهيز المختبر التقني',
    reportAvailable: false,
    evidenceStatus: 'مخطط',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-15'
  }
];

export const SEED_INDIVIDUAL_2627_RECORDS: any[] = [
  { id: 'IND-2627-01', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-23', traineeNameAr: 'أحمد العجي', department: 'الإرشاد الأكاديمي', skillProvided: 'Canva', skillCategory: 'Canva', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-23T08:00:00.000Z', updatedAt: '2026-08-23T08:00:00.000Z' },
  { id: 'IND-2627-02', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-23', traineeNameAr: 'يامن فرح', department: 'الرياضيات', skillProvided: 'AI Generation Video', skillCategory: 'الذكاء الاصطناعي', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 25, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-23T08:30:00.000Z', updatedAt: '2026-08-23T08:30:00.000Z' },
  { id: 'IND-2627-03', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-24', traineeNameAr: 'أحمد فارس', department: 'STEM', skillProvided: 'LMS Monitoring', skillCategory: 'نظام قطر للتعليم', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-24T09:00:00.000Z', updatedAt: '2026-08-24T09:00:00.000Z' },
  { id: 'IND-2627-04', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-24', traineeNameAr: 'فوزي بوفخر الدين', department: 'STEM', skillProvided: 'SharePoint', skillCategory: 'Microsoft 365', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-24T09:30:00.000Z', updatedAt: '2026-08-24T09:30:00.000Z' },
  { id: 'IND-2627-05', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-25', traineeNameAr: 'كليفورد كالي', department: 'الرياضيات', skillProvided: 'Qatar Education', skillCategory: 'نظام قطر للتعليم', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T10:00:00.000Z' },
  { id: 'IND-2627-06', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-25', traineeNameAr: 'عيسى سويدان', department: 'الحاسوب', skillProvided: 'GitHub Copilot', skillCategory: 'الذكاء الاصطناعي', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-25T10:30:00.000Z', updatedAt: '2026-08-25T10:30:00.000Z' },
  { id: 'IND-2627-07', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-25', traineeNameAr: 'د. محمد سلامة', department: 'Research', skillProvided: 'GitHub Copilot', skillCategory: 'الذكاء الاصطناعي', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-25T11:00:00.000Z', updatedAt: '2026-08-25T11:00:00.000Z' },
  { id: 'IND-2627-08', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-27', traineeNameAr: 'علي الصيعري', department: 'مهندس', skillProvided: 'LMS Qatar Education', skillCategory: 'نظام قطر للتعليم', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-27T08:00:00.000Z', updatedAt: '2026-08-27T08:00:00.000Z' },
  { id: 'IND-2627-09', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-27', traineeNameAr: 'صهيب محمد', department: 'أخصائي أنشطة', skillProvided: 'AI Tools', skillCategory: 'الذكاء الاصطناعي', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-27T08:30:00.000Z', updatedAt: '2026-08-27T08:30:00.000Z' },
  { id: 'IND-2627-10', academicYear: '2026-2027', month: 'أغسطس', trainingDate: '2026-08-28', traineeNameAr: 'صهيب محمد', department: 'أخصائي أنشطة', skillProvided: 'Canva', skillCategory: 'Canva', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-28T09:00:00.000Z', updatedAt: '2026-08-28T09:00:00.000Z' },
  { id: 'IND-2627-11', academicYear: '2026-2027', month: 'سبتمبر', trainingDate: '2026-08-26', traineeNameAr: 'نبيل أيوب', department: 'STEM', skillProvided: 'نظام قطر للتعليم و Canva', skillCategory: 'نظام قطر للتعليم', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-08-26T09:30:00.000Z', updatedAt: '2026-08-26T09:30:00.000Z' },
  { id: 'IND-2627-12', academicYear: '2026-2027', month: 'سبتمبر', trainingDate: '2026-09-01', traineeNameAr: 'أشرف فدعوس', department: 'STEM', skillProvided: 'AI Tools', skillCategory: 'الذكاء الاصطناعي', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' },
  { id: 'IND-2627-13', academicYear: '2026-2027', month: 'سبتمبر', trainingDate: '2026-09-01', traineeNameAr: 'نزار حاجي', department: 'STEM', skillProvided: 'Outlook', skillCategory: 'Microsoft 365', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-09-01T10:30:00.000Z', updatedAt: '2026-09-01T10:30:00.000Z' },
  { id: 'IND-2627-14', academicYear: '2026-2027', month: 'سبتمبر', trainingDate: '2026-09-02', traineeNameAr: 'محمد أحمد حلمي', department: 'مصادر التعلم', skillProvided: 'Calameo E-Book Publisher', skillCategory: 'الكتب الإلكترونية', trainerName: 'أحمد طبيشات', trainerRole: 'منسق المشاريع الإلكترونية', trainingType: 'تدريب فردي', deliveryMethod: 'دعم مباشر', durationMinutes: 20, evidenceStatus: 'موثق', signatureStatus: 'تم التوقيع', sourceType: 'كشف تدريب فردي مرفق', createdBy: 'أحمد طبيشات', createdAt: '2026-09-02T11:00:00.000Z', updatedAt: '2026-09-02T11:00:00.000Z' },
];

// Seed MEEE records for staff who applied or got certified (Original 2025-2026 data as requested)
const SEED_MEEE_RECORDS = [
  {
    id: 'MEEE-admin-ahmad-001',
    teacherId: '',
    teacherName: 'أحمد عادل طبيشات',
    department: 'إداري',
    status: 'حصل على الشهادة',
    applicationDate: '2025-09-15',
    certificationDate: '2025-11-10',
    academicYear: '2025-2026',
    notes: 'منسق المشاريع والتعليم الإلكتروني - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-roy-002',
    teacherId: '',
    teacherName: 'روي مخول',
    department: 'الحاسوب',
    status: 'حصل على الشهادة',
    applicationDate: '2025-09-20',
    certificationDate: '2025-11-15',
    academicYear: '2025-2026',
    notes: 'منسق قسم الحاسوب والتكنولوجيا - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-yamen-003',
    teacherId: '',
    teacherName: 'يامن فرح',
    department: 'الرياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2025-09-25',
    certificationDate: '2025-11-20',
    academicYear: '2025-2026',
    notes: 'منسق قسم الرياضيات - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-faris-004',
    teacherId: '',
    teacherName: 'أحمد عقله فارس',
    department: 'STEM',
    status: 'حصل على الشهادة',
    applicationDate: '2025-09-25',
    certificationDate: '2025-11-20',
    academicYear: '2025-2026',
    notes: 'منسق قسم STEM - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-dahman-005',
    teacherId: '',
    teacherName: 'يوسف دحمان',
    department: 'اللغة الإنجليزية',
    status: 'حصل على الشهادة',
    applicationDate: '2025-10-01',
    certificationDate: '2025-12-01',
    academicYear: '2025-2026',
    notes: 'منسق قسم اللغة الإنجليزية - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-asaad-006',
    teacherId: '',
    teacherName: 'أسعد ناعس',
    department: 'اللغة العربية',
    status: 'حصل على الشهادة',
    applicationDate: '2025-10-05',
    certificationDate: '2025-12-05',
    academicYear: '2025-2026',
    notes: 'منسق قسم اللغة العربية - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-elwan-007',
    teacherId: '',
    teacherName: 'ماهر علوان',
    department: 'التربية الإسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2025-10-10',
    certificationDate: '2025-12-10',
    academicYear: '2025-2026',
    notes: 'منسق قسم التربية الإسلامية - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-cert-salameh-008',
    teacherId: '',
    teacherName: 'محمد عمر سلامة',
    department: 'مختبر الروبوت',
    status: 'حصل على الشهادة',
    applicationDate: '2025-10-15',
    certificationDate: '2025-12-15',
    academicYear: '2025-2026',
    notes: 'مسؤول المختبرات التخصصية - معتمد خبير مايكروسوفت MIEE',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-app-tarabi-009',
    teacherId: '',
    teacherName: 'راجي ترابي',
    department: 'STEM',
    status: 'تم التقديم',
    applicationDate: '2025-10-20',
    certificationDate: '',
    academicYear: '2025-2026',
    notes: 'معلم STEM - قيد المراجعة لدى مايكروسوفت',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'MEEE-app-kadhem-010',
    teacherId: '',
    teacherName: 'زايد كاظم',
    department: 'STEM',
    status: 'تم التقديم',
    applicationDate: '2025-10-25',
    certificationDate: '',
    academicYear: '2025-2026',
    notes: 'معلم STEM - قيد المراجعة لدى مايكروسوفت',
    updatedAt: new Date().toISOString(),
  },
];

// Official MEEE 2026-2027 Records based on official QSTSS Report (36 Certified Teachers)
export const SEED_MEEE_2627_RECORDS = [
  {
    id: 'MEEE-2627-01',
    teacherId: '',
    teacherName: 'راجي ترابي',
    department: 'STEM',
    role: 'STEM',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-02',
    teacherId: '',
    teacherName: 'حجيبالله خاسييف',
    department: 'STEM',
    role: 'STEM -Chemistry',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-03',
    teacherId: '',
    teacherName: 'عمران كاشف محمد حسين اسد',
    department: 'STEM',
    role: 'STEM',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-04',
    teacherId: '',
    teacherName: 'ماهر عيسى حسن علوان',
    department: 'التربية الإسلامية',
    role: 'منسق الدراسات الاسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-05',
    teacherId: '',
    teacherName: 'حسام حامد علي البنوي',
    department: 'التربية الإسلامية',
    role: 'معلم الدراسات الإسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-06',
    teacherId: '',
    teacherName: 'محمد عمر محمد سلامه',
    department: 'البحث العلمي',
    role: 'اخصائي البحث العلمي',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-17',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-17T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-07',
    teacherId: '',
    teacherName: 'كليفرد جورج بايلي',
    department: 'الرياضيات',
    role: 'معلم رياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-08',
    teacherId: '',
    teacherName: 'ابراهيم عونى عمر حسن النعيمى',
    department: 'مختبر الطاقة',
    role: 'مهندس مختبر الطاقة',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-09',
    teacherId: '',
    teacherName: 'سليمان ميا',
    department: 'STEM',
    role: 'STEM -Chemistry',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-10',
    teacherId: '',
    teacherName: 'زكي أحمد خالد',
    department: 'اللغة الإنجليزية',
    role: 'معلم اللغة الإنجليزية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-11',
    teacherId: '',
    teacherName: 'محمد كمال محمد زيد',
    department: 'الرياضيات',
    role: 'معلم رياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-12',
    teacherId: '',
    teacherName: 'يامن فرح فرح',
    department: 'الرياضيات',
    role: 'منسق الرياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-13',
    teacherId: '',
    teacherName: 'فيصل محمد مسلم الحضري',
    department: 'اللغة العربية',
    role: 'معلم الدراسات الاجتماعية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-14',
    teacherId: '',
    teacherName: 'محمد ورسامي عمر',
    department: 'اللغة الإنجليزية',
    role: 'معلم اللغة الإنجليزية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-15',
    teacherId: '',
    teacherName: 'احمد عادل عبده طبيشات',
    department: 'إداري',
    role: 'منسق المشاريع الالكترونية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-16',
    teacherId: '',
    teacherName: 'الحسن علي محمد علي',
    department: 'التربية الإسلامية',
    role: 'معلم الدراسات الإسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-17',
    teacherId: '',
    teacherName: 'اسعد محمود ناعس',
    department: 'اللغة العربية',
    role: 'منسق اللغة العربية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-18',
    teacherId: '',
    teacherName: 'زايد كاظم',
    department: 'STEM',
    role: 'STEM',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-19',
    teacherId: '',
    teacherName: 'امداد علي',
    department: 'الحاسوب',
    role: 'معلم حاسوب',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-20',
    teacherId: '',
    teacherName: 'ابراهيم حلمى ابراهيم جمعه',
    department: 'اللغة العربية',
    role: 'معلم اللغة العربية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-21',
    teacherId: '',
    teacherName: 'خالد عصام بارودي',
    department: 'الحاسوب',
    role: 'معلم حاسوب',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-17',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-17T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-22',
    teacherId: '',
    teacherName: 'محمد قاسم',
    department: 'الرياضيات',
    role: 'معلم رياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-23',
    teacherId: '',
    teacherName: 'علاء حسني محمد موسى',
    department: 'التربية الإسلامية',
    role: 'معلم الدراسات الإسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-24',
    teacherId: '',
    teacherName: 'جاد مصطفى العيتاني',
    department: 'البحث العلمي',
    role: 'اخصائي البحث العلمي',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-25',
    teacherId: '',
    teacherName: 'يوسف دحمان',
    department: 'اللغة الإنجليزية',
    role: 'منسق اللغة الإنجليزية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-26',
    teacherId: '',
    teacherName: 'محمد عماد ازكول',
    department: 'الرياضيات',
    role: 'معلم رياضيات',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-27',
    teacherId: '',
    teacherName: 'امجد سهيل عزيز',
    department: 'STEM',
    role: 'STEM - Biology',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-28',
    teacherId: '',
    teacherName: 'انس عبدالكريم موسى جرادات',
    department: 'مختبر الطاقة',
    role: 'مهندس مختبر الطاقة',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-29',
    teacherId: '',
    teacherName: 'اشرف صالح محمد فدعوس',
    department: 'STEM',
    role: 'STEM - Physics',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-30',
    teacherId: '',
    teacherName: 'نبيل صلاح الدين عطيه ايوب',
    department: 'STEM',
    role: 'STEM -Chemistry',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-31',
    teacherId: '',
    teacherName: 'على سالم على سالمين الصيعري',
    department: 'مختبر التصنيع الرقمي',
    role: 'مهندس مختبر التصنيع',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-17',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-17T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-32',
    teacherId: '',
    teacherName: 'شاكيل احمد رفيق',
    department: 'STEM',
    role: 'STEM -Chemistry',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-33',
    teacherId: '',
    teacherName: 'سمير بلفقي',
    department: 'اللغة العربية',
    role: 'معلم اللغة العربية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-34',
    teacherId: '',
    teacherName: 'عبدالعزيز محمد',
    department: 'STEM',
    role: 'STEM',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-17',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-17T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-35',
    teacherId: '',
    teacherName: 'محمد سامي ابراهيم عبدالقادر الكفرى',
    department: 'الحاسوب',
    role: 'معلم حاسوب',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'MEEE-2627-36',
    teacherId: '',
    teacherName: 'ناصر احمد حسن حلوة',
    department: 'التربية الإسلامية',
    role: 'معلم الدراسات الإسلامية',
    status: 'حصل على الشهادة',
    applicationDate: '2026-09-01',
    certificationDate: '2026-09-16',
    academicYear: '2026-2027',
    notes: 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات',
    updatedAt: '2026-09-16T12:00:00.000Z',
  },
];

export const db = {
  getUsers: async (): Promise<User[]> => {
    const stored = await seedIfEmpty<User>(COLLECTIONS.users, initialUsers);
    const initialMap = new Map(initialUsers.map(u => [u.id, u]));
    let hasChanges = false;

    const updated = stored.map(user => {
      const match = initialMap.get(user.id);
      if (match) {
        if (
          user.name !== match.name ||
          user.nameEn !== match.nameEn ||
          user.email !== match.email ||
          user.username !== match.username ||
          user.employeeId !== match.employeeId ||
          user.departmentId !== match.departmentId ||
          JSON.stringify(user.departmentIds) !== JSON.stringify(match.departmentIds) ||
          user.status !== match.status
        ) {
          hasChanges = true;
          return { ...user, ...match };
        }
      }
      return user;
    });

    const existingUserIds = new Set(stored.map(u => u.id));
    const missingUsers = initialUsers.filter(u => !existingUserIds.has(u.id));
    if (missingUsers.length > 0) {
      hasChanges = true;
      updated.push(...missingUsers);
    }

    if (hasChanges) {
      try {
        await saveCollection(COLLECTIONS.users, updated);
      } catch (e) {
        console.error("Failed to save updated users to Firestore:", e);
      }
      return updated;
    }
    return stored;
  },
  saveUsers: async (u: User[]): Promise<void> => {
    await saveCollection(COLLECTIONS.users, u);
  },
  getDepartments: async (): Promise<Department[]> => {
    const existing = await seedIfEmpty<Department>(COLLECTIONS.departments, initialDepartments);
    const existingIds = new Set(existing.map(d => d.id));
    const missing = initialDepartments.filter(d => !existingIds.has(d.id));
    if (missing.length > 0) {
      const merged = [...existing, ...missing];
      await saveCollection(COLLECTIONS.departments, merged);
      return merged;
    }
    return existing;
  },
  saveDepartments: async (d: Department[]): Promise<void> => {
    await saveCollection(COLLECTIONS.departments, d);
  },
  getTeachers: async (): Promise<Teacher[]> => {
    const list = await seedIfEmpty<Teacher>(COLLECTIONS.teachers, initialTeachers);
    return list.filter(t => !isExcludedTeacher(t));
  },
  saveTeachers: async (t: Teacher[]): Promise<void> => {
    await saveCollection(COLLECTIONS.teachers, t.filter(x => !isExcludedTeacher(x)));
  },
  deleteTeacher: async (id: string): Promise<void> => {
    await deleteDocument(COLLECTIONS.teachers, id);
  },
  getEvaluations: async (): Promise<Evaluation[]> => {
    const list = await seedIfEmpty<Evaluation>(COLLECTIONS.evaluations, initialEvaluations);
    const rawTeachers = await getCollection<Teacher>(COLLECTIONS.teachers);
    const excludedIds = new Set(
      rawTeachers.filter(t => isExcludedTeacher(t)).map(t => t.id)
    );
    return list.filter(e => {
      if (excludedIds.has(e.teacherId)) return false;
      const t = initialTeachers.find(x => x.id === e.teacherId);
      if (t && isExcludedTeacher(t)) return false;
      return true;
    });
  },
  saveEvaluations: async (e: Evaluation[]): Promise<void> => {
    const rawTeachers = await getCollection<Teacher>(COLLECTIONS.teachers);
    const excludedIds = new Set(
      rawTeachers.filter(t => isExcludedTeacher(t)).map(t => t.id)
    );
    const filtered = e.filter(ev => {
      if (excludedIds.has(ev.teacherId)) return false;
      const t = initialTeachers.find(x => x.id === ev.teacherId);
      if (t && isExcludedTeacher(t)) return false;
      return true;
    });
    await saveCollection(COLLECTIONS.evaluations, filtered);
  },
  deleteEvaluation: async (id: string): Promise<void> => {
    return deleteDocument(COLLECTIONS.evaluations, id);
  },
  getModelLessonEvaluations: async (): Promise<ModelLessonEvaluation[]> => {
    return seedIfEmpty<ModelLessonEvaluation>(COLLECTIONS.modelLessonEvaluations, []);
  },
  saveModelLessonEvaluations: async (items: ModelLessonEvaluation[]): Promise<void> => {
    await saveCollection(COLLECTIONS.modelLessonEvaluations, items);
  },
  saveModelLessonEvaluation: async (item: ModelLessonEvaluation): Promise<string> => {
    return saveDocument<ModelLessonEvaluation>(COLLECTIONS.modelLessonEvaluations, item);
  },
  deleteModelLessonEvaluation: async (id: string): Promise<void> => {
    return deleteDocument(COLLECTIONS.modelLessonEvaluations, id);
  },
  getModelLessonSchedules: async (): Promise<ModelLessonScheduleItem[]> => {
    return getCollection<ModelLessonScheduleItem>(COLLECTIONS.modelLessonSchedules);
  },
  saveModelLessonSchedules: async (items: ModelLessonScheduleItem[]): Promise<void> => {
    await saveCollection(COLLECTIONS.modelLessonSchedules, items);
  },
  saveModelLessonSchedule: async (item: ModelLessonScheduleItem): Promise<string> => {
    return saveDocument<ModelLessonScheduleItem>(COLLECTIONS.modelLessonSchedules, item);
  },
  deleteModelLessonSchedule: async (id: string): Promise<void> => {
    return deleteDocument(COLLECTIONS.modelLessonSchedules, id);
  },
  getDailyTasks: async (): Promise<DailyTask[]> => {
    const stored = await seedIfEmpty<DailyTask>(COLLECTIONS.dailyTasks, initialDailyTasks);
    const existingTitles = new Set(stored.map(t => `${t.title}-${t.month}-${t.academicYear}`));
    const newFromSeed = initialDailyTasks.filter(t => !existingTitles.has(`${t.title}-${t.month}-${t.academicYear}`));
    if (newFromSeed.length > 0) {
      const merged = [...stored, ...newFromSeed];
      try {
        await saveCollection(COLLECTIONS.dailyTasks, merged);
      } catch (e) {
        console.error("Failed to save merged daily tasks to Firestore:", e);
      }
      return merged;
    }
    return stored;
  },
  saveDailyTasks: async (t: DailyTask[]): Promise<void> => {
    await saveCollection(COLLECTIONS.dailyTasks, t);
  },
  deleteDailyTask: async (id: string): Promise<void> => {
    return deleteDocument(COLLECTIONS.dailyTasks, id);
  },
  getMonthlyNotes: async (): Promise<MonthlyTaskNote[]> => {
    const stored = await seedIfEmpty<MonthlyTaskNote>(COLLECTIONS.monthlyNotes, []);
    const existingKeys = new Set(stored.map(n => `${n.month}-${n.academicYear}`));
    const newFromSeed = SEED_NOTES.filter(n => !existingKeys.has(`${n.month}-${n.academicYear}`)).map(n => ({
      id: generateId(),
      ...n,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    if (newFromSeed.length > 0) {
      const merged = [...stored, ...newFromSeed];
      try {
        await saveCollection(COLLECTIONS.monthlyNotes, merged);
      } catch (e) {
        console.error("Failed to save merged monthly notes to Firestore:", e);
      }
      return merged;
    }
    return stored;
  },
  saveMonthlyNotes: async (n: MonthlyTaskNote[]): Promise<void> => {
    await saveCollection(COLLECTIONS.monthlyNotes, n);
  },
  getAchievements: async (): Promise<Achievement[]> => {
    const stored = await seedIfEmpty<Achievement>(COLLECTIONS.achievements, []);
    const existingIds = new Set(stored.map(a => `${a.serialNumber}-${a.academicYear}`));
    
    const newFromSeed = SEED_ACHIEVEMENTS.filter(a => !existingIds.has(`${a.serialNumber}-${a.academicYear}`)).map(a => ({
      id: generateId(),
      ...a,
      level: a.level as 'عالمي' | 'إقليمي' | 'محلي',
      smartCategory: classifyAchievement(a.achievementName, a.organizer, a.result),
      documentationStatus: 'موثق' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) as Achievement[];

    if (newFromSeed.length > 0) {
      const merged = [...stored, ...newFromSeed];
      try {
        await saveCollection(COLLECTIONS.achievements, merged);
      } catch (e) {
        console.error("Failed to save merged achievements to Firestore:", e);
      }
      return merged;
    }
    return stored;
  },
  saveAchievements: async (a: Achievement[]): Promise<void> => {
    await saveCollection(COLLECTIONS.achievements, a);
  },
  getFollowUpForms: async (): Promise<CoordinatorFollowUpForm[]> => {
    return seedIfEmpty<CoordinatorFollowUpForm>(COLLECTIONS.followUpForms, initialFollowUpForms);
  },
  saveFollowUpForms: async (f: CoordinatorFollowUpForm[]): Promise<void> => {
    await saveCollection(COLLECTIONS.followUpForms, f);
  },
  getWorkshops: async (): Promise<any[]> => {
    const existing = await getCollection(COLLECTIONS.workshops) as any[];
    const existingIds = new Set(existing.map((w: any) => w.id));
    const missing = SEED_WORKSHOPS_2627.filter((w: any) => !existingIds.has(w.id));
    if (missing.length > 0) {
      const merged: any[] = [...existing, ...missing];
      try {
        await saveCollection(COLLECTIONS.workshops, merged);
      } catch (e) {
        console.error("Failed to save merged workshops:", e);
      }
      return merged;
    }
    return existing.length > 0 ? existing : (typeof PD_WORKSHOPS !== 'undefined' ? PD_WORKSHOPS : SEED_WORKSHOPS_2627);
  },
  saveWorkshops: async (w: any[]): Promise<void> => {
    await saveCollection(COLLECTIONS.workshops, w);
  },
  getIndividualPDRecords: async (): Promise<any[]> => {
    const existing = await getCollection(COLLECTIONS.individualPDRecords) as any[];
    const existingIds = new Set(existing.map((r: any) => r.id));
    const missing = SEED_INDIVIDUAL_2627_RECORDS.filter((r: any) => !existingIds.has(r.id));
    if (missing.length > 0) {
      const merged: any[] = [...existing, ...missing];
      try {
        await saveCollection(COLLECTIONS.individualPDRecords, merged);
      } catch (e) {
        console.error("Failed to save merged individual PD records:", e);
      }
      return merged;
    }
    return existing.length > 0 ? existing : (typeof PD_INDIVIDUAL_RECORDS !== 'undefined' ? PD_INDIVIDUAL_RECORDS : SEED_INDIVIDUAL_2627_RECORDS);
  },
  saveIndividualPDRecords: async (r: any[]): Promise<void> => {
    await saveCollection(COLLECTIONS.individualPDRecords, r);
  },
  getMeeeRecords: async (): Promise<any[]> => {
    const existing = await getCollection(COLLECTIONS.meeeRecords) as any[];
    const non2627 = existing.filter((r: any) => r.academicYear !== '2026-2027');
    const existing2627 = existing.filter((r: any) => r.academicYear === '2026-2027');

    let updated2627 = [...existing2627];
    let hasChanged = false;

    const existing2627Ids = new Set(existing2627.map((r: any) => r.id));
    const missingSeed2627 = SEED_MEEE_2627_RECORDS.filter((r: any) => !existing2627Ids.has(r.id));
    if (missingSeed2627.length > 0) {
      updated2627.push(...missingSeed2627);
      hasChanged = true;
    }

    const missingOriginal = SEED_MEEE_RECORDS.filter((r: any) => !non2627.some((e: any) => e.id === r.id));
    if (missingOriginal.length > 0) {
      non2627.push(...missingOriginal);
      hasChanged = true;
    }

    const merged = [...non2627, ...updated2627];
    if (hasChanged) {
      try {
        await saveCollection(COLLECTIONS.meeeRecords, merged);
      } catch (e) {
        console.error("Failed to sync meeeRecords in Firestore:", e);
      }
    }
    return merged.length > 0 ? merged : [...SEED_MEEE_RECORDS, ...SEED_MEEE_2627_RECORDS];
  },
  saveMeeeRecords: async (r: any[]): Promise<void> => {
    await saveCollection(COLLECTIONS.meeeRecords, r);
  },
  getElearningSms: async (): Promise<ElearningSms[]> => {
    const stored = await seedIfEmpty<ElearningSms>(COLLECTIONS.elearningSms, initialElearningSms);
    const existingIds = new Set(stored.map(s => s.id));
    const missing = initialElearningSms.filter(s => !existingIds.has(s.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      try {
        await saveCollection(COLLECTIONS.elearningSms, merged);
      } catch (e) {
        console.error("Failed to save merged elearning SMS to Firestore:", e);
      }
      return merged;
    }
    return stored;
  },
  saveElearningSms: async (items: ElearningSms[]): Promise<void> => {
    await saveCollection(COLLECTIONS.elearningSms, items);
  },
  deleteElearningSms: async (id: string): Promise<void> => {
    return deleteDocument(COLLECTIONS.elearningSms, id);
  },
  // Session management stays in localStorage
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem(CURRENT_USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.error("Error parsing current user session:", e);
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  },
  setCurrentUser: (u: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (u) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.error("Error writing current user session:", e);
    }
  },
  login: async (emailOrUser: string, password: string): Promise<User | null> => {
    const users = await seedIfEmpty<User>(COLLECTIONS.users, initialUsers);
    return users.find(u =>
      (u.email === emailOrUser || u.username === emailOrUser) &&
      u.password === password && (u.status === 'active' || u.status === 'pending')
    ) || null;
  },
  forceReseedAll: async (): Promise<void> => {
    await Promise.all([
      saveCollection(COLLECTIONS.users, initialUsers),
      saveCollection(COLLECTIONS.departments, initialDepartments),
      saveCollection(COLLECTIONS.teachers, initialTeachers),
      saveCollection(COLLECTIONS.evaluations, initialEvaluations),
      saveCollection(COLLECTIONS.dailyTasks, initialDailyTasks),
      saveCollection(COLLECTIONS.followUpForms, initialFollowUpForms),
      saveCollection(COLLECTIONS.workshops, PD_WORKSHOPS),
      saveCollection(COLLECTIONS.individualPDRecords, PD_INDIVIDUAL_RECORDS),
      saveCollection(COLLECTIONS.meeeRecords, []),
    ]);

    const notes = SEED_NOTES.map(n => ({
      id: generateId(),
      ...n,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    const achievements = SEED_ACHIEVEMENTS.map(a => ({
      id: generateId(),
      ...a,
      level: a.level as 'عالمي' | 'إقليمي' | 'محلي',
      smartCategory: classifyAchievement(a.achievementName, a.organizer, a.result),
      documentationStatus: 'موثق' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) as Achievement[];

    await Promise.all([
      saveCollection(COLLECTIONS.monthlyNotes, notes),
      saveCollection(COLLECTIONS.achievements, achievements),
    ]);

    if (typeof window !== 'undefined') {
      Object.keys(localStorage).filter(k => k.startsWith('qstss')).forEach(k => localStorage.removeItem(k));
      invalidateCache();
    }
  },
};
export function generateId(): string { return Math.random().toString(36).substr(2, 9) + Date.now().toString(36); }
