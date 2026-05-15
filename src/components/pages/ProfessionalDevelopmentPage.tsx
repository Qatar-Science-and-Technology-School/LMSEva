'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  GraduationCap, ClipboardList, Search, Filter, Plus, 
  Download, Printer, Edit2, Trash2, ExternalLink, 
  CheckCircle2, Clock, AlertCircle, FileText, BarChart3, 
  ChevronRight, ChevronLeft, Link as LinkIcon, BadgeCheck,
  TrendingUp, Users, UserPlus, BookOpen, Settings, Info,
  PieChart as PieChartIcon, Calendar, CheckSquare, X, Save,
  MoreHorizontal, FileDown, Layers, Target, MapPin, Award,
  Check, History, ListChecks, FileSpreadsheet, FilePlus,
  Eye, Share2, ShieldCheck, Zap, Activity, Monitor, Globe, 
  UserCheck, Briefcase, BarChart as BarChartIcon
} from 'lucide-react';
import { 
  SCHOOL_NAME, DESIGNER_CREDIT, ACADEMIC_YEARS, MONTHS, db, generateId, type User, getDeptName
} from '@/lib/data';
import { type Workshop, type PDAttendance, type PDEvidence, type IndividualPDRecord, type IndividualPDSkill } from '@/lib/pdData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ComposedChart, Scatter
} from 'recharts';

type TabType = 'overview' | 'all' | 'individual' | 'attendance' | 'evidence' | 'reports';

interface Props {
  currentUser: User;
}

