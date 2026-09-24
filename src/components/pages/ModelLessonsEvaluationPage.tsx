'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { db, ACADEMIC_YEARS, getDeptName, generateId, SCHOOL_NAME, getUserDeptIds } from '@/lib/data';
import type { User, Teacher, Department, ModelLessonEvaluation, ModelLessonScheduleItem } from '@/lib/data';
import { invalidateCache } from '@/lib/firestoreDb';
import { RichBulletTextarea, FormattedReportPoints } from '@/components/RichBulletTextarea';
import * as XLSX from 'xlsx';
import {
  generateIcsForLesson,
  generateBulkIcsForLessons,
  getOutlookWebCalendarUrl,
  getOutlookLiveCalendarUrl,
  getGoogleCalendarUrl,
  downloadIcsFile,
  getPeriodTiming,
  SCHOOL_PERIOD_TIMINGS,
} from '@/lib/outlookCalendar';

interface Props {
  currentUser: User;
  selectedYear?: string;
}

const PRESET_TOOLS = [
  { id: 'lms', name: 'نظام قطر للتعليم (LMS)', icon: '📚' },
  { id: 'teams', name: 'Microsoft Teams', icon: '👥' },
  { id: 'classpoint', name: 'ClassPoint', icon: '✨' },
  { id: 'classdojo', name: 'ClassDojo', icon: '👾' },
  { id: 'edpuzzle', name: 'Edpuzzle', icon: '🎬' },
  { id: 'achieve3000', name: 'Achieve 3000', icon: '📖' },
  { id: 'ap_collegeboard', name: 'AP College Board', icon: '🎓' },
  { id: 'ixl', name: 'IXL Learning', icon: '💡' },
  { id: 'gizmos', name: 'Gizmos Simulations', icon: '🧪' },
  { id: 'eboard', name: 'E-Board Projector', icon: '🖥️' },
  { id: 'phet', name: 'PhET Simulations', icon: '🔬' },
  { id: 'nearpod', name: 'Nearpod', icon: '🎯' },
  { id: 'onenote', name: 'OneNote Class Notebook', icon: '📓' },
  { id: 'geogebra', name: 'GeoGebra', icon: '📐' },
  { id: 'kahoot', name: 'Kahoot!', icon: '🏆' },
  { id: 'quizizz', name: 'Quizizz', icon: '⚡' },
  { id: 'padlet', name: 'Padlet', icon: '📌' },
  { id: 'canva', name: 'Canva Education', icon: '🎨' },
  { id: 'forms', name: 'Microsoft Forms', icon: '📝' },
  { id: 'ai', name: 'أدوات الذكاء الاصطناعي (AI Tools)', icon: '🤖' },
  { id: 'desmos', name: 'Desmos Graphing', icon: '📈' },
  { id: 'minecraft', name: 'Minecraft Education', icon: '🧱' },
  { id: 'powerpoint', name: 'PowerPoint Interactive', icon: '📊' },
  { id: 'wordwall', name: 'Wordwall', icon: '🎮' },
];

const PREDEFINED_STRENGTHS = [
  { label: 'استخدام متميز لأدوات الذكاء الاصطناعي', value: 'الاستخدام المتميز لأدوات الذكاء الاصطناعي في التعليم' },
  { label: 'تفاعل ومشاركة فعالة من الطلاب', value: 'التفاعل الإيجابي والمشاركة الفعالة من الطلاب' },
  { label: 'دمج التقنية لخدمة أهداف الدرس', value: 'دمج التقنية بشكل يخدم أهداف الدرس (SAMR)' },
  { label: 'إدارة فعالة للصف رقمياً', value: 'الإدارة الفعالة للصف وتوجيه الطلاب رقمياً' },
  { label: 'تغذية راجعة فورية', value: 'التغذية الراجعة الفورية باستخدام أدوات التقويم الرقمية' },
  { label: 'لا يوجد', value: 'لا يوجد' }
];

const PREDEFINED_IMPROVEMENTS = [
  { label: 'تنويع أدوات التقويم', value: 'تنويع أدوات التقويم الرقمية لتشمل مستويات تفكير عليا' },
  { label: 'إعطاء مساحة للمشاركة الرقمية', value: 'إعطاء مساحة أكبر للطلاب للتعبير والمشاركة الرقمية' },
  { label: 'تفعيل التعاون الرقمي', value: 'تفعيل أدوات التعاون الرقمي بين الطلاب بشكل أعمق' },
  { label: 'إدارة الوقت للأنشطة', value: 'إدارة الوقت المخصص للأنشطة الرقمية بشكل أفضل' },
  { label: 'لا يوجد', value: 'لا يوجد' }
];

const PREDEFINED_RECOMMENDATIONS = [
  { label: 'مشاركة الممارسات مع الزملاء', value: 'مشاركة الممارسات التقنية المتميزة مع زملاء القسم' },
  { label: 'الاطلاع على مستجدات الذكاء الاصطناعي', value: 'الاطلاع على المستجدات في أدوات الذكاء الاصطناعي وتطبيقها' },
  { label: 'تبادل الزيارات', value: 'تبادل الزيارات مع المعلمين المتميزين تقنياً' },
  { label: 'لا يوجد', value: 'لا يوجد' }
];

const CRITERIA_DEFINITIONS = [
  {
    id: 'score1',
    num: 1,
    titleAr: 'التقويم والتغذية الراجعة باستخدام التقنية',
    titleEn: 'Assessment & Feedback with Technology',
    desc: 'توظيف أدوات التقييم الإلكتروني التكويني والختامي وتقديم تغذية راجعة فورية ومباشرة للطلاب.',
  },
  {
    id: 'score2',
    num: 2,
    titleAr: 'عمق توظيف التقنية (SAMR / TPACK)',
    titleEn: 'Depth of Tech Integration (SAMR / TPACK)',
    desc: 'دمج التكنولوجيا في تعزيز نواتج التعلم وتعديل وتطوير المهام التعليمية بما يفوق الطرق التقليدية.',
  },
  {
    id: 'score3',
    num: 3,
    titleAr: 'تنظيم نظام إدارة التعلّم ووضوح المواد',
    titleEn: 'LMS Organization & Materials Clarity',
    desc: 'جاهزية الدرس على نظام قطر للتعليم LMS ووضوح المصادر والأنشطة والواجبات والتسلسل المنطقي.',
  },
  {
    id: 'score4',
    num: 4,
    titleAr: 'إدارة الصف وتوجيه الطلاب باستخدام التقنية',
    titleEn: 'Classroom Management with Technology',
    desc: 'إدارة الوقت والانضباط الرقمي ومتابعة التزام الطلاب بالاستخدام الآمن والفعال للأجهزة والمنصات.',
  },
  {
    id: 'score5',
    num: 5,
    titleAr: 'تقييم تفاعل ومشاركة الطلاب رقميًا',
    titleEn: 'Student Digital Engagement Rating',
    desc: 'مدى انخراط وتفاعل الطلاب الفردي والجماعي في الأنشطة الرقمية والتفاعل التشاركي التفاعلي.',
  },
  {
    id: 'score6',
    num: 6,
    titleAr: 'تمكن واستخدام المعلم للأدوات الرقمية',
    titleEn: 'Teacher Digital Tools Mastery & Rating',
    desc: 'مهارة المعلم وسلاسته في تشغيل واستعراض التطبيقات والمنصات التفاعلية وحل المشكلات التقنية.',
  },
];

