// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
export const SCHOOL_NAME = 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين';
export const SYSTEM_TITLE = 'متابعة المعلمين لنظام قطر للتعليم';
export const SYSTEM_SUBTITLE = 'نظام إلكتروني لمتابعة وتقييم تفعيل المعلمين لنظام قطر للتعليم والمنصات التعليمية الرقمية';
export const DESIGNER_CREDIT = 'تصميم وتطوير: م.أحمد طبيشات - منسق المشاريع الإلكترونية';

export type Role = 'admin' | 'evaluator' | 'leader' | 'coordinator';
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

export const MONTHS = ['سبتمبر','أكتوبر','نوفمبر','يناير','فبراير','مارس','أبريل','مايو'];
export const ACADEMIC_YEARS = ['2023-2024','2024-2025','2025-2026'];
export const EVALUATION_CRITERIA = [
  'استخدام المعلم لنظام قطر للتعليم بشكل منتظم',
  'نشر الدروس والوحدات التعليمية على نظام قطر للتعليم',
  'رفع مصادر تعليمية رقمية متنوعة مثل ملفات، روابط، فيديوهات، عروض',
  'إنشاء واجبات أو تقييمات إلكترونية للطلاب',
  'تصحيح التقييمات وتقديم تغذية راجعة للطلاب',
  'متابعة دخول الطلاب وتفاعلهم مع الدروس والأنشطة',
  'استخدام منصات تعليمية مساندة مثل ClassPoint, Edpuzzle, Teams, Forms, ClassDojo',
  'توظيف التكنولوجيا داخل الحصة بطريقة تفاعلية وجاذبة',
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
  {id:'d_chem',    nameAr:'الكيمياء',              nameEn:'Chemistry'},
  {id:'d_phys',    nameAr:'الفيزياء',              nameEn:'Physics'},
  {id:'d_bio',     nameAr:'الأحياء',               nameEn:'Biology'},
  {id:'d_english', nameAr:'اللغة الإنجليزية',      nameEn:'English Language'},
  {id:'d_stem',    nameAr:'STEM',                  nameEn:'STEM'},
  {id:'d_energylab',nameAr:'مختبر الطاقة',         nameEn:'Energy Lab'},
  {id:'d_fablab',  nameAr:'مختبر التصنيع الرقمي', nameEn:'Fab Lab'},
  {id:'d_robotlab',nameAr:'مختبر الروبوت',         nameEn:'Robotic Lab'},
  {id:'d_social',  nameAr:'الدراسات الاجتماعية',   nameEn:'Social Studies'},
];
export const HIGH_PERF_DEPTS = new Set(['d_arabic','d_islamic','d_cs','d_math']);
export function getDeptName(id:string,depts:Department[]):string { return depts.find(d=>d.id===id)?.nameAr||id; }

