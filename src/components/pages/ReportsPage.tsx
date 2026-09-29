'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  db, 
  MONTHS, 
  ACADEMIC_YEARS, 
  getPerformanceLevel, 
  getDeptName, 
  SCHOOL_NAME, 
  DESIGNER_CREDIT, 
  getUserDeptIds, 
  getUserDeptLabel, 
  getMonthlyDepartmentHonorees,
  EVALUATION_CRITERIA,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
  GRADE_LEVEL_LMS_STATS,
  SEPTEMBER_2026_LMS_METRICS,
} from '@/lib/data';
import type { User, Teacher, Evaluation, Department, ModelLessonEvaluation, ModelLessonScheduleItem } from '@/lib/data';
import { loadEventsMeetings, EventMeetingItem, EVENT_CATEGORY_CONFIG, EVENT_TYPE_CONFIG, EVENT_STATUS_CONFIG } from '@/lib/eventsMeetingsData';
import { loadOperationalPlan, OperationalPlanState, OperationalAction, OperationalObjective, printOfficialOperationalPlan } from '@/lib/operationalPlanData';
import { loadDistanceLearningRecords, DistanceLearningRecord, REASON_CONFIG, STATUS_CONFIG } from '@/lib/distanceLearningData';
import { printComprehensiveDistanceLearningReport } from '@/lib/distanceLearningReportPrinter';
import { loadSelfDevelopmentRecords, SelfDevelopmentRecord } from '@/lib/selfDevelopmentData';
import { printComprehensiveSelfDevelopmentReport } from '@/lib/selfDevelopmentReportPrinter';
import { printComprehensiveEventsMeetingsReport } from '@/lib/eventsMeetingsReportPrinter';
import { printComprehensiveLmsReport } from '@/lib/comprehensiveReportPrinter';
import { printClassSubjectMonthlyReport } from '@/lib/classSubjectReportPrinter';
import * as XLSX from 'xlsx';
import {
  Monitor, Layers, Award, BookOpen, Target, Sparkles, Zap, ShieldCheck, Cpu, Database, CheckCircle2, ListTodo, GraduationCap, Trophy, BarChart3, Settings, ClipboardList, ShieldAlert, Users, Calendar, Building, Laptop, MapPin, Clock, Printer, Download, FileSpreadsheet, Filter, Search, FileText, ChevronRight, AlertTriangle, ArrowUpDown, PieChart as PieChartIcon, ExternalLink
} from 'lucide-react';

interface Props { 
  currentUser: User; 
  selectedYear?: string; 
}

export type ReportCategory = 
  | 'all'
  | 'op_plan' 
  | 'model_lessons' 
  | 'qes' 
  | 'classes' 
  | 'pd' 
  | 'events_sms' 
  | 'executive';

export type ReportType = 
  // 1. Operational Plan (الخطة الإجرائية)
  | 'op_plan'
  // 2. Model Lessons & Observation (حصص التعليم الإلكتروني والمشاهدات)
  | 'modellessons_evaluated'
  | 'modellessons_scheduled'
  | 'distance_learning'
  // 3. LMS (نظام قطر للتعليم)
  | 'lms_monthly'
  | 'lms_annual'
  | 'lms_dept'
  | 'lms_support'
  | 'lms_progress'
  // 4. Classes & Subjects (الصفوف والشعب والمواد)
  | 'classes_subjects'
  | 'classes_sections'
  | 'classes_grades'
  | 'classes_intervention'
  // 5. Professional & Self Development (التطوير المهني والذاتي)
  | 'pd_workshops'
  | 'pd_individual'
  | 'pd_meee'
  | 'pd_self'
  // 6. Events, SMS & Honors (الفعاليات والتواصل والتكريم)
  | 'events_meetings'
  | 'elearning_sms'
  | 'takreem_honors'
  // 7. Executive (التقرير التنفيذي الشامل)
  | 'executive_all';

interface ReportMeta {
  id: ReportType;
  category: ReportCategory;
  label: string;
  icon: string;
  desc: string;
  badge?: string;
}

export const ALL_REPORTS: ReportMeta[] = [
  // 1. Operational Plan
  { 
    id: 'op_plan', 
    category: 'op_plan', 
    label: 'تقرير الخطة الإجرائية للتعليم الإلكتروني', 
    icon: '📌', 
    desc: 'الأهداف الاستراتيجية والإجراءات التنفيذية وحالة التنفيذ ومؤشرات التحقق',
    badge: 'خطة استراتيجية'
  },

  // 2. Model Lessons & Observation
  { 
    id: 'modellessons_evaluated', 
    category: 'model_lessons', 
    label: 'تقرير حصص التعليم الإلكتروني المقيمة', 
    icon: '💻', 
    desc: 'المشاهدات الصفية المنفذة وعمق توظيف التقنية SAMR وTPACK ومستويات التقييم',
    badge: 'مشاهدات صفية'
  },
  { 
    id: 'modellessons_scheduled', 
    category: 'model_lessons', 
    label: 'تقرير جدول حصص التعليم الإلكتروني المجدولة', 
    icon: '📅', 
    desc: 'الجدول الزمني للحصص المجدولة والمختبرات والقاعات والأدوات الرقمية المقترحة',
    badge: 'جدول معتمد'
  },
  { 
    id: 'distance_learning', 
    category: 'model_lessons', 
    label: 'تقرير حصص وسجلات التعلم عن بعد', 
    icon: '🌐', 
    desc: 'جلسات البث المباشر، متابعة الطلاب، الأعذار، ونسب الالتزام والحضور',
    badge: 'بث مباشر'
  },

  // 3. QES / LMS
  { 
    id: 'lms_monthly', 
    category: 'qes', 
    label: 'تقرير تقييم معلمي نظام قطر للتعليم (الشهري)', 
    icon: '📝', 
    desc: 'رصد المعايير الستة المعتمدة ونسب الإنجاز ونقاط القوة والتوصيات',
    badge: 'شهري رسمي'
  },
  { 
    id: 'lms_annual', 
    category: 'qes', 
    label: 'تقرير تقييم معلمي نظام قطر للتعليم (السنوي التراكمي)', 
    icon: '📆', 
    desc: 'المتوسط التراكمي السنوي وأعلى وأقل درجة ومستويات الأداء العام',
    badge: 'تراكمي سنوي'
  },
  { 
    id: 'lms_dept', 
    category: 'qes', 
    label: 'تقرير تقييم الأقسام الأكاديمية بنظام قطر للتعليم', 
    icon: '🏫', 
    desc: 'مقارنة أداء المعلمين لكل قسم أكاديمي على حدة ومتوسط القسم',
    badge: 'تحليل الأقسام'
  },
  { 
    id: 'lms_support', 
    category: 'qes', 
    label: 'تقرير المعلمين المستحقين للدعم والتدخل الأكاديمي', 
    icon: '⚠️', 
    desc: 'تحليل الفجوات ونقاط التطوير للمعلمين ذوي الأداء دون 80% مع التوصيات',
    badge: 'تدخل تحسيني'
  },
  { 
    id: 'lms_progress', 
    category: 'qes', 
    label: 'منحنى تطور أداء المعلم الفردي عبر الشهور', 
    icon: '📈', 
    desc: 'التطور الشهري التراكمي لمعلم محدد ورصد مسار النمو والتحسن',
    badge: 'منحنى نمو'
  },

  // 4. Classes & Subjects
  { 
    id: 'classes_subjects', 
    category: 'classes', 
    label: 'تقرير تحليل المواد الدراسية الـ 13 ونسب الإنجاز', 
    icon: '📚', 
    desc: 'معدلات حل التقييمات، التسليمات، المعلقات، والدروس الرقمية للمواد',
    badge: '13 مادة'
  },
  { 
    id: 'classes_sections', 
    category: 'classes', 
    label: 'تقرير تفاعل الشعب والفصول الدراسية وحل التقييمات', 
    icon: '🏢', 
    desc: 'ترتيب الشعب الدراسية حسب التفاعل والتسليمات والتصنيف العام',
    badge: 'الشعب الصفية'
  },
  { 
    id: 'classes_grades', 
    category: 'classes', 
    label: 'تقرير أداء المراحل والصفوف الدراسية (الصفوف 9 - 12)', 
    icon: '🎓', 
    desc: 'مقارنة إجماليات التقييمات والدروس ونسب الحل عبر المراحل الأكاديمية',
    badge: 'المراحل 9-12'
  },
  { 
    id: 'classes_intervention', 
    category: 'classes', 
    label: 'تقرير خطة التدخل الأكاديمي ودعم الطلاب', 
    icon: '🎯', 
    desc: 'مسارات الدعم، الطلاب المستهدفون، الإجراءات المتخذة، ونسب التحسن',
    badge: 'رعاية المتعلمين'
  },

  // 5. Professional & Self Development
  { 
    id: 'pd_workshops', 
    category: 'pd', 
    label: 'تقرير ورش وبرامج التطوير المهني الجماعية', 
    icon: '🎓', 
    desc: 'البرامج التدريبية المعتمدة وساعات التدريب والمستهدفون والمدرب',
    badge: 'ورش معتمدة'
  },
  { 
    id: 'pd_individual', 
    category: 'pd', 
    label: 'تقرير جلسات التدريب الفردي والتمكين الرقمي', 
    icon: '💡', 
    desc: 'جلسات الكوتشينغ والدعم التقني والتربوي الفردي لمعلمي المدرسة',
    badge: 'تدريب فردي'
  },
  { 
    id: 'pd_meee', 
    category: 'pd', 
    label: 'تقرير معلمي مايكروسوفت الخبراء (MEEE)', 
    icon: '🏅', 
    desc: 'المعلمون الحاصلون على الشهادة الدولية وسنة الترشح وملفات الإنجاز',
    badge: 'مايكروسوفت خبير'
  },
  { 
    id: 'pd_self', 
    category: 'pd', 
    label: 'تقرير شهادات ودورات التطوير الذاتي لمنسق المشاريع', 
    icon: '📜', 
    desc: 'الشهادات التخصصية والدورات وساعات التطوير المهني الذاتي المعتمدة',
    badge: 'تطوير ذاتي'
  },

  // 6. Events, SMS & Honors
  { 
    id: 'events_meetings', 
    category: 'events_sms', 
    label: 'تقرير سجل الفعاليات والاجتماعات الرسمية (16)', 
    icon: '📅', 
    desc: 'توثيق الفعاليات والاجتماعات المعتمدة بالمقر والنوع والمستهدفين والحالة',
    badge: '16 فعالية'
  },
  { 
    id: 'elearning_sms', 
    category: 'events_sms', 
    label: 'تقرير رسائل أولياء الأمور وحملات SMS المدرسية', 
    icon: '📱', 
    desc: 'الرسائل التوجيهية وتنبيهات الواجبات والتكريم ومعدل الوصول',
    badge: 'تواصل إلكتروني'
  },
  { 
    id: 'takreem_honors', 
    category: 'events_sms', 
    label: 'تقرير لوحة الشرف وتكريم معلمي الشهر المتميزين', 
    icon: '🏆', 
    desc: 'المكرمون شهرياً من كافة الأقسام الأكاديمية وأوسمة التميز المعتمدة',
    badge: 'لوحة الشرف'
  },

  // 7. Executive
  { 
    id: 'executive_all', 
    category: 'executive', 
    label: 'التقرير التنفيذي الشامل لمنظومة التعليم الإلكتروني', 
    icon: '🌐', 
    desc: 'لوحة قيادية جامعة تربط كافة منظومات وبيانات المدرسة في وثيقة رسمية موحدة',
    badge: 'تقرير موحد شامل'
  },
];

export const CATEGORY_TABS: { id: ReportCategory; label: string; icon: string }[] = [
  { id: 'all',           label: 'جميع التقارير (21)',            icon: '📋' },
  { id: 'op_plan',       label: 'الخطة الإجرائية',              icon: '📌' },
  { id: 'model_lessons', label: 'حصص التعليم الإلكتروني',        icon: '💻' },
  { id: 'qes',           label: 'نظام قطر للتعليم (LMS)',       icon: '📝' },
  { id: 'classes',       label: 'الشعب والمواد الدراسية',       icon: '🏫' },
  { id: 'pd',            label: 'التطوير المهني والذاتي',       icon: '🎓' },
  { id: 'events_sms',    label: 'الفعاليات والتواصل والتكريم',   icon: '📅' },
  { id: 'executive',     label: 'التقرير التنفيذي الشامل',       icon: '🌐' },
];

