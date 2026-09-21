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
  EVALUATION_CRITERIA
} from '@/lib/data';
import type { User, Teacher, Evaluation, Department } from '@/lib/data';
import * as XLSX from 'xlsx';
import {
  Monitor, Layers, Award, BookOpen, Target, Sparkles, Zap, ShieldCheck, Cpu, Database, CheckCircle2, ListTodo, GraduationCap, Trophy, BarChart3, Settings, ClipboardList, ShieldAlert, Users
} from 'lucide-react';

interface Props { currentUser: User; selectedYear?: string; }

type ReportType = 'monthly' | 'annual' | 'dept' | 'followup' | 'progress' | 'comparison' | 'threeyear' | 'highperf' | 'modellessons' | 'elearning';

const REPORT_TYPES: { id: ReportType; label: string; icon: string; desc: string }[] = [
  { id: 'monthly',      label: 'تقرير شهري للمعلمين',              icon: '📅', desc: 'أداء المعلمين خلال شهر محدد' },
  { id: 'annual',       label: 'تقرير سنوي',                        icon: '📆', desc: 'ملخص الأداء السنوي الشامل' },
  { id: 'dept',         label: 'تقرير حسب القسم',                  icon: '🏫', desc: 'أداء معلمي قسم بعينه' },
  { id: 'modellessons', label: 'حصص التعليم الإلكتروني النموذجية', icon: '💻', desc: 'تقييمات الحصص الميدانية والأدوات الرقمية' },
  { id: 'followup',     label: 'تقرير يحتاجون متابعة',            icon: '⚠️', desc: 'معلمون أداؤهم أقل من 80%' },
  { id: 'progress',     label: 'تطور المعلم خلال العام',           icon: '📈', desc: 'منحنى تطور أداء معلم واحد' },
  { id: 'comparison',   label: 'مقارنة بين الأقسام',               icon: '⚖️', desc: 'تحليل مقارن لأداء الأقسام' },
  { id: 'threeyear',    label: 'أداء آخر ثلاث سنوات',             icon: '📊', desc: 'التطور التراكمي للمعلم' },
  { id: 'highperf',     label: 'الأقسام الأربعة الرئيسية',          icon: '⭐', desc: 'أداء الأقسام الأربعة الرئيسية' },
  { id: 'elearning',    label: 'تقرير نظام التعليم الالكتروني والحلول الرقمية', icon: '📘', desc: 'خصائص وأهداف النظام وإحصائيات تفعيله' },
];

// ─── Pure SVG Bar Chart (print-safe) ───────────────────────────────────────
function SvgBarChart({ data, color = '#0369A1', label = 'الأداء %' }: {
  data: { name: string; value: number }[];
  color?: string;
  label?: string;
}) {
  if (!data.length) return null;
  const svgW = 680, svgH = 200;
  const padL = 40, padR = 16, padT = 20, padB = 48;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const maxVal = Math.max(...data.map(d => d.value), 100);
  const barW = Math.min((chartW / data.length) * 0.55, 38);
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
            <rect x={cx - barW / 2} y={padT + chartH - bH} width={barW} height={bH} fill={bc} rx={3} />
            {d.value > 0 && (
              <text x={cx} y={padT + chartH - bH - 4} textAnchor="middle" fontSize={8} fill={bc} fontWeight={800}>
                {d.value}%
              </text>
            )}
            <text x={cx} y={padT + chartH + 14} textAnchor="middle" fontSize={8} fill="#64748B" fontWeight={700}>
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

// ─── Pure SVG Line/Area Chart for progress ──────────────────────────────────
function SvgLineChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return null;
  const svgW = 680, svgH = 200;
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
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0369A1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.02" />
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
      {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}
      {pts.length > 1 && <polyline points={polyline} fill="none" stroke="#0369A1" strokeWidth={2} />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#0369A1" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={8} fill="#0369A1" fontWeight={800}>{p.v}%</text>
          <text x={p.x} y={padT + chartH + 14} textAnchor="middle" fontSize={8} fill="#64748B" fontWeight={700}>
            {p.n.split(' ')[0]}
          </text>
        </g>
      ))}
      <line x1={padL} x2={padL} y1={padT} y2={padT + chartH} stroke="#CBD5E1" />
      <line x1={padL} x2={padL + chartW} y1={padT + chartH} y2={padT + chartH} stroke="#CBD5E1" />
    </svg>
  );
}

// ─── Report Header (logos + blue title banner) ──────────────────────────────
function ReportHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <img src="/ministry-logo.png" alt="وزارة التعليم والتعليم العالي" style={{ height: '85px', maxWidth: '175px', objectFit: 'contain' }} />
        <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '85px', maxWidth: '175px', objectFit: 'contain' }} />
      </div>
      <div style={{
        background: '#0F2044', borderRadius: '10px', padding: '0.8rem 2rem',
        marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '1.25rem',
        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
      }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap' }}>{title}</h1>
        <span style={{ color: '#BAE6FD', fontSize: '1rem' }}>|</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{subtitle}</span>
      </div>
    </>
  );
}

// ─── KPI Cards ──────────────────────────────────────────────────────────────
function KpiCards({ cards }: { cards: { label: string; value: string | number; color: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: '0.75rem', marginBottom: '1.75rem' }}>
      {cards.map(({ label, value, color }, i) => (
        <div key={i} style={{
          border: '1px solid #E2E8F0', borderTop: `4px solid ${color}`,
          borderRadius: '10px', padding: '1rem', textAlign: 'center',
          printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', background: '#fff'
        }}>
          <p style={{ fontSize: '0.68rem', color: '#64748B', margin: 0, fontWeight: 800 }}>{label}</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 900, color, margin: '0.3rem 0 0' }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Performance Badge ───────────────────────────────────────────────────────
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

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  const color = value >= 90 ? '#10B981' : value >= 80 ? '#0369A1' : value >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '4px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color, width: '38px' }}>{value}%</span>
    </div>
  );
}

// ─── Signature Footer ────────────────────────────────────────────────────────
function SignatureFooter() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
      <div style={{ textAlign: 'center', width: '160px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem' }}>توقيع منسق التقييم</p>
        <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
        <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>م. أحمد عادل طبيشات</p>
      </div>
      <div style={{ textAlign: 'center', width: '160px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem' }}>توقيع النائب الأكاديمي</p>
        <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
        <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>د. راني التوم</p>
      </div>
      <div style={{ textAlign: 'center', width: '160px' }}>
        <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem' }}>توقيع مدير المدرسة</p>
        <div style={{ height: '36px', margin: '0 auto 4px' }} />
        <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>___________________</p>
      </div>
    </div>
  );
}