export const initialUsers:User[] = [
  // ─ Admins ─────────────────────────────────────────────────────────────────
  {id:'u1',  name:'م.أحمد طبيشات',  nameEn:'Ahmad Tubaishat',      email:'a.tubaishat1704@education.qa', password:'admin123',  role:'admin',   status:'active'},
  {id:'u10', name:'م.أحمد طبيشات',  nameEn:'Ahmad Tubaishat',      email:'admin@school.qa',              password:'admin123',  role:'admin',   status:'active'},
  // ─ School Leadership ──────────────────────────────────────────────────
  {id:'u2',  name:'د.راني التوم',   nameEn:'Dr. Rani Al-Toum',     email:'r.altoum1512@education.qa',    password:'leader123', role:'leader',  status:'active'},
  {id:'u12', name:'قيادة المدرسة', nameEn:'School Leader',        email:'leader@school.qa',             password:'leader123', role:'leader',  status:'active'},
  // ─ Evaluator ──────────────────────────────────────────────────────────
  {id:'u11', name:'منسق إلكتروني', nameEn:'Evaluator',            email:'evaluator@school.qa',          password:'eval123',   role:'evaluator', status:'active'},
  // ─ Official Coordinators ────────────────────────────────────────────
  {id:'uc1', name:'يامن فرح',          nameEn:'YAMEN FARAH FARAH',    email:'y.farah2507@education.qa', username:'y.farah2507',    password:'QSTSS@2026', role:'coordinator', employeeId:'27976002886', departmentId:'d_math',    departmentIds:['d_math'],    status:'active'},
  {id:'uc2', name:'يوسف دحمان',        nameEn:'YOUSSEF DAHMAN',       email:'y.dahman0209@education.qa', username:'y.dahman0209',   password:'QSTSS@2026', role:'coordinator', employeeId:'28852800073', departmentId:'d_english', departmentIds:['d_english'], status:'active'},
  {id:'uc3', name:'د. محمد عمر سلامة',  nameEn:'MOHAMMED OMAR MOHD SALAMEH', email:'m.salameh1301@education.qa', username:'m.salameh1301', password:'QSTSS@2026', role:'coordinator', employeeId:'28240001674', departmentIds:['d_energylab','d_fablab','d_robotlab'], status:'active'},
  {id:'uc4', name:'د. ماهر علوان',      nameEn:'MAHER ISSA HASAN ELWAN', email:'m.elwan2704@education.qa', username:'m.elwan2704',   password:'QSTSS@2026', role:'coordinator', employeeId:'27440001203', departmentId:'d_islamic', departmentIds:['d_islamic'], status:'active'},
  {id:'uc5', name:'أ. أسعد ناعس',       nameEn:'ASAAD MAHMOUD NAIS',   email:'n.asaad0108@education.qa', username:'n.asaad0108',   password:'QSTSS@2026', role:'coordinator', employeeId:'27376001799', departmentId:'d_arabic',  departmentIds:['d_arabic'],  status:'active'},
  {id:'uc6', name:'عيسى سويدان',        nameEn:'ESSA IBRAHEM MOUSA SWEIDAN', email:'e.sweidan0601@education.qa', username:'e.sweidan0601', password:'QSTSS@2026', role:'coordinator', employeeId:'28440000737', departmentId:'d_cs',      departmentIds:['d_cs'],      status:'active'},
  {id:'uc7', name:'أحمد عقله فارس',    nameEn:'AHMAD OQLAH FARIS',    email:'a.faris1404@education.qa', username:'a.faris1404', password:'QSTSS@2026', role:'coordinator', departmentId:'d_stem',    departmentIds:['d_stem'],    status:'active'},
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
  't12','t16','t17','t29','t33','t35','t36','t39','t41','t46','t47','t48','t50','t54','t55','t56','t57'
]);

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
  't33': {base:96},  // هشام سليمان - Arabic
  't47': {base:97},  // ابراهيم حلمي - Arabic
  't48': {base:95},  // سمير بلفقي - Arabic
  't55': {base:94},  // اسعد ناعس - Arabic
  't54': {base:95},  // سيد مصطفى - Arabic
  't1':  {base:94},  // الحسن علي - Islamic
  't35': {base:93},  // علاء حسني - Islamic
  't39': {base:95},  // حسام البنوي - Islamic
  't50': {base:94},  // ماهر علوان - Islamic
  't56': {base:96},  // ناصر حلوة - Islamic
  't57': {base:100}, // اوزدن اوزغور - Physics
  't36': {base:100}, // عمران كاشف - Chemistry
  't12': {base:100}, // حجيبالله - Chemistry
  't29': {base:100}, // سيد هيدور - Biology
  't46': {base:95},  // روي مخول - CS
  't17': {base:94},  // فيصل الحضري - Social
  't16': {base:93},  // عبدالله كارش - English
  't41': {base:97},  // يامن فرح - Math
  't30': {base:95},  // فوزي عصام - Chemistry
  't18': {base:91},  // طارق رزق
  't34': {base:90},  // محمد الكفري
  't4':  {base:88},  // انس جرادات (2025-26 only)
};

// Low-dept exceptions (good despite being in STEM/Physics/English)
const LOW_EXCEPTIONS = new Set(['t16','t40','t44']); // كارش, نزار, اشرف فدعوس

