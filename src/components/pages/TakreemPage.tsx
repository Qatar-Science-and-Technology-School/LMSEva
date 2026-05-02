'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, SCHOOL_NAME, getUserDeptIds } from '@/lib/data';
import type { User, Evaluation, Teacher } from '@/lib/data';
import * as XLSX from 'xlsx';

interface Props { currentUser: User; }

export default function TakreemPage({ currentUser }: Props) {
  const teachers = db.getTeachers();
  const evaluations = db.getEvaluations();
  const departments = db.getDepartments();

  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);

  // Available months
  const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];

  const [selYear, setSelYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState(APPROVED_MONTHS[0]);
  const [selDept, setSelDept] = useState('');
  const [search, setSearch] = useState('');
  const [selPerf, setSelPerf] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'monthly'|'archive'|'annual'>('monthly');

  // Merged departments logic (legacy support for d_phys/chem/bio -> d_stem)
  function getMergedDeptId(deptId: string): string {
    if (['d_phys', 'd_chem', 'd_bio'].includes(deptId)) return 'd_stem';
    return deptId;
  }

  const mergedDepartments = departments;

  // Determine which merged departments this coordinator can see
  const availableMergedDepts = isCoord && coordDepts.length > 0
    ? mergedDepartments.filter(d => coordDepts.some(cd => getMergedDeptId(cd) === d.id))
    : mergedDepartments;

  // Monthly Honorees Logic
  const getHonorees = (year: string, month: string) => {
    let evals = evaluations.filter(e => e.academicYear === year && e.month === month);

    // Filter to coordinator's departments
    if (isCoord && coordDepts.length > 0) {
      const allowedDeptIds = new Set(coordDepts.map(getMergedDeptId));
      evals = evals.filter(e => {
        const t = teachers.find(x => x.id === e.teacherId);
        return t && allowedDeptIds.has(getMergedDeptId(t.departmentId));
      });
    }

    // Group by merged department + subject (specifically for STEM to allow multiple subject honorees)
    const byDept: Record<string, Evaluation[]> = {};
    evals.forEach(e => {
      const t = teachers.find(x => x.id === e.teacherId);
      if (!t) return;
      const mDeptId = getMergedDeptId(t.departmentId);
      // If STEM, group by subject to allow best in Physics, Chemistry, etc.
      const groupKey = mDeptId === 'd_stem' ? `d_stem_${t.subject}` : mDeptId;
      if (!byDept[groupKey]) byDept[groupKey] = [];
      byDept[groupKey].push(e);
    });

    const honorees: { ev: Evaluation; t: Teacher; deptName: string; perf: any }[] = [];

    Object.entries(byDept).forEach(([groupKey, deptEvals]) => {
      // Extract original mDeptId (e.g. 'd_stem' from 'd_stem_Physics')
      const mDeptId = groupKey.startsWith('d_stem_') ? 'd_stem' : groupKey;

      deptEvals.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        // ... (sorting logic)
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        const a10s = a.criteria.filter(c => c.score === 10).length;
        const b10s = b.criteria.filter(c => c.score === 10).length;
        if (b10s !== a10s) return b10s - a10s;
        
        const a1 = a.criteria[0]?.score || 0; const b1 = b.criteria[0]?.score || 0;
        if (b1 !== a1) return b1 - a1;
        const a2 = a.criteria[1]?.score || 0; const b2 = b.criteria[1]?.score || 0;
        if (b2 !== a2) return b2 - a2;
        const a4 = a.criteria[3]?.score || 0; const b4 = b.criteria[3]?.score || 0;
        if (b4 !== a4) return b4 - a4;

        const ta = teachers.find(x => x.id === a.teacherId);
        const tb = teachers.find(x => x.id === b.teacherId);
        return (ta?.nameAr || '').localeCompare(tb?.nameAr || '', 'ar');
      });

      const bestEv = deptEvals[0];
      const t = teachers.find(x => x.id === bestEv.teacherId);
      if (t) {
        honorees.push({
          ev: bestEv,
          t,
          deptName: mergedDepartments.find(d => d.id === mDeptId)?.nameAr || mDeptId,
          perf: getPerformanceLevel(bestEv.totalScore)
        });
      }
    });

    return honorees;
  };

  const currentHonorees = useMemo(() => getHonorees(selYear, selMonth), [evaluations, selYear, selMonth, isCoord, coordDepts, teachers]);

  const filteredHonorees = useMemo(() => {
    let list = currentHonorees;
    if (selDept) list = list.filter(h => getMergedDeptId(h.t.departmentId) === selDept);
    if (selPerf) list = list.filter(h => h.perf.label === selPerf);
    if (search) list = list.filter(h => h.t.nameAr.includes(search) || (h.t.nameEn && h.t.nameEn.toLowerCase().includes(search.toLowerCase())));
    return list;
  }, [currentHonorees, selDept, selPerf, search]);

  const printCertificate = (h: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>شهادة تكريم - ${h.t.nameAr}</title>
          <style>
            body { font-family: 'Arial', sans-serif; text-align: center; margin: 0; padding: 40px; background: #f9fafb; }
            .cert { border: 10px solid #0F2044; padding: 40px; background: #fff; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; }
            .cert::after { content: ''; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border: 2px solid #0096C7; pointer-events: none; }
            h1 { color: #0F2044; font-size: 36px; margin-bottom: 10px; }
            h2 { color: #0096C7; font-size: 24px; margin-top: 0; }
            p { font-size: 20px; line-height: 1.8; color: #374151; margin: 30px 0; }
            .name { font-size: 32px; font-weight: bold; color: #0F2044; margin: 20px 0; text-decoration: underline; text-decoration-color: #0096C7; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sig { text-align: center; font-size: 18px; font-weight: bold; color: #0F2044; border-top: 1px solid #94A3B8; padding-top: 10px; width: 25%; }
            @media print { body { padding: 0; background: #fff; } .cert { border: 8px solid #0F2044; box-shadow: none; max-width: 100%; height: 90vh; } }
          </style>
        </head>
        <body>
          <div class="cert">
            <h1>مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</h1>
            <h2>شهادة شكر وتقدير</h2>
            <p>
              تتقدم إدارة المدرسة بجزيل الشكر والتقدير للمعلم الفاضل
            </p>
            <div class="name">${h.t.nameAr}</div>
            <p>
              وذلك لتميزه في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية خلال شهر <b>${h.ev.month}</b> للعام الأكاديمي <b>${h.ev.academicYear}</b> على مستوى قسم <b>${h.deptName}</b> بحصوله على درجة ${h.ev.totalScore}%.
            </p>
            <div class="signatures">
              <div class="sig">منسق المشاريع الإلكترونية</div>
              <div class="sig">النائب الأكاديمي</div>
              <div class="sig">مدير المدرسة</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportExcel = () => {
    const rows = filteredHonorees.map(h => ({
      'القسم': h.deptName,
      'الاسم بالعربي': h.t.nameAr,
      'الاسم بالإنجليزي': h.t.nameEn,
      'المادة': h.t.subject,
      'الشهر': h.ev.month,
      'العام الأكاديمي': h.ev.academicYear,
      'الدرجة النهائية': h.ev.totalScore,
      'متوسط الدرجة': h.ev.averageScore,
      'مستوى الأداء': h.perf.label,
      'سبب التكريم': 'تميز المعلم في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية خلال هذا الشهر على مستوى القسم.'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المكرمون');
    XLSX.writeFile(wb, `Takreem_${selMonth}_${selYear}.xlsx`);
  };

  const printReport = () => { window.print(); };

  // Annual Summary Logic
  const annualSummary = useMemo(() => {
    let evals = evaluations.filter(e => e.academicYear === selYear);
    if (isCoord && coordDepts.length > 0) {
      const allowedDeptIds = new Set(coordDepts.map(getMergedDeptId));
      evals = evals.filter(e => {
        const t = teachers.find(x => x.id === e.teacherId);
        return t && allowedDeptIds.has(getMergedDeptId(t.departmentId));
      });
    }

    const allHonorees: any[] = [];
    APPROVED_MONTHS.forEach(m => {
      allHonorees.push(...getHonorees(selYear, m));
    });

    const teacherCounts: Record<string, number> = {};
    const deptConsistency: Record<string, number> = {};
    const deptScores: Record<string, number[]> = {};

    allHonorees.forEach(h => {
      teacherCounts[h.t.id] = (teacherCounts[h.t.id] || 0) + 1;
      deptConsistency[h.deptName] = (deptConsistency[h.deptName] || 0) + 1;
      if (!deptScores[h.deptName]) deptScores[h.deptName] = [];
      deptScores[h.deptName].push(h.ev.totalScore);
    });

    return { allHonorees, teacherCounts, deptConsistency, deptScores };
  }, [selYear, evaluations, isCoord, coordDepts, teachers]);

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl' }}>
      <div style={{ marginBottom:'2rem', textAlign:'center' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#0F2044', margin:'0 0 0.5rem 0' }}>
          {isCoord ? 'تكريم معلمي القسم' : 'تكريم المعلمين'}
        </h1>
        <p style={{ color:'#64748B', margin:0, fontSize:'1rem' }}>تكريم أفضل معلم من كل قسم شهريًا في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية</p>
      </div>

      <div style={{ display:'flex', gap:'1rem', borderBottom:'1px solid #E2E8F0', marginBottom:'1.5rem' }}>
        {[
          { id:'monthly', label:'التكريم الشهري' },
          { id:'archive', label:'أرشيف التكريم الشهري' },
          { id:'annual',  label:'ملخص التكريم السنوي' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding:'0.75rem 1.5rem', background:'none', border:'none', cursor:'pointer',
              fontWeight: activeTab === tab.id ? 800 : 400,
              color: activeTab === tab.id ? '#0096C7' : '#64748B',
              borderBottom: activeTab === tab.id ? '3px solid #0096C7' : '3px solid transparent',
              fontSize:'0.9rem'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (only for monthly) */}
      {activeTab === 'monthly' && (
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'center', background:'#fff', padding:'1rem', borderRadius:'12px', border:'1px solid #E2E8F0' }}>
          <select className="form-input" style={{ width:'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
            {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="form-input" style={{ width:'auto' }} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            {APPROVED_MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select className="form-input" style={{ width:'auto', minWidth:'160px' }} value={selDept} onChange={e => setSelDept(e.target.value)} disabled={isCoord && coordDepts.length === 1}>
            <option value="">{isCoord && coordDepts.length === 1 ? 'قسمي' : 'كل الأقسام'}</option>
            {availableMergedDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
          </select>
          <select className="form-input" style={{ width:'auto' }} value={selPerf} onChange={e => setSelPerf(e.target.value)}>
            <option value="">كل المستويات</option>
            <option value="متميز">متميز</option>
            <option value="متقدم جدًا">متقدم جدًا</option>
          </select>
          <input type="text" className="form-input" placeholder="بحث باسم المعلم..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:'200px' }} />
          
          <div style={{ flex:1 }} />
          <button onClick={exportExcel} className="btn btn-ghost">📥 تصدير Excel</button>
          <button onClick={printReport} className="btn btn-primary" style={{ background:'#0F2044', color:'#fff' }}>📋 تقرير التكريم الشهري</button>
        </div>
      )}

      {/* Monthly Content */}
      {activeTab === 'monthly' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
            {filteredHonorees.map(h => (
              <div key={h.t.id} style={{ ...cardStyle, position:'relative', overflow:'hidden', borderTop:`4px solid ${h.perf.color}` }}>
                <div style={{ position:'absolute', top:'10px', left:'10px', fontSize:'2rem', opacity:0.1 }}>🏆</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                  <div>
                    <div style={{ fontSize:'0.75rem', color:'#64748B', fontWeight:700 }}>{h.deptName}</div>
                    <h3 style={{ fontSize:'1.1rem', color:'#0F2044', fontWeight:800, margin:'0.25rem 0' }}>{h.t.nameAr}</h3>
                    <div style={{ fontSize:'0.75rem', color:'#94A3B8' }}>{h.t.subject}</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1.4rem', fontWeight:800, color:h.perf.color }}>{h.ev.totalScore}%</div>
                    <div style={{ fontSize:'0.65rem', color:'#64748B' }}>الدرجة النهائية</div>
                  </div>
                </div>
                <p style={{ fontSize:'0.8rem', color:'#374151', lineHeight:1.5, marginBottom:'1rem', background:'#F8FAFC', padding:'0.75rem', borderRadius:'8px' }}>
                  تميز المعلم في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية خلال هذا الشهر على مستوى القسم.
                </p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ background:h.perf.bg, color:h.perf.color, padding:'0.25rem 0.75rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>{h.perf.label}</span>
                  <button onClick={() => printCertificate(h)} className="btn btn-ghost" style={{ fontSize:'0.75rem', padding:'0.4rem 0.8rem', color:'#0096C7', border:'1px solid #0096C7' }}>
                    🏅 إنشاء شهادة تكريم
                  </button>
                </div>
              </div>
            ))}
            {filteredHonorees.length === 0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'#64748B' }}>لا يوجد بيانات تكريم مطابقة للبحث.</div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#0F2044', marginBottom:'1rem' }}>تفاصيل التكريم</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--gray-200)' }}>
                    {['القسم','اسم المعلم','المادة','الدرجة النهائية','متوسط الدرجة','مستوى الأداء','سبب التكريم'].map(h => (
                      <th key={h} style={{ padding:'0.75rem', textAlign:'right', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHonorees.map((h, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #E2E8F0' }}>
                      <td style={{ padding:'0.75rem', fontWeight:700, color:'#0F2044' }}>{h.deptName}</td>
                      <td style={{ padding:'0.75rem', fontWeight:600 }}>{h.t.nameAr}<br/><span style={{ fontSize:'0.7rem', color:'#94A3B8' }}>{h.t.nameEn}</span></td>
                      <td style={{ padding:'0.75rem', color:'#64748B' }}>{h.t.subject}</td>
                      <td style={{ padding:'0.75rem', fontWeight:800, color:h.perf.color }}>{h.ev.totalScore}</td>
                      <td style={{ padding:'0.75rem' }}>{h.ev.averageScore}</td>
                      <td style={{ padding:'0.75rem' }}><span style={{ background:h.perf.bg, color:h.perf.color, padding:'0.2rem 0.5rem', borderRadius:'4px', fontSize:'0.7rem' }}>{h.perf.label}</span></td>
                      <td style={{ padding:'0.75rem', color:'#64748B', fontSize:'0.75rem' }}>تميز على مستوى القسم</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Archive Content */}
      {activeTab === 'archive' && (
        <div>
          <div style={{ marginBottom:'1rem' }}>
            <select className="form-input" style={{ width:'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
            {APPROVED_MONTHS.map(m => {
              const monthHonorees = getHonorees(selYear, m);
              return (
                <div key={m} style={{ ...cardStyle, cursor:'pointer', borderLeft: monthHonorees.length ? '4px solid #0096C7' : '4px solid #E2E8F0' }} onClick={() => { setActiveTab('monthly'); setSelMonth(m); }}>
                  <h3 style={{ margin:'0 0 0.5rem 0', fontSize:'1.1rem', color:'#0F2044' }}>{m}</h3>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#64748B' }}>{monthHonorees.length} معلم مكرم</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Annual Summary Content */}
      {activeTab === 'annual' && (
        <div>
          <div style={{ marginBottom:'1rem' }}>
            <select className="form-input" style={{ width:'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem', marginBottom:'2rem' }}>
            <div style={cardStyle}>
              <p style={{ fontSize:'0.8rem', color:'#64748B', margin:0 }}>إجمالي التكريمات خلال العام</p>
              <h2 style={{ fontSize:'2rem', color:'#0F2044', margin:'0.5rem 0 0 0' }}>{annualSummary.allHonorees.length}</h2>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize:'0.8rem', color:'#64748B', margin:0 }}>عدد المعلمين المكرمين (فريد)</p>
              <h2 style={{ fontSize:'2rem', color:'#0096C7', margin:'0.5rem 0 0 0' }}>{Object.keys(annualSummary.teacherCounts).length}</h2>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize:'0.8rem', color:'#64748B', margin:0 }}>أكثر قسم انتظاماً</p>
              <h2 style={{ fontSize:'1.2rem', color:'#065F46', margin:'0.5rem 0 0 0' }}>
                {Object.entries(annualSummary.deptConsistency).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-'}
              </h2>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize:'1rem', color:'#0F2044', margin:'0 0 1rem 0' }}>المعلمون الأكثر تكريماً</h3>
              {Object.entries(annualSummary.teacherCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10).map(([tId, count], i) => {
                const t = teachers.find(x => x.id === tId);
                return (
                  <div key={tId} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid #F1F5F9' }}>
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044' }}>{t?.nameAr}</span>
                      <span style={{ fontSize:'0.7rem', color:'#64748B' }}>{t ? getDeptName(t.departmentId, departments) : ''}</span>
                    </div>
                    <span style={{ background:'#E0F2FE', color:'#0284C7', padding:'0.2rem 0.5rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700 }}>{count} مرات</span>
                  </div>
                );
              })}
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize:'1rem', color:'#0F2044', margin:'0 0 1rem 0' }}>ملخص الأقسام</h3>
              {Object.entries(annualSummary.deptScores).map(([dept, scores]) => {
                const avg = scores.reduce((a,b)=>a+b,0) / scores.length;
                return (
                  <div key={dept} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044' }}>{dept}</span>
                    <div style={{ textAlign:'left' }}>
                      <span style={{ fontSize:'0.8rem', color:'#64748B', display:'block' }}>{scores.length} تكريم</span>
                      <span style={{ fontSize:'0.75rem', color:'#065F46', fontWeight:700 }}>متوسط {avg.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
