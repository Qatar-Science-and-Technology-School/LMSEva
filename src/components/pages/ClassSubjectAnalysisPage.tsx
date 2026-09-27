'use client';

import React, { useState, useMemo } from 'react';
import {
  SCHOOL_NAME,
  ACADEMIC_YEARS,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
  GRADE_LEVEL_LMS_STATS,
  SEPTEMBER_2026_LMS_METRICS,
} from '@/lib/data';
import type { User } from '@/lib/data';
import * as XLSX from 'xlsx';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  Award,
  ArrowUpDown,
  X,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface Props {
  currentUser: User;
  selectedYear?: string;
  onNavigate?: (page: any) => void;
}

export default function ClassSubjectAnalysisPage({ currentUser, selectedYear: propYear }: Props) {
  const currentYear = propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'sections' | 'subjects' | 'grades' | 'matrix' | 'action_plan'>('sections');

  // Filters for sections table
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedEvalClass, setSelectedEvalClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'rank' | 'solveRate' | 'gradingRate' | 'submissions' | 'lessonVisiblePercent'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Subject search
  const [subjectSearch, setSubjectSearch] = useState<string>('');

  // Comprehensive Monthly Report Modal
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Distinct Grades list
  const gradesList = useMemo(() => {
    const set = new Set(SECTIONS_LMS_STATS.map(s => s.grade));
    return Array.from(set);
  }, []);

  // Filtered & Sorted Sections
  const filteredSections = useMemo(() => {
    return SECTIONS_LMS_STATS.filter(s => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedEvalClass !== 'all' && s.evalClass !== selectedEvalClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.section.toLowerCase().includes(q) ||
          s.grade.toLowerCase().includes(q) ||
          s.weakestEvalSubject.toLowerCase().includes(q) ||
          s.evalClass.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [selectedGrade, selectedEvalClass, searchQuery, sortField, sortAsc]);

  // Top 5 and Bottom 5 Sections
  const top5Sections = useMemo(() => {
    return [...SECTIONS_LMS_STATS].sort((a, b) => b.solveRate - a.solveRate).slice(0, 5);
  }, []);

  const bottom5Sections = useMemo(() => {
    return [...SECTIONS_LMS_STATS].sort((a, b) => a.solveRate - b.solveRate).slice(0, 5);
  }, []);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return SUBJECTS_LMS_STATS.filter(sub => {
      if (!subjectSearch.trim()) return true;
      return sub.name.toLowerCase().includes(subjectSearch.toLowerCase().trim());
    });
  }, [subjectSearch]);

  // Chart data for Grades comparison
  const gradeComparisonChartData = useMemo(() => {
    return GRADE_LEVEL_LMS_STATS.map(g => ({
      grade: g.grade,
      solveRate: g.solveRate,
      gradingRate: g.gradingRate,
      visibilityRate: g.lessonVisibilityRate,
      submissions: g.submissions,
      lessons: g.totalLessons,
    }));
  }, []);

  // Excel Export Handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Sections
    const sectionsRows = SECTIONS_LMS_STATS.map(s => ({
      'الترتيب العام': s.rank,
      'الشعبة': s.section,
      'الصف': s.grade,
      'عدد الطلاب': s.studentsCount,
      'مواد التقييمات': s.evalSubjectsCount,
      'عدد التقييمات': s.evalCount,
      'متوسط التقييمات للشعبة': s.evalAvg,
      'التسليمات المسجلة': s.submissions,
      'نسبة الحل (%)': s.solveRate,
      'نسبة التصحيح (%)': s.gradingRate,
      'تسليمات معلقة لم تصحح': s.ungraded,
      'المادة الأضعف في التقييمات': s.weakestEvalSubject,
      'تصنيف التقييمات': s.evalClass,
      'مواد الدروس': s.lessonSubjectsCount,
      'إجمالي الدروس': s.lessonTotal,
      'الدروس الظاهرة للطلبة': s.lessonVisible,
      'الدروس الخفية': s.lessonHidden,
      'نسبة ظهور الدروس (%)': s.lessonVisiblePercent,
      'تصنيف الدروس': s.lessonClass,
    }));
    const wsSections = XLSX.utils.json_to_sheet(sectionsRows);
    XLSX.utils.book_append_sheet(wb, wsSections, 'تحليل الشعب (19)');

    // Sheet 2: Subjects
    const subjectsRows = SUBJECTS_LMS_STATS.map(sub => ({
      'المادة الدراسية': sub.name,
      'عدد المعلمين': sub.teachersCount,
      'سجلات التقييم': sub.evalRecords,
      'عدد التقييمات': sub.evalsCount,
      'معدل التقييمات للشعبة': sub.evalPerSec,
      'إجمالي التسليمات': sub.submissions,
      'نسبة الحل (%)': sub.solveRate,
      'نسبة التصحيح (%)': sub.gradingRate,
      'تسليمات معلقة': sub.ungraded,
      'سجلات الدروس': sub.lessonRecords,
      'إجمالي الدروس': sub.lessonTotal,
      'الدروس الظاهرة': sub.lessonVisible,
      'الدروس الخفية': sub.lessonHidden,
      'نسبة ظهور الدروس (%)': sub.lessonVisibilityRate,
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(subjectsRows);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'تحليل المواد (18)');

    // Sheet 3: Grades
    const gradesRows = GRADE_LEVEL_LMS_STATS.map(g => ({
      'الصف الدراسي': g.grade,
      'عدد الشعب': g.sectionsCount,
      'سجلات التقييم': g.evalRecords,
      'معلمو التقييم': g.evalTeachers,
      'عدد التقييمات': g.evalsCount,
      'التسليمات': g.submissions,
      'نسبة الحل (%)': g.solveRate,
      'نسبة التصحيح (%)': g.gradingRate,
      'التسليمات المعلقة': g.ungraded,
      'إجمالي الدروس': g.totalLessons,
      'الدروس الظاهرة': g.visibleLessons,
      'الدروس الخفية': g.hiddenLessons,
      'نسبة ظهور الدروس (%)': g.lessonVisibilityRate,
    }));
    const wsGrades = XLSX.utils.json_to_sheet(gradesRows);
    XLSX.utils.book_append_sheet(wb, wsGrades, 'مقارنة الصفوف (5)');

    // Sheet 4: Summary
    const summaryRows = [
      { 'المؤشر': 'إجمالي الشعب الدراسية', 'القيمة': SEPTEMBER_2026_LMS_METRICS.totalSections },
      { 'المؤشر': 'إجمالي المواد الدراسية', 'القيمة': SEPTEMBER_2026_LMS_METRICS.totalSubjects },
      { 'المؤشر': 'إجمالي تسليمات التقييمات', 'القيمة': SEPTEMBER_2026_LMS_METRICS.totalSubmissions },
      { 'المؤشر': 'التسليمات المصححة', 'القيمة': SEPTEMBER_2026_LMS_METRICS.gradedSubmissions },
      { 'المؤشر': 'نسبة إنجاز التصحيح العامة (%)', 'القيمة': SEPTEMBER_2026_LMS_METRICS.gradingRate },
      { 'المؤشر': 'التسليمات المعلقة (قيد الانتظار)', 'القيمة': SEPTEMBER_2026_LMS_METRICS.pendingSubmissions },
      { 'المؤشر': 'نسبة حل التقييمات المرجحة (%)', 'القيمة': SEPTEMBER_2026_LMS_METRICS.weightedSolveRate },
      { 'المؤشر': 'إجمالي الدروس على المنصة', 'القيمة': SEPTEMBER_2026_LMS_METRICS.totalLessons },
      { 'المؤشر': 'الدروس الظاهرة للطلبة', 'القيمة': SEPTEMBER_2026_LMS_METRICS.lessonsVisible },
      { 'المؤشر': 'نسبة ظهور الدروس (%)', 'القيمة': SEPTEMBER_2026_LMS_METRICS.lessonsVisiblePercent },
      { 'المؤشر': 'تاريخ التقرير', 'القيمة': SEPTEMBER_2026_LMS_METRICS.reportDate },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص التنفيذي');

    XLSX.writeFile(wb, `تقرير_تحليل_الشعب_والمواد_نظام_قطر_للتعليم_${currentYear}.xlsx`);
  };

  // Helper for Sorting
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending on click
    }
  };

  // Helper for color coding percentage
  const getRateColor = (rate: number) => {
    if (rate >= 80) return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
    if (rate >= 65) return { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD' };
    if (rate >= 50) return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
  };

  const getEvalClassBadge = (status: string) => {
    switch (status) {
      case 'متميزة':
        return { bg: '#DCFCE7', text: '#15803D', label: 'متميزة 🌟' };
      case 'جيدة':
        return { bg: '#EFF6FF', text: '#1D4ED8', label: 'جيدة 👍' };
      case 'مقبولة':
        return { bg: '#FEF3C7', text: '#B45309', label: 'مقبولة ⚠️' };
      case 'تحتاج تحسين':
      default:
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'تحتاج تحسين 🚨' };
    }
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', minHeight: '100vh', background: '#F8FAFC' }}>
      
      {/* ── 1. Top Header Banner ── */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 50%, #0284C7 100%)',
          borderRadius: '18px',
          padding: '1.75rem 2rem',
          color: '#fff',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(15,32,68,0.22)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, left: -30, width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.8rem' }}>🏫</span>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.3px' }}>
              تحليل الفصول / الشعب والمواد الدراسية
            </h1>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.35)',
              }}
            >
              نظام قطر للتعليم (سبتمبر 2026)
            </span>
          </div>
          <p style={{ margin: 0, color: '#BAE6FD', fontSize: '0.88rem', lineHeight: 1.5 }}>
            المرصد التشخيصي الأكاديمي الشامل لتحليل أداء 19 شعبة دراسية و 18 مادة تخصصية عبر الصفوف (7، 9، 10، 11، 12) بمدرسة قطر للعلوم والتكنولوجيا.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
            <span style={{ background: 'rgba(15, 32, 68, 0.4)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
              📅 تاريخ التقرير: <strong>27 سبتمبر 2026</strong>
            </span>
            <span style={{ background: 'rgba(15, 32, 68, 0.4)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
              🎯 الشعب المتميزة: <strong>5 شعب</strong>
            </span>
            <span style={{ background: 'rgba(15, 32, 68, 0.4)', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
              ⚠️ شعب الثاني عشر بحاجة لتدخل: <strong>5 شعب</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', zIndex: 1 }}>
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1.15rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              transition: 'transform 0.15s',
            }}
          >
            <FileText size={16} />
            <span>استخراج التقرير الشهري الشامل</span>
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1.15rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
            }}
          >
            <Download size={16} />
            <span>تصدير Excel متكامل</span>
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '0.65rem 0.95rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Printer size={16} />
            <span>طباعة فورية</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Metric Summary Cards ── */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          {
            title: 'إجمالي الشعب الدراسية',
            value: `${SEPTEMBER_2026_LMS_METRICS.totalSections} شعبة`,
            sub: '5 صفوف (7، 9، 10، 11، 12)',
            icon: '🏫',
            color: '#0F2044',
            bg: '#F1F5F9',
          },
          {
            title: 'إجمالي المواد المرصودة',
            value: `${SEPTEMBER_2026_LMS_METRICS.totalSubjects} مادة`,
            sub: 'تخصصية وأكاديمية ومختبرات',
            icon: '📚',
            color: '#0284C7',
            bg: '#E0F2FE',
          },
          {
            title: 'إجمالي التسليمات',
            value: SEPTEMBER_2026_LMS_METRICS.totalSubmissions.toLocaleString('ar-QA'),
            sub: `${SEPTEMBER_2026_LMS_METRICS.gradedSubmissions} مصححاً | ${SEPTEMBER_2026_LMS_METRICS.pendingSubmissions} معلقاً`,
            icon: '📥',
            color: '#10B981',
            bg: '#DCFCE7',
          },
          {
            title: 'نسبة حل التقييمات',
            value: `${SEPTEMBER_2026_LMS_METRICS.weightedSolveRate}%`,
            sub: 'النسبة المرجحة لمجموع الطلاب',
            icon: '🎯',
            color: '#0D9488',
            bg: '#CCFBF1',
          },
          {
            title: 'نسبة إنجاز التصحيح',
            value: `${SEPTEMBER_2026_LMS_METRICS.gradingRate}%`,
            sub: '13 معلماً أتموا التصحيح 100%',
            icon: '✍️',
            color: '#7C3AED',
            bg: '#EDE9FE',
          },
          {
            title: 'تفعيل ونشر الدروس',
            value: `${SEPTEMBER_2026_LMS_METRICS.lessonsVisiblePercent}%`,
            sub: `${SEPTEMBER_2026_LMS_METRICS.lessonsVisible} من أصل ${SEPTEMBER_2026_LMS_METRICS.totalLessons} درساً`,
            icon: '📖',
            color: '#D97706',
            bg: '#FEF3C7',
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '1.15rem 1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>{card.title}</span>
              <span style={{ fontSize: '1.4rem', background: card.bg, padding: '4px 8px', borderRadius: '8px' }}>
                {card.icon}
              </span>
            </div>
            <div>
              <p style={{ fontSize: '1.45rem', fontWeight: 900, color: card.color, margin: 0 }}>{card.value}</p>
              <p style={{ fontSize: '0.68rem', color: '#94A3B8', margin: '0.3rem 0 0', fontWeight: 700 }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Navigation Sub-Tabs ── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.2rem',
        }}
      >
        {[
          { id: 'sections', label: 'تحليل الشعب (19 شعبة)', icon: '🏫', badge: `${SECTIONS_LMS_STATS.length}` },
          { id: 'subjects', label: 'تحليل المواد الدراسية (18 مادة)', icon: '📚', badge: `${SUBJECTS_LMS_STATS.length}` },
          { id: 'grades', label: 'مقارنة الصفوف الدراسية', icon: '📊', badge: '5 صفوف' },
          { id: 'matrix', label: 'مصفوفة الشعب والمواد (Heatmap)', icon: '🗺️', badge: 'جديد' },
          { id: 'action_plan', label: 'خطة التدخل لشعب الثاني عشر', icon: '🚨', badge: 'عاجل' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: isActive ? '#0F2044' : '#fff',
                color: isActive ? '#fff' : '#475569',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.85rem',
                borderRadius: '10px 10px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 -2px 10px rgba(15,32,68,0.1)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? '#00B4D8' : '#F1F5F9',
                  color: isActive ? '#fff' : '#64748B',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '999px',
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Sub-Tab Content ── */}

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: 🏫 تحليل الشعب الدراسية (19 شعبة)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'sections' && (
        <div>
          {/* Top 5 & Bottom 5 Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Top 5 Sections */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #BBF7D0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🥇</span> أفضل 5 شعب أداءً في حل التقييمات
                </h3>
                <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  نسبة حل تفوق 80%
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {top5Sections.map((s, idx) => (
                  <div
                    key={s.section}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#F0FDF4',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #DCFCE7',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#D97706' : '#10B981',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                        }}
                      >
                        {s.rank}
                      </span>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0F2044', fontSize: '0.9rem' }}>
                          شعبة {s.section} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>({s.grade})</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#166534', marginTop: '2px' }}>
                          {s.submissions} تسليماً | تصحيح {s.gradingRate}%
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803D' }}>{s.solveRate}%</span>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>نسبة الحل</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 5 Sections (Needs Urgency) */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #FECACA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span> الشعب الـ 5 الأقل إنجازاً (تتطلب تدخلاً عاجلاً)
                </h3>
                <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  جميعها من الصف 12
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {bottom5Sections.map(s => (
                  <div
                    key={s.section}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FEF2F2',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #FEE2E2',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#EF4444',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                        }}
                      >
                        {s.rank}
                      </span>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0F2044', fontSize: '0.9rem' }}>
                          شعبة {s.section} <span style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 700 }}>({s.grade})</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#7F1D1D', marginTop: '2px' }}>
                          {s.submissions} تسليماً فقط | الأضعف: {s.weakestEvalSubject}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#B91C1C' }}>{s.solveRate}%</span>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>نسبة الحل</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Table with Filters */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
              
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="بحث بالشعبة أو المادة الأضعف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.2rem 0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0F2044',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">كل الصفوف الدراسية (5)</option>
                {gradesList.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Eval Class Filter */}
              <select
                value={selectedEvalClass}
                onChange={e => setSelectedEvalClass(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0F2044',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">كل تصنيفات التقييم</option>
                <option value="متميزة">متميزة (80% فما فوق)</option>
                <option value="جيدة">جيدة (70% - 79.9%)</option>
                <option value="مقبولة">مقبولة (50% - 69.9%)</option>
                <option value="تحتاج تحسين">تحتاج تحسين (أقل من 50%)</option>
              </select>

              {/* Reset */}
              {(selectedGrade !== 'all' || selectedEvalClass !== 'all' || searchQuery) && (
                <button
                  onClick={() => { setSelectedGrade('all'); setSelectedEvalClass('all'); setSearchQuery(''); }}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    color: '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  إلغاء الفلاتر
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    <th onClick={() => toggleSort('rank')} style={{ padding: '0.75rem 0.6rem', textAlign: 'center', cursor: 'pointer' }}>
                      الترتيب <ArrowUpDown size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    </th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>الشعبة</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>الصف</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>الطلاب</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>التقييمات</th>
                    <th onClick={() => toggleSort('submissions')} style={{ padding: '0.75rem 0.6rem', textAlign: 'center', cursor: 'pointer' }}>
                      التسليمات <ArrowUpDown size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    </th>
                    <th onClick={() => toggleSort('solveRate')} style={{ padding: '0.75rem 0.6rem', textAlign: 'center', cursor: 'pointer' }}>
                      نسبة الحل <ArrowUpDown size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    </th>
                    <th onClick={() => toggleSort('gradingRate')} style={{ padding: '0.75rem 0.6rem', textAlign: 'center', cursor: 'pointer' }}>
                      نسبة التصحيح <ArrowUpDown size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    </th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>معلق</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>المادة الأضعف في التقييمات</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>الدروس الظاهرة</th>
                    <th onClick={() => toggleSort('lessonVisiblePercent')} style={{ padding: '0.75rem 0.6rem', textAlign: 'center', cursor: 'pointer' }}>
                      ظهور الدروس <ArrowUpDown size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    </th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>التصنيف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSections.map((s, idx) => {
                    const solveColor = getRateColor(s.solveRate);
                    const gradeColor = getRateColor(s.gradingRate);
                    const classBadge = getEvalClassBadge(s.evalClass);
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={s.section}
                        style={{
                          borderBottom: '1px solid #E2E8F0',
                          background: isEven ? '#fff' : '#F8FAFC',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 900 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: s.rank <= 3 ? '#FEF3C7' : '#F1F5F9',
                              color: s.rank <= 3 ? '#B45309' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                            }}
                          >
                            {s.rank}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', fontWeight: 900, color: '#0F2044', fontSize: '0.9rem' }}>
                          شعبة {s.section}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', color: '#64748B', fontWeight: 700 }}>
                          {s.grade}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                          {s.studentsCount}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#0F2044' }}>{s.evalCount}</span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginRight: '4px' }}>({s.evalAvg}/مادة)</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                          {s.submissions}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-block', minWidth: '70px' }}>
                            <span
                              style={{
                                background: solveColor.bg,
                                color: solveColor.text,
                                border: `1px solid ${solveColor.border}`,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 900,
                                fontSize: '0.78rem',
                              }}
                            >
                              {s.solveRate}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: gradeColor.bg,
                              color: gradeColor.text,
                              border: `1px solid ${gradeColor.border}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                            }}
                          >
                            {s.gradingRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', color: s.ungraded > 0 ? '#DC2626' : '#16A34A', fontWeight: 800 }}>
                          {s.ungraded > 0 ? s.ungraded : '0 ✓'}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                          {s.weakestEvalSubject}
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                          <span style={{ color: '#16A34A', fontWeight: 800 }}>{s.lessonVisible}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}> / {s.lessonTotal}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#334155' }}>
                          {s.lessonVisiblePercent}%
                        </td>
                        <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: classBadge.bg,
                              color: classBadge.text,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                            }}
                          >
                            {classBadge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
              <span>إجمالي السجلات المعروضة: <strong>{filteredSections.length}</strong> من أصل {SECTIONS_LMS_STATS.length} شعبة</span>
              <span>المصدر: التقارير الرسمية لنظام قطر للتعليم (27 سبتمبر 2026)</span>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📚 تحليل المواد الدراسية (18 مادة)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'subjects' && (
        <div>
          {/* Top Subjects vs Subjects Needing Attention */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            {/* Top Subjects in Solving */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #BBF7D0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#166534', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🌟</span> المواد ذات نسب الحل المرتفعة
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUBJECTS_LMS_STATS.slice(0, 5).map(sub => (
                  <div key={sub.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#F0FDF4', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.85rem' }}>{sub.name}</span>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{sub.submissions} تسليماً | {sub.teachersCount} معلم</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>{sub.solveRate}%</span>
                      <div style={{ fontSize: '0.65rem', color: '#15803D' }}>تصحيح: {sub.gradingRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects Needing Follow-up */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #FECACA' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#991B1B', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚠️</span> مواد تحتاج متابعة عاجلة في التصحيح والحل
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'الفيزياء', issue: 'نسبة التصحيح 27.2% فقط (80 تسليماً معلقاً) ونسبة الحل 38.3%', solve: '38.3%', grade: '27.2%' },
                  { name: 'تكنولوجيا التصميم', issue: 'نسبة الحل 39.8%، 21 سجلاً تعليمياً بحاجة لتكثيف التفاعل', solve: '39.8%', grade: '100%' },
                  { name: 'التربية الإسلامية', issue: 'انخفاض حل شعب الثاني عشر (أقل من 20% ببعض الشعب)', solve: '75.8%', grade: '80.8%' },
                  { name: 'مختبرات تخصصية', issue: 'سجلات تخصصية لم تسجل تقييمات ببعض الشعب', solve: '57.4%', grade: '64.9%' },
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#FEF2F2', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.85rem' }}>{item.name}</span>
                      <div style={{ fontSize: '0.68rem', color: '#7F1D1D' }}>{item.issue}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontWeight: 900, color: '#DC2626', fontSize: '0.95rem' }}>حل: {item.solve}</span>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>تصحيح: {item.grade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Subjects Table */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  جدول التحليل الشامل لكافة المواد الدراسية (18 مادة)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  مقارنة مؤشرات التقييمات والدروس وفق البيانات الرسمية
                </p>
              </div>

              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="بحث باسم المادة..."
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 2.2rem 0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    <th style={{ padding: '0.75rem 0.6rem' }}>#</th>
                    <th style={{ padding: '0.75rem 0.6rem' }}>المادة الدراسية</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>المعلمون</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>سجلات التقييم</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>التقييمات</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>التسليمات</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>نسبة الحل</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>نسبة التصحيح</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>معلق</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>سجلات الدروس</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>الدروس الظاهرة</th>
                    <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>نسبة ظهور الدروس</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((sub, idx) => {
                    const solveColor = getRateColor(sub.solveRate);
                    const gradeColor = getRateColor(sub.gradingRate);
                    const isEven = idx % 2 === 0;

                    return (
                      <tr key={sub.name} style={{ borderBottom: '1px solid #E2E8F0', background: isEven ? '#fff' : '#F8FAFC' }}>
                        <td style={{ padding: '0.7rem 0.6rem', color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '0.7rem 0.6rem', fontWeight: 900, color: '#0F2044' }}>{sub.name}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>{sub.teachersCount}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>{sub.evalRecords}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>{sub.evalsCount}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>{sub.submissions}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: solveColor.bg,
                              color: solveColor.text,
                              border: `1px solid ${solveColor.border}`,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                            }}
                          >
                            {sub.solveRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>
                          <span
                            style={{
                              background: gradeColor.bg,
                              color: gradeColor.text,
                              border: `1px solid ${gradeColor.border}`,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                            }}
                          >
                            {sub.gradingRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', color: sub.ungraded > 0 ? '#DC2626' : '#16A34A', fontWeight: 800 }}>
                          {sub.ungraded > 0 ? sub.ungraded : '0 ✓'}
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center' }}>{sub.lessonRecords}</td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 700 }}>
                          <span style={{ color: '#16A34A', fontWeight: 800 }}>{sub.lessonVisible}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}> / {sub.lessonTotal}</span>
                        </td>
                        <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>
                          {sub.lessonVisibilityRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: 📊 مقارنة الصفوف الدراسية
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'grades' && (
        <div>
          {/* Grade Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {GRADE_LEVEL_LMS_STATS.map(g => {
              const isWarning = g.solveRate < 50;
              return (
                <div
                  key={g.grade}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: isWarning ? '2px solid #EF4444' : '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isWarning && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                      🚨 جرس إنذار
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
                    {g.grade}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem', fontWeight: 700 }}>
                    {g.sectionsCount} شعب دراسية · {g.evalTeachers} معلمي تقييم
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>التسليمات:</span>
                      <strong style={{ color: '#0284C7' }}>{g.submissions}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>نسبة الحل:</span>
                      <strong style={{ color: g.solveRate >= 70 ? '#16A34A' : '#DC2626' }}>{g.solveRate}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>نسبة التصحيح:</span>
                      <strong style={{ color: g.gradingRate >= 80 ? '#16A34A' : '#D97706' }}>{g.gradingRate}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>التسليمات المعلقة:</span>
                      <strong style={{ color: g.ungraded > 0 ? '#DC2626' : '#16A34A' }}>{g.ungraded}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#64748B' }}>ظهور الدروس:</span>
                      <strong style={{ color: '#334155' }}>{g.visibleLessons} / {g.totalLessons} ({g.lessonVisibilityRate}%)</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recharts Comparison Graphs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' }}>
            
            {/* Rates Comparison Bar Chart */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📈</span> مقارنة نسب الحل والتصحيح بين الصفوف الدراسية
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gradeComparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#0F2044', fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ background: '#0F2044', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="solveRate" name="نسبة الحل (%)" fill="#0284C7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gradingRate" name="نسبة التصحيح (%)" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Submissions & Lessons Volume */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📊</span> حجم التسليمات والدروس المرفوعة لكل صف
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gradeComparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#0F2044', fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ background: '#0F2044', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="submissions" name="إجمالي التسليمات" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="lessons" name="إجمالي الدروس" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: 🗺️ مصفوفة الشعب والمواد (Heatmap Matrix)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              مصفوفة الرصد البصري لأداء الشعب الـ 19 والمادة الأضعف
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              خريطة حرارية لمتابعة مواطن القوة ونقاط الضعف التي تحتاج لتدخل سريع عبر الشعب
            </p>
          </div>

          {/* Matrix Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {SECTIONS_LMS_STATS.map(s => {
              const solveColor = getRateColor(s.solveRate);
              const isGrade12 = s.grade === 'الصف 12';

              return (
                <div
                  key={s.section}
                  style={{
                    background: isGrade12 ? '#FFF5F5' : '#F8FAFC',
                    border: isGrade12 ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: '#0F2044' }}>
                      شعبة {s.section}
                    </span>
                    <span
                      style={{
                        background: solveColor.bg,
                        color: solveColor.text,
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${solveColor.border}`,
                      }}
                    >
                      {s.solveRate}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '0.5rem' }}>
                    {s.grade} · {s.studentsCount} طلاب
                  </div>

                  {/* Weakest Subject Callout */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      border: '1px solid #E2E8F0',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>المادة الأضعف حلًا:</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B91C1C', marginTop: '2px' }}>
                      {s.weakestEvalSubject}
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569' }}>
                    <span>تسليمات: <strong>{s.submissions}</strong></span>
                    <span>تصحيح: <strong>{s.gradingRate}%</strong></span>
                    <span>معلق: <strong style={{ color: s.ungraded > 0 ? '#DC2626' : '#16A34A' }}>{s.ungraded}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: 🚨 خطة التدخل والتحسين لشعب الثاني عشر
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'action_plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Diagnostic Alert Box */}
          <div
            style={{
              background: '#FFF5F5',
              border: '2px solid #EF4444',
              borderRadius: '14px',
              padding: '1.5rem',
              color: '#7F1D1D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#991B1B' }}>
                تقرير تشخيصي عاجل: أزمة تفعيل نظام قطر للتعليم في الصف الثاني عشر
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: '#991B1B' }}>
              تظهر تقارير 27 سبتمبر 2026 تدنياً حاداً ومقلقاً في مؤشرات الصف الثاني عشر بكافة شعبه الـ 5 (12/1، 12/2، 12/3، 12/4، 12/5)؛ حيث بلغت نسبة الحل العامة <strong>43.3% فقط</strong>، وبلغ إجمالي التسليمات 141 تسليماً فقط (مقارنة بـ 731 بالصف العاشر و 653 بالصف التاسع)، مع وجود 78 تسليماً معلقاً بنسبة إنجاز تصحيح 44.7%، واختفاء 293 درساً (63.6% من الدروس خفية).
            </p>
          </div>

          {/* Action Steps Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>1️⃣</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  التواصل المباشر مع أولياء الأمور والطلبة
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                تفعيل خدمة الرسائل النصية القصيرة (SMS) عبر نظام E-Learning SMS وإرسال تنبيهات للطلبة المتأخرين في حل تقييمات مواد التربية الإسلامية واللغة الإنجليزية والفيزياء.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>2️⃣</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  إلزام معلمي الصف 12 بتصفير المتأخرات
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                متابعة المعلمين لتصحيح الـ 78 تسليماً المعلقة، وإظهار الدروس الخفية (293 درساً خفياً) لتكون متاحة للطلبة للاستذكار والاستعداد للاختبارات.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>3️⃣</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  جلسات إرشاد وتوجيه بالتعاون مع النائب الأكاديمي
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                عقد لقاء توجيهي لشعب الثاني عشر في الطابور الصباحي وحصص الإرشاد الأكاديمي للتأكيد على احتساب تفعيل المنصة ضمن درجات التقييم المستمر.
              </p>
            </div>

          </div>

          {/* Target Comparison Table */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: '0 0 1rem' }}>
              مقارنة الوضع الحالي والمستهدف لشعب الصف الثاني عشر لشهر أكتوبر 2026
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    <th style={{ padding: '0.6rem' }}>الشعبة</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>الوضع الحالي (سبتمبر)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>التسليمات الحالية</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>المستهدف (أكتوبر)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>معدل التصحيح المطلوب</th>
                    <th style={{ padding: '0.6rem' }}>الإجراء الفوري</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS_LMS_STATS.filter(s => s.grade === 'الصف 12').map(s => (
                    <tr key={s.section} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 900 }}>شعبة {s.section}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#DC2626', fontWeight: 800 }}>{s.solveRate}%</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>{s.submissions}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#16A34A', fontWeight: 900 }}>80% فما فوق</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#1E40AF', fontWeight: 800 }}>100% بدون معلقات</td>
                      <td style={{ padding: '0.6rem', fontSize: '0.75rem' }}>حصر أسماء المتغيبين عن الحل ومتابعة معلم {s.weakestEvalSubject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── 5. Comprehensive Monthly Report Modal ── */}
      {showReportModal && (
        <div
          className="report-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
                padding: '1.25rem 1.5rem',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📑</span>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                    التقرير الشهري الشامل لتحليل الفصول والمواد الدراسية
                  </h3>
                  <p style={{ margin: 0, color: '#BAE6FD', fontSize: '0.75rem' }}>
                    تقرير رسمي معتمد - مدرسة قطر للعلوم والتكنولوجيا (سبتمبر 2026)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable printable content) */}
            <div
              id="printable-monthly-report"
              style={{
                padding: '1.75rem',
                overflowY: 'auto',
                flex: 1,
                direction: 'rtl',
                color: '#1E293B',
              }}
            >
              {/* Official Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0F2044', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <img src="/ministry-logo.png" alt="وزارة التربية والتعليم" style={{ height: '65px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                    مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#0096C7', fontWeight: 800, margin: '0.2rem 0' }}>
                    قسم التعليم الإلكتروني والحلول الرقمية
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>
                    التقرير الشهري لمتابعة مؤشرات الفصول والشعب والمواد - سبتمبر 2026
                  </p>
                </div>
                <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '65px', objectFit: 'contain' }} />
              </div>

              {/* Executive Summary */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
                  الملخص التنفيذي للمؤشرات العامة:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center', fontSize: '0.75rem' }}>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B' }}>إجمالي الشعب</div>
                    <strong style={{ fontSize: '1.1rem', color: '#0F2044' }}>19 شعبة</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B' }}>التسليمات المحلولة</div>
                    <strong style={{ fontSize: '1.1rem', color: '#16A34A' }}>2,440 (66.7%)</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B' }}>إنجاز التصحيح</div>
                    <strong style={{ fontSize: '1.1rem', color: '#1E40AF' }}>78.7%</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B' }}>الدروس الظاهرة</div>
                    <strong style={{ fontSize: '1.1rem', color: '#D97706' }}>796 (54.5%)</strong>
                  </div>
                </div>
              </div>

              {/* Top & Bottom Sections Table */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.6rem' }}>
                أولاً: ترتيب الشعب الدراسية الـ 19 حسب نسبة حل التقييمات:
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '1.5rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff' }}>
                    <th style={{ padding: '0.5rem' }}>الترتيب</th>
                    <th style={{ padding: '0.5rem' }}>الشعبة</th>
                    <th style={{ padding: '0.5rem' }}>الصف</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>الطلاب</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>التسليمات</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>نسبة الحل</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>نسبة التصحيح</th>
                    <th style={{ padding: '0.5rem' }}>المادة الأضعف</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>التصنيف</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS_LMS_STATS.map(s => (
                    <tr key={s.section} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.45rem', fontWeight: 800 }}>#{s.rank}</td>
                      <td style={{ padding: '0.45rem', fontWeight: 900 }}>شعبة {s.section}</td>
                      <td style={{ padding: '0.45rem' }}>{s.grade}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center' }}>{s.studentsCount}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center' }}>{s.submissions}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 800, color: s.solveRate >= 70 ? '#16A34A' : '#DC2626' }}>{s.solveRate}%</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center' }}>{s.gradingRate}%</td>
                      <td style={{ padding: '0.45rem', fontSize: '0.7rem' }}>{s.weakestEvalSubject}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 700 }}>{s.evalClass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '2px solid #E2E8F0' }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>إعداد وتدقيق التقرير:</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>م. أحمد عادل طبيشات</p>
                  <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.72rem', color: '#64748B' }}>منسق المشاريع والتعليم الإلكتروني</p>
                  <img src="/signature-ahmad.png" alt="توقيع م. أحمد" style={{ height: '42px', objectFit: 'contain' }} />
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>مراجعة واعتماد:</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>أ. راني التوم</p>
                  <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.72rem', color: '#64748B' }}>النائب الأكاديمي للمدرسة</p>
                  <img src="/signature-rani.png" alt="توقيع أ. راني" style={{ height: '42px', objectFit: 'contain' }} />
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>يعتمد، مدير المدرسة:</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>أ. خالد راشد الهاجري</p>
                  <p style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.72rem', color: '#64748B' }}>مدير مدرسة قطر للعلوم والتكنولوجيا</p>
                  <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.75rem' }}>
                    ختم المدرسة الرسمي
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                نظام متابعة وتقييم نظام قطر للتعليم والمنصات التعليمية الرقمية
              </span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleExportExcel}
                  style={{
                    background: '#0284C7',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Download size={14} />
                  <span>تصدير Excel</span>
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#0F2044',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Printer size={14} />
                  <span>طباعة رسمية</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
