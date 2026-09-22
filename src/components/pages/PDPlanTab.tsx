'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Printer, Layers, Award, Sparkles, CheckCircle2, Clock, 
  Calendar, Users, BookOpen, ExternalLink, FileText, Activity, 
  Target, Check, ShieldCheck, ChevronDown, ChevronUp, BadgeCheck,
  Edit3, Trash2, Plus, ArrowUp, ArrowDown, RotateCcw, X, Save
} from 'lucide-react';
import { OfficialReportHeader } from './PDReports';
import type { Workshop, IndividualPDRecord } from '@/lib/pdData';
import { type Teacher, type Department, resolveTeacherDepartment, getDepartmentStaffCount } from '@/lib/data';

interface MeeeRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  status: 'تم التقديم' | 'حصل على الشهادة';
  applicationDate: string;
  certificationDate?: string;
  academicYear: string;
  notes?: string;
}

interface Props {
  workshops: Workshop[];
  individualRecords: IndividualPDRecord[];
  meeeRecords: MeeeRecord[];
  teachers: Teacher[];
  departments: Department[];
  filterYear: string;
  onViewReport: (w: Workshop) => void;
  onSelectWorkshop?: (w: Workshop) => void;
  onAddWorkshop?: () => void;
  onAddIndividual?: () => void;
  onViewIndividualReport?: (r: IndividualPDRecord) => void;
  canEdit?: boolean;
}

export interface PlanRow {
  id: string;
  title: string;
  targetAudience: string;
  procedure: string;
  timeframe: string;
  trainer: string;
  executionLevel: 'تم' | 'قيد التنفيذ' | 'مخطط';
  followUp: string;
  reportWorkshop?: Workshop;
  individualRecord?: IndividualPDRecord;
  rowType?: 'collective' | 'individual' | 'program';
  externalUrl?: string;
}

// ── Baseline Planned Workshops for 2026-2027 Term 1 ─────────────────────────
const BASELINE_PLAN_ITEMS_2627: PlanRow[] = [
  {
    id: 'plan-base-1',
    title: 'تدريب المعلمين والإداريين بالمدارس التخصصية الجديدة',
    targetAudience: 'المعلمين والإداريين ومنسقي المشاريع الإلكترونية',
    procedure: 'إعداد الخطة التدريبية والبدء بتدريب المعلمين والإداريين الجدد ضمن جدول والخطة المعتمدة من المدرسة',
    timeframe: 'أغسطس ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'تم',
    followUp: 'انقر هنا لمتابعة تقرير ورش المعلمين الجدد : انقر هنا \nانقر هنا لمتابعة ورش منسقي المشاريع الإلكترونية والإداريين : انقر هنا',
    externalUrl: ''
  },
  {
    id: 'plan-base-2',
    title: 'برنامج الأنظمة التعليمية والتقنية',
    targetAudience: 'المعلمين الجدد',
    procedure: 'عقد ورش متعددة للمعلمين الجدد في المدرسة لتمكينهم من الأنظمة والمنصات التعليمية المعتمدة',
    timeframe: 'أغسطس ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'تم',
    followUp: 'تم عقد الورش التدريبية وتمكين المعلمين منها - للاطلاع على التقرير انقر هنا',
  },
  {
    id: 'plan-base-3',
    title: 'ورشة الذكاء الاصطناعي لمنسقي المشاريع',
    targetAudience: 'منسقي المشاريع الإلكترونية',
    procedure: 'حضور الورشة التخصصية بناءً على تعليمات وزارة التربية والتعليم والتعليم العالي',
    timeframe: '٢ سبتمبر ٢٠٢٦م',
    trainer: 'قسم التعليم الإلكتروني والحلول الرقمية',
    executionLevel: 'تم',
    followUp: 'تم حضور الورش في فندق ميريديان – من الساعة ٧:٠٠ ص إلى ٢:٠٠ م يوم ٢ سبتمبر ٢٠٢٦م',
  },
  {
    id: 'plan-base-4',
    title: 'الدليل الإرشادي لتفعيل الأدوات التكنولوجية',
    targetAudience: 'الطلاب / أولياء الأمور / المعلمين والإداريين',
    procedure: 'إعداد الدليل الإرشادي وإرساله لكافة أطراف العملية التعليمية للاطلاع عليه وتمكينهم من استخدام الأدوات التكنولوجية في المدرسة والسياسات الخاصة بها',
    timeframe: 'أغسطس ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'تم',
    followUp: 'تم نشر الدليل الجديد ونشره للطلاب وأولياء الأمور عبر المنصة الرسمية: https://qstssschools.web.app',
    externalUrl: 'https://qstssschools.web.app'
  },
  {
    id: 'plan-base-5',
    title: 'ورشة تعريفية لمنصة قطر للتعليم',
    targetAudience: 'جميع المعلمين والطلاب / الصف السابع والتاسع الجدد',
    procedure: 'عقد ورشة تعريفية للمعلمين والطلاب عن آخر المستجدات والتحديثات على سياسات الرفع وإنشاء الدروس على نظام قطر للتعليم ضمن العناوين المرفقة بالدليل الإرشادي للتعليم الإلكتروني',
    timeframe: 'سبتمبر ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'تم',
    followUp: 'تم تنفيذ الورشة مرفق تقرير الورشة: انقر هنا',
  },
  {
    id: 'plan-base-6',
    title: 'منصة ClassPoint التفاعلية',
    targetAudience: 'المعلمين',
    procedure: 'عقد الورش التدريبية المختلفة لمعلمي الأقسام لتمكينهم من ClassPoint من قبل شركة Inkone عن بعد',
    timeframe: 'سبتمبر ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'قيد التنفيذ',
    followUp: 'التنسيق مع شركة Inkone لعقد الورشة عن بعد ومتابعة التفعيل الصفي',
  },
  {
    id: 'plan-base-7',
    title: 'نظام قطر للتعليم وبرنامج التيمز وون درايف',
    targetAudience: 'الطلاب (الصف التاسع)',
    procedure: 'عقد ورش لطلاب الصف التاسع الجدد لتمكينهم من نظام قطر للتعليم وبرنامج التيمز والحوسبة السحابية',
    timeframe: 'سبتمبر ٢٠٢٦م',
    trainer: 'أحمد طبيشات / فيصل الحضري',
    executionLevel: 'مخطط',
    followUp: 'التنسيق مع الأخصائي وجدولة الحصص الميدانية في مختبر الحاسوب',
  },
  {
    id: 'plan-base-8',
    title: 'تطبيقات الذكاء الاصطناعي في الإطار الإداري',
    targetAudience: 'الإداريين',
    procedure: 'تدريب الإداريين على التمكين التكنولوجي على استخدام تطبيقات الذكاء الاصطناعي الحديثة والمتطورة لتسريع المهام الإدارية',
    timeframe: 'أكتوبر ٢٠٢٦م',
    trainer: 'أحمد طبيشات',
    executionLevel: 'مخطط',
    followUp: 'إعداد المادة التدريبية وتجهيز المختبر التقني',
  }
];

