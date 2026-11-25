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

interface Props {
  teacherId: string;
  currentUser: User;
  onBack: () => void;
  selectedYear?: string;
  activeTabProp?: TeacherProfileTab;
  onTabChange?: (tab: TeacherProfileTab) => void;
  isTeacherPortal?: boolean;
}

export default function TeacherProfilePage({
  teacherId,
  currentUser,
  onBack,
  selectedYear: propYear,
  activeTabProp,
  onTabChange,
  isTeacherPortal = false,
}: Props) {
  const isAdmin = isSuperAdmin(currentUser);
  const isOwnTeacherAccount = isTeacherUser(currentUser) && currentUser.teacherId === teacherId;
  const canTeacherAct = isOwnTeacherAccount || isAdmin;

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
      <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>
        ⏳ جاري تحميل بيانات وملف المعلم الخاص...
      </div>
    );
  }

  if (!teacher) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>معلم غير موجود</div>;
  }

  const teacherEvals = evaluations.filter(e => e.teacherId === teacherId);
  const deptEvals = evaluations.filter(
    e => teachers.find(t => t.id === e.teacherId)?.departmentId === teacher.departmentId
  );
  const deptName = getDeptName(teacher.departmentId, departments);

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
  const monthlyTrend = MONTHS.map(m => {
    const ev = teacherEvals.find(e => e.month === m && e.academicYear === activeYear);
    const deptEv = deptEvals.filter(e => e.month === m && e.academicYear === activeYear);
    const deptAvg = deptEv.length
      ? Math.round((deptEv.reduce((s, e) => s + e.totalScore, 0) / deptEv.length) * 10) / 10
      : 0;
    return { name: m, المعلم: ev?.totalScore ?? null, القسم: deptAvg || null };
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
        subject: `معيار ${i + 1}`,
        value: latestEval.criteria[i]?.score ?? 0,
        fullMark: 20,
      }))
    : [];

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
    <div style={{ padding: '1.5rem', direction: 'rtl', maxWidth: '1180px', margin: '0 auto' }}>
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
        title="التقرير الرسمي الشامل لملف وإحصاءات المعلم (Teacher Portfolio)"
        subtitle={`${teacher.nameAr} | ${deptName} | ${teacher.subject}`}
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
              👨‍🏫 بوابة المعلم الذاتية الخاصة — بياناتك وإحصاءاتك وتقاريرك الخاصة فقط
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
              مرحباً بك أ. {teacher.nameAr}
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#E0F2FE', margin: '0.25rem 0 0' }}>
              {deptName} · المادة: {teacher.subject} · البريد الرسمي: {teacher.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              🌐 إضافة حصة Distance Learning (Teams)
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
              🖨️ طباعة ملفي وتقاريري
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
            →
          </button>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>{teacher.nameAr}</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0 0' }}>
              {teacher.nameEn} · {deptName} · {teacher.subject}
            </p>
          </div>
          <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                🏆 معلم مكرم على مستوى القسم والمدرسة
              </span>
            )}
            <button onClick={() => window.print()} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              🖨️ طباعة الملف
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
              {perf.label}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: '📊 إحصاءاتي وتقييماتي الشهرية', count: teacherEvals.length },
          {
            id: 'modellessons',
            label: '💻 حصصي في التعليم الإلكتروني',
            count: teacherModelLessons.length + teacherScheduledLessons.length,
          },
          {
            id: 'distance_learning',
            label: '🌐 Distance Learning (Teams)',
            count: teacherDistanceLessons.length,
          },
          {
            id: 'reports',
            label: '🖨️ تقاريري الخاصة والطباعة',
            count: teacherEvals.length + teacherModelLessons.length + 2,
          },
          {
            id: 'pd',
            label: '🎓 التطوير المهني و MEEE',
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
          ['اسم المعلم', teacher.nameAr],
          ['الرقم الوظيفي', teacher.employeeId],
          ['البريد الإلكتروني', teacher.email],
          ['المادة الدراسية', teacher.subject],
          ['القسم الأكاديمي', deptName],
          ['شهادة MEEE', teacherMeee ? teacherMeee.status : 'لم يتقدم بعد'],
        ].map(([l, v]) => (
          <div key={l}>
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
            {statBox('متوسط العام الحالي', `${currentAvg}%`, activeYear, '#0284C7')}
            {statBox('متوسط الأداء الكلي', `${avgAll}%`, 'جميع الأعوام', perf.color)}
            {statBox('أعلى تقييم شهري', `${best}%`, bestMonth?.month || '-')}
            {statBox('التقييمات الشهرية', teacherEvals.length, 'تقييم معتمد')}
            {statBox('حصص التعليم الإلكتروني', teacherModelLessons.length, 'حصة مقيمة', '#4338CA')}
            {statBox('حصص التعلم عن بعد', teacherDistanceLessons.length, 'Microsoft Teams', '#059669')}
            {statBox('التدريب الفردي والذاتي', teacherPD.length, 'جلسة وبرنامج موثق', '#00B4D8')}
            {statBox('ملاحظاتي وآرائي', teacherFeedbacks.length, 'إقرار وملاحظة', '#D97706')}
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
                  🏅 سجل التميز والتكريم الخاص بالمعلم
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
                      {h.month} {h.academicYear} ({h.totalScore}%)
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 1rem', borderRight: '1px solid #B9E6FE' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369A1' }}>{recognitionHistory.length}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748B' }}>مرات التكريم</div>
              </div>
            </div>
          )}

          {/* Teacher-Only Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                📈 منحنى تطور أدائي الشهري في نظام قطر للتعليم ({activeYear})
              </h3>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#fff' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#fff' }} />
                  <Tooltip contentStyle={{ background: '#1a3a6b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="المعلم" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} connectNulls />
                  <Line type="monotone" dataKey="القسم" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                🕸️ تحليل معايير التقييم الخاصة بي (آخر تقييم شهري)
              </h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#fff' }} />
                    <Radar name="الدرجة من 20" dataKey="value" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.45} />
                    <Tooltip contentStyle={{ background: '#1a3a6b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>لا توجد بيانات</p>
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
                  📋 سجل تقييماتي الشهرية في نظام قطر للتعليم (LMS)
                </h3>
                <p style={{ fontSize: '0.73rem', color: '#64748B', margin: '2px 0 0' }}>
                  يمكنك طباعة أي تقييم شهري أو الضغط على <strong>"💬 إبداء الرأي والملاحظات"</strong> لتسجيل رأيك وإقرارك بالاطلاع.
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
                🖨️ طباعة سجل التقييمات الكامل
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#0F2044', color: '#fff' }}>
                    {[
                      'الشهر',
                      'العام الأكاديمي',
                      'الدرجة',
                      'مستوى الأداء',
                      'نقاط القوة والتوصيات',
                      'رأي وملاحظات المعلم',
                      'الإجراءات والطباعة',
                    ].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '0.6rem 0.75rem',
                          textAlign: h === 'الإجراءات والطباعة' ? 'center' : 'right',
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
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044' }}>{ev.month}</td>
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
                              {p.label}
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
                                    ✓ تم الإقرار بالاطلاع
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>لم يُسجل رأي بعد</span>
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
                                title="طباعة التقرير الرسمي لهذا التقييم"
                              >
                                🖨️ طباعة
                              </button>
                              {canTeacherAct && (
                                <button
                                  onClick={() =>
                                    openFeedbackEditor(
                                      'monthly_evaluation',
                                      ev.id,
                                      `تقييم نظام قطر للتعليم — شهر ${ev.month} (${ev.academicYear})`,
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
                                  💬 {fb?.opinionText ? 'تعديل الرأي' : 'إبداء الرأي'}
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
                        لا توجد تقييمات شهرية مسجلة
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
                💻 حصصي في التعليم الإلكتروني (الحصص المقيمة والمجدولة)
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0' }}>
                اطلع على تفاصيل تقييمات حصصك في التعليم الإلكتروني، وقم بطباعتها أو تدوين رأيك وملاحظاتك عليها.
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
              إجمالي الحصص المقيمة: {teacherModelLessons.length}
            </span>
          </div>

          {teacherModelLessons.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💻</div>
              <div>لم يتم تسجيل تقييم حصص تعليم إلكتروني لهذا المعلم حتى الآن.</div>
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
                          📅 تاريخ الحصة: {ml.date}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#475569', marginRight: '1rem', fontWeight: 700 }}>
                          الحصة: {ml.period} | الصف والشعبة: {ml.classGrade}
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
                          الدرجة: {ml.overallScore} / 10
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
                          🖨️ طباعة تقرير الحصة
                        </button>
                        {canTeacherAct && (
                          <button
                            onClick={() =>
                              openFeedbackEditor(
                                'model_lesson',
                                ml.id,
                                `تقييم حصة التعليم الإلكتروني — بتاريخ ${ml.date} (الصف ${ml.classGrade} / الحصة ${ml.period})`,
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
                            💬 إبداء الرأي والملاحظات
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
                            🗑️ حذف
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
                        ['التقويم والتغذية الراجعة', ml.scoreAssessmentFeedback],
                        ['عمق توظيف التقنية', ml.scoreTechDepth],
                        ['تنظيم LMS ووضوح المواد', ml.scoreLmsClarity],
                        ['إدارة الصف رقمياً', ml.scoreClassroomMgmt],
                        ['تفاعل ومشاركة الطلاب', ml.scoreStudentEngagement],
                        ['تمكن المعلم من الأدوات', ml.scoreTeacherTools],
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
                        <b>الأدوات الرقمية الموظفة:</b> <span style={{ color: '#0369A1', fontWeight: 700 }}>{ml.toolsUsed || '-'}</span>
                      </div>
                      <div>
                        <b>الحضور:</b> {ml.attendees || '-'}
                      </div>
                      {ml.lessonPlanUrl && (
                        <div>
                          <b>رابط خطة الدرس والأدلة:</b>{' '}
                          <a
                            href={ml.lessonPlanUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#00B4D8', textDecoration: 'underline', fontWeight: 700 }}
                          >
                            🔗 فتح الرابط
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
                          <b>✅ نقاط القوة:</b>
                          <br />
                          {ml.strengths || '-'}
                        </div>
                        <div style={{ color: '#B45309' }}>
                          <b>🔧 جوانب التحسين:</b>
                          <br />
                          {ml.improvements || '-'}
                        </div>
                        <div style={{ color: '#1E40AF' }}>
                          <b>💡 التوصيات:</b>
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
                        <div style={{ fontWeight: 800, color: '#0369A1' }}>💬 رأي المعلم وملاحظاته على الحصة:</div>
                        <div style={{ color: '#0F2044', marginTop: '2px', fontWeight: 600 }}>{fb.opinionText}</div>
                        {fb.actionTaken && (
                          <div style={{ color: '#475569', marginTop: '2px', fontSize: '0.72rem' }}>
                            <b>الإجراءات التطويرية:</b> {fb.actionTaken}
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
                📅 حصص التعليم الإلكتروني المجدولة ({teacherScheduledLessons.length})
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
                        {sl.lessonTopic || 'حصة تعليم إلكتروني مجدولة'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                        📅 {sl.date} | الحصة: {sl.period} | الصف: {sl.classGrade}
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
                      {sl.status || 'مجدولة'}
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
                    🌐 {editingDlLesson ? 'تعديل حصة Distance Learning' : 'إضافة حصة Distance Learning (Link From Teams)'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#0369A1', margin: '0.2rem 0 0', fontWeight: 600 }}>
                    اختر اليوم والتاريخ، الصف، الحصة، وأضف الرابط من Microsoft Teams.
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
                    ✕ إلغاء التعديل
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
                      اليوم والتاريخ ({getArabicDayName(dlDate)}) *
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
                      الصف *
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
                      الحصة *
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
                      الرابط (Link From Teams) : *
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
                      📋 لصق الرابط
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
                      ? '⏳ جاري الحفظ...'
                      : editingDlLesson
                      ? '💾 حفظ التعديل'
                      : '➕ إضافة الحصة والرابط'}
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
                  📅 جدول حصص Distance Learning الخاصة بالمعلم ({teacherDistanceLessons.length})
                </h3>
              </div>
              {teacherDistanceLessons.length > 0 && (
                <button
                  onClick={() =>
                    printTeacherDistanceLessonsScheduleReport(teacherDistanceLessons, {
                      academicYear: activeYear,
                      teacherOnlyName: teacher.nameAr,
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
                  🖨️ طباعة جدول حصصي عن بعد (Teams)
                </button>
              )}
            </div>

            {teacherDistanceLessons.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🎥</div>
                <div style={{ fontWeight: 800, color: '#0F2044', marginBottom: '0.25rem' }}>
                  لم تقم بإضافة حصص Distance Learning حتى الآن
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  اختر اليوم والتاريخ، الصف، الحصة، وأضف الرابط أعلاه ليتم إدراجها في جدول الطلاب.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff' }}>
                      {['#', 'اليوم والتاريخ', 'الصف', 'الحصة', 'الرابط (Link From Teams)', 'الإجراءات'].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '0.65rem 0.75rem',
                            textAlign: h === 'الإجراءات' || h === '#' || h === 'الصف' || h === 'الحصة' ? 'center' : 'right',
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
                          <span style={{ fontWeight: 800, color: '#0F2044' }}>{l.dayName}</span>
                          <span style={{ fontSize: '0.76rem', color: '#64748B', marginRight: '0.4rem' }}>({l.date})</span>
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
                              🎥 فتح الرابط (Teams)
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(l.teamsLink);
                                showToast('📋 تم نسخ الرابط');
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
                              📋 نسخ
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
                                ✏️ تعديل
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
                                🗑️ حذف
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
              🖨️ مركز التقارير الفردية الخاصة بالمعلم: {teacher.nameAr}
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              جميع التقارير أدناه مخصصة للمعلم فقط وتحتوي على إحصاءاته وتقييماته وحصصه وملاحظاته المعتمدة مع الترويسة الرسمية.
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
                  التقرير الشامل لإحصاءات وملف إنجاز المعلم (360° Portfolio)
                </div>
                <p style={{ fontSize: '0.73rem', color: '#64748B', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  يشمل كافة مؤشرات الأداء، المنحنى الشهري، سجل التقييمات الشهرية، والورش التدريبية الخاصة بالمعلم.
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
                🖨️ طباعة التقرير الشامل للمعلم
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
                  تقرير جدول حصص التعلم عن بعد (Microsoft Teams) الخاص بالمعلم
                </div>
                <p style={{ fontSize: '0.73rem', color: '#475569', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  طباعة جدول الحصص والروابط التفاعلية التي قام المعلم بإضافتها في تبويب Distance Learning ({teacherDistanceLessons.length} حصة).
                </p>
              </div>
              <button
                onClick={() =>
                  printTeacherDistanceLessonsScheduleReport(teacherDistanceLessons, {
                    academicYear: activeYear,
                    teacherOnlyName: teacher.nameAr,
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
                🖨️ طباعة جدول حصص Teams الخاص بي
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
                  سجل التدريب الفردي والتدريب الذاتي والشهادات المهنية للمعلم
                </div>
                <p style={{ fontSize: '0.73rem', color: '#475569', margin: '0.3rem 0 0', lineHeight: 1.5 }}>
                  طباعة كشف رسمي معتمد بجميع جلسات التدريب الفردي وبرامج التعلم الذاتي وشهادة MEEE المرتبطة بصفحة المعلم ({teacherPD.length} سجل تدريبي).
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
                🖨️ طباعة سجل التدريب الفردي والذاتي
              </button>
            </div>
          </div>

          {/* Individual Monthly Evaluation Printable Reports */}
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.65rem' }}>
            📝 طباعة تقارير تقييمات نظام قطر للتعليم الشهرية (منفصلة لكل شهر):
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
                    شهر {ev.month} ({ev.academicYear})
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0369A1', fontWeight: 800 }}>
                    الدرجة: {ev.totalScore}%
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
                  🖨️ طباعة
                </button>
              </div>
            ))}
          </div>

          {/* Individual Model Lessons Printable Reports */}
          {teacherModelLessons.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.65rem' }}>
                💻 طباعة تقارير حصص التعليم الإلكتروني المقيمة:
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
                        حصة {ml.date} (الصف {ml.classGrade})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                        التقييم: {ml.overallScore} / 10
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
                      🖨️ طباعة
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
                🎓 التطوير المهني، التدريب الفردي والذاتي، والشهادات المعتمدة الخاصة بالمعلم
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0', fontWeight: 600 }}>
                جميع سجلات التدريب الفردي وبرامج التعلم الذاتي والورش المرتبطة بملف المعلم أ. {teacher.nameAr} ({deptName})
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
              🖨️ طباعة سجل التطوير المهني والتدريب الذاتي
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
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1' }}>إجمالي التدريب الفردي والذاتي</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F2044', marginTop: '0.2rem' }}>
                {teacherPD.length} <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>سجل موثق</span>
              </div>
            </div>
            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338CA' }}>برامج التدريب والتعلم الذاتي</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4338CA', marginTop: '0.2rem' }}>
                {teacherPD.filter(r => r.trainingType === 'برنامج تعلم ذاتي / تطوير مهني خارجي').length}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>برنامج</span>
              </div>
            </div>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46' }}>جلسات التدريب والدعم الفردي</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#065F46', marginTop: '0.2rem' }}>
                {teacherPD.filter(r => r.trainingType !== 'برنامج تعلم ذاتي / تطوير مهني خارجي').length}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>جلسة</span>
              </div>
            </div>
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E' }}>إجمالي دقائق التدريب الفردي والذاتي</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#92400E', marginTop: '0.2rem' }}>
                {teacherPD.reduce((sum, r) => sum + (r.durationMinutes || 20), 0)}{' '}
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748B' }}>دقيقة</span>
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
                🏅 شهادة معلم مايكروسوفت الخبير (MEEE)
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                الحالة:{' '}
                <strong style={{ color: teacherMeee?.status === 'حصل على الشهادة' ? '#065F46' : '#0369A1' }}>
                  {teacherMeee?.status || 'لم يتم التقديم بعد'}
                </strong>
                {teacherMeee?.certificationDate && ` | تاريخ الاعتماد: ${teacherMeee.certificationDate}`}
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>{teacherMeee?.status === 'حصل على الشهادة' ? '🎖️' : '⏳'}</span>
          </div>

          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.75rem' }}>
            📋 سجلات التدريب الفردي والتدريب الذاتي المرتبطة بالمعلم ({teacherPD.length})
          </h4>
          {teacherPD.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', background: '#F8FAFC', borderRadius: '10px' }}>
              لا توجد سجلات تطوير مهني فردية أو ذاتية مسجلة لهذا المعلم حتى الآن
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    {['#', 'التاريخ والعام', 'المهارة / البرنامج التدريبي', 'التصنيف', 'نوع التدريب', 'المدرب / الجهة', 'المدة', 'الحالة'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '0.6rem 0.75rem',
                          textAlign: h === '#' || h === 'المدة' || h === 'الحالة' ? 'center' : 'right',
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
                          <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{pd.month} ({pd.academicYear})</div>
                        </td>
                        <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0369A1' }}>
                          {pd.skillProvided || 'تدريب فردي'}
                        </td>
                        <td style={{ padding: '0.6rem' }}>
                          <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {pd.skillCategory || 'نظام قطر للتعليم'}
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
                            {isSelfLearning ? '🎓 تدريب ذاتي / خارجي' : pd.trainingType || '👤 تدريب فردي'}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem', fontWeight: 700, color: '#334155' }}>
                          {pd.trainerName || 'أحمد طبيشات'}
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>
                          {pd.durationMinutes || 20} د
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
                            {pd.signatureStatus || 'موثق'}
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
            🏫 الورش التدريبية الجماعية المشارك بها ({teacherWorkshops.length})
          </h4>
          {teacherWorkshops.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
              لا توجد ورش جماعية مسجلة باسم المعلم مباشرة
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
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#065F46' }}>{w.titleAr || w.nameAr}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                      📅 {w.date} | المحاضر: {w.trainerName || w.facilitatorName || '-'} | المكان: {w.venue || w.location || '-'}
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
                    {w.targetAudience || 'ورشة جماعية'}
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
                💬 إبداء رأي وملاحظات المعلم على التقييم / الحصة
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
                  رأي المعلم وملاحظاته وتأمله المهني *
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={feedbackModal.opinionText}
                  onChange={e => setFeedbackModal({ ...feedbackModal, opinionText: e.target.value })}
                  placeholder="اكتب رأيك وملاحظاتك حول التقييم أو الحصة..."
                  required
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  الإجراءات التطويرية التي تم تنفيذها بناءً على التوصيات (اختياري)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={feedbackModal.actionTaken}
                  onChange={e => setFeedbackModal({ ...feedbackModal, actionTaken: e.target.value })}
                  placeholder="مثال: تم إثراء المحتوى الرقمي على نظام قطر للتعليم وإضافة أنشطة تفاعلية..."
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
                <span>أقر بأنني اطلعت على تفاصيل التقييم والتوصيات الواردة فيه</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', fontWeight: 800 }}
                >
                  {savingFeedback ? '⏳ جاري الحفظ...' : '💾 حفظ الرأي والملاحظات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
