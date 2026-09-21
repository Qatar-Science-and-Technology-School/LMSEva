import React, { useState, useMemo, useEffect } from 'react';
import {
  db,
  MONTHS,
  ACADEMIC_YEARS,
  QES_LMS_CRITERIA,
  getPerformanceLevel,
  getDeptName,
  generateId,
  SCHOOL_NAME,
  getUserDeptIds,
  SEPTEMBER_2026_LMS_METRICS,
  SEPTEMBER_2026_LMS_TEACHERS,
  GRADE_LEVEL_LMS_STATS,
  TOP_OVERALL_TEACHERS,
  TOP_DEPT_TEACHERS,
  TOP_LESSONS_TEACHERS,
  TOP_GRADED_TEACHERS,
  FOLLOWUP_PENDING_TEACHERS,
  FOLLOWUP_PARTIAL_TEACHERS,
  UNASSIGNED_EVAL_TEACHERS,
  ZERO_LESSON_TEACHERS,
  generateSeptember2026Evaluations,
  isExcludedTeacher,
  type LmsReportTeacherRecord
} from '@/lib/data';
import { saveDocument, COLLECTIONS, invalidateCache } from '@/lib/firestoreDb';
import type { User, EvaluationCriterion, Teacher, Department, Evaluation } from '@/lib/data';
import * as XLSX from 'xlsx';
import { OfficialReportHeader } from './PDReports';
import { Download, Printer } from 'lucide-react';
import { RichBulletTextarea, FormattedReportPoints } from '@/components/RichBulletTextarea';
import PlatformReportTab from './PlatformReportTab';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
  PieChart, Pie,
  Cell
} from 'recharts';

interface Props {
  currentUser: User;
  selectedYear?: string;
  onNavigateToPage?: (page: string) => void;
}

const DEPT_COORDINATORS: Record<string, string> = {
  d_stem: 'أحمد عقله فارس فارس',
  d_research: 'د. محمد عمر سلامة',
  d_cs: 'روي جورج مخول',
  d_pe: 'طاهر كمال الحلو',
  d_techdesign: 'أحمد أسامة المعاني',
  d_arabic: 'اسعد محمود ناعس',
  d_islamic: 'ماهر عيسى حسن علوان',
  d_english: 'يوسف دحمان',
  d_math: 'يامن فرح فرح',
  d_fablab: 'علي سالم الصيعري / إياد سلمان',
  d_robotlab: 'إياد محمود سلامة / محمود علم إقبال',
  d_energylab: 'أنس عبدالكريم جرادات / إبراهيم النعيمي',
  d_elearning: 'م. أحمد طبيشات',
};

const TERMS = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'];
const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const EMPTY_CRITERIA = (): EvaluationCriterion[] =>
  QES_LMS_CRITERIA.map(c => {
    if (c.type === 'boolean') return { score: 20, note: '', value: 'نعم' };
    if (c.type === 'descriptive') return { score: 0, note: '', value: 'نعم' };
    return { score: 18, note: '' };
  });

interface DeptRankingItem {
  deptId: string;
  deptName: string;
  coordinator: string;
  avgScore: number;
  evalCount: number;
  teacherCount: number;
  excellenceRate: number;
}

