'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { db, SCHOOL_NAME, initialTeachers, initialDepartments, getDeptName } from '@/lib/data';
import type { User, Teacher, Department } from '@/lib/data';

interface Props { onLogin: (user: User) => void; }

const QUICK_LOGINS = [
  { label: '👤 مدير النظام',           email: 'a.tubaishat1704@education.qa' },
  { label: '🏫 النائب الأكاديمي',      email: 'r.altoum1512@education.qa'    },
  { label: '👁️ أخصائي التعليم الإلكتروني', email: 'h.metawea@edu.gov.qa'       },
  { label: '📐 يامن فرح - رياضيات',   email: 'y.farah2507@education.qa'     },
  { label: '📖 أسعد ناعس - عربي',     email: 'n.asaad0108@education.qa'     },
  { label: '☪️ ماهر علوان - إسلامية', email: 'm.elwan2704@education.qa'     },
  { label: '💻 روي مخول - حاسوب',    email: 'r.makhoul0812@education.qa'   },
  { label: '🔬 المختبرات التخصصية',   email: 'm.salameh1301@education.qa'   },
  { label: '🤖 أحمد فارس - STEM',    email: 'a.faris1404@education.qa'     },
  { label: '🇬🇧 يوسف دحمان - إنجليزي', email: 'y.dahman0209@education.qa'    },
];

