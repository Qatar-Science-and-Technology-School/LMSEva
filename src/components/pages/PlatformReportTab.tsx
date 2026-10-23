import React, { useState, useMemo } from 'react';
import {
  SEPTEMBER_2026_LMS_METRICS,
  SEPTEMBER_2026_LMS_TEACHERS,
  GRADE_LEVEL_LMS_STATS,
  TOP_10_INDEX_TEACHERS,
  DEPARTMENT_PERFORMANCE_LIST,
  ADMINISTRATIVE_RATINGS_LIST,
  EXCLUDED_COORDINATORS_LIST,
  TOP_OVERALL_TEACHERS,
  TOP_DEPT_TEACHERS,
  TOP_LESSONS_TEACHERS,
  TOP_GRADED_TEACHERS,
  FOLLOWUP_PENDING_TEACHERS,
  FOLLOWUP_PARTIAL_TEACHERS,
  UNASSIGNED_EVAL_TEACHERS,
  ZERO_LESSON_TEACHERS,
  OCTOBER_2026_LMS_METRICS,
  OCTOBER_2026_LMS_TEACHERS,
  OCTOBER_GRADE_LEVEL_LMS_STATS,
  OCTOBER_TOP_10_INDEX_TEACHERS,
  OCTOBER_DEPARTMENT_PERFORMANCE_LIST,
  OCTOBER_ADMINISTRATIVE_RATINGS_LIST,
  OCTOBER_TOP_OVERALL_TEACHERS,
  OCTOBER_TOP_DEPT_TEACHERS,
  OCTOBER_TOP_LESSONS_TEACHERS,
  OCTOBER_TOP_GRADED_TEACHERS,
  OCTOBER_FOLLOWUP_PENDING_TEACHERS,
  OCTOBER_FOLLOWUP_PARTIAL_TEACHERS,
  OCTOBER_UNASSIGNED_EVAL_TEACHERS,
  OCTOBER_ZERO_LESSON_TEACHERS,
  LMS_MONTHLY_OVERVIEW_COMPARISON,
  LMS_GRADES_MONTHLY_COMPARISON,
  FULL_YEAR_2026_2027_LMS_MONTHLY_COMPARISONS,
  getDynamicEvaluationMonths,
  getRealCurrentAcademicMonthDef,
  printMonthlyLessonsReport,
  printMonthlyAssessmentsReport,
  printMonthlyTeacherEvaluationsReport,
  type LmsReportTeacherRecord,
  type Teacher,
  type Department,
} from '@/lib/data';
import { printTeacherCertificate } from '@/lib/certificatePrinter';
import { printComprehensiveLmsReport } from '@/lib/comprehensiveReportPrinter';

export interface EvaluationMonthOption {
  id: string;
  month: string;
  year: string;
  label: string;
  status: 'available' | 'upcoming';
  badgeText: string;
  recordCount: number;
}

export const EVALUATION_MONTHS: EvaluationMonthOption[] = getDynamicEvaluationMonths();

interface Props {
  teachers: Teacher[];
  departments: Department[];
  onSelectTeacherForEval: (teacherId: string) => void;
  onSyncEvals: () => Promise<void>;
  isSyncing: boolean;
  syncSuccessMsg: string;
  onExportExcel: () => void;
  onNavigateToTakreem?: () => void;
  onNavigateToPage?: (page: string) => void;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  canManageEvaluations?: boolean;
}

