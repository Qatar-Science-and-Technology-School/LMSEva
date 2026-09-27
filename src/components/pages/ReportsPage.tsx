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
import type { User, Teacher, Evaluation, Department } from '@/lib/data';
import { loadEventsMeetings, EventMeetingItem, EVENT_CATEGORY_CONFIG, EVENT_TYPE_CONFIG, EVENT_STATUS_CONFIG } from '@/lib/eventsMeetingsData';
import { printComprehensiveLmsReport } from '@/lib/comprehensiveReportPrinter';
import { printClassSubjectMonthlyReport, printSectionsReport, printSubjectsReport } from '@/lib/classSubjectReportPrinter';
import { printComprehensiveEventsMeetingsReport } from '@/lib/eventsMeetingsReportPrinter';
import * as XLSX from 'xlsx';
import {
  Monitor, Layers, Award, BookOpen, Target, Sparkles, Zap, ShieldCheck, Cpu, Database, CheckCircle2, ListTodo, GraduationCap, Trophy, BarChart3, Settings, ClipboardList, ShieldAlert, Users, Calendar, Building, Laptop, MapPin, Clock, Printer, Download, FileSpreadsheet, Filter, Search, FileText, ChevronRight, AlertTriangle, ArrowUpDown, PieChart as PieChartIcon
} from 'lucide-react';

interface Props { currentUser: User; selectedYear?: string; }

type ReportCategory = 
  | 'executive' 
  | 'qes' 
  | 'classes' 
  | 'model_lessons' 
  | 'pd' 
  | 'events' 
  | 'takreem' 
  | 'sms' 
  | 'benchmarks';

type ReportType = 
  | 'executive_all'
  | 'monthly' 
  | 'annual' 
  | 'dept' 
  | 'followup' 
  | 'progress' 
  | 'classes_subjects'
  | 'classes_sections'
  | 'classes_grades'
  | 'classes_intervention'
  | 'modellessons'
  | 'pd_workshops'
  | 'pd_individual'
  | 'events_meetings'
  | 'takreem_honors'
  | 'elearning_sms'
  | 'comparison' 
  | 'threeyear' 
  | 'highperf' 
  | 'elearning';

interface ReportMeta {
  id: ReportType;
  category: ReportCategory;
  label: string;
  icon: string;
  desc: string;
}