export default function LoginPage({ onLogin }: Props) {
  const [loginMode, setLoginMode] = useState<'staff' | 'teacher'>('staff');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const passwordInputRef        = useRef<HTMLInputElement>(null);

  // Teacher portal states
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherIdentifier, setTeacherIdentifier] = useState<string>('');
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const teacherPassRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([db.getTeachers(), db.getDepartments()])
      .then(([tList, dList]) => {
        if (tList && tList.length > 0) setTeachers(tList);
        if (dList && dList.length > 0) setDepartments(dList);
      })
      .catch(() => {});
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter(t => t.status === 'active')
      .filter(t => selectedDeptFilter === 'all' || t.departmentId === selectedDeptFilter)
      .filter(t => {
        if (!teacherSearch.trim()) return true;
        const q = teacherSearch.trim().toLowerCase();
        return (
          t.nameAr.toLowerCase().includes(q) ||
          (t.nameEn && t.nameEn.toLowerCase().includes(q)) ||
          (t.email && t.email.toLowerCase().includes(q)) ||
          (t.employeeId && t.employeeId.includes(q)) ||
          (t.subject && t.subject.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  }, [teachers, selectedDeptFilter, teacherSearch]);

  const selectedTeacherObj = useMemo(
    () => teachers.find(t => t.id === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await db.login(email.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالسيرفر');
    }
    setLoading(false);
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const identifierToUse = selectedTeacherId || teacherIdentifier.trim();
      if (!identifierToUse) {
        setError('يرجى اختيار اسم المعلم من القائمة أو إدخال البريد الإلكتروني / الرقم الوظيفي');
        setLoading(false);
        return;
      }
      const user = await db.loginTeacher(identifierToUse, teacherPassword.trim());
      if (user) {
        onLogin(user);
      } else {
        setError('بيانات دخول المعلم غير صحيحة. تأكد من إدخال الرقم الوظيفي أو اسم المستخدم للبريد الرسمي أو كلمة المرور المعتمدة.');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل دخول المعلم');
    }
    setLoading(false);
  };

  const quickFill = (selectedEmail: string) => {
    setLoginMode('staff');
    setEmail(selectedEmail);
    setPassword('');
    setError('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleSelectTeacherFromList = (t: Teacher) => {
    setSelectedTeacherId(t.id);
    setTeacherIdentifier(t.email || t.employeeId || t.nameAr);
    setError('');
    setTimeout(() => {
      teacherPassRef.current?.focus();
    }, 50);
  };

  return (
    <div className="login-page" style={{ flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 1rem' }}>
      {/* bg blobs */}
      <div style={{ position:'absolute', top:'10%', left:'10%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* School Logo */}
      <div className="fade-in" style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'center' }}>
        <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:'20px', padding:'12px 26px', boxShadow:'0 8px 32px rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src="/school-logo.png" alt={SCHOOL_NAME}
            style={{ height:'92px', width:'auto', maxWidth:'460px', objectFit:'contain' }} />
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card fade-in" style={{ maxWidth: loginMode === 'teacher' ? '560px' : '440px', width: '100%', transition: 'max-width 0.25s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'1.1rem' }}>
          <h1 style={{ fontSize:'1.12rem', fontWeight:800, color:'#0F2044', margin:'0 0 0.25rem', lineHeight:1.3 }}>
            التعليم الالكتروني والحلول الرقمية
          </h1>
          <p style={{ fontSize:'0.72rem', color:'#64748B', margin:0, lineHeight:1.5 }}>
            {SCHOOL_NAME}
          </p>
        </div>

        {/* Role Mode Switcher: الإدارة والمنسقون vs المعلم */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: '#F1F5F9',
          padding: '0.35rem',
          borderRadius: '14px',
          marginBottom: '1.25rem',
          border: '1px solid #E2E8F0'
        }}>
          <button
            type="button"
            onClick={() => { setLoginMode('staff'); setError(''); }}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: loginMode === 'staff' ? 'linear-gradient(135deg, #0F2044 0%, #1a3a6b 100%)' : 'transparent',
              color: loginMode === 'staff' ? '#ffffff' : '#475569',
              boxShadow: loginMode === 'staff' ? '0 4px 12px rgba(15,32,68,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>🏛️</span>
            <span>الإدارة والمنسقون</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('teacher'); setError(''); }}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: loginMode === 'teacher' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
              color: loginMode === 'teacher' ? '#ffffff' : '#0369A1',
              boxShadow: loginMode === 'teacher' ? '0 4px 12px rgba(2,132,199,0.28)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>👨‍🏫</span>
            <span>المعلم (بوابة المعلم)</span>
          </button>
        </div>

        {loginMode === 'staff' ? (
          <>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:'1rem' }}>
                <label className="form-label">البريد الإلكتروني أو اسم المستخدم</label>
                <input type="text" className="form-input" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="example@education.qa" required />
              </div>
              <div style={{ marginBottom:'1.25rem' }}>
                <label className="form-label">كلمة المرور</label>
                <input 
                  ref={passwordInputRef}
                  type="password" 
                  className="form-input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom:'1rem' }}>⚠️ {error}</div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width:'100%', justifyContent:'center', padding:'0.75rem' }}>
                {loading ? '⏳ جاري تسجيل الدخول...' : '🔐 تسجيل الدخول'}
              </button>
            </form>

            {/* Quick login */}
            <div style={{ marginTop:'1.5rem', borderTop:'1px solid #E2E8F0', paddingTop:'1.15rem' }}>
              <p style={{ fontSize:'0.72rem', color:'#94A3B8', textAlign:'center', marginBottom:'0.65rem', fontWeight:600 }}>
                دخول سريع (اختر الحساب ثم أدخل كلمة المرور الخاصة بك)
              </p>

              {/* Prominent Teacher Portal Quick Button */}
              <button
                type="button"
                onClick={() => { setLoginMode('teacher'); setError(''); }}
                style={{
                  width: '100%',
                  marginBottom: '0.65rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #0284C7',
                  background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                  color: '#0369A1',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>👨‍🏫</span>
                <span>الدخول كـ ( المعلم ) — الاطلاع على الحصص والتقييمات وإضافة روابط Teams</span>
              </button>

              <div style={{ display:'flex', gap:'0.45rem', flexWrap:'wrap' }}>
                {QUICK_LOGINS.map(q => (
                  <button key={q.email} type="button" onClick={() => quickFill(q.email)}
                    className="btn btn-ghost"
                    style={{ flex:1, fontSize:'0.69rem', justifyContent:'center', minWidth:'105px' }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ──── TEACHER PORTAL LOGIN ──── */
          <form onSubmit={handleTeacherLogin}>
            <div style={{
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
              border: '1px solid #BAE6FD',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              color: '#0369A1',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 900, fontSize: '0.82rem', marginBottom: '0.2rem', color: '#0F2044' }}>
                👨‍🏫 بوابة المعلم الذاتية — مدرسة قطر للعلوم والتكنولوجيا
              </div>
              اختر اسمك من القائمة أو أدخل بريدك الرسمي لمتابعة <strong>تقييماتك وحصصك الخاصة فقط</strong>، وطباعة تقاريرك، وإبداء الرأي والملاحظات، وإضافة روابط حصص <strong>Distance Learning (Teams)</strong>.
            </div>

            {/* Filter by Department & Search Teacher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>تصفية حسب القسم</label>
                <select
                  className="form-input"
                  value={selectedDeptFilter}
                  onChange={e => { setSelectedDeptFilter(e.target.value); setSelectedTeacherId(''); }}
                  style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <option value="all">جميع الأقسام الأكاديمية ({teachers.length})</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>بحث سريع عن اسم المعلم أو البريد</label>
                <input
                  type="text"
                  className="form-input"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو المادة أو البريد..."
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}
                />
              </div>
            </div>

            {/* Select Teacher Dropdown */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>اختر اسم المعلم ({filteredTeachers.length} معلم)</label>
              <select
                className="form-input"
                value={selectedTeacherId}
                onChange={e => {
                  const tid = e.target.value;
                  setSelectedTeacherId(tid);
                  const found = teachers.find(t => t.id === tid);
                  if (found) {
                    handleSelectTeacherFromList(found);
                  }
                }}
                style={{ fontWeight: 700, color: '#0F2044', fontSize: '0.82rem' }}
              >
                <option value="">-- اختر اسم المعلم للدخول إلى صفحته الخاصة --</option>
                {filteredTeachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} — ({getDeptName(t.departmentId, departments)} / {t.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Or direct Email / Employee ID input */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>البريد الإلكتروني الرسمي أو الرقم الوظيفي</label>
              <input
                type="text"
                className="form-input"
                value={teacherIdentifier}
                onChange={e => {
                  setTeacherIdentifier(e.target.value);
                  const clean = e.target.value.trim().toLowerCase();
                  const match = teachers.find(
                    t =>
                      t.email.toLowerCase() === clean ||
                      t.email.split('@')[0].toLowerCase() === clean ||
                      t.employeeId === clean
                  );
                  if (match) setSelectedTeacherId(match.id);
                }}
                placeholder="example@education.qa أو الرقم الوظيفي"
                style={{ direction: 'ltr', textAlign: 'right', fontSize: '0.82rem' }}
              />
            </div>

            {selectedTeacherObj && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '0.6rem 0.85rem',
                marginBottom: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F2044' }}>
                    👨‍🏫 {selectedTeacherObj.nameAr}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    {getDeptName(selectedTeacherObj.departmentId, departments)} · {selectedTeacherObj.subject} · {selectedTeacherObj.email}
                  </div>
                </div>
                <span style={{
                  background: '#DBEAFE',
                  color: '#1E40AF',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  الرقم الوظيفي: {selectedTeacherObj.employeeId}
                </span>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                كلمة المرور (الرقم الوظيفي للمعلم أو اسم المستخدم للبريد الرسمي)
              </label>
              <input
                ref={teacherPassRef}
                type="password"
                className="form-input"
                value={teacherPassword}
                onChange={e => setTeacherPassword(e.target.value)}
                placeholder="أدخل الرقم الوظيفي أو كلمة المرور..."
                required
              />
              <p style={{ fontSize: '0.68rem', color: '#64748B', margin: '0.3rem 0 0' }}>
                💡 يمكنك الدخول باستخدام <strong>الرقم الوظيفي</strong> الخاص بك أو اسم المستخدم لبريدك الوزاري.
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom:'1rem', fontSize: '0.78rem' }}>⚠️ {error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #0284C7 0%, #0F2044 100%)',
                fontWeight: 800,
                fontSize: '0.88rem'
              }}
            >
              {loading ? '⏳ جاري الدخول إلى صفحة المعلم...' : '👨‍🏫 دخول إلى صفحة المعلم الخاصة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
