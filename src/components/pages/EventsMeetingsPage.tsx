'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, isSuperAdmin } from '@/lib/data';
import {
  EventMeetingItem,
  EventCategory,
  EventType,
  EventNature,
  EventStatus,
  EVENT_CATEGORY_CONFIG,
  EVENT_TYPE_CONFIG,
  EVENT_NATURE_CONFIG,
  EVENT_STATUS_CONFIG,
  EVENT_LOCATIONS,
  loadEventsMeetings,
  saveEventsMeetings,
} from '@/lib/eventsMeetingsData';
import {
  printComprehensiveEventsMeetingsReport,
  printSingleEventMeetingReport,
} from '@/lib/eventsMeetingsReportPrinter';
import * as XLSX from 'xlsx';
import {
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users,
  Target,
  FileText,
  CheckCircle2,
  Clock4,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building,
  Laptop,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Label,
  AreaChart,
  Area,
} from 'recharts';

interface EventsMeetingsPageProps {
  currentUser: User;
  selectedYear?: string;
}

export default function EventsMeetingsPage({
  currentUser,
  selectedYear = '2026-2027',
}: EventsMeetingsPageProps) {
  // Permission Check: ONLY a.tubaishat1704@education.qa has add/edit/delete permissions
  const isAdmin = isSuperAdmin(currentUser);

  // State
  const [items, setItems] = useState<EventMeetingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedType, setSelectedType] = useState<'all' | EventType>('all');
  const [selectedNature, setSelectedNature] = useState<'all' | EventNature>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | EventStatus>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'timeline'>('cards');
  const [showCharts, setShowCharts] = useState(true);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EventMeetingItem | null>(null);
  const [viewingItem, setViewingItem] = useState<EventMeetingItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    title: string;
    category: EventCategory;
    type: EventType;
    nature: EventNature;
    date: string;
    time: string;
    location: string;
    targetAudience: string;
    participantsCount: number;
    organizer: string;
    objectivesText: string;
    agendaText: string;
    outcomesText: string;
    status: EventStatus;
    notes: string;
  }>({
    title: '',
    category: 'اجتماع',
    type: 'داخلي',
    nature: 'اجتماع عمل',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 ص - 10:30 ص',
    location: 'مقر المدرسة',
    targetAudience: 'منسقو الأقسام والمعلمون',
    participantsCount: 10,
    organizer: 'قسم التعليم الإلكتروني والحلول الرقمية',
    objectivesText: '',
    agendaText: '',
    outcomesText: '',
    status: 'قادمة',
    notes: '',
  });

  // Load Initial Data
  useEffect(() => {
    const loaded = loadEventsMeetings();
    setItems(loaded);
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      // Nature filter
      if (selectedNature !== 'all' && item.nature !== selectedNature) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // Location filter
      if (selectedLocation !== 'all') {
        const itemLoc = (item.location || '').toLowerCase();
        const selLoc = selectedLocation.toLowerCase();
        if (selectedLocation === 'اون لاين') {
          if (!itemLoc.includes('اون لاين') && !itemLoc.includes('online') && item.type !== 'عن بعد') {
            return false;
          }
        } else if (!itemLoc.includes(selLoc)) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inLoc = item.location.toLowerCase().includes(q);
        const inOrg = item.organizer.toLowerCase().includes(q);
        const inAud = item.targetAudience.toLowerCase().includes(q);
        const inObj = (item.objectives || []).some(o => o.toLowerCase().includes(q));
        if (!inTitle && !inLoc && !inOrg && !inAud && !inObj) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, selectedType, selectedNature, selectedStatus, selectedLocation, searchQuery]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = items.length;
    const meetings = items.filter(i => i.category === 'اجتماع').length;
    const events = items.filter(i => i.category === 'فعالية').length;
    const tasks = items.filter(i => i.category === 'مهمة').length;
    const visits = items.filter(i => i.category === 'زيارة').length;
    const workshops = items.filter(i => i.category === 'ورشة').length;
    const competitions = items.filter(i => i.category === 'مسابقة').length;
    const studentSupervision = items.filter(i => i.nature === 'إشراف على طلاب').length;
    const workMeetings = items.filter(i => i.nature === 'اجتماع عمل').length;
    const externalAndVisits = items.filter(
      i => i.type === 'خارجي' || i.type === 'زيارة لمعرض' || i.type === 'زيارة تبادل خبرات' || i.type === 'مشاركة لمسابقة'
    ).length;
    const remoteCount = items.filter(i => i.type === 'عن بعد' || i.location.includes('اون لاين')).length;
    const totalBeneficiaries = items.reduce((sum, curr) => sum + (curr.participantsCount || 0), 0);
    const implemented = items.filter(i => i.status === 'منفذة' || i.status === 'مكتملة').length;
    const ongoing = items.filter(i => i.status === 'جارية').length;
    const upcoming = items.filter(i => i.status === 'قادمة').length;
    const needsConfirmation = items.filter(i => i.status === 'بحاجة لتأكيد').length;
    const completionRate = total > 0 ? Math.round((implemented / total) * 100) : 0;

    return {
      total,
      meetings,
      events,
      tasks,
      visits,
      workshops,
      competitions,
      studentSupervision,
      workMeetings,
      externalAndVisits,
      remoteCount,
      totalBeneficiaries,
      implemented,
      ongoing,
      upcoming,
      needsConfirmation,
      completed: implemented,
      completionRate,
    };
  }, [items]);

  // 1. Chart Data: Category Distribution (Bar Chart)
  const categoryChartData = useMemo(() => {
    const total = items.length || 1;
    const cats: { key: EventCategory; label: string; icon: string; color: string }[] = [
      { key: 'اجتماع', label: 'اجتماعات', icon: '💼', color: '#0284C7' },
      { key: 'فعالية', label: 'فعاليات', icon: '🎉', color: '#7C3AED' },
      { key: 'مهمة', label: 'مهام وتكليفات', icon: '📋', color: '#475569' },
      { key: 'زيارة', label: 'زيارات خبرات', icon: '🤝', color: '#0D9488' },
      { key: 'ورشة', label: 'ورش تدريبية', icon: '💡', color: '#D97706' },
      { key: 'مسابقة', label: 'مسابقات', icon: '🏆', color: '#DC2626' },
    ];

    return cats.map(c => {
      const count = items.filter(i => i.category === c.key).length;
      const percent = Math.round((count / total) * 100);
      return {
        name: c.label,
        category: c.key,
        icon: c.icon,
        count,
        percent: `${percent}%`,
        color: c.color,
      };
    });
  }, [items]);

  // 2. Chart Data: Status Distribution (Donut Chart)
  const statusChartData = useMemo(() => {
    const total = items.length || 1;
    const statuses: { key: EventStatus; label: string; color: string; icon: string }[] = [
      { key: 'منفذة', label: 'منفذة وموثقة', color: '#16A34A', icon: '✓' },
      { key: 'بحاجة لتأكيد', label: 'بحاجة لتأكيد', color: '#EA580C', icon: '⚠️' },
      { key: 'جارية', label: 'جارية حالياً', color: '#D97706', icon: '⚡' },
      { key: 'قادمة', label: 'قادمة ومجدولة', color: '#0284C7', icon: '⏳' },
    ];

    return statuses.map(s => {
      const count = items.filter(i => i.status === s.key || (s.key === 'منفذة' && i.status === 'مكتملة')).length;
      const percent = Math.round((count / total) * 100);
      return {
        name: s.label,
        status: s.key,
        value: count,
        percent: `${percent}%`,
        color: s.color,
        icon: s.icon,
      };
    }).filter(d => d.value > 0);
  }, [items]);

  // 3. Chart Data: Scope (داخلي بالمدرسة vs خارجي وزاري وعن بعد)
  const scopeChartData = useMemo(() => {
    const total = items.length || 1;
    const internalCount = items.filter(i =>
      i.type === 'داخلي' ||
      i.type === 'زيارة تبادل خبرات' ||
      i.type === 'ورشة تعريفية' ||
      i.type === 'مراجعة فنية' ||
      i.id === 'EVT-04' ||
      i.id === 'EVT-05' ||
      i.id === 'EVT-08' ||
      i.id === 'EVT-09' ||
      i.id === 'EVT-11' ||
      i.id === 'EVT-17' ||
      i.id === 'EVT-18' ||
      i.id === 'EVT-19' ||
      i.id === 'EVT-20'
    ).length;
    const externalCount = items.length - internalCount;

    return [
      {
        name: 'داخلي بالمدرسة',
        shortName: 'داخلي',
        value: internalCount,
        percent: `${Math.round((internalCount / total) * 100)}%`,
        color: '#0284C7',
        icon: '🏢',
      },
      {
        name: 'خارجي وزاري / عن بعد',
        shortName: 'خارجي',
        value: externalCount,
        percent: `${Math.round((externalCount / total) * 100)}%`,
        color: '#4338CA',
        icon: '🌐',
      },
    ];
  }, [items]);

  // 4. Chart Data: Nature Distribution (Pie)
  const natureChartData = useMemo(() => {
    const total = items.length || 1;
    const workCount = items.filter(i => i.nature === 'اجتماع عمل').length;
    const studentCount = items.filter(i => i.nature === 'إشراف على طلاب').length;
    return [
      {
        name: 'اجتماعات عمل وتنسيق',
        shortName: 'عمل وتنسيق',
        value: workCount,
        percent: `${Math.round((workCount / total) * 100)}%`,
        color: '#0F2044',
        icon: '💼',
      },
      {
        name: 'إشراف ومسابقات طلابية',
        shortName: 'إشراف طلاب',
        value: studentCount,
        percent: `${Math.round((studentCount / total) * 100)}%`,
        color: '#10B981',
        icon: '👨‍🎓',
      },
    ];
  }, [items]);

  // ── Custom SVG Renderers for Charts (Numbers & Texts INSIDE and ON TOP) ──
  const RADIAN = Math.PI / 180;

  // Custom label inside Donut/Pie slices: displays label name + count + percentage INSIDE slice
  const renderInnerSliceLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, payload } = props;
    if (value === 0 || !percent || percent < 0.04) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const title = payload?.shortName || payload?.name || '';
    const pct = `${Math.round(percent * 100)}%`;

    return (
      <g style={{ pointerEvents: 'none' }}>
        <text
          x={x}
          y={y - 7}
          fill="#FFFFFF"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontWeight={800}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))',
          }}
        >
          {title}
        </text>
        <text
          x={x}
          y={y + 8}
          fill="#FEF08A"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={900}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))',
          }}
        >
          {`${value} (${pct})`}
        </text>
      </g>
    );
  };

  // Top pill badge on Bar Chart (exact count)
  const renderBarTopLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const cx = x + width / 2;
    const cy = y - 14;
    return (
      <g style={{ pointerEvents: 'none' }}>
        <rect
          x={cx - 16}
          y={cy - 11}
          width={32}
          height={22}
          rx={11}
          fill="#0F2044"
          stroke="#38BDF8"
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy}
          fill="#FFFFFF"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={900}
        >
          {value}
        </text>
      </g>
    );
  };

  // Inside label on Bar Chart (percentage)
  const renderBarInsideLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    if (!height || height < 24) return null;
    const item = categoryChartData[index];
    if (!item || item.count === 0) return null;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return (
      <g style={{ pointerEvents: 'none' }}>
        <text
          x={cx}
          y={cy}
          fill="#FFFFFF"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={900}
          style={{
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.95))',
          }}
        >
          {item.percent}
        </text>
      </g>
    );
  };

  // Handle Form Open (New)
  function handleOpenAdd(preset?: 'remote_meeting' | 'remote_event') {
    if (!isAdmin) return;
    setEditingItem(null);
    if (preset === 'remote_meeting') {
      setFormData({
        title: 'اجتماع تنسيقي عن بعد عبر منصة Teams لمتابعة مؤشرات الأداء',
        category: 'اجتماع',
        type: 'عن بعد',
        nature: 'اجتماع عمل',
        date: new Date().toISOString().split('T')[0],
        time: '04:00 م - 05:15 م',
        location: 'اون لاين',
        targetAudience: 'النائب الأكاديمي، منسق المشاريع، ومعلمو المواد الأكاديمية',
        participantsCount: 15,
        organizer: 'قسم التعليم الإلكتروني والحلول الرقمية بالتعاون مع الإدارة الأكاديمية',
        objectivesText: '- مراجعة مؤشرات تفاعل الطلاب مع نظام قطر للتعليم وتصفير المعلقات\n- التنسيق لتقديم الدعم والتدخل الأكاديمي للطلاب الضعاف\n- مناقشة التحديات والحلول الرقمية المتاحة',
        agendaText: '- كلمة افتتاحية واستعراض نسب الإنجاز\n- مناقشة آليات الدعم الفردي للطلاب\n- التوصيات والقرارات الختامية',
        outcomesText: '- اعتماد جدول حصص التقوية الافتراضية عبر منصة Teams\n- تحديث سجل المتابعة الإلكتروني للواجبات',
        status: 'قادمة',
        notes: 'اجتماع افتراضي مسائي بتقنية الاتصال المرئي عن بعد عبر Microsoft Teams.',
      });
    } else if (preset === 'remote_event') {
      setFormData({
        title: 'ورشة تدريبية وتفاعلية عن بعد: استراتيجيات التعلم الرقمي والذكاء الاصطناعي',
        category: 'فعالية',
        type: 'عن بعد',
        nature: 'إشراف على طلاب',
        date: new Date().toISOString().split('T')[0],
        time: '05:00 م - 06:30 م',
        location: 'اون لاين',
        targetAudience: 'طلبة المرحلة الثانوية والكوادر التدريسية المهتمة',
        participantsCount: 35,
        organizer: 'قسم المشاريع والتعليم الإلكتروني ومختبر الذكاء الاصطناعي',
        objectivesText: '- صقل مهارات الطلاب في التفكير الحاسوبي واستخدام الذكاء الاصطناعي\n- التدريب على بيئات الحوسبة السحابية والتصميم الهندسي الرقمي\n- تعزيز التعلم الذاتي التفاعلي خارج أوقات الدوام الرسمي',
        agendaText: '- مقدمة نظرية تفاعلية حول النماذج الذكية\n- تطبيق عملي وتشاركي مباشر مع الطلاب عبر المنصة\n- فقرة الأسئلة والتقييم الختامي',
        outcomesText: '- إنجاز 35 مشروعاً مصغراً وتوزيع شهادات المشاركة الرقمية',
        status: 'قادمة',
        notes: 'فعالية تدريبية افتراضية عن بعد مفتوحة لكافة المنتسبين عبر الرابط المعتمد.',
      });
    } else {
      setFormData({
        title: '',
        category: 'اجتماع',
        type: 'داخلي',
        nature: 'اجتماع عمل',
        date: new Date().toISOString().split('T')[0],
        time: '09:00 ص - 10:30 ص',
        location: 'مقر المدرسة',
        targetAudience: 'منسقو الأقسام الأكاديمية ومعلمو المواد',
        participantsCount: 10,
        organizer: 'قسم التعليم الإلكتروني والحلول الرقمية',
        objectivesText: '',
        agendaText: '',
        outcomesText: '',
        status: 'قادمة',
        notes: '',
      });
    }
    setShowAddEditModal(true);
  }

  // Handle Form Open (Edit)
  function handleOpenEdit(item: EventMeetingItem) {
    if (!isAdmin) return;
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      type: item.type,
      nature: item.nature,
      date: item.date,
      time: item.time || '',
      location: item.location,
      targetAudience: item.targetAudience,
      participantsCount: item.participantsCount,
      organizer: item.organizer,
      objectivesText: (item.objectives || []).join('\n'),
      agendaText: (item.agenda || []).join('\n'),
      outcomesText: (item.outcomes || []).join('\n'),
      status: item.status,
      notes: item.notes || '',
    });
    setShowAddEditModal(true);
  }

  // Handle Save
  function handleSaveForm() {
    if (!isAdmin) return;
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان الفعالية أو الاجتماع');
      return;
    }

    const objectives = formData.objectivesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const agenda = formData.agendaText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const outcomes = formData.outcomesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    let updatedList: EventMeetingItem[];

    if (editingItem) {
      // Update existing
      updatedList = items.map(it => {
        if (it.id === editingItem.id) {
          return {
            ...it,
            title: formData.title,
            category: formData.category,
            type: formData.type,
            nature: formData.nature,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            targetAudience: formData.targetAudience,
            participantsCount: Number(formData.participantsCount) || 0,
            organizer: formData.organizer,
            objectives,
            agenda,
            outcomes,
            status: formData.status,
            notes: formData.notes,
            updatedAt: new Date().toISOString(),
          };
        }
        return it;
      });
    } else {
      // Create new
      const newItem: EventMeetingItem = {
        id: `EVT-2026-${String(items.length + 1).padStart(3, '0')}`,
        title: formData.title,
        category: formData.category,
        type: formData.type,
        nature: formData.nature,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        targetAudience: formData.targetAudience,
        participantsCount: Number(formData.participantsCount) || 0,
        organizer: formData.organizer,
        objectives,
        agenda,
        outcomes,
        status: formData.status,
        notes: formData.notes,
        academicYear: selectedYear,
        createdAt: new Date().toISOString(),
      };
      updatedList = [newItem, ...items];
    }

    setItems(updatedList);
    saveEventsMeetings(updatedList);
    setShowAddEditModal(false);
  }

  // Handle Delete
  function handleDelete(id: string) {
    if (!isAdmin) return;
    if (confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      saveEventsMeetings(updated);
      if (viewingItem && viewingItem.id === id) {
        setViewingItem(null);
      }
    }
  }

  // Export to Excel
  function handleExportExcel() {
    const dataToExport = filteredItems.map((it, idx) => ({
      'م': idx + 1,
      'كود السجل': it.id,
      'العنوان والموضوع': it.title,
      'التصنيف': it.category,
      'نوع الفعالية': it.type,
      'طبيعة النشاط': it.nature,
      'التاريخ': it.date,
      'الوقت والمدة': it.time || '-',
      'المقر والمكان': it.location,
      'الفئة المستهدفة': it.targetAudience,
      'عدد المشاركين': it.participantsCount,
      'الجهة المنظمة والمسؤول': it.organizer,
      'أهداف الفعالية / الاجتماع': (it.objectives || []).join(' | '),
      'محاور جدول الأعمال': (it.agenda || []).join(' | '),
      'أبرز المخرجات والقرارات': (it.outcomes || []).join(' | '),
      'الحالة': it.status,
      'ملاحظات': it.notes || '-',
      'العام الدراسي': it.academicYear,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الفعاليات والاجتماعات');

    XLSX.writeFile(
      workbook,
      `تقرير_الفعاليات_والاجتماعات_QSTSS_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  }

  // Reset Filters
  function handleResetFilters() {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedNature('all');
    setSelectedStatus('all');
    setSelectedLocation('all');
  }

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', minHeight: '100vh', background: '#F8FAFC' }}>
      
      {/* ── 1. Top Header Banner ── */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 50%, #0284C7 100%)',
          borderRadius: '18px',
          padding: '1.75rem 2rem',
          color: '#fff',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(15,32,68,0.22)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: -30,
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.8rem' }}>📅</span>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: 0, color: '#fff', letterSpacing: '-0.3px' }}>
              الفعاليات والاجتماعات
            </h1>
            <span
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              توثيق رسمي معتمد • {selectedYear}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#BAE6FD', lineHeight: 1.5 }}>
            منظومة إدارة وتوثيق الفعاليات الرسمية، ورش العمل، اجتماعات العمل الأكاديمية، الزيارات الميدانية، ومسابقات STEM التخصصية مع استخراج المحاضر والتقارير المعتمدة.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', zIndex: 1, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button
              onClick={() => handleOpenAdd()}
              style={{
                background: '#10B981',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} />
              <span>إضافة فعالية / اجتماع</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleOpenAdd('remote_meeting')}
              style={{
                background: '#0284C7',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(2,132,199,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Laptop size={16} />
              <span>+ عن بعد (Online)</span>
            </button>
          )}

          <button
            onClick={() => printComprehensiveEventsMeetingsReport(filteredItems, { academicYear: selectedYear })}
            style={{
              background: '#0F2044',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.25)',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <Printer size={16} />
            <span>طباعة التقرير الشامل (أفقي A3)</span>
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={15} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Viewer Mode Banner */}
      {!isAdmin && (
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#92400E',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <div>
            <strong>وضع الاطلاع والمشاهدة فقط:</strong> سجل الفعاليات والاجتماعات متاح للقراءة والبحث والاطلاع والطباعة وتصدير Excel. التعديل والإضافة والحذف متاحة حصرياً لمدير النظام.
          </div>
        </div>
      )}

      {/* ── 2. Quick KPIs Overview (6 Cards) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إجمالي السجلات والأنشطة</span>
            <span style={{ background: '#F1F5F9', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>📑</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F2044', lineHeight: 1 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0284C7', marginTop: '0.4rem', fontWeight: 700 }}>
            9 داخلي بالمدرسة • 7 خارجي
          </div>
        </div>

        {/* Card 2: Meetings */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #BAE6FD', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: 700 }}>اجتماعات عمل رسمية</span>
            <span style={{ background: '#E0F2FE', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>💼</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0369A1', lineHeight: 1 }}>
            {stats.meetings}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0284C7', marginTop: '0.4rem', fontWeight: 700 }}>
            لجان أكاديمية وتصميم مختبرات
          </div>
        </div>

        {/* Card 3: Events, Competitions & Workshops */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #DDD6FE', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#6D28D9', fontWeight: 700 }}>فعاليات ومسابقات وورش</span>
            <span style={{ background: '#EDE9FE', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>
            {stats.events + stats.competitions + stats.workshops}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6D28D9', marginTop: '0.4rem', fontWeight: 700 }}>
            {stats.events} فعاليات • {stats.competitions} مسابقة • {stats.workshops} ورشة
          </div>
        </div>

        {/* Card 4: Tasks & Visits */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #99F6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#0D9488', fontWeight: 700 }}>زيارات ومهام فنية</span>
            <span style={{ background: '#CCFBF1', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>🤝</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0D9488', lineHeight: 1 }}>
            {stats.tasks + stats.visits}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#0F766E', marginTop: '0.4rem', fontWeight: 700 }}>
            {stats.visits} زيارة تبادل خبرات • {stats.tasks} مهام مراجعة
          </div>
        </div>

        {/* Card 5: Implemented */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #BBF7D0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>السجلات المنفذة والموثقة</span>
            <span style={{ background: '#DCFCE7', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>✓</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
            {stats.implemented}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '0.4rem', fontWeight: 700 }}>
            {stats.completionRate}% نسبة الإنجاز للشهر
          </div>
        </div>

        {/* Card 6: Ongoing, Upcoming, Under Review */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.15rem', border: '1px solid #FED7AA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 700 }}>جارية / قادمة / قيد التأكيد</span>
            <span style={{ background: '#FFEDD5', padding: '0.3rem', borderRadius: '8px', fontSize: '1.1rem' }}>⚡</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#C2410C', lineHeight: 1 }}>
            {stats.ongoing + stats.upcoming + stats.needsConfirmation}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#9A3412', marginTop: '0.4rem', fontWeight: 700 }}>
            {stats.ongoing} جارية • {stats.upcoming} قادمة • {stats.needsConfirmation} تأكيد
          </div>
        </div>
      </div>

      {/* ── 3. Visualizations & Charts Section (Executive Analytics) ── */}
      {showCharts && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Chart 1: Category Distribution (Bar Chart with Top & Inside Labels) */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.35rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(15,32,68,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="#0284C7" />
                  <span>توزيع الأنشطة حسب التصنيفات الستة</span>
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#0284C7',
                    background: '#E0F2FE',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  {items.length} نشاطاً مسجلاً
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                الأرقام أعلى الأعمدة تمثل العدد الفعلي، والنسب المئوية موضحة داخل الأعمدة.
              </p>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryChartData} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#0F2044', fontWeight: 800 }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'dataMax + 2']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: '#0F2044',
                          color: '#fff',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '11px',
                          direction: 'rtl',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
                          {d.icon} {d.name}
                        </div>
                        <div style={{ color: '#38BDF8', fontWeight: 800 }}>
                          العدد: {d.count} سجل ({d.percent})
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="عدد الأنشطة" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" content={renderBarTopLabel} />
                  <LabelList dataKey="count" content={renderBarInsideLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Category Mini-Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed #E2E8F0',
              }}
            >
              {categoryChartData.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: `1px solid ${c.color}35`,
                    fontSize: '0.73rem',
                    color: '#1E293B',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: c.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{c.name}:</span>
                  <span style={{ fontWeight: 900, color: c.color }}>
                    {c.count} ({c.percent})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Status Distribution (Donut Chart with Inner Slice Labels) */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.35rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(15,32,68,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  <span>مؤشر حالات الإنجاز وتوثيق الأنشطة</span>
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#166534',
                    background: '#DCFCE7',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  {stats.completionRate}% نسبة الإنجاز
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                الحالة والعدد والنسبة المئوية معروضة مباشرة داخل كل جزء من الدائرة البيانية.
              </p>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: '#0F2044',
                          color: '#fff',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '11px',
                          direction: 'rtl',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
                          {d.icon} {d.name}
                        </div>
                        <div style={{ color: '#86EFAC', fontWeight: 800 }}>
                          العدد: {d.value} سجل ({d.percent})
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={renderInnerSliceLabel}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* Center of Donut KPI */}
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#0F2044" fontSize={23} fontWeight={900}>
                  {items.length}
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="#16A34A" fontSize={11} fontWeight={800}>
                  {stats.completionRate}% منجز
                </text>
              </PieChart>
            </ResponsiveContainer>

            {/* Status Mini-Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed #E2E8F0',
              }}
            >
              {statusChartData.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: `1px solid ${s.color}35`,
                    fontSize: '0.73rem',
                    color: '#1E293B',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{s.name}:</span>
                  <span style={{ fontWeight: 900, color: s.color }}>
                    {s.value} ({s.percent})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Scope Distribution (داخلي بالمدرسة vs خارجي وزاري وعن بعد) */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.35rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(15,32,68,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={18} color="#0284C7" />
                  <span>توزيع المقر والنطاق (داخلي vs خارجي وعن بعد)</span>
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#4338CA',
                    background: '#EEF2FF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    border: '1px solid #C7D2FE',
                  }}
                >
                  9 داخلي • 7 خارجي
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                مقارنة الأنشطة الداخلية بالمبنى المدرسي والأنشطة الخارجية الوزارية والمشاركات عن بعد.
              </p>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: '#0F2044',
                          color: '#fff',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '11px',
                          direction: 'rtl',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
                          {d.icon} {d.name}
                        </div>
                        <div style={{ color: '#38BDF8', fontWeight: 800 }}>
                          العدد: {d.value} سجل ({d.percent})
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={scopeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderInnerSliceLabel}
                >
                  {scopeChartData.map((entry, index) => (
                    <Cell key={`cell-scope-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* Center of Donut KPI */}
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#0F2044" fontSize={22} fontWeight={900}>
                  9 : 7
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="#0284C7" fontSize={11} fontWeight={800}>
                  داخلي : خارجي
                </text>
              </PieChart>
            </ResponsiveContainer>

            {/* Scope Mini-Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed #E2E8F0',
              }}
            >
              {scopeChartData.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: `1px solid ${s.color}35`,
                    fontSize: '0.73rem',
                    color: '#1E293B',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{s.name}:</span>
                  <span style={{ fontWeight: 900, color: s.color }}>
                    {s.value} ({s.percent})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 4: Nature Distribution (عمل وتنسيق vs إشراف طلاب) */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.35rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 14px rgba(15,32,68,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#10B981" />
                  <span>طبيعة الفعاليات (اجتماعات عمل vs إشراف طلاب)</span>
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#0F2044',
                    background: '#F1F5F9',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  13 عمل • 3 طلاب
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                تصنيف الفعاليات بحسب الدور التشغيلي بين تنسيق الإدارة والأقسام ورعاية ومتابعة الطلاب.
              </p>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: '#0F2044',
                          color: '#fff',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '11px',
                          direction: 'rtl',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
                          {d.icon} {d.name}
                        </div>
                        <div style={{ color: '#86EFAC', fontWeight: 800 }}>
                          العدد: {d.value} سجل ({d.percent})
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={natureChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderInnerSliceLabel}
                >
                  {natureChartData.map((entry, index) => (
                    <Cell key={`cell-nature-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* Center of Donut KPI */}
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#0F2044" fontSize={23} fontWeight={900}>
                  81%
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="#0F2044" fontSize={11} fontWeight={800}>
                  عمل وتنسيق
                </text>
              </PieChart>
            </ResponsiveContainer>

            {/* Nature Mini-Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed #E2E8F0',
              }}
            >
              {natureChartData.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '8px',
                    background: '#F8FAFC',
                    border: `1px solid ${n.color}35`,
                    fontSize: '0.73rem',
                    color: '#1E293B',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: n.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{n.name}:</span>
                  <span style={{ fontWeight: 900, color: n.color }}>
                    {n.value} ({n.percent})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Filter & Search Controls Bar ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '1.25rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="ابحث بالعنوان، المقر، المنظم، أو أهداف الفعالية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 2.2rem 0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter: Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F2044',
                background: '#F8FAFC',
                outline: 'none',
              }}
            >
              <option value="all">كافة التصنيفات (6)</option>
              <option value="اجتماع">💼 اجتماعات ({items.filter(i => i.category === 'اجتماع').length})</option>
              <option value="فعالية">🎉 فعاليات ({items.filter(i => i.category === 'فعالية').length})</option>
              <option value="مهمة">📋 مهام وتكليفات ({items.filter(i => i.category === 'مهمة').length})</option>
              <option value="زيارة">🤝 زيارات ({items.filter(i => i.category === 'زيارة').length})</option>
              <option value="ورشة">💡 ورش تدريبية ({items.filter(i => i.category === 'ورشة').length})</option>
              <option value="مسابقة">🏆 مسابقات ({items.filter(i => i.category === 'مسابقة').length})</option>
            </select>
          </div>

          {/* Filter: Type (الأنواع المعتمدة) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>النوع:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F2044',
                background: '#F8FAFC',
                outline: 'none',
              }}
            >
              <option value="all">كافة الأنواع</option>
              <option value="داخلي">🏢 داخلي بالمدرسة</option>
              <option value="خارجي">🌐 خارجي</option>
              <option value="عن بعد">💻 عن بعد (Microsoft Teams)</option>
              <option value="زيارة تبادل خبرات">🤝 زيارة تبادل خبرات</option>
              <option value="مراجعة فنية">🔬 مراجعة فنية</option>
              <option value="عرض مشروع طلابي">🚀 عرض مشروع طلابي</option>
              <option value="مقابلات تحكيم">⚖️ مقابلات تحكيم</option>
              <option value="حفل تكريم">🎖️ حفل تكريم</option>
              <option value="ورشة تعريفية">💡 ورشة تعريفية</option>
              <option value="زيارة لمعرض">🏛️ زيارة لمعرض</option>
              <option value="مشاركة لمسابقة">🏆 مشاركة لمسابقة</option>
              <option value="فعالية">🎉 فعالية</option>
            </select>
          </div>

          {/* Filter: Location (المقر والمكان) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>المكان / المقر:</span>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F2044',
                background: '#F8FAFC',
                outline: 'none',
              }}
            >
              <option value="all">كافة الأماكن والمقرات (8)</option>
              {EVENT_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>
                  {loc === 'اون لاين' ? '💻 ' : loc === 'مقر المدرسة' ? '🏫 ' : loc === 'وزارة التربية والتعليم والتعليم العالي' ? '🏛️ ' : loc === 'QNCC' ? '🏢 ' : loc === 'النادي العلمي القطري' ? '🔬 ' : loc === 'فندق' ? '🏨 ' : loc === 'مؤتمر' ? '🎤 ' : '⚡ '}
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Nature (إشراف طلاب / اجتماع عمل) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>طبيعة النشاط:</span>
            <select
              value={selectedNature}
              onChange={e => setSelectedNature(e.target.value as any)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F2044',
                background: '#F8FAFC',
                outline: 'none',
              }}
            >
              <option value="all">كافة الأنشطة</option>
              <option value="إشراف على طلاب">إشراف على طلاب</option>
              <option value="اجتماع عمل">اجتماع عمل</option>
            </select>
          </div>

          {/* Filter: Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>الحالة:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F2044',
                background: '#F8FAFC',
                outline: 'none',
              }}
            >
              <option value="all">كافة الحالات</option>
              <option value="منفذة">✓ منفذة وموثقة ({items.filter(i => i.status === 'منفذة' || i.status === 'مكتملة').length})</option>
              <option value="جارية">⚡ جارية ({items.filter(i => i.status === 'جارية').length})</option>
              <option value="قادمة">⏳ قادمة ({items.filter(i => i.status === 'قادمة').length})</option>
              <option value="بحاجة لتأكيد">⚠️ بحاجة لتأكيد ({items.filter(i => i.status === 'بحاجة لتأكيد').length})</option>
              <option value="مكتملة">✓ مكتملة</option>
              <option value="مؤجلة">⏸ مؤجلة</option>
            </select>
          </div>

          {/* Reset button */}
          {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || selectedNature !== 'all' || selectedStatus !== 'all' || selectedLocation !== 'all') && (
            <button
              onClick={handleResetFilters}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 700,
              }}
            >
              <RotateCcw size={13} />
              <span>إعادة ضبط</span>
            </button>
          )}

          {/* View Switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#fff' : 'transparent',
                color: viewMode === 'cards' ? '#0F2044' : '#64748B',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              بطاقات
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#fff' : 'transparent',
                color: viewMode === 'table' ? '#0F2044' : '#64748B',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              جدول
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                background: viewMode === 'timeline' ? '#fff' : 'transparent',
                color: viewMode === 'timeline' ? '#0F2044' : '#64748B',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              جدول زمني
            </button>
          </div>

        </div>
      </div>

      {/* ── 5. Main Content Area ── */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1.5px dashed #CBD5E1',
            color: '#64748B',
          }}
        >
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔍</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.4rem' }}>
            لم يتم العثور على أي فعاليات أو اجتماعات مطابقة
          </h3>
          <p style={{ fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
            يرجى تجربة تغيير معايير البحث أو تصفية البيانات، أو إضافة فعالية جديدة.
          </p>
          {isAdmin && (
            <button
              onClick={() => handleOpenAdd()}
              style={{
                background: '#0F2044',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              إضافة أول فعالية / اجتماع الآن
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* ── Cards View ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredItems.map(item => {
            const typeConf = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG['داخلي'];
            const natureConf = EVENT_NATURE_CONFIG[item.nature] || EVENT_NATURE_CONFIG['اجتماع عمل'];
            const statusConf = EVENT_STATUS_CONFIG[item.status] || EVENT_STATUS_CONFIG['مكتملة'];

            return (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                <div>
                  {/* Top Tags Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {(() => {
                        const catConf = EVENT_CATEGORY_CONFIG[item.category] || EVENT_CATEGORY_CONFIG['اجتماع'];
                        return (
                          <span
                            style={{
                              background: catConf.bg,
                              color: catConf.color,
                              border: `1px solid ${catConf.border}`,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                            }}
                          >
                            {catConf.icon} {catConf.label}
                          </span>
                        );
                      })()}
                      <span
                        style={{
                          background: typeConf.bg,
                          color: typeConf.color,
                          border: `1px solid ${typeConf.border}`,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        {typeConf.icon} {typeConf.label}
                      </span>
                    </div>

                    <span
                      style={{
                        background: statusConf.bg,
                        color: statusConf.color,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                      }}
                    >
                      {statusConf.icon} {statusConf.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.65rem', lineHeight: 1.4 }}>
                    {item.title}
                  </h3>

                  {/* Nature Badge */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <span
                      style={{
                        background: natureConf.bg,
                        color: natureConf.color,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>{natureConf.icon}</span>
                      <span>{natureConf.label}</span>
                    </span>
                  </div>

                  {/* Meta Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={13} color="#0284C7" />
                      <span>{item.date} {item.time && `• ${item.time}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="#DC2626" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={13} color="#10B981" />
                      <span>{item.targetAudience} ({item.participantsCount} مشاركاً)</span>
                    </div>
                  </div>

                  {/* Objectives Box (أهداف الفعالية / الاجتماع) */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.72rem', color: '#0F2044', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                      <Target size={12} color="#0096C7" />
                      <span>{item.category === 'اجتماع' ? 'أهداف الاجتماع:' : 'أهداف الفعالية:'}</span>
                    </strong>
                    <ul style={{ margin: 0, paddingRight: '1rem', fontSize: '0.72rem', color: '#334155', lineHeight: 1.4 }}>
                      {(item.objectives || []).slice(0, 2).map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                      {(item.objectives || []).length > 2 && (
                        <li style={{ color: '#0284C7', fontWeight: 700 }}>+ {(item.objectives.length - 2)} أهداف أخرى...</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setViewingItem(item)}
                      style={{
                        background: '#F1F5F9',
                        color: '#0F2044',
                        border: 'none',
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Eye size={12} />
                      <span>المحضر</span>
                    </button>
                    <button
                      onClick={() => printSingleEventMeetingReport(item)}
                      style={{
                        background: '#0F2044',
                        color: '#fff',
                        border: 'none',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Printer size={12} />
                      <span>طباعة (أفقي)</span>
                    </button>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="تعديل"
                        style={{
                          background: '#F8FAFC',
                          color: '#0284C7',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="حذف"
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* ── Table View ── */
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#fff' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '35px' }}>#</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>العنوان والموضوع</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>التصنيف</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>النوع</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>طبيعة النشاط</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>التاريخ</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>المقر</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>العدد</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center' }}>الحالة</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', width: '130px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const catConf = EVENT_CATEGORY_CONFIG[item.category] || EVENT_CATEGORY_CONFIG['اجتماع'];
                  const typeConf = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG['داخلي'];
                  const natureConf = EVENT_NATURE_CONFIG[item.nature] || EVENT_NATURE_CONFIG['اجتماع عمل'];
                  const statusConf = EVENT_STATUS_CONFIG[item.status] || EVENT_STATUS_CONFIG['منفذة'] || EVENT_STATUS_CONFIG['مكتملة'];

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem 0.6rem' }}>
                        <strong style={{ color: '#0F2044', display: 'block', fontSize: '0.82rem' }}>{item.title}</strong>
                        <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{item.organizer}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <span style={{ background: catConf.bg, color: catConf.color, border: `1px solid ${catConf.border}`, padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {catConf.icon} {catConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <span style={{ background: typeConf.bg, color: typeConf.color, padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {typeConf.icon} {typeConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <span style={{ background: natureConf.bg, color: natureConf.color, padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {natureConf.icon} {natureConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>{item.date}</td>
                      <td style={{ padding: '0.65rem 0.6rem', fontSize: '0.75rem', color: '#475569' }}>{item.location}</td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>{item.participantsCount}</td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <span style={{ background: statusConf.bg, color: statusConf.color, padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => printSingleEventMeetingReport(item)}
                            title="طباعة محضر رسمي أفقي (Landscape)"
                            style={{ background: '#0F2044', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.45rem', cursor: 'pointer' }}
                          >
                            <Printer size={12} />
                          </button>
                          <button
                            onClick={() => setViewingItem(item)}
                            title="عرض التفاصيل"
                            style={{ background: '#F1F5F9', color: '#0F2044', border: 'none', borderRadius: '4px', padding: '0.25rem 0.45rem', cursor: 'pointer' }}
                          >
                            <Eye size={12} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                title="تعديل"
                                style={{ background: '#E0F2FE', color: '#0284C7', border: 'none', borderRadius: '4px', padding: '0.25rem 0.45rem', cursor: 'pointer' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                title="حذف"
                                style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '4px', padding: '0.25rem 0.45rem', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
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
      ) : (
        /* ── Timeline View ── */
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ borderRight: '3px solid #0284C7', paddingRight: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[...filteredItems].sort((a, b) => b.date.localeCompare(a.date)).map(item => {
              const typeConf = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG['داخلي'];
              const natureConf = EVENT_NATURE_CONFIG[item.nature] || EVENT_NATURE_CONFIG['اجتماع عمل'];

              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      right: '-1.85rem',
                      top: '0',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#0284C7',
                      border: '3px solid #fff',
                      boxShadow: '0 0 0 2px #0284C7',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>{item.date} {item.time && `• ${item.time}`}</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: '0.15rem 0 0.35rem' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                        📍 {item.location} • 👥 {item.targetAudience} ({item.participantsCount} مشاركاً)
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ background: typeConf.bg, color: typeConf.color, fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {typeConf.icon} {typeConf.label}
                      </span>
                      <button
                        onClick={() => printSingleEventMeetingReport(item)}
                        style={{
                          background: '#0F2044',
                          color: '#fff',
                          border: 'none',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Printer size={12} />
                        <span>طباعة (أفقي)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. On-Screen Official Signatures Block ── */}
      <div
        className="no-print"
        style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '2px solid #0F2044',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        {/* Ahmad */}
        <div style={{ textAlign: 'center', width: '230px', background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.85rem' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إعداد وتوثيق الفعاليات:</p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>م. أحمد عادل طبيشات</p>
          <p style={{ margin: '0.15rem 0 0.4rem', fontSize: '0.7rem', color: '#64748B' }}>منسق المشاريع والتعليم الإلكتروني</p>
          <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/signature-ahmad.png" alt="توقيع م. أحمد" style={{ height: '38px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Rani */}
        <div style={{ textAlign: 'center', width: '230px', background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.85rem' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>مراجعة واعتماد:</p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>د. راني التوم</p>
          <p style={{ margin: '0.15rem 0 0.4rem', fontSize: '0.7rem', color: '#64748B' }}>النائب الأكاديمي للمدرسة</p>
          <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/signature-rani.png" alt="توقيع د. راني" style={{ height: '38px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Principal: Muhammad Ali Mandani Al-Emadi */}
        <div style={{ textAlign: 'center', width: '230px', background: '#fff', border: '1.5px solid #0F2044', borderRadius: '10px', padding: '0.85rem' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>يعتمد، مدير المدرسة:</p>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0F2044' }}>محمد علي مندني العمادي</p>
          <p style={{ margin: '0.15rem 0 0.4rem', fontSize: '0.7rem', color: '#64748B' }}>مدير مدرسة قطر للعلوم والتكنولوجيا</p>
          <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/principal-signature.png" alt="توقيع مدير المدرسة محمد علي مندني العمادي" style={{ height: '38px', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* ── 7. Add / Edit Modal ── */}
      {showAddEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.75)',
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
                padding: '1.15rem 1.5rem',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{editingItem ? '✏️' : '➕'}</span>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                    {editingItem ? 'تعديل بيانات الفعالية / الاجتماع' : 'إضافة اجتماع أو فعالية جديدة'}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#BAE6FD' }}>
                    استيفاء البيانات وتحديد الأهداف والتوصيات للاعتماد الرسمي
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Quick Template Selector */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={14} color="#0284C7" />
                  <span>تعبئة سريعة بالنمط:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    category: 'اجتماع',
                    type: 'داخلي',
                    location: 'مقر المدرسة',
                    nature: 'اجتماع عمل',
                  })}
                  style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: '#0F2044' }}
                >
                  💼 اجتماع عمل حضوري
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    category: 'اجتماع',
                    type: 'عن بعد',
                    location: 'اون لاين',
                    nature: 'اجتماع عمل',
                  })}
                  style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', color: '#0369A1' }}
                >
                  💻 اجتماع عن بعد (Online)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    category: 'فعالية',
                    type: 'فعالية',
                    location: 'مقر المدرسة',
                    nature: 'إشراف على طلاب',
                  })}
                  style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: '#7C3AED' }}
                >
                  🎉 فعالية حضورية
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    category: 'فعالية',
                    type: 'عن بعد',
                    location: 'اون لاين',
                    nature: 'إشراف على طلاب',
                  })}
                  style={{ background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', color: '#6D28D9' }}
                >
                  🌐 فعالية / ورشة عن بعد (Online)
                </button>
              </div>

              {/* Row 1: Category & Nature & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Category: اجتماع أو فعالية */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    التصنيف الأساسي: *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  >
                    <option value="اجتماع">💼 اجتماع</option>
                    <option value="فعالية">🎉 فعالية</option>
                    <option value="مهمة">📋 مهمة وتكليف فني</option>
                    <option value="زيارة">🤝 زيارة تبادل خبرات</option>
                    <option value="ورشة">💡 ورشة تدريبية</option>
                    <option value="مسابقة">🏆 مسابقة تخصصية</option>
                  </select>
                </div>

                {/* Type: الأنواع الـ 7 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    نوع الفعالية / الاجتماع: *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => {
                      const newType = e.target.value as EventType;
                      setFormData({
                        ...formData,
                        type: newType,
                        location: newType === 'عن بعد' && (formData.location === 'مقر المدرسة' || !formData.location) ? 'اون لاين' : formData.location,
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  >
                    <option value="داخلي">🏢 داخلي</option>
                    <option value="خارجي">🌐 خارجي</option>
                    <option value="عن بعد">💻 عن بعد (Online / افتراضي)</option>
                    <option value="زيارة تبادل خبرات">🤝 زيارة تبادل خبرات</option>
                    <option value="زيارة لمعرض">🏛️ زيارة لمعرض</option>
                    <option value="مشاركة لمسابقة">🏆 مشاركة لمسابقة</option>
                    <option value="فعالية">🎉 فعالية</option>
                  </select>
                </div>

                {/* Nature: إشراف على طلاب - اجتماع عمل */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    طبيعة النشاط: *
                  </label>
                  <select
                    value={formData.nature}
                    onChange={e => setFormData({ ...formData, nature: e.target.value as EventNature })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  >
                    <option value="إشراف على طلاب">👨‍🎓 إشراف على طلاب</option>
                    <option value="اجتماع عمل">💼 اجتماع عمل</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                  عنوان الفعالية أو الاجتماع: *
                </label>
                <input
                  type="text"
                  placeholder="مثال: المشاركة في أولمبياد الروبوت الوطني WRO Qatar 2026..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Objectives: أهداف الفعالية / أهداف الاجتماع */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.35rem' }}>
                  🎯 أهداف الفعالية / أهداف الاجتماع: (اكتب كل هدف في سطر منفصل) *
                </label>
                <textarea
                  rows={4}
                  placeholder={`اكتب أهداف الفعالية أو الاجتماع هنا، كل هدف في سطر:\n- تمثيل المدرسة في المحافل الوطنية للروبوت\n- صقل مهارات الطلاب في التفكير الهندسي\n- تأهيل الفرق للتصفيات الدولية`}
                  value={formData.objectivesText}
                  onChange={e => setFormData({ ...formData, objectivesText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #94A3B8',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Row 2: Date, Time, Location */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    التاريخ: *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    الوقت والمدة:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 09:00 ص - 11:30 ص"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                      المكان والمقر: *
                    </label>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>اختر من القائمة أو حدد مخصصاً</span>
                  </div>

                  {/* Dropdown for standard locations */}
                  <select
                    value={EVENT_LOCATIONS.includes(formData.location as any) ? formData.location : 'custom'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val !== 'custom') {
                        setFormData({
                          ...formData,
                          location: val,
                          type: val === 'اون لاين' ? 'عن بعد' : formData.type,
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      outline: 'none',
                      marginBottom: '0.4rem',
                      background: '#F8FAFC',
                    }}
                  >
                    <option value="custom">✏️ مكان أو تفصيل مخصص (اكتبه أدناه)</option>
                    <option value="مقر المدرسة">🏫 مقر المدرسة</option>
                    <option value="وزارة التربية والتعليم والتعليم العالي">🏛️ وزارة التربية والتعليم والتعليم العالي</option>
                    <option value="QNCC">🏢 QNCC (مركز قطر الوطني للمؤتمرات)</option>
                    <option value="النادي العلمي القطري">🔬 النادي العلمي القطري</option>
                    <option value="اون لاين">💻 اون لاين (عن بعد / Microsoft Teams)</option>
                    <option value="فندق">🏨 فندق</option>
                    <option value="مؤتمر">🎤 مؤتمر</option>
                    <option value="كهرماء">⚡ كهرماء</option>
                  </select>

                  {/* Editable text input */}
                  <input
                    type="text"
                    placeholder="مثال: مقر المدرسة - قاعة الاجتماعات..."
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />

                  {/* Quick Pill Chips for Locations */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {EVENT_LOCATIONS.map(loc => {
                      const isSelected = formData.location === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            location: loc,
                            type: loc === 'اون لاين' ? 'عن بعد' : formData.type,
                          })}
                          style={{
                            background: isSelected ? '#0F2044' : '#F1F5F9',
                            color: isSelected ? '#fff' : '#334155',
                            border: `1px solid ${isSelected ? '#0F2044' : '#CBD5E1'}`,
                            borderRadius: '6px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>{loc === 'اون لاين' ? '💻' : loc === 'مقر المدرسة' ? '🏫' : loc === 'وزارة التربية والتعليم والتعليم العالي' ? '🏛️' : loc === 'QNCC' ? '🏢' : loc === 'النادي العلمي القطري' ? '🔬' : loc === 'فندق' ? '🏨' : loc === 'مؤتمر' ? '🎤' : '⚡'}</span>
                          <span>{loc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Target Audience & Participants Count & Organizer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    الفئة المستهدفة / المشاركون:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: طلبة الصف العاشر والحادي عشر"
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    عدد الطلاب / المشاركين:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.participantsCount}
                    onChange={e => setFormData({ ...formData, participantsCount: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    الجهة المنظمة / المسؤول:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: قسم المشاريع والتعليم الإلكتروني"
                    value={formData.organizer}
                    onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Agenda / Topics */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                  📋 جدول الأعمال والمحاور المطروحة: (كل محور في سطر)
                </label>
                <textarea
                  rows={3}
                  placeholder={`1. افتتاح الجلسة والترحيب بالحضور\n2. استعراض التقرير الميداني وتحديد نقاط القوة\n3. إقرار خطة العمل التنفيذية`}
                  value={formData.agendaText}
                  onChange={e => setFormData({ ...formData, agendaText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Outcomes / Recommendations */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                  💡 المخرجات والقرارات والتوصيات المعتمدة: (كل توصية في سطر)
                </label>
                <textarea
                  rows={3}
                  placeholder={`1. تحقيق المركز الأول في مسار الروبوت\n2. إرسال خطابات شكر للطلبة المتميزين\n3. تعميم التجربة على بقية الشعب`}
                  value={formData.outcomesText}
                  onChange={e => setFormData({ ...formData, outcomesText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Status & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    حالة الفعالية / الاجتماع:
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as EventStatus })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  >
                    <option value="منفذة">✓ منفذة وموثقة</option>
                    <option value="جارية">⚡ جارية حالياً</option>
                    <option value="قادمة">⏳ قادمة ومجدولة</option>
                    <option value="بحاجة لتأكيد">⚠️ بحاجة لتأكيد</option>
                    <option value="مكتملة">✓ مكتملة</option>
                    <option value="مؤجلة">⏸ مؤجلة</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                    ملاحظات إضافية وتوثيق:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تم إرفاق الصور والتقارير في الأرشيف..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{
                  background: '#fff',
                  color: '#64748B',
                  border: '1px solid #CBD5E1',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>

              <button
                onClick={handleSaveForm}
                style={{
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                <CheckCircle2 size={15} />
                <span>حفظ واعتماد السجل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. View Details Modal (محضر الاجتماع / تقرير الفعالية) ── */}
      {viewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 32, 68, 0.75)',
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
                padding: '1.25rem 1.5rem',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#BAE6FD', fontWeight: 800 }}>
                  {viewingItem.category === 'اجتماع' ? 'محضر اجتماع رسمي' : 'تقرير توثيق فعالية مدرسية'} • {viewingItem.id}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0.15rem 0 0', color: '#fff' }}>
                  {viewingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Centered Official Header inside Modal Preview */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0F2044', paddingBottom: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
                  <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" style={{ height: '42px', objectFit: 'contain' }} />
                  <div style={{ width: '1px', height: '30px', background: '#CBD5E1' }} />
                  <img src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" style={{ height: '42px', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044' }}>
                  دولة قطر — وزارة التربية والتعليم والتعليم العالي
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044' }}>
                  مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0096C7' }}>
                  قسم المشاريع والتعليم الإلكتروني والحلول الرقمية
                </div>
                <div style={{ display: 'inline-block', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.2rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 900, color: '#0F2044', marginTop: '0.2rem' }}>
                  {viewingItem.category === 'اجتماع' ? 'محضر اجتماع رسمي' : 'تقرير توثيق فعالية مدرسية'} ({viewingItem.id})
                </div>
              </div>

              {/* Info Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>التاريخ والتوقيت:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.date} {viewingItem.time && `• ${viewingItem.time}`}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>المقر والمكان:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.location}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>نوع الفعالية:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.type}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>طبيعة النشاط:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.nature}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>الفئة المستهدفة:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.targetAudience} ({viewingItem.participantsCount} مشاركاً)</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>الجهة المنظمة:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0F2044' }}>{viewingItem.organizer}</strong>
                </div>
              </div>

              {/* Objectives */}
              <div style={{ background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Target size={16} color="#0096C7" />
                  <span>{viewingItem.category === 'اجتماع' ? 'أهداف الاجتماع ومبررات الانعقاد:' : 'أهداف الفعالية المدرسية:'}</span>
                </h4>
                <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                  {(viewingItem.objectives || []).map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* Agenda */}
              {viewingItem.agenda && viewingItem.agenda.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} color="#4338CA" />
                    <span>جدول الأعمال والمحاور المطروحة:</span>
                  </h4>
                  <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                    {viewingItem.agenda.map((ag, i) => (
                      <li key={i}>{ag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outcomes */}
              {viewingItem.outcomes && viewingItem.outcomes.length > 0 && (
                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#166534', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>المخرجات والقرارات والتوصيات المعتمدة:</span>
                  </h4>
                  <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.82rem', color: '#166534', lineHeight: 1.6 }}>
                    {viewingItem.outcomes.map((out, i) => (
                      <li key={i}>{out}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Signatures Preview in Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0F2044', paddingTop: '1rem', marginTop: '0.5rem', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', flex: 1, minWidth: '150px', background: '#F8FAFC', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>إعداد وتوثيق:</p>
                  <p style={{ margin: '0.1rem 0', fontSize: '0.82rem', fontWeight: 900, color: '#0F2044' }}>م. أحمد عادل طبيشات</p>
                  <img src="/signature-ahmad.png" alt="توقيع" style={{ height: '32px', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'center', flex: 1, minWidth: '150px', background: '#F8FAFC', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>مراجعة واعتماد:</p>
                  <p style={{ margin: '0.1rem 0', fontSize: '0.82rem', fontWeight: 900, color: '#0F2044' }}>د. راني التوم</p>
                  <img src="/signature-rani.png" alt="توقيع" style={{ height: '32px', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'center', flex: 1, minWidth: '150px', background: '#F8FAFC', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid #0F2044' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>يعتمد، مدير المدرسة:</p>
                  <p style={{ margin: '0.1rem 0', fontSize: '0.85rem', fontWeight: 900, color: '#0F2044' }}>محمد علي مندني العمادي</p>
                  <img src="/principal-signature.png" alt="توقيع" style={{ height: '32px', objectFit: 'contain' }} />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => setViewingItem(null)}
                style={{
                  background: '#fff',
                  color: '#64748B',
                  border: '1px solid #CBD5E1',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>

              <button
                onClick={() => printSingleEventMeetingReport(viewingItem)}
                style={{
                  background: '#0F2044',
                  color: '#fff',
                  border: 'none',
                  padding: '0.55rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(15,32,68,0.25)',
                }}
              >
                <Printer size={15} />
                <span>طباعة المحضر الرسمي (أفقي Landscape)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