export default function PlatformReportTab({
  teachers,
  departments,
  onSelectTeacherForEval,
  onSyncEvals,
  isSyncing,
  syncSuccessMsg,
  onExportExcel,
  onNavigateToTakreem,
  onNavigateToPage,
  selectedMonth,
  onMonthChange,
  canManageEvaluations = false,
}: Props) {
  const currentDef = getRealCurrentAcademicMonthDef();
  const [selectedMonthId, setSelectedMonthId] = useState(
    selectedMonth ? (EVALUATION_MONTHS.find(m => m.month === selectedMonth)?.id || currentDef.id) : currentDef.id
  );
  const currentMonthObj = EVALUATION_MONTHS.find(m => m.id === selectedMonthId) || EVALUATION_MONTHS[0];

  const isOct = selectedMonthId === '2026-10';
  const activeMetrics = isOct ? OCTOBER_2026_LMS_METRICS : SEPTEMBER_2026_LMS_METRICS;
  const activeTeachers = isOct ? OCTOBER_2026_LMS_TEACHERS : SEPTEMBER_2026_LMS_TEACHERS;
  const activeGradeStats = isOct ? OCTOBER_GRADE_LEVEL_LMS_STATS : GRADE_LEVEL_LMS_STATS;
  const activeTop10 = isOct ? OCTOBER_TOP_10_INDEX_TEACHERS : TOP_10_INDEX_TEACHERS;
  const activeDeptPerf = isOct ? OCTOBER_DEPARTMENT_PERFORMANCE_LIST : DEPARTMENT_PERFORMANCE_LIST;
  const activeAdminRatings = isOct ? OCTOBER_ADMINISTRATIVE_RATINGS_LIST : ADMINISTRATIVE_RATINGS_LIST;
  const activeTopOverall = isOct ? OCTOBER_TOP_OVERALL_TEACHERS : TOP_OVERALL_TEACHERS;
  const activeTopDept = isOct ? OCTOBER_TOP_DEPT_TEACHERS : TOP_DEPT_TEACHERS;
  const activeTopLessons = isOct ? OCTOBER_TOP_LESSONS_TEACHERS : TOP_LESSONS_TEACHERS;
  const activeTopGraded = isOct ? OCTOBER_TOP_GRADED_TEACHERS : TOP_GRADED_TEACHERS;
  const activeFollowupPending = isOct ? OCTOBER_FOLLOWUP_PENDING_TEACHERS : FOLLOWUP_PENDING_TEACHERS;
  const activeFollowupPartial = isOct ? OCTOBER_FOLLOWUP_PARTIAL_TEACHERS : FOLLOWUP_PARTIAL_TEACHERS;
  const activeUnassignedEval = isOct ? OCTOBER_UNASSIGNED_EVAL_TEACHERS : UNASSIGNED_EVAL_TEACHERS;
  const activeZeroLesson = isOct ? OCTOBER_ZERO_LESSON_TEACHERS : ZERO_LESSON_TEACHERS;

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [subTab, setSubTab] = useState<'top_teachers' | 'comparison' | 'departments' | 'admin_ratings' | 'followup' | 'full_table' | 'grades'>('top_teachers');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<LmsReportTeacherRecord | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  // Find system teacher ID by name
  const findSystemTeacherId = (name: string): string | null => {
    const t = teachers.find(
      x => x.nameAr === name || x.nameAr.includes(name) || name.includes(x.nameAr)
    );
    return t ? t.id : null;
  };

  const filteredTeachers = useMemo(() => {
    return activeTeachers.filter(t => {
      if (deptFilter && t.department !== deptFilter) return false;
      if (categoryFilter) {
        if (categoryFilter === 'top_overall' && t.category !== 'top_overall') return false;
        if (categoryFilter === 'top_aspect' && t.category !== 'top_aspect') return false;
        if (categoryFilter === 'admin_excellent' && t.adminRating !== 'ممتاز') return false;
        if (categoryFilter === 'admin_very_good' && t.adminRating !== 'جيد جداً') return false;
        if (categoryFilter === 'followup_pending' && t.submissionsPending === 0) return false;
        if (categoryFilter === 'followup_partial' && (t.evalCoveragePercent === 0 || t.evalCoveragePercent === 100)) return false;
        if (categoryFilter === 'followup_no_eval' && t.evalCoveragePercent > 0) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.subjectsAndSections.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTeachers, search, deptFilter, categoryFilter]);

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.25rem',
  };

  const uniqueDepts = useMemo(() => {
    const set = new Set(activeTeachers.map(t => t.department));
    return Array.from(set);
  }, [activeTeachers]);

  // Handle Certificate Print
  const handlePrintCertificate = (teacher: LmsReportTeacherRecord | { name: string; department: string; generalIndex?: number; notes?: string }) => {
    printTeacherCertificate({
      teacherNameAr: teacher.name,
      departmentName: teacher.department,
      academicYear: currentMonthObj.year,
      month: currentMonthObj.month,
      badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
      recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
    });
  };

  // Comprehensive Report Print
  const printComprehensiveReport = () => {
    printComprehensiveLmsReport({
      monthName: currentMonthObj.label,
      academicYear: currentMonthObj.year,
    });
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* ── 1. Top Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#fff',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 16px rgba(15,32,68,0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.6rem' }}>📊</span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#fff' }}>
              التقرير التقييمي للمعلمين - مراجعة النشاط على المنصة
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.85rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem' }}>📅</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>شهر التقييم:</span>
              <select
                value={selectedMonthId}
                onChange={(e) => {
                  setSelectedMonthId(e.target.value);
                  const m = EVALUATION_MONTHS.find(x => x.id === e.target.value);
                  if (m && onMonthChange) onMonthChange(m.month);
                }}
                style={{
                  background: '#fff',
                  color: '#0F2044',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {EVALUATION_MONTHS.map(m => (
                  <option key={m.id} value={m.id} style={{ color: '#0F2044', fontWeight: 700 }}>
                    {m.label} {m.status === 'available' ? '✅ معتمد' : '⏳ قادم'}
                  </option>
                ))}
              </select>
              <span
                style={{
                  background: currentMonthObj.status === 'available' ? '#10B981' : '#F59E0B',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {currentMonthObj.badgeText}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
            تاريخ الإصدار: {activeMetrics.reportDate} · مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين · مؤشرات رسمية مستندة إلى
            ملفي متابعة التقييمات والدروس الإلكترونية المعتمدين
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              👥 {isOct ? '47 معلماً بالدروس · 27 معلماً بالتقييمات' : '42 معلماً بالدروس · 26 معلماً بالتقييمات'}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              🏫 {activeMetrics.totalSections} شعبة · {activeMetrics.lessonRecords} سجل دروس · {activeMetrics.subjectSectionRecords} سجل تقييمات
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              💻 {activeMetrics.totalLessons.toLocaleString()} درساً ({activeMetrics.lessonsVisible.toLocaleString()} ظاهرة {activeMetrics.lessonsVisiblePercent}% + {activeMetrics.lessonsHidden.toLocaleString()} مخفية · {activeMetrics.lessonsValidPercent}% بأقسام)
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              📝 {activeMetrics.totalSubmissions.toLocaleString()} تسليماً ({activeMetrics.gradedSubmissions.toLocaleString()} مصححة {activeMetrics.gradingRate}% · {activeMetrics.pendingSubmissions.toLocaleString()} معلقاً)
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              🎯 {activeMetrics.assignedEvaluations} تقييماً مسنداً (متوسط {(activeMetrics.assignedEvaluations / activeMetrics.totalSections).toFixed(1)} لكل شعبة-مادة)
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => printMonthlyLessonsReport({ monthName: currentMonthObj.label, academicYear: currentMonthObj.year })}
            style={{
              background: '#0F2044',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 0.9rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(15,32,68,0.25)',
            }}
            title="طباعة التقرير الشهري الرسمي لدروس نظام قطر للتعليم (PDF - A3)"
          >
            <span>💻</span> تقرير الدروس للشهر
          </button>

          <button
            onClick={() => printMonthlyAssessmentsReport({ monthName: currentMonthObj.label, academicYear: currentMonthObj.year })}
            style={{
              background: '#047857',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 0.9rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(4,120,87,0.25)',
            }}
            title="طباعة التقرير الشهري الرسمي للتقييمات والتسليمات المجمعة (PDF - A3)"
          >
            <span>📊</span> تقرير التقييمات للشهر
          </button>

          <button
            onClick={() => printMonthlyTeacherEvaluationsReport({ monthName: currentMonthObj.label, academicYear: currentMonthObj.year, teachers, departments })}
            style={{
              background: '#7C3AED',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 0.9rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
            }}
            title="طباعة التقرير الشهري المعتمد لتقييمات أداء المعلمين (PDF - A3)"
          >
            <span>👨‍🏫</span> تقرير تقييمات المعلمين
          </button>

          <button
            onClick={printComprehensiveReport}
            style={{
              background: '#0284C7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
            }}
          >
            <span>🖨️</span> طباعة / تصدير التقرير الشامل (PDF - A3 Landscape)
          </button>

          {onNavigateToTakreem && (
            <button
              onClick={onNavigateToTakreem}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
              }}
            >
              <span>🏆</span> لوحة تكريم المعلمين والشهادات
            </button>
          )}

          {onNavigateToPage && (
            <button
              onClick={() => onNavigateToPage('reports')}
              style={{
                background: 'linear-gradient(135deg, #0F2044 0%, #1e3a6b 100%)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(15,32,68,0.3)',
              }}
              title="الانتقال المباشر إلى مركز التقارير الرسمية"
            >
              <span>📋</span> مركز التقارير الرسمية
            </button>
          )}

          {onNavigateToPage && (
            <button
              onClick={() => onNavigateToPage('class_analysis')}
              style={{
                background: '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(71,85,105,0.3)',
              }}
              title="الانتقال إلى صفحة تحليل المواد والشعب الدراسية"
            >
              <span>🏫</span> تحليل المواد والشعب
            </button>
          )}

          {canManageEvaluations && (
            <button
              onClick={onSyncEvals}
              disabled={isSyncing}
              style={{
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: isSyncing ? 0.7 : 1,
              }}
            >
              <span>{isSyncing ? '⏳' : '⚡'}</span>
              {isSyncing ? 'جارٍ المزامنة...' : 'مزامنة مع التقييمات'}
            </button>
          )}

          <button
            onClick={onExportExcel}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📥</span> تصدير Excel
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✅</span> {syncSuccessMsg}
        </div>
      )}

      {/* ── Conditional Month View: Available vs Upcoming ── */}
      {currentMonthObj.status === 'upcoming' ? (
        <div style={{ ...cardStyle, padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.25rem', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
            📑
          </div>
          <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.82rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.75rem' }}>
            قيد الانتظار — {currentMonthObj.badgeText}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
            تقرير تقييم نظام قطر للتعليم — شهر {currentMonthObj.label}
          </h2>
          <p style={{ color: '#64748B', maxWidth: '680px', margin: '0 auto 1.75rem', fontSize: '0.92rem', lineHeight: '1.65' }}>
            سيتم تفعيل تقييمات شهر {currentMonthObj.month} وحساب مؤشرات المعلمين الـ 52 فور إرفاق التقرير الشهري الصادر عن نظام قطر للتعليم.
            بمجرد إرفاق الملف، سيقوم النظام تلقائياً باستخراج نشاط وتفاعل كافة المعلمين، احتساب مؤشرات الدروس والتسليمات والتغطية، تحديث لوحة الشرف وفرسان الأقسام، وتوليد شهادات الشكر والتقدير لشهر {currentMonthObj.month}.
          </p>

          {/* Upload Box (Admin Only) */}
          {canManageEvaluations && (
            <div
              style={{
                maxWidth: '560px',
                margin: '0 auto 1.5rem',
                border: '2px dashed #94A3B8',
                borderRadius: '14px',
                padding: '2rem 1.5rem',
                background: '#F8FAFC',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedFileName(e.target.files[0].name);
                    setUploadSuccess(true);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>📤</div>
              <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '1rem', marginBottom: '0.35rem' }}>
                {uploadedFileName ? `تم اختيار الملف: ${uploadedFileName}` : `انقر هنا أو اسحب وأفلت تقرير شهر ${currentMonthObj.month} (PDF أو Excel)`}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                يدعم ملفات التقارير الرسمية لنظام قطر للتعليم (ملفات PDF والتقارير المجدولة)
              </div>
            </div>
          )}

          {canManageEvaluations && uploadSuccess && (
            <div style={{ maxWidth: '560px', margin: '0 auto 1.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem' }}>
              ✅ تم استقبال ملف التقرير بنجاح: {uploadedFileName}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '0.3rem', color: '#047857' }}>
                سيتم مطابقة المؤشرات وتوليد التقييمات لشهر {currentMonthObj.month} فور معالجة الملف.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {canManageEvaluations && (
              <button
                onClick={() => onSelectTeacherForEval(teachers[0]?.id || 't1')}
                style={{
                  background: '#0F2044',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>📝</span> إدخال تقييمات شهر {currentMonthObj.month} يدوياً عبر النموذج
              </button>
            )}

            {onNavigateToTakreem && (
              <button
                onClick={onNavigateToTakreem}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>🏆</span> الانتقال لصفحة تكريم المعلمين
              </button>
            )}

            <button
              onClick={() => setSelectedMonthId('2026-09')}
              style={{
                background: '#F1F5F9',
                color: '#0F2044',
                border: '1px solid #CBD5E1',
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>🔄</span> العودة لتقرير شهر سبتمبر ٢٠٢٦ (المعتمد)
            </button>
          </div>

          {/* Teacher readiness roster */}
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'right', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.4rem' }}>
              👥 كادر المعلمين المعتمد لتقييم شهر {currentMonthObj.month} ({activeTeachers.length} معلماً):
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
              تمت تهيئة سجلات المعلمين والأقسام الأكاديمية لاستقبال بيانات نشاط نظام قطر للتعليم فور اعتماد التقرير.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', padding: '0.6rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {activeTeachers.slice(0, 24).map((t, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', background: '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#0F2044' }}>{t.name}</span>
                  <span style={{ color: '#64748B' }}>{t.department}</span>
                </div>
              ))}
              <div style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: '#0284C7', fontWeight: 700, textAlign: 'center' }}>
                + 28 معلماً آخرين...
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. KPI Summary Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>نطاق المعلمين المشمولين</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0.2rem 0' }}>
            {activeMetrics.teachersCount} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>/ 63 كادراً</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3B82F6' }}>
            {isOct ? '47 معلماً بالدروس (8 حققوا 100%) · 27 بالتقييمات (11 أتموا 100% تصحيح)' : '42 معلماً بالدروس (15 حققوا 100%) · 26 بالتقييمات (5 متميزون)'}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>التقييمات الإلكترونية المسندة</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', margin: '0.2rem 0' }}>
            {activeMetrics.assignedEvaluations} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>تقييماً مسنداً</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10B981' }}>
            بمعدل {(activeMetrics.assignedEvaluations / activeMetrics.totalSections).toFixed(1)} لكل شعبة · {isOct ? '28 سجلاً حقق المستهدف الأسبوعي' : '8 معلمين حققوا المعدل الأسبوعي (4 فأكثر)'}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>متوسط نسبة حل الطلبة</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#5B21B6', margin: '0.2rem 0' }}>
            {activeMetrics.weightedSolveRate}% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>/ المستهدف 80%</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8B5CF6' }}>
            {isOct ? '28 شعبة-مادة حققت المستهدف (≥80%) · الصف 9 الأعلى حلًا' : '39 شعبة-مادة حققت المستهدف (46.4%) · الصف 10 الأعلى (73.2%)'}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>إتمام تصحيح التسليمات</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0.2rem 0' }}>
            {activeMetrics.gradingRate}% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>({activeMetrics.gradedSubmissions.toLocaleString()} / {activeMetrics.totalSubmissions.toLocaleString()})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#00B4D8' }}>
            {isOct ? '11 معلماً أتموا 100% · 445 تسليماً معلقاً' : '13 معلماً أتموا 100% · 519 تسليماً غير مصحح في 40 شعبة-مادة'}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>الدروس الإلكترونية الظاهرة</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#92400E', margin: '0.2rem 0' }}>
            {activeMetrics.lessonsVisiblePercent}% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>({activeMetrics.lessonsVisible.toLocaleString()} / {activeMetrics.totalLessons.toLocaleString()})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309' }}>
            {activeMetrics.lessonsVisible.toLocaleString()} درساً ظاهراً · {activeMetrics.lessonsHidden.toLocaleString()} درساً مخفياً · {isOct ? '449 درساً ظاهراً جديداً في أكتوبر' : '75 سجلاً حقق المستهدف الأسبوعي'}
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #EC4899' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>اكتمال بنية الدروس (أقسام)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#831843', margin: '0.2rem 0' }}>
            {activeMetrics.lessonsValidPercent}% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>({activeMetrics.lessonsValid.toLocaleString()} / {activeMetrics.totalLessons.toLocaleString()})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#DB2777' }}>
            {activeMetrics.lessonsValid.toLocaleString()} درساً تحتوي أقساماً · {activeMetrics.totalLessons - activeMetrics.lessonsValid} درساً دون أقسام
          </div>
        </div>
      </div>

      {/* ── 3. Navigation Sub-Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          background: '#F1F5F9',
          padding: '0.35rem',
          borderRadius: '10px',
        }}
      >
        <button
          onClick={() => setSubTab('top_teachers')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'top_teachers' ? '#0F2044' : 'transparent',
            color: subTab === 'top_teachers' ? '#fff' : '#475569',
            boxShadow: subTab === 'top_teachers' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🏆</span> لوحة التميز وأفضل 10 معلمين
        </button>

        <button
          onClick={() => setSubTab('comparison')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'comparison' ? '#0F2044' : 'transparent',
            color: subTab === 'comparison' ? '#fff' : '#475569',
            boxShadow: subTab === 'comparison' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🔄</span> مقارنة الأشهر والنمو التراكمي
        </button>

        <button
          onClick={() => setSubTab('departments')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'departments' ? '#0F2044' : 'transparent',
            color: subTab === 'departments' ? '#fff' : '#475569',
            boxShadow: subTab === 'departments' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🏛️</span> ترتيب الأقسام ونسب الرفع
        </button>

        <button
          onClick={() => setSubTab('admin_ratings')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'admin_ratings' ? '#0F2044' : 'transparent',
            color: subTab === 'admin_ratings' ? '#fff' : '#475569',
            boxShadow: subTab === 'admin_ratings' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🎖️</span> التقديرات الإدارية المعتمدة (28)
        </button>

        <button
          onClick={() => setSubTab('followup')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'followup' ? '#0F2044' : 'transparent',
            color: subTab === 'followup' ? '#fff' : '#475569',
            boxShadow: subTab === 'followup' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>⚠️</span> المعلمون الذين يحتاجون إلى متابعة
        </button>

        <button
          onClick={() => setSubTab('full_table')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'full_table' ? '#0F2044' : 'transparent',
            color: subTab === 'full_table' ? '#fff' : '#475569',
            boxShadow: subTab === 'full_table' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>📋</span> الكشف التفصيلي الشامل (52 معلماً)
        </button>

        <button
          onClick={() => setSubTab('grades')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            background: subTab === 'grades' ? '#0F2044' : 'transparent',
            color: subTab === 'grades' ? '#fff' : '#475569',
            boxShadow: subTab === 'grades' ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🏫</span> إحصاءات الصفوف الدراسية
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 1: 🏆 لوحة التميز وأفضل 10 معلمين
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'top_teachers' && (
        <div>
          {/* Top 10 Table */}
          <div style={{ ...cardStyle, borderRight: '4px solid #F59E0B', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🥇</span> أعلى عشرة معلمين في مؤشر متابعة المنصة (سبتمبر 2026)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  ترتيب تحليلي مقترح مبني على مؤشرات المنصة الرسمية من أصل 43 معلماً ببيانات نشاط. الدرجة من 100.
                </p>
              </div>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                مؤشر مركب من الدروس والتقييمات
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>المركز</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>القسم الأكاديمي</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>المؤشر العام (100)</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>مؤشر التقييمات</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>مؤشر الدروس</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>سجالته</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>التقدير الإداري</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTop10.map(t => {
                    const fullRecord = activeTeachers.find(r => r.name === t.name);
                    const rankMedal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : `${t.rank}`;
                    return (
                      <tr key={t.rank} style={{ borderBottom: '1px solid #F1F5F9', background: t.rank <= 3 ? 'rgba(254, 243, 199, 0.2)' : 'transparent' }}>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 900, fontSize: '1rem' }}>
                          {rankMedal}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044' }}>
                          {t.name}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748B', fontWeight: 600 }}>
                          {t.department}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 900, fontSize: '0.9rem' }}>
                            {t.generalIndex.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#1E3A8A' }}>
                          {t.evalIndex.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                          {t.lessonsIndex.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>
                          {t.sectionsCount}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <span style={{
                            background: t.adminRating === 'ممتاز' ? '#DCFCE7' : t.adminRating === 'جيد جداً' ? '#EFF6FF' : '#F1F5F9',
                            color: t.adminRating === 'ممتاز' ? '#166534' : t.adminRating === 'جيد جداً' ? '#1E40AF' : '#64748B',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}>
                            {t.adminRating}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handlePrintCertificate(t)}
                              style={{
                                background: '#3D52A0',
                                color: '#fff',
                                border: 'none',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="طباعة شهادة شكر وتقدير رسمية"
                            >
                              <span>🎖️</span> شهادة
                            </button>
                            {fullRecord && (
                              <button
                                onClick={() => setSelectedTeacherModal(fullRecord)}
                                style={{
                                  background: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                البطاقة
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
          </div>

          {/* Department Honorees Cards */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎖️</span> متصدرو الأقسام الأكاديمية وشهادات التكريم
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
              {activeDeptPerf.filter(d => d.topTeacher && !d.topTeacher.includes('—')).map((dept, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B' }}>{dept.department}</span>
                      {dept.index && (
                        <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          مؤشر القسم: {dept.index.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.35rem' }}>
                      {dept.topTeacher}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                      تغطية التقييمات: {dept.evalCoverage} ({dept.evalRatio}) · تغطية الدروس: {dept.lessonsCoverage} ({dept.lessonsRatio})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <button
                      onClick={() => {
                        const firstTeacherName = dept.topTeacher.split('/')[0].trim();
                        handlePrintCertificate({
                          name: firstTeacherName,
                          department: dept.department,
                          generalIndex: dept.index || undefined,
                          notes: `تكريم وتقدير لتصدر المعلم لقسم ${dept.department} في مؤشرات متابعة نظام قطر للتعليم لشهر سبتمبر 2026.`,
                        });
                      }}
                      style={{
                        flex: 1,
                        background: '#3D52A0',
                        color: '#fff',
                        border: 'none',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>🎖️</span> طباعة شهادة تكريم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Tables: Best in Lessons & Best in Corrected Assessments */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {/* Best in Lessons */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💻</span> أفضل المعلمين في الدروس (رفعاً واستيفاءً)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>المعلم</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>القسم</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>الدروس</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>المحسوبة</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>النسبة</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>شهادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTopLessons.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 700, color: '#0F2044' }}>{t.name}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#64748B' }}>{t.department}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>{t.lessonsUploaded}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#1E3A8A' }}>{t.lessonsValid}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ background: t.lessonsValidPercent === 100 ? '#DCFCE7' : '#EFF6FF', color: t.lessonsValidPercent === 100 ? '#166534' : '#1E40AF', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            {t.lessonsValidPercent}%
                          </span>
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handlePrintCertificate(t)}
                            style={{ background: '#3D52A0', color: '#fff', border: 'none', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }}
                          >
                            طباعة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best in Corrected Assessments */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✅</span> أفضل المعلمين في التقييمات المصححة
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>المعلم</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>القسم</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>المصححة</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>نسبة التصحيح</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>شهادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTopGraded.map((t, idx) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 700, color: '#0F2044' }}>{t.name}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: '#64748B' }}>{t.department}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                          {t.submissionsGraded} / {t.submissionsReceived}
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ background: t.gradingRate === 100 ? '#DCFCE7' : '#FEF3C7', color: t.gradingRate === 100 ? '#166534' : '#92400E', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            {t.gradingRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handlePrintCertificate(t)}
                            style={{ background: '#3D52A0', color: '#fff', border: 'none', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }}
                          >
                            طباعة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB: 🔄 مقارنة الأشهر والنمو التراكمي للعام الأكاديمي 2026-2027م
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'comparison' && (() => {
        const net = LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet;
        const octCum = LMS_MONTHLY_OVERVIEW_COMPARISON.octoberCumulative;
        const sep = LMS_MONTHLY_OVERVIEW_COMPARISON.september;

        return (
          <div>
            {/* Header Concept Card */}
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0F2044 0%, #1A365D 100%)', color: '#fff', border: 'none', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
                <div>
                  <span style={{ background: '#00B4D8', color: '#0F2044', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'inline-block', marginBottom: '0.4rem' }}>
                    تحليل الأثر والنمو الشهري
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                    🔄 مقارنة المؤشرات التراكمية وصافي الإنجاز الشهري للعام الأكاديمي 2026-2027م
                  </h3>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#BAE6FD' }}>
                    المعادلة المعتمدة: (التقرير التراكمي للشهر الحالي - التقرير التراكمي للشهر السابق = صافي الإنجاز والنمو الشهري الفعلي)
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <span style={{ color: '#94A3B8' }}>حالة الاعتماد: </span>
                  <strong style={{ color: '#34D399' }}>كلا تقريري سبتمبر وأكتوبر معتمدان رسمياً</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#E2E8F0', margin: 0, lineHeight: 1.6, background: 'rgba(255,255,255,0.06)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                💡 نظراً لكون تقارير نظام قطر للتعليم الرسمية تقارير تجميعية تراكمية، يوضح هذا التحليل الشامل الأداء التراكمي وصافي الإنجاز المحقق فعلياً لكل شهر من شهور العام الأكاديمي 2026-2027م بمجرد اعتماده، مع خصم الأرقام التراكمية السابقة لاستخراج صافي الإضافة الحقيقية في الدروس والتقييمات والتسليمات المنجزة.
              </p>
            </div>

            {/* Growth KPI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #0284C7' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>صافي الدروس المرفوعة (أكتوبر)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284C7', margin: '0.2rem 0' }}>+{net.netTotalLessons.toLocaleString('ar-QA')}</div>
                <span style={{ fontSize: '0.7rem', color: '#0369A1' }}>نمو استثنائي بمعدل +{net.netTotalLessonsGrowthPercent}%</span>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #10B981' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>الدروس الظاهرة الجديدة</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', margin: '0.2rem 0' }}>+{net.netVisibleLessons.toLocaleString('ar-QA')}</div>
                <span style={{ fontSize: '0.7rem', color: '#047857' }}>+{net.netVisibleLessonsGrowthPercent}% زيادة في المحتوى المتاح للطلبة</span>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #8B5CF6' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>التقييمات المنشأة الجديدة</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7C3AED', margin: '0.2rem 0' }}>+{net.netAssessmentsCreated} تقييماً</div>
                <span style={{ fontSize: '0.7rem', color: '#6D28D9' }}>إجمالي 287 تقييماً تراكمياً</span>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #F59E0B' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>تحسن نسبة التصحيح</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D97706', margin: '0.2rem 0' }}>+{net.gradingRateChange}%</div>
                <span style={{ fontSize: '0.7rem', color: '#B45309' }}>ارتفعت لـ 81.6% بأكتوبر مقابل 78.7%</span>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #EC4899' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>المعلق المنجز (انخفاض)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#DB2777', margin: '0.2rem 0' }}>{net.pendingChange} تسليماً</div>
                <span style={{ fontSize: '0.7rem', color: '#BE185D' }}>انخفض من 519 إلى 445 معلقاً</span>
              </div>

              <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #3B82F6' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>معلمون أتموا 100% تصحيح</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1D4ED8', margin: '0.2rem 0' }}>11 معلماً</div>
                <span style={{ fontSize: '0.7rem', color: '#1E40AF' }}>زيادة +6 معلمين عن سبتمبر (5 معلمين)</span>
              </div>
            </div>

            {/* Master Comparison Table for All Months of 2026-2027 */}
            <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                    📊 جدول المقارنة الشاملة لجميع أشهر العام الأكاديمي 2026-2027م (التراكمي وصافي الإنجاز):
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                    تتبع تراكمي وصافي النمو الشهري لتقارير نظام قطر للتعليم الرسمية لكافة شهور العام (سبتمبر 2026 - يونيو 2027م)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    ✓ شهران معتمدان رسمياً
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                    10 أشهر أكاديمية
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff' }}>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', width: '35px' }}>#</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>الشهر الأكاديمي</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>حالة الاعتماد</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>إجمالي الدروس (التراكمي)</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', background: '#0284C7', color: '#fff', whiteSpace: 'nowrap' }}>صافي الدروس الشهرية</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>الدروس الظاهرة (النسبة)</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>صافي الظاهرة</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>التقييمات المنشأة</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', background: '#7C3AED', color: '#fff', whiteSpace: 'nowrap' }}>صافي التقييمات</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>نسبة التصحيح</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>فارق التصحيح</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>المعلقات</th>
                      <th style={{ padding: '0.65rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>معلمون 100%</th>
                      <th style={{ padding: '0.65rem 0.75rem', minWidth: '180px' }}>الأثر والتقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FULL_YEAR_2026_2027_LMS_MONTHLY_COMPARISONS.map((m, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <tr
                          key={m.monthId}
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            background: m.isCurrentActive ? 'rgba(0,180,216,0.06)' : isEven ? '#fff' : '#F8FAFC',
                          }}
                        >
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044', whiteSpace: 'nowrap' }}>
                            {m.label}
                            {m.isCurrentActive && (
                              <span style={{ fontSize: '0.65rem', color: '#0284C7', display: 'block', fontWeight: 700 }}>
                                (الشهر المعتمد الحالي)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                background: m.statusBadge.bg,
                                color: m.statusBadge.color,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                              }}
                            >
                              {m.statusBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>
                            {m.isCertified ? m.cumulative.totalLessons.toLocaleString('ar-QA') : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 900, color: '#0284C7', background: m.isCertified ? 'rgba(2,132,199,0.08)' : 'transparent' }}>
                            {m.isCertified ? `+${m.net.netTotalLessons.toLocaleString('ar-QA')} (${m.net.netTotalLessonsGrowthPercent > 0 ? `+${m.net.netTotalLessonsGrowthPercent}%` : '-'})` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', color: '#334155' }}>
                            {m.isCertified ? `${m.cumulative.visibleLessons.toLocaleString('ar-QA')} (${m.cumulative.visiblePercent}%)` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#059669' }}>
                            {m.isCertified ? `+${m.net.netVisibleLessons.toLocaleString('ar-QA')}` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>
                            {m.isCertified ? m.cumulative.assessmentsCreated : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 900, color: '#7C3AED', background: m.isCertified ? 'rgba(124,58,237,0.08)' : 'transparent' }}>
                            {m.isCertified ? `+${m.net.netAssessments}` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                            {m.isCertified ? `${m.cumulative.gradingRate}%` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: m.net.gradingRateChange >= 0 ? '#059669' : '#DC2626' }}>
                            {m.isCertified ? (m.net.gradingRateChange > 0 ? `+${m.net.gradingRateChange}%` : m.net.gradingRateChange === 0 ? 'مستقر' : `${m.net.gradingRateChange}%`) : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#D97706' }}>
                            {m.isCertified ? `${m.cumulative.submissionsPending} معلقاً` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#1D4ED8' }}>
                            {m.isCertified ? `${m.cumulative.teachers100Grading} معلماً` : '-'}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
                            {m.impactSummary}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side-by-Side Detailed Breakdown */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  🔍 التحليل المقارن التفصيلي للمؤشرات بين شهري سبتمبر وأكتوبر 2026م (التراكمي وصافي الإنجاز):
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  معادلة الصافي: (تراكمي أكتوبر - تراكمي سبتمبر = صافي إنجاز أكتوبر)
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff' }}>
                      <th style={{ padding: '0.65rem 0.8rem', borderRadius: '0 8px 0 0' }}>المؤشر التحليلي</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>تقرير سبتمبر (27 سبتمبر 2026)</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>تقرير أكتوبر التراكمي (23 أكتوبر 2026)</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center', background: '#0284C7' }}>صافي إنجاز أكتوبر (أكتوبر - سبتمبر)</th>
                      <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center', borderRadius: '8px 0 0 0' }}>الأثر والتقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>إجمالي الدروس على المنصة</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748B' }}>{sep.totalLessons.toLocaleString()}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>{octCum.totalLessons.toLocaleString()}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#0284C7', background: 'rgba(2,132,199,0.06)' }}>+{net.netTotalLessons.toLocaleString('ar-QA')}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#DCFCE7', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>نمو فائق (+107.3%)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>الدروس الظاهرة للطلبة</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748B' }}>{sep.visibleLessons.toLocaleString()} ({sep.visiblePercent}%)</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>{octCum.visibleLessons.toLocaleString()} ({octCum.visiblePercent}%)</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#059669', background: 'rgba(16,185,129,0.06)' }}>+{net.netVisibleLessons.toLocaleString('ar-QA')}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>449 درساً جديداً (+56.4%)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>التقييمات المنشأة</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748B' }}>{sep.assessmentsCreated}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>{octCum.assessmentsCreated}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#7C3AED', background: 'rgba(139,92,246,0.06)' }}>+{net.netAssessmentsCreated}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>إسناد 38 تقييماً جديداً</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>نسبة تصحيح المعلمين</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748B' }}>{sep.gradingRate}% ({sep.submissionsGraded.toLocaleString()})</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>{octCum.gradingRate}% ({octCum.submissionsGraded.toLocaleString()})</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#059669', background: 'rgba(16,185,129,0.06)' }}>+{net.gradingRateChange}%</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#DCFCE7', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>تحسن ملموس 📈</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>التسليمات المعلقة غير المصححة</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#DC2626' }}>{sep.submissionsPending} معلقاً</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#D97706' }}>{octCum.submissionsPending} معلقاً</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#166534', background: 'rgba(22,101,52,0.06)' }}>{net.pendingChange} معلقاً</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#DCFCE7', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>إنجاز 74 معلقاً 👍</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>المعلمون المنجزون 100% تصحيح</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748B' }}>5 معلمين</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0F2044' }}>11 معلماً</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#DB2777', background: 'rgba(219,39,119,0.06)' }}>+{net.teachers100GradingChange} معلمين</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}><span style={{ background: '#FCE7F3', color: '#9D174D', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>مضاعفة النسبة ⭐</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 2: 🏛️ ترتيب الأقسام ونسب الرفع
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'departments' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              🏛️ ترتيب الأقسام الأكاديمية ونسب الرفع ومؤشر المنصة
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              النسب تعني تغطية الرفع (عدد السجلات المغطاة بالتقييم أو الدرس مقسوماً على إجمالي السجلات المتاحة للقسم).
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>القسم الأكاديمي</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>مؤشر القسم (100)</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>تغطية التقييمات</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>تغطية الدروس</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>سجلات القسم</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>الكادر (بيانات / نطاق)</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>عدد الدروس (الحصة)</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>عدد التقييمات (الحصة)</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>المتصدر الأكاديمي</th>
                </tr>
              </thead>
              <tbody>
                {activeDeptPerf.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: '#0F2044' }}>{d.department}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                      {d.index ? (
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                          {d.index.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>غير متاح</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#5B21B6' }}>
                      {d.evalCoverage} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({d.evalRatio})</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                      {d.lessonsCoverage} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({d.lessonsRatio})</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700 }}>
                      {d.recordsCount}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#475569' }}>
                      {d.teachersRatio}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#047857', fontWeight: 700 }}>
                      {d.lessonsCount} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({d.lessonsShare})</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#1E3A8A', fontWeight: 700 }}>
                      {d.evalsCount} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({d.evalsShare})</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#0F2044', fontWeight: 700 }}>
                      {d.topTeacher}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 3: 🎖️ التقديرات الإدارية المعتمدة (28 معلماً)
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'admin_ratings' && (
        <div>
          <div style={{ ...cardStyle, borderRight: '4px solid #10B981', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  🎖️ قائمة التقديرات الإدارية المعتمدة (28 معلماً)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  معتمدة بتوجيه إدارة المدرسة: 7 ممتاز للمهندسين والمختبرات التخصصية · 21 جيد جداً (معلمو التصميم التكنولوجي، الصف 12، والمعلمون دون بيانات نشاط).
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                  7 ممتاز
                </span>
                <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                  21 جيد جداً
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>القسم</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>تقدير الدروس</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>تقدير التقييمات</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>أساس التقدير والاعتماد الإداري</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>بيانات النشاط</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>الشهادة</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAdminRatings.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: t.rating === 'ممتاز' ? 'rgba(220, 252, 231, 0.2)' : 'transparent' }}>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem 0.65rem', fontWeight: 800, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.5rem 0.65rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>
                        <span style={{
                          background: t.rating === 'ممتاز' ? '#DCFCE7' : '#EFF6FF',
                          color: t.rating === 'ممتاز' ? '#166534' : '#1E40AF',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}>
                          {t.rating}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>
                        <span style={{
                          background: t.rating === 'ممتاز' ? '#DCFCE7' : '#EFF6FF',
                          color: t.rating === 'ممتاز' ? '#166534' : '#1E40AF',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}>
                          {t.rating}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.65rem', color: '#334155', fontSize: '0.76rem' }}>{t.basis}</td>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: t.hasActivity ? '#047857' : '#B45309',
                          fontWeight: 700,
                        }}>
                          {t.hasActivity ? 'متوفرة بالملفات' : 'بدون ملفات نشاط'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handlePrintCertificate({
                            name: t.name,
                            department: t.department,
                            notes: `تقدير إداري معتمد (${t.rating}) - ${t.basis}`,
                          })}
                          style={{
                            background: '#3D52A0',
                            color: '#fff',
                            border: 'none',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 800,
                          }}
                        >
                          🎖️ شهادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Excluded Coordinators List */}
          <div style={{ ...cardStyle, borderRight: '4px solid #64748B' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '0.6rem' }}>
              ℹ️ الكوادر خارج نطاق التقييم (9 منسقين وأخصائيين)
            </h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: '#64748B' }}>
              تم استبعادهم من جداول تقييم المعلمين لكونهم منسقي أقسام أو ضمن البحث العلمي أو التعليم الإلكتروني.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.6rem' }}>
              {EXCLUDED_COORDINATORS_LIST.map((c, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.85rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{c.role} · قسم {c.department}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.2rem' }}>سبب الاستبعاد: {c.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 4: ⚠️ المعلمون الذين يحتاجون إلى متابعة
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'followup' && (
        <div>
          {/* Priority 1: 6 Teachers with Pending Submissions */}
          <div style={{ ...cardStyle, borderRight: '4px solid #EF4444', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#B91C1C', margin: 0 }}>
                  🚨 أولوية قصوى: أعلى 6 معلمين لديهم تسليمات معلقة تنتظر التصحيح
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  يمثل هؤلاء المعلمون 199 تسليماً من أصل 244 تسليماً غير مصحح على مستوى المدرسة
                </p>
              </div>
              <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                199 تسليماً معلقاً
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>القسم</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>التسليمات المعلقة</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>نسبة التصحيح الحالية</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ملاحظات وتوجيه الأداء</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFollowupPending.slice(0, 8).map((t, idx) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #FEE2E8' }}>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 800, color: '#991B1B' }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 800, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.5rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 900, color: '#DC2626', fontSize: '0.95rem' }}>
                        {t.submissionsPending} تسليماً
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{ background: t.gradingRate === 0 ? '#FEE2E2' : '#FEF3C7', color: t.gradingRate === 0 ? '#991B1B' : '#92400E', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          {t.gradingRate}%
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', color: '#374151' }}>{t.notes}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedTeacherModal(t)}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          عرض البطاقة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority 2: Partial Coverage (9 teachers) */}
          <div style={{ ...cardStyle, borderRight: '4px solid #F59E0B', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#B45309', marginBottom: '0.6rem' }}>
              ⚠️ المعلمون أصحاب التغطية الجزئية في التقييمات (9 معلمين)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>القسم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>تغطية التقييمات</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>السجلات غير المغطاة والملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFollowupPartial.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #FEF3C7' }}>
                      <td style={{ padding: '0.45rem 0.5rem', fontWeight: 700, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#B45309' }}>
                        {t.evalCoverageRatio} ({t.evalCoveragePercent}%)
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#475569' }}>
                        {t.missingEvalRecords !== 'ال يوجد' ? t.missingEvalRecords : t.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority 3: Unassigned Evaluations (5 teachers) */}
          <div style={{ ...cardStyle, borderRight: '4px solid #00B4D8', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.6rem' }}>
              📤 تقييمات مرفوعة وغير مسندة للطلاب (23 تقييماً لدى 5 معلمين)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>القسم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>تقييمات غير مسندة</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>المواد والشعب المتأثرة</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUnassignedEval.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E0F2FE' }}>
                      <td style={{ padding: '0.45rem 0.5rem', fontWeight: 700, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 900, color: '#0284C7' }}>
                        {t.evalUnassigned} تقييمات
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#475569' }}>{t.subjectsAndSections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority 4: Zero Lessons Records (7 teachers) */}
          <div style={{ ...cardStyle, borderRight: '4px solid #64748B', marginBottom: 0 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#334155', marginBottom: '0.6rem' }}>
              🚫 مواد وشعب بلا دروس مرفوعة (33 سجلاً لدى 7 معلمين)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>اسم المعلم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>القسم</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>سجلات بلا دروس</th>
                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>التفاصيل والمواد</th>
                  </tr>
                </thead>
                <tbody>
                  {activeZeroLesson.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.45rem 0.5rem', fontWeight: 700, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#EF4444' }}>
                        {t.sectionsCount} سجلاً
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', color: '#475569' }}>{t.missingLessonRecords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 5: 📋 الكشف التفصيلي الشامل (52 معلماً)
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'full_table' && (
        <div style={cardStyle}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 ابحث باسم المعلم، القسم، الشعبة أو الملاحظة..."
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  direction: 'rtl',
                }}
              />
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  direction: 'rtl',
                  background: '#fff',
                }}
              >
                <option value="">جميع الأقسام الأكاديمية</option>
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                  direction: 'rtl',
                  background: '#fff',
                }}
              >
                <option value="">جميع الفئات</option>
                <option value="top_overall">المتصدرون والمتميزون (Top 10)</option>
                <option value="admin_excellent">التقدير الإداري: ممتاز (7)</option>
                <option value="admin_very_good">التقدير الإداري: جيد جداً (21)</option>
                <option value="followup_pending">تسليمات معلقة تنتظر التصحيح</option>
                <option value="followup_partial">تغطية تقييمات جزئية</option>
                <option value="followup_no_eval">بلا تقييمات مسجلة</option>
              </select>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
              عرض {filteredTeachers.length} من أصل 52 معلماً
            </div>
          </div>

          {/* Full Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>المعلم</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>القسم</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>الشعب</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>تغطية التقييمات</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>التسليمات (مصحح/مستلم)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>نسبة الحل</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>الدروس (مستوفية/مرفوعة)</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>التقدير الإداري</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t, idx) => {
                  const sysId = findSystemTeacherId(t.name);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 800, color: '#0F2044' }}>
                        <div>{t.name}</div>
                        {t.generalIndex && (
                          <span style={{ fontSize: '0.68rem', color: '#166534', background: '#DCFCE7', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            مؤشر المنصة: {t.generalIndex.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{t.sectionsCount}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{
                          background: t.evalCoveragePercent === 100 ? '#DCFCE7' : t.evalCoveragePercent > 0 ? '#FEF3C7' : '#FEE2E2',
                          color: t.evalCoveragePercent === 100 ? '#166534' : t.evalCoveragePercent > 0 ? '#92400E' : '#991B1B',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                        }}>
                          {t.evalCoverageRatio} ({t.evalCoveragePercent}%)
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {t.submissionsReceived > 0 ? (
                          <div>
                            <span style={{ fontWeight: 800, color: t.gradingRate === 100 ? '#047857' : '#92400E' }}>
                              {t.submissionsGraded} / {t.submissionsReceived}
                            </span>
                            {t.submissionsPending > 0 && (
                              <div style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 800 }}>
                                ⏳ {t.submissionsPending} معلقة
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>
                        {t.solveRate > 0 ? `${t.solveRate}%` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {t.lessonsUploaded > 0 ? (
                          <span style={{ fontWeight: 800, color: '#1E3A8A' }}>
                            {t.lessonsValid} / {t.lessonsUploaded}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{
                          background: t.adminRating === 'ممتاز' ? '#DCFCE7' : t.adminRating === 'جيد جداً' ? '#EFF6FF' : '#F1F5F9',
                          color: t.adminRating === 'ممتاز' ? '#166534' : t.adminRating === 'جيد جداً' ? '#1E40AF' : '#64748B',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}>
                          {t.adminRating}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => setSelectedTeacherModal(t)}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            البطاقة
                          </button>
                          <button
                            onClick={() => handlePrintCertificate(t)}
                            style={{
                              background: '#3D52A0',
                              color: '#fff',
                              border: 'none',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              fontWeight: 800,
                            }}
                            title="طباعة شهادة تقدير"
                          >
                            🎖️
                          </button>
                          {sysId && canManageEvaluations && (
                            <button
                              onClick={() => onSelectTeacherForEval(sysId)}
                              style={{
                                background: '#10B981',
                                color: '#fff',
                                border: 'none',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              ✏️
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 6: 🏫 إحصاءات الصفوف الدراسية
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'grades' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              🏫 تغطية رفع التقييمات والدروس حسب الصفوف الدراسية
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              النسبة من سجلات المادة والشعبة في كل صف وليست من عدد الطلاب
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {activeGradeStats.map((g, idx) => (
              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.6rem' }}>
                  {g.grade}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
                    <span>تغطية التقييمات</span>
                    <span style={{ fontWeight: 800, color: '#5B21B6' }}>{g.evalPercent}% ({g.evalRatio})</span>
                  </div>
                  <div style={{ background: '#E2E8F0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '0.2rem' }}>
                    <div style={{ background: '#8B5CF6', width: `${g.evalPercent}%`, height: '100%' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
                    <span>تغطية الدروس</span>
                    <span style={{ fontWeight: 800, color: '#047857' }}>{g.lessonsPercent}% ({g.lessonsRatio})</span>
                  </div>
                  <div style={{ background: '#E2E8F0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '0.2rem' }}>
                    <div style={{ background: '#10B981', width: `${g.lessonsPercent}%`, height: '100%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* ── 4. Teacher Detail Modal ── */}
      {selectedTeacherModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedTeacherModal(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
              direction: 'rtl',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  {selectedTeacherModal.name}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                    قسم {selectedTeacherModal.department}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#1E40AF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                    {selectedTeacherModal.sectionsCount} سجلاً
                  </span>
                  {selectedTeacherModal.adminRating && (
                    <span style={{
                      fontSize: '0.75rem',
                      background: selectedTeacherModal.adminRating === 'ممتاز' ? '#DCFCE7' : '#FEF3C7',
                      color: selectedTeacherModal.adminRating === 'ممتاز' ? '#166534' : '#92400E',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 800,
                    }}>
                      التقدير الإداري: {selectedTeacherModal.adminRating}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {selectedTeacherModal.badges.map((b, i) => (
                <span key={i} style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700 }}>
                  {b}
                </span>
              ))}
            </div>

            {/* Notes */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem', fontSize: '0.82rem', color: '#334155', lineHeight: '1.6', marginBottom: '1rem' }}>
              {selectedTeacherModal.notes}
            </div>

            {/* Details Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '1rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700, width: '40%' }}>المواد والشعب:</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.subjectsAndSections || '—'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>تغطية التقييمات:</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.evalCoverageRatio} ({selectedTeacherModal.evalCoveragePercent}%)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>التقييمات (مرفوعة/مسندة/غير مسندة):</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.evalUploaded} / {selectedTeacherModal.evalAssigned} / {selectedTeacherModal.evalUnassigned}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>التسليمات (مستلمة/مصححة/معلقة):</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.submissionsReceived} / {selectedTeacherModal.submissionsGraded} / {selectedTeacherModal.submissionsPending}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>نسبة التصحيح / الحل:</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.gradingRate}% تصحيح / {selectedTeacherModal.solveRate}% حل</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>الدروس (مرفوعة/ظاهرة/مخفية):</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.lessonsUploaded} / {selectedTeacherModal.lessonsVisible} / {selectedTeacherModal.lessonsHidden}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.4rem', color: '#64748B', fontWeight: 700 }}>الدروس المحسوبة المستوفية:</td>
                  <td style={{ padding: '0.4rem', color: '#0F2044', fontWeight: 600 }}>{selectedTeacherModal.lessonsValid} ({selectedTeacherModal.lessonsValidPercent}%)</td>
                </tr>
                {selectedTeacherModal.missingEvalRecords !== 'ال يوجد' && (
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.4rem', color: '#B45309', fontWeight: 700 }}>سجلات غير ظاهرة بالتقييمات:</td>
                    <td style={{ padding: '0.4rem', color: '#B45309' }}>{selectedTeacherModal.missingEvalRecords}</td>
                  </tr>
                )}
                {selectedTeacherModal.missingLessonRecords !== 'ال يوجد' && (
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.4rem', color: '#DC2626', fontWeight: 700 }}>سجلات بلا دروس:</td>
                    <td style={{ padding: '0.4rem', color: '#DC2626' }}>{selectedTeacherModal.missingLessonRecords}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
              <button
                onClick={() => handlePrintCertificate(selectedTeacherModal)}
                style={{
                  background: '#3D52A0',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>🎖️</span> طباعة شهادة شكر وتقدير
              </button>
              {findSystemTeacherId(selectedTeacherModal.name) && canManageEvaluations && (
                <button
                  onClick={() => {
                    const id = findSystemTeacherId(selectedTeacherModal.name);
                    if (id) {
                      setSelectedTeacherModal(null);
                      onSelectTeacherForEval(id);
                    }
                  }}
                  style={{
                    background: '#10B981',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  ✏️ تقييم المعلم في النظام
                </button>
              )}
              <button
                onClick={() => setSelectedTeacherModal(null)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