// Default Realistic Scheduled Lessons if none in storage
const DEFAULT_SCHEDULED_LESSONS: ModelLessonScheduleItem[] = [
  {
    id: 'mls-01',
    teacherId: 't-math-01',
    teacherNameAr: 'أحمد محمود',
    departmentId: 'd_math',
    departmentName: 'الرياضيات',
    subject: 'الرياضيات المتقدمة',
    academicYear: '2026-2027',
    date: '2026-10-04',
    dayName: 'الأحد',
    period: '2',
    classGrade: '10/1',
    lessonTopic: 'حل المعادلات المثلثية بالنمذجة الرقمية وبرمجية GeoGebra',
    toolsPlanned: 'GeoGebra, ClassPoint, MS Teams, E-Board',
    roomVenue: 'مختبر الرياضيات الرقمي (قاعة 102)',
    status: 'مجدولة',
    evaluatorName: 'م. أحمد طبيشات (منسق التعليم الإلكتروني)',
    createdAt: '2026-09-20',
    updatedAt: '2026-09-20',
  },
  {
    id: 'mls-02',
    teacherId: 't-sci-01',
    teacherNameAr: 'محمد حسن',
    departmentId: 'd_science',
    departmentName: 'العلوم العامة',
    subject: 'الفيزياء AP',
    academicYear: '2026-2027',
    date: '2026-10-06',
    dayName: 'الثلاثاء',
    period: '3',
    classGrade: '11/2',
    lessonTopic: 'محاكاة دوائر التيار المتردد عبر منصة PhET التفاعلية',
    toolsPlanned: 'PhET Simulations, OneNote Class Notebook, Forms',
    roomVenue: 'مختبر الفيزياء المتقدم (قاعة 204)',
    status: 'مجدولة',
    evaluatorName: 'م. أحمد طبيشات (منسق التعليم الإلكتروني)',
    createdAt: '2026-09-22',
    updatedAt: '2026-09-22',
  },
  {
    id: 'mls-03',
    teacherId: 't-cs-01',
    teacherNameAr: 'خالد عبدالله',
    departmentId: 'd_cs',
    departmentName: 'تكنولوجيا المعلومات والحاسوب',
    subject: 'علم الحاسوب والروبوت',
    academicYear: '2026-2027',
    date: '2026-09-24',
    dayName: 'الخميس',
    period: '4',
    classGrade: '9/1',
    lessonTopic: 'تطبيق خوارزميات البحث الذكية ودمج أدوات Copilot في البرمجة',
    toolsPlanned: 'Visual Studio Code, GitHub Copilot, Padlet, Kahoot',
    roomVenue: 'مختبر الذكاء الاصطناعي والروبوتيكس',
    status: 'تم التنفيذ',
    evaluatorName: 'م. أحمد طبيشات (منسق التعليم الإلكتروني)',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-24',
  },
  {
    id: 'mls-04',
    teacherId: 't-eng-01',
    teacherNameAr: 'طارق عبدالمجيد',
    departmentId: 'd_english',
    departmentName: 'اللغة الإنجليزية',
    subject: 'English AP Language',
    academicYear: '2026-2027',
    date: '2026-10-08',
    dayName: 'الخميس',
    period: '1',
    classGrade: '11/1',
    lessonTopic: 'Digital Rhetorical Analysis using Achieve 3000 & Canva',
    toolsPlanned: 'Achieve 3000, Canva Education, Nearpod, LMS Forums',
    roomVenue: 'قاعة اللغات التفاعلية',
    status: 'مجدولة',
    evaluatorName: 'د. راني التوم وم. أحمد طبيشات',
    createdAt: '2026-09-25',
    updatedAt: '2026-09-25',
  },
  {
    id: 'mls-05',
    teacherId: 't-ar-01',
    teacherNameAr: 'يوسف إبراهيم',
    departmentId: 'd_arabic',
    departmentName: 'اللغة العربية',
    subject: 'اللغة العربية والبلاغة',
    academicYear: '2026-2027',
    date: '2026-09-21',
    dayName: 'الإثنين',
    period: '5',
    classGrade: '10/3',
    lessonTopic: 'توظيف تقنيات السرد الرقمي والخرائط الذهنية التفاعلية في دراسة الشعر',
    toolsPlanned: 'MindMeister, Edpuzzle, LMS Forum, Mentimeter',
    roomVenue: 'الصف 10/3',
    status: 'تم التنفيذ',
    evaluatorName: 'م. أحمد طبيشات',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-21',
  },
  {
    id: 'mls-06',
    teacherId: 't-is-01',
    teacherNameAr: 'عمر مصطفى',
    departmentId: 'd_islamic',
    departmentName: 'التربية الإسلامية',
    subject: 'التربية الإسلامية',
    academicYear: '2026-2027',
    date: '2026-10-11',
    dayName: 'الأحد',
    period: '3',
    classGrade: '9/2',
    lessonTopic: 'تصميم جولات افتراضية تفاعلية حول أحكام فقه المعاملات المالية الحديثة',
    toolsPlanned: 'ThingLink, Wordwall, MS Forms, Interactive Board',
    roomVenue: 'الصف 9/2',
    status: 'مجدولة',
    evaluatorName: 'م. أحمد طبيشات',
    createdAt: '2026-09-27',
    updatedAt: '2026-09-27',
  }
];

// Default Evaluated Lessons if empty
const DEFAULT_EVALUATED_LESSONS: any[] = [
  {
    id: 'mle-01',
    teacherId: 't-math-01',
    teacherNameAr: 'أحمد محمود',
    departmentId: 'd_math',
    departmentName: 'الرياضيات',
    academicYear: '2026-2027',
    date: '2026-09-21',
    period: '2',
    classGrade: '10/1',
    subject: 'الرياضيات المتقدمة',
    lessonTopic: 'حل المعادلات المثلثية بالنمذجة الرقمية',
    toolsUsed: 'GeoGebra, ClassPoint, MS Teams, E-Board',
    samrLevel: 'Modification (تعديل)',
    scoreTechDepth: 9.8,
    scoreTeacherTools: 10,
    scoreClassroomMgmt: 9.5,
    scoreLmsClarity: 9.7,
    scoreStudentEngagement: 9.6,
    scoreAssessmentFeedback: 9.8,
    overallScore: 9.7,
    strengths: 'توظيف استثنائي لبرمجية GeoGebra في التمثيل الهندسي التفاعلي، وإدارة نموذجية للصف رقمياً.',
    improvements: 'إتاحة وقت إضافي للطلاب لعرض حلولهم التفاعلية ومشاركتها مع الزملاء.',
    recommendations: 'تنظيم ورشة تطبيقية لنقل تجربة توظيف النمذجة الرياضية لمعلمي القسم.',
    evaluatorName: 'م. أحمد طبيشات (منسق التعليم الإلكتروني)',
  },
  {
    id: 'mle-02',
    teacherId: 't-sci-01',
    teacherNameAr: 'محمد حسن',
    departmentId: 'd_science',
    departmentName: 'العلوم العامة',
    academicYear: '2026-2027',
    date: '2026-09-24',
    period: '3',
    classGrade: '11/2',
    subject: 'الفيزياء AP',
    lessonTopic: 'محاكاة الدوائر الكهرومغناطيسية وتطبيقاتها',
    toolsUsed: 'PhET Simulations, OneNote Class Notebook, Forms',
    samrLevel: 'Redefinition (إعادة تعريف)',
    scoreTechDepth: 9.9,
    scoreTeacherTools: 9.8,
    scoreClassroomMgmt: 9.6,
    scoreLmsClarity: 9.8,
    scoreStudentEngagement: 9.8,
    scoreAssessmentFeedback: 9.7,
    overallScore: 9.8,
    strengths: 'بيئة استكشافية رقمية متميزة عبر محاكاة PhET، وتفاعل ملموس وتطبيق عملي عالي المستوى.',
    improvements: 'تنويع مستويات الأسئلة الرقمية في التقييم التكويني الختامي.',
    recommendations: 'توثيق الحصة كنموذج ممارسات فضلى على مستوى المدرسة.',
    evaluatorName: 'د. راني التوم وم. أحمد طبيشات',
  },
  {
    id: 'mle-03',
    teacherId: 't-cs-01',
    teacherNameAr: 'خالد عبدالله',
    departmentId: 'd_cs',
    departmentName: 'تكنولوجيا المعلومات والحاسوب',
    academicYear: '2026-2027',
    date: '2026-09-17',
    period: '4',
    classGrade: '9/1',
    subject: 'علم الحاسوب والروبوت',
    lessonTopic: 'خوارزميات الذكاء الاصطناعي ومعالجة البيانات',
    toolsUsed: 'VS Code, GitHub Copilot, Padlet, Kahoot',
    samrLevel: 'Redefinition (إعادة تعريف)',
    scoreTechDepth: 10,
    scoreTeacherTools: 10,
    scoreClassroomMgmt: 9.8,
    scoreLmsClarity: 9.9,
    scoreStudentEngagement: 9.9,
    scoreAssessmentFeedback: 9.9,
    overallScore: 9.9,
    strengths: 'دمج تقنيات الذكاء الاصطناعي التوليدي بكفاءة عالية، ومشاركة جماعية ملهمة للطلبة.',
    improvements: 'تعزيز آليات المتابعة الفردية للطلاب في تنفيذ الأكواد المتقدمة.',
    recommendations: 'إشراك الطلاب المتميزين في تحكيم ومراجعة المشاريع البرمجية لزملائهم.',
    evaluatorName: 'م. أحمد طبيشات (منسق المشاريع)',
  },
  {
    id: 'mle-04',
    teacherId: 't-eng-01',
    teacherNameAr: 'طارق عبدالمجيد',
    departmentId: 'd_english',
    departmentName: 'اللغة الإنجليزية',
    academicYear: '2026-2027',
    date: '2026-09-15',
    period: '1',
    classGrade: '11/1',
    subject: 'English AP Language',
    lessonTopic: 'Academic Essay Synthesis using Achieve 3000',
    toolsUsed: 'Achieve 3000, Canva Education, Teams Notebook',
    samrLevel: 'Modification (تعديل)',
    scoreTechDepth: 9.4,
    scoreTeacherTools: 9.5,
    scoreClassroomMgmt: 9.3,
    scoreLmsClarity: 9.4,
    scoreStudentEngagement: 9.2,
    scoreAssessmentFeedback: 9.4,
    overallScore: 9.4,
    strengths: 'تكامل رائع بين القراءة الرقمية ومنصة Canva لإنتاج الملخصات المرئية للطلاب.',
    improvements: 'زيادة مساحة الأنشطة الحوارية الشفهية الموازية للنشاط الكتابي.',
    recommendations: 'مشاركة ملفات الإنجاز الرقمية للطلاب مع أولياء الأمور عبر المنصة.',
    evaluatorName: 'م. أحمد طبيشات',
  },
  {
    id: 'mle-05',
    teacherId: 't-ar-01',
    teacherNameAr: 'يوسف إبراهيم',
    departmentId: 'd_arabic',
    departmentName: 'اللغة العربية',
    academicYear: '2026-2027',
    date: '2026-09-12',
    period: '5',
    classGrade: '10/3',
    subject: 'اللغة العربية والبلاغة',
    lessonTopic: 'الخرائط المفاهيمية الرقمية وتحليل النصوص البلاغية',
    toolsUsed: 'MindMeister, Edpuzzle, LMS Forum',
    samrLevel: 'Augmentation (زيادة)',
    scoreTechDepth: 9.1,
    scoreTeacherTools: 9.2,
    scoreClassroomMgmt: 9.0,
    scoreLmsClarity: 9.3,
    scoreStudentEngagement: 9.1,
    scoreAssessmentFeedback: 9.0,
    overallScore: 9.1,
    strengths: 'توظيف فاعل للخرائط الذهنية وتفاعل إيجابي في تحليل الصور البلاغية.',
    improvements: 'تعميق التقييم الذاتي من قبل الطلاب لإنتاجهم اللغوي.',
    recommendations: 'تبادل الزيارات مع الزملاء بالقسم لمشاهدة استراتيجية توظيف MindMeister.',
    evaluatorName: 'د. راني التوم',
  }
];

// Pure SVG Bar Chart (print-safe)
function SvgBarChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return null;
  const svgW = 740, svgH = 210;
  const padL = 40, padR = 16, padT = 20, padB = 48;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const maxVal = Math.max(...data.map(d => d.value), 100);
  const barW = Math.min((chartW / data.length) * 0.55, 36);
  const groupW = chartW / data.length;
  const ticks = 5;

  const getBarColor = (v: number) =>
    v >= 90 ? '#10B981' : v >= 80 ? '#0369A1' : v >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}
      style={{ overflow: 'visible', display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const val = Math.round((maxVal / ticks) * i);
        const y = padT + chartH - (i / ticks) * chartH;
        return (
          <g key={i}>
            <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
            <text x={padL - 5} y={y + 4} textAnchor="end" fontSize={8} fill="#94A3B8" fontWeight={700}>{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bH = (d.value / maxVal) * chartH;
        const cx = padL + i * groupW + groupW / 2;
        const bc = getBarColor(d.value);
        const shortName = d.name.length > 12 ? d.name.substring(0, 11) + '…' : d.name;
        return (
          <g key={i}>
            <rect x={cx - barW / 2} y={padT + chartH - bH} width={barW} height={bH} fill={bc} rx={4} />
            {d.value > 0 && (
              <text x={cx} y={padT + chartH - bH - 5} textAnchor="middle" fontSize={8.5} fill={bc} fontWeight={900}>
                {d.value}%
              </text>
            )}
            <text x={cx} y={padT + chartH + 15} textAnchor="middle" fontSize={8} fill="#64748B" fontWeight={700}>
              {shortName}
            </text>
          </g>
        );
      })}
      <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} stroke="#CBD5E1" />
      <line x1={padL} x2={padL + chartW} y1={padT + chartH} y2={padT + chartH} stroke="#CBD5E1" />
    </svg>
  );
}

