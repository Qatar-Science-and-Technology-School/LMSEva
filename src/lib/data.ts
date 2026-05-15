import { SEED_TASKS, SEED_NOTES, SEED_ACHIEVEMENTS } from './seedData';

// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
export const SCHOOL_NAME = 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين';
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
export interface Evaluation { id:string; teacherId:string; evaluatorId:string; month:string; academicYear:string; evaluationDate:string; criteria:EvaluationCriterion[]; totalScore:number; averageScore:number; percentage:number; performanceLevel:string; strengths:string; improvementAreas:string; recommendations:string; actionPlan:string; evidenceLinks:string[]; generalNotes:string; createdAt:string; updatedAt:string; }

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
export const ACADEMIC_YEARS = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];

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
export const EVALUATION_CRITERIA = [
  'استخدام المعلم لنظام قطر للتعليم بشكل منتظم',
  'نشر الدروس والوحدات التعليمية على نظام قطر للتعليم',
  'رفع مصادر تعليمية رقمية متنوعة مثل ملفات، روابط، فيديوهات، عروض',
  'إنشاء واجبات أو تقييمات إلكترونية للطلاب',
  'تصحيح التقييمات وتقديم تغذية راجعة للطلاب',
  'متابعة دخول الطلاب وتفاعلهم مع الدروس والأنشطة',
  'استخدام منصات تعليمية مساندة مثل ClassPoint, Edpuzzle, Teams, Forms, ClassDojo',
  'توظيف التكنولوجيا والسبورة التفاعلية داخل الحصة بطريقة تفاعلية وجاذبة',
  'استخدام أدوات الذكاء الاصطناعي أو الأدوات الرقمية بطريقة مناسبة وآمنة',
  'تنظيم المحتوى الرقمي والالتزام بتعليمات قسم التعليم الإلكتروني',
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
};
export const initialDepartments:Department[] = [
  {id:'d_arabic',  nameAr:'اللغة العربية',         nameEn:'Arabic Language'},
  {id:'d_islamic', nameAr:'التربية الإسلامية',      nameEn:'Islamic Education'},
  {id:'d_cs',      nameAr:'الحاسوب',               nameEn:'Computer Science'},
  {id:'d_math',    nameAr:'الرياضيات',             nameEn:'Mathematics'},
  {id:'d_english', nameAr:'اللغة الإنجليزية',      nameEn:'English Language'},
  {id:'d_stem',    nameAr:'STEM',                  nameEn:'STEM'},
  {id:'d_energylab',nameAr:'مختبر الطاقة',         nameEn:'Energy Lab'},
  {id:'d_fablab',  nameAr:'مختبر التصنيع الرقمي', nameEn:'Fab Lab'},
  {id:'d_robotlab',nameAr:'مختبر الروبوت',         nameEn:'Robotic Lab'},
  {id:'d_social',  nameAr:'الدراسات الاجتماعية',   nameEn:'Social Studies'},
];

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

