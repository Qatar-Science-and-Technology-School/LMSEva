'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, getUserDeptIds, getUserDeptLabel, getMonthlyDepartmentHonorees } from '@/lib/data';
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
    const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
    const targetMonth = selMonth || APPROVED_MONTHS[APPROVED_MONTHS.length - 1];
    
    let honorees = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, targetMonth);
    
    // Filter by coordinator depts if needed
    if (isCoord && coordDepts.length > 0) {
      honorees = honorees.filter(h => coordDepts.includes(h.departmentId));
    }
    
    return { month: targetMonth, data: honorees };
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);

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

  // Year trend — enhanced with multiple metrics
  const yearTrend = ACADEMIC_YEARS.map(yr => {
    const ye = evaluations.filter(e => e.academicYear === yr);
    const avg = ye.length ? Math.round(ye.reduce((s, e) => s + e.totalScore, 0) / ye.length * 10) / 10 : 0;
    const distinguished = ye.filter(e => e.totalScore >= 90).length;
    const needsFollowup = ye.filter(e => e.totalScore < 80).length;
    return { name: yr, avg, total: ye.length, متميز: distinguished, 'يحتاج متابعة': needsFollowup };
  }).filter(d => d.total > 0);

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
          { label:'أفضل معلم', value: bestTeacher ? `${bestTeacher.nameAr} (${bestTeacher.score}%)` : '-', icon:'🏆', color:'#065F46' },
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
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={distData} 
                dataKey="count" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={65}
                labelLine={{ stroke:'rgba(255,255,255,0.5)' }}
                label={{ fill: '#FFFFFF', fontSize: 11, fontWeight: 700 }}
              >
                {distData.map((_, i) => (
                  <Cell key={i} fill={['#00B4D8','#0096C7','#0077B6','#023E8A','#03045E'][i % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color:'#fff', fontSize:'11px', paddingTop:'10px' }} />
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
          <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#fff', marginBottom:'0.5rem' }}>📅 تطور الأداء عبر السنوات</h3>
          <div style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
            {yearTrend.map((yr, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
                <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.6)' }}>{yr.name}:</span>
                <span style={{ fontSize:'0.75rem', fontWeight:800, color: yr.avg >= 90 ? '#00B4D8' : yr.avg >= 80 ? '#48CAE4' : '#F59E0B' }}>{yr.avg}%</span>
                <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)' }}>({yr.total} تقييم)</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:'#fff' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#fff' }} />
              <Tooltip contentStyle={{ background:'#1a3a6b', border:'none', borderRadius:'8px', color:'#fff' }} />
              <Legend wrapperStyle={{ color:'#fff', fontSize:'10px' }} />
              <Bar dataKey="avg" fill="#00B4D8" name="المتوسط %" radius={[4,4,0,0]} />
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
            <div key={h.teacherId} style={{ padding:'0.75rem', background:'rgba(255,255,255,0.05)', borderRadius:'8px', borderLeft:'3px solid #0096C7' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', fontWeight:700 }}>{h.departmentName}</div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#fff', margin:'0.25rem 0' }}>{h.teacherNameAr}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.7)' }}>الدرجة:</span>
                <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#00B4D8' }}>{h.totalScore}%</span>
              </div>
            </div>
          ))}
          {takreemHonorees.data.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'1rem', color:'rgba(255,255,255,0.5)', fontSize:'0.8rem' }}>لا يوجد بيانات لهذا الشهر</div>
          )}
        </div>
      </div>

      {/* Teachers Needing Follow-up Table */}
      <div style={{ ...kpiStyle, background: '#fff', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F2044', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠️ معلمون يحتاجون إلى متابعة وخطة تحسين (أقل من 80%)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#0F2044' }}>
                {['المعلم', 'القسم', 'المتوسط', 'عدد التقييمات', 'الإجراء'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(filtered.reduce((acc, e) => {
                if (!acc[e.teacherId]) acc[e.teacherId] = [];
                acc[e.teacherId].push(e.totalScore);
                return acc;
              }, {} as Record<string, number[]>))
                .map(([id, scores]) => {
                  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
                  const t = teachers.find(x => x.id === id);
                  return { t, avg, count: scores.length };
                })
                .filter(x => x.avg < 80 && x.t)
                .sort((a, b) => a.avg - b.avg)
                .map((item, i) => (
                  <tr key={item.t?.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#0F2044' }}>{item.t?.nameAr}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748B' }}>{getDeptName(item.t?.departmentId || '', departments)}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#991B1B' }}>{item.avg}%</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748B' }}>{item.count}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <button onClick={() => onViewTeacher(item.t?.id || '')} className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', color: '#0F2044', border: '1px solid #E2E8F0' }}>عرض الملف</button>
                    </td>
                  </tr>
                ))}
              {filtered.length > 0 && !Object.entries(filtered.reduce((acc, e) => {
                if (!acc[e.teacherId]) acc[e.teacherId] = [];
                acc[e.teacherId].push(e.totalScore);
                return acc;
              }, {} as Record<string, number[]>)).some(([id, scores]) => (scores.reduce((a, b) => a + b, 0) / scores.length) < 80) && (
                <tr>
                  <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
                    ✅ جميع المعلمين في هذا النطاق لديهم أداء مرضي (فوق 80%)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent evaluations table */}
      <div style={kpiStyle}>
        <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>🕐 آخر التقييمات</h3>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
            <thead>
              <tr style={{ background:'#0F2044' }}>
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
                  <tr key={ev.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:600, color:'#0F2044' }}>{t?.nameAr || '-'}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#64748B' }}>{dept}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#0F2044' }}>{ev.month}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#64748B' }}>{ev.academicYear}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:700, color:'#0096C7' }}>{ev.totalScore}/100</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      <span style={{ background:perf.bg, color:perf.color, padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>
                        {perf.label}
                      </span>
                    </td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      {t && <button onClick={() => onViewTeacher(t.id)} className="btn btn-ghost" style={{ padding:'0.25rem 0.6rem', fontSize:'0.7rem', color:'#0F2044', border:'1px solid #E2E8F0' }}>عرض الملف</button>}
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
