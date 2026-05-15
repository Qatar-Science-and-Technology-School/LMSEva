'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, SCHOOL_NAME, DESIGNER_CREDIT, getUserDeptIds, getUserDeptLabel, getMonthlyDepartmentHonorees } from '@/lib/data';
import type { User } from '@/lib/data';
import * as XLSX from 'xlsx';
import PrintHeader from '@/components/PrintHeader';

interface Props { currentUser: User; }

type ReportType = 'monthly' | 'annual' | 'dept' | 'top10' | 'followup' | 'progress' | 'comparison' | 'threeyear' | 'highperf';

const REPORT_TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: 'monthly', label: 'تقرير شهري للمعلمين', icon: '📅' },
  { id: 'annual', label: 'تقرير سنوي', icon: '📆' },
  { id: 'dept', label: 'تقرير حسب القسم', icon: '🏫' },
  { id: 'followup', label: 'تقرير يحتاجون متابعة', icon: '⚠️' },
  { id: 'progress', label: 'تقرير تطور المعلم خلال العام', icon: '📈' },
  { id: 'comparison', label: 'تقرير مقارنة بين الأقسام', icon: '⚖️' },
  { id: 'threeyear', label: 'تقرير أداء آخر ثلاث سنوات', icon: '📊' },
  { id: 'highperf', label: 'تقرير أداء اللغة العربية والإسلامية والحاسوب والرياضيات', icon: '⭐' },
];

