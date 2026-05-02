'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, EVALUATION_CRITERIA, HIGH_PERF_DEPTS, getUserDeptIds, getUserDeptLabel } from '@/lib/data';
import type { User } from '@/lib/data';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

interface Props { currentUser: User; }

export default function AnalyticsPage({ currentUser }: Props) {
  const teachers    = db.getTeachers();
  const evaluations = db.getEvaluations();
  const departments = db.getDepartments();
  const isCoord    = currentUser.role === 'coordinator';
  const coordDepts  = getUserDeptIds(currentUser);
  const [selYear, setSelYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);

  const scopedTeachers = useMemo(() => isCoord && coordDepts.length > 0
    ? teachers.filter(t => coordDepts.includes(t.departmentId))
    : teachers, [teachers, isCoord, coordDepts]);

  const scopedEvals = useMemo(() => {
    if (!isCoord || coordDepts.length === 0) return evaluations;
    const ids = new Set(scopedTeachers.map(t => t.id));
    return evaluations.filter(e => ids.has(e.teacherId));
  }, [evaluations, isCoord, coordDepts, scopedTeachers]);

  const yearEvals = useMemo(() => scopedEvals.filter(e => e.academicYear === selYear), [scopedEvals, selYear]);

  // Teacher rankings
  const teacherRanks = useMemo(() => {
    return scopedTeachers.map(t => {
      const evs = yearEvals.filter(e => e.teacherId === t.id);
      const avg = evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0;
      return { teacher: t, avg, count: evs.length };
    }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
  }, [scopedTeachers, yearEvals]);

  // Dept rankings
  const deptRanks = useMemo(() => {
    return departments.map(d => {
      const evs = yearEvals.filter(e => teachers.find(t=>t.id===e.teacherId)?.departmentId === d.id);
      const avg = evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0;
      return { dept: d, avg, count: evs.length };
    }).filter(x => x.count > 0).sort((a,b) => b.avg - a.avg);
  }, [departments, yearEvals, teachers]);

  // Criteria analysis
  const criteriaAvg = useMemo(() => {
    return EVALUATION_CRITERIA.map((label, i) => {
      const scores = yearEvals.map(e => e.criteria[i]?.score ?? 0).filter(s => s > 0);
      return { subject: `${i+1}`, label: label.substring(0,25)+'...', avg: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)/100 : 0 };
    });
  }, [yearEvals]);

  // Teachers needing followup
  const needFollowup = teacherRanks.filter(r => r.avg < 80);
  // Top performers
  const topPerformers = teacherRanks.filter(r => r.avg >= 90).slice(0,10);

  // High-perf dept analysis
  const highPerfData = MONTHS.map(m => {
    const row: Record<string,number|string> = { name: m };
    ['d_arabic','d_islamic','d_cs','d_math'].forEach(dId => {
      const evs = yearEvals.filter(e => e.month === m && teachers.find(t=>t.id===e.teacherId)?.departmentId === dId);
      const d = departments.find(x=>x.id===dId);
      row[d?.nameAr||dId] = evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0;
    });
    return row;
  });

  // Year comparison
  const yearComp = ACADEMIC_YEARS.map(yr => {
    const evs = scopedEvals.filter(e => e.academicYear === yr);
    return { name: yr, avg: evs.length ? Math.round(evs.reduce((s,e)=>s+e.totalScore,0)/evs.length*10)/10 : 0 };
  });

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };
  const darkCardStyle = {
    background:'#0F2044', borderRadius:'12px', padding:'1.25rem', color:'#fff',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.1)'
  };
  const COLORS4 = ['#00B4D8','#90E0EF','#0096C7','#48CAE4'];

  return (
    <div style={{ padding:'1.5rem', direction:'rtl' }}>
      {/* Filter */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', alignItems:'center' }}>
        <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0F2044', margin:0 }}>📈 التحليلات المتقدمة</h2>
        <select className="form-input" style={{ width:'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
          {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Alert cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
        <div style={{ ...cardStyle, borderRight:'4px solid #991B1B' }}>
          <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0 }}>⚠️ يحتاجون متابعة</p>
          <p style={{ fontSize:'2rem', fontWeight:800, color:'#991B1B', margin:'0.25rem 0 0' }}>{needFollowup.length}</p>
          <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>متوسط أقل من 60%</p>
        </div>
        <div style={{ ...cardStyle, borderRight:'4px solid #065F46' }}>
          <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0 }}>🏆 معلمون متميزون</p>
          <p style={{ fontSize:'2rem', fontWeight:800, color:'#065F46', margin:'0.25rem 0 0' }}>{topPerformers.length}</p>
          <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>درجة 90% فأكثر</p>
        </div>
        <div style={{ ...cardStyle, borderRight:'4px solid #0096C7' }}>
          <p style={{ fontSize:'0.7rem', color:'#64748B', margin:0 }}>📊 إجمالي التقييمات</p>
          <p style={{ fontSize:'2rem', fontWeight:800, color:'#0096C7', margin:'0.25rem 0 0' }}>{yearEvals.length}</p>
          <p style={{ fontSize:'0.7rem', color:'#94A3B8', margin:0 }}>العام {selYear}</p>
        </div>
      </div>

      {/* Dept ranking + Criteria */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>🏫 ترتيب الأقسام</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptRanks.slice(0,8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} />
              <YAxis dataKey="dept.nameAr" type="category" tick={{ fontSize:9, fill:'#fff' }} width={100} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Bar dataKey="avg" fill="#00B4D8" name="المتوسط" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>🕸️ تحليل بنود التقييم</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={criteriaAvg} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:'#fff' }} />
              <Radar name="المتوسط" dataKey="avg" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High perf depts monthly + Year comparison */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>⭐ أداء الأقسام المتميزة (شهري)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={highPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:8, fill:'#fff' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Legend iconSize={8} wrapperStyle={{ color:'#fff' }} />
              {['اللغة العربية','التربية الإسلامية','الحاسوب','الرياضيات'].map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={COLORS4[i]} strokeWidth={2} dot={{ r:2 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>📅 مقارنة الأداء بين الأعوام</h3>
          <ResponsiveContainer width="100%" height={200}>
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



      {/* Followup list */}
      {needFollowup.length > 0 && (
        <div style={{ ...cardStyle, borderTop:'3px solid #991B1B', marginTop:'1rem' }}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#991B1B', marginBottom:'0.75rem' }}>⚠️ المعلمون الذين يحتاجون متابعة ({selYear})</h3>
          <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
            <thead>
              <tr>
                {['الرقم الوظيفي','اسم المعلم','القسم','متوسط الأداء','عدد التقييمات'].map(h => (
                  <th key={h} style={{ padding:'0.5rem', textAlign:'right', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
              <tbody>
                {needFollowup.map(r => (
                  <tr key={r.teacher.id} style={{ borderBottom:'1px solid #FEE2E2' }}>
                    <td style={{ padding:'0.5rem', fontFamily:'monospace', fontSize:'0.72rem' }}>{r.teacher.employeeId}</td>
                    <td style={{ padding:'0.5rem', fontWeight:600 }}>{r.teacher.nameAr}</td>
                    <td style={{ padding:'0.5rem', color:'#64748B' }}>{getDeptName(r.teacher.departmentId, departments)}</td>
                    <td style={{ padding:'0.5rem', fontWeight:700, color:'#991B1B' }}>{r.avg}%</td>
                    <td style={{ padding:'0.5rem' }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Criteria strength/weakness */}
      <div style={{ ...cardStyle, marginTop:'1rem' }}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📊 تحليل قوة البنود</h3>
        {[...criteriaAvg].sort((a,b)=>b.avg-a.avg).map((c, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
            <span style={{ fontSize:'0.72rem', color:'#64748B', minWidth:'28px' }}>{c.subject}</span>
            <div style={{ flex:1, background:'#F1F5F9', borderRadius:'999px', height:'8px', overflow:'hidden' }}>
              <div style={{ width:`${c.avg*10}%`, height:'100%', background: c.avg>=8?'#065F46':c.avg>=6?'#0096C7':'#991B1B', borderRadius:'999px', transition:'width 0.5s' }} />
            </div>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#0F2044', minWidth:'40px' }}>{c.avg}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}