// Dept base scores (target total out of 100)
function deptBase(deptId:string, tid:string):number {
  if (tid in TOP_TEACHERS) return TOP_TEACHERS[tid].base;
  if (LOW_EXCEPTIONS.has(tid)) return 84;
  if (['d_arabic','d_islamic'].includes(deptId)) return 88;
  if (['d_cs','d_math'].includes(deptId)) return 86;
  if (['d_bio','d_chem','d_social','d_energylab','d_fablab','d_robotlab'].includes(deptId)) return 81;
  // STEM, Physics, English = lower
  return 74;
}

// Year progression multipliers: 2025-2026 is best
const YEAR_MULT: Record<string,number> = {
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
const YEAR_START:Record<string,string> = {'2023-2024':'2023','2024-2025':'2024','2025-2026':'2025'};

// ── Official 2025-2026 annual scores by employee_id ────────────────────────
const OFFICIAL_2526: Record<string,number> = {
  '28881800075':90, '29382600819':70, '29382600766':80, '29040002523':95,
  '29082600735':80, '28612400247':89, '28484000736':70, '28482600709':90,
  '27782601147':90, '27412400337':90, '29482600750':90, '29603100050':85,
  '28782601010':99, '29582600586':90, '29188600078':90, '29082600879':99,
  '29051200038':100,'28942201555':90, '28940000290':80, '28882600706':94,
  '28876200012':80, '28852800073':90, '28840001589':70, '28836800074':90,
  '28812400217':75, '28799900308':90, '28635628457':80, '28582600990':80,
  '28482600419':90, '28442201873':90, '28440001988':85, '28382601047':85,
  '28258605547':100,'28210000046':80, '28140001682':90, '28140001202':100,'28078800165':90,
  '27976002886':100,'27882601227':94, '27842201563':92, '27840001272':89,
  '27684000920':90, '27642201189':100,'27581801911':100,'27550400480':100,
  '27482600941':90, '27440001203':90, '27384000793':90, '27382601243':80,
  '27376001799':100,'27281804414':100,'27158601882':80, '27040000493':100,
  '26979200995':100, '29603100050':100, '28482600419':100,
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

  // ── 2023-2024 and 2024-2025 ────────────────────────────────────────────────
  [0,1].forEach(yIdx => {
    const year = ACADEMIC_YEARS[yIdx];
    MONTHS.forEach((month, mIdx) => {
      initialTeachers.forEach((teacher) => {
        const tid = teacher.id;
        if (EARLY_EXCLUDED.has(tid)) return; // only in 2025-2026

        let clampedTotal: number;
        let criteria: EvaluationCriterion[];

        if (TOP_EARLY_TEACHERS.has(tid)) {
          // HIGH performers: 92-100 range with monthly variation
          const baseTarget = TOP_MONTHLY_SCORES[mIdx] ?? 95;
          // Slight teacher-specific offset so same dept teachers differ slightly
          const tidNum = parseInt(tid.replace('t',''));
          const teacherOffset = ((tidNum * 7 + yIdx * 13) % 5) * 0.25 - 0.5;
          const rawTarget = clamp(baseTarget + teacherOffset, 92, 100);
          clampedTotal = roundQ(rawTarget);

          // Generate criteria: each 9.0-10, summing to clampedTotal
          const seed = tidNum * 500 + mIdx * 31 + yIdx * 79;
          criteria = makeCriteriaHigh(clampedTotal, seed);

        } else {
          const base = deptBase(teacher.departmentId, tid);
          const yearMult = YEAR_MULT[year];
          const monthBonus = mIdx * 0.2;
          const seed = parseInt(tid.replace('t','')) * 1000 + mIdx * 13 + yIdx * 97;
          const rng = seededRnd(seed);
          const noise = (rng() - 0.5) * 6;
          let targetTotal = clamp(base * yearMult + monthBonus + noise, 70, 99);
          targetTotal = roundQ(targetTotal);

          const avgCrit = targetTotal / 10;
          criteria = Array.from({length:10}, (_, ci) => {
            const r2 = seededRnd(seed + ci * 17 + 5);
            const v = clamp(roundQ(avgCrit + (r2()-0.5)*1.5), 7.0, 9.9);
            return {score:v, note:''};
          });
          const totalScore = roundQ(criteria.reduce((s,c)=>s+c.score, 0));
          clampedTotal = clamp(totalScore, 70, 99);
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
          generalNotes: isTop ? 'يُعد المعلم من المعلمين المتميزين في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية، مع التزام واضح بنشر الدروس، رفع المصادر، متابعة الطلاب، وتوظيف الأدوات الرقمية بشكل فعّال.' : '',
          createdAt:dateStr, updatedAt:dateStr,
        });
      });
    });
  });

  // ── 2025-2026: use official annual scores with ±1-3 monthly variation ─────
  const year26 = '2025-2026';
  MONTHS.forEach((month, mIdx) => {
    initialTeachers.forEach((teacher) => {
      const tid = teacher.id;
      const annualScore = OFFICIAL_2526[teacher.employeeId];
      if (annualScore === undefined) return; // skip if not in official table

      const offset = MONTH_OFFSETS[mIdx];
      // For score=100: keep 98.5-100; For low scores: stay near annual
      let rawTotal: number;
      if (annualScore === 100) {
        rawTotal = clamp(100 + offset * 0.5, 98.5, 100);
      } else {
        rawTotal = clamp(annualScore + offset, 1, 100);
      }
      const totalScore = roundQ(rawTotal);
      const averageScore = roundQ(totalScore / 10);
      const perf = getPerformanceLevel(totalScore);

      const seed26 = parseInt(tid.replace('t','')) * 500 + mIdx * 31;
      const criteria = makeCriteria(totalScore, seed26);

      const calYr = EARLY_MONTHS.has(month) ? '2026' : '2025';
      const dateStr = `${calYr}-${MONTH_DATES[month]}-28`;

      const isSpecialist = false; // no text-note teachers in official table
      const isStrong = totalScore >= 90;
      const needsFollowup = totalScore < 80;

      out.push({
        id:`e${idx++}`, teacherId:tid, evaluatorId:'u1',
        month, academicYear:year26, evaluationDate:dateStr,
        criteria, totalScore, averageScore, percentage:totalScore,
        performanceLevel:perf.label,
        strengths: isStrong
          ? 'التزام ممتاز بالمنصات الرقمية وتوظيفها بفاعلية عالية داخل الحصص الدراسية'
          : 'حضور منتظم واستخدام أساسي للمنصات التعليمية',
        improvementAreas: needsFollowup
          ? 'تفعيل نظام قطر للتعليم بصورة منتظمة ورفع التقييمات الإلكترونية'
          : 'تطوير استخدام أدوات الذكاء الاصطناعي والمنصات التفاعلية',
        recommendations: needsFollowup
          ? 'حضور دورة تدريبية متخصصة على نظام قطر للتعليم وتطبيق خطة تحسين شهرية'
          : 'الاستمرار والمشاركة في ورش تطوير المعلمين وتوثيق الممارسات الرقمية',
        actionPlan: needsFollowup ? 'خطة تطوير شهرية مع المنسق الإلكتروني' : '',
        evidenceLinks:[],
        generalNotes: isSpecialist ? 'يستخدم منصات تعليمية متخصصة ضمن ممارسات التعليم الإلكتروني.' : '',
        createdAt:dateStr, updatedAt:dateStr,
      });
    });
  });

  return out;
}

export const initialEvaluations:Evaluation[] = buildSampleEvaluations();

// ── localStorage ──────────────────────────────────────────────────────────
const KEYS = {
  teachers:'qstss_v3_teachers', evaluations:'qstss_v3_evaluations',
  departments:'qstss_v3_departments',
  users:'qstss_v6_users',          // bumped to v6: refresh Ahmad Faris credentials
  currentUser:'qstss_current_user',
};
function getOrInit<T>(key:string,initial:T[]):T[] {
  if(typeof window==='undefined') return initial;
  const s=localStorage.getItem(key);
  if(!s){localStorage.setItem(key,JSON.stringify(initial));return initial;}
  return JSON.parse(s);
}
function saveData<T>(key:string,data:T[]) {
  if(typeof window!=='undefined') localStorage.setItem(key,JSON.stringify(data));
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
