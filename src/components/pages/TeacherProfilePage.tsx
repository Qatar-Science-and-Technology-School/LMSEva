'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  db,
  MONTHS,
  ACADEMIC_YEARS,
  getPerformanceLevel,
  getDeptName,
  EVALUATION_CRITERIA,
  QES_LMS_CRITERIA,
  SCHOOL_NAME,
  getTeacherRecognitionHistory,
  getMonthlyDepartmentHonorees,
  isSuperAdmin,
  isTeacherUser,
  generateId,
  matchTeacherFromRecord,
  initialTeachers,
} from '@/lib/data';
import { invalidateCache, saveDocument, COLLECTIONS } from '@/lib/firestoreDb';
import type {
  User,
  Teacher,
  Evaluation,
  Department,
  ModelLessonEvaluation,
  ModelLessonScheduleItem,
  Achievement,
  TeacherFeedbackRecord,
} from '@/lib/data';
import {
  type IndividualPDRecord,
  type Workshop,
  sortIndividualRecordsNewestFirst,
  sortWorkshopsNewestFirst,
} from '@/lib/pdData';
import {
  TeacherDistanceLesson,
  DISTANCE_LEARNING_CLASSES,
  DISTANCE_LEARNING_PERIODS,
  SCHOOL_PERIOD_OPTIONS,
  getArabicDayName,
  loadTeacherDistanceLessons,
  fetchTeacherDistanceLessonsFromCloud,
  saveSingleTeacherDistanceLesson,
  removeTeacherDistanceLesson,
} from '@/lib/distanceLearningData';
import { printTeacherDistanceLessonsScheduleReport } from '@/lib/distanceLearningReportPrinter';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import PrintHeader from '@/components/PrintHeader';

export type TeacherProfileTab =
  | 'overview'
  | 'modellessons'
  | 'distance_learning'
  | 'feedback'
  | 'reports'
  | 'pd'
  | 'achievements';

const AR_TO_EN_MONTH: Record<string, string> = {
  'يناير': 'January',
  'فبراير': 'February',
  'مارس': 'March',
  'أبريل': 'April',
  'مايو': 'May',
  'يونيو': 'June',
  'يوليو': 'July',
  'أغسطس': 'August',
  'سبتمبر': 'September',
  'أكتوبر': 'October',
  'نوفمبر': 'November',
  'ديسمبر': 'December',
};

const AR_TO_EN_DAY: Record<string, string> = {
  'الأحد': 'Sunday',
  'الإثنين': 'Monday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الاربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
  'السبت': 'Saturday',
};

const AR_TO_EN_PERF: Record<string, string> = {
  'متميز': 'Distinguished',
  'متقدم جدًا': 'Very Advanced',
  'يحتاج إلى متابعة وخطة تحسين': 'Needs Follow-up & Improvement',
};

const AR_TO_EN_MEEE_STATUS: Record<string, string> = {
  'حصل على الشهادة': 'Certified (MIEE)',
  'تم التقديم': 'Application Submitted',
  'لم يتم التقديم بعد': 'Not Applied Yet',
  'لم يتقدم بعد': 'Not Applied Yet',
};

interface Props {
  teacherId: string;
  currentUser: User;
  onBack: () => void;
  selectedYear?: string;
  activeTabProp?: TeacherProfileTab;
  onTabChange?: (tab: TeacherProfileTab) => void;
  isTeacherPortal?: boolean;
  langProp?: 'ar' | 'en';
  onLangChange?: (lang: 'ar' | 'en') => void;
}

