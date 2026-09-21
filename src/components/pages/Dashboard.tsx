'use client';
import { useState, useMemo, useEffect } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, getUserDeptIds, getUserDeptLabel, getMonthlyDepartmentHonorees, isExcludedTeacher, SCHOOL_NAME } from '@/lib/data';
import type { User, Teacher, Evaluation, Department, ModelLessonEvaluation, Achievement, DailyTask } from '@/lib/data';
import type { Workshop } from '@/lib/pdData';
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

  useEffect(() => {
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getModelLessonEvaluations().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getDailyTasks().catch(() => []),
      db.getWorkshops().catch(() => [])
    ]).then(([t, e, d, mle, ach, dt, w]) => {
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setModelLessonEvals(mle);
      setAchievements(ach);
      setDailyTasks(dt);
      setWorkshops(w);
      setLoading(false);
    });
  }, []);

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

  // Takreem Top 10 Honorees Logic for Dashboard
  const takreemHonorees = useMemo(() => {
    const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const evalsInYear = evaluations.filter(e => e.academicYear === selYear);
    const monthsWithEvals = APPROVED_MONTHS.filter(m => evalsInYear.some(e => e.month === m));
    const targetMonth = selMonth || (monthsWithEvals.length > 0 ? monthsWithEvals[monthsWithEvals.length - 1] : 'سبتمبر');
    
    const evalsForMonth = evaluations.filter(e => e.academicYear === selYear && e.month === targetMonth);
    
    // Filter by coordinator depts if needed
    let candidateEvals = evalsForMonth;
    if (isCoord && coordDepts.length > 0) {
      candidateEvals = candidateEvals.filter(e => {
        const t = teachers.find(x => x.id === e.teacherId);
        return t && coordDepts.includes(t.departmentId);
      });
    }

    // Exclude school leaders (e.g. Dr. Rani Al-Toum)
    candidateEvals = candidateEvals.filter(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      return t ? !isExcludedTeacher(t) : true;
    });

    // Deduplicate by teacherId (taking best score if multiple exist)
    const byTeacherMap = new Map<string, Evaluation>();
    candidateEvals.forEach(ev => {
      const existing = byTeacherMap.get(ev.teacherId);
      if (!existing || ev.totalScore > existing.totalScore) {
        byTeacherMap.set(ev.teacherId, ev);
      }
    });

    const uniqueEvals = Array.from(byTeacherMap.values());

    // Sort using standard tie-breaking rules
    uniqueEvals.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      const a10 = a.criteria ? a.criteria.filter(c => c.score === 10).length : 0;
      const b10 = b.criteria ? b.criteria.filter(c => c.score === 10).length : 0;
      if (b10 !== a10) return b10 - a10;
      if ((b.criteria?.[0]?.score || 0) !== (a.criteria?.[0]?.score || 0)) return (b.criteria?.[0]?.score || 0) - (a.criteria?.[0]?.score || 0);
      if ((b.criteria?.[1]?.score || 0) !== (a.criteria?.[1]?.score || 0)) return (b.criteria?.[1]?.score || 0) - (a.criteria?.[1]?.score || 0);
      if ((b.criteria?.[3]?.score || 0) !== (a.criteria?.[3]?.score || 0)) return (b.criteria?.[3]?.score || 0) - (a.criteria?.[3]?.score || 0);
      if ((b.criteria?.[4]?.score || 0) !== (a.criteria?.[4]?.score || 0)) return (b.criteria?.[4]?.score || 0) - (a.criteria?.[4]?.score || 0);
      const tA = teachers.find(x => x.id === a.teacherId);
      const tB = teachers.find(x => x.id === b.teacherId);
      return (tA?.nameAr || '').localeCompare(tB?.nameAr || '', 'ar');
    });

    const top10 = uniqueEvals.slice(0, 10).map((ev, idx) => {
      const teacher = teachers.find(t => t.id === ev.teacherId);
      const deptName = teacher ? getDeptName(teacher.departmentId, departments) : '';
      return {
        rank: idx + 1,
        academicYear: selYear,
        month: targetMonth,
        departmentId: teacher?.departmentId,
        departmentName: deptName,
        teacherId: teacher?.id || ev.teacherId,
        teacherNameAr: teacher?.nameAr || '-',
        teacherNameEn: teacher?.nameEn || '',
        subject: teacher?.subject || '',
        totalScore: ev.totalScore,
        averageScore: ev.averageScore,
        performanceLevel: ev.performanceLevel,
        evaluation: ev
      };
    });
    
    return { month: targetMonth, data: top10 };
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);

  useEffect(() => {
    Promise.all([db.getTeachers(), db.getEvaluations(), db.getDepartments()])
      .then(([t, e, d]) => { setTeachers(t); setEvaluations(e); setDepartments(d); setLoading(false); });
  }, []);


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
      <div>جاري تحميل وتحديث لوحة المؤشرات...</div>
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
  const recentModelLessons = [...modelLessonEvals]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  const kpiCardStyle = {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.25rem',
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
      
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> لوحة المؤشرات الشاملة
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.2rem 0 0' }}>
            {SCHOOL_NAME} | متابعة التفعيل الرقمي وحصص التعليم الإلكتروني
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
        </div>
      </div>


      {/* Interconnected KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'الكادر الأكاديمي النشط', value: `${activeTeachers.length} كادر`, sub: 'معلمون ومهندسون معتمدون', icon: '👨‍🏫', color: '#0F2044', borderTop: '#0F2044', page: 'teachers' },
          { label: 'تقييمات نظام قطر للتعليم', value: filtered.length, sub: `متوسط الأداء: ${avgScore}%`, icon: '📝', color: '#0096C7', borderTop: '#0096C7', page: 'evaluation' },
          { label: 'حصص التعليم الإلكتروني', value: `${filteredModelLessons.length} حصة`, sub: `متوسط التقييم: ${modelLessonAvg} / 10`, icon: '💻', color: '#4338CA', borderTop: '#4338CA', page: 'model_lessons' },
          { label: 'المتميزون والمكرمون', value: `${takreemHonorees.data.length} مكرم`, sub: `لشهر ${takreemHonorees.month}`, icon: '🏆', color: '#D97706', borderTop: '#D97706', page: 'takreem' },
          { label: 'الإنجازات والمسابقات', value: `${achievements.length} إنجاز`, sub: 'مشاركات وجوائز موثقة', icon: '🌟', color: '#059669', borderTop: '#059669', page: 'achievements' },
          { label: 'ورش التطوير المهني', value: `${workshops.length} ورشة`, sub: 'تدريب وتطوير مستمر', icon: '🎓', color: '#7C3AED', borderTop: '#7C3AED', page: 'professional_development' },
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
                <p style={{ fontSize: '1.3rem', fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</p>
                <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: '0.3rem 0 0', fontWeight: 600 }}>{k.sub}</p>
              </div>
              <span style={{ fontSize: '1.6rem', background: '#F8FAFC', padding: '5px', borderRadius: '10px' }}>{k.icon}</span>
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