export default function ProfessionalDevelopmentPage({ currentUser }: Props) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [individualRecords, setIndividualRecords] = useState<IndividualPDRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('2025-2026');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<IndividualPDRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIndFormOpen, setIsIndFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [editingIndividual, setEditingIndividual] = useState<IndividualPDRecord | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printType, setPrintType] = useState<'individual' | 'annual' | 'teacher_log'>('individual');

  const isAdmin = currentUser.role === 'admin';
  const isELearningCoord = currentUser.role === 'evaluator'; 
  const canEdit = isAdmin || isELearningCoord;
  const canDelete = isAdmin;

  useEffect(() => {
    setWorkshops(db.getWorkshops());
    setIndividualRecords(db.getIndividualPDRecords());
  }, []);

  const saveWorkshops = (newWorkshops: Workshop[]) => {
    setWorkshops(newWorkshops);
    db.saveWorkshops(newWorkshops);
  };

  const saveIndividualRecords = (newRecords: IndividualPDRecord[]) => {
    setIndividualRecords(newRecords);
    db.saveIndividualPDRecords(newRecords);
  };

  const filteredWorkshops = useMemo(() => {
    return workshops.filter(w => {
      const title = w.titleAr || w.nameAr || '';
      const trainer = w.facilitatorName || w.trainer || '';
      const obj = w.objectives || '';
      
      const matchesSearch = 
        title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        trainer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === 'all' || w.academicYear === filterYear;
      const matchesCategory = filterCategory === 'all' || w.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
      const matchesAudience = filterAudience === 'all' || (w.targetAudience || w.targetGroup || '').includes(filterAudience);
      
      return matchesSearch && matchesYear && matchesCategory && matchesStatus && matchesAudience;
    }).sort((a, b) => (b.workshopNumber || 0) - (a.workshopNumber || 0));
  }, [workshops, searchTerm, filterYear, filterCategory, filterStatus, filterAudience]);

  const filteredIndividual = useMemo(() => {
    return individualRecords.filter(r => {
      const name = r.traineeNameAr || '';
      const skill = r.skillProvided || '';
      const dept = r.department || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === 'all' || r.academicYear === filterYear;
      const matchesDept = filterDept === 'all' || r.department === filterDept;
      const matchesCategory = filterCategory === 'all' || r.skillCategory === filterCategory;
      
      return matchesSearch && matchesYear && matchesDept && matchesCategory;
    }).sort((a, b) => new Date(b.trainingDate).getTime() - new Date(a.trainingDate).getTime());
  }, [individualRecords, searchTerm, filterYear, filterDept, filterCategory]);

  // --- KPI Calculation ---
  const dashboardStats = useMemo(() => {
    const yearWorkshops = workshops.filter(w => w.academicYear === filterYear);
    const yearIndividual = individualRecords.filter(r => r.academicYear === filterYear);
    
    const total = yearWorkshops.length;
    const totalInd = yearIndividual.length;
    
    const teacherWorkshops = yearWorkshops.filter(w => (w.targetAudience || '').includes('معلم')).length;
    const studentWorkshops = yearWorkshops.filter(w => (w.targetAudience || '').includes('طلاب')).length;
    const adminWorkshops = yearWorkshops.filter(w => (w.targetAudience || '').includes('إداري')).length;
    
    const uniqueTeachersInd = new Set(yearIndividual.map(r => r.traineeNameAr)).size;
    
    const totalHours = yearWorkshops.reduce((acc, w) => acc + (parseFloat(w.hours) || 0), 0);
    const totalIndMinutes = yearIndividual.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    
    const categories = yearWorkshops.map(w => w.category).filter(Boolean);
    const topPlatform = categories.length > 0 
      ? [...categories].sort((a,b) => categories.filter(v => v===a).length - categories.filter(v => v===b).length).pop()
      : 'N/A';
      
    const months = yearWorkshops.map(w => w.month).filter(Boolean);
    const activeMonth = months.length > 0
      ? [...months].sort((a,b) => months.filter(v => v===a).length - months.filter(v => v===b).length).pop()
      : 'N/A';

    return {
      total, totalInd, uniqueTeachersInd, teacherWorkshops, studentWorkshops, adminWorkshops,
      totalHours, totalIndHours: Math.round(totalIndMinutes / 60), totalAttendance: yearWorkshops.reduce((acc, w) => acc + (w.attendanceCount || 0), 0),
      topPlatform, activeMonth
    };
  }, [workshops, individualRecords, filterYear]);

  // --- Charts Data ---
  const chartsData = useMemo(() => {
    const currentYearWorkshops = workshops.filter(w => w.academicYear === filterYear);
    const currentYearInd = individualRecords.filter(r => r.academicYear === filterYear);
    
    // 1. Monthly Distribution (Workshops + Individual)
    const monthlyData = MONTHS.map(m => ({
      name: m,
      workshops: currentYearWorkshops.filter(w => w.month === m).length,
      individual: currentYearInd.filter(r => r.month === m).length,
      total: currentYearWorkshops.filter(w => w.month === m).length + currentYearInd.filter(r => r.month === m).length
    }));

    // 2. Individual Skills Category
    const skillCatMap: Record<string, number> = {};
    currentYearInd.forEach(r => {
      if (r.skillCategory) skillCatMap[r.skillCategory] = (skillCatMap[r.skillCategory] || 0) + 1;
    });
    const skillCategoryData = Object.entries(skillCatMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // 3. Dept Distribution (Individual)
    const deptMap: Record<string, number> = {};
    currentYearInd.forEach(r => {
      if (r.department) deptMap[r.department] = (deptMap[r.department] || 0) + 1;
    });
    const deptIndData = Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    return { monthlyData, skillCategoryData, deptIndData };
  }, [workshops, individualRecords, filterYear]);

  const COLORS = ['#0F2044', '#00B4D8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'موثق': return { bg: '#D1FAE5', text: '#065F46', icon: <BadgeCheck size={14} /> };
      case 'تم التنفيذ': return { bg: '#DBEAFE', text: '#1E40AF', icon: <CheckCircle2 size={14} /> };
      case 'قيد التنفيذ': return { bg: '#FEF3C7', text: '#92400E', icon: <Clock size={14} /> };
      case 'يحتاج متابعة': return { bg: '#FEE2E2', text: '#991B1B', icon: <AlertCircle size={14} /> };
      default: return { bg: '#F1F5F9', text: '#64748B', icon: <Calendar size={14} /> };
    }
  };

  const handleSaveWorkshop = (w: Workshop) => {
    const exists = workshops.find(item => item.id === w.id);
    const newWorkshops = exists ? workshops.map(item => item.id === w.id ? w : item) : [w, ...workshops];
    saveWorkshops(newWorkshops);
    setIsFormOpen(false);
    setEditingWorkshop(null);
  };

  const handleDeleteWorkshop = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الورشة؟')) {
      const newWorkshops = workshops.filter(w => w.id !== id);
      saveWorkshops(newWorkshops);
    }
  };

  const handleSaveIndividual = (r: IndividualPDRecord) => {
    const exists = individualRecords.find(item => item.id === r.id);
    const newRecords = exists ? individualRecords.map(item => item.id === r.id ? r : item) : [r, ...individualRecords];
    saveIndividualRecords(newRecords);
    setIsIndFormOpen(false);
    setEditingIndividual(null);
  };

  const handleDeleteIndividual = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      const newRecords = individualRecords.filter(r => r.id !== id);
      saveIndividualRecords(newRecords);
    }
  };

  const exportToExcel = () => {
    if (activeTab === 'individual') {
      const headers = ['ID', 'Year', 'Month', 'Date', 'Teacher', 'Dept', 'Skill', 'Category', 'Trainer', 'Type', 'Status'];
      const rows = filteredIndividual.map(r => [
        r.id, r.academicYear, r.month, r.trainingDate, r.traineeNameAr, r.department, 
        r.skillProvided, r.skillCategory, r.trainerName, r.trainingType, r.signatureStatus
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Individual_PD_Report_${filterYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['ID', 'Workshop #', 'Title (AR)', 'Title (EN)', 'Year', 'Date', 'Trainer', 'Audience', 'Mode', 'Venue', 'Hours', 'Category', 'Status'];
      const rows = filteredWorkshops.map(w => [
        w.id, w.workshopNumber || '', w.titleAr || w.nameAr, w.titleEn || w.nameEn, w.academicYear, w.date || w.month, 
        w.facilitatorName || w.trainer, w.targetAudience || w.targetGroup, w.trainingMode || w.type, w.venue || w.location,
        w.hours, w.category, w.status
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Workshops_Report_${filterYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printReport = (type: 'individual' | 'annual') => {
    setPrintType(type);
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 500);
  };

  if (isPrintMode) {
    return (
      <div className="print-only" style={{ padding: '2rem', direction: 'rtl', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #0F2044', paddingBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>{SCHOOL_NAME}</h1>
          <h2 style={{ margin: '0.5rem 0' }}>تقرير التطوير المهني والتمكين الرقمي</h2>
          <h3>{printType === 'annual' ? `التقرير السنوي للعام الأكاديمي ${filterYear}` : `تقرير ورشة عمل: ${selectedWorkshop?.titleAr || selectedWorkshop?.nameAr}`}</h3>
        </div>

        {printType === 'individual' && selectedWorkshop && (
          <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div><strong>اسم الورشة:</strong> {selectedWorkshop.titleAr || selectedWorkshop.nameAr}</div>
              <div><strong>التاريخ:</strong> {selectedWorkshop.date || selectedWorkshop.month}</div>
              <div><strong>المدرب:</strong> {selectedWorkshop.facilitatorName || selectedWorkshop.trainer}</div>
              <div><strong>المكان:</strong> {selectedWorkshop.venue || selectedWorkshop.location}</div>
              <div><strong>الفئة المستهدفة:</strong> {selectedWorkshop.targetAudience || selectedWorkshop.targetGroup}</div>
              <div><strong>المدة:</strong> {selectedWorkshop.hours} ساعة</div>
            </div>

            <section style={{ marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid #ddd' }}>الأهداف:</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedWorkshop.objectives}</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid #ddd' }}>أهم النقاط والمحاور:</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedWorkshop.keyPoints}</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid #ddd' }}>التوصيات:</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedWorkshop.recommendations}</p>
            </section>

            <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
              <div><p><strong>مقدم الورشة</strong></p><div style={{ height: '60px' }}></div><p>................................</p></div>
              <div><p><strong>النائب الأكاديمي</strong></p><div style={{ height: '60px' }}></div><p>................................</p></div>
              <div><p><strong>مدير المدرسة</strong></p><div style={{ height: '60px' }}></div><p>................................</p></div>
            </div>
          </div>
        )}

        {printType === 'teacher_log' && selectedIndividual && (
          <div style={{ fontSize: '1.1rem', lineHeight: '2' }}>
            <div style={{ border: '1px solid #000', padding: '2rem', borderRadius: '10px' }}>
              <h3 style={{ textAlign: 'center', textDecoration: 'underline', marginBottom: '2rem' }}>سجل توثيق الدعم والتمكين الرقمي الفردي</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div><strong>اسم المعلم:</strong> {selectedIndividual.traineeNameAr}</div>
                <div><strong>القسم:</strong> {selectedIndividual.department}</div>
                <div><strong>المهارة المقدمة:</strong> {selectedIndividual.skillProvided}</div>
                <div><strong>تصنيف المهارة:</strong> {selectedIndividual.skillCategory}</div>
                <div><strong>تاريخ التدريب:</strong> {selectedIndividual.trainingDate}</div>
                <div><strong>المدة:</strong> {selectedIndividual.durationMinutes} دقيقة</div>
                <div><strong>المدرب:</strong> {selectedIndividual.trainerName}</div>
                <div><strong>طريقة الدعم:</strong> {selectedIndividual.deliveryMethod}</div>
              </div>
              
              {selectedIndividual.notes && (
                <div style={{ marginTop: '2rem' }}>
                  <strong>ملاحظات التنفيذ:</strong>
                  <p style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>{selectedIndividual.notes}</p>
                </div>
              )}

              <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center' }}>
                <div><p><strong>توقيع المعلم</strong></p><div style={{ height: '50px' }}></div><p>................................</p></div>
                <div><p><strong>توقيع المدرب</strong></p><div style={{ height: '50px' }}></div><p>................................</p></div>
              </div>
            </div>
          </div>
        )}

        {printType === 'annual' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>#</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>الورشة</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>المدرب</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>التاريخ</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>المستهدفون</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>الساعات</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkshops.map((w, idx) => (
                <tr key={w.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{w.titleAr || w.nameAr}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{w.facilitatorName || w.trainer}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{w.date || w.month}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{w.targetAudience || w.targetGroup}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{w.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', direction: 'rtl', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>التطوير المهني والتمكين الرقمي</h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 500 }}>توثيق ومتابعة ورش التطوير المهني والتمكين الرقمي للعام الأكاديمي 2025-2026</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {canEdit && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => { setEditingWorkshop(null); setIsFormOpen(true); }} 
                className="btn-primary-gradient" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, border: 'none', color: '#fff' }}
              >
                <Plus size={20} /> ورشة عمل
              </button>
              <button 
                onClick={() => { setEditingIndividual(null); setIsIndFormOpen(true); }} 
                className="btn-secondary-gradient" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, border: 'none', color: '#fff', background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' }}
              >
                <UserPlus size={20} /> تدريب فردي
              </button>
            </div>
          )}
          <button 
            onClick={exportToExcel} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff', color: '#0F2044', border: '1px solid #E2E8F0', padding: '0.8rem 1.25rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 700 }}
          >
            <FileSpreadsheet size={20} /> تصدير البيانات
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <KPICard label="إجمالي الورش الجماعية" value={dashboardStats.total} icon={<BookOpen size={24} />} color="#0F2044" trend="العدد الكلي" />
        <KPICard label="إجمالي جلسات التدريب الفردي" value={dashboardStats.totalInd} icon={<UserCheck size={24} />} color="#00B4D8" trend="دعم مباشر" />
        <KPICard label="المعلمون المستفيدون (فردي)" value={dashboardStats.uniqueTeachersInd} icon={<Users size={24} />} color="#10B981" trend="أثر تدريبي" />
        <KPICard label="إجمالي ساعات التدريب (جماعي)" value={dashboardStats.totalHours} icon={<Clock size={24} />} color="#F59E0B" trend="ساعة" />
        <KPICard label="إجمالي ساعات الدعم (فردي)" value={dashboardStats.totalIndHours} icon={<Activity size={24} />} color="#6366F1" trend="ساعة" />
        <KPICard label="أكثر شهر نشاطاً" value={dashboardStats.activeMonth} icon={<Calendar size={24} />} color="#F43F5E" trend="نشاط مكثف" />
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.25rem', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10, paddingTop: '0.5rem' }}>
        {[
          { id: 'overview', label: 'لوحة التحكم والتحليلات', icon: <BarChart3 size={18} /> },
          { id: 'all', label: 'ورش العمل الجماعية', icon: <ClipboardList size={18} /> },
          { id: 'individual', label: 'التطوير الفردي للمعلمين', icon: <UserPlus size={18} /> },
          { id: 'attendance', label: 'سجلات الحضور', icon: <ListChecks size={18} /> },
          { id: 'evidence', label: 'الأدلة والتقارير', icon: <FileText size={18} /> },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as TabType)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 1.8rem', 
              background: activeTab === tab.id ? 'rgba(15,32,68,0.05)' : 'transparent', 
              color: activeTab === tab.id ? '#0F2044' : '#64748B', 
              border: 'none', borderBottom: activeTab === tab.id ? '4px solid #0F2044' : '4px solid transparent', 
              cursor: 'pointer', fontWeight: activeTab === tab.id ? 900 : 600, fontSize: '1rem', 
              transition: 'all 0.2s ease', borderRadius: '12px 12px 0 0' 
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', minHeight: '600px' }}>
        {activeTab === 'overview' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2.5rem' }}>
            <ChartCard title="توزيع النشاط التدريبي شهرياً" icon={<Activity size={18} />}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={700} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workshops" name="ورش جماعية" fill="#0F2044" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="individual" name="تدريب فردي" fill="#00B4D8" radius={[4, 4, 0, 0]} barSize={25} />
                  <Line type="monotone" dataKey="total" name="الإجمالي" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="أبرز المهارات المقدمة (فردي)" icon={<Monitor size={18} />}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartsData.skillCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} fontSize={10} fontWeight={800} />
                  <Tooltip />
                  <Bar dataKey="value" name="عدد الجلسات" fill="#10B981" radius={[0, 10, 10, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="توزيع الدعم الفردي حسب الأقسام" icon={<Users size={18} />}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartsData.deptIndData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                    {chartsData.deptIndData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="أكثر المهارات طلباً هذا العام" icon={<TrendingUp size={18} />}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartsData.skillCategoryData.slice(0, 6)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" fontSize={10} fontWeight={700} />
                  <Radar name="التكرار" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        ) : activeTab === 'individual' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="بحث عن معلم، مهارة، قسم..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '1rem 3.5rem 1rem 1.5rem', borderRadius: '18px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '1rem', fontWeight: 600 }} 
                />
              </div>
              <FilterSelect value={filterYear} onChange={setFilterYear} options={['all', ...ACADEMIC_YEARS]} label="العام الدراسي" />
              <FilterSelect value={filterDept} onChange={setFilterDept} options={['all', ...Array.from(new Set(individualRecords.map(r => r.department)))]} label="القسم" />
              <FilterSelect value={filterCategory} onChange={setFilterCategory} options={['all', ...Array.from(new Set(individualRecords.map(r => r.skillCategory)))]} label="نوع المهارة" />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    {['التاريخ', 'اسم المعلم', 'القسم', 'المهارة المقدمة', 'التصنيف', 'المدرب', 'الحالة', 'الإجراءات'].map(h => (
                      <th key={h} style={{ padding: '1.5rem 1rem', fontSize: '0.9rem', color: '#64748B', fontWeight: 900 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredIndividual.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="table-row">
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 700, color: '#64748B' }}>{r.trainingDate}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ fontWeight: 900, color: '#0F2044' }}>{r.traineeNameAr}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{r.sourceType}</div>
                      </td>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>{r.department}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#00B4D8' }}>{r.skillProvided}</div>
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', background: '#F1F5F9', fontSize: '0.8rem', fontWeight: 700 }}>{r.skillCategory}</span>
                      </td>
                      <td style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>{r.trainerName}</td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, background: r.signatureStatus === 'تم التوقيع' ? '#D1FAE5' : '#FEE2E2', color: r.signatureStatus === 'تم التوقيع' ? '#065F46' : '#991B1B' }}>
                          {r.signatureStatus === 'تم التوقيع' ? <CheckCircle2 size={14} /> : <Clock size={14} />} {r.signatureStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => { setEditingIndividual(r); setIsIndFormOpen(true); }} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#1E40AF' }}><Edit2 size={16} /></button>
                          <button onClick={() => { setSelectedIndividual(r); }} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#0F2044' }}><Eye size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="بحث عن ورشة، مدرب، هدف..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '1rem 3.5rem 1rem 1.5rem', borderRadius: '18px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '1rem', fontWeight: 600 }} 
                />
              </div>
              <FilterSelect value={filterYear} onChange={setFilterYear} options={['all', ...ACADEMIC_YEARS]} label="العام الدراسي" />
              <FilterSelect value={filterAudience} onChange={setFilterAudience} options={['all', 'المعلمون', 'الطلاب', 'الإداريين']} label="الفئة المستهدفة" />
              <FilterSelect value={filterCategory} onChange={setFilterCategory} options={['all', ...Array.from(new Set(workshops.map(w => w.category)))]} label="التصنيف" />
              <FilterSelect value={filterStatus} onChange={setFilterStatus} options={['all', 'موثق', 'تم التنفيذ', 'قيد التنفيذ', 'يحتاج متابعة']} label="الحالة" />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    {['#', 'الورشة', 'المدرب/الجهة', 'التاريخ/الساعات', 'المستهدفون', 'الحالة', 'الإجراءات'].map(h => (
                      <th key={h} style={{ padding: '1.5rem 1rem', fontSize: '0.9rem', color: '#64748B', fontWeight: 900 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkshops.map((w, idx) => { 
                    const s = getStatusStyle(w.status); 
                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="table-row">
                        <td style={{ padding: '1.5rem 1rem', fontWeight: 900, color: '#94A3B8' }}>{w.workshopNumber || idx + 1}</td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 900, color: '#0F2044', fontSize: '1.1rem' }}>{w.titleAr || w.nameAr}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{w.category} | {w.id}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 800 }}>{w.facilitatorName || w.trainer}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{w.organizerName || w.entity}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 700 }}>{w.date || w.month}</div>
                          <div style={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.85rem' }}>{w.hours} ساعة</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>{w.targetAudience || w.targetGroup}</td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '12px', fontWeight: 900, background: s.bg, color: s.text }}>
                            {s.icon} {w.status}
                          </span>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button onClick={() => setSelectedWorkshop(w)} style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }} title="عرض التفاصيل"><Eye size={18} /></button>
                            {canEdit && <button onClick={() => { setEditingWorkshop(w); setIsFormOpen(true); }} style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#1E40AF' }} title="تعديل"><Edit2 size={18} /></button>}
                            {canDelete && <button onClick={() => handleDeleteWorkshop(w.id)} style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid #FEE2E2', background: '#fff', cursor: 'pointer', color: '#EF4444' }} title="حذف"><Trash2 size={18} /></button>}
                          </div>
                        </td>
                      </tr>
                    ); 
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedWorkshop && (
        <WorkshopModal 
          workshop={selectedWorkshop} 
          onClose={() => setSelectedWorkshop(null)} 
          onEdit={() => { setEditingWorkshop(selectedWorkshop); setIsFormOpen(true); setSelectedWorkshop(null); }} 
          onPrint={() => printReport('individual')}
          canEdit={canEdit} 
        />
      )}
      
      {selectedIndividual && (
        <IndividualPDModal 
          record={selectedIndividual} 
          onClose={() => setSelectedIndividual(null)} 
          onEdit={() => { setEditingIndividual(selectedIndividual); setIsIndFormOpen(true); setSelectedIndividual(null); }} 
          onPrint={() => { setPrintType('teacher_log'); setIsPrintMode(true); setTimeout(() => { window.print(); setIsPrintMode(false); }, 500); }}
          canEdit={canEdit} 
        />
      )}
      
      {isIndFormOpen && (
        <IndividualPDForm 
          record={editingIndividual} 
          onSave={handleSaveIndividual} 
          onClose={() => setIsIndFormOpen(false)} 
        />
      )}

      {isFormOpen && (
        <WorkshopForm 
          workshop={editingWorkshop} 
          onSave={handleSaveWorkshop} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      <style jsx>{`
        .btn-primary-gradient { background: linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%); transition: all 0.3s ease; }
        .btn-primary-gradient:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,32,68,0.2); }
        .table-row:hover { background: #F8FAFC; }
        @media print {
          .print-only { display: block !important; }
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function KPICard({ label, value, icon, color, trend }: any) {
  return (
    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, marginBottom: '0.5rem' }}>{label}</p>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{value}</h3>
        </div>
        <div style={{ background: `${color}15`, padding: '0.8rem', borderRadius: '16px', color: color }}>
          {icon}
        </div>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
        <Activity size={14} /> {trend}
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ padding: '0.6rem', borderRadius: '12px', background: '#F8FAFC', color: '#0F2044' }}>{icon}</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FilterSelect({ value, onChange, options, label }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8' }}>{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ padding: '0.9rem 1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', fontWeight: 800, background: '#fff', cursor: 'pointer', outline: 'none' }}
      >
        {options.map((opt: string) => <option key={opt} value={opt}>{opt === 'all' ? 'الكل' : opt}</option>)}
      </select>
    </div>
  );
}

function WorkshopModal({ workshop, onClose, onEdit, onPrint, canEdit }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: '1100px', maxHeight: '90vh', background: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '2rem 3rem', background: '#0F2044', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>{workshop.titleAr || workshop.nameAr}</h2>
            <p style={{ opacity: 0.8, fontSize: '0.9rem', marginTop: '0.25rem' }}>{workshop.titleEn || workshop.nameEn || workshop.id}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onPrint} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '14px', padding: '0.7rem 1.2rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}><Printer size={20} /> طباعة التقرير</button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '14px', padding: '0.7rem', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
          </div>
        </div>
        <div style={{ padding: '3rem', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)', background: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
            <div>
              <DetailSection title="معلومات الورشة" icon={<Info size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                  <InfoItem label="المدرب" value={workshop.facilitatorName || workshop.trainer} icon={<UserCheck size={18} />} />
                  <InfoItem label="الجهة المنظمة" value={workshop.organizerName || workshop.entity} icon={<Globe size={18} />} />
                  <InfoItem label="المكان" value={workshop.venue || workshop.location} icon={<MapPin size={18} />} />
                  <InfoItem label="الفئة المستهدفة" value={workshop.targetAudience || workshop.targetGroup} icon={<Target size={18} />} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div><h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} color="#00B4D8" /> الأهداف:</h5><div style={{ whiteSpace: 'pre-wrap', padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7' }}>{workshop.objectives || 'لا يوجد'}</div></div>
                  <div><h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={18} color="#00B4D8" /> المحاور الرئيسية:</h5><div style={{ whiteSpace: 'pre-wrap', padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7' }}>{workshop.keyPoints || 'لا يوجد'}</div></div>
                  <div><h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={18} color="#00B4D8" /> التوصيات والمتابعة:</h5><div style={{ whiteSpace: 'pre-wrap', padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7' }}>{workshop.recommendations || 'لا يوجد'}</div></div>
                </div>
              </DetailSection>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <DetailSection title="إحصائيات التنفيذ" icon={<BarChartIcon size={20} />}>
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                  <StatRow label="عدد الحضور" value={workshop.attendanceCount || 0} icon={<Users size={16} />} color="#0F2044" />
                  <StatRow label="الساعات التدريبية" value={workshop.hours} icon={<Clock size={16} />} color="#00B4D8" />
                  <StatRow label="تاريخ التنفيذ" value={workshop.date || workshop.month} icon={<Calendar size={16} />} color="#10B981" />
                  <StatRow label="طريقة التقديم" value={workshop.deliveryMethod || workshop.type} icon={<Monitor size={16} />} color="#F59E0B" />
                </div>
              </DetailSection>

              <DetailSection title="المرفقات والأدلة" icon={<FileText size={20} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <FileLink label="تقرير الورشة" file={workshop.reportFileName || workshop.sourceFile} icon={<FileText size={18} />} />
                  <FileLink label="سجل الحضور" file={workshop.attendanceFileName} icon={<ListChecks size={18} />} />
                  <FileLink label="الصور والوثائق" file={workshop.evidenceFileUrl || workshop.evidenceUrl} icon={<Layers size={18} />} />
                </div>
              </DetailSection>

              {canEdit && (
                <button 
                  onClick={onEdit} 
                  className="btn-primary-gradient" 
                  style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', fontWeight: 900, border: 'none', color: '#fff', cursor: 'pointer', marginTop: 'auto' }}
                >
                  <Edit2 size={20} /> تعديل البيانات
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, icon, children }: any) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderRight: '4px solid #00B4D8', paddingRight: '1rem' }}>
        <div style={{ color: '#0F2044' }}>{icon}</div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ background: '#0F204410', padding: '0.75rem', borderRadius: '12px', color: '#00B4D8' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700 }}>{label}</div>
        <div style={{ fontWeight: 900, color: '#0F2044' }}>{value || 'غير محدد'}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon, color }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#64748B', fontWeight: 700 }}>{icon} {label}</div>
      <div style={{ fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function FileLink({ label, file, icon }: any) {
  const exists = !!file && file !== '#';
  return (
    <div 
      style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', 
        borderRadius: '16px', background: exists ? '#fff' : '#FEE2E220', 
        border: `1px solid ${exists ? '#E2E8F0' : '#FECDD3'}`,
        cursor: exists ? 'pointer' : 'default'
      }}
      title={exists ? 'عرض الملف' : 'غير متوفر'}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: exists ? '#0F2044' : '#94A3B8', fontWeight: 800 }}>
        {icon} {label}
      </div>
      {exists ? <ExternalLink size={18} color="#00B4D8" /> : <X size={18} color="#EF4444" />}
    </div>
  );
}

function WorkshopForm({ workshop, onSave, onClose }: any) {
  const [fd, setFd] = useState<Partial<Workshop>>(workshop || { 
    id: `PD-2526-W${generateId().slice(0, 4)}`, 
    titleAr: '', 
    titleEn: '',
    academicYear: '2025-2026', 
    month: 'أغسطس', 
    trainingMode: 'جلسة تطويرية Hands on Session', 
    category: 'نظام قطر للتعليم', 
    targetAudience: 'المعلمون', 
    facilitatorName: '', 
    organizerName: SCHOOL_NAME, 
    venue: 'QSTSS', 
    objectives: '', 
    keyPoints: '', 
    recommendations: '', 
    status: 'تم التنفيذ', 
    hours: '2', 
    attendanceCount: 0, 
    updatedAt: new Date().toISOString() 
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 3rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <h3 style={{ fontWeight: 900, color: '#0F2044' }}>{workshop ? 'تعديل بيانات الورشة' : 'إضافة ورشة عمل جديدة'}</h3>
          <button onClick={onClose} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSave(fd as Workshop); }} style={{ padding: '2.5rem 3rem', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>عنوان الورشة (بالعربية)</FormLabel>
              <input value={fd.titleAr || fd.nameAr} onChange={e => setFd({...fd, titleAr: e.target.value})} className="form-input" required />
            </div>
            <div>
              <FormLabel>العام الدراسي</FormLabel>
              <select value={fd.academicYear} onChange={e => setFd({...fd, academicYear: e.target.value})} className="form-input">
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>عنوان الورشة (بالانجليزية)</FormLabel>
              <input value={fd.titleEn || fd.nameEn} onChange={e => setFd({...fd, titleEn: e.target.value})} className="form-input" />
            </div>
            <div>
              <FormLabel>التصنيف</FormLabel>
              <select value={fd.category} onChange={e => setFd({...fd, category: e.target.value})} className="form-input">
                <option value="نظام قطر للتعليم">نظام قطر للتعليم</option>
                <option value="الواقع الافتراضي">الواقع الافتراضي</option>
                <option value="الذكاء الاصطناعي">الذكاء الاصطناعي</option>
                <option value="التعلم عن بعد / Microsoft Teams">التعلم عن بعد / Microsoft Teams</option>
                <option value="Edpuzzle">Edpuzzle</option>
                <option value="ClassPoint">ClassPoint</option>
                <option value="Canva">Canva</option>
                <option value="الأمن السيبراني">الأمن السيبراني</option>
                <option value="البرمجة وMinecraft">البرمجة وMinecraft</option>
                <option value="السبورة التفاعلية">السبورة التفاعلية</option>
                <option value="تطوير مهني">تطوير مهني</option>
              </select>
            </div>
            
            <div style={{ borderTop: '1px solid #E2E8F0', gridColumn: 'span 3', margin: '1rem 0' }}></div>

            <div><FormLabel>المدرب</FormLabel><input value={fd.facilitatorName || fd.trainer} onChange={e => setFd({...fd, facilitatorName: e.target.value})} className="form-input" /></div>
            <div><FormLabel>الجهة المنظمة</FormLabel><input value={fd.organizerName || fd.entity} onChange={e => setFd({...fd, organizerName: e.target.value})} className="form-input" /></div>
            <div>
              <FormLabel>الفئة المستهدفة</FormLabel>
              <input 
                list="audience-list"
                value={fd.targetAudience || fd.targetGroup} 
                onChange={e => setFd({...fd, targetAudience: e.target.value})} 
                className="form-input" 
              />
              <datalist id="audience-list">
                <option value="المعلمون" />
                <option value="الطلاب" />
                <option value="الإداريين" />
                <option value="أولياء الأمور" />
              </datalist>
            </div>
            
            <div><FormLabel>تاريخ التنفيذ</FormLabel><input type="date" value={fd.date} onChange={e => setFd({...fd, date: e.target.value})} className="form-input" /></div>
            <div><FormLabel>عدد الساعات</FormLabel><input type="number" value={fd.hours} onChange={e => setFd({...fd, hours: e.target.value})} className="form-input" /></div>
            <div><FormLabel>الحالة</FormLabel>
              <select value={fd.status} onChange={e => setFd({...fd, status: e.target.value as any})} className="form-input">
                <option value="موثق">موثق</option>
                <option value="تم التنفيذ">تم التنفيذ</option>
                <option value="قيد التنفيذ">قيد التنفيذ</option>
                <option value="يحتاج متابعة">يحتاج متابعة</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 3' }}><FormLabel>الأهداف</FormLabel><textarea value={fd.objectives} onChange={e => setFd({...fd, objectives: e.target.value})} className="form-textarea" rows={3} /></div>
            <div style={{ gridColumn: 'span 3' }}><FormLabel>المحاور الرئيسية</FormLabel><textarea value={fd.keyPoints} onChange={e => setFd({...fd, keyPoints: e.target.value})} className="form-textarea" rows={3} /></div>
            <div style={{ gridColumn: 'span 3' }}><FormLabel>التوصيات والمتابعة</FormLabel><textarea value={fd.recommendations} onChange={e => setFd({...fd, recommendations: e.target.value})} className="form-textarea" rows={3} /></div>
          </div>
          
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '1rem 2.5rem', borderRadius: '15px', border: '1px solid #E2E8F0', fontWeight: 800, cursor: 'pointer', background: '#fff' }}>إلغاء</button>
            <button type="submit" style={{ padding: '1rem 4rem', background: '#0F2044', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>حفظ البيانات</button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .form-input { width: 100%; padding: 0.9rem; border-radius: 14px; border: 1px solid #E2E8F0; outline: none; transition: border 0.2s; font-weight: 600; }
        .form-input:focus { border-color: #00B4D8; }
        .form-textarea { width: 100%; padding: 0.9rem; border-radius: 14px; border: 1px solid #E2E8F0; outline: none; transition: border 0.2s; font-weight: 600; resize: vertical; }
        .form-textarea:focus { border-color: #00B4D8; }
      `}</style>
    </div>
  );
}

function IndividualPDModal({ record, onClose, onEdit, onPrint, canEdit }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: '800px', background: '#fff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem 2.5rem', background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>سجل تدريب فردي: {record.traineeNameAr}</h2>
            <p style={{ opacity: 0.9, fontSize: '0.8rem', marginTop: '0.2rem' }}>ID: {record.id}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', padding: '0.5rem', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '2.5rem', background: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <InfoItem label="المهارة" value={record.skillProvided} icon={<Zap size={18} />} />
            <InfoItem label="التصنيف" value={record.skillCategory} icon={<Layers size={18} />} />
            <InfoItem label="القسم" value={record.department} icon={<Users size={18} />} />
            <InfoItem label="المدرب" value={record.trainerName} icon={<UserCheck size={18} />} />
            <InfoItem label="التاريخ" value={record.trainingDate} icon={<Calendar size={18} />} />
            <InfoItem label="المدة" value={`${record.durationMinutes} دقيقة`} icon={<Clock size={18} />} />
            <InfoItem label="طريقة التقديم" value={record.deliveryMethod} icon={<Monitor size={18} />} />
            <InfoItem label="حالة التوثيق" value={record.signatureStatus} icon={<CheckCircle2 size={18} />} />
          </div>

          {record.notes && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>ملاحظات:</h4>
              <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7' }}>{record.notes}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onPrint} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}><Printer size={20} /> طباعة السجل</button>
            {canEdit && <button onClick={onEdit} className="btn-primary-gradient" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '14px', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}><Edit2 size={20} /> تعديل البيانات</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function IndividualPDForm({ record, onSave, onClose }: any) {
  const { classifyIndividualSkill } = require('@/lib/pdData');
  const [fd, setFd] = useState<Partial<IndividualPDRecord>>(record || {
    id: `IND-2526-F${generateId().slice(0, 4)}`,
    academicYear: '2025-2026',
    month: 'سبتمبر',
    trainingDate: new Date().toISOString().split('T')[0],
    traineeNameAr: '',
    department: 'STEM',
    skillProvided: '',
    skillCategory: 'نظام قطر للتعليم',
    trainerName: 'أحمد طبيشات',
    trainerRole: 'منسق المشاريع الإلكترونية',
    trainingType: 'تدريب فردي',
    deliveryMethod: 'دعم مباشر',
    durationMinutes: 20,
    evidenceStatus: 'موثق',
    signatureStatus: 'تم التوقيع',
    sourceType: 'كشف تدريب فردي مرفق',
    createdBy: 'أحمد طبيشات',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleSkillChange = (val: string) => {
    setFd({
      ...fd,
      skillProvided: val,
      skillCategory: classifyIndividualSkill(val)
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <h3 style={{ fontWeight: 900, color: '#0F2044' }}>{record ? 'تعديل سجل تدريب فردي' : 'إضافة سجل تدريب فردي جديد'}</h3>
          <button onClick={onClose} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSave(fd as IndividualPDRecord); }} style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>اسم المعلم / الموظف</FormLabel>
              <input value={fd.traineeNameAr} onChange={e => setFd({...fd, traineeNameAr: e.target.value})} className="form-input" required />
            </div>
            <div>
              <FormLabel>القسم</FormLabel>
              <select value={fd.department} onChange={e => setFd({...fd, department: e.target.value})} className="form-input">
                {['اللغة العربية', 'التربية الإسلامية', 'الحاسوب', 'الرياضيات', 'اللغة الإنجليزية', 'STEM', 'مختبر الطاقة', 'مختبر التصنيع الرقمي', 'مختبر الروبوت', 'الدراسات الاجتماعية', 'الإرشاد الأكاديمي', 'مصادر التعلم', 'أخصائي أنشطة', 'الإداريين', 'أخرى'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <FormLabel>العام الدراسي</FormLabel>
              <select value={fd.academicYear} onChange={e => setFd({...fd, academicYear: e.target.value})} className="form-input">
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>المهارة / الدعم المقدم</FormLabel>
              <input value={fd.skillProvided} onChange={e => handleSkillChange(e.target.value)} className="form-input" required placeholder="مثال: Canva, Microsoft Teams, AI Tools..." />
            </div>
            <div>
              <FormLabel>تصنيف المهارة</FormLabel>
              <input value={fd.skillCategory} readOnly className="form-input" style={{ background: '#F8FAFC', color: '#64748B' }} />
            </div>
            <div>
              <FormLabel>الشهر</FormLabel>
              <select value={fd.month} onChange={e => setFd({...fd, month: e.target.value})} className="form-input">
                {['أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><FormLabel>التاريخ</FormLabel><input type="date" value={fd.trainingDate} onChange={e => setFd({...fd, trainingDate: e.target.value})} className="form-input" /></div>
            <div><FormLabel>المدة (بالدقائق)</FormLabel><input type="number" value={fd.durationMinutes} onChange={e => setFd({...fd, durationMinutes: parseInt(e.target.value)})} className="form-input" /></div>
            
            <div>
              <FormLabel>طريقة التقديم</FormLabel>
              <select value={fd.deliveryMethod} onChange={e => setFd({...fd, deliveryMethod: e.target.value as any})} className="form-input">
                <option value="دعم مباشر">دعم مباشر</option>
                <option value="عن بعد">عن بعد</option>
                <option value="حضوري">حضوري</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <FormLabel>الحالة</FormLabel>
              <select value={fd.signatureStatus} onChange={e => setFd({...fd, signatureStatus: e.target.value as any})} className="form-input">
                <option value="تم التوقيع">تم التوقيع</option>
                <option value="بانتظار التوقيع">بانتظار التوقيع</option>
                <option value="غير متوفر">غير متوفر</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>ملاحظات إضافية</FormLabel>
              <textarea value={fd.notes} onChange={e => setFd({...fd, notes: e.target.value})} className="form-textarea" rows={2} />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.8rem 2rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontWeight: 800, cursor: 'pointer', background: '#fff' }}>إلغاء</button>
            <button type="submit" style={{ padding: '0.8rem 3rem', background: '#0F2044', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>حفظ البيانات</button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .form-input { width: 100%; padding: 0.8rem; border-radius: 12px; border: 1px solid #E2E8F0; outline: none; transition: border 0.2s; font-weight: 600; }
        .form-input:focus { border-color: #00B4D8; }
        .form-textarea { width: 100%; padding: 0.8rem; border-radius: 12px; border: 1px solid #E2E8F0; outline: none; transition: border 0.2s; font-weight: 600; resize: vertical; }
        .form-textarea:focus { border-color: #00B4D8; }
      `}</style>
    </div>
  );
}

function FormLabel({ children }: any) {
  return <label style={{ display: 'block', fontWeight: 900, marginBottom: '0.5rem', color: '#0F2044', fontSize: '0.85rem' }}>{children}</label>;
}