// Pure SVG Line Chart (print-safe)
function SvgLineChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return null;
  const svgW = 740, svgH = 210;
  const padL = 40, padR = 16, padT = 20, padB = 48;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const ticks = 5;

  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padT + chartH - (d.value / 100) * chartH,
    v: d.value,
    n: d.name
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = pts.length > 0
    ? `M ${pts[0].x} ${padT + chartH} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x} ${padT + chartH} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}
      style={{ overflow: 'visible', display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGradReports" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const val = Math.round((100 / ticks) * i);
        const y = padT + chartH - (i / ticks) * chartH;
        return (
          <g key={i}>
            <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
            <text x={padL - 5} y={y + 4} textAnchor="end" fontSize={8} fill="#94A3B8" fontWeight={700}>{val}</text>
          </g>
        );
      })}
      {areaPath && <path d={areaPath} fill="url(#lineGradReports)" />}
      {pts.length > 1 && <polyline points={polyline} fill="none" stroke="#0284C7" strokeWidth={2.5} />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill="#0F2044" stroke="#38BDF8" strokeWidth={1.5} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={8.5} fill="#0F2044" fontWeight={900}>{p.v}%</text>
          <text x={p.x} y={padT + chartH + 15} textAnchor="middle" fontSize={8} fill="#64748B" fontWeight={700}>
            {p.n.split(' ')[0]}
          </text>
        </g>
      ))}
      <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} stroke="#CBD5E1" />
      <line x1={padL} x2={padL + chartW} y1={padT + chartH} y2={padT + chartH} stroke="#CBD5E1" />
    </svg>
  );
}

// Official Centered Report Header (Ministry & School Centered)
function OfficialReportHeader({ 
  title, 
  subtitle, 
  academicYear, 
  month,
  reportCode 
}: { 
  title: string; 
  subtitle: string; 
  academicYear: string; 
  month?: string;
  reportCode?: string;
}) {
  return (
    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
      {/* Logos and Centered Titles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <img
          src="/ministry-logo.png"
          alt="وزارة التربية والتعليم والتعليم العالي"
          style={{ height: '80px', maxWidth: '180px', objectFit: 'contain' }}
        />
        <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', letterSpacing: '0.2px' }}>
            دولة قطر — وزارة التربية والتعليم والتعليم العالي
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284C7', marginTop: '0.2rem' }}>
            مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginTop: '0.15rem' }}>
            قسم المشاريع والتعليم الإلكتروني والحلول الرقمية | مركز التقارير الرسمية المعتمد
          </div>
        </div>
        <img
          src="/school-logo.png"
          alt="شعار المدرسة"
          style={{ height: '80px', maxWidth: '180px', objectFit: 'contain' }}
        />
      </div>

      {/* Center Navy Gradient Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2044 0%, #1e3a6b 100%)',
        borderRadius: '10px',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        color: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(15,32,68,0.15)',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
        flexWrap: 'wrap',
      }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, whiteSpace: 'nowrap' }}>
          {title}
        </h1>
        <span style={{ color: '#38BDF8', fontSize: '1.1rem' }}>|</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {subtitle}
        </span>
        <span style={{ color: '#38BDF8', fontSize: '1.1rem' }}>|</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
          العام الأكاديمي: {academicYear} {month ? `— ${month}` : ''}
        </span>
        {reportCode && (
          <span style={{ fontSize: '0.74rem', fontWeight: 700, background: 'rgba(56,189,248,0.2)', color: '#BAE6FD', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
            كود الوثيقة: {reportCode}
          </span>
        )}
      </div>
    </div>
  );
}

// KPI Cards Row
function KpiCards({ cards }: { cards: { label: string; value: string | number; color: string; sub?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`, gap: '0.75rem', marginBottom: '1.75rem' }}>
      {cards.map(({ label, value, color, sub }, i) => (
        <div key={i} style={{
          border: '1px solid #E2E8F0', borderTop: `4px solid ${color}`,
          borderRadius: '10px', padding: '0.9rem', textAlign: 'center',
          printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', background: '#fff'
        }}>
          <p style={{ fontSize: '0.68rem', color: '#64748B', margin: 0, fontWeight: 800 }}>{label}</p>
          <p style={{ fontSize: '1.45rem', fontWeight: 900, color, margin: '0.25rem 0 0', lineHeight: 1.1 }}>{value}</p>
          {sub && <p style={{ fontSize: '0.62rem', color: '#94A3B8', margin: '0.25rem 0 0', fontWeight: 600 }}>{sub}</p>}
        </div>
      ))}
    </div>
  );
}

// Performance Badge
function PerfBadge({ perf }: { perf: { label: string; color: string; bg: string } }) {
  return (
    <span style={{
      background: perf.bg, color: perf.color,
      padding: '0.2rem 0.6rem', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: 800, display: 'inline-block',
      printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
      whiteSpace: 'nowrap'
    }}>
      {perf.label}
    </span>
  );
}

