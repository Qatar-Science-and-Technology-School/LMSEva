'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  db,
  MONTHS,
  ACADEMIC_YEARS,
  getPerformanceLevel,
  getDeptName,
  SCHOOL_NAME,
  getUserDeptIds,
  getMonthlyDepartmentHonorees,
  TOP_10_INDEX_TEACHERS,
  SEPTEMBER_2026_LMS_TEACHERS,
  SECTIONS_LMS_STATS,
} from '@/lib/data';
import type { User, Evaluation, Teacher, Department } from '@/lib/data';
import { printTeacherCertificate, printBatchCertificates } from '@/lib/certificatePrinter';
import * as XLSX from 'xlsx';
import PrintHeader from '@/components/PrintHeader';

interface Props {
  currentUser: User;
  selectedYear?: string;
  onNavigateToPage?: (page: string) => void;
}

// Available months
const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

// Top 10 Department Champions (One Best Teacher from Each of the 10 Departments based on official 27 Sep 2026 report)
export const DEPARTMENT_CHAMPIONS_10 = [
  {
    rank: 1,
    department: 'اللغة العربية',
    teacherName: 'ابراهيم حلمى ابراهيم جمعه',
    score: 98.40,
    evalScore: 96.70,
    lessonsScore: 100.00,
    sectionsCount: 3,
    title: 'فارس قسم اللغة العربية وبطل المدرسة الأول',
    achievement: 'المركز الأول على مستوى المدرسة بمؤشر تقييمات 96.7%، وتفعيل كامل للدروس 100% (78 درساً منها 45 ظاهرة)، وتصحيح 100% لـ 171 تسليماً، ونسبة حل 89.1%، والتزام 4 تقييمات لكل شعبة.',
  },
  {
    rank: 2,
    department: 'التربية الإسلامية',
    teacherName: 'علاء حسني محمد موسى',
    score: 91.65,
    evalScore: 83.30,
    lessonsScore: 100.00,
    sectionsCount: 2,
    title: 'فارس قسم التربية الإسلامية',
    achievement: 'تصدر القسم بنسبة حل مرتفعة 88% وتصحيح كامل 100% للتسليمات، وتفعيل كامل للدروس 100% (34 درساً منها 18 ظاهرة) بجميع أقسامها.',
  },
  {
    rank: 3,
    department: 'العلوم والتكنولوجيا (STEM)',
    teacherName: 'امجد سهيل عزيز',
    score: 89.45,
    evalScore: 78.90,
    lessonsScore: 100.00,
    sectionsCount: 4,
    title: 'فارس قسم العلوم والتكنولوجيا (STEM)',
    achievement: 'المركز الأول في قسم STEM، التزام بـ 4.75 تقييم لكل شعبة (19 تقييماً مسنداً)، وتصحيح 110 تسليمات، وتفعيل كامل للدروس 100% (16 درساً مستوفية لجميع الشعب الأربع).',
  },
  {
    rank: 4,
    department: 'المختبرات التخصصية',
    teacherName: 'على سالم على سالمين الصيعري',
    score: 84.65,
    evalScore: 88.90,
    lessonsScore: 80.40,
    sectionsCount: 7,
    title: 'فارس المختبرات التخصصية ومختبر التصنيع',
    achievement: 'تصدر معلمي المختبرات بالمدرسة بمؤشر تقييمات 88.9%، وإسناد 32 تقييماً مسنداً بمعدل 4.6 تقييم لكل شعبة، وتصحيح 291 تسليماً (87.4%)، ورفع 29 درساً مستوفية.',
  },
  {
    rank: 5,
    department: 'الدراسات الاجتماعية',
    teacherName: 'فيصل محمد مسلم الحضري',
    score: 66.25,
    evalScore: 85.00,
    lessonsScore: 47.50,
    sectionsCount: 6,
    title: 'فارس قسم الدراسات الاجتماعية',
    achievement: 'تحقيق المركز الخامس على مستوى المدرسة في التقييمات بمؤشر 85%، والالتزام بـ 4 تقييمات لكل شعبة بإجمالي 24 تقييماً، وتصحيح 224 تسليماً بنسبة 81.8% ونسبة حل 71.4%.',
  },
  {
    rank: 6,
    department: 'الرياضيات',
    teacherName: 'محمد عماد ازكول',
    score: 85.95,
    evalScore: 71.90,
    lessonsScore: 100.00,
    sectionsCount: 1,
    title: 'فارس قسم الرياضيات',
    achievement: 'تصدر القسم بنسبة حل متميزة بلغت 93.8%، وتصحيح 100% للتسليمات، وتفعيل كامل للدروس 100% لجميع الشعب (19 درساً مستوفية دون أي نواقص).',
  },
  {
    rank: 7,
    department: 'الفيزياء',
    teacherName: 'ضرار حسن صادق ملاح',
    score: 100.00,
    evalScore: 100.00,
    lessonsScore: 100.00,
    sectionsCount: 2,
    title: 'فارس قسم الفيزياء (مقررات AP)',
    achievement: 'تحقيق مؤشر تفعيل الدروس كاملاً 100% لجميع الشعب المسندة لمقرر الفيزياء 1 AP (12 درساً ظاهراً مستوفياً بجميع الأقسام الرقمية).',
  },
  {
    rank: 8,
    department: 'تكنولوجيا التصميم',
    teacherName: 'احمد اسامه صقر المعاني',
    score: 89.70,
    evalScore: 89.70,
    lessonsScore: 89.70,
    sectionsCount: 7,
    title: 'فارس قسم تكنولوجيا التصميم',
    achievement: 'المركز الأول في القسم بمؤشر تفعيل دروس 89.7%، وإتاحة 75 درساً ظاهراً للطلبة عبر 7 سجلات لشعب الصفين التاسع والعاشر.',
  },
  {
    rank: 9,
    department: 'علم الحاسوب',
    teacherName: 'امداد علي',
    score: 60.95,
    evalScore: 74.40,
    lessonsScore: 47.50,
    sectionsCount: 2,
    title: 'فارس قسم علم الحاسوب',
    achievement: 'تصدر القسم في التقييمات بمؤشر 74.4%، والالتزام بمعدل 5 تقييمات أسبوعية لكل شعبة (10 تقييمات)، وتصحيح 59 تسليماً ونسبة حل 70%.',
  },
  {
    rank: 10,
    department: 'اللغة الإنجليزية',
    teacherName: 'محمد ورسامي عمر',
    score: 90.00,
    evalScore: 90.00,
    lessonsScore: 90.00,
    sectionsCount: 7,
    title: 'فارس قسم اللغة الإنجليزية',
    achievement: 'تصدر القسم بمؤشر تفعيل دروس 90%، وإتاحة 26 درساً ظاهراً للطلبة بنسبة 100% استيفاء عبر 7 سجلات لشعب الصفين السابع والعاشر.',
  },
];