const ALL_REPORTS: ReportMeta[] = [
  // 1. Executive
  { id: 'executive_all', category: 'executive', label: 'التقرير التنفيذي الشامل للمدرسة', icon: '🌐', desc: 'تقرير موحد يضم كافة أنظمة ومنظومات المدرسة' },

  // 2. QES
  { id: 'monthly',      category: 'qes', label: 'تقرير شهري للمعلمين (QES)', icon: '📅', desc: 'أداء وتقييم المعلمين خلال شهر محدد' },
  { id: 'annual',       category: 'qes', label: 'تقرير سنوي تراكمي للمعلمين', icon: '📆', desc: 'ملخص الأداء السنوي التراكمي الشامل' },
  { id: 'dept',         category: 'qes', label: 'تقرير تقييم الأقسام الأكاديمية', icon: '🏫', desc: 'أداء معلمي كل قسم أكاديمي على حدة' },
  { id: 'followup',     category: 'qes', label: 'تقرير المعلمين ذوي الاحتياج للدعم', icon: '⚠️', desc: 'المعلمون الذين أداؤهم دون 80% مع التوصيات' },
  { id: 'progress',     category: 'qes', label: 'منحنى تطور أداء المعلم الفردي', icon: '📈', desc: 'التطور الشهري التراكمي لمعلم محدد' },

  // 3. Classes & Subjects
  { id: 'classes_subjects',     category: 'classes', label: 'تحليل المواد الدراسية الـ 13', icon: '📚', desc: 'نسب إتقان المواد والواجبات والتقييمات' },
  { id: 'classes_sections',     category: 'classes', label: 'تحليل الشعب والفصول الـ 8', icon: '🏢', desc: 'تفاعل الشعب العاشر والحادي عشر وحل الواجبات' },
  { id: 'classes_grades',       category: 'classes', label: 'تحليل المستويات والصفوف الدراسية', icon: '🎓', desc: 'مقارنة الأداء العام بين الصفوف الأكاديمية' },
  { id: 'classes_intervention', category: 'classes', label: 'خطة التدخل الأكاديمي ودعم الطلاب', icon: '🎯', desc: 'متابعة الطلاب ذوي الأداء المنخفض وجلسات الدعم' },

  // 4. Model Lessons
  { id: 'modellessons', category: 'model_lessons', label: 'حصص التعليم الإلكتروني والمشاهدات', icon: '💻', desc: 'المشاهدات الصفية وتوظيف التقنيات والذكاء الاصطناعي' },

  // 5. PD
  { id: 'pd_workshops',  category: 'pd', label: 'ورش وبرامج التطوير المهني الجماعية', icon: '🎓', desc: 'البرامج التدريبية المعتمدة وساعات التدريب' },
  { id: 'pd_individual', category: 'pd', label: 'جلسات التدريب الفردي والتمكين الرقمي', icon: '💡', desc: 'الدعم التقني والتربوي الفردي للمعلمين' },

  // 6. Events
  { id: 'events_meetings', category: 'events', label: 'سجل الفعاليات والاجتماعات الرسمية', icon: '📅', desc: 'توثيق الـ 16 فعالية واجتماعاً معتمداً بالمقر والنوع' },

  // 7. Takreem
  { id: 'takreem_honors', category: 'takreem', label: 'لوحة الشرف وتكريم المعلمين والمتميزين', icon: '🏆', desc: 'معلمو الشهر المكرمون وجوائز التميز الأكاديمي' },

  // 8. SMS
  { id: 'elearning_sms', category: 'sms', label: 'سجل الرسائل والتنبيهات المدرسية (SMS)', icon: '📱', desc: 'الرسائل التوجيهية وتفاعل أولياء الأمور والطلاب' },

  // 9. Benchmarks
  { id: 'comparison', category: 'benchmarks', label: 'مقارنة الأداء بين الأقسام الأكاديمية', icon: '⚖️', desc: 'تحليل تنافسي مقارن بين كافة أقسام المدرسة' },
  { id: 'highperf',   category: 'benchmarks', label: 'تقرير الأقسام الأربعة الرئيسية', icon: '⭐', desc: 'أداء الأقسام الرئيسية (عربي، شرعية، حاسوب، رياضيات)' },
  { id: 'threeyear',  category: 'benchmarks', label: 'التطور التراكمي لآخر ثلاث سنوات', icon: '📊', desc: 'منحنى أداء المعلم والمدرسة عبر الأعوام الأكاديمية' },
  { id: 'elearning',  category: 'benchmarks', label: 'تقرير نظام التعليم الإلكتروني والحلول الرقمية', icon: '📘', desc: 'البنية الفنية وأهداف النظام وإحصاءات التفعيل' },
];

const CATEGORY_TABS: { id: ReportCategory; label: string; icon: string }[] = [
  { id: 'executive',     label: 'التقرير التنفيذي الشامل', icon: '🌐' },
  { id: 'qes',           label: 'نظام قطر للتعليم',       icon: '📝' },
  { id: 'classes',       label: 'تحليل الشعب والمواد',    icon: '🏫' },
  { id: 'model_lessons', label: 'حصص التعليم الإلكتروني', icon: '💻' },
  { id: 'pd',            label: 'التطوير المهني',         icon: '🎓' },
  { id: 'events',        label: 'الفعاليات والاجتماعات',  icon: '📅' },
  { id: 'takreem',       label: 'تكريم المعلمين',         icon: '🏆' },
  { id: 'sms',           label: 'الرسائل (SMS)',          icon: '📱' },
  { id: 'benchmarks',    label: 'المقارنات والمؤشرات',    icon: '📊' },
];

// ─── Pure SVG Bar Chart (print-safe) ───────────────────────────────────────
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

// ─── Pure SVG Line Chart (print-safe) ──────────────────────────────────────
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

// ─── Official Centered Report Header (Ministry & School Centered) ────────────
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

// ─── KPI Cards Row ─────────────────────────────────────────────────────────
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

// ─── Performance Badge ─────────────────────────────────────────────────────
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

// ─── Progress Bar ──────────────────────────────────────────────────────────
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

// ─── Official Signatures Footer (Centered & Verified) ──────────────────────
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

// ─── Table Wrapper ─────────────────────────────────────────────────────────
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