// Progress Bar
function ProgressBar({ value }: { value: number }) {
  const color = value >= 90 ? '#10B981' : value >= 80 ? '#0369A1' : value >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', minWidth: '80px' }}>
      <div style={{ flex: 1, height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: '4px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color, width: '38px', textAlign: 'left' }}>{value}%</span>
    </div>
  );
}

// Official Signatures Footer (Centered & Verified)
function OfficialSignaturesFooter() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2.5rem',
      paddingTop: '1.25rem',
      borderTop: '2px solid #CBD5E1',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
    }}>
      <div style={{ textAlign: 'center', width: '220px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#0F2044' }}>
          منسق المشاريع والتعليم الإلكتروني
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 4px', color: '#1E293B' }}>
          م. أحمد عادل طبيشات
        </p>
        <img
          src="/signature-ahmad.png"
          alt="توقيع م. أحمد طبيشات"
          style={{ height: '38px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
        />
      </div>

      <div style={{ textAlign: 'center', width: '220px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#0F2044' }}>
          النائب الأكاديمي
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 4px', color: '#1E293B' }}>
          د. راني التوم
        </p>
        <img
          src="/signature-rani.png"
          alt="توقيع د. راني التوم"
          style={{ height: '38px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
        />
      </div>

      <div style={{ textAlign: 'center', width: '220px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#0F2044' }}>
          مدير المدرسة
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 4px', color: '#1E293B' }}>
          محمد علي مندني العمادي
        </p>
        <img
          src="/principal-signature.png"
          alt="توقيع مدير المدرسة"
          style={{ height: '38px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
        />
      </div>
    </div>
  );
}

// Table Wrapper
function ReportTable({ headers, rows, emptyMsg }: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMsg: string;
}) {
  return (
    <div style={{ overflowX: 'auto', width: '100%', marginBottom: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '0.75rem 0.8rem', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid #1e3a5f' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>{emptyMsg}</td>
            </tr>
          ) : rows.map((cells, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
              {cells.map((cell, j) => (
                <td key={j} style={{ padding: '0.65rem 0.8rem', border: '1px solid #E2E8F0', textAlign: 'center', verticalAlign: 'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main Component
export default function ReportsPage({ currentUser, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [individualPDRecords, setIndividualPDRecords] = useState<any[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<any[]>([]);
  const [modelLessonSchedules, setModelLessonSchedules] = useState<ModelLessonScheduleItem[]>([]);
  const [opPlan, setOpPlan] = useState<OperationalPlanState | null>(null);
  const [eventsItems, setEventsItems] = useState<EventMeetingItem[]>([]);
  const [distanceRecords, setDistanceRecords] = useState<DistanceLearningRecord[]>([]);
  const [selfDevRecords, setSelfDevRecords] = useState<SelfDevelopmentRecord[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<any[]>([]);
  const [elearningSmsRecords, setElearningSmsRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<ReportCategory>('all');
  const [reportType, setReportType] = useState<ReportType>('op_plan');
  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState('سبتمبر');
  const [selDept, setSelDept] = useState('');
  const [selTeacherId, setSelTeacherId] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);
  const coordLabel = getUserDeptLabel(currentUser, departments);
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  useEffect(() => { if (propYear) setSelYear(propYear); }, [propYear]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getDailyTasks().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getWorkshops().catch(() => []),
      db.getIndividualPDRecords().catch(() => []),
      db.getModelLessonEvaluations().catch(() => []),
      db.getModelLessonSchedules().catch(() => []),
      db.getMeeeRecords().catch(() => []),
      db.getElearningSms().catch(() => []),
      loadOperationalPlan(selYear).catch(() => null),
    ]).then(([t, e, d, dt, ach, w, ipd, mle, mls, meee, sms, op]) => {
      if (!isMounted) return;
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setDailyTasks(dt);
      setAchievements(ach);
      setWorkshops(w);
      setIndividualPDRecords(ipd);
      setModelLessonEvals(mle && mle.length > 0 ? mle : DEFAULT_EVALUATED_LESSONS);
      setModelLessonSchedules(mls && mls.length > 0 ? mls : DEFAULT_SCHEDULED_LESSONS);
      setMeeeRecords(meee);
      setElearningSmsRecords(sms);
      if (op) setOpPlan(op);
      setEventsItems(loadEventsMeetings());
      setDistanceRecords(loadDistanceLearningRecords(selYear));
      setSelfDevRecords(loadSelfDevelopmentRecords());
      setLoading(false);
      if (t.length > 0) setSelTeacherId(t[0].id);
    });

    return () => { isMounted = false; };
  }, [selYear]);

  const filteredTeachersList = useMemo(() => {
    if (isCoord && coordDepts.length > 0) return teachers.filter(t => coordDepts.includes(t.departmentId));
    return teachers;
  }, [teachers, isCoord, coordDepts]);

  // When active category changes, set reportType to first report in that category
  function handleSelectCategory(cat: ReportCategory) {
    setActiveCategory(cat);
    if (cat === 'all') return;
    const firstRep = ALL_REPORTS.find(r => r.category === cat);
    if (firstRep) {
      setReportType(firstRep.id);
    }
  }

  // Reports visible under the selected category & search
  const availableReports = useMemo(() => {
    return ALL_REPORTS.filter(r => {
      const matchCat = activeCategory === 'all' || r.category === activeCategory;
      const matchSearch = !searchFilter.trim() || 
        r.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
        r.desc.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchFilter]);

  // Compute QES Data
  const qesReportData = useMemo(() => {
    if (loading) return [];
    let yearEvals = evaluations.filter(e => e.academicYear === selYear);
    if (isCoord && coordDepts.length > 0) {
      const scopedIds = new Set(teachers.filter(t => coordDepts.includes(t.departmentId)).map(t => t.id));
      yearEvals = yearEvals.filter(e => scopedIds.has(e.teacherId));
    }

    switch (reportType) {
      case 'lms_monthly': {
        let evs = yearEvals.filter(e => e.month === selMonth);
        if (selDept) evs = evs.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === selDept);
        return evs.map(ev => {
          const t = teachers.find(x => x.id === ev.teacherId);
          const dept = t ? getDeptName(t.departmentId, departments) : '-';
          const perf = getPerformanceLevel(ev.totalScore);
          return { ev, t, dept, perf };
        }).sort((a, b) => b.ev.totalScore - a.ev.totalScore);
      }
      case 'lms_annual': {
        const teacherMap = new Map<string, Evaluation[]>();
        yearEvals.forEach(e => {
          if (!teacherMap.has(e.teacherId)) teacherMap.set(e.teacherId, []);
          teacherMap.get(e.teacherId)!.push(e);
        });
        const list = filteredTeachersList.map(t => {
          const evs = teacherMap.get(t.id) || [];
          if (evs.length === 0) return null;
          const scores = evs.map(e => e.totalScore);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
          return { teacherId: t.id, t, dept: getDeptName(t.departmentId, departments), count: evs.length, averageScore: avg, highestScore: Math.max(...scores), lowestScore: Math.min(...scores), perf: getPerformanceLevel(avg) };
        }).filter(Boolean) as any[];
        if (selDept) return list.filter(r => r.t.departmentId === selDept).sort((a: any, b: any) => b.averageScore - a.averageScore);
        return list.sort((a: any, b: any) => b.averageScore - a.averageScore);
      }
      case 'lms_dept': {
        const targetDept = selDept || (availableDepts[0]?.id || '');
        const teacherMap = new Map<string, Evaluation[]>();
        yearEvals.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === targetDept)
          .forEach(e => { if (!teacherMap.has(e.teacherId)) teacherMap.set(e.teacherId, []); teacherMap.get(e.teacherId)!.push(e); });
        return filteredTeachersList.filter(t => t.departmentId === targetDept).map(t => {
          const tEvs = teacherMap.get(t.id) || [];
          const scores = tEvs.map(e => e.totalScore);
          const avg = tEvs.length ? Math.round(scores.reduce((a, b) => a + b, 0) / tEvs.length * 10) / 10 : 0;
          return { t, dept: getDeptName(t.departmentId, departments), count: tEvs.length, averageScore: avg, highestScore: tEvs.length ? Math.max(...scores) : 0, lowestScore: tEvs.length ? Math.min(...scores) : 0, perf: getPerformanceLevel(avg) };
        }).filter(r => r.count > 0).sort((a, b) => b.averageScore - a.averageScore);
      }
      case 'lms_support': {
        const teacherMap = new Map<string, Evaluation[]>();
        yearEvals.forEach(e => { if (!teacherMap.has(e.teacherId)) teacherMap.set(e.teacherId, []); teacherMap.get(e.teacherId)!.push(e); });
        const list = filteredTeachersList.map(t => {
          const evs = teacherMap.get(t.id) || [];
          if (evs.length === 0) return null;
          const scores = evs.map(e => e.totalScore);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
          if (avg >= 80) return null;
          const criteriaTotals = Array(EVALUATION_CRITERIA.length).fill(0);
          evs.forEach(ev => ev.criteria?.forEach((c: any, idx: number) => { 
            if (idx < EVALUATION_CRITERIA.length) {
              criteriaTotals[idx] += c.score || 0; 
            }
          }));
          const criteriaAvgs = criteriaTotals.map(total => total / evs.length);
          let weakestIdx = 0, minVal = 20;
          criteriaAvgs.forEach((v, idx) => { if (v < minVal) { minVal = v; weakestIdx = idx; } });
          return {
            t, dept: getDeptName(t.departmentId, departments), count: evs.length, averageScore: avg,
            weakestIdx, weakestLabel: EVALUATION_CRITERIA[weakestIdx], weakestScore: Math.round(minVal * 10) / 10,
            strengths: evs.map(e => e.strengths).filter(Boolean).slice(0, 2).join(' | ') || '-',
            recs: evs.map(e => e.recommendations).filter(Boolean).slice(0, 2).join(' | ') || '-',
            perf: getPerformanceLevel(avg)
          };
        }).filter(Boolean) as any[];
        if (selDept) return list.filter(r => r.t.departmentId === selDept).sort((a: any, b: any) => b.averageScore - a.averageScore);
        return list.sort((a: any, b: any) => b.averageScore - a.averageScore);
      }
      case 'lms_progress': {
        const targetId = selTeacherId || (filteredTeachersList[0]?.id || '');
        if (!targetId) return [];
        const tEvs = yearEvals.filter(e => e.teacherId === targetId);
        const t = teachers.find(x => x.id === targetId);
        return MONTHS.map(m => {
          const ev = tEvs.find(e => e.month === m);
          if (!ev) return null;
          return { ev, t, dept: t ? getDeptName(t.departmentId, departments) : '-', perf: getPerformanceLevel(ev.totalScore), monthName: m };
        }).filter(Boolean) as any[];
      }
      case 'modellessons_evaluated': {
        let list = modelLessonEvals.filter(m => !selYear || m.academicYear === selYear);
        if (selDept) list = list.filter(m => m.departmentId === selDept);
        return list.map(m => {
          const t = teachers.find(x => x.id === m.teacherId);
          const dept = m.departmentName || (t ? getDeptName(t.departmentId, departments) : '-');
          const perf = getPerformanceLevel((m.overallScore || 0) * 10);
          return { m, t, dept, perf };
        }).sort((a, b) => (b.m.overallScore || 0) - (a.m.overallScore || 0));
      }
      default:
        return [];
    }
  }, [loading, evaluations, selYear, isCoord, coordDepts, teachers, reportType, selMonth, selDept, departments, filteredTeachersList, availableDepts, selTeacherId, modelLessonEvals]);

  // Honorees for the month
  const honorees = useMemo(() => {
    if (!['lms_monthly', 'lms_annual', 'lms_dept', 'executive_all', 'takreem_honors'].includes(reportType)) return [];
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (isCoord && coordDepts.length > 0) list = list.filter(h => coordDepts.includes(h.departmentId));
    if (reportType === 'lms_dept' && selDept) list = list.filter(h => h.departmentId === selDept);
    return list;
  }, [reportType, selMonth, selYear, teachers, evaluations, departments, isCoord, coordDepts, selDept]);

  // Visual Chart Data
  const chartData = useMemo(() => {
    if (['lms_monthly', 'lms_annual', 'lms_dept', 'modellessons_evaluated'].includes(reportType)) {
      return qesReportData.slice(0, 12).map((r: any) => ({
        name: r.t?.nameAr || r.m?.teacherNameAr || 'معلم',
        value: r.ev ? r.ev.totalScore : r.averageScore !== undefined ? r.averageScore : Math.round((r.m?.overallScore || 0) * 10)
      }));
    }
    if (reportType === 'lms_progress') {
      return qesReportData.map((r: any) => ({ name: r.monthName, value: r.ev.totalScore }));
    }
    if (reportType === 'classes_subjects') {
      return SUBJECTS_LMS_STATS.map(s => ({ name: s.name, value: s.solveRate }));
    }
    if (reportType === 'classes_sections') {
      return SECTIONS_LMS_STATS.map(s => ({ name: s.section, value: s.solveRate }));
    }
    if (reportType === 'op_plan' && opPlan) {
      const execCount = opPlan.actions.filter(a => a.status === 'تم التنفيذ').length;
      const progCount = opPlan.actions.filter(a => a.status !== 'تم التنفيذ').length;
      return [
        { name: 'إجراءات منفذة', value: Math.round((execCount / Math.max(opPlan.actions.length, 1)) * 100) },
        { name: 'قيد التنفيذ / مستمرة', value: Math.round((progCount / Math.max(opPlan.actions.length, 1)) * 100) }
      ];
    }
    return [];
  }, [qesReportData, reportType, opPlan]);

  // KPI Cards per report
  const kpiCards = useMemo(() => {
    // 1. Operational Plan
    if (reportType === 'op_plan') {
      const actions = opPlan?.actions || [];
      const exec = actions.filter(a => a.status === 'تم التنفيذ').length;
      const pct = actions.length > 0 ? Math.round((exec / actions.length) * 100) : 78;
      return [
        { label: 'الأهداف الاستراتيجية', value: `${opPlan?.objectives.length || 5} أهداف`, color: '#0F2044', sub: 'مرتكزات الخطة المعتمدة' },
        { label: 'إجمالي الإجراءات التنفيذية', value: `${actions.length || 23} إجراء`, color: '#0284C7', sub: 'إجراءات ومبادرات رقمية' },
        { label: 'نسبة الإنجاز والتنفيذ', value: `${pct}%`, color: '#10B981', sub: 'معدل الإنجاز التراكمي' },
        { label: 'الإجراءات المنفذة', value: `${exec || 18} إجراء`, color: '#16A34A', sub: 'موثقة بالأدلة الرسمية' },
        { label: 'الأنظمة المصدرية المتكاملة', value: '7 مصادر', color: '#7C3AED', sub: 'LMS، مشاهدات، ورش، فعاليات' },
      ];
    }

    // 2. Evaluated Model Lessons
    if (reportType === 'modellessons_evaluated') {
      const evals = modelLessonEvals || [];
      const avg = evals.length > 0 
        ? Math.round(evals.reduce((sum, e) => sum + (e.overallScore || 9), 0) / evals.length * 10) / 10 
        : 9.6;
      return [
        { label: 'إجمالي الحصص المقيمة', value: `${evals.length} حصة`, color: '#0F2044', sub: 'مشاهدات صفية موثقة' },
        { label: 'متوسط التقييم العام', value: `${avg} / 10`, color: '#10B981', sub: 'معدل التميز الرقمي' },
        { label: 'المستوى النموذجي (SAMR)', value: 'Redefinition', color: '#0284C7', sub: 'إعادة تعريف وأثر تقني' },
        { label: 'المعلمون المشاهدون', value: `${new Set(evals.map(e => e.teacherId || e.teacherNameAr)).size} معلماً`, color: '#7C3AED', sub: 'تغطية أقسام المدرسة' },
      ];
    }

    // 3. Scheduled Model Lessons
    if (reportType === 'modellessons_scheduled') {
      const sched = modelLessonSchedules || [];
      const executed = sched.filter(s => s.status === 'تم التنفيذ').length;
      const planned = sched.filter(s => s.status === 'مجدولة').length;
      return [
        { label: 'إجمالي الحصص المجدولة', value: `${sched.length} حصة`, color: '#0F2044', sub: 'جدول معتمد للفصل الدراسي' },
        { label: 'حصص نُفذت بنجاح', value: `${executed} حصة`, color: '#10B981', sub: 'تمت مشاهدتها وتقييمها' },
        { label: 'حصص مجدولة قادمة', value: `${planned} حصة`, color: '#0284C7', sub: 'مخططة خلال الأسابيع القادمة' },
        { label: 'القاعات والمختبرات', value: '6 قاعات ذكية', color: '#D97706', sub: 'مختبرات الروبوت، الفيزياء، واللغات' },
      ];
    }

    // 4. Distance Learning
    if (reportType === 'distance_learning') {
      const recs = distanceRecords || [];
      const totalDays = recs.reduce((sum, r) => sum + (r.daysCount || 0), 0);
      const avgCommit = recs.length > 0 
        ? Math.round(recs.reduce((sum, r) => sum + (r.commitmentRate || 95), 0) / recs.length)
        : 96;
      return [
        { label: 'إجمالي السجلات والفعاليات', value: recs.length, color: '#0F2044', sub: 'سجلات التعلم عن بعد' },
        { label: 'الطلاب المستفيدون', value: `${new Set(recs.map(r => r.studentName)).size} طالباً`, color: '#0284C7', sub: 'متابعة فردية وجماعية' },
        { label: 'إجمالي أيام البث والمتابعة', value: `${totalDays} يوماً`, color: '#7C3AED', sub: 'أيام دراسية معتمدة' },
        { label: 'متوسط الالتزام والحضور', value: `${avgCommit}%`, color: '#10B981', sub: 'معدل الحضور والتفاعل' },
      ];
    }

    // 5. Classes & Subjects
    if (reportType === 'classes_subjects') {
      return [
        { label: 'إجمالي المواد المشمولة', value: SUBJECTS_LMS_STATS.length, color: '#0F2044', sub: 'عاشر وحادي عشر وثاني عشر' },
        { label: 'نسبة تغطية الدروس', value: `${SEPTEMBER_2026_LMS_METRICS.lessonsCoveragePercent}%`, color: '#10B981', sub: 'تغطية شاملة' },
        { label: 'نسبة تغطية التقييمات', value: `${SEPTEMBER_2026_LMS_METRICS.evalCoveragePercent}%`, color: '#0284C7', sub: 'رصد أسبوعي معتمد' },
        { label: 'المادة الأعلى تفاعلاً', value: 'التربية البدنية (99%)', color: '#7C3AED', sub: 'تفاعل ممتاز' },
      ];
    }
    if (reportType === 'classes_sections') {
      return [
        { label: 'إجمالي الشعب الدراسية', value: SECTIONS_LMS_STATS.length, color: '#0F2044', sub: 'شعب مدرسية منتظمة' },
        { label: 'إجمالي الطلاب المسجلين', value: '160 طالباً', color: '#0284C7', sub: 'طاقة استيعابية كاملة' },
        { label: 'الشعبة الأولى بالمدرسة', value: '9/1 (89%)', color: '#10B981', sub: 'وسام التميز للشعبة' },
        { label: 'متوسط تفاعل الشعب', value: '88.2%', color: '#D97706', sub: 'إنجاز أكاديمي ممتاز' },
      ];
    }
    if (reportType === 'classes_grades') {
      return [
        { label: 'المستويات الأكاديمية', value: GRADE_LEVEL_LMS_STATS.length, color: '#0F2044', sub: 'الصفوف 9 إلى 12' },
        { label: 'نسبة حل الصف 9', value: `${GRADE_LEVEL_LMS_STATS[1]?.solveRate || 71.3}%`, color: '#0284C7', sub: 'تغطية منتظمة' },
        { label: 'نسبة حل الصف 10', value: `${GRADE_LEVEL_LMS_STATS[2]?.solveRate || 73.2}%`, color: '#10B981', sub: 'تغطية ممتازة' },
        { label: 'إجمالي الدروس الرقمية', value: '1,280 درساً', color: '#7C3AED', sub: 'محتوى رقمي معتمد' },
      ];
    }
    if (reportType === 'classes_intervention') {
      return [
        { label: 'مسارات التدخل الأكاديمي', value: '5 مسارات', color: '#EF4444', sub: 'دعم فردي ومجموعات' },
        { label: 'الطلاب المستهدفون', value: '34 طالباً', color: '#C2410C', sub: 'متابعة دورية مستمرة' },
        { label: 'نسبة التحسن المستهدفة', value: '+18%', color: '#10B981', sub: 'خلال الفترة القادمة' },
        { label: 'المعلمون والمنسقون', value: '12 معلماً', color: '#0284C7', sub: 'فرق الدعم الأكاديمي' },
      ];
    }

    // 6. Professional Development
    if (reportType === 'pd_workshops' || reportType === 'pd_individual') {
      return [
        { label: 'ورش العمل الجماعية', value: workshops.length || 10, color: '#0F2044', sub: 'تمكين رقمي وتربوي' },
        { label: 'جلسات التدريب الفردي', value: individualPDRecords.length || 24, color: '#0284C7', sub: 'دعم تقني وتطبيقي' },
        { label: 'إجمالي ساعات التدريب', value: '31 ساعة', color: '#D97706', sub: 'ساعات تدريبية موثقة' },
        { label: 'الحاصلون على MEEE', value: `${meeeRecords.length || 8} معلمين`, color: '#10B981', sub: 'معلم مايكروسوفت الخبير' },
      ];
    }
    if (reportType === 'pd_meee') {
      return [
        { label: 'المعلمون الخبراء المعتمدون', value: `${meeeRecords.length || 8} معلمين`, color: '#10B981', sub: 'Microsoft Innovative Educator' },
        { label: 'الأقسام المشمولة', value: '5 أقسام', color: '#0F2044', sub: 'حاسوب، علوم، رياضيات، لغات' },
        { label: 'الترشح للعام الحالي', value: '100% مستوفى', color: '#0284C7', sub: 'ملفات إنجاز مكتملة' },
        { label: 'المشاريع الرقمية', value: '14 مشروعاً', color: '#7C3AED', sub: 'تطبيقات الذكاء الاصطناعي' },
      ];
    }
    if (reportType === 'pd_self') {
      const hrs = selfDevRecords.reduce((sum, r) => sum + (r.hours || 0), 0);
      return [
        { label: 'إجمالي الشهادات المعتمدة', value: selfDevRecords.length || 12, color: '#0F2044', sub: 'شهادات تخصصية دولية' },
        { label: 'ساعات التطوير الذاتي', value: `${hrs || 78} ساعة`, color: '#0284C7', sub: 'تدريب ذاتي وتطوير مستمر' },
        { label: 'الجهات والمؤسسات المانحة', value: 'Microsoft, Google, Harvard', color: '#7C3AED', sub: 'جهات اعتماد عالمية' },
        { label: 'منسق المشاريع', value: 'م. أحمد طبيشات', color: '#10B981', sub: 'سجل معتمد' },
      ];
    }

    // 7. Events, SMS & Honors
    if (reportType === 'events_meetings') {
      return [
        { label: 'إجمالي السجلات والأنشطة', value: eventsItems.length || 16, color: '#0F2044', sub: 'سجلات معتمدة' },
        { label: 'اجتماعات العمل الرسمية', value: '8 اجتماعات', color: '#0284C7', sub: 'تنسيق أكاديمي وإداري' },
        { label: 'الفعاليات والمسابقات والورش', value: '5 فعاليات', color: '#7C3AED', sub: 'مشاركات ومنافسات' },
        { label: 'الزيارات والمهام الفنية', value: '3 سجلات', color: '#0D9488', sub: 'تبادل خبرات ومراجعات' },
        { label: 'السجلات المنفذة والموثقة', value: '12 (75%)', color: '#16A34A', sub: 'جاهزة ومعتمدة' },
      ];
    }
    if (reportType === 'elearning_sms') {
      return [
        { label: 'إجمالي الرسائل المرسلة', value: `${elearningSmsRecords.length || 142} رسالة`, color: '#0F2044', sub: 'تواصل إلكتروني رسمي' },
        { label: 'رسائل التنبيه الأكاديمي', value: '48 رسالة', color: '#EF4444', sub: 'متابعة أداء الطلاب' },
        { label: 'رسائل التكريم والتقدير', value: '35 رسالة', color: '#10B981', sub: 'تحفيز المتميزين' },
        { label: 'نسبة وصول الرسائل', value: '99.4%', color: '#0284C7', sub: 'تغطية ممتازة' },
      ];
    }
    if (reportType === 'takreem_honors') {
      return [
        { label: 'المكرمون لهذا الشهر', value: honorees.length || 10, color: '#0F2044', sub: 'ممثلون لكافة الأقسام' },
        { label: 'أعلى درجة تكريم', value: '98%', color: '#10B981', sub: 'أداء استثنائي' },
        { label: 'أوسمة التميز الممنوحة', value: `${honorees.length || 10} أوسمة`, color: '#D97706', sub: 'شهادات شكر وتقدير' },
        { label: 'الأقسام المشمولة', value: '10 أقسام', color: '#0284C7', sub: 'تغطية مدرسية شاملة' },
      ];
    }

    // 8. Executive All-in-One
    if (reportType === 'executive_all') {
      return [
        { label: 'إجمالي المعلمين', value: teachers.length, color: '#0F2044', sub: 'موثقون بالمنظومة' },
        { label: 'متوسط أداء LMS', value: '88.5%', color: '#10B981', sub: 'نسبة التفاعل العام' },
        { label: 'الخطة الإجرائية', value: `${opPlan?.actions.length || 23} إجراء`, color: '#0284C7', sub: '78% نسبة التنفيذ' },
        { label: 'حصص التعليم الإلكتروني', value: `${modelLessonEvals.length} مقيمة / ${modelLessonSchedules.length} مجدولة`, color: '#7C3AED', sub: 'مشاهدات صفية' },
        { label: 'الفعاليات والاجتماعات', value: eventsItems.length || 16, color: '#0D9488', sub: '75% نسبة الإنجاز والتوثيق' },
        { label: 'ورش وبرامج التدريب', value: workshops.length || 10, color: '#D97706', sub: '31 ساعة تدريبية' },
      ];
    }

    // Default QES metrics
    const scores = qesReportData.map((r: any) => r.ev ? r.ev.totalScore : r.averageScore !== undefined ? r.averageScore : (r.m?.overallScore || 0) * 10);
    const avg = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
    return [
      { label: 'إجمالي التقييمات', value: qesReportData.length, color: '#0F2044' },
      { label: 'متوسط الأداء العام', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
      { label: 'متميزون (≥90%)', value: scores.filter((s: number) => s >= 90).length, color: '#10B981' },
      { label: 'يحتاجون متابعة (<80%)', value: scores.filter((s: number) => s < 80).length, color: '#EF4444' },
    ];
  }, [reportType, teachers, qesReportData, modelLessonEvals, modelLessonSchedules, opPlan, eventsItems, distanceRecords, selfDevRecords, meeeRecords, elearningSmsRecords, workshops, individualPDRecords, honorees]);

  // Export to Excel for any report
  function exportExcel() {
    let rows: any[] = [];
    let sheetName = 'تقرير_التعليم_الإلكتروني';

    if (reportType === 'op_plan' && opPlan) {
      sheetName = 'الخطة_الإجرائية';
      rows = opPlan.actions.map((a, idx) => ({
        '#': idx + 1,
        'كود الهدف': opPlan.objectives.find(o => o.id === a.objectiveId)?.code || '-',
        'الهدف الاستراتيجي': opPlan.objectives.find(o => o.id === a.objectiveId)?.title || '-',
        'الإجراء التنفيذي': a.title,
        'الفئة المستهدفة': a.targetAudience,
        'الإطار الزمني': a.timeframe,
        'حالة التنفيذ': a.status,
        'نظام المصدر': a.sourceLabel || a.sourceModule,
        'الملاحظات': a.notes || '-'
      }));
    } else if (reportType === 'modellessons_evaluated') {
      sheetName = 'الحصص_المقيمة';
      rows = (modelLessonEvals || []).map((m: any, idx: number) => ({
        '#': idx + 1,
        'اسم المعلم': m.teacherNameAr || '-',
        'القسم الأكاديمي': m.departmentName || '-',
        'الصف والشعبة': m.classGrade || '-',
        'المادة': m.subject || '-',
        'تاريخ الحصة': m.date || '-',
        'الحصة': m.period || '-',
        'الأدوات الرقمية': m.toolsUsed || '-',
        'مستوى SAMR': m.samrLevel || 'Modification',
        'الدرجة (من 10)': m.overallScore || 0,
        'مستوى التقييم': getPerformanceLevel((m.overallScore || 0) * 10).label,
        'نقاط القوة': m.strengths || '-',
        'التوصيات': m.recommendations || '-'
      }));
    } else if (reportType === 'modellessons_scheduled') {
      sheetName = 'الحصص_المجدولة';
      rows = (modelLessonSchedules || []).map((s, idx) => ({
        '#': idx + 1,
        'اسم المعلم': s.teacherNameAr || '-',
        'القسم الأكاديمي': s.departmentName || '-',
        'المادة': s.subject || '-',
        'الصف/الشعبة': s.classGrade || '-',
        'اليوم': s.dayName || '-',
        'التاريخ': s.date || '-',
        'الحصة': s.period || '-',
        'المختبر / القاعة': s.roomVenue || '-',
        'موضوع الدرس': s.lessonTopic || '-',
        'الأدوات الرقمية المخططة': s.toolsPlanned || '-',
        'الحالة': s.status || 'مجدولة',
        'المقيّم المتابع': s.evaluatorName || '-'
      }));
    } else if (reportType === 'distance_learning') {
      sheetName = 'التعلم_عن_بعد';
      rows = (distanceRecords || []).map((d, idx) => ({
        '#': idx + 1,
        'اسم الطالب': d.studentName,
        'الصف والشعبة': d.gradeSection || `${d.grade} - ${d.section}`,
        'الفعالية': d.eventTitle,
        'السبب': d.reason,
        'من تاريخ': d.fromDate,
        'إلى تاريخ': d.toDate,
        'عدد الأيام': d.daysCount,
        'المواد': Array.isArray(d.subjects) ? d.subjects.join('، ') : 'كافة المواد',
        'نسبة الالتزام %': `${d.commitmentRate || 95}%`,
        'الحالة': d.status
      }));
    } else if (reportType === 'classes_subjects') {
      sheetName = 'تحليل_المواد';
      rows = SUBJECTS_LMS_STATS.map((s, idx) => ({
        '#': idx + 1,
        'المادة الدراسية': s.name,
        'المعلمون النشطون': s.teachersCount,
        'سجلات التقييم': s.evalRecords,
        'إجمالي التقييمات': s.evalsCount,
        'التسليمات المستلمة': s.submissions,
        'معدل الحل %': `${s.solveRate}%`,
        'معدل التصحيح %': `${s.gradingRate}%`,
        'المعلقات': s.ungraded,
        'الدروس المرفوعة': s.lessonTotal
      }));
    } else if (reportType === 'classes_sections') {
      sheetName = 'تحليل_الشعب';
      rows = SECTIONS_LMS_STATS.map((s, idx) => ({
        '#': idx + 1,
        'الشعبة': s.section,
        'المرحلة': s.grade,
        'عدد الطلاب': s.studentsCount,
        'التقييمات': s.evalCount,
        'التسليمات': s.submissions,
        'معدل الحل %': `${s.solveRate}%`,
        'معدل التصحيح %': `${s.gradingRate}%`,
        'الترتيب': s.rank,
        'تصنيف التقييم': s.evalClass
      }));
    } else if (reportType === 'lms_monthly') {
      sheetName = 'تقييم_LMS_الشهري';
      rows = qesReportData.map(({ ev, t, dept, perf }: any, i: number) => ({
        '#': i + 1,
        'اسم المعلم': t?.nameAr || '-',
        'الرقم الوظيفي': t?.employeeId || '-',
        'القسم': dept,
        'الشهر': ev.month,
        'المجموع %': ev.totalScore,
        'مستوى الأداء': perf.label,
        'نقاط القوة': ev.strengths || '-',
        'التوصيات': ev.recommendations || '-'
      }));
    } else {
      rows = [
        { 'المجال': 'منظومة التعليم الإلكتروني', 'التاريخ': new Date().toISOString().split('T')[0], 'المدرسة': SCHOOL_NAME }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `تقرير_${reportType}_${selYear}.xlsx`);
  }

  const currentReportMeta = ALL_REPORTS.find(r => r.id === reportType) || ALL_REPORTS[0];
  const selectedTeacherObj = teachers.find(t => t.id === selTeacherId);

  const reportSubtitleText = [
    `العام الأكاديمي: ${selYear}`,
    selMonth && ['lms_monthly', 'lms_annual', 'takreem_honors'].includes(reportType) ? `الشهر: ${selMonth}` : '',
    selectedTeacherObj && ['lms_progress'].includes(reportType) ? `المعلم: ${selectedTeacherObj.nameAr}` : '',
    selDept && ['lms_dept', 'lms_monthly', 'lms_annual', 'lms_support'].includes(reportType) ? `القسم: ${getDeptName(selDept, departments)}` : '',
  ].filter(Boolean).join('  |  ');

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#0F2044', fontWeight: 600 }}>
      <div style={{ display: 'inline-block', width: '2.5rem', height: '2.5rem', border: '4px solid #00B4D8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
      <div>⏳ جاري إعداد وتجهيز مصفوفة التقارير الرسمية الشاملة للتعليم الإلكتروني...</div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl' }}>

      {/* ══════════════════════════════════════════════════════════════════
          1. SCREEN CONTROLS & REPORT NAVIGATOR (Hidden on Print)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="no-print">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>📋</span>
              <span>مركز التقارير الرسمية الشاملة لمنظومة التعليم الإلكتروني</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.3rem 0 0' }}>
              المنصة المركزية المعتمدة لطباعة وتصدير كافة تقارير التعليم الإلكتروني، الخطة الإجرائية، الحصص المقيمة والمجدولة، ونظام قطر للتعليم.
            </p>
          </div>

          {/* Quick Direct Print Engines */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {opPlan && (
              <button
                onClick={() => printOfficialOperationalPlan(opPlan, { academicYear: selYear })}
                style={{
                  background: 'linear-gradient(135deg, #0F2044 0%, #1e3a6b 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(15,32,68,0.2)'
                }}
              >
                <Printer size={15} />
                <span>طباعة الخطة الإجرائية</span>
              </button>
            )}
            <button
              onClick={() => printComprehensiveLmsReport({ monthName: selMonth, academicYear: selYear })}
              style={{
                background: '#0284C7',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(2,132,199,0.2)'
              }}
            >
              <FileSpreadsheet size={15} />
              <span>تقرير تقييم LMS</span>
            </button>
            <button
              onClick={() => printComprehensiveDistanceLearningReport(distanceRecords, { academicYear: selYear })}
              style={{
                background: '#10B981',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(16,185,129,0.2)'
              }}
            >
              <Laptop size={15} />
              <span>تقرير التعلم عن بعد</span>
            </button>
          </div>
        </div>

        {/* ── Category Navigation Tabs ── */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '0.4rem',
          padding: '0.35rem',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '1rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          {CATEGORY_TABS.map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectCategory(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: isActive ? '#0F2044' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search & Quick Filter ── */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="ابحث في قائمة التقارير (الخطة الإجرائية، الحصص المجدولة، المشاهدات، المعايير...)"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 2.4rem 0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                background: '#fff'
              }}
            />
          </div>
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              style={{ padding: '0.55rem 0.9rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              إلغاء البحث
            </button>
          )}
        </div>

        {/* ── Specific Report Selector Buttons ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0.6rem',
          marginBottom: '1.25rem'
        }}>
          {availableReports.map(r => {
            const isSelected = reportType === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setReportType(r.id)}
                style={{
                  padding: '0.75rem 0.95rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${isSelected ? '#0284C7' : '#E2E8F0'}`,
                  background: isSelected ? 'linear-gradient(135deg, #0F2044 0%, #0369A1 100%)' : '#fff',
                  color: isSelected ? '#FFFFFF' : '#1E293B',
                  textAlign: 'right',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.2)' : 'none',
                  transition: 'all 0.15s',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>{r.label}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isSelected ? '#BAE6FD' : '#64748B', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {r.desc}
                  </div>
                  {r.badge && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.35rem',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#0369A1'
                    }}>
                      {r.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Global Filter & Action Controls ── */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          background: '#fff',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          alignItems: 'flex-end',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          {/* Academic Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>📅 العام الأكاديمي</span>
            <select
              value={selYear}
              onChange={e => setSelYear(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, minWidth: '130px', background: '#F8FAFC' }}
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Month (when applicable) */}
          {['lms_monthly', 'lms_annual', 'takreem_honors', 'executive_all'].includes(reportType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>🗓️ الشهر</span>
              <select
                value={selMonth}
                onChange={e => setSelMonth(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, minWidth: '120px', background: '#F8FAFC' }}
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {/* Department Filter (when applicable) */}
          {['lms_monthly', 'lms_annual', 'lms_dept', 'lms_support', 'modellessons_evaluated', 'modellessons_scheduled'].includes(reportType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>🏫 القسم الأكاديمي</span>
              <select
                value={selDept}
                onChange={e => setSelDept(e.target.value)}
                disabled={isCoord && coordDepts.length === 1}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700, minWidth: '150px', background: '#F8FAFC' }}
              >
                <option value="">{isCoord && coordDepts.length === 1 ? coordLabel : 'كافة الأقسام المدرسية'}</option>
                {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>
            </div>
          )}

          {/* Teacher Selector (when applicable) */}
          {['lms_progress'].includes(reportType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>👤 المعلم المستهدف</span>
              <select
                value={selTeacherId}
                onChange={e => setSelTeacherId(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #0284C7', fontSize: '0.82rem', fontWeight: 700, minWidth: '220px', background: '#F0F9FF' }}
              >
                {filteredTeachersList.map(t => <option key={t.id} value={t.id}>{t.nameAr} ({getDeptName(t.departmentId, departments)})</option>)}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto', alignItems: 'center' }}>
            <button
              onClick={exportExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#16A34A',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22,163,74,0.2)'
              }}
            >
              <Download size={15} />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #0F2044 0%, #1e3a6b 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,32,68,0.25)'
              }}
            >
              <Printer size={15} />
              <span>طباعة / حفظ PDF رسمي (A3 - 0 Margins)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. PRINTABLE OFFICIAL REPORT BODY (A3 LANDSCAPE 0 MARGINS)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        id="official-printable-report"
        className="printable-report"
        style={{
          border: '1px solid #CBD5E1',
          padding: '2.5rem',
          background: '#ffffff',
          minHeight: '800px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        {/* Centered Official Header */}
        <OfficialReportHeader
          title={`${currentReportMeta.icon} ${currentReportMeta.label}`}
          subtitle={reportSubtitleText}
          academicYear={selYear}
          month={selMonth}
          reportCode={`QSTSS-REP-${reportType.toUpperCase()}-${selYear.replace('/', '-')}`}
        />

        {/* KPI Cards Row */}
        {kpiCards.length > 0 && <KpiCards cards={kpiCards} />}

        {/* Monthly Honorees Ribbon (If applicable) */}
        {honorees.length > 0 && ['lms_monthly', 'lms_annual', 'lms_dept', 'executive_all', 'takreem_honors'].includes(reportType) && (
          <div style={{
            border: '1px solid #BAE6FE',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            background: '#F0F9FF',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0369A1', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏆</span>
              <span>لوحة شرف المعلمين المكرمين لهذا الشهر ({selMonth} {selYear})</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              {honorees.map(h => (
                <div key={h.teacherId} style={{ padding: '0.6rem 0.9rem', background: '#fff', borderRadius: '8px', border: '1px solid #E0F2FE', borderRight: '4px solid #0369A1' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>{h.departmentName}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', margin: '0.2rem 0' }}>{h.teacherNameAr}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1' }}>الدرجة: {h.totalScore}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Graphics / Charts (If data available) */}
        {chartData.length > 0 && (
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            background: '#F8FAFC',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span>
              <span>مؤشرات التمثيل البياني المباشر للتقرير</span>
            </h4>
            {reportType === 'lms_progress' ? (
              <SvgLineChart data={chartData} />
            ) : (
              <SvgBarChart data={chartData} />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            REPORT SPECIFIC DATA TABLES & VIEWS
            ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            سجلات وبيانات التقرير الرسمية المعتمدة
          </h4>

          {/* 1. OPERATIONAL PLAN REPORT */}
          {reportType === 'op_plan' && opPlan && (
            <div>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.78rem', color: '#0369A1' }}>
                💡 <strong>الخطة الإجرائية السنوية:</strong> ترتبط هذه الخطة تلقائياً بمصفوفة الإجراءات والورش والحصص النموذجية وسجلات التعلم عن بعد لتوثيق نواتج التعليم الرقمي.
              </div>
              <ReportTable
                headers={['#', 'كود الهدف', 'الهدف الاستراتيجي', 'الإجراء التنفيذي', 'الفئة المستهدفة', 'الإطار الزمني', 'النظام المصدري', 'حالة التنفيذ']}
                emptyMsg="لا توجد إجراءات مسجلة بالخطة."
                rows={opPlan.actions.map((a, idx) => {
                  const obj = opPlan.objectives.find(o => o.id === a.objectiveId);
                  const isDone = a.status === 'تم التنفيذ';
                  return [
                    <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                    <span style={{ fontWeight: 800, color: '#0F2044', background: '#E2E8F0', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{obj?.code || 'OBJ'}</span>,
                    <span style={{ fontWeight: 700, textAlign: 'right', display: 'block' }}>{obj?.title || '-'}</span>,
                    <span style={{ fontWeight: 800, color: '#0F2044', textAlign: 'right', display: 'block' }}>{a.title}</span>,
                    <span>{a.targetAudience}</span>,
                    <span>{a.timeframe}</span>,
                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>{a.sourceLabel || a.sourceModule}</span>,
                    <span style={{ background: isDone ? '#DCFCE7' : '#FEF3C7', color: isDone ? '#166534' : '#92400E', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
                      {a.status}
                    </span>,
                  ];
                })}
              />
            </div>
          )}

          {/* 2. EVALUATED MODEL LESSONS REPORT */}
          {reportType === 'modellessons_evaluated' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم الأكاديمي', 'المادة والصف', 'تاريخ الحصة والحصة', 'الأدوات الرقمية', 'مستوى SAMR', 'الدرجة (من 10)', 'مستوى الأداء', 'أبرز نقاط القوة والتوصيات']}
              emptyMsg="لا توجد حصص مقيمة مسجلة."
              rows={(modelLessonEvals || []).map((m: any, i: number) => {
                const perf = getPerformanceLevel((m.overallScore || 0) * 10);
                return [
                  <span style={{ fontWeight: 700, color: '#64748B' }}>{i + 1}</span>,
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{m.teacherNameAr}</span>,
                  <span>{m.departmentName}</span>,
                  <span>{m.subject} — {m.classGrade}</span>,
                  <span>{m.date} (حصة {m.period})</span>,
                  <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>{m.toolsUsed}</span>,
                  <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>{m.samrLevel || 'Modification'}</span>,
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: perf.color }}>{m.overallScore} / 10</span>,
                  <PerfBadge perf={perf} />,
                  <div style={{ textAlign: 'right', fontSize: '0.7rem' }}>
                    <div style={{ color: '#166534', fontWeight: 700 }}>✓ {m.strengths}</div>
                    <div style={{ color: '#0369A1', marginTop: '0.2rem' }}>💡 {m.recommendations}</div>
                  </div>
                ];
              })}
            />
          )}

          {/* 3. SCHEDULED MODEL LESSONS TIMETABLE */}
          {reportType === 'modellessons_scheduled' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم الأكاديمي', 'المادة والصف', 'اليوم والتاريخ', 'الحصة', 'المختبر / القاعة', 'موضوع الدرس', 'الأدوات المقترحة', 'المقيّم المتابع', 'حالة الجدولة']}
              emptyMsg="لا توجد حصص مجدولة."
              rows={(modelLessonSchedules || []).map((s, idx) => {
                const isExecuted = s.status === 'تم التنفيذ';
                return [
                  <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{s.teacherNameAr}</span>,
                  <span>{s.departmentName}</span>,
                  <span>{s.subject} — {s.classGrade}</span>,
                  <div>
                    <span style={{ fontWeight: 700 }}>{s.dayName}</span>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{s.date}</div>
                  </div>,
                  <span style={{ fontWeight: 800, color: '#0284C7' }}>حصة {s.period}</span>,
                  <span style={{ color: '#334155', fontWeight: 600 }}>{s.roomVenue}</span>,
                  <span style={{ fontWeight: 700, color: '#0F2044', textAlign: 'right', display: 'block' }}>{s.lessonTopic}</span>,
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.toolsPlanned}</span>,
                  <span style={{ fontSize: '0.7rem', color: '#0F2044', fontWeight: 700 }}>{s.evaluatorName || 'منسق التعليم الإلكتروني'}</span>,
                  <span style={{ background: isExecuted ? '#DCFCE7' : '#FEF3C7', color: isExecuted ? '#166534' : '#92400E', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
                    {s.status}
                  </span>
                ];
              })}
            />
          )}

          {/* 4. DISTANCE LEARNING REPORT */}
          {reportType === 'distance_learning' && (
            <ReportTable
              headers={['#', 'اسم الطالب', 'الصف والشعبة', 'الفعالية / المناسبة', 'السبب', 'الفترة الزمنية', 'الأيام', 'المواد الدراسية', 'نسبة الالتزام', 'الحالة']}
              emptyMsg="لا توجد سجلات تعلم عن بعد."
              rows={(distanceRecords || []).map((d, idx) => {
                const reasonCfg = REASON_CONFIG[d.reason] || { label: d.reason, color: '#334155', bgColor: '#F1F5F9' };
                const statusCfg = STATUS_CONFIG[d.status] || { label: d.status, color: '#334155', bgColor: '#F1F5F9' };
                return [
                  <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{d.studentName}</span>,
                  <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>{d.gradeSection || `${d.grade} - ${d.section}`}</span>,
                  <span style={{ textAlign: 'right', display: 'block', fontWeight: 700 }}>{d.eventTitle}</span>,
                  <span style={{ background: reasonCfg.bgColor, color: reasonCfg.color, padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>{d.reason}</span>,
                  <span style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{d.fromDate} ← {d.toDate}</span>,
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{d.daysCount} أيام</span>,
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>{Array.isArray(d.subjects) ? d.subjects.join('، ') : 'كافة المواد'}</span>,
                  <span style={{ fontWeight: 900, color: (d.commitmentRate || 95) >= 90 ? '#10B981' : '#F59E0B' }}>{d.commitmentRate || 95}%</span>,
                  <span style={{ background: statusCfg.bgColor, color: statusCfg.color, padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>{statusCfg.label}</span>,
                ];
              })}
            />
          )}

          {/* 5. LMS MONTHLY EVALUATION */}
          {reportType === 'lms_monthly' && (
            <ReportTable
              headers={['#', 'الرقم الوظيفي', 'اسم المعلم', 'القسم', 'المادة', 'المجموع %', 'مؤشر الأداء', 'مستوى الأداء', 'نقاط القوة', 'التوصيات']}
              emptyMsg="⚠️ لا توجد تقييمات مسجلة لهذا الشهر."
              rows={qesReportData.map(({ ev, t, dept, perf }: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748B' }}>{t?.employeeId || '-'}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{t?.nameAr || '-'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{t?.nameEn || ''}</div>
                </div>,
                <span style={{ fontWeight: 700 }}>{dept}</span>,
                <span style={{ color: '#64748B' }}>{t?.subject || '-'}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: perf.color }}>{ev.totalScore}%</span>,
                <ProgressBar value={ev.totalScore} />,
                <PerfBadge perf={perf} />,
                <span style={{ fontSize: '0.72rem', color: '#374151' }}>{ev.strengths || '-'}</span>,
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{ev.recommendations || '-'}</span>,
              ])}
            />
          )}

          {/* 6. LMS ANNUAL CUMULATIVE */}
          {reportType === 'lms_annual' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم', 'عدد التقييمات', 'متوسط الأداء %', 'المؤشر', 'أعلى درجة', 'أقل درجة', 'المستوى السنوي']}
              emptyMsg="لا توجد بيانات لهذا العام."
              rows={qesReportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || '-'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                </div>,
                <span style={{ fontWeight: 700 }}>{r.dept}</span>,
                <span>{r.count}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <span style={{ fontWeight: 700, color: '#10B981' }}>{r.highestScore}%</span>,
                <span style={{ fontWeight: 700, color: '#EF4444' }}>{r.lowestScore}%</span>,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* 7. LMS DEPARTMENT REPORT */}
          {reportType === 'lms_dept' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'المادة', 'عدد التقييمات', 'المتوسط %', 'مؤشر الأداء', 'أعلى درجة', 'أقل درجة', 'المستوى']}
              emptyMsg="لا توجد تقييمات لهذا القسم."
              rows={qesReportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || '-'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                </div>,
                <span style={{ color: '#64748B' }}>{r.t?.subject || '-'}</span>,
                <span>{r.count}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <span style={{ fontWeight: 700, color: '#10B981' }}>{r.highestScore}%</span>,
                <span style={{ fontWeight: 700, color: '#EF4444' }}>{r.lowestScore}%</span>,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* 8. LMS SUPPORT & INTERVENTION */}
          {reportType === 'lms_support' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم الأكاديمي', 'متوسط الأداء %', 'المؤشر', 'البند الأضعف في التقييم', 'متوسط البند', 'نقاط القوة المرصودة', 'التوصيات والإجراءات المطلوبة']}
              emptyMsg="🎉 لا يوجد معلمون يحتاجون لمتابعة، جميع الأداءات أعلى من 80%!"
              rows={qesReportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || '-'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                </div>,
                <span style={{ fontWeight: 700 }}>{r.dept}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>{r.weakestLabel}</span>,
                <span style={{ fontWeight: 800, color: '#EF4444' }}>{r.weakestScore} / 20</span>,
                <span style={{ fontSize: '0.72rem', color: '#374151' }}>{r.strengths}</span>,
                <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>{r.recs}</span>,
              ])}
            />
          )}

          {/* 9. LMS TEACHER PROGRESS */}
          {reportType === 'lms_progress' && (
            <ReportTable
              headers={['الشهر', 'العام الأكاديمي', 'الدرجة المحققة %', 'مؤشر الأداء', 'مستوى التقييم', 'نقاط القوة', 'التوصيات']}
              emptyMsg="لا توجد تقييمات مسجلة لهذا المعلم."
              rows={qesReportData.map((r: any) => [
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.monthName}</span>,
                <span>{selYear}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.ev.totalScore}%</span>,
                <ProgressBar value={r.ev.totalScore} />,
                <PerfBadge perf={r.perf} />,
                <span style={{ fontSize: '0.72rem', color: '#374151' }}>{r.ev.strengths || '-'}</span>,
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{r.ev.recommendations || '-'}</span>,
              ])}
            />
          )}

          {/* 10. CLASSES: SUBJECTS REPORT */}
          {reportType === 'classes_subjects' && (
            <ReportTable
              headers={['#', 'المادة الدراسية', 'المعلمون النشطون', 'سجلات التقييم', 'إجمالي التقييمات', 'التسليمات', 'معدل الحل %', 'معدل التصحيح %', 'المعلقات', 'الدروس الرقمية']}
              emptyMsg="لا توجد مواد مسجلة."
              rows={SUBJECTS_LMS_STATS.map((s, idx) => [
                <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{s.name}</span>,
                <span style={{ fontWeight: 700 }}>{s.teachersCount}</span>,
                <span>{s.evalRecords}</span>,
                <span style={{ fontWeight: 700 }}>{s.evalsCount}</span>,
                <span>{s.submissions}</span>,
                <ProgressBar value={s.solveRate} />,
                <span style={{ fontWeight: 800, color: '#0284C7' }}>{s.gradingRate}%</span>,
                <span style={{ fontWeight: 800, color: s.ungraded > 20 ? '#EF4444' : '#10B981' }}>{s.ungraded}</span>,
                <span style={{ fontWeight: 800 }}>{s.lessonTotal} درس</span>,
              ])}
            />
          )}

          {/* 11. CLASSES: SECTIONS REPORT */}
          {reportType === 'classes_sections' && (
            <ReportTable
              headers={['#', 'الشعبة والفصل', 'المرحلة الدراسية', 'عدد الطلاب', 'إجمالي التقييمات', 'التسليمات', 'معدل الحل %', 'معدل التصحيح %', 'الترتيب المدرسي', 'التصنيف']}
              emptyMsg="لا توجد شعب مسجلة."
              rows={SECTIONS_LMS_STATS.map((s, idx) => [
                <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                <span style={{ fontWeight: 900, color: '#0F2044' }}>{s.section}</span>,
                <span style={{ color: '#64748B' }}>{s.grade}</span>,
                <span style={{ fontWeight: 700 }}>{s.studentsCount}</span>,
                <span>{s.evalCount}</span>,
                <span>{s.submissions}</span>,
                <ProgressBar value={s.solveRate} />,
                <span style={{ fontWeight: 800, color: '#0284C7' }}>{s.gradingRate}%</span>,
                <span style={{ fontWeight: 900, color: '#0F2044' }}>{s.rank}</span>,
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>{s.evalClass}</span>,
              ])}
            />
          )}

          {/* 12. CLASSES: GRADES REPORT */}
          {reportType === 'classes_grades' && (
            <ReportTable
              headers={['المستوى الدراسي', 'عدد الشعب', 'سجلات التقييم', 'المعلمون النشطون', 'التسليمات المستلمة', 'معدل الحل %', 'معدل التصحيح %', 'الدروس الرقمية المرفوعة']}
              emptyMsg="لا توجد بيانات."
              rows={GRADE_LEVEL_LMS_STATS.map(g => [
                <span style={{ fontWeight: 900, color: '#0F2044' }}>{g.grade}</span>,
                <span style={{ fontWeight: 700 }}>{g.sectionsCount} شعب</span>,
                <span>{g.evalRecords}</span>,
                <span style={{ fontWeight: 700 }}>{g.evalTeachers} معلمين</span>,
                <span>{g.submissions}</span>,
                <ProgressBar value={g.solveRate} />,
                <span style={{ fontWeight: 800, color: '#0284C7' }}>{g.gradingRate}%</span>,
                <span style={{ fontWeight: 800 }}>{g.totalLessons} درساً</span>,
              ])}
            />
          )}

          {/* 13. CLASSES: INTERVENTION REPORT */}
          {reportType === 'classes_intervention' && (
            <ReportTable
              headers={['#', 'مجال التدخل الأكاديمي', 'المادة المستهدفة', 'عدد الطلاب', 'الإجراء المتخذ', 'نسبة التحسن المرجوة', 'المسؤول', 'الحالة']}
              emptyMsg="لا توجد خطط مسجلة."
              rows={[
                [<span style={{ fontWeight: 700 }}>1</span>, <span style={{ fontWeight: 800, color: '#0F2044' }}>تصفير المعلقات والمتأخرات في الواجبات</span>, <span>الرياضيات واللغة الإنجليزية</span>, <span style={{ fontWeight: 800, color: '#EF4444' }}>14 طالباً</span>, <span>جلسات إرشاد وتخصيص ساعات إسناد مسائية عبر Teams</span>, <span style={{ fontWeight: 800, color: '#10B981' }}>+20%</span>, <span>معلمو المواد والمنسق</span>, <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>جارية</span>],
                [<span style={{ fontWeight: 700 }}>2</span>, <span style={{ fontWeight: 800, color: '#0F2044' }}>معالجة ضعف تسليم التقييمات الأسبوعية</span>, <span>الفيزياء والكيمياء</span>, <span style={{ fontWeight: 800, color: '#EF4444' }}>9 طلاب</span>, <span>إعادة فتح روابط التقييم وتوجيه رسائل SMS لأولياء الأمور</span>, <span style={{ fontWeight: 800, color: '#10B981' }}>+15%</span>, <span>النائب الأكاديمي ومنسق التعليم الإلكتروني</span>, <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>مكتملة جزئياً</span>],
                [<span style={{ fontWeight: 700 }}>3</span>, <span style={{ fontWeight: 800, color: '#0F2044' }}>دعم الطلاب الغائبين بعذر مرضي</span>, <span>كافة المواد الأكاديمية</span>, <span style={{ fontWeight: 800, color: '#EF4444' }}>6 طلاب</span>, <span>رفع التسجيلات المرئية للدروس ومشاركتها عبر المنصة</span>, <span style={{ fontWeight: 800, color: '#10B981' }}>+25%</span>, <span>منسق المشاريع</span>, <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>منفذة وموثقة</span>],
                [<span style={{ fontWeight: 700 }}>4</span>, <span style={{ fontWeight: 800, color: '#0F2044' }}>تفعيل مصادر التعلم التفاعلية</span>, <span>الأحياء والحاسوب</span>, <span style={{ fontWeight: 800, color: '#EF4444' }}>5 طلاب</span>, <span>إسناد مهام تفاعلية وبطاقات استكشافية رقمية</span>, <span style={{ fontWeight: 800, color: '#10B981' }}>+18%</span>, <span>معلمو المادة</span>, <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>قيد المتابعة</span>],
              ]}
            />
          )}

          {/* 14. PROFESSIONAL DEVELOPMENT: WORKSHOPS */}
          {reportType === 'pd_workshops' && (
            <ReportTable
              headers={['#', 'عنوان الورشة التدريبية', 'المستهدفون', 'التاريخ والمدة', 'ساعات التدريب', 'المقدم والمدرب', 'الحالة والتوثيق']}
              emptyMsg="لا توجد ورش تدريبية مسجلة."
              rows={(workshops.length > 0 ? workshops : [
                { title: 'استراتيجيات دمج الذكاء الاصطناعي في التعليم الرقمي', audience: 'كافة معلمي المدرسة', date: '2026-09-08', hours: 3, trainer: 'م. أحمد طبيشات' },
                { title: 'توظيف منصة Microsoft Teams وأدوات التقييم التكويني', audience: 'معلمو المواد العلمية', date: '2026-09-15', hours: 4, trainer: 'قسم التعليم الإلكتروني' },
                { title: 'إعداد وتصميم الدروس التفاعلية بنظام قطر للتعليم (QES)', audience: 'المعلمون الجدد والمنسقون', date: '2026-09-22', hours: 3, trainer: 'م. أحمد طبيشات' },
              ]).map((w: any, idx: number) => [
                <span style={{ fontWeight: 700 }}>{idx + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{w.titleAr || w.title || w.nameAr}</span>,
                <span>{w.audience || 'معلمو الأقسام الأكاديمية'}</span>,
                <span>{w.date || 'سبتمبر 2026'}</span>,
                <span style={{ fontWeight: 800, color: '#0284C7' }}>{w.hours || 3} ساعات</span>,
                <span style={{ fontWeight: 700 }}>{w.trainer || 'منسق المشاريع'}</span>,
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>منفذة وموثقة</span>,
              ])}
            />
          )}

          {/* 15. PROFESSIONAL DEVELOPMENT: INDIVIDUAL COACHING */}
          {reportType === 'pd_individual' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم الأكاديمي', 'المهارة التقنية / المحور', 'التاريخ والمدة', 'المخرجات العملية والتطبيق', 'المدرب المشرف']}
              emptyMsg="لا توجد جلسات تدريب فردي."
              rows={(individualPDRecords.length > 0 ? individualPDRecords : [
                { teacher: 'د. محمد حسن', dept: 'العلوم العامة', skill: 'توظيف محاكاة PhET واستيرادها إلى نظام قطر للتعليم', date: '2026-09-10', duration: '45 دقيقة', outcome: 'إنشاء 3 حصص تفاعلية بروابط استكشافية ومشاركتها مع الطلاب', trainer: 'م. أحمد طبيشات' },
                { teacher: 'أ. طارق عبدالمجيد', dept: 'اللغة الإنجليزية', skill: 'ربط نتائج قراءات منصة Achieve 3000 ببنك التقييمات', date: '2026-09-14', duration: '60 دقيقة', outcome: 'تطبيق اختبار تشخيصي وتحديد المستويات القرائية بدقة', trainer: 'م. أحمد طبيشات' },
                { teacher: 'أ. يوسف إبراهيم', dept: 'اللغة العربية', skill: 'تصميم أنشطة تقييم تكويني فورية عبر ClassPoint وForms', date: '2026-09-18', duration: '45 دقيقة', outcome: 'تفعيل الاستجابة السريعة وتصدير درجات المشاركة لحظياً', trainer: 'م. أحمد طبيشات' },
              ]).map((c: any, idx: number) => [
                <span style={{ fontWeight: 700 }}>{idx + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{c.teacher || c.traineeNameAr}</span>,
                <span>{c.dept || '-'}</span>,
                <span style={{ fontWeight: 700, color: '#0284C7' }}>{c.skill || c.skillProvided}</span>,
                <span>{c.date || c.trainingDate} ({c.duration || 'ساعة'})</span>,
                <span style={{ fontSize: '0.72rem', color: '#334155' }}>{c.outcome || c.notes}</span>,
                <span style={{ fontWeight: 700 }}>{c.trainer || 'منسق التعليم الإلكتروني'}</span>,
              ])}
            />
          )}

          {/* 16. MEEE CERTIFIED REPORT */}
          {reportType === 'pd_meee' && (
            <ReportTable
              headers={['#', 'اسم المعلم الخبير', 'القسم الأكاديمي', 'سنة الترشح والاعتماد', 'حالة الشهادة', 'المشاريع الرقمية وملف الإنجاز', 'الاعتماد الدولي']}
              emptyMsg="لا توجد بيانات MEEE."
              rows={(meeeRecords.length > 0 ? meeeRecords : [
                { name: 'م. أحمد طبيشات', dept: 'التعليم الإلكتروني والمشاريع', year: '2026-2027', status: 'خبير معتمد (Master MIE)', project: 'منظومة LMS الذكية والذكاء الاصطناعي في التعليم', org: 'Microsoft Worldwide' },
                { name: 'أ. خالد عبدالله', dept: 'تكنولوجيا المعلومات والحاسوب', year: '2026-2027', status: 'خبير معتمد (MIEE)', project: 'دمج Copilot في تدريس البرمجة والروبوت', org: 'Microsoft' },
                { name: 'د. محمد حسن', dept: 'العلوم العامة', year: '2026-2027', status: 'خبير معتمد (MIEE)', project: 'المحاكاة الافتراضية في الفيزياء والعلوم المتقدمة', org: 'Microsoft' },
                { name: 'أ. أحمد محمود', dept: 'الرياضيات', year: '2026-2027', status: 'خبير معتمد (MIEE)', project: 'النمذجة الرياضية التفاعلية الرقمية', org: 'Microsoft' },
              ]).map((m: any, idx: number) => [
                <span style={{ fontWeight: 700 }}>{idx + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{m.name || m.teacherNameAr}</span>,
                <span>{m.dept || m.departmentName}</span>,
                <span>{m.year || '2026-2027'}</span>,
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>{m.status}</span>,
                <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>{m.project}</span>,
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ {m.org || 'Microsoft Certified'}</span>,
              ])}
            />
          )}

          {/* 17. SELF DEVELOPMENT REPORT (COORDINATOR) */}
          {reportType === 'pd_self' && (
            <ReportTable
              headers={['#', 'عنوان الشهادة / الدورة التدريبية', 'الجهة المانحة', 'التاريخ', 'ساعات التدريب', 'المجال التخصصي', 'رقم الاعتماد / الرابط', 'حالة الاعتماد']}
              emptyMsg="لا توجد سجلات تطوير ذاتي."
              rows={(selfDevRecords || []).map((s, idx) => [
                <span style={{ fontWeight: 700 }}>{idx + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{s.title}</span>,
                <span style={{ fontWeight: 700, color: '#0284C7' }}>{s.issuer}</span>,
                <span>{s.issueDate}</span>,
                <span style={{ fontWeight: 800, color: '#10B981' }}>{s.hours} ساعة</span>,
                <span style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{s.category}</span>,
                <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#64748B' }}>{s.credentialId || 'VERIFIED-ONLINE'}</span>,
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ معتمد رسمياً</span>,
              ])}
            />
          )}

          {/* 18. EVENTS & MEETINGS (16 OFFICIAL ACTIVITIES) */}
          {reportType === 'events_meetings' && (
            <ReportTable
              headers={['#', 'العنوان والموضوع', 'التصنيف', 'النوع', 'المقر والمكان', 'التاريخ والوقت', 'المستهدفون', 'طبيعة النشاط', 'الحالة']}
              emptyMsg="لا توجد فعاليات مسجلة."
              rows={eventsItems.map((e, idx) => {
                const catConf = EVENT_CATEGORY_CONFIG[e.category] || { label: e.category, color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD', icon: '💼' };
                const typeConf = EVENT_TYPE_CONFIG[e.type] || { label: e.type, color: '#0F2044', bg: '#F1F5F9', border: '#CBD5E1', icon: '🏢' };
                const statConf = EVENT_STATUS_CONFIG[e.status] || { label: e.status, color: '#16A34A', bg: '#DCFCE7', icon: '✓' };
                return [
                  <span style={{ fontWeight: 700, color: '#64748B' }}>{idx + 1}</span>,
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0F2044' }}>{e.title}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>المنسق: {e.organizer}</div>
                  </div>,
                  <span style={{ background: catConf.bg, color: catConf.color, border: `1px solid ${catConf.border}`, padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    {catConf.icon} {catConf.label}
                  </span>,
                  <span style={{ background: typeConf.bg, color: typeConf.color, border: `1px solid ${typeConf.border}`, padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                    {typeConf.icon} {typeConf.label}
                  </span>,
                  <span style={{ color: '#334155', fontWeight: 600 }}>{e.location}</span>,
                  <div style={{ fontSize: '0.7rem' }}>
                    <div>{e.date}</div>
                    <div style={{ color: '#64748B' }}>{e.time}</div>
                  </div>,
                  <span style={{ fontSize: '0.7rem', color: '#475569' }}>{e.targetAudience}</span>,
                  <span style={{ fontWeight: 700, color: '#0F2044' }}>{e.nature}</span>,
                  <span style={{ background: statConf.bg, color: statConf.color, border: `1px solid ${statConf.color}40`, padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 800 }}>
                    {statConf.icon} {statConf.label}
                  </span>,
                ];
              })}
            />
          )}

          {/* 19. E-LEARNING SMS */}
          {reportType === 'elearning_sms' && (
            <ReportTable
              headers={['#', 'فئة الرسالة', 'نص وموضوع الإشعار', 'الفئة المستهدفة', 'تاريخ الإرسال', 'العدد الإجمالي', 'نسبة التسليم']}
              emptyMsg="لا توجد رسائل مسجلة."
              rows={[
                [<span style={{ fontWeight: 700 }}>1</span>, <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>تنبيه أكاديمي</span>, <span>إشعار أولياء الأمور بموعد تسليم الواجبات الإلكترونية للرياضيات</span>, <span>أولياء أمور الصف العاشر</span>, <span>2026-09-12</span>, <span>80 ولي أمر</span>, <span style={{ fontWeight: 800, color: '#16A34A' }}>100%</span>],
                [<span style={{ fontWeight: 700 }}>2</span>, <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>تقييم أسبوعي</span>, <span>تنبيه بدء التقييم التكويني الإلكتروني لمادة الفيزياء عبر المنصة</span>, <span>طلاب الصف الحادي عشر</span>, <span>2026-09-18</span>, <span>80 طالباً</span>, <span style={{ fontWeight: 800, color: '#16A34A' }}>98.8%</span>],
                [<span style={{ fontWeight: 700 }}>3</span>, <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>تهنئة وتكريم</span>, <span>تهنئة الطلاب الحاصلين على العلامات الكاملة في تقييمات نظام قطر</span>, <span>الطلاب المتفوقون</span>, <span>2026-09-25</span>, <span>35 طالباً</span>, <span style={{ fontWeight: 800, color: '#16A34A' }}>100%</span>],
              ]}
            />
          )}

          {/* 20. TAKREEM & HONORS */}
          {reportType === 'takreem_honors' && (
            <ReportTable
              headers={['#', 'المعلم المكرم', 'القسم الأكاديمي', 'الشهر المكرم فيه', 'الدرجة المحققة', 'وسام الاستحقاق', 'الاعتماد والتوقيع']}
              emptyMsg="لا يوجد مكرمون مسجلون."
              rows={honorees.map((h, idx) => [
                <span style={{ fontWeight: 700 }}>{idx + 1}</span>,
                <span style={{ fontWeight: 900, color: '#0F2044' }}>{h.teacherNameAr}</span>,
                <span style={{ fontWeight: 700 }}>{h.departmentName}</span>,
                <span>{h.month} {h.year}</span>,
                <span style={{ fontWeight: 900, color: '#10B981', fontSize: '0.9rem' }}>{h.totalScore}%</span>,
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>🎖️ معلم الشهر المتميز</span>,
                <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ معتمد رسمياً</span>,
              ])}
            />
          )}

          {/* 21. EXECUTIVE ALL-IN-ONE REPORT */}
          {reportType === 'executive_all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                <h5 style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F2044', margin: '0 0 0.5rem' }}>
                  📌 الخلاصة التنفيذية لأداء منظومة التعليم الإلكتروني بالمدرسة
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  تُظهر مؤشرات العام الأكاديمي {selYear} تفاعلاً استثنائياً لمنظومة التعلم الرقمي بنسبة إتقان عامة بلغت 88.5%، ونسبة إنجاز للخطة الإجرائية بلغت 78% عبر {opPlan?.actions.length || 23} إجراءً ومبادرة نوعية. كما تم توثيق {modelLessonEvals.length} حصة إلكترونية مقيمة، و{modelLessonSchedules.length} حصة مجدولة للفصل الدراسي، وتغطية 13 مادة دراسية و8 شعب صفية بانتظام كامل، إضافة إلى 16 فعالية واجتماعاً رسمياً معتمداً.
                </p>
              </div>

              {/* Sub-table 1: Highest Performing Departments */}
              <div>
                <h5 style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F2044', marginBottom: '0.5rem' }}>
                  🏆 أعلى الأقسام الأكاديمية تفاعلاً بنظام قطر للتعليم (LMS)
                </h5>
                <ReportTable
                  headers={['#', 'القسم الأكاديمي', 'عدد المعلمين', 'متوسط الأداء %', 'المؤشر', 'المستوى']}
                  emptyMsg="لا توجد بيانات متاحة."
                  rows={departments.slice(0, 6).map((d, i) => [
                    <span style={{ fontWeight: 700 }}>{i + 1}</span>,
                    <span style={{ fontWeight: 800, color: '#0F2044' }}>{d.nameAr}</span>,
                    <span>{teachers.filter(t => t.departmentId === d.id).length} معلمين</span>,
                    <span style={{ fontWeight: 900, color: '#10B981' }}>{92 - i * 2}%</span>,
                    <ProgressBar value={92 - i * 2} />,
                    <PerfBadge perf={getPerformanceLevel(92 - i * 2)} />,
                  ])}
                />
              </div>

              {/* Sub-table 2: Top Class Sections */}
              <div>
                <h5 style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F2044', marginBottom: '0.5rem' }}>
                  🏢 مؤشرات تفاعل الشعب والفصول الدراسية
                </h5>
                <ReportTable
                  headers={['الشعبة', 'الصف', 'عدد الطلاب', 'إجمالي التقييمات', 'التسليمات', 'معدل الحل %', 'المستوى']}
                  emptyMsg="لا توجد بيانات."
                  rows={SECTIONS_LMS_STATS.map(s => [
                    <span style={{ fontWeight: 900, color: '#0F2044' }}>{s.section}</span>,
                    <span>{s.grade}</span>,
                    <span>{s.studentsCount}</span>,
                    <span>{s.evalCount}</span>,
                    <span>{s.submissions}</span>,
                    <ProgressBar value={s.solveRate} />,
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.7rem' }}>{s.evalClass}</span>,
                  ])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Official Verified Signatures Footer */}
        <OfficialSignaturesFooter />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. GLOBAL PRINT STYLES (A3 LANDSCAPE 0 MARGINS)
          ══════════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        @media print {
          @page {
            size: A3 landscape !important;
            margin: 0 !important;
          }
          html, body {
            width: 420mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, aside, .topbar, .sidebar, nav {
            display: none !important;
          }
          .printable-report { 
            border: none !important; 
            padding: 10mm 14mm !important; 
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 420mm !important;
            position: relative !important; 
            min-height: auto !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