export default function TakreemPage({ currentUser, selectedYear: propYear, onNavigateToPage }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState(APPROVED_MONTHS[0]);
  const [selDept, setSelDept] = useState('');
  const [search, setSearch] = useState('');
  const [selPerf, setSelPerf] = useState('');

  // Custom Certificate State
  const [customTeacherId, setCustomTeacherId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [customBadge, setCustomBadge] = useState('شهادة شكر وتقدير وتكريم');

  // Tab state
  const [activeTab, setActiveTab] = useState<'top_honorees' | 'monthly' | 'custom_cert' | 'archive' | 'annual'>('top_honorees');

  useEffect(() => {
    Promise.all([db.getTeachers(), db.getEvaluations(), db.getDepartments()])
      .then(([t, e, d]) => {
        setTeachers(t);
        setEvaluations(e);
        setDepartments(d);
        if (t && t.length > 0) setCustomTeacherId(t[0].id);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (propYear) setSelYear(propYear);
  }, [propYear]);

  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = getUserDeptIds(currentUser);

  const availableMergedDepts = isCoord && coordDepts.length > 0
    ? departments.filter(d => coordDepts.includes(d.id))
    : departments;

  const currentHonorees = useMemo(() => {
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (isCoord && coordDepts.length > 0) {
      list = list.filter(h => coordDepts.includes(h.departmentId));
    }
    return list;
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);

  const monthlyTop10 = useMemo(() => {
    if (selMonth === 'سبتمبر') return [];
    const evs = evaluations.filter(e => e.academicYear === selYear && e.month === selMonth);
    if (evs.length === 0) return [];
    const sorted = [...evs].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.slice(0, 10).map((ev, idx) => {
      const t = teachers.find(x => x.id === ev.teacherId);
      const d = departments.find(x => x.id === t?.departmentId);
      return {
        rank: idx + 1,
        teacherId: ev.teacherId,
        teacherNameAr: t?.nameAr || 'معلم',
        departmentName: d?.nameAr || 'القسم الأكاديمي',
        totalScore: ev.totalScore,
        averageScore: ev.averageScore,
        performanceLevel: ev.performanceLevel,
      };
    });
  }, [evaluations, selYear, selMonth, teachers, departments]);

  const filteredHonorees = useMemo(() => {
    let list = currentHonorees;
    if (selDept) list = list.filter(h => h.departmentId === selDept);
    if (selPerf) list = list.filter(h => h.performanceLevel === selPerf);
    if (search) {
      list = list.filter(h =>
        h.teacherNameAr.includes(search) ||
        (h.teacherNameEn && h.teacherNameEn.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return list;
  }, [currentHonorees, selDept, selPerf, search]);

  // Annual Summary Logic
  const annualSummary = useMemo(() => {
    const allHonorees: any[] = [];
    APPROVED_MONTHS.forEach(m => {
      let monthList = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, m);
      if (isCoord && coordDepts.length > 0) {
        monthList = monthList.filter(h => coordDepts.includes(h.departmentId));
      }
      allHonorees.push(...monthList);
    });

    const teacherCounts: Record<string, number> = {};
    const deptConsistency: Record<string, number> = {};
    const deptScores: Record<string, number[]> = {};

    allHonorees.forEach(h => {
      teacherCounts[h.teacherId] = (teacherCounts[h.teacherId] || 0) + 1;
      deptConsistency[h.departmentName] = (deptConsistency[h.departmentName] || 0) + 1;
      if (!deptScores[h.departmentName]) deptScores[h.departmentName] = [];
      deptScores[h.departmentName].push(h.totalScore);
    });

    return { allHonorees, teacherCounts, deptConsistency, deptScores };
  }, [selYear, evaluations, isCoord, coordDepts, teachers, departments]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>⏳ جاري تحميل البيانات...</div>;
  }

  // Certificate Print Handler
  const handlePrintCertificate = (options: {
    teacherNameAr: string;
    departmentName: string;
    academicYear?: string;
    month?: string;
    totalScore?: number;
    recognitionReason?: string;
    badgeTitle?: string;
  }) => {
    printTeacherCertificate({
      teacherNameAr: options.teacherNameAr,
      departmentName: options.departmentName,
      academicYear: options.academicYear || selYear,
      month: options.month || selMonth,
      totalScore: options.totalScore,
      recognitionReason: options.recognitionReason,
      badgeTitle: options.badgeTitle || 'المعلم المتميز في نظام قطر للتعليم',
    });
  };

  const exportExcel = () => {
    const rows = filteredHonorees.map(h => ({
      'القسم': h.departmentName,
      'الاسم بالعربي': h.teacherNameAr,
      'الاسم بالإنجليزي': h.teacherNameEn,
      'المادة': h.subject,
      'الشهر': h.month,
      'العام الأكاديمي': h.academicYear,
      'الدرجة النهائية': h.totalScore,
      'متوسط الدرجة': h.averageScore,
      'مستوى الأداء': h.performanceLevel,
      'سبب التكريم': h.recognitionReason,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المكرمون');
    XLSX.writeFile(wb, `Takreem_${selMonth}_${selYear}.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.25rem',
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl' }}>
      <PrintHeader
        title="تقرير تكريم المعلمين وشهادات التقدير"
        subtitle={activeTab === 'annual' ? `ملخص التكريم السنوي - العام ${selYear}` : `تكريم شهر ${selMonth} - العام ${selYear}`}
      />

      {/* Header Banner */}
      <div
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          color: '#fff',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 16px rgba(15,32,68,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🏆</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#fff' }}>
              لوحة تكريم المعلمين وشهادات الشكر والتقدير
            </h1>
          </div>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
            مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين · تكريم العشرة الأوائل وفرسان الأقسام في تفعيل نظام قطر للتعليم والمنصات الرقمية
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)' }}>
              <span style={{ fontSize: '0.9rem' }}>📅</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>شهر التكريم والشهادات:</span>
              <select
                value={selMonth}
                onChange={(e) => setSelMonth(e.target.value)}
                style={{
                  background: '#fff',
                  color: '#0F2044',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {APPROVED_MONTHS.map(m => (
                  <option key={m} value={m} style={{ color: '#0F2044', fontWeight: 700 }}>
                    شهر {m} {m === 'سبتمبر' ? '(المعتمد حالياً)' : m === 'أكتوبر' ? '(الشهر القادم)' : ''}
                  </option>
                ))}
              </select>
              <span
                style={{
                  background: selMonth === 'سبتمبر' ? '#10B981' : '#F59E0B',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {selMonth === 'سبتمبر' ? 'معتمد ومكتمل' : 'قيد الانتظار'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (selMonth === 'سبتمبر') {
                const certList = TOP_10_INDEX_TEACHERS.map(t => ({
                  teacherNameAr: t.name,
                  departmentName: t.department,
                  totalScore: t.generalIndex,
                  recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${t.rank} على مستوى المدرسة في مؤشرات تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية لشهر ${selMonth} ${selYear}.`,
                  badgeTitle: `المركز ${t.rank} على مستوى المدرسة`,
                  month: selMonth,
                  academicYear: selYear,
                }));
                printBatchCertificates(certList);
              } else if (monthlyTop10.length > 0) {
                const certList = monthlyTop10.map((t: any, i: number) => ({
                  teacherNameAr: t.teacherNameAr,
                  departmentName: t.departmentName,
                  totalScore: t.totalScore,
                  recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${i + 1} على مستوى المدرسة في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                  badgeTitle: `المركز ${i + 1} على مستوى المدرسة`,
                  month: selMonth,
                  academicYear: selYear,
                }));
                printBatchCertificates(certList);
              } else {
                alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات الأوائل.`);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            <span>📜</span> طباعة شهادات العشرة الأوائل - {selMonth} (A4)
          </button>

          <button
            onClick={() => {
              if (selMonth === 'سبتمبر') {
                const certList = DEPARTMENT_CHAMPIONS_10.map(d => ({
                  teacherNameAr: d.teacherName,
                  departmentName: d.department,
                  totalScore: d.score,
                  recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.department} وحصوله على لقب (${d.title}) في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                  badgeTitle: d.title,
                  month: selMonth,
                  academicYear: selYear,
                }));
                printBatchCertificates(certList);
              } else if (currentHonorees.length > 0) {
                const certList = currentHonorees.map((d: any) => ({
                  teacherNameAr: d.teacherNameAr,
                  departmentName: d.departmentName,
                  totalScore: d.totalScore,
                  recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.departmentName} في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                  badgeTitle: `فارس قسم ${d.departmentName}`,
                  month: selMonth,
                  academicYear: selYear,
                }));
                printBatchCertificates(certList);
              } else {
                alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات فرسان الأقسام.`);
              }
            }}
            style={{
              background: '#0284C7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
            }}
          >
            <span>🎖️</span> طباعة شهادات فرسان الأقسام - {selMonth} (A4)
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          background: '#F1F5F9',
          padding: '0.35rem',
          borderRadius: '10px',
        }}
      >
        {[
          { id: 'top_honorees', label: '🏆 لوحة التميز (العشرة الأوائل + فرسان الأقسام)' },
          { id: 'monthly', label: '📅 التكريم الشهري العام' },
          { id: 'custom_cert', label: '✨ طباعة شهادة مخصصة' },
          { id: 'archive', label: '🗄️ أرشيف التكريم الشهري' },
          { id: 'annual', label: '📊 ملخص التكريم السنوي' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: activeTab === tab.id ? 800 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#0F2044' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#475569',
              boxShadow: activeTab === tab.id ? '0 2px 6px rgba(15,32,68,0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: 🏆 لوحة التميز (العشرة الأوائل بالمدرسة + أفضل معلم من كل قسم)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'top_honorees' && (
        <div>
          {selMonth !== 'سبتمبر' && monthlyTop10.length === 0 && currentHonorees.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.25rem', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                🏆
              </div>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.82rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.75rem' }}>
                تكريم شهر {selMonth} — قيد الانتظار
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
                لوحة التميز وشهادات الشكر والتقدير — شهر {selMonth} {selYear}
              </h2>
              <p style={{ color: '#64748B', maxWidth: '650px', margin: '0 auto 1.75rem', fontSize: '0.92rem', lineHeight: '1.65' }}>
                لم يتم إرفاق تقرير تقييم نظام قطر للتعليم لشهر {selMonth} حتى الآن. سيتم احتساب مؤشرات الأداء وإظهار العشرة الأوائل وفرسان الأقسام وإصدار شهادات التكريم تلقائياً بمجرد إرفاق تقرير شهر {selMonth} في صفحة تقييم نظام قطر للتعليم.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {onNavigateToPage && (
                  <button
                    onClick={() => onNavigateToPage('evaluation')}
                    style={{
                      background: '#0F2044',
                      color: '#fff',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <span>📊</span> الانتقال لصفحة تقييم نظام قطر للتعليم لإرفاق تقرير شهر {selMonth}
                  </button>
                )}

                <button
                  onClick={() => setSelMonth('سبتمبر')}
                  style={{
                    background: '#F1F5F9',
                    color: '#0F2044',
                    border: '1px solid #CBD5E1',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>🏆</span> عرض المكرمين لشهر سبتمبر ٢٠٢٦ (المعتمد)
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Section 1: Top 10 Outstanding Teachers */}
          <div style={{ ...cardStyle, borderRight: '4px solid #F59E0B', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🥇</span> أفضل عشرة معلمين متميزين على مستوى المدرسة (سبتمبر 2026)
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  المتصدرون لمؤشر متابعة نظام قطر للتعليم والمنصات الرقمية من واقع التقارير الرسمية المعتمدة
                </p>
              </div>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                10 معلمين متميزين
              </span>
            </div>

            {/* Top 10 Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {TOP_10_INDEX_TEACHERS.map(t => {
                const medal = t.rank === 1 ? '🥇 المركز الأول' : t.rank === 2 ? '🥈 المركز الثاني' : t.rank === 3 ? '🥉 المركز الثالث' : `المركز ${t.rank}`;
                return (
                  <div
                    key={t.rank}
                    style={{
                      background: t.rank <= 3 ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : '#F8FAFC',
                      border: t.rank <= 3 ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{
                          background: t.rank <= 3 ? '#F59E0B' : '#0F2044',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                        }}>
                          {medal}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                          قسم {t.department}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.35rem' }}>
                        {t.name}
                      </h3>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          المؤشر العام: {t.generalIndex.toFixed(2)}%
                        </span>
                        <span style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          التقييمات: {t.evalIndex.toFixed(2)}%
                        </span>
                        <span style={{ background: '#F3E8FF', color: '#6B21A8', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          الدروس: {t.lessonsIndex.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePrintCertificate({
                        teacherNameAr: t.name,
                        departmentName: t.department,
                        totalScore: t.generalIndex,
                        recognitionReason: `تكريم وتقدير لحصول المعلم على ${medal} على مستوى مدرسة قطر للعلوم والتكنولوجيا في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية لشهر سبتمبر 2026.`,
                        badgeTitle: medal,
                      })}
                      style={{
                        background: '#3D52A0',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.45rem 0.75rem',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <span>🎖️</span> طباعة شهادة شكر وتقدير
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Table of Top 10 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff', textAlign: 'right' }}>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>المركز</th>
                    <th style={{ padding: '0.6rem' }}>اسم المعلم</th>
                    <th style={{ padding: '0.6rem' }}>القسم الأكاديمي</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>المؤشر العام (100)</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>مؤشر التقييمات</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>مؤشر الدروس</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>سجالته</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>الشهادة الرسمية</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_10_INDEX_TEACHERS.map(t => (
                    <tr key={t.rank} style={{ borderBottom: '1px solid #E2E8F0', background: t.rank <= 3 ? 'rgba(254, 243, 199, 0.25)' : '#fff' }}>
                      <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 900 }}>
                        {t.rank === 1 ? '🥇 1' : t.rank === 2 ? '🥈 2' : t.rank === 3 ? '🥉 3' : t.rank}
                      </td>
                      <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0F2044' }}>{t.name}</td>
                      <td style={{ padding: '0.6rem', color: '#64748B' }}>{t.department}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 900, color: '#047857' }}>
                        {t.generalIndex.toFixed(2)}%
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#1E3A8A', fontWeight: 700 }}>
                        {t.evalIndex.toFixed(2)}%
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#6B21A8', fontWeight: 700 }}>
                        {t.lessonsIndex.toFixed(2)}%
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700 }}>{t.sectionsCount}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handlePrintCertificate({
                            teacherNameAr: t.name,
                            departmentName: t.department,
                            totalScore: t.generalIndex,
                            recognitionReason: `تكريم وتقدير لتفوق المعلم وحصوله على المركز ${t.rank} على مستوى المدرسة في تفعيل نظام قطر للتعليم والمنصات الرقمية.`,
                            badgeTitle: `المعلم المتميز - المركز ${t.rank}`,
                          })}
                          style={{
                            background: '#3D52A0',
                            color: '#fff',
                            border: 'none',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontWeight: 800,
                          }}
                        >
                          🎖️ طباعة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Best Teacher from Each of the 10 Departments */}
          <div style={{ ...cardStyle, borderRight: '4px solid #0284C7', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏛️</span> فرسان الأقسام الأكاديمية (أفضل معلم متميز من كل قسم — 10 معلمين)
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  تم اختيار المعلم الأول المتميز في كل قسم أكاديمي بناءً على أعلى مؤشرات الأداء المعتمدة لشهر سبتمبر 2026
                </p>
              </div>
              <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                10 أقسام أكاديمية
              </span>
            </div>

            {/* Department Champions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {DEPARTMENT_CHAMPIONS_10.map(d => (
                <div
                  key={d.rank}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {d.department}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        المعدل: {d.score.toFixed(1)}%
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', margin: '0.3rem 0' }}>
                      {d.teacherName}
                    </h3>

                    <div style={{ fontSize: '0.78rem', color: '#3D52A0', fontWeight: 800, marginBottom: '0.4rem' }}>
                      🌟 {d.title}
                    </div>

                    <p style={{ fontSize: '0.76rem', color: '#475569', lineHeight: '1.5', margin: '0 0 0.85rem' }}>
                      {d.achievement}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePrintCertificate({
                      teacherNameAr: d.teacherName,
                      departmentName: d.department,
                      totalScore: d.score,
                      recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.department} وحصوله على لقب (${d.title}) في تفعيل نظام قطر للتعليم لشهر سبتمبر 2026. ${d.achievement}`,
                      badgeTitle: d.title,
                    })}
                    style={{
                      background: '#3D52A0',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 0.85rem',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>🎖️</span> طباعة شهادة شكر وتقدير
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Top Distinguished Sections */}
          <div style={{ ...cardStyle, borderRight: '4px solid #10B981', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏫</span> الشعب الدراسية المتصدرة في تفعيل نظام قطر للتعليم وحل التقييمات
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  أفضل 5 شعب دراسية حققت أعلى نسب إنجاز وحل للتقييمات المسندة لشهر سبتمبر 2026
                </p>
              </div>
              {onNavigateToPage && (
                <button
                  onClick={() => onNavigateToPage('class_analysis')}
                  style={{
                    background: '#F0FDF4',
                    color: '#15803D',
                    border: '1px solid #BBF7D0',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>📊</span> عرض تحليل الـ 19 شعبة بالتفصيل
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {SECTIONS_LMS_STATS.slice(0, 5).map((sec, idx) => {
                const medal = idx === 0 ? '🥇 المركز الأول' : idx === 1 ? '🥈 المركز الثاني' : idx === 2 ? '🥉 المركز الثالث' : `المركز ${idx + 1}`;
                return (
                  <div
                    key={sec.section}
                    style={{
                      background: idx < 3 ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : '#F8FAFC',
                      border: idx < 3 ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ background: idx < 3 ? '#16A34A' : '#0F2044', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {medal}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                          {sec.grade}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.35rem' }}>
                        شعبة {sec.section}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 900, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          حل: {sec.solveRate}%
                        </span>
                        <span style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          تسليمات: {sec.submissions}
                        </span>
                        <span style={{ background: '#F1F5F9', color: '#334155', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          تصحيح: {sec.gradingRate}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePrintCertificate({
                        teacherNameAr: `طلاب ومعلمي شعبة ${sec.section}`,
                        departmentName: sec.grade,
                        totalScore: sec.solveRate,
                        recognitionReason: `شهادة شكر وتقدير لتصدر شعبة ${sec.section} (${sec.grade}) وحصولها على ${medal} على مستوى مدرسة قطر للعلوم والتكنولوجيا بنسبة حل تقييمات بلغت ${sec.solveRate}% لشهر سبتمبر 2026.`,
                        badgeTitle: `الشعبة المتميزة - ${medal}`,
                      })}
                      style={{
                        background: '#0F2044',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.45rem 0.75rem',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <span>🎖️</span> طباعة شهادة تكريم الشعبة
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📅 التكريم الشهري العام
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'monthly' && (
        <>
          <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <select className="form-input" style={{ width: 'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
              {APPROVED_MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto', minWidth: '160px' }} value={selDept} onChange={e => setSelDept(e.target.value)} disabled={isCoord && coordDepts.length === 1}>
              <option value="">{isCoord && coordDepts.length === 1 ? 'قسمي' : 'كل الأقسام'}</option>
              {availableMergedDepts.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto' }} value={selPerf} onChange={e => setSelPerf(e.target.value)}>
              <option value="">كل المستويات</option>
              <option value="ممتاز">ممتاز</option>
              <option value="جيد جداً">جيد جداً</option>
            </select>
            <input type="text" className="form-input" placeholder="بحث باسم المعلم..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '200px' }} />

            <div style={{ flex: 1 }} />
            <button onClick={exportExcel} className="btn btn-ghost">📥 تصدير Excel</button>
            <button onClick={printReport} className="btn btn-primary" style={{ background: '#0F2044', color: '#fff' }}>📋 طباعة التقرير</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {filteredHonorees.map(h => {
              const perf = getPerformanceLevel(h.totalScore);
              return (
                <div key={h.teacherId} style={{ ...cardStyle, position: 'relative', overflow: 'hidden', borderTop: `4px solid ${perf.color}` }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '2rem', opacity: 0.1 }}>🏆</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{h.departmentName}</div>
                      <h3 style={{ fontSize: '1.1rem', color: '#0F2044', fontWeight: 800, margin: '0.25rem 0' }}>{h.teacherNameAr}</h3>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{h.subject}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: perf.color }}>{h.totalScore}%</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>الدرجة النهائية</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5, marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px' }}>
                    {h.recognitionReason}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: perf.bg, color: perf.color, padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{perf.label}</span>
                    <button
                      onClick={() => handlePrintCertificate({
                        teacherNameAr: h.teacherNameAr,
                        departmentName: h.departmentName,
                        totalScore: h.totalScore,
                        recognitionReason: h.recognitionReason,
                        month: h.month,
                        academicYear: h.academicYear,
                      })}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', color: '#0096C7', border: '1px solid #0096C7' }}
                    >
                      🏅 إنشاء شهادة تكريم
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredHonorees.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#64748B' }}>لا يوجد بيانات تكريم مطابقة للبحث.</div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2044', marginBottom: '1rem' }}>تفاصيل التكريم</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                    {['القسم', 'اسم المعلم', 'المادة', 'الدرجة النهائية', 'متوسط الدرجة', 'مستوى الأداء', 'سبب التكريم', 'الشهادة'].map(h => (
                      <th key={h} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHonorees.map((h, i) => {
                    const perf = getPerformanceLevel(h.totalScore);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0F2044' }}>{h.departmentName}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{h.teacherNameAr}<br /><span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{h.teacherNameEn}</span></td>
                        <td style={{ padding: '0.75rem', color: '#64748B' }}>{h.subject}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: perf.color }}>{h.totalScore}</td>
                        <td style={{ padding: '0.75rem' }}>{h.averageScore}</td>
                        <td style={{ padding: '0.75rem' }}><span style={{ background: perf.bg, color: perf.color, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{perf.label}</span></td>
                        <td style={{ padding: '0.75rem', color: '#64748B', fontSize: '0.75rem' }}>{h.recognitionReason}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handlePrintCertificate({
                              teacherNameAr: h.teacherNameAr,
                              departmentName: h.departmentName,
                              totalScore: h.totalScore,
                              recognitionReason: h.recognitionReason,
                              month: h.month,
                              academicYear: h.academicYear,
                            })}
                            style={{ background: '#3D52A0', color: '#fff', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                          >
                            طباعة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: ✨ طباعة شهادة مخصصة لأي معلم
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'custom_cert' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              ✨ طباعة شهادة شكر وتقدير مخصصة
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              اختر أي معلم من الكادر المدرسي واكتب نص التكريم المطلوب لطباعة شهادة رسمية فورية A4 Landscape
            </p>
          </div>

          <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                اختر المعلم:
              </label>
              <select
                value={customTeacherId}
                onChange={e => setCustomTeacherId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} — {getDeptName(t.departmentId, departments)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                عنوان وسام التكريم:
              </label>
              <input
                type="text"
                value={customBadge}
                onChange={e => setCustomBadge(e.target.value)}
                placeholder="مثال: المعلم المتميز في تفعيل المنصات التعليمية"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                نص التكريم وسبب المنح:
              </label>
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="تقديرًا لجهوده الاستثنائية وتفوقه في تفعيل نظام قطر للتعليم والمنصات الرقمية..."
                rows={4}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', lineHeight: '1.6' }}
              />
            </div>

            <button
              onClick={() => {
                const t = teachers.find(x => x.id === customTeacherId);
                if (!t) return;
                handlePrintCertificate({
                  teacherNameAr: t.nameAr,
                  departmentName: getDeptName(t.departmentId, departments),
                  badgeTitle: customBadge,
                  recognitionReason: customReason || undefined,
                });
              }}
              style={{
                background: '#3D52A0',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <span>🖨️</span> طباعة الشهادة الرسمية الآن (A4)
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: 🗄️ أرشيف التكريم الشهري
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'archive' && (
        <div>
          <div className="no-print" style={{ marginBottom: '1rem' }}>
            <select className="form-input" style={{ width: 'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {APPROVED_MONTHS.map(m => {
              const monthHonorees = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, m);
              const allowedHonorees = isCoord && coordDepts.length > 0
                ? monthHonorees.filter(h => coordDepts.includes(h.departmentId))
                : monthHonorees;
              return (
                <div
                  key={m}
                  style={{ ...cardStyle, cursor: 'pointer', borderLeft: allowedHonorees.length ? '4px solid #0096C7' : '4px solid #E2E8F0' }}
                  onClick={() => { setActiveTab('monthly'); setSelMonth(m); }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0F2044' }}>{m}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{allowedHonorees.length} معلم مكرم</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: 📊 ملخص التكريم السنوي
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'annual' && (
        <div>
          <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto' }} value={selYear} onChange={e => setSelYear(e.target.value)}>
              {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            <button onClick={printReport} className="btn btn-primary">🖨️ طباعة الملخص السنوي</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={cardStyle}>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>إجمالي التكريمات خلال العام</p>
              <h2 style={{ fontSize: '2rem', color: '#0F2044', margin: '0.5rem 0 0 0' }}>{annualSummary.allHonorees.length}</h2>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>عدد المعلمين المكرمين (فريد)</p>
              <h2 style={{ fontSize: '2rem', color: '#0096C7', margin: '0.5rem 0 0 0' }}>{Object.keys(annualSummary.teacherCounts).length}</h2>
            </div>
            <div style={cardStyle}>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>أكثر قسم انتظاماً</p>
              <h2 style={{ fontSize: '1.2rem', color: '#065F46', margin: '0.5rem 0 0 0' }}>
                {Object.entries(annualSummary.deptConsistency).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1rem', color: '#0F2044', margin: '0 0 1rem 0' }}>المعلمون الأكثر تكريماً</h3>
              {Object.entries(annualSummary.teacherCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tId, count], i) => {
                const t = teachers.find(x => x.id === tId);
                return (
                  <div key={tId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F2044' }}>{t?.nameAr}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{t ? getDeptName(t.departmentId, departments) : ''}</span>
                    </div>
                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>{count} مرات</span>
                  </div>
                );
              })}
            </div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1rem', color: '#0F2044', margin: '0 0 1rem 0' }}>ملخص الأقسام</h3>
              {Object.entries(annualSummary.deptScores).map(([dept, scores]) => {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                return (
                  <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F2044' }}>{dept}</span>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>{scores.length} تكريم</span>
                      <span style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: 700 }}>متوسط {avg.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
