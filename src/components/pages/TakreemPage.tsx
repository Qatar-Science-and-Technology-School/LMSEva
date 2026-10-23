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
  OCTOBER_TOP_10_INDEX_TEACHERS,
  OCTOBER_DEPARTMENT_CHAMPIONS_10,
  OCTOBER_SECTIONS_LMS_STATS,
  OCTOBER_2026_LMS_TEACHERS,
  LMS_TAKREEM_MONTHLY_EVOLUTION,
  isSuperAdmin,
} from '@/lib/data';
import type { User, Evaluation, Teacher, Department } from '@/lib/data';
import { printTeacherCertificate, printBatchCertificates } from '@/lib/certificatePrinter';
import { getDocument, setSingleDocument, COLLECTIONS } from '@/lib/firestoreDb';
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
    title: 'فارس قسم اللغة العربية',
    achievement: 'تميز استثنائي في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية، ونسبة تفاعل ومشاركة مرتفعة وتوظيف متقن للأدوات التكنولوجية داخل الحصص الدراسية.',
  },
  {
    rank: 2,
    department: 'التربية الإسلامية',
    teacherName: 'الحسن علي محمد علي',
    score: 94.50,
    evalScore: 89.00,
    lessonsScore: 100.00,
    sectionsCount: 4,
    title: 'فارس قسم التربية الإسلامية',
    achievement: 'تميز في تفعيل نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، والالتزام الكامل بالدروس والتقييمات وإثراء بيئة التعلم.',
  },
  {
    rank: 3,
    department: 'الرياضيات',
    teacherName: 'محمد عماد ازكول',
    score: 92.80,
    evalScore: 85.60,
    lessonsScore: 100.00,
    sectionsCount: 4,
    title: 'فارس قسم الرياضيات',
    achievement: 'تفعيل متميز ومتكامل لنظام قطر للتعليم والأنشطة التفاعلية وتوظيف الأدوات التكنولوجية المتقدمة في تدريس الرياضيات.',
  },
  {
    rank: 4,
    department: 'اللغة الإنجليزية',
    teacherName: 'محمد ورسامي عمر',
    score: 90.00,
    evalScore: 90.00,
    lessonsScore: 90.00,
    sectionsCount: 7,
    title: 'فارس قسم اللغة الإنجليزية',
    achievement: 'تميز وإبداع في توظيف نظام قطر للتعليم والأدوات الرقمية الحديثة، ونشر الدروس والأنشطة التفاعلية وتحفيز مشاركة الطلبة.',
  },
  {
    rank: 5,
    department: 'علوم الحاسوب',
    teacherName: 'محمد سامي ابراهيم عبدالقادر الكفرى',
    score: 88.50,
    evalScore: 85.00,
    lessonsScore: 92.00,
    sectionsCount: 4,
    title: 'فارس قسم علوم الحاسوب',
    achievement: 'ريادة في استخدام الأدوات التكنولوجية الحديثة ونظام قطر للتعليم، والتميز في تنمية المهارات البرمجية والحلول الرقمية داخل الحصص.',
  },
  {
    rank: 6,
    department: 'العلوم والفيزياء',
    teacherName: 'اوزدن اوزغور',
    score: 87.20,
    evalScore: 84.40,
    lessonsScore: 90.00,
    sectionsCount: 4,
    title: 'فارس قسم العلوم والفيزياء',
    achievement: 'توظيف متقدم للتقنيات والمنصات الرقمية والمحاكاة التفاعلية، وتفعيل نوعي لنظام قطر للتعليم في التجارب والأنشطة العلمية.',
  },
  {
    rank: 7,
    department: 'مختبر التصنيع الرقمي',
    teacherName: 'على سالم على سالمين الصيعري',
    score: 84.70,
    evalScore: 88.90,
    lessonsScore: 80.40,
    sectionsCount: 7,
    title: 'فارس مختبر التصنيع الرقمي (Fab Lab)',
    achievement: 'تصدر معلمي المختبرات بمؤشرات تفعيل نوعية ومتميزة، وتوظيف تقنيات التصنيع الرقمي والأدوات التكنولوجية الحديثة داخل الحصص التطبيقية.',
  },
  {
    rank: 8,
    department: 'الدراسات الاجتماعية',
    teacherName: 'فيصل محمد مسلم الحضري',
    score: 82.50,
    evalScore: 85.00,
    lessonsScore: 80.00,
    sectionsCount: 6,
    title: 'فارس قسم الدراسات الاجتماعية',
    achievement: 'تميز في تفعيل نظام قطر للتعليم وتوظيف الخرائط والوسائط الرقمية والأدوات التكنولوجية في إثراء حصص الدراسات الاجتماعية.',
  },
  {
    rank: 9,
    department: 'مختبر الطاقة',
    teacherName: 'انس عبدالكريم موسى جرادات',
    score: 81.00,
    evalScore: 82.00,
    lessonsScore: 80.00,
    sectionsCount: 4,
    title: 'فارس مختبر الطاقة والبيئة',
    achievement: 'تميز في تفعيل المختبرات التخصصية ونظام قطر للتعليم، وتوظيف الأدوات التكنولوجية الحديثة في المشاريع والتطبيقات العلمية.',
  },
  {
    rank: 10,
    department: 'مختبر الروبوت',
    teacherName: 'اياد محمود علي سلامه',
    score: 80.50,
    evalScore: 81.00,
    lessonsScore: 80.00,
    sectionsCount: 4,
    title: 'فارس مختبر الروبوت والذكاء الاصطناعي',
    achievement: 'إبداع في توظيف أدوات الروبوت والذكاء الاصطناعي والمنصات التعليمية، ومتابعة متميزة لمشاريع الطلبة التكنولوجية داخل الحصص.',
  },
];

