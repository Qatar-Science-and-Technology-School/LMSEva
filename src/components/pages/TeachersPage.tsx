'use client';
import { useState, useMemo, useEffect } from 'react';
import { db, getDeptName, SUBJECT_TO_DEPT, getUserDeptIds } from '@/lib/data';
import type { User, Teacher, Department, Evaluation } from '@/lib/data';
import * as XLSX from 'xlsx';

interface Props { currentUser: User; onViewTeacher: (id: string) => void; selectedYear?: string; }

const blankTeacher = (): Omit<Teacher,'id'|'createdAt'> => ({
  employeeId:'', nameAr:'', nameEn:'', departmentId:'', subject:'',
  email:'', jobCategory:'معلم', status:'active'
});

export default function TeachersPage({ currentUser, onViewTeacher, selectedYear }: Props) {
  const isAdmin = currentUser.role === 'admin';
  const isCoord = currentUser.role === 'coordinator';

  const [search,    setSearch]    = useState('');
  const [deptF,     setDeptF]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string|null>(null);
  const [form,      setForm]      = useState(blankTeacher());
  const [toast,     setToast]     = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const reload = () => {
    Promise.all([db.getTeachers(), db.getDepartments(), db.getEvaluations()])
      .then(([t, d, e]) => { setTeachers(t); setDepartments(d); setEvaluations(e); setLoading(false); });
  };
  useEffect(() => { reload(); }, []);

  const coordDepts = getUserDeptIds(currentUser);

  // coordinators only see their dept teachers
  const visibleTeachers = useMemo(() => {
    let list = teachers;
    if (isCoord && coordDepts.length > 0)
      list = list.filter(t => coordDepts.includes(t.departmentId));
    if (deptF) list = list.filter(t => t.departmentId === deptF);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.nameAr.includes(search) || t.nameEn.toLowerCase().includes(q) ||
        t.employeeId.includes(q) || t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const dA = getDeptName(a.departmentId, departments);
      const dB = getDeptName(b.departmentId, departments);
      return dA.localeCompare(dB, 'ar') || a.nameAr.localeCompare(b.nameAr, 'ar');
    });
  }, [teachers, search, deptF, isCoord, coordDepts, departments]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>⏳ جاري تحميل البيانات...</div>;

  // Dept dropdown: coordinators see only their assigned depts
  const availableDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  function openAdd() { setForm(blankTeacher()); setEditId(null); setShowModal(true); }
  function openEdit(t: Teacher) { setForm({ employeeId:t.employeeId, nameAr:t.nameAr, nameEn:t.nameEn, departmentId:t.departmentId, subject:t.subject, email:t.email, jobCategory:t.jobCategory, status:t.status }); setEditId(t.id); setShowModal(true); }

  async function saveTeacher() {
    try {
      const list = await db.getTeachers();
      let updated: Teacher[];
      if (editId) {
        updated = list.map(t => t.id === editId ? { ...t, ...form } : t);
      } else {
        const newTeacher: Teacher = {
          id: `t${Date.now()}`,
          ...form,
          createdAt: new Date().toISOString().split('T')[0]
        };
        updated = [newTeacher, ...list];
      }
      setTeachers(updated);
      setShowModal(false);
      await db.saveTeachers(updated);
      showToast(editId ? `تم تحديث بيانات المعلم "${form.nameAr}" بنجاح` : `تمت إضافة المعلم "${form.nameAr}" بنجاح`);
    } catch (err) {
      console.error('Error saving teacher:', err);
      alert('حدث خطأ أثناء حفظ بيانات المعلم');
    } finally {
      reload();
    }
  }

  async function deleteTeacher(id: string) {
    const target = teachers.find(t => t.id === id);
    const name = target ? target.nameAr : 'المعلم';
    if (!confirm(`هل أنت متأكد من حذف المعلم "${name}" نهائياً من النظام؟`)) return;

    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated); // Optimistic immediate update

    try {
      await db.deleteTeacher(id);
      await db.saveTeachers(updated);
      showToast(`تم حذف المعلم "${name}" بنجاح`);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('حدث خطأ أثناء حذف المعلم');
    } finally {
      reload();
    }
  }

  async function toggleStatus(t: Teacher) {
    if (!isAdmin) return;
    const newStatus: 'active' | 'inactive' = t.status === 'active' ? 'inactive' : 'active';
    const statusLabel = newStatus === 'active' ? 'نشط' : 'غير نشط';

    const updated = teachers.map(item => item.id === t.id ? { ...item, status: newStatus } : item);
    setTeachers(updated); // Optimistic immediate update

    try {
      await db.saveTeachers(updated);
      showToast(`تم تغيير حالة المعلم "${t.nameAr}" إلى (${statusLabel}) بنجاح`);
    } catch (err) {
      console.error('Error toggling teacher status:', err);
      alert('حدث خطأ أثناء تغيير حالة المعلم');
    } finally {
      reload();
    }
  }

  function exportExcel() {
    const rows = visibleTeachers.map(t => ({
      'الرقم الوظيفي': t.employeeId,
      'الاسم بالعربي': t.nameAr,
      'الاسم بالإنجليزي': t.nameEn,
      'القسم': getDeptName(t.departmentId, departments),
      'المادة': t.subject,
      'البريد الإلكتروني': t.email,
      'الفئة الوظيفية': t.jobCategory,
      'الحالة': t.status === 'active' ? 'نشط' : 'غير نشط',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعلمون');
    XLSX.writeFile(wb, 'teachers.xlsx');
  }

  function getLastScore(teacherId: string) {
    const evs = evaluations.filter(e => e.teacherId === teacherId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    return evs.length ? evs[0].totalScore : null;
  }

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0' };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <input className="form-input" placeholder="🔍 بحث بالاسم، رقم، بريد، مادة..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:'200px' }} />
        <select className="form-input" style={{ width:'auto', minWidth:'150px' }}
          value={deptF} onChange={e => setDeptF(e.target.value)} disabled={isCoord && coordDepts.length === 1}>
          <option value="">كل الأقسام</option>
          {availableDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
        </select>
        <button onClick={exportExcel} className="btn btn-ghost">📥 تصدير Excel</button>
        {(isAdmin) && <button onClick={openAdd} className="btn btn-primary">+ إضافة معلم</button>}
      </div>

      {/* Summary */}
      <p style={{ fontSize:'0.78rem', color:'#64748B', marginBottom:'1rem' }}>
        عرض <strong>{visibleTeachers.length}</strong> معلم من إجمالي {teachers.length}
      </p>

      {/* Table */}
      <div style={{ ...cardStyle, padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
            <thead>
              <tr style={{ background:'#0F2044', color:'#fff' }}>
                {['الرقم الوظيفي','اسم المعلم','القسم','المادة','البريد الإلكتروني','الحالة','آخر درجة','الإجراءات'].map(h => (
                  <th key={h} style={{ padding:'0.7rem 0.75rem', textAlign:'right', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleTeachers.map((t, i) => {
                const lastScore = getLastScore(t.id);
                const perf = lastScore !== null ? getPerformanceLevel(lastScore) : null;
                return (
                  <tr key={t.id} style={{ background: i%2===0?'#fff':'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    <td style={{ padding:'0.6rem 0.75rem', fontFamily:'monospace', fontSize:'0.72rem', color:'#64748B' }}>{t.employeeId}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontWeight:700, color:'#0F2044' }}>{t.nameAr}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#374151' }}>{getDeptName(t.departmentId, departments)}</td>
                    <td style={{ padding:'0.6rem 0.75rem', color:'#64748B' }}>{t.subject}</td>
                    <td style={{ padding:'0.6rem 0.75rem', fontSize:'0.72rem', color:'#64748B' }}>{t.email}</td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleStatus(t)}
                        title={isAdmin ? `انقر لتبديل الحالة فورياً إلى (${t.status === 'active' ? 'غير نشط' : 'نشط'})` : undefined}
                        disabled={!isAdmin}
                        style={{
                          background: t.status==='active'?'#D1FAE5':'#FEE2E2',
                          color: t.status==='active'?'#065F46':'#991B1B',
                          border: t.status==='active'?'1px solid #A7F3D0':'1px solid #FECACA',
                          padding:'0.25rem 0.65rem',
                          borderRadius:'999px',
                          fontSize:'0.68rem',
                          fontWeight:800,
                          cursor: isAdmin ? 'pointer' : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: t.status === 'active' ? '#059669' : '#DC2626'
                        }} />
                        {t.status==='active'?'نشط':'غير نشط'}
                        {isAdmin && <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>⇄</span>}
                      </button>
                    </td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      {perf && <span style={{ background:perf.bg, color:perf.color, padding:'0.2rem 0.5rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 }}>{lastScore}/100</span>}
                    </td>
                    <td style={{ padding:'0.6rem 0.75rem' }}>
                      <div style={{ display:'flex', gap:'0.35rem' }}>
                        <button onClick={() => onViewTeacher(t.id)} className="btn btn-ghost" style={{ padding:'0.25rem 0.5rem', fontSize:'0.7rem' }}>ملف</button>
                        {isAdmin && <>
                          <button onClick={() => openEdit(t)} className="btn btn-ghost" style={{ padding:'0.25rem 0.5rem', fontSize:'0.7rem' }}>تعديل</button>
                          <button onClick={() => deleteTeacher(t.id)} style={{ padding:'0.25rem 0.5rem', fontSize:'0.7rem', background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:'6px', cursor:'pointer' }}>حذف</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'1.5rem', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', direction:'rtl' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:800, color:'#0F2044', marginBottom:'1.25rem' }}>
              {editId ? 'تعديل معلم' : 'إضافة معلم جديد'}
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {[
                ['الرقم الوظيفي','employeeId','text'],
                ['الاسم بالعربي','nameAr','text'],
                ['الاسم بالإنجليزي','nameEn','text'],
                ['البريد الإلكتروني','email','email'],
                ['الفئة الوظيفية','jobCategory','text'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input type={type} className="form-input"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="form-label">القسم</label>
                <select className="form-input" value={form.departmentId}
                  onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                  <option value="">اختر القسم</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">المادة</label>
                <select className="form-input" value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value, departmentId: SUBJECT_TO_DEPT[e.target.value] || f.departmentId }))}>
                  <option value="">اختر المادة</option>
                  {Object.keys(SUBJECT_TO_DEPT).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">الحالة</label>
                <select className="form-input" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active'|'inactive' }))}>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">إلغاء</button>
              <button onClick={saveTeacher} className="btn btn-primary">💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          zIndex: 9999,
          background: '#0F2044',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(15,32,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.86rem',
          fontWeight: 800,
          border: '1px solid #00B4D8'
        }}>
          <span style={{ fontSize: '1.1rem' }}>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

function getPerformanceLevel(score: number) {
  if (score >= 90) return { label:'متميز', color:'#065F46', bg:'#D1FAE5' };
  if (score >= 80) return { label:'متقدم جدًا', color:'#1E40AF', bg:'#DBEAFE' };
  if (score >= 70) return { label:'جيد جدًا', color:'#0E7490', bg:'#CFFAFE' };
  if (score >= 60) return { label:'جيد', color:'#92400E', bg:'#FEF3C7' };
  return { label:'يحتاج متابعة', color:'#991B1B', bg:'#FEE2E2' };
}
