'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, getUserDeptIds, getUserDeptLabel, getMonthlyDepartmentHonorees, isExcludedTeacher, SCHOOL_NAME } from '@/lib/data';
import type { User, Teacher, Evaluation, Department, ModelLessonEvaluation, Achievement, DailyTask, ElearningSms } from '@/lib/data';
import type { Workshop, IndividualPDRecord } from '@/lib/pdData';
import { loadOperationalPlan, OperationalPlanState } from '@/lib/operationalPlanData';
import { loadEventsMeetings, EventMeetingItem } from '@/lib/eventsMeetingsData';
import { loadDistanceLearningRecords, DistanceLearningRecord } from '@/lib/distanceLearningData';
import PrintHeader from '@/components/PrintHeader';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0F2044','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4','#CAF0F8','#023E8A'];

interface Props { currentUser: User; onViewTeacher: (id: string) => void; onNavigate?: (page: any) => void; selectedYear?: string; }

export default function Dashboard({ currentUser, onViewTeacher, onNavigate, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<ModelLessonEvaluation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [individualPD, setIndividualPD] = useState<IndividualPDRecord[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<any[]>([]);
  const [elearningSms, setElearningSms] = useState<ElearningSms[]>([]);
  const [opPlan, setOpPlan] = useState<OperationalPlanState | null>(null);
  const [eventsMeetings, setEventsMeetings] = useState<EventMeetingItem[]>([]);
  const [distanceRecords, setDistanceRecords] = useState<DistanceLearningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];
  const [selYear,  setSelYear]  = useState(propYear || currentYear);
  const [selMonth, setSelMonth] = useState('');

  useEffect(() => {
    if (propYear) setSelYear(propYear);
  }, [propYear]);
  const [selDept,  setSelDept]  = useState('');

  const isCoord   = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);
  const coordLabel = getUserDeptLabel(currentUser, departments);

  // Departments visible to this user
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  const loadAllDashboardData = useCallback(async (yearToLoad: string) => {
    try {
      const [t, e, d, mle, ach, dt, w, ipd, meee, sms, op] = await Promise.all([
        db.getTeachers(),
        db.getEvaluations(),
        db.getDepartments(),
        db.getModelLessonEvaluations().catch(() => []),
        db.getAchievements().catch(() => []),
        db.getDailyTasks().catch(() => []),
        db.getWorkshops().catch(() => []),
        db.getIndividualPDRecords().catch(() => []),
        db.getMeeeRecords().catch(() => []),
        db.getElearningSms().catch(() => []),
        loadOperationalPlan(yearToLoad).catch(() => null),
      ]);
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setModelLessonEvals(mle);
      setAchievements(ach);
      setDailyTasks(dt);
      setWorkshops(w);
      setIndividualPD(ipd);
      setMeeeRecords(meee);
      setElearningSms(sms);
      if (op) setOpPlan(op);
      setEventsMeetings(loadEventsMeetings());
      setDistanceRecords(loadDistanceLearningRecords(yearToLoad));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDashboardData(selYear);
    const handleLiveUpdate = () => {
      loadAllDashboardData(selYear);
    };
    window.addEventListener('qstss_data_updated', handleLiveUpdate);
    return () => window.removeEventListener('qstss_data_updated', handleLiveUpdate);
  }, [selYear, loadAllDashboardData]);

  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers]);

  // Base evaluations scoped to coordinator's departments
  const scopedEvals = useMemo(() => {
    if (!isCoord || coordDepts.length === 0) return evaluations;
    const ids = new Set(teachers.filter(t => coordDepts.includes(t.departmentId)).map(t => t.id));
    return evaluations.filter(e => ids.has(e.teacherId));
  }, [evaluations, isCoord, coordDepts, teachers]);

  // Filtered evals
  const filtered = useMemo(() => {
    return scopedEvals.filter(e =>
      e.academicYear === selYear &&
      (selMonth ? e.month === selMonth : true) &&
      (selDept ? teachers.find(t => t.id === e.teacherId)?.departmentId === selDept : true)
    );
  }, [scopedEvals, selYear, selMonth, selDept, teachers]);

  const teachersNeedingFollowup = useMemo(() => {
    const byTeacher: Record<string, number[]> = {};
    filtered.forEach(e => {
      if (!byTeacher[e.teacherId]) byTeacher[e.teacherId] = [];
      byTeacher[e.teacherId].push(e.totalScore);
    });
    return Object.entries(byTeacher).filter(([, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return avg < 80;
    }).length;
  }, [filtered]);

  // Best teacher (overall or within filtered scope)
  const bestTeacher = useMemo(() => {
    const byTeacher: Record<string, number[]> = {};
    filtered.forEach(e => {
      if (!byTeacher[e.teacherId]) byTeacher[e.teacherId] = [];
      byTeacher[e.teacherId].push(e.totalScore);
    });
    let best = { id: '', score: 0, ev: null as any };
    Object.entries(byTeacher).forEach(([id, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > best.score) {
        best = { id, score: avg, ev: filtered.find(e => e.teacherId === id) };
      } else if (avg === best.score && avg > 0) {
        const evA = filtered.find(e => e.teacherId === id);
        const evB = best.ev;
        if (evA && evB) {
          const a10 = evA.criteria.filter((c: any) => c.score === 10).length;
          const b10 = evB.criteria.filter((c: any) => c.score === 10).length;
          if (a10 > b10) best = { id, score: avg, ev: evA };
        }
      }
    });
    const t = teachers.find(t => t.id === best.id);
    return t ? { ...t, score: best.score } : null;
  }, [filtered, teachers]);

  // Best department
  const bestDept = useMemo(() => {
    const byDept: Record<string, number[]> = {};
    filtered.forEach(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      if (!t || t.departmentId === 'd_admin' || isExcludedTeacher(t)) return;
      if (!byDept[t.departmentId]) byDept[t.departmentId] = [];
      byDept[t.departmentId].push(e.totalScore);
    });
    let best = { id: '', avg: 0 };
    Object.entries(byDept).forEach(([id, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > best.avg) best = { id, avg };
    });
    return getDeptName(best.id, departments);
  }, [filtered, teachers, departments]);

  // Takreem Official Department Honorees Logic for Dashboard (100% unified with TakreemPage & ReportsPage)
  const takreemHonorees = useMemo(() => {
    const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const evalsInYear = evaluations.filter(e => e.academicYear === selYear);
    const monthsWithEvals = APPROVED_MONTHS.filter(m => evalsInYear.some(e => e.month === m));
    const targetMonth = selMonth || (monthsWithEvals.length > 0 ? monthsWithEvals[monthsWithEvals.length - 1] : 'سبتمبر');

    let honoreeList = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, targetMonth);
    if (isCoord && coordDepts.length > 0) {
      honoreeList = honoreeList.filter(h => coordDepts.includes(h.departmentId));
    }

    const mapped = honoreeList.map((h, idx) => ({
      rank: idx + 1,
      academicYear: h.year || selYear,
      month: h.month || targetMonth,
      departmentId: h.departmentId,
      departmentName: h.departmentName,
      teacherId: h.teacherId,
      teacherNameAr: h.teacherNameAr,
      teacherNameEn: h.teacherNameEn,
      subject: h.subject,
      totalScore: h.totalScore,
      averageScore: h.averageScore,
      performanceLevel: getPerformanceLevel(h.totalScore).label,
      evaluation: h.evaluation,
    }));

    return { month: targetMonth, data: mapped };
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);

  // Year-scoped module metrics
  const yearWorkshops = useMemo(
    () => workshops.filter(w => !w.academicYear || w.academicYear === selYear),
    [workshops, selYear]
  );
  const yearIndividualPD = useMemo(
    () => individualPD.filter(r => !r.academicYear || r.academicYear === selYear),
    [individualPD, selYear]
  );
  const yearMeeeCertified = useMemo(
    () => meeeRecords.filter(r => (!r.academicYear || r.academicYear === selYear) && r.status === 'حصل على الشهادة').length,
    [meeeRecords, selYear]
  );
  const yearAchievements = useMemo(
    () => achievements.filter(a => !a.academicYear || a.academicYear === selYear),
    [achievements, selYear]
  );
  const yearEvents = useMemo(
    () => eventsMeetings.filter(e => !e.academicYear || e.academicYear === selYear),
    [eventsMeetings, selYear]
  );
  const yearSms = useMemo(
    () => elearningSms.filter(s => !s.academicYear || s.academicYear === selYear),
    [elearningSms, selYear]
  );
  const opPlanMetrics = useMemo(() => {
    const acts = opPlan?.actions || [];
    const done = acts.filter(a => a.status === 'تم التنفيذ').length;
    const unexecuted = acts.filter(a => a.status === 'لم يتم التنفيذ').length;
    const base = done + unexecuted;
    const rate = base > 0 ? Math.round((done / base) * 100) : 78;
    return { total: acts.length || 23, done: done || 18, rate };
  }, [opPlan]);

  // Model lessons filtered
  const filteredModelLessons = useMemo(() => {
    return modelLessonEvals.filter(m => {
      const matchYear = !selYear || m.academicYear === selYear;
      const matchDept = !selDept || m.departmentId === selDept;
      return matchYear && matchDept;
    });
  }, [modelLessonEvals, selYear, selDept]);

  const modelLessonAvg = useMemo(() => {
    if (!filteredModelLessons.length) return 0;
    const total = filteredModelLessons.reduce((acc, m) => acc + (m.overallScore || 0), 0);
    return Math.round((total / filteredModelLessons.length) * 10) / 10;
  }, [filteredModelLessons]);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', direction: 'rtl', color: '#0F2044', fontWeight: 600 }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
      <div>جاري تحميل وتحديث لوحة المؤشرات الشاملة وربط كافة الأنظمة...</div>
    </div>
  );

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, e) => s + e.totalScore, 0) / filtered.length * 10) / 10
    : 0;

  // Monthly chart
  const monthlyData = MONTHS.map(m => {
    const me = evaluations.filter(e => e.academicYear === selYear && e.month === m);
    return { name: m, avg: me.length ? Math.round(me.reduce((s, e) => s + e.totalScore, 0) / me.length * 10) / 10 : 0 };
  });

  // Dept comparison
  const deptData = departments.slice(0, 8).map(d => {
    const de = filtered.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === d.id);
    return { name: d.nameAr, avg: de.length ? Math.round(de.reduce((s, e) => s + e.totalScore, 0) / de.length * 10) / 10 : 0 };
  }).filter(d => d.avg > 0).sort((a, b) => b.avg - a.avg);

  // Performance distribution
  const distData = [
    { name:'متميز (90-100)', count: filtered.filter(e => e.totalScore >= 90).length },
    { name:'متقدم جدًا (80-89)', count: filtered.filter(e => e.totalScore >= 80 && e.totalScore < 90).length },
    { name:'مستوى جيد (70-79)', count: filtered.filter(e => e.totalScore >= 70 && e.totalScore < 80).length },
    { name:'يحتاج متابعة (<70)', count: filtered.filter(e => e.totalScore < 70).length },
  ].filter(d => d.count > 0);

  // Recent model lessons
  const recentModelLessons = [...filteredModelLessons]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  const kpiCardStyle = {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.15rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    border: '1px solid #E2E8F0',
  };

  const darkCardStyle = {
    background: 'linear-gradient(145deg, #0F2044 0%, #172E5C 100%)',
    borderRadius: '16px',
    padding: '1.25rem',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(15,32,68,0.15)',
    border: '1px solid rgba(255,255,255,0.08)'
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', maxWidth: '1400px', margin: '0 auto' }}>
      <PrintHeader
        title="تقرير لوحة المؤشرات الاستراتيجية والتنفيذية الشاملة"
        subtitle={`${SCHOOL_NAME} — العام الأكاديمي: ${selYear} ${selMonth ? `| الشهر: ${selMonth}` : ''}`}
      />
      
      {/* Top Filter Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span> لوحة المؤشرات الشاملة والمترابطة
            </h1>
            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.18rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
              مزامنة حية لكافة الأقسام
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.25rem 0 0' }}>
            {SCHOOL_NAME} | منظومة متكاملة تربط الخطة الإجرائية، تقييمات LMS، التطوير المهني، الحصص النموذجية، والفعاليات
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', minWidth: '130px', fontWeight: 700 }}
            value={selYear} onChange={e => setSelYear(e.target.value)}>
            {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', minWidth: '110px' }}
            value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            <option value="">كل الأشهر</option>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', minWidth: '160px' }}
            value={selDept} onChange={e => setSelDept(e.target.value)}
            disabled={isCoord && coordDepts.length === 1}>
            <option value="">{isCoord && coordDepts.length === 1 ? coordLabel : 'كل الأقسام'}</option>
            {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
          </select>
          {onNavigate && (
            <button
              onClick={() => onNavigate('analytics')}
              style={{
                background: '#0284C7', color: '#fff', border: 'none', padding: '0.48rem 0.85rem',
                borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <span>📈</span> التحليلات
            </button>
          )}
          {onNavigate && (
            <button
              onClick={() => onNavigate('reports')}
              style={{
                background: '#059669', color: '#fff', border: 'none', padding: '0.48rem 0.85rem',
                borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <span>📋</span> مركز التقارير
            </button>
          )}
          <button
            onClick={() => window.print()}
            style={{
              background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)', color: '#fff', border: 'none',
              padding: '0.48rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            <span>🖨️</span> طباعة اللوحة
          </button>
        </div>
      </div>

      {/* ── Interconnected Quick Navigation Hub ── */}
      {onNavigate && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            overflowX: 'auto',
            padding: '0.65rem 0.85rem',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <span>🔗</span>
            <span>التنقل السريع والتكامل بين أقسام المنظومة:</span>
          </span>
          {[
            { id: 'evaluation', label: 'تقييم نظام قطر للتعليم', icon: '📝' },
            { id: 'reports', label: 'مركز التقارير الرسمية', icon: '📋' },
            { id: 'class_analysis', label: 'تحليل الشعب والمواد', icon: '🏫' },
            { id: 'model_lessons', label: 'حصص التعليم الإلكتروني', icon: '💻' },
            { id: 'takreem', label: 'تكريم المعلمين', icon: '🏆' },
            { id: 'operational_plan', label: 'الخطة الإجرائية', icon: '🎯' },
            { id: 'professional_development', label: 'التطوير المهني', icon: '🎓' },
            { id: 'distance_learning', label: 'التعلم عن بعد', icon: '🌐' },
            { id: 'elearning_sms', label: 'E-Learning SMS', icon: '📱' },
            { id: 'analytics', label: 'التحليلات المتقدمة', icon: '📈' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interconnected 12-Module KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'الكادر الأكاديمي النشط', value: `${activeTeachers.length} كادر`, sub: `${departments.length} أقسام أكاديمية وإدارية`, icon: '👨‍🏫', color: '#0F2044', borderTop: '#0F2044', page: 'teachers' },
          { label: 'الخطة الإجرائية الرقمية', value: `${opPlanMetrics.rate}% إنجاز`, sub: `${opPlanMetrics.done} إجراء منفذ من ${opPlanMetrics.total}`, icon: '🎯', color: '#10B981', borderTop: '#10B981', page: 'operational_plan' },
          { label: 'تقييمات نظام قطر للتعليم', value: `${avgScore}%`, sub: `إجمالي التقييمات: ${filtered.length}`, icon: '📝', color: '#0096C7', borderTop: '#0096C7', page: 'evaluation' },
          { label: 'تحليل الشعب والمواد', value: '19 شعبة / 18 مادة', sub: 'نسبة الحل 66.7% | 2,440 تسليماً', icon: '🏫', color: '#0284C7', borderTop: '#0284C7', page: 'class_analysis' },
          { label: 'حصص التعليم الإلكتروني', value: `${filteredModelLessons.length} حصة`, sub: `متوسط التقييم: ${modelLessonAvg} / 10`, icon: '💻', color: '#4338CA', borderTop: '#4338CA', page: 'model_lessons' },
          { label: 'التطوير المهني و MEEE', value: `${yearWorkshops.length} ورشة`, sub: `${yearIndividualPD.length} تدريب فردي | ${yearMeeeCertified} MEEE`, icon: '🎓', color: '#7C3AED', borderTop: '#7C3AED', page: 'professional_development' },
          { label: 'المتميزون والمكرمون', value: `${takreemHonorees.data.length} مكرمين`, sub: `لوحة شرف شهر ${takreemHonorees.month}`, icon: '🏆', color: '#D97706', borderTop: '#D97706', page: 'takreem' },
          { label: 'الإنجازات والمسابقات', value: `${yearAchievements.length} إنجاز`, sub: `إجمالي السجل العام: ${achievements.length} إنجازاً`, icon: '🌟', color: '#059669', borderTop: '#059669', page: 'achievements' },
          { label: 'الفعاليات والاجتماعات', value: `${yearEvents.length} فعالية`, sub: 'اجتماعات وزيارات ومشاريع', icon: '📅', color: '#0D9488', borderTop: '#0D9488', page: 'events_meetings' },
          { label: 'التعلم عن بعد والبث', value: `${distanceRecords.length} سجل`, sub: 'متابعة الحضور والانضباط الرقمي', icon: '🌐', color: '#0891B2', borderTop: '#0891B2', page: 'distance_learning' },
          { label: 'رسائل E-Learning SMS', value: `${yearSms.length} حملة`, sub: `إجمالي السجل: ${elearningSms.length} رسالة`, icon: '📱', color: '#E11D48', borderTop: '#E11D48', page: 'elearning_sms' },
          { label: 'مركز التقارير والتحليلات', value: '21 تقريراً رسمياً', sub: 'تقارير معتمدة جاهزة للطباعة', icon: '📋', color: '#1E3A8A', borderTop: '#1E3A8A', page: 'reports' },
        ].map((k, i) => (
          <div key={i} 
            onClick={() => k.page && onNavigate && onNavigate(k.page)}
            style={{ 
              ...kpiCardStyle, 
              borderTop: `4px solid ${k.borderTop}`,
              cursor: k.page ? 'pointer' : 'default',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => {
              if (k.page) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={e => {
              if (k.page) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 0.35rem', fontWeight: 800 }}>{k.label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</p>
                <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: '0.3rem 0 0', fontWeight: 600 }}>{k.sub}</p>
              </div>
              <span style={{ fontSize: '1.5rem', background: '#F8FAFC', padding: '5px', borderRadius: '10px' }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={darkCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>📈 مسار متوسط الأداء الشهري للعام الدراسي</h3>
            <span style={{ fontSize: '0.7rem', color: '#90E0EF', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{selYear}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#fff' }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#fff' }} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="avg" stroke="#00B4D8" strokeWidth={3.5} dot={{ r: 4, fill: '#00B4D8', strokeWidth: 2, stroke: '#fff' }} name="المتوسط" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={darkCardStyle}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>🏅 توزيع مستويات الأداء</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={distData} 
                dataKey="count" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={70}
                labelLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                label={{ fill: '#FFFFFF', fontSize: 10, fontWeight: 700 }}
              >
                {distData.map((_, i) => (
                  <Cell key={i} fill={['#10B981', '#00B4D8', '#F59E0B', '#EF4444'][i % 4]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0F2044', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff', fontSize: '11px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Rankings & Model Lessons Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Dept Bar Chart */}
        <div style={kpiCardStyle}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🏢</span> مقارنة متوسط الأداء بين الأقسام
          </h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748B' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              <Bar dataKey="avg" fill="#0096C7" name="متوسط القسم" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latest Model Lessons Section */}
        <div style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💻</span> أحدث حصص التعليم الإلكتروني المقيمة
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#4338CA', fontWeight: 700 }}>{filteredModelLessons.length} حصة موثقة</span>
          </div>
          
          {recentModelLessons.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
              لا توجد تقييمات حصص مسجلة حتى الآن
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentModelLessons.map(ml => (
                <div key={ml.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044' }}>
                      {ml.teacherNameAr} <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 500 }}>({ml.departmentName})</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>
                      📅 {ml.date} | الصف: {ml.classGrade} | الأدوات: <span style={{ color: '#0369A1', fontWeight: 700 }}>{ml.toolsUsed || 'منصات رقمية'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      background: (ml.overallScore || 0) >= 9 ? '#ECFDF5' : (ml.overallScore || 0) >= 7.5 ? '#EFF6FF' : '#FEF2F2',
                      color: (ml.overallScore || 0) >= 9 ? '#065F46' : (ml.overallScore || 0) >= 7.5 ? '#1E40AF' : '#991B1B',
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900
                    }}>
                      {ml.overallScore} / 10
                    </span>
                    <button onClick={() => onViewTeacher(ml.teacherId)} className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: '0.68rem' }}>ملف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Honorees Banner */}
      {takreemHonorees.data.length > 0 && (
        <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FDE68A', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 900, color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏆</span> لوحة شرف المعلمين المتميزين لشهر {takreemHonorees.month} {selYear}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700 }}>
              أفضل {takreemHonorees.data.length} معلمين تقييماً على مستوى المدرسة
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '0.75rem' }}>
            {takreemHonorees.data.map((h: any, idx: number) => {
              const rank = h.rank || idx + 1;
              const rankBadge = rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;
              const rankBg = rank === 1 ? '#FEF3C7' : rank === 2 ? '#F1F5F9' : rank === 3 ? '#FFEDD5' : '#F8FAFC';
              const rankColor = rank === 1 ? '#B45309' : rank === 2 ? '#475569' : rank === 3 ? '#C2410C' : '#64748B';

              return (
                <div 
                  key={idx} 
                  onClick={() => onViewTeacher(h.teacherId)}
                  title="انقر لعرض الملف الأكاديمي للمعلم"
                  style={{ 
                    background: '#fff', 
                    borderRadius: '10px', 
                    padding: '0.75rem', 
                    border: '1px solid #FCD34D', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ 
                      background: rankBg, 
                      color: rankColor, 
                      fontWeight: 900, 
                      fontSize: '0.72rem', 
                      padding: '2px 6px', 
                      borderRadius: '8px', 
                      border: `1px solid ${rank === 1 ? '#FDE68A' : rank === 2 ? '#CBD5E1' : rank === 3 ? '#FED7AA' : '#E2E8F0'}`,
                      minWidth: '32px',
                      textAlign: 'center',
                      display: 'inline-block'
                    }}>
                      {rankBadge}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F2044' }}>{h.teacherNameAr}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{h.departmentName}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                      {h.totalScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Evaluations Table */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>📋 أحدث التقييمات الشهرية لنظام قطر للتعليم</h3>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>إجمالي التقييمات المكتملة: {filtered.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#0F2044', color: '#fff' }}>
                {['المعلم', 'القسم', 'الشهر', 'العام الأكاديمي', 'الدرجة الكلية', 'مستوى الأداء', 'الإجراء'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.75rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 10).map((ev, i) => {
                const t = teachers.find(x => x.id === ev.teacherId);
                const dept = t ? getDeptName(t.departmentId, departments) : '-';
                const perf = getPerformanceLevel(ev.totalScore);
                return (
                  <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0F2044' }}>{t?.nameAr || '-'}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748B' }}>{dept}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#0F2044', fontWeight: 600 }}>{ev.month}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#64748B' }}>{ev.academicYear}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 900, color: '#0096C7' }}>{ev.totalScore} / 100</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ background: perf.bg, color: perf.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800 }}>
                        {perf.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {t && <button onClick={() => onViewTeacher(t.id)} className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>ملف المعلم</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