export default function TakreemPage({ currentUser, selectedYear: propYear, onNavigateToPage }: Props) {
  // Permission Check: ONLY a.tubaishat1704@education.qa has edit permissions
  const isAdmin = isSuperAdmin(currentUser);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1]);
  const [selMonth, setSelMonth] = useState('أكتوبر');
  const isOct = selMonth === 'أكتوبر';
  const activeTop10 = isOct ? OCTOBER_TOP_10_INDEX_TEACHERS : TOP_10_INDEX_TEACHERS;
  const activeDeptChampions = isOct ? OCTOBER_DEPARTMENT_CHAMPIONS_10 : DEPARTMENT_CHAMPIONS_10;
  const activeTopSections = isOct ? OCTOBER_SECTIONS_LMS_STATS.slice(0, 5) : SECTIONS_LMS_STATS.slice(0, 5);
  const [selDept, setSelDept] = useState('');
  const [search, setSearch] = useState('');
  const [selPerf, setSelPerf] = useState('');

  // Custom Certificate State
  const [customTeacherId, setCustomTeacherId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [customBadge, setCustomBadge] = useState('شهادة شكر وتقدير وتكريم');

  // Tab state
  const [activeTab, setActiveTab] = useState<'top_honorees' | 'monthly' | 'custom_cert' | 'archive' | 'annual'>('top_honorees');

  // Editable Names for Top 10 and Department Champions
  const [customTop10Names, setCustomTop10Names] = useState<Record<number, string>>({});
  const [customDeptChampions, setCustomDeptChampions] = useState<Record<number, string>>({});
  
  const [editingTop10Rank, setEditingTop10Rank] = useState<number | null>(null);
  const [tempTop10Name, setTempTop10Name] = useState('');

  const [editingDeptRank, setEditingDeptRank] = useState<number | null>(null);
  const [tempDeptName, setTempDeptName] = useState('');

  // Helper to persist custom honorees to Firestore
  const persistToFirestore = async (top10: Record<number, string>, deptChampions: Record<number, string>) => {
    try {
      await setSingleDocument(COLLECTIONS.takreemSettings, 'custom_honorees', {
        top10,
        deptChampions,
      });
    } catch (err) {
      console.warn('Failed to sync custom honorees to Firestore:', err);
    }
  };

  // Load saved custom names from Firestore (with localStorage fallback/instant cache)
  useEffect(() => {
    // 1. Instant local read with version invalidation
    try {
      const vKey = 'takreem_custom_v2026_10';
      if (!localStorage.getItem(vKey)) {
        localStorage.removeItem('takreem_custom_top10_names');
        localStorage.removeItem('takreem_custom_dept_champions');
        localStorage.setItem(vKey, '1');
      }
      const savedTop10 = localStorage.getItem('takreem_custom_top10_names');
      if (savedTop10) setCustomTop10Names(JSON.parse(savedTop10));
      const savedDept = localStorage.getItem('takreem_custom_dept_champions');
      if (savedDept) setCustomDeptChampions(JSON.parse(savedDept));
    } catch (e) {}

    // 2. Authoritative cloud read from Firestore
    getDocument<{ top10?: Record<number, string>; deptChampions?: Record<number, string> }>(
      COLLECTIONS.takreemSettings,
      'custom_honorees'
    ).then((cloudData) => {
      if (cloudData) {
        if (cloudData.top10) {
          setCustomTop10Names(cloudData.top10);
          try { localStorage.setItem('takreem_custom_top10_names', JSON.stringify(cloudData.top10)); } catch (e) {}
        }
        if (cloudData.deptChampions) {
          setCustomDeptChampions(cloudData.deptChampions);
          try { localStorage.setItem('takreem_custom_dept_champions', JSON.stringify(cloudData.deptChampions)); } catch (e) {}
        }
      }
    }).catch(err => {
      console.warn('Failed to load custom honorees from Firestore:', err);
    });
  }, []);

  const handleSaveTop10 = (rank: number, newName: string) => {
    if (!isAdmin) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCustomTop10Names(prev => {
      const updated = { ...prev, [rank]: trimmed };
      try {
        localStorage.setItem('takreem_custom_top10_names', JSON.stringify(updated));
      } catch (e) {}
      persistToFirestore(updated, customDeptChampions);
      return updated;
    });
    setEditingTop10Rank(null);
  };

  const handleResetTop10 = (rank: number) => {
    if (!isAdmin) return;
    setCustomTop10Names(prev => {
      const updated = { ...prev };
      delete updated[rank];
      try {
        localStorage.setItem('takreem_custom_top10_names', JSON.stringify(updated));
      } catch (e) {}
      persistToFirestore(updated, customDeptChampions);
      return updated;
    });
    setEditingTop10Rank(null);
  };

  const handleSaveDeptChampion = (rank: number, newName: string) => {
    if (!isAdmin) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCustomDeptChampions(prev => {
      const updated = { ...prev, [rank]: trimmed };
      try {
        localStorage.setItem('takreem_custom_dept_champions', JSON.stringify(updated));
      } catch (e) {}
      persistToFirestore(customTop10Names, updated);
      return updated;
    });
    setEditingDeptRank(null);
  };

  const handleResetDeptChampion = (rank: number) => {
    if (!isAdmin) return;
    setCustomDeptChampions(prev => {
      const updated = { ...prev };
      delete updated[rank];
      try {
        localStorage.setItem('takreem_custom_dept_champions', JSON.stringify(updated));
      } catch (e) {}
      persistToFirestore(customTop10Names, updated);
      return updated;
    });
    setEditingDeptRank(null);
  };

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

  // Comprehensive teacher name suggestions for editing
  const allTeacherNames = useMemo(() => {
    const set = new Set<string>();
    if (teachers && teachers.length > 0) {
      teachers.forEach(t => {
        if (t.nameAr) set.add(t.nameAr.trim());
      });
    }
    if (SEPTEMBER_2026_LMS_TEACHERS && SEPTEMBER_2026_LMS_TEACHERS.length > 0) {
      SEPTEMBER_2026_LMS_TEACHERS.forEach(t => {
        if (t.name) set.add(t.name.trim());
      });
    }
    TOP_10_INDEX_TEACHERS.forEach(t => set.add(t.name.trim()));
    DEPARTMENT_CHAMPIONS_10.forEach(d => set.add(d.teacherName.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [teachers]);

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
    recipientType?: 'teacher' | 'section';
  }) => {
    printTeacherCertificate({
      teacherNameAr: options.teacherNameAr,
      departmentName: options.departmentName,
      academicYear: options.academicYear || selYear,
      month: options.month || selMonth,
      totalScore: options.totalScore,
      recognitionReason: options.recognitionReason,
      badgeTitle: options.badgeTitle || 'المعلم المتميز في نظام قطر للتعليم',
      recipientType: options.recipientType,
    });
  };

  // طباعة جميع شهادات العشرة الأوائل دفعة واحدة
  const handlePrintAllTop10 = () => {
    if (selMonth === 'أكتوبر' || selMonth === 'سبتمبر') {
      const certList = activeTop10.map(t => ({
        teacherNameAr: customTop10Names[t.rank] || t.name,
        departmentName: t.department,
        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
        badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
        month: selMonth,
        academicYear: selYear,
        recipientType: 'teacher' as const,
      }));
      printBatchCertificates(certList);
    } else if (monthlyTop10.length > 0) {
      const certList = monthlyTop10.map((t: any) => ({
        teacherNameAr: t.teacherNameAr,
        departmentName: t.departmentName,
        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
        badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
        month: selMonth,
        academicYear: selYear,
        recipientType: 'teacher' as const,
      }));
      printBatchCertificates(certList);
    } else {
      alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات الأوائل.`);
    }
  };

  // طباعة جميع شهادات فرسان الأقسام الأكاديمية دفعة واحدة
  const handlePrintAllDeptChampions = () => {
    if (selMonth === 'أكتوبر' || selMonth === 'سبتمبر') {
      const certList = activeDeptChampions.map(d => ({
        teacherNameAr: customDeptChampions[d.rank] || d.teacherName,
        departmentName: d.department,
        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية لقسم ${d.department}، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
        badgeTitle: 'وسام التميز في التعليم الإلكتروني',
        month: selMonth,
        academicYear: selYear,
        recipientType: 'teacher' as const,
      }));
      printBatchCertificates(certList);
    } else if (currentHonorees.length > 0) {
      const certList = currentHonorees.map((d: any) => ({
        teacherNameAr: d.teacherNameAr,
        departmentName: d.departmentName,
        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية لقسم ${d.departmentName}، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
        badgeTitle: 'وسام التميز في التعليم الإلكتروني',
        month: selMonth,
        academicYear: selYear,
        recipientType: 'teacher' as const,
      }));
      printBatchCertificates(certList);
    } else {
      alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات فرسان الأقسام.`);
    }
  };

  // طباعة جميع شهادات الشعب الدراسية المتصدرة دفعة واحدة (بدون مراكز أو أرقام)
  const handlePrintAllDistinguishedSections = () => {
    const certList = activeTopSections.map((sec) => ({
      teacherNameAr: `طلاب ومعلمي شعبة ${sec.section}`,
      departmentName: sec.grade,
      recognitionReason: `تقديرًا للمشاركة الفاعلة والتفاعل المتميز لطلاب ومعلمي شعبة ${sec.section} (${sec.grade}) في تفعيل نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية.`,
      badgeTitle: 'الشعبة المتميزة في التعليم الإلكتروني',
      recipientType: 'section' as const,
      month: selMonth,
      academicYear: selYear,
    }));
    printBatchCertificates(certList);
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
                    شهر {m} {m === 'أكتوبر' ? '(المعتمد - أحدث تقرير)' : m === 'سبتمبر' ? '(المعتمد)' : ''}
                  </option>
                ))}
              </select>
              <span
                style={{
                  background: (selMonth === 'سبتمبر' || selMonth === 'أكتوبر') ? '#10B981' : '#F59E0B',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {(selMonth === 'سبتمبر' || selMonth === 'أكتوبر') ? 'معتمد ومكتمل' : 'قيد الانتظار'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrintAllTop10}
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
            onClick={handlePrintAllDeptChampions}
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

          <button
            onClick={handlePrintAllDistinguishedSections}
            style={{
              background: '#10B981',
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
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            }}
          >
            <span>🏆</span> طباعة شهادات الشعب المتصدرة (A4)
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
            marginBottom: '1.25rem',
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
            <strong>وضع الاطلاع والمشاهدة فقط:</strong> لوحات وبيانات تكريم المعلمين معتمدة للاطلاع والطباعة وتصدير الشهادات. تعديل أسماء المكرمين محصور بمدير النظام.
          </div>
        </div>
      )}

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
          {selMonth !== 'سبتمبر' && selMonth !== 'أكتوبر' && monthlyTop10.length === 0 && currentHonorees.length === 0 ? (
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
                  <span>🥇</span> أفضل عشرة معلمين متميزين على مستوى المدرسة ({selMonth} {selYear})
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  المتصدرون لمؤشر متابعة نظام قطر للتعليم والمنصات الرقمية من واقع التقارير الرسمية المعتمدة
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {Object.keys(customTop10Names).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل ترغب في استعادة جميع أسماء العشرة الأوائل إلى الأسماء الافتراضية؟')) {
                        setCustomTop10Names({});
                        try { localStorage.removeItem('takreem_custom_top10_names'); } catch (e) {}
                        persistToFirestore({}, customDeptChampions);
                      }
                    }}
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ↩️ استعادة الافتراضي ({Object.keys(customTop10Names).length} معدّل)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrintAllTop10}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
                  }}
                  title="طباعة كافة شهادات شكر وتقدير العشرة الأوائل دفعة واحدة (A4 Landscape)"
                >
                  <span>📜</span> طباعة جميع شهادات العشرة الأوائل (A4)
                </button>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                  10 معلمين متميزين
                </span>
              </div>
            </div>

            {/* Top 10 Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {activeTop10.map(t => {
                const medal = t.rank === 1 ? '🥇 المركز الأول' : t.rank === 2 ? '🥈 المركز الثاني' : t.rank === 3 ? '🥉 المركز الثالث' : `المركز ${t.rank}`;
                const teacherName = customTop10Names[t.rank] || t.name;
                const isCustomized = Boolean(customTop10Names[t.rank]);
                const isEditing = editingTop10Rank === t.rank;

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

                      {/* Teacher Name Box with Edit Option */}
                      <div style={{
                        background: isEditing ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                        border: isEditing ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.45rem 0.65rem',
                        marginBottom: '0.6rem',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span>{teacherName}</span>
                            {isCustomized && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>
                                تم التعديل
                              </span>
                            )}
                          </h3>
                          {!isEditing && isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTop10Rank(t.rank);
                                setTempTop10Name(teacherName);
                              }}
                              title="تعديل اسم المعلم أو اختيار معلم آخر"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#0F2044',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                            >
                              <span>✏️</span> تعديل
                            </button>
                          )}
                        </div>

                        {/* Inline Editor for Top 10 */}
                        {isEditing && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#D97706', marginBottom: '0.3rem' }}>
                              اختيار معلم آخر من قائمة المدرسة:
                            </label>
                            <select
                              value={allTeacherNames.includes(tempTop10Name) ? tempTop10Name : ''}
                              onChange={(e) => {
                                if (e.target.value) setTempTop10Name(e.target.value);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.8rem',
                                marginBottom: '0.4rem',
                                background: '#F8FAFC',
                                color: '#0F172A',
                                outline: 'none',
                              }}
                            >
                              <option value="">-- اضغط لاختيار اسم معلم آخر --</option>
                              {allTeacherNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>

                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                              أو كتابة وتعديل الاسم يدوياً:
                            </label>
                            <input
                              type="text"
                              value={tempTop10Name}
                              onChange={(e) => setTempTop10Name(e.target.value)}
                              placeholder="اكتب اسم المعلم..."
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                outline: 'none',
                                boxSizing: 'border-box',
                                marginBottom: '0.5rem',
                              }}
                            />

                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {isCustomized && (
                                <button
                                  type="button"
                                  onClick={() => handleResetTop10(t.rank)}
                                  style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    borderRadius: '5px',
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ↩️ استعادة الأصلي
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingTop10Rank(null)}
                                style={{
                                  background: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  color: '#64748B',
                                  borderRadius: '5px',
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveTop10(t.rank, tempTop10Name)}
                                style={{
                                  background: '#D97706',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  borderRadius: '5px',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                💾 حفظ الاسم
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

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
                        teacherNameAr: teacherName,
                        departmentName: t.department,
                        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
                        badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
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
                  {activeTop10.map(t => (
                    <tr key={t.rank} style={{ borderBottom: '1px solid #E2E8F0', background: t.rank <= 3 ? 'rgba(254, 243, 199, 0.25)' : '#fff' }}>
                      <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 900 }}>
                        {t.rank === 1 ? '🥇 1' : t.rank === 2 ? '🥈 2' : t.rank === 3 ? '🥉 3' : t.rank}
                      </td>
                      <td style={{ padding: '0.6rem', fontWeight: 800, color: '#0F2044' }}>
                        <span>{customTop10Names[t.rank] || t.name}</span>
                        {customTop10Names[t.rank] && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>
                            معدّل
                          </span>
                        )}
                      </td>
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
                            teacherNameAr: customTop10Names[t.rank] || t.name,
                            departmentName: t.department,
                            recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
                            badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
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
                  تم اختيار المعلم الأول المتميز في كل قسم أكاديمي بناءً على أعلى مؤشرات الأداء المعتمدة لشهر {selMonth} {selYear}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {Object.keys(customDeptChampions).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل ترغب في استعادة جميع أسماء فرسان الأقسام إلى الأسماء الافتراضية؟')) {
                        setCustomDeptChampions({});
                        try { localStorage.removeItem('takreem_custom_dept_champions'); } catch (e) {}
                        persistToFirestore(customTop10Names, {});
                      }
                    }}
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ↩️ استعادة الافتراضي ({Object.keys(customDeptChampions).length} معدّل)
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrintAllDeptChampions}
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
                  }}
                  title="طباعة كافة شهادات فرسان الأقسام الأكاديمية دفعة واحدة (A4 Landscape)"
                >
                  <span>🎖️</span> طباعة جميع شهادات فرسان الأقسام (A4)
                </button>
                <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                  10 أقسام أكاديمية
                </span>
              </div>
            </div>

            {/* Department Champions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {activeDeptChampions.map(d => {
                const deptTeacherName = customDeptChampions[d.rank] || d.teacherName;
                const isDeptCustomized = Boolean(customDeptChampions[d.rank]);
                const isEditing = editingDeptRank === d.rank;

                return (
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

                      {/* Teacher Name Area with Edit / Change Option inside the box */}
                      <div style={{
                        background: isEditing ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                        border: isEditing ? '2px solid #0284C7' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        margin: '0.35rem 0 0.5rem',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span>{deptTeacherName}</span>
                            {isDeptCustomized && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px' }}>
                                تم التعديل
                              </span>
                            )}
                          </h3>
                          {!isEditing && isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeptRank(d.rank);
                                setTempDeptName(deptTeacherName);
                              }}
                              title="تعديل اسم المعلم أو اختيار معلم آخر لهذا القسم"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '0.2rem 0.55rem',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#0F2044',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                            >
                              <span>✏️</span> تعديل
                            </button>
                          )}
                        </div>

                        {/* Inline Editor for Department Champion */}
                        {isEditing && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', marginBottom: '0.3rem' }}>
                              اختيار معلم آخر لقسم {d.department}:
                            </label>
                            <select
                              value={allTeacherNames.includes(tempDeptName) ? tempDeptName : ''}
                              onChange={(e) => {
                                if (e.target.value) setTempDeptName(e.target.value);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.8rem',
                                marginBottom: '0.4rem',
                                background: '#F8FAFC',
                                color: '#0F172A',
                                outline: 'none',
                              }}
                            >
                              <option value="">-- اضغط لاختيار اسم معلم آخر --</option>
                              {allTeacherNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>

                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>
                              أو كتابة وتعديل الاسم يدوياً:
                            </label>
                            <input
                              type="text"
                              value={tempDeptName}
                              onChange={(e) => setTempDeptName(e.target.value)}
                              placeholder="اكتب اسم المعلم..."
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                outline: 'none',
                                boxSizing: 'border-box',
                                marginBottom: '0.5rem',
                              }}
                            />

                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {isDeptCustomized && (
                                <button
                                  type="button"
                                  onClick={() => handleResetDeptChampion(d.rank)}
                                  style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    borderRadius: '5px',
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ↩️ استعادة الأصلي
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingDeptRank(null)}
                                style={{
                                  background: '#F1F5F9',
                                  border: '1px solid #CBD5E1',
                                  color: '#64748B',
                                  borderRadius: '5px',
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveDeptChampion(d.rank, tempDeptName)}
                                style={{
                                  background: '#0284C7',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  borderRadius: '5px',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                💾 حفظ الاسم
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#3D52A0', fontWeight: 800, marginBottom: '0.4rem' }}>
                        🌟 {d.title}
                      </div>

                      <p style={{ fontSize: '0.76rem', color: '#475569', lineHeight: '1.5', margin: '0 0 0.85rem' }}>
                        {d.achievement}
                      </p>
                    </div>

                    <button
                      onClick={() => handlePrintCertificate({
                        teacherNameAr: deptTeacherName,
                        departmentName: d.department,
                        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية لقسم ${d.department}، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
                        badgeTitle: 'وسام التميز في التعليم الإلكتروني',
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
                );
              })}
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
                  أفضل 5 شعب دراسية حققت أعلى نسب إنجاز وحل للتقييمات المسندة لشهر {selMonth} {selYear}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintAllDistinguishedSections}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                  }}
                  title="طباعة كافة شهادات شكر وتقدير الشعب المتصدرة دفعة واحدة (A4 Landscape)"
                >
                  <span>🏆</span> طباعة جميع شهادات الشعب المتصدرة (A4)
                </button>
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
                    <span>📊</span> عرض تحليل الشعب الدراسية بالتفصيل
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {activeTopSections.map((sec, idx) => {
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
                        recognitionReason: `تقديرًا للمشاركة الفاعلة والتفاعل المتميز لطلاب ومعلمي شعبة ${sec.section} (${sec.grade}) في تفعيل نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية.`,
                        badgeTitle: 'الشعبة المتميزة في التعليم الإلكتروني',
                        recipientType: 'section',
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

          {/* ── Monthly Takreem Evolution Panel ── */}
          <div style={{ ...cardStyle, background: '#fff', border: '1px solid #E2E8F0', marginTop: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F2044', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🏆</span>
                🔄 تحليل تطور لوحة التكريم والتميز بين سبتمبر وأكتوبر 2026
              </h3>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                تحديث تراكمي رسمي
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#166534', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>⭐</span> فرسان واصلوا الحفاظ على صدارة التميز في كلا الشهرين
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {LMS_TAKREEM_MONTHLY_EVOLUTION.consistentChampions.map((c, i) => (
                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.82rem' }}>{c.teacherName} — قسم {c.department}</div>
                      <div style={{ color: '#475569', fontSize: '0.74rem', marginTop: '0.2rem' }}>{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#92400E', margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🚀</span> فرسان صاعدون للتكريم لشهر أكتوبر لأول مرة
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {LMS_TAKREEM_MONTHLY_EVOLUTION.risingChampionsInOctober.map((c, i) => (
                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #FEF3C7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#92400E', fontSize: '0.82rem' }}>{c.teacherName}</span>
                        <span style={{ background: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          مؤشر {c.score}
                        </span>
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.74rem', marginTop: '0.2rem' }}>{c.department} — {c.rank}</div>
                    </div>
                  ))}
                </div>
              </div>
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
                        recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
                        badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
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
                              recognitionReason: `تقديرًا لتميزه وإبداعه في استخدام نظام قطر للتعليم وتوظيف الأدوات التكنولوجية الحديثة داخل الحصص الدراسية، وإسهاماته الفاعلة في تعزيز نواتج التعلم الرقمي.`,
                              badgeTitle: 'شهادة تميز في التعليم الإلكتروني',
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
