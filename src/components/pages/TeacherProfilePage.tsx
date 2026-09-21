'use client';
import { useState, useEffect, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, getPerformanceLevel, getDeptName, EVALUATION_CRITERIA, SCHOOL_NAME, getTeacherRecognitionHistory } from '@/lib/data';
import { invalidateCache } from '@/lib/firestoreDb';
import type { User, Teacher, Evaluation, Department, ModelLessonEvaluation, Achievement } from '@/lib/data';
import type { IndividualPDRecord } from '@/lib/pdData';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import PrintHeader from '@/components/PrintHeader';

interface Props { teacherId: string; currentUser: User; onBack: () => void; selectedYear?: string; }

export default function TeacherProfilePage({ teacherId, currentUser, onBack, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<ModelLessonEvaluation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [individualRecords, setIndividualRecords] = useState<IndividualPDRecord[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modellessons' | 'pd' | 'achievements'>('overview');

  useEffect(() => {
    Promise.all([
      db.getTeachers(),
      db.getEvaluations(),
      db.getDepartments(),
      db.getModelLessonEvaluations().catch(() => []),
      db.getAchievements().catch(() => []),
      db.getIndividualPDRecords().catch(() => []),
      db.getMeeeRecords().catch(() => [])
    ]).then(([t, e, d, mle, ach, ipd, meee]) => {
      setTeachers(t);
      setEvaluations(e);
      setDepartments(d);
      setModelLessonEvals(mle);
      setAchievements(ach);
      setIndividualRecords(ipd);
      setMeeeRecords(meee);
      setLoading(false);
    });
  }, []);

  const recognitionHistory = useMemo(() => {
    return getTeacherRecognitionHistory(evaluations, teachers, departments, teacherId);
  }, [evaluations, teachers, departments, teacherId]);

  const teacher = teachers.find(t => t.id === teacherId);

  // Model lessons for this teacher
  const teacherModelLessons = useMemo(() => {
    return modelLessonEvals.filter(m => m.teacherId === teacherId);
  }, [modelLessonEvals, teacherId]);

  // Achievements for this teacher
  const teacherAchievements = useMemo(() => {
    if (!teacher) return [];
    return achievements.filter(a => 
      (a.supervisorName && a.supervisorName.includes(teacher.nameAr)) ||
      (a.achievementName && a.achievementName.includes(teacher.nameAr))
    );
  }, [achievements, teacher]);

  // PD records for this teacher
  const teacherPD = useMemo(() => {
    if (!teacher) return [];
    return individualRecords.filter(r => 
      r.teacherId === teacherId || 
      (r.traineeNameAr && r.traineeNameAr.includes(teacher.nameAr))
    );
  }, [individualRecords, teacherId, teacher]);

  // MEEE for this teacher
  const teacherMeee = useMemo(() => {
    if (!teacher) return null;
    return meeeRecords.find(m => 
      m.teacherId === teacherId || 
      (m.teacherName && m.teacherName.includes(teacher.nameAr))
    ) || null;
  }, [meeeRecords, teacherId, teacher]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>⏳ جاري تحميل بيانات الملف المهني...</div>;

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

  const activeYear = propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];
  const currentYearEvals = teacherEvals.filter(e => e.academicYear === activeYear);
  const currentAvg = currentYearEvals.length ? Math.round(currentYearEvals.reduce((s,e)=>s+e.totalScore,0)/currentYearEvals.length*10)/10 : 0;
  const perf = getPerformanceLevel(avgAll);

  // Monthly trend for current year
  const monthlyTrend = MONTHS.map(m => {
    const ev = teacherEvals.find(e => e.month === m && e.academicYear === activeYear);
    const deptEv = deptEvals.filter(e => e.month === m && e.academicYear === activeYear);
    const deptAvg = deptEv.length ? Math.round(deptEv.reduce((s,e)=>s+e.totalScore,0)/deptEv.length*10)/10 : 0;
    return { name: m, المعلم: ev?.totalScore ?? null, القسم: deptAvg || null };
  });

  const handleDeleteMonthlyEval = async (evalId: string, evalMonth: string, evalYear: string) => {
    if (!window.confirm(`⚠️ تأكيد حذف التقييم:\n\nهل أنت متأكد من رغبتك في حذف تقييم شهر (${evalMonth} ${evalYear}) لهذا المعلم نهائياً؟\n\nلا يمكن التراجع بعد الحذف.`)) return;
    try {
      await db.deleteEvaluation(evalId);
      invalidateCache('evaluations');
      setEvaluations(prev => prev.filter(e => e.id !== evalId));
      alert('✅ تم حذف التقييم بنجاح!');
    } catch (err) {
      console.error('Delete evaluation error:', err);
      alert('حدث خطأ أثناء حذف التقييم');
    }
  };

  const handleDeleteModelLesson = async (mlId: string, mlDate: string) => {
    if (!window.confirm(`⚠️ تأكيد حذف التقييم:\n\nهل أنت متأكد من رغبتك في حذف تقييم حصة التعليم الإلكتروني بتاريخ (${mlDate}) نهائياً؟\n\nلا يمكن التراجع بعد الحذف.`)) return;
    try {
      await db.deleteModelLessonEvaluation(mlId);
      invalidateCache('modelLessonEvaluations');
      setModelLessonEvals(prev => prev.filter(m => m.id !== mlId));
      alert('✅ تم حذف تقييم الحصة بنجاح!');
    } catch (err) {
      console.error('Delete model lesson error:', err);
      alert('حدث خطأ أثناء حذف تقييم الحصة');
    }
  };

  // Criteria radar (latest eval)
  const latestEval = [...teacherEvals].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
  const radarData = latestEval ? EVALUATION_CRITERIA.map((label, i) => ({
    subject: `${i+1}`, value: latestEval.criteria[i]?.score ?? 0,
    fullMark: 20
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
    <div style={{ padding:'1.5rem', direction:'rtl', maxWidth:'1100px', margin:'0 auto' }}>
      <PrintHeader 
        title="ملف المعلم المهني الشامل (360° Portfolio)" 
        subtitle={`${teacher.nameAr} | ${deptName} | ${teacher.employeeId}`} 
      />
      
      {/* Header */}
      <div className="no-print" style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', padding:'0.2rem' }}>→</button>
        <div>
          <h2 style={{ fontSize:'1.3rem', fontWeight:800, color:'#0F2044', margin:0 }}>{teacher.nameAr}</h2>
          <p style={{ fontSize:'0.75rem', color:'#64748B', margin:'0.1rem 0 0' }}>{teacher.nameEn} · {deptName} · الرقم الوظيفي: {teacher.employeeId}</p>
        </div>
        <div style={{ marginRight:'auto', display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <button onClick={() => window.print()} className="btn btn-primary" style={{ fontSize:'0.8rem' }}>🖨️ طباعة الملف</button>
          <span style={{ background:perf.bg, color:perf.color, padding:'0.3rem 1rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:700 }}>
            {perf.label}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="no-print" style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[
          { id:'overview', label:'📊 التقييم الشهري والتحليلات', count: teacherEvals.length },
          { id:'modellessons', label:'💻 حصص التعليم الإلكتروني', count: teacherModelLessons.length },
          { id:'pd', label:'🎓 التطوير المهني وشهادة MEEE', count: teacherPD.length },
          { id:'achievements', label:'🌟 الإنجازات والمسابقات', count: teacherAchievements.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding:'0.6rem 1rem',
              borderRadius:'10px',
              border:'1px solid',
              borderColor: activeTab === tab.id ? '#0F2044' : '#E2E8F0',
              background: activeTab === tab.id ? '#0F2044' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#475569',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize:'0.8rem',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:'0.4rem',
              transition:'all 0.15s'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              background: activeTab === tab.id ? '#00B4D8' : '#F1F5F9',
              color: activeTab === tab.id ? '#fff' : '#64748B',
              padding:'1px 6px',
              borderRadius:'10px',
              fontSize:'0.68rem',
              fontWeight:800
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Teacher Info Card */}
      <div style={{ ...cardStyle, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem' }}>
        {[
          ['البريد الإلكتروني', teacher.email],
          ['المادة', teacher.subject],
          ['القسم', deptName],
          ['الفئة الوظيفية', teacher.jobCategory],
          ['الحالة', teacher.status === 'active' ? 'نشط' : 'غير نشط'],
          ['شهادة MEEE', teacherMeee ? teacherMeee.status : 'لم يتقدم بعد'],
        ].map(([l, v]) => (
          <div key={l}>
            <p style={{ fontSize:'0.65rem', color:'#94A3B8', margin:0 }}>{l}</p>
            <p style={{ fontSize:'0.8rem', fontWeight:600, color:'#0F2044', margin:'0.15rem 0 0' }}>{v}</p>
          </div>
        ))}
      </div>

      {/* ──── TAB 1: OVERVIEW & MONTHLY EVALUATIONS ──── */}
      {(activeTab === 'overview' || typeof window === 'undefined') && (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
            {statBox('متوسط الأداء الكلي', `${avgAll}%`, 'كل الأعوام', perf.color)}
            {statBox('متوسط العام الحالي', `${currentAvg}%`, activeYear, '#0096C7')}
            {statBox('أفضل شهر', `${best}%`, bestMonth?.month)}
            {statBox('أقل شهر', `${worst}%`, worstMonth?.month, '#991B1B')}
            {statBox('إجمالي التقييمات', teacherEvals.length)}
          </div>

          {/* Recognition History Card */}
          {recognitionHistory.length > 0 && (
            <div style={{ ...cardStyle, background:'#F0F9FF', border:'1px solid #B9E6FE', display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'2.5rem' }}>🏆</div>
              <div style={{ flex:1 }}>
                <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#0369A1', margin:'0 0 0.5rem 0' }}>🏅 سجل التميز والتكريم</h3>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {recognitionHistory.map((h, i) => (
                    <div key={i} style={{ background:'#fff', padding:'0.4rem 0.75rem', borderRadius:'89px', border:'1px solid #B9E6FE', fontSize:'0.75rem', fontWeight:700, color:'#0369A1' }}>
                      {h.month} {h.academicYear} ({h.totalScore}%)
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'center', padding:'0 1rem', borderRight:'1px solid #B9E6FE' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#0369A1' }}>{recognitionHistory.length}</div>
                <div style={{ fontSize:'0.65rem', color:'#64748B' }}>مرات التكريم</div>
              </div>
            </div>
          )}

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

          {/* Evaluation history table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📋 سجل التقييمات الشهرية</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #E2E8F0', background:'#0F2044', color:'#fff' }}>
                    {['الشهر','العام الأكاديمي','المجموع','المتوسط','مستوى الأداء','نقاط القوة','التوصيات','الإجراءات'].map(h => (
                      <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign: h === 'الإجراءات' ? 'center' : 'right', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
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
                        <td style={{ padding:'0.5rem 0.75rem' }}>{ev.averageScore} / 20</td>
                        <td style={{ padding:'0.5rem 0.75rem' }}>
                          <span style={{ background:p.bg, color:p.color, padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 }}>{p.label}</span>
                        </td>
                        <td style={{ padding:'0.5rem 0.75rem', color:'#374151', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.strengths}</td>
                        <td style={{ padding:'0.5rem 0.75rem', color:'#64748B', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.recommendations}</td>
                        <td style={{ padding:'0.5rem 0.75rem', textAlign:'center' }}>
                          <button
                            onClick={() => handleDeleteMonthlyEval(ev.id, ev.month, ev.academicYear)}
                            style={{ background:'#FEE2E2', color:'#991B1B', border:'1px solid #FECACA', padding:'0.2rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:700, cursor:'pointer' }}
                            title="حذف هذا التقييم"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {teacherEvals.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:'1.5rem', color:'#94A3B8' }}>لا توجد تقييمات شهرية مسجلة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ──── TAB 2: MODEL LESSONS EVALUATIONS ──── */}
      {activeTab === 'modellessons' && (
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:800, color:'#0F2044', margin:0 }}>💻 حصص التعليم الإلكتروني النموذجية المقيمة</h3>
            <span style={{ fontSize:'0.75rem', color:'#4338CA', fontWeight:700 }}>إجمالي الحصص: {teacherModelLessons.length}</span>
          </div>

          {teacherModelLessons.length === 0 ? (
            <div style={{ padding:'2.5rem', textAlign:'center', color:'#64748B' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💻</div>
              <div>لم يتم تسجيل تقييم حصص تعليم إلكتروني لهذا المعلم حتى الآن.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {teacherModelLessons.map((ml, idx) => (
                <div key={ml.id || idx} style={{ border:'1px solid #E2E8F0', borderRadius:'10px', padding:'1rem', background:'#F8FAFC' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.5rem', borderBottom:'1px solid #E2E8F0', paddingBottom:'0.5rem', marginBottom:'0.5rem' }}>
                    <div>
                      <span style={{ fontSize:'0.85rem', fontWeight:800, color:'#0F2044' }}>📅 تاريخ الحصة: {ml.date}</span>
                      <span style={{ fontSize:'0.75rem', color:'#64748B', marginRight:'1rem' }}>الحصة: {ml.period} | الصف: {ml.classGrade}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ background:'#ECFDF5', color:'#065F46', padding:'3px 10px', borderRadius:'12px', fontSize:'0.82rem', fontWeight:900 }}>
                        {ml.overallScore} / 10
                      </span>
                      <button
                        onClick={() => handleDeleteModelLesson(ml.id, ml.date)}
                        style={{ background:'#FEE2E2', color:'#991B1B', border:'1px solid #FECACA', padding:'3px 8px', borderRadius:'6px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer' }}
                        title="حذف تقييم هذه الحصة"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'0.5rem', fontSize:'0.75rem', color:'#334155' }}>
                    <div><b>الأدوات الرقمية:</b> <span style={{ color:'#0369A1' }}>{ml.toolsUsed || '-'}</span></div>
                    <div><b>الحضور:</b> {ml.attendees || '-'}</div>
                    {ml.lessonPlanUrl && (
                      <div><b>رابط خطة الدرس والأدلة:</b> <a href={ml.lessonPlanUrl} target="_blank" rel="noreferrer" style={{ color:'#00B4D8', textDecoration:'underline' }}>🔗 فتح الرابط</a></div>
                    )}
                  </div>

                  {(ml.strengths || ml.improvements || ml.recommendations) && (
                    <div style={{ marginTop:'0.5rem', paddingTop:'0.5rem', borderTop:'1px dashed #CBD5E1', fontSize:'0.75rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
                      <div style={{ color:'#065F46' }}><b>نقاط القوة:</b><br />{ml.strengths || '-'}</div>
                      <div style={{ color:'#B45309' }}><b>جوانب التحسين:</b><br />{ml.improvements || '-'}</div>
                      <div style={{ color:'#1E40AF' }}><b>التوصيات:</b><br />{ml.recommendations || '-'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── TAB 3: PROFESSIONAL DEVELOPMENT & MEEE ──── */}
      {activeTab === 'pd' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:800, color:'#0F2044', marginBottom:'1rem' }}>🎓 التطوير المهني والشهادات المعتمدة</h3>
          
          {/* MEEE Status Box */}
          <div style={{ background: teacherMeee?.status === 'حصل على الشهادة' ? '#ECFDF5' : '#F0F9FF', border:'1px solid', borderColor: teacherMeee?.status === 'حصل على الشهادة' ? '#A7F3D0' : '#BAE6FD', borderRadius:'10px', padding:'1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h4 style={{ margin:'0 0 0.25rem', color:'#0F2044', fontSize:'0.88rem', fontWeight:800 }}>🏅 شهادة معلم مايكروسوفت الخبير (MEEE)</h4>
              <p style={{ margin:0, fontSize:'0.75rem', color:'#475569' }}>
                الحالة: <strong style={{ color: teacherMeee?.status === 'حصل على الشهادة' ? '#065F46' : '#0369A1' }}>{teacherMeee?.status || 'لم يتم التقديم بعد'}</strong>
                {teacherMeee?.certificationDate && ` | تاريخ الاعتماد: ${teacherMeee.certificationDate}`}
              </p>
            </div>
            <span style={{ fontSize:'2rem' }}>{teacherMeee?.status === 'حصل على الشهادة' ? '🎖️' : '⏳'}</span>
          </div>

          {/* Individual PD Records */}
          <h4 style={{ fontSize:'0.85rem', fontWeight:700, color:'#0F2044', marginBottom:'0.75rem' }}>📋 الورش التدريبية الفردية</h4>
          {teacherPD.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'#94A3B8', fontSize:'0.8rem' }}>لا توجد سجلات تطوير مهني فردية مسجلة</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {teacherPD.map(pd => (
                <div key={pd.id} style={{ padding:'0.75rem', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#0F2044' }}>{pd.skillProvided || 'تدريب فردي'}</div>
                    <div style={{ fontSize:'0.7rem', color:'#64748B' }}>📅 {pd.trainingDate} | المدة: {pd.durationMinutes || 60} دقيقة | المدرب: {pd.trainerName || 'منسق المشاريع'}</div>
                  </div>
                  <span style={{ background:'#EEF2FF', color:'#4338CA', padding:'2px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:700 }}>
                    {pd.trainingType || 'تدريب فردي'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── TAB 4: ACHIEVEMENTS & CONTRIBUTIONS ──── */}
      {activeTab === 'achievements' && (
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:800, color:'#0F2044', margin:0 }}>🌟 الإنجازات والمسابقات المرتبطة بالمعلم والقسم</h3>
            <span style={{ fontSize:'0.75rem', color:'#059669', fontWeight:700 }}>{teacherAchievements.length} إنجاز مسجل</span>
          </div>

          {teacherAchievements.length === 0 ? (
            <div style={{ padding:'2.5rem', textAlign:'center', color:'#94A3B8' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🌟</div>
              <div>لا توجد إنجازات مسجلة لهذا المعلم أو قسمه بعد.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {teacherAchievements.map(ach => (
                <div key={ach.id} style={{ border:'1px solid #E2E8F0', borderRadius:'10px', padding:'0.85rem', background:'#F8FAFC' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.35rem' }}>
                    <span style={{ fontWeight:800, color:'#0F2044', fontSize:'0.85rem' }}>🏆 {ach.achievementName}</span>
                    <span style={{ background:'#ECFDF5', color:'#065F46', padding:'2px 8px', borderRadius:'10px', fontSize:'0.72rem', fontWeight:800 }}>
                      {ach.result || 'مشاركة متميزة'}
                    </span>
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'#64748B' }}>
                    العام الأكاديمي: {ach.academicYear} | المستوى: {ach.level || 'محلي'} | الجهة المنظمة: {ach.organizer || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

