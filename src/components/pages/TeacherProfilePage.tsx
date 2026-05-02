'use client';
import { useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, EVALUATION_CRITERIA, SCHOOL_NAME } from '@/lib/data';
import type { User } from '@/lib/data';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface Props { teacherId: string; currentUser: User; onBack: () => void; }

export default function TeacherProfilePage({ teacherId, currentUser, onBack }: Props) {
  const teachers    = db.getTeachers();
  const evaluations = db.getEvaluations();
  const departments = db.getDepartments();

  const teacher = teachers.find(t => t.id === teacherId);
  if (!teacher) return <div style={{ padding:'2rem', textAlign:'center' }}>معلم غير موجود</div>;

  const teacherEvals = evaluations.filter(e => e.teacherId === teacherId);
  const deptEvals    = evaluations.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === teacher.departmentId);
  const deptName     = getDeptName(teacher.departmentId, departments);

  // Stats
  const allScores = teacherEvals.map(e => e.totalScore);
  const avgAll    = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length*10)/10 : 0;
  const best      = allScores.length ? Math.max(...allScores) : 0;
  const worst     = allScores.length ? Math.min(...allScores) : 0;
  const bestMonth = teacherEvals.find(e => e.totalScore === best);
  const worstMonth= teacherEvals.find(e => e.totalScore === worst);

  const currentYearEvals = teacherEvals.filter(e => e.academicYear === ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);
  const currentAvg = currentYearEvals.length ? Math.round(currentYearEvals.reduce((s,e)=>s+e.totalScore,0)/currentYearEvals.length*10)/10 : 0;
  const perf = getPerformanceLevel(avgAll);

  // Monthly trend for current year
  const monthlyTrend = MONTHS.map(m => {
    const ev = teacherEvals.find(e => e.month === m && e.academicYear === ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);
    const deptEv = deptEvals.filter(e => e.month === m && e.academicYear === ACADEMIC_YEARS[ACADEMIC_YEARS.length-1]);
    const deptAvg = deptEv.length ? Math.round(deptEv.reduce((s,e)=>s+e.totalScore,0)/deptEv.length*10)/10 : 0;
    return { name: m, المعلم: ev?.totalScore ?? null, القسم: deptAvg || null };
  });

  // Criteria radar (latest eval)
  const latestEval = [...teacherEvals].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
  const radarData = latestEval ? EVALUATION_CRITERIA.map((label, i) => ({
    subject: `${i+1}`, value: latestEval.criteria[i]?.score ?? 0,
    fullMark: 10
  })) : [];

  // Year trend
  const yearTrend = ACADEMIC_YEARS.map(yr => {
    const ye = teacherEvals.filter(e => e.academicYear === yr);
    return { name: yr, avg: ye.length ? Math.round(ye.reduce((s,e)=>s+e.totalScore,0)/ye.length*10)/10 : 0 };
  });

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0', marginBottom:'1rem' };
  const darkCardStyle = {
    background:'#0F2044', borderRadius:'12px', padding:'1.25rem', color:'#fff',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.1)', marginBottom:'1rem'
  };
  const statBox = (label:string, value:string|number, sub?:string, color='#0F2044') => (
    <div style={{ ...cardStyle, marginBottom:0, textAlign:'center' }}>
      <p style={{ fontSize:'0.7rem', color:'#64748B', margin:'0 0 0.25rem' }}>{label}</p>
      <p style={{ fontSize:'1.25rem', fontWeight:800, color, margin:0 }}>{value}</p>
      {sub && <p style={{ fontSize:'0.65rem', color:'#94A3B8', margin:'0.1rem 0 0' }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ padding:'1.5rem', direction:'rtl', maxWidth:'1000px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem' }}>→</button>
        <div>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'#0F2044', margin:0 }}>{teacher.nameAr}</h2>
          <p style={{ fontSize:'0.75rem', color:'#64748B', margin:'0.1rem 0 0' }}>{teacher.nameEn} · {deptName} · {teacher.employeeId}</p>
        </div>
        <span style={{ marginRight:'auto', background:perf.bg, color:perf.color, padding:'0.3rem 1rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:700 }}>
          {perf.label}
        </span>
      </div>

      {/* Teacher Info Card */}
      <div style={{ ...cardStyle, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem' }}>
        {[
          ['البريد الإلكتروني', teacher.email],
          ['المادة', teacher.subject],
          ['القسم', deptName],
          ['الفئة الوظيفية', teacher.jobCategory],
          ['الحالة', teacher.status === 'active' ? 'نشط' : 'غير نشط'],
          ['تاريخ الإضافة', teacher.createdAt],
        ].map(([l, v]) => (
          <div key={l}>
            <p style={{ fontSize:'0.65rem', color:'#94A3B8', margin:0 }}>{l}</p>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#0F2044', margin:'0.15rem 0 0' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
        {statBox('متوسط الأداء الكلي', `${avgAll}%`, 'كل الأعوام', perf.color)}
        {statBox('متوسط العام الحالي', `${currentAvg}%`, ACADEMIC_YEARS[ACADEMIC_YEARS.length-1], '#0096C7')}
        {statBox('أفضل شهر', `${best}%`, bestMonth?.month)}
        {statBox('أقل شهر', `${worst}%`, worstMonth?.month, '#991B1B')}
        {statBox('إجمالي التقييمات', teacherEvals.length)}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>📈 الأداء الشهري (مقارنة بالقسم)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:8, fill:'#fff' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Legend wrapperStyle={{ color:'#fff' }} />
              <Line type="monotone" dataKey="المعلم" stroke="#fff" strokeWidth={3} dot={{ r:4, fill:'#fff' }} connectNulls />
              <Line type="monotone" dataKey="القسم" stroke="#00B4D8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>🕸️ تحليل بنود التقييم (آخر تقييم)</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:'#fff' }} />
                <Radar name="الدرجة" dataKey="value" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:'0.8rem' }}>لا توجد بيانات</p>}
        </div>
      </div>

      <div style={darkCardStyle}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.75rem' }}>📅 تطور الأداء عبر السنوات</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={yearTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize:10, fill:'#fff' }} />
            <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#fff' }} />
            <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
            <Bar dataKey="avg" fill="#00B4D8" name="المتوسط" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evaluation history table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📋 سجل التقييمات الشهرية</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--gray-200)' }}>
                {['الشهر','العام الأكاديمي','المجموع','المتوسط','مستوى الأداء','نقاط القوة','التوصيات'].map(h => (
                  <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'right', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...teacherEvals].sort((a,b) => b.academicYear.localeCompare(a.academicYear) || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month)).map((ev, i) => {
                const p = getPerformanceLevel(ev.totalScore);
                return (
                  <tr key={ev.id} style={{ background: i%2===0?'#fff':'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    <td style={{ padding:'0.5rem 0.75rem', fontWeight:600 }}>{ev.month}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#64748B' }}>{ev.academicYear}</td>
                    <td style={{ padding:'0.5rem 0.75rem', fontWeight:700 }}>{ev.totalScore}/100</td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>{ev.averageScore}/10</td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <span style={{ background:p.bg, color:p.color, padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 }}>{p.label}</span>
                    </td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#374151', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.strengths}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#64748B', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.recommendations}</td>
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
