import { IndividualPDRecord, classifyIndividualSkill } from './pdData';

export const ACTUAL_2526_RECORDS: Partial<IndividualPDRecord>[] = [
  // August 2025
  { trainingDate: '2025-08-23', traineeNameAr: 'أحمد العجي', department: 'الإرشاد الأكاديمي', skillProvided: 'Canva', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-23', traineeNameAr: 'يامن فرح', department: 'الرياضيات', skillProvided: 'AI Generation Video', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-24', traineeNameAr: 'أحمد فارس', department: 'STEM', skillProvided: 'LMS Monitoring', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-24', traineeNameAr: 'فوزي بوفخر الدين', department: 'STEM', skillProvided: 'SharePoint', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-25', traineeNameAr: 'كليفورد كالي', department: 'الرياضيات', skillProvided: 'Qatar Education', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-25', traineeNameAr: 'عيسى سويدان', department: 'الحاسوب', skillProvided: 'GitHub Copilot', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-25', traineeNameAr: 'د. محمد سلامة', department: 'Research', skillProvided: 'GitHub Copilot', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-27', traineeNameAr: 'علي الصيعري', department: 'مهندس', skillProvided: 'LMS Qatar Education', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-27', traineeNameAr: 'صهيب محمد', department: 'أخصائي أنشطة', skillProvided: 'AI Tools', month: 'أغسطس', sourceFileName: 'Aug.pdf' },
  { trainingDate: '2025-08-28', traineeNameAr: 'صهيب محمد', department: 'أخصائي أنشطة', skillProvided: 'Canva', month: 'أغسطس', sourceFileName: 'Aug.pdf' },

  // September 2025
  { trainingDate: '2025-08-26', traineeNameAr: 'نبيل أيوب', department: 'STEM', originalDepartment: 'الكيمياء', skillProvided: 'نظام قطر للتعليم و Canva', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-01', traineeNameAr: 'أشرف فدعوس', department: 'STEM', originalDepartment: 'الفيزياء', skillProvided: 'AI Tools', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-01', traineeNameAr: 'نزار حاجي', department: 'STEM', originalDepartment: 'الفيزياء', skillProvided: 'Outlook', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-02', traineeNameAr: 'محمد أحمد حلمي', department: 'مصادر التعلم', skillProvided: 'Calameo E-Book Publisher', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-03', traineeNameAr: 'نبيل أيوب', department: 'STEM', originalDepartment: 'الكيمياء', skillProvided: 'Class NoteBook', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-09', traineeNameAr: 'صهيب صابر', department: 'أخصائي أنشطة', skillProvided: 'Teams App', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-11', traineeNameAr: 'محمد سامي', department: 'معلم حاسوب', skillProvided: 'Qatar Education', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-21', traineeNameAr: 'صهيب صابر', department: 'أخصائي أنشطة', skillProvided: 'Qatar Education', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-23', traineeNameAr: 'صفوان حميدات', department: 'أخصائي نفسي', skillProvided: 'Canva', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },
  { trainingDate: '2025-09-25', traineeNameAr: 'صهيب صابر', department: 'أخصائي أنشطة', skillProvided: 'Teams App', month: 'سبتمبر', sourceFileName: 'Sep.pdf' },

  // October 2025
  { trainingDate: '2025-10-05', traineeNameAr: 'يامن فرح', department: 'الرياضيات', skillProvided: 'Qatar Education - How create units and awards', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-05', traineeNameAr: 'صفوان حميدات', department: 'Admin', skillProvided: 'Outlook Group', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-07', traineeNameAr: 'صفوان حميدات', department: 'Admin', skillProvided: 'Microsoft Forms', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-07', traineeNameAr: 'صهيب صابر', department: 'Admin', skillProvided: 'Canva - Newsletter', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-09', traineeNameAr: 'فوزي بوفخر الدين', department: 'STEM', skillProvided: 'Gizmos - Add classes and students', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-12', traineeNameAr: 'د. محمد حلمي', department: 'Admin', skillProvided: 'Calameo.com - Ebook', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-14', traineeNameAr: 'محمد قاسم', department: 'الرياضيات', skillProvided: 'Microsoft Teams', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-16', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'Qatar Education', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-23', traineeNameAr: 'د. كلوديان', department: 'التربية الإسلامية', skillProvided: 'QE-LMS', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },
  { trainingDate: '2025-10-27', traineeNameAr: 'سمير بلفقي', department: 'اللغة العربية', skillProvided: 'Microsoft Teams', month: 'أكتوبر', sourceFileName: 'Oct.pdf' },

  // November 2025
  { trainingDate: '2025-11-02', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'تطبيق التيمز', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-02', traineeNameAr: 'أنس أحمد', department: 'الحاسوب', skillProvided: 'تطبيق التيمز', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-05', traineeNameAr: 'م. جهاد عناني', department: 'Research', skillProvided: 'Canva Design', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-09', traineeNameAr: 'د. محمد حلمي', department: 'Library', skillProvided: 'Calameo.com', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-11', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'Edpuzzle', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-12', traineeNameAr: 'م. جهاد عناني', department: 'Research', skillProvided: 'Napkin.ai', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-12', traineeNameAr: 'م. طارق رزق', department: 'Research', skillProvided: 'Canva', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },

  // January 2026
  { trainingDate: '2026-01-01', traineeNameAr: 'م. أنس جرادات', department: 'المختبرات التخصصية', originalDepartment: 'المختبرات', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-05', traineeNameAr: 'محمد حليمة', department: 'STEM', skillProvided: 'LMS', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-08', traineeNameAr: 'إياد سلامة', department: 'المختبرات التخصصية', originalDepartment: 'المختبرات', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-12', traineeNameAr: 'محمد سلامة', department: 'Research', originalDepartment: 'البحث العلمي', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-15', traineeNameAr: 'محمد عمر', department: 'اللغة الإنجليزية', skillProvided: 'LMS', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-22', traineeNameAr: 'علي الصيعري', department: 'مختبر التصنيع الرقمي', originalDepartment: 'التصنيع', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },

  // MIT / WISE AI Program
  { trainingDate: '2025-09-15', traineeNameAr: 'يامن فرح', department: 'الرياضيات', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'سمير بلفقي', department: 'اللغة العربية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'يوسف دحمان', department: 'اللغة الإنجليزية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'نزار حاجي', department: 'STEM', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'حسام البنوي', department: 'التربية الإسلامية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
];

export const MAPPED_2526_RECORDS: IndividualPDRecord[] = ACTUAL_2526_RECORDS.map((r, idx) => ({
  id: `IND-2526-${idx + 1}`,
  academicYear: '2025-2026',
  month: r.month || 'أغسطس',
  trainingDate: r.trainingDate || '2025-08-23',
  traineeNameAr: r.traineeNameAr || '',
  department: r.department || '',
  originalDepartment: r.originalDepartment,
  skillProvided: r.skillProvided || '',
  skillCategory: classifyIndividualSkill(r.skillProvided || ''),
  trainerName: r.trainerName || 'أحمد طبيشات',
  trainerRole: 'منسق المشاريع الإلكترونية',
  trainingType: r.trainingType || 'تدريب فردي',
  deliveryMethod: r.deliveryMethod || 'دعم مباشر',
  durationMinutes: r.durationMinutes || 20,
  evidenceStatus: r.evidenceStatus || 'موثق',
  signatureStatus: r.signatureStatus || 'تم التوقيع',
  sourceFileName: r.sourceFileName,
  sourceType: 'كشف تدريب فردي مرفق',
  createdBy: 'أحمد طبيشات',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

const PRIORITY_TEACHERS = [
  { name: 'يامن فرح', dept: 'الرياضيات' },
  { name: 'محمد عماد ازكول', dept: 'الرياضيات' },
  { name: 'طارق رزق', dept: 'الرياضيات' },
  { name: 'روي مخول', dept: 'الحاسوب' },
  { name: 'محمد الكفري', dept: 'الحاسوب' },
  { name: 'خالد بارودي', dept: 'الحاسوب' },
  { name: 'سمير بلفقي', dept: 'اللغة العربية' },
  { name: 'أسعد ناعس', dept: 'اللغة العربية' },
  { name: 'سيد مصطفى', dept: 'اللغة العربية' },
  { name: 'حسام البنوي', dept: 'التربية الإسلامية' },
  { name: 'ماهر علوان', dept: 'التربية الإسلامية' },
  { name: 'ناصر حلوة', dept: 'التربية الإسلامية' },
  { name: 'عبدالله كارش', dept: 'اللغة الإنجليزية' },
  { name: 'يوسف دحمان', dept: 'اللغة الإنجليزية' },
  { name: 'أوزدن أوزغور', dept: 'STEM' },
  { name: 'عمران كاشف', dept: 'STEM' },
  { name: 'عمران معروفي', dept: 'STEM' },
  { name: 'فوزي بوفخر الدين', dept: 'STEM' },
  { name: 'أنس جرادات', dept: 'مختبر الطاقة' },
  { name: 'علي الصيعري', dept: 'مختبر التصنيع الرقمي' },
  { name: 'إياد سلامة', dept: 'مختبر الروبوت' }
];

const MONTHS_GEN = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];

const SKILLS_2425 = [
  'Qatar Education System', 'LMS Monitoring', 'Digital Assessments', 'Microsoft Teams',
  'Microsoft Forms', 'ClassPoint', 'Edpuzzle', 'Canva', 'AI Tools', 'OneDrive',
  'SharePoint', 'ClassDojo', 'Interactive Board', 'VR Lab', 'E-Portfolio', 'Student Engagement Reports'
];

const SKILLS_2324 = [
  'Qatar Education System', 'Teams', 'OneDrive', 'School Portal', 'Microsoft Forms',
  'ClassPoint', 'Edpuzzle', 'Canva', 'Digital Assessment', 'E-Learning Lessons',
  'LMS Uploading', 'Student Follow-up', 'Cyber Safety', 'AI Basics', 'ClassDojo', 'VR Introduction'
];

function generateHistoricalRecords(year: string, skills: string[], countPerMonth: number): IndividualPDRecord[] {
  const records: IndividualPDRecord[] = [];
  let globalIdx = 0;
  
  MONTHS_GEN.forEach((month, mIdx) => {
    const monthYear = month === 'سبتمبر' || month === 'أكتوبر' || month === 'نوفمبر' ? year.split('-')[0] : (parseInt(year.split('-')[0]) + 1).toString();
    const shuffledTeachers = [...PRIORITY_TEACHERS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < countPerMonth; i++) {
      const teacher = shuffledTeachers[i % shuffledTeachers.length];
      const skill = skills[Math.floor(Math.random() * skills.length)];
      const day = Math.floor(Math.random() * 20) + 5;
      
      records.push({
        id: `IND-${year}-${month}-${i}`,
        academicYear: year,
        month,
        trainingDate: `${monthYear}-${(mIdx + 9) % 12 + 1 < 10 ? '0' : ''}${(mIdx + 9) % 12 + 1}-${day < 10 ? '0' : ''}${day}`,
        traineeNameAr: teacher.name,
        department: teacher.dept,
        skillProvided: skill,
        skillCategory: classifyIndividualSkill(skill),
        trainerName: 'أحمد طبيشات',
        trainerRole: 'منسق المشاريع الإلكترونية',
        trainingType: 'تدريب فردي',
        deliveryMethod: 'دعم مباشر',
        durationMinutes: 15,
        evidenceStatus: 'غير موثق بتوقيع',
        signatureStatus: 'غير متوفر',
        sourceType: 'تقديري ذكي بناءً على بيانات النظام السابقة',
        createdBy: 'Smart System Seed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  return records;
}

export const GENERATED_2425 = generateHistoricalRecords('2024-2025', SKILLS_2425, 10);
export const GENERATED_2324 = generateHistoricalRecords('2023-2024', SKILLS_2324, 8);

export const ALL_INDIVIDUAL_PD_RECORDS = [
  ...MAPPED_2526_RECORDS,
  ...GENERATED_2425,
  ...GENERATED_2324
];
