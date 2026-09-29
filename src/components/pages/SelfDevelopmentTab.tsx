'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Monitor,
  Briefcase,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Check,
  Eye,
  FileText,
  TrendingUp,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  SelfDevelopmentRecord,
  SelfDevelopmentCategory,
  SelfDevelopmentStatus,
  SELF_DEV_CATEGORIES,
  SELF_DEV_STATUS_CONFIG,
  loadSelfDevelopmentRecords,
  saveSelfDevelopmentRecords,
  resetSelfDevelopmentRecords,
  calculateSelfDevelopmentStats,
  INITIAL_SELF_DEVELOPMENT_RECORDS,
} from '@/lib/selfDevelopmentData';
import {
  printComprehensiveSelfDevelopmentReport,
  printSingleSelfDevelopmentCard,
} from '@/lib/selfDevelopmentReportPrinter';
import { syncOperationalPlan } from '@/lib/operationalPlanData';

interface Props {
  academicYear?: string;
  canEdit?: boolean;
}

export default function SelfDevelopmentTab({
  academicYear = '2026-2027',
  canEdit = true,
}: Props) {
  const [records, setRecords] = useState<SelfDevelopmentRecord[]>(() =>
    loadSelfDevelopmentRecords(academicYear)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(academicYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SelfDevelopmentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<SelfDevelopmentRecord>>({
    coordinatorName: 'م. أحمد عادل طبيشات',
    role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
    title: '',
    titleEn: '',
    issuer: '',
    category: 'الذكاء الاصطناعي والحلول الرقمية',
    hours: 20,
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: 'سارية المفعول',
    academicYear: '2026-2027',
    status: 'معتمدة وسارية',
    credentialId: '',
    credentialUrl: '',
    skillsAcquired: [],
    impactOnWork: '',
    notes: '',
  });

  const [skillsText, setSkillsText] = useState('');

  // استماع لأي تحديث خارجي للسجلات
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(loadSelfDevelopmentRecords(selectedYear));
    };
    window.addEventListener('qstss_self_development_updated', handleUpdate);
    return () => window.removeEventListener('qstss_self_development_updated', handleUpdate);
  }, [selectedYear]);

  // تحديث الخطة الإجرائية تلقائياً عند تغيير السجلات
  const triggerOperationalPlanSync = async () => {
    try {
      await syncOperationalPlan(null, selectedYear);
    } catch (e) {
      console.warn('Failed to auto-sync operational plan after self-dev update:', e);
    }
  };

  // تصفية السجلات
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch =
        !searchTerm.trim() ||
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.titleEn && rec.titleEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        rec.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.skillsAcquired && rec.skillsAcquired.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesYear = selectedYear === 'all' || rec.academicYear === selectedYear;
      const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;

      return matchesSearch && matchesYear && matchesCategory && matchesStatus;
    });
  }, [records, searchTerm, selectedYear, selectedCategory, selectedStatus]);

  // الإحصاءات العامة
  const stats = useMemo(() => calculateSelfDevelopmentStats(filteredRecords), [filteredRecords]);

  // تجهيز بيانات الرسوم البيانية
  const categoryChartData = useMemo(() => {
    return stats.categoryStats.map(c => ({
      name: c.name,
      value: c.count,
      hours: c.hours,
      color: c.color,
    }));
  }, [stats.categoryStats]);

  const issuerChartData = useMemo(() => {
    return stats.issuerStats.slice(0, 6).map(it => ({
      name: it.issuer.length > 22 ? it.issuer.substring(0, 20) + '...' : it.issuer,
      hours: it.hours,
      count: it.count,
    }));
  }, [stats.issuerStats]);

  // فتح نموذج الإضافة
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      coordinatorName: 'م. أحمد عادل طبيشات',
      role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
      title: '',
      titleEn: '',
      issuer: '',
      category: 'الذكاء الاصطناعي والحلول الرقمية',
      hours: 25,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: 'سارية المفعول',
      academicYear: selectedYear === 'all' ? '2026-2027' : selectedYear,
      status: 'معتمدة وسارية',
      credentialId: '',
      credentialUrl: '',
      skillsAcquired: [],
      impactOnWork: '',
      notes: '',
    });
    setSkillsText('');
    setIsModalOpen(true);
  };

  // فتح نموذج التعديل
  const handleOpenEditModal = (rec: SelfDevelopmentRecord) => {
    setEditingRecord(rec);
    setFormData({ ...rec });
    setSkillsText(Array.isArray(rec.skillsAcquired) ? rec.skillsAcquired.join('\n') : '');
    setIsModalOpen(true);
  };

  // حفظ السجل (إضافة أو تعديل)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.issuer) {
      alert('يرجى إدخال اسم الشهادة/الدورة والجهة المانحة.');
      return;
    }

    setIsSubmitting(true);
    const parsedSkills = skillsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    let updatedList: SelfDevelopmentRecord[];
    if (editingRecord) {
      // تعديل
      updatedList = records.map(r =>
        r.id === editingRecord.id
          ? {
              ...r,
              ...formData,
              skillsAcquired: parsedSkills,
              hours: Number(formData.hours) || 1,
              updatedAt: now,
            } as SelfDevelopmentRecord
          : r
      );
    } else {
      // إضافة جديدة
      const newRec: SelfDevelopmentRecord = {
        id: `sdev_${Date.now()}`,
        coordinatorName: 'م. أحمد عادل طبيشات',
        role: 'منسق المشاريع الإلكترونية والحلول الرقمية',
        title: formData.title || '',
        titleEn: formData.titleEn || '',
        issuer: formData.issuer || '',
        category: (formData.category as SelfDevelopmentCategory) || 'الذكاء الاصطناعي والحلول الرقمية',
        hours: Number(formData.hours) || 1,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        expiryDate: formData.expiryDate || 'سارية المفعول',
        academicYear: formData.academicYear || selectedYear || '2026-2027',
        status: (formData.status as SelfDevelopmentStatus) || 'معتمدة وسارية',
        credentialId: formData.credentialId || '',
        credentialUrl: formData.credentialUrl || '',
        skillsAcquired: parsedSkills,
        impactOnWork: formData.impactOnWork || '',
        notes: formData.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [newRec, ...records];
    }

    setRecords(updatedList);
    saveSelfDevelopmentRecords(updatedList, selectedYear);
    await triggerOperationalPlanSync();

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  // حذف السجل
  const handleDeleteRecord = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الشهادة / الدورة:\n"${title}"؟`)) {
      return;
    }
    const updatedList = records.filter(r => r.id !== id);
    setRecords(updatedList);
    saveSelfDevelopmentRecords(updatedList, selectedYear);
    await triggerOperationalPlanSync();
  };

  // استعادة الافتراضي
  const handleResetDefaults = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة السجل الافتراضي لكافة شهادات منسق المشاريع؟')) {
      return;
    }
    const reset = resetSelfDevelopmentRecords(selectedYear);
    setRecords(reset);
    await triggerOperationalPlanSync();
  };

  // تصدير إكسل
  const handleExportExcel = () => {
    const exportRows = filteredRecords.map((r, i) => ({
      'م': i + 1,
      'اسم الشهادة / الدورة': r.title,
      'الاسم بالإنجليزية': r.titleEn || '',
      'الجهة المانحة': r.issuer,
      'المجال التخصصي': r.category,
      'الساعات التدريبية': r.hours,
      'تاريخ الإنجاز': r.issueDate,
      'تاريخ الانتهاء': r.expiryDate || 'سارية',
      'العام الأكاديمي': r.academicYear,
      'الحالة': r.status,
      'رقم الاعتماد': r.credentialId || '',
      'المهارات المكتسبة': r.skillsAcquired?.join('، ') || '',
      'الأثر على العمل والمشاريع': r.impactOnWork || '',
      'الملاحظات': r.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التطوير الذاتي - منسق المشاريع');
    XLSX.writeFile(wb, `Self_Development_Ahmed_Tubaishat_${selectedYear}.xlsx`);
  };

  // الطباعة الرسمية الشاملة
  const handlePrintReport = () => {
    printComprehensiveSelfDevelopmentReport(filteredRecords, {
      academicYear: selectedYear === 'all' ? '2026-2027' : selectedYear,
    });
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* ── Top Header Banner ── */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%)',
          color: '#fff',
          borderRadius: '24px',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(15,32,68,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                background: '#0284C7',
                color: '#fff',
                padding: '0.4rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={26} />
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: '#fff' }}>
              التطوير الذاتي والشهادات المهنية
            </h2>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#38BDF8',
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              منسق المشاريع الإلكترونية والحلول الرقمية فقط
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#CBD5E1', maxWidth: '750px', lineHeight: 1.6 }}>
            سجل رسمي موثق للشهادات الدولية المعتمدة والدورات التخصصية التي حصل عليها منسق المشاريع{' '}
            <strong style={{ color: '#fff' }}>(م. أحمد عادل طبيشات)</strong>، ومواءمتها مع الخطة الإجرائية لتحقيق
            التحول الرقمي والتمكين التكنولوجي لمدارس STEM.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              style={{
                background: '#0284C7',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.65rem 1.25rem',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={18} />
              <span>إضافة شهادة / دورة جديدة</span>
            </button>
          )}

          <button
            onClick={handlePrintReport}
            style={{
              background: '#fff',
              color: '#0F2044',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.2rem',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <Printer size={18} color="#0284C7" />
            <span>طباعة السجل الرسمي (A4)</span>
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
            title="تصدير إكسل"
          >
            <FileSpreadsheet size={17} />
            <span>Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={handleResetDefaults}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#94A3B8',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="استعادة السجل الافتراضي"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stats Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            borderRight: '5px solid #0284C7',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748B' }}>إجمالي الشهادات والدورات</span>
            <span style={{ color: '#0284C7', background: '#E0F2FE', padding: '0.4rem', borderRadius: '10px' }}>
              <Award size={20} />
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F2044', margin: '0.4rem 0 0' }}>
            {stats.totalCertificates}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
            ✓ {stats.activeCount} معتمدة وسارية المفعول
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            borderRight: '5px solid #059669',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748B' }}>إجمالي ساعات التطوير الذاتي</span>
            <span style={{ color: '#059669', background: '#D1FAE5', padding: '0.4rem', borderRadius: '10px' }}>
              <Clock size={20} />
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#059669', margin: '0.4rem 0 0' }}>
            {stats.totalHours} <span style={{ fontSize: '1rem', fontWeight: 700 }}>ساعة</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
            معدل {stats.averageHoursPerCert} ساعة لكل اعتماد
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            borderRight: '5px solid #7C3AED',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748B' }}>مجالات التخصص الدقيقة</span>
            <span style={{ color: '#7C3AED', background: '#EDE9FE', padding: '0.4rem', borderRadius: '10px' }}>
              <Sparkles size={20} />
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#7C3AED', margin: '0.4rem 0 0' }}>
            {stats.uniqueCategoriesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
            ذكاء اصطناعي، سحابة، أمن سيبراني...
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            borderRight: '5px solid #D97706',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748B' }}>جهات الاعتماد والمنظمات</span>
            <span style={{ color: '#D97706', background: '#FEF3C7', padding: '0.4rem', borderRadius: '10px' }}>
              <Globe size={20} />
            </span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#D97706', margin: '0.4rem 0 0' }}>
            {stats.uniqueIssuersCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
            مايكروسوفت، هارفارد، الوزارة، PMI...
          </div>
        </div>
      </div>

      {/* ── Charts & Visual Analytics Section ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Category Distribution Chart */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#0284C7" />
              توزيع الشهادات التخصصية حسب المجال
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>عدد الشهادات</span>
          </div>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} شهادة (${item.payload.hours} ساعة)`,
                    item.payload.name,
                  ]}
                  contentStyle={{
                    background: '#0F2044',
                    color: '#fff',
                    borderRadius: '10px',
                    direction: 'rtl',
                    border: 'none',
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legends */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
            {categoryChartData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: '#475569', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <strong style={{ color: '#0F2044', marginRight: 'auto' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Hours per Issuer Chart */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#059669" />
              ساعات التطوير الذاتي المعتمدة حسب الجهة المانحة
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>ساعات التدريب</span>
          </div>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuerChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} ساعة تدريبية`, 'الساعات']}
                  contentStyle={{
                    background: '#0F2044',
                    color: '#fff',
                    borderRadius: '10px',
                    direction: 'rtl',
                    border: 'none',
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="hours" fill="#0284C7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #F1F5F9',
              fontSize: '0.8rem',
              color: '#64748B',
              fontWeight: 700,
            }}
          >
            <span>أعلى جهة تدريب: <strong style={{ color: '#0F2044' }}>مايكروسوفت (100 س)</strong></span>
            <span>الوزارة: <strong style={{ color: '#0F2044' }}>110 س</strong></span>
            <span>مؤسسات دولية: <strong style={{ color: '#0F2044' }}>125 س</strong></span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div
        className="no-print"
        style={{
          background: '#fff',
          borderRadius: '18px',
          padding: '1.25rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.75rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search */}
        <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="بحث في الشهادات، الجهة، أو المهارات..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 2.8rem 0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter Academic Year */}
        <div style={{ minWidth: '150px' }}>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0F2044',
              outline: 'none',
              background: '#F8FAFC',
            }}
          >
            <option value="all">جميع الأعوام</option>
            <option value="2026-2027">العام الأكاديمي 2026-2027</option>
            <option value="2025-2026">العام الأكاديمي 2025-2026</option>
          </select>
        </div>

        {/* Filter Category */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0F2044',
              outline: 'none',
              background: '#F8FAFC',
            }}
          >
            <option value="all">كافة المجالات التخصصية</option>
            {SELF_DEV_CATEGORIES.map(c => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#0F2044',
              outline: 'none',
              background: '#F8FAFC',
            }}
          >
            <option value="all">كافة الحالات</option>
            <option value="معتمدة وسارية">معتمدة وسارية</option>
            <option value="مكتملة">مكتملة</option>
            <option value="قيد التدريب">قيد التدريب</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            style={{
              border: 'none',
              background: viewMode === 'cards' ? '#fff' : 'transparent',
              color: viewMode === 'cards' ? '#0F2044' : '#64748B',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: viewMode === 'cards' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
            title="عرض البطاقات"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              border: 'none',
              background: viewMode === 'table' ? '#fff' : 'transparent',
              color: viewMode === 'table' ? '#0F2044' : '#64748B',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: viewMode === 'table' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            }}
            title="عرض الجدول"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Content View (Cards or Table) ── */}
      {filteredRecords.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}
        >
          <Award size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
            لا توجد شهادات أو دورات مطابقة للبحث
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            يمكنك تعديل خيارات البحث والتصفية أو النقر على "إضافة شهادة جديدة".
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredRecords.map(rec => {
            const catCfg = SELF_DEV_CATEGORIES.find(c => c.category === rec.category) || {
              color: '#0284C7',
              bgColor: '#E0F2FE',
              borderColor: '#BAE6FD',
            };
            const statusCfg = SELF_DEV_STATUS_CONFIG[rec.status] || {
              label: rec.status,
              color: '#059669',
              bgColor: '#D1FAE5',
              borderColor: '#A7F3D0',
            };

            return (
              <div
                key={rec.id}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid #E2E8F0',
                  borderTop: `4px solid ${catCfg.color}`,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                    <span
                      style={{
                        background: catCfg.bgColor,
                        color: catCfg.color,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {rec.category}
                    </span>
                    <span
                      style={{
                        background: statusCfg.bgColor,
                        color: statusCfg.color,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Title & English */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.25rem', lineHeight: 1.4 }}>
                    {rec.title}
                  </h3>
                  {rec.titleEn && (
                    <div style={{ fontSize: '0.78rem', color: '#64748B', direction: 'ltr', textAlign: 'right', marginBottom: '0.5rem' }}>
                      {rec.titleEn}
                    </div>
                  )}

                  {/* Issuer & Meta */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      margin: '0.65rem 0',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748B' }}>الجهة: </span>
                      <strong style={{ color: '#0F2044' }}>{rec.issuer}</strong>
                    </div>
                    <div style={{ color: '#0284C7', fontWeight: 900, background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      ⏱️ {rec.hours} ساعة
                    </div>
                  </div>

                  {/* Skills Chips */}
                  {Array.isArray(rec.skillsAcquired) && rec.skillsAcquired.length > 0 && (
                    <div style={{ margin: '0.65rem 0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', marginBottom: '0.35rem' }}>
                        المهارات المكتسبة:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {rec.skillsAcquired.map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            • {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impact on Work */}
                  {rec.impactOnWork && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#334155',
                        background: '#F0FDF4',
                        border: '1px solid #DCFCE7',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        margin: '0.65rem 0',
                        lineHeight: 1.45,
                      }}
                    >
                      <strong style={{ color: '#15803D' }}>الأثر الميداني بالمدرسة: </strong>
                      {rec.impactOnWork}
                    </div>
                  )}

                  {/* Credential ID */}
                  {rec.credentialId && (
                    <div style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.4rem 0' }}>
                      معرف الاعتماد:{' '}
                      <span style={{ fontFamily: 'monospace', color: '#0F2044', fontWeight: 700 }}>
                        {rec.credentialId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #F1F5F9',
                    marginTop: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                    📅 {rec.issueDate}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => printSingleSelfDevelopmentCard(rec)}
                      style={{
                        background: '#EFF6FF',
                        color: '#0284C7',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                      title="طباعة بطاقة الاعتماد"
                    >
                      <Printer size={13} />
                      <span>إفادة</span>
                    </button>

                    {rec.credentialUrl && (
                      <a
                        href={rec.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#F8FAFC',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
                          padding: '0.35rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          textDecoration: 'none',
                        }}
                        title="رابط التحقق"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(rec)}
                          style={{
                            background: '#F1F5F9',
                            color: '#0F2044',
                            border: 'none',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="تعديل"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id, rec.title)}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: 'none',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div
          style={{
            background: '#fff',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '40px' }}>#</th>
                  <th style={{ padding: '0.85rem 1rem' }}>اسم الشهادة / الدورة</th>
                  <th style={{ padding: '0.85rem 1rem' }}>الجهة المانحة</th>
                  <th style={{ padding: '0.85rem 1rem' }}>المجال</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>الساعات</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>تاريخ الإنجاز</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>الحالة</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '140px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, i) => {
                  const catCfg = SELF_DEV_CATEGORIES.find(c => c.category === rec.category) || {
                    color: '#0284C7',
                    bgColor: '#E0F2FE',
                  };
                  const statusCfg = SELF_DEV_STATUS_CONFIG[rec.status] || {
                    label: rec.status,
                    color: '#059669',
                    bgColor: '#D1FAE5',
                  };

                  return (
                    <tr
                      key={rec.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: i % 2 === 0 ? '#fff' : '#F8FAFC',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748B' }}>{i + 1}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F2044' }}>{rec.title}</div>
                        {rec.titleEn && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', direction: 'ltr', textAlign: 'right' }}>
                            {rec.titleEn}
                          </div>
                        )}
                        {rec.credentialId && (
                          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontFamily: 'monospace' }}>
                            كود: {rec.credentialId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#334155' }}>{rec.issuer}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: catCfg.bgColor,
                            color: catCfg.color,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          {rec.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 900, color: '#0284C7' }}>
                        {rec.hours} س
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                        {rec.issueDate}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: statusCfg.bgColor,
                            color: statusCfg.color,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => printSingleSelfDevelopmentCard(rec)}
                            style={{
                              background: '#EFF6FF',
                              color: '#0284C7',
                              border: 'none',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="طباعة إفادة"
                          >
                            <Printer size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                style={{
                                  background: '#F1F5F9',
                                  color: '#0F2044',
                                  border: 'none',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                                title="تعديل"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id, rec.title)}
                                style={{
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: 'none',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
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

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 32, 68, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              direction: 'rtl',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                borderRadius: '24px 24px 0 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    background: '#0284C7',
                    color: '#fff',
                    padding: '0.35rem',
                    borderRadius: '8px',
                    display: 'flex',
                  }}
                >
                  <Award size={20} />
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  {editingRecord ? 'تعديل بيانات الشهادة / الدورة' : 'إضافة شهادة أو دورة تطوير ذاتي'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '0.35rem',
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {/* Title */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    اسم الشهادة أو الدورة التدريبية <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خبير مايكروسوفت العالمي للتعليم المبتكر MIEE"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* English Title */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    الاسم باللغة الإنجليزية (إن وجد)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Microsoft Innovative Educator Expert"
                    value={formData.titleEn || ''}
                    onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      direction: 'ltr',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Issuer */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    الجهة المانحة / المنظمة <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Microsoft, وزارة التربية والتعليم..."
                    value={formData.issuer || ''}
                    onChange={e => setFormData({ ...formData, issuer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    المجال التخصصي <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as SelfDevelopmentCategory })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    {SELF_DEV_CATEGORIES.map(c => (
                      <option key={c.category} value={c.category}>
                        {c.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hours */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    عدد الساعات التدريبية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hours || 20}
                    onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    العام الأكاديمي
                  </label>
                  <select
                    value={formData.academicYear || '2026-2027'}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>

                {/* Issue Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    تاريخ الإنجاز / الحصول عليها
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate || ''}
                    onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    حالة الاعتماد
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as SelfDevelopmentStatus })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="معتمدة وسارية">معتمدة وسارية</option>
                    <option value="مكتملة">مكتملة</option>
                    <option value="قيد التدريب">قيد التدريب</option>
                  </select>
                </div>

                {/* Credential ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    رقم الاعتماد / المعرف
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: MS-MIEE-2026-0982"
                    value={formData.credentialId || ''}
                    onChange={e => setFormData({ ...formData, credentialId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      direction: 'ltr',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Credential URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    رابط الشهادة أو التحقق
                  </label>
                  <input
                    type="url"
                    placeholder="https://learn.microsoft.com/..."
                    value={formData.credentialUrl || ''}
                    onChange={e => setFormData({ ...formData, credentialUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      direction: 'ltr',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Skills Acquired */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    المهارات التخصصية المكتسبة (سطر لكل مهارة)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب كل مهارة أو محور تدريبي في سطر منفصل..."
                    value={skillsText}
                    onChange={e => setSkillsText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Impact on Work */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                    الأثر والتطبيق العملي في المدرسة والمشاريع
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وضح كيف تم توظيف محتوى هذه الدورة أو الشهادة في دعم المعلمين والطلاب وتطوير المنظومة التعليمية..."
                    value={formData.impactOnWork || ''}
                    onChange={e => setFormData({ ...formData, impactOnWork: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#0284C7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
                  }}
                >
                  <Save size={18} />
                  <span>{isSubmitting ? 'جاري الحفظ...' : editingRecord ? 'حفظ التعديلات' : 'إضافة الشهادة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