export default function ReportsPage({ currentUser }: Props) {
  const teachers = db.getTeachers();
  const evaluations = db.getEvaluations();
  const departments = db.getDepartments();

  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);
  const coordLabel = getUserDeptLabel(currentUser, departments);
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selYear, setSelYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState(MONTHS[0]);
  const [selDept, setSelDept] = useState('');

  const reportData = useMemo(() => {
    let evals = evaluations.filter(e => e.academicYear === selYear);
    // Scope to coordinator's departments
    if (isCoord && coordDepts.length > 0) {
      const scopedIds = new Set(teachers.filter(t => coordDepts.includes(t.departmentId)).map(t => t.id));
      evals = evals.filter(e => scopedIds.has(e.teacherId));
    }
    if (selMonth && (reportType === 'monthly')) evals = evals.filter(e => e.month === selMonth);
    if (selDept) evals = evals.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === selDept);

    return evals.map(ev => {
      const t = teachers.find(x => x.id === ev.teacherId);
      const dept = t ? getDeptName(t.departmentId, departments) : '-';
      const perf = getPerformanceLevel(ev.totalScore);
      return { ev, t, dept, perf };
    }).sort((a, b) => {
      return a.dept.localeCompare(b.dept, 'ar') || (a.t?.nameAr || '').localeCompare(b.t?.nameAr || '', 'ar');
    });
  }, [evaluations, selYear, selMonth, selDept, reportType, teachers, departments, isCoord, coordDepts]);

  const honorees = useMemo(() => {
    if (reportType !== 'monthly' && reportType !== 'dept') return [];
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (selDept) list = list.filter(h => h.departmentId === selDept);
    if (isCoord && coordDepts.length > 0) list = list.filter(h => coordDepts.includes(h.departmentId));
    return list;
  }, [evaluations, teachers, departments, selYear, selMonth, selDept, reportType, isCoord, coordDepts]);

  const summary = useMemo(() => {
    const scores = reportData.map(r => r.ev.totalScore);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
    return {
      total: reportData.length,
      avg,
      excellent: scores.filter(s => s >= 90).length,
      needFollowup: scores.filter(s => s < 80).length,
    };
  }, [reportData]);

  function exportExcel() {
    const rows = reportData.map(({ ev, t, dept }) => ({
      'الاسم بالعربي': t?.nameAr || '-',
      'الاسم بالإنجليزي': t?.nameEn || '-',
      'الرقم الوظيفي': t?.employeeId || '-',
      'القسم': dept,
      'المادة': t?.subject || '-',
      'الشهر': ev.month,
      'العام': ev.academicYear,
      'المجموع': ev.totalScore,
      'المتوسط': ev.averageScore,
      'مستوى الأداء': ev.performanceLevel,
      'نقاط القوة': ev.strengths,
      'جوانب التحسين': ev.improvementAreas,
      'التوصيات': ev.recommendations,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
    XLSX.writeFile(wb, `report_${reportType}_${selYear}.xlsx`);
  }

  function printReport() { window.print(); }

  const cardStyle = { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl' }}>
      <h2 className="no-print" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F2044', marginBottom: '1.25rem' }}>📋 التقارير</h2>

      <PrintHeader
        title={REPORT_TYPES.find(r => r.id === reportType)?.label || 'تقرير المعلمين'}
        subtitle={`العام الأكاديمي: ${selYear} ${reportType === 'monthly' ? `| الشهر: ${selMonth}` : ''}`}
      />

      {/* Report type selector */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {REPORT_TYPES.map(r => (
          <button key={r.id} onClick={() => setReportType(r.id)}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem',
              border: '2px solid', cursor: 'pointer', fontWeight: reportType === r.id ? 700 : 400,
              background: reportType === r.id ? '#0F2044' : '#fff',
              borderColor: reportType === r.id ? '#0F2044' : '#E2E8F0',
              color: reportType === r.id ? '#fff' : '#374151',
              transition: 'all 0.15s'
            }}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <select className="form-input" style={{ width: 'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
          {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        {(reportType === 'monthly') && (
          <select className="form-input" style={{ width: 'auto' }} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        )}
        <select className="form-input" style={{ width: 'auto', minWidth: '160px' }} value={selDept} onChange={e => setSelDept(e.target.value)}
          disabled={isCoord && coordDepts.length === 1}>
          <option value="">{isCoord && coordDepts.length === 1 ? coordLabel : 'كل الأقسام'}</option>
          {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
        </select>
        <button onClick={exportExcel} className="btn btn-ghost">📥 تصدير Excel</button>
        <button onClick={printReport} className="btn btn-primary">🖨️ طباعة التقرير</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', margin: '1rem 0' }}>
        {[
          { label: 'إجمالي السجلات', value: summary.total, color: '#0F2044' },
          { label: 'متوسط الأداء', value: `${summary.avg}%`, color: summary.avg >= 80 ? '#065F46' : '#0096C7' },
          { label: 'متميزون', value: summary.excellent, color: '#065F46' },
          { label: 'يحتاجون متابعة', value: summary.needFollowup, color: '#991B1B' },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, padding: '0.75rem', textAlign: 'center', marginBottom: 0 }}>
            <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: 0 }}>{k.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Data table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {/* Honorees Section */}
        {honorees.length > 0 && (
          <div style={{ ...cardStyle, background: '#F0F9FF', border: '1px solid #B9E6FE', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0369A1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏆 {reportType === 'dept' ? 'المعلم المكرم في القسم' : 'المعلمون المكرمون لهذا الشهر'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {honorees.map(h => (
                <div key={h.teacherId} style={{ padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', borderRight: '4px solid #0096C7' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>{h.departmentName}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', margin: '0.2rem 0' }}>{h.teacherNameAr}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0096C7' }}>الدرجة: {h.totalScore}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#0F2044', color: '#fff' }}>
                {['#', 'الرقم الوظيفي', 'اسم المعلم', 'القسم', 'المادة', 'الشهر', 'المجموع', 'المتوسط', 'مستوى الأداء', 'نقاط القوة', 'التوصيات'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map(({ ev, t, dept, perf }, i) => (
                <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#94A3B8', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748B' }}>{t?.employeeId}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontWeight: 700, color: '#0F2044' }}>{t?.nameAr || '-'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{t?.nameEn || ''}</div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#374151' }}>{dept}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748B' }}>{t?.subject}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{ev.month}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, fontSize: '0.9rem' }}>{ev.totalScore}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{ev.averageScore}/10</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{ background: perf.bg, color: perf.color, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {perf.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#374151', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.strengths}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748B', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.recommendations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.65rem', color: '#94A3B8' }}>
        {DESIGNER_CREDIT} | {SCHOOL_NAME} | {new Date().toLocaleDateString('ar-QA')}
      </div>
    </div>
  );
}
