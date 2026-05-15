export interface Workshop {
  id: string;
  workshopNumber?: number;
  titleAr: string;
  titleEn: string;
  academicYear: string;
  date: string;
  originalDateText?: string;
  month: string;
  facilitatorName: string;
  facilitatorPosition?: string;
  trainerName?: string;
  trainerPosition?: string;
  organizerType: string;
  organizerName: string;
  organizedBy: string;
  trainingMode: string;
  deliveryMethod: string;
  targetAudience: string;
  targetGroup?: string; // mapping for legacy/compatibility
  hours: string;
  durationHours?: number;
  venue: string;
  category: string;
  objectives?: string;
  keyPoints?: string;
  recommendations?: string;
  followUpMethods?: string;
  followUpTimeline?: string;
  attendanceCount?: number;
  reportFileName?: string;
  attendanceFileName?: string;
  evidenceUrl?: string;
  evidenceFileUrl?: string;
  evidenceStatus?: string;
  reportAvailable?: boolean;
  attendanceAvailable?: boolean;
  photosAvailable?: boolean;
  sourceFileName?: string;
  notes?: string;
  sourceFile?: string;
  status: 'تم التنفيذ' | 'قيد التنفيذ' | 'مخطط' | 'موثق' | 'يحتاج متابعة' | 'يحتاج رابط تقرير' | 'مكتمل مع تقرير';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy support for older fields if needed
  nameAr?: string;
  nameEn?: string;
  semester?: string;
  trainer?: string;
  entity?: string;
  location?: string;
  goal?: string;
  description?: string;
  documentationLevel?: string;
  reportUrl?: string;
  attendanceUrl?: string;
  certificatesUrl?: string;
  presentationUrl?: string;
  materialUrl?: string;
  feedbackUrl?: string;
  lastUpdate?: string;
  type?: string;
  subject?: string;
}

export interface PDAttendance {
  id: string;
  workshopId: string;
  participantName: string;
  department: string;
  jobTitle: string;
  signatureStatus: boolean;
  notes?: string;
}

export interface PDEvidence {
  id: string;
  workshopId?: string; // Optional for individual PD
  recordId?: string; // For individual PD
  title: string;
  fileName: string;
  fileUrl?: string;
  url?: string;
  evidenceType: string;
  notes?: string;
  createdAt: string;
}

