import re

content = ''''use client';
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
} from '@/lib/data';
import type { User, Evaluation, Teacher, Department } from '@/lib/data';
import { printTeacherCertificate } from '@/lib/certificatePrinter';
import * as XLSX from 'xlsx';
import PrintHeader from '@/components/PrintHeader';

interface Props {
  currentUser: User;
  selectedYear?: string;
}

// Available months
const APPROVED_MONTHS = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

// Top 10 Department Champions (One Best Teacher from Each of the 10 Departments)
export const DEPARTMENT_CHAMPIONS_10 = [
  {
    rank: 1,
    department: 'اللغة العربية',
    teacherName: 'ابراهيم حلمى ابراهيم جمعه',
    score: 95.00,
    evalScore: 100.00,
    lessonsScore: 90.00,
    sectionsCount: 3,
    title: 'فارس قسم اللغة العربية',
    achievement: 'تصدر القسم والمدرسة بنسبة تصحيح 100% (122 تسليماً) واستيفاء كامل للدروس 100% (66/66) ونسبة حل 84.7%.',
  },
  {
    rank: 2,
    department: 'التربية الإسلامية',
    teacherName: 'الحسن علي محمد علي',
    score: 81.25,
    evalScore: 100.00,
    lessonsScore: 62.50,
    sectionsCount: 4,
    title: 'فارس قسم التربية الإسلامية',
    achievement: 'تغطية تقييمات كاملة 100% لجميع الشعب الأربع، وتصحيح 86 تسليماً بنسبة 100%، ونسبة حل 76.8%.',
  },
  {
    rank: 3,
    department: 'مختبر الطاقة',
    teacherName: 'انس عبدالكريم موسى جرادات',
    score: 76.25,
    evalScore: 92.50,
    lessonsScore: 60.00,
    sectionsCount: 4,
    title: 'فارس مختبر الطاقة التخصصي',
    achievement: 'تقدير إداري ممتاز، وتغطية كاملة لسجلات المختبر بالتقييمات والدروس، وتصحيح 100% للتسليمات.',
  },
  {
    rank: 4,
    department: 'الدراسات الاجتماعية',
    teacherName: 'فيصل محمد مسلم الحضري',
    score: 72.00,
    evalScore: 100.00,
    lessonsScore: 44.00,
    sectionsCount: 6,
    title: 'فارس قسم الدراسات الاجتماعية',
    achievement: 'تغطية كاملة 100% لجميع السجلات الستة بالتقييمات، وتصحيح 100% لجميع التسليمات (39 تسليماً).',
  },
  {
    rank: 5,
    department: 'الحاسوب وتكنولوجيا المعلومات',
    teacherName: 'خالد عصام بارودي',
    score: 74.23,
    evalScore: 88.46,
    lessonsScore: 60.00,
    sectionsCount: 4,
    title: 'فارس قسم الحاسوب',
    achievement: 'تغطية تقييمات كاملة لجميع الشعب الأربع، وتصحيح 43 تسليماً، ورفع كامل للدروس المستوفية.',
  },
  {
    rank: 6,
    department: 'مختبر التصنيع الرقمي (Fab Lab)',
    teacherName: 'اياد أحمد سلمان عبدالقادر',
    score: 59.90,
    evalScore: 70.00,
    lessonsScore: 60.00,
    sectionsCount: 3,
    title: 'فارس مختبر التصنيع الرقمي',
    achievement: 'تقدير إداري ممتاز، وتغطية 100% لرفع الدروس، وتصحيح 29 تسليماً بمختبر الفاب لاب.',
  },
  {
    rank: 7,
    department: 'العلوم والتكنولوجيا (STEM)',
    teacherName: 'عمران كاشف محمد حسين اسد',
    score: 80.00,
    evalScore: 100.00,
    lessonsScore: 60.00,
    sectionsCount: 1,
    title: 'فارس قسم STEM',
    achievement: 'تغطية تقييمات كاملة 100%، وتصحيح 100% لجميع التسليمات المسجلة، ونسبة حل متميزة 81.3%.',
  },
  {
    rank: 8,
    department: 'اللغة الإنجليزية',
    teacherName: 'محمد سيد ميردادي',
    score: 57.49,
    evalScore: 52.86,
    lessonsScore: 79.16,
    sectionsCount: 7,
    title: 'فارس قسم اللغة الإنجليزية',
    achievement: 'المركز الأول في رفع الدروس بقسم اللغة الإنجليزية (54 درساً) وتصحيح 52 تسليماً.',
  },
  {
    rank: 9,
    department: 'التصميم التكنولوجي',
    teacherName: 'احمد اسامه صقر المعاني',
    score: 43.11,
    evalScore: 45.24,
    lessonsScore: 60.00,
    sectionsCount: 21,
    title: 'فارس قسم التصميم التكنولوجي',
    achievement: 'تقدير إداري معتمد جيد جداً، وتغطية أعلى حجم تكليف بالمدرسة (21 سجلاً تعليمياً و74 درساً).',
  },
  {
    rank: 10,
    department: 'الرياضيات',
    teacherName: 'جعفر ياشلي',
    score: 60.00,
    evalScore: 60.00,
    lessonsScore: 60.00,
    sectionsCount: 3,
    title: 'فارس قسم الرياضيات',
    achievement: 'تغطية كاملة لرفع الدروس لجميع الشعب الثلاث (12 درساً) وتنسيق فعال لأنشطة الرياضيات.',
  },
];

export default function TakreemPage({ currentUser, selectedYear: propYear }: Props) {
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
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              // Print all Top 10 certificates sequentially
              TOP_10_INDEX_TEACHERS.forEach((t, i) => {
                setTimeout(() => {
                  handlePrintCertificate({
                    teacherNameAr: t.name,
                    departmentName: t.department,
                    totalScore: t.generalIndex,
                    recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${t.rank} على مستوى المدرسة في مؤشرات تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية لشهر سبتمبر 2026.`,
                    badgeTitle: `المركز ${t.rank} على مستوى المدرسة`,
                  });
                }, i * 600);
              });
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
            <span>📜</span> طباعة شهادات العشرة الأوائل (A4)
          </button>

          <button
            onClick={() => {
              // Print all Department Champions certificates sequentially
              DEPARTMENT_CHAMPIONS_10.forEach((d, i) => {
                setTimeout(() => {
                  handlePrintCertificate({
                    teacherNameAr: d.teacherName,
                    departmentName: d.department,
                    totalScore: d.score,
                    recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.department} وحصوله على لقب (${d.title}) في تفعيل نظام قطر للتعليم لشهر سبتمبر 2026.`,
                    badgeTitle: d.title,
                  });
                }, i * 600);
              });
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
            <span>🎖️</span> طباعة شهادات فرسان الأقسام (A4)
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
'''

with open('/Users/ahmadtubaishat/.gemini/antigravity/scratch/teacher-tracking/src/components/pages/TakreemPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('TakreemPage.tsx updated successfully!')