// ─── Table Wrapper ───────────────────────────────────────────────────────────
function ReportTable({ headers, rows, emptyMsg }: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMsg: string;
}) {
  return (
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
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReportsPage({ currentUser, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [individualPDRecords, setIndividualPDRecords] = useState<any[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState(MONTHS[0]);
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
        setLoading(false);
        if (t.length > 0) setSelTeacherId(t[0].id);
      });
  }, []);

  const filteredTeachersList = useMemo(() => {
    if (isCoord && coordDepts.length > 0) return teachers.filter(t => coordDepts.includes(t.departmentId));
    return teachers;
  }, [teachers, isCoord, coordDepts]);

  const reportData = useMemo(() => {
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
        if (selDept) return list.filter(r => r.t.departmentId === selDept).sort((a: any, b: any) => a.averageScore - b.averageScore);
        return list.sort((a: any, b: any) => a.averageScore - b.averageScore);
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
          return { m, t, dept, perf, averageScore: (m.overallScore || 0) * 10 };
        }).sort((a, b) => (b.m.date || '').localeCompare(a.m.date || ''));
      }
      case 'elearning': {
        return [];
      }
      default: return [];
    }
  }, [evaluations, modelLessonEvals, selYear, selMonth, selDept, selTeacherId, reportType, teachers, departments, isCoord, coordDepts, filteredTeachersList, loading, availableDepts]);

  const honorees = useMemo(() => {
    if (reportType !== 'monthly' && reportType !== 'dept') return [];
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (selDept) list = list.filter(h => h.departmentId === selDept);
    if (isCoord && coordDepts.length > 0) list = list.filter(h => coordDepts.includes(h.departmentId));
    return list;
  }, [evaluations, teachers, departments, selYear, selMonth, selDept, reportType, isCoord, coordDepts]);

  const chartData = useMemo(() => {
    if (reportType === 'monthly') return reportData.slice(0, 12).map((r: any) => ({ name: r.t?.nameAr?.substring(0, 14) || '-', value: r.ev.totalScore }));
    if (reportType === 'annual' || reportType === 'dept') return reportData.slice(0, 12).map((r: any) => ({ name: r.t?.nameAr?.substring(0, 14) || '-', value: r.averageScore }));
    if (reportType === 'modellessons') return reportData.slice(0, 12).map((r: any) => ({ name: (r.t?.nameAr || r.m.teacherNameAr)?.substring(0, 14) || '-', value: Math.round((r.m.overallScore || 0) * 10) }));
    if (reportType === 'followup') return reportData.map((r: any) => ({ name: r.t?.nameAr?.substring(0, 14) || '-', value: r.averageScore }));
    if (reportType === 'progress') return reportData.map((r: any) => ({ name: r.monthName, value: r.ev.totalScore }));
    if (reportType === 'comparison' || reportType === 'highperf') return reportData.map((r: any) => ({ name: r.nameAr, value: r.averageScore }));
    if (reportType === 'threeyear') return reportData.map((r: any) => ({ name: r.year, value: r.averageScore }));
    return [];
  }, [reportData, reportType]);

  const kpiCards = useMemo(() => {
    const scores = reportType === 'monthly' ? reportData.map((r: any) => r.ev.totalScore)
      : reportType === 'progress' ? reportData.map((r: any) => r.ev.totalScore)
      : reportType === 'modellessons' ? reportData.map((r: any) => (r.m.overallScore || 0) * 10)
      : reportData.map((r: any) => r.averageScore);
    const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10) / 10 : 0;

    if (reportType === 'monthly') return [
      { label: 'إجمالي التقييمات', value: reportData.length, color: '#0F2044' },
      { label: 'متوسط الأداء الشهري', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
      { label: 'متميزون (≥90%)', value: scores.filter((s: number) => s >= 90).length, color: '#10B981' },
      { label: 'يحتاجون متابعة (<80%)', value: scores.filter((s: number) => s < 80).length, color: '#EF4444' },
    ];
    if (reportType === 'modellessons') {
      const rawScores = reportData.map((r: any) => r.m.overallScore || 0);
      const rawAvg = rawScores.length ? Math.round((rawScores.reduce((a: number, b: number) => a + b, 0) / rawScores.length) * 10) / 10 : 0;
      return [
        { label: 'إجمالي الحصص المقيمة', value: reportData.length, color: '#0F2044' },
        { label: 'متوسط تقييم الحصص', value: `${rawAvg} / 10`, color: rawAvg >= 8.5 ? '#10B981' : '#0369A1' },
        { label: 'أداء متميز (≥ 9/10)', value: rawScores.filter((s: number) => s >= 9).length, color: '#10B981' },
        { label: 'نسبة الإتقان العامة', value: `${avg}%`, color: '#0369A1' },
      ];
    }
    if (reportType === 'annual' || reportType === 'dept') return [
      { label: 'إجمالي المعلمين', value: reportData.length, color: '#0F2044' },
      { label: 'متوسط الأداء السنوي', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
      { label: 'متميزون سنوياً', value: scores.filter((s: number) => s >= 90).length, color: '#10B981' },
      { label: 'يحتاجون متابعة', value: scores.filter((s: number) => s < 80).length, color: '#EF4444' },
    ];
    if (reportType === 'followup') return [
      { label: 'معلمون يحتاجون متابعة', value: reportData.length, color: '#EF4444' },
      { label: 'متوسط أداء المجموعة', value: `${avg}%`, color: '#F59E0B' },
      { label: 'إجمالي التقييمات', value: reportData.reduce((a: number, b: any) => a + b.count, 0), color: '#0369A1' },
      { label: 'حالة حرجة (<75%)', value: scores.filter((s: number) => s < 75).length, color: '#991B1B' },
    ];
    if (reportType === 'progress') {
      const t = teachers.find(x => x.id === selTeacherId);
      return [
        { label: 'عدد تقييمات المعلم', value: reportData.length, color: '#0F2044' },
        { label: 'متوسط أداء المعلم', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
        { label: 'أعلى درجة شهرية', value: scores.length ? `${Math.max(...scores)}%` : '-', color: '#10B981' },
        { label: 'أقل درجة شهرية', value: scores.length ? `${Math.min(...scores)}%` : '-', color: '#EF4444' },
      ];
    }
    if (reportType === 'comparison' || reportType === 'highperf') {
      const best = reportData.length ? [...reportData].sort((a: any, b: any) => b.averageScore - a.averageScore)[0] : null;
      return [
        { label: 'عدد الأقسام المشمولة', value: reportData.length, color: '#0F2044' },
        { label: 'المتوسط العام للمدرسة', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
        { label: 'القسم الأعلى أداءً', value: best ? best.nameAr : '-', color: '#10B981' },
        { label: 'إجمالي المعلمين', value: reportData.reduce((a: number, b: any) => a + b.teachersCount, 0), color: '#0369A1' },
      ];
    }
    if (reportType === 'threeyear') {
      const best = reportData.length ? [...reportData].sort((a: any, b: any) => b.averageScore - a.averageScore)[0] : null;
      return [
        { label: 'الأعوام الدراسية', value: reportData.length, color: '#0F2044' },
        { label: 'المتوسط التراكمي', value: `${avg}%`, color: avg >= 80 ? '#10B981' : '#F59E0B' },
        { label: 'أعلى سنة أداءً', value: best ? best.year : '-', color: '#10B981' },
        { label: 'إجمالي التقييمات', value: reportData.reduce((a: number, b: any) => a + b.count, 0), color: '#0369A1' },
      ];
    }
    return [];
  }, [reportData, reportType, teachers, selTeacherId]);

  const elearningStats = useMemo(() => {
    const totalTeachers = teachers.length;
    const totalEvals = evaluations.length;
    const totalTasks = dailyTasks.length;
    const completedTasks = dailyTasks.filter(t => t.status === 'مكتملة' || t.status === 'يوجد دليل إنجاز').length;
    const totalAchievements = achievements.length;
    const totalWorkshops = workshops.length;
    
    let avgScore = 0;
    if (totalEvals > 0) {
      const sum = evaluations.reduce((acc, ev) => acc + ev.totalScore, 0);
      avgScore = Math.round((sum / totalEvals) * 10) / 10;
    }
    
    // Find most active department (highest average score)
    const deptScores: Record<string, number[]> = {};
    evaluations.forEach(ev => {
      const t = teachers.find(x => x.id === ev.teacherId);
      if (t) {
        if (!deptScores[t.departmentId]) deptScores[t.departmentId] = [];
        deptScores[t.departmentId].push(ev.totalScore);
      }
    });
    
    let bestDeptName = '-';
    let bestDeptAvg = 0;
    Object.entries(deptScores).forEach(([deptId, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestDeptAvg) {
        bestDeptAvg = avg;
        const d = departments.find(x => x.id === deptId);
        bestDeptName = d ? d.nameAr : deptId;
      }
    });
    
    return {
      totalTeachers,
      totalEvals,
      totalTasks,
      completedTasks,
      totalAchievements,
      totalWorkshops,
      avgScore,
      bestDeptName,
      bestDeptAvg: Math.round(bestDeptAvg * 10) / 10,
      modelLessonCount: modelLessonEvals.length
    };
  }, [teachers, evaluations, dailyTasks, achievements, workshops, departments, modelLessonEvals]);

  function exportExcel() {
    let rows: any[] = [];
    if (reportType === 'monthly') rows = reportData.map(({ ev, t, dept, perf }: any) => ({ 'اسم المعلم': t?.nameAr || '-', 'الرقم الوظيفي': t?.employeeId || '-', 'القسم': dept, 'الشهر': ev.month, 'المجموع': ev.totalScore, 'مستوى الأداء': perf.label, 'نقاط القوة': ev.strengths || '-', 'التوصيات': ev.recommendations || '-' }));
    else if (reportType === 'modellessons') rows = reportData.map((r: any, i: number) => ({ '#': i + 1, 'اسم المعلم': r.t?.nameAr || r.m.teacherNameAr, 'القسم': r.dept, 'تاريخ الحصة': r.m.date, 'الحصة': r.m.period, 'الصف': r.m.classGrade, 'الأدوات الرقمية': r.m.toolsUsed, 'الدرجة (من 10)': r.m.overallScore, 'مستوى الأداء': r.perf.label, 'الحضور': r.m.attendees || '-', 'رابط خطة الدرس': r.m.lessonPlanUrl || '-', 'نقاط القوة': r.m.strengths || '-', 'جوانب التحسين': r.m.improvements || '-', 'التوصيات': r.m.recommendations || '-' }));
    else if (['annual', 'dept'].includes(reportType)) rows = reportData.map((r: any) => ({ 'اسم المعلم': r.t?.nameAr || '-', 'القسم': r.dept, 'عدد التقييمات': r.count, 'المتوسط': r.averageScore, 'أعلى درجة': r.highestScore, 'أقل درجة': r.lowestScore, 'مستوى الأداء': r.perf.label }));
    else if (reportType === 'followup') rows = reportData.map((r: any) => ({ 'اسم المعلم': r.t?.nameAr || '-', 'القسم': r.dept, 'متوسط الأداء': r.averageScore, 'البند الأضعف': r.weakestLabel, 'التوصيات': r.recs }));
    else if (reportType === 'progress') rows = reportData.map((r: any) => ({ 'الشهر': r.monthName, 'الدرجة': r.ev.totalScore, 'مستوى الأداء': r.perf.label }));
    else if (['comparison', 'highperf'].includes(reportType)) rows = reportData.map((r: any) => ({ 'القسم': r.nameAr, 'عدد المعلمين': r.teachersCount, 'المتوسط': r.averageScore, 'المتميزون': r.excellentCount }));
    else if (reportType === 'threeyear') rows = reportData.map((r: any) => ({ 'العام': r.year, 'المتوسط': r.averageScore, 'مستوى الأداء': r.perf.label }));
    else if (reportType === 'elearning') {
      rows = [
        { 'العنصر الفني': 'رؤية النظام وأهدافه', 'الوصف والتفاصيل': 'نظام إلكتروني شامل لمتابعة وتقييم تفعيل المعلمين للأنشطة الإلكترونية وحل المشكلات الرقمية للكوادر والمشاريع.' },
        { 'العنصر الفني': 'إجمالي المعلمين الموثقين', 'الوصف والتفاصيل': `${teachers.length} معلم نشط` },
        { 'العنصر الفني': 'إجمالي التقييمات المرصودة', 'الوصف والتفاصيل': `${evaluations.length} تقييم شهري` },
        { 'العنصر الفني': 'إجمالي حصص التعليم الإلكتروني', 'الوصف والتفاصيل': `${modelLessonEvals.length} حصة نموذجية موثقة` },
        { 'العنصر الفني': 'إجمالي الورش التدريبية', 'الوصف والتفاصيل': `${workshops.length} ورشة عمل` },
        { 'العنصر الفني': 'إجمالي المهام المتابعة للمشاريع', 'الوصف والتفاصيل': `${dailyTasks.length} مهمة إلكترونية` },
        { 'العنصر الفني': 'إجمالي الإنجازات والجوائز الموثقة', 'الوصف والتفاصيل': `${achievements.length} إنجاز وطني وعالمي` },
        { 'العنصر الفني': 'مطور النظام ومنسق المشاريع', 'الوصف والتفاصيل': DESIGNER_CREDIT }
      ];
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
    XLSX.writeFile(wb, `report_${reportType}_${selYear}.xlsx`);
  }

  const currentReportInfo = REPORT_TYPES.find(r => r.id === reportType)!;
  const selectedTeacher = teachers.find(t => t.id === selTeacherId);

  const reportSubtitle = [
    `العام الأكاديمي: ${selYear}`,
    reportType === 'monthly' ? `الشهر: ${selMonth}` : '',
    (reportType === 'progress' || reportType === 'threeyear') && selectedTeacher ? `المعلم: ${selectedTeacher.nameAr}` : '',
    (reportType === 'dept') && selDept ? `القسم: ${getDeptName(selDept, departments)}` : '',
  ].filter(Boolean).join('  |  ');

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#0F2044', fontWeight: 600 }}>
      <div style={{ display: 'inline-block', width: '2.5rem', height: '2.5rem', border: '4px solid #00B4D8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
      <div>⏳ جاري تحميل وتجهيز البيانات والتقارير...</div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl' }}>

      {/* ── Screen Controls (hidden on print) ── */}
      <div className="no-print">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F2044', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 نظام التقارير التفاعلي الذكي
        </h2>

        {/* Report Type Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => setReportType(r.id)} style={{
              padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.78rem',
              border: '2px solid', cursor: 'pointer', fontWeight: reportType === r.id ? 800 : 500,
              background: reportType === r.id ? 'linear-gradient(135deg, #0F2044 0%, #1e4080 100%)' : '#fff',
              borderColor: reportType === r.id ? '#0F2044' : '#E2E8F0',
              color: reportType === r.id ? '#fff' : '#475569',
              boxShadow: reportType === r.id ? '0 4px 12px rgba(15,32,68,0.15)' : 'none',
              textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
              <div>
                <div>{r.label}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.1rem' }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          {reportType !== 'threeyear' && reportType !== 'elearning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>العام الأكاديمي</span>
              <select className="form-input" style={{ minWidth: '120px' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
                {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          )}
          {reportType === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>الشهر</span>
              <select className="form-input" style={{ minWidth: '110px' }} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          {['monthly', 'annual', 'dept', 'followup', 'modellessons'].includes(reportType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>القسم</span>
              <select className="form-input" style={{ minWidth: '160px' }} value={selDept} onChange={e => setSelDept(e.target.value)} disabled={isCoord && coordDepts.length === 1}>
                <option value="">{isCoord && coordDepts.length === 1 ? coordLabel : 'كل الأقسام'}</option>
                {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>
            </div>
          )}
          {['progress', 'threeyear'].includes(reportType) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>اختر المعلم</span>
              <select className="form-input" style={{ minWidth: '220px' }} value={selTeacherId} onChange={e => setSelTeacherId(e.target.value)}>
                {filteredTeachersList.map(t => <option key={t.id} value={t.id}>{t.nameAr} ({getDeptName(t.departmentId, departments)})</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto', alignItems: 'flex-end' }}>
            <button onClick={exportExcel} className="btn btn-ghost" style={{ padding: '0.625rem 1rem' }}>📥 تصدير Excel</button>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.625rem 1rem' }}>🖨️ طباعة / حفظ PDF</button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PRINTABLE REPORT BODY
          ══════════════════════════════════════════════════════════════════ */}
      <div className="printable-report" style={{ border: '1px solid #CBD5E1', padding: '2.5rem', background: '#ffffff', minHeight: '800px' }}>

        {/* Header */}
        <ReportHeader
          title={`${currentReportInfo.icon} ${currentReportInfo.label}`}
          subtitle={reportSubtitle}
        />

        {/* KPI Cards */}
        {kpiCards.length > 0 && <KpiCards cards={kpiCards} />}

        {/* Honorees Section */}
        {honorees.length > 0 && (
          <div style={{ border: '1px solid #BAE6FE', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.75rem', background: '#F0F9FF', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0369A1', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏆 {reportType === 'dept' ? 'المعلم المكرم في القسم' : 'المعلمون المكرمون لهذا الشهر'}
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

        {/* Chart */}
        {chartData.length > 0 && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem', background: '#F8FAFC', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 التمثيل البياني لأداء التقرير
            </h4>
            {reportType === 'progress' ? (
              <SvgLineChart data={chartData} />
            ) : (
              <SvgBarChart data={chartData} />
            )}
          </div>
        )}

        {/* ── Data Tables ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
            تفاصيل بيانات التقرير
          </h4>

          {/* Monthly */}
          {reportType === 'monthly' && (
            <ReportTable
              headers={['#', 'الرقم الوظيفي', 'اسم المعلم', 'القسم', 'المادة', 'المجموع %', 'مؤشر الأداء', 'مستوى الأداء', 'نقاط القوة', 'التوصيات']}
              emptyMsg="⚠️ لا يوجد تقييمات مسجلة لهذا الشهر."
              rows={reportData.map(({ ev, t, dept, perf }: any, i: number) => [
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

          {/* Model Lessons */}
          {reportType === 'modellessons' && (
            <ReportTable
              headers={['#', 'اسم المعلم', 'القسم', 'تاريخ الحصة', 'الحصة والصف', 'الأدوات الرقمية', 'الدرجة (من 10)', 'مستوى الأداء', 'نقاط القوة', 'التوصيات']}
              emptyMsg="⚠️ لا يوجد تقييمات حصص نموذجية مسجلة لهذا النطاق."
              rows={reportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || r.m.teacherNameAr}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                </div>,
                <span style={{ fontWeight: 700 }}>{r.dept}</span>,
                <span style={{ color: '#0F2044', fontWeight: 600 }}>{r.m.date}</span>,
                <span style={{ color: '#475569' }}>حصة {r.m.period} - صف {r.m.classGrade}</span>,
                <span style={{ color: '#0369A1', fontWeight: 700, fontSize: '0.72rem' }}>{r.m.toolsUsed || '-'}</span>,
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: r.perf.color }}>{r.m.overallScore} / 10</span>,
                <PerfBadge perf={r.perf} />,
                <span style={{ fontSize: '0.72rem', color: '#065F46' }}>{r.m.strengths || '-'}</span>,
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{r.m.recommendations || '-'}</span>,
              ])}
            />
          )}

          {/* Annual / Dept */}
          {['annual', 'dept'].includes(reportType) && (
            <ReportTable
              headers={['#', 'الرقم الوظيفي', 'اسم المعلم', 'القسم', 'المادة', 'التقييمات', 'أعلى درجة', 'أقل درجة', 'المتوسط السنوي', 'مؤشر الأداء', 'مستوى الأداء']}
              emptyMsg="⚠️ لا يوجد بيانات كافية لاستخراج التقرير."
              rows={reportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748B' }}>{r.t?.employeeId || '-'}</span>,
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F2044' }}>{r.t?.nameAr || '-'}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                </div>,
                <span style={{ fontWeight: 700 }}>{r.dept}</span>,
                <span style={{ color: '#64748B' }}>{r.t?.subject || '-'}</span>,
                <span style={{ fontWeight: 700 }}>{r.count}</span>,
                <span style={{ color: '#10B981', fontWeight: 800 }}>{r.highestScore}%</span>,
                <span style={{ color: '#EF4444', fontWeight: 800 }}>{r.lowestScore}%</span>,
                <span style={{ fontWeight: 900, color: r.perf.color, fontSize: '0.9rem' }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* Follow-up */}
          {reportType === 'followup' && (
            reportData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#10B981', fontWeight: 700, background: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                🌟 تهانينا! جميع المعلمين أداؤهم متميز ولا توجد حالات تحتاج متابعة.
              </div>
            ) : (
              <ReportTable
                headers={['#', 'الرقم الوظيفي', 'اسم المعلم', 'القسم', 'التقييمات', 'متوسط الأداء', 'مؤشر الأداء', 'مستوى الأداء', 'البند الأضعف', 'نقاط القوة', 'التوصيات']}
                emptyMsg=""
                rows={reportData.map((r: any, i: number) => [
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>{i + 1}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748B' }}>{r.t?.employeeId || '-'}</span>,
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#991B1B' }}>{r.t?.nameAr || '-'}</div>
                    <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{r.t?.nameEn || ''}</div>
                  </div>,
                  <span style={{ fontWeight: 700 }}>{r.dept}</span>,
                  <span>{r.count}</span>,
                  <span style={{ fontWeight: 900, color: '#EF4444', fontSize: '0.9rem' }}>{r.averageScore}%</span>,
                  <ProgressBar value={r.averageScore} />,
                  <PerfBadge perf={r.perf} />,
                  <div style={{ textAlign: 'right', fontSize: '0.7rem' }}>
                    <div style={{ color: '#991B1B', fontWeight: 700 }}>{r.weakestIdx + 1} - {r.weakestLabel}</div>
                    <div style={{ color: '#64748B' }}>متوسط: {r.weakestScore}/10</div>
                  </div>,
                  <span style={{ fontSize: '0.7rem', color: '#374151' }}>{r.strengths}</span>,
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{r.recs}</span>,
                ])}
              />
            )
          )}

          {/* Progress */}
          {reportType === 'progress' && (
            <>
              {selectedTeacher && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FE', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                  <div><span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>المعلم: </span><span style={{ fontWeight: 800, color: '#0F2044' }}>{selectedTeacher.nameAr}</span></div>
                  <div><span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>القسم: </span><span style={{ fontWeight: 800, color: '#0F2044' }}>{getDeptName(selectedTeacher.departmentId, departments)}</span></div>
                  <div><span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>المادة: </span><span style={{ fontWeight: 800, color: '#0F2044' }}>{selectedTeacher.subject || '-'}</span></div>
                </div>
              )}
              <ReportTable
                headers={['الشهر', 'العام الأكاديمي', 'الدرجة الكلية %', 'مؤشر الأداء', 'مستوى الأداء', 'نقاط القوة', 'جوانب التحسين', 'التوصيات']}
                emptyMsg="⚠️ لا توجد تقييمات مسجلة لهذا المعلم خلال العام المحدد."
                rows={reportData.map((r: any, i: number) => [
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.monthName}</span>,
                  <span style={{ color: '#64748B' }}>{r.ev.academicYear}</span>,
                  <span style={{ fontWeight: 900, color: r.perf.color, fontSize: '0.9rem' }}>{r.ev.totalScore}%</span>,
                  <ProgressBar value={r.ev.totalScore} />,
                  <PerfBadge perf={r.perf} />,
                  <span style={{ fontSize: '0.7rem' }}>{r.ev.strengths || '-'}</span>,
                  <span style={{ fontSize: '0.7rem', color: '#991B1B' }}>{r.ev.improvementAreas || '-'}</span>,
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{r.ev.recommendations || '-'}</span>,
                ])}
              />
            </>
          )}

          {/* Comparison / High Perf */}
          {['comparison', 'highperf'].includes(reportType) && (
            <ReportTable
              headers={['#', 'اسم القسم', 'الكادر التعليمي', 'إجمالي التقييمات', 'متوسط أداء القسم', 'مؤشر الأداء', 'المتميزون', 'مستوى الأداء']}
              emptyMsg="⚠️ لا يوجد تقييمات كافية للمقارنة بين الأقسام."
              rows={reportData.map((r: any, i: number) => [
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>{i + 1}</span>,
                <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.nameAr}</span>,
                <span style={{ fontWeight: 700 }}>{r.teachersCount} معلم</span>,
                <span style={{ color: '#64748B' }}>{r.evaluationsCount} تقييم</span>,
                <span style={{ fontWeight: 900, color: r.perf.color, fontSize: '0.9rem' }}>{r.averageScore}%</span>,
                <ProgressBar value={r.averageScore} />,
                <span style={{ color: '#10B981', fontWeight: 800 }}>{r.excellentCount} متميز</span>,
                <PerfBadge perf={r.perf} />,
              ])}
            />
          )}

          {/* Three Year */}
          {reportType === 'threeyear' && (
            <>
              {selectedTeacher && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FE', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                  <div><span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>المعلم: </span><span style={{ fontWeight: 800, color: '#0F2044' }}>{selectedTeacher.nameAr}</span></div>
                  <div><span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>القسم: </span><span style={{ fontWeight: 800, color: '#0F2044' }}>{getDeptName(selectedTeacher.departmentId, departments)}</span></div>
                </div>
              )}
              <ReportTable
                headers={['العام الأكاديمي', 'إجمالي التقييمات السنوية', 'متوسط الأداء السنوي %', 'مؤشر الأداء', 'مستوى الأداء العام']}
                emptyMsg="⚠️ لا يوجد تقييمات لهذا المعلم خلال الثلاث سنوات السابقة."
                rows={reportData.map((r: any, i: number) => [
                  <span style={{ fontWeight: 800, color: '#0F2044' }}>{r.year}</span>,
                  <span style={{ fontWeight: 700 }}>{r.count} تقييم</span>,
                  <span style={{ fontWeight: 900, color: r.perf.color, fontSize: '0.9rem' }}>{r.averageScore}%</span>,
                  <ProgressBar value={r.averageScore} />,
                  <PerfBadge perf={r.perf} />,
                ])}
              />
            </>
          )}

          {/* E-Learning Report */}
          {reportType === 'elearning' && (
            <div style={{ direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
              
              {/* 1. System Live KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #0F2044', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><Users size={22} color="#0F2044" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>الكادر التعليمي النشط</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F2044', marginTop: '0.25rem' }}>{elearningStats.totalTeachers}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>معلم مفعّل في الأقسام</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #00B4D8', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><ClipboardList size={22} color="#00B4D8" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>التقييمات الرقمية المنجزة</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#00B4D8', marginTop: '0.25rem' }}>{elearningStats.totalEvals}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>رصد وتقييم تراكمي معتمد</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #10B981', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><CheckCircle2 size={22} color="#10B981" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>المتوسط العام لأداء الكوادر</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '0.25rem' }}>{elearningStats.avgScore}%</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>مستوى كفاءة متميز للمدرسة</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #F59E0B', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><ListTodo size={22} color="#F59E0B" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>مهام المتابعة للمشاريع</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F59E0B', marginTop: '0.25rem' }}>{elearningStats.totalTasks}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>نسبة الإنجاز: {elearningStats.totalTasks ? Math.round((elearningStats.completedTasks / elearningStats.totalTasks) * 100) : 0}%</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #8B5CF6', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><Trophy size={22} color="#8B5CF6" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>إنجازات الطلاب والجوائز</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.25rem' }}>{elearningStats.totalAchievements}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>رصد وتوثيق إلكتروني معتمد</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #EC4899', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><GraduationCap size={22} color="#EC4899" /></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>الورش والتطوير المهني</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EC4899', marginTop: '0.25rem' }}>{elearningStats.totalWorkshops}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>حقائب التمكين التراكمي</div>
                </div>

                <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #0369A1', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>📹</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>تقييمات حصص التعليم الإلكتروني</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0369A1', marginTop: '0.25rem' }}>{elearningStats.modelLessonCount}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94A3B8', marginTop: '0.2rem' }}>نموذج تقييم نموذجي موثق</div>
                </div>
              </div>

              {/* 2. System Vision & Strategic Objectives */}
              <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={20} color="#0F2044" /> رؤية وأهداف نظام التعليم الإلكتروني والحلول الرقمية
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem', textAlign: 'justify' }}>
                  يمثل هذا النظام الإلكتروني الحل الرقمي المتكامل والمحلي لمدرسة قطر للعلوم والتكنولوجيا الاعدادية الثانوية للبنين - أم السنيم لمتابعة وتقييم فاعلية الكوادر الأكاديمية في توظيف نظام قطر للتعليم والمنصات الرقمية المساندة. يسعى النظام إلى تقليص الأعباء الإدارية والورقية من خلال أتمتة شاملة لجميع استمارات المتابعة وأنشطة التقييم وربطها بقاعدة بيانات ذكية قادرة على تحليل الأداء وتحديد التدخلات المطلوبة بدقة عالية.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#00B4D8', fontSize: '1.2rem', lineHeight: 1 }}>✔</span>
                    <div>
                      <strong style={{ color: '#0F2044' }}>أتمتة المتابعة والتقييم:</strong>
                      <span style={{ color: '#64748B' }}> استبدال الاستمارات الورقية بنظام رقمي متكامل يسهل عملية الرصد الفوري والتقييم الميداني للمعلمين.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#00B4D8', fontSize: '1.2rem', lineHeight: 1 }}>✔</span>
                    <div>
                      <strong style={{ color: '#0F2044' }}>دعم اتخاذ القرار التربوي:</strong>
                      <span style={{ color: '#64748B' }}> توفير لوحات إحصائية دقيقة ورسوم بيانية فورية تعكس نسب التفعيل ومواطن الضعف والقوة لكل قسم وللمدرسة ككل.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#00B4D8', fontSize: '1.2rem', lineHeight: 1 }}>✔</span>
                    <div>
                      <strong style={{ color: '#0F2044' }}>التمكين المهني المستهدف:</strong>
                      <span style={{ color: '#64748B' }}> حصر وتتبع البرامج التدريبية المخصصة للتطوير المهني الفردي بناءً على نتائج استمارات التقييم الرقمية.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#00B4D8', fontSize: '1.2rem', lineHeight: 1 }}>✔</span>
                    <div>
                      <strong style={{ color: '#0F2044' }}>أرشفة وتوثيق إنجازات الطلاب:</strong>
                      <span style={{ color: '#64748B' }}> نظام رقمي موثق لرصد ومتابعة الإنجازات الوطنية والدولية للطلاب والمشرفين وتكريم التميز.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Detailed Pages Showcase */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Monitor size={20} color="#0F2044" /> الهيكل البصري وشرح صفحات وأقسام النظام
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  {/* Page 1: Dashboard */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>📊</span> لوحة المؤشرات (Dashboard)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>رئيسي</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        شاشة العرض الافتتاحية للمستخدم. تقوم باحتساب وعرض بطاقات الأداء السريعة (KPIs) لنسب تفعيل المعلمين وأعداد الورش والإنجازات بالإضافة إلى لوحة تكريم فورية.
                      </p>
                      
                      {/* CSS Mockup Dashboard */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ height: '8px', background: '#0F2044', borderRadius: '2px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem' }}>
                          <div style={{ height: '18px', background: '#fff', borderTop: '2px solid #00B4D8', borderRadius: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '6px', fontWeight: 800 }}>88%</div>
                          <div style={{ height: '18px', background: '#fff', borderTop: '2px solid #10B981', borderRadius: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '6px', fontWeight: 800 }}>45</div>
                          <div style={{ height: '18px', background: '#fff', borderTop: '2px solid #F59E0B', borderRadius: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '6px', fontWeight: 800 }}>12</div>
                        </div>
                        <div style={{ flex: 1, background: '#fff', borderRadius: '2px', border: '1px solid #F1F5F9', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FCD34D', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '6px' }}>👑</div>
                          <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '1px' }} />
                          <div style={{ width: '10px', height: '4px', background: '#10B981', borderRadius: '1px' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 2: Teachers Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>👨‍🏫</span> إدارة المعلمين (Teachers)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>إداري</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        قاعدة بيانات المعلمين، تتيح لمدير النظام إضافة، تعديل، وحذف بيانات المعلمين وتحديد تخصصاتهم وأرقامهم الوظيفية، بالإضافة إلى استيراد/تصدير البيانات لملفات Excel.
                      </p>
                      
                      {/* CSS Mockup Teachers */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '2px', display: 'flex', alignItems: 'center', padding: '0 0.2rem' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ background: '#fff', padding: '0.15rem 0.2rem', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F2044' }} />
                              <div style={{ width: '25px', height: '3px', background: '#94A3B8', borderRadius: '1px' }} />
                            </div>
                            <div style={{ width: '12px', height: '4px', background: '#ECFDF5', borderRadius: '1px' }} />
                          </div>
                          <div style={{ background: '#fff', padding: '0.15rem 0.2rem', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F2044' }} />
                              <div style={{ width: '25px', height: '3px', background: '#94A3B8', borderRadius: '1px' }} />
                            </div>
                            <div style={{ width: '12px', height: '4px', background: '#ECFDF5', borderRadius: '1px' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 3: Evaluation Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>📝</span> التقييم الشهري (Evaluation)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>إشرافي</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        بوابة التقييم للمدير والأخصائي. يعرض المعايير العشرة مع إمكانية إدخال تقييمات رقمية (0-10) لكل بند، وحساب التقييم تلقائياً وتوثيق نقاط القوة والتوصيات.
                      </p>
                      
                      {/* CSS Mockup Evaluation */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ height: '8px', background: '#0F2044', borderRadius: '1px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                            <div style={{ width: '4px', height: '4px', background: '#00B4D8', borderRadius: '1px' }} />
                            <div style={{ width: '35px', height: '3px', background: '#E2E8F0', borderRadius: '1px' }} />
                            <div style={{ flex: 1 }} />
                            <div style={{ width: '8px', height: '6px', borderRadius: '1px', background: '#10B981' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                            <div style={{ width: '4px', height: '4px', background: '#00B4D8', borderRadius: '1px' }} />
                            <div style={{ width: '30px', height: '3px', background: '#E2E8F0', borderRadius: '1px' }} />
                            <div style={{ flex: 1 }} />
                            <div style={{ width: '8px', height: '6px', borderRadius: '1px', background: '#F59E0B' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ width: '15px', height: '2px', background: '#94A3B8' }} />
                          <div style={{ width: '15px', height: '2px', background: '#94A3B8' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 3b: E-Learning Model Lessons Evaluation */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>💻</span> تقييم حصص التعليم الإلكتروني
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#EEF2FF', color: '#4338CA', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>إشرافي</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        نموذج الرصد والتقييم الميداني لحصص التعليم الإلكتروني النموذجية. يشمل 6 معايير تقنية تربوية متقدمة (SAMR/TPACK)، تسجيل الأدوات المستخدمة، رابط خطة الدرس على OneDrive، إرسال التقرير للمعلم، وأرشفة التقييمات في Firebase.
                      </p>
                      {/* CSS Mockup E-Learning Eval */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ height: '8px', background: '#0F2044', borderRadius: '1px', marginBottom: '3px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          {[0.9, 0.85, 0.95, 0.8, 0.88, 0.92].map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4338CA', flexShrink: 0 }} />
                              <div style={{ flex: 1, height: '3px', background: '#E2E8F0', borderRadius: '1px', overflow: 'hidden' }}>
                                <div style={{ width: `${v*100}%`, height: '100%', background: '#4338CA', borderRadius: '1px' }} />
                              </div>
                              <div style={{ fontSize: '5px', fontWeight: 800, color: '#4338CA', width: '12px' }}>{Math.round(v*10)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Page 4: Takreem Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>🏆</span> تكريم المعلمين (Takreem)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>تحفيزي</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        لوحة الشرف الذهبية للمعلمين المتميزين. يتم سحب واختيار الحاصلين على أعلى النقاط (≥90%) شهرياً وتكريمهم بصور وبطاقات فخمة قابلة للتحميل.
                      </p>
                      
                      {/* CSS Mockup Takreem */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D1D5DB' }} />
                          <div style={{ width: '16px', height: '22px', background: '#BDC3C7', borderRadius: '2px 2px 0 0', display: 'flex', justifyContent: 'center', fontSize: '6px', color: '#fff', fontWeight: 800 }}>2</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FCD34D', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '6px' }}>👑</div>
                          <div style={{ width: '20px', height: '32px', background: '#F1C40F', borderRadius: '2px 2px 0 0', display: 'flex', justifyContent: 'center', fontSize: '6px', color: '#fff', fontWeight: 800 }}>1</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D97706' }} />
                          <div style={{ width: '16px', height: '16px', background: '#E67E22', borderRadius: '2px 2px 0 0', display: 'flex', justifyContent: 'center', fontSize: '6px', color: '#fff', fontWeight: 800 }}>3</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 5: Achievements Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>🌟</span> الإنجازات المدرسية (Achievements)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>توثيق</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        سجل رقمي شامل لإنجازات المدرسة والطلاب (المسابقات المحلية، العالمية، والأبحاث المنشورة). يوفر خريطة ذكية لتوزيع المستويات (عالمي، إقليمي، محلي) وتوثيق الأدلة.
                      </p>
                      
                      {/* CSS Mockup Achievements */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ width: '30px', height: '5px', background: '#0F2044', borderRadius: '1px' }} />
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F472B6' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ background: '#fff', padding: '0.15rem 0.2rem', borderRadius: '2px', borderRight: '2px solid #8B5CF6', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ width: '35px', height: '3px', background: '#94A3B8' }} />
                            <div style={{ width: '10px', height: '4px', background: '#8B5CF6', borderRadius: '1px' }} />
                          </div>
                          <div style={{ background: '#fff', padding: '0.15rem 0.2rem', borderRadius: '2px', borderRight: '2px solid #10B981', display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ width: '40px', height: '3px', background: '#94A3B8' }} />
                            <div style={{ width: '10px', height: '4px', background: '#10B981', borderRadius: '1px' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 6: Professional Development Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>🎓</span> التطوير المهني (PD)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>تمكين</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        سجل التمكين الرقمي للكوادر. يرصد الورش المنجزة للمدرسة، والملف الإنمائي لكل معلم، وساعات التطوير المهني مع مؤشرات بيانية (رادارية ومختلطة Recharts) للتقدم.
                      </p>
                      
                      {/* CSS Mockup PD */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ width: '25px', height: '5px', background: '#0F2044', borderRadius: '1px' }} />
                          <div style={{ width: '25px', height: '5px', background: '#00B4D8', borderRadius: '1px' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ height: '14px', background: '#fff', borderRadius: '2px', border: '1px solid #E2E8F0' }} />
                            <div style={{ height: '14px', background: '#fff', borderRadius: '2px', border: '1px solid #E2E8F0' }} />
                          </div>
                          <div style={{ flex: 1, background: '#fff', borderRadius: '2px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2.5px solid #10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '5px', fontWeight: 900 }}>40</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 8: Analytics Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>📈</span> التحليلات الذكية (Analytics)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#F0F9FF', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>تحليلي</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        بوابة التحليلات المتقدمة. تعرض رسوم بيانية ومخططات دائرية ونسب تفعيل للمنصات الرقمية وتتبع تقدم الأقسام والمستويات الإحصائية طوال العام.
                      </p>
                      
                      {/* CSS Mockup Analytics */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', gap: '0.2rem' }}>
                        <div style={{ flex: 1, background: '#fff', borderRadius: '2px', display: 'flex', alignItems: 'flex-end', gap: '0.15rem', padding: '0.2rem' }}>
                          <div style={{ flex: 1, height: '40%', background: '#00B4D8', borderRadius: '1px 1px 0 0' }} />
                          <div style={{ flex: 1, height: '70%', background: '#0F2044', borderRadius: '1px 1px 0 0' }} />
                          <div style={{ flex: 1, height: '90%', background: '#10B981', borderRadius: '1px 1px 0 0' }} />
                        </div>
                        <div style={{ flex: 1, background: '#fff', borderRadius: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '4px solid #8B5CF6', borderTopColor: '#EC4899', borderRightColor: '#F59E0B' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 9: Reports Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>📋</span> التقارير التفاعلية (Reports)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>محوري</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        بوابة استخراج التقارير وتنزيلها لملفات Excel و PDF. توفر تقارير شهرية، سنوية، تحليلية، مقارنة، تتبع تقدم المعلمين، وتقرير الكفاءة الفنية والحلول الرقمية.
                      </p>
                      
                      {/* CSS Mockup Reports */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ height: '8px', background: '#0369A1', borderRadius: '1px' }} />
                        <div style={{ flex: 1, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '2px', padding: '0.15rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ height: '2px', background: '#0F2044', width: '30px' }} />
                          <div style={{ height: '2px', background: '#64748B', width: '20px' }} />
                          <div style={{ display: 'flex', gap: '0.15rem', marginTop: 'auto' }}>
                            <div style={{ flex: 1, height: '4px', background: '#F1F5F9' }} />
                            <div style={{ flex: 1, height: '4px', background: '#F1F5F9' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 10: Settings Page */}
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F2044', fontSize: '0.82rem' }}>
                        <span>⚙️</span> الإعدادات الرقمية (Settings)
                      </div>
                      <span style={{ fontSize: '0.62rem', background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>أمني</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                        لوحة الإدارة والتحكم الفني وإعداد المستخدمين وتغيير كلمات المرور، مع تفعيل/تعطيل صلاحيات الاستيراد والتعديل وتغيير شروط الاستخدام.
                      </p>
                      
                      {/* CSS Mockup Settings */}
                      <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '0.4rem', height: '95px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
                          <div style={{ width: '20px', height: '3px', background: '#CBD5E1' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ width: '25px', height: '3px', background: '#94A3B8' }} />
                            <div style={{ width: '10px', height: '6px', borderRadius: '3px', background: '#10B981', position: 'relative' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ width: '20px', height: '3px', background: '#94A3B8' }} />
                            <div style={{ width: '10px', height: '6px', borderRadius: '3px', background: '#CBD5E1', position: 'relative' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 4. Core Features & Specifications */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2044', borderBottom: '2px solid #0F2044', paddingBottom: '0.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#0F2044" /> المميزات البرمجية والخصائص التقنية للنظام
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#0F2044', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>⚡</span> سرعة الاستجابة والخفة
                    </div>
                    <p style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                      مبني باستخدام Next.js و React لسرعة تحميل عالية وانتقال فوري بين الصفحات دون إعادة إنعاش للصفحة بالكامل.
                    </p>
                  </div>
                  
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#0F2044', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>💾</span> حوسبة بدون اتصال
                    </div>
                    <p style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                      يعمل النظام بالكامل بوضع عدم الاتصال (Offline-First) من خلال التخزين المحلي والذكي لبيانات المعلمين والتقييمات والمهام.
                    </p>
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#0F2044', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>🔒</span> أمن وخصوصية البيانات
                    </div>
                    <p style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                      تطبيق نظام الصلاحيات المتقدم (RBAC) لتقييد الصلاحيات وحماية البيانات والتقارير من التعديلات العشوائية وغير المصرحة.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. System Evolution & Roadmap */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0F2044', borderBottom: '2px solid #0F2044', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} color="#0F2044" /> خطة التطوير البرمجي ومراحل التكامل الرقمي للنظام
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '1rem', borderRight: '2px solid #E2E8F0', position: 'relative' }}>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F2044', position: 'absolute', right: '-16px', top: '4px', border: '2px solid #fff' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F2044' }}>المرحلة الأولى: التأسيس وأتمتة التقييمات الأساسية (الربع الأول)</div>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.5, margin: '0.2rem 0 0' }}>
                      تصميم هيكل البيانات وبناء قاعدة بيانات المعلمين وتطوير الواجهات الأكاديمية الأولى لاستبدال الرصد الورقي للتقييمات الرقمية وتوحيد شروط الاعتماد الأكاديمي.
                    </p>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00B4D8', position: 'absolute', right: '-16px', top: '4px', border: '2px solid #fff' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#00B4D8' }}>المرحلة الثانية: إدماج التحليلات والتقارير التفاعلية (الربع الثاني)</div>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.5, margin: '0.2rem 0 0' }}>
                      تطوير خوارزميات SVG/Recharts لتوليد المخططات البيانية التفاعلية المخصصة وإطلاق حزمة تصدير البيانات الكاملة Excel ومواءمة الطباعة الذكية A4 وتحديث نظام التوقيع الثنائي.
                    </p>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', position: 'absolute', right: '-16px', top: '4px', border: '2px solid #fff' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#10B981' }}>المرحلة الثالثة: رصد تتبعالتمكين المهني الشامل (الربع الثالث)</div>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.5, margin: '0.2rem 0 0' }}>
                      دمج أداة رصد المهام والمشروعات الرقمية اليومية لمنسق المشاريع وتفعيل صفحات التنمية المهنية والإنجازات وربطها بنظام حفظ الملاحظات السحابية.
                    </p>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6', position: 'absolute', right: '-16px', top: '4px', border: '2px solid #fff' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#8B5CF6' }}>المرحلة الرابعة: المزامنة السحابية وقاعدة بيانات Firestore النشطة (المرحلة الحالية)</div>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.5, margin: '0.2rem 0 0' }}>
                      ربط النظام بالكامل بقاعدة بيانات Firestore للنسخ الاحتياطي اللحظي والمزامنة السحابية المتعددة الأجهزة والتحقق الفني الميداني ونشر النظام حياً.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>



        <SignatureFooter />
      </div>

      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 8mm !important; }
          .no-print { display: none !important; }
          .printable-report { 
            border: none !important; 
            padding: 0 !important; 
            position: relative !important; 
            min-height: auto !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
