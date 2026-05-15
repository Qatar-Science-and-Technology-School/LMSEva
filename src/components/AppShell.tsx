'use client';
import { useState } from 'react';
import { SCHOOL_NAME, DESIGNER_CREDIT } from '@/lib/data';
import type { User } from '@/lib/data';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/TeachersPage';
import EvaluationPage from './pages/EvaluationPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TakreemPage from './pages/TakreemPage';
import DailyTasksPage from './pages/DailyTasksPage';
import AchievementsPage from './pages/AchievementsPage';
import ProfessionalDevelopmentPage from './pages/ProfessionalDevelopmentPage';

type Page = 'dashboard'|'teachers'|'evaluation'|'profile'|'analytics'|'reports'|'settings'|'takreem'|'daily_tasks'|'achievements'|'professional_development';

interface Props { user: User; onLogout: () => void; }

export default function AppShell({ user, onLogout }: Props) {
  const [page, setPage]             = useState<Page>('dashboard');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin     = user.role === 'admin';
  const isEvaluator = user.role === 'evaluator' || user.role === 'admin';
  const isLeader    = user.role === 'leader' || user.role === 'admin';
  const isCoord     = user.role === 'coordinator' || user.role === 'admin' || user.role === 'evaluator';
  const isViewer    = user.role === 'viewer';

  const nav: { id: Page; label: string; icon: string; show: boolean }[] = [
    { id:'dashboard',  label:'لوحة المؤشرات',  icon:'📊', show:true },
    { id:'teachers',   label:'إدارة المعلمين',  icon:'👨‍🏫', show:isAdmin||isEvaluator||isCoord||isViewer },
    { id:'evaluation', label:'التقييم الشهري',  icon:'📝', show:isEvaluator||isCoord||isViewer },
    { id:'takreem',    label:'تكريم المعلمين',  icon:'🏆', show:true },
    { id:'achievements',label:'الإنجازات',      icon:'🌟', show:true },
    { id:'professional_development', label:'التطوير المهني', icon:'🎓', show:true },
    { id:'daily_tasks',label:'المهام اليومية',  icon:'📅', show:isLeader||isViewer }, 
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
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
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
          {page === 'dashboard'  && <Dashboard  currentUser={user} onViewTeacher={goProfile} />}
          {page === 'teachers'   && <TeachersPage currentUser={user} onViewTeacher={goProfile} />}
          {page === 'evaluation' && <EvaluationPage currentUser={user} />}
          {page === 'profile'    && selectedTeacherId && <TeacherProfilePage teacherId={selectedTeacherId} currentUser={user} onBack={() => setPage('teachers')} />}
          {page === 'takreem'    && <TakreemPage currentUser={user} />}
          {page === 'analytics'  && <AnalyticsPage currentUser={user} />}
          {page === 'reports'    && <ReportsPage currentUser={user} />}
          {page === 'daily_tasks' && <DailyTasksPage currentUser={user} onNavigate={setPage} />}
          {page === 'achievements' && <AchievementsPage currentUser={user} onNavigate={setPage} />}
          {page === 'professional_development' && <ProfessionalDevelopmentPage currentUser={user} />}
          {page === 'settings'   && isAdmin && <SettingsPage currentUser={user} />}
        </main>

        {/* Footer */}
        <footer className="no-print" style={{
          background:'#fff', borderTop:'1px solid #E2E8F0',
          padding:'0.4rem 1rem', display:'flex', justifyContent:'center',
          fontSize:'0.62rem', color:'#94A3B8'
        }}>
          {DESIGNER_CREDIT} | © 2025-2026 {SCHOOL_NAME}
        </footer>
      </div>
    </div>
  );
}