// ── Modal for Editing / Adding Plan Rows ─────────────────────────────────────
function PlanRowModal({
  row,
  isNew,
  isOpen,
  onClose,
  onSave
}: {
  row: PlanRow | null;
  isNew?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: PlanRow) => void;
}) {
  const [form, setForm] = useState<PlanRow>({
    id: row?.id || `plan-custom-${Date.now()}`,
    title: row?.title || '',
    targetAudience: row?.targetAudience || 'المعلمين',
    procedure: row?.procedure || '',
    timeframe: row?.timeframe || 'الفصل الأول ٢٠٢٦-٢٠٢٧م',
    trainer: row?.trainer || 'أحمد طبيشات',
    executionLevel: row?.executionLevel || 'مخطط',
    followUp: row?.followUp || '',
    rowType: row?.rowType || 'collective',
    externalUrl: row?.externalUrl || ''
  });

  useEffect(() => {
    if (row) {
      setForm(row);
    } else {
      setForm({
        id: `plan-custom-${Date.now()}`,
        title: '',
        targetAudience: 'المعلمين',
        procedure: '',
        timeframe: 'الفصل الأول ٢٠٢٦-٢٠٢٧م',
        trainer: 'أحمد طبيشات',
        executionLevel: 'مخطط',
        followUp: '',
        rowType: 'collective',
        externalUrl: ''
      });
    }
  }, [row, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('يرجى إدخال اسم البرنامج التدريبي');
      return;
    }
    onSave(form);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,32,68,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      direction: 'rtl'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        border: '1px solid #CBD5E1'
      }}>
        {/* Modal Header */}
        <div style={{
          background: '#0F2044',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '15px 15px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Edit3 size={20} color="#38BDF8" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
              {isNew ? 'إضافة بند جديد لخطة التطوير المهني' : 'تعديل خانات بند خطة التطوير المهني'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.3rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
              اسم البرنامج / الورشة التدريبية *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: ورشة الذكاء الاصطناعي لمنسقي المشاريع"
              style={{
                width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                الفئة المستهدفة *
              </label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={e => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="مثال: المعلمين الجدد، الطلاب، الإداريين"
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                الإطار الزمني *
              </label>
              <input
                type="text"
                value={form.timeframe}
                onChange={e => setForm({ ...form, timeframe: e.target.value })}
                placeholder="مثال: أغسطس ٢٠٢٦م، سبتمبر ٢٠٢٦م"
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                نوع البند *
              </label>
              <select
                value={form.rowType || 'collective'}
                onChange={e => setForm({ ...form, rowType: e.target.value as any })}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800,
                  background: '#fff'
                }}
              >
                <option value="collective">👥 ورشة جماعية</option>
                <option value="individual">👤 تدريب فردي</option>
                <option value="program">🎓 برنامج واعتمادات</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                المدرب *
              </label>
              <input
                type="text"
                value={form.trainer}
                onChange={e => setForm({ ...form, trainer: e.target.value })}
                placeholder="مثال: أحمد طبيشات"
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
                مستوى التنفيذ *
              </label>
              <select
                value={form.executionLevel}
                onChange={e => setForm({ ...form, executionLevel: e.target.value as any })}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                  border: '1.5px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 800,
                  background: '#fff'
                }}
              >
                <option value="تم">تم</option>
                <option value="قيد التنفيذ">قيد التنفيذ</option>
                <option value="مخطط">مخطط</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
              الإجراء *
            </label>
            <textarea
              rows={3}
              value={form.procedure}
              onChange={e => setForm({ ...form, procedure: e.target.value })}
              placeholder="وصف تفصيلي للإجراءات المتخذة لتنفيذ الورشة..."
              style={{
                width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                border: '1.5px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600,
                lineHeight: 1.5
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
              المتابعة *
            </label>
            <textarea
              rows={3}
              value={form.followUp}
              onChange={e => setForm({ ...form, followUp: e.target.value })}
              placeholder="إجراءات المتابعة ونتائج التنفيذ..."
              style={{
                width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                border: '1.5px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600,
                lineHeight: 1.5
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.35rem' }}>
              رابط المنشور / التقرير الخارجي (اختياري)
            </label>
            <input
              type="url"
              value={form.externalUrl || ''}
              onChange={e => setForm({ ...form, externalUrl: e.target.value })}
              placeholder="https://..."
              style={{
                width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                border: '1.5px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600,
                direction: 'ltr'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1',
                background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                background: '#0F2044', color: '#fff', fontWeight: 800, fontSize: '0.85rem',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,32,68,0.2)'
              }}
            >
              <Save size={16} />
              <span>حفظ البند</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDPlanTab({
  workshops,
  individualRecords,
  meeeRecords,
  teachers,
  departments,
  filterYear,
  onViewReport,
  onSelectWorkshop,
  onAddWorkshop,
  onAddIndividual,
  onViewIndividualReport,
  canEdit
}: Props) {
  const [showCertifiedList, setShowCertifiedList] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRow, setEditingRow] = useState<PlanRow | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [planFilter, setPlanFilter] = useState<'all' | 'collective' | 'individual' | 'program'>('all');

  // Load custom plan rows from localStorage
  const [customRows, setCustomRows] = useState<PlanRow[] | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qstss_custom_pd_plan_2627');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse custom plan rows:', e);
      }
    }
    return null;
  });

  // Track deleted rows in edit mode
  const [deletedRowIds, setDeletedRowIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('qstss_deleted_plan_row_ids');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse deleted plan rows:', e);
      }
    }
    return [];
  });

  // ── 1. Individual PD Statistics (Dynamic from individualRecords) ─────────────
  const individualStats = useMemo(() => {
    const targetYear = filterYear && filterYear !== 'all' ? filterYear : '2026-2027';
    // Filter individual records for 2026-2027 / current term
    const relevantInd = individualRecords.filter(r => 
      r.academicYear === targetYear || (!r.academicYear && targetYear === '2026-2027' && r.trainingDate?.includes('2026'))
    );
    const recordsToUse = relevantInd.length > 0 ? relevantInd : individualRecords.slice(0, 14);

    const totalSessions = recordsToUse.length;
    const uniqueTeachers = new Set(recordsToUse.map(r => r.traineeNameAr).filter(Boolean)).size;
    const totalMinutes = recordsToUse.reduce((sum, r) => sum + (r.durationMinutes || 20), 0);
    const totalHours = (totalMinutes / 60).toFixed(1) + ' ساعة';

    // Group and categorize skills dynamically
    const skillMap = new Map<string, { sessions: number; teachers: Set<string> }>();

    const normalizeSkill = (raw: string, cat?: string) => {
      const s = (raw || cat || '').toLowerCase();
      if (s.includes('ai') || s.includes('ذكاء') || s.includes('copilot') || s.includes('video') || s.includes('napkin')) {
        return 'أدوات الذكاء الاصطناعي وتوليد الفيديو (AI Tools & Video)';
      }
      if (s.includes('qatar education') || s.includes('قطر للتعليم') || s.includes('lms') || s.includes('qe')) {
        return 'نظام قطر للتعليم (Qatar Education LMS)';
      }
      if (s.includes('canva') || s.includes('تصميم')) {
        return 'تصميم المحتوى التعليمي التفاعلي (Canva)';
      }
      if (s.includes('teams') || s.includes('sharepoint') || s.includes('outlook') || s.includes('365') || s.includes('forms') || s.includes('تيمز')) {
        return 'منصات مايكروسوفت والتعليم السحابي (SharePoint, Teams, Outlook)';
      }
      if (s.includes('calameo') || s.includes('كتب') || s.includes('e-book') || s.includes('ebook')) {
        return 'النشر الإلكتروني التفاعلي للكتب (Calameo E-Book)';
      }
      if (s.includes('classpoint')) {
        return 'منصة ClassPoint التفاعلية';
      }
      if (s.includes('edpuzzle')) {
        return 'منصة Edpuzzle التفاعلية';
      }
      if (s.includes('notebook') || s.includes('onenote')) {
        return 'دفتر الملاحظات الرقمي (OneNote / Notebook)';
      }
      return raw || cat || 'مهارة تكنولوجية فردية';
    };

    recordsToUse.forEach(r => {
      const skillName = normalizeSkill(r.skillProvided, r.skillCategory);
      if (!skillMap.has(skillName)) {
        skillMap.set(skillName, { sessions: 0, teachers: new Set() });
      }
      const entry = skillMap.get(skillName)!;
      entry.sessions += 1;
      if (r.traineeNameAr) entry.teachers.add(r.traineeNameAr);
    });

    const skillList = Array.from(skillMap.entries())
      .map(([skill, data]) => ({
        skill,
        sessions: data.sessions,
        teachersCount: data.teachers.size
      }))
      .sort((a, b) => b.sessions - a.sessions);

    return {
      totalSessions,
      uniqueTeachers,
      totalHours,
      skillList
    };
  }, [individualRecords, filterYear]);

  // ── 2. MEEE & Showcase School Achievements (Dynamic from meeeRecords) ────────
  const meeeStats = useMemo(() => {
    const targetYear = filterYear && filterYear !== 'all' ? filterYear : '2026-2027';
    const existingCertified = meeeRecords.filter(r => r.status === 'حصل على الشهادة' && (r.academicYear === targetYear || (!r.academicYear && targetYear === '2026-2027')));
    const appliedRecords = meeeRecords.filter(r => r.status === 'تم التقديم' && (r.academicYear === targetYear || (!r.academicYear && targetYear === '2026-2027')));

    const activeTeachers = teachers.filter(t => t.status !== 'inactive');
    const totalTeachers = targetYear === '2026-2027' ? 65 : (activeTeachers.length > 0 ? activeTeachers.length : 65);
    const certifiedCount = existingCertified.length > 0 ? existingCertified.length : 36;
    const appliedCount = appliedRecords.length;
    const certifiedRate = totalTeachers > 0 ? Math.round((certifiedCount / totalTeachers) * 100) : 0;
    const successRate = (certifiedCount + appliedCount) > 0 ? Math.round((certifiedCount / (certifiedCount + appliedCount)) * 100) : 100;

    // Group certified by department using resolveTeacherDepartment
    const deptMap: Record<string, number> = {};
    existingCertified.forEach(r => {
      const d = resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments);
      deptMap[d] = (deptMap[d] || 0) + 1;
    });

    const defaultDepts = [
      'التربية الإسلامية', 'البحث العلمي', 'مختبر الطاقة', 'الرياضيات',
      'اللغة الإنجليزية', 'الحاسوب', 'اللغة العربية', 'STEM',
      'إداري', 'مختبر التصنيع الرقمي'
    ];
    const allDeptsList = Array.from(new Set([
      ...defaultDepts,
      ...Object.keys(deptMap).filter(d => d !== 'أخرى')
    ]));

    const deptCounts = allDeptsList.map(deptName => {
      const { count: deptTotal } = getDepartmentStaffCount(deptName, teachers, departments);
      const count = deptMap[deptName] || 0;
      const rate = deptTotal > 0 ? Math.round((count / deptTotal) * 100) : 0;
      return {
        name: deptName,
        count,
        total: deptTotal,
        rate
      };
    }).sort((a, b) => b.rate - a.rate || b.count - a.count || b.total - a.total);

    const topDeptItem = deptCounts.find(d => d.rate > 0 && d.count > 0);
    const topDept = topDeptItem ? `${topDeptItem.name} (${topDeptItem.rate}%)` : 'التربية الإسلامية (100%)';

    return {
      certifiedCount,
      appliedCount,
      totalRecords: certifiedCount + appliedCount,
      totalTeachers,
      certifiedRate,
      certifiedList: existingCertified,
      appliedList: appliedRecords,
      deptCounts,
      topDept,
      successRate
    };
  }, [meeeRecords, filterYear, teachers, departments]);

  // ── 3. Unified Plan Rows (Strictly Dynamic from workshops, individualRecords, meeeRecords) ──
  const defaultPlanRows = useMemo(() => {
    const targetYear = filterYear && filterYear !== 'all' ? filterYear : '2026-2027';
    const rows: PlanRow[] = [];

    // A. Collective Workshops for the selected academic year
    const yearWorkshops = workshops.filter(w => 
      w.academicYear === targetYear || 
      (!w.academicYear && targetYear === '2026-2027' && (w.date?.includes('2026') || w.date?.includes('2027')))
    );

    if (yearWorkshops.length > 0) {
      const sortedWorkshops = [...yearWorkshops].sort((a, b) => {
        if (a.workshopNumber && b.workshopNumber) return a.workshopNumber - b.workshopNumber;
        if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
        return 0;
      });

      sortedWorkshops.forEach((w) => {
        const isDone = w.status === 'موثق' || w.status === 'تم التنفيذ';
        const isInProgress = w.status === 'قيد التنفيذ';
        rows.push({
          id: w.id,
          rowType: 'collective',
          title: w.titleAr || w.nameAr || 'ورشة تدريبية',
          targetAudience: w.targetAudience ? `${w.targetAudience}${w.targetClasses ? ` (${w.targetClasses})` : ''}` : (w.targetGroup || 'المعلمين'),
          procedure: w.procedure || (w.objectives ? w.objectives.split('\n')[0].replace(/^[•\-\*]\s*/, '') : 'عقد ورشة عمل تدريبية وتطبيقية لتمكين المتدربين من الأدوات الرقمية'),
          timeframe: w.date ? (w.month ? `${w.month} ${w.date}` : w.date) : (w.month || 'الفصل الدراسي الأول'),
          trainer: w.facilitatorName || w.trainerName || w.trainer || 'أحمد طبيشات',
          executionLevel: (w.executionLevel || (isDone ? 'تم' : isInProgress ? 'قيد التنفيذ' : 'مخطط')) as any,
          followUp: w.followUpNotes || (isDone ? 'تم تنفيذ الورشة وتوثيقها - انقر هنا لمطالعة التقرير المعتمد' : 'متابعة الأثر التدريبي والتفعيل الميداني'),
          reportWorkshop: w,
          externalUrl: w.evidenceUrl || w.evidenceFileUrl
        });
      });
    } else {
      // Fallback baseline if DB not yet loaded
      rows.push(...BASELINE_PLAN_ITEMS_2627.map(r => ({ ...r, rowType: 'collective' as const })));
    }

    // B. Individual Workshops for the selected academic year
    const relevantInd = individualRecords.filter(r => 
      r.academicYear === targetYear || 
      (!r.academicYear && targetYear === '2026-2027' && (r.trainingDate?.includes('2026') || r.trainingDate?.includes('2027')))
    );
    const indToUse = relevantInd.length > 0 ? relevantInd : (targetYear === '2026-2027' ? individualRecords.slice(0, 14) : []);

    if (indToUse.length > 0) {
      const sortedInd = [...indToUse].sort((a, b) => {
        if (a.trainingDate && b.trainingDate) return new Date(b.trainingDate).getTime() - new Date(a.trainingDate).getTime();
        return 0;
      });

      sortedInd.forEach(r => {
        const titleText = r.skillProvided 
          ? (r.skillProvided.startsWith('ورشة') || r.skillProvided.startsWith('تدريب') ? r.skillProvided : `ورشة فردية: ${r.skillProvided}`)
          : 'جلسة تطوير مهني فردي';

        rows.push({
          id: r.id.startsWith('ind-') || r.id.startsWith('plan-') ? r.id : `plan-ind-${r.id}`,
          rowType: 'individual',
          title: titleText,
          targetAudience: `${r.traineeNameAr} (${r.department || 'الهيئة التدريسية'})`,
          procedure: r.notes || `جلسة تدريب وتطوير مهني فردي وتطبيقي (${r.trainingType || 'تدريب فردي'}) لتمكين المعلم من المهارات التكنولوجية في ${r.skillProvided || 'الأنظمة والمنصات التعليمية'} (${r.durationMinutes || 20} دقيقة)`,
          timeframe: r.trainingDate || (r.month ? `${r.month} ${targetYear}` : 'الفصل الدراسي الأول'),
          trainer: r.trainerName || 'أحمد طبيشات',
          executionLevel: 'تم',
          followUp: r.signatureStatus === 'تم التوقيع'
            ? `تم إنجاز جلسة التطوير الفردي مع توقيع المعلم على الإقرار والاستفادة (${r.durationMinutes || 20} دقيقة)`
            : `تم إنجاز جلسة التطوير الفردي بنجاح (${r.durationMinutes || 20} دقيقة)`,
          individualRecord: r
        });
      });
    }

    // C. MEEE Certification Program (Dynamic synthesized row from meeeRecords)
    if (meeeStats.certifiedCount > 0) {
      rows.push({
        id: 'plan-dynamic-meee',
        rowType: 'program',
        title: 'برنامج تأهيل واعتماد معلّمي مايكروسوفت الخبراء (MIEE)',
        targetAudience: 'كافة أعضاء الهيئة التدريسية والإدارية بالمدرسة',
        procedure: 'تنظيم ورش عمل وجلسات إرشادية وتدريبية لدعم المعلمين في إعداد ملفات الترشح لاجتياز معايير خبراء مايكروسوفت للتعلم الإبداعي MIEE',
        timeframe: 'أغسطس - سبتمبر ٢٠٢٦م',
        trainer: 'أحمد طبيشات (منسق المشاريع الإلكترونية)',
        executionLevel: 'تم',
        followUp: `تم اعتماد ${meeeStats.certifiedCount} معلماً كمعلم خبير مايكروسوفت (MIEE) بنسبة إنجاز بلغت ${meeeStats.certifiedRate}% من إجمالي الكادر التدريسي بالمدرسة (${meeeStats.totalTeachers} معلماً)`
      });
    }

    return rows;
  }, [workshops, individualRecords, meeeStats, filterYear]);

  // Active Plan Rows: Smart merge between dynamic defaultPlanRows and custom manual edits
  const activePlanRows = useMemo(() => {
    if (!customRows || customRows.length === 0) {
      return defaultPlanRows;
    }
    const customIdSet = new Set(customRows.map(r => r.id));
    const deletedSet = new Set(deletedRowIds);
    
    // New items from defaultPlanRows that were not in customRows and not deleted
    const newItems = defaultPlanRows.filter(r => !customIdSet.has(r.id) && !deletedSet.has(r.id));
    
    // Existing items following customRows order with live references merged
    const orderedExisting = customRows
      .filter(r => !deletedSet.has(r.id))
      .map(customRow => {
        const defaultMatch = defaultPlanRows.find(d => d.id === customRow.id);
        if (defaultMatch) {
          return {
            ...customRow,
            reportWorkshop: defaultMatch.reportWorkshop || customRow.reportWorkshop,
            individualRecord: defaultMatch.individualRecord || customRow.individualRecord,
            rowType: defaultMatch.rowType || customRow.rowType
          };
        }
        return customRow;
      });

    // New items (newly added collective or individual workshops) are prepended so they are instantly visible
    return [...newItems, ...orderedExisting];
  }, [customRows, defaultPlanRows, deletedRowIds]);

  // Filtered rows for the view
  const collectiveCount = useMemo(() => activePlanRows.filter(r => (r.rowType || 'collective') === 'collective').length, [activePlanRows]);
  const individualCount = useMemo(() => activePlanRows.filter(r => r.rowType === 'individual').length, [activePlanRows]);
  const programCount = useMemo(() => activePlanRows.filter(r => r.rowType === 'program').length, [activePlanRows]);

  const displayedRows = useMemo(() => {
    if (planFilter === 'all') return activePlanRows;
    return activePlanRows.filter(r => (r.rowType || 'collective') === planFilter);
  }, [activePlanRows, planFilter]);

  // Handlers for Row Actions
  const handleSaveRow = (updatedRow: PlanRow) => {
    const current = [...activePlanRows];
    const idx = current.findIndex(r => r.id === updatedRow.id);
    let next: PlanRow[];
    if (idx >= 0) {
      next = current.map(r => r.id === updatedRow.id ? updatedRow : r);
    } else {
      next = [updatedRow, ...current];
    }
    setCustomRows(next);
    try {
      localStorage.setItem('qstss_custom_pd_plan_2627', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    setEditingRow(null);
    setIsAddingRow(false);
  };

  const handleDeleteRow = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البند من خطة التطوير المهني؟')) return;
    const newDeleted = [...deletedRowIds, id];
    setDeletedRowIds(newDeleted);
    const next = activePlanRows.filter(r => r.id !== id);
    setCustomRows(next);
    try {
      localStorage.setItem('qstss_deleted_plan_row_ids', JSON.stringify(newDeleted));
      localStorage.setItem('qstss_custom_pd_plan_2627', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activePlanRows.length) return;
    const next = [...activePlanRows];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setCustomRows(next);
    try {
      localStorage.setItem('qstss_custom_pd_plan_2627', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetToDefault = () => {
    if (!window.confirm('هل أنت متأكد من استعادة الخطة الافتراضية؟ سيتم إلغاء كافة التعديلات اليدوية المحفوظة.')) return;
    setCustomRows(null);
    setDeletedRowIds([]);
    try {
      localStorage.removeItem('qstss_custom_pd_plan_2627');
      localStorage.removeItem('qstss_deleted_plan_row_ids');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pd-plan-container">
      {/* ── Top Header Actions ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={26} color="#00B4D8" />
              خطة التطوير المهني - قسم التعلم الإلكتروني
            </h2>
            <span style={{ background: '#0F2044', color: '#fff', fontSize: '0.74rem', padding: '0.2rem 0.65rem', borderRadius: '6px', fontWeight: 800 }}>
              الفصل الدراسي الأول لسنة ٢٠٢٦-٢٠٢٧م
            </span>
            {customRows && (
              <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>
                تم تعديل الخطة يدوياً ✓
              </span>
            )}
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
            مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين | خطة التمكين التكنولوجي المعتمدة
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Edit Plan Fields Toggle Button */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: isEditMode ? '#10B981' : '#F8FAFC',
              color: isEditMode ? '#fff' : '#0F2044',
              border: isEditMode ? 'none' : '1.5px solid #CBD5E1',
              padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: isEditMode ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {isEditMode ? <Check size={16} /> : <Edit3 size={16} />}
            <span>{isEditMode ? '✓ إنهاء التعديل اليدوي' : '✏️ تعديل خانات الخطة يدوياً'}</span>
          </button>

          {canEdit && onAddWorkshop && (
            <button
              onClick={onAddWorkshop}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE',
                padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.08)'
              }}
            >
              <Users size={16} />
              <span>+ إضافة ورشة جماعية للخطة</span>
            </button>
          )}

          {canEdit && onAddIndividual && (
            <button
              onClick={onAddIndividual}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#ECFDF5', color: '#047857', border: '1.5px solid #A7F3D0',
                padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(16,185,129,0.08)'
              }}
            >
              <Plus size={16} />
              <span>+ إضافة ورشة فردية للخطة</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#0F2044', color: '#fff', border: 'none',
              padding: '0.65rem 1.5rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,32,68,0.15)'
            }}
          >
            <Printer size={16} />
            <span>طباعة خطة التطوير المهني المعتمدة</span>
          </button>
        </div>
      </div>

      {/* ── Edit Mode Banner (Shown when Edit Mode is active) ── */}
      {isEditMode && (
        <div className="no-print" style={{
          background: '#EFF6FF',
          border: '1.5px solid #93C5FD',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Edit3 size={20} color="#2563EB" />
            <div>
              <strong style={{ color: '#1E40AF', fontSize: '0.88rem' }}>
                وضع تعديل خانات خطة التطوير المهني مفعّل
              </strong>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#3B82F6' }}>
                انقر على زر <strong>تعديل</strong> أمام أي بند لتعديل خاناته مباشرة، أو انقر على <strong>+ إضافة بند جديد</strong>، والتعديلات تُحفظ تلقائياً في النظام.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsAddingRow(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#2563EB', color: '#fff', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
              }}
            >
              <Plus size={15} />
              <span>+ إضافة بند جديد للخطة</span>
            </button>

            {customRows && (
              <button
                onClick={handleResetToDefault}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
                  padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} />
                <span>استعادة الخطة الافتراضية</span>
              </button>
            )}

            <button
              onClick={() => setIsEditMode(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: '#0F2044', color: '#fff', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Check size={15} />
              <span>إنهاء وضع التعديل</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Printable Official Header (Shown on print) ── */}
      <div className="print-only" style={{ marginBottom: '1.25rem' }}>
        <OfficialReportHeader
          title="خطة التطوير المهني والتمكين التكنولوجي - الفصل الأول ٢٠٢٦-٢٠٢٧م"
          subtitle="قسم التعلم الإلكتروني والحلول الرقمية"
          reportCode="QSTSS-PD-PLAN-2026-2027-T1"
          academicYear="2026-2027"
          reportDate="الفصل الدراسي الأول ٢٠٢٦-٢٠٢٧م"
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F1F5F9',
          border: '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '0.45rem 1rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#0F2044',
          marginTop: '0.5rem'
        }}>
          <div><strong>المدرسة:</strong> مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
          <div><strong>القسم:</strong> قسم التعلم الإلكتروني والحلول الرقمية</div>
          <div><strong>العام الأكاديمي:</strong> ٢٠٢٦-٢٠٢٧م (الفصل الدراسي الأول)</div>
          <div><strong>رمز الخطة المعتمدة:</strong> QSTSS-PD-PLAN-2026-2027-T1</div>
        </div>
      </div>

      {/* ── Official Introduction Card (Mandatory Text) ── */}
      <div className="print-avoid-break" style={{
        background: '#F8FAFC',
        border: '1.5px solid #CBD5E1',
        borderRight: '6px solid #0F2044',
        borderRadius: '16px',
        padding: '1.25rem 1.6rem',
        marginBottom: '1.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
          <div style={{ background: '#0F2044', color: '#fff', borderRadius: '8px', padding: '0.35rem', display: 'flex' }}>
            <BookOpen size={18} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
            مقدمة وأهداف خطة التطوير المهني (الفصل الدراسي الأول لسنة ٢٠٢٦م)
          </h3>
        </div>
        <p style={{
          margin: 0,
          fontSize: '0.88rem',
          color: '#1E293B',
          lineHeight: '1.85',
          fontWeight: 600,
          textAlign: 'justify'
        }}>
          تهدف خطة التطوير المهني للفصل الأول لسنة ٢٠٢٦م في قسم التعلم الإلكتروني في مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين إلى توفير فرصة التطوير المهني المدمجة والمتطورة لأعضاء الهيئة التدريسية والإدارية، وتعتمد الخطة دائما على المتطلبات والاحتياجات التكنولوجية التي يحتاجونها المتدربون لمساعدتهم وتمكينهم في اكتساب المهارات التكنولوجية المطلوبة لتنفيذ واستخدام الأنظمة والأدوات التكنولوجية بكل كفاءة واحترافية عالية.
        </p>
      </div>

      {/* ── Section: إنجازات التطوير المهني & إحصاءات الورش الفردية ── */}
      <div className="print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* 1. PD Achievements Card (MEEE & Showcase School) */}
        <div style={{
          background: 'linear-gradient(145deg, #0F2044 0%, #172E5D 100%)',
          color: '#fff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #1E3A8A',
          boxShadow: '0 4px 15px rgba(15,32,68,0.12)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={20} color="#FBBF24" />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#fff' }}>
                  إنجازات واعتمادات التطوير المهني (لسنة ٢٠٢٦-٢٠٢٧م)
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(251,191,36,0.2)', color: '#FCD34D', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800, border: '1px solid rgba(251,191,36,0.35)' }}>
                اعتمادات مايكروسوفت ٢٠٢٦-٢٠٢٧م
              </span>
            </div>

            {/* Achievement 1: Showcase School */}
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '0.85rem',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(245,158,11,0.35)', flexShrink: 0
              }}>
                <Award size={26} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.90rem', color: '#fff' }}>
                    مدرسة نموذجية من مايكروسوفت (Microsoft Showcase School)
                  </span>
                  <span style={{ fontSize: '0.68rem', background: '#10B981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    معتمد ٢٠٢٦-٢٠٢٧م 🌟
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.74rem', color: '#E2E8F0', lineHeight: 1.45 }}>
                  حصول مدرسة قطر للعلوم والتكنولوجيا على التجديد والاعتماد كمدرسة نموذجية ورائدة عالمياً من شركة مايكروسوفت للعام الأكاديمي ٢٠٢٦-٢٠٢٧م تقديراً للريادة في دمج الذكاء الاصطناعي والتحول الرقمي.
                </p>
              </div>
            </div>

            {/* Achievement 2: MIEE Certification (ONLY Statistics & Numbers, NO Teacher Names in Print) */}
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              border: '1px solid rgba(255,255,255,0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <BadgeCheck size={22} color="#fff" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                      شهادة خبير مايكروسوفت للتعليم الابتكاري (MIEE) ٢٠٢٦-٢٠٢٧م
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#BAE6FD' }}>
                      إجمالي الحاصلين: {meeeStats.certifiedCount} معلماً معتمداً | قيد التقديم: {meeeStats.appliedCount} | نسبة التغطية {meeeStats.certifiedRate}% ({meeeStats.certifiedCount} من أصل {meeeStats.totalTeachers} معلماً)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCertifiedList(!showCertifiedList)}
                  className="no-print"
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
                    padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700
                  }}
                >
                  <span>{showCertifiedList ? 'إخفاء أسماء المعلمين' : 'عرض أسماء المعلمين (للمعاينة)'}</span>
                  {showCertifiedList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* MEEE Official Statistics & Numbers Summary (Always visible on print & screen) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.45rem',
                marginBottom: '0.65rem'
              }}>
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#A7F3D0', display: 'block', fontWeight: 700 }}>الحاصلين على الشهادة</span>
                  <strong style={{ fontSize: '1.1rem', color: '#34D399', fontWeight: 900 }}>{meeeStats.certifiedCount} معلماً</strong>
                </div>
                <div style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '8px', padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#BAE6FD', display: 'block', fontWeight: 700 }}>نسبة التغطية المدرسية</span>
                  <strong style={{ fontSize: '1.1rem', color: '#38BDF8', fontWeight: 900 }}>{meeeStats.certifiedRate}% <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>({meeeStats.certifiedCount}/{meeeStats.totalTeachers})</span></strong>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#FDE68A', display: 'block', fontWeight: 700 }}>معدل النجاح للمتقدمين</span>
                  <strong style={{ fontSize: '1.1rem', color: '#FBBF24', fontWeight: 900 }}>%{meeeStats.successRate}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#CBD5E1', display: 'block', fontWeight: 700 }}>قيد التقديم</span>
                  <strong style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 900 }}>{meeeStats.appliedCount}</strong>
                </div>
              </div>

              {/* Department Numbers Breakdown Strip (Always visible on print & screen) */}
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#BAE6FD', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📊 إحصائيات وأعداد الحاصلين على شهادة MIEE حسب الأقسام الأكاديمية (10 أقسام):</span>
                  <span style={{ color: '#34D399' }}>القسم المتصدر: {meeeStats.topDept}</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.35rem'
                }}>
                  {meeeStats.deptCounts.map((d: any) => (
                    <div key={d.name} style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.45rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.68rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{d.name}</span>
                      <span style={{ color: d.rate >= 70 ? '#34D399' : '#38BDF8', fontWeight: 900 }}>
                        {d.count}/{d.total} ({d.rate}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certified Teachers Badges Grid - ONLY ON SCREEN WHEN TOGGLED, STRICTLY HIDDEN ON PRINT */}
              {showCertifiedList && (
                <div 
                  className="no-print pd-certified-grid"
                  style={{
                    marginTop: '0.65rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.45rem'
                  }}
                >
                  <div style={{ gridColumn: '1 / -1', fontSize: '0.68rem', color: '#FCD34D', fontWeight: 700, marginBottom: '0.2rem' }}>
                    (ملاحظة: أسماء المعلمين تظهر هنا على الشاشة فقط، ولن تظهر عند الطباعة تلبية للضوابط الرسمية)
                  </div>
                  {meeeStats.certifiedList.map((r: any, i: number) => (
                    <div key={r.id || i} className="pd-cert-badge" style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      <span style={{ color: '#10B981', fontSize: '0.8rem' }}>✓</span>
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fff' }}>{r.teacherName}</div>
                        <div style={{ fontSize: '0.66rem', color: '#93C5FD' }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Individual PD Stats Card (14 Sessions for Term 1 2026-2027) */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '1.25rem 1.4rem',
          border: '1.5px solid #CBD5E1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#0284C7" />
                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, color: '#0F2044' }}>
                  إحصائيات التدريب الفردي للمعلمين (الفصل الأول ٢٠٢٦-٢٠٢٧م)
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#F0FDF4', color: '#047857', padding: '0.18rem 0.55rem', borderRadius: '6px', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                {individualStats.totalSessions} جلسة معتمدة
              </span>
            </div>

            {/* Top Stat Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block' }}>إجمالي الورش الفردية المنفذة</span>
                <strong style={{ fontSize: '1.4rem', color: '#0F2044', fontWeight: 900 }}>{individualStats.totalSessions}</strong>
                <span style={{ fontSize: '0.68rem', color: '#0284C7', fontWeight: 700, display: 'block' }}>جلسة دعم فني وتطوير</span>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block' }}>عدد المعلمين المستفيدين</span>
                <strong style={{ fontSize: '1.4rem', color: '#10B981', fontWeight: 900 }}>{individualStats.uniqueTeachers}</strong>
                <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, display: 'block' }}>معلماً متدرباً</span>
              </div>
            </div>

            {/* Skills Breakdown for individual sessions */}
            <div className="pd-skills-container" style={{ maxHeight: '145px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                توزيع الورش الفردية ({individualStats.totalSessions} جلسة) حسب المهارة التكنولوجية المقدمة:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {individualStats.skillList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem' }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.skill}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: '#0284C7', fontWeight: 800 }}>{item.sessions} جلسة</span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>{item.teachersCount} معلم</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Plan Table ── */}
      <div className="pd-table-container" style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1.5px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#0F2044',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: '#fff' }}>
                جدول خطة التطوير المهني والتمكين التكنولوجي (الورش الجماعية والفردية) - الفصل الأول ٢٠٢٦-٢٠٢٧م
              </h3>
              <span style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.2)', color: '#38BDF8', padding: '0.15rem 0.55rem', borderRadius: '6px', fontWeight: 800, border: '1px solid rgba(56,189,248,0.35)' }}>
                تحديث لحظي ومباشر ✓
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#BAE6FD', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
              يتم تحديث الخطة تلقائياً ومباشرة عند إدراج أي ورشة تدريبية جماعية أو فردية جديدة
            </span>

            {/* Quick Filter Tabs */}
            <div className="no-print" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <button
                onClick={() => setPlanFilter('all')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'all' ? '#0284C7' : 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  boxShadow: planFilter === 'all' ? '0 2px 6px rgba(2,132,199,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                📋 كل البنود ({activePlanRows.length})
              </button>
              <button
                onClick={() => setPlanFilter('collective')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'collective' ? '#0284C7' : 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  boxShadow: planFilter === 'collective' ? '0 2px 6px rgba(2,132,199,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                👥 الورش الجماعية ({collectiveCount})
              </button>
              <button
                onClick={() => setPlanFilter('individual')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'individual' ? '#0284C7' : 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  boxShadow: planFilter === 'individual' ? '0 2px 6px rgba(2,132,199,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                👤 ورش التطوير الفردي ({individualCount})
              </button>
              {programCount > 0 && (
                <button
                  onClick={() => setPlanFilter('program')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: planFilter === 'program' ? '#0284C7' : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    boxShadow: planFilter === 'program' ? '0 2px 6px rgba(2,132,199,0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  🎓 البرامج والاعتمادات ({programCount})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isEditMode && (
              <button
                onClick={() => setIsAddingRow(true)}
                className="no-print"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Plus size={14} />
                <span>إضافة بند يدوي</span>
              </button>
            )}
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.25rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
              المعروض: {displayedRows.length} من أصل {activePlanRows.length} بند
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.78rem',
            textAlign: 'right',
            fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif"
          }}>
            <thead>
              {/* Top Main Headers */}
              <tr style={{ background: '#0F2044', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th rowSpan={2} style={{ padding: '0.75rem 0.8rem', fontWeight: 900, textAlign: 'center', width: '38px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>#</th>
                <th rowSpan={2} style={{ padding: '0.75rem 0.85rem', fontWeight: 900, width: '190px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>اسم البرنامج</th>
                <th rowSpan={2} style={{ padding: '0.75rem 0.85rem', fontWeight: 900, width: '135px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>الفئة المستهدفة</th>
                <th rowSpan={2} style={{ padding: '0.75rem 0.95rem', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>الاجراء</th>
                <th rowSpan={2} style={{ padding: '0.75rem 0.8rem', fontWeight: 900, textAlign: 'center', width: '105px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>الإطار الزمني</th>
                <th rowSpan={2} style={{ padding: '0.75rem 0.8rem', fontWeight: 900, textAlign: 'center', width: '110px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>المدرب</th>
                <th colSpan={2} style={{ padding: '0.5rem 0.8rem', fontWeight: 900, textAlign: 'center', background: '#0B1730', borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
                  يتم ملء هذا العمود في نهاية كل تدريب
                </th>
                {isEditMode && (
                  <th rowSpan={2} className="no-print" style={{ padding: '0.75rem 0.6rem', fontWeight: 900, textAlign: 'center', width: '110px', background: '#1E3A8A', color: '#93C5FD' }}>
                    تعديل الخانات
                  </th>
                )}
              </tr>
              {/* Sub Headers for the last column */}
              <tr style={{ background: '#0B1730', color: '#ffffff' }}>
                <th style={{ padding: '0.55rem 0.6rem', fontWeight: 900, textAlign: 'center', width: '85px', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>مستوى التنفيذ</th>
                <th style={{ padding: '0.55rem 0.85rem', fontWeight: 900, width: '220px' }}>المتابعة</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, idx) => {
                const isEven = idx % 2 === 0;
                const realIdx = activePlanRows.findIndex(r => r.id === row.id);
                return (
                  <tr 
                    key={row.id} 
                    onDoubleClick={() => isEditMode && setEditingRow(row)}
                    style={{ 
                      background: isEven ? '#ffffff' : '#F8FAFC', 
                      borderBottom: '1px solid #E2E8F0', 
                      verticalAlign: 'top',
                      cursor: isEditMode ? 'pointer' : 'default'
                    }}
                    title={isEditMode ? 'انقر نقراً مزدوجاً لتعديل خانات هذا البند' : undefined}
                  >
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#64748B', borderLeft: '1px solid #E2E8F0' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: '#0F2044', borderLeft: '1px solid #E2E8F0', lineHeight: 1.45 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {row.rowType === 'individual' ? (
                            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: '0.66rem', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                              👤 تدريب فردي
                            </span>
                          ) : row.rowType === 'program' ? (
                            <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '0.66rem', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                              🎓 برنامج واعتمادات
                            </span>
                          ) : (
                            <span style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', fontSize: '0.66rem', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                              👥 ورشة جماعية
                            </span>
                          )}
                          <span style={{ fontWeight: 800, color: '#0F2044', lineHeight: 1.45 }}>{row.title}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#334155', borderLeft: '1px solid #E2E8F0', lineHeight: 1.35 }}>
                      {row.targetAudience}
                    </td>
                    <td style={{ padding: '0.75rem 0.95rem', color: '#475569', borderLeft: '1px solid #E2E8F0', lineHeight: 1.5, fontSize: '0.75rem' }}>
                      {row.procedure}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 700, color: '#0F2044', borderLeft: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                      {row.timeframe}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 700, color: '#0F2044', borderLeft: '1px solid #E2E8F0' }}>
                      {row.trainer}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        display: 'inline-block',
                        background: row.executionLevel === 'تم' ? '#D1FAE5' : row.executionLevel === 'قيد التنفيذ' ? '#FEF3C7' : '#F1F5F9',
                        color: row.executionLevel === 'تم' ? '#065F46' : row.executionLevel === 'قيد التنفيذ' ? '#92400E' : '#64748B',
                        border: `1px solid ${row.executionLevel === 'تم' ? '#A7F3D0' : row.executionLevel === 'قيد التنفيذ' ? '#FDE68A' : '#CBD5E1'}`
                      }}>
                        {row.executionLevel}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', lineHeight: 1.45, fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ color: '#334155', whiteSpace: 'pre-line' }}>
                          {row.followUp}
                        </div>

                        {/* Interactive Action Buttons */}
                        {row.reportWorkshop && (
                          <div className="no-print" style={{ marginTop: '0.25rem' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onViewReport(row.reportWorkshop!); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: '#E0F2FE',
                                color: '#0369A1',
                                border: '1px solid #BAE6FD',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.70rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <FileText size={12} />
                              <span>استعراض تقرير الورشة المعتمد ←</span>
                            </button>
                          </div>
                        )}

                        {row.individualRecord && (
                          <div className="no-print" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {onViewIndividualReport && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onViewIndividualReport(row.individualRecord!); }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  background: '#ECFDF5',
                                  color: '#065F46',
                                  border: '1px solid #A7F3D0',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.70rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <FileText size={12} />
                                <span>تقرير وإقرار التدريب الفردي ←</span>
                              </button>
                            )}
                            {row.individualRecord.signatureStatus === 'تم التوقيع' && (
                              <span style={{ color: '#059669', fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={12} /> معتمد وموقع
                              </span>
                            )}
                          </div>
                        )}

                        {row.externalUrl && (
                          <>
                            <div className="no-print" style={{ marginTop: '0.2rem' }}>
                              <a
                                href={row.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  color: '#0284C7',
                                  fontSize: '0.70rem',
                                  fontWeight: 800,
                                  textDecoration: 'none'
                                }}
                              >
                                <ExternalLink size={12} />
                                <span>زيارة الرابط المنشور</span>
                              </a>
                            </div>
                            <div className="print-only" style={{ marginTop: '0.25rem', fontSize: '0.68rem', color: '#0369A1', fontWeight: 700 }}>
                              رابط المنشور: {row.externalUrl}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Edit Mode Row Action Buttons */}
                    {isEditMode && (
                      <td className="no-print" style={{ padding: '0.5rem 0.35rem', textAlign: 'center', verticalAlign: 'middle', borderLeft: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingRow(row); }}
                            title="تعديل خانات هذا البند"
                            style={{
                              background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD',
                              borderRadius: '6px', padding: '0.3rem 0.55rem', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.70rem', fontWeight: 800
                            }}
                          >
                            <Edit3 size={13} />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRow(row.id); }}
                            title="حذف هذا البند"
                            style={{
                              background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
                              borderRadius: '6px', padding: '0.3rem 0.45rem', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                          <button
                            disabled={realIdx <= 0}
                            onClick={(e) => { e.stopPropagation(); handleMoveRow(realIdx, 'up'); }}
                            title="تحريك لأعلى"
                            style={{
                              background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px',
                              padding: '0.2rem 0.35rem', cursor: realIdx <= 0 ? 'not-allowed' : 'pointer',
                              opacity: realIdx <= 0 ? 0.4 : 1
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            disabled={realIdx < 0 || realIdx >= activePlanRows.length - 1}
                            onClick={(e) => { e.stopPropagation(); handleMoveRow(realIdx, 'down'); }}
                            title="تحريك لأسفل"
                            style={{
                              background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px',
                              padding: '0.2rem 0.35rem', cursor: (realIdx < 0 || realIdx >= activePlanRows.length - 1) ? 'not-allowed' : 'pointer',
                              opacity: (realIdx < 0 || realIdx >= activePlanRows.length - 1) ? 0.4 : 1
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Official Administrative Endorsements (Shown on print and screen) ── */}
      <div 
        className="print-avoid-break"
        style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '2px solid #CBD5E1',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem',
          textAlign: 'center'
        }}
      >
        <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.65rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            إعداد وتنسيق الخطة
          </span>
          <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>
            م. أحمد عادل طبيشات
          </span>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>منسق المشاريع الإلكترونية</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.65rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            مراجعة واعتماد الخطة
          </span>
          <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>
            د. راني التوم
          </span>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>النائب الأكاديمي</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.65rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            اعتماد مدير المدرسة
          </span>
          <img src="/principal-signature.png" alt="توقيع مدير المدرسة" style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>
            محمد علي مندني العمادي
          </span>
          <span style={{ fontSize: '0.68rem', color: '#64748B' }}>مدير المدرسة</span>
        </div>
      </div>

      {/* ── Edit / Add Plan Row Modal ── */}
      <PlanRowModal
        isOpen={Boolean(editingRow) || isAddingRow}
        row={editingRow}
        isNew={isAddingRow}
        onClose={() => { setEditingRow(null); setIsAddingRow(false); }}
        onSave={handleSaveRow}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A3 landscape !important;
          margin: 10mm 12mm 10mm 12mm !important;
        }

        @media screen {
          .print-only {
            display: none !important;
          }
          .screen-hidden {
            display: none !important;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }

          body, html {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 9.5pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .pd-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            min-height: auto !important;
          }

          .pd-plan-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }

          /* Certified educators grid: STRICTLY HIDDEN IN PRINT - ONLY STATISTICS & NUMBERS */
          .pd-certified-grid, .pd-cert-badge {
            display: none !important;
          }

          /* Individual PD skills container: fully expanded in print */
          .pd-skills-container {
            max-height: none !important;
            overflow: visible !important;
          }

          /* Main Plan Table */
          .pd-table-container {
            overflow: visible !important;
            box-shadow: none !important;
            border: 1.5px solid #0F2044 !important;
            border-radius: 12px !important;
            margin-bottom: 1.5rem !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .pd-table-container table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }

          .pd-table-container thead {
            display: table-header-group !important;
          }

          .pd-table-container tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .pd-table-container td, .pd-table-container th {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
}
