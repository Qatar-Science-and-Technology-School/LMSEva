'use client';
import { useState, useEffect } from 'react';
import { SCHOOL_NAME, ACADEMIC_YEARS, isSuperAdmin, isTeacherUser } from '@/lib/data';
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
import ClassSubjectAnalysisPage from './pages/ClassSubjectAnalysisPage';
import EventsMeetingsPage from './pages/EventsMeetingsPage';
import OperationalPlanPage from './pages/OperationalPlanPage';
import DistanceLearningPage from './pages/DistanceLearningPage';
import type { TeacherProfileTab } from './pages/TeacherProfilePage';

type Page = 'dashboard'|'operational_plan'|'teachers'|'evaluation'|'class_analysis'|'model_lessons'|'events_meetings'|'distance_learning'|'profile'|'analytics'|'reports'|'settings'|'takreem'|'achievements'|'professional_development'|'elearning_sms';

interface Props { user: User; onLogout: () => void; }

export default function AppShell({ user, onLogout }: Props) {
  const isTeacher = isTeacherUser(user);
  const [page, setPage]             = useState<Page>(isTeacher ? 'profile' : 'dashboard');
  const [teacherPortalTab, setTeacherPortalTab] = useState<TeacherProfileTab>('overview');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string|null>(user.teacherId || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [teacherLang, setTeacherLang] = useState<'ar' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qstss_teacher_lang') === 'en' ? 'en' : 'ar';
    }
    return 'ar';
  });

  useEffect(() => {
    const syncLang = () => {
      const saved = localStorage.getItem('qstss_teacher_lang');
      if (saved === 'en' || saved === 'ar') setTeacherLang(saved);
    };
    window.addEventListener('qstss_teacher_lang_changed', syncLang);
    return () => window.removeEventListener('qstss_teacher_lang_changed', syncLang);
  }, []);

  const handleToggleTeacherLang = (nextLang: 'ar' | 'en') => {
    setTeacherLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qstss_teacher_lang', nextLang);
      window.dispatchEvent(new Event('qstss_teacher_lang_changed'));
    }
  };

  const isEnTeacher = (isTeacher || page === 'profile') && teacherLang === 'en';
  const isAdmin = isSuperAdmin(user);

  const nav: { id: Page; label: string; icon: string; show: boolean }[] = [
    { id:'dashboard',  label:'لوحة المؤشرات',  icon:'📊', show:!isTeacher },
    { id:'operational_plan', label:'الخطة الإجرائية', icon:'🎯', show:!isTeacher },
    { id:'teachers',   label:'إدارة المعلمين',  icon:'👨‍🏫', show:!isTeacher },
    { id:'evaluation', label:'تقييم نظام قطر للتعليم',  icon:'📝', show:!isTeacher },
    { id:'class_analysis', label:'تحليل الشعب والمواد', icon:'🏫', show:!isTeacher },
    { id:'model_lessons', label:'حصص التعليم الإلكتروني', icon:'💻', show:!isTeacher },
    { id:'events_meetings', label:'الفعاليات والاجتماعات', icon:'📅', show:!isTeacher },
    { id:'distance_learning', label:'التعلم عن بعد', icon:'🌐', show:!isTeacher },
    { id:'takreem',    label:'تكريم المعلمين',  icon:'🏆', show:!isTeacher },
    { id:'achievements',label:'الإنجازات',      icon:'🌟', show:!isTeacher },
    { id:'professional_development', label:'التطوير المهني', icon:'🎓', show:!isTeacher },
    { id:'elearning_sms', label:'E-Learning SMS', icon:'📱', show:!isTeacher },
    { id:'analytics',  label:'التحليلات',       icon:'📈', show:!isTeacher },
    { id:'reports',    label:'التقارير',        icon:'📋', show:!isTeacher },
    { id:'settings',   label:'الإعدادات',       icon:'⚙️', show:isAdmin && !isTeacher },
  ];

  // Teacher-dedicated sidebar items (only their own data & tabs)
  const teacherNav: { id: TeacherProfileTab; label: string; labelEn: string; icon: string }[] = [
    { id: 'overview', label: 'إحصاءاتي وتقييماتي الشهرية', labelEn: 'My Stats & Monthly Evaluations', icon: '📊' },
    { id: 'modellessons', label: 'حصصي في التعليم الإلكتروني', labelEn: 'My E-Learning Lessons', icon: '💻' },
    { id: 'distance_learning', label: 'Distance Learning (Teams)', labelEn: 'Distance Learning (Teams)', icon: '🌐' },
    { id: 'reports', label: 'تقاريري الخاصة والطباعة', labelEn: 'My Reports & Printing', icon: '🖨️' },
    { id: 'pd', label: 'التطوير المهني وشهادة MEEE', labelEn: 'Professional Development & MEEE', icon: '🎓' },
  ];

  function goProfile(tid: string) { setSelectedTeacherId(tid); setPage('profile'); }

  const activeTeacherTabObj = teacherNav.find(t => t.id === teacherPortalTab);
  const activeHeaderTitle = isTeacher
    ? isEnTeacher
      ? `Teacher Self-Service Portal — ${activeTeacherTabObj?.labelEn || 'My Portfolio'}`
      : `بوابة المعلم الذاتية — ${activeTeacherTabObj?.label || 'ملفي المهني'}`
    : page === 'profile' && isEnTeacher
    ? 'Teacher Professional Portfolio'
    : nav.find(n => n.id === page)?.label || 'ملف المعلم المهني';

  return (
    <div className="app-shell" style={{ display:'flex', height:'100vh', overflow:'hidden', direction: isTeacher && isEnTeacher ? 'ltr' : 'rtl' }}>
      {/* Sidebar */}
      <aside className="no-print" style={{
        width: sidebarOpen ? '250px' : '60px',
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
              <p style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.65)', marginTop:'0.4rem',
                lineHeight:1.3, padding:'0 0.25rem', fontWeight: 700 }}>
                {isTeacher ? (isEnTeacher ? '👨‍🏫 Teacher Self-Service Portal' : '👨‍🏫 بوابة المعلم الذاتية') : 'متابعة المعلمين'}
              </p>
            </div>
          ) : (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <span style={{ fontSize:'1.4rem' }}>{isTeacher ? '👨‍🏫' : '🎓'}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.5rem 0', overflowY:'auto' }}>
          {isTeacher ? (
            teacherNav.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setTeacherPortalTab(item.id);
                  setPage('profile');
                }}
                style={{
                  display:'flex', alignItems:'center', gap:'0.75rem',
                  width:'100%', padding:'0.8rem 1rem',
                  background: teacherPortalTab === item.id ? 'rgba(0,180,216,0.22)' : 'transparent',
                  borderRight: !isEnTeacher ? (teacherPortalTab === item.id ? '3px solid #00B4D8' : '3px solid transparent') : 'none',
                  borderLeft: isEnTeacher ? (teacherPortalTab === item.id ? '3px solid #00B4D8' : '3px solid transparent') : 'none',
                  color: teacherPortalTab === item.id ? '#00B4D8' : 'rgba(255,255,255,0.8)',
                  borderTop:'none', borderBottom:'none', cursor:'pointer', textAlign: isEnTeacher ? 'left' : 'right',
                  transition:'all 0.15s', fontSize:'0.82rem', fontWeight: teacherPortalTab === item.id ? 800 : 500,
                }}
              >
                <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace:'nowrap' }}>{isEnTeacher ? item.labelEn : item.label}</span>}
              </button>
            ))
          ) : (
            nav.filter(n => n.show).map(n => (
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
            ))
          )}
        </nav>

        {/* User info */}
        <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          {sidebarOpen && (
            <div style={{ marginBottom:'0.5rem' }}>
              <p style={{ fontSize:'0.75rem', color:'#fff', fontWeight:700, margin:0 }}>{isTeacher && isEnTeacher ? (user.nameEn || user.name) : user.name}</p>
              <p style={{ fontSize:'0.65rem', color: isAdmin ? '#90E0EF' : isTeacher ? '#7DD3FC' : '#FDE68A', margin:'0.1rem 0 0', fontWeight: 700 }}>
                {isAdmin
                  ? 'مدير النظام (كامل الصلاحيات)'
                  : isTeacher
                  ? isEnTeacher
                    ? `Teacher Account (${user.subject || 'Faculty'})`
                    : `حساب المعلم الخاص (${user.subject || 'الهيئة التدريسية'})`
                  : 'وضع المشاهدة والاطلاع فقط (Viewer)'}
              </p>
            </div>
          )}
          <button onClick={onLogout} style={{
            width:'100%', padding:'0.5rem', borderRadius:'8px',
            background:'rgba(239,68,68,0.15)', color:'#FCA5A5',
            border:'1px solid rgba(239,68,68,0.3)', cursor:'pointer', fontSize:'0.75rem',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem'
          }}>
            <span>🚪</span>{sidebarOpen && (isTeacher && isEnTeacher ? 'Sign Out' : 'تسجيل الخروج')}
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
              {activeHeaderTitle}
            </p>
            <p style={{ fontSize:'0.65rem', color:'#94A3B8', margin:0 }}>
              {isEnTeacher ? 'Qatar Science & Technology Secondary School for Boys' : SCHOOL_NAME}
            </p>
          </div>

          {/* Global Year Selector & Teacher Language Switcher */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            {(isTeacher || page === 'profile') && (
              <div
                style={{
                  display: 'inline-flex',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '2px',
                }}
                title="تغيير لغة صفحة المعلم / Switch Language"
              >
                <button
                  type="button"
                  onClick={() => handleToggleTeacherLang('ar')}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.28rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: teacherLang === 'ar' ? '#0F2044' : 'transparent',
                    color: teacherLang === 'ar' ? '#fff' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTeacherLang('en')}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.28rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: teacherLang === 'en' ? '#0284C7' : 'transparent',
                    color: teacherLang === 'en' ? '#fff' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >
                  English
                </button>
              </div>
            )}
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              background:'linear-gradient(135deg, #0F2044 0%, #1a3a6b 100%)',
              borderRadius:'12px', padding:'0.3rem 0.3rem 0.3rem 0.75rem',
              boxShadow:'0 2px 8px rgba(15,32,68,0.25)'
            }}>
              <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.7)', fontWeight:600, whiteSpace:'nowrap' }}>
                {isEnTeacher ? '📅 Academic Year' : '📅 العام الدراسي'}
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
              {(isEnTeacher && user.nameEn ? user.nameEn : user.name).charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflow:'auto' }}>
          {isTeacher ? (
            <TeacherProfilePage
              teacherId={user.teacherId || selectedTeacherId || ''}
              currentUser={user}
              onBack={() => {}}
              selectedYear={selectedYear}
              activeTabProp={teacherPortalTab}
              onTabChange={setTeacherPortalTab}
              isTeacherPortal={true}
              langProp={teacherLang}
              onLangChange={handleToggleTeacherLang}
            />
          ) : (
            <>
              {page === 'dashboard'  && <Dashboard  currentUser={user} onViewTeacher={goProfile} onNavigate={setPage} selectedYear={selectedYear} />}
              {page === 'operational_plan' && <OperationalPlanPage currentUser={user} selectedYear={selectedYear} onNavigate={(p) => setPage(p as Page)} />}
              {page === 'teachers'   && <TeachersPage currentUser={user} onViewTeacher={goProfile} selectedYear={selectedYear} />}
              {page === 'evaluation' && <EvaluationPage currentUser={user} selectedYear={selectedYear} onNavigateToPage={(p) => setPage(p as Page)} />}
              {page === 'class_analysis' && <ClassSubjectAnalysisPage currentUser={user} selectedYear={selectedYear} onNavigate={setPage} />}
              {page === 'model_lessons' && <ModelLessonsEvaluationPage currentUser={user} selectedYear={selectedYear} />}
              {page === 'events_meetings' && <EventsMeetingsPage currentUser={user} selectedYear={selectedYear} />}
              {page === 'distance_learning' && <DistanceLearningPage currentUser={user} selectedYear={selectedYear} />}
              {page === 'profile'    && selectedTeacherId && <TeacherProfilePage teacherId={selectedTeacherId} currentUser={user} onBack={() => setPage('teachers')} selectedYear={selectedYear} langProp={teacherLang} onLangChange={handleToggleTeacherLang} />}
              {page === 'takreem'    && <TakreemPage currentUser={user} selectedYear={selectedYear} onNavigateToPage={(p) => setPage(p as Page)} />}
              {page === 'analytics'  && <AnalyticsPage currentUser={user} selectedYear={selectedYear} onNavigate={setPage} />}
              {page === 'reports'    && <ReportsPage currentUser={user} selectedYear={selectedYear} onNavigate={(p) => setPage(p as Page)} onViewTeacher={goProfile} />}
              {page === 'achievements' && <AchievementsPage currentUser={user} onNavigate={setPage} selectedYear={selectedYear} />}
              {page === 'professional_development' && <ProfessionalDevelopmentPage currentUser={user} selectedYear={selectedYear} onViewTeacher={goProfile} />}
              {page === 'elearning_sms' && <ElearningSmsPage currentUser={user} selectedYear={selectedYear} />}
              {page === 'settings'   && isAdmin && <SettingsPage currentUser={user} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
