'use client';
import { useState } from 'react';
import { SCHOOL_NAME, ACADEMIC_YEARS } from '@/lib/data';
import type { User } from '@/lib/data';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/TeachersPage';
import EvaluationPage from './pages/EvaluationPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TakreemPage from './pages/TakreemPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfessionalDevelopmentPage from './pages/ProfessionalDevelopmentPage';
import ModelLessonsEvaluationPage from './pages/ModelLessonsEvaluationPage';
import ElearningSmsPage from './pages/ElearningSmsPage';

type Page = 'dashboard'|'teachers'|'evaluation'|'model_lessons'|'profile'|'analytics'|'reports'|'settings'|'takreem'|'achievements'|'professional_development'|'elearning_sms';

interface Props { user: User; onLogout: () => void; }

export default function AppShell({ user, onLogout }: Props) {
  const [page, setPage]             = useState<Page>('dashboard');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);

  const isAdmin     = user.role === 'admin';
  const isEvaluator = false;
  const isLeader    = user.role === 'leader' || user.role === 'admin';
  const isCoord     = user.role === 'coordinator' || user.role === 'admin';
  const isViewer    = user.role === 'viewer' || user.role === 'evaluator' || user.role === 'leader' || user.role === 'coordinator';

  const nav: { id: Page; label: string; icon: string; show: boolean }[] = [
    { id:'dashboard',  label:'لوحة المؤشرات',  icon:'📊', show:true },
    { id:'teachers',   label:'إدارة المعلمين',  icon:'👨‍🏫', show:true },
    { id:'evaluation', label:'تقييم نظام قطر للتعليم',  icon:'📝', show:true },
    { id:'model_lessons', label:'حصص التعليم الإلكتروني', icon:'💻', show:true },
    { id:'takreem',    label:'تكريم المعلمين',  icon:'🏆', show:true },
    { id:'achievements',label:'الإنجازات',      icon:'🌟', show:true },
    { id:'professional_development', label:'التطوير المهني', icon:'🎓', show:true },
    { id:'elearning_sms', label:'E-Learning SMS', icon:'📱', show:true },
    { id:'analytics',  label:'التحليلات',       icon:'📈', show:true },
    { id:'reports',    label:'التقارير',        icon:'📋', show:true },
    { id:'settings',   label:'الإعدادات',       icon:'⚙️', show:isAdmin },
  ];

  function goProfile(tid: string) { setSelectedTeacherId(tid); setPage('profile'); }

  const roleLabel: Record<string, string> = {
    admin:'مدير النظام', evaluator:'منسق إلكتروني',
    leader:'قيادة المدرسة', coordinator:'منسق قسم',
    viewer:'أخصائي التعليم الإلكتروني'
  };

  return (
    <div className="app-shell" style={{ display:'flex', height:'100vh', overflow:'hidden', direction:'rtl' }}>
      {/* Sidebar */}
      <aside className="no-print" style={{
        width: sidebarOpen ? '240px' : '60px',
        background:'linear-gradient(180deg,#0F2044 0%,#1a3a6b 100%)',
        display:'flex', flexDirection:'column',
        transition:'width 0.25s ease', overflow:'hidden', flexShrink:0,
        boxShadow:'2px 0 12px rgba(0,0,0,0.2)'
      }}>
        {/* Logo area */}
        <div style={{ padding:'1rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
          {sidebarOpen ? (
            <div style={{ textAlign:'center' }}>
              <img src="/school-logo.png" alt={SCHOOL_NAME}
                style={{ height:'52px', width:'auto', maxWidth:'180px', objectFit:'contain',
                  filter:'brightness(10)' }} />
              <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.4rem',
                lineHeight:1.3, padding:'0 0.25rem' }}>
                متابعة المعلمين
              </p>
            </div>
          ) : (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <span style={{ fontSize:'1.4rem' }}>🎓</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.5rem 0', overflowY:'auto' }}>
          {nav.filter(n => n.show).map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                width:'100%', padding:'0.75rem 1rem',
                background: page === n.id ? 'rgba(0,180,216,0.2)' : 'transparent',
                borderRight: page === n.id ? '3px solid #00B4D8' : '3px solid transparent',
                color: page === n.id ? '#00B4D8' : 'rgba(255,255,255,0.75)',
                border:'none', cursor:'pointer', textAlign:'right',
                transition:'all 0.15s', fontSize:'0.85rem', fontWeight: page === n.id ? 700 : 400,
              }}>
              <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace:'nowrap' }}>{n.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          {sidebarOpen && (
            <div style={{ marginBottom:'0.5rem' }}>
              <p style={{ fontSize:'0.75rem', color:'#fff', fontWeight:700, margin:0 }}>{user.name}</p>
              <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', margin:'0.1rem 0 0' }}>
                {roleLabel[user.role] || user.role}
              </p>
            </div>
          )}
          <button onClick={onLogout} style={{
            width:'100%', padding:'0.5rem', borderRadius:'8px',
            background:'rgba(239,68,68,0.15)', color:'#FCA5A5',
            border:'1px solid rgba(239,68,68,0.3)', cursor:'pointer', fontSize:'0.75rem',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem'
          }}>
            <span>🚪</span>{sidebarOpen && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content-area" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F1F5F9' }}>
        {/* Topbar */}
        <header className="no-print" style={{
          background:'#fff', padding:'0 1.25rem', height:'56px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom:'1px solid #E2E8F0', flexShrink:0,
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', padding:'0.25rem'
          }}>☰</button>

          <div style={{ textAlign:'center' }}>
            <p style={{ fontWeight:800, fontSize:'0.9rem', color:'#0F2044', margin:0 }}>
              {nav.find(n => n.id === page)?.label}
            </p>
            <p style={{ fontSize:'0.65rem', color:'#94A3B8', margin:0 }}>{SCHOOL_NAME}</p>
          </div>

          {/* Global Year Selector */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              background:'linear-gradient(135deg, #0F2044 0%, #1a3a6b 100%)',
              borderRadius:'12px', padding:'0.3rem 0.3rem 0.3rem 0.75rem',
              boxShadow:'0 2px 8px rgba(15,32,68,0.25)'
            }}>
              <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.7)', fontWeight:600, whiteSpace:'nowrap' }}>
                📅 العام الدراسي
              </span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                style={{
                  background:'rgba(0,180,216,0.15)',
                  color:'#00B4D8',
                  border:'1px solid rgba(0,180,216,0.4)',
                  borderRadius:'8px',
                  padding:'0.3rem 0.6rem',
                  fontSize:'0.8rem',
                  fontWeight:800,
                  cursor:'pointer',
                  outline:'none',
                  direction:'ltr',
                }}
              >
                {ACADEMIC_YEARS.slice().reverse().map(y => (
                  <option key={y} value={y} style={{ background:'#0F2044', color:'#fff' }}>{y}</option>
                ))}
              </select>
            </div>
            <div style={{
              width:'32px', height:'32px', borderRadius:'50%',
              background:'linear-gradient(135deg,#0F2044,#0096C7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:'0.75rem', fontWeight:700
            }}>
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflow:'auto' }}>
          {page === 'dashboard'  && <Dashboard  currentUser={user} onViewTeacher={goProfile} onNavigate={setPage} selectedYear={selectedYear} />}
          {page === 'teachers'   && <TeachersPage currentUser={user} onViewTeacher={goProfile} selectedYear={selectedYear} />}
          {page === 'evaluation' && <EvaluationPage currentUser={user} selectedYear={selectedYear} onNavigateToPage={(p) => setPage(p as Page)} />}
          {page === 'model_lessons' && <ModelLessonsEvaluationPage currentUser={user} selectedYear={selectedYear} />}
          {page === 'profile'    && selectedTeacherId && <TeacherProfilePage teacherId={selectedTeacherId} currentUser={user} onBack={() => setPage('teachers')} selectedYear={selectedYear} />}
          {page === 'takreem'    && <TakreemPage currentUser={user} selectedYear={selectedYear} onNavigateToPage={(p) => setPage(p as Page)} />}
          {page === 'analytics'  && <AnalyticsPage currentUser={user} selectedYear={selectedYear} />}
          {page === 'reports'    && <ReportsPage currentUser={user} selectedYear={selectedYear} />}
          {page === 'achievements' && <AchievementsPage currentUser={user} onNavigate={setPage} selectedYear={selectedYear} />}
          {page === 'professional_development' && <ProfessionalDevelopmentPage currentUser={user} selectedYear={selectedYear} />}
          {page === 'elearning_sms' && <ElearningSmsPage currentUser={user} selectedYear={selectedYear} />}
          {page === 'settings'   && isAdmin && <SettingsPage currentUser={user} />}
        </main>


      </div>
    </div>
  );
}