// ─── Main Component ────────────────────────────────────────────────────────
export default function ReportsPage({ currentUser, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [individualPDRecords, setIndividualPDRecords] = useState<any[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<any[]>([]);
  const [eventsItems, setEventsItems] = useState<EventMeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<ReportCategory>('executive');
  const [reportType, setReportType] = useState<ReportType>('executive_all');
  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState('سبتمبر');
  const [selDept, setSelDept] = useState('');
  const [selTeacherId, setSelTeacherId] = useState('');

  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);
  const coordLabel = getUserDeptLabel(currentUser, departments);
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  useEffect(() => { if (propYear) setSelYear(propYear); }, [propYear]);

  useEffect(() => {
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getDailyTasks().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getWorkshops().catch(() => []),
      db.getIndividualPDRecords().catch(() => []),
      db.getModelLessonEvaluations().catch(() => [])
    ])
      .then(([t, e, d, dt, ach, w, ipd, mle]) => {
        setTeachers(t);
        setEvaluations(e);
        setDepartments(d);
        setDailyTasks(dt);
        setAchievements(ach);
        setWorkshops(w);
        setIndividualPDRecords(ipd);
        setModelLessonEvals(mle);
        setEventsItems(loadEventsMeetings());
        setLoading(false);
        if (t.length > 0) setSelTeacherId(t[0].id);
      });
  }, []);

  const filteredTeachersList = useMemo(() => {
    if (isCoord && coordDepts.length > 0) return teachers.filter(t => coordDepts.includes(t.departmentId));
    return teachers;
  }, [teachers, isCoord, coordDepts]);

  // When active category changes, set reportType to first report in that category
  function handleSelectCategory(cat: ReportCategory) {
    setActiveCategory(cat);
    const firstRep = ALL_REPORTS.find(r => r.category === cat);
    if (firstRep) {
      setReportType(firstRep.id);
    }
  }

  // Reports visible under the selected category
  const availableReportsInCategory = useMemo(() => {
    return ALL_REPORTS.filter(r => r.category === activeCategory);
  }, [activeCategory]);

  // Compute QES Data
  const qesReportData = useMemo(() => {
    if (loading) return [];
    let yearEvals = evaluations.filter(e => e.academicYear === selYear);
    if (isCoord && coordDepts.length > 0) {
      const scopedIds = new Set(teachers.filter(t => coordDepts.includes(t.departmentId)).map(t => t.id));
      yearEvals = yearEvals.filter(e => scopedIds.has(e.teacherId));
    }

    switch (reportType) {
      case 'monthly': {
        let evs = yearEvals.filter(e => e.month === selMonth);
        if (selDept) evs = evs.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === selDept);
        return evs.map(ev => {
          const t = teachers.find(x => x.id === ev.teacherId);
          const dept = t ? getDeptName(t.departmentId, departments) : '-';
          const perf = getPerformanceLevel(ev.totalScore);
          return { ev, t, dept, perf };
        }).sort((a, b) => b.ev.totalScore - a.ev.totalScore);
      }
      case 'annual': {
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
      case 'dept': {
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
      case 'followup': {
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
      case 'progress': {
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
      case 'comparison': {
        const deptMap = new Map<string, Evaluation[]>();
        yearEvals.forEach(e => {
          const t = teachers.find(x => x.id === e.teacherId);
          if (t) { if (!deptMap.has(t.departmentId)) deptMap.set(t.departmentId, []); deptMap.get(t.departmentId)!.push(e); }
        });
        return availableDepts.map(d => {
          const evs = deptMap.get(d.id) || [];
          const scores = evs.map(e => e.totalScore);
          const avg = evs.length ? Math.round(scores.reduce((a, b) => a + b, 0) / evs.length * 10) / 10 : 0;
          return { deptId: d.id, nameAr: d.nameAr, teachersCount: teachers.filter(t => t.departmentId === d.id).length, evaluationsCount: evs.length, averageScore: avg, excellentCount: scores.filter(s => s >= 90).length, perf: getPerformanceLevel(avg) };
        }).filter(r => r.evaluationsCount > 0).sort((a, b) => b.averageScore - a.averageScore);
      }
      case 'threeyear': {
        const targetId = selTeacherId || (filteredTeachersList[0]?.id || '');
        if (!targetId) return [];
        const t = teachers.find(x => x.id === targetId);
        return ACADEMIC_YEARS.slice(-3).map(yr => {
          const evs = evaluations.filter(e => e.teacherId === targetId && e.academicYear === yr);
          const scores = evs.map(e => e.totalScore);
          const avg = evs.length ? Math.round(scores.reduce((a, b) => a + b, 0) / evs.length * 10) / 10 : 0;
          return { year: yr, t, dept: t ? getDeptName(t.departmentId, departments) : '-', count: evs.length, averageScore: avg, perf: getPerformanceLevel(avg) };
        }).filter(r => r.count > 0);
      }
      case 'highperf': {
        return ['d_arabic', 'd_islamic', 'd_cs', 'd_math'].map(dId => {
          const d = departments.find(x => x.id === dId);
          if (!d) return null;
          const evs = yearEvals.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === dId);
          const scores = evs.map(e => e.totalScore);
          const avg = evs.length ? Math.round(scores.reduce((a, b) => a + b, 0) / evs.length * 10) / 10 : 0;
          return { deptId: dId, nameAr: d.nameAr, teachersCount: teachers.filter(t => t.departmentId === dId).length, evaluationsCount: evs.length, averageScore: avg, excellentCount: scores.filter(s => s >= 90).length, perf: getPerformanceLevel(avg) };
        }).filter(Boolean) as any[];
      }
      case 'modellessons': {
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
    if (!['monthly', 'annual', 'dept', 'executive_all', 'takreem_honors'].includes(reportType)) return [];
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (isCoord && coordDepts.length > 0) list = list.filter(h => coordDepts.includes(h.departmentId));
    if (reportType === 'dept' && selDept) list = list.filter(h => h.departmentId === selDept);
    return list;
  }, [reportType, selMonth, selYear, teachers, evaluations, departments, isCoord, coordDepts, selDept]);

  // Chart data
  const chartData = useMemo(() => {
    if (['monthly', 'annual', 'dept', 'modellessons'].includes(reportType)) {
      return qesReportData.slice(0, 12).map((r: any) => ({
        name: r.t?.nameAr || r.m?.teacherNameAr || 'معلم',
        value: r.ev ? r.ev.totalScore : r.averageScore !== undefined ? r.averageScore : Math.round((r.m?.overallScore || 0) * 10)
      }));
    }
    if (['comparison', 'highperf'].includes(reportType)) {
      return qesReportData.map((r: any) => ({ name: r.nameAr, value: r.averageScore }));
    }
    if (reportType === 'progress') {
      return qesReportData.map((r: any) => ({ name: r.monthName, value: r.ev.totalScore }));
    }
    if (reportType === 'threeyear') {
      return qesReportData.map((r: any) => ({ name: r.year, value: r.averageScore }));
    }
    if (reportType === 'classes_subjects') {
      return SUBJECTS_LMS_STATS.map(s => ({ name: s.name, value: s.solveRate }));
    }
    if (reportType === 'classes_sections') {
      return SECTIONS_LMS_STATS.map(s => ({ name: s.section, value: s.solveRate }));
    }
    return [];
  }, [qesReportData, reportType]);

  // KPI Cards per report
  const kpiCards = useMemo(() => {
    if (reportType === 'executive_all') {
      return [
        { label: 'إجمالي المعلمين', value: teachers.length, color: '#0F2044', sub: 'موثقون بالمنظومة' },
        { label: 'متوسط أداء QES', value: '88.5%', color: '#10B981', sub: 'نسبة التفاعل العام' },
        { label: 'المواد والشعب', value: `${SUBJECTS_LMS_STATS.length} مادة / ${SECTIONS_LMS_STATS.length} شعب`, color: '#0284C7', sub: '160 طالباً مسجلاً' },
        { label: 'حصص التعليم الإلكتروني', value: modelLessonEvals.length || 18, color: '#7C3AED', sub: 'مشاهدات صفية معتمدة' },
        { label: 'الفعاليات والاجتماعات', value: eventsItems.length || 16, color: '#0D9488', sub: '75% نسبة الإنجاز والتوثيق' },
        { label: 'ورش وبرامج التدريب', value: workshops.length || 10, color: '#D97706', sub: '31 ساعة تدريبية' },
      ];
    }
    if (reportType === 'classes_subjects') {
      return [
        { label: 'إجمالي المواد المشمولة', value: SUBJECTS_LMS_STATS.length, color: '#0F2044', sub: 'عاشر وحادي عشر' },
        { label: 'نسبة تغطية الدروس', value: `${SEPTEMBER_2026_LMS_METRICS.lessonsCoveragePercent}%`, color: '#10B981', sub: 'تغطية شاملة' },
        { label: 'نسبة تغطية التقييمات', value: `${SEPTEMBER_2026_LMS_METRICS.evalCoveragePercent}%`, color: '#0284C7', sub: 'رصد معتمد' },
        { label: 'المادة الأعلى تفاعلاً', value: 'التربية البدنية (99%)', color: '#7C3AED', sub: 'تفاعل ممتاز' },
      ];
    }
    if (reportType === 'classes_sections') {
      return [
        { label: 'إجمالي الشعب الدراسية', value: SECTIONS_LMS_STATS.length, color: '#0F2044', sub: '8 شعب مدرسية' },
        { label: 'إجمالي الطلاب المستفيدين', value: '160 طالباً', color: '#0284C7', sub: 'طاقة استيعابية كاملة' },
        { label: 'الشعبة الأولى بالمدرسة', value: '9/1 (89%)', color: '#10B981', sub: 'وسام التميز للشعبة' },
        { label: 'متوسط تفاعل الشعب', value: '88.2%', color: '#D97706', sub: 'إنجاز أكاديمي ممتاز' },
      ];
    }
    if (reportType === 'classes_grades') {
      return [
        { label: 'المستويات الأكاديمية', value: GRADE_LEVEL_LMS_STATS.length, color: '#0F2044', sub: 'المراحل الدراسية' },
        { label: 'نسبة حل الصف 7', value: `${GRADE_LEVEL_LMS_STATS[0]?.solveRate || 70.6}%`, color: '#0284C7', sub: 'تغطية منتظمة' },
        { label: 'نسبة حل الصف 9', value: `${GRADE_LEVEL_LMS_STATS[1]?.solveRate || 71.3}%`, color: '#10B981', sub: 'تغطية ممتازة' },
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
    if (reportType === 'events_meetings') {
      return [
        { label: 'إجمالي السجلات والأنشطة', value: eventsItems.length || 16, color: '#0F2044', sub: 'سجلات سبتمبر المعتمدة' },
        { label: 'اجتماعات العمل الرسمية', value: '8 اجتماعات', color: '#0284C7', sub: 'تنسيق أكاديمي وإداري' },
        { label: 'الفعاليات والمسابقات والورش', value: '5 فعاليات', color: '#7C3AED', sub: 'مشاركات ومنافسات' },
        { label: 'الزيارات والمهام الفنية', value: '3 سجلات', color: '#0D9488', sub: 'تبادل خبرات ومراجعات' },
        { label: 'السجلات المنفذة والموثقة', value: '12 (75%)', color: '#16A34A', sub: 'جاهزة ومعتمدة' },
        { label: 'النطاق والمقر', value: '9 داخلي • 7 خارجي', color: '#4338CA', sub: 'مقر المدرسة والوزارة' },
      ];
    }
    if (reportType === 'pd_workshops' || reportType === 'pd_individual') {
      return [
        { label: 'ورش العمل الجماعية', value: workshops.length || 10, color: '#0F2044', sub: 'تمكين رقمي وتربوي' },
        { label: 'جلسات التدريب الفردي', value: individualPDRecords.length || 24, color: '#0284C7', sub: 'دعم تقني وتطبيقي' },
        { label: 'إجمالي ساعات التدريب', value: '31 ساعة', color: '#D97706', sub: 'ساعات تدريبية موثقة' },
        { label: 'الحاصلون على MEEE', value: '8 معلمين', color: '#10B981', sub: 'معلم مايكروسوفت الخبير' },
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
    if (reportType === 'elearning_sms') {
      return [
        { label: 'إجمالي الرسائل المرسلة', value: '142 رسالة', color: '#0F2044', sub: 'تواصل إلكتروني رسمي' },
        { label: 'رسائل التنبيه الأكاديمي', value: '48 رسالة', color: '#EF4444', sub: 'متابعة أداء الطلاب' },
        { label: 'رسائل التكريم والتقدير', value: '35 رسالة', color: '#10B981', sub: 'تحفيز المتميزين' },
        { label: 'نسبة وصول الرسائل', value: '99.4%', color: '#0284C7', sub: 'تغطية ممتازة' },
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
  }, [reportType, teachers, qesReportData, modelLessonEvals, eventsItems, workshops, individualPDRecords, honorees]);

  // Export to Excel for any report
  function exportExcel() {
    let rows: any[] = [];
    let sheetName = 'التقرير الرسمي';

    if (reportType === 'executive_all') {
      rows = [
        { 'المجال والمحور': 'نظام قطر للتعليم (QES)', 'المؤشر الرئيسي': 'متوسط الأداء العام', 'القيمة المحققة': '88.5%', 'الحالة': 'ممتاز' },
        { 'المجال والمحور': 'تحليل المواد الدراسية', 'المؤشر الرئيسي': 'إجمالي المواد المشمولة', 'القيمة المحققة': `${SUBJECTS_LMS_STATS.length} مادة`, 'الحالة': 'مكتمل' },
        { 'المجال والمحور': 'تحليل الشعب والفصول', 'المؤشر الرئيسي': 'معدل تفاعل الطلاب في الفصول', 'القيمة المحققة': '88.2%', 'الحالة': 'ممتاز' },
        { 'المجال والمحور': 'حصص التعليم الإلكتروني', 'المؤشر الرئيسي': 'المشاهدات الصفية المعتمدة', 'القيمة المحققة': `${modelLessonEvals.length || 18} حصة`, 'الحالة': 'موثقة' },
        { 'المجال والمحور': 'الفعاليات والاجتماعات', 'المؤشر الرئيسي': 'السجلات والأنشطة الرسمية', 'القيمة المحققة': `${eventsItems.length || 16} نشاطاً (75% منجز)`, 'الحالة': 'معتمد' },
        { 'المجال والمحور': 'التطوير المهني', 'المؤشر الرئيسي': 'ورش التدريب والتمكين', 'القيمة المحققة': `${workshops.length || 10} ورشة / 31 ساعة`, 'الحالة': 'نشط' },
        { 'المجال والمحور': 'لوحة الشرف وتكريم المعلمين', 'المؤشر الرئيسي': 'المكرمون لهذا الشهر', 'القيمة المحققة': `${honorees.length || 10} معلمين`, 'الحالة': 'مكرمون' },
      ];
    } else if (reportType === 'classes_subjects') {
      rows = SUBJECTS_LMS_STATS.map((s, idx) => ({
        '#': idx + 1,
        'المادة الدراسية': s.name,
        'المعلمون النشطون': s.teachersCount,
        'سجلات التقييم': s.evalRecords,
        'إجمالي التقييمات': s.evalsCount,
        'التسليمات المستلمة': s.submissions,
        'معدل الحل': `${s.solveRate}%`,
        'معدل التصحيح': `${s.gradingRate}%`,
        'المعلقات': s.ungraded,
        'الدروس المرفوعة': s.lessonTotal
      }));
    } else if (reportType === 'classes_sections') {
      rows = SECTIONS_LMS_STATS.map((s, idx) => ({
        '#': idx + 1,
        'الشعبة': s.section,
        'المرحلة': s.grade,
        'عدد الطلاب': s.studentsCount,
        'التقييمات': s.evalCount,
        'التسليمات': s.submissions,
        'معدل الحل': `${s.solveRate}%`,
        'معدل التصحيح': `${s.gradingRate}%`,
        'الترتيب': s.rank,
        'تصنيف التقييم': s.evalClass
      }));
    } else if (reportType === 'events_meetings') {
      rows = eventsItems.map((e, idx) => ({
        '#': idx + 1,
        'العنوان': e.title,
        'التصنيف': e.category,
        'النوع': e.type,
        'المقر': e.location,
        'التاريخ': e.date,
        'الوقت': e.time,
        'المستهدفون': e.targetAudience,
        'طبيعة النشاط': e.nature,
        'الحالة': e.status
      }));
    } else if (reportType === 'monthly') {
      rows = qesReportData.map(({ ev, t, dept, perf }: any) => ({
        'اسم المعلم': t?.nameAr || '-',
        'الرقم الوظيفي': t?.employeeId || '-',
        'القسم': dept,
        'الشهر': ev.month,
        'المجموع': ev.totalScore,
        'مستوى الأداء': perf.label,
        'نقاط القوة': ev.strengths || '-',
        'التوصيات': ev.recommendations || '-'
      }));
    } else if (reportType === 'modellessons') {
      rows = qesReportData.map((r: any, i: number) => ({
        '#': i + 1,
        'اسم المعلم': r.t?.nameAr || r.m.teacherNameAr,
        'القسم': r.dept,
        'تاريخ الحصة': r.m.date,
        'الحصة': r.m.period,
        'الصف': r.m.classGrade,
        'الأدوات الرقمية': r.m.toolsUsed,
        'الدرجة (من 10)': r.m.overallScore,
        'مستوى الأداء': r.perf.label
      }));
    } else {
      rows = qesReportData.map((r: any) => ({
        'المعلم / القسم': r.t?.nameAr || r.nameAr || '-',
        'المتوسط': r.averageScore || r.ev?.totalScore || 0,
        'المستوى': r.perf?.label || '-'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `تقرير_${reportType}_${selYear}_${selMonth}.xlsx`);
  }

  const currentReportMeta = ALL_REPORTS.find(r => r.id === reportType) || ALL_REPORTS[0];
  const selectedTeacherObj = teachers.find(t => t.id === selTeacherId);

  const reportSubtitleText = [
    `العام الأكاديمي: ${selYear}`,
    selMonth ? `الشهر: ${selMonth}` : '',
    selectedTeacherObj && ['progress', 'threeyear'].includes(reportType) ? `المعلم: ${selectedTeacherObj.nameAr}` : '',
    selDept && ['dept', 'monthly', 'annual', 'followup'].includes(reportType) ? `القسم: ${getDeptName(selDept, departments)}` : '',
  ].filter(Boolean).join('  |  ');

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#0F2044', fontWeight: 600 }}>
      <div style={{ display: 'inline-block', width: '2.5rem', height: '2.5rem', border: '4px solid #00B4D8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
      <div>⏳ جاري إعداد وتجهيز مصفوفة التقارير الرسمية الشاملة...</div>
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
              <span>مركز التقارير الرسمية الشاملة لكافة أقسام ومنظومات المدرسة</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.3rem 0 0' }}>
              المنصة المركزية المعتمدة لاستخراج وطباعة وتصدير كافة تقارير المدرسة بدقة A3 رسمية (0 Margins).
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => printComprehensiveLmsReport({ monthName: selMonth, academicYear: selYear })}
              style={{
                background: '#0F2044',
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
                boxShadow: '0 2px 6px rgba(15,32,68,0.2)'
              }}
            >
              <Printer size={15} />
              <span>تقرير QES المعتمد</span>
            </button>
            <button
              onClick={() => printClassSubjectMonthlyReport({ monthName: selMonth, academicYear: selYear })}
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
              <span>تقرير الشعب والمواد</span>
            </button>
            <button
              onClick={() => printComprehensiveEventsMeetingsReport(eventsItems, { academicYear: selYear })}
              style={{
                background: '#16A34A',
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
                boxShadow: '0 2px 6px rgba(22,163,74,0.2)'
              }}
            >
              <Calendar size={15} />
              <span>تقرير الفعاليات (16)</span>
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

        {/* ── Specific Report Selector Buttons ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          {availableReportsInCategory.map(r => {
            const isSelected = reportType === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setReportType(r.id)}
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${isSelected ? '#0284C7' : '#E2E8F0'}`,
                  background: isSelected ? 'linear-gradient(135deg, #0F2044 0%, #0369A1 100%)' : '#fff',
                  color: isSelected ? '#FFFFFF' : '#1E293B',
                  textAlign: 'right',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.2)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.15rem', marginTop: '0.1rem' }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>{r.label}</div>
                  <div style={{ fontSize: '0.68rem', color: isSelected ? '#BAE6FD' : '#64748B', marginTop: '0.15rem' }}>
                    {r.desc}
                  </div>
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

          {/* Month */}
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

          {/* Department Filter (when applicable) */}
          {['monthly', 'annual', 'dept', 'followup', 'modellessons', 'executive_all'].includes(reportType) && (
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
          {['progress', 'threeyear'].includes(reportType) && (
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
          reportCode={`QES-REP-${reportType.toUpperCase()}-${selYear.replace('/', '-')}`}
        />

        {/* KPI Cards Row */}
        {kpiCards.length > 0 && <KpiCards cards={kpiCards} />}

        {/* ── Monthly Honorees Ribbon (If applicable) ── */}
        {honorees.length > 0 && ['monthly', 'annual', 'dept', 'executive_all', 'takreem_honors'].includes(reportType) && (
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

        {/* ── Visual Graphics / Charts (If data available) ── */}
        {chartData.length > 0 && !['classes_intervention', 'events_meetings'].includes(reportType) && (
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
            {reportType === 'progress' ? (
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

          {/* 1. EXECUTIVE ALL-IN-ONE REPORT */}
          {reportType === 'executive_all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                <h5 style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F2044', margin: '0 0 0.5rem' }}>
                  📌 الخلاصة التنفيذية لأداء المدرسة
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  تُظهر مؤشرات شهر {selMonth} للعام الأكاديمي {selYear} تفاعلاً ممتازاً لمنظومة التعلم الرقمي بنسبة إتقان عامة بلغت 88.5%، مع انتظام كامل في رصد الواجبات والتقييمات، وتغطية 13 مادة دراسية عبر 8 شعب صفية. كما شهد الشهر تنفيذ وتوثيق 16 فعالية واجتماعاً رسمياً (بنسبة إنجاز 75%)، و18 مشاهدة صفية لحصص التعليم الإلكتروني، إضافة إلى 10 ورش عمل للتطوير المهني.
                </p>
              </div>

              {/* Sub-table 1: Highest Performing Departments */}
              <div>
                <h5 style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F2044', marginBottom: '0.5rem' }}>
                  🏆 أعلى الأقسام الأكاديمية تفاعلاً بنظام قطر للتعليم (QES)
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

          {/* 2. CLASSES & SUBJECTS: SUBJECTS TABLE */}
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

          {/* 3. CLASSES & SUBJECTS: SECTIONS TABLE */}
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

          {/* 4. CLASSES & SUBJECTS: GRADES COMPARISON TABLE */}
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

          {/* 5. CLASSES & SUBJECTS: ACADEMIC INTERVENTION PLAN */}
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

          {/* 6. EVENTS & MEETINGS (16 OFFICIAL ACTIVITIES) */}
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

          {/* 7. MODEL LESSONS EVALUATION */}
          {reportType === 'modellessons' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم الأكاديمي', 'تاريخ الحصة', 'الحصة والصف', 'الأدوات والتقنيات الرقمية', 'الدرجة (من 10)', 'مستوى التقييم']}
              emptyMsg="لا توجد حصص مسجلة لهذا العام."
              rows={qesReportData.map((r: any, i: number) => [
                <span style={{ fontWeight: 700, color: '#64748B' }}>{i + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || r.m.teacherNameAr}</span>,
                <span>{r.dept}</span>,
                <span>{r.m.date}</span>,
                <span>الحصة {r.m.period} — {r.m.classGrade}</span>,
                <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>{r.m.toolsUsed}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.m.overallScore} / 10</span>,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* 8. PROFESSIONAL DEVELOPMENT: WORKSHOPS & INDIVIDUAL */}
          {(reportType === 'pd_workshops' || reportType === 'pd_individual') && (
            <ReportTable
              headers={['#', 'عنوان الورشة / جلسة التدريب', 'المستهدفون', 'التاريخ والمدة', 'ساعات التدريب', 'المقدم والمدرب', 'الحالة والتوثيق']}
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

          {/* 9. TAKREEM & HONORS */}
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

          {/* 10. E-LEARNING SMS */}
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

          {/* 11. MONTHLY QES TEACHERS */}
          {reportType === 'monthly' && (
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

          {/* 12. ANNUAL CUMULATIVE */}
          {reportType === 'annual' && (
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

          {/* 13. DEPARTMENT LEVEL */}
          {reportType === 'dept' && (
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

          {/* 14. FOLLOWUP REPORT */}
          {reportType === 'followup' && (
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

          {/* 15. TEACHER PROGRESS CURVE */}
          {reportType === 'progress' && (
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

          {/* 16. DEPARTMENT COMPARISON */}
          {(reportType === 'comparison' || reportType === 'highperf') && (
            <ReportTable
              headers={['#', 'القسم الأكاديمي', 'عدد المعلمين', 'إجمالي التقييمات', 'المتوسط %', 'مؤشر المقارنة', 'المتميزون (≥90%)', 'المستوى العام']}
              emptyMsg="لا توجد بيانات للأقسام."
              rows={qesReportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.nameAr}</span>,
                <span>{r.teachersCount}</span>,
                <span>{r.evaluationsCount}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <span style={{ fontWeight: 700, color: '#10B981' }}>{r.excellentCount} معلم</span>,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* 17. THREE YEAR CUMULATIVE */}
          {reportType === 'threeyear' && (
            <ReportTable
              headers={['العام الأكاديمي', 'المعلم', 'القسم', 'عدد التقييمات', 'المتوسط التراكمي %', 'مؤشر النمو', 'المستوى العام']}
              emptyMsg="لا توجد بيانات تراكمية سابقة."
              rows={qesReportData.map((r: any) => [
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.year}</span>,
                <span style={{ fontWeight: 700 }}>{r.t?.nameAr}</span>,
                <span>{r.dept}</span>,
                <span>{r.count}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* 18. ELEARNING ARCHITECTURE & DESIGNER CREDIT */}
          {reportType === 'elearning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ReportTable
                headers={['العنصر الفني والمنظومة', 'الوصف التفصيلي وحالة التفعيل']}
                emptyMsg="لا توجد بيانات."
                rows={[
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>رؤية وأهداف المنظومة</span>, <span>نظام إلكتروني موحد يربط كافة جوانب التعليم الإلكتروني، تقييم تفعيل منصة قطر للتعليم، إدارة الحصص النموذجية، وتحليل أداء الشعب والمواد.</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>المعلمون النشطون الموثقون</span>, <span style={{ fontWeight: 700 }}>{teachers.length} معلماً بكافة الأقسام الأكاديمية</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>التقييمات والمتابعات الشهرية</span>, <span style={{ fontWeight: 700 }}>{evaluations.length} تقييماً مرصوداً وموثقاً</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>حصص التعليم الإلكتروني والمشاهدات</span>, <span style={{ fontWeight: 700 }}>{modelLessonEvals.length} حصة نموذجية معتمدة</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>الفعاليات والاجتماعات الرسمية</span>, <span style={{ fontWeight: 700 }}>{eventsItems.length} فعالية واجتماعاً موثقاً</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>ورش التطوير المهني</span>, <span style={{ fontWeight: 700 }}>{workshops.length} ورشة عمل تدريبية</span>],
                  [<span style={{ fontWeight: 800, color: '#0F2044' }}>مطور النظام ومنسق المشاريع</span>, <span style={{ fontWeight: 800, color: '#0284C7' }}>{DESIGNER_CREDIT}</span>],
                ]}
              />
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
