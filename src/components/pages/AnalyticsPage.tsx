'use client';
import { useState, useMemo, useEffect } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, EVALUATION_CRITERIA, HIGH_PERF_DEPTS, getUserDeptIds, getUserDeptLabel, getMonthlyDepartmentHonorees } from '@/lib/data';
import type { User, Teacher, Evaluation, Department, ModelLessonEvaluation, Achievement } from '@/lib/data';
import type { Workshop } from '@/lib/pdData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from 'recharts';
import PrintHeader from '@/components/PrintHeader';

interface Props { currentUser: User; selectedYear?: string; }

export default function AnalyticsPage({ currentUser, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<ModelLessonEvaluation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'modellessons' | 'pd'>('monthly');

  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);

  useEffect(() => {
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getModelLessonEvaluations().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getWorkshops().catch(() => [])
    ]).then(([t, e, d, mle, ach, w]) => {
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setModelLessonEvals(mle);
      setAchievements(ach);
      setWorkshops(w);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (propYear) setSelYear(propYear); }, [propYear]);

  const isCoord    = currentUser.role === 'coordinator';
  const coordDepts  = getUserDeptIds(currentUser);

  const scopedTeachers = useMemo(() => isCoord && coordDepts.length > 0
    ? teachers.filter(t => coordDepts.includes(t.departmentId))
    : teachers, [teachers, isCoord, coordDepts]);

  const scopedEvals = useMemo(() => {
    if (!isCoord || coordDepts.length === 0) return evaluations;
    const ids = new Set(scopedTeachers.map(t => t.id));
    return evaluations.filter(e => ids.has(e.teacherId));
  }, [evaluations, isCoord, coordDepts, scopedTeachers]);

  const yearEvals = useMemo(() => scopedEvals.filter(e => e.academicYear === selYear), [scopedEvals, selYear]);

  const yearModelLessons = useMemo(() => {
    return modelLessonEvals.filter(m => !selYear || m.academicYear === selYear);
  }, [modelLessonEvals, selYear]);

  const teacherRanks = useMemo(() => {
    return scopedTeachers.map(t => {
      const evs = yearEvals.filter(e => e.teacherId === t.id);
      const avg = evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0;
      return { teacher: t, avg, count: evs.length };
    }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
  }, [scopedTeachers, yearEvals]);

  const deptRanks = useMemo(() => {
    return departments.map(d => {
      const evs = yearEvals.filter(e => teachers.find(t=>t.id===e.teacherId)?.departmentId === d.id);
      const avg = evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0;
      return { dept: d, avg, count: evs.length };
    }).filter(x => x.count > 0).sort((a,b) => b.avg - a.avg);
  }, [departments, yearEvals, teachers]);

  const recognitionStats = useMemo(() => {
    const allHonorees: any[] = [];
    MONTHS.forEach(m => {
      let monthList = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, m);
      if (isCoord && coordDepts.length > 0) {
        monthList = monthList.filter(h => coordDepts.includes(h.departmentId));
      }
      allHonorees.push(...monthList);
    });
    const tCounts: Record<string, {name:string, dept:string, count:number}> = {};
    const dCounts: Record<string, number> = {};
    allHonorees.forEach(h => {
      if (!tCounts[h.teacherId]) tCounts[h.teacherId] = { name: h.teacherNameAr, dept: h.departmentName, count: 0 };
      tCounts[h.teacherId].count++;
      dCounts[h.departmentName] = (dCounts[h.departmentName] || 0) + 1;
    });
    const mostHonored = Object.values(tCounts).sort((a,b) => b.count - a.count).slice(0,5);
    const deptStats = Object.entries(dCounts).map(([name, count]) => ({ name, count }));
    return { mostHonored, deptStats, total: allHonorees.length };
  }, [evaluations, teachers, departments, selYear, isCoord, coordDepts]);

  const criteriaAvg = useMemo(() => {
    return EVALUATION_CRITERIA.map((label, i) => {
      const scores = yearEvals.map(e => e.criteria[i]?.score ?? 0).filter(s => s > 0);
      return { subject: `${i+1}`, label: label.substring(0,25)+'...', avg: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)/100 : 0 };
    });
  }, [yearEvals]);

  const toolsFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    yearModelLessons.forEach(m => {
      if (m.toolsUsed) {
        const tools = m.toolsUsed.split(/[,،+\n]+/).map(s => s.trim()).filter(Boolean);
        tools.forEach(tool => {
          counts[tool] = (counts[tool] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [yearModelLessons]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>⏳ جاري تحميل وتحديث التحليلات المتقدمة...</div>;

  const needFollowup = teacherRanks.filter(r => r.avg < 75);
  const topPerformers = teacherRanks.filter(r => r.avg >= 90).slice(0,10);

  const yearComp = ACADEMIC_YEARS.map(yr => {
    const evs = scopedEvals.filter(e => e.academicYear === yr);
    return { name: yr, avg: evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0 };
  });

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0', marginBottom:'1.25rem' };
  const darkCardStyle = {
    background:'#0F2044', borderRadius:'12px', padding:'1.25rem', color:'#fff',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.1)', marginBottom:'1.25rem'
  };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl', maxWidth:'1300px', margin:'0 auto' }}>
      <PrintHeader 
        title="التحليلات والإحصائيات المتقدمة" 
        subtitle={`العام الأكاديمي: ${selYear}`} 
      />
      
      <div className="no-print" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'#0F2044', margin:0 }}>📈 التحليلات والذكاء الإحصائي</h2>
          <p style={{ fontSize:'0.75rem', color:'#64748B', margin:'0.15rem 0 0' }}>تحليل الأداء المؤسسي، توظيف الأدوات الرقمية، ومؤشرات التطوير</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <select className="form-input" style={{ width:'auto', fontWeight:700 }} value={selYear} onChange={e => setSelYear(e.target.value)}>
            {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()} className="btn btn-primary">🖨️ طباعة التحليلات</button>
        </div>
      </div>

      <div className="no-print" style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[
          { id:'monthly', label:'📊 نظام قطر للتعليم والتقييم الشهري' },
          { id:'modellessons', label:'💻 حصص التعليم الإلكتروني وتوظيف الأدوات' },
          { id:'pd', label:'🎓 التطوير المهني والإنجازات' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding:'0.6rem 1rem',
              borderRadius:'10px',
              border:'1px solid',
              borderColor: activeTab === tab.id ? '#0F2044' : '#CBD5E1',
              background: activeTab === tab.id ? '#0F2044' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#475569',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize:'0.82rem',
              cursor:'pointer',
              transition:'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'monthly' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ ...cardStyle, borderRight:'4px solid #991B1B', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>⚠️ يحتاجون متابعة</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#991B1B', margin:'0.2rem 0' }}>{needFollowup.length}</p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>متوسط أقل من 75%</p>
            </div>
            <div style={{ ...cardStyle, borderRight:'4px solid #10B981', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>⭐ الكوادر المتميزة</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#10B981', margin:'0.2rem 0' }}>{topPerformers.length}</p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>متوسط 90% فما فوق</p>
            </div>
            <div style={{ ...cardStyle, borderRight:'4px solid #0096C7', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>🏢 الأقسام النشطة</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#0096C7', margin:'0.2rem 0' }}>{deptRanks.length}</p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>أقسام أكاديمية مقيمة</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>🕸️ متوسط معايير التقييم</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={criteriaAvg}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:'#fff' }} />
                  <Radar name="المتوسط" dataKey="avg" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={darkCardStyle}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>📅 تطور الأداء عبر السنوات</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearComp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'#fff' }} />
                  <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#fff' }} />
                  <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
                  <Bar dataKey="avg" fill="#00B4D8" name="المتوسط" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📊 تحليل قوة معايير التقييم</h3>
            {[...criteriaAvg].sort((a,b)=>b.avg-a.avg).map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.72rem', color:'#64748B', minWidth:'35px' }}>معيار {c.subject}</span>
                <div style={{ flex:1, background:'#F1F5F9', borderRadius:'999px', height:'8px', overflow:'hidden' }}>
                  <div style={{ width:`${(c.avg / 20) * 100}%`, height:'100%', background: c.avg>=16?'#10B981':c.avg>=12?'#0096C7':'#991B1B', borderRadius:'999px', transition:'width 0.5s' }} />
                </div>
                <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#0F2044', minWidth:'45px' }}>{c.avg} / 20</span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'modellessons' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ ...cardStyle, borderRight:'4px solid #4338CA', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>💻 إجمالي الحصص المقيمة</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#4338CA', margin:'0.2rem 0' }}>{yearModelLessons.length}</p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>حصص نموذجية ميدانية</p>
            </div>
            <div style={{ ...cardStyle, borderRight:'4px solid #10B981', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>⭐ متوسط التقييم العام</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#10B981', margin:'0.2rem 0' }}>
                {yearModelLessons.length ? (Math.round((yearModelLessons.reduce((a,b)=>a+(b.overallScore||0),0)/yearModelLessons.length)*10)/10) : 0} / 10
              </p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>معايير SAMR و TPACK</p>
            </div>
            <div style={{ ...cardStyle, borderRight:'4px solid #D97706', marginBottom:0 }}>
              <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0, fontWeight:700 }}>🛠️ الأدوات الرقمية المرصودة</p>
              <p style={{ fontSize:'1.8rem', fontWeight:900, color:'#D97706', margin:'0.2rem 0' }}>{toolsFrequency.length}</p>
              <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>أداة ومنصة تعليمية</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>🛠️ أكثر الأدوات الرقمية توظيفاً في الحصص</h3>
              {toolsFrequency.length === 0 ? (
                <p style={{ fontSize:'0.8rem', color:'#94A3B8', textAlign:'center', padding:'2rem' }}>لا توجد أدوات مرصودة بعد</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={toolsFrequency} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize:9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:9 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4338CA" radius={[0,4,4,0]} name="مرات الاستخدام" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📋 توزيع الحصص النموذجية حسب الأقسام</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {departments.map(d => {
                  const dLessons = yearModelLessons.filter(m => m.departmentId === d.id);
                  if (dLessons.length === 0) return null;
                  const dAvg = Math.round((dLessons.reduce((a,b)=>a+(b.overallScore||0),0)/dLessons.length)*10)/10;
                  return (
                    <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:'#F8FAFC', borderRadius:'6px', border:'1px solid #E2E8F0' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#0F2044' }}>{d.nameAr}</span>
                      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <span style={{ fontSize:'0.72rem', color:'#64748B' }}>{dLessons.length} حصص</span>
                        <span style={{ background:'#ECFDF5', color:'#065F46', padding:'2px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:800 }}>
                          متوسط: {dAvg} / 10
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'pd' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:800, color:'#0F2044', marginBottom:'1rem' }}>🥇 تحليل التكريم المتميز ({selYear})</h3>
              <p style={{ fontSize:'0.75rem', color:'#64748B', marginBottom:'0.5rem' }}>المعلمون الأكثر تكريماً وتصدراً للأقسام</p>
              {recognitionStats.mostHonored.map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#0F2044' }}>{r.name}</span>
                    <span style={{ fontSize:'0.7rem', color:'#64748B', display:'block' }}>{r.dept}</span>
                  </div>
                  <span style={{ background:'#E0F2FE', color:'#0284C7', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700 }}>{r.count} مرات</span>
                </div>
              ))}
              {recognitionStats.mostHonored.length === 0 && <p style={{ fontSize:'0.8rem', color:'#94A3B8' }}>لا يوجد بيانات تكريم حالياً.</p>}
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize:'0.9rem', fontWeight:800, color:'#0F2044', marginBottom:'1rem' }}>🎓 ورش التطوير المهني ({workshops.length} ورشة)</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {workshops.slice(0, 5).map(w => (
                  <div key={w.id} style={{ padding:'0.5rem 0.75rem', background:'#F8FAFC', borderRadius:'6px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#0F2044' }}>{w.titleAr || (w as any).title || 'ورشة تدريبية'}</div>
                    <span style={{ fontSize:'0.7rem', color:'#4338CA', background:'#EEF2FF', padding:'2px 6px', borderRadius:'4px' }}>{w.hours || 1} ساعة</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