export default function TeacherProfilePage({
  teacherId,
  currentUser,
  onBack,
  selectedYear: propYear,
  activeTabProp,
  onTabChange,
  isTeacherPortal = false,
  langProp,
  onLangChange,
}: Props) {
  const isAdmin = isSuperAdmin(currentUser);
  const isOwnTeacherAccount = isTeacherUser(currentUser) && currentUser.teacherId === teacherId;
  const canTeacherAct = isOwnTeacherAccount || isAdmin;

  const [internalLang, setInternalLang] = useState<'ar' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qstss_teacher_lang') === 'en' ? 'en' : 'ar';
    }
    return 'ar';
  });

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('qstss_teacher_lang');
      if (saved === 'en' || saved === 'ar') setInternalLang(saved);
    };
    window.addEventListener('qstss_teacher_lang_changed', sync);
    return () => window.removeEventListener('qstss_teacher_lang_changed', sync);
  }, []);

  const lang: 'ar' | 'en' = langProp || internalLang;
  const isEn = lang === 'en';
  const tr = (ar: string, en: string) => (isEn ? en : ar);
  const trMonth = (m?: string) => (m ? (isEn ? AR_TO_EN_MONTH[m] || m : m) : '-');
  const trDay = (d?: string) => (d ? (isEn ? AR_TO_EN_DAY[d] || d : d) : '');
  const trPerf = (lbl?: string) => (lbl ? (isEn ? AR_TO_EN_PERF[lbl] || lbl : lbl) : '-');
  const trMeee = (st?: string) => (st ? (isEn ? AR_TO_EN_MEEE_STATUS[st] || st : st) : tr('لم يتقدم بعد', 'Not Applied Yet'));

  const handleSetLang = (next: 'ar' | 'en') => {
    setInternalLang(next);
    if (onLangChange) onLangChange(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qstss_teacher_lang', next);
      window.dispatchEvent(new Event('qstss_teacher_lang_changed'));
    }
  };

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<ModelLessonEvaluation[]>([]);
  const [modelLessonSchedules, setModelLessonSchedules] = useState<ModelLessonScheduleItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [individualRecords, setIndividualRecords] = useState<IndividualPDRecord[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<any[]>([]);
  const [distanceLessons, setDistanceLessons] = useState<TeacherDistanceLesson[]>([]);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalTab, setInternalTab] = useState<TeacherProfileTab>('overview');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const activeTab = activeTabProp || internalTab;
  const setActiveTab = (t: TeacherProfileTab) => {
    setInternalTab(t);
    if (onTabChange) onTabChange(t);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Feedback modal / form state
  const [feedbackModal, setFeedbackModal] = useState<{
    targetType: 'monthly_evaluation' | 'model_lesson' | 'scheduled_lesson' | 'general';
    targetId: string;
    targetTitle: string;
    academicYear: string;
    month?: string;
    opinionText: string;
    actionTaken: string;
    acknowledged: boolean;
  } | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Distance Learning (Teams) lesson form state (Only: Date, Class 7A..12E, Period 1..7, Link)
  const todayStr = new Date().toISOString().split('T')[0];
  const [editingDlLesson, setEditingDlLesson] = useState<TeacherDistanceLesson | null>(null);
  const [dlDate, setDlDate] = useState(todayStr);
  const [dlClassCode, setDlClassCode] = useState<string>('7A');
  const [dlPeriod, setDlPeriod] = useState<string>('1');
  const [dlTeamsLink, setDlTeamsLink] = useState('');
  const [savingDl, setSavingDl] = useState(false);

  const loadProfileData = useCallback(() => {
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getModelLessonEvaluations().catch(() => []),
      db.getModelLessonSchedules().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getIndividualPDRecords().catch(() => []),
      db.getWorkshops().catch(() => []),
      db.getMeeeRecords().catch(() => []),
      fetchTeacherDistanceLessonsFromCloud().catch(() => loadTeacherDistanceLessons()),
      db.getTeacherFeedbacks().catch(() => []),
    ]).then(([t, e, d, mle, mls, ach, ipd, ws, meee, dl, fb]) => {
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setModelLessonEvals(mle || []);
      setModelLessonSchedules(mls || []);
      setAchievements(ach);
      setIndividualRecords(ipd);
      setWorkshops(ws);
      setMeeeRecords(meee);
      setDistanceLessons(dl || []);
      setFeedbacks(fb || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadProfileData();
    const handleUpdate = () => loadProfileData();
    window.addEventListener('qstss_data_updated', handleUpdate);
    window.addEventListener('qstss_teacher_dl_lessons_updated', handleUpdate);
    return () => {
      window.removeEventListener('qstss_data_updated', handleUpdate);
      window.removeEventListener('qstss_teacher_dl_lessons_updated', handleUpdate);
    };
  }, [loadProfileData]);

  const teacher = useMemo(() => teachers.find(t => t.id === teacherId), [teachers, teacherId]);

  const recognitionHistory = useMemo(() => {
    return getTeacherRecognitionHistory(evaluations, teachers, departments, teacherId);
  }, [evaluations, teachers, departments, teacherId]);

  const isOfficialHonoree = useMemo(() => {
    if (!teacher) return false;
    const honorees = getMonthlyDepartmentHonorees(
      evaluations,
      teachers,
      departments,
      propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1],
      ''
    );
    return honorees.some(h => h.teacher?.id === teacher.id);
  }, [evaluations, teachers, departments, teacher, propYear]);

  // Model lessons for this teacher ONLY
  const teacherModelLessons = useMemo(() => {
    return modelLessonEvals
      .filter(
        m =>
          m.teacherId === teacherId ||
          (teacher && m.teacherNameAr && m.teacherNameAr.includes(teacher.nameAr))
      )
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [modelLessonEvals, teacherId, teacher]);

  const teacherScheduledLessons = useMemo(() => {
    return modelLessonSchedules
      .filter(
        s =>
          s.teacherId === teacherId ||
          (teacher && s.teacherNameAr && s.teacherNameAr.includes(teacher.nameAr))
      )
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [modelLessonSchedules, teacherId, teacher]);

  // Distance Learning (Teams) lessons for this teacher ONLY
  const teacherDistanceLessons = useMemo(() => {
    return distanceLessons.filter(
      l =>
        l.teacherId === teacherId ||
        (teacher && l.teacherNameAr && l.teacherNameAr.includes(teacher.nameAr))
    );
  }, [distanceLessons, teacherId, teacher]);

  // Feedbacks submitted by this teacher ONLY
  const teacherFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.teacherId === teacherId);
  }, [feedbacks, teacherId]);

  // Achievements for this teacher ONLY
  const teacherAchievements = useMemo(() => {
    if (!teacher) return [];
    const deptObj = departments.find(d => d.id === teacher.departmentId);
    return achievements.filter(
      a =>
        (a.supervisorName && a.supervisorName.includes(teacher.nameAr)) ||
        (a.achievementName && a.achievementName.includes(teacher.nameAr)) ||
        (deptObj && a.organizer && a.organizer.includes(deptObj.nameAr.replace('قسم ', '')))
    );
  }, [achievements, teacher, departments]);

  // PD records (Individual & Self-Training) for this teacher ONLY
  const teacherPD = useMemo(() => {
    if (!teacher) return [];
    const tList = teachers.length > 0 ? teachers : initialTeachers;
    const matched = individualRecords.filter(r => {
      if (r.teacherId && r.teacherId === teacherId) return true;
      const m = matchTeacherFromRecord(r.traineeNameAr || (r as any).teacherName, r.teacherId, tList);
      if (m && m.id === teacher.id) return true;
      return Boolean(r.traineeNameAr && r.traineeNameAr.includes(teacher.nameAr));
    });
    return sortIndividualRecordsNewestFirst(matched);
  }, [individualRecords, teacherId, teacher, teachers]);

  // Collective Workshops attended by this teacher ONLY
  const teacherWorkshops = useMemo(() => {
    if (!teacher) return [];
    const tList = teachers.length > 0 ? teachers : initialTeachers;
    const matched = workshops.filter(w => {
      const inAttendees =
        w.attendees &&
        w.attendees.some(att => {
          if (att.teacherId && att.teacherId === teacherId) return true;
          const m = matchTeacherFromRecord(att.name, att.teacherId, tList);
          if (m && m.id === teacher.id) return true;
          return Boolean(att.name && att.name.includes(teacher.nameAr));
        });
      const isTrainer =
        (w.trainerName &&
          (w.trainerName.includes(teacher.nameAr) ||
            matchTeacherFromRecord(w.trainerName, undefined, tList)?.id === teacher.id)) ||
        (w.facilitatorName &&
          (w.facilitatorName.includes(teacher.nameAr) ||
            matchTeacherFromRecord(w.facilitatorName, undefined, tList)?.id === teacher.id));
      return Boolean(inAttendees || isTrainer);
    });
    return sortWorkshopsNewestFirst(matched);
  }, [workshops, teacherId, teacher, teachers]);

  // MEEE for this teacher ONLY
  const teacherMeee = useMemo(() => {
    if (!teacher) return null;
    const tList = teachers.length > 0 ? teachers : initialTeachers;
    return (
      meeeRecords.find(m => {
        if (m.teacherId && m.teacherId === teacherId) return true;
        const matched = matchTeacherFromRecord(m.teacherName, m.teacherId, tList);
        if (matched && matched.id === teacher.id) return true;
        return Boolean(m.teacherName && m.teacherName.includes(teacher.nameAr));
      }) || null
    );
  }, [meeeRecords, teacherId, teacher, teachers]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', direction: isEn ? 'ltr' : 'rtl', color: '#64748B' }}>
        {tr('⏳ جاري تحميل بيانات وملف المعلم الخاص...', '⏳ Loading teacher profile and analytics...')}
      </div>
    );
  }

  if (!teacher) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{tr('معلم غير موجود', 'Teacher not found')}</div>;
  }

  const teacherEvals = evaluations.filter(e => e.teacherId === teacherId);
  const deptEvals = evaluations.filter(
    e => teachers.find(t => t.id === e.teacherId)?.departmentId === teacher.departmentId
  );
  const deptObj = departments.find(d => d.id === teacher.departmentId);
  const deptNameAr = getDeptName(teacher.departmentId, departments);
  const deptName = isEn ? (deptObj?.nameEn || deptNameAr) : deptNameAr;
  const displayTeacherName = isEn ? (teacher.nameEn || teacher.nameAr) : teacher.nameAr;

  // Stats
  const allScores = teacherEvals.map(e => e.totalScore);
  const avgAll = allScores.length
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 0;
  const best = allScores.length ? Math.max(...allScores) : 0;
  const worst = allScores.length ? Math.min(...allScores) : 0;
  const bestMonth = teacherEvals.find(e => e.totalScore === best);
  const worstMonth = teacherEvals.find(e => e.totalScore === worst);

  const activeYear = propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];
  const currentYearEvals = teacherEvals.filter(e => e.academicYear === activeYear);
  const currentAvg = currentYearEvals.length
    ? Math.round((currentYearEvals.reduce((s, e) => s + e.totalScore, 0) / currentYearEvals.length) * 10) / 10
    : 0;
  const perf = getPerformanceLevel(currentAvg || avgAll);

  // Monthly trend for current year
  const teacherSeriesKey = tr('المعلم', 'Teacher');
  const deptSeriesKey = tr('القسم', 'Department');
  const monthlyTrend = MONTHS.map(m => {
    const ev = teacherEvals.find(e => e.month === m && e.academicYear === activeYear);
    const deptEv = deptEvals.filter(e => e.month === m && e.academicYear === activeYear);
    const deptAvg = deptEv.length
      ? Math.round((deptEv.reduce((s, e) => s + e.totalScore, 0) / deptEv.length) * 10) / 10
      : 0;
    return {
      name: trMonth(m),
      [teacherSeriesKey]: ev?.totalScore ?? null,
      [deptSeriesKey]: deptAvg || null,
    };
  });

  // Helper to get feedback for a specific evaluation or lesson
  const getFeedbackForTarget = (targetId: string, fallbackOpinion?: string, fallbackNotes?: string) => {
    const found = teacherFeedbacks.find(f => f.targetId === targetId);
    if (found) return found;
    if (fallbackOpinion || fallbackNotes) {
      return {
        id: `fb_${targetId}`,
        teacherId,
        teacherNameAr: teacher.nameAr,
        departmentName: deptName,
        targetType: 'monthly_evaluation' as const,
        targetId,
        targetTitle: '',
        academicYear: activeYear,
        opinionText: fallbackOpinion || '',
        actionTaken: fallbackNotes || '',
        acknowledged: true,
        createdAt: '',
        updatedAt: '',
      };
    }
    return null;
  };

  // Open feedback editor
  const openFeedbackEditor = (
    targetType: 'monthly_evaluation' | 'model_lesson' | 'scheduled_lesson' | 'general',
    targetId: string,
    targetTitle: string,
    academicYear: string,
    month?: string,
    existingOpinion?: string,
    existingNotes?: string
  ) => {
    const existing = getFeedbackForTarget(targetId, existingOpinion, existingNotes);
    setFeedbackModal({
      targetType,
      targetId,
      targetTitle,
      academicYear,
      month,
      opinionText: existing?.opinionText || '',
      actionTaken: existing?.actionTaken || '',
      acknowledged: existing ? existing.acknowledged : true,
    });
  };

  // Save Teacher Opinion & Notes
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModal) return;
    if (!feedbackModal.opinionText.trim()) {
      alert('يرجى كتابة رأي أو ملاحظات المعلم قبل الحفظ');
      return;
    }
    setSavingFeedback(true);
    try {
      const now = new Date().toISOString();
      const existing = teacherFeedbacks.find(f => f.targetId === feedbackModal.targetId);
      const record: TeacherFeedbackRecord = {
        id: existing?.id || `TFB-${teacherId}-${feedbackModal.targetId}`,
        teacherId,
        teacherNameAr: teacher.nameAr,
        departmentName: deptName,
        targetType: feedbackModal.targetType,
        targetId: feedbackModal.targetId,
        targetTitle: feedbackModal.targetTitle,
        academicYear: feedbackModal.academicYear,
        month: feedbackModal.month,
        opinionText: feedbackModal.opinionText.trim(),
        actionTaken: feedbackModal.actionTaken.trim(),
        acknowledged: feedbackModal.acknowledged,
        acknowledgedAt: feedbackModal.acknowledged ? now : undefined,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      await db.saveTeacherFeedback(record);

      // Also sync onto Evaluation or ModelLessonEvaluation document
      if (feedbackModal.targetType === 'monthly_evaluation') {
        const targetEv = evaluations.find(ev => ev.id === feedbackModal.targetId);
        if (targetEv) {
          const updatedEv: Evaluation = {
            ...targetEv,
            teacherOpinion: record.opinionText,
            teacherNotes: record.actionTaken,
            teacherAcknowledged: record.acknowledged,
            teacherFeedbackDate: now,
            updatedAt: now,
          };
          await saveDocument(COLLECTIONS.evaluations, updatedEv);
          setEvaluations(prev => prev.map(x => (x.id === updatedEv.id ? updatedEv : x)));
        }
      } else if (feedbackModal.targetType === 'model_lesson') {
        const targetMl = modelLessonEvals.find(ml => ml.id === feedbackModal.targetId);
        if (targetMl) {
          const updatedMl: ModelLessonEvaluation = {
            ...targetMl,
            teacherOpinion: record.opinionText,
            teacherNotes: record.actionTaken,
            teacherAcknowledged: record.acknowledged,
            teacherFeedbackDate: now,
            updatedAt: now,
          };
          await saveDocument(COLLECTIONS.modelLessonEvaluations, updatedMl);
          setModelLessonEvals(prev => prev.map(x => (x.id === updatedMl.id ? updatedMl : x)));
        }
      }

      setFeedbacks(prev => {
        const idx = prev.findIndex(x => x.id === record.id);
        return idx >= 0 ? prev.map(x => (x.id === record.id ? record : x)) : [record, ...prev];
      });
      setFeedbackModal(null);
      showToast('✅ تم حفظ رأي وملاحظات المعلم بنجاح');
    } catch (err) {
      console.error('Error saving teacher feedback:', err);
      showToast('حدث خطأ أثناء حفظ الملاحظات', 'error');
    }
    setSavingFeedback(false);
  };

  // Save Distance Learning Teams Lesson (Only: Date, Class 7A..12E, Period 1..7, Link)
  const handleSaveDlLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dlTeamsLink.trim()) {
      alert('يرجى إدخال الرابط (Link From Teams)');
      return;
    }
    setSavingDl(true);
    try {
      const now = new Date().toISOString();
      const gradeNumMatch = dlClassCode.match(/\d+/);
      const gradeNum = gradeNumMatch ? gradeNumMatch[0] : '7';
      const secLetter = dlClassCode.replace(/\d+/g, '') || 'A';
      const periodTiming = SCHOOL_PERIOD_OPTIONS.find(p => p.id === String(dlPeriod));

      const lesson: TeacherDistanceLesson = {
        id: editingDlLesson?.id || `TDL-${teacherId}-${Date.now().toString().slice(-6)}`,
        teacherId,
        teacherNameAr: teacher.nameAr,
        teacherNameEn: teacher.nameEn,
        departmentId: teacher.departmentId,
        departmentName: deptName,
        subject: teacher.subject,
        lessonTitle: `حصة ${teacher.subject} (${dlClassCode})`,
        grade: `الصف ${gradeNum}`,
        section: secLetter,
        gradeSection: dlClassCode,
        date: dlDate,
        dayName: getArabicDayName(dlDate),
        period: String(dlPeriod),
        startTime: periodTiming?.startTime || '',
        endTime: periodTiming?.endTime || '',
        teamsLink: dlTeamsLink.trim(),
        platform: 'Microsoft Teams',
        studentNotes: '',
        status: 'مجدولة',
        academicYear: activeYear,
        createdAt: editingDlLesson?.createdAt || now,
        updatedAt: now,
      };

      const updatedAll = await saveSingleTeacherDistanceLesson(lesson);
      setDistanceLessons(updatedAll);
      setEditingDlLesson(null);
      setDlTeamsLink('');
      showToast(editingDlLesson ? '✅ تم تحديث حصة التعلم عن بعد بنجاح' : '✅ تمت إضافة حصة التعلم عن بعد (Link From Teams) بنجاح');
    } catch (err) {
      console.error('Error saving DL lesson:', err);
      showToast('حدث خطأ أثناء حفظ حصة التعلم عن بعد', 'error');
    }
    setSavingDl(false);
  };

  const handleEditDlLesson = (lesson: TeacherDistanceLesson) => {
    setEditingDlLesson(lesson);
    setDlDate(lesson.date);
    setDlClassCode(
      DISTANCE_LEARNING_CLASSES.includes(lesson.gradeSection as any) ? lesson.gradeSection : '7A'
    );
    const pDigits = String(lesson.period || '1').replace(/\D/g, '');
    setDlPeriod(pDigits && ['1', '2', '3', '4', '5', '6', '7'].includes(pDigits) ? pDigits : '1');
    setDlTeamsLink(lesson.teamsLink);
  };

  const handleDeleteDlLesson = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف حصة التعلم عن بعد هذه؟')) return;
    const remaining = await removeTeacherDistanceLesson(id);
    setDistanceLessons(remaining);
    showToast('🗑️ تم حذف حصة التعلم عن بعد');
  };

  // Print Single Monthly Evaluation Report for Teacher
  const printSingleMonthlyEvaluation = (ev: Evaluation) => {
    const fb = getFeedbackForTarget(ev.id, ev.teacherOpinion, ev.teacherNotes);
    const p = getPerformanceLevel(ev.totalScore);
    const criteriaRows = EVALUATION_CRITERIA.map((cLabel, idx) => {
      const c = ev.criteria?.[idx];
      const qesDef = QES_LMS_CRITERIA?.[idx];
      return `
        <tr>
          <td style="text-align:center; font-weight:800;">${idx + 1}</td>
          <td style="font-weight:700; color:#0F2044;">${(qesDef as any)?.label || (qesDef as any)?.title || cLabel}</td>
          <td style="text-align:center; font-weight:900; color:#0369A1;">${c?.score ?? 0} / 20</td>
          <td style="color:#475569;">${c?.note || 'مستوفى وفق معايير التقييم'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>تقرير تقييم نظام قطر للتعليم — ${teacher.nameAr} — ${ev.month} ${ev.academicYear}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Cairo', sans-serif; color: #0F2044; padding: 12px; direction: rtl; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0F2044; padding-bottom: 10px; margin-bottom: 14px; }
            .banner { background: linear-gradient(135deg, #0F2044 0%, #0284C7 100%); color: #fff; padding: 12px 16px; border-radius: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 9pt; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
            th { background: #0F2044; color: #fff; padding: 8px; border: 1px solid #0F2044; }
            td { padding: 7px 8px; border: 1px solid #CBD5E1; }
            .box { border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-size: 9pt; background: #F8FAFC; }
            .teacher-fb-box { border: 2px solid #0284C7; background: #F0F9FF; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 9pt; }
            .sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; padding-top: 12px; border-top: 2px dashed #CBD5E1; text-align: center; font-size: 8.5pt; }
            .sig-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/ministry-logo.png" style="height:60px; object-fit:contain;" onerror="this.style.display='none'" />
            <div style="text-align:center;">
              <div style="font-weight:800; font-size:10pt;">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
              <div style="font-weight:900; font-size:11.5pt; margin-top:2px;">${SCHOOL_NAME}</div>
              <div style="font-weight:700; font-size:8.5pt; color:#0284C7;">قسم التعليم الإلكتروني والحلول الرقمية — تقرير تقييم المعلم الفردي المعتمد</div>
            </div>
            <img src="/school-logo.png" style="height:60px; object-fit:contain;" onerror="this.style.display='none'" />
          </div>

          <div class="banner">
            <div>
              <div style="font-size:13pt; font-weight:900;">تقرير تقييم تفعيل نظام قطر للتعليم (LMS) — شهر ${ev.month}</div>
              <div style="font-size:8.5pt; color:#BAE6FD;">العام الأكاديمي: ${ev.academicYear} | تاريخ التقييم: ${ev.evaluationDate || '-'}</div>
            </div>
            <div style="text-align:center; background:rgba(255,255,255,0.15); padding:6px 14px; border-radius:8px;">
              <div style="font-size:15pt; font-weight:900;">${ev.totalScore}%</div>
              <div style="font-size:8pt; font-weight:800;">${p.label}</div>
            </div>
          </div>

          <div class="info-grid">
            <div><strong>اسم المعلم:</strong> ${teacher.nameAr}</div>
            <div><strong>القسم الأكاديمي:</strong> ${deptName}</div>
            <div><strong>المادة الدراسية:</strong> ${teacher.subject}</div>
            <div><strong>الرقم الوظيفي:</strong> ${teacher.employeeId}</div>
            <div><strong>البريد الرسمي:</strong> ${teacher.email}</div>
            <div><strong>متوسط الدرجة:</strong> ${ev.averageScore} / 20</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>معيار التقييم المعتمد في نظام قطر للتعليم</th>
                <th style="width:95px;">الدرجة</th>
                <th>الملاحظات والشواهد</th>
              </tr>
            </thead>
            <tbody>${criteriaRows}</tbody>
          </table>

          <div class="box"><strong>✅ نقاط القوة والتميز:</strong> ${ev.strengths || 'التزام متميز بتفعيل الدروس والتقييمات الرقمية'}</div>
          <div class="box"><strong>🔧 جوانب التحسين والتطوير:</strong> ${ev.improvementAreas || 'الاستمرار في تعزيز التفاعل الرقمي'}</div>
          <div class="box"><strong>💡 التوصيات والخطة الإجرائية:</strong> ${ev.recommendations || '-'} ${ev.actionPlan ? ` | ${ev.actionPlan}` : ''}</div>

          <div class="teacher-fb-box">
            <div style="font-weight:900; color:#0369A1; margin-bottom:4px;">💬 رأي المعلم وملاحظاته على التقييم:</div>
            <div style="color:#0F2044; font-weight:700;">${fb?.opinionText || 'لم يتم إضافة ملاحظات من قبل المعلم بعد.'}</div>
            ${fb?.actionTaken ? `<div style="margin-top:4px; color:#334155;"><strong>الإجراءات المتخذة من المعلم:</strong> ${fb.actionTaken}</div>` : ''}
            <div style="margin-top:4px; font-size:8pt; color:#059669; font-weight:800;">
              ${fb?.acknowledged ? '✓ أقر المعلم بالاطلاع على التقييم' : ''}
            </div>
          </div>

          <div class="sigs">
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">توقيع المعلم وإقراره بالاطلاع</div>
              <div style="font-weight:900; margin:4px 0;">${teacher.nameAr}</div>
              <div style="font-size:7.5pt; color:#059669; font-weight:800; margin-top:8px;">✓ تم الاطلاع إلكترونياً عبر بوابة المعلم</div>
            </div>
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">منسق المشاريع الإلكترونية</div>
              <div style="font-weight:900; margin:4px 0;">م. أحمد عادل طبيشات</div>
              <img src="/signature-ahmad.png" style="height:34px; object-fit:contain;" onerror="this.style.display='none'" />
            </div>
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">النائب الأكاديمي</div>
              <div style="font-weight:900; margin:4px 0;">د. راني التوم</div>
              <img src="/signature-rani.png" style="height:34px; object-fit:contain;" onerror="this.style.display='none'" />
            </div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
        </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=950,height=900');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  // Print Single Model Lesson Evaluation Report for Teacher
  const printSingleModelLesson = (ml: ModelLessonEvaluation) => {
    const fb = getFeedbackForTarget(ml.id, ml.teacherOpinion, ml.teacherNotes);
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>تقرير تقييم حصة التعليم الإلكتروني — ${teacher.nameAr} — ${ml.date}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Cairo', sans-serif; color: #0F2044; padding: 12px; direction: rtl; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0F2044; padding-bottom: 10px; margin-bottom: 14px; }
            .banner { background: linear-gradient(135deg, #0F2044 0%, #4338CA 100%); color: #fff; padding: 12px 16px; border-radius: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 9pt; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
            th { background: #0F2044; color: #fff; padding: 8px; border: 1px solid #0F2044; }
            td { padding: 7px 8px; border: 1px solid #CBD5E1; }
            .box { border: 1px solid #CBD5E1; border-radius: 8px; padding: 9px 12px; margin-bottom: 8px; font-size: 9pt; background: #F8FAFC; }
            .teacher-fb-box { border: 2px solid #0284C7; background: #F0F9FF; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 9pt; }
            .sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #CBD5E1; text-align: center; font-size: 8.5pt; }
            .sig-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/ministry-logo.png" style="height:60px; object-fit:contain;" onerror="this.style.display='none'" />
            <div style="text-align:center;">
              <div style="font-weight:800; font-size:10pt;">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
              <div style="font-weight:900; font-size:11.5pt; margin-top:2px;">${SCHOOL_NAME}</div>
              <div style="font-weight:700; font-size:8.5pt; color:#4338CA;">استمارة زيارة وتقييم حصة تعليم إلكتروني نموذجية</div>
            </div>
            <img src="/school-logo.png" style="height:60px; object-fit:contain;" onerror="this.style.display='none'" />
          </div>

          <div class="banner">
            <div>
              <div style="font-size:13pt; font-weight:900;">تقرير تقييم حصة التعليم الإلكتروني — ${teacher.nameAr}</div>
              <div style="font-size:8.5pt; color:#E0E7FF;">التاريخ: ${ml.date} | الحصة: ${ml.period} | الصف والشعبة: ${ml.classGrade}</div>
            </div>
            <div style="text-align:center; background:rgba(255,255,255,0.18); padding:6px 14px; border-radius:8px;">
              <div style="font-size:15pt; font-weight:900;">${ml.overallScore} / 10</div>
              <div style="font-size:8pt; font-weight:800;">التقييم العام</div>
            </div>
          </div>

          <div class="info-grid">
            <div><strong>اسم المعلم:</strong> ${teacher.nameAr}</div>
            <div><strong>القسم:</strong> ${deptName}</div>
            <div><strong>المادة:</strong> ${teacher.subject}</div>
            <div><strong>التاريخ والحصة:</strong> ${ml.date} (الحصة ${ml.period})</div>
            <div><strong>الصف:</strong> ${ml.classGrade}</div>
            <div><strong>الحضور:</strong> ${ml.attendees || 'منسق المشاريع الإلكترونية'}</div>
            <div style="grid-column: span 3;"><strong>الأدوات والمنصات الرقمية الموظفة:</strong> ${ml.toolsUsed || '-'}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>معيار تقييم حصة التعليم الإلكتروني</th>
                <th style="width:110px;">الدرجة</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="text-align:center;font-weight:800;">1</td><td>التقويم والتغذية الراجعة باستخدام التقنية</td><td style="text-align:center;font-weight:900;">${ml.scoreAssessmentFeedback} / 10</td></tr>
              <tr><td style="text-align:center;font-weight:800;">2</td><td>عمق توظيف التقنية (SAMR / TPACK)</td><td style="text-align:center;font-weight:900;">${ml.scoreTechDepth} / 10</td></tr>
              <tr><td style="text-align:center;font-weight:800;">3</td><td>تنظيم نظام إدارة التعلّم ووضوح المواد</td><td style="text-align:center;font-weight:900;">${ml.scoreLmsClarity} / 10</td></tr>
              <tr><td style="text-align:center;font-weight:800;">4</td><td>إدارة الصف وتوجيه الطلاب باستخدام التقنية</td><td style="text-align:center;font-weight:900;">${ml.scoreClassroomMgmt} / 10</td></tr>
              <tr><td style="text-align:center;font-weight:800;">5</td><td>تقييم تفاعل ومشاركة الطلاب رقميًا</td><td style="text-align:center;font-weight:900;">${ml.scoreStudentEngagement} / 10</td></tr>
              <tr><td style="text-align:center;font-weight:800;">6</td><td>تمكن واستخدام المعلم للأدوات الرقمية</td><td style="text-align:center;font-weight:900;">${ml.scoreTeacherTools} / 10</td></tr>
            </tbody>
          </table>

          <div class="box"><strong>✅ نقاط القوة:</strong> ${ml.strengths || '-'}</div>
          <div class="box"><strong>🔧 جوانب التحسين:</strong> ${ml.improvements || '-'}</div>
          <div class="box"><strong>💡 التوصيات:</strong> ${ml.recommendations || '-'}</div>

          <div class="teacher-fb-box">
            <div style="font-weight:900; color:#0369A1; margin-bottom:4px;">💬 رأي المعلم وملاحظاته حول الحصة:</div>
            <div style="color:#0F2044; font-weight:700;">${fb?.opinionText || 'لم يتم إضافة ملاحظات من قبل المعلم بعد.'}</div>
            ${fb?.actionTaken ? `<div style="margin-top:4px; color:#334155;"><strong>التأمل المهني والإجراءات:</strong> ${fb.actionTaken}</div>` : ''}
          </div>

          <div class="sigs">
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">توقيع المعلم</div>
              <div style="font-weight:900; margin:4px 0;">${teacher.nameAr}</div>
              <div style="font-size:7.5pt; color:#059669; font-weight:800; margin-top:8px;">✓ تم الاطلاع عبر بوابة المعلم</div>
            </div>
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">منسق المشاريع الإلكترونية</div>
              <div style="font-weight:900; margin:4px 0;">م. أحمد عادل طبيشات</div>
              <img src="/signature-ahmad.png" style="height:34px; object-fit:contain;" onerror="this.style.display='none'" />
            </div>
            <div class="sig-card">
              <div style="color:#64748B; font-weight:700;">النائب الأكاديمي</div>
              <div style="font-weight:900; margin:4px 0;">د. راني التوم</div>
              <img src="/signature-rani.png" style="height:34px; object-fit:contain;" onerror="this.style.display='none'" />
            </div>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
        </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=950,height=900');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const handleDeleteMonthlyEval = async (evalId: string, evalMonth: string, evalYear: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`⚠️ تأكيد حذف التقييم:\n\nهل أنت متأكد من رغبتك في حذف تقييم شهر (${evalMonth} ${evalYear}) لهذا المعلم نهائياً؟`))
      return;
    try {
      await db.deleteEvaluation(evalId);
      invalidateCache('evaluations');
      setEvaluations(prev => prev.filter(e => e.id !== evalId));
      showToast('✅ تم حذف التقييم بنجاح');
    } catch {
      showToast('حدث خطأ أثناء حذف التقييم', 'error');
    }
  };

  const handleDeleteModelLesson = async (mlId: string, mlDate: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`⚠️ تأكيد حذف التقييم:\n\nهل أنت متأكد من رغبتك في حذف تقييم حصة التعليم الإلكتروني بتاريخ (${mlDate}) نهائياً؟`))
      return;
    try {
      await db.deleteModelLessonEvaluation(mlId);
      invalidateCache('modelLessonEvaluations');
      setModelLessonEvals(prev => prev.filter(m => m.id !== mlId));
      showToast('✅ تم حذف تقييم الحصة بنجاح');
    } catch {
      showToast('حدث خطأ أثناء حذف تقييم الحصة', 'error');
    }
  };

  // Criteria radar (latest eval)
  const latestEval = [...teacherEvals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const radarData = latestEval
    ? EVALUATION_CRITERIA.map((_, i) => ({
        subject: isEn ? `Criterion ${i + 1}` : `معيار ${i + 1}`,
        value: latestEval.criteria[i]?.score ?? 0,
        fullMark: 20,
      }))
    : [];

  const languageSwitcherPill = (darkBg = false) => (
    <div
      className="no-print"
      style={{
        display: 'inline-flex',
        background: darkBg ? 'rgba(255,255,255,0.14)' : '#F1F5F9',
        border: darkBg ? '1px solid rgba(255,255,255,0.28)' : '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
      }}
      title="تغيير لغة الصفحة / Switch Language"
    >
      <button
        type="button"
        onClick={() => handleSetLang('ar')}
        style={{
          border: 'none',
          borderRadius: '7px',
          padding: '0.32rem 0.7rem',
          fontSize: '0.75rem',
          fontWeight: 900,
          cursor: 'pointer',
          background: !isEn ? (darkBg ? '#38BDF8' : '#0F2044') : 'transparent',
          color: !isEn ? (darkBg ? '#0F2044' : '#fff') : darkBg ? '#E0F2FE' : '#475569',
          transition: 'all 0.15s',
        }}
      >
        🌐 العربية
      </button>
      <button
        type="button"
        onClick={() => handleSetLang('en')}
        style={{
          border: 'none',
          borderRadius: '7px',
          padding: '0.32rem 0.7rem',
          fontSize: '0.75rem',
          fontWeight: 900,
          cursor: 'pointer',
          background: isEn ? (darkBg ? '#38BDF8' : '#0284C7') : 'transparent',
          color: isEn ? (darkBg ? '#0F2044' : '#fff') : darkBg ? '#E0F2FE' : '#475569',
          transition: 'all 0.15s',
        }}
      >
        🌐 English
      </button>
    </div>
  );

  const cardStyle = {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1rem',
  };
  const darkCardStyle = {
    background: '#0F2044',
    borderRadius: '14px',
    padding: '1.25rem',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '1rem',
  };
  const statBox = (label: string, value: string | number, sub?: string, color = '#0F2044') => (
    <div style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '1rem 0.75rem' }}>
      <p style={{ fontSize: '0.7rem', color: '#64748B', margin: '0 0 0.25rem', fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: '1.3rem', fontWeight: 900, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: '0.15rem 0 0', fontWeight: 600 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', direction: isEn ? 'ltr' : 'rtl', maxWidth: '1180px', margin: '0 auto' }}>
      {toast && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '1.5rem',
            zIndex: 9999,
            background: toast.type === 'error' ? '#991B1B' : '#065F46',
            color: '#fff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontWeight: 800,
            fontSize: '0.88rem',
          }}
        >
          {toast.text}
        </div>
      )}

      <PrintHeader
        title={tr('التقرير الرسمي الشامل لملف وإحصاءات المعلم (Teacher Portfolio)', 'Comprehensive Official Teacher Portfolio & Analytics Report')}
        subtitle={`${displayTeacherName} | ${deptName} | ${teacher.subject}`}
      />

      {/* Welcome Banner for Logged-In Teacher */}
      {isTeacherPortal && (
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 55%, #0284C7 100%)',
            color: '#fff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(15,32,68,0.18)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 800, marginBottom: '0.2rem' }}>
              {tr(
                '👨‍🏫 بوابة المعلم الذاتية الخاصة — بياناتك وإحصاءاتك وتقاريرك الخاصة فقط',
                '👨‍🏫 Teacher Self-Service Portal — Your Personal Lessons, Evaluations & Reports Only'
              )}
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
              {tr(`مرحباً بك أ. ${teacher.nameAr}`, `Welcome, ${teacher.nameEn || teacher.nameAr}`)}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#E0F2FE', margin: '0.25rem 0 0' }}>
              {deptName} · {tr('المادة:', 'Subject:')} {teacher.subject} · {tr('البريد الرسمي:', 'Email:')} {teacher.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {languageSwitcherPill(true)}
            <button
              onClick={() => setActiveTab('distance_learning')}
              style={{
                background: '#38BDF8',
                color: '#0F2044',
                border: 'none',
                borderRadius: '10px',
                padding: '0.55rem 1rem',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {tr('🌐 إضافة حصة Distance Learning (Teams)', '🌐 Add Distance Learning (Teams) Class')}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.55rem 1rem',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              {tr('🖨️ طباعة ملفي وتقاريري', '🖨️ Print My Profile & Reports')}
            </button>
          </div>
        </div>
      )}

      {/* Header (when viewed by Admin or non-banner header) */}
      {!isTeacherPortal && (
        <div
          className="no-print"
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}
        >
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem' }}
          >
            {isEn ? '←' : '→'}
          </button>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>{displayTeacherName}</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0' }}>
              {isEn ? teacher.nameAr : teacher.nameEn} · {deptName} · {teacher.subject}
            </p>
          </div>
          <div style={{ [isEn ? 'marginLeft' : 'marginRight']: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {languageSwitcherPill(false)}
            {isOfficialHonoree && (
              <span
                style={{
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                }}
              >
                {tr('🏆 معلم مكرم على مستوى القسم والمدرسة', '🏆 Honored Teacher (Department & School Champion)')}
              </span>
            )}
            <button onClick={() => window.print()} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              {tr('🖨️ طباعة الملف', '🖨️ Print Portfolio')}
            </button>
            <span
              style={{
                background: perf.bg,
                color: perf.color,
                padding: '0.3rem 1rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {trPerf(perf.label)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: tr('📊 إحصاءاتي وتقييماتي الشهرية', '📊 My Stats & Monthly Evaluations'), count: teacherEvals.length },
          {
            id: 'modellessons',
            label: tr('💻 حصصي في التعليم الإلكتروني', '💻 My E-Learning Lessons'),
            count: teacherModelLessons.length + teacherScheduledLessons.length,
          },
          {
            id: 'distance_learning',
            label: '🌐 Distance Learning (Teams)',
            count: teacherDistanceLessons.length,
          },
          {
            id: 'reports',
            label: tr('🖨️ تقاريري الخاصة والطباعة', '🖨️ My Reports & Printing'),
            count: teacherEvals.length + teacherModelLessons.length + 3,
          },
          {
            id: 'pd',
            label: tr('🎓 التطوير المهني و MEEE', '🎓 Professional Development & MEEE'),
            count: teacherPD.length + teacherWorkshops.length,
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TeacherProfileTab)}
            style={{
              padding: '0.6rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeTab === tab.id ? '#0F2044' : '#E2E8F0',
              background: activeTab === tab.id ? '#0F2044' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#475569',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s',
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                background: activeTab === tab.id ? '#00B4D8' : '#F1F5F9',
                color: activeTab === tab.id ? '#fff' : '#64748B',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Teacher Info Card */}
      <div
        style={{
          ...cardStyle,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))',
          gap: '0.75rem',
        }}
      >
        {[
          [tr('اسم المعلم', 'Teacher Name'), displayTeacherName],
          [tr('الرقم الوظيفي', 'Employee ID'), teacher.employeeId],
          [tr('البريد الإلكتروني', 'Official Email'), teacher.email],
          [tr('المادة الدراسية', 'Subject'), teacher.subject],
          [tr('القسم الأكاديمي', 'Department'), deptName],
          [tr('شهادة MEEE', 'MEEE Status'), trMeee(teacherMeee?.status)],
        ].map(([l, v]) => (
          <div key={String(l)}>
            <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: 0, fontWeight: 700 }}>{l}</p>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', margin: '0.15rem 0 0' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* ──── TAB 1: OVERVIEW, TEACHER STATISTICS & MONTHLY EVALUATIONS ──── */}
      {activeTab === 'overview' && (
        <>
          {/* Teacher-Only KPI Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            {statBox(tr('متوسط العام الحالي', 'Current Year Average'), `${currentAvg}%`, activeYear, '#0284C7')}
            {statBox(tr('متوسط الأداء الكلي', 'Overall Average'), `${avgAll}%`, tr('جميع الأعوام', 'All Years'), perf.color)}
            {statBox(tr('أعلى تقييم شهري', 'Highest Monthly Score'), `${best}%`, trMonth(bestMonth?.month))}
            {statBox(tr('التقييمات الشهرية', 'Monthly Evaluations'), teacherEvals.length, tr('تقييم معتمد', 'Verified Evals'))}
            {statBox(tr('حصص التعليم الإلكتروني', 'E-Learning Lessons'), teacherModelLessons.length, tr('حصة مقيمة', 'Evaluated Lessons'), '#4338CA')}
            {statBox(tr('حصص التعلم عن بعد', 'Distance Learning'), teacherDistanceLessons.length, 'Microsoft Teams', '#059669')}
            {statBox(tr('التدريب الفردي والذاتي', 'Individual & Self PD'), teacherPD.length, tr('جلسة وبرنامج موثق', 'Verified Sessions'), '#00B4D8')}
            {statBox(tr('ملاحظاتي وآرائي', 'My Opinions & Notes'), teacherFeedbacks.length, tr('إقرار وملاحظة', 'Acknowledged Notes'), '#D97706')}
          </div>

          {/* Recognition History Card */}
          {recognitionHistory.length > 0 && (
            <div
              style={{
                ...cardStyle,
                background: '#F0F9FF',
                border: '1px solid #B9E6FE',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>🏆</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0369A1', margin: '0 0 0.5rem 0' }}>
                  {tr('🏅 سجل التميز والتكريم الخاص بالمعلم', '🏅 Teacher Excellence & Recognition History')}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {recognitionHistory.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#fff',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '89px',
                        border: '1px solid #B9E6FE',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#0369A1',
                      }}
                    >
                      {trMonth(h.month)} {h.academicYear} ({h.totalScore}%)
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 1rem', [isEn ? 'borderLeft' : 'borderRight']: '1px solid #B9E6FE' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369A1' }}>{recognitionHistory.length}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{tr('مرات التكريم', 'Times Honored')}</div>
              </div>
            </div>
          )}

          {/* Teacher-Only Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                {tr(
                  `📈 منحنى تطور أدائي الشهري في نظام قطر للتعليم (${activeYear})`,
                  `📈 My Monthly Performance Trend in QES LMS (${activeYear})`
                )}
              </h3>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#fff' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#fff' }} />
                  <Tooltip contentStyle={{ background: '#1a3a6b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey={teacherSeriesKey} stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} connectNulls />
                  <Line type="monotone" dataKey={deptSeriesKey} stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                {tr(
                  '🕸️ تحليل معايير التقييم الخاصة بي (آخر تقييم شهري)',
                  '🕸️ My Evaluation Criteria Breakdown (Latest Monthly Evaluation)'
                )}
              </h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#fff' }} />
                    <Radar name={tr('الدرجة من 20', 'Score out of 20')} dataKey="value" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.45} />
                    <Tooltip contentStyle={{ background: '#1a3a6b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  {tr('لا توجد بيانات', 'No evaluation data available')}
                </p>
              )}
            </div>
          </div>

          {/* Monthly Evaluations Table with Print & Teacher Opinion/Notes */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.85rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                  {tr('📋 سجل تقييماتي الشهرية في نظام قطر للتعليم (LMS)', '📋 My Monthly QES LMS Evaluations Log')}
                </h3>
                <p style={{ fontSize: '0.73rem', color: '#64748B', margin: '2px 0 0' }}>
                  {tr(
                    'يمكنك طباعة أي تقييم شهري أو الضغط على "💬 إبداء الرأي والملاحظات" لتسجيل رأيك وإقرارك بالاطلاع.',
                    'You can print any monthly evaluation or click "💬 Add Opinion & Notes" to record your reflection and acknowledgment.'
                  )}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print"
                style={{
                  background: '#0F2044',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {tr('🖨️ طباعة سجل التقييمات الكامل', '🖨️ Print Full Evaluations Log')}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#0F2044', color: '#fff' }}>
                    {[
                      tr('الشهر', 'Month'),
                      tr('العام الأكاديمي', 'Academic Year'),
                      tr('الدرجة', 'Score'),
                      tr('مستوى الأداء', 'Performance Level'),
                      tr('نقاط القوة والتوصيات', 'Strengths & Recommendations'),
                      tr('رأي وملاحظات المعلم', 'Teacher Opinion & Notes'),
                      tr('الإجراءات والطباعة', 'Actions & Print'),
                    ].map((h, hIdx) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.6rem 0.75rem',
                          textAlign: hIdx === 6 ? 'center' : isEn ? 'left' : 'right',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...teacherEvals]
                    .sort(
                      (a, b) =>
                        b.academicYear.localeCompare(a.academicYear) ||
                        MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month)
                    )
                    .map((ev, i) => {
                      const p = getPerformanceLevel(ev.totalScore);
                      const fb = getFeedbackForTarget(ev.id, ev.teacherOpinion, ev.teacherNotes);
                      return (
                        <tr
                          key={ev.id}
                          style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
                        >
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044' }}>{trMonth(ev.month)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#64748B', fontWeight: 600 }}>{ev.academicYear}</td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 900, color: '#0369A1' }}>
                            {ev.totalScore}/100
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <span
                              style={{
                                background: p.bg,
                                color: p.color,
                                padding: '0.18rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                              }}
                            >
                              {trPerf(p.label)}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', color: '#334155', maxWidth: '210px' }}>
                            <div style={{ fontWeight: 700, color: '#065F46', fontSize: '0.73rem' }}>
                              ✓ {ev.strengths || '-'}
                            </div>
                            {ev.recommendations && (
                              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                                💡 {ev.recommendations}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', maxWidth: '220px' }}>
                            {fb?.opinionText ? (
                              <div
                                style={{
                                  background: '#F0F9FF',
                                  border: '1px solid #BAE6FD',
                                  borderRadius: '8px',
                                  padding: '0.35rem 0.55rem',
                                  fontSize: '0.72rem',
                                  color: '#0369A1',
                                }}
                              >
                                <div style={{ fontWeight: 800 }}>{fb.opinionText}</div>
                                {fb.acknowledged && (
                                  <span style={{ fontSize: '0.64rem', color: '#059669', fontWeight: 800 }}>
                                    {tr('✓ تم الإقرار بالاطلاع', '✓ Acknowledged')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{tr('لم يُسجل رأي بعد', 'No opinion recorded yet')}</span>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                onClick={() => printSingleMonthlyEvaluation(ev)}
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  padding: '0.28rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                                title={tr('طباعة التقرير الرسمي لهذا التقييم', 'Print official evaluation report')}
                              >
                                {tr('🖨️ طباعة', '🖨️ Print')}
                              </button>
                              {canTeacherAct && (
                                <button
                                  onClick={() =>
                                    openFeedbackEditor(
                                      'monthly_evaluation',
                                      ev.id,
                                      tr(
                                        `تقييم نظام قطر للتعليم — شهر ${ev.month} (${ev.academicYear})`,
                                        `QES LMS Evaluation — ${trMonth(ev.month)} (${ev.academicYear})`
                                      ),
                                      ev.academicYear,
                                      ev.month,
                                      ev.teacherOpinion,
                                      ev.teacherNotes
                                    )
                                  }
                                  style={{
                                    background: '#ECFDF5',
                                    color: '#047857',
                                    border: '1px solid #A7F3D0',
                                    padding: '0.28rem 0.55rem',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  💬 {fb?.opinionText ? tr('تعديل الرأي', 'Edit Opinion') : tr('إبداء الرأي', 'Add Opinion')}
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteMonthlyEval(ev.id, ev.month, ev.academicYear)}
                                  style={{
                                    background: '#FEE2E2',
                                    color: '#991B1B',
                                    border: '1px solid #FECACA',
                                    padding: '0.28rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
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
                  {teacherEvals.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                        {tr('لا توجد تقييمات شهرية مسجلة', 'No monthly evaluations recorded')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──── TAB 2: MODEL LESSONS EVALUATIONS & SCHEDULE ──── */}
      {activeTab === 'modellessons' && (
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                {tr('💻 حصصي في التعليم الإلكتروني (الحصص المقيمة والمجدولة)', '💻 My E-Learning Lessons (Evaluated & Scheduled)')}
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0' }}>
                {tr(
                  'اطلع على تفاصيل تقييمات حصصك في التعليم الإلكتروني، وقم بطباعتها أو تدوين رأيك وملاحظاتك عليها.',
                  'View details of your evaluated E-Learning lessons, print official reports, or record your opinion and reflection.'
                )}
              </p>
            </div>
            <span
              style={{
                background: '#EEF2FF',
                color: '#4338CA',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              {tr(`إجمالي الحصص المقيمة: ${teacherModelLessons.length}`, `Evaluated Lessons: ${teacherModelLessons.length}`)}
            </span>
          </div>

          {teacherModelLessons.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💻</div>
              <div>{tr('لم يتم تسجيل تقييم حصص تعليم إلكتروني لهذا المعلم حتى الآن.', 'No evaluated E-Learning lessons recorded for this teacher yet.')}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {teacherModelLessons.map((ml, idx) => {
                const fb = getFeedbackForTarget(ml.id, ml.teacherOpinion, ml.teacherNotes);
                return (
                  <div
                    key={ml.id || idx}
                    style={{
                      border: '1px solid #CBD5E1',
                      borderRadius: '12px',
                      padding: '1.1rem',
                      background: '#F8FAFC',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        borderBottom: '1px solid #E2E8F0',
                        paddingBottom: '0.6rem',
                        marginBottom: '0.65rem',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>
                          📅 {tr('تاريخ الحصة:', 'Lesson Date:')} {ml.date}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#475569', [isEn ? 'marginLeft' : 'marginRight']: '1rem', fontWeight: 700 }}>
                          {tr(`الحصة: ${ml.period} | الصف والشعبة: ${ml.classGrade}`, `Period: ${ml.period} | Class: ${ml.classGrade}`)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                            padding: '3px 12px',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            fontWeight: 900,
                          }}
                        >
                          {tr(`الدرجة: ${ml.overallScore} / 10`, `Score: ${ml.overallScore} / 10`)}
                        </span>
                        <button
                          onClick={() => printSingleModelLesson(ml)}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {tr('🖨️ طباعة تقرير الحصة', '🖨️ Print Lesson Report')}
                        </button>
                        {canTeacherAct && (
                          <button
                            onClick={() =>
                              openFeedbackEditor(
                                'model_lesson',
                                ml.id,
                                tr(
                                  `تقييم حصة التعليم الإلكتروني — بتاريخ ${ml.date} (الصف ${ml.classGrade} / الحصة ${ml.period})`,
                                  `E-Learning Lesson Evaluation — ${ml.date} (Class ${ml.classGrade} / Period ${ml.period})`
                                ),
                                ml.academicYear || activeYear,
                                ml.month,
                                ml.teacherOpinion,
                                ml.teacherNotes
                              )
                            }
                            style={{
                              background: '#0284C7',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.73rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {tr('💬 إبداء الرأي والملاحظات', '💬 Add Opinion & Notes')}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteModelLesson(ml.id, ml.date)}
                            style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              border: '1px solid #FECACA',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {tr('🗑️ حذف', '🗑️ Delete')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6 Criteria Mini Scores */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.45rem',
                        marginBottom: '0.65rem',
                      }}
                    >
                      {[
                        [tr('التقويم والتغذية الراجعة', 'Assessment & Feedback'), ml.scoreAssessmentFeedback],
                        [tr('عمق توظيف التقنية', 'Tech Integration Depth'), ml.scoreTechDepth],
                        [tr('تنظيم LMS ووضوح المواد', 'LMS Clarity & Structure'), ml.scoreLmsClarity],
                        [tr('إدارة الصف رقمياً', 'Digital Classroom Mgmt'), ml.scoreClassroomMgmt],
                        [tr('تفاعل ومشاركة الطلاب', 'Student Engagement'), ml.scoreStudentEngagement],
                        [tr('تمكن المعلم من الأدوات', 'Digital Tools Mastery'), ml.scoreTeacherTools],
                      ].map(([lbl, sc]) => (
                        <div
                          key={String(lbl)}
                          style={{
                            background: '#fff',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '0.4rem 0.6rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                          }}
                        >
                          <span style={{ color: '#475569', fontWeight: 700 }}>{lbl}</span>
                          <span style={{ color: '#0369A1', fontWeight: 900 }}>{sc}/10</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#334155',
                      }}
                    >
                      <div>
                        <b>{tr('الأدوات الرقمية الموظفة:', 'Digital Tools Used:')}</b> <span style={{ color: '#0369A1', fontWeight: 700 }}>{ml.toolsUsed || '-'}</span>
                      </div>
                      <div>
                        <b>{tr('الحضور:', 'Attendees:')}</b> {ml.attendees || '-'}
                      </div>
                      {ml.lessonPlanUrl && (
                        <div>
                          <b>{tr('رابط خطة الدرس والأدلة:', 'Lesson Plan & Evidence:')}</b>{' '}
                          <a
                            href={ml.lessonPlanUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#00B4D8', textDecoration: 'underline', fontWeight: 700 }}
                          >
                            {tr('🔗 فتح الرابط', '🔗 Open Link')}
                          </a>
                        </div>
                      )}
                    </div>

                    {(ml.strengths || ml.improvements || ml.recommendations) && (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          paddingTop: '0.6rem',
                          borderTop: '1px dashed #CBD5E1',
                          fontSize: '0.75rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ color: '#065F46' }}>
                          <b>{tr('✅ نقاط القوة:', '✅ Strengths:')}</b>
                          <br />
                          {ml.strengths || '-'}
                        </div>
                        <div style={{ color: '#B45309' }}>
                          <b>{tr('🔧 جوانب التحسين:', '🔧 Areas for Improvement:')}</b>
                          <br />
                          {ml.improvements || '-'}
                        </div>
                        <div style={{ color: '#1E40AF' }}>
                          <b>{tr('💡 التوصيات:', '💡 Recommendations:')}</b>
                          <br />
                          {ml.recommendations || '-'}
                        </div>
                      </div>
                    )}

                    {/* Teacher Opinion on this Model Lesson */}
                    {fb?.opinionText && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '8px',
                          padding: '0.55rem 0.85rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#0369A1' }}>{tr('💬 رأي المعلم وملاحظاته على الحصة:', '💬 Teacher Opinion & Notes on Lesson:')}</div>
                        <div style={{ color: '#0F2044', marginTop: '2px', fontWeight: 600 }}>{fb.opinionText}</div>
                        {fb.actionTaken && (
                          <div style={{ color: '#475569', marginTop: '2px', fontSize: '0.72rem' }}>
                            <b>{tr('الإجراءات التطويرية:', 'Action Taken:')}</b> {fb.actionTaken}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Scheduled Model Lessons */}
          {teacherScheduledLessons.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.75rem' }}>
                {tr(`📅 حصص التعليم الإلكتروني المجدولة (${teacherScheduledLessons.length})`, `📅 Scheduled E-Learning Lessons (${teacherScheduledLessons.length})`)}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teacherScheduledLessons.map((sl, i) => (
                  <div
                    key={sl.id || i}
                    style={{
                      padding: '0.75rem',
                      background: '#F0F9FF',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0369A1' }}>
                        {sl.lessonTopic || tr('حصة تعليم إلكتروني مجدولة', 'Scheduled E-Learning Lesson')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                        📅 {sl.date} | {tr('الحصة:', 'Period:')} {sl.period} | {tr('الصف:', 'Class:')} {sl.classGrade}
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#E0F2FE',
                        color: '#075985',
                        padding: '3px 10px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {isEn && sl.status === 'مجدولة' ? 'Scheduled' : isEn && sl.status === 'تم التنفيذ' ? 'Completed' : (sl.status || tr('مجدولة', 'Scheduled'))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──── TAB 3: DISTANCE LEARNING (MICROSOFT TEAMS LINKS FOR STUDENTS) ──── */}
      {activeTab === 'distance_learning' && (
        <div>
          {/* Form Card to Add/Edit Distance Learning Class (Only: اليوم والتاريخ، الصف، الحصة، الرابط) */}
          {canTeacherAct && (
            <div
              className="no-print"
              style={{
                ...cardStyle,
                border: '2px solid #0284C7',
                background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                    🌐{' '}
                    {editingDlLesson
                      ? tr('تعديل حصة Distance Learning', 'Edit Distance Learning Class')
                      : tr('إضافة حصة Distance Learning (Link From Teams)', 'Add Distance Learning Class (Link From Teams)')}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#0369A1', margin: '0.2rem 0 0', fontWeight: 600 }}>
                    {tr(
                      'اختر اليوم والتاريخ، الصف، الحصة، وأضف الرابط من Microsoft Teams.',
                      'Select the Day & Date, Class, Period, and paste the link from Microsoft Teams.'
                    )}
                  </p>
                </div>
                {editingDlLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDlLesson(null);
                      setDlTeamsLink('');
                    }}
                    style={{
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {tr('✕ إلغاء التعديل', '✕ Cancel Edit')}
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveDlLesson}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  {/* 1. اليوم والتاريخ */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F2044' }}>
                      {tr(`اليوم والتاريخ (${getArabicDayName(dlDate)}) *`, `Day & Date (${trDay(getArabicDayName(dlDate))}) *`)}
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={dlDate}
                      onChange={e => setDlDate(e.target.value)}
                      style={{ fontWeight: 700 }}
                      required
                    />
                  </div>

                  {/* 2. الصف (7A..12E) */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F2044' }}>
                      {tr('الصف *', 'Class *')}
                    </label>
                    <select
                      className="form-input"
                      value={dlClassCode}
                      onChange={e => setDlClassCode(e.target.value)}
                      style={{ fontWeight: 800, color: '#0F2044' }}
                      required
                    >
                      {DISTANCE_LEARNING_CLASSES.map(cls => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. الحصة (1..7) */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F2044' }}>
                      {tr('الحصة *', 'Period *')}
                    </label>
                    <select
                      className="form-input"
                      value={dlPeriod}
                      onChange={e => setDlPeriod(e.target.value)}
                      style={{ fontWeight: 800, color: '#0F2044' }}
                      required
                    >
                      {DISTANCE_LEARNING_PERIODS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. الرابط */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1E3A8A', margin: 0 }}>
                      {tr('الرابط (Link From Teams) : *', 'Link (Link From Teams) : *')}
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const txt = await navigator.clipboard.readText();
                          if (txt) setDlTeamsLink(txt.trim());
                        } catch {
                          // fallback
                        }
                      }}
                      style={{
                        background: '#EEF2FF',
                        color: '#4338CA',
                        border: '1px solid #C7D2FE',
                        borderRadius: '6px',
                        padding: '2px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {tr('📋 لصق الرابط', '📋 Paste Link')}
                    </button>
                  </div>
                  <input
                    type="url"
                    className="form-input"
                    value={dlTeamsLink}
                    onChange={e => setDlTeamsLink(e.target.value)}
                    placeholder="https://teams.microsoft.com/l/meetup-join/..."
                    style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.84rem', border: '1.5px solid #4F46E5' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button
                    type="submit"
                    disabled={savingDl}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #0284C7 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.7rem 1.6rem',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(79,70,229,0.28)',
                    }}
                  >
                    {savingDl
                      ? tr('⏳ جاري الحفظ...', '⏳ Saving...')
                      : editingDlLesson
                      ? tr('💾 حفظ التعديل', '💾 Save Changes')
                      : tr('➕ إضافة الحصة والرابط', '➕ Add Class & Link')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teacher's Distance Learning Lessons List */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                  {tr(
                    `📅 جدول حصص Distance Learning الخاصة بالمعلم (${teacherDistanceLessons.length})`,
                    `📅 Teacher's Distance Learning Classes Schedule (${teacherDistanceLessons.length})`
                  )}
                </h3>
              </div>
              {teacherDistanceLessons.length > 0 && (
                <button
                  onClick={() =>
                    printTeacherDistanceLessonsScheduleReport(teacherDistanceLessons, {
                      academicYear: activeYear,
                      teacherOnlyName: displayTeacherName,
                    })
                  }
                  style={{
                    background: '#0F2044',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '9px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {tr('🖨️ طباعة جدول حصصي عن بعد (Teams)', '🖨️ Print My Teams Schedule')}
                </button>
              )}
            </div>

            {teacherDistanceLessons.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🎥</div>
                <div style={{ fontWeight: 800, color: '#0F2044', marginBottom: '0.25rem' }}>
                  {tr('لم تقم بإضافة حصص Distance Learning حتى الآن', 'No Distance Learning classes added yet')}
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  {tr(
                    'اختر اليوم والتاريخ، الصف، الحصة، وأضف الرابط أعلاه ليتم إدراجها في جدول الطلاب.',
                    'Select the Day & Date, Class, Period, and add the link above to include it in the students timetable.'
                  )}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff' }}>
                      {[
                        '#',
                        tr('اليوم والتاريخ', 'Day & Date'),
                        tr('الصف', 'Class'),
                        tr('الحصة', 'Period'),
                        tr('الرابط (Link From Teams)', 'Link (Link From Teams)'),
                        tr('الإجراءات', 'Actions'),
                      ].map((h, hIdx) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.65rem 0.75rem',
                            textAlign: hIdx === 0 || hIdx === 2 || hIdx === 3 || hIdx === 5 ? 'center' : isEn ? 'left' : 'right',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teacherDistanceLessons.map((l, idx) => (
                      <tr
                        key={l.id}
                        style={{
                          background: idx % 2 === 0 ? '#fff' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                        }}
                      >
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <span style={{ fontWeight: 800, color: '#0F2044' }}>{trDay(l.dayName)}</span>
                          <span style={{ fontSize: '0.76rem', color: '#64748B', [isEn ? 'marginLeft' : 'marginRight']: '0.4rem' }}>({l.date})</span>
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.8rem',
                            }}
                          >
                            {l.gradeSection}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 900, color: '#0369A1', fontSize: '0.85rem' }}>
                          {l.period}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <a
                              href={l.teamsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#4F46E5',
                                color: '#fff',
                                textDecoration: 'none',
                                padding: '0.32rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {tr('🎥 فتح الرابط (Teams)', '🎥 Open Link (Teams)')}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(l.teamsLink);
                                showToast(tr('📋 تم نسخ الرابط', '📋 Link copied to clipboard'));
                              }}
                              style={{
                                background: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {tr('📋 نسخ', '📋 Copy')}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {canTeacherAct && (
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleEditDlLesson(l)}
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  padding: '0.28rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {tr('✏️ تعديل', '✏️ Edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteDlLesson(l.id)}
                                style={{
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  border: '1px solid #FECACA',
                                  padding: '0.28rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {tr('🗑️ حذف', '🗑️ Delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── TAB 5: TEACHER PERSONAL REPORTS & PRINTING ──── */}
      {activeTab === 'reports' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              {tr(`🖨️ مركز التقارير الفردية الخاصة بالمعلم: ${teacher.nameAr}`, `🖨️ Personal Reports & Printing Center: ${displayTeacherName}`)}
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              {tr(
                'جميع التقارير أدناه مخصصة للمعلم فقط وتحتوي على إحصاءاته وتقييماته وحصصه وملاحظاته المعتمدة مع الترويسة الرسمية.',
                'All reports below are dedicated to the teacher only and include verified statistics, evaluations, lessons, and official headers.'
              )}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* 1. Full 360 Portfolio Report */}
            <div
              style={{
                border: '1.5px solid #0F2044',
                borderRadius: '12px',
                padding: '1.1rem',
                background: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>📊</div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0F2044' }}>
                  {tr('التقرير الشامل لإحصاءات وملف إنجاز المعلم (360° Portfolio)', 'Comprehensive Teacher Statistics & Portfolio Report (360°)')}
                </div>
                <p style={{ fontSize: '0.73rem', color: '#64748B', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  {tr(
                    'يشمل كافة مؤشرات الأداء، المنحنى الشهري، سجل التقييمات الشهرية، والورش التدريبية الخاصة بالمعلم.',
                    'Includes all KPIs, monthly performance trend, monthly evaluations log, and professional development records.'
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setTimeout(() => window.print(), 200);
                }}
                style={{
                  background: '#0F2044',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {tr('🖨️ طباعة التقرير الشامل للمعلم', '🖨️ Print Comprehensive Portfolio')}
              </button>
            </div>

            {/* 2. Distance Learning Schedule Report for Teacher */}
            <div
              style={{
                border: '1.5px solid #0284C7',
                borderRadius: '12px',
                padding: '1.1rem',
                background: '#F0F9FF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>🌐</div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0369A1' }}>
                  {tr('تقرير جدول حصص التعلم عن بعد (Microsoft Teams) الخاص بالمعلم', 'Teacher Distance Learning (Microsoft Teams) Schedule Report')}
                </div>
                <p style={{ fontSize: '0.73rem', color: '#475569', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  {tr(
                    `طباعة جدول الحصص والروابط التفاعلية التي قام المعلم بإضافتها في تبويب Distance Learning (${teacherDistanceLessons.length} حصة).`,
                    `Print the timetable and interactive Teams links added in the Distance Learning tab (${teacherDistanceLessons.length} classes).`
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  printTeacherDistanceLessonsScheduleReport(teacherDistanceLessons, {
                    academicYear: activeYear,
                    teacherOnlyName: displayTeacherName,
                  })
                }
                style={{
                  background: '#0284C7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {tr('🖨️ طباعة جدول حصص Teams الخاص بي', '🖨️ Print My Teams Schedule')}
              </button>
            </div>

            {/* 3. Teacher Individual & Self-PD Report */}
            <div
              style={{
                border: '1.5px solid #059669',
                borderRadius: '12px',
                padding: '1.1rem',
                background: '#ECFDF5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>🎓</div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#065F46' }}>
                  {tr('سجل التدريب الفردي والتدريب الذاتي والشهادات المهنية للمعلم', 'Individual & Self-Training PD & Certifications Log')}
                </div>
                <p style={{ fontSize: '0.73rem', color: '#475569', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  {tr(
                    `طباعة كشف رسمي معتمد بجميع جلسات التدريب الفردي وبرامج التعلم الذاتي وشهادة MEEE المرتبطة بصفحة المعلم (${teacherPD.length} سجل تدريبي).`,
                    `Print an official verified log of all individual training sessions, self-learning programs, and MEEE certification (${teacherPD.length} records).`
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('pd');
                  setTimeout(() => window.print(), 200);
                }}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {tr('🖨️ طباعة سجل التدريب الفردي والذاتي', '🖨️ Print Individual & Self-PD Log')}
              </button>
            </div>
          </div>

          {/* Individual Monthly Evaluation Printable Reports */}
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.65rem' }}>
            {tr('📝 طباعة تقارير تقييمات نظام قطر للتعليم الشهرية (منفصلة لكل شهر):', '📝 Print Individual Monthly QES LMS Evaluation Reports:')}
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            {teacherEvals.map(ev => (
              <div
                key={ev.id}
                style={{
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.8rem',
                  background: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F2044' }}>
                    {tr(`شهر ${ev.month} (${ev.academicYear})`, `${trMonth(ev.month)} (${ev.academicYear})`)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0369A1', fontWeight: 800 }}>
                    {tr(`الدرجة: ${ev.totalScore}%`, `Score: ${ev.totalScore}%`)}
                  </div>
                </div>
                <button
                  onClick={() => printSingleMonthlyEvaluation(ev)}
                  style={{
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '0.4rem 0.7rem',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {tr('🖨️ طباعة', '🖨️ Print')}
                </button>
              </div>
            ))}
          </div>

          {/* Individual Model Lessons Printable Reports */}
          {teacherModelLessons.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.65rem' }}>
                {tr('💻 طباعة تقارير حصص التعليم الإلكتروني المقيمة:', '💻 Print Evaluated E-Learning Lesson Reports:')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {teacherModelLessons.map(ml => (
                  <div
                    key={ml.id}
                    style={{
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '0.8rem',
                      background: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F2044' }}>
                        {tr(`حصة ${ml.date} (الصف ${ml.classGrade})`, `Lesson ${ml.date} (Class ${ml.classGrade})`)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                        {tr(`التقييم: ${ml.overallScore} / 10`, `Score: ${ml.overallScore} / 10`)}
                      </div>
                    </div>
                    <button
                      onClick={() => printSingleModelLesson(ml)}
                      style={{
                        background: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '0.4rem 0.7rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {tr('🖨️ طباعة', '🖨️ Print')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ──── TAB 6: PROFESSIONAL DEVELOPMENT & MEEE ──── */}
      {activeTab === 'pd' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                {tr(
                  '🎓 التطوير المهني، التدريب الفردي والذاتي، والشهادات المعتمدة الخاصة بالمعلم',
                  '🎓 Professional Development, Individual & Self-Training, and Certifications'
                )}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0', fontWeight: 600 }}>
                {tr(
                  `جميع سجلات التدريب الفردي وبرامج التعلم الذاتي والورش المرتبطة بملف المعلم أ. ${teacher.nameAr} (${deptName})`,
                  `All individual training sessions, self-learning programs, and workshops linked to ${displayTeacherName} (${deptName})`
                )}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print"
              style={{
                background: '#0F2044',
                color: '#fff',
                border: 'none',
                borderRadius: '9px',
                padding: '0.5rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {tr('🖨️ طباعة سجل التطوير المهني والتدريب الذاتي', '🖨️ Print PD & Self-Training Log')}
            </button>
          </div>

          {/* Summary KPI Row for Teacher PD */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1' }}>
                {tr('إجمالي التدريب الفردي والذاتي', 'Total Individual & Self PD')}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F2044', marginTop: '0.2rem' }}>
                {teacherPD.length}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>
                  {tr('سجل موثق', 'verified records')}
                </span>
              </div>
            </div>
            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338CA' }}>
                {tr('برامج التدريب والتعلم الذاتي', 'Self-Learning Programs')}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4338CA', marginTop: '0.2rem' }}>
                {teacherPD.filter(r => r.trainingType === 'برنامج تعلم ذاتي / تطوير مهني خارجي').length}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>
                  {tr('برنامج', 'programs')}
                </span>
              </div>
            </div>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46' }}>
                {tr('جلسات التدريب والدعم الفردي', 'Individual Training Sessions')}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#065F46', marginTop: '0.2rem' }}>
                {teacherPD.filter(r => r.trainingType !== 'برنامج تعلم ذاتي / تطوير مهني خارجي').length}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>
                  {tr('جلسة', 'sessions')}
                </span>
              </div>
            </div>
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E' }}>
                {tr('إجمالي دقائق التدريب الفردي والذاتي', 'Total Training Minutes')}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#92400E', marginTop: '0.2rem' }}>
                {teacherPD.reduce((sum, r) => sum + (r.durationMinutes || 20), 0)}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>
                  {tr('دقيقة', 'mins')}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: teacherMeee?.status === 'حصل على الشهادة' ? '#ECFDF5' : '#F0F9FF',
              border: '1px solid',
              borderColor: teacherMeee?.status === 'حصل على الشهادة' ? '#A7F3D0' : '#BAE6FD',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 0.25rem', color: '#0F2044', fontSize: '0.88rem', fontWeight: 800 }}>
                {tr('🏅 شهادة معلم مايكروسوفت الخبير (MEEE)', '🏅 Microsoft Innovative Educator Expert (MEEE)')}
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                {tr('الحالة:', 'Status:')}{' '}
                <strong style={{ color: teacherMeee?.status === 'حصل على الشهادة' ? '#065F46' : '#0369A1' }}>
                  {trMeee(teacherMeee?.status)}
                </strong>
                {teacherMeee?.certificationDate &&
                  (isEn
                    ? ` | Certification Date: ${teacherMeee.certificationDate}`
                    : ` | تاريخ الاعتماد: ${teacherMeee.certificationDate}`)}
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>{teacherMeee?.status === 'حصل على الشهادة' ? '🎖️' : '⏳'}</span>
          </div>

          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.75rem' }}>
            {tr(
              `📋 سجلات التدريب الفردي والتدريب الذاتي المرتبطة بالمعلم (${teacherPD.length})`,
              `📋 Individual & Self-Training Records Linked to Teacher (${teacherPD.length})`
            )}
          </h4>
          {teacherPD.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '10px' }}>
              {tr('لا توجد سجلات تطوير مهني فردية أو ذاتية مسجلة لهذا المعلم حتى الآن', 'No individual or self-training PD records registered for this teacher yet')}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    {[
                      '#',
                      tr('التاريخ والعام', 'Date & Year'),
                      tr('المهارة / البرنامج التدريبي', 'Skill / Training Program'),
                      tr('التصنيف', 'Category'),
                      tr('نوع التدريب', 'Training Type'),
                      tr('المدرب / الجهة', 'Trainer / Organizer'),
                      tr('المدة', 'Duration'),
                      tr('الحالة', 'Status'),
                    ].map((h, hIdx) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.6rem 0.75rem',
                          textAlign: hIdx === 0 || hIdx === 6 || hIdx === 7 ? 'center' : isEn ? 'left' : 'right',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teacherPD.map((pd, idx) => {
                    const isSelfLearning = pd.trainingType === 'برنامج تعلم ذاتي / تطوير مهني خارجي';
                    return (
                      <tr
                        key={pd.id || idx}
                        style={{
                          background: idx % 2 === 0 ? '#fff' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                        }}
                      >
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.6rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#0F2044' }}>{pd.trainingDate}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{trMonth(pd.month)} ({pd.academicYear})</div>
                        </td>
                        <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0369A1' }}>
                          {pd.skillProvided || tr('تدريب فردي', 'Individual Training')}
                        </td>
                        <td style={{ padding: '0.6rem' }}>
                          <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {pd.skillCategory || tr('نظام قطر للتعليم', 'QES LMS')}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem' }}>
                          <span
                            style={{
                              background: isSelfLearning ? '#EEF2FF' : '#E0F2FE',
                              color: isSelfLearning ? '#4338CA' : '#0369A1',
                              border: `1px solid ${isSelfLearning ? '#C7D2FE' : '#BAE6FD'}`,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            {isSelfLearning
                              ? tr('🎓 تدريب ذاتي / خارجي', '🎓 Self-Learning / External')
                              : isEn
                              ? '👤 Individual Training'
                              : pd.trainingType || '👤 تدريب فردي'}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem', fontWeight: 700, color: '#334155' }}>
                          {pd.trainerName || tr('أحمد طبيشات', 'Ahmad Tubaishat')}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>
                          {pd.durationMinutes || 20} {tr('د', 'min')}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: pd.signatureStatus === 'تم التوقيع' ? '#D1FAE5' : '#FEF3C7',
                              color: pd.signatureStatus === 'تم التوقيع' ? '#065F46' : '#92400E',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            {pd.signatureStatus === 'تم التوقيع'
                              ? tr('تم التوقيع', 'Signed / Verified')
                              : tr(pd.signatureStatus || 'موثق', 'Verified')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F2044', margin: '1rem 0 0.75rem' }}>
            {tr(`🏫 الورش التدريبية الجماعية المشارك بها (${teacherWorkshops.length})`, `🏫 Collective Workshops Attended (${teacherWorkshops.length})`)}
          </h4>
          {teacherWorkshops.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
              {tr('لا توجد ورش جماعية مسجلة باسم المعلم مباشرة', 'No collective workshops directly registered under this teacher')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {teacherWorkshops.map(w => (
                <div
                  key={w.id}
                  style={{
                    padding: '0.75rem',
                    background: '#F0FDF4',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#065F46' }}>
                      {isEn ? (w.titleEn || w.nameEn || w.titleAr || w.nameAr) : (w.titleAr || w.nameAr)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                      📅 {w.date} | {tr('المحاضر:', 'Facilitator:')} {w.trainerName || w.facilitatorName || '-'} | {tr('المكان:', 'Venue:')} {w.venue || w.location || '-'}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {w.targetAudience || tr('ورشة جماعية', 'Group Workshop')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── FEEDBACK / OPINION MODAL ──── */}
      {feedbackModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,32,68,0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
                {tr('💬 إبداء رأي وملاحظات المعلم على التقييم / الحصة', '💬 Add Teacher Opinion & Reflection on Evaluation / Lesson')}
              </h3>
              <button
                onClick={() => setFeedbackModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '10px',
                padding: '0.65rem 0.9rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#0369A1',
              }}
            >
              📌 {feedbackModal.targetTitle}
            </div>

            <form onSubmit={handleSaveFeedback}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  {tr('رأي المعلم وملاحظاته وتأمله المهني *', 'Teacher Opinion, Notes & Professional Reflection *')}
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={feedbackModal.opinionText}
                  onChange={e => setFeedbackModal({ ...feedbackModal, opinionText: e.target.value })}
                  placeholder={tr('اكتب رأيك وملاحظاتك حول التقييم أو الحصة...', 'Write your opinion and reflection on the evaluation or lesson...')}
                  required
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  {tr('الإجراءات التطويرية التي تم تنفيذها بناءً على التوصيات (اختياري)', 'Improvement Actions Taken Based on Recommendations (Optional)')}
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={feedbackModal.actionTaken}
                  onChange={e => setFeedbackModal({ ...feedbackModal, actionTaken: e.target.value })}
                  placeholder={tr('مثال: تم إثراء المحتوى الرقمي على نظام قطر للتعليم وإضافة أنشطة تفاعلية...', 'e.g. Enriched digital content on QES LMS and added interactive activities...')}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#065F46',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  marginBottom: '1.1rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={feedbackModal.acknowledged}
                  onChange={e => setFeedbackModal({ ...feedbackModal, acknowledged: e.target.checked })}
                />
                <span>{tr('أقر بأنني اطلعت على تفاصيل التقييم والتوصيات الواردة فيه', 'I acknowledge that I have reviewed the evaluation details and recommendations')}</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem' }}
                >
                  {tr('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', fontWeight: 800 }}
                >
                  {savingFeedback ? tr('⏳ جاري الحفظ...', '⏳ Saving...') : tr('💾 حفظ الرأي والملاحظات', '💾 Save Opinion & Notes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
