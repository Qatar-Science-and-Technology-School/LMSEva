'use client';
import { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Award, Medal, Star, Target, Plus, Search, Filter, 
  Download, Printer, Edit2, Trash2, ExternalLink, FileText, 
  BarChart3, Save, X, Globe, MapPin, Building2, CheckCircle2,
  Calendar, Users, Info, TrendingUp, BadgeCheck, Zap
} from 'lucide-react';
import { 
  SCHOOL_NAME, db, generateId, ACADEMIC_YEARS, ACHIEVEMENT_NAMES, ACHIEVEMENT_RESULTS, classifyAchievement,
  type Achievement, type User
} from '@/lib/data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Props {
  currentUser: User;
  onNavigate: (page: any) => void;
}

export default function AchievementsPage({ currentUser, onNavigate }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [isCustomAchievement, setIsCustomAchievement] = useState(false);
  const [isCustomResult, setIsCustomResult] = useState(false);

  // Permissions
  const isAdmin = currentUser.role === 'admin';
  const isEvaluator = currentUser.role === 'evaluator';
  const canAdd = isAdmin || isEvaluator;
  const canEdit = isAdmin || isEvaluator;
  const canDelete = isAdmin;

  // Initialize
  useEffect(() => {
    setAchievements(db.getAchievements());
  }, []);

  const saveAchievements = (newData: Achievement[]) => {
    setAchievements(newData);
    db.saveAchievements(newData);
  };

  // Filtered Data
  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const matchesSearch = (a.achievementName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (a.organizer || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !filterYear || a.academicYear === filterYear;
      const matchesLevel = !filterLevel || a.level === filterLevel;
      const matchesType = !filterType || a.participationType === filterType;
      const matchesResult = !filterResult || (a.result || '').includes(filterResult);
      
      return matchesSearch && matchesYear && matchesLevel && matchesType && matchesResult;
    }).sort((a, b) => {
      if (b.academicYear !== a.academicYear) return b.academicYear.localeCompare(a.academicYear);
      return (b.serialNumber || 0) - (a.serialNumber || 0);
    });
  }, [achievements, searchTerm, filterYear, filterLevel, filterType, filterResult]);

  // Analytics & KPIs
  const stats = useMemo(() => {
    const total = achievements.length;
    const byYear = achievements.reduce((acc, a) => {
      acc[a.academicYear] = (acc[a.academicYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLevel = achievements.reduce((acc, a) => {
      acc[a.level] = (acc[a.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const results = achievements.reduce((acc, a) => {
      const cat = a.smartCategory || 'أخرى';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byYear,
      global: byLevel['عالمي'] || 0,
      regional: byLevel['إقليمي'] || 0,
      local: byLevel['محلي'] || 0,
      publishedResearch: results['بحث علمي منشور'] || 0,
      firstPlaces: results['مركز أول'] || 0,
      secondPlaces: results['مركز ثاني'] || 0,
      thirdPlaces: results['مركز ثالث'] || 0,
      specialAwards: results['جائزة خاصة'] || 0,
      goldMedals: results['ميدالية ذهبية'] || 0,
      qualifications: results['تأهل وتمثيل'] || 0,
      highestYear: Object.keys(byYear).reduce((a, b) => byYear[a] > byYear[b] ? a : b, '-')
    };
  }, [achievements]);

  // Chart Data
  const yearChartData = useMemo(() => 
    ACADEMIC_YEARS.map(y => ({ name: y, count: stats.byYear[y] || 0 }))
  , [stats]);

  const levelChartData = useMemo(() => [
    { name: 'عالمي', value: stats.global, color: '#0F2044' },
    { name: 'إقليمي', value: stats.regional, color: '#3B82F6' },
    { name: 'محلي', value: stats.local, color: '#10B981' },
  ], [stats]);

  // Handle Actions
  const handleSaveAchievement = (a: any) => {
    const isEdit = !!editingAchievement;
    let newData;
    if (isEdit) {
      newData = achievements.map(item => item.id === editingAchievement!.id ? { 
        ...editingAchievement, 
        ...a, 
        smartCategory: classifyAchievement(a.achievementName, a.organizer, a.result),
        updatedAt: new Date().toISOString() 
      } : item);
    } else {
      const maxSerial = achievements.reduce((max, item) => Math.max(max, item.serialNumber || 0), 0);
      const newEntry: Achievement = {
        ...a,
        id: generateId(),
        serialNumber: maxSerial + 1,
        smartCategory: classifyAchievement(a.achievementName, a.organizer, a.result),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newData = [newEntry, ...achievements];
    }
    saveAchievements(newData);
    setIsFormOpen(false);
    setEditingAchievement(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) {
      saveAchievements(achievements.filter(a => a.id !== id));
    }
  };

  const exportExcel = () => {
    const data = filteredAchievements.map(a => ({
      'العام الأكاديمي': a.academicYear,
      'اسم الإنجاز': a.achievementName,
      'الجهة المنظمة': a.organizer,
      'المستوى': a.level,
      'نوع المشاركة': a.participationType,
      'النتيجة': a.result,
      'التصنيف': a.smartCategory
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الإنجازات");
    XLSX.writeFile(wb, "Achievements_Full_Report_2021_2026.xlsx");
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Page Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2044', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={32} color="#D97706" /> إنجازات قسم التعليم الإلكتروني (2021-2026)
          </h1>
          <p style={{ color: '#64748B', marginTop: '0.5rem', fontWeight: 500 }}>
            الأرشيف الرقمي الشامل لإنجازات ومسابقات قسم التعليم الإلكتروني
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canAdd && (
            <button 
              onClick={() => { setEditingAchievement(null); setIsCustomAchievement(false); setIsCustomResult(false); setIsFormOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F2044', color: '#fff',
                padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,32,68,0.2)'
              }}
            >
              <Plus size={18} /> إضافة إنجاز جديد
            </button>
          )}
          <button 
            onClick={exportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#0F2044',
              padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Download size={18} /> Excel
          </button>
          <button 
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#0F2044',
              padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Printer size={18} /> طباعة التقرير الشامل
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'إجمالي الإنجازات', value: stats.total, icon: <Trophy color="#D97706" />, color: '#D97706' },
          { label: 'إنجازات عالمية', value: stats.global, icon: <Globe color="#0F2044" />, color: '#0F2044' },
          { label: 'إنجازات إقليمية', value: stats.regional, icon: <MapPin color="#3B82F6" />, color: '#3B82F6' },
          { label: 'إنجازات محلية', value: stats.local, icon: <Building2 color="#10B981" />, color: '#10B981' },
          { label: 'المركز الأول', value: stats.firstPlaces, icon: <Medal color="#10B981" />, color: '#10B981' },
          { label: 'المركز الثاني', value: stats.secondPlaces, icon: <Medal color="#3B82F6" />, color: '#3B82F6' },
          { label: 'المركز الثالث', value: stats.thirdPlaces, icon: <Medal color="#F59E0B" />, color: '#F59E0B' },
          { label: 'جوائز خاصة', value: stats.specialAwards, icon: <Zap color="#8B5CF6" />, color: '#8B5CF6' },
          { label: 'ميداليات ذهبية', value: stats.goldMedals, icon: <Star color="#F59E0B" />, color: '#F59E0B' },
          { label: 'تأهل وتمثيل', value: stats.qualifications, icon: <Target color="#EF4444" />, color: '#EF4444' },
          { label: 'أبحاث منشورة', value: stats.publishedResearch, icon: <FileText color="#6366F1" />, color: '#6366F1' },
          { label: 'أعلى سنة', value: stats.highestYear, icon: <TrendingUp color="#F59E0B" />, color: '#F59E0B' },
        ].map((kpi, i) => (
          <div key={i} style={{ 
            background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>{kpi.label}</span>
              {kpi.icon}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F2044' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Yearly Summaries Grid */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {ACADEMIC_YEARS.map(year => (
          <div key={year} style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>إنجازات {year}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F2044', marginTop: '0.25rem' }}>{stats.byYear[year] || 0}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', height: '350px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F2044' }}>تطور الإنجازات (2021-2026)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={yearChartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F2044" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0F2044" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0F2044" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', height: '350px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F2044' }}>توزيع الإنجازات حسب المستوى</h3>
          <div style={{ display: 'flex', height: '85%' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={levelChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {levelChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
              {levelChartData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                  <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Year Sections */}
      {ACADEMIC_YEARS.slice().reverse().map(year => {
        const yearData = filteredAchievements.filter(a => a.academicYear === year);
        if (yearData.length === 0 && filterYear && filterYear !== year) return null;
        if (yearData.length === 0) return null;

        return (
          <div key={year} style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>إنجازات {year} ({yearData.length})</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#0F204410', color: '#0F2044', borderRadius: '6px', fontWeight: 700 }}>
                  عالمي: {yearData.filter(a => a.level === 'عالمي').length}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#3B82F610', color: '#3B82F6', borderRadius: '6px', fontWeight: 700 }}>
                  إقليمي: {yearData.filter(a => a.level === 'إقليمي').length}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#10B98110', color: '#10B981', borderRadius: '6px', fontWeight: 700 }}>
                  محلي: {yearData.filter(a => a.level === 'محلي').length}
                </span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th style={{ padding: '1rem', width: '50px' }}>SN</th>
                    <th style={{ padding: '1rem' }}>الإنجاز</th>
                    <th style={{ padding: '1rem' }}>الجهة</th>
                    <th style={{ padding: '1rem' }}>المستوى</th>
                    <th style={{ padding: '1rem' }}>النتيجة</th>
                    <th style={{ padding: '1rem' }}>التصنيف</th>
                    <th className="no-print" style={{ padding: '1rem' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {yearData.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{a.serialNumber}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F2044' }}>{a.achievementName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{a.participationType}</div>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{a.organizer}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: a.level === 'عالمي' ? '#0F204410' : a.level === 'إقليمي' ? '#3B82F610' : '#10B98110',
                          color: a.level === 'عالمي' ? '#0F2044' : a.level === 'إقليمي' ? '#3B82F6' : '#065F46'
                        }}>{a.level}</span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#10B981' }}>{a.result}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#F1F5F9', borderRadius: '4px', fontWeight: 600 }}>{a.smartCategory}</span>
                      </td>
                      <td className="no-print" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => { setSelectedAchievement(a); setIsDetailsOpen(true); }} style={{ padding: '0.4rem', borderRadius: '6px', background: '#F1F5F9', border: 'none', cursor: 'pointer' }}><Info size={16} /></button>
                          {canEdit && <button onClick={() => { setEditingAchievement(a); setIsCustomAchievement(!ACHIEVEMENT_NAMES.includes(a.achievementName)); setIsCustomResult(!ACHIEVEMENT_RESULTS.includes(a.result)); setIsFormOpen(true); }} style={{ padding: '0.4rem', borderRadius: '6px', background: '#DBEAFE', border: 'none', color: '#1E40AF', cursor: 'pointer' }}><Edit2 size={16} /></button>}
                          {canDelete && <button onClick={() => handleDelete(a.id)} style={{ padding: '0.4rem', borderRadius: '6px', background: '#FEE2E2', border: 'none', color: '#991B1B', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Form Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '700px', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', background: '#0F2044', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{editingAchievement ? 'تعديل الإنجاز' : 'إضافة إنجاز جديد'}</h2>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSaveAchievement({
                academicYear: fd.get('academicYear') as string,
                organizer: fd.get('organizer') as string,
                level: fd.get('level') as 'عالمي' | 'إقليمي' | 'محلي',
                participationType: fd.get('participationType') as string,
                result: fd.get('result') as string,
                achievementName: fd.get('achievementName') as string,
                description: fd.get('description') as string,
                supervisorName: fd.get('supervisorName') as string,
                evidenceUrl: fd.get('evidenceUrl') as string,
                notes: fd.get('notes') as string,
              });
            }} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>اسم المسابقة / الإنجاز</label>
                  {!isCustomAchievement ? (
                    <select
                      name="achievementName"
                      defaultValue={editingAchievement?.achievementName || ''}
                      required
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomAchievement(true);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}
                    >
                      <option value="" disabled>-- اختر الإنجاز --</option>
                      {ACHIEVEMENT_NAMES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="__custom__">✏️ أخرى (إدخال يدوي)</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        name="achievementName"
                        defaultValue={editingAchievement?.achievementName}
                        required
                        placeholder="أدخل اسم الإنجاز يدوياً..."
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomAchievement(false)}
                        style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F1F5F9', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        القائمة
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>العام الأكاديمي</label>
                  <select name="academicYear" defaultValue={editingAchievement?.academicYear || '2025-2026'} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>الجهة المنظمة</label>
                  <input name="organizer" defaultValue={editingAchievement?.organizer} required style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>المستوى</label>
                  <select name="level" defaultValue={editingAchievement?.level || 'محلي'} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <option value="عالمي">عالمي</option>
                    <option value="إقليمي">إقليمي</option>
                    <option value="محلي">محلي</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>نوع المشاركة</label>
                  <select name="participationType" defaultValue={editingAchievement?.participationType || 'إشراف وتدريب'} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <option value="إشراف وتدريب">إشراف وتدريب</option>
                    <option value="نشر بحث علمي">نشر بحث علمي</option>
                    <option value="مشاركة فردية">مشاركة فردية</option>
                    <option value="مشاركة جماعية">مشاركة جماعية</option>
                    <option value="تمثيل رسمي">تمثيل رسمي</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>النتيجة</label>
                  {!isCustomResult ? (
                    <select
                      name="result"
                      defaultValue={editingAchievement?.result || ''}
                      required
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomResult(true);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}
                    >
                      <option value="" disabled>-- اختر النتيجة --</option>
                      {ACHIEVEMENT_RESULTS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="__custom__">✏️ أخرى (إدخال يدوي)</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        name="result"
                        defaultValue={editingAchievement?.result}
                        required
                        placeholder="أدخل النتيجة يدوياً..."
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomResult(false)}
                        style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F1F5F9', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        القائمة
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#0F2044', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>حفظ</button>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#F1F5F9', border: 'none', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsOpen && selectedAchievement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>تفاصيل الإنجاز</h2>
              <button onClick={() => setIsDetailsOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Trophy size={48} color="#D97706" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.5rem' }}>{selectedAchievement.achievementName}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'right', marginTop: '1.5rem' }}>
                <div><label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>العام</label><div style={{ fontWeight: 700 }}>{selectedAchievement.academicYear}</div></div>
                <div><label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>الجهة</label><div style={{ fontWeight: 700 }}>{selectedAchievement.organizer}</div></div>
                <div><label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>المستوى</label><div style={{ fontWeight: 700 }}>{selectedAchievement.level}</div></div>
                <div><label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>النتيجة</label><div style={{ fontWeight: 700 }}>{selectedAchievement.result}</div></div>
              </div>
              {selectedAchievement.evidenceUrl && (
                <a href={selectedAchievement.evidenceUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '1.5rem', padding: '0.75rem', background: '#F0F9FF', color: '#00B4D8', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}>فتح دليل الإنجاز</a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Print Report */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{SCHOOL_NAME}</h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>تقرير إنجازات قسم التعليم الإلكتروني (2021-2026)</h2>
          <p style={{ marginTop: '0.5rem' }}>إجمالي الإنجازات الموثقة: {stats.total}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem', border: '1px solid #000', padding: '1rem' }}>
          <div>عالمي: {stats.global}</div>
          <div>إقليمي: {stats.regional}</div>
          <div>محلي: {stats.local}</div>
          <div>مركز أول: {stats.firstPlaces}</div>
          <div>ميداليات ذهبية: {stats.goldMedals}</div>
          <div>أبحاث منشورة: {stats.publishedResearch}</div>
        </div>

        {ACADEMIC_YEARS.slice().reverse().map(year => {
          const items = achievements.filter(a => a.academicYear === year);
          if (items.length === 0) return null;
          return (
            <div key={year} style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
              <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '0.25rem' }}>العام الأكاديمي {year} ({items.length} إنجاز)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ background: '#eee' }}>
                    <th style={{ border: '1px solid #000', padding: '0.4rem' }}>م</th>
                    <th style={{ border: '1px solid #000', padding: '0.4rem' }}>اسم الإنجاز</th>
                    <th style={{ border: '1px solid #000', padding: '0.4rem' }}>المستوى</th>
                    <th style={{ border: '1px solid #000', padding: '0.4rem' }}>النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a, idx) => (
                    <tr key={a.id}>
                      <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '0.4rem' }}>{a.achievementName}</td>
                      <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'center' }}>{a.level}</td>
                      <td style={{ border: '1px solid #000', padding: '0.4rem', textAlign: 'center' }}>{a.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}><div>منسق المشاريع الإلكترونية</div><div style={{ marginTop: '3rem' }}>________________</div></div>
          <div style={{ textAlign: 'center' }}><div>النائب الأكاديمي</div><div style={{ marginTop: '3rem' }}>________________</div></div>
          <div style={{ textAlign: 'center' }}><div>مدير المدرسة</div><div style={{ marginTop: '3rem' }}>________________</div></div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
}
