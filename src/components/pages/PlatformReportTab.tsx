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

export const EVALUATION_MONTHS: EvaluationMonthOption[] = [
  { id: '2026-09', month: 'سبتمبر', year: '2026-2027', label: 'سبتمبر ٢٠٢٦', status: 'available', badgeText: 'معتمد ومكتمل (٥٢ معلماً)', recordCount: 52 },
  { id: '2026-10', month: 'أكتوبر', year: '2026-2027', label: 'أكتوبر ٢٠٢٦', status: 'upcoming', badgeText: 'قيد الانتظار - الشهر القادم', recordCount: 0 },
  { id: '2026-11', month: 'نوفمبر', year: '2026-2027', label: 'نوفمبر ٢٠٢٦', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2026-12', month: 'ديسمبر', year: '2026-2027', label: 'ديسمبر ٢٠٢٦', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-01', month: 'يناير', year: '2026-2027', label: 'يناير ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-02', month: 'فبراير', year: '2026-2027', label: 'فبراير ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-03', month: 'مارس', year: '2026-2027', label: 'مارس ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-04', month: 'أبريل', year: '2026-2027', label: 'أبريل ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-05', month: 'مايو', year: '2026-2027', label: 'مايو ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-06', month: 'يونيو', year: '2026-2027', label: 'يونيو ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
];

interface Props {
  teachers: Teacher[];
  departments: Department[];
  onSelectTeacherForEval: (teacherId: string) => void;
  onSyncEvals: () => Promise<void>;
  isSyncing: boolean;
  syncSuccessMsg: string;
  onExportExcel: () => void;
  onNavigateToTakreem?: () => void;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
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
  selectedMonth,
  onMonthChange,
}: Props) {
  const [selectedMonthId, setSelectedMonthId] = useState(
    selectedMonth ? (EVALUATION_MONTHS.find(m => m.month === selectedMonth)?.id || '2026-09') : '2026-09'
  );
  const currentMonthObj = EVALUATION_MONTHS.find(m => m.id === selectedMonthId) || EVALUATION_MONTHS[0];
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [subTab, setSubTab] = useState<'top_teachers' | 'departments' | 'admin_ratings' | 'followup' | 'full_table' | 'grades'>('top_teachers');
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
    return SEPTEMBER_2026_LMS_TEACHERS.filter(t => {
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
  }, [search, deptFilter, categoryFilter]);

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.25rem',
  };

  const uniqueDepts = useMemo(() => {
    const set = new Set(SEPTEMBER_2026_LMS_TEACHERS.map(t => t.department));
    return Array.from(set);
  }, []);

  // Handle Certificate Print
  const handlePrintCertificate = (teacher: LmsReportTeacherRecord | { name: string; department: string; generalIndex?: number; notes?: string }) => {
    printTeacherCertificate({
      teacherNameAr: teacher.name,
      departmentName: teacher.department,
      academicYear: currentMonthObj.year,
      month: currentMonthObj.month,
      totalScore: teacher.generalIndex || (teacher as any).evalIndex || undefined,
      recognitionReason: (teacher as any).notes || `تكريم وتقدير لتميز المعلم وتصدره مؤشرات متابعة نشاط نظام قطر للتعليم لشهر ${currentMonthObj.month} ${currentMonthObj.year}.`,
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
            تاريخ الإعداد: 20 سبتمبر 2026 · مدرسة قطر للعلوم والتكنولوجيا الإعدادية الثانوية للبنين · مؤشرات مستندة إلى
            ملفات المنصة الرسمية
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              👥 52 معلماً داخل النطاق (43 ببيانات + 9 دون بيانات)
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              🎖️ 28 تقديراً إدارياً معتمداً (7 ممتاز + 21 جيد جداً)
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              🏫 19 شعبة · 188 سجلاً
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              💻 1,006 دروس (581 ظاهرة + 425 مخفية)
            </span>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              📝 1,119 تسليماً (875 مصححة بنسبة 78.2%)
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
      {selectedMonthId !== '2026-09' ? (
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

          {/* Upload Box */}
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

          {uploadSuccess && (
            <div style={{ maxWidth: '560px', margin: '0 auto 1.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem' }}>
              ✅ تم استقبال ملف التقرير بنجاح: {uploadedFileName}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '0.3rem', color: '#047857' }}>
                سيتم مطابقة المؤشرات وتوليد التقييمات لشهر {currentMonthObj.month} فور معالجة الملف.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
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
              👥 كادر المعلمين المعتمد لتقييم شهر {currentMonthObj.month} (52 معلماً):
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
              تمت تهيئة سجلات المعلمين والأقسام الأكاديمية لاستقبال بيانات نشاط نظام قطر للتعليم فور اعتماد التقرير.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', padding: '0.6rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {SEPTEMBER_2026_LMS_TEACHERS.slice(0, 24).map((t, idx) => (
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
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>نطاق الكادر الفعلي</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0.2rem 0' }}>
            52 <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>/ 61 اسماً</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3B82F6' }}>
            43 ببيانات نشاط + 9 دون بيانات نشاط + 9 خارج النطاق
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>التقديرات الإدارية المعتمدة</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857', margin: '0.2rem 0' }}>
            28 <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>تقديراً معتمداً</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10B981' }}>
            7 ممتاز (مهندسون ومختبرات) · 21 جيد جداً (تصميم، صف 12، دون بيانات)
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>تغطية التقييمات</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#5B21B6', margin: '0.2rem 0' }}>
            43.1% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>(81 / 188)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8B5CF6' }}>
            14 تغطية كاملة · 9 جزئية · 107 سجلات تحتاج تحققاً
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>إسناد التقييمات وحلها</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0.2rem 0' }}>
            58.1% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>حل مرجح</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#00B4D8' }}>
            124 مسنداً من 147 (84.4%) · 23 تقييماً غير مسند
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>نسبة تصحيح التسليمات</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#92400E', margin: '0.2rem 0' }}>
            78.2% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>(875 / 1,119)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#B45309' }}>
            244 تسليماً معلقاً (199 منها لدى أعلى 6 معلمين)
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 0, borderRight: '4px solid #EC4899' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>الدروس المسجلة والمستوفية</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#831843', margin: '0.2rem 0' }}>
            62.5% <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>(629 / 1,006)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#DB2777' }}>
            581 درساً ظاهراً · 425 مخفياً · 33 سجلاً بلا دروس
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
                  {TOP_10_INDEX_TEACHERS.map(t => {
                    const fullRecord = SEPTEMBER_2026_LMS_TEACHERS.find(r => r.name === t.name);
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
              {DEPARTMENT_PERFORMANCE_LIST.filter(d => d.topTeacher && !d.topTeacher.includes('—')).map((dept, idx) => (
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
                    {TOP_LESSONS_TEACHERS.map((t, idx) => (
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
                    {TOP_GRADED_TEACHERS.map((t, idx) => (
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
                {DEPARTMENT_PERFORMANCE_LIST.map((d, idx) => (
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
                  {ADMINISTRATIVE_RATINGS_LIST.map((t, idx) => (
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
                  {FOLLOWUP_PENDING_TEACHERS.slice(0, 6).map((t, idx) => (
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
                  {FOLLOWUP_PARTIAL_TEACHERS.map((t, idx) => (
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
                  {UNASSIGNED_EVAL_TEACHERS.map((t, idx) => (
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
                  {ZERO_LESSON_TEACHERS.map((t, idx) => (
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
                          {sysId && (
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
            {GRADE_LEVEL_LMS_STATS.map((g, idx) => (
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
              {findSystemTeacherId(selectedTeacherModal.name) && (
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
