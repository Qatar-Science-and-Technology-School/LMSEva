'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, getUserDeptIds, getUserDeptLabel } from '@/lib/data';
import type { User } from '@/lib/data';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0F2044','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4','#CAF0F8','#023E8A'];

interface Props { currentUser: User; onViewTeacher: (id: string) => void; }

export default function Dashboard({ currentUser, onViewTeacher }: Props) {
  const teachers    = db.getTeachers();
  const evaluations = db.getEvaluations();
  const departments = db.getDepartments();

  const currentYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];
  const [selYear,  setSelYear]  = useState(currentYear);
  const [selMonth, setSelMonth] = useState('');
  const [selDept,  setSelDept]  = useState('');

  const isCoord   = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);
  const coordLabel = getUserDeptLabel(currentUser, departments);

  // Departments visible to this user
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

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

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, e) => s + e.totalScore, 0) / filtered.length * 10) / 10
    : 0;

  const teachersNeedingFollowup = useMemo(() => {
    const byTeacher: Record<string, number[]> = {};
    filtered.forEach(e => {
      if (!byTeacher[e.teacherId]) byTeacher[e.teacherId] = [];
      byTeacher[e.teacherId].push(e.totalScore);
    });
    return Object.entries(byTeacher).filter(([, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return avg < 75;
    }).length;
  }, [filtered]);

  // Best teacher
  const bestTeacher = useMemo(() => {
    const byTeacher: Record<string, number[]> = {};
    filtered.forEach(e => {
      if (!byTeacher[e.teacherId]) byTeacher[e.teacherId] = [];
      byTeacher[e.teacherId].push(e.totalScore);
    });
    let best = { id: '', avg: 0 };
    Object.entries(byTeacher).forEach(([id, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > best.avg) best = { id, avg };
    });
    return teachers.find(t => t.id === best.id);
  }, [filtered, teachers]);

  // Best department
  const bestDept = useMemo(() => {
    const byDept: Record<string, number[]> = {};
    filtered.forEach(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      if (!t) return;
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

  // Takreem Honorees Logic for Dashboard
  const takreemHonorees = useMemo(() => {
    // If no specific month selected, default to the latest approved month that has data, or just the first month if none.
    const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
    const targetMonth = selMonth || APPROVED_MONTHS[APPROVED_MONTHS.length - 1]; // or find latest
    
    let evals = scopedEvals.filter(e => e.academicYear === selYear && e.month === targetMonth);
    
    // Group by department
    const byDept: Record<string, typeof evals> = {};
    evals.forEach(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      if (!t) return;
      const dId = t.departmentId;
      if (!byDept[dId]) byDept[dId] = [];
      byDept[dId].push(e);
    });

    const honorees: any[] = [];
    Object.entries(byDept).forEach(([mId, deptEvals]) => {
      deptEvals.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        const a10 = a.criteria.filter(c => c.score === 10).length;
        const b10 = b.criteria.filter(c => c.score === 10).length;
        if (b10 !== a10) return b10 - a10;
        const a1 = a.criteria[0]?.score||0; const b1 = b.criteria[0]?.score||0;
        if (b1 !== a1) return b1 - a1;
        const a2 = a.criteria[1]?.score||0; const b2 = b.criteria[1]?.score||0;
        if (b2 !== a2) return b2 - a2;
        const a4 = a.criteria[3]?.score||0; const b4 = b.criteria[3]?.score||0;
        if (b4 !== a4) return b4 - a4;
        const ta = teachers.find(x => x.id === a.teacherId);
        const tb = teachers.find(x => x.id === b.teacherId);
        return (ta?.nameAr || '').localeCompare(tb?.nameAr || '', 'ar');
      });
      const bestEv = deptEvals[0];
      const t = teachers.find(x => x.id === bestEv.teacherId);
      if (t) {
        const d = departments.find(x => x.id === mId);
        honorees.push({ ev: bestEv, t, deptName: d ? d.nameAr : mId });
      }
    });
    
    // If coordinator with multiple depts, return multiple; if single, return single.
    return { month: targetMonth, data: honorees };
  }, [scopedEvals, selYear, selMonth, teachers, departments]);

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
    { name:'متميز', count: filtered.filter(e => e.totalScore >= 90).length },
    { name:'متقدم جدًا', count: filtered.filter(e => e.totalScore >= 80 && e.totalScore < 90).length },
    { name:'مستوى جيد', count: filtered.filter(e => e.totalScore >= 70 && e.totalScore < 80).length },
    { name:'يحتاج متابعة', count: filtered.filter(e => e.totalScore < 70).length },
  ].filter(d => d.count > 0);
  const distColors = ['#065F46','#1E40AF','#0E7490','#92400E','#991B1B'];

  // Year trend
  const yearTrend = ACADEMIC_YEARS.map(yr => {
    const ye = evaluations.filter(e => e.academicYear === yr);
    return { name: yr, avg: ye.length ? Math.round(ye.reduce((s, e) => s + e.totalScore, 0) / ye.length * 10) / 10 : 0 };
  });

  // Recent evals
  // Recent evals — sorted by dept then teacher name
  const recent = [...filtered]
    .sort((a, b) => {
      const tA = teachers.find(x => x.id === a.teacherId);
      const tB = teachers.find(x => x.id === b.teacherId);
      const dA = getDeptName(tA?.departmentId||'', departments);
      const dB = getDeptName(tB?.departmentId||'', departments);
      return dA.localeCompare(dB,'ar') || (tA?.nameAr||'').localeCompare(tB?.nameAr||'','ar');
    }).slice(0, 10);

  const kpiStyle = {
    background:'#fff', borderRadius:'12px', padding:'1.25rem',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0'
  };
  const darkCardStyle = {
    background:'#0F2044', borderRadius:'12px', padding:'1.25rem', color:'#fff',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.1)'
  };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl' }}>
      {/* Filters */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <select className="form-input" style={{ width:'auto', minWidth:'130px' }}
          value={selYear} onChange={e => setSelYear(e.target.value)}>
          {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="form-input" style={{ width:'auto', minWidth:'110px' }}
          value={selMonth} onChange={e => setSelMonth(e.target.value)}>
          <option value="">كل الأشهر</option>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="form-input" style={{ width:'auto', minWidth:'160px' }}
          value={selDept} onChange={e => setSelDept(e.target.value)}
          disabled={isCoord && coordDepts.length === 1}>
          <option value="">{isCoord && coordDepts.length === 1 ? coordLabel : 'كل الأقسام'}</option>
          {availableDepts.filter(d => d.id !== selDept || selDept === '').map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'إجمالي المعلمين', value: teachers.length, icon:'👨‍🏫', color:'#0F2044' },
          { label:'التقييمات المكتملة', value: filtered.length, icon:'✅', color:'#0096C7' },
          { label:'متوسط الأداء', value: `${avgScore}%`, icon:'📊', color: avgScore >= 80 ? '#065F46' : avgScore >= 60 ? '#92400E' : '#991B1B' },
          { label:'يحتاجون متابعة', value: teachersNeedingFollowup, icon:'⚠️', color:'#991B1B' },
          { label:'أفضل معلم', value: bestTeacher?.nameAr || '-', icon:'🏆', color:'#065F46' },
          { label:'أفضل قسم', value: bestDept || '-', icon:'🥇', color:'#0096C7' },
          { label:'العام الحالي', value: selYear, icon:'📅', color:'#0F2044' },
          { label:'الأشهر المقيمة', value: selMonth || `${MONTHS.length} أشهر`, icon:'🗓️', color:'#0096C7' },
        ].map((k, i) => (
          <div key={i} style={kpiStyle}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:'0.7rem', color:'#64748B', margin:'0 0 0.25rem' }}>{k.label}</p>
                <p style={{ fontSize:'1.1rem', fontWeight:800, color: k.color, margin:0, lineHeight:1.2 }}>{k.value}</p>
              </div>
              <span style={{ fontSize:'1.5rem' }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'1rem' }}>📈 متوسط الأداء حسب الشهر</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:'#fff' }} axisLine={{ stroke:'rgba(255,255,255,0.2)' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} axisLine={{ stroke:'rgba(255,255,255,0.2)' }} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Line type="monotone" dataKey="avg" stroke="#00B4D8" strokeWidth={3} dot={{ r:4, fill:'#00B4D8' }} name="المتوسط" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'1rem' }}>🏅 توزيع مستويات الأداء</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} 
                label={({ name, percent }) => `${name} ${((percent||0)*100).toFixed(0)}%`} 
                labelLine={{ stroke:'rgba(255,255,255,0.3)' }}
                style={{ fill:'#fff', fontSize:'10px' }}
              >
                {distData.map((_, i) => <Cell key={i} fill={distColors[i % distColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'1rem' }}>🏫 مقارنة الأقسام</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:'#fff' }} width={90} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Bar dataKey="avg" fill="#00B4D8" name="المتوسط" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={darkCardStyle}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'1rem' }}>📅 تطور الأداء عبر السنوات</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:10, fill:'#fff' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#fff' }} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Bar dataKey="avg" fill="#00B4D8" name="المتوسط" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Takreem Honorees Widget */}
      <div style={{ ...darkCardStyle, marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', margin:0 }}>
            🏆 {isCoord && coordDepts.length === 1 ? 'المعلم المكرم في القسم لهذا الشهر' : 'المعلمون المكرمون لهذا الشهر'} ({takreemHonorees.month})
          </h3>
          <button onClick={() => {
            const navBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('تكريم المعلمين'));
            if(navBtn) navBtn.click();
          }} className="btn btn-ghost" style={{ fontSize:'0.7rem', padding:'0.25rem 0.6rem', color:'#fff' }}>
            عرض صفحة التكريم
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'0.75rem' }}>
          {takreemHonorees.data.map((h: any) => (
            <div key={h.t.id} style={{ padding:'0.75rem', background:'rgba(255,255,255,0.05)', borderRadius:'8px', borderLeft:'3px solid #0096C7' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', fontWeight:700 }}>{h.deptName}</div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#fff', margin:'0.25rem 0' }}>{h.t.nameAr}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)' }}>الدرجة:</span>
                <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#00B4D8' }}>{h.ev.totalScore}%</span>
              </div>
            </div>
          ))}
          {takreemHonorees.data.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'1rem', color:'rgba(255,255,255,0.5)', fontSize:'0.8rem' }}>لا يوجد بيانات لهذا الشهر</div>
          )}
        </div>
      </div>

      {/* Recent evaluations table */}
      <div style={darkCardStyle}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'1rem' }}>🕐 آخر التقييمات</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
            <thead>
              <tr>
                {['المعلم','القسم','الشهر','العام','الدرجة','مستوى الأداء','الإجراء'].map(h => (
                  <th key={h} style={{ padding:'0.6rem 0.75rem', textAlign:'right', fontWeight:600, color:'#fff', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((ev, i) => {
                const t = teachers.find(x => x.id === ev.teacherId);
                const dept = t ? getDeptName(t.departmentId, departments) : '-';
                const perf = getPerformanceLevel(ev.totalScore);
                return (
                  <tr key={ev.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:600, color:'#fff' }}>{t?.nameAr || '-'}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'rgba(255,255,255,0.6)' }}>{dept}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#fff' }}>{ev.month}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'rgba(255,255,255,0.6)' }}>{ev.academicYear}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:700, color:'#00B4D8' }}>{ev.totalScore}/100</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      <span style={{ background:perf.bg, color:perf.color, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>
                        {perf.label}
                      </span>
                    </td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      {t && <button onClick={() => onViewTeacher(t.id)} className="btn btn-ghost" style={{ padding:'0.25rem 0.6rem', fontSize:'0.7rem', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>عرض الملف</button>}
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
