'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, EVALUATION_CRITERIA, getPerformanceLevel, getDeptName, generateId, SCHOOL_NAME, getUserDeptIds } from '@/lib/data';
import type { User, EvaluationCriterion } from '@/lib/data';

interface Props { currentUser: User; }

const EMPTY_CRITERIA = (): EvaluationCriterion[] =>
  EVALUATION_CRITERIA.map(() => ({ score: 5, note: '' }));

export default function EvaluationPage({ currentUser }: Props) {
  const teachers    = db.getTeachers();
  const departments = db.getDepartments();
  const currentYear = ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1];

  const [teacherId,  setTeacherId]  = useState('');
  const [month,      setMonth]      = useState(MONTHS[0]);
  const [year,       setYear]       = useState(currentYear);
  const [evalDate,   setEvalDate]   = useState(new Date().toISOString().split('T')[0]);
  const [criteria,   setCriteria]   = useState<EvaluationCriterion[]>(EMPTY_CRITERIA());
  const [strengths,  setStrengths]  = useState('');
  const [improve,    setImprove]    = useState('');
  const [recommend,  setRecommend]  = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [evidence,   setEvidence]   = useState('');
  const [notes,      setNotes]      = useState('');
  const [saved,      setSaved]      = useState(false);
  const [editingId,  setEditingId]  = useState<string|null>(null);

  const coordDepts = getUserDeptIds(currentUser);
  const availableTeachers = useMemo(() => {
    if (currentUser.role === 'coordinator' && coordDepts.length > 0)
      return teachers.filter(t => coordDepts.includes(t.departmentId));
    return teachers;
  }, [teachers, currentUser.role, coordDepts]);

  const selectedTeacher = teachers.find(t => t.id === teacherId);

  // Check existing evaluation
  const existingEval = useMemo(() => {
    if (!teacherId) return null;
    return db.getEvaluations().find(e => e.teacherId === teacherId && e.month === month && e.academicYear === year) || null;
  }, [teacherId, month, year]);

  function loadExisting() {
    if (!existingEval) return;
    setCriteria(existingEval.criteria);
    setStrengths(existingEval.strengths);
    setImprove(existingEval.improvementAreas);
    setRecommend(existingEval.recommendations);
    setActionPlan(existingEval.actionPlan);
    setEvidence(existingEval.evidenceLinks.join('\n'));
    setNotes(existingEval.generalNotes);
    setEvalDate(existingEval.evaluationDate);
    setEditingId(existingEval.id);
  }

  const totalScore = useMemo(() =>
    Math.round(criteria.reduce((s, c) => s + c.score, 0) * 100) / 100, [criteria]);
  const avgScore   = Math.round(totalScore / 10 * 100) / 100;
  const perf       = getPerformanceLevel(totalScore);

  function setScore(idx: number, val: string) {
    const raw = parseFloat(val);
    const v = isNaN(raw) ? 1 : Math.min(10, Math.max(1, Math.round(raw * 4) / 4));
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, score: v } : x));
  }

  function setNote(idx: number, val: string) {
    setCriteria(c => c.map((x, i) => i === idx ? { ...x, note: val } : x));
  }

  function saveEval() {
    if (!teacherId) { alert('يرجى اختيار المعلم'); return; }
    const evals = db.getEvaluations();
    const evObj = {
      id: editingId || generateId(),
      teacherId, evaluatorId: currentUser.id,
      month, academicYear: year, evaluationDate: evalDate,
      criteria, totalScore, averageScore: avgScore, percentage: totalScore,
      performanceLevel: perf.label,
      strengths, improvementAreas: improve, recommendations: recommend,
      actionPlan, evidenceLinks: evidence.split('\n').filter(Boolean),
      generalNotes: notes,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    if (editingId) {
      const idx = evals.findIndex(e => e.id === editingId);
      if (idx !== -1) evals[idx] = evObj;
    } else {
      evals.push(evObj);
    }
    db.saveEvaluations(evals);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setEditingId(evObj.id);
  }

  function resetForm() {
    setTeacherId(''); setMonth(MONTHS[0]); setYear(currentYear);
    setCriteria(EMPTY_CRITERIA()); setStrengths(''); setImprove('');
    setRecommend(''); setActionPlan(''); setEvidence(''); setNotes('');
    setEditingId(null);
  }

  function printReport() { window.print(); }

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0', marginBottom:'1rem' };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl', maxWidth:'900px', margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0F2044', margin:0 }}>📝 التقييم الشهري</h2>
        <button onClick={resetForm} className="btn btn-ghost" style={{ fontSize:'0.8rem' }}>+ تقييم جديد</button>
      </div>

      {/* Basic info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>البيانات الأساسية</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.75rem' }}>
          <div>
            <label className="form-label">اسم المعلم *</label>
            <select className="form-input" value={teacherId} onChange={e => { setTeacherId(e.target.value); setEditingId(null); }}>
              <option value="">اختر المعلم</option>
              {availableTeachers.map(t => <option key={t.id} value={t.id}>{t.nameAr}</option>)}
            </select>
          </div>
          {selectedTeacher && <>
            <div>
              <label className="form-label">الرقم الوظيفي</label>
              <input className="form-input" value={selectedTeacher.employeeId} readOnly style={{ background:'#F8FAFC' }} />
            </div>
            <div>
              <label className="form-label">القسم</label>
              <input className="form-input" value={getDeptName(selectedTeacher.departmentId, departments)} readOnly style={{ background:'#F8FAFC' }} />
            </div>
            <div>
              <label className="form-label">المادة</label>
              <input className="form-input" value={selectedTeacher.subject} readOnly style={{ background:'#F8FAFC' }} />
            </div>
          </>}
          <div>
            <label className="form-label">الشهر *</label>
            <select className="form-input" value={month} onChange={e => { setMonth(e.target.value); setEditingId(null); }}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">العام الأكاديمي *</label>
            <select className="form-input" value={year} onChange={e => { setYear(e.target.value); setEditingId(null); }}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">اسم المقيم</label>
            <input className="form-input" value={currentUser.name} readOnly style={{ background:'#F8FAFC' }} />
          </div>
          <div>
            <label className="form-label">تاريخ التقييم</label>
            <input type="date" className="form-input" value={evalDate} onChange={e => setEvalDate(e.target.value)} />
          </div>
        </div>

        {/* Duplicate warning */}
        {existingEval && !editingId && (
          <div style={{ marginTop:'0.75rem', background:'#FEF3C7', border:'1px solid #F59E0B', borderRadius:'8px', padding:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.8rem', color:'#92400E' }}>⚠️ يوجد تقييم لهذا المعلم في هذا الشهر بدرجة {existingEval.totalScore}/100</span>
            <button onClick={loadExisting} className="btn btn-ghost" style={{ fontSize:'0.75rem' }}>تحميل وتعديل</button>
          </div>
        )}
      </div>

      {/* Criteria */}
      <div style={cardStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', margin:0 }}>بنود التقييم (كل بند من 1 إلى 10)</h3>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:'0.7rem', color:'#64748B' }}>المجموع</span>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color: totalScore >= 90 ? '#065F46' : totalScore >= 70 ? '#0096C7' : '#991B1B' }}>{totalScore}/100</div>
            </div>
            <span style={{ background:perf.bg, color:perf.color, padding:'0.3rem 0.75rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700 }}>{perf.label}</span>
          </div>
        </div>
        {EVALUATION_CRITERIA.map((label, i) => (
          <div key={i} style={{ marginBottom:'0.75rem', padding:'0.75rem', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
              <label style={{ fontSize:'0.8rem', color:'#374151', fontWeight:600, flex:1 }}>
                {i+1}. {label}
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <input type="number" min={1} max={10} step={0.25}
                  value={criteria[i].score}
                  onChange={e => setScore(i, e.target.value)}
                  style={{ width:'70px', textAlign:'center', padding:'0.3rem', border:'2px solid #0096C7', borderRadius:'8px', fontSize:'0.9rem', fontWeight:700 }} />
                <span style={{ fontSize:'0.72rem', color:'#64748B' }}>/10</span>
              </div>
            </div>
            <input className="form-input" placeholder="ملاحظة اختيارية..." value={criteria[i].note}
              onChange={e => setNote(i, e.target.value)}
              style={{ marginTop:'0.4rem', fontSize:'0.75rem', padding:'0.3rem 0.6rem' }} />
          </div>
        ))}
      </div>

      {/* Additional fields */}
      <div style={cardStyle}>
        <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>تفاصيل إضافية</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          {[
            ['نقاط القوة', strengths, setStrengths],
            ['جوانب التحسين', improve, setImprove],
            ['توصيات المقيم', recommend, setRecommend],
            ['خطة تحسين للشهر القادم', actionPlan, setActionPlan],
          ].map(([label, val, setter]) => (
            <div key={label as string}>
              <label className="form-label">{label as string}</label>
              <textarea className="form-input" rows={3} value={val as string}
                onChange={e => (setter as (v:string)=>void)(e.target.value)}
                style={{ resize:'vertical' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop:'0.75rem' }}>
          <label className="form-label">روابط الأدلة والشواهد (رابط في كل سطر)</label>
          <textarea className="form-input" rows={2} value={evidence} onChange={e => setEvidence(e.target.value)} style={{ resize:'vertical' }} />
        </div>
        <div style={{ marginTop:'0.75rem' }}>
          <label className="form-label">ملاحظات عامة</label>
          <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize:'vertical' }} />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        <button onClick={saveEval} className="btn btn-primary">
          {editingId ? '🔄 تحديث التقييم' : '💾 حفظ التقييم'}
        </button>
        <button onClick={printReport} className="btn btn-ghost">🖨️ طباعة التقرير</button>
      </div>

      {saved && (
        <div style={{ marginTop:'0.75rem', background:'#D1FAE5', border:'1px solid #6EE7B7', borderRadius:'8px', padding:'0.75rem', color:'#065F46', fontSize:'0.85rem', fontWeight:600 }}>
          ✅ تم حفظ التقييم بنجاح!
        </div>
      )}
    </div>
  );
}
