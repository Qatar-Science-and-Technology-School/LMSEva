'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { db, isSuperAdmin, getDeptName, type User, type Teacher, type Department } from '@/lib/data';
import {
  DistanceLearningRecord,
  DistanceLearningReason,
  DistanceLearningStatus,
  TeacherDistanceLesson,
  TeacherDistanceLessonStatus,
  SCHOOL_PERIOD_OPTIONS,
  getArabicDayName,
  REASON_CONFIG,
  STATUS_CONFIG,
  LMS_SECTIONS,
  GRADE_OPTIONS,
  ALL_SECTIONS,
  getSectionsForGrade,
  getGradeFromSection,
  formatGradeLabel,
  SUBJECT_OPTIONS,
  calculateDaysCount,
  loadDistanceLearningRecords,
  saveDistanceLearningRecords,
  resetDistanceLearningRecords,
  loadTeacherDistanceLessons,
  fetchTeacherDistanceLessonsFromCloud,
  saveSingleTeacherDistanceLesson,
  removeTeacherDistanceLesson,
} from '@/lib/distanceLearningData';
import {
  printComprehensiveDistanceLearningReport,
  printStudentDistanceLearningCertificate,
  printTeacherDistanceLessonsScheduleReport,
} from '@/lib/distanceLearningReportPrinter';
import * as XLSX from 'xlsx';
import {
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  Clock4,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  BarChart3,
  PieChart as PieChartIcon,
  RotateCcw,
  Sparkles,
  Award,
  Globe,
  Stethoscope,
  Laptop,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DistanceLearningPageProps {
  currentUser: User;
  selectedYear?: string;
}

export default function DistanceLearningPage({
  currentUser,
  selectedYear = '2026-2027',
}: DistanceLearningPageProps) {
  // Permission Check: ONLY a.tubaishat1704@education.qa has add/edit/delete permissions
  const isAdmin = isSuperAdmin(currentUser);

  // Main Sub-Tab: 'teacher_schedule' (جدول حصص التعلم عن بعد للمعلمين - روابط Teams للطلاب) | 'student_cases' (سجل حالات الطلاب)
  const [activeSubTab, setActiveSubTab] = useState<'teacher_schedule' | 'student_cases'>('teacher_schedule');

  // Teacher Distance Learning Schedule (Teams Links) State
  const [teacherLessons, setTeacherLessons] = useState<TeacherDistanceLesson[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [schedGradeFilter, setSchedGradeFilter] = useState<string>('all');
  const [schedSectionFilter, setSchedSectionFilter] = useState<string>('all');
  const [schedDateFilter, setSchedDateFilter] = useState<string>('');
  const [schedTeacherFilter, setSchedTeacherFilter] = useState<string>('all');
  const [schedSearch, setSchedSearch] = useState<string>('');
  const [showAddTeacherLessonModal, setShowAddTeacherLessonModal] = useState<boolean>(false);
  const [editingTeacherLesson, setEditingTeacherLesson] = useState<TeacherDistanceLesson | null>(null);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string>('');

  // Admin Add/Edit Teacher Lesson Form State
  const todayIso = new Date().toISOString().split('T')[0];
  const [tlTeacherId, setTlTeacherId] = useState<string>('');
  const [tlLessonTitle, setTlLessonTitle] = useState<string>('');
  const [tlSubject, setTlSubject] = useState<string>('');
  const [tlGrade, setTlGrade] = useState<string>('الصف 10');
  const [tlSection, setTlSection] = useState<string>('1');
  const [tlDate, setTlDate] = useState<string>(todayIso);
  const [tlPeriod, setTlPeriod] = useState<string>('الحصة الأولى');
  const [tlStartTime, setTlStartTime] = useState<string>('07:15');
  const [tlEndTime, setTlEndTime] = useState<string>('08:00');
  const [tlTeamsLink, setTlTeamsLink] = useState<string>('');
  const [tlStudentNotes, setTlStudentNotes] = useState<string>('');
  const [tlStatus, setTlStatus] = useState<TeacherDistanceLessonStatus>('مجدولة');

  // State
  const [records, setRecords] = useState<DistanceLearningRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState<'all' | DistanceLearningReason>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | string>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DistanceLearningStatus>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'preview'>('table');
  const [showCharts, setShowCharts] = useState(true);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DistanceLearningRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<DistanceLearningRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DistanceLearningRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    eventTitle: string;
    studentName: string;
    grade: string;
    section: string;
    fromDate: string;
    toDate: string;
    daysCount: number;
    reason: DistanceLearningReason;
    reasonDetails: string;
    status: DistanceLearningStatus;
    subjects: string[];
    supervisor: string;
    platform: string;
    commitmentRate: number;
    notes: string;
  }>({
    eventTitle: '',
    studentName: '',
    grade: 'الصف 10',
    section: '1',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    daysCount: 1,
    reason: 'عذر طبي',
    reasonDetails: '',
    status: 'قيد المتابعة',
    subjects: ['الرياضيات', 'الفيزياء', 'اللغة الإنجليزية'],
    supervisor: 'م. أحمد عادل طبيشات',
    platform: 'نظام قطر للتعليم و Microsoft Teams',
    commitmentRate: 95,
    notes: '',
  });

  // Load records on mount or year change & listen for cloud sync updates
  useEffect(() => {
    const refresh = () => {
      const loaded = loadDistanceLearningRecords(selectedYear);
      setRecords(loaded);
      fetchTeacherDistanceLessonsFromCloud(selectedYear)
        .then(list => setTeacherLessons(list))
        .catch(() => setTeacherLessons(loadTeacherDistanceLessons(selectedYear)));
    };
    refresh();
    Promise.all([db.getTeachers(), db.getDepartments()])
      .then(([t, d]) => {
        setTeachersList(t);
        setDepartmentsList(d);
      })
      .catch(() => {});
    window.addEventListener('qstss_distance_learning_updated', refresh);
    window.addEventListener('qstss_teacher_dl_lessons_updated', refresh);
    return () => {
      window.removeEventListener('qstss_distance_learning_updated', refresh);
      window.removeEventListener('qstss_teacher_dl_lessons_updated', refresh);
    };
  }, [selectedYear]);

  // Filtered Teacher Distance Learning Lessons (Teams links)
  const filteredTeacherLessons = useMemo(() => {
    return teacherLessons.filter(l => {
      if (schedGradeFilter !== 'all' && l.grade !== schedGradeFilter) return false;
      if (schedSectionFilter !== 'all' && l.gradeSection !== schedSectionFilter && l.section !== schedSectionFilter) return false;
      if (schedDateFilter && l.date !== schedDateFilter) return false;
      if (schedTeacherFilter !== 'all' && l.teacherId !== schedTeacherFilter) return false;
      if (schedSearch.trim()) {
        const q = schedSearch.trim().toLowerCase();
        return (
          (l.teacherNameAr || '').toLowerCase().includes(q) ||
          (l.subject || '').toLowerCase().includes(q) ||
          (l.lessonTitle || '').toLowerCase().includes(q) ||
          (l.gradeSection || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teacherLessons, schedGradeFilter, schedSectionFilter, schedDateFilter, schedTeacherFilter, schedSearch]);

  const handleSaveAdminTeacherLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenTeacher = teachersList.find(t => t.id === tlTeacherId);
    if (!chosenTeacher || !tlLessonTitle.trim() || !tlTeamsLink.trim()) {
      alert('يرجى اختيار المعلم وإدخال عنوان الحصة ورابط Microsoft Teams');
      return;
    }
    const now = new Date().toISOString();
    const gradeNumMatch = tlGrade.match(/\d+/);
    const gradeNum = gradeNumMatch ? gradeNumMatch[0] : '10';
    const gradeSection = tlSection === 'جميع الشعب' ? `${tlGrade} (جميع الشعب)` : `${gradeNum}/${tlSection}`;
    const deptName = getDeptName(chosenTeacher.departmentId, departmentsList);

    const lesson: TeacherDistanceLesson = {
      id: editingTeacherLesson?.id || `TDL-${chosenTeacher.id}-${Date.now().toString().slice(-6)}`,
      teacherId: chosenTeacher.id,
      teacherNameAr: chosenTeacher.nameAr,
      teacherNameEn: chosenTeacher.nameEn,
      departmentId: chosenTeacher.departmentId,
      departmentName: deptName,
      subject: tlSubject.trim() || chosenTeacher.subject,
      lessonTitle: tlLessonTitle.trim(),
      grade: tlGrade,
      section: tlSection,
      gradeSection,
      date: tlDate,
      dayName: getArabicDayName(tlDate),
      period: tlPeriod,
      startTime: tlStartTime,
      endTime: tlEndTime,
      teamsLink: tlTeamsLink.trim(),
      platform: 'Microsoft Teams',
      studentNotes: tlStudentNotes.trim(),
      status: tlStatus,
      academicYear: selectedYear,
      createdAt: editingTeacherLesson?.createdAt || now,
      updatedAt: now,
    };

    const updated = await saveSingleTeacherDistanceLesson(lesson);
    setTeacherLessons(updated);
    setShowAddTeacherLessonModal(false);
    setEditingTeacherLesson(null);
  };

  const handleExportTeacherScheduleExcel = () => {
    const rows = filteredTeacherLessons.map((l, i) => ({
      '#': i + 1,
      'اليوم': l.dayName,
      'التاريخ': l.date,
      'الحصة': l.period,
      'من الساعة': l.startTime,
      'إلى الساعة': l.endTime,
      'الصف والشعبة': l.gradeSection,
      'المادة الدراسية': l.subject,
      'اسم المعلم': l.teacherNameAr,
      'القسم': l.departmentName,
      'عنوان الدرس': l.lessonTitle,
      'رابط الحصة (Microsoft Teams Link)': l.teamsLink,
      'ملاحظات للطلاب': l.studentNotes || '',
      'الحالة': l.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'جدول حصص التعلم عن بعد');
    XLSX.writeFile(wb, `جدول_حصص_التعلم_عن_بعد_Teams_للطلاب_${selectedYear}.xlsx`);
  };

  const handleCopyScheduleForStudents = () => {
    if (filteredTeacherLessons.length === 0) {
      alert('لا توجد حصص مضافة حالياً لنسخها.');
      return;
    }
    const header = `🏫 *مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين*\n🌐 *جدول حصص التعلم عن بعد (Microsoft Teams)*\n📅 العام الأكاديمي: ${selectedYear}${schedGradeFilter !== 'all' ? ` | ${schedGradeFilter}` : ''}${schedSectionFilter !== 'all' ? ` (${schedSectionFilter})` : ''}\n────────────────────────\n`;
    const body = filteredTeacherLessons
      .map(
        (l, idx) =>
          `${idx + 1}. *${l.subject}* — (${l.gradeSection})\n` +
          `👨‍🏫 المعلم: أ. ${l.teacherNameAr}\n` +
          `📖 الدرس: ${l.lessonTitle}\n` +
          `🕒 الموعد: ${l.dayName} ${l.date} | ${l.period} (${l.startTime} - ${l.endTime})\n` +
          `🎥 رابط الحصة في Teams:\n${l.teamsLink}` +
          (l.studentNotes ? `\n📌 ملاحظة: ${l.studentNotes}` : '')
      )
      .join('\n────────────────────────\n');
    const footer = `\n────────────────────────\n💡 يرجى من أبنائنا الطلاب الدخول إلى رابط الحصة قبل الموعد بـ 5 دقائق عبر الحساب المدرسي الرسمي.`;
    navigator.clipboard.writeText(header + body + footer);
    setCopySuccessMsg('✅ تم نسخ جدول حصص التعلم عن بعد بالروابط بنجاح! يمكنك الآن لصقه وإرساله للطلاب عبر Teams أو الرسائل.');
    setTimeout(() => setCopySuccessMsg(''), 5000);
  };

  // Recalculate daysCount in form whenever fromDate or toDate changes
  const handleDateChange = (from: string, to: string) => {
    const days = calculateDaysCount(from, to);
    setFormData(prev => ({
      ...prev,
      fromDate: from,
      toDate: to,
      daysCount: days,
    }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingRecord(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      eventTitle: '',
      studentName: '',
      grade: 'الصف 10',
      section: '1',
      fromDate: today,
      toDate: today,
      daysCount: 1,
      reason: 'عذر طبي',
      reasonDetails: '',
      status: 'قيد المتابعة',
      subjects: ['الرياضيات', 'الفيزياء', 'اللغة الإنجليزية'],
      supervisor: 'م. أحمد عادل طبيشات',
      platform: 'نظام قطر للتعليم و Microsoft Teams',
      commitmentRate: 95,
      notes: '',
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: DistanceLearningRecord) => {
    if (!isAdmin) return;
    setEditingRecord(rec);
    const recGrade = rec.grade
      ? (GRADE_OPTIONS.includes(rec.grade)
          ? rec.grade
          : (GRADE_OPTIONS.find(g => g.replace(/\D/g, '') === rec.grade.replace(/\D/g, '')) || 'الصف 10'))
      : 'الصف 10';

    setFormData({
      eventTitle: rec.eventTitle,
      studentName: rec.studentName,
      grade: recGrade,
      section: rec.section || '1',
      fromDate: rec.fromDate,
      toDate: rec.toDate,
      daysCount: rec.daysCount || calculateDaysCount(rec.fromDate, rec.toDate),
      reason: rec.reason,
      reasonDetails: rec.reasonDetails || '',
      status: rec.status,
      subjects: rec.subjects || ['الرياضيات', 'الفيزياء'],
      supervisor: rec.supervisor || 'م. أحمد عادل طبيشات',
      platform: rec.platform || 'نظام قطر للتعليم',
      commitmentRate: rec.commitmentRate || 95,
      notes: rec.notes || '',
    });
    setShowAddEditModal(true);
  };

  // Save Add/Edit
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formData.eventTitle.trim() || !formData.studentName.trim()) {
      alert('يرجى كتابة اسم الطالب وفعالية التعلم عن بعد');
      return;
    }

    const gradeNumberMatch = formData.grade.match(/\d+/);
    const gradeNum = gradeNumberMatch ? gradeNumberMatch[0] : (formData.grade.includes('تاسع') ? '9' : formData.grade.includes('عاشر') ? '10' : formData.grade.includes('حادي') ? '11' : '12');
    const gradeSection = `${gradeNum}/${formData.section}`;

    const now = new Date().toISOString();

    if (editingRecord) {
      // Update
      const updatedList = records.map(r => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            ...formData,
            gradeSection,
            academicYear: selectedYear,
            updatedAt: now,
          };
        }
        return r;
      });
      setRecords(updatedList);
      saveDistanceLearningRecords(updatedList, selectedYear);
    } else {
      // Add
      const newRec: DistanceLearningRecord = {
        id: `DL-${Date.now().toString().slice(-6)}`,
        ...formData,
        gradeSection,
        academicYear: selectedYear,
        createdAt: now,
        updatedAt: now,
      };
      const updatedList = [newRec, ...records];
      setRecords(updatedList);
      saveDistanceLearningRecords(updatedList, selectedYear);
    }

    setShowAddEditModal(false);
    setEditingRecord(null);
  };

  // Delete
  const handleDeleteConfirm = () => {
    if (!isAdmin || !deletingRecord) return;
    const updated = records.filter(r => r.id !== deletingRecord.id);
    setRecords(updated);
    saveDistanceLearningRecords(updated, selectedYear);
    setDeletingRecord(null);
  };

  // Reset to default
  const handleResetData = () => {
    if (!isAdmin) return;
    if (confirm('هل أنت متأكد من استعادة بيانات وسجلات التعلم عن بعد الافتراضية؟')) {
      const reset = resetDistanceLearningRecords(selectedYear);
      setRecords(reset);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Reason filter
      if (selectedReason !== 'all' && r.reason !== selectedReason) return false;
      // Grade filter (support exact match or numeric match like "الصف 10" vs "10")
      if (selectedGrade !== 'all') {
        const selNum = selectedGrade.replace(/\D/g, '');
        const rNum = (r.grade || '').replace(/\D/g, '');
        if (r.grade !== selectedGrade && (!selNum || !rNum || selNum !== rNum)) return false;
      }
      // Section filter (support section code like "10/4" or section number like "4")
      if (selectedSection !== 'all') {
        if (r.gradeSection !== selectedSection && r.section !== selectedSection) return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchStudent = r.studentName.toLowerCase().includes(query);
        const matchTitle = r.eventTitle.toLowerCase().includes(query);
        const matchGrade = (r.gradeSection || '').toLowerCase().includes(query);
        const matchReason = r.reason.toLowerCase().includes(query);
        const matchNotes = (r.notes || '').toLowerCase().includes(query);
        return matchStudent || matchTitle || matchGrade || matchReason || matchNotes;
      }
      return true;
    });
  }, [records, selectedReason, selectedGrade, selectedSection, selectedStatus, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRecords = records.length;
    const uniqueStudents = new Set(records.map(r => r.studentName)).size;
    const totalDays = records.reduce((sum, r) => sum + (r.daysCount || 0), 0);
    const medicalCount = records.filter(r => r.reason === 'عذر طبي').length;
    const competitionCount = records.filter(r => r.reason === 'السفر لمسابقة').length;
    const conferenceCount = records.filter(r => r.reason === 'السفر لمؤتمر').length;
    const dlDayCount = records.filter(r => r.reason === 'يوم التعلم عن بعد').length;
    const completedCount = records.filter(r => r.status === 'مكتمل' || r.status === 'معتمد').length;
    const avgCommitment = totalRecords > 0
      ? Math.round(records.reduce((sum, r) => sum + (r.commitmentRate || 95), 0) / totalRecords)
      : 0;

    return {
      totalRecords,
      uniqueStudents,
      totalDays,
      medicalCount,
      competitionCount,
      conferenceCount,
      dlDayCount,
      completedCount,
      avgCommitment,
    };
  }, [records]);

  // Chart Data: Reason Distribution
  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'عذر طبي': 0,
      'السفر لمسابقة': 0,
      'السفر لمؤتمر': 0,
      'يوم التعلم عن بعد': 0,
    };
    records.forEach(r => {
      if (counts[r.reason] !== undefined) {
        counts[r.reason]++;
      }
    });

    return [
      { name: 'عذر طبي', count: counts['عذر طبي'], color: '#DC2626' },
      { name: 'السفر لمسابقة', count: counts['السفر لمسابقة'], color: '#D97706' },
      { name: 'السفر لمؤتمر', count: counts['السفر لمؤتمر'], color: '#2563EB' },
      { name: 'يوم التعلم عن بعد', count: counts['يوم التعلم عن بعد'], color: '#059669' },
    ];
  }, [records]);

  // Chart Data: Grade Distribution (dynamically mapped across all LMS grades: 7, 9, 10, 11, 12)
  const gradeChartData = useMemo(() => {
    const counts: Record<string, { records: number; days: number }> = {};
    GRADE_OPTIONS.forEach(g => {
      counts[g] = { records: 0, days: 0 };
    });

    records.forEach(r => {
      let matchedGrade = GRADE_OPTIONS.find(g => g === r.grade);
      if (!matchedGrade) {
        const rNum = (r.grade || '').replace(/\D/g, '');
        matchedGrade = GRADE_OPTIONS.find(g => g.replace(/\D/g, '') === rNum);
      }
      if (matchedGrade && counts[matchedGrade]) {
        counts[matchedGrade].records++;
        counts[matchedGrade].days += (r.daysCount || 1);
      }
    });

    return GRADE_OPTIONS.map(g => ({
      grade: formatGradeLabel(g),
      gradeCode: g,
      count: counts[g]?.records || 0,
      days: counts[g]?.days || 0,
    }));
  }, [records]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredRecords.map((r, i) => ({
      'م': i + 1,
      'اسم الطالب': r.studentName,
      'الصف': r.grade,
      'الشعبة': r.section,
      'الصف والشعبة': r.gradeSection,
      'فعالية التعلم عن بعد': r.eventTitle,
      'السبب': r.reason,
      'تفاصيل السبب': r.reasonDetails || '',
      'من تاريخ': r.fromDate,
      'إلى تاريخ': r.toDate,
      'عدد الأيام': r.daysCount,
      'الحالة': r.status,
      'المواد المشمولة': (r.subjects || []).join(', '),
      'المنصة': r.platform || '',
      'المشرف': r.supervisor || '',
      'نسبة الالتزام %': r.commitmentRate || '',
      'ملاحظات': r.notes || '',
      'العام الأكاديمي': r.academicYear,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجلات التعلم عن بعد');
    XLSX.writeFile(wb, `سجلات_التعلم_عن_بعد_${selectedYear}.xlsx`);
  };

  return (
    <div style={{ padding: '1.25rem', direction: 'rtl', minHeight: '100%' }}>
      {/* ─── Top Bar / Header ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#FFFFFF',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        boxShadow: '0 2px 10px rgba(15,32,68,0.06)',
        marginBottom: '1.25rem',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F2044 0%, #0096C7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,150,199,0.25)',
          }}>
            🌐
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F2044' }}>
                التعلم عن بعد
              </h1>
              <span style={{
                background: '#E0F2FE',
                color: '#0369A1',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}>
                {selectedYear}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              سجلات ومتابعة حضور الحصص الافتراضية، الأعذار الطبية، والمهام الخارجية لمدرسة قطر للعلوم والتكنولوجيا
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCharts(!showCharts)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              background: showCharts ? '#F1F5F9' : '#FFFFFF',
              color: '#334155',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <BarChart3 size={16} />
            <span>{showCharts ? 'إخفاء الإحصاءات' : 'عرض الإحصاءات'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid #A7F3D0',
              background: '#ECFDF5',
              color: '#065F46',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <FileSpreadsheet size={16} />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => printComprehensiveDistanceLearningReport(filteredRecords, { academicYear: selectedYear })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '10px',
              border: '1px solid #0F2044',
              background: '#0F2044',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 800,
              boxShadow: '0 3px 8px rgba(15,32,68,0.2)',
            }}
          >
            <Printer size={16} />
            <span>طباعة التقرير الشامل A3</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 800,
                boxShadow: '0 3px 8px rgba(2,132,199,0.3)',
              }}
            >
              <Plus size={16} />
              <span>إضافة سجل تعلم عن بعد</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Sub-Tab Switcher ────────────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('teacher_schedule')}
          style={{
            padding: '0.9rem 1.25rem',
            borderRadius: '14px',
            border: activeSubTab === 'teacher_schedule' ? '2px solid #4F46E5' : '1px solid #CBD5E1',
            background:
              activeSubTab === 'teacher_schedule'
                ? 'linear-gradient(135deg, #0F2044 0%, #3730A3 100%)'
                : '#FFFFFF',
            color: activeSubTab === 'teacher_schedule' ? '#FFFFFF' : '#0F2044',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'right',
            boxShadow:
              activeSubTab === 'teacher_schedule' ? '0 8px 20px rgba(79,70,229,0.22)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>
              🎥 جدول حصص التعلم عن بعد للمعلمين (Link From Teams)
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: activeSubTab === 'teacher_schedule' ? '#C7D2FE' : '#64748B',
                marginTop: '2px',
              }}
            >
              روابط حصص Microsoft Teams المضافة من المعلمين لاستخراج تقرير الجدول وإرساله للطلاب
            </div>
          </div>
          <span
            style={{
              background: activeSubTab === 'teacher_schedule' ? '#38BDF8' : '#EEF2FF',
              color: activeSubTab === 'teacher_schedule' ? '#0F2044' : '#4338CA',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 900,
            }}
          >
            {teacherLessons.length} حصة
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('student_cases')}
          style={{
            padding: '0.9rem 1.25rem',
            borderRadius: '14px',
            border: activeSubTab === 'student_cases' ? '2px solid #0284C7' : '1px solid #CBD5E1',
            background:
              activeSubTab === 'student_cases'
                ? 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)'
                : '#FFFFFF',
            color: activeSubTab === 'student_cases' ? '#FFFFFF' : '#0F2044',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'right',
            boxShadow:
              activeSubTab === 'student_cases' ? '0 8px 20px rgba(2,132,199,0.22)' : '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>
              👨‍🎓 سجل حالات الطلاب في التعلم عن بعد (الأعذار والمهام)
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: activeSubTab === 'student_cases' ? '#BAE6FD' : '#64748B',
                marginTop: '2px',
              }}
            >
              متابعة حضور الطلاب ذوي الأعذار الطبية والمشاركات والمسابقات الخارجية
            </div>
          </div>
          <span
            style={{
              background: activeSubTab === 'student_cases' ? '#38BDF8' : '#E0F2FE',
              color: activeSubTab === 'student_cases' ? '#0F2044' : '#0369A1',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 900,
            }}
          >
            {records.length} طالب
          </span>
        </button>
      </div>

      {/* Viewer Mode Banner */}
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
            <strong>وضع الاطلاع والمشاهدة فقط:</strong> سجلات التعلم عن بعد معتمدة للقراءة والاطلاع والطباعة وتصدير التقارير. التعديل والإضافة والحذف متاحة حصرياً لمدير النظام (أو للمعلم من بوابته الخاصة).
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: TEACHER DISTANCE LEARNING SCHEDULE (TEAMS LINKS FOR STUDENTS)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'teacher_schedule' && (
        <div>
          {copySuccessMsg && (
            <div
              className="no-print"
              style={{
                background: '#ECFDF5',
                border: '1.5px solid #10B981',
                color: '#065F46',
                padding: '0.8rem 1.2rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {copySuccessMsg}
            </div>
          )}

          {/* KPI Cards for Teacher Teams Schedule */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderTop: '4px solid #4F46E5',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800 }}>إجمالي حصص Teams المضافة</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F2044', marginTop: '4px' }}>
                {filteredTeacherLessons.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: 700 }}>حصة تعلم عن بعد بروابط مباشرة</div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderTop: '4px solid #0284C7',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800 }}>المعلمون المشاركون</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>
                {new Set(filteredTeacherLessons.map(l => l.teacherNameAr)).size}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>معلماً أضاف روابط حصصه</div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderTop: '4px solid #059669',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800 }}>الشعب والفصول المغطاة</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                {new Set(filteredTeacherLessons.map(l => l.gradeSection)).size}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>شعبة دراسية</div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #E2E8F0',
                borderTop: '4px solid #D97706',
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800 }}>المواد الدراسية</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                {new Set(filteredTeacherLessons.map(l => l.subject)).size}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>مادة تخصصية وأكاديمية</div>
            </div>
          </div>

          {/* Admin Action & Extraction Toolbar for Student Schedule Report */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.15rem 1.25rem',
              border: '1px solid #CBD5E1',
              marginBottom: '1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                paddingBottom: '1rem',
                marginBottom: '1rem',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
                  📋 استخراج تقرير جدول حصص التعلم عن بعد (Microsoft Teams) لإرساله للطلاب
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#64748B' }}>
                  يمكنك تصفية الجدول حسب الصف أو الشعبة أو التاريخ ثم طباعة التقرير الرسمي المعتمد أو نسخه كرسالة جاهزة لإرسالها للطلاب.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const filterParts: string[] = [];
                    if (schedGradeFilter !== 'all') filterParts.push(schedGradeFilter);
                    if (schedSectionFilter !== 'all') filterParts.push(`شعبة ${schedSectionFilter}`);
                    if (schedDateFilter) filterParts.push(`بتاريخ ${schedDateFilter}`);
                    printTeacherDistanceLessonsScheduleReport(filteredTeacherLessons, {
                      academicYear: selectedYear,
                      filterLabel: filterParts.join(' - ') || 'جميع الصفوف والشعب',
                    });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0F2044 0%, #4F46E5 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.6rem 1.15rem',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                  }}
                >
                  <Printer size={16} />
                  <span>🖨️ استخراج وطباعة جدول حصص التعلم عن بعد للطلاب</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyScheduleForStudents}
                  style={{
                    background: '#0284C7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>📲 نسخ الجدول بالروابط لإرساله للطلاب</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportTeacherScheduleExcel}
                  style={{
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '0.6rem 0.95rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <FileSpreadsheet size={16} />
                  <span>تصدير الجدول Excel</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacherLesson(null);
                      setTlTeacherId(teachersList[0]?.id || '');
                      setTlSubject(teachersList[0]?.subject || '');
                      setTlLessonTitle('');
                      setTlTeamsLink('');
                      setTlStudentNotes('');
                      setShowAddTeacherLessonModal(true);
                    }}
                    style={{
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Plus size={16} />
                    <span>إضافة حصة Teams</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filters for Teacher Distance Learning Schedule */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  بحث سريع (المعلم، المادة، الدرس)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={schedSearch}
                  onChange={e => setSchedSearch(e.target.value)}
                  placeholder="ابحث..."
                  style={{ padding: '0.45rem 0.7rem', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  الصف الدراسي
                </label>
                <select
                  className="form-input"
                  value={schedGradeFilter}
                  onChange={e => {
                    setSchedGradeFilter(e.target.value);
                    setSchedSectionFilter('all');
                  }}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <option value="all">جميع الصفوف</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g} value={g}>
                      {formatGradeLabel(g)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  الشعبة
                </label>
                <select
                  className="form-input"
                  value={schedSectionFilter}
                  onChange={e => setSchedSectionFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <option value="all">جميع الشعب</option>
                  {getSectionsForGrade(schedGradeFilter).map(s => (
                    <option key={s.section} value={s.section}>
                      شعبة {s.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  التاريخ / اليوم
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={schedDateFilter}
                  onChange={e => setSchedDateFilter(e.target.value)}
                  style={{ padding: '0.42rem 0.65rem', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                  المعلم
                </label>
                <select
                  className="form-input"
                  value={schedTeacherFilter}
                  onChange={e => setSchedTeacherFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <option value="all">جميع المعلمين</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            {filteredTeacherLessons.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎥</div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0F2044', marginBottom: '0.3rem' }}>
                  لا توجد حصص تعلم عن بعد (Microsoft Teams) مضافة ضمن هذا الفلتر حالياً
                </div>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  يقوم المعلمون بالدخول من بوابة (المعلم) في صفحة الدخول ثم فتح تبويب <strong>Distance Learning</strong> وإضافة حصصهم وروابط Teams لتظهر هنا فوراً.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#FFFFFF' }}>
                      {[
                        '#',
                        'اليوم والتاريخ',
                        'الحصة والوقت',
                        'الصف والشعبة',
                        'المادة الدراسية',
                        'اسم المعلم والقسم',
                        'عنوان الدرس وملاحظات الطلاب',
                        'رابط الحصة المباشر (Link From Teams)',
                        'الحالة',
                        ...(isAdmin ? ['الإجراءات'] : []),
                      ].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '0.75rem 0.7rem',
                            textAlign: h === '#' || h === 'الإجراءات' ? 'center' : 'right',
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
                    {filteredTeacherLessons.map((l, idx) => (
                      <tr
                        key={l.id}
                        style={{
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                        }}
                      >
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#0F2044' }}>{l.dayName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{l.date}</div>
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#0369A1' }}>{l.period}</div>
                          <div style={{ fontSize: '0.72rem', color: '#475569' }} dir="ltr">
                            {l.startTime} - {l.endTime}
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <span
                            style={{
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.76rem',
                            }}
                          >
                            {l.gradeSection}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0F2044' }}>{l.subject}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#0F2044' }}>{l.teacherNameAr}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{l.departmentName}</div>
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ fontWeight: 800, color: '#1E293B' }}>{l.lessonTitle}</div>
                          {l.studentNotes && (
                            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
                              📌 {l.studentNotes}
                            </div>
                          )}
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
                                padding: '0.32rem 0.7rem',
                                borderRadius: '6px',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                              }}
                            >
                              🎥 فتح الحصة (Teams)
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(l.teamsLink);
                                setCopySuccessMsg(`✅ تم نسخ رابط حصة المعلم ${l.teacherNameAr}`);
                                setTimeout(() => setCopySuccessMsg(''), 3000);
                              }}
                              style={{
                                background: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              📋 نسخ الرابط
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <span
                            style={{
                              background:
                                l.status === 'تم التنفيذ'
                                  ? '#DBEAFE'
                                  : l.status === 'جارية الآن'
                                  ? '#DCFCE7'
                                  : '#FEF3C7',
                              color:
                                l.status === 'تم التنفيذ'
                                  ? '#1E40AF'
                                  : l.status === 'جارية الآن'
                                  ? '#166534'
                                  : '#92400E',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeacherLesson(l);
                                  setTlTeacherId(l.teacherId);
                                  setTlLessonTitle(l.lessonTitle);
                                  setTlSubject(l.subject);
                                  setTlGrade(l.grade || 'الصف 10');
                                  setTlSection(l.section || '1');
                                  setTlDate(l.date);
                                  setTlPeriod(l.period);
                                  setTlStartTime(l.startTime);
                                  setTlEndTime(l.endTime);
                                  setTlTeamsLink(l.teamsLink);
                                  setTlStudentNotes(l.studentNotes || '');
                                  setTlStatus(l.status || 'مجدولة');
                                  setShowAddTeacherLessonModal(true);
                                }}
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm('هل أنت متأكد من حذف هذه الحصة من جدول التعلم عن بعد؟')) return;
                                  const rem = await removeTeacherDistanceLesson(l.id);
                                  setTeacherLessons(rem);
                                }}
                                style={{
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  border: '1px solid #FECACA',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Add/Edit Teacher Distance Learning Lesson Modal */}
      {showAddTeacherLessonModal && isAdmin && (
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
              maxWidth: '640px',
              width: '100%',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
                🎥 {editingTeacherLesson ? 'تعديل حصة التعلم عن بعد (Teams)' : 'إضافة حصة تعلم عن بعد (Link From Teams)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTeacherLessonModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminTeacherLesson}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    المعلم *
                  </label>
                  <select
                    className="form-input"
                    value={tlTeacherId}
                    onChange={e => {
                      setTlTeacherId(e.target.value);
                      const found = teachersList.find(t => t.id === e.target.value);
                      if (found) setTlSubject(found.subject);
                    }}
                    required
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nameAr} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    المادة الدراسية *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={tlSubject}
                    onChange={e => setTlSubject(e.target.value)}
                    required
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    عنوان الدرس / الحصة *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={tlLessonTitle}
                    onChange={e => setTlLessonTitle(e.target.value)}
                    placeholder="عنوان الدرس..."
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    الصف *
                  </label>
                  <select className="form-input" value={tlGrade} onChange={e => setTlGrade(e.target.value)}>
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    الشعبة *
                  </label>
                  <select className="form-input" value={tlSection} onChange={e => setTlSection(e.target.value)}>
                    {getSectionsForGrade(tlGrade).map(s => (
                      <option key={s.section} value={s.sectionNum}>
                        شعبة {s.section}
                      </option>
                    ))}
                    <option value="جميع الشعب">جميع شعب {tlGrade}</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    التاريخ ({getArabicDayName(tlDate)}) *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={tlDate}
                    onChange={e => setTlDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    الحصة *
                  </label>
                  <select
                    className="form-input"
                    value={tlPeriod}
                    onChange={e => {
                      const val = e.target.value;
                      setTlPeriod(val);
                      const p = SCHOOL_PERIOD_OPTIONS.find(x => x.label === val);
                      if (p) {
                        setTlStartTime(p.startTime);
                        setTlEndTime(p.endTime);
                      }
                    }}
                  >
                    {SCHOOL_PERIOD_OPTIONS.map(p => (
                      <option key={p.id} value={p.label}>
                        {p.label} ({p.startTime} - {p.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  رابط الحصة من مايكروسوفت تيمز (Link From Teams) *
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={tlTeamsLink}
                  onChange={e => setTlTeamsLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  style={{ direction: 'ltr', textAlign: 'left' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  ملاحظات للطلاب (اختياري)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tlStudentNotes}
                  onChange={e => setTlStudentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTeacherLessonModal(false)}
                  className="btn btn-ghost"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 حفظ الحصة والرابط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'student_cases' && (
        <>
      {/* ─── KPI Cards ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem',
      }}>
        {/* Total Records */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إجمالي السجلات</span>
            <span style={{ fontSize: '1.2rem' }}>📑</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2044' }}>
            {metrics.totalRecords}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
            حالات متابعة مسجلة
          </div>
        </div>

        {/* Unique Students */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>الطلاب المستفيدين</span>
            <span style={{ fontSize: '1.2rem' }}>👨‍🎓</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2044' }}>
            {metrics.uniqueStudents}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
            طالباً منتظماً عن بعد
          </div>
        </div>

        {/* Total Days */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إجمالي الأيام</span>
            <span style={{ fontSize: '1.2rem' }}>🗓️</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2044' }}>
            {metrics.totalDays}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginTop: '2px' }}>
            أيام تعلم معتمدة
          </div>
        </div>

        {/* Medical Excuses */}
        <div style={{
          background: '#FEF2F2',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #FECACA',
          boxShadow: '0 2px 6px rgba(220,38,38,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 800 }}>عذر طبي</span>
            <span style={{ fontSize: '1.2rem' }}>🏥</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#DC2626' }}>
            {metrics.medicalCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#B91C1C', fontWeight: 700, marginTop: '2px' }}>
            تقارير طبية معتمدة
          </div>
        </div>

        {/* Competitions */}
        <div style={{
          background: '#FFFBEB',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #FDE68A',
          boxShadow: '0 2px 6px rgba(217,119,6,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 800 }}>سفر لمسابقات</span>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706' }}>
            {metrics.competitionCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 700, marginTop: '2px' }}>
            تمثيل وطني ودولي
          </div>
        </div>

        {/* Conferences */}
        <div style={{
          background: '#EFF6FF',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #BFDBFE',
          boxShadow: '0 2px 6px rgba(37,99,235,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 800 }}>سفر لمؤتمرات</span>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563EB' }}>
            {metrics.conferenceCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#1D4ED8', fontWeight: 700, marginTop: '2px' }}>
            مؤتمرات وندوات بحثية
          </div>
        </div>

        {/* DL Days & Commitment */}
        <div style={{
          background: '#ECFDF5',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid #A7F3D0',
          boxShadow: '0 2px 6px rgba(5,150,105,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 800 }}>يوم التعلم عن بعد</span>
            <span style={{ fontSize: '1.2rem' }}>💻</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>
            {metrics.dlDayCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, marginTop: '2px' }}>
            التزام: {metrics.avgCommitment}%
          </div>
        </div>
      </div>

      {/* ─── Interactive Charts Section ───────────────────────────────────── */}
      {showCharts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}>
          {/* Chart 1: Reason Distribution */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChartIcon size={18} color="#0F2044" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F2044' }}>
                  توزيع حالات التعلم عن بعد حسب السبب
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                {metrics.totalRecords} حالة
              </span>
            </div>
            <div style={{ height: '230px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, value }: any) => `${name} (${value})`}
                  >
                    {reasonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: any, name: any) => [`${value} حالة`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Quick Reason Badges Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {reasonChartData.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color }} />
                  <span style={{ color: '#475569', fontWeight: 700 }}>{r.name}:</span>
                  <strong style={{ color: '#0F2044' }}>{r.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Grade Breakdown */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#0F2044" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F2044' }}>
                  توزيع الحالات والأيام حسب الصفوف الدراسية
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                مقارنة الصفوف
              </span>
            </div>
            <div style={{ height: '230px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', direction: 'rtl', textAlign: 'right' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="عدد الحالات" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="days" name="إجمالي الأيام" fill="#0F2044" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ─────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، الفعالية، أو الصف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 2.2rem 0.55rem 0.8rem',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#F8FAFC',
              }}
            />
          </div>

          {/* Reason Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>السبب:</span>
            <select
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value as any)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              <option value="all">كافة الأسباب</option>
              <option value="عذر طبي">عذر طبي</option>
              <option value="السفر لمسابقة">السفر لمسابقة</option>
              <option value="السفر لمؤتمر">السفر لمؤتمر</option>
              <option value="يوم التعلم عن بعد">يوم التعلم عن بعد</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>الصف:</span>
            <select
              value={selectedGrade}
              onChange={e => {
                setSelectedGrade(e.target.value);
                setSelectedSection('all');
              }}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              <option value="all">كافة الصفوف (7، 9، 10، 11، 12)</option>
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{formatGradeLabel(g)}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>الشعبة:</span>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              <option value="all">
                {selectedGrade === 'all' ? `كافة الشعب (${ALL_SECTIONS.length} شعبة)` : `شعب ${formatGradeLabel(selectedGrade)}`}
              </option>
              {getSectionsForGrade(selectedGrade).map(s => (
                <option key={s.section} value={s.section}>
                  شعبة {s.section}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>الحالة:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              <option value="all">كافة الحالات</option>
              <option value="مكتمل">مكتمل</option>
              <option value="قيد المتابعة">قيد المتابعة</option>
              <option value="معتمد">معتمد</option>
              <option value="ملغى">ملغى</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.45rem 0.8rem',
                background: viewMode === 'table' ? '#0F2044' : '#FFFFFF',
                color: viewMode === 'table' ? '#FFFFFF' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '0.45rem 0.8rem',
                background: viewMode === 'cards' ? '#0F2044' : '#FFFFFF',
                color: viewMode === 'cards' ? '#FFFFFF' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              بطاقات
            </button>
          </div>
        </div>

        {/* Active Filters count summary */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
          <div>
            عرض <strong>{filteredRecords.length}</strong> من إجمالي <strong>{records.length}</strong> سجل
          </div>
          {(selectedReason !== 'all' || selectedGrade !== 'all' || selectedSection !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedReason('all');
                setSelectedGrade('all');
                setSelectedSection('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              إلغاء جميع الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* ─── Content: Table View ─────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              textAlign: 'right',
            }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.75rem 0.6rem', width: '38px', textAlign: 'center' }}>م.</th>
                  <th style={{ padding: '0.75rem 0.8rem', minWidth: '160px' }}>اسم الطالب</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '90px' }}>الصف/الشعبة</th>
                  <th style={{ padding: '0.75rem 0.8rem', minWidth: '220px' }}>فعالية التعلم عن بعد</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '130px' }}>السبب</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '170px' }}>الفترة الزمنية</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '75px' }}>الأيام</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '95px' }}>الحالة</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '75px' }}>الالتزام</th>
                  <th style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: '150px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                      <p style={{ margin: 0, fontWeight: 700 }}>لا توجد سجلات مطابقة للبحث أو الفلاتر المحددة</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => {
                    const reasonCfg = REASON_CONFIG[rec.reason] || { label: rec.reason, color: '#334155', bgColor: '#F1F5F9' };
                    const statusCfg = STATUS_CONFIG[rec.status] || { label: rec.status, color: '#334155', bgColor: '#F1F5F9' };

                    return (
                      <tr
                        key={rec.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#FBFCFE',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '0.7rem 0.5rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem' }}>
                          <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.85rem' }}>
                            {rec.studentName}
                          </div>
                          {rec.platform && (
                            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
                              {rec.platform}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: '#0F2044',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}>
                            {rec.gradeSection}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.35 }}>
                            {rec.eventTitle}
                          </div>
                          {rec.reasonDetails && (
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                              {rec.reasonDetails}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: reasonCfg.bgColor,
                            color: reasonCfg.color,
                            border: `1px solid ${reasonCfg.borderColor || reasonCfg.color}40`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                          }}>
                            <span>{reasonCfg.icon}</span>
                            <span>{rec.reason}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontSize: '0.76rem', color: '#475569' }}>
                          <div style={{ direction: 'ltr', display: 'inline-block' }}>
                            <span>{rec.fromDate}</span>
                            <span style={{ margin: '0 4px', color: '#94A3B8' }}>←</span>
                            <span>{rec.toDate}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>
                          {rec.daysCount} {rec.daysCount === 1 ? 'يوم' : 'أيام'}
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: statusCfg.bgColor,
                            color: statusCfg.color,
                            border: `1px solid ${statusCfg.borderColor || statusCfg.color}40`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                          }}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 800, color: (rec.commitmentRate || 95) >= 90 ? '#059669' : '#D97706' }}>
                          {rec.commitmentRate || 95}%
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            {/* View */}
                            <button
                              onClick={() => setViewingRecord(rec)}
                              title="عرض التفاصيل"
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Eye size={14} />
                            </button>

                            {/* Print Certificate */}
                            <button
                              onClick={() => printStudentDistanceLearningCertificate(rec, { academicYear: selectedYear })}
                              title="طباعة إفادة الطالب الرسمية"
                              style={{
                                background: '#E0F2FE',
                                border: '1px solid #BAE6FD',
                                borderRadius: '6px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: '#0284C7',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Printer size={14} />
                            </button>

                            {/* Edit & Delete */}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(rec)}
                                  title="تعديل السجل"
                                  style={{
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: '6px',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    color: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Edit2 size={14} />
                                </button>

                                <button
                                  onClick={() => setDeletingRecord(rec)}
                                  title="حذف السجل"
                                  style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '6px',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    color: '#DC2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Content: Cards View ─────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {filteredRecords.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', color: '#94A3B8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 700 }}>لا توجد سجلات مطابقة للبحث أو الفلاتر المحددة</p>
            </div>
          ) : (
            filteredRecords.map(rec => {
              const reasonCfg = REASON_CONFIG[rec.reason] || { label: rec.reason, color: '#334155', bgColor: '#F1F5F9' };
              const statusCfg = STATUS_CONFIG[rec.status] || { label: rec.status, color: '#334155', bgColor: '#F1F5F9' };

              return (
                <div
                  key={rec.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '1.2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Top Row: Student & Grade */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0F2044' }}>
                          {rec.studentName}
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          {rec.grade} — شعبة {rec.section}
                        </span>
                      </div>
                      <span style={{
                        background: '#0F2044',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {rec.gradeSection}
                      </span>
                    </div>

                    {/* Event Title */}
                    <div style={{
                      fontWeight: 800,
                      color: '#1E293B',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      marginBottom: '0.6rem',
                    }}>
                      {rec.eventTitle}
                    </div>

                    {/* Reason Badge */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: reasonCfg.bgColor,
                        color: reasonCfg.color,
                        border: `1px solid ${reasonCfg.borderColor || reasonCfg.color}40`,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                      }}>
                        <span>{reasonCfg.icon}</span>
                        <span>{rec.reason}</span>
                      </span>
                      {rec.reasonDetails && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748B', lineHeight: 1.35 }}>
                          {rec.reasonDetails}
                        </p>
                      )}
                    </div>

                    {/* Dates & Days */}
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#334155',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <span style={{ color: '#64748B' }}>الفترة: </span>
                        <strong>{rec.fromDate}</strong> إلى <strong>{rec.toDate}</strong>
                      </div>
                      <span style={{
                        background: '#0F2044',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                      }}>
                        {rec.daysCount} {rec.daysCount === 1 ? 'يوم' : 'أيام'}
                      </span>
                    </div>

                    {/* Status & Commitment */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        background: statusCfg.bgColor,
                        color: statusCfg.color,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                      }}>
                        {statusCfg.label}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 800 }}>
                        الالتزام: {rec.commitmentRate || 95}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                  }}>
                    <button
                      onClick={() => printStudentDistanceLearningCertificate(rec, { academicYear: selectedYear })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#E0F2FE',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD',
                        borderRadius: '6px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Printer size={13} />
                      <span>إفادة رسمية</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => setViewingRecord(rec)}
                        title="تفاصيل"
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          color: '#475569',
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            title="تعديل"
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              color: '#2563EB',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingRecord(rec)}
                            title="حذف"
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              color: '#DC2626',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Modal: Add / Edit Record ─────────────────────────────────────── */}
      {isAdmin && showAddEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,32,68,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: 'rtl',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{editingRecord ? '✏️' : '➕'}</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
                  {editingRecord ? 'تعديل سجل التعلم عن بعد' : 'إضافة سجل تعلم عن بعد جديد'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {/* Student Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    اسم الطالب <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: صالح علي المري"
                    value={formData.studentName}
                    onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* Grade */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    الصف الدراسي (تحليل الشعب والمواد) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={e => {
                      const newGrade = e.target.value;
                      const secs = getSectionsForGrade(newGrade);
                      const defaultSec = secs.length > 0 ? secs[0].sectionNum : '1';
                      setFormData({ ...formData, grade: newGrade, section: defaultSec });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>{formatGradeLabel(g)}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    الشعبة المعتمدة <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    {getSectionsForGrade(formData.grade).map(s => (
                      <option key={s.section} value={s.sectionNum}>
                        شعبة {s.section} (شعبة {s.sectionNum})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Title */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    فعالية التعلم عن بعد / عنوان السجل <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: المشاركة في أولمبياد العلوم الدولي للناشئين (IJSO)"
                    value={formData.eventTitle}
                    onChange={e => setFormData({ ...formData, eventTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    السبب <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value as DistanceLearningReason })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    <option value="عذر طبي">عذر طبي</option>
                    <option value="السفر لمسابقة">السفر لمسابقة</option>
                    <option value="السفر لمؤتمر">السفر لمؤتمر</option>
                    <option value="يوم التعلم عن بعد">يوم التعلم عن بعد</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    حالة المتابعة
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as DistanceLearningStatus })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                    }}
                  >
                    <option value="قيد المتابعة">قيد المتابعة</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="معتمد">معتمد</option>
                    <option value="ملغى">ملغى</option>
                  </select>
                </div>

                {/* Reason Details */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    تفاصيل إضافية عن السبب / اسم المسابقة أو التقرير الطبي
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: عذر معتمد من مؤسسة حمد الطبية، أو تمثيل دولة قطر في الأولمبياد"
                    value={formData.reasonDetails}
                    onChange={e => setFormData({ ...formData, reasonDetails: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* From Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    من تاريخ <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={e => handleDateChange(e.target.value, formData.toDate)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* To Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    إلى تاريخ <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={e => handleDateChange(formData.fromDate, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* Days Count & Commitment */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    عدد الأيام (محسوب تلقائياً)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.daysCount}
                    onChange={e => setFormData({ ...formData, daysCount: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: '#F8FAFC',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    نسبة الالتزام / إنجاز الواجبات %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commitmentRate}
                    onChange={e => setFormData({ ...formData, commitmentRate: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* Supervisor & Platform */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    المشرف / المنسق المتابع
                  </label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={e => setFormData({ ...formData, supervisor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    المنصة المستخدمة
                  </label>
                  <input
                    type="text"
                    value={formData.platform}
                    onChange={e => setFormData({ ...formData, platform: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>

                {/* Notes */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    ملاحظات وتوصيات اللجنة الأكاديمية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أدخل أي ملاحظات حول أداء الطالب أو التقييمات البديلة..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0F2044 0%, #0096C7 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(15,32,68,0.2)',
                  }}
                >
                  {editingRecord ? 'حفظ التعديلات' : 'إضافة السجل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: View Details ─────────────────────────────────────────── */}
      {viewingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,32,68,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: 'rtl',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>سجل رقم: {viewingRecord.id}</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0F2044' }}>
                  {viewingRecord.studentName}
                </h3>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>الصف والشعبة:</span>
                <strong style={{ color: '#0F2044' }}>{viewingRecord.grade} — شعبة {viewingRecord.section} [{viewingRecord.gradeSection}]</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>فعالية التعلم عن بعد:</span>
                <strong style={{ color: '#0F2044', maxWidth: '300px', textAlign: 'left' }}>{viewingRecord.eventTitle}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>السبب:</span>
                <span style={{
                  background: REASON_CONFIG[viewingRecord.reason]?.bgColor || '#F1F5F9',
                  color: REASON_CONFIG[viewingRecord.reason]?.color || '#334155',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 800,
                }}>
                  {viewingRecord.reason}
                </span>
              </div>

              {viewingRecord.reasonDetails && (
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                  <span style={{ color: '#64748B' }}>تفاصيل السبب:</span>
                  <span style={{ color: '#1E293B', fontWeight: 700 }}>{viewingRecord.reasonDetails}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>الفترة الزمنية:</span>
                <strong>{viewingRecord.fromDate} إلى {viewingRecord.toDate} ({viewingRecord.daysCount} أيام)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>المنصة:</span>
                <span>{viewingRecord.platform || 'نظام قطر للتعليم'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>المشرف المتابع:</span>
                <span>{viewingRecord.supervisor || 'قسم المشاريع'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>نسبة الالتزام والواجبات:</span>
                <strong style={{ color: '#059669' }}>{viewingRecord.commitmentRate || 95}%</strong>
              </div>

              {viewingRecord.notes && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 800, color: '#92400E', marginBottom: '2px' }}>ملاحظات:</div>
                  <div style={{ color: '#78350F' }}>{viewingRecord.notes}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button
                onClick={() => {
                  printStudentDistanceLearningCertificate(viewingRecord, { academicYear: selectedYear });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0F2044 0%, #0096C7 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Printer size={16} />
                <span>طباعة إفادة الطالب الرسمية</span>
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Delete Confirmation ───────────────────────────────────── */}
      {isAdmin && deletingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,32,68,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          direction: 'rtl',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚨</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 900, color: '#DC2626' }}>
              تأكيد حذف سجل التعلم عن بعد
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              هل أنت متأكد من رغبتك في حذف سجل الطالب <strong>«{deletingRecord.studentName}»</strong> لفعالية <strong>«{deletingRecord.eventTitle}»</strong>؟
              <br />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingRecord(null)}
                style={{
                  padding: '0.5rem 1.2rem',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '0.5rem 1.4rem',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
