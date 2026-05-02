'use client';
import { useState, useMemo } from 'react';
import { db, MONTHS, ACADEMIC_YEARS, EVALUATION_CRITERIA, SCHOOL_NAME, DESIGNER_CREDIT, generateId, getDeptName } from '@/lib/data';
import type { User, Department } from '@/lib/data';

interface Props { currentUser: User; }

export default function SettingsPage({ currentUser }: Props) {
  const [tab, setTab] = useState<'general'|'users'|'depts'|'data'>('general');

  const [users, setUsers] = useState<User[]>(db.getUsers());
  const departments = db.getDepartments();

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const defaultUserForm: Partial<User> = {
    name: '', nameEn: '', email: '', username: '', password: '', role: 'coordinator', status: 'active', employeeId: '', departmentIds: []
  };
  const [userForm, setUserForm] = useState<Partial<User>>(defaultUserForm);

  function openUserModal(user?: User) {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({ ...user });
    } else {
      setEditingUserId(null);
      setUserForm({ ...defaultUserForm });
    }
    setShowUserModal(true);
  }

  function saveUser() {
    if (!userForm.name || !userForm.password || !userForm.role) {
      alert('الاسم، كلمة المرور والصلاحية حقول مطلوبة.');
      return;
    }
    
    let newList = [...users];
    if (editingUserId) {
      newList = newList.map(u => u.id === editingUserId ? { ...u, ...userForm } as User : u);
    } else {
      newList.push({ ...userForm, id: generateId() } as User);
    }
    
    db.saveUsers(newList);
    setUsers(newList);
    setShowUserModal(false);
  }

  function toggleUserStatus(userId: string) {
    const newList = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'inactive' : 'active' } as User;
      }
      return u;
    });
    db.saveUsers(newList);
    setUsers(newList);
  }

  function resetAllData() {
    if (!confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات المحلية وإعادة تحميل النظام.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('qstss')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }

  const cardStyle = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #E2E8F0', marginBottom:'1rem' };
  const tabs = [
    { id:'general', label:'عام' },
    { id:'users',   label:'المستخدمون' },
    { id:'depts',   label:'الأقسام' },
    { id:'data',    label:'البيانات' },
  ];

  const roleLabel: Record<string, string> = {
    admin:'مدير النظام', evaluator:'منسق إلكتروني',
    leader:'قيادة المدرسة', coordinator:'منسق قسم'
  };

  const statusLabel: Record<string, string> = {
    active: 'نشط', inactive: 'غير نشط', pending: 'بانتظار تحديث البيانات'
  };

  return (
    <div style={{ padding:'1.5rem', direction:'rtl', maxWidth:'1000px', margin:'0 auto' }}>
      <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0F2044', marginBottom:'1.25rem' }}>⚙️ الإعدادات</h2>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', borderBottom:'2px solid #E2E8F0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            style={{ padding:'0.5rem 1rem', background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t.id?'2px solid #0F2044':'2px solid transparent',
              color: tab===t.id?'#0F2044':'#64748B', fontWeight: tab===t.id?700:400, fontSize:'0.85rem', marginBottom:'-2px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <>
          <div style={cardStyle}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>معلومات المدرسة</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label className="form-label">اسم المدرسة</label>
                <input className="form-input" value={SCHOOL_NAME} readOnly style={{ background:'#F8FAFC' }} />
              </div>
              <div>
                <label className="form-label">تصميم وتطوير</label>
                <input className="form-input" value={DESIGNER_CREDIT} readOnly style={{ background:'#F8FAFC' }} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>الأعوام الأكاديمية</h3>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {ACADEMIC_YEARS.map(y => (
                <span key={y} style={{ background:'#DBEAFE', color:'#1E40AF', padding:'0.3rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:700 }}>{y}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div style={cardStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', margin:0 }}>إدارة المستخدمين ({users.length})</h3>
            <button onClick={() => openUserModal()} className="btn btn-primary" style={{ fontSize:'0.8rem' }}>+ مستخدم جديد</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['الاسم','الرقم الوظيفي','البريد الإلكتروني','اسم المستخدم','الصلاحية','الحالة','إجراءات'].map(h => (
                    <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'right', color:'#64748B', borderBottom:'2px solid #E2E8F0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ background:i%2===0?'#fff':'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    <td style={{ padding:'0.5rem 0.75rem', fontWeight:600 }}>{u.name}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#64748B' }}>{u.employeeId || '-'}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#64748B', fontSize:'0.72rem' }}>{u.email || '-'}</td>
                    <td style={{ padding:'0.5rem 0.75rem', color:'#64748B' }}>{u.username || '-'}</td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <span style={{ background:'#DBEAFE', color:'#1E40AF', padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 }}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <span style={{ 
                        background:u.status==='active'?'#D1FAE5':u.status==='pending'?'#FEF9C3':'#FEE2E2', 
                        color:u.status==='active'?'#065F46':u.status==='pending'?'#92400E':'#991B1B', 
                        padding:'0.15rem 0.5rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 
                      }}>
                        {statusLabel[u.status] || u.status}
                      </span>
                    </td>
                    <td style={{ padding:'0.5rem 0.75rem' }}>
                      <button onClick={() => openUserModal(u)} className="btn btn-ghost" style={{ fontSize:'0.7rem', padding:'0.2rem 0.5rem', marginLeft:'0.25rem' }}>تعديل</button>
                      <button onClick={() => toggleUserStatus(u.id)} className="btn btn-ghost" style={{ fontSize:'0.7rem', padding:'0.2rem 0.5rem' }}>
                        {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0F2044', marginBottom:'1rem' }}>
              {editingUserId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
            </h3>
            
            {!userForm.email && userForm.role === 'coordinator' && (
              <div className="alert alert-warning" style={{ marginBottom:'1rem', fontSize:'0.8rem' }}>
                ⚠️ يجب تحديث البريد الإلكتروني الرسمي قبل تفعيل الدخول بالبريد الإلكتروني.
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div>
                <label className="form-label">الاسم بالعربية</label>
                <input className="form-input" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">الاسم بالإنجليزية</label>
                <input className="form-input" value={userForm.nameEn || ''} onChange={e => setUserForm({...userForm, nameEn: e.target.value})} dir="ltr" />
              </div>
              <div>
                <label className="form-label">الرقم الوظيفي</label>
                <input className="form-input" value={userForm.employeeId || ''} onChange={e => setUserForm({...userForm, employeeId: e.target.value})} dir="ltr" />
              </div>
              <div>
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-input" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} dir="ltr" />
              </div>
              <div>
                <label className="form-label">اسم المستخدم</label>
                <input className="form-input" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} dir="ltr" />
              </div>
              <div>
                <label className="form-label">كلمة المرور</label>
                <input className="form-input" type="text" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} dir="ltr" />
              </div>
              <div>
                <label className="form-label">الدور</label>
                <select className="form-input" value={userForm.role || 'evaluator'} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                  <option value="admin">مدير النظام</option>
                  <option value="leader">قيادة المدرسة</option>
                  <option value="evaluator">منسق إلكتروني</option>
                  <option value="coordinator">منسق قسم</option>
                </select>
              </div>
              <div>
                <label className="form-label">الحالة</label>
                <select className="form-input" value={userForm.status || 'active'} onChange={e => setUserForm({...userForm, status: e.target.value as any})}>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="pending">بانتظار تحديث البيانات</option>
                </select>
              </div>
            </div>

            {userForm.role === 'coordinator' && (
              <div style={{ marginBottom:'1.5rem' }}>
                <label className="form-label">الأقسام المخصصة (يمكن اختيار أكثر من قسم)</label>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', padding:'1rem', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0' }}>
                  {departments.map(d => {
                    const isSelected = userForm.departmentIds?.includes(d.id);
                    return (
                      <label key={d.id} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', background:isSelected?'#DBEAFE':'#fff', padding:'0.4rem 0.75rem', borderRadius:'8px', border:isSelected?'1px solid #2563EB':'1px solid #CBD5E1', cursor:'pointer' }}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => {
                          const ids = userForm.departmentIds || [];
                          if (e.target.checked) setUserForm({...userForm, departmentIds: [...ids, d.id]});
                          else setUserForm({...userForm, departmentIds: ids.filter(id => id !== d.id)});
                        }} style={{ margin:0 }} />
                        {d.nameAr}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button onClick={() => setShowUserModal(false)} className="btn btn-ghost">إلغاء</button>
              <button onClick={saveUser} className="btn btn-primary">حفظ التغييرات</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'depts' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#0F2044', marginBottom:'1rem' }}>الأقسام ({departments.length})</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['#','القسم بالعربي','القسم بالإنجليزي'].map(h => (
                  <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'right', color:'#64748B', borderBottom:'2px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.id} style={{ background:i%2===0?'#fff':'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                  <td style={{ padding:'0.5rem 0.75rem', color:'#94A3B8', textAlign:'center' }}>{i+1}</td>
                  <td style={{ padding:'0.5rem 0.75rem', fontWeight:700, color:'#0F2044' }}>{d.nameAr}</td>
                  <td style={{ padding:'0.5rem 0.75rem', color:'#64748B' }}>{d.nameEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'data' && (
        <div style={{ ...cardStyle, borderTop:'3px solid #991B1B' }}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#991B1B', marginBottom:'0.5rem' }}>⚠️ منطقة الخطر</h3>
          <p style={{ fontSize:'0.8rem', color:'#64748B', marginBottom:'1rem' }}>
            إعادة تهيئة النظام وحذف جميع البيانات المحلية. لا يمكن التراجع.
          </p>
          <button onClick={resetAllData} style={{
            background:'#991B1B', color:'#fff', border:'none', borderRadius:'8px',
            padding:'0.6rem 1.25rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:700
          }}>
            🗑️ إعادة تهيئة البيانات
          </button>
        </div>
      )}
    </div>
  );
}