// ── Centralized Recognition Logic ──────────────────────────────────────────
export function getMonthlyDepartmentHonorees(
  evaluations: Evaluation[],
  teachers: Teacher[],
  departments: Department[],
  year: string,
  month: string
) {
  const honorees: any[] = [];
  const evals = evaluations.filter(e => e.academicYear === year && e.month === month);
  
  departments.forEach(dept => {
    const deptTeachers = teachers.filter(t => t.departmentId === dept.id);
    const teacherIds = new Set(deptTeachers.map(t => t.id));
    const deptEvals = evals.filter(e => teacherIds.has(e.teacherId));
    
    if (deptEvals.length > 0) {
      deptEvals.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        const a10 = a.criteria.filter(c => c.score === 10).length;
        const b10 = b.criteria.filter(c => c.score === 10).length;
        if (b10 !== a10) return b10 - a10;
        if ((b.criteria[0]?.score||0) !== (a.criteria[0]?.score||0)) return (b.criteria[0]?.score||0) - (a.criteria[0]?.score||0);
        if ((b.criteria[1]?.score||0) !== (a.criteria[1]?.score||0)) return (b.criteria[1]?.score||0) - (a.criteria[1]?.score||0);
        if ((b.criteria[3]?.score||0) !== (a.criteria[3]?.score||0)) return (b.criteria[3]?.score||0) - (a.criteria[3]?.score||0);
        if ((b.criteria[4]?.score||0) !== (a.criteria[4]?.score||0)) return (b.criteria[4]?.score||0) - (a.criteria[4]?.score||0);
        const tA = teachers.find(x => x.id === a.teacherId);
        const tB = teachers.find(x => x.id === b.teacherId);
        return (tA?.nameAr || '').localeCompare(tB?.nameAr || '', 'ar');
      });
      const winnerEv = deptEvals[0];
      const teacher = teachers.find(t => t.id === winnerEv.teacherId);
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
const YEAR_START:Record<string,string> = {'2021-2022':'2021','2022-2023':'2022','2023-2024':'2023','2024-2025':'2024','2025-2026':'2025'};

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
  // Generate 10 criteria scores that sum close to target
  const avg = target / 10;
  const rng = seededRnd(seed);
  const raw = Array.from({length:10}, (_, i) => {
    const nudge = (rng() - 0.5) * 1.0; // ±0.5 variation
    return roundQ(clamp(avg + nudge, 1, 10));
  });
  // Adjust sum to match target exactly (spread rounding over criteria)
  const sum = raw.reduce((a,b) => a+b, 0);
  const diff = roundQ(target - sum);
  // Distribute diff across first criteria
  let remaining = diff;
  for (let i = 0; i < raw.length && Math.abs(remaining) >= 0.25; i++) {
    const adj = remaining > 0 ? 0.25 : -0.25;
    const nv = clamp(roundQ(raw[i] + adj), 1, 10);
    remaining = roundQ(remaining - (nv - raw[i]));
    raw[i] = nv;
  }
  return raw.map(score => ({score, note:''}));
}

function makeCriteriaHigh(target:number, seed:number):EvaluationCriterion[] {
  const avg = target / 10;
  const rng = seededRnd(seed);
  const raw = Array.from({length:10}, () => {
    const nudge = (rng() - 0.5) * 0.4;
    return roundQ(clamp(avg + nudge, 8.5, 10));
  });
  const sum = raw.reduce((a,b) => a+b, 0);
  let remaining = roundQ(target - sum);
  for (let i = 0; i < raw.length && Math.abs(remaining) >= 0.25; i++) {
    const adj = remaining > 0 ? 0.25 : -0.25;
    const nv = clamp(roundQ(raw[i] + adj), 8.5, 10);
    remaining = roundQ(remaining - (nv - raw[i]));
    raw[i] = nv;
  }
  return raw.map(score => ({score, note:''}));
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

          const avgCrit = targetTotal / 10;
          criteria = Array.from({length:10}, (_, ci) => {
            const r2 = seededRnd(seed + ci * 17 + 5);
            const v = clamp(roundQ(avgCrit + (r2()-0.5)*1.5), 4.0, 9.9);
            return {score:v, note:''};
          });
          const totalScore = roundQ(criteria.reduce((s,c)=>s+c.score, 0));
          clampedTotal = clamp(totalScore, 40, 99);
        }

        const averageScore = roundQ(clampedTotal / 10);
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
      const averageScore = roundQ(totalScore / 10);
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

// --- localStorage Keys ---
const KEYS = {
  teachers:'qstss_v5_teachers', evaluations:'qstss_v19_evaluations',
  departments:'qstss_v6_departments',
  users:'qstss_v14_users',
  currentUser:'qstss_current_user',
  dailyTasks: 'qstss_v1_daily_tasks',
  followUpForms: 'qstss_v1_followup_forms',
  workshops: 'qstss_v1_workshops',
  individualPDRecords: 'qstss_v1_individual_pd',
};
function getOrInit<T>(key:string,initial:T[]):T[] {
  if(typeof window==='undefined') return initial;
  try {
    const s=localStorage.getItem(key);
    if(!s){localStorage.setItem(key,JSON.stringify(initial));return initial;}
    return JSON.parse(s);
  } catch(e) {
    console.error('Storage error:', e);
    return initial;
  }
}
function saveData<T>(key:string,data:T[]) {
  if(typeof window!=='undefined') {
    try {
      localStorage.setItem(key,JSON.stringify(data));
    } catch(e) {
      console.error('Save error:', e);
    }
  }
}
export const db = {
  getUsers:        ()=>getOrInit(KEYS.users,initialUsers),
  saveUsers:       (u:User[])=>saveData(KEYS.users,u),
  getDepartments:  ()=>getOrInit(KEYS.departments,initialDepartments),
  saveDepartments: (d:Department[])=>saveData(KEYS.departments,d),
  getTeachers:     ()=>getOrInit(KEYS.teachers,initialTeachers),
  saveTeachers:    (t:Teacher[])=>saveData(KEYS.teachers,t),
  getEvaluations:  ()=>getOrInit(KEYS.evaluations,initialEvaluations),
  saveEvaluations: (e:Evaluation[])=>saveData(KEYS.evaluations,e),
  getDailyTasks:   () => {
    const stored = getOrInit(KEYS.dailyTasks, initialDailyTasks);
    // Ensure seed tasks are present (Smart Sync)
    const existingTitles = new Set(stored.map(t => `${t.title}-${t.month}-${t.academicYear}`));
    const newFromSeed = initialDailyTasks.filter(t => !existingTitles.has(`${t.title}-${t.month}-${t.academicYear}`));
    
    if (newFromSeed.length > 0) {
      const merged = [...stored, ...newFromSeed];
      saveData(KEYS.dailyTasks, merged);
      return merged;
    }
    return stored;
  },
  saveDailyTasks:  (t:DailyTask[])=>saveData(KEYS.dailyTasks,t),
  getMonthlyNotes: () => {
    const stored = getOrInit('monthly_task_notes', []) as MonthlyTaskNote[];
    const existingKeys = new Set(stored.map(n => `${n.month}-${n.academicYear}`));
    const newFromSeed = SEED_NOTES.filter(n => !existingKeys.has(`${n.month}-${n.academicYear}`)).map(n => ({
      id: generateId(),
      ...n,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    if (newFromSeed.length > 0) {
      const merged = [...stored, ...newFromSeed];
      saveData('monthly_task_notes', merged);
      return merged;
    }
    return stored;
  },
  saveMonthlyNotes:(n:MonthlyTaskNote[])=>saveData('monthly_task_notes',n),
  
  getAchievements: () => {
    const stored = getOrInit('system_achievements', []) as Achievement[];
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
      saveData('system_achievements', merged);
      return merged;
    }
    return stored;
  },
  saveAchievements: (a: Achievement[]) => saveData('system_achievements', a),
  getFollowUpForms:()=>getOrInit(KEYS.followUpForms,initialFollowUpForms),
  saveFollowUpForms:(f:CoordinatorFollowUpForm[])=>saveData(KEYS.followUpForms,f),
  getWorkshops: () => {
    if (typeof window === 'undefined') return [];
    const { PD_WORKSHOPS } = require('./pdData');
    const stored = getOrInit(KEYS.workshops, PD_WORKSHOPS) as any[];
    return stored;
  },
  saveWorkshops: (w: any[]) => saveData(KEYS.workshops, w),
  getIndividualPDRecords: () => {
    if (typeof window === 'undefined') return [];
    const { PD_INDIVIDUAL_RECORDS } = require('./pdData');
    const stored = getOrInit(KEYS.individualPDRecords, PD_INDIVIDUAL_RECORDS) as any[];
    return stored;
  },
  saveIndividualPDRecords: (r: any[]) => saveData(KEYS.individualPDRecords, r),
  getCurrentUser:():User|null=>{
    if(typeof window==='undefined') return null;
    const s=localStorage.getItem(KEYS.currentUser);
    return s?JSON.parse(s):null;
  },
  setCurrentUser:(u:User|null)=>{
    if(typeof window==='undefined') return;
    if(u) localStorage.setItem(KEYS.currentUser,JSON.stringify(u));
    else localStorage.removeItem(KEYS.currentUser);
  },
  login:(emailOrUser:string, password:string):User|null=>{
    const users=getOrInit(KEYS.users,initialUsers);
    return users.find(u=>
      (u.email===emailOrUser || u.username===emailOrUser) &&
      u.password===password && (u.status==='active' || u.status==='pending')
    )||null;
  },
};
export function generateId():string { return Math.random().toString(36).substr(2,9)+Date.now().toString(36); }