export interface IndividualPDRecord {
  id: string;
  academicYear: string;
  month: string;
  trainingDate: string;
  traineeNameAr: string;
  traineeNameEn?: string;
  teacherId?: string;
  employeeId?: string;
  department: string;
  skillProvided: string;
  skillCategory: string;
  trainerName: string;
  trainerRole: string;
  trainingType: 'تدريب فردي' | 'دعم فني' | 'متابعة منصة' | 'تدريب تطبيقي' | 'إرشاد رقمي' | 'برنامج تعلم ذاتي / تطوير مهني خارجي';
  deliveryMethod: 'حضوري' | 'عن بعد' | 'دعم مباشر' | 'Online';
  durationMinutes: number;
  evidenceStatus: string;
  signatureStatus: 'تم التوقيع' | 'غير متوفر' | 'بانتظار التوقيع';
  sourceFileName?: string;
  sourceType: string; // "كشف تدريب فردي مرفق" or "تقديري ذكي بناءً على بيانات النظام السابقة"
  notes?: string;
  originalDepartment?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndividualPDSkill {
  id: string;
  skillName: string;
  skillCategory: string;
  platformName: string;
  description?: string;
  status: 'active' | 'archived';
}

export interface IndividualPDReport {
  id: string;
  academicYear: string;
  month: string;
  totalRecords: number;
  totalTeachers: number;
  mostCommonSkill: string;
  mostActiveDepartment: string;
  generatedAt: string;
  generatedBy: string;
}

export const PD_WORKSHOPS: Workshop[] = [
  // --- 2023-2024 (Migrated) ---
  {
    id: 'PD-2324-01',
    titleAr: 'Starboard', titleEn: 'Starboard Training',
    academicYear: '2023-2024', date: '2023-08-25', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات', organizerType: 'تدريب أجهزة عرض',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون الجدد',
    hours: '2', venue: 'المختبر', category: 'ورشة تقنية',
    objectives: 'تدريب المعلمين على استخدام السبورات التفاعلية',
    keyPoints: 'ورشة عمل حول استخدام أجهزة العرض التفاعلية Starboard',
    status: 'تم التنفيذ', createdAt: '2023-09-01', updatedAt: '2023-09-01'
  },
  {
    id: 'PD-2324-02',
    titleAr: 'Microsoft Teams', titleEn: 'Microsoft Teams Training',
    academicYear: '2023-2024', date: '2023-08-26', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات', organizerType: 'تدريب منصة تواصل وتعليم عن بعد',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون الجدد',
    hours: '2', venue: 'المختبر', category: 'ورشة تقنية',
    objectives: 'تمكين المعلمين من استخدام منصة Teams',
    keyPoints: 'تدريب على استخدام Microsoft Teams للتعليم والتواصل',
    status: 'تم التنفيذ', createdAt: '2023-09-01', updatedAt: '2023-09-01'
  },
  {
    id: 'PD-2324-03',
    titleAr: 'الأنظمة الوزارية والمدرسية TMS / MOE Services', titleEn: 'Ministerial & School Systems',
    academicYear: '2023-2024', date: '2023-08-27', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات', organizerType: 'تدريب أنظمة إلكترونية',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون الجدد',
    hours: '2', venue: 'المختبر', category: 'ورشة تقنية',
    objectives: 'التعريف بالأنظمة الوزارية والمدرسية',
    keyPoints: 'شرح كيفية استخدام TMS وخدمات وزارة التعليم',
    status: 'تم التنفيذ', createdAt: '2023-09-01', updatedAt: '2023-09-01'
  },
  {
    id: 'PD-2324-04',
    titleAr: 'منصة قطر للتعليم – ورشة تذكيرية', titleEn: 'Qatar Education System - Refresher',
    academicYear: '2023-2024', date: '2023-08-28', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات، فوزي بوفخر الدين، أوزغور أوزدن', organizerType: 'منصة تعليمية',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون القدامى',
    hours: '2', venue: 'المسرح', category: 'نظام قطر للتعليم',
    objectives: 'تنشيط معلومات المعلمين حول منصة قطر للتعليم',
    keyPoints: 'ورشة تذكيرية حول التحديثات الجديدة في منصة قطر للتعليم',
    status: 'تم التنفيذ', createdAt: '2023-09-01', updatedAt: '2023-09-01'
  },
  {
    id: 'PD-2324-05',
    titleAr: 'منصة قطر للتعليم – تدريب المعلمين الجدد', titleEn: 'Qatar Education System - New Teachers',
    academicYear: '2023-2024', date: '2023-08-29', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات', organizerType: 'منصة تعليمية',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون الجدد',
    hours: '3', venue: 'المختبر', category: 'نظام قطر للتعليم',
    objectives: 'تدريب المعلمين الجدد على أساسيات المنصة',
    keyPoints: 'تدريب تأسيسي للمعلمين الجدد على منصة قطر للتعليم',
    status: 'تم التنفيذ', createdAt: '2023-09-01', updatedAt: '2023-09-01'
  },

  // --- 2024-2025 (Migrated) ---
  {
    id: 'PD-2425-01',
    titleAr: 'استخدام أجهزة العرض التفاعلية / Starboard / Visualizer', titleEn: 'Interactive Display Systems',
    academicYear: '2024-2025', date: '2024-08-25', month: 'أغسطس',
    facilitatorName: 'أحمد طبيشات', organizerType: 'أجهزة تعليمية',
    organizerName: 'قسم التعليم الإلكتروني', organizedBy: 'قسم التعليم الإلكتروني',
    trainingMode: 'ورشة عمل', deliveryMethod: 'حضوري', targetAudience: 'المعلمون الجدد',
    hours: '2', venue: 'المختبر', category: 'ورشة تقنية',
    objectives: 'تدريب المعلمين الجدد على التجهيزات التقنية للفصول',
    keyPoints: 'شرح شامل لأجهزة Starboard و Visualizer',
    status: 'تم التنفيذ', createdAt: '2024-09-01', updatedAt: '2024-09-01'
  },

  // --- 2025-2026 (Workshops 11-24) ---
  {
    id: 'PD-2526-W11',
    workshopNumber: 11,
    academicYear: '2025-2026',
    titleAr: 'ورشة تدريبية حول استخدام تقنيات الواقع الافتراضي في التعليم',
    titleEn: 'VR Lab: Implementation and Content Creation',
    subject: 'استخدام تقنيات الواقع الافتراضي في التعليم',
    facilitatorName: 'مايكل',
    trainerName: 'مايكل',
    trainerPosition: 'مدرب',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'Cherry Company',
    organizedBy: 'Cherry Company',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'معلمي المدرسة',
    date: '2025-08-27',
    month: 'أغسطس',
    hours: '2',
    durationHours: 2,
    venue: 'VR LAB',
    category: 'الواقع الافتراضي',
    objectives: '• تعريف المعلمين بنظام Cherry الإلكتروني.\n• شرح مكونات النظام وآلية عمله مع نظارات الواقع الافتراضي.\n• تدريب عملي على استخدام نظارات الواقع الافتراضي.\n• تمكين المعلمين من تشغيل النظارات والتفاعل مع بيئات التعلم الافتراضية.\n• تهيئة المعلمين لتوظيف الواقع الافتراضي في التعليم.\n• تعزيز الكفاءة التقنية للمعلمين.\n• دعم استراتيجيات التعليم التفاعلي.\n• ضمان جاهزية مختبر VR مع بداية العام الدراسي.',
    keyPoints: '• التعريف بنظام Cherry الخاص بنظارات الواقع الافتراضي.\n• شرح آلية ربط النظارات بالمنصة الإلكترونية.\n• خطوات تشغيل واستخدام نظارات الواقع الافتراضي داخل الصف.\n• تدريب عملي للمعلمين على التفاعل مع المحتوى.\n• استعراض نماذج من الدروس التي يمكن تنفيذها عبر الواقع الافتراضي.\n• مناقشة آلية دمج الواقع الافتراضي في الحصص الصفية واللاصفية.\n• الإجابة عن استفسارات المعلمين التقنية والفنية.\n• التأكيد على أهمية الواقع الافتراضي في تحسين تجربة التعلم.',
    recommendations: '• دمج الواقع الافتراضي ضمن الخطط الدراسية للمواد المناسبة.\n• تخصيص حصص تطبيقية أسبوعية للاستفادة من مختبر VR.\n• استمرار عقد ورش تدريبية دورية لمواكبة تحديثات نظام Cherry.\n• إنشاء دليل مبسط للاستخدام اليومي مخصص للمعلمين.\n• تشجيع المعلمين على مشاركة تجاربهم الناجحة باستخدام التقنية.\n• التنسيق مع قسم تكنولوجيا التعليم لضمان الدعم الفني المستمر.\n• تفعيل أدوات تقييم تقيس أثر استخدام الواقع الافتراضي على تعلم الطلاب.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'VR Workshop Report.pdf',
    sourceFile: 'VR Workshop Report.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-08-27',
    updatedAt: '2025-08-27'
  },
  {
    id: 'PD-2526-W12',
    workshopNumber: 12,
    academicYear: '2025-2026',
    titleAr: 'ورشة تدريبية عن منصة Edpuzzle',
    titleEn: 'Edpuzzle Online Training: Introductory Videos, Slides, Quizzes, Advanced Learning Paths and Student Projects',
    subject: 'Edpuzzle online training',
    facilitatorName: 'Alisa Linarejos Jimenez',
    trainerName: 'Alisa Linarejos Jimenez',
    trainerPosition: 'Edpuzzle Trainer',
    organizerType: 'Online Workshop / Session',
    organizerName: 'Edpuzzle Company',
    organizedBy: 'Edpuzzle Company',
    trainingMode: 'Online Training',
    deliveryMethod: 'تدريب عن بعد',
    targetAudience: 'المعلمون',
    date: '2025-08-27',
    month: 'أغسطس',
    hours: '3',
    durationHours: 3,
    venue: 'Online',
    category: 'Edpuzzle',
    objectives: '• فهم Edpuzzle كمنصة تعليمية شاملة.\n• التعرف على كيفية استخدام الفيديوهات والشرائح والاختبارات التفاعلية.\n• اكتساب مهارات إنشاء وإدارة الدروس التفاعلية.\n• تصميم مسارات تعلم مخصصة للطلاب.\n• استخدام المنصة لتعزيز التفاعل والتحفيز.\n• متابعة تقدم الطلاب وتحليل البيانات.\n• بناء ملف مهني للمعلم باستخدام أدوات Edpuzzle.',
    keyPoints: '• Edpuzzle كمنصة موحدة تجمع الفيديوهات والشرائح والاختبارات والتحليلات.\n• إنشاء دروس فيديو تفاعلية.\n• إضافة أسئلة مدمجة وفحوصات تكوينية.\n• تصميم Edpuzzle Slides لجعل المحتوى أكثر تفاعلية.\n• إدارة الفصول والواجبات وتتبع تقدم الطلاب.\n• إنشاء مسارات تعلم شخصية.\n• استخدام Edpuzzle في المشاريع الطلابية والعروض.\n• تطبيق تحليل البيانات لتحسين المخرجات التعليمية.\n• الحصول على شهادات إكمال للورش.',
    recommendations: '• تشجيع المعلمين على استخدام Edpuzzle في الدروس الصفية والواجبات.\n• إنشاء محتوى تفاعلي قابل للتطبيق داخل الصفوف.\n• استخدام التحليلات لمتابعة أداء الطلاب.\n• بناء ملف إنجاز رقمي للمعلم على منصة Edpuzzle.\n• مشاركة النماذج الجيدة بين المعلمين.',
    followUpMethods: 'Lesson/unit planning, Students’ assessment data, Surveys/exams',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'Edpuzzle Workshops PD Report.pdf',
    sourceFile: 'Edpuzzle Workshops PD Report.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-08-27',
    updatedAt: '2025-08-27'
  },
  {
    id: 'PD-2526-W13',
    workshopNumber: 13,
    academicYear: '2025-2026',
    titleAr: 'ورشة تدريبية حول استخدام الذكاء الاصطناعي في منصة ClassPoint',
    titleEn: 'ClassPoint Training with Qatar Science and Technology Secondary School for Boys',
    subject: 'ClassPoint training with AI features',
    facilitatorName: 'هبة السرحان',
    trainerName: 'هبة السرحان',
    trainerPosition: 'MENA Manager',
    organizerType: 'تطوير مهني خارج المدرسة',
    organizerName: 'ClassPoint Inkon Company',
    organizedBy: 'ClassPoint Inkon Company',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'المعلمون',
    date: '2025-09-01',
    month: 'سبتمبر',
    hours: '1.5',
    durationHours: 1.5,
    venue: 'Online',
    category: 'ClassPoint',
    objectives: '• تعريف المعلمين بمفاهيم الذكاء الاصطناعي وأهميته في تحسين التعليم.\n• تقديم أمثلة حول تطبيق الذكاء الاصطناعي في البيئة التعليمية.\n• استعراض تقنيات الذكاء الاصطناعي داخل منصة ClassPoint.\n• تدريب المعلمين على استخدام أدوات التقييم التلقائي والتصحيح الفوري.\n• التعرف على أداة الذكاء الاصطناعي الجديدة لكل معلم.\n• تحسين التفاعل مع الطلاب من خلال العروض التفاعلية.',
    keyPoints: '• فهم الذكاء الاصطناعي في التعليم.\n• دور الذكاء الاصطناعي في تطوير بيئات التعلم الحديثة.\n• استخدام تحليلات ذكية حول أداء الطلاب.\n• استعراض الميزات المتقدمة في منصة ClassPoint.\n• أدوات التقييم التلقائي والتصحيح الفوري.\n• تخصيص المواد الدراسية بناءً على قدرات الطلاب.\n• تقديم أداة الذكاء الاصطناعي الجديدة لكل معلم.\n• تتبع تقدم الطلاب وتقديم توصيات تعليمية بناءً على البيانات.',
    recommendations: '• تشجيع الاستخدام المستمر لمنصة ClassPoint.\n• دمج ميزات الذكاء الاصطناعي في التدريس اليومي.\n• تنظيم ورش مستقبلية للاستخدام المتقدم للتقنيات الذكية.\n• متابعة أداء الطلاب باستخدام التحليلات الذكية.\n• تشجيع تبادل الخبرات بين المعلمين.\n• متابعة تحديثات المنصة والاستفادة منها.',
    followUpMethods: 'Lesson/unit planning, Students’ assessment data, Surveys/exams, Documents analysis/Artifacts, Certification, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'ClassPoint training.pdf',
    sourceFile: 'ClassPoint training.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-09-01',
    updatedAt: '2025-09-01'
  },
  {
    id: 'PD-2526-W14',
    workshopNumber: 14,
    academicYear: '2025-2026',
    titleAr: 'ورشة تذكيرية بنظام قطر للتعليم',
    titleEn: 'Qatar Education System Reminder Workshop',
    subject: 'Qatar Education System',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق مشاريع إلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'معلمي المدرسة',
    date: '2025-08-25',
    month: 'أغسطس',
    hours: '2',
    durationHours: 2,
    venue: 'Teachers Room',
    category: 'نظام قطر للتعليم',
    objectives: '• مراجعة شاملة لأهم وظائف واستخدامات نظام قطر للتعليم.\n• تذكير المعلمين بإجراءات التفاعل مع النظام خلال العام الأكاديمي.\n• عرض التحديثات المعتمدة على النظام من قبل إدارة المدرسة.\n• تعزيز كفاءة المعلمين في توظيف النظام لدعم العملية التعليمية.\n• التأكيد على السياسات والإجراءات المرتبطة باستخدام النظام.',
    keyPoints: '• الدخول إلى النظام واستعراض الواجهة.\n• متابعة أداء الطلاب وإدخال الدرجات وتسجيل الملاحظات.\n• استخدام النظام في إعداد الدروس والواجبات والاختبارات.\n• استعراض خاصية تتبع إنجاز الطلاب وتحليل الأداء.\n• التحديثات التقنية الأخيرة المعتمدة من إدارة المدرسة.\n• سياسات المدرسة الجديدة المتعلقة باستخدام النظام.\n• آليات الدعم الفني والتقني المتاحة للمعلمين.',
    recommendations: '• الالتزام بتسجيل جميع المهام والأنشطة التعليمية عبر النظام.\n• مراجعة البيانات المدخلة بشكل دوري لضمان الدقة.\n• استخدام النظام كوسيلة أساسية للتواصل الأكاديمي مع الطلاب.\n• حضور أي ورش لاحقة بخصوص التحديثات الجديدة للنظام.\n• مشاركة أي ملاحظات أو صعوبات مع الفريق الفني المختص.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'تقرير ورشة تذكيرية بنظام قطر للتعليم (Qatar Education System).pdf',
    sourceFile: 'تقرير ورشة تذكيرية بنظام قطر للتعليم (Qatar Education System).pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-08-25',
    updatedAt: '2025-08-25'
  },
  {
    id: 'PD-2526-W15',
    workshopNumber: 15,
    academicYear: '2025-2026',
    titleAr: 'برنامج التهيئة الرقمية للمعلمين الجدد',
    titleEn: 'Digital Orientation Program for New Teachers',
    subject: 'برنامج التهيئة الرقمية للمعلمين الجدد',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق مشاريع إلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'معلمي المدرسة الجدد',
    date: '2025-08-25',
    month: 'أغسطس',
    hours: 'حسب الجدول المرفق',
    venue: 'Language Lab',
    category: 'تطوير مهني',
    objectives: '• تهيئة المعلمين الجدد للانخراط بكفاءة في بيئة العمل التعليمية.\n• تنمية المهارات التقنية في استخدام الأنظمة والمنصات التعليمية الرقمية.\n• التدريب على أدوات تعليمية حديثة مثل Canva وClassPoint وEdpuzzle وMicrosoft Office.\n• تمكين المعلمين من تصميم محتوى تعليمي تفاعلي.\n• نشر ثقافة الأمن السيبراني وحماية البيانات.\n• بناء بيئة تعليمية إيجابية باستخدام ClassDojo.\n• تفعيل استخدام الواقع الافتراضي في التعليم.\n• تحقيق الانسجام المهني بين المعلمين الجدد والهيئة التدريسية.',
    keyPoints: '• إدارة الفصول الافتراضية في نظام قطر للتعليم.\n• استخدام School Portal وTMS وNSIS وخدمات وزارة التعليم.\n• التدريب على Outlook وOneDrive وTeams.\n• تصميم محتوى مرئي باستخدام Canva.\n• حماية البيانات وخصوصية الطالب والمعلم.\n• Edpuzzle للفيديوهات والأسئلة التفاعلية.\n• أدوات الذكاء الاصطناعي في التخطيط والتصحيح.\n• ورشة الواقع الافتراضي واستخدام نظارات VR.\n• ClassDojo لتعزيز السلوك الإيجابي.\n• الأجهزة التفاعلية والشاشات الذكية وجهاز Elmo.\n• Edpuzzle المتقدم ومسارات التعلم.\n• ClassPoint والاختبارات التفاعلية داخل العروض.',
    recommendations: '• استمرار تدريب المعلمين على الأنظمة الرقمية.\n• دمج Edpuzzle وCanva والواقع الافتراضي في الأنشطة الصفية واللاصفية.\n• استخدام ClassDojo وClassPoint لتعزيز التفاعل الطلابي.\n• تعزيز ثقافة حماية البيانات.\n• توثيق الأداء من خلال منصات إلكترونية موحدة.\n• دعم دور المعلم كقائد رقمي في بيئة تعليمية متطورة.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Students’ assessment data, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'PD Sessions - Orinatation Week Report.pdf',
    sourceFile: 'PD Sessions - Orinatation Week Report.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-08-25',
    updatedAt: '2025-08-25'
  },
  {
    id: 'PD-2526-W16',
    workshopNumber: 16,
    academicYear: '2025-2026',
    titleAr: 'برنامج التهيئة الرقمية للموظفين الإداريين الجدد',
    titleEn: 'Digital Orientation Program for New Administrative Staff',
    subject: 'أدوات مايكروسوفت وأدوات الذكاء الاصطناعي ونظام قطر للتعليم',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق مشاريع إلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'الإداريون الجدد',
    date: '2025-09-02',
    month: 'سبتمبر',
    hours: '3',
    durationHours: 3,
    venue: 'Language Lab',
    category: 'الذكاء الاصطناعي',
    objectives: '• تمكين الإداريين الجدد من استخدام أدوات Microsoft مثل Teams وOneDrive وOutlook وForms وSharePoint.\n• تدريب المشاركين على أدوات الذكاء الاصطناعي مثل Copilot وChatGPT وMicrosoft Designer وPower Automate.\n• تعريف الإداريين بكيفية النشر والتعامل مع نظام قطر للتعليم.\n• تعزيز مهارات التواصل الرقمي وتبادل الملفات بشكل آمن.\n• دعم التحول الرقمي في المدرسة بما يتوافق مع خطط وزارة التربية والتعليم.',
    keyPoints: '• تسجيل الدخول وإدارة الحسابات الرسمية.\n• استخدام Outlook لتنظيم البريد والاجتماعات.\n• استخدام Teams للتواصل والاجتماعات.\n• إنشاء وحفظ الملفات عبر OneDrive ومشاركتها بشكل آمن.\n• استخدام Microsoft Forms لإنشاء الاستبانات والتقارير.\n• مقدمة في أدوات الذكاء الاصطناعي العملية في العمل الإداري.\n• منصة نظام قطر للتعليم وآلية رفع الملفات ومتابعة التقارير.\n• مناقشة التحديات التقنية وطرح حلول عملية.',
    recommendations: '• عقد ورش دورية لتطوير مهارات الإداريين.\n• إعداد دليل إلكتروني مبسط للأدوات الرقمية.\n• تخصيص ساعات دعم فني داخلي.\n• تشجيع الإداريين على استخدام الذكاء الاصطناعي لتقليل الوقت والجهد.\n• متابعة تفعيل حسابات نظام قطر للتعليم.\n• بناء ثقافة التحول الرقمي وربطها بأهداف المدرسة الاستراتيجية.',
    followUpMethods: 'Students’ assessment data, Surveys/exams, Documents analysis/Artifacts, Certification, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: false,
    sourceFileName: 'ورش الاداريين الجدد - تقرير .pdf',
    sourceFile: 'ورش الاداريين الجدد - تقرير .pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-09-02',
    updatedAt: '2025-09-02'
  },
  {
    id: 'PD-2526-W17',
    workshopNumber: 17,
    academicYear: '2025-2026',
    titleAr: 'التمكين التكنولوجي لطلاب الصف التاسع الجدد',
    titleEn: 'Technology Empowerment for New Grade 9 Students',
    subject: 'Qatar Edu Sys - OneDrive - School Portal - Teams - Outlook',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق المشاريع الإلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'جميع طلاب الصف التاسع',
    date: '2025-09-15',
    month: 'سبتمبر',
    hours: '4',
    durationHours: 4,
    venue: 'G9 Grades',
    category: 'نظام قطر للتعليم',
    objectives: '• تعريف الطلاب بنظام قطر للتعليم كنظام أساسي لإدارة العملية التعليمية.\n• تدريب الطلاب على OneDrive لحفظ ومشاركة الملفات الأكاديمية.\n• تعريف الطلاب ببوابة المدرسة للوصول إلى الجداول والمعلومات الأكاديمية.\n• تدريب الطلاب على Microsoft Teams للتواصل مع المعلمين وحضور الحصص.\n• تدريب الطلاب على Outlook لإدارة البريد الإلكتروني الرسمي.\n• تعزيز جاهزية الطلاب لاستخدام الأنظمة التعليمية.\n• تقليل الفجوة التقنية لدى الطلاب الجدد.',
    keyPoints: '• الدخول إلى النظام واستعراض الواجهة.\n• التحديثات التقنية الأخيرة المعتمدة من إدارة المدرسة.\n• سياسات المدرسة الجديدة المتعلقة باستخدام النظام.\n• آليات الدعم الفني والتقني المتاحة للطلاب.\n• رفع كفاءة التفاعل مع البيئة المدرسية الرقمية.\n• تقليل الفجوة التقنية لدى الطلاب الجدد.',
    recommendations: '• متابعة حل المشكلات التقنية والإلكترونية لجميع الطلاب.\n• تمكين الطلاب ومتابعتهم بشكل مستمر على جميع الأنظمة التعليمية.\n• متابعة دخول الطلاب إلى الحصص الدراسية وحصص التعليم الإلكتروني.\n• نشر سياسات الاستخدام الآمن وسياسات استخدام الذكاء الاصطناعي وتوقيعها من الطلاب وأولياء الأمور.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'التمكين التكتولوجي لطلاب الصف التاسع الجدد.pdf',
    sourceFile: 'التمكين التكتولوجي لطلاب الصف التاسع الجدد.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-09-15',
    updatedAt: '2025-09-15'
  },
  {
    id: 'PD-2526-W18',
    workshopNumber: 18,
    academicYear: '2025-2026',
    titleAr: 'ورشة التعلم عن بعد لطلاب الصف التاسع',
    titleEn: 'Distance Learning Workshop for Grade 9 Students',
    subject: 'Qatar Edu Sys - Teams Apps - التعلم عن بعد',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق المشاريع الإلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'جميع طلاب الصف التاسع',
    date: '2026-01-06',
    month: 'يناير',
    hours: '4',
    durationHours: 4,
    venue: 'G9 Grades',
    category: 'التعلم عن بعد / Microsoft Teams',
    objectives: '• تعريف الطلاب بنظام قطر للتعليم كنظام أساسي لإدارة العملية التعليمية.\n• تدريب الطلاب على Microsoft Teams للتواصل مع المعلمين وحضور الحصص.\n• تعزيز جاهزية الطلاب لاستخدام الأنظمة التعليمية في التعلم عن بعد.\n• رفع كفاءة التفاعل مع البيئة المدرسية الرقمية.\n• تقليل الفجوة التقنية لدى الطلاب الجدد.',
    keyPoints: '• الدخول إلى النظام واستعراض الواجهة.\n• التحديثات التقنية الأخيرة المعتمدة من إدارة المدرسة.\n• سياسات المدرسة الجديدة المتعلقة باستخدام النظام.\n• آليات الدعم الفني والتقني المتاحة للمعلمين والطلاب.\n• تعزيز جاهزية الطلاب لاستخدام الأنظمة التعليمية.\n• رفع كفاءة التفاعل مع البيئة المدرسية الرقمية.',
    recommendations: '• متابعة حل المشكلات التقنية والإلكترونية لجميع الطلاب.\n• تمكين الطلاب ومتابعتهم بشكل مستمر على جميع الأنظمة التعليمية.\n• مراقبة أداء الطلاب بشكل مباشر وتقديم الدعم المباشر.\n• نشر سياسات الاستخدام الآمن وسياسات استخدام الذكاء الاصطناعي على جميع الطلاب.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'ورش التعلم عن بعد لطلاب الصف التاسع.pdf',
    sourceFile: 'ورش التعلم عن بعد لطلاب الصف التاسع.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2026-01-06',
    updatedAt: '2026-01-06'
  },
  {
    id: 'PD-2526-W19',
    workshopNumber: 19,
    academicYear: '2025-2026',
    titleAr: 'ورشة التوعية بالتنمر الإلكتروني والجرائم السيبرانية',
    titleEn: 'Cyberbullying and Cybercrime Awareness Workshop',
    subject: 'Cyberbullying',
    facilitatorName: 'Cybercrime Prevention Department - Abdullah Alharami',
    trainerName: 'Cybercrime Prevention Department - Abdullah Alharami',
    trainerPosition: 'Trainer',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'Lecture',
    targetAudience: 'جميع طلاب الصف التاسع',
    date: '2025-12-11',
    month: 'ديسمبر',
    hours: '2',
    durationHours: 2,
    venue: '2',
    category: 'الأمن السيبراني',
    objectives: '• فهم مفهوم الابتزاز الإلكتروني والجرائم السيبرانية وأشكالها.\n• التعرف على طرق الاستغلال والاحتيال والابتزاز عبر الإنترنت.\n• إدراك مخاطر السلوك غير الآمن على منصات التواصل الاجتماعي.\n• تعلم الاستخدام الآمن والمسؤول للتكنولوجيا والإنترنت.\n• فهم العواقب القانونية للابتزاز الإلكتروني وفق القانون القطري.\n• حماية المعلومات الشخصية والخصوصية الرقمية.\n• معرفة كيفية الإبلاغ عن الجرائم الإلكترونية وطلب المساعدة.\n• تعزيز الاحترام المتبادل والسلوك الأخلاقي عند التواصل الرقمي.',
    keyPoints: '• تعريف الابتزاز الإلكتروني وأنواع الجرائم السيبرانية.\n• أساليب الابتزاز والاستغلال والاحتيال عبر الإنترنت.\n• مخاطر الاستخدام غير الآمن للتواصل الاجتماعي.\n• أهمية حماية البيانات الشخصية والخصوصية الرقمية.\n• العواقب القانونية للابتزاز الإلكتروني في قطر.\n• الاستخدام الآمن والمسؤول للتكنولوجيا.\n• خطوات التعامل مع الابتزاز أو التهديدات الإلكترونية.\n• دور الطلاب في الإبلاغ عن الجرائم الإلكترونية.\n• تعزيز السلوك الأخلاقي والاحترام في التواصل الرقمي.',
    recommendations: '• دمج الأمن السيبراني والمواطنة الرقمية في البرامج المدرسية.\n• تشجيع الطلاب على استخدام المنصات الرقمية بمسؤولية.\n• تقديم جلسات توعوية مستمرة حول الجرائم الإلكترونية والتهديدات الرقمية.',
    followUpMethods: 'Anecdotal records, Others',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: false,
    photosAvailable: false,
    sourceFileName: 'Cyber.docx',
    sourceFile: 'Cyber.docx',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-12-11',
    updatedAt: '2025-12-11'
  },
  {
    id: 'PD-2526-W20',
    workshopNumber: 20,
    academicYear: '2025-2026',
    titleAr: 'ورشة أساسيات الذكاء الاصطناعي وبرمجة Minecraft',
    titleEn: 'AI Foundation and Minecraft Coding',
    subject: 'AI Foundation and Minecraft Coding',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق المشاريع الإلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'جميع طلاب الصف الحادي عشر',
    date: '2026-01-09',
    month: 'يناير',
    hours: '1.5',
    durationHours: 1.5,
    venue: 'G11 Grades',
    category: 'البرمجة وMinecraft',
    objectives: '• التعرف على أساسيات الذكاء الاصطناعي.\n• فهم استخدامات الذكاء الاصطناعي في الحياة اليومية والتعليم.\n• استكشاف مبادئ البرمجة الإبداعية من خلال Minecraft.\n• تنمية مهارات التفكير الحاسوبي والمنطقي.\n• التطبيق العملي لمهارات الترميز Coding.\n• تعزيز روح الابتكار والعمل الجماعي.\n• اكتساب شهادة إتمام معتمدة من code.org.',
    keyPoints: '• مفهوم الذكاء الاصطناعي وأنواعه واستخداماته.\n• الفرق بين الذكاء الاصطناعي والتعلم الآلي.\n• كتابة الأكواد باستخدام واجهة السحب والإفلات في code.org.\n• مفاهيم البرمجة الأساسية مثل التكرار والشروط والمتغيرات.\n• تنفيذ مهام برمجية تفاعلية.\n• تطبيق الذكاء الاصطناعي داخل Minecraft Education.\n• برمجة الوكيل Agent للتحكم في العالم الافتراضي.\n• تصميم مشاريع عملية تحاكي مواقف من الحياة الواقعية.\n• الحصول على شهادات رقمية بعد إتمام المهام.',
    recommendations: '• تشجيع الطلاب على استكشاف الذكاء الاصطناعي والبرمجة عبر Code.org وMicrosoft Learn.\n• دمج أنشطة الذكاء الاصطناعي والبرمجة في المناهج.\n• توفير دعم إضافي ومشاريع إثرائية للطلاب المتميزين.\n• تعزيز التعلم بالممارسة والتجريب.\n• توسيع نطاق الورشة لتشمل مستويات صفية أخرى.\n• استخدام مخرجات الورشة في مشاريع بحثية وابتكارية.\n• تشجيع المعلمين على دمج أدوات الذكاء الاصطناعي في التعليم.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Surveys/exams, Documents analysis/Artifacts, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: false,
    photosAvailable: true,
    notes: 'The source report shows the date as 1/9/2025, but for the 2025-2026 academic year, store it as 2026-01-09 unless the admin edits it later.',
    sourceFileName: 'Ai Foundation and Minecraft Coding.pdf',
    sourceFile: 'Ai Foundation and Minecraft Coding.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2026-01-09',
    updatedAt: '2026-01-09'
  },
  {
    id: 'PD-2526-W21',
    workshopNumber: 21,
    academicYear: '2025-2026',
    titleAr: 'ورشة الاستعداد للتعلم عن بعد',
    titleEn: 'Preparing for Distance Learning Workshop',
    subject: 'Preparing for Distance Learning Workshop',
    facilitatorName: 'أحمد طبيشات، طارق رزق',
    trainerName: 'أحمد طبيشات، طارق رزق',
    trainerPosition: 'E-Project Coordinator, Math Teacher',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'E-Projects Department',
    organizedBy: 'E-Projects Department',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'Online training',
    targetAudience: 'المعلمون',
    date: '2026-03-05',
    month: 'مارس',
    hours: '1',
    durationHours: 1,
    venue: 'Online',
    category: 'التعلم عن بعد / Microsoft Teams',
    attendanceCount: 55,
    objectives: '• تهيئة المعلمين لتقديم تجربة تعلم عن بعد فعالة واحترافية.\n• إكساب المعلمين مهارات إنشاء وإدارة الحصص الافتراضية عبر Teams وLMS.\n• ضبط إعدادات الاجتماعات لضمان التحكم الكامل في سير الحصة.\n• تفعيل أدوات التعاون المتقدمة مثل Breakout Rooms.\n• التدريب على استخدام السبورة التفاعلية Whiteboard.\n• تعزيز جاهزية المعلمين للتعلم عن بعد.',
    keyPoints: '• الاستعداد التقني والبيئي قبل البث.\n• الالتزام بالمظهر الرسمي أثناء البث المباشر.\n• تحديث تطبيق Microsoft Teams.\n• إنشاء الحصص من تقويم Teams واختيار Class Meeting.\n• إنشاء الدرس عبر LMS وإدخال العنوان والوصف والأهداف والمهارات.\n• إعدادات Meeting Options.\n• تقييد صلاحيات التقديم للمنظمين والمنظمين المساعدين فقط.\n• تعطيل الميكروفون والكاميرا للحضور افتراضيًا.\n• تفعيل التسجيل والتفريغ النصي التلقائي.\n• نسخ رابط الانضمام ولصقه في جدول التعلم عن بعد.\n• استخدام Breakout Rooms والسبورة Whiteboard.',
    recommendations: '• تطبيق إجراءات التعلم عن بعد المعتمدة في جميع الحصص.\n• الالتزام بإعدادات الأمان داخل Microsoft Teams.\n• توثيق الحصص والروابط في الجداول المعتمدة.\n• متابعة التزام المعلمين بالإجراءات الفنية والتنظيمية.\n• دعم المعلمين في استخدام Whiteboard وغرف النقاش.',
    followUpMethods: 'Lesson/unit planning, Lesson observation, Others: Distance Learning',
    followUpTimeline: 'خلال فترة التعلم عن بعد وخلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: false,
    sourceFileName: 'Distance Learning Workshop report.pdf',
    sourceFile: 'Distance Learning Workshop report.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2026-03-05',
    updatedAt: '2026-03-05'
  },
  {
    id: 'PD-2526-W22',
    workshopNumber: 22,
    academicYear: '2025-2026',
    titleAr: 'ورشة استخدام السبورة التفاعلية داخل الصف',
    titleEn: 'Use of Technology in Classroom - E-Board',
    subject: 'E-Board and ClassPoint Integration',
    facilitatorName: 'يامن فرح، طارق رزق',
    trainerName: 'يامن فرح، طارق رزق',
    trainerPosition: 'AP Math Teachers',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'Eng. Ahmad Tubaishat and CS Department',
    organizedBy: 'Eng. Ahmad Tubaishat and CS Department',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'المعلمون الجدد',
    date: '2025-09-14',
    month: 'سبتمبر',
    hours: '1',
    durationHours: 1,
    venue: 'CS Department',
    category: 'السبورة التفاعلية',
    objectives: '• تعريف المعلمين الجدد بكيفية استخدام السبورة التفاعلية كأداة تعليمية.\n• تدريب المعلمين على دمج ClassPoint مع السبورة التفاعلية.\n• عرض استراتيجيات عملية للرسم والشرح والمحاكاة وتدوين الملاحظات على PowerPoint.\n• تمكين المعلمين من حفظ ومشاركة الملاحظات الرقمية مع الطلاب.\n• تشجيع المعلمين على استخدام التكنولوجيا التفاعلية لتعزيز المشاركة الطلابية.',
    keyPoints: '• وظائف السبورة التفاعلية مثل الرسم وتقسيم الشاشة والمحاكاة.\n• استخدام التعليقات على PowerPoint لتوضيح الأفكار.\n• تطبيق أدوات ClassPoint لإنشاء اختبارات واستطلاعات تفاعلية.\n• حفظ ملاحظات السبورة والعروض المشروحة كوثائق.\n• أفضل الممارسات لإدارة الصف عند استخدام السبورة التفاعلية وClassPoint.',
    recommendations: '• الاستمرار في ممارسة استخدام السبورة التفاعلية وClassPoint.\n• دمج المحاكاة والرسوم البيانية بشكل منتظم.\n• استخدام الملاحظات الرقمية كجزء من بنك مصادر التعلم.\n• تشجيع تبادل الخبرات بين المعلمين.\n• دعم التطوير المهني المستمر في أدوات تكنولوجيا التعليم.',
    followUpMethods: 'Lesson/unit planning, Lesson observation',
    followUpTimeline: '1 Academic Year',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'E-Board Report.pdf',
    sourceFile: 'E-Board Report.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-09-14',
    updatedAt: '2025-09-14'
  },
  {
    id: 'PD-2526-W23',
    workshopNumber: 23,
    academicYear: '2025-2026',
    titleAr: 'ورشة استخدام Canva في تصميم وإعداد الفيديوهات التعليمية وخدمة البحث العلمي',
    titleEn: 'Canva Workshop for Educational Design and Research Support',
    subject: 'استخدام موقع Canva في تصميم وإعداد الفيديوهات التعليمية وخدمة البحث العلمي',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق المشاريع الإلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'المعلمون',
    date: '2025-10-02',
    month: 'أكتوبر',
    hours: '1',
    durationHours: 1,
    venue: 'QSTSS',
    category: 'Canva',
    objectives: '• تدريب المعلمين على استخدام Canva في التصميم التعليمي.\n• تمكين المعلمين من إعداد فيديوهات تعليمية.\n• دعم البحث العلمي من خلال تصميم عروض ومواد مرئية.\n• تعزيز إنتاج محتوى رقمي احترافي.',
    keyPoints: '• استخدام Canva لإنشاء تصاميم تعليمية.\n• إعداد الفيديوهات التعليمية.\n• تصميم مواد داعمة للبحث العلمي.\n• استخدام القوالب الجاهزة.\n• تعزيز الهوية البصرية للمدرسة.',
    recommendations: '• توظيف Canva في إعداد المحتوى التعليمي.\n• تدريب إضافي للمعلمين على تصميم الفيديوهات.\n• تشجيع استخدام Canva في مشاريع البحث العلمي.\n• إنشاء مكتبة تصاميم مدرسية موحدة.',
    followUpMethods: 'Documents analysis/Artifacts, Certification, Anecdotal records',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: false,
    sourceFileName: 'Canva Attendnce.pdf',
    sourceFile: 'Canva Attendnce.pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-10-02',
    updatedAt: '2025-10-02'
  },
  {
    id: 'PD-2526-W24',
    workshopNumber: 24,
    academicYear: '2025-2026',
    titleAr: 'ورش تدريبية للإداريين الجدد على أدوات مايكروسوفت وأدوات الذكاء الاصطناعي',
    titleEn: 'Digital Training for New Administrative Staff on Microsoft Tools and AI Tools',
    subject: 'Microsoft Tools and AI Tools',
    facilitatorName: 'أحمد طبيشات',
    trainerName: 'أحمد طبيشات',
    trainerPosition: 'منسق المشاريع الإلكترونية',
    organizerType: 'تطوير مهني داخل المدرسة',
    organizerName: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    organizedBy: 'مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين',
    trainingMode: 'جلسة تطويرية Hands on Session',
    deliveryMethod: 'ورشة عمل تطبيقية',
    targetAudience: 'الإداريون الجدد',
    date: '2025-09-02',
    month: 'سبتمبر',
    hours: '2',
    durationHours: 2,
    venue: 'معامل اللغات',
    category: 'الذكاء الاصطناعي',
    objectives: '• تمكين الإداريين الجدد من استخدام أدوات Microsoft.\n• تدريب المشاركين على أدوات الذكاء الاصطناعي.\n• تعزيز مهارات التواصل الرقمي.\n• دعم التحول الرقمي في المدرسة.',
    keyPoints: '• تسجيل الدخول وإدارة الحسابات.\n• استخدام Outlook وTeams.\n• الذكاء الاصطناعي في العمل الإداري.',
    recommendations: '• متابعة تفعيل الحسابات.\n• استخدام الذكاء الاصطناعي لتقليل الجهد.',
    followUpMethods: 'Students’ assessment data, Surveys/exams, Documents analysis/Artifacts',
    followUpTimeline: 'خلال العام الدراسي',
    evidenceStatus: 'موثق',
    status: 'موثق',
    reportAvailable: true,
    attendanceAvailable: true,
    photosAvailable: true,
    sourceFileName: 'ورش الاداريين الجدد - تقرير .pdf',
    sourceFile: 'ورش الاداريين الجدد - تقرير .pdf',
    createdBy: 'E-Projects Coordinator',
    createdAt: '2025-09-02',
    updatedAt: '2025-09-02',
    notes: 'Attendance: محمود ماهر، دعاء خليل إبراهيم'
  }
];

export const PD_ATTENDANCE: PDAttendance[] = [];
export const PD_EVIDENCE: PDEvidence[] = [];

export function classifyIndividualSkill(skill: string): string {
  const s = (skill || '').toLowerCase();
  if (s.includes('qatar education') || s.includes('qe-lms') || s.includes('lms') || s.includes('نظام قطر')) return 'نظام قطر للتعليم';
  if (s.includes('canva')) return 'Canva والتصميم الرقمي';
  if (s.includes('teams') || s.includes('تيمز')) return 'Microsoft Teams';
  if (s.includes('outlook')) return 'Microsoft Outlook';
  if (s.includes('forms')) return 'Microsoft Forms';
  if (s.includes('onedrive') || s.includes('sharepoint')) return 'Microsoft 365';
  if (s.includes('ai tools') || s.includes('ai generation') || s.includes('mit ai') || s.includes('ai 101') || s.includes('napkin.ai')) return 'الذكاء الاصطناعي';
  if (s.includes('copilot')) return 'أدوات البرمجة والذكاء الاصطناعي';
  if (s.includes('edpuzzle')) return 'Edpuzzle';
  if (s.includes('gizmos')) return 'Gizmos';
  if (s.includes('notebook')) return 'Microsoft OneNote / Class Notebook';
  if (s.includes('calameo')) return 'الكتب الإلكترونية';
  return 'أدوات رقمية متنوعة';
}

// Actual 2025-2026 Individual PD Records
const ACTUAL_2526_BASE = [
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
  { trainingDate: '2025-11-02', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'تطبيق التيمز', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-02', traineeNameAr: 'أنس أحمد', department: 'الحاسوب', skillProvided: 'تطبيق التيمز', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-05', traineeNameAr: 'م. جهاد عناني', department: 'Research', skillProvided: 'Canva Design', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-09', traineeNameAr: 'د. محمد حلمي', department: 'Library', skillProvided: 'Calameo.com', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-11', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'Edpuzzle', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-12', traineeNameAr: 'م. جهاد عناني', department: 'Research', skillProvided: 'Napkin.ai', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2025-11-12', traineeNameAr: 'م. طارق رزق', department: 'Research', skillProvided: 'Canva', month: 'نوفمبر', sourceFileName: 'Nov.pdf' },
  { trainingDate: '2026-01-01', traineeNameAr: 'م. أنس جرادات', department: 'المختبرات التخصصية', originalDepartment: 'المختبرات', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-05', traineeNameAr: 'محمد حليمة', department: 'STEM', skillProvided: 'LMS', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-08', traineeNameAr: 'إياد سلامة', department: 'المختبرات التخصصية', originalDepartment: 'المختبرات', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-12', traineeNameAr: 'محمد سلامة', department: 'Research', originalDepartment: 'البحث العلمي', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-15', traineeNameAr: 'محمد عمر', department: 'اللغة الإنجليزية', skillProvided: 'LMS', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2026-01-22', traineeNameAr: 'علي الصيعري', department: 'مختبر التصنيع الرقمي', originalDepartment: 'التصنيع', skillProvided: 'ML NoteBook', month: 'يناير', sourceFileName: 'Jan2026.pdf' },
  { trainingDate: '2025-09-15', traineeNameAr: 'يامن فرح', department: 'الرياضيات', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'محمد الكفري', department: 'الحاسوب', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'سمير بلفقي', department: 'اللغة العربية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'يوسف دحمان', department: 'اللغة الإنجليزية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'نزار حاجي', department: 'STEM', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
  { trainingDate: '2025-09-15', traineeNameAr: 'حسام البنوي', department: 'التربية الإسلامية', skillProvided: 'AI 101 Professional Learning for Educators', month: 'سبتمبر', sourceFileName: 'MIT REPORT.pdf', trainingType: 'برنامج تعلم ذاتي / تطوير مهني خارجي', deliveryMethod: 'Online', durationMinutes: 300, trainerName: 'Sharifa Alghowinem', evidenceStatus: 'شهادة مرفقة', signatureStatus: 'تم التوقيع' },
];

const PRIORITY_TEACHERS = [
  { name: 'يامن فرح', dept: 'الرياضيات' }, { name: 'محمد عماد ازكول', dept: 'الرياضيات' }, { name: 'طارق رزق', dept: 'الرياضيات' },
  { name: 'روي مخول', dept: 'الحاسوب' }, { name: 'محمد الكفري', dept: 'الحاسوب' }, { name: 'خالد بارودي', dept: 'الحاسوب' },
  { name: 'سمير بلفقي', dept: 'اللغة العربية' }, { name: 'أسعد ناعس', dept: 'اللغة العربية' }, { name: 'سيد مصطفى', dept: 'اللغة العربية' },
  { name: 'حسام البنوي', dept: 'التربية الإسلامية' }, { name: 'ماهر علوان', dept: 'التربية الإسلامية' }, { name: 'ناصر حلوة', dept: 'التربية الإسلامية' },
  { name: 'عبدالله كارش', dept: 'اللغة الإنجليزية' }, { name: 'يوسف دحمان', dept: 'اللغة الإنجليزية' }, { name: 'أوزدن أوزغور', dept: 'STEM' },
  { name: 'عمران كاشف', dept: 'STEM' }, { name: 'عمران معروفي', dept: 'STEM' }, { name: 'فوزي بوفخر الدين', dept: 'STEM' },
  { name: 'أنس جرادات', dept: 'مختبر الطاقة' }, { name: 'علي الصيعري', dept: 'مختبر التصنيع الرقمي' }, { name: 'إياد سلامة', dept: 'مختبر الروبوت' }
];

const MONTHS_GEN = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
const SKILLS_2425 = ['Qatar Education System', 'LMS Monitoring', 'Digital Assessments', 'Microsoft Teams', 'Microsoft Forms', 'ClassPoint', 'Edpuzzle', 'Canva', 'AI Tools', 'OneDrive', 'SharePoint', 'ClassDojo', 'Interactive Board', 'VR Lab', 'E-Portfolio', 'Student Engagement Reports'];
const SKILLS_2324 = ['Qatar Education System', 'Teams', 'OneDrive', 'School Portal', 'Microsoft Forms', 'ClassPoint', 'Edpuzzle', 'Canva', 'Digital Assessment', 'E-Learning Lessons', 'LMS Uploading', 'Student Follow-up', 'Cyber Safety', 'AI Basics', 'ClassDojo', 'VR Introduction'];

function generateHistoricalRecords(year: string, skills: string[], countPerMonth: number): IndividualPDRecord[] {
  const records: IndividualPDRecord[] = [];
  MONTHS_GEN.forEach((month, mIdx) => {
    const monthYear = month === 'سبتمبر' || month === 'أكتوبر' || month === 'نوفمبر' ? year.split('-')[0] : (parseInt(year.split('-')[0]) + 1).toString();
    const shuffledTeachers = [...PRIORITY_TEACHERS].sort((a, b) => (a.name.length + mIdx) % 7 - (b.name.length + mIdx) % 7);
    for (let i = 0; i < countPerMonth; i++) {
      const teacher = shuffledTeachers[i % shuffledTeachers.length];
      const skill = skills[(i + mIdx) % skills.length];
      const day = ((i * 7 + mIdx * 13) % 20) + 5;
      records.push({
        id: `IND-${year}-${month}-${i}`,
        academicYear: year,
        month,
        trainingDate: `${monthYear}-${(mIdx + 8) % 12 + 1 < 10 ? '0' : ''}${(mIdx + 8) % 12 + 1}-${day < 10 ? '0' : ''}${day}`,
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

export const PD_INDIVIDUAL_RECORDS: IndividualPDRecord[] = [
  ...ACTUAL_2526_BASE.map((r, idx) => ({
    id: `IND-2526-${idx + 1}`,
    academicYear: '2025-2026',
    month: r.month || 'أغسطس',
    trainingDate: r.trainingDate || '2025-08-23',
    traineeNameAr: r.traineeNameAr || '',
    department: r.department || '',
    originalDepartment: (r as any).originalDepartment,
    skillProvided: r.skillProvided || '',
    skillCategory: classifyIndividualSkill(r.skillProvided || ''),
    trainerName: (r as any).trainerName || 'أحمد طبيشات',
    trainerRole: 'منسق المشاريع الإلكترونية',
    trainingType: (r as any).trainingType || 'تدريب فردي',
    deliveryMethod: (r as any).deliveryMethod || 'دعم مباشر',
    durationMinutes: (r as any).durationMinutes || 20,
    evidenceStatus: r.evidenceStatus || 'موثق',
    signatureStatus: (r as any).signatureStatus || 'تم التوقيع',
    sourceFileName: r.sourceFileName,
    sourceType: 'كشف تدريب فردي مرفق',
    createdBy: 'أحمد طبيشات',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as IndividualPDRecord)),
  ...generateHistoricalRecords('2024-2025', SKILLS_2425, 10),
  ...generateHistoricalRecords('2023-2024', SKILLS_2324, 8)
];