function SchoolDeptBarsChart({ data }: { data: DeptRankingItem[] }) {
  const half = Math.ceil(data.length / 2);
  const col1 = data.slice(0, half);
  const col2 = data.slice(half);

  const renderItem = (item: DeptRankingItem, idx: number, overallIdx: number) => {
    const isTop3 = overallIdx < 3;
    const badge = overallIdx === 0 ? '🥇' : overallIdx === 1 ? '🥈' : overallIdx === 2 ? '🥉' : `${overallIdx + 1}.`;
    const barColor = item.avgScore >= 90 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)'
      : item.avgScore >= 80 ? 'linear-gradient(90deg, #0F2044 0%, #0096C7 100%)'
      : item.avgScore >= 70 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)'
      : 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)';
    const textColor = item.avgScore >= 90 ? '#065F46'
      : item.avgScore >= 80 ? '#1E40AF'
      : item.avgScore >= 70 ? '#92400E'
      : '#991B1B';

    return (
      <div key={item.deptId} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
        <div style={{ width: '135px', minWidth: '135px', display: 'flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isTop3 ? '#B45309' : '#64748B', width: '20px', textAlign: 'center', flexShrink: 0 }}>
            {badge}
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0F2044', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.deptName}>
            {item.deptName}
          </span>
        </div>
        <div style={{ flex: 1, background: '#F1F5F9', height: '11px', borderRadius: '6px', overflow: 'hidden', position: 'relative', border: '1px solid #E2E8F0' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, item.avgScore))}%`,
              height: '100%',
              background: barColor,
              borderRadius: '6px'
            }}
          />
        </div>
        <div style={{ width: '38px', minWidth: '38px', textAlign: 'left', fontWeight: 900, fontSize: '0.74rem', color: textColor }}>
          {item.avgScore > 0 ? `${item.avgScore}%` : '-'}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', padding: '0.2rem 0.4rem' }}>
      <div>{col1.map((item, idx) => renderItem(item, idx, idx))}</div>
      <div>{col2.map((item, idx) => renderItem(item, idx, half + idx))}</div>
    </div>
  );
}

interface RadarItem {
  subject: string;
  score: number;
  fullMark: number;
}

function SchoolRadarChart({ data }: { data: RadarItem[] }) {
  if (!data || data.length === 0) return null;

  const N = data.length;
  const cx = 150;
  const cy = 95;
  const R = 58;

  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, fraction: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / N;
    return {
      x: cx + R * fraction * Math.cos(angle),
      y: cy + R * fraction * Math.sin(angle),
      angle
    };
  };

  const points = data.map((item, i) => {
    const fraction = Math.min(1, Math.max(0, item.score / (item.fullMark || 20)));
    const { x, y } = getCoordinates(i, fraction);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <svg width="300" height="190" viewBox="0 0 300 190" style={{ overflow: 'visible' }}>
        {levels.map((lvl, lIdx) => {
          const polyPts = data.map((_, i) => {
            const { x, y } = getCoordinates(i, lvl);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={`grid-${lIdx}`}
              points={polyPts}
              fill={lIdx === levels.length - 1 ? '#F8FAFC' : 'none'}
              stroke="#CBD5E1"
              strokeWidth={lIdx === levels.length - 1 ? '1.2' : '0.8'}
              strokeDasharray={lIdx === levels.length - 1 ? undefined : '2 2'}
            />
          );
        })}

        {data.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#94A3B8"
              strokeWidth="0.9"
            />
          );
        })}

        <polygon
          points={points}
          fill="rgba(0, 150, 199, 0.35)"
          stroke="#0096C7"
          strokeWidth="2"
        />

        {data.map((item, i) => {
          const fraction = Math.min(1, Math.max(0, item.score / (item.fullMark || 20)));
          const { x, y } = getCoordinates(i, fraction);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r="3.5"
              fill="#0F2044"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {data.map((item, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
          const labelDist = R + 18;
          const lx = cx + labelDist * Math.cos(angle);
          const ly = cy + labelDist * Math.sin(angle);

          const cos = Math.cos(angle);
          const textAnchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';

          return (
            <g key={`lbl-${i}`}>
              <text
                x={lx}
                y={ly - 2}
                textAnchor={textAnchor}
                fontSize="8"
                fontWeight="700"
                fill="#0F2044"
                fontFamily="'IBM Plex Sans Arabic', sans-serif"
              >
                {item.subject}
              </text>
              <text
                x={lx}
                y={ly + 8}
                textAnchor={textAnchor}
                fontSize="7.5"
                fontWeight="900"
                fill="#0096C7"
                fontFamily="'IBM Plex Sans Arabic', sans-serif"
              >
                {item.score} / {item.fullMark || 20}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface DistributionItem {
  name: string;
  value: number;
}

function SchoolDonutChart({ data }: { data: DistributionItem[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const colors = [
    { fill: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'متميز (90-100%)' },
    { fill: '#0096C7', bg: '#EFF6FF', text: '#1E40AF', label: 'جيد جداً (80-89%)' },
    { fill: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'جيد (70-79%)' },
    { fill: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'يحتاج متابعة (<70%)' },
  ];

  const r = 42;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  let accumulatedDash = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.2rem 0.3rem', height: '100%' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {total > 0 ? (
            data.map((item, idx) => {
              const dash = (item.value / total) * circumference;
              const offset = -accumulatedDash;
              accumulatedDash += dash;
              const color = colors[idx]?.fill || '#94A3B8';

              return (
                <circle
                  key={`slice-${idx}`}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  transform="rotate(-90 60 60)"
                />
              );
            })
          ) : (
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />
          )}
          <text
            x="60"
            y="57"
            textAnchor="middle"
            fontSize="17"
            fontWeight="900"
            fill="#0F2044"
            fontFamily="'IBM Plex Sans Arabic', sans-serif"
          >
            {total}
          </text>
          <text
            x="60"
            y="71"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill="#64748B"
            fontFamily="'IBM Plex Sans Arabic', sans-serif"
          >
            تقييماً معتمداً
          </text>
        </svg>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {data.map((item, idx) => {
          const meta = colors[idx] || { fill: '#94A3B8', bg: '#F8FAFC', text: '#475569', label: item.name };
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={`legend-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: meta.bg,
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                border: `1px solid ${meta.fill}33`,
                fontSize: '0.72rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.fill, display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#0F2044' }}>{meta.label}</span>
              </div>
              <div style={{ fontWeight: 900, color: meta.text }}>
                {item.value} ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EvaluationPage({ currentUser, selectedYear: propYear, onNavigateToPage }: Props) {
  // ── 1. All State Hooks (MUST ALL BE AT TOP) ──
  const [teachers, setTeachersState] = useState<Teacher[]>([]);
  const [departments, setDepartmentsState] = useState<Department[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1] || '2026-2027';

  // Navigation subtabs
  const [mainTab, setMainTab] = useState<'platform_report' | 'form' | 'history' | 'reports' | 'directory'>('platform_report');
  const [reportLevel, setReportLevel] = useState<'teacher' | 'department' | 'school'>('teacher');

  // Platform Report State (September 2026)
  const [reportSubTab, setReportSubTab] = useState<'top_teachers' | 'followup' | 'full_table' | 'grades'>('top_teachers');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<LmsReportTeacherRecord | null>(null);
  const [reportSearch, setReportSearch] = useState('');
  const [reportDeptFilter, setReportDeptFilter] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('');
  const [isSyncingEvals, setIsSyncingEvals] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  // Form State
  const [teacherId, setTeacherId] = useState('');
  const [month, setMonth] = useState(MONTHS[0]);
  const [term, setTerm] = useState(TERMS[0]);
  const [year, setYear] = useState(propYear || currentYear);
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(EMPTY_CRITERIA());
  const [strengths, setStrengths] = useState('');
  const [improve, setImprove] = useState('');
  const [recommend, setRecommend] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [hasWeeklyAssignment, setHasWeeklyAssignment] = useState(true);
  const [evidence, setEvidence] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyDeptFilter, setHistoryDeptFilter] = useState('');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('');
  const [historyTermFilter, setHistoryTermFilter] = useState('');

  // Report State
  const [reportTeacherId, setReportTeacherId] = useState('');
  const [reportDeptId, setReportDeptId] = useState('');
  const [reportMonth, setReportMonth] = useState(MONTHS[0]);
  const [reportTerm, setReportTerm] = useState(TERMS[0]);
  const [reportPeriodType, setReportPeriodType] = useState<'month' | 'term' | 'annual'>('month');

  // Directory filter
  const [dirSearch, setDirSearch] = useState('');
  const [dirDeptFilter, setDirDeptFilter] = useState('');
  const [dirCategoryFilter, setDirCategoryFilter] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ── 2. User Permission & Filter Logic ──
  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = useMemo(() => getUserDeptIds(currentUser), [currentUser]);

  const canManageEvaluations = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'evaluator') return true;
    const email = (currentUser.email || '').toLowerCase().trim();
    if (
      email === 'a.tubaishat1704@education.qa' ||
      email === 'admin@school.qa' ||
      email === 'elearning@school.qa' ||
      email === 'evaluator@school.qa'
    ) return true;
    const name = (currentUser.name || '').trim();
    if (
      name.includes('طبيشات') ||
      name.includes('مدير النظام') ||
      name.includes('منسق المشاريع') ||
      name.includes('أخصائي التعليم')
    ) return true;
    return false;
  }, [currentUser]);

  const availableTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (isExcludedTeacher(t)) return false;
      if (t.status !== 'active') return false;
      if (!isCoord) return true;
      const deptIds: string[] = (t as any).departmentIds && (t as any).departmentIds.length > 0 ? (t as any).departmentIds : [t.departmentId];
      return deptIds.some((id: string) => coordDepts.includes(id));
    });
  }, [teachers, isCoord, coordDepts]);

  const existingEval = useMemo(() => {
    if (!teacherId) return null;
    return allEvaluations.find(e => e.teacherId === teacherId && e.month === month && e.academicYear === year) || null;
  }, [teacherId, month, year, allEvaluations]);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === teacherId);
  }, [teachers, teacherId]);

  const selectedTeacherEvals = useMemo(() => {
    if (!teacherId) return [];
    return allEvaluations
      .filter(e => e.teacherId === teacherId)
      .sort((a, b) => b.academicYear.localeCompare(a.academicYear) || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month));
  }, [teacherId, allEvaluations]);

  const totalRaw = useMemo(() => {
    return criteria.reduce((sum, c, i) => {
      const crit = QES_LMS_CRITERIA[i];
      if (crit && crit.type === 'descriptive') return sum;
      return sum + (Number(c.score) || 0);
    }, 0);
  }, [criteria]);

  const totalScore = useMemo(() => {
    return Math.min(100, Math.max(0, Math.round(totalRaw * 10) / 10));
  }, [totalRaw]);

  const avgScore = useMemo(() => {
    return Math.round((totalScore / 5) * 10) / 10;
  }, [totalScore]);

  const perf = useMemo(() => {
    return getPerformanceLevel(totalScore);
  }, [totalScore]);

  const deptName = useMemo(() => {
    return selectedTeacher ? getDeptName(selectedTeacher.departmentId, departments) : '-';
  }, [selectedTeacher, departments]);

  const filteredHistory = useMemo(() => {
    return allEvaluations.filter(ev => {
      if (year && ev.academicYear !== year) return false;
      if (historyMonthFilter && ev.month !== historyMonthFilter) return false;
      if (historyTermFilter && ev.term !== historyTermFilter) return false;
      const t = teachers.find(x => x.id === ev.teacherId);
      if (isCoord && coordDepts.length > 0) {
        const deptIds: string[] = (t as any)?.departmentIds && (t as any).departmentIds.length > 0 ? (t as any).departmentIds : [t?.departmentId];
        if (!deptIds.some((id: string) => coordDepts.includes(id))) return false;
      }
      if (historyDeptFilter && t?.departmentId !== historyDeptFilter) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const nameMatch = t?.nameAr.toLowerCase().includes(q) || t?.nameEn.toLowerCase().includes(q);
        const empMatch = t?.employeeId.includes(q);
        if (!nameMatch && !empMatch) return false;
      }
      return true;
    });
  }, [allEvaluations, year, historyMonthFilter, historyTermFilter, historyDeptFilter, historySearch, teachers, isCoord, coordDepts]);

  const filteredDirectory = useMemo(() => {
    return teachers.filter(t => {
      if (isCoord && coordDepts.length > 0) {
        const deptIds: string[] = (t as any)?.departmentIds && (t as any).departmentIds.length > 0 ? (t as any).departmentIds : [t?.departmentId];
        if (!deptIds.some((id: string) => coordDepts.includes(id))) return false;
      }
      if (dirDeptFilter && t.departmentId !== dirDeptFilter) return false;
      if (dirCategoryFilter && t.jobCategory !== dirCategoryFilter) return false;
      if (dirSearch) {
        const q = dirSearch.toLowerCase();
        return (
          t.nameAr.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.employeeId.includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teachers, dirDeptFilter, dirCategoryFilter, dirSearch, isCoord, coordDepts]);

  const filteredReportTeachers = useMemo(() => {
    return SEPTEMBER_2026_LMS_TEACHERS.filter(t => {
      if (reportDeptFilter && t.department !== reportDeptFilter) return false;
      if (reportCategoryFilter) {
        if (reportCategoryFilter === 'top_overall' && t.category !== 'top_overall') return false;
        if (reportCategoryFilter === 'top_aspect' && t.category !== 'top_aspect') return false;
        if (reportCategoryFilter === 'top_dept' && t.category !== 'top_dept') return false;
        if (reportCategoryFilter === 'followup_pending' && t.category !== 'followup_pending') return false;
        if (reportCategoryFilter === 'followup_partial' && t.category !== 'followup_partial') return false;
        if (reportCategoryFilter === 'followup_no_eval' && t.category !== 'followup_no_eval') return false;
      }
      if (reportSearch) {
        const q = reportSearch.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.subjectsAndSections.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reportSearch, reportDeptFilter, reportCategoryFilter]);

  const reportTeacher = useMemo(() => {
    return teachers.find(t => t.id === reportTeacherId) || teachers[0] || null;
  }, [teachers, reportTeacherId]);

  const reportTeacherEvals = useMemo(() => {
    if (!reportTeacher) return [];
    return allEvaluations.filter(e => {
      if (e.teacherId !== reportTeacher.id) return false;
      if (e.academicYear !== year) return false;
      if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
      if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
      return true;
    });
  }, [allEvaluations, reportTeacher, year, reportPeriodType, reportMonth, reportTerm]);

  const teacherRadarData = useMemo(() => {
    if (!reportTeacher) return [];
    const relevantEvals = reportTeacherEvals.length > 0
      ? reportTeacherEvals
      : allEvaluations.filter(e => e.teacherId === reportTeacher.id && e.academicYear === year);

    // Only include the 5 scored criteria in the radar chart
    return QES_LMS_CRITERIA.filter(c => c.type !== 'descriptive').map((c, i) => {
      let score = 0;
      if (relevantEvals.length > 0) {
        const sum = relevantEvals.reduce((acc, ev) => acc + (ev.criteria[i]?.score || 0), 0);
        score = Math.round((sum / relevantEvals.length) * 10) / 10;
      }
      return {
        subject: c.short,
        score,
        fullMark: 20,
      };
    });
  }, [reportTeacher, reportTeacherEvals, allEvaluations, year]);

  const teacherTrendData = useMemo(() => {
    if (!reportTeacher) return [];
    const tEvals = allEvaluations.filter(e => e.teacherId === reportTeacher.id && e.academicYear === year);
    return MONTHS.map(m => {
      const ev = tEvals.find(e => e.month === m);
      return {
        month: m,
        score: ev ? ev.totalScore : null,
      };
    });
  }, [reportTeacher, allEvaluations, year]);

  const reportDept = useMemo(() => {
    return departments.find(d => d.id === reportDeptId) || departments[0] || null;
  }, [departments, reportDeptId]);

  const deptCoordinatorName = useMemo(() => {
    return reportDept ? (DEPT_COORDINATORS[reportDept.id] || 'منسق القسم') : '-';
  }, [reportDept]);

  const deptTeachers = useMemo(() => {
    if (!reportDept) return [];
    return teachers.filter(t => t.departmentId === reportDept.id && t.status === 'active');
  }, [reportDept, teachers]);

  const deptComparisonData = useMemo(() => {
    if (!reportDept) return [];
    return deptTeachers.map(t => {
      const tEvals = allEvaluations.filter(e => {
        if (e.teacherId !== t.id || e.academicYear !== year) return false;
        if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
        if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
        return true;
      });
      const avg = tEvals.length > 0
        ? Math.round(tEvals.reduce((acc, ev) => acc + ev.totalScore, 0) / tEvals.length)
        : 0;
      return {
        name: t.nameAr.split(' ').slice(0, 2).join(' '),
        fullName: t.nameAr,
        score: avg,
        level: getPerformanceLevel(avg).label,
        count: tEvals.length,
        teacher: t,
      };
    }).sort((a, b) => b.score - a.score);
  }, [reportDept, deptTeachers, allEvaluations, year, reportPeriodType, reportMonth, reportTerm]);

  const deptAvgScore = useMemo(() => {
    const withScores = deptComparisonData.filter(d => d.score > 0);
    if (withScores.length === 0) return 0;
    return Math.round(withScores.reduce((acc, d) => acc + d.score, 0) / withScores.length);
  }, [deptComparisonData]);

  const schoolDeptRankings = useMemo(() => {
    return departments
      .filter(d => d.id !== 'd_admin')
      .map(d => {
        const dTeachers = teachers.filter(t => !isExcludedTeacher(t) && t.departmentId === d.id && t.status === 'active');
      const dEvals = allEvaluations.filter(e => {
        if (e.academicYear !== year) return false;
        if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
        if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
        const t = teachers.find(x => x.id === e.teacherId);
        return t?.departmentId === d.id;
      });
      const avg = dEvals.length > 0
        ? Math.round(dEvals.reduce((acc, ev) => acc + ev.totalScore, 0) / dEvals.length)
        : 0;
      const excellenceCount = dEvals.filter(e => e.totalScore >= 90).length;
      const rate = dEvals.length > 0 ? Math.round((excellenceCount / dEvals.length) * 100) : 0;

      const teacherStats = dTeachers.map(t => {
        const tEvals = dEvals.filter(e => e.teacherId === t.id);
        const latestEval = tEvals[0];
        const score = latestEval?.totalScore ?? 0;
        const level = latestEval?.performanceLevel || (score > 0 ? getPerformanceLevel(score).label : 'لم يُرصد');
        return {
          teacher: t,
          score,
          level,
          isEvaluated: !!latestEval,
          evalDate: latestEval?.evaluationDate || '-',
          notes: latestEval?.generalNotes || latestEval?.strengths || latestEval?.recommendations || 'مستوفي المتطلبات الوزارية'
        };
      }).sort((a, b) => b.score - a.score);

      return {
        deptId: d.id,
        deptName: d.nameAr,
        coordinator: DEPT_COORDINATORS[d.id] || 'منسق القسم',
        avgScore: avg,
        evalCount: dEvals.length,
        teacherCount: dTeachers.length,
        excellenceRate: rate,
        teachers: teacherStats,
      };
    }).filter(r => r.teacherCount > 0).sort((a, b) => b.avgScore - a.avgScore);
  }, [departments, teachers, allEvaluations, year, reportPeriodType, reportMonth, reportTerm]);

  const schoolTotalAvg = useMemo(() => {
    const withScores = schoolDeptRankings.filter(r => r.avgScore > 0);
    if (withScores.length === 0) return 0;
    return Math.round(withScores.reduce((acc, r) => acc + r.avgScore, 0) / withScores.length);
  }, [schoolDeptRankings]);

  const schoolRadarData = useMemo(() => {
    const evals = allEvaluations.filter(e => {
      if (e.academicYear !== year) return false;
      if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
      if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
      return true;
    });

    return QES_LMS_CRITERIA.filter(c => c.type !== 'descriptive').map((c, i) => {
      let score = 0;
      if (evals.length > 0) {
        const sum = evals.reduce((acc, ev) => acc + (ev.criteria[i]?.score || 0), 0);
        score = Math.round((sum / evals.length) * 10) / 10;
      }
      return {
        subject: c.short,
        score,
        fullMark: 20,
      };
    });
  }, [allEvaluations, year, reportPeriodType, reportMonth, reportTerm]);

  const schoolRatingDistribution = useMemo(() => {
    const evals = allEvaluations.filter(e => {
      if (e.academicYear !== year) return false;
      if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
      if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
      return true;
    });
    let excellent = 0, veryGood = 0, good = 0, needsFollowup = 0;
    evals.forEach(e => {
      if (e.totalScore >= 90) excellent++;
      else if (e.totalScore >= 80) veryGood++;
      else if (e.totalScore >= 70) good++;
      else needsFollowup++;
    });
    return [
      { name: 'ممتاز (90-100%)', value: excellent },
      { name: 'جيد جداً (80-89%)', value: veryGood },
      { name: 'جيد (70-79%)', value: good },
      { name: 'يحتاج متابعة (<70%)', value: needsFollowup },
    ];
  }, [allEvaluations, year, reportPeriodType, reportMonth, reportTerm]);

  const schoolHonorRoll = useMemo(() => {
    const evals = allEvaluations.filter(e => {
      if (e.academicYear !== year) return false;
      if (reportPeriodType === 'month' && e.month !== reportMonth) return false;
      if (reportPeriodType === 'term' && e.term && e.term !== reportTerm) return false;
      return true;
    });
    const map = new Map<string, { teacher: Teacher; total: number; count: number }>();
    evals.forEach(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      if (t) {
        const curr = map.get(t.id) || { teacher: t, total: 0, count: 0 };
        curr.total += e.totalScore;
        curr.count += 1;
        map.set(t.id, curr);
      }
    });
    return Array.from(map.values())
      .map(item => ({
        teacher: item.teacher,
        avg: Math.round(item.total / item.count),
      }))
      .filter(item => item.avg >= 90)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [allEvaluations, teachers, year, reportPeriodType, reportMonth, reportTerm]);

  const deptPages = useMemo(() => {
    const pages: typeof schoolDeptRankings[] = [];
    const chunkSize = 4;
    for (let i = 0; i < schoolDeptRankings.length; i += chunkSize) {
      pages.push(schoolDeptRankings.slice(i, i + chunkSize));
    }
    return pages;
  }, [schoolDeptRankings]);

  // ── 3. Effects ──
  const reload = () => {
    Promise.all([
      db.getTeachers().catch(() => []),
      db.getDepartments().catch(() => []),
      db.getEvaluations().catch(() => [])
    ])
      .then(([t, d, e]) => {
        setTeachersState(t || []);
        setDepartmentsState(d || []);
        setAllEvaluations(e || []);
        if (t && t.length > 0 && !reportTeacherId) setReportTeacherId(t[0].id);
        if (d && d.length > 0 && !reportDeptId) setReportDeptId(d[0].id);
        setLoading(false);
      })
      .catch(err => {
        console.error('Data load error:', err);
        setLoading(false);
      });
  };

  useEffect(() => { reload(); }, []);
  useEffect(() => { if (propYear) setYear(propYear); }, [propYear]);

  // ── 4. Helper Functions ──
  function loadEvaluationObj(ev: Evaluation) {
    const mappedCriteria = QES_LMS_CRITERIA.map((crit, i) => {
      const existing = ev.criteria?.[i];
      if (!existing) {
        if (crit.type === 'boolean') return { score: 20, note: '', value: 'نعم' };
        if (crit.type === 'descriptive') return { score: 0, note: '', value: 'نعم' };
        return { score: 18, note: '' };
      }
      return {
        score: crit.type === 'descriptive' ? 0 : (existing.score ?? (crit.type === 'boolean' ? 20 : 18)),
        note: existing.note || '',
        value: existing.value || (crit.type === 'boolean' ? (existing.score >= 10 ? 'نعم' : 'لا') : '')
      };
    });
    setCriteria(mappedCriteria);
    setStrengths(ev.strengths || '');
    setImprove(ev.improvementAreas || '');
    setRecommend(ev.recommendations || '');
    setActionPlan(ev.actionPlan || '');
    setHasWeeklyAssignment(ev.hasWeeklyAssignment ?? (ev.criteria?.[3]?.score === 20 || ev.criteria?.[3]?.value === 'نعم'));
    setEvidence((ev.evidenceLinks || []).join('\n'));
    setNotes(ev.generalNotes || '');
    setEvalDate(ev.evaluationDate || new Date().toISOString().split('T')[0]);
    setMonth(ev.month);
    if (ev.term) setTerm(ev.term);
    setYear(ev.academicYear);
    setEditingId(ev.id);
    setMainTab('form');
  }

  function loadExisting() {
    if (!existingEval) return;
    loadEvaluationObj(existingEval);
  }

  async function deleteEval(idToDelete?: string) {
    if (!canManageEvaluations) {
      alert('عذراً، حذف التقييمات مقتصر على مدير النظام ومنسق المشاريع فقط.');
      return;
    }
    const targetId = idToDelete || editingId || existingEval?.id;
    if (!targetId) {
      alert('لم يتم تحديد أي تقييم للحذف');
      return;
    }
    const targetEval = allEvaluations.find(e => e.id === targetId) || existingEval;
    const teacherObj = teachers.find(t => t.id === targetEval?.teacherId);
    const teacherName = teacherObj?.nameAr || selectedTeacher?.nameAr || 'المعلم';
    const monthName = targetEval?.month || month;
    const yearName = targetEval?.academicYear || year;

    const confirmDelete = window.confirm(
      `⚠️ تأكيد حذف التقييم:\n\nهل أنت متأكد من رغبتك في حذف تقييم (${teacherName}) لشهر (${monthName} ${yearName})؟\n\nسيتم حذف التقييم نهائياً من قاعدة البيانات.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setSaveError('');
    try {
      await db.deleteEvaluation(targetId);
      invalidateCache('evaluations');
      setAllEvaluations(prev => prev.filter(e => e.id !== targetId));
      if (editingId === targetId || existingEval?.id === targetId) {
        resetForm();
      }
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 4000);
    } catch (err) {
      console.error('Delete evaluation error:', err);
      setSaveError('حدث خطأ أثناء حذف التقييم. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeleting(false);
    }
  }

  function setScore(idx: number, val: string) {
    const raw = parseFloat(val);
    const v = isNaN(raw) ? 0 : Math.min(20, Math.max(0, Math.round(raw * 2) / 2));
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, score: v } : x));
  }

  function setBooleanScore(idx: number, isYes: boolean) {
    const score = isYes ? 20 : 0;
    const value = isYes ? 'نعم' : 'لا';
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, score, value } : x));
    if (idx === 3) {
      setHasWeeklyAssignment(isYes);
    }
  }

  function setDescriptiveValue(idx: number, isYes: boolean) {
    const value = isYes ? 'نعم' : 'لا';
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, score: 0, value } : x));
  }

  function setNote(idx: number, val: string) {
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, note: val } : x));
  }

  async function saveEval() {
    if (!canManageEvaluations) {
      alert('عذراً، حفظ وتعديل التقييمات مقتصر على مدير النظام ومنسق المشاريع فقط.');
      return;
    }
    if (!teacherId) { alert('يرجى اختيار المعلم'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const docId = editingId || generateId();
      const evObj: Evaluation = {
        id: docId,
        teacherId,
        evaluatorId: currentUser.id,
        month,
        academicYear: year,
        term,
        evaluationDate: evalDate,
        criteria,
        totalScore,
        averageScore: avgScore,
        percentage: totalScore,
        performanceLevel: perf.label,
        strengths,
        improvementAreas: improve,
        recommendations: recommend,
        actionPlan,
        hasWeeklyAssignment,
        evidenceLinks: evidence.split('\n').filter(Boolean),
        generalNotes: notes,
        createdAt: editingId ? (existingEval?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      await saveDocument<Evaluation>(COLLECTIONS.evaluations, evObj);
      invalidateCache('evaluations');
      setEditingId(docId);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      setAllEvaluations(prev => {
        const idx = prev.findIndex(e => e.id === docId);
        if (idx !== -1) { const updated = [...prev]; updated[idx] = evObj; return updated; }
        return [...prev, evObj];
      });
    } catch (err) {
      console.error('Save evaluation error:', err);
      setSaveError('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTeacherId(''); setMonth(MONTHS[0]); setTerm(TERMS[0]); setYear(currentYear);
    setCriteria(EMPTY_CRITERIA()); setStrengths(''); setImprove('');
    setRecommend(''); setActionPlan(''); setEvidence(''); setNotes('');
    setEditingId(null); setSaved(false); setSaveError('');
  }

  function printCurrentView() { window.print(); }

  async function handleSyncSeptember2026Evals() {
    setIsSyncingEvals(true);
    setSyncSuccessMsg('');
    try {
      const generated = generateSeptember2026Evaluations(teachers);
      // Filter out any previous 2026-2027 September evals and append the official ones
      const otherEvals = allEvaluations.filter(e => !(e.academicYear === '2026-2027' && e.month === 'سبتمبر'));
      const updatedEvals = [...otherEvals, ...generated];
      await db.saveEvaluations(updatedEvals);
      setAllEvaluations(updatedEvals);
      setSyncSuccessMsg('✅ تم بنجاح تعبئة وتحديث تقييمات المعلمين لشهر سبتمبر 2026 بناءً على التقرير الرسمي المعتمد!');
      setTimeout(() => setSyncSuccessMsg(''), 6000);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء تعبئة التقييمات: ' + (err?.message || err));
    } finally {
      setIsSyncingEvals(false);
    }
  }

  function handleExportSeptemberReportToExcel() {
    const rows = SEPTEMBER_2026_LMS_TEACHERS.map((t, idx) => ({
      'م': idx + 1,
      'اسم المعلم': t.name,
      'القسم': t.department,
      'الشعب المسندة': t.subjectsAndSections,
      'تغطية التقييمات': t.evalCoverageRatio,
      'نسبة التغطية': `${t.evalCoveragePercent}%`,
      'التقييمات المرفوعة': t.evalUploaded,
      'التقييمات المسندة': t.evalAssigned,
      'تقييمات غير مسندة': t.evalUnassigned,
      'التسليمات المستلمة': t.submissionsReceived,
      'التسليمات المصححة': t.submissionsGraded,
      'التسليمات المعلقة': t.submissionsPending,
      'نسبة الحل': `${t.solveRate}%`,
      'نسبة التصحيح': `${t.gradingRate}%`,
      'إجمالي الدروس': t.lessonsUploaded,
      'دروس ظاهرة': t.lessonsVisible,
      'دروس مخفية': t.lessonsHidden,
      'دروس محسوبة مستوفية': t.lessonsValid,
      'نسبة استيفاء الدروس': `${t.lessonsValidPercent}%`,
      'ملاحظات وتوجيهات الأداء': t.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير نشاط سبتمبر 2026');
    XLSX.writeFile(wb, `تقرير_تقييم_المعلمين_نظام_قطر_للتعليم_سبتمبر_2026.xlsx`);
  }

  async function exportReportAsPdf() {
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      let elementId = '';
      let defaultFileName = '';

      if (reportLevel === 'teacher' && reportTeacher) {
        elementId = 'qes-report-teacher-container';
        defaultFileName = `تقرير_تقييم_نظام_قطر_للمعلم_${reportTeacher.nameAr}_${year}`;
      } else if (reportLevel === 'department' && reportDept) {
        elementId = 'qes-report-dept-container';
        defaultFileName = `تقرير_تقييم_نظام_قطر_قسم_${reportDept.nameAr}_${year}`;
      } else {
        elementId = 'qes-report-school-container';
        defaultFileName = `تقرير_تقييم_نظام_قطر_الشامل_للمدرسة_${year}`;
      }

      const el = document.getElementById(elementId);
      if (!el) {
        window.print();
        return;
      }

      if (document.fonts) {
        await document.fonts.ready;
      }

      const targetWidth = 1580;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
        compress: true
      });

      const pageWidth = 420;
      const pageHeight = 297;
      const margin = 8;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);

      const pageElements = Array.from(el.querySelectorAll('.qes-report-page')) as HTMLElement[];

      if (pageElements.length > 0) {
        // Multi-page clean capture (each .qes-report-page maps to exactly one A3 landscape sheet)
        for (let pageIdx = 0; pageIdx < pageElements.length; pageIdx++) {
          const pageEl = pageElements[pageIdx];
          const canvas = await html2canvas(pageEl, {
            scale: 2.0,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: targetWidth + 40,
            onclone: async (clonedDoc) => {
              if ((clonedDoc as any).fonts) {
                await (clonedDoc as any).fonts.ready;
              }
              if (clonedDoc.body) {
                clonedDoc.body.style.width = `${targetWidth + 40}px`;
                clonedDoc.body.style.minWidth = `${targetWidth + 40}px`;
              }
              const whiteEls = clonedDoc.querySelectorAll('.text-white, .print-header-badge');
              whiteEls.forEach((wel: any) => {
                wel.style.color = '#ffffff';
                if (wel.style.setProperty) {
                  wel.style.setProperty('color', '#ffffff', 'important');
                  wel.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
                }
              });
            }
          });

          if (pageIdx > 0) {
            pdf.addPage();
          }

          const renderHeight = (canvas.height / canvas.width) * availableWidth;
          if (renderHeight <= availableHeight) {
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, availableWidth, renderHeight, undefined, 'FAST');
          } else {
            // If slightly taller than availableHeight, scale proportionally to fit page without clipping
            const scaleRatio = availableHeight / renderHeight;
            const scaledWidth = availableWidth * scaleRatio;
            const xOffset = margin + (availableWidth - scaledWidth) / 2;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, margin, scaledWidth, availableHeight, undefined, 'FAST');
          }
        }
      } else {
        // Fallback for single container without .qes-report-page
        const canvas = await html2canvas(el, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: targetWidth + 40,
          onclone: async (clonedDoc) => {
            if ((clonedDoc as any).fonts) {
              await (clonedDoc as any).fonts.ready;
            }
            if (clonedDoc.body) {
              clonedDoc.body.style.width = `${targetWidth + 40}px`;
              clonedDoc.body.style.minWidth = `${targetWidth + 40}px`;
            }
            const clonedEl = clonedDoc.getElementById(elementId);
            if (clonedEl) {
              clonedEl.style.width = `${targetWidth}px`;
              clonedEl.style.maxWidth = `${targetWidth}px`;
              clonedEl.style.margin = '0 auto';
              clonedEl.style.boxShadow = 'none';
              clonedEl.style.borderRadius = '0';
              clonedEl.style.position = 'relative';
              clonedEl.style.overflow = 'hidden';
              clonedEl.style.fontFamily = "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif";

              const whiteEls = clonedEl.querySelectorAll('.text-white, .print-header-badge');
              whiteEls.forEach((wel: any) => {
                wel.style.color = '#ffffff';
                if (wel.style.setProperty) {
                  wel.style.setProperty('color', '#ffffff', 'important');
                  wel.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
                }
              });
            }
          }
        });

        const renderHeight = (canvas.height / canvas.width) * availableWidth;
        if (renderHeight <= availableHeight) {
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, availableWidth, renderHeight, undefined, 'FAST');
        } else {
          // Multi-page slicing fallback
          const pageCanvasHeight = Math.floor((availableHeight / availableWidth) * canvas.width);
          let currentY = 0;
          let pageIndex = 0;

          while (currentY < canvas.height) {
            const sliceHeight = Math.min(pageCanvasHeight, canvas.height - currentY);
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;

            const ctx = pageCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
              ctx.drawImage(
                canvas,
                0, currentY, canvas.width, sliceHeight,
                0, 0, canvas.width, sliceHeight
              );

              const sliceData = pageCanvas.toDataURL('image/png');
              const sliceRenderHeight = (sliceHeight / canvas.width) * availableWidth;

              if (pageIndex > 0) {
                pdf.addPage();
              }

              pdf.addImage(sliceData, 'PNG', margin, margin, availableWidth, sliceRenderHeight, undefined, 'FAST');
              pageIndex++;
            }
            currentY += sliceHeight;
          }
        }
      }

      pdf.save(`${defaultFileName.replace(/[/\\?%*:|"<>]/g, '-').trim()}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF in EvaluationPage:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  }

  // Excel Exporters
  function exportHistoryToExcel() {
    const data = filteredHistory.map((ev, idx) => {
      const t = teachers.find(x => x.id === ev.teacherId);
      return {
        '#': idx + 1,
        'الرقم الشخصي': t?.employeeId || '-',
        'اسم المعلم': t?.nameAr || '-',
        'القسم': getDeptName(t?.departmentId || '', departments),
        'الشهر': ev.month,
        'الفصل الدراسي': ev.term || '-',
        'العام الأكاديمي': ev.academicYear,
        'الدرجة الكلية (100%)': ev.totalScore,
        'التقدير': ev.performanceLevel,
        'تاريخ التقييم': ev.evaluationDate,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل التقييمات');
    XLSX.writeFile(wb, `سجل_تقييمات_نظام_قطر_${year}.xlsx`);
  }

  function exportTeacherReportToExcel(tObj: Teacher, evList: Evaluation[]) {
    const data = evList.map(ev => ({
      'الشهر': ev.month,
      'الفصل': ev.term || '-',
      'العام': ev.academicYear,
      'تفعيل الدروس والخطط والمحتوى (/20)': ev.criteria[0]?.score || 0,
      'تنظيم الدروس: الأهداف وصور الدروس (/20)': ev.criteria[1]?.score || 0,
      'تفاعل الطلاب وحلقات النقاش (/20)': ev.criteria[2]?.score || 0,
      'رفع الواجبات أسبوعياً (/20)': ev.criteria[3]?.score || 0,
      'دخول النظام في الحصص (/20)': ev.criteria[4]?.score || 0,
      'المنصات المساندة (رصد وصفي)': ev.criteria[5]?.note || (ev.criteria[5]?.value === 'لا' ? 'لا' : 'نعم'),
      'الدرجة الكلية (/100)': ev.totalScore,
      'التقدير': ev.performanceLevel,
      'تاريخ التقييم': ev.evaluationDate,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير المعلم');
    XLSX.writeFile(wb, `تقرير_نظام_قطر_${tObj.nameAr}_${year}.xlsx`);
  }

  function exportDeptReportToExcel(deptObj: Department, teacherScores: any[]) {
    const data = teacherScores.map((item, idx) => ({
      '#': idx + 1,
      'الرقم الشخصي': item.teacher.employeeId,
      'اسم المعلم': item.teacher.nameAr,
      'المسمى الوظيفي': item.teacher.subject || item.teacher.jobCategory,
      'الدرجة الكلية': item.score > 0 ? `${item.score}%` : 'غير مرصود',
      'التقدير': item.score > 0 ? item.level : '-',
      'عدد التقييمات': item.count,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير القسم');
    XLSX.writeFile(wb, `تقرير_قسم_${deptObj.nameAr}_${year}.xlsx`);
  }

  function exportSchoolReportToExcel(rankings: any[]) {
    const data = rankings.map((r, idx) => ({
      'الترتيب': idx + 1,
      'القسم': r.deptName,
      'المنسق المعتمد': r.coordinator,
      'متوسط التقييم': `${r.avgScore}%`,
      'عدد المعلمين': r.teacherCount,
      'نسبة التميز': `${r.excellenceRate}%`,
    }));

    const teacherRows: any[] = [];
    rankings.forEach(r => {
      if (r.teachers) {
        r.teachers.forEach((tItem: any, tIdx: number) => {
          teacherRows.push({
            'القسم': r.deptName,
            'المنسق': r.coordinator,
            '#': tIdx + 1,
            'اسم المعلم': tItem.teacher.nameAr,
            'الرقم الشخصي': tItem.teacher.employeeId || '-',
            'المادة / الوظيفة': tItem.teacher.subject || '-',
            'درجة التقييم': `${tItem.score}%`,
            'التقدير المعتمد': tItem.level,
            'حالة التقييم': tItem.isEvaluated ? 'مكتمل' : 'بانتظار الرصد',
            'ملاحظات': tItem.notes || '-'
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'ترتيب الأقسام');

    if (teacherRows.length > 0) {
      const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
      XLSX.utils.book_append_sheet(wb, wsTeachers, 'إحصاءات معلمي الأقسام');
    }

    XLSX.writeFile(wb, `تقرير_المدرسة_الشامل_نظام_قطر_${year}.xlsx`);
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: '0 2px 10px rgba(15,32,68,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.25rem'
  };

  return (
    <div style={{ direction: 'rtl', padding: '1rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'inherit' }}>

      {/* ══════════ SCREEN HEADER & SUBTABS (hidden on print) ══════════ */}
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1A3A6B 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(15,32,68,0.18)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>🇶🇦</span> نظام قطر للتعليم (LMS) — العام الأكاديمي ٢٠٢٦-٢٠٢٧ م
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              تقييم نظام قطر للتعليم — التقييم الشهري والتقارير
            </h1>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              منظومة المتابعة الشهرية وتوليد التقارير والإحصاءات العصرية لمدرسة قطر للعلوم والتكنولوجيا
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>العام الأكاديمي:</span>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y} style={{ color: '#0F2044' }}>{y}</option>)}
            </select>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginRight: '0.4rem' }}>الشهر:</span>
            <select
              value={month}
              onChange={e => {
                setMonth(e.target.value);
                setEditingId(null);
              }}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {MONTHS.map(m => (
                <option key={m} value={m} style={{ color: '#0F2044' }}>
                  {m} {m === 'سبتمبر' ? '(المعتمد)' : m === 'أكتوبر' ? '(الشهر القادم)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={printCurrentView}
              style={{
                background: '#00B4D8',
                color: '#0F2044',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(0,180,216,0.3)'
              }}
            >
              <span>🖨️</span> طباعة
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'platform_report', label: `📊 تقرير نشاط المنصة (${month} ٢٠٢٦)`, badge: month === 'سبتمبر' ? 'موثق' : 'قيد الانتظار' },
            { id: 'form', label: '📝 نموذج التقييم الشهري' },
            { id: 'history', label: `📋 سجل التقييمات (${allEvaluations.filter(e => e.academicYear === year).length})` },
            { id: 'reports', label: '📈 التقارير والإحصاءات العصرية' },
            { id: 'directory', label: `👥 دليل المعلمين (${teachers.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: mainTab === tab.id ? '#0F2044' : '#F1F5F9',
                color: mainTab === tab.id ? '#fff' : '#475569',
                fontWeight: mainTab === tab.id ? 800 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.label}</span>
              {(tab as any).badge && mainTab !== tab.id && (
                <span style={{ background: '#00B4D8', color: '#0F2044', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '6px' }}>
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>جاري تحميل منظومة تقييم نظام قطر للتعليم...</p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
              TAB 0: 📊 تقرير نشاط المنصة
          ══════════════════════════════════════════════════════════════ */}
          {mainTab === 'platform_report' && (
            <div className="platform-report-container">
              <PlatformReportTab
                teachers={teachers}
                departments={departments}
                selectedMonth={month}
                onMonthChange={(m) => setMonth(m)}
                onSelectTeacherForEval={(tid) => {
                  setTeacherId(tid);
                  setMonth(month || 'سبتمبر');
                  setYear('2026-2027');
                  setMainTab('form');
                }}
                onSyncEvals={handleSyncSeptember2026Evals}
                isSyncing={isSyncingEvals}
                syncSuccessMsg={syncSuccessMsg}
                onExportExcel={handleExportSeptemberReportToExcel}
                onNavigateToTakreem={() => onNavigateToPage?.('takreem')}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: 📝 نموذج التقييم الشهري (Evaluation Form)
          ══════════════════════════════════════════════════════════════ */}
          {mainTab === 'form' && (
            <div className="no-print">
              {/* Metadata selection card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                    📋 البيانات الأساسية للتقييم
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={resetForm} style={{ fontSize: '0.8rem', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.35rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                      🔄 استمارة جديدة
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>اسم المعلم *</label>
                    <select
                      value={teacherId}
                      onChange={e => { setTeacherId(e.target.value); setEditingId(null); }}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #0096C7', fontSize: '0.85rem', fontWeight: 700, background: '#fff' }}
                    >
                      <option value="">-- اختر المعلم المراد تقييمه --</option>
                      {availableTeachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.nameAr} ({getDeptName(t.departmentId, departments)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTeacher && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>الرقم الشخصي (QID)</label>
                        <input value={selectedTeacher.employeeId} readOnly style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>القسم والوظيفة</label>
                        <input value={`${deptName} — ${selectedTeacher.subject}`} readOnly style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>البريد الوزاري الرسمي</label>
                        <input value={selectedTeacher.email} readOnly style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.8rem', color: '#0284C7', direction: 'ltr', textAlign: 'right' }} />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>شهر التقييم *</label>
                    <select
                      value={month}
                      onChange={e => { setMonth(e.target.value); setEditingId(null); }}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, background: '#fff' }}
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>الفصل الدراسي *</label>
                    <select
                      value={term}
                      onChange={e => setTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, background: '#fff' }}
                    >
                      {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>تاريخ الرصد</label>
                    <input
                      type="date"
                      value={evalDate}
                      onChange={e => setEvalDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>المقيم المسؤول</label>
                    <input
                      value={currentUser?.name || 'مدير النظام'}
                      readOnly
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                {existingEval && !editingId && (
                  <div style={{ marginTop: '1rem', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: 700 }}>
                      ⚠️ تم رصد تقييم مسبق لهذا المعلم في شهر ({existingEval.month}) بدرجة: {existingEval.totalScore}% ({existingEval.performanceLevel})
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={loadExisting} style={{ fontSize: '0.78rem', background: '#fff', border: '1px solid #D97706', color: '#B45309', borderRadius: '6px', padding: '0.35rem 0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                        ✏️ تحميل وتعديل التقييم
                      </button>
                      <button onClick={() => deleteEval(existingEval.id)} disabled={deleting} style={{ fontSize: '0.78rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '6px', padding: '0.35rem 0.8rem', fontWeight: 800, cursor: 'pointer' }}>
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                )}

                {editingId && (
                  <div style={{ marginTop: '1rem', background: '#E0F2FE', border: '1px solid #0284C7', borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '0.85rem', color: '#0C4A6E', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✏️ وضع التعديل الفعّال على التقييم المسجل (ID: {editingId})</span>
                    <button onClick={() => deleteEval(editingId)} disabled={deleting} style={{ fontSize: '0.78rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '6px', padding: '0.3rem 0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                      🗑️ حذف هذا التقييم
                    </button>
                  </div>
                )}
              </div>

              {/* Criteria scoring card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                      🎯 استمارة تقييم المعلم لنظام قطر للتعليم (المجموع من 100)
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                      التقييم الرقمي والوصفي وفق المعايير الستة المعتمدة وتوظيف المنصات المساندة
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>المجموع الكلي</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: totalScore >= 90 ? '#065F46' : totalScore >= 80 ? '#1E40AF' : '#991B1B' }}>
                        {totalScore}%
                      </div>
                    </div>
                    <div style={{ borderLeft: '1px solid #CBD5E1', height: '30px' }} />
                    <span style={{ background: perf.bg, color: perf.color, padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800 }}>
                      {perf.label}
                    </span>
                  </div>
                </div>

                {QES_LMS_CRITERIA.map((crit, i) => {
                  const currentScore = criteria[i]?.score ?? (crit.type === 'boolean' ? 20 : (crit.type === 'descriptive' ? 0 : 18));
                  const isScale = crit.type === 'scale';
                  const isBool = crit.type === 'boolean';
                  const isDescriptive = crit.type === 'descriptive';
                  const isYes = isBool ? (currentScore === 20 || criteria[i]?.value === 'نعم') : (criteria[i]?.value !== 'لا');

                  const barColor = isBool
                    ? (isYes ? '#10B981' : '#EF4444')
                    : currentScore >= 18 ? '#10B981' : currentScore >= 15 ? '#0096C7' : '#F59E0B';

                  return (
                    <div key={crit.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              background: '#0F2044', color: '#fff', width: '24px', height: '24px', 
                              borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                              fontSize: '0.78rem', fontWeight: 800 
                            }}>
                              {crit.num}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F2044' }}>
                              {crit.name}
                            </span>
                            <span style={{ 
                              background: isBool ? '#FEF3C7' : isDescriptive ? '#EDE9FE' : '#E0F2FE', 
                              color: isBool ? '#92400E' : isDescriptive ? '#5B21B6' : '#0369A1', 
                              padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 
                            }}>
                              {crit.measureType}
                            </span>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                              {crit.scoreText}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.5 }}>
                            <strong style={{ color: '#0F2044' }}>شواهد وملاحظات الأداء: </strong>
                            {crit.evidence}
                          </div>
                        </div>

                        {/* Controls */}
                        {isScale && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.5"
                              value={currentScore}
                              onChange={e => setScore(i, e.target.value)}
                              style={{ width: '130px', accentColor: barColor }}
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={currentScore}
                              onChange={e => setScore(i, e.target.value)}
                              style={{
                                width: '65px',
                                textAlign: 'center',
                                padding: '0.35rem',
                                borderRadius: '8px',
                                border: `2px solid ${barColor}`,
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: '#0F2044'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>/ 20</span>
                          </div>
                        )}

                        {isBool && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setBooleanScore(i, true)}
                              style={{
                                background: isYes ? '#D1FAE5' : '#F1F5F9',
                                color: isYes ? '#065F46' : '#64748B',
                                border: isYes ? '2px solid #10B981' : '1px solid #CBD5E1',
                                padding: '0.45rem 1rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ✅ نعم (20 درجة)
                            </button>
                            <button
                              type="button"
                              onClick={() => setBooleanScore(i, false)}
                              style={{
                                background: !isYes ? '#FEE2E2' : '#F1F5F9',
                                color: !isYes ? '#991B1B' : '#64748B',
                                border: !isYes ? '2px solid #EF4444' : '1px solid #CBD5E1',
                                padding: '0.45rem 1rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ❌ لا (0 درجة)
                            </button>
                          </div>
                        )}

                        {isDescriptive && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setDescriptiveValue(i, true)}
                              style={{
                                background: isYes ? '#EDE9FE' : '#F1F5F9',
                                color: isYes ? '#5B21B6' : '#64748B',
                                border: isYes ? '2px solid #8B5CF6' : '1px solid #CBD5E1',
                                padding: '0.45rem 0.9rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ✅ نعم (يستخدم)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDescriptiveValue(i, false)}
                              style={{
                                background: !isYes ? '#FEE2E2' : '#F1F5F9',
                                color: !isYes ? '#991B1B' : '#64748B',
                                border: !isYes ? '2px solid #EF4444' : '1px solid #CBD5E1',
                                padding: '0.45rem 0.9rem',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ❌ لا
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for scored items */}
                      {!isDescriptive && (
                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', margin: '0.7rem 0 0.4rem', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${(currentScore / 20) * 100}%`, 
                            height: '100%', 
                            background: barColor, 
                            borderRadius: '4px', 
                            transition: 'width 0.25s ease' 
                          }} />
                        </div>
                      )}

                      <input
                        placeholder={
                          isDescriptive
                            ? 'حصر الأدوات والمنصات المساندة (مثل: MS Teams، Forms، ClassPoint، وغيرها)...'
                            : isBool
                              ? 'شواهد وملاحظات إضافية حول هذا المعيار (اختياري)...'
                              : 'شواهد وملاحظات الأداء الخاصة بهذا المعيار (اختياري)...'
                        }
                        value={criteria[i]?.note || ''}
                        onChange={e => setNote(i, e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: isDescriptive ? '0.6rem' : '0.3rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.78rem',
                          background: '#fff'
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Qualitative feedback */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', marginBottom: '1rem' }}>
                  📝 التغذية الراجعة والتوصيات الإجرائية
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                  <div>
                    <RichBulletTextarea
                      label="🌟 نقاط القوة والتميز في تفعيل النظام"
                      value={strengths}
                      onChange={val => setStrengths(val)}
                      colorTheme="emerald"
                      rows={3}
                      placeholder="أبرز ما تميز به المعلم في نظام قطر للتعليم..."
                    />
                  </div>

                  <div>
                    <RichBulletTextarea
                      label="🎯 فرص التحسين والتطوير"
                      value={improve}
                      onChange={val => setImprove(val)}
                      colorTheme="amber"
                      rows={3}
                      placeholder="الجوانب التي ينبغي للمعلم التركيز عليها..."
                    />
                  </div>

                  <div>
                    <RichBulletTextarea
                      label="💡 توصيات المقيم والحلول المقترحة"
                      value={recommend}
                      onChange={val => setRecommend(val)}
                      colorTheme="teal"
                      rows={3}
                      placeholder="توصيات إجرائية محددة لدعم المعلم..."
                    />
                  </div>

                  <div>
                    <RichBulletTextarea
                      label="📈 خطة التحسين ومتابعة الشهر القادم"
                      value={actionPlan}
                      onChange={val => setActionPlan(val)}
                      colorTheme="indigo"
                      rows={3}
                      placeholder="خطة التدريب أو المتابعة المحددة..."
                    />
                  </div>
                  
                  {/* Weekly Assignment Checklist */}
                  <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.9rem' }}>تقييم الواجب الأسبوعي</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>هل تم رفع واجب أسبوعي من قبل المعلم للطلاب؟</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginRight: 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: hasWeeklyAssignment ? '#D1FAE5' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: hasWeeklyAssignment ? '1px solid #10B981' : '1px solid #CBD5E1', transition: 'all 0.2s' }}>
                        <input 
                          type="radio" 
                          name="weeklyAssignment" 
                          checked={hasWeeklyAssignment === true} 
                          onChange={() => setHasWeeklyAssignment(true)} 
                          style={{ margin: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 700, color: hasWeeklyAssignment ? '#065F46' : '#475569', fontSize: '0.85rem' }}>نعم</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: hasWeeklyAssignment === false ? '#FEE2E2' : '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: hasWeeklyAssignment === false ? '1px solid #EF4444' : '1px solid #CBD5E1', transition: 'all 0.2s' }}>
                        <input 
                          type="radio" 
                          name="weeklyAssignment" 
                          checked={hasWeeklyAssignment === false} 
                          onChange={() => setHasWeeklyAssignment(false)} 
                          style={{ margin: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 700, color: hasWeeklyAssignment === false ? '#991B1B' : '#475569', fontSize: '0.85rem' }}>لا</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    🔗 روابط الأدلة والشواهد الرقمية (رابط في كل سطر)
                  </label>
                  <textarea
                    rows={2}
                    value={evidence}
                    onChange={e => setEvidence(e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    📌 ملاحظات عامة
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
                {canManageEvaluations ? (
                  <button
                    onClick={saveEval}
                    disabled={saving || !teacherId}
                    style={{
                      background: '#0F2044',
                      color: '#fff',
                      padding: '0.75rem 1.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(15,32,68,0.2)'
                    }}
                  >
                    {saving ? '⏳ جاري الحفظ...' : editingId ? '🔄 تحديث التقييم' : '💾 حفظ التقييم'}
                  </button>
                ) : (
                  <div
                    style={{
                      background: '#F1F5F9',
                      color: '#64748B',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>🔒 وضع المشاهدة والاطلاع فقط (الحفظ معطل)</span>
                  </div>
                )}

                <button
                  onClick={printCurrentView}
                  disabled={!teacherId}
                  style={{
                    background: '#fff',
                    color: '#0F2044',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    border: '1.5px solid #0F2044',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🖨️ طباعة النموذج الرسمي
                </button>

                {(editingId || existingEval) && (
                  <button
                    onClick={() => deleteEval()}
                    disabled={deleting}
                    style={{
                      background: '#EF4444',
                      color: '#fff',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      marginRight: 'auto'
                    }}
                  >
                    {deleting ? '⏳ جاري الحذف...' : '🗑️ حذف التقييم'}
                  </button>
                )}
              </div>

              {saved && (
                <div style={{ marginBottom: '1.5rem', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '0.85rem', color: '#065F46', fontSize: '0.9rem', fontWeight: 700 }}>
                  ✅ تم حفظ التقييم بنجاح في قاعدة البيانات السحابية ونظام التقييم المعتمد!
                </div>
              )}
              {deleteSuccess && (
                <div style={{ marginBottom: '1.5rem', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '0.85rem', color: '#065F46', fontSize: '0.9rem', fontWeight: 700 }}>
                  ✅ تم حذف التقييم بنجاح من قاعدة البيانات!
                </div>
              )}
              {saveError && (
                <div style={{ marginBottom: '1.5rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.85rem', color: '#991B1B', fontSize: '0.9rem', fontWeight: 700 }}>
                  ❌ {saveError}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: 📋 سجل التقييمات (History & Table)
          ══════════════════════════════════════════════════════════════ */}
          {mainTab === 'history' && (
            <div className="no-print">
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                      📋 سجل التقييمات الشهرية المعتمدة ({filteredHistory.length})
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      يمكنك البحث وتصفية التقييمات وتصديرها إلى ملف Excel أو تحميل أي تقييم لتعديله
                    </p>
                  </div>
                  <button
                    onClick={exportHistoryToExcel}
                    style={{
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    📥 تصدير السجل إلى Excel
                  </button>
                </div>

                {/* Filter bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                  <input
                    placeholder="🔍 بحث باسم المعلم أو الرقم..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                  <select
                    value={historyDeptFilter}
                    onChange={e => setHistoryDeptFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="">جميع الأقسام</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                  </select>
                  <select
                    value={historyMonthFilter}
                    onChange={e => setHistoryMonthFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="">جميع الشهور</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={historyTermFilter}
                    onChange={e => setHistoryTermFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="">جميع الفصول الدراسية</option>
                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                        <th style={{ padding: '0.65rem', borderRadius: '0 8px 0 0' }}>#</th>
                        <th style={{ padding: '0.65rem' }}>المعلم</th>
                        <th style={{ padding: '0.65rem' }}>القسم</th>
                        <th style={{ padding: '0.65rem' }}>الشهر</th>
                        <th style={{ padding: '0.65rem' }}>الفصل</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center' }}>الدرجة (100%)</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center' }}>التقدير</th>
                        <th style={{ padding: '0.65rem' }}>تاريخ الرصد</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center', borderRadius: '8px 0 0 0' }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                            لا توجد تقييمات مطابقة للفلاتر المحددة
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((ev, i) => {
                          const t = teachers.find(x => x.id === ev.teacherId);
                          const p = getPerformanceLevel(ev.totalScore);
                          return (
                            <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '0.65rem', color: '#64748B', fontWeight: 700 }}>{i + 1}</td>
                              <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0F2044' }}>
                                {t?.nameAr || 'معلم غير معروف'}
                                <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{t?.employeeId}</div>
                              </td>
                              <td style={{ padding: '0.65rem', color: '#475569' }}>
                                {getDeptName(t?.departmentId || '', departments)}
                              </td>
                              <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0096C7' }}>{ev.month}</td>
                              <td style={{ padding: '0.65rem', color: '#64748B', fontSize: '0.75rem' }}>{ev.term || '-'}</td>
                              <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 900, fontSize: '0.9rem', color: ev.totalScore >= 90 ? '#065F46' : ev.totalScore >= 80 ? '#1E40AF' : '#991B1B' }}>
                                {ev.totalScore}%
                              </td>
                              <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                                <span style={{ background: p.bg, color: p.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                                  {p.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem', color: '#64748B', fontSize: '0.75rem' }}>{ev.evaluationDate}</td>
                              <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => loadEvaluationObj(ev)}
                                    style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FE', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    ✏️ تعديل
                                  </button>
                                  <button
                                    onClick={() => deleteEval(ev.id)}
                                    style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    🗑️ حذف
                                  </button>
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
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: 📈 محرك التقارير والإحصاءات العصرية (Reports Engine)
          ══════════════════════════════════════════════════════════════ */}
          {mainTab === 'reports' && (
            <div>
              {/* Controls Bar (hidden on print) */}
              <div className="no-print" style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                      📊 محرك التقارير والتحليلات البيانية العصرية
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      استخرج تقارير تفاعلية ذكية مدعومة برسومات Recharts البيانية لكل معلم وقسم والمدرسة ككل
                    </p>
                  </div>

                  {/* Sub level picker */}
                  <div style={{ display: 'flex', gap: '0.4rem', background: '#F1F5F9', padding: '0.3rem', borderRadius: '10px' }}>
                    {[
                      { id: 'teacher', label: '👤 تقرير المعلم الفردي' },
                      { id: 'department', label: '🏢 تقرير القسم التراكمي' },
                      { id: 'school', label: '🏫 تقرير المدرسة الشامل' },
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setReportLevel(item.id as any)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: reportLevel === item.id ? '#0F2044' : 'transparent',
                          color: reportLevel === item.id ? '#fff' : '#475569',
                          fontWeight: reportLevel === item.id ? 800 : 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parameter selection row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                  {reportLevel === 'teacher' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>المعلم</label>
                      <select
                        value={reportTeacherId}
                        onChange={e => setReportTeacherId(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1.5px solid #0096C7', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.nameAr} ({getDeptName(t.departmentId, departments)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {reportLevel === 'department' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>القسم الأكاديمي</label>
                      <select
                        value={reportDeptId}
                        onChange={e => setReportDeptId(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1.5px solid #0096C7', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.nameAr}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>نوع الفترة</label>
                    <select
                      value={reportPeriodType}
                      onChange={e => setReportPeriodType(e.target.value as any)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      <option value="month">تقرير شهري محدد</option>
                      <option value="term">تقرير فصلي تراكمي</option>
                    </select>
                  </div>

                  {reportPeriodType === 'month' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>الشهر</label>
                      <select
                        value={reportMonth}
                        onChange={e => setReportMonth(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>الفصل الدراسي</label>
                      <select
                        value={reportTerm}
                        onChange={e => setReportTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={exportReportAsPdf}
                      disabled={isExportingPdf}
                      style={{
                        flex: '1 1 150px',
                        background: '#DC2626',
                        color: '#fff',
                        border: 'none',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        opacity: isExportingPdf ? 0.7 : 1
                      }}
                    >
                      <Download size={14} />
                      {isExportingPdf ? 'جاري التصدير...' : 'حفظ PDF رسمي (A3 Landscape)'}
                    </button>
                    <button
                      onClick={printCurrentView}
                      style={{
                        flex: '1 1 120px',
                        background: '#0F2044',
                        color: '#fff',
                        border: 'none',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Printer size={14} />
                      طباعة A3 Landscape
                    </button>
                    <button
                      onClick={() => {
                        if (reportLevel === 'teacher' && reportTeacher) exportTeacherReportToExcel(reportTeacher, reportTeacherEvals);
                        else if (reportLevel === 'department' && reportDept) exportDeptReportToExcel(reportDept, deptComparisonData);
                        else if (reportLevel === 'school') exportSchoolReportToExcel(schoolDeptRankings);
                      }}
                      style={{
                        flex: '1 1 80px',
                        background: '#10B981',
                        color: '#fff',
                        border: 'none',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Excel
                    </button>
                  </div>
                </div>
                {/* Print Styles for A3 Landscape */}
                <style jsx global>{`
                  @media print {
                    @page {
                      size: A3 landscape !important;
                      margin: 8mm 12mm !important;
                    }
                    body {
                      background: white !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    .no-print, .app-sidebar, header, nav {
                      display: none !important;
                    }
                    .printable-report {
                      width: 100% !important;
                      max-width: 410mm !important;
                      margin: 0 auto !important;
                      padding: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                    }
                    .qes-report-page {
                      page-break-after: always !important;
                      break-after: page !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                      margin-bottom: 0 !important;
                      box-sizing: border-box !important;
                      min-height: auto !important;
                    }
                    .qes-report-page:last-child {
                      page-break-after: avoid !important;
                      break-after: avoid !important;
                    }
                    .page-break-avoid {
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                    }
                    .page-break-always {
                      page-break-before: always !important;
                      break-before: page !important;
                    }
                  }
                `}</style>
              </div>

              {/* REPORT VIEW 1: 👤 تقرير المعلم الفردي */}
              {reportLevel === 'teacher' && reportTeacher && (
                <div id="qes-report-teacher-container" className="printable-report qes-report-page" style={{ ...cardStyle, background: '#ffffff', position: 'relative', padding: '1.5rem 2rem' }}>
                  <OfficialReportHeader
                    title="تقرير تقييم تفعيل نظام قطر للتعليم — المعلم الفردي"
                    subtitle={`التقرير الرسمي المعتمد لأداء المعلم ${reportTeacher.nameAr} في نظام قطر للتعليم (${reportTerm} ${year})`}
                    reportCode={`QES-TCH-${reportTeacher.employeeId || '000'}-${year.replace('/', '-')}`}
                    academicYear={year}
                  />

                  {/* Teacher Info Card */}
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>اسم المعلم:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044' }}>{reportTeacher.nameAr}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{reportTeacher.nameEn}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>الرقم الشخصي (QID):</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044' }}>{reportTeacher.employeeId}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>القسم والوظيفة:</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
                          {getDeptName(reportTeacher.departmentId, departments)} — {reportTeacher.subject}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>البريد الوزاري الرسمي:</span>
                        <div style={{ fontSize: '0.8rem', color: '#0284C7', direction: 'ltr', textAlign: 'right' }}>{reportTeacher.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Stat Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '0.85rem', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700 }}>الدرجة المحققة</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E40AF' }}>
                        {reportTeacherEvals[0]?.totalScore ?? 0}%
                      </div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '0.85rem', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 700 }}>التقدير المعتمد</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#065F46', marginTop: '0.2rem' }}>
                        {reportTeacherEvals[0]?.performanceLevel || 'غير مرصود'}
                      </div>
                    </div>
                    <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '0.85rem', border: '1px solid #FDE68A', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700 }}>عدد التقييمات المسجلة</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#B45309' }}>
                        {reportTeacherEvals.length}
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>منسق القسم</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', marginTop: '0.3rem' }}>
                        {DEPT_COORDINATORS[reportTeacher.departmentId] || 'منسق القسم'}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    {/* Radar Chart */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.75rem', textAlign: 'center' }}>
                        🕸️ توازن أداء المعلم في معايير نظام قطر الستة
                      </h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={teacherRadarData} outerRadius="70%">
                          <PolarGrid stroke="#CBD5E1" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} />
                          <Radar name="درجة المعلم" dataKey="score" stroke="#0096C7" fill="#0096C7" fillOpacity={0.45} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Trend Chart */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.75rem', textAlign: 'center' }}>
                        📈 مسار تطور درجات المعلم عبر شهور العام {year}
                      </h4>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={teacherTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" name="الدرجة الكلية (%)" stroke="#0F2044" strokeWidth={3} dot={{ r: 4, fill: '#00B4D8' }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Criteria breakdown table matching Image */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.75rem' }}>
                      📋 استمارة تقييم المعلم لنظام قطر للتعليم (المجموع من 100)
                    </h4>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                            <th style={{ padding: '0.65rem 0.5rem', width: '35px', textAlign: 'center' }}>م</th>
                            <th style={{ padding: '0.65rem' }}>معيار التقييم</th>
                            <th style={{ padding: '0.65rem', textAlign: 'center', width: '135px' }}>آلية القياس</th>
                            <th style={{ padding: '0.65rem', textAlign: 'center', width: '100px' }}>الدرجة المستحقة</th>
                            <th style={{ padding: '0.65rem', textAlign: 'center', width: '100px' }}>الدرجة المحرزة</th>
                            <th style={{ padding: '0.65rem' }}>شواهد وملاحظات الأداء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {QES_LMS_CRITERIA.map((crit, idx) => {
                            const ev = reportTeacherEvals[0];
                            const cData = ev?.criteria?.[idx];
                            const s = cData?.score;
                            const isDescriptive = crit.type === 'descriptive';
                            const isBool = crit.type === 'boolean';

                            let earnedDisplay = '-';
                            let earnedColor = '#0F2044';

                            if (ev) {
                              if (isDescriptive) {
                                earnedDisplay = cData?.value === 'لا' ? '❌ لا' : '✅ نعم';
                                earnedColor = cData?.value === 'لا' ? '#991B1B' : '#065F46';
                              } else if (isBool) {
                                const pass = Number(s) === 20 || cData?.value === 'نعم';
                                earnedDisplay = pass ? '20 (نعم)' : '0 (لا)';
                                earnedColor = pass ? '#065F46' : '#991B1B';
                              } else {
                                const numScore = Number(s) || 0;
                                earnedDisplay = `${numScore} / 20`;
                                earnedColor = numScore >= 18 ? '#065F46' : numScore >= 14 ? '#1E40AF' : '#991B1B';
                              }
                            }

                            return (
                              <tr key={crit.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: '#0F2044', textAlign: 'center' }}>{crit.num}</td>
                                <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0F2044' }}>{crit.name}</td>
                                <td style={{ padding: '0.65rem', textAlign: 'center', color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>
                                  {crit.measureType}
                                </td>
                                <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                                  {crit.scoreText}
                                </td>
                                <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 900, color: earnedColor, fontSize: '0.85rem' }}>
                                  {earnedDisplay}
                                </td>
                                <td style={{ padding: '0.65rem', color: '#334155', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                  {cData?.note ? (
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#0F2044' }}>{cData.note}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>{crit.evidence}</div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{crit.evidence}</div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#F1F5F9', borderTop: '2px solid #0F2044', fontWeight: 900 }}>
                            <td colSpan={3} style={{ padding: '0.75rem', color: '#0F2044', fontSize: '0.88rem' }}>
                              المجموع الكلي لنظام قطر للتعليم
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#475569' }}>
                              من 100
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '1.1rem', color: (reportTeacherEvals[0]?.totalScore ?? 0) >= 90 ? '#065F46' : '#1E40AF' }}>
                              {reportTeacherEvals[0]?.totalScore ?? 0}%
                            </td>
                            <td style={{ padding: '0.75rem', color: '#0F2044', fontSize: '0.82rem' }}>
                              التقدير العام: <span style={{ color: perf.color, fontWeight: 900 }}>{reportTeacherEvals[0]?.performanceLevel || perf.label}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {reportTeacherEvals[0] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: '#ECFDF5', padding: '0.75rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.8rem', marginBottom: '0.35rem' }}>🌟 نقاط القوة</div>
                        <FormattedReportPoints
                          text={reportTeacherEvals[0].strengths}
                          defaultText="تم رصد التزام عالٍ بتعليمات المنصة."
                          bulletColor="#059669"
                          fontSize="0.76rem"
                        />
                      </div>
                      <div style={{ background: '#FFFBEB', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                        <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.8rem', marginBottom: '0.35rem' }}>💡 التوصيات وفرص التحسين</div>
                        <FormattedReportPoints
                          text={reportTeacherEvals[0].recommendations}
                          defaultText="الاستمرار في تنويع التقييمات وحلقات النقاش."
                          bulletColor="#D97706"
                          fontSize="0.76rem"
                        />
                      </div>
                    </div>
                  )}

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #CBD5E1', paddingTop: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>المعلم المقيم</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{reportTeacher.nameAr}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>منسق المشاريع الإلكترونية</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/signature-ahmad.png" alt="م. أحمد طبيشات" style={{ height: '32px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>م. أحمد طبيشات</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>النائب الأكاديمي</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/signature-rani.png" alt="د. راني التوم" style={{ height: '32px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>د. راني التوم</div>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT VIEW 2: 🏢 تقرير القسم التراكمي */}
              {reportLevel === 'department' && reportDept && (
                <div id="qes-report-dept-container" className="printable-report qes-report-page" style={{ ...cardStyle, background: '#ffffff', position: 'relative', padding: '1.25rem 1.75rem' }}>
                  <OfficialReportHeader
                    title={`التقرير التراكمي لتفعيل نظام قطر للتعليم — قسم ${reportDept.nameAr}`}
                    subtitle={`تحليل الأداء التراكمي لمعلمي القسم والترتيب التنافسي — ${reportTerm} العام الأكاديمي ${year}`}
                    reportCode={`QES-DEP-${reportDept.id.toUpperCase()}-${year.replace('/', '-')}`}
                    academicYear={year}
                  />

                  {/* Header */}
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>تقرير أداء القسم</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F2044' }}>
                          قسم: {reportDept.nameAr} ({reportDept.nameEn})
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>المنسق المعتمد للقسم:</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0096C7' }}>{deptCoordinatorName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Department KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '0.85rem', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 700 }}>متوسط درجات القسم</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E40AF' }}>{deptAvgScore}%</div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '0.85rem', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 700 }}>عدد معلمي القسم</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#065F46' }}>{deptTeachers.length}</div>
                    </div>
                    <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '0.85rem', border: '1px solid #FDE68A', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700 }}>أعلى درجة بالقسم</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#B45309' }}>
                        {deptComparisonData[0]?.score ? `${deptComparisonData[0].score}%` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Comparison Bar Chart */}
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.75rem', textAlign: 'center' }}>
                      📊 مقارنة بيانية لدرجات تفعيل نظام قطر للتعليم بين معلمي قسم {reportDept.nameAr}
                    </h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={deptComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="score" name="الدرجة (%)" fill="#0096C7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Department Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                          <th style={{ padding: '0.6rem' }}>#</th>
                          <th style={{ padding: '0.6rem' }}>اسم المعلم</th>
                          <th style={{ padding: '0.6rem' }}>الرقم الشخصي</th>
                          <th style={{ padding: '0.6rem' }}>المسمى الوظيفي</th>
                          <th style={{ padding: '0.6rem', textAlign: 'center' }}>الدرجة</th>
                          <th style={{ padding: '0.6rem', textAlign: 'center' }}>التقدير</th>
                          <th style={{ padding: '0.6rem', textAlign: 'center' }}>حالة الرصد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptComparisonData.map((item, idx) => (
                          <tr key={item.teacher.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '0.6rem', color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0F2044' }}>{item.teacher.nameAr}</td>
                            <td style={{ padding: '0.6rem', color: '#64748B' }}>{item.teacher.employeeId}</td>
                            <td style={{ padding: '0.6rem', color: '#475569' }}>{item.teacher.subject}</td>
                            <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 900, color: item.score >= 90 ? '#065F46' : item.score >= 80 ? '#1E40AF' : '#991B1B' }}>
                              {item.score > 0 ? `${item.score}%` : '-'}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                              {item.score > 0 ? (
                                <span style={{ background: getPerformanceLevel(item.score).bg, color: getPerformanceLevel(item.score).color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                                  {item.level}
                                </span>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>لم يُرصد</span>
                              )}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                              <span style={{ color: item.count > 0 ? '#10B981' : '#F59E0B', fontWeight: 700, fontSize: '0.75rem' }}>
                                {item.count > 0 ? `✅ مكتمل (${item.count})` : '⏳ بانتظار الرصد'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Department Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #CBD5E1', paddingTop: '1rem' }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>منسق القسم المعتمد</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0096C7' }}>{deptCoordinatorName}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>منسق المشاريع الإلكترونية</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/signature-ahmad.png" alt="م. أحمد طبيشات" style={{ height: '32px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>م. أحمد طبيشات</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>النائب الأكاديمي</div>
                      <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/signature-rani.png" alt="د. راني التوم" style={{ height: '32px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>د. راني التوم</div>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT VIEW 3: 🏫 تقرير المدرسة الشامل */}
              {reportLevel === 'school' && (
                <div id="qes-report-school-container" className="printable-report" style={{ background: '#ffffff', position: 'relative' }}>
                  {/* ══════════════════════════════════════════════════════════════
                      PAGE 1: لوحة المؤشرات التنفيذية الشاملة (Executive Dashboard A3 Landscape)
                  ══════════════════════════════════════════════════════════════ */}
                  <div
                    className="qes-report-page"
                    style={{
                      ...cardStyle,
                      background: '#ffffff',
                      position: 'relative',
                      padding: '1.25rem 1.75rem',
                      boxSizing: 'border-box',
                      marginBottom: '2rem'
                    }}
                  >
                    <OfficialReportHeader
                      title="التقرير التنفيذي الشامل لنظام قطر للتعليم — مدرسة قطر للعلوم والتكنولوجيا"
                      subtitle={`تحليل شامل لمؤشرات الأداء لكافة الأقسام الـ 13 والكادر المدرسي — ${reportPeriodType === 'month' ? `شهر ${reportMonth}` : reportTerm} للعام الأكاديمي ${year}`}
                      reportCode={`QES-SCH-EXEC-${year.replace('/', '-')}`}
                      academicYear={year}
                    />

                    {/* Header Banner */}
                    <div style={{ background: 'linear-gradient(135deg, #0F2044 0%, #1E3A5F 100%)', borderRadius: '10px', padding: '0.85rem 1.25rem', color: '#fff', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                            🏫 التقرير التنفيذي الشامل لنظام قطر للتعليم — مدرسة قطر للعلوم والتكنولوجيا
                          </h3>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)' }}>
                            الفترة المعتمدة: {reportPeriodType === 'month' ? `شهر ${reportMonth}` : reportTerm} | العام الأكاديمي {year} | عدد الأقسام الأكاديمية: {schoolDeptRankings.length} قسماً
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.9rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>متوسط المدرسة العام</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00B4D8' }}>{schoolTotalAvg}%</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.9rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>إجمالي التقييمات</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
                              {schoolRatingDistribution.reduce((a, b) => a + b.value, 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* School 3 Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      {/* Department Ranking Bar Chart */}
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem 0.85rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.5rem', textAlign: 'center' }}>
                          📊 مقارنة متوسطات أقسام المدرسة في نظام قطر للتعليم
                        </h4>
                        <SchoolDeptBarsChart data={schoolDeptRankings} />
                      </div>

                      {/* School Criteria Radar Chart */}
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem 0.85rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.5rem', textAlign: 'center' }}>
                          🕸️ توازن أداء معايير نظام قطر للتعليم الستة
                        </h4>
                        <SchoolRadarChart data={schoolRadarData} />
                      </div>

                      {/* Rating Distribution Donut Chart */}
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem 0.85rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.5rem', textAlign: 'center' }}>
                          🍩 التوزيع النسبي لمستويات أداء المعلمين بالمدرسة
                        </h4>
                        <SchoolDonutChart data={schoolRatingDistribution} />
                      </div>
                    </div>

                    {/* Honor Board */}
                    {schoolHonorRoll.length > 0 && (
                      <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1.5px solid #F59E0B', borderRadius: '10px', padding: '0.65rem 0.9rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>🏆</span>
                          <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, color: '#92400E' }}>
                            لوحة شرف المعلمين الأكثر تميزاً في تفعيل نظام قطر للتعليم (العشرة الأوائل)
                          </h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                          {schoolHonorRoll.slice(0, 10).map((h, i) => (
                            <div key={h.teacher.id} style={{ background: '#fff', borderRadius: '6px', padding: '0.35rem 0.55rem', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.76rem', color: '#0F2044', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {h.teacher.nameAr}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {getDeptName(h.teacher.departmentId, departments)}
                                </div>
                              </div>
                              <span style={{ background: '#10B981', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 900, fontSize: '0.74rem', flexShrink: 0 }}>
                                {h.avg}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Departments Ranking Table */}
                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.45rem' }}>
                        📋 الترتيب العام للأقسام الأكاديمية ونسب التميز
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                        <thead>
                          <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                            <th style={{ padding: '0.45rem 0.6rem' }}>الترتيب</th>
                            <th style={{ padding: '0.45rem 0.6rem' }}>القسم</th>
                            <th style={{ padding: '0.45rem 0.6rem' }}>المنسق المعتمد</th>
                            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>عدد المعلمين</th>
                            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>متوسط الدرجة</th>
                            <th style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>نسبة التميز</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolDeptRankings.map((r, idx) => (
                            <tr key={r.deptId} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '0.38rem 0.6rem', fontWeight: 800, color: idx < 3 ? '#D97706' : '#64748B' }}>
                                {idx === 0 ? '🥇 الأول' : idx === 1 ? '🥈 الثاني' : idx === 2 ? '🥉 الثالث' : `${idx + 1}`}
                              </td>
                              <td style={{ padding: '0.38rem 0.6rem', fontWeight: 800, color: '#0F2044' }}>{r.deptName}</td>
                              <td style={{ padding: '0.38rem 0.6rem', color: '#475569' }}>{r.coordinator}</td>
                              <td style={{ padding: '0.38rem 0.6rem', textAlign: 'center' }}>{r.teacherCount}</td>
                              <td style={{ padding: '0.38rem 0.6rem', textAlign: 'center', fontWeight: 900, color: r.avgScore >= 90 ? '#065F46' : r.avgScore >= 80 ? '#1E40AF' : '#991B1B' }}>
                                {r.avgScore > 0 ? `${r.avgScore}%` : '-'}
                              </td>
                              <td style={{ padding: '0.38rem 0.6rem', textAlign: 'center', fontWeight: 700, color: '#0096C7' }}>
                                {r.excellenceRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* School Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #CBD5E1', paddingTop: '0.75rem' }}>
                      <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F2044' }}>منسق المشاريع الإلكترونية</div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/signature-ahmad.png" alt="م. أحمد طبيشات" style={{ height: '30px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>م. أحمد طبيشات</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F2044' }}>النائب الأكاديمي</div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/signature-rani.png" alt="د. راني التوم" style={{ height: '30px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>د. راني التوم</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F2044' }}>مدير المدرسة</div>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/principal-signature.png" alt="محمد علي مندني العمادي" style={{ height: '36px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>محمد علي مندني العمادي</div>
                      </div>
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════════
                      SUBSEQUENT PAGES: الملحق التفصيلي: إحصاءات الأقسام الـ 13 وسجل تقييم المعلمين
                  ══════════════════════════════════════════════════════════════ */}
                  {deptPages.map((pageDepts, pIdx) => (
                    <div
                      key={`dept-page-${pIdx}`}
                      className="qes-report-page"
                      style={{
                        ...cardStyle,
                        background: '#ffffff',
                        position: 'relative',
                        padding: '1.25rem 1.75rem',
                        boxSizing: 'border-box',
                        marginBottom: '2rem'
                      }}
                    >
                      <OfficialReportHeader
                        title="الملحق التفصيلي: إحصاءات الأقسام الأكاديمية الـ 13 وسجل تقييم المعلمين"
                        subtitle={`بيانات تفصيلية شاملة لكل قسم أكاديمي مع قائمة المعلمين، درجات التقييم، والتقديرات المعتمدة — الجزء ${pIdx + 1} من ${deptPages.length}`}
                        reportCode={`QES-SCH-APPX-${pIdx + 1}-${year.replace('/', '-')}`}
                        academicYear={year}
                      />

                      {/* Page Banner */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>📑</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0F2044' }}>
                              الملحق التفصيلي: إحصاءات الأقسام الأكاديمية وسجل تقييم المعلمين (الجزء {pIdx + 1} من {deptPages.length})
                            </h4>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                              الفترة: {reportPeriodType === 'month' ? `شهر ${reportMonth}` : reportTerm} {year} | أقسام هذا الملحق: {pageDepts.map(d => d.deptName).join('، ')}
                            </p>
                          </div>
                        </div>
                        <div style={{ background: '#0F2044', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                          أقسام هذا الجزء: {pageDepts.length} قسماً
                        </div>
                      </div>

                      {/* Department Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pageDepts.map((dept, dIdx) => (
                          <div
                            key={dept.deptId}
                            className="page-break-avoid"
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #CBD5E1',
                              borderRadius: '10px',
                              padding: '1rem',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                              pageBreakInside: 'avoid',
                              breakInside: 'avoid'
                            }}
                          >
                            {/* Department Header with Summary KPIs */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ background: '#0F2044', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                                  {pIdx * 4 + dIdx + 1}
                                </span>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0F2044' }}>
                                    قسم: {dept.deptName}
                                  </h4>
                                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>المنسق المعتمد للقسم: <strong>{dept.coordinator}</strong></span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ background: '#EFF6FF', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.64rem', color: '#1E40AF', display: 'block', fontWeight: 700 }}>عدد المعلمين</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1E40AF' }}>{dept.teacherCount}</span>
                                </div>
                                <div style={{ background: '#ECFDF5', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.64rem', color: '#065F46', display: 'block', fontWeight: 700 }}>متوسط القسم</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#065F46' }}>{dept.avgScore > 0 ? `${dept.avgScore}%` : '-'}</span>
                                </div>
                                <div style={{ background: '#FFFBEB', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #FDE68A', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.64rem', color: '#92400E', display: 'block', fontWeight: 700 }}>نسبة التميز</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#B45309' }}>{dept.excellenceRate}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Teachers Table in this Department */}
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                                <thead>
                                  <tr style={{ background: '#0F2044', color: '#ffffff', textAlign: 'right' }}>
                                    <th style={{ padding: '0.4rem 0.5rem', width: '30px', textAlign: 'center' }}>#</th>
                                    <th style={{ padding: '0.4rem 0.5rem' }}>اسم المعلم</th>
                                    <th style={{ padding: '0.4rem 0.5rem', width: '100px' }}>الرقم الشخصي</th>
                                    <th style={{ padding: '0.4rem 0.5rem' }}>المادة / المسمى الوظيفي</th>
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '80px' }}>الدرجة</th>
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '100px' }}>التقدير المعتمد</th>
                                    <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center', width: '100px' }}>حالة الرصد</th>
                                    <th style={{ padding: '0.4rem 0.5rem' }}>ملاحظات الأداء والشواهد</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dept.teachers && dept.teachers.length > 0 ? (
                                    dept.teachers.map((tItem, tIdx) => {
                                      const perf = getPerformanceLevel(tItem.score);
                                      return (
                                        <tr key={tItem.teacher.id} style={{ background: tIdx % 2 === 0 ? '#ffffff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                          <td style={{ padding: '0.38rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>{tIdx + 1}</td>
                                          <td style={{ padding: '0.38rem 0.5rem', fontWeight: 800, color: '#0F2044' }}>{tItem.teacher.nameAr}</td>
                                          <td style={{ padding: '0.38rem 0.5rem', color: '#64748B', fontWeight: 600 }}>{tItem.teacher.employeeId || '-'}</td>
                                          <td style={{ padding: '0.38rem 0.5rem', color: '#475569' }}>{tItem.teacher.subject || '-'}</td>
                                          <td style={{ padding: '0.38rem 0.5rem', textAlign: 'center', fontWeight: 900, color: tItem.score >= 90 ? '#065F46' : tItem.score >= 80 ? '#1E40AF' : tItem.score > 0 ? '#991B1B' : '#94A3B8' }}>
                                            {tItem.score > 0 ? `${tItem.score}%` : '-'}
                                          </td>
                                          <td style={{ padding: '0.38rem 0.5rem', textAlign: 'center' }}>
                                            {tItem.score > 0 ? (
                                              <span style={{ background: perf.bg, color: perf.color, padding: '0.12rem 0.45rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800 }}>
                                                {tItem.level}
                                              </span>
                                            ) : (
                                              <span style={{ color: '#94A3B8', fontSize: '0.68rem' }}>لم يُرصد</span>
                                            )}
                                          </td>
                                          <td style={{ padding: '0.38rem 0.5rem', textAlign: 'center' }}>
                                            <span style={{ color: tItem.isEvaluated ? '#10B981' : '#F59E0B', fontWeight: 700, fontSize: '0.68rem' }}>
                                              {tItem.isEvaluated ? '✅ مكتمل' : '⏳ بانتظار الرصد'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '0.38rem 0.5rem', color: '#64748B', fontSize: '0.7rem' }}>
                                            {tItem.notes && tItem.notes !== '-' ? tItem.notes : 'مستوفي المتطلبات الوزارية'}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={8} style={{ padding: '0.75rem', textAlign: 'center', color: '#94A3B8' }}>لا يوجد معلمون مسجلون في هذا القسم</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Page Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.65rem', marginTop: '1rem', fontSize: '0.68rem', color: '#94A3B8' }}>
                        <div>مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — تقرير تقييم نظام قطر للتعليم المعتمد ({year})</div>
                        <div>صفحة {pIdx + 2} من {deptPages.length + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: 👥 دليل المعلمين المعتمد ٢٠٢٦-٢٠٢٧ م
          ══════════════════════════════════════════════════════════════ */}
          {mainTab === 'directory' && (
            <div className="no-print">
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                      👥 دليل كادر المعلمين المعتمد للعام الأكاديمي ٢٠٢٦-٢٠٢٧ م ({filteredDirectory.length} موظفاً)
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      القائمة الرسمية المعتمدة لكافة المعلمين والإداريين وأقسامهم وأرقامهم الشخصية وبريدهم الوزاري
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                  <input
                    placeholder="🔍 بحث بالاسم، الرقم الشخصي، أو البريد..."
                    value={dirSearch}
                    onChange={e => setDirSearch(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                  <select
                    value={dirDeptFilter}
                    onChange={e => setDirDeptFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="">كافة الأقسام</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                  </select>
                  <select
                    value={dirCategoryFilter}
                    onChange={e => setDirCategoryFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  >
                    <option value="">كافة الفئات</option>
                    <option value="معلم">أكاديمي / معلم</option>
                    <option value="إداري">إداري</option>
                    <option value="أخصائي">أخصائي</option>
                    <option value="مهندس">مهندس مختبرات</option>
                  </select>
                </div>

                {/* Directory Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                        <th style={{ padding: '0.65rem' }}>#</th>
                        <th style={{ padding: '0.65rem' }}>الاسم بالعربية</th>
                        <th style={{ padding: '0.65rem' }}>الاسم بالإنجليزية</th>
                        <th style={{ padding: '0.65rem' }}>الرقم الشخصي (QID)</th>
                        <th style={{ padding: '0.65rem' }}>القسم</th>
                        <th style={{ padding: '0.65rem' }}>الوظيفة / المادة</th>
                        <th style={{ padding: '0.65rem' }}>البريد الإلكتروني الوزاري</th>
                        <th style={{ padding: '0.65rem', textAlign: 'center' }}>إجراء فوري</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDirectory.map((t, idx) => (
                        <tr key={t.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.65rem', color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0F2044' }}>{t.nameAr}</td>
                          <td style={{ padding: '0.65rem', color: '#64748B', fontSize: '0.75rem', direction: 'ltr', textAlign: 'right' }}>{t.nameEn}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0096C7' }}>{t.employeeId}</td>
                          <td style={{ padding: '0.65rem', color: '#334155' }}>{getDeptName(t.departmentId, departments)}</td>
                          <td style={{ padding: '0.65rem', color: '#475569' }}>{t.subject}</td>
                          <td style={{ padding: '0.65rem', color: '#0284C7', direction: 'ltr', textAlign: 'right', fontSize: '0.75rem' }}>{t.email}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setTeacherId(t.id);
                                setMainTab('form');
                              }}
                              style={{
                                background: '#0F2044',
                                color: '#fff',
                                border: 'none',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              📝 تقييم
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