export default function ModelLessonsEvaluationPage({ currentUser, selectedYear: propYear }: Props) {
  const isAdmin = currentUser.role === 'admin';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [evaluations, setEvaluations] = useState<ModelLessonEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active sub-tab: 'form' | 'schedule' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'schedule' | 'history'>('schedule');

  // Schedule State
  const [schedules, setSchedules] = useState<ModelLessonScheduleItem[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ModelLessonScheduleItem | null>(null);
  const [calendarLesson, setCalendarLesson] = useState<ModelLessonScheduleItem | null>(null);
  const [calendarReminderMins, setCalendarReminderMins] = useState<number>(15);

  // Schedule Form State
  const [schedTeacherId, setSchedTeacherId] = useState('');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedPeriod, setSchedPeriod] = useState('1');
  const [schedClassGrade, setSchedClassGrade] = useState('10-1');
  const [schedSubject, setSchedSubject] = useState('');
  const [schedLessonTopic, setSchedLessonTopic] = useState('');
  const [schedTools, setSchedTools] = useState<string[]>(['نظام قطر للتعليم (LMS)', 'ClassPoint']);
  const [schedCustomTool, setSchedCustomTool] = useState('');
  const [schedVenue, setSchedVenue] = useState('الصف الدراسي');
  const [schedStatus, setSchedStatus] = useState<'مجدولة' | 'تم التنفيذ' | 'مؤجلة' | 'ملغاة'>('مجدولة');
  const [schedNotes, setSchedNotes] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Schedule Filter State
  const [filterScheduleDept, setFilterScheduleDept] = useState('');
  const [filterScheduleTeacher, setFilterScheduleTeacher] = useState('');
  const [filterScheduleYear, setFilterScheduleYear] = useState(propYear || '');
  const [filterScheduleStatus, setFilterScheduleStatus] = useState('');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');

  // Form State
  const currentYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState(propYear || currentYear);
  const [teacherId, setTeacherId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('1');
  const [classGrade, setClassGrade] = useState('10');

  // New Fields: OneDrive Link & Attendees
  const [lessonPlanUrl, setLessonPlanUrl] = useState('');
  const [attendees, setAttendees] = useState('');

  // Tools state (selected chips + custom input)
  const [selectedTools, setSelectedTools] = useState<string[]>(['نظام قطر للتعليم (LMS)', 'Microsoft Teams']);
  const [customToolText, setCustomToolText] = useState('');

  // 6 Criteria scores
  const [scoreAssessmentFeedback, setScoreAssessmentFeedback] = useState<number>(10);
  const [scoreTechDepth, setScoreTechDepth] = useState<number>(10);
  const [scoreLmsClarity, setScoreLmsClarity] = useState<number>(10);
  const [scoreClassroomMgmt, setScoreClassroomMgmt] = useState<number>(10);
  const [scoreStudentEngagement, setScoreStudentEngagement] = useState<number>(10);
  const [scoreTeacherTools, setScoreTeacherTools] = useState<number>(10);

  // Summary & Feedback
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [teacherSignature, setTeacherSignature] = useState('');

  // Auto-Save & Manual Save Status
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [saveSuccessModal, setSaveSuccessModal] = useState<boolean>(false);
  const [sendReportModal, setSendReportModal] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // History Filter State
  const [filterDept, setFilterDept] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterYear, setFilterYear] = useState(propYear || '');
  const [searchQuery, setSearchQuery] = useState('');

  const coordDepts = getUserDeptIds(currentUser);
  const isCoord = currentUser.role === 'coordinator';

  // Load Data
  const reloadData = async () => {
    try {
      const [tList, dList, eList, sList] = await Promise.all([
        db.getTeachers(),
        db.getDepartments(),
        db.getModelLessonEvaluations(),
        db.getModelLessonSchedules().catch(() => []),
      ]);
      setTeachers(tList);
      setDepartments(dList);
      setEvaluations(eList);
      setSchedules(sList);
    } catch (err) {
      console.error('Error loading model lesson evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (propYear) {
      setAcademicYear(propYear);
      setFilterYear(propYear);
    }
  }, [propYear]);

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Helper for Arabic Day Name
  function getArabicDay(dateStr: string): string {
    if (!dateStr) return '';
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  }

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filterScheduleYear && s.academicYear !== filterScheduleYear) return false;
      if (filterScheduleDept && s.departmentId !== filterScheduleDept) return false;
      if (filterScheduleTeacher && s.teacherId !== filterScheduleTeacher) return false;
      if (filterScheduleStatus && s.status !== filterScheduleStatus) return false;
      if (scheduleSearchQuery.trim()) {
        const q = scheduleSearchQuery.toLowerCase();
        const match =
          (s.teacherNameAr || '').toLowerCase().includes(q) ||
          (s.subject || '').toLowerCase().includes(q) ||
          (s.lessonTopic || '').toLowerCase().includes(q) ||
          (s.toolsPlanned || '').toLowerCase().includes(q) ||
          (s.classGrade || '').toLowerCase().includes(q) ||
          (s.roomVenue || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.period || '').localeCompare(b.period || ''));
  }, [schedules, filterScheduleYear, filterScheduleDept, filterScheduleTeacher, filterScheduleStatus, scheduleSearchQuery]);

  const scheduleStats = useMemo(() => {
    const total = filteredSchedules.length;
    const completed = filteredSchedules.filter(s => s.status === 'تم التنفيذ').length;
    const scheduled = filteredSchedules.filter(s => s.status === 'مجدولة').length;
    const distinctTeachers = new Set(filteredSchedules.map(s => s.teacherId)).size;
    return { total, completed, scheduled, distinctTeachers };
  }, [filteredSchedules]);

  const handleOpenNewScheduleModal = () => {
    setEditingScheduleItem(null);
    const firstT = availableTeachers[0];
    setSchedTeacherId(firstT?.id || '');
    setSchedSubject(firstT?.subject || '');
    setSchedDate(new Date().toISOString().split('T')[0]);
    setSchedPeriod('1');
    setSchedClassGrade('10-1');
    setSchedLessonTopic('');
    setSchedTools(['نظام قطر للتعليم (LMS)', 'ClassPoint']);
    setSchedCustomTool('');
    setSchedVenue('الصف الدراسي');
    setSchedStatus('مجدولة');
    setSchedNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleEditScheduleModal = (item: ModelLessonScheduleItem) => {
    setEditingScheduleItem(item);
    setSchedTeacherId(item.teacherId);
    setSchedSubject(item.subject || '');
    setSchedDate(item.date);
    setSchedPeriod(item.period);
    setSchedClassGrade(item.classGrade);
    setSchedLessonTopic(item.lessonTopic);
    setSchedTools(item.toolsPlanned ? item.toolsPlanned.split(',').map(s => s.trim()).filter(Boolean) : []);
    setSchedCustomTool('');
    setSchedVenue(item.roomVenue || 'الصف الدراسي');
    setSchedStatus(item.status);
    setSchedNotes(item.notes || '');
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (andAddToCalendar: boolean = false) => {
    if (!schedTeacherId) {
      showToast('يرجى اختيار المعلم', 'error');
      return;
    }
    const teacher = teachers.find(t => t.id === schedTeacherId);
    if (!teacher) {
      showToast('المعلم المحدد غير صالح', 'error');
      return;
    }
    setSavingSchedule(true);
    try {
      const docId = editingScheduleItem?.id || generateId();
      const allTools = [...schedTools];
      if (schedCustomTool.trim() && !allTools.includes(schedCustomTool.trim())) {
        allTools.push(schedCustomTool.trim());
      }

      const scheduleObj: ModelLessonScheduleItem = {
        id: docId,
        teacherId: teacher.id,
        teacherNameAr: teacher.nameAr,
        teacherNameEn: teacher.nameEn,
        departmentId: teacher.departmentId,
        departmentName: getDeptName(teacher.departmentId, departments),
        subject: schedSubject || teacher.subject,
        academicYear: academicYear,
        date: schedDate,
        dayName: getArabicDay(schedDate),
        period: schedPeriod,
        classGrade: schedClassGrade,
        lessonTopic: schedLessonTopic,
        toolsPlanned: allTools.join(', '),
        roomVenue: schedVenue,
        notes: schedNotes,
        status: schedStatus,
        evaluatorId: currentUser.id,
        evaluatorName: currentUser.name,
        createdAt: editingScheduleItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.saveModelLessonSchedule(scheduleObj);
      invalidateCache('modelLessonSchedules');

      setSchedules(prev => {
        const idx = prev.findIndex(s => s.id === docId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = scheduleObj;
          return updated;
        }
        return [scheduleObj, ...prev];
      });

      setIsScheduleModalOpen(false);
      showToast(editingScheduleItem ? '✅ تم تحديث جدول الحصة بنجاح' : '✅ تم إضافة الحصة إلى الجدول بنجاح', 'success');

      if (andAddToCalendar) {
        setCalendarLesson(scheduleObj);
        setCalendarReminderMins(15);
      }
    } catch (err) {
      console.error('Save schedule error:', err);
      showToast('حدث خطأ أثناء حفظ الجدول', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذه الحصة من الجدول نهائياً؟')) return;
    try {
      await db.deleteModelLessonSchedule(id);
      invalidateCache('modelLessonSchedules');
      setSchedules(prev => prev.filter(s => s.id !== id));
      showToast('✅ تم حذف الحصة من الجدول بنجاح', 'success');
    } catch (err) {
      console.error('Delete schedule error:', err);
      showToast('حدث خطأ أثناء حذف الحصة', 'error');
    }
  };

  const handleStartEvaluationFromSchedule = (item: ModelLessonScheduleItem) => {
    setEditingId(null);
    setTeacherId(item.teacherId);
    setSelectedDeptId(item.departmentId);
    setDate(item.date);
    setPeriod(item.period);
    setClassGrade(item.classGrade);
    const toolsArr = item.toolsPlanned ? item.toolsPlanned.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedTools(toolsArr.length ? toolsArr : ['نظام قطر للتعليم (LMS)']);
    setActiveSubTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('✨ تم تجهيز استمارة التقييم للمعلم ' + item.teacherNameAr + ' - الحصة ' + item.period, 'info');
  };

  const exportScheduleToExcel = () => {
    if (!filteredSchedules.length) {
      showToast('لا توجد حصص لتصديرها', 'error');
      return;
    }
    const data = filteredSchedules.map((s, idx) => ({
      '#': idx + 1,
      'اليوم': s.dayName || getArabicDay(s.date),
      'التاريخ': s.date,
      'الحصة': `الحصة ${s.period}${SCHOOL_PERIOD_TIMINGS[String(s.period)] ? ` (${SCHOOL_PERIOD_TIMINGS[String(s.period)].startTime} - ${SCHOOL_PERIOD_TIMINGS[String(s.period)].endTime})` : ''}`,
      'اسم المعلم': s.teacherNameAr,
      'القسم': s.departmentName || getDeptName(s.departmentId, departments),
      'المادة': s.subject || '-',
      'الصف والشعبة': s.classGrade,
      'موضوع / عنوان الحصة': s.lessonTopic || '-',
      'الأدوات الرقمية المخططة': s.toolsPlanned || '-',
      'القاعة / المكان': s.roomVenue || '-',
      'حالة الحصة': s.status,
      'ملاحظات': s.notes || '-',
      'العام الدراسي': s.academicYear,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جدول الحصص النموذجية');
    XLSX.writeFile(wb, 'جدول_حصص_التعليم_الإلكتروني_' + academicYear + '.xlsx');
    showToast('✅ تم تصدير جدول الحصص إلى Excel بنجاح', 'success');
  };

  const handleExportAllToOutlook = () => {
    if (!filteredSchedules.length) {
      showToast('لا توجد حصص مجدولة لتصديرها للتقويم', 'error');
      return;
    }
    const icsContent = generateBulkIcsForLessons(filteredSchedules, 15);
    const filename = `جدول_حصص_التعليم_الإلكتروني_Outlook_${academicYear}.ics`;
    downloadIcsFile(filename, icsContent);
    showToast(`✅ تم تصدير ${filteredSchedules.length} حصة إلى ملف تقويم Outlook بنجاح!`, 'success');
  };

  // Filter available teachers
  const availableTeachers = useMemo(() => {
    let list = teachers.filter(t => t.status === 'active');
    if (isCoord && coordDepts.length > 0) {
      list = list.filter(t => coordDepts.includes(t.departmentId));
    }
    if (selectedDeptId) {
      list = list.filter(t => t.departmentId === selectedDeptId);
    }
    return list;
  }, [teachers, isCoord, coordDepts, selectedDeptId]);

  // Selected teacher object
  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === teacherId);
  }, [teachers, teacherId]);

  // Handle Teacher selection
  const handleTeacherChange = (tid: string) => {
    if (!isAdmin) return;
    setTeacherId(tid);
    const t = teachers.find(item => item.id === tid);
    if (t) {
      setSelectedDeptId(t.departmentId);
      setTeacherSignature(t.nameAr);
    }
  };

  // Score mapping helper
  const getScoreValue = (num: number) => {
    switch (num) {
      case 1: return scoreAssessmentFeedback;
      case 2: return scoreTechDepth;
      case 3: return scoreLmsClarity;
      case 4: return scoreClassroomMgmt;
      case 5: return scoreStudentEngagement;
      case 6: return scoreTeacherTools;
      default: return 10;
    }
  };

  const setScoreValue = (num: number, val: number) => {
    const clamped = Math.min(10, Math.max(0, val));
    switch (num) {
      case 1: setScoreAssessmentFeedback(clamped); break;
      case 2: setScoreTechDepth(clamped); break;
      case 3: setScoreLmsClarity(clamped); break;
      case 4: setScoreClassroomMgmt(clamped); break;
      case 5: setScoreStudentEngagement(clamped); break;
      case 6: setScoreTeacherTools(clamped); break;
    }
  };

  // Calculate Overall Score (Average of 6 criteria)
  const overallScore = useMemo(() => {
    const scores = [
      scoreAssessmentFeedback || 0,
      scoreTechDepth || 0,
      scoreLmsClarity || 0,
      scoreClassroomMgmt || 0,
      scoreStudentEngagement || 0,
      scoreTeacherTools || 0,
    ];
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / 6) * 10) / 10;
  }, [
    scoreAssessmentFeedback,
    scoreTechDepth,
    scoreLmsClarity,
    scoreClassroomMgmt,
    scoreStudentEngagement,
    scoreTeacherTools,
  ]);

  const criteriaScoreSum = useMemo(() => {
    const scores = [
      scoreAssessmentFeedback || 0,
      scoreTechDepth || 0,
      scoreLmsClarity || 0,
      scoreClassroomMgmt || 0,
      scoreStudentEngagement || 0,
      scoreTeacherTools || 0,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) * 10) / 10;
  }, [
    scoreAssessmentFeedback,
    scoreTechDepth,
    scoreLmsClarity,
    scoreClassroomMgmt,
    scoreStudentEngagement,
    scoreTeacherTools,
  ]);


  const getPerformanceBadge = (score: number) => {
    if (score >= 9) return { label: 'ممتاز / Excellent', color: '#10B981', bg: 'rgba(16,185,129,0.15)' };
    if (score >= 8) return { label: 'جيد جداً / Very Good', color: '#0096C7', bg: 'rgba(0,150,199,0.15)' };
    if (score >= 6.5) return { label: 'جيد / Good', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' };
    return { label: 'يحتاج متابعة / Needs Improvement', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' };
  };

  // Toggle Tool Preset
  const toggleTool = (toolName: string) => {
    if (!isAdmin) return;
    setSelectedTools(prev =>
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
  };

  // Add Custom Tool
  const handleAddCustomTool = () => {
    if (!isAdmin) return;
    const trimmed = customToolText.trim();
    if (!trimmed) return;
    if (!selectedTools.includes(trimmed)) {
      setSelectedTools(prev => [...prev, trimmed]);
    }
    setCustomToolText('');
  };

  // Explicit Save & Complete Evaluation
  const handleSaveEvaluation = async (isManual = true) => {
    if (!isAdmin) return;
    if (!teacherId) {
      showToast('⚠️ يرجى اختيار اسم المعلم أولاً لحفظ التقييم', 'error');
      return;
    }

    const t = teachers.find(item => item.id === teacherId);
    if (!t) return;
    const deptName = getDeptName(t.departmentId, departments);

    setAutoSaveStatus('saving');

    const evalObj: ModelLessonEvaluation = {
      id: editingId || generateId(),
      teacherId: t.id,
      teacherNameAr: t.nameAr,
      teacherNameEn: t.nameEn,
      departmentId: t.departmentId,
      departmentName: deptName,
      academicYear,
      date,
      period,
      classGrade,
      toolsUsed: selectedTools.join(' • '),
      scoreAssessmentFeedback: Number(scoreAssessmentFeedback) || 0,
      scoreTechDepth: Number(scoreTechDepth) || 0,
      scoreLmsClarity: Number(scoreLmsClarity) || 0,
      scoreClassroomMgmt: Number(scoreClassroomMgmt) || 0,
      scoreStudentEngagement: Number(scoreStudentEngagement) || 0,
      scoreTeacherTools: Number(scoreTeacherTools) || 0,
      overallScore,
      strengths,
      improvements,
      recommendations,
      lessonPlanUrl: lessonPlanUrl.trim(),
      attendees: attendees.trim(),
      teacherSignature: teacherSignature || t.nameAr,
      academicDeputySignature: 'د. راني التوم',
      eProjectsCoordSignature: 'م. أحمد طبيشات',
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      createdAt: editingId ? (evaluations.find(e => e.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const savedId = await db.saveModelLessonEvaluation(evalObj);
      if (!editingId) {
        setEditingId(savedId);
      }
      setAutoSaveStatus('saved');
      const nowStr = new Date().toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(nowStr);
      await reloadData();

      if (isManual) {
        setSaveSuccessModal(true);
        showToast(`✅ تم حفظ واعتماد تقييم المعلم (${t.nameAr}) بنجاح في Firebase`, 'success');
      }
    } catch (err) {
      console.error('Save error:', err);
      setAutoSaveStatus('error');
      if (isManual) {
        showToast('❌ حدث خطأ أثناء الحفظ في قاعدة البيانات', 'error');
      }
    }
  };

  // Debounced Auto-Save
  useEffect(() => {
    if (!isAdmin || !teacherId || loading) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveEvaluation(false);
    }, 1800);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    isAdmin,
    teacherId,
    selectedDeptId,
    date,
    period,
    classGrade,
    selectedTools,
    scoreAssessmentFeedback,
    scoreTechDepth,
    scoreLmsClarity,
    scoreClassroomMgmt,
    scoreStudentEngagement,
    scoreTeacherTools,
    strengths,
    improvements,
    recommendations,
    lessonPlanUrl,
    attendees,
    teacherSignature,
  ]);

  // Reset Form
  const resetForm = () => {
    if (!isAdmin) return;
    setEditingId(null);
    setTeacherId('');
    setSelectedDeptId('');
    setDate(new Date().toISOString().split('T')[0]);
    setPeriod('1');
    setClassGrade('10');
    setLessonPlanUrl('');
    setAttendees('');
    setSelectedTools(['نظام قطر للتعليم (LMS)', 'Microsoft Teams']);
    setCustomToolText('');
    setScoreAssessmentFeedback(10);
    setScoreTechDepth(10);
    setScoreLmsClarity(10);
    setScoreClassroomMgmt(10);
    setScoreStudentEngagement(10);
    setScoreTeacherTools(10);
    setStrengths('');
    setImprovements('');
    setRecommendations('');
    setTeacherSignature('');
    setAutoSaveStatus('idle');
    setSaveSuccessModal(false);
    showToast('تم تفريغ النموذج لتقييم جديد', 'info');
  };

  // View / Edit from history
  const handleViewOrEdit = (ev: ModelLessonEvaluation) => {
    setEditingId(ev.id);
    setAcademicYear(ev.academicYear || currentYear);
    setTeacherId(ev.teacherId);
    setSelectedDeptId(ev.departmentId);
    setDate(ev.date);
    setPeriod(ev.period || '1');
    setClassGrade(ev.classGrade || '10');
    setLessonPlanUrl(ev.lessonPlanUrl || '');
    setAttendees(ev.attendees || '');
    setSelectedTools(ev.toolsUsed ? ev.toolsUsed.split(' • ').map(s => s.trim()) : []);
    setScoreAssessmentFeedback(ev.scoreAssessmentFeedback);
    setScoreTechDepth(ev.scoreTechDepth);
    setScoreLmsClarity(ev.scoreLmsClarity);
    setScoreClassroomMgmt(ev.scoreClassroomMgmt);
    setScoreStudentEngagement(ev.scoreStudentEngagement);
    setScoreTeacherTools(ev.scoreTeacherTools);
    setStrengths(ev.strengths || '');
    setImprovements(ev.improvements || '');
    setRecommendations(ev.recommendations || '');
    setTeacherSignature(ev.teacherSignature || ev.teacherNameAr);
    setActiveSubTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAdmin) {
      showToast('تم تحميل التقييم في النموذج للتعديل', 'info');
    } else {
      showToast('تم فتح تفاصيل التقييم للمشاهدة والطباعة', 'info');
    }
  };

  // Delete evaluation (Admin only)
  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('هل أنت متأكد من حذف هذا التقييم نهائياً من Firebase؟')) return;
    try {
      await db.deleteModelLessonEvaluation(id);
      showToast('تم حذف التقييم بنجاح', 'success');
      reloadData();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('خطأ أثناء الحذف', 'error');
    }
  };

  // Send report to teacher via email link (opens mail client)
  const handleSendReport = (ev?: ModelLessonEvaluation) => {
    const targetEval = ev || (editingId ? evaluations.find(e => e.id === editingId) : null);
    const teacher = targetEval ? teachers.find(t => t.id === targetEval.teacherId) : selectedTeacher;
    if (!teacher) {
      showToast('يرجى اختيار معلم أولاً لإرسال التقرير', 'error');
      return;
    }
    const teacherEmail = (teacher as any).email || '';
    const evalData = targetEval;
    const badge = evalData ? getPerformanceBadge(evalData.overallScore) : null;
    const subject = encodeURIComponent(`تقرير تقييم حصة التعليم الإلكتروني - ${teacher.nameAr} - ${evalData?.date || new Date().toISOString().split('T')[0]}`);
    const body = encodeURIComponent(
`السلام عليكم ورحمة الله وبركاته،

نود إحاطتكم علماً بنتيجة تقييم حصة التعليم الإلكتروني الخاصة بكم:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 بيانات التقييم
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• اسم المعلم: ${teacher.nameAr}
• التاريخ: ${evalData?.date || '-'}
• الحصة: ${evalData?.period || '-'}
• الصف: ${evalData?.classGrade ? `الصف ${evalData.classGrade}` : '-'}
• الأدوات المستخدمة: ${evalData?.toolsUsed || '-'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏅 نتائج التقييم
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• التقييم العام: ${evalData?.overallScore || '-'} / 10
• مستوى الأداء: ${badge?.label || '-'}

✅ نقاط القوة:
${evalData?.strengths || '-'}

📈 جوانب تحتاج تحسين:
${evalData?.improvements || '-'}

📌 التوصيات:
${evalData?.recommendations || '-'}
${evalData?.lessonPlanUrl ? `
🔗 خطة الدرس والأدلة:
${evalData.lessonPlanUrl}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
يُرجى الاطلاع على هذا التقرير والتواصل مع منسق التعليم الإلكتروني في حال الاستفسار.

مع تحياتنا،
م. أحمد عادل طبيشات
منسق التعليم الإلكتروني والحلول الرقمية
${SCHOOL_NAME}`
    );
    if (teacherEmail) {
      window.open(`mailto:${teacherEmail}?subject=${subject}&body=${body}`, '_blank');
      showToast(`✅ تم فتح بريد التعليم الإلكتروني لإرسال التقرير إلى ${teacher.nameAr}`, 'success');
    } else {
      // Fallback: show the email content in a modal for manual copy
      setSendReportModal(true);
      showToast(`⚠️ البريد الإلكتروني للمعلم غير مسجل — يمكنك نسخ التقرير يدوياً`, 'info');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredHistory.length === 0) {
      showToast('لا توجد تقييمات محفوظة للتصدير', 'info');
      return;
    }
    const data = filteredHistory.map((ev, i) => ({
      'م': i + 1,
      'اسم المعلم': ev.teacherNameAr,
      'الاسم بالإنجليزية': ev.teacherNameEn,
      'القسم': ev.departmentName,
      'العام الدراسي': ev.academicYear,
      'التاريخ': ev.date,
      'الحصة': ev.period,
      'الصف': `الصف ${ev.classGrade}`,
      'الأدوات المستخدمة': ev.toolsUsed,
      'الحضور والمشاركون': ev.attendees || '-',
      'رابط خطة الدرس والأدلة': ev.lessonPlanUrl || '-',
      'التقويم والتغذية الراجعة (10)': ev.scoreAssessmentFeedback,
      'عمق توظيف التقنية (10)': ev.scoreTechDepth,
      'تنظيم LMS ووضوح المواد (10)': ev.scoreLmsClarity,
      'إدارة الصف بالتقنية (10)': ev.scoreClassroomMgmt,
      'تفاعل الطلاب رقمياً (10)': ev.scoreStudentEngagement,
      'استخدام المعلم للأدوات (10)': ev.scoreTeacherTools,
      'التقييم العام للحصة (10)': ev.overallScore,
      'التقدير': getPerformanceBadge(ev.overallScore).label,
      'جوانب القوة': ev.strengths,
      'جوانب تحتاج تحسين': ev.improvements,
      'التوصيات': ev.recommendations,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقييم الحصص النموذجية');
    XLSX.writeFile(wb, `E-Learning_Model_Lessons_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('تم تصدير ملف Excel بنجاح', 'success');
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    let list = evaluations;
    if (isCoord && coordDepts.length > 0) {
      list = list.filter(e => coordDepts.includes(e.departmentId));
    }
    if (filterYear) {
      list = list.filter(e => e.academicYear === filterYear);
    }
    if (filterDept) {
      list = list.filter(e => e.departmentId === filterDept);
    }
    if (filterTeacher) {
      list = list.filter(e => e.teacherId === filterTeacher);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        e =>
          e.teacherNameAr.toLowerCase().includes(q) ||
          e.teacherNameEn.toLowerCase().includes(q) ||
          e.toolsUsed?.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.attendees?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, isCoord, coordDepts, filterYear, filterDept, filterTeacher, searchQuery]);

  // History Stats
  const historyStats = useMemo(() => {
    const total = filteredHistory.length;
    if (total === 0) return { total: 0, avg: 0, distinctTeachers: 0, excellentCount: 0 };
    const avg = Math.round((filteredHistory.reduce((s, e) => s + e.overallScore, 0) / total) * 10) / 10;
    const distinctTeachers = new Set(filteredHistory.map(e => e.teacherId)).size;
    const excellentCount = filteredHistory.filter(e => e.overallScore >= 9).length;
    return { total, avg, distinctTeachers, excellentCount };
  }, [filteredHistory]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ fontWeight: 700 }}>جاري تحميل نموذج تقييم حصص التعليم الإلكتروني...</p>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.5rem',
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', maxWidth: '1150px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Embedded Print CSS for exact single-page A4 rendering */}
      <style>{`
        .only-print,
        .print-only {
          display: none !important;
        }

        @media print {
          @page {
            size: A4 landscape !important;
            margin: 6mm 8mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          body {
            background: #fff !important;
            color: #0F2044 !important;
            font-size: 8pt !important;
            line-height: 1.2 !important;
          }
          .no-print,
          aside,
          header,
          footer,
          .app-shell aside,
          .app-shell header,
          .app-shell footer,
          .topbar,
          .sidebar,
          button,
          input[type="range"] {
            display: none !important;
          }
          .only-print,
          .print-only {
            display: block !important;
            width: 100% !important;
          }
          .main-content-area {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .landscape-print-doc {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 auto !important;
            font-family: 'IBM Plex Sans Arabic', Arial, sans-serif !important;
            direction: rtl !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Save Success Modal Confirmation */}
      {saveSuccessModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '480px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid #10B981',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
              تم حفظ وتوثيق التقييم بنجاح!
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              تم حفظ تقييم المعلم <strong style={{ color: '#0F2044' }}>{selectedTeacher?.nameAr}</strong> بنجاح في قاعدة البيانات السحابية Firebase برصيد <strong style={{ color: '#10B981' }}>{overallScore} / 10</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSaveSuccessModal(false);
                  window.print();
                }}
                style={{
                  background: '#0F2044',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>🖨️</span>
                <span>طباعة التقرير الرسمي A4 الآن (Print Form)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSaveSuccessModal(false);
                  handleSendReport();
                }}
                style={{
                  background: '#0096C7',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>📧</span>
                <span>إرسال التقرير إلى المعلم</span>
              </button>


              <button
                type="button"
                onClick={() => {
                  setSaveSuccessModal(false);
                  setActiveSubTab('history');
                }}
                style={{
                  background: '#0096C7',
                  color: '#fff',
                  padding: '0.7rem',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>📊</span>
                <span>الانتقال لسجل التقييمات والأرشيف</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <span>➕</span>
                <span>تقييم معلم جديد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Report Modal */}
      {sendReportModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid #0096C7',
            }}
          >
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>📧</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem', textAlign: 'center' }}>
              إرسال تقرير التقييم إلى المعلم
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 1.25rem', lineHeight: 1.6, textAlign: 'center' }}>
              البريد الإلكتروني للمعلم <strong>{selectedTeacher?.nameAr}</strong> غير مسجل في النظام.<br />
              يمكن إرسال التقرير عبر Teams أو WhatsApp أو نسخه يدوياً.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => { setSendReportModal(false); window.print(); }}
                style={{ background: '#0F2044', color: '#fff', padding: '0.7rem', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                🖨️ طباعة التقرير وتسليمه للمعلم
              </button>
              <button
                onClick={() => setSendReportModal(false)}
                style={{ background: '#F1F5F9', color: '#475569', padding: '0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#92400E',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <div>
            <strong>وضع الاطلاع والمشاهدة فقط:</strong> حسابك مخصص للاطلاع وتصفح سجل التقييمات، والبحث، وطباعة النماذج الرسمية وتصديرها. إجراء التقييمات وتعديلها متاح لمدير النظام فقط.
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastMsg.type === 'success' ? '#10B981' : toastMsg.type === 'error' ? '#EF4444' : '#0F2044',
            color: '#fff',
            padding: '0.8rem 1.8rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{toastMsg.type === 'success' ? '✅' : toastMsg.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header Controls Bar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💻</span>
              <span>تقييم حصص التعليم الالكتروني النموذجية</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0', fontWeight: 600 }}>
              Observation Form for E-Learning Model Lessons | {SCHOOL_NAME}
            </p>
          </div>

          {/* Auto-Save Cloud Status Indicator (Admin only) */}
          {isAdmin && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: autoSaveStatus === 'saved' ? '#ECFDF5' : autoSaveStatus === 'saving' ? '#FFFBEB' : '#F8FAFC',
                color: autoSaveStatus === 'saved' ? '#065F46' : autoSaveStatus === 'saving' ? '#92400E' : '#64748B',
                border: `1px solid ${autoSaveStatus === 'saved' ? '#A7F3D0' : autoSaveStatus === 'saving' ? '#FDE68A' : '#E2E8F0'}`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: autoSaveStatus === 'saved' ? '#10B981' : autoSaveStatus === 'saving' ? '#F59E0B' : '#94A3B8',
                  display: 'inline-block',
                }}
              />
              <span>
                {autoSaveStatus === 'saving'
                  ? '⏳ جاري الحفظ تلقائياً في Firebase...'
                  : autoSaveStatus === 'saved'
                  ? `🟢 تم الحفظ السحابي (${lastSavedTime})`
                  : '☁️ الحفظ التلقائي مفعّل في Firebase'}
              </span>
            </div>
          )}
        </div>

        {/* Sub-Tabs Switcher */}
        <div style={{ display: 'flex', background: '#E2E8F0', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
          <button
            onClick={() => setActiveSubTab('schedule')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: activeSubTab === 'schedule' ? '#0F2044' : 'transparent',
              color: activeSubTab === 'schedule' ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📅</span>
            <span>جدول الحصص النموذجية ({schedules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('form')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: activeSubTab === 'form' ? '#0F2044' : 'transparent',
              color: activeSubTab === 'form' ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📝</span>
            <span>{isAdmin ? (editingId ? 'تعديل التقييم' : 'نموذج التقييم') : 'عرض التقييم الرسمي'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: activeSubTab === 'history' ? '#0F2044' : 'transparent',
              color: activeSubTab === 'history' ? '#fff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📊</span>
            <span>سجل التقييمات ({evaluations.length})</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 0: E-LEARNING MODEL LESSONS SCHEDULE (جدول الحصص النموذجية)          */}
      {/* ════════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'schedule' && (
        <div>
          {/* ══════════ ON-SCREEN VIEW (no-print) ══════════ */}
          <div className="no-print">
            {/* KPI Stats Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem', borderTop: '4px solid #0F2044' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F2044' }}>{scheduleStats.total}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>إجمالي الحصص بالجدول</div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem', borderTop: '4px solid #0096C7' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0096C7' }}>{scheduleStats.scheduled}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>حصص قادمة بانتظار التنفيذ</div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem', borderTop: '4px solid #10B981' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>{scheduleStats.completed}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>حصص تم تنفيذها وتقييمها</div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem', borderTop: '4px solid #8B5CF6' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6' }}>{scheduleStats.distinctTeachers}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>المعلمون المشاركون بالجدول</div>
              </div>
            </div>

            {/* Control & Filter Card */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📅</span>
                    <span>جدول حصص التعليم الإلكتروني النموذجية</span>
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                    تخطيط وجدولة زيارات حصص التعليم الإلكتروني وطباعتها وتصديرها كـ PDF ونشرها للكادر الأكاديمي
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenNewScheduleModal}
                      style={{
                        background: '#0F2044',
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(15,32,68,0.2)',
                      }}
                    >
                      <span>➕</span>
                      <span>إضافة حصة للجدول</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#0096C7',
                      color: '#fff',
                      border: 'none',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>🖨️</span>
                    <span>طباعة الجدول الرسمي</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportScheduleToExcel}
                    style={{
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>📊</span>
                    <span>تصدير Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAllToOutlook}
                    style={{
                      background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 8px rgba(0,120,212,0.25)',
                    }}
                    title="تصدير جميع حصص الجدول إلى ملف تقويم Outlook وتفعيل التنبيهات"
                  >
                    <span>📅</span>
                    <span>تصدير كل الحصص لـ Outlook</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                {/* Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>العام الدراسي</label>
                  <select
                    value={filterScheduleYear}
                    onChange={e => setFilterScheduleYear(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700, color: '#0F2044' }}
                  >
                    <option value="">جميع الأعوام</option>
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>القسم الأكاديمي</label>
                  <select
                    value={filterScheduleDept}
                    onChange={e => setFilterScheduleDept(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700, color: '#0F2044' }}
                  >
                    <option value="">جميع الأقسام</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                  </select>
                </div>

                {/* Teacher */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>المعلم</label>
                  <select
                    value={filterScheduleTeacher}
                    onChange={e => setFilterScheduleTeacher(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700, color: '#0F2044' }}
                  >
                    <option value="">جميع المعلمين</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.nameAr}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>حالة الحصة</label>
                  <select
                    value={filterScheduleStatus}
                    onChange={e => setFilterScheduleStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem', fontWeight: 700, color: '#0F2044' }}
                  >
                    <option value="">جميع الحالات</option>
                    <option value="مجدولة">🔵 مجدولة</option>
                    <option value="تم التنفيذ">🟢 تم التنفيذ</option>
                    <option value="مؤجلة">🟡 مؤجلة</option>
                    <option value="ملغاة">🔴 ملغاة</option>
                  </select>
                </div>

                {/* Search Query */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>بحث سريع</label>
                  <input
                    type="text"
                    placeholder="ابحث بالمعلم، المادة، الموضوع..."
                    value={scheduleSearchQuery}
                    onChange={e => setScheduleSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Official Period Timetable Reference Strip */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                border: '1.5px solid #BAE6FD',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                boxShadow: '0 2px 6px rgba(3, 105, 161, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800, color: '#0369A1' }}>
                <span style={{ fontSize: '1.1rem' }}>⏰</span>
                <span>جدول مواعيد وتوقيت الحصص المعتمد:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(p => {
                  const t = SCHOOL_PERIOD_TIMINGS[String(p)];
                  return (
                    <span
                      key={p}
                      style={{
                        background: '#fff',
                        border: '1px solid #7DD3FC',
                        borderRadius: '7px',
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0F2044',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <strong style={{ color: '#0369A1' }}>حصة {p}:</strong>
                      <span style={{ direction: 'ltr', fontWeight: 800, color: '#0F2044' }}>{t.startTime} – {t.endTime}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Schedule Table */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                  📋 قائمة الحصص المجدولة ({filteredSchedules.length})
                </h4>
                {(filterScheduleDept || filterScheduleTeacher || filterScheduleStatus || scheduleSearchQuery) && (
                  <button
                    onClick={() => { setFilterScheduleDept(''); setFilterScheduleTeacher(''); setFilterScheduleStatus(''); setScheduleSearchQuery(''); }}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🔄 إعادة ضبط الفلاتر
                  </button>
                )}
              </div>

              {filteredSchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F2044', margin: '0 0 0.4rem' }}>لا توجد حصص مجدولة مطابقة للشروط</p>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>يمكنك إضافة حصة نموذجية جديدة للجدول باستخدام زر «إضافة حصة للجدول»</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                        <th style={{ padding: '0.65rem 0.5rem', width: '30px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>اليوم والتاريخ</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>الحصة</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>المعلم</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>القسم / المادة</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>الصف</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>موضوع الحصة</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>الأدوات الرقمية</th>
                        <th style={{ padding: '0.65rem 0.5rem' }}>القاعة</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>الحالة</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.map((s, idx) => (
                        <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0F2044' }}>
                            <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                              {s.dayName || getArabicDay(s.date)}
                            </span>
                            {s.date}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ background: '#0F2044', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                                الحصة {s.period}
                              </span>
                              {SCHOOL_PERIOD_TIMINGS[String(s.period)] && (
                                <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 700, direction: 'ltr', whiteSpace: 'nowrap' }}>
                                  {SCHOOL_PERIOD_TIMINGS[String(s.period)].startTime} – {SCHOOL_PERIOD_TIMINGS[String(s.period)].endTime}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044' }}>
                            {s.teacherNameAr}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                            <div>{s.departmentName || getDeptName(s.departmentId, departments)}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.subject || '-'}</div>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#0369A1' }}>
                            {s.classGrade}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#0F2044', fontWeight: 600, maxWidth: '160px' }}>
                            {s.lessonTopic || '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', maxWidth: '160px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                              {(s.toolsPlanned ? s.toolsPlanned.split(',').map(t => t.trim()) : []).slice(0, 3).map((t, i) => (
                                <span key={i} style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', color: '#64748B', fontSize: '0.72rem' }}>
                            {s.roomVenue || 'الصف'}
                          </td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: s.status === 'تم التنفيذ' ? '#ECFDF5' : s.status === 'مجدولة' ? '#EFF6FF' : s.status === 'مؤجلة' ? '#FEF3C7' : '#FEE2E2',
                              color: s.status === 'تم التنفيذ' ? '#065F46' : s.status === 'مجدولة' ? '#1E40AF' : s.status === 'مؤجلة' ? '#92400E' : '#991B1B',
                            }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCalendarLesson(s);
                                  setCalendarReminderMins(15);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 1px 4px rgba(0,120,212,0.25)',
                                }}
                                title="إضافة الحصة إلى تقويم أوتلوك (Outlook Calendar) وتفعيل التذكير والتنبيه"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
                                </svg>
                                <span>التقويم (Outlook)</span>
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleStartEvaluationFromSchedule(s)}
                                  style={{ background: '#0096C7', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  title="بدء تقييم هذه الحصة مباشرة"
                                >
                                  ⚡ تقييم
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleEditScheduleModal(s)}
                                  style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FE', padding: '0.3rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                  title="تعديل بيانات الحصة في الجدول"
                                >
                                  ✏️
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteSchedule(s.id)}
                                  style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', padding: '0.3rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                  title="حذف الحصة من الجدول"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ══════════ PRINT LAYOUT (Official Schedule Document) ══════════ */}
          <div className="print-only landscape-print-doc" style={{ padding: '0', fontFamily: 'IBM Plex Sans Arabic, Arial, sans-serif', direction: 'rtl', fontSize: '8.5pt' }}>
            {/* Official Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4mm', borderBottom: '2px solid #0F2044', paddingBottom: '3mm' }}>
              <img src="/ministry-logo.png" alt="وزارة التعليم والتعليم العالي" style={{ height: '75px', maxWidth: '170px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                <div style={{ background: '#0F2044', color: 'white', borderRadius: '6px', padding: '5px 18px', display: 'inline-block', fontSize: '9pt', fontWeight: 800 }}>
                  📅 جدول حصص التعليم الإلكتروني النموذجية - العام الأكاديمي {academicYear}
                </div>
              </div>
              <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '75px', maxWidth: '170px', objectFit: 'contain' }} />
            </div>

            {/* Meta Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2mm 4mm', marginBottom: '3mm', fontSize: '7.5pt' }}>
              <div><strong>العام الدراسي:</strong> {academicYear}</div>
              <div><strong>إجمالي الحصص المجدولة:</strong> {filteredSchedules.length} حصة</div>
              <div><strong>تاريخ استخراج الجدول:</strong> {new Date().toLocaleDateString('ar-QA')}</div>
              <div><strong>منسق التعليم الإلكتروني:</strong> م. أحمد عادل طبيشات</div>
            </div>

            {/* Printable Schedule Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: '7.5pt' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: 'white' }}>
                  <th style={{ padding: '3.5px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '22px' }}>#</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'right', border: '1px solid #1e3a5f', width: '85px' }}>اليوم والتاريخ</th>
                  <th style={{ padding: '3.5px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '55px' }}>الحصة والتوقيت</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'right', border: '1px solid #1e3a5f', width: '110px' }}>اسم المعلم</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'right', border: '1px solid #1e3a5f', width: '85px' }}>القسم / المادة</th>
                  <th style={{ padding: '3.5px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '45px' }}>الصف</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'right', border: '1px solid #1e3a5f' }}>موضوع / عنوان الحصة</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'right', border: '1px solid #1e3a5f', width: '110px' }}>الأدوات الرقمية</th>
                  <th style={{ padding: '3.5px 5px', textAlign: 'center', border: '1px solid #1e3a5f', width: '60px' }}>القاعة</th>
                  <th style={{ padding: '3.5px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '48px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                    <td style={{ padding: '3px 4px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1', fontWeight: 700 }}>{s.dayName || getArabicDay(s.date)}<br /><span style={{ fontSize: '6.5pt', color: '#64748B' }}>{s.date}</span></td>
                    <td style={{ padding: '3px 3px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800 }}>
                      <div>الحصة {s.period}</div>
                      {SCHOOL_PERIOD_TIMINGS[String(s.period)] && (
                        <div style={{ fontSize: '5.8pt', color: '#475569', fontWeight: 700, direction: 'ltr', whiteSpace: 'nowrap' }}>
                          {SCHOOL_PERIOD_TIMINGS[String(s.period)].startTime} - {SCHOOL_PERIOD_TIMINGS[String(s.period)].endTime}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1', fontWeight: 800, color: '#0F2044' }}>{s.teacherNameAr}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1' }}>{s.departmentName || getDeptName(s.departmentId, departments)}<br /><span style={{ fontSize: '6.5pt', color: '#64748B' }}>{s.subject || '-'}</span></td>
                    <td style={{ padding: '3px 4px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>{s.classGrade}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1', fontWeight: 600 }}>{s.lessonTopic || '-'}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1', fontSize: '6.8pt', color: '#0369A1' }}>{s.toolsPlanned || '-'}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '7pt' }}>{s.roomVenue || 'الصف'}</td>
                    <td style={{ padding: '3px 4px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Official Signatures (No Principal) */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '6mm', paddingTop: '3mm', borderTop: '1px solid #CBD5E1' }}>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <div style={{ fontWeight: 800, color: '#0F2044', borderBottom: '1px solid #333', paddingBottom: '3px', marginBottom: '3px', fontSize: '8.5pt' }}>توقيع منسق المشاريع الإلكترونية</div>
                <div style={{ fontSize: '7pt', color: '#64748B', marginBottom: '4px' }}>E-Projects Coordinator Signature</div>
                <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '32px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#0F2044' }}>م. أحمد عادل طبيشات</div>
              </div>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <div style={{ fontWeight: 800, color: '#0F2044', borderBottom: '1px solid #333', paddingBottom: '3px', marginBottom: '3px', fontSize: '8.5pt' }}>توقيع النائب الأكاديمي</div>
                <div style={{ fontSize: '7pt', color: '#64748B', marginBottom: '4px' }}>Academic VP Signature</div>
                <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '32px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                <div style={{ fontWeight: 800, fontSize: '8.5pt', color: '#0F2044' }}>د. راني التوم</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 1: EVALUATION OBSERVATION FORM                                      */}
      {activeSubTab === 'form' && (
        <div>
          {/* ════════════════════════════════════════════════════════════════════════════ */}
          {/* A4 LANDSCAPE BILINGUAL PRINT-ONLY REPORT (Single Page Guaranteed)          */}
          {/* ════════════════════════════════════════════════════════════════════════════ */}
          <div className="print-only landscape-print-doc" style={{ padding: '0', fontFamily: 'IBM Plex Sans Arabic, Arial, sans-serif', direction: 'rtl', fontSize: '7.5pt' }}>
            {/* Letterhead with Ministry & School Logos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F2044', paddingBottom: '3px', marginBottom: '3px' }}>
              <img src="/ministry-logo.png" alt="وزارة التعليم والتعليم العالي" style={{ height: '65px', maxWidth: '160px', objectFit: 'contain' }} />
              
              <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
                <div style={{ background: '#0F2044', color: '#fff', borderRadius: '6px', padding: '4px 16px', display: 'inline-block', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                  <span style={{ fontSize: '8.5pt', fontWeight: 900 }}>نموذج تقييم حصص التعليم الالكتروني النموذجية ٢٠٢٦ م</span>
                  <span style={{ margin: '0 6px', opacity: 0.7 }}>|</span>
                  <span style={{ fontSize: '7.5pt', color: '#90E0EF', fontWeight: 700 }}>Observation Form for E-Learning Model Lessons 2026</span>
                </div>
              </div>

              <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '65px', maxWidth: '160px', objectFit: 'contain' }} />
            </div>

            {/* Bilingual Metadata Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px', border: '1px solid #0F2044', fontSize: '7.5pt' }}>
              <tbody>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, width: '15%', textAlign: 'right' }}>
                    اسم المعلم / Teacher:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 800, color: '#0F2044', width: '35%' }}>
                    {selectedTeacher?.nameAr || 'لم يتم التحديد'} {selectedTeacher?.nameEn ? `/ ${selectedTeacher.nameEn}` : ''}
                  </td>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, width: '15%', textAlign: 'right' }}>
                    القسم والمادة / Dept & Subject:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700, width: '35%' }}>
                    {getDeptName(selectedDeptId, departments)} / {selectedTeacher?.subject || '-'}
                  </td>
                </tr>
                <tr style={{ background: '#fff' }}>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, textAlign: 'right' }}>
                    تاريخ التقييم / Date:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700, direction: 'ltr', textAlign: 'right' }}>
                    {date}
                  </td>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, textAlign: 'right' }}>
                    الحصة والصف / Period & Grade:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                    الحصة {period} {SCHOOL_PERIOD_TIMINGS[String(period)] ? `(${SCHOOL_PERIOD_TIMINGS[String(period)].startTime} – ${SCHOOL_PERIOD_TIMINGS[String(period)].endTime})` : ''} | الصف {classGrade} (Grade {classGrade})
                  </td>
                </tr>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, textAlign: 'right' }}>
                    الأدوات الرقمية / Tools Used:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700, color: '#0F2044' }}>
                    {selectedTools.length > 0 ? (
                      <ul style={{ margin: 0, padding: 0, paddingRight: '15px', listStyleType: 'disc' }}>
                        {selectedTools.map((t, i) => <li key={i} style={{ marginBottom: '1px' }}>{t}</li>)}
                      </ul>
                    ) : 'لم تحدد أدوات'}
                  </td>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, textAlign: 'right' }}>
                    الحضور / Attendees:
                  </th>
                  <td style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700, color: '#0F2044' }}>
                    {attendees.trim() ? attendees : 'لا يوجد حضور إضافي / None'}
                  </td>
                </tr>
                <tr style={{ background: '#fff' }}>
                  <th style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', background: '#E2E8F0', color: '#0F2044', fontWeight: 800, textAlign: 'right' }}>
                    خطة الدرس والأدلة / Evidence:
                  </th>
                  <td colSpan={3} style={{ padding: '2.5px 5px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                    {lessonPlanUrl.trim() ? (
                      <a
                        href={lessonPlanUrl.trim()}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0369A1', textDecoration: 'underline', fontWeight: 800, fontSize: '7.5pt' }}
                      >
                        🔗 أنقر هنا للاطلاع على خطة الدرس والأدلة على OneDrive (Click Here to View Lesson Plan & Evidence)
                      </a>
                    ) : (
                      <span style={{ color: '#64748B' }}>غير مرفق رابط إلكتروني / No link attached</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2-Column Main Body Split for Landscape */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '5px', marginBottom: '4px' }}>
              
              {/* Right Column: 6 Criteria Table */}
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '5px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.2pt' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                      <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '20px' }}>#</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right', border: '1px solid #1e3a5f' }}>
                        معايير تقييم الحصة الإلكترونية / Evaluation Criteria
                      </th>
                      <th style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #1e3a5f', width: '55px' }}>
                        الدرجة/Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERIA_DEFINITIONS.map((crit, i) => {
                      const val = getScoreValue(crit.num);
                      return (
                        <tr key={crit.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                          <td style={{ padding: '2.5px 3px', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>
                            {crit.num}
                          </td>
                          <td style={{ padding: '2.5px 5px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '7.3pt', lineHeight: 1.2 }}>{crit.titleAr}</div>
                            <div style={{ color: '#64748B', fontSize: '6.4pt', fontWeight: 600, lineHeight: 1.1 }}>{crit.titleEn}</div>
                          </td>
                          <td style={{ padding: '2.5px 4px', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 900, fontSize: '8pt', color: val >= 9 ? '#065F46' : val >= 7.5 ? '#1E40AF' : '#991B1B' }}>
                            {val} / 10
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#0F2044', color: '#fff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                      <td colSpan={2} style={{ padding: '3px 6px', border: '1px solid #1e3a5f', fontWeight: 800, textAlign: 'right', fontSize: '7.5pt', color: '#ffffff' }}>
                        المجموع الكلي من 60 / Total Score (out of 60)
                      </td>
                      <td style={{ padding: '3px 4px', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 900, fontSize: '8.5pt', color: '#ffffff' }}>
                        {criteriaScoreSum} / 60
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Left Column: Overall Score + Feedback + Signatures */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                
                {/* Overall Score Card */}
                <div style={{ background: '#0F2044', color: '#fff', borderRadius: '5px', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                  <div>
                    <div style={{ fontSize: '7.2pt', fontWeight: 800, color: '#90E0EF' }}>التقييم العام للحصة / Overall Lesson Score</div>
                    <div style={{ fontSize: '6.2pt', color: '#CBD5E1' }}>مستوى الأداء / Level: <strong>{getPerformanceBadge(overallScore).label}</strong></div>
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {overallScore} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>/ 10</span>
                  </div>
                </div>

                {/* Feedback Box 1: Strengths */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2.5px 5px', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '6.8pt', fontWeight: 800, color: '#065F46', borderBottom: '1px solid #E2E8F0', paddingBottom: '1px', marginBottom: '1.5px' }}>
                    ✅ جوانب القوة والتميز / Strengths:
                  </div>
                  <FormattedReportPoints
                    text={strengths}
                    defaultText="تم تنفيذ الحصة وفق المعايير المطلوبة بتميز وفاعلية."
                    bulletColor="#059669"
                    fontSize="6.6pt"
                  />
                </div>

                {/* Feedback Box 2: Areas for Improvement */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2.5px 5px', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '6.8pt', fontWeight: 800, color: '#92400E', borderBottom: '1px solid #E2E8F0', paddingBottom: '1px', marginBottom: '1.5px' }}>
                    📈 جوانب تحتاج إلى تحسين / Areas for Improvement:
                  </div>
                  <FormattedReportPoints
                    text={improvements}
                    defaultText="الاستمرار في تعزيز التفاعل الصفي والتمايز الرقمي."
                    bulletColor="#D97706"
                    fontSize="6.6pt"
                  />
                </div>

                {/* Feedback Box 3: Recommendations */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2.5px 5px', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '6.8pt', fontWeight: 800, color: '#0369A1', borderBottom: '1px solid #E2E8F0', paddingBottom: '1px', marginBottom: '1.5px' }}>
                    📌 التوصيات والخطوات القادمة / Recommendations:
                  </div>
                  <FormattedReportPoints
                    text={recommendations}
                    defaultText="مشاركة الممارسات الرقمية المتميزة مع الزملاء بالقسم."
                    bulletColor="#0284C7"
                    fontSize="6.6pt"
                  />
                </div>

                {/* Signatures (Teacher + Coordinator + Academic VP — NO PRINCIPAL) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '3px 4px', background: '#FAFAFA', marginTop: '1px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '6.8pt', borderBottom: '1px solid #333', paddingBottom: '1px', marginBottom: '2px' }}>
                      توقيع المعلم
                    </div>
                    <div style={{ fontSize: '5.8pt', color: '#64748B', marginBottom: '4px' }}>Teacher Signature</div>
                    <div style={{ fontWeight: 700, fontSize: '6.8pt', color: '#0F2044' }}>
                      {teacherSignature.trim() || selectedTeacher?.nameAr || '___________'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '6.8pt', borderBottom: '1px solid #333', paddingBottom: '1px', marginBottom: '2px' }}>
                      منسق المشاريع الإلكترونية
                    </div>
                    <div style={{ fontSize: '5.8pt', color: '#64748B', marginBottom: '2px' }}>E-Projects Coordinator</div>
                    <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '24px', objectFit: 'contain', margin: '0 auto 1px', display: 'block' }} />
                    <div style={{ fontWeight: 800, fontSize: '6.8pt', color: '#0F2044' }}>
                      م. أحمد عادل طبيشات
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '6.8pt', borderBottom: '1px solid #333', paddingBottom: '1px', marginBottom: '2px' }}>
                      النائب الأكاديمي
                    </div>
                    <div style={{ fontSize: '5.8pt', color: '#64748B', marginBottom: '2px' }}>Academic Vice Principal</div>
                    <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '24px', objectFit: 'contain', margin: '0 auto 1px', display: 'block' }} />
                    <div style={{ fontWeight: 800, fontSize: '6.8pt', color: '#0F2044' }}>
                      د. راني التوم
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════════ */}
          {/* ON-SCREEN INTERACTIVE FORM (no-print)                                       */}
          {/* ════════════════════════════════════════════════════════════════════════════ */}
          <div className="no-print">
            {/* Header Letterhead Preview */}
            <div
              style={{
                background: '#fff',
                borderRadius: '16px 16px 0 0',
                padding: '0.85rem 1.25rem 0.6rem',
                border: '1px solid #E2E8F0',
                borderBottom: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <img src="/ministry-logo.png" alt="وزارة التعليم" style={{ height: '95px', maxWidth: '200px', objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ background: 'linear-gradient(135deg, #0A1931 0%, #0F2044 100%)', color: '#ffffff', borderRadius: '8px', padding: '6px 20px', display: 'inline-block' } as any}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    نموذج تقييم حصص التعليم الالكتروني النموذجية ٢٠٢٦ م
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#90E0EF', fontWeight: 700, lineHeight: 1.2 }}>
                    Observation Form for E-Learning Model Lessons 2026
                  </div>
                </div>
              </div>
              <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '95px', maxWidth: '200px', objectFit: 'contain', flexShrink: 0 }} />
            </div>

            {/* Form Body */}
            <div
              style={{
                background: '#fff',
                borderRadius: '0 0 16px 16px',
                padding: '1.5rem',
                border: '1px solid #E2E8F0',
                borderTop: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                marginBottom: '1.5rem',
              }}
            >
              {/* 1. On-Screen Interactive Meta Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Teacher Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                    اسم المعلم <span style={{ color: '#64748B', fontWeight: 500 }}>(Teacher Name)</span> *
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={teacherId}
                    onChange={e => handleTeacherChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- اختر المعلم --</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nameAr} ({t.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                    القسم <span style={{ color: '#64748B', fontWeight: 500 }}>(Department)</span>
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={selectedDeptId}
                    onChange={e => setSelectedDeptId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- اختر القسم --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nameAr} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                    التاريخ <span style={{ color: '#64748B', fontWeight: 500 }}>(Date)</span> *
                  </label>
                  <input
                    type="date"
                    disabled={!isAdmin}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Period */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                    الحصة <span style={{ color: '#64748B', fontWeight: 500 }}>(Period)</span>
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  >
                    <option value="1">الحصة الأولى (1) | 7:10 – 7:55</option>
                    <option value="2">الحصة الثانية (2) | 8:00 – 8:45</option>
                    <option value="3">الحصة الثالثة (3) | 9:25 – 10:10</option>
                    <option value="4">الحصة الرابعة (4) | 10:15 – 11:00</option>
                    <option value="5">الحصة الخامسة (5) | 11:05 – 11:50</option>
                    <option value="6">الحصة السادسة (6) | 12:10 – 12:55</option>
                    <option value="7">الحصة السابعة (7) | 13:00 – 13:45</option>
                  </select>
                </div>

                {/* Class / Grade */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                    الصف <span style={{ color: '#64748B', fontWeight: 500 }}>(Class / Grade)</span>
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={classGrade}
                    onChange={e => setClassGrade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  >
                    <option value="7">الصف السابع (Grade 7)</option>
                    <option value="8">الصف الثامن (Grade 8)</option>
                    <option value="9">الصف التاسع (Grade 9)</option>
                    <option value="10">الصف العاشر (Grade 10)</option>
                    <option value="11">الصف الحادي عشر (Grade 11)</option>
                    <option value="12">الصف الثاني عشر (Grade 12)</option>
                  </select>
                </div>
              </div>

              {/* 1.2 Evidence / OneDrive Link & Attendees Inputs Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  padding: '1.1rem 1.25rem',
                  background: '#F0F9FF',
                  borderRadius: '12px',
                  border: '1.5px solid #BAE6FD',
                  marginBottom: '1.25rem',
                }}
              >
                {/* OneDrive Evidence Link */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0369A1', marginBottom: '0.35rem' }}>
                    <span>📎 رابط الأدلة وخطة الدرس (Lesson Plan & Evidence Link)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="url"
                      disabled={!isAdmin}
                      placeholder="انسخ رابط OneDrive هنا (https://...)"
                      value={lessonPlanUrl}
                      onChange={e => setLessonPlanUrl(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.8rem',
                        borderRadius: '8px',
                        border: '1.5px solid #7DD3FC',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#0F2044',
                        background: isAdmin ? '#fff' : '#F1F5F9',
                        outline: 'none',
                        direction: 'ltr',
                      }}
                    />
                    {lessonPlanUrl.trim() && (
                      <a
                        href={lessonPlanUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#0284C7',
                          color: '#fff',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>🔗</span>
                        <span>أنقر هنا (Click Here)</span>
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    في التقرير المطبوع سيظهر الرابط كنص أنيق قابل للنقر: «أنقر هنا / Click Here».
                  </span>
                </div>

                {/* Attendees & Job Titles */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0369A1', marginBottom: '0.35rem' }}>
                    <span>👥 الحضور (الاسم والمسمى الوظيفي / Attendees & Titles)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="مثال: د. راني التوم - نائب المدير، أ. أحمد - منسق STEM..."
                    value={attendees}
                    onChange={e => setAttendees(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #7DD3FC',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0F2044',
                      background: isAdmin ? '#fff' : '#F1F5F9',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    سيتم توثيق أسماء ومسميات الحضور في السجل والتقرير المطبوع بالعربية والإنجليزية.
                  </span>
                </div>
              </div>

              {/* 2. Tools Section */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🛠️</span>
                    <span>الأدوات والمنصات المستخدمة في الحصة (Tools & Platforms Used)</span>
                  </div>
                  {isAdmin && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>انقر لتحديد الأدوات من القائمة أو أضف أداة جديدة</span>}
                </div>

                {/* Preset Tools Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {PRESET_TOOLS.map(tool => {
                    const isSel = selectedTools.includes(tool.name);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => toggleTool(tool.name)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '20px',
                          border: isSel ? '1.5px solid #0F2044' : '1.5px solid #CBD5E1',
                          background: isSel ? 'linear-gradient(135deg, #0F2044 0%, #1A3A6B 100%)' : '#fff',
                          color: isSel ? '#fff' : '#1E293B',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isAdmin ? 'pointer' : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s',
                          boxShadow: isSel ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
                          opacity: !isAdmin && !isSel ? 0.6 : 1,
                        }}
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.name}</span>
                      </button>
                    );
                  })}

                  {/* Render custom selected tools */}
                  {selectedTools.filter(t => !PRESET_TOOLS.some(p => p.name === t)).map((customT, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleTool(customT)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '20px',
                        border: '1.5px solid #0096C7',
                        background: '#0096C7',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isAdmin ? 'pointer' : 'default',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>✨</span>
                      <span>{customT}</span>
                      {isAdmin && <span style={{ marginRight: '4px', opacity: 0.8 }}>✕</span>}
                    </button>
                  ))}
                </div>

                {/* Custom Tool Input Row */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="✏️ كتابة أداة أخرى غير موجودة في القائمة..."
                      value={customToolText}
                      onChange={e => setCustomToolText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTool();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.85rem',
                        borderRadius: '8px',
                        border: '1.5px dashed #0096C7',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        outline: 'none',
                        background: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTool}
                      style={{
                        background: '#0096C7',
                        color: '#fff',
                        border: 'none',
                        padding: '0.55rem 1.2rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + إضافة أداة
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#0F2044', fontWeight: 700, borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                  الأدوات المحددة: <span style={{ color: '#0096C7', fontWeight: 800 }}>{selectedTools.length > 0 ? selectedTools.join(' • ') : 'لم يتم تحديد أدوات'}</span>
                </div>
              </div>

              {/* 3. 6 Evaluation Criteria */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📋</span>
                    <span>معايير وبنود تقييم الحصة الإلكترونية / E-Learning Evaluation Criteria (10 Marks Each)</span>
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>اسحب المؤشر أو اكتب الدرجة مباشرة</span>
                </div>

                {CRITERIA_DEFINITIONS.map(crit => {
                  const val = getScoreValue(crit.num);
                  const scoreColor = val >= 9 ? '#10B981' : val >= 8 ? '#0096C7' : val >= 6.5 ? '#F59E0B' : '#EF4444';
                  return (
                    <div
                      key={crit.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        padding: '0.9rem 1.25rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        
                        <div style={{ flex: '1 1 320px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#0F2044',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                flexShrink: 0,
                              } as any}
                            >
                              {crit.num}
                            </span>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', lineHeight: 1.3 }}>
                                {crit.titleAr}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700 }}>
                                {crit.titleEn}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: '0.35rem 0 0 2rem', fontSize: '0.74rem', color: '#64748B', lineHeight: 1.4 }}>
                            {crit.desc}
                          </p>
                        </div>

                        {/* Score Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              step="0.5"
                              disabled={!isAdmin}
                              value={val}
                              onChange={e => setScoreValue(crit.num, parseFloat(e.target.value))}
                              style={{
                                width: '100%',
                                accentColor: scoreColor,
                                cursor: isAdmin ? 'pointer' : 'default',
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>
                              <span>0</span>
                              <span>5</span>
                              <span>10</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              disabled={!isAdmin}
                              value={val}
                              onChange={e => setScoreValue(crit.num, parseFloat(e.target.value) || 0)}
                              style={{
                                width: '60px',
                                textAlign: 'center',
                                padding: '0.4rem',
                                borderRadius: '8px',
                                border: `2px solid ${scoreColor}`,
                                fontSize: '1.1rem',
                                fontWeight: 900,
                                color: '#0F2044',
                                background: isAdmin ? '#fff' : '#F1F5F9',
                                outline: 'none',
                              }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>/ 10</span>
                          </div>
                        </div>

                      </div>

                      {/* Colored Progress Bar */}
                      <div style={{ height: '4px', borderRadius: '4px', background: '#E2E8F0', marginTop: '0.5rem', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${val * 10}%`,
                            background: scoreColor,
                            transition: 'width 0.3s, background 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4. Overall Score & Feedback */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                {/* Overall Score Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0F2044 0%, #1A3A6B 100%)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#fff',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(15,32,68,0.2)',
                    border: '1.5px solid #0F2044',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#90E0EF' }}>
                    التقييم العام للحصة
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem' }}>
                    Overall Lesson Score (10)
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {overallScore}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span
                      style={{
                        background: getPerformanceBadge(overallScore).bg,
                        color: getPerformanceBadge(overallScore).color,
                        padding: '0.15rem 0.6rem',
                        borderRadius: '16px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        border: `1px solid ${getPerformanceBadge(overallScore).color}`,
                      }}
                    >
                      {getPerformanceBadge(overallScore).label}
                    </span>
                  </div>
                </div>

                {/* Strengths */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    border: '1.5px solid #CBD5E1',
                  }}
                >
                  <RichBulletTextarea
                    predefinedOptions={PREDEFINED_STRENGTHS}
                    label="جوانب القوة (Strengths)"
                    value={strengths}
                    onChange={val => setStrengths(val)}
                    disabled={!isAdmin}
                    colorTheme="emerald"
                    rows={3}
                    placeholder="اذكر نقاط القوة والتميز في الحصة..."
                  />
                </div>

                {/* Need to Improve */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    border: '1.5px solid #CBD5E1',
                  }}
                >
                  <RichBulletTextarea
                    predefinedOptions={PREDEFINED_IMPROVEMENTS}
                    label="جوانب تحتاج إلى تحسين (Areas for Improvement)"
                    value={improvements}
                    onChange={val => setImprovements(val)}
                    disabled={!isAdmin}
                    colorTheme="amber"
                    rows={3}
                    placeholder="المجالات التي تحتاج لتطوير وتحسين..."
                  />
                </div>

                {/* Recommendations */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    border: '1.5px solid #CBD5E1',
                  }}
                >
                  <RichBulletTextarea
                    predefinedOptions={PREDEFINED_RECOMMENDATIONS}
                    label="توصيات (Recommendations)"
                    value={recommendations}
                    onChange={val => setRecommendations(val)}
                    disabled={!isAdmin}
                    colorTheme="blue"
                    rows={3}
                    placeholder="التوصيات والخطوات التطويرية القادمة..."
                  />
                </div>
              </div>

              {/* 5. Signatures in Screen (Teacher + Coordinator + Academic VP) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '0.9rem',
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  border: '1.5px dashed #CBD5E1',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Signature 1: Teacher */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044' }}>
                    المعلم / Teacher: {selectedTeacher?.nameAr || '...................'}
                  </p>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="توقيع المعلم (Signature)"
                    value={teacherSignature}
                    onChange={e => setTeacherSignature(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '220px',
                      padding: '0.3rem',
                      textAlign: 'center',
                      border: 'none',
                      borderBottom: '2px solid #0F2044',
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#0F2044',
                    }}
                  />
                </div>

                {/* Signature 2: E-Projects Coordinator */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044' }}>
                    م. أحمد طبيشات - منسق المشاريع الالكترونية
                  </p>
                  <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 1.25rem',
                      borderBottom: '2px solid #0F2044',
                      color: '#0F2044',
                      fontWeight: 800,
                      fontStyle: 'italic',
                      fontSize: '0.88rem',
                    }}
                  >
                    Eng. Ahmad Tubaishat (E-Projects Coord.)
                  </div>
                </div>

                {/* Signature 3: Academic Deputy */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044' }}>
                    د. راني التوم – نائب المدير للشؤون الأكاديمية
                  </p>
                  <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 1.25rem',
                      borderBottom: '2px solid #0F2044',
                      color: '#0096C7',
                      fontWeight: 800,
                      fontStyle: 'italic',
                      fontSize: '0.88rem',
                    }}
                  >
                    Dr. Rani Al-Toum (Academic Vice Principal)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {isAdmin && (
                  <button
                    type="button"
                    disabled={autoSaveStatus === 'saving' || !teacherId}
                    onClick={() => handleSaveEvaluation(true)}
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#fff',
                      padding: '0.75rem 2rem',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: autoSaveStatus === 'saving' || !teacherId ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      opacity: autoSaveStatus === 'saving' || !teacherId ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>💾</span>
                    <span>{autoSaveStatus === 'saving' ? 'جاري الحفظ...' : 'حفظ واعتماد التقييم في السحابة'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#0F2044',
                    color: '#fff',
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(15,32,68,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>🖨️</span>
                  <span>طباعة النموذج الرسمي A4 Landscape (Bilingual)</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    <span>🔄</span>
                    <span>تقييم جديد</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SAVED EVALUATIONS HISTORY & ARCHIVE                             */}
      {/* ════════════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'history' && (
        <div>
          {/* Statistics Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F2044' }}>{historyStats.total}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>إجمالي الحصص المقيمة</div>
            </div>
            <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0096C7' }}>{historyStats.avg} / 10</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>متوسط تقييم الحصص</div>
            </div>
            <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>{historyStats.excellentCount}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>حصص متميزة (≥ 9)</div>
            </div>
            <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6' }}>{historyStats.distinctTeachers}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>عدد المعلمين المقيمين</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🔍</span>
                <span>تصفية وبحث التقييمات</span>
              </h3>
              <button
                type="button"
                onClick={exportToExcel}
                style={{
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>📊</span>
                <span>تصدير كشف Excel</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* Year */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  العام الدراسي
                </label>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F2044',
                  }}
                >
                  <option value="">جميع الأعوام</option>
                  {ACADEMIC_YEARS.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  القسم
                </label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F2044',
                  }}
                >
                  <option value="">جميع الأقسام</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  المعلم
                </label>
                <select
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F2044',
                  }}
                >
                  <option value="">جميع المعلمين</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.2rem' }}>
                  بحث عام
                </label>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الأداة أو الحضور..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F2044',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Evaluations Table */}
          <div style={cardStyle}>
            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>لا توجد تقييمات مسجلة مطابقة للبحث</p>
                {isAdmin && <p style={{ fontSize: '0.8rem' }}>يمكنك إضافة تقييم جديد من تبويب "نموذج التقييم"</p>}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'center' }}>
                      <th style={{ padding: '0.75rem 0.5rem', borderRadius: '0 8px 0 0' }}>#</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>المعلم (Teacher)</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>القسم</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>التاريخ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>الحصة / الصف</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>الحضور</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>الأدلة / الخطة</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>التقييم العام</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>التقدير</th>
                      <th style={{ padding: '0.75rem 0.5rem', borderRadius: '8px 0 0 0' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((ev, idx) => {
                      const badge = getPerformanceBadge(ev.overallScore);
                      return (
                        <tr
                          key={ev.id}
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            background: idx % 2 === 0 ? '#fff' : '#F8FAFC',
                            textAlign: 'center',
                          }}
                        >
                          <td style={{ padding: '0.7rem 0.5rem', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#0F2044' }}>{ev.teacherNameAr}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{ev.teacherNameEn}</div>
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem', fontWeight: 700, color: '#475569' }}>
                            {ev.departmentName}
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem', direction: 'ltr', color: '#0F2044', fontWeight: 700 }}>
                            {ev.date}
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem', color: '#475569', fontWeight: 600 }}>
                            حصة {ev.period} | صف {ev.classGrade}
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.75rem' }}>
                            {ev.attendees || '-'}
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>
                            {ev.lessonPlanUrl ? (
                              <a
                                href={ev.lessonPlanUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: 'rgba(2, 132, 199, 0.12)',
                                  color: '#0284C7',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                              >
                                <span>📎</span>
                                <span>أنقر هنا</span>
                              </a>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem', fontWeight: 900, color: '#0F2044', fontSize: '1rem' }}>
                            {ev.overallScore} / 10
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.7rem 0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem' }}>
                              <button
                                type="button"
                                onClick={() => handleViewOrEdit(ev)}
                                title={isAdmin ? 'عرض وتعديل' : 'عرض وطباعة التقرير'}
                                style={{
                                  background: 'rgba(0,150,199,0.12)',
                                  color: '#0096C7',
                                  border: 'none',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                {isAdmin ? '✏️ تعديل' : '👁️ عرض'}
                              </button>
                              <button
                                onClick={() => handleSendReport(ev)}
                                style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #BAE6FE', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                title="إرسال التقرير إلى المعلم"
                              >
                                📧 إرسال
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(ev.id)}
                                  title="حذف"
                                  style={{
                                    background: 'rgba(239,68,68,0.12)',
                                    color: '#EF4444',
                                    border: 'none',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Schedule Add / Edit Modal */}
      {isScheduleModalOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              maxWidth: '650px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid #0096C7',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📅</span>
                <span>{editingScheduleItem ? 'تعديل بيانات الحصة المجدولة' : 'إضافة حصة جديدة لجدول التعليم الإلكتروني'}</span>
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748B', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Teacher */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  المعلم *
                </label>
                <select
                  value={schedTeacherId}
                  onChange={e => {
                    const tid = e.target.value;
                    setSchedTeacherId(tid);
                    const t = teachers.find(item => item.id === tid);
                    if (t) {
                      setSchedSubject(t.subject);
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, color: '#0F2044' }}
                >
                  <option value="">-- اختر المعلم --</option>
                  {availableTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr} - ({getDeptName(t.departmentId, departments)} / {t.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  تاريخ الحصة * ({getArabicDay(schedDate)})
                </label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>

              {/* Period */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  الحصة الدراسية *
                </label>
                <select
                  value={schedPeriod}
                  onChange={e => setSchedPeriod(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(p => {
                    const t = SCHOOL_PERIOD_TIMINGS[String(p)];
                    return (
                      <option key={p} value={p}>
                        الحصة {p} {t ? `(${t.startTime} – ${t.endTime})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Class Grade */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  الصف والشعبة *
                </label>
                <input
                  type="text"
                  placeholder="مثال: 10-1 أو 11-AP"
                  value={schedClassGrade}
                  onChange={e => setSchedClassGrade(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  المادة الدراسية
                </label>
                <input
                  type="text"
                  value={schedSubject}
                  onChange={e => setSchedSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Lesson Topic */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  موضوع / عنوان الحصة *
                </label>
                <input
                  type="text"
                  placeholder="مثال: محاكاة الدوائر الكهربائية وتطبيقات الذكاء الاصطناعي"
                  value={schedLessonTopic}
                  onChange={e => setSchedLessonTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600 }}
                />
              </div>

              {/* Venue */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  القاعة / المختبر
                </label>
                <select
                  value={schedVenue}
                  onChange={e => setSchedVenue(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="الصف الدراسي">الصف الدراسي</option>
                  <option value="مختبر الروبوت">مختبر الروبوت</option>
                  <option value="مختبر التصنيع الرقمي (فاب لاب)">مختبر التصنيع الرقمي (فاب لاب)</option>
                  <option value="مختبر الطاقة">مختبر الطاقة</option>
                  <option value="قاعة STEM">قاعة STEM</option>
                  <option value="المكتبة الرقمية">المكتبة الرقمية</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  حالة الحصة
                </label>
                <select
                  value={schedStatus}
                  onChange={e => setSchedStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="مجدولة">🔵 مجدولة</option>
                  <option value="تم التنفيذ">🟢 تم التنفيذ</option>
                  <option value="مؤجلة">🟡 مؤجلة</option>
                  <option value="ملغاة">🔴 ملغاة</option>
                </select>
              </div>

              {/* Tools Selection Chips */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                  الأدوات والتقنيات الرقمية المخطط تفعيلها
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '130px', overflowY: 'auto', padding: '0.5rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {PRESET_TOOLS.map(tool => {
                    const isSelected = schedTools.includes(tool.name);
                    return (
                      <button
                        type="button"
                        key={tool.id}
                        onClick={() => {
                          if (isSelected) {
                            setSchedTools(schedTools.filter(t => t !== tool.name));
                          } else {
                            setSchedTools([...schedTools, tool.name]);
                          }
                        }}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: isSelected ? '#0096C7' : '#CBD5E1',
                          background: isSelected ? '#E0F2FE' : '#fff',
                          color: isSelected ? '#0369A1' : '#475569',
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 800 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="أداة رقمية أخرى (اختياري)..."
                  value={schedCustomTool}
                  onChange={e => setSchedCustomTool(e.target.value)}
                  style={{ width: '100%', marginTop: '0.4rem', padding: '0.45rem 0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                />
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.3rem' }}>
                  ملاحظات إضافية
                </label>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات أو أهداف خاصة بالحصة..."
                  value={schedNotes}
                  onChange={e => setSchedNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveSchedule(false)}
                disabled={savingSchedule}
                style={{ background: '#0F2044', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {savingSchedule ? '⏳ جاري الحفظ...' : editingScheduleItem ? '💾 حفظ التعديل' : '➕ إضافة للجدول'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveSchedule(true)}
                disabled={savingSchedule}
                style={{
                  background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.3rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(0,120,212,0.3)',
                }}
                title="حفظ الحصة في الجدول وفتح نافذة إضافتها إلى تقويم أوتلوك مع التذكير"
              >
                <span>📅</span>
                <span>حفظ وإضافة للأوتلوك</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ OUTLOOK & CALENDAR EXPORT MODAL ══════════ */}
      {calendarLesson && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 32, 68, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            direction: 'rtl',
          }}
          onClick={() => setCalendarLesson(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Microsoft Outlook Theme */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0078D4 0%, #004E8C 100%)',
                padding: '1.25rem 1.5rem',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                    إضافة الحصة إلى تقويم أوتلوك (Outlook)
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#BAE6FD' }}>
                    حفظ موعد الحصة النموذجية وتفعيل التذكير والتنبيه المسبق
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCalendarLesson(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Lesson Details Summary Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>👨‍🏫 المعلم: </span>
                    <strong style={{ color: '#0F2044' }}>{calendarLesson.teacherNameAr}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>📚 المادة والقسم: </span>
                    <strong style={{ color: '#0F2044' }}>{calendarLesson.subject || calendarLesson.departmentName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>📅 اليوم والتاريخ: </span>
                    <strong style={{ color: '#0078D4' }}>{calendarLesson.dayName || getArabicDay(calendarLesson.date)} ({calendarLesson.date})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>⏰ الحصة والتوقيت: </span>
                    <strong style={{ color: '#D97706' }}>
                      الحصة {calendarLesson.period} ({getPeriodTiming(calendarLesson.period).startTime} - {getPeriodTiming(calendarLesson.period).endTime})
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>🏫 الصف: </span>
                    <strong style={{ color: '#0F2044' }}>{calendarLesson.classGrade}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 700 }}>📍 القاعة / المكان: </span>
                    <strong style={{ color: '#0F2044' }}>{calendarLesson.roomVenue || 'الصف الدراسي'}</strong>
                  </div>
                  {calendarLesson.lessonTopic && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', fontWeight: 700 }}>🎯 موضوع الحصة: </span>
                      <strong style={{ color: '#0F2044' }}>{calendarLesson.lessonTopic}</strong>
                    </div>
                  )}
                  {calendarLesson.toolsPlanned && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', fontWeight: 700 }}>💻 الأدوات الرقمية: </span>
                      <span style={{ color: '#0369A1', fontWeight: 600 }}>{calendarLesson.toolsPlanned}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reminder Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                  🔔 وقت التنبيه والتذكير قبل الحصة:
                </label>
                <select
                  value={calendarReminderMins}
                  onChange={e => setCalendarReminderMins(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0F2044',
                    background: '#fff',
                  }}
                >
                  <option value={15}>⏰ قبل الحصة بـ 15 دقيقة (الموصى به لتجهيز الأدوات والصف)</option>
                  <option value={30}>⏰ قبل الحصة بـ 30 دقيقة</option>
                  <option value={45}>⏰ قبل الحصة بـ 45 دقيقة</option>
                  <option value={60}>⏰ قبل الحصة بساعة واحدة (60 دقيقة)</option>
                  <option value={120}>⏰ قبل الحصة بساعتين</option>
                  <option value={1440}>⏰ قبل الموعد بيوم كامل (24 ساعة)</option>
                  <option value={0}>⏰ في نفس وقت بدء الحصة بالضبط</option>
                </select>
              </div>

              {/* Action Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Option 1: Download .ics for Outlook App / Phone */}
                <button
                  type="button"
                  onClick={() => {
                    const ics = generateIcsForLesson(calendarLesson, calendarReminderMins);
                    const filename = `حصة_إلكترونية_${calendarLesson.teacherNameAr.replace(/\s+/g, '_')}_حصة${calendarLesson.period}_${calendarLesson.date}.ics`;
                    downloadIcsFile(filename, ics);
                    showToast('✅ تم تنزيل ملف التقويم بنجاح! افتح الملف للإضافة الفورية إلى تطبيق Outlook مع تفعيل المنبه', 'success');
                    setCalendarLesson(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.85rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 10px rgba(0,120,212,0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💻</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                        تنزيل لبرنامج Outlook وتطبيق التقويم (.ics)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#BAE6FD', fontWeight: 500 }}>
                        يفتح مباشرة في Microsoft Outlook (الكمبيوتر أو الموبايل) مع تفعيل التنبيه
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem' }}>📥</span>
                </button>

                {/* Option 2: Open in Outlook Web (Office 365 / Ministry) */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getOutlookWebCalendarUrl(calendarLesson);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    showToast('🌐 جاري فتح Outlook Web في تبويب جديد...', 'info');
                    setCalendarLesson(null);
                  }}
                  style={{
                    background: '#F0F9FF',
                    color: '#0369A1',
                    border: '1.5px solid #BAE6FD',
                    padding: '0.85rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🌐</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                        فتح في Outlook Web (حساب وزارة التعليم @education.qa)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 500 }}>
                        إضافة سريعة إلى تقويم Office 365 عبر المتصفح
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem' }}>↗️</span>
                </button>

                {/* Option 3: Google Calendar as secondary option */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getGoogleCalendarUrl(calendarLesson);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    showToast('📅 جاري فتح Google Calendar...', 'info');
                    setCalendarLesson(null);
                  }}
                  style={{
                    background: '#F8FAFC',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    padding: '0.65rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>📆</span>
                    <span>إضافة إلى تقويم Google (Google Calendar)</span>
                  </div>
                  <span>↗️</span>
                </button>
              </div>

              {/* Note / Tip */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: '#F1F5F9',
                  borderRadius: '8px',
                  padding: '0.6rem 0.9rem',
                  fontSize: '0.75rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>💡</span>
                <span>
                  سيتم تذكيرك بالموعد قبل الحصة بـ {calendarReminderMins === 0 ? 'نفس الوقت' : `${calendarReminderMins} دقيقة`} وفق التوقيت المدرسي المعتمد (45 دقيقة للحصة).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
