'use client';
import { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, CheckSquare, Calendar as CalendarIcon, List, Plus, 
  Search, Filter, Download, Printer, Edit2, Trash2, ExternalLink, 
  CheckCircle2, Clock, AlertCircle, XCircle, FileText, BarChart3, 
  ChevronRight, ChevronLeft, CalendarDays, MoreHorizontal, Link as LinkIcon,
  Save, X, Upload, BadgeCheck, Star, TrendingUp, Users
} from 'lucide-react';
import { 
  SCHOOL_NAME, db, generateId, TASK_CATEGORIES, ACADEMIC_YEARS, MONTHS,
  type DailyTask, type TaskStatus, type TaskPriority, type TaskType, type User,
  type CoordinatorFollowUpForm, type CoordinatorFollowUpItem, type MonthlyTaskNote
} from '@/lib/data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Types
type ViewType = 'table' | 'calendar' | 'analytics' | 'reports' | 'followup' | 'achievements';

interface Props {
  currentUser: User;
  onNavigate: (page: any) => void;
}

export default function DailyTasksPage({ currentUser, onNavigate }: Props) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [monthlyNotes, setMonthlyNotes] = useState<MonthlyTaskNote[]>([]);
  const [followUpForms, setFollowUpForms] = useState<CoordinatorFollowUpForm[]>([]);
  const [view, setView] = useState<ViewType>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [selectedForm, setSelectedForm] = useState<CoordinatorFollowUpForm | null>(null);
  const [isFollowUpEditorOpen, setIsFollowUpEditorOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<CoordinatorFollowUpForm | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('2025-2026');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Permissions
  const isAdmin = currentUser.role === 'admin';
  const isEvaluator = currentUser.role === 'evaluator';
  const isLeader = currentUser.role === 'leader';
  const isCoord = currentUser.role === 'coordinator';

  const canEdit = isAdmin || isEvaluator;
  const canAdd = isAdmin || isEvaluator;
  const canDelete = isAdmin;
  const canManageFollowUp = isLeader || isAdmin;

  // Initialize Data
  useEffect(() => {
    setTasks(db.getDailyTasks());
    setMonthlyNotes(db.getMonthlyNotes());
    setFollowUpForms(db.getFollowUpForms());
  }, []);

  const handleSaveNote = (month: string, year: string, note: string) => {
    const newNotes = [...monthlyNotes];
    const index = newNotes.findIndex(n => n.month === month && n.academicYear === year);
    if (index >= 0) {
      newNotes[index] = { ...newNotes[index], note, updatedAt: new Date().toISOString() };
    } else {
      newNotes.push({
        id: generateId(),
        month,
        academicYear: year,
        note,
        source: 'نظام التقارير',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setMonthlyNotes(newNotes);
    db.saveMonthlyNotes(newNotes);
  };

  const saveTasks = (newTasks: DailyTask[]) => {
    setTasks(newTasks);
    db.saveDailyTasks(newTasks);
  };

  // Smart Linking Helper
  const renderSmartLinks = (title: string) => {
    const links: any[] = [];
    if (title.includes('تكريم')) links.push({ label: 'التكريم', page: 'takreem', icon: <Star size={12} /> });
    if (title.includes('نظام قطر للتعليم') || title.includes('منصة قطر للتعليم')) links.push({ label: 'نظام قطر للتعليم', page: 'dashboard', icon: <BarChart3 size={12} /> });
    if (title.includes('التعليم الإلكتروني')) links.push({ label: 'التعليم الإلكتروني', page: 'reports', icon: <FileText size={12} />, color: '#00B4D8' });
    if (title.includes('التعلم عن بعد')) links.push({ label: 'التعلم عن بعد', page: 'reports', icon: <Clock size={12} />, color: '#8B5CF6' });
    if (title.includes('World Skills') || title.includes('تايوان') || title.includes('البحث العلمي') || title.includes('ITEX') || title.includes('تحدي علوم المستقبل')) links.push({ label: 'المسابقات والبحث العلمي', page: 'achievements', icon: <BadgeCheck size={12} />, color: '#F59E0B' });
    if (title.includes('أولياء الأمور')) links.push({ label: 'أولياء الأمور', page: 'dashboard', icon: <Users size={12} />, color: '#10B981' });
    if (title.includes('مبدعون في التعليم')) links.push({ label: 'المشاركات والإنجازات', page: 'achievements', icon: <Star size={12} />, color: '#EC4899' });
    if (title.includes('التنمّر الإلكتروني')) links.push({ label: 'التوعية الرقمية والأمن السيبراني', page: 'reports', icon: <AlertCircle size={12} />, color: '#EF4444' });
    if (title.includes('الاستبيان الوطني')) links.push({ label: 'المتابعة والتقارير', page: 'reports', icon: <FileText size={12} />, color: '#6366F1' });
    if (title.includes('الاشتراكات السنوية') || title.includes('المواقع')) links.push({ label: 'المنصات التعليمية', page: 'dashboard', icon: <LinkIcon size={12} />, color: '#0EA5E9' });
    if (title.includes('المعلمين الجدد')) links.push({ label: 'التطوير المهني', page: 'reports', icon: <TrendingUp size={12} />, color: '#10B981' });
    if (title.includes('Cognia') || title.includes('الاعتماد الدولي')) links.push({ label: 'الاعتماد والجودة', page: 'reports', icon: <BadgeCheck size={12} />, color: '#6366F1' });
    if (title.includes('الأمن والسلامة') || title.includes('التحصيل الأكاديمي')) links.push({ label: 'الاجتماعات المدرسية', page: 'reports', icon: <Users size={12} />, color: '#4B5563' });
    if (title.includes('اختبارات القبول')) links.push({ label: 'شؤون الطلاب', page: 'dashboard', icon: <FileText size={12} />, color: '#8B5CF6' });
    if (title.includes('منتصف الفصل الدراسي الثاني')) links.push({ label: 'الاختبارات والتقييم', page: 'reports', icon: <FileText size={12} />, color: '#EF4444' });
    if (title.includes('المبادرات')) links.push({ label: 'المشاركات والإنجازات', page: 'achievements', icon: <Star size={12} />, color: '#EC4899' });
    
    if (links.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        {links.map((link, i) => (
          <button 
            key={i} 
            onClick={(e) => { e.stopPropagation(); onNavigate(link.page); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', 
              borderRadius: '6px', background: link.color ? `${link.color}10` : '#F0F9FF', 
              color: link.color || '#00B4D8', border: `1px solid ${link.color ? `${link.color}30` : '#BAE6FD'}`,
              fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
            }}
          >
            {link.icon} {link.label}
          </button>
        ))}
      </div>
    );
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = !filterMonth || task.month === filterMonth;
      const matchesYear = !filterYear || task.academicYear === filterYear;
      const matchesCategory = !filterCategory || task.category === filterCategory;
      const matchesStatus = !filterStatus || task.status === filterStatus;
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      
      return matchesSearch && matchesMonth && matchesYear && matchesCategory && matchesStatus && matchesPriority;
    }).sort((a, b) => b.taskDate.localeCompare(a.taskDate));
  }, [tasks, searchTerm, filterMonth, filterYear, filterCategory, filterStatus, filterPriority]);

  // KPIs
  const kpis = useMemo(() => {
    const thisMonth = filteredTasks;
    return {
      total: thisMonth.length,
      completed: thisMonth.filter(t => t.status === 'مكتملة' || t.status === 'يوجد دليل إنجاز').length,
      inProgress: thisMonth.filter(t => t.status === 'قيد التنفيذ').length,
      pending: thisMonth.filter(t => t.status === 'مؤجلة' || t.status === 'تحتاج متابعة').length,
      completionRate: thisMonth.length ? Math.round((thisMonth.filter(t => t.status === 'مكتملة' || t.status === 'يوجد دليل إنجاز').length / thisMonth.length) * 100) : 0,
      evidenceCount: thisMonth.filter(t => t.evidenceUrl || t.evidenceFileUrl || t.status === 'يوجد دليل إنجاز').length,
      topCategory: 'الاجتماعات',
      lastAdded: thisMonth.length ? thisMonth[0].title : '-'
    };
  }, [filteredTasks]);

  // Status Styles
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'مكتملة': return { bg: '#D1FAE5', text: '#065F46', icon: <CheckCircle2 size={14} /> };
      case 'يوجد دليل إنجاز': return { bg: '#F3E8FF', text: '#6B21A8', icon: <BadgeCheck size={14} /> };
      case 'قيد التنفيذ': return { bg: '#DBEAFE', text: '#1E40AF', icon: <Clock size={14} /> };
      case 'مؤجلة': return { bg: '#FEF3C7', text: '#92400E', icon: <AlertCircle size={14} /> };
      case 'تحتاج متابعة': return { bg: '#FEE2E2', text: '#991B1B', icon: <AlertCircle size={14} /> };
      case 'ملغاة': return { bg: '#F3F4F6', text: '#374151', icon: <XCircle size={14} /> };
      default: return { bg: '#F3F4F6', text: '#374151', icon: <Clock size={14} /> };
    }
  };

  // Priority Styles
  const getPriorityStyle = (p: TaskPriority) => {
    switch (p) {
      case 'عالية': return { color: '#EF4444', label: 'عالية' };
      case 'متوسطة': return { color: '#F59E0B', label: 'متوسطة' };
      case 'منخفضة': return { color: '#10B981', label: 'منخفضة' };
    }
  };


  // Actions
  const handleAddTask = (task: DailyTask) => {
    const newTasks = [task, ...tasks];
    saveTasks(newTasks);
    setIsFormOpen(false);
  };

  const handleUpdateTask = (task: DailyTask) => {
    const newTasks = tasks.map(t => t.id === task.id ? task : t);
    saveTasks(newTasks);
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      const newTasks = tasks.filter(t => t.id !== id);
      saveTasks(newTasks);
    }
  };

  const handleSaveFollowUp = (form: CoordinatorFollowUpForm) => {
    const exists = followUpForms.find(f => f.id === form.id);
    let newForms;
    if (exists) {
      newForms = followUpForms.map(f => f.id === form.id ? form : f);
    } else {
      newForms = [form, ...followUpForms];
    }
    setFollowUpForms(newForms);
    db.saveFollowUpForms(newForms);
    setIsFollowUpEditorOpen(false);
    setEditingFollowUp(null);
  };

  const handleDeleteFollowUp = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      const newForms = followUpForms.filter(f => f.id !== id);
      setFollowUpForms(newForms);
      db.saveFollowUpForms(newForms);
    }
  };

  const exportToExcel = () => {
    const data = filteredTasks.map(t => ({
      'التاريخ': t.taskDate,
      'الشهر': t.month,
      'العام الأكاديمي': t.academicYear,
      'التصنيف': t.category,
      'عنوان المهمة': t.title,
      'الحالة': t.status,
      'الأولوية': t.priority,
      'دليل الإنجاز': t.evidenceUrl || t.evidenceLabel || '',
      'المصدر': t.source
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المهام");
    XLSX.writeFile(wb, `Daily_Tasks_${filterMonth || 'all'}.xlsx`);
  };

  return (
    <div className="daily-tasks-page" style={{ padding: '1.5rem', direction: 'rtl' }}>
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>متابعة المهام اليومية</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            نظام إلكتروني لتسجيل ومتابعة وأرشفة مهام منسق المشاريع الإلكترونية اليومية والشهرية
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canAdd && (
            <button 
              onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#0F2044', color: '#fff', border: 'none',
                padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(15,32,68,0.3)'
              }}
            >
              <Plus size={18} /> إضافة مهمة جديدة
            </button>
          )}
          <button 
            onClick={exportToExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#fff', color: '#0F2044', border: '1px solid #E2E8F0',
              padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Download size={18} /> تصدير Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {[
          { id: 'table', label: 'جدول المهام', icon: <List size={18} /> },
          { id: 'calendar', label: 'عرض التقويم', icon: <CalendarDays size={18} /> },
          { id: 'analytics', label: 'التحليلات', icon: <BarChart3 size={18} /> },
          { id: 'reports', label: 'التقارير الشهرية', icon: <FileText size={18} /> },
          { id: 'achievements', label: 'دليل الإنجاز', icon: <BadgeCheck size={18} /> },
          { id: 'followup', label: 'استمارات المتابعة', icon: <ClipboardList size={18} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id as ViewType)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.25rem', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: view === t.id ? 700 : 500,
              color: view === t.id ? '#00B4D8' : '#64748B',
              borderBottom: view === t.id ? '3px solid #00B4D8' : '3px solid transparent',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KPICard title="إجمالي المهام" value={kpis.total} icon={<ClipboardList color="#0F2044" />} color="#0F2044" />
        <KPICard title="المكتملة" value={kpis.completed} icon={<CheckCircle2 color="#10B981" />} color="#10B981" />
        <KPICard title="قيد التنفيذ" value={kpis.inProgress} icon={<Clock color="#3B82F6" />} color="#3B82F6" />
        <KPICard title="المؤجلة" value={kpis.pending} icon={<AlertCircle color="#F59E0B" />} color="#F59E0B" />
        <KPICard title="نسبة الإنجاز" value={`${kpis.completionRate}%`} icon={<BarChart3 color="#8B5CF6" />} color="#8B5CF6" />
        <KPICard title="الأدلة" value={kpis.evidenceCount} icon={<LinkIcon color="#EC4899" />} color="#EC4899" />
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
        {view === 'table' && (
          <div style={{ padding: '1.5rem' }}>
            <Filters 
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              filterMonth={filterMonth} setFilterMonth={setFilterMonth}
              filterYear={filterYear} setFilterYear={setFilterYear}
              filterCategory={filterCategory} setFilterCategory={setFilterCategory}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              filterPriority={filterPriority} setFilterPriority={setFilterPriority}
            />
            <TaskTable 
              tasks={filteredTasks} 
              onEdit={(t: any) => { setEditingTask(t); setIsFormOpen(true); }} 
              onDelete={handleDeleteTask}
              getStatusStyle={getStatusStyle}
              getPriorityStyle={getPriorityStyle}
              canEdit={canEdit}
              canDelete={canDelete}
              renderSmartLinks={renderSmartLinks}
            />
          </div>
        )}

        {view === 'calendar' && (
          <CalendarView 
            tasks={tasks} 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            getStatusStyle={getStatusStyle}
          />
        )}

        {view === 'analytics' && (
          <AnalyticsDashboard tasks={tasks} />
        )}

        {view === 'reports' && (
          <MonthlyReportView 
            tasks={tasks} 
            monthlyNotes={monthlyNotes} 
            onSaveNote={handleSaveNote} 
          />
        )}

        {view === 'achievements' && (
          <AchievementGuideView tasks={tasks} getStatusStyle={getStatusStyle} />
        )}

        {view === 'followup' && (
          <FollowUpFormsView 
            forms={followUpForms} 
            onSelect={setSelectedForm} 
            onEdit={(f: any) => { setEditingFollowUp(f); setIsFollowUpEditorOpen(true); }}
            onDelete={handleDeleteFollowUp}
            canManage={canManageFollowUp}
            onAdd={() => { setEditingFollowUp(null); setIsFollowUpEditorOpen(true); }}
          />
        )}
      </div>

      {/* Task Form Modal */}
      {isFormOpen && (
        <TaskForm 
          task={editingTask} 
          onSave={editingTask ? handleUpdateTask : handleAddTask} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {/* Form Details Modal */}
      {selectedForm && (
        <FormDetailsModal form={selectedForm} onClose={() => setSelectedForm(null)} />
      )}

      {/* Follow-up Form Editor Modal */}
      {isFollowUpEditorOpen && (
        <FollowUpFormEditor 
          form={editingFollowUp} 
          onSave={handleSaveFollowUp} 
          onClose={() => { setIsFollowUpEditorOpen(false); setEditingFollowUp(null); }} 
        />
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .daily-tasks-page { padding: 0 !important; background: #fff !important; }
          .main-content-area { overflow: visible !important; }
          .printable-report { border: none !important; padding: 0 !important; }
        }
        .hover-row:hover { background: #F8FAFC; }
      `}</style>
    </div>
  );
}

// Sub-components

function KPICard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ 
      background: '#fff', padding: '1.25rem', borderRadius: '12px', 
      borderBottom: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div>
        <p style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginBottom: '0.2rem', textTransform: 'uppercase' }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{value}</p>
      </div>
      <div style={{ background: `${color}10`, padding: '0.6rem', borderRadius: '10px' }}>
        {icon}
      </div>
    </div>
  );
}

function Filters({ searchTerm, setSearchTerm, filterMonth, setFilterMonth, filterYear, setFilterYear, filterCategory, setFilterCategory, filterStatus, setFilterStatus, filterPriority, setFilterPriority }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative', gridColumn: 'span 2' }}>
        <Search style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
        <input 
          type="text" placeholder="بحث في المهام..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 2.25rem 0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}
        />
      </div>
      <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
        <option value="">كل الأشهر</option>
        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
        {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
        <option value="">كل التصنيفات</option>
        {TASK_CATEGORIES.map(c => <option key={c.id} value={c.nameAr}>{c.nameAr}</option>)}
      </select>
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
        <option value="">كل الحالات</option>
        {['مكتملة', 'قيد التنفيذ', 'مؤجلة', 'تحتاج متابعة', 'ملغاة', 'يوجد دليل إنجاز'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function TaskTable({ tasks, onEdit, onDelete, getStatusStyle, getPriorityStyle, canEdit, canDelete, renderSmartLinks }: any) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>التاريخ</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>المهمة</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>الحالة والأدلة</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>المصدر والأرشفة</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>الأولوية</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748B', fontWeight: 800 }}>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task: DailyTask) => {
            const status = getStatusStyle(task.status);
            const priority = getPriorityStyle(task.priority);
            return (
              <tr key={task.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="hover-row">
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{task.taskDate}</p>
                  <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: 0 }}>{task.month}</p>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.65rem', background: '#F1F5F9', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#64748B', fontWeight: 700 }}>{task.category}</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F2044', margin: '0.2rem 0 0' }}>{task.title}</p>
                  {renderSmartLinks(task.title)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      background: status.bg, color: status.text, padding: '0.3rem 0.75rem', 
                      borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 
                    }}>
                      {status.icon} {task.status}
                    </span>
                    {task.evidenceUrl && (
                      <a href={task.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00B4D8', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                        <LinkIcon size={12} /> {task.evidenceLabel || 'رابط الدليل'}
                      </a>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                      <FileText size={12} /> {task.source}
                    </div>
                    {task.sourceSheet && (
                      <div style={{ fontSize: '0.65rem', marginTop: '0.2rem', opacity: 0.8 }}>
                        ورقة: {task.sourceSheet} | سطر: {task.sourceRow}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: priority.color, fontWeight: 800, fontSize: '0.75rem' }}>{priority.label}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {canEdit && (
                      <button onClick={() => onEdit(task)} style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#64748B' }}>
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => onDelete(task.id)} style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #FEE2E2', background: '#fff', cursor: 'pointer', color: '#EF4444' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaskForm({ task, onSave, onClose }: { task: DailyTask | null; onSave: (t: DailyTask) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<DailyTask>>(task || {
    title: '', description: '', taskDate: format(new Date(), 'yyyy-MM-dd'),
    month: MONTHS[new Date().getMonth() === 8 ? 0 : new Date().getMonth()],
    academicYear: '2025-2026', category: 'الاجتماعات', status: 'قيد التنفيذ',
    priority: 'متوسطة', completionPercentage: 0, taskType: 'يومية',
    source: 'إدخال يدوي', executorName: 'أحمد عادل طبيشات'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: task?.id || generateId(),
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as DailyTask);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{task ? 'تعديل مهمة' : 'إضافة مهمة يومية'}</h3>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.4rem', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>عنوان المهمة</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem' }} placeholder="أدخل عنوان المهمة باختصار..." />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>وصف المهمة</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem' }} placeholder="أدخل تفاصيل إضافية..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>التاريخ</label>
              <input type="date" required value={formData.taskDate} onChange={(e) => setFormData({...formData, taskDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>الشهر</label>
              <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>التصنيف</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                {TASK_CATEGORIES.map(c => <option key={c.id} value={c.nameAr}>{c.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>الحالة</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as TaskStatus})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                {['مكتملة', 'قيد التنفيذ', 'مؤجلة', 'تحتاج متابعة', 'ملغاة', 'يوجد دليل إنجاز'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>الأولوية</label>
              <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                <option value="عالية">عالية 🔥</option>
                <option value="متوسطة">متوسطة ⚡</option>
                <option value="منخفضة">منخفضة ✨</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>دليل الإنجاز (رابط)</label>
              <input type="url" value={formData.evidenceUrl} onChange={(e) => setFormData({...formData, evidenceUrl: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.8rem 2rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#64748B' }}>إلغاء</button>
            <button type="submit" style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '12px', border: 'none', background: '#0F2044', 
              color: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '0 4px 6px -1px rgba(15,32,68,0.3)' 
            }}>
              <Save size={18} style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }} /> {task ? 'تحديث المهمة' : 'حفظ المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CalendarView({ tasks, currentDate, setCurrentDate, getStatusStyle }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddingStart = Array.from({ length: startDay }).map((_, i) => null);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
          {format(currentDate, 'MMMM yyyy', { locale: ar })}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={nextMonth} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}><ChevronRight size={20} /></button>
          <button onClick={() => setCurrentDate(new Date())} style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>اليوم</button>
          <button onClick={prevMonth} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', padding: '0.5rem' }}>{d}</div>
        ))}
        {paddingStart.map((_, i) => <div key={`p-${i}`} />)}
        {days.map(day => {
          const dayTasks = tasks.filter((t: DailyTask) => isSameDay(new Date(t.taskDate), day));
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} style={{ 
              minHeight: '130px', padding: '0.6rem', border: isToday ? '2px solid #00B4D8' : '1px solid #F1F5F9', 
              borderRadius: '16px', background: isToday ? '#F0F9FF' : '#fff', transition: 'all 0.2s',
              boxShadow: isToday ? '0 4px 6px -1px rgba(0,180,216,0.1)' : 'none'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.5rem', color: isToday ? '#00B4D8' : '#0F2044' }}>
                {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {dayTasks.map((t: DailyTask) => {
                  const style = getStatusStyle(t.status);
                  return (
                    <div key={t.id} style={{ 
                      fontSize: '0.6rem', padding: '0.25rem 0.5rem', borderRadius: '6px',
                      background: style.bg, color: style.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontWeight: 800, border: `1px solid ${style.text}15`
                    }} title={t.title}>
                      {t.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsDashboard({ tasks }: { tasks: DailyTask[] }) {
  const categoryData = useMemo(() => {
    const counts: any = {};
    tasks.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => b.value - a.value).slice(0, 8);
  }, [tasks]);

  const monthData = useMemo(() => {
    return MONTHS.map(m => ({
      name: m,
      tasks: tasks.filter(t => t.month === m).length,
      completed: tasks.filter(t => t.month === m && (t.status === 'مكتملة' || t.status === 'يوجد دليل إنجاز')).length
    }));
  }, [tasks]);

  return (
    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <BarChart3 size={20} color="#0F2044" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#0F2044' }}>توزيع المهام حسب التصنيف</h4>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#F8FAFC'}} />
              <Bar dataKey="value" fill="#0F2044" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <TrendingUp size={20} color="#10B981" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#0F2044' }}>مؤشر الإنجاز الشهري</h4>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#94A3B8" name="إجمالي المهام" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="completed" stroke="#10B981" name="المكتملة" strokeWidth={4} dot={{r: 5}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MonthlyReportView({ tasks, monthlyNotes, onSaveNote }: { tasks: DailyTask[]; monthlyNotes: MonthlyTaskNote[]; onSaveNote: (month: string, year: string, note: string) => void }) {
  const [selectedMonth, setSelectedMonth] = useState('أغسطس');
  const monthTasks = tasks.filter(t => t.month === selectedMonth);
  const currentYear = '2025-2026';
  
  const currentNote = monthlyNotes.find(n => n.month === selectedMonth && n.academicYear === currentYear);
  const [noteText, setNoteText] = useState(currentNote?.note || '');

  useEffect(() => {
    setNoteText(currentNote?.note || '');
  }, [selectedMonth, currentNote]);

  const handleSaveNote = () => {
    onSaveNote(selectedMonth, currentYear, noteText);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }} className="no-print">
        <label style={{ fontWeight: 800, fontSize: '0.9rem' }}>اختر الشهر للتقرير:</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', fontWeight: 700 }}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="أضف ملاحظات التقرير الشهري هنا..." 
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}
          />
          <button 
            onClick={handleSaveNote}
            style={{ 
              background: '#00B4D8', color: '#fff', border: 'none', padding: '0.6rem 1rem', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' 
            }}
          >
            حفظ الملاحظة
          </button>
        </div>

        <button onClick={() => window.print()} style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          background: '#0F2044', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', 
          borderRadius: '10px', cursor: 'pointer', fontWeight: 700 
        }}>
          <Printer size={18} /> طباعة التقرير
        </button>
      </div>

      <div className="printable-report" style={{ border: '1px solid #E2E8F0', padding: '4rem', background: '#fff', minHeight: '1000px', position: 'relative' }}>
        {/* Logos Placeholder */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <img src="/ministry-logo.png" alt="وزارة التعليم" style={{ height: '80px', objectFit: 'contain' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem' }}>مدرسة قطر للعلوم والتكنولوجيا</h2>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#64748B', margin: 0 }}>تقرير المهام الشهرية للمنسق</h3>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '80px', objectFit: 'contain' }} />
          </div>
        </div>

        <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', border: '1px solid #F1F5F9' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>اسم الموظف</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, margin: '0.2rem 0' }}>أحمد عادل طبيشات</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>الشهر</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, margin: '0.2rem 0' }}>{selectedMonth}</p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>العام الأكاديمي</p>
            <p style={{ fontSize: '1rem', fontWeight: 800, margin: '0.2rem 0' }}>2025-2026</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4rem' }}>
          <thead>
            <tr style={{ background: '#0F2044', color: '#fff' }}>
              <th style={{ padding: '1rem', border: '1px solid #E2E8F0', fontSize: '0.9rem', width: '150px' }}>التصنيف</th>
              <th style={{ padding: '1rem', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>المهمة المنجزة</th>
              <th style={{ padding: '1rem', border: '1px solid #E2E8F0', fontSize: '0.9rem', width: '120px' }}>الحالة</th>
              <th style={{ padding: '1rem', border: '1px solid #E2E8F0', fontSize: '0.9rem', width: '200px' }}>دليل الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            {monthTasks.map(t => (
              <tr key={t.id}>
                <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', fontWeight: 700 }}>{t.category}</td>
                <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>{t.title}</td>
                <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', textAlign: 'center' }}>{t.status}</td>
                <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>{t.evidenceUrl || t.evidenceLabel || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {currentNote && (
          <div style={{ marginBottom: '4rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', borderBottom: '2px solid #0F2044', paddingBottom: '0.5rem', marginBottom: '1rem' }}>ملاحظات وتوصيات الشهر:</h4>
            <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem', lineHeight: 1.6, color: '#1E293B' }}>
              {currentNote.note}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6rem' }}>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem' }}>توقيع الموظف</p>
            <p style={{ fontSize: '0.9rem' }}>أحمد عادل طبيشات</p>
          </div>
          <div style={{ textAlign: 'center', width: '250px' }}>
            <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem' }}>توقيع النائب الأكاديمي</p>
            <p style={{ fontSize: '0.9rem' }}>د. راني التوم</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementGuideView({ tasks, getStatusStyle }: { tasks: DailyTask[]; getStatusStyle: any }) {
  const evidenceTasks = tasks.filter(t => t.status === 'يوجد دليل إنجاز' || t.evidenceUrl || t.evidenceFileUrl);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <BadgeCheck size={28} color="#00B4D8" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>دليل الإنجاز - الأرشفة الرقمية</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {evidenceTasks.map(t => (
          <div key={t.id} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1.5rem', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800 }}>{t.taskDate}</span>
              <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 900 }}>شاهد رقمي</span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.75rem', lineHeight: 1.4 }}>{t.title}</h4>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '1.25rem', padding: '0.5rem', background: '#F8FAFC', borderRadius: '8px' }}>
              {t.category}
            </div>
            {t.evidenceUrl && (
              <a href={t.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ 
                display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                padding: '0.75rem', background: '#00B4D8', borderRadius: '12px', textDecoration: 'none', textAlign: 'center', justifyContent: 'center'
              }}>
                <ExternalLink size={16} /> فتح الرابط الإلكتروني
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowUpFormsView({ forms, onSelect, onEdit, onDelete, onAdd, canManage }: any) {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>أرشفة استمارات متابعة منسق المشاريع</h3>
        {canManage && (
          <button 
            onClick={onAdd}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F2044', color: '#fff', 
              border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' 
            }}
          >
            <Plus size={18} /> إنشاء استمارة تقييم جديدة
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {forms.map((form: CoordinatorFollowUpForm) => (
          <div key={form.id} style={{ border: '1px solid #E2E8F0', borderRadius: '24px', overflow: 'hidden', background: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '1.25rem', background: '#0F2044', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0, fontWeight: 700 }}>تقرير تقييم المنسق</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{form.month} {form.academicYear}</p>
              </div>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>{Math.round(form.totalScore)}%</span>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Star size={14} color="#F59E0B" /> التوصيات المقترحة:
                </p>
                <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, margin: 0, padding: '0.75rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  {form.recommendations || 'لا توجد توصيات مسجلة'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  onClick={() => onSelect(form)}
                  style={{ 
                    flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #0F2044', color: '#0F2044',
                    background: 'none', padding: '0.6rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', justifyContent: 'center'
                  }}
                >
                  <FileText size={16} /> التفاصيل
                </button>
                {canManage && (
                  <>
                    <button 
                      onClick={() => onEdit(form)}
                      style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#64748B' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(form.id)}
                      style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #FEE2E2', background: '#fff', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { onSelect(form); setTimeout(() => window.print(), 300); }}
                  style={{ padding: '0.6rem', borderRadius: '10px', border: '1px solid #0F2044', background: '#fff', cursor: 'pointer', color: '#0F2044' }}
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowUpFormEditor({ form, onSave, onClose }: { form: CoordinatorFollowUpForm | null; onSave: (f: CoordinatorFollowUpForm) => void; onClose: () => void }) {
  const defaultItems: CoordinatorFollowUpItem[] = [
    { criterion: 'توظيف الأنظمة والمنصات التعليمية (قطر للتعليم، تيمز، إلخ)', score: 0 },
    { criterion: 'المتابعة التقنية والدعم الفني للمعلمين والطلاب', score: 0 },
    { criterion: 'دقة وجودة التقارير الشهرية المرفوعة للقيادة', score: 0 },
    { criterion: 'المبادرات الابتكارية والمشاريع التطويرية الرقمية', score: 0 },
    { criterion: 'الالتزام بالمهام الوظيفية والجدول الزمني للإنجاز', score: 0 },
    { criterion: 'التعاون مع الهيئة الإدارية والتدريسية والقيادة', score: 0 },
  ];

  const [formData, setFormData] = useState<Partial<CoordinatorFollowUpForm>>(form || {
    month: MONTHS[new Date().getMonth()],
    academicYear: '2025-2026',
    items: defaultItems,
    recommendations: '',
    evaluatorName: 'د. راني التوم',
    evaluatorRole: 'النائب الأكاديمي'
  });

  const handleScoreChange = (index: number, score: number) => {
    const newItems = [...(formData.items || [])];
    newItems[index].score = score;
    const total = newItems.reduce((acc, item) => acc + item.score, 0);
    // Score is out of 100, assuming each of the 6 items is out of ~16.6 or just use percentage
    // Let's assume each item is out of 10 for simplicity, and total is (sum/60)*100
    const totalScore = (newItems.reduce((acc, item) => acc + item.score, 0) / (newItems.length * 10)) * 100;
    setFormData({ ...formData, items: newItems, totalScore });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: form?.id || generateId(),
      totalScore: formData.totalScore || 0,
    } as CoordinatorFollowUpForm);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '95vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{form ? 'تعديل تقييم المنسق' : 'إنشاء تقييم شهري جديد للمنسق'}</h3>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.4rem', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>الشهر</label>
              <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>العام الأكاديمي</label>
              <select value={formData.academicYear} onChange={(e) => setFormData({...formData, academicYear: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontWeight: 800, color: '#0F2044', marginBottom: '1rem', fontSize: '0.95rem' }}>معايير التقييم (من 10 نقاط لكل معيار):</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, flex: 1 }}>{item.criterion}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" min="0" max="10" step="0.5"
                      value={item.score} 
                      onChange={(e) => handleScoreChange(i, parseFloat(e.target.value))}
                      style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 900, color: '#00B4D8' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>التوصيات المقترحة</label>
            <textarea 
              rows={3} value={formData.recommendations} 
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})} 
              style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem' }} 
              placeholder="أدخل التوصيات الفنية والإدارية..." 
            />
          </div>

          <div style={{ background: '#F0F9FF', padding: '1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{ fontWeight: 800, color: '#0F2044' }}>إجمالي درجة التقييم:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00B4D8' }}>{Math.round(formData.totalScore || 0)}%</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.8rem 2rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#64748B' }}>إلغاء</button>
            <button type="submit" style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '12px', border: 'none', background: '#0F2044', 
              color: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '0 4px 6px -1px rgba(15,32,68,0.3)' 
            }}>
              <Save size={18} style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }} /> حفظ التقييم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormDetailsModal({ form, onClose }: { form: CoordinatorFollowUpForm; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>تفاصيل تقييم شهر {form.month}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '1rem', border: '1px solid #E2E8F0', textAlign: 'right', fontSize: '0.85rem' }}>المعيار</th>
                <th style={{ padding: '1rem', border: '1px solid #E2E8F0', textAlign: 'center', fontSize: '0.85rem', width: '100px' }}>التقييم</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '0.8rem', fontWeight: 700 }}>{item.criterion}</td>
                  <td style={{ padding: '0.8rem', border: '1px solid #E2E8F0', fontSize: '1rem', fontWeight: 900, textAlign: 'center', color: '#00B4D8' }}>{item.score}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F0F9FF' }}>
                <td style={{ padding: '1rem', border: '1px solid #E2E8F0', fontWeight: 900 }}>المجموع الكلي</td>
                <td style={{ padding: '1rem', border: '1px solid #E2E8F0', fontWeight: 900, textAlign: 'center', color: '#0F2044', fontSize: '1.1rem' }}>{Math.round(form.totalScore)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
