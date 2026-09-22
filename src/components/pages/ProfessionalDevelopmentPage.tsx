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
  UserCheck, Briefcase, BarChart as BarChartIcon, Sparkles
} from 'lucide-react';
import { 
  SCHOOL_NAME, ACADEMIC_YEARS, MONTHS, db, generateId, type User, getDeptName,
  getDepartmentStaffCount, getInstitutionalEvaluation, resolveTeacherDepartment 
} from '@/lib/data';
import { type Workshop, type PDAttendance, type PDEvidence, type IndividualPDRecord, type IndividualPDSkill, classifyIndividualSkill } from '@/lib/pdData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ComposedChart, Scatter, LabelList
} from 'recharts';
import { SingleWorkshopReport, SingleIndividualPDReport, PDReportsCenterTab } from './PDReports';
import MeeeCertifiedReportModal from './MeeeCertifiedReportModal';
import { RichBulletTextarea, FormattedReportPoints } from '@/components/RichBulletTextarea';
import PDPlanTab from './PDPlanTab';

// ─── Automated Arabic to English Translation Helper for Workshops ───────────────
const AR_EN_DICTIONARY: [RegExp, string][] = [
  [/ورشة عمل/gi, 'Workshop on'],
  [/ورشة/gi, 'Workshop on'],
  [/دورة تدريبية/gi, 'Training Course on'],
  [/دورة/gi, 'Course on'],
  [/جلسة تطويرية/gi, 'Development Session on'],
  [/جلسة تدريبية/gi, 'Training Session on'],
  [/تطوير مهني/gi, 'Professional Development'],
  [/تطوير ذاتي/gi, 'Self Development'],
  [/التمكين الرقمي/gi, 'Digital Empowerment'],
  [/التعليم الإلكتروني/gi, 'E-Learning'],
  [/نظام قطر للتعليم/gi, 'Qatar Education System'],
  [/الذكاء الاصطناعي/gi, 'Artificial Intelligence'],
  [/الذكاء الإصطناعي/gi, 'Artificial Intelligence'],
  [/الواقع الافتراضي/gi, 'Virtual Reality'],
  [/الواقع المعزز/gi, 'Augmented Reality'],
  [/الأمن السيبراني/gi, 'Cybersecurity'],
  [/الحوسبة السحابية/gi, 'Cloud Computing'],
  [/السبورة التفاعلية/gi, 'Interactive Whiteboard'],
  [/التعلم عن بعد/gi, 'Distance Learning'],
  [/التعلم المدمج/gi, 'Blended Learning'],
  [/إدارة الصف/gi, 'Classroom Management'],
  [/تقييم الطلاب/gi, 'Student Assessment'],
  [/ماينكرافت التعليمية/gi, 'Minecraft Education'],
  [/ماينكرافت/gi, 'Minecraft'],
  [/البرمجة/gi, 'Programming'],
  [/لغة بايثون/gi, 'Python Language'],
  [/بايثون/gi, 'Python'],
  [/الروبوت/gi, 'Robotics'],
  [/روبوت/gi, 'Robotics'],
  [/مختبر الطاقة/gi, 'Energy Lab'],
  [/مختبر التصنيع الرقمي/gi, 'Digital FabLab'],
  [/مختبر التصنيع/gi, 'FabLab'],
  [/ستيم/gi, 'STEM'],
  [/التصميم والطباعة ثلاثية الأبعاد/gi, '3D Design and Printing'],
  [/الطباعة ثلاثية الأبعاد/gi, '3D Printing'],
  [/أدوات مايكروسوفت التعليمية/gi, 'Microsoft Education Tools'],
  [/أدوات مايكروسوفت/gi, 'Microsoft Tools'],
  [/أدوات ميكروسوفت/gi, 'Microsoft Tools'],
  [/تطبيقات/gi, 'Applications of'],
  [/استراتيجيات التدريس الحديثة/gi, 'Modern Teaching Strategies'],
  [/استراتيجيات التدريس/gi, 'Teaching Strategies'],
  [/بنك الأسئلة/gi, 'Question Bank'],
  [/الأنشطة التفاعلية/gi, 'Interactive Activities'],
  [/الخطط الدراسية/gi, 'Lesson Plans'],
  [/الفصول الافتراضية/gi, 'Virtual Classrooms'],
  [/تفعيل/gi, 'Activating'],
  [/توظيف/gi, 'Integrating'],
  [/استخدام/gi, 'Using'],
  [/تطبيق/gi, 'Implementing'],
  [/في التعليم/gi, 'in Education'],
  [/داخل الصف/gi, 'in Classroom'],
  [/للمعلمين/gi, 'for Teachers'],
  [/للإداريين/gi, 'for Administrators'],
  [/للطلاب/gi, 'for Students'],
  [/المتقدم/gi, 'Advanced'],
  [/الأساسي/gi, 'Fundamentals'],
  [/مهارات/gi, 'Skills of']
];

export async function translateArabicToEnglish(text: string): Promise<string> {
  const clean = text?.trim();
  if (!clean) return '';

  // 1. Google Translate Client API (Client-side fast endpoint)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join('').trim();
        if (translated && !translated.toLowerCase().includes('error')) {
          return translated.replace(/\b\w/g, char => char.toUpperCase());
        }
      }
    }
  } catch (e) {
    // Proceed to fallback
  }

  // 2. MyMemory Translation API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=ar|en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const txt = data?.responseData?.translatedText;
      if (txt && typeof txt === 'string' && !txt.includes('MYMEMORY WARNING') && !txt.includes('QUERY LENGTH LIMIT')) {
        return txt.trim().replace(/\b\w/g, char => char.toUpperCase());
      }
    }
  } catch (e) {
    // Proceed to dictionary
  }

  // 3. Fallback: Educational Dictionary Translation
  let translated = clean;
  for (const [pattern, enWord] of AR_EN_DICTIONARY) {
    translated = translated.replace(pattern, enWord);
  }
  translated = translated.replace(/\s+/g, ' ').trim();
  if (!translated.toLowerCase().startsWith('workshop') && clean.includes('ورشة')) {
    translated = `Workshop: ${translated}`;
  }
  return translated.replace(/\b\w/g, char => char.toUpperCase());
}

type TabType = 'overview' | 'all' | 'individual' | 'meee' | 'attendance' | 'evidence' | 'reports' | 'plan';

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
  updatedAt: string;
}

interface Props {
  currentUser: User;
  selectedYear?: string;
}

export default function ProfessionalDevelopmentPage({ currentUser, selectedYear: propYear }: Props) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [individualRecords, setIndividualRecords] = useState<IndividualPDRecord[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<MeeeRecord[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isMeeeFormOpen, setIsMeeeFormOpen] = useState(false);
  const [editingMeee, setEditingMeee] = useState<MeeeRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState(propYear || '2026-2027');
  useEffect(() => { if (propYear) setFilterYear(propYear); }, [propYear]);
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
  const [printType, setPrintType] = useState<'individual' | 'annual' | 'teacher_log' | 'meee_report'>('individual');
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false);
  const [reportingWorkshop, setReportingWorkshop] = useState<Workshop | null>(null);
  const [reportingIndividual, setReportingIndividual] = useState<IndividualPDRecord | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isELearningCoord = currentUser.role === 'evaluator'; 
  // Only admin can add/edit/delete in PD page
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    const loadData = async () => {
      const [w, r, m, t, d] = await Promise.all([
        db.getWorkshops(), 
        db.getIndividualPDRecords(), 
        db.getMeeeRecords(),
        db.getTeachers(),
        db.getDepartments()
      ]);
      
      // Cleanup: Remove all auto-generated signatures from attendance sheets
      let changed = false;
      const cleanWorkshops = w.map(workshop => {
        if (workshop.attendees?.some((a: any) => a.signatureImage)) {
          changed = true;
          return {
            ...workshop,
            attendees: workshop.attendees.map((a: any) => {
              const { signatureImage, ...rest } = a;
              return rest;
            })
          };
        }
        return workshop;
      });

      if (changed) {
        db.saveWorkshops(cleanWorkshops);
      }

      setWorkshops(cleanWorkshops);
      setIndividualRecords(r);
      setMeeeRecords(m);
      setTeachers(t);
      setDepartments(d);
    };
    loadData();
  }, []);

  const saveWorkshops = async (newWorkshops: Workshop[]) => {
    setWorkshops(newWorkshops);
    await db.saveWorkshops(newWorkshops);
  };

  const saveIndividualRecords = async (newRecords: IndividualPDRecord[]) => {
    setIndividualRecords(newRecords);
    await db.saveIndividualPDRecords(newRecords);
  };

  const saveMeeeRecords = async (newRecords: MeeeRecord[]) => {
    setMeeeRecords(newRecords);
    await db.saveMeeeRecords(newRecords);
  };

  const handleSaveMeee = (r: MeeeRecord) => {
    // Check if editing an existing record
    const isEditing = meeeRecords.find(item => item.id === r.id);
    if (isEditing) {
      // Update existing
      const newRecords = meeeRecords.map(item => item.id === r.id ? r : item);
      saveMeeeRecords(newRecords);
    } else {
      // Check for duplicate: same teacher + same academic year
      const duplicate = meeeRecords.find(item => 
        item.teacherId === r.teacherId && item.academicYear === r.academicYear
      );
      if (duplicate) {
        // If same status, block
        if (duplicate.status === r.status) {
          alert(`\u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0644\u0645 \u0645\u0633\u062c\u0644 \u0628\u0627\u0644\u0641\u0639\u0644 \u0628\u062d\u0627\u0644\u0629 "${r.status}" \u0644\u0644\u0639\u0627\u0645 ${r.academicYear}.\n\u0644\u0627 \u064a\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0633\u062c\u0644 \u0645\u0643\u0631\u0631.`);
          return;
        }
        // Different status → update the existing record
        const updated = { ...duplicate, status: r.status, certificationDate: r.certificationDate, notes: r.notes, updatedAt: new Date().toISOString() };
        const newRecords = meeeRecords.map(item => item.id === duplicate.id ? updated : item);
        saveMeeeRecords(newRecords);
      } else {
        // New record
        saveMeeeRecords([r, ...meeeRecords]);
      }
    }
    setIsMeeeFormOpen(false);
    setEditingMeee(null);
  };

  const handleDeleteMeee = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      saveMeeeRecords(meeeRecords.filter(r => r.id !== id));
    }
  };

  // MEEE Statistics
  const meeeStats = useMemo(() => {
    const yearRecords = meeeRecords.filter(r => r.academicYear === filterYear);
    const total = yearRecords.length;
    const applied = yearRecords.filter(r => r.status === 'تم التقديم').length;
    const certified = yearRecords.filter(r => r.status === 'حصل على الشهادة').length;
    const activeTeachers = teachers.filter(t => t.status !== 'inactive');
    const totalSchoolTeachers = filterYear === '2026-2027' ? 65 : (activeTeachers.length > 0 ? activeTeachers.length : (teachers.length > 0 ? teachers.length : 62));
    
    // Percentage calculated strictly from total school teachers (as requested by user)
    const certRate = totalSchoolTeachers > 0 ? Math.round((certified / totalSchoolTeachers) * 100) : 0;
    const applicantSuccessRate = total > 0 ? Math.round((certified / total) * 100) : 0;

    const deptMap: Record<string, { applied: number; certified: number }> = {};
    yearRecords.forEach(r => {
      const dName = resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments);
      if (!deptMap[dName]) deptMap[dName] = { applied: 0, certified: 0 };
      if (r.status === 'حصل على الشهادة') deptMap[dName].certified++;
      else deptMap[dName].applied++;
    });

    const deptData = Object.entries(deptMap).map(([name, v]) => {
      // Find matching department staff count and canonical info
      const { count: deptTeachersCount } = getDepartmentStaffCount(name, teachers, departments);
      
      // Calculate rate based on department size
      const appliedRate = deptTeachersCount > 0 ? Math.round((v.applied / deptTeachersCount) * 100) : 0;
      const certifiedRate = deptTeachersCount > 0 ? Math.round((v.certified / deptTeachersCount) * 100) : 0;
      const evaluation = getInstitutionalEvaluation(certifiedRate, v.certified);

      return {
        name,
        applied: v.applied,
        certified: v.certified,
        total: v.applied + v.certified,
        deptTeachersCount,
        appliedRate,
        certifiedRate,
        evaluation
      };
    }).sort((a, b) => b.certifiedRate - a.certifiedRate || b.certified - a.certified || b.deptTeachersCount - a.deptTeachersCount);

    return { 
      total, 
      applied, 
      certified, 
      certRate, 
      applicantSuccessRate, 
      totalSchoolTeachers, 
      deptData 
    };
  }, [meeeRecords, filterYear, teachers, departments]);

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

  const printReport = (type: 'individual' | 'annual' | 'meee_report') => {
    setPrintType(type);
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 500);
  };

  // Full-Screen Dedicated Official Report Viewers
  if (reportingWorkshop) {
    return (
      <SingleWorkshopReport
        workshop={reportingWorkshop}
        teachers={teachers}
        departments={departments}
        onClose={() => setReportingWorkshop(null)}
        onUpdateWorkshop={(updated) => {
          const next = workshops.map(w => w.id === updated.id ? updated : w);
          saveWorkshops(next);
          setReportingWorkshop(updated);
        }}
        canEdit={canEdit}
      />
    );
  }

  if (reportingIndividual) {
    return (
      <SingleIndividualPDReport
        record={reportingIndividual}
        onClose={() => setReportingIndividual(null)}
        canEdit={canEdit}
      />
    );
  }

  if (showComprehensiveReport) {
    return (
      <ComprehensivePDReport
        workshops={workshops}
        individualRecords={individualRecords}
        meeeRecords={meeeRecords}
        teachers={teachers}
        departments={departments}
        filterYear={filterYear}
        dashboardStats={dashboardStats}
        chartsData={chartsData}
        meeeStats={meeeStats}
        onClose={() => setShowComprehensiveReport(false)}
      />
    );
  }

  return (
    <div className="pd-page-container" style={{ padding: '2rem', direction: 'rtl', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>التطوير المهني والتمكين الرقمي</h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem', marginTop: '0.5rem', fontWeight: 500 }}>توثيق ومتابعة ورش التطوير المهني والتمكين الرقمي للعام الأكاديمي 2026-2027</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('reports')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #0F2044, #1e3a8a)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 900, boxShadow: '0 2px 8px rgba(15,32,68,0.25)' }}
          >
            <FileText size={20} /> مركز التقارير المعتمدة
          </button>
          <button
            onClick={() => setShowComprehensiveReport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #0369A1, #0284C7)', color: '#fff', border: 'none', padding: '0.8rem 1.3rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, boxShadow: '0 2px 8px rgba(3,105,161,0.3)' }}
          >
            <Award size={20} /> التقرير السنوي الشامل
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => { setEditingWorkshop(null); setIsFormOpen(true); }}
                className="btn-primary-gradient"
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, border: 'none', color: '#fff' }}
              >
                <Plus size={20} /> ورشة عمل
              </button>
              <button
                onClick={() => { setEditingIndividual(null); setIsIndFormOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, border: 'none', color: '#fff', background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' }}
              >
                <UserPlus size={20} /> تدريب فردي
              </button>
            </>
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
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <KPICard label="إجمالي الورش الجماعية" value={dashboardStats.total} icon={<BookOpen size={24} />} color="#0F2044" trend="العدد الكلي" />
        <KPICard label="إجمالي جلسات التدريب الفردي" value={dashboardStats.totalInd} icon={<UserCheck size={24} />} color="#00B4D8" trend="دعم مباشر" />
        <KPICard label="المعلمون المستفيدون (فردي)" value={dashboardStats.uniqueTeachersInd} icon={<Users size={24} />} color="#10B981" trend="أثر تدريبي" />
        <KPICard label="إجمالي ساعات التدريب (جماعي)" value={dashboardStats.totalHours} icon={<Clock size={24} />} color="#F59E0B" trend="ساعة" />
        <KPICard label="إجمالي ساعات الدعم (فردي)" value={dashboardStats.totalIndHours} icon={<Activity size={24} />} color="#6366F1" trend="ساعة" />
        <KPICard label="أكثر شهر نشاطاً" value={dashboardStats.activeMonth} icon={<Calendar size={24} />} color="#F43F5E" trend="نشاط مكثف" />
      </div>

      {/* Tabs Navigation */}
      <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.25rem', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10, paddingTop: '0.5rem' }}>
        {[
          { id: 'overview', label: 'لوحة التحكم والتحليلات', icon: <BarChart3 size={18} /> },
          { id: 'all', label: 'ورش العمل الجماعية', icon: <ClipboardList size={18} /> },
          { id: 'individual', label: 'التطوير الفردي للمعلمين', icon: <UserPlus size={18} /> },
          { id: 'reports', label: 'التقارير الرسمية المعتمدة', icon: <FileText size={18} /> },
          { id: 'meee', label: 'شهادة MEEE', icon: <Award size={18} /> },
          { id: 'attendance', label: 'سجلات الحضور', icon: <ListChecks size={18} /> },
          { id: 'plan', label: 'خطة التطوير المهني', icon: <Layers size={18} /> },
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
        ) : activeTab === 'reports' ? (
          <PDReportsCenterTab
            workshops={workshops}
            individualRecords={individualRecords}
            teachers={teachers}
            departments={departments}
            filterYear={filterYear}
            onOpenComprehensive={() => setShowComprehensiveReport(true)}
            canEdit={canEdit}
            onUpdateWorkshop={(updated: Workshop) => {
              const next = workshops.map(w => w.id === updated.id ? updated : w);
              saveWorkshops(next);
            }}
          />
        ) : activeTab === 'meee' ? (
          <MeeeTabContent 
            meeeRecords={meeeRecords}
            meeeStats={meeeStats}
            filterYear={filterYear}
            teachers={teachers}
            departments={departments}
            canEdit={canEdit}
            canDelete={canDelete}
            onAdd={() => { setEditingMeee(null); setIsMeeeFormOpen(true); }}
            onEdit={(r: MeeeRecord) => { setEditingMeee(r); setIsMeeeFormOpen(true); }}
            onDelete={handleDeleteMeee}
            onPrint={() => printReport('meee_report')}
            COLORS={COLORS}
          />
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
                <thead style={{ background: '#0F2044', color: '#ffffff' }}>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    {['التاريخ', 'اسم المعلم', 'القسم', 'المهارة المقدمة', 'التصنيف', 'المدرب', 'الحالة', 'الإجراءات'].map(h => (
                      <th key={h} style={{ padding: '1.5rem 1rem', fontSize: '0.9rem', color: '#ffffff', fontWeight: 900, background: '#0F2044' }}>{h}</th>
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
                          <button onClick={() => setReportingIndividual(r)} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #BAE6FD', background: '#F0F9FF', cursor: 'pointer', color: '#0369A1' }} title="التقرير الرسمي المعتمد (مع إقرار وتوقيع الحاضر)"><FileText size={16} /></button>
                          <button onClick={() => { setEditingIndividual(r); setIsIndFormOpen(true); }} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#1E40AF' }} title="تعديل"><Edit2 size={16} /></button>
                          <button onClick={() => { setSelectedIndividual(r); }} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#0F2044' }} title="عرض التفاصيل"><Eye size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'plan' ? (
          <PDPlanTab
            workshops={workshops}
            individualRecords={individualRecords}
            meeeRecords={meeeRecords}
            teachers={teachers}
            departments={departments}
            filterYear={filterYear}
            onViewReport={(w) => setReportingWorkshop(w)}
            onSelectWorkshop={(w) => setSelectedWorkshop(w)}
            onAddWorkshop={() => { setEditingWorkshop(null); setIsFormOpen(true); }}
            onAddIndividual={() => { setEditingIndividual(null); setIsIndFormOpen(true); }}
            onViewIndividualReport={(r) => setReportingIndividual(r)}
            canEdit={canEdit}
          />
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
              <FilterSelect value={filterAudience} onChange={setFilterAudience} options={['all', 'المعلمين', 'المعلمين الجدد', 'الطلاب', 'الاداريين']} label="الفئة المستهدفة" />
              <FilterSelect value={filterCategory} onChange={setFilterCategory} options={['all', ...Array.from(new Set(workshops.map(w => w.category)))]} label="التصنيف" />
              <FilterSelect value={filterStatus} onChange={setFilterStatus} options={['all', 'موثق', 'تم التنفيذ', 'قيد التنفيذ', 'يحتاج متابعة']} label="الحالة" />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ background: '#0F2044', color: '#ffffff' }}>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    {['#', 'الورشة', 'المدرب/الجهة', 'التاريخ/الساعات', 'المستهدفون', 'الحالة', 'الإجراءات'].map(h => (
                      <th key={h} style={{ padding: '1.5rem 1rem', fontSize: '0.9rem', color: '#ffffff', fontWeight: 900, background: '#0F2044' }}>{h}</th>
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
                          <div style={{ fontWeight: 900, color: '#0F2044', fontSize: '1.05rem', lineHeight: 1.4 }}>{w.titleAr || w.nameAr}</div>
                          {(w.titleEn || w.nameEn) && (
                            <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', direction: 'ltr', textAlign: 'right', marginTop: '2px' }}>
                              <bdi dir="ltr">{w.titleEn || w.nameEn}</bdi>
                            </div>
                          )}
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                            <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', color: '#475569', fontWeight: 700 }}>{w.category}</span> | {w.id}
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 800 }}>{w.facilitatorName || w.trainer}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{w.organizerName || w.entity}</div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ fontWeight: 700 }}>{w.date || w.month}</div>
                          <div style={{ color: '#00B4D8', fontWeight: 700, fontSize: '0.85rem' }}>{w.hours} ساعة</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            <MapPin size={12} color="#0284C7" />
                            <span>{w.venue || w.location || 'مقر المدرسة'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.5rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          {w.targetAudience || w.targetGroup}
                          {w.targetAudience === 'الطلاب' && w.targetClasses ? ` (${w.targetClasses})` : ''}
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '12px', fontWeight: 900, background: s.bg, color: s.text }}>
                            {s.icon} {w.status}
                          </span>
                        </td>
                        <td style={{ padding: '1.5rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button onClick={() => setReportingWorkshop(w)} style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid #BAE6FD', background: '#F0F9FF', cursor: 'pointer', color: '#0369A1' }} title="التقرير الرسمي المعتمد (مع كشف الحضور والتوقيعات)"><FileText size={18} /></button>
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
          onPrint={() => { setReportingWorkshop(selectedWorkshop); setSelectedWorkshop(null); }}
          canEdit={canEdit} 
        />
      )}
      
      {selectedIndividual && (
        <IndividualPDModal 
          record={selectedIndividual} 
          onClose={() => setSelectedIndividual(null)} 
          onEdit={() => { setEditingIndividual(selectedIndividual); setIsIndFormOpen(true); setSelectedIndividual(null); }} 
          onPrint={() => { setReportingIndividual(selectedIndividual); setSelectedIndividual(null); }}
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

      {isMeeeFormOpen && (
        <MeeeForm 
          record={editingMeee} 
          onSave={handleSaveMeee} 
          onClose={() => { setIsMeeeFormOpen(false); setEditingMeee(null); }} 
        />
      )}

      <style jsx>{`
        .btn-primary-gradient { background: linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%); transition: all 0.3s ease; }
        .btn-primary-gradient:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,32,68,0.2); }
        .table-row:hover { background: #F8FAFC; }
        @media print {
          @page { size: portrait; margin: 8mm !important; }
          .no-print, header, aside, .topbar, .sidebar, nav { display: none !important; }
          .single-workshop-report-container, .single-ind-report-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .printable-report {
            display: block !important;
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            position: relative !important;
            min-height: auto !important;
            box-sizing: border-box !important;
          }
          .printable-report * {
            visibility: visible !important;
          }
          body {
            background: #fff !important;
          }
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
            {(workshop.titleEn || workshop.nameEn) ? (
              <p style={{ opacity: 0.85, fontSize: '0.95rem', marginTop: '0.25rem', direction: 'ltr', textAlign: 'right' }}>
                <bdi dir="ltr">{workshop.titleEn || workshop.nameEn}</bdi>
              </p>
            ) : (
              <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.25rem' }}>{workshop.id}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onPrint} style={{ background: '#00B4D8', border: 'none', borderRadius: '14px', padding: '0.7rem 1.3rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}><FileText size={18} /> التقرير الرسمي (مع كشف وتواقيع الحضور)</button>
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
                  {workshop.targetAudience === 'الطلاب' && workshop.targetClasses && (
                    <InfoItem label="الصفوف المستهدفة" value={workshop.targetClasses} icon={<Users size={18} />} />
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={18} color="#00B4D8" /> الأهداف ومخرجات التعلم:
                    </h5>
                    <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <FormattedReportPoints text={workshop.objectives} defaultText="لا يوجد" bulletColor="#00B4D8" fontSize="0.82rem" />
                    </div>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} color="#10B981" /> المحاور الرئيسية وما تم مناقشته:
                    </h5>
                    <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <FormattedReportPoints text={workshop.keyPoints} defaultText="لا يوجد" bulletColor="#10B981" fontSize="0.82rem" />
                    </div>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={18} color="#F59E0B" /> التوصيات ومخرجات المتابعة:
                    </h5>
                    <div style={{ padding: '1.25rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <FormattedReportPoints text={workshop.recommendations} defaultText="لا يوجد" bulletColor="#F59E0B" fontSize="0.82rem" />
                    </div>
                  </div>
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
  const [fd, setFd] = useState<Partial<Workshop>>(workshop ? {
    ...workshop,
    venue: workshop.venue || workshop.location || 'مدرسة قطر للعلوم والتكنولوجيا',
    location: workshop.venue || workshop.location || 'مدرسة قطر للعلوم والتكنولوجيا',
    targetAudience: workshop.targetAudience || workshop.targetGroup || 'المعلمين',
    category: workshop.category || 'تطوير ذاتي',
  } : { 
    id: `PD-2526-W${generateId().slice(0, 4)}`, 
    titleAr: '', 
    titleEn: '',
    academicYear: '2026-2027', 
    month: 'أغسطس', 
    trainingMode: 'جلسة تطويرية Hands on Session', 
    category: 'تطوير ذاتي', 
    targetAudience: 'المعلمين', 
    facilitatorName: '', 
    organizerName: SCHOOL_NAME, 
    venue: 'مدرسة قطر للعلوم والتكنولوجيا', 
    location: 'مدرسة قطر للعلوم والتكنولوجيا',
    objectives: '', 
    keyPoints: '', 
    recommendations: '', 
    status: 'تم التنفيذ', 
    hours: '2', 
    attendanceCount: 0, 
    updatedAt: new Date().toISOString() 
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translateFeedback, setTranslateFeedback] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-translate Arabic title to English
  const handleTranslate = async (arabicText: string, force = false) => {
    const cleanText = arabicText?.trim();
    if (!cleanText || cleanText.length < 3) return;

    // Do not overwrite user's manual English input unless forced
    if (!force && fd.titleEn && fd.titleEn.trim().length > 0) return;

    setIsTranslating(true);
    setTranslateFeedback('جاري الترجمة التلقائية...');
    try {
      const translated = await translateArabicToEnglish(cleanText);
      if (translated) {
        setFd(prev => ({ ...prev, titleEn: translated }));
        setTranslateFeedback('تمت الترجمة تلقائياً ✓');
        setTimeout(() => setTranslateFeedback(null), 3500);
      } else {
        setTranslateFeedback(null);
      }
    } catch (err) {
      console.warn('Auto translate error:', err);
      setTranslateFeedback(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTitleArChange = (val: string) => {
    setFd(prev => ({ ...prev, titleAr: val }));
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (val.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        handleTranslate(val, false);
      }, 700);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 3rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h3 style={{ fontWeight: 900, color: '#0F2044', margin: 0, fontSize: '1.2rem' }}>
              {workshop ? 'تعديل بيانات ورشة العمل' : 'إضافة ورشة عمل تدريبية جديدة'}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              منظومة التطوير المهني والتمكين الرقمي — مدرسة قطر للعلوم والتكنولوجيا
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <form onSubmit={e => { 
          e.preventDefault(); 
          const finalVenue = fd.venue || fd.location || 'مدرسة قطر للعلوم والتكنولوجيا';
          onSave({ ...fd, venue: finalVenue, location: finalVenue } as Workshop); 
        }} style={{ padding: '2.5rem 3rem', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            
            {/* Arabic Workshop Title */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <FormLabel style={{ margin: 0 }}>عنوان الورشة (بالعربية) *</FormLabel>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>يترجم للإنجليزية تلقائياً أثناء الكتابة</span>
              </div>
              <input 
                value={fd.titleAr || fd.nameAr || ''} 
                onChange={e => handleTitleArChange(e.target.value)} 
                onBlur={e => handleTranslate(e.target.value, false)}
                className="form-input" 
                placeholder="مثال: ورشة توظيف أدوات الذكاء الاصطناعي في التدريس..."
                required 
              />
            </div>

            {/* Academic Year */}
            <div>
              <FormLabel>العام الدراسي</FormLabel>
              <select value={fd.academicYear} onChange={e => setFd({...fd, academicYear: e.target.value})} className="form-input" style={{ background: '#fff' }}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* English Workshop Title with Auto-Translation */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <FormLabel style={{ margin: 0 }}>عنوان الورشة (بالإنجليزية)</FormLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {translateFeedback && (
                    <span style={{ fontSize: '0.74rem', color: isTranslating ? '#0284C7' : '#059669', fontWeight: 800 }}>
                      {translateFeedback}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isTranslating || !(fd.titleAr || fd.nameAr)}
                    onClick={() => handleTranslate(fd.titleAr || fd.nameAr || '', true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: '#F0F9FF',
                      color: '#0284C7',
                      border: '1px solid #BAE6FD',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: (isTranslating || !(fd.titleAr || fd.nameAr)) ? 'not-allowed' : 'pointer'
                    }}
                    title="ترجمة فورية للعنوان بالذكاء الاصطناعي"
                  >
                    <Sparkles size={13} color="#0284C7" />
                    {isTranslating ? 'جاري الترجمة...' : '✨ ترجمة فورية تلقائية'}
                  </button>
                </div>
              </div>
              <input 
                value={fd.titleEn || fd.nameEn || ''} 
                onChange={e => setFd({...fd, titleEn: e.target.value})} 
                className="form-input" 
                dir="ltr"
                placeholder="Workshop Title in English (auto-translated)"
              />
            </div>

            {/* Category with "تطوير ذاتي" */}
            <div>
              <FormLabel>التصنيف</FormLabel>
              <select value={fd.category || 'تطوير ذاتي'} onChange={e => setFd({...fd, category: e.target.value})} className="form-input" style={{ background: '#fff' }}>
                <option value="تطوير ذاتي">تطوير ذاتي</option>
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
            
            <div style={{ borderTop: '1px solid #E2E8F0', gridColumn: 'span 3', margin: '0.5rem 0' }}></div>

            <div>
              <FormLabel>المدرب / مقدم الورشة</FormLabel>
              <input value={fd.facilitatorName || fd.trainer || ''} onChange={e => setFd({...fd, facilitatorName: e.target.value})} className="form-input" placeholder="اسم مقدم الورشة" />
            </div>

            <div>
              <FormLabel>الجهة المنظمة</FormLabel>
              <input value={fd.organizerName || fd.entity || SCHOOL_NAME} onChange={e => setFd({...fd, organizerName: e.target.value})} className="form-input" />
            </div>

            <div>
              <FormLabel>مكان انعقاد الورشة (القاعة / المنصة)</FormLabel>
              <input 
                list="workshop-venue-list"
                value={fd.venue || fd.location || ''} 
                onChange={e => setFd({...fd, venue: e.target.value, location: e.target.value})} 
                className="form-input" 
                placeholder="مثال: مختبر الروبوت / مسرح المدرسة / Teams"
              />
              <datalist id="workshop-venue-list">
                <option value="مدرسة قطر للعلوم والتكنولوجيا" />
                <option value="قاعة الاجتماعات الرئيسية" />
                <option value="مختبر الروبوت" />
                <option value="مختبر الواقع الافتراضي (VR)" />
                <option value="مسرح المدرسة" />
                <option value="مختبر ستيم STEM" />
                <option value="مختبر التصنيع الرقمي (FabLab)" />
                <option value="مختبر الطاقة" />
                <option value="قاعة المحاضرات" />
                <option value="الصف الدراسي" />
                <option value="عن بعد عبر Microsoft Teams" />
              </datalist>
            </div>

            {/* Target Audience Dropdown Menu */}
            <div>
              <FormLabel>الفئة المستهدفة (Drop-down Menu)</FormLabel>
              <select 
                value={fd.targetAudience || 'المعلمين'} 
                onChange={e => setFd({...fd, targetAudience: e.target.value})} 
                className="form-input"
                style={{ background: '#fff' }}
              >
                <option value="المعلمين">المعلمين</option>
                <option value="المعلمين الجدد">المعلمين الجدد</option>
                <option value="الاداريين">الاداريين</option>
                <option value="الطلاب">الطلاب</option>
                <option value="اولياء الامور">اولياء الامور</option>
                <option value="منسق المشاريع الالكترونية">منسق المشاريع الالكترونية</option>
                {/* Support legacy custom values if present */}
                {fd.targetAudience && !['المعلمين', 'المعلمين الجدد', 'الاداريين', 'الطلاب', 'اولياء الامور', 'منسق المشاريع الالكترونية', 'المعلمون'].includes(fd.targetAudience) && (
                  <option value={fd.targetAudience}>{fd.targetAudience}</option>
                )}
              </select>
            </div>

            {fd.targetAudience === 'الطلاب' && (
              <div>
                <FormLabel>الصفوف المستهدفة</FormLabel>
                <select 
                  value={fd.targetClasses || 'جميع الصفوف'} 
                  onChange={e => setFd({...fd, targetClasses: e.target.value})} 
                  className="form-input"
                  style={{ background: '#fff' }}
                >
                  <option value="جميع الصفوف">جميع الصفوف</option>
                  <option value="الصف التاسع">الصف التاسع</option>
                  <option value="الصف العاشر">الصف العاشر</option>
                  <option value="الصف الحادي عشر">الصف الحادي عشر</option>
                  <option value="الصف الثاني عشر">الصف الثاني عشر</option>
                  <option value="مجموعة مختارة">مجموعة مختارة</option>
                  {fd.targetClasses && !['جميع الصفوف', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر', 'مجموعة مختارة'].includes(fd.targetClasses) && (
                    <option value={fd.targetClasses}>{fd.targetClasses}</option>
                  )}
                </select>
              </div>
            )}
            
            <div>
              <FormLabel>تاريخ التنفيذ</FormLabel>
              <input type="date" value={fd.date || ''} onChange={e => setFd({...fd, date: e.target.value})} className="form-input" />
            </div>

            <div>
              <FormLabel>عدد الساعات التدريبية</FormLabel>
              <input type="number" value={fd.hours || '2'} onChange={e => setFd({...fd, hours: e.target.value})} className="form-input" min={1} />
            </div>

            <div>
              <FormLabel>الحالة</FormLabel>
              <select value={fd.status} onChange={e => setFd({...fd, status: e.target.value as any})} className="form-input" style={{ background: '#fff' }}>
                <option value="موثق">موثق</option>
                <option value="تم التنفيذ">تم التنفيذ</option>
                <option value="قيد التنفيذ">قيد التنفيذ</option>
                <option value="يحتاج متابعة">يحتاج متابعة</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <RichBulletTextarea
                label="الأهداف ومخرجات التعلم"
                value={fd.objectives || ''}
                onChange={val => setFd({ ...fd, objectives: val })}
                colorTheme="teal"
                rows={3}
                placeholder="اكتب الأهداف التعليمية أو استخدم أزرار الرموز بالأعلى (•، ✓، 🔹، ⭐، 📌)..."
              />
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <RichBulletTextarea
                label="المحاور الرئيسية والتدريب العملي (ما تم مناقشته)"
                value={fd.keyPoints || ''}
                onChange={val => setFd({ ...fd, keyPoints: val })}
                colorTheme="emerald"
                rows={3}
                placeholder="اكتب ما تم مناقشته والمحاور المطروحة مع الرموز والنقاط..."
              />
            </div>

            <div style={{ gridColumn: 'span 3' }}>
              <RichBulletTextarea
                label="التوصيات ومخرجات المتابعة"
                value={fd.recommendations || ''}
                onChange={val => setFd({ ...fd, recommendations: val })}
                colorTheme="amber"
                rows={3}
                placeholder="التوصيات والخطوات التطبيقية التالية..."
              />
            </div>
          </div>
          
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '1rem 2.5rem', borderRadius: '15px', border: '1px solid #E2E8F0', fontWeight: 800, cursor: 'pointer', background: '#fff' }}>إلغاء</button>
            <button type="submit" style={{ padding: '1rem 4rem', background: '#0F2044', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>حفظ بيانات الورشة</button>
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
            <button onClick={onPrint} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '14px', border: 'none', background: '#00B4D8', color: '#fff', fontWeight: 900, cursor: 'pointer' }}><FileText size={18} /> التقرير الرسمي (مع إقرار وتوقيع الحاضر)</button>
            {canEdit && <button onClick={onEdit} className="btn-primary-gradient" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', borderRadius: '14px', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}><Edit2 size={20} /> تعديل البيانات</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function IndividualPDForm({ record, onSave, onClose }: any) {
  const [fd, setFd] = useState<Partial<IndividualPDRecord>>(record || {
    id: `IND-2526-F${generateId().slice(0, 4)}`,
    academicYear: '2026-2027',
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
              <RichBulletTextarea
                label="ملاحظات إضافية وتوصيات"
                value={fd.notes || ''}
                onChange={val => setFd({ ...fd, notes: val })}
                colorTheme="blue"
                rows={2}
                placeholder="ملاحظات وتوصيات للمتدرب مع الرموز والنقاط..."
              />
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

function MeeeTabContent({ meeeRecords, meeeStats, filterYear, teachers = [], departments = [], canEdit, canDelete, onAdd, onEdit, onDelete, onPrint, COLORS }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [chartMode, setChartMode] = useState<'certified' | 'comparison' | 'all'>('certified');
  const [isCertifiedReportOpen, setIsCertifiedReportOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return meeeRecords.filter((r: MeeeRecord) => {
      const deptName = resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments);
      const matchesYear = r.academicYear === filterYear;
      const matchesSearch = r.teacherName.includes(searchTerm) || deptName.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchesDept = filterDept === 'all' || deptName === filterDept;
      return matchesYear && matchesSearch && matchesStatus && matchesDept;
    }).sort((a: MeeeRecord, b: MeeeRecord) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [meeeRecords, filterYear, searchTerm, filterStatus, filterDept, teachers, departments]);

  const MEEE_DEPT_COLORS = ['#0F2044', '#00B4D8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#E11D48', '#A855F7'];

  // Top performing department in certified teachers (by percentage of certified teachers out of department staff)
  const topDept = useMemo(() => {
    if (!meeeStats.deptData || meeeStats.deptData.length === 0) return null;
    const sorted = [...meeeStats.deptData]
      .filter((d: any) => d.certified > 0 && d.certifiedRate > 0)
      .sort((a: any, b: any) => b.certifiedRate - a.certifiedRate || b.certified - a.certified);
    return sorted[0] || null;
  }, [meeeStats.deptData]);

  // Data for school coverage donut chart
  const schoolCoverageDonutData = useMemo(() => {
    const uncertifiedTotal = Math.max(0, meeeStats.totalSchoolTeachers - meeeStats.certified - meeeStats.applied);
    return [
      { name: 'حصل على الشهادة (MIEE)', value: meeeStats.certified, color: '#10B981' },
      { name: 'تم التقديم (قيد المتابعة)', value: meeeStats.applied, color: '#F59E0B' },
      { name: 'باقي كادر المدرسة', value: uncertifiedTotal, color: '#E2E8F0' },
    ].filter(d => d.value > 0);
  }, [meeeStats]);

  // Custom high-tech Tooltip for MIEE BarChart
  const MeeeCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ background: '#0F2044', color: '#fff', padding: '1rem 1.25rem', borderRadius: '18px', boxShadow: '0 15px 30px rgba(15,32,68,0.3)', border: '1px solid rgba(255,255,255,0.12)', minWidth: '220px', textAlign: 'right', direction: 'rtl' }}>
          <p style={{ fontWeight: 900, fontSize: '1rem', margin: '0 0 0.6rem 0', color: '#38BDF8', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.4rem' }}>
            🏢 قسم: {item.name}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                الحاصلين على الشهادة:
              </span>
              <strong style={{ color: '#10B981', fontSize: '1.05rem' }}>{item.certified} معلم</strong>
            </div>
            {item.applied > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                  تم التقديم:
                </span>
                <strong style={{ color: '#F59E0B', fontSize: '1rem' }}>{item.applied} معلم</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
                إجمالي كادر القسم:
              </span>
              <strong style={{ color: '#F8FAFC' }}>{item.deptTeachersCount} معلم</strong>
            </div>
            <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>نسبة المعتمدين بالقسم:</span>
              <span style={{ color: '#10B981', fontWeight: 900, background: 'rgba(16,185,129,0.15)', padding: '0.15rem 0.6rem', borderRadius: '8px', fontSize: '0.9rem' }}>{item.certifiedRate}%</span>
            </div>
            {item.evaluation && (
              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>التقييم المؤسسي:</span>
                <span style={{ 
                  color: item.evaluation.color, 
                  fontWeight: 900, 
                  background: item.evaluation.bg, 
                  padding: '0.12rem 0.5rem', 
                  borderRadius: '6px', 
                  fontSize: '0.72rem',
                  border: `1px solid ${item.evaluation.border}`
                }}>
                  {item.evaluation.label}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* MEEE KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%)', padding: '1.5rem', borderRadius: '24px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 20px rgba(15,32,68,0.12)' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, marginBottom: '0.5rem' }}>{'إجمالي المعلمين الحاصلين على الشهاده'}</p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{meeeStats.certified}</h3>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', opacity: 0.8 }}>
            <Award size={14} /> MEEE {filterYear}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', borderBottom: '4px solid #F59E0B', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, marginBottom: '0.5rem' }}>{'تم التقديم'}</p>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#F59E0B', margin: 0 }}>{meeeStats.applied}</h3>
            </div>
            <div style={{ background: '#FEF3C715', padding: '0.8rem', borderRadius: '16px', color: '#F59E0B' }}>
              <Clock size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginTop: '0.75rem' }}>{'بانتظار النتيجة الرسمية'}</p>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', borderBottom: '4px solid #10B981', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, marginBottom: '0.5rem' }}>{'حصل على الشهادة'}</p>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10B981', margin: 0 }}>{meeeStats.certified}</h3>
            </div>
            <div style={{ background: '#D1FAE515', padding: '0.8rem', borderRadius: '16px', color: '#10B981' }}>
              <BadgeCheck size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, margin: 0 }}>{'معلم معتمد MIEE رسمياً'}</p>
            <button
              onClick={() => setIsCertifiedReportOpen(true)}
              style={{
                fontSize: '0.72rem', color: '#047857', background: '#D1FAE5',
                padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid #A7F3D0',
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}
            >
              <FileText size={12} /> تقرير PDF الرسمي ←
            </button>
          </div>
        </div>

        {/* Updated Percentage Card: Calculated strictly from total school teachers */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', borderBottom: '4px solid #8B5CF6', boxShadow: '0 8px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, marginBottom: '0.5rem' }}>{'نسبة الحصول على الشهادة'}</p>
              <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#8B5CF6', margin: 0 }}>{meeeStats.certRate}%</h3>
            </div>
            <div style={{ background: '#8B5CF615', padding: '0.8rem', borderRadius: '16px', color: '#8B5CF6' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800, marginTop: '0.75rem' }}>
            من إجمالي عدد المعلمين ({meeeStats.certified} من أصل {meeeStats.totalSchoolTeachers} معلماً)
          </p>
        </div>
      </div>

      {/* Modern & Professional Charts Dashboard for MIEE Certified Teachers */}
      {meeeStats.total > 0 && (
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Visual Row: Dedicated Bar Chart + School-wide Coverage Donut */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* 1. Dedicated Modern Bar Chart for MIEE Certified Teachers */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)', position: 'relative' }}>
              {/* Header with Mode Toggles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.65rem', borderRadius: '14px', background: '#ECFDF5', color: '#10B981', boxShadow: '0 2px 8px rgba(16,185,129,0.15)' }}>
                      <Award size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                        📊 إحصائيات الحاصلين على شهادة معلّم مايكروسوفت المبدع الخبير (MIEE) حسب الأقسام
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
                        توزيع المعلمين الحاصلين على الاعتماد مع نسب الإنجاز حسب الأقسام الأكاديمية
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button & View Mode Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsCertifiedReportOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      padding: '0.45rem 1rem', borderRadius: '12px',
                      border: '1.5px solid #10B981', background: '#ECFDF5',
                      color: '#065F46', fontWeight: 800, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FileText size={16} /> استخراج تقرير PDF رسمي
                  </button>

                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.3rem', borderRadius: '14px', gap: '0.3rem' }}>
                  <button
                    onClick={() => setChartMode('certified')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: chartMode === 'certified' ? '#10B981' : 'transparent',
                      color: chartMode === 'certified' ? '#fff' : '#64748B',
                      boxShadow: chartMode === 'certified' ? '0 2px 8px rgba(16,185,129,0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🟢 الحاصلين على الشهادة
                  </button>
                  <button
                    onClick={() => setChartMode('comparison')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: chartMode === 'comparison' ? '#0F2044' : 'transparent',
                      color: chartMode === 'comparison' ? '#fff' : '#64748B',
                      boxShadow: chartMode === 'comparison' ? '0 2px 8px rgba(15,32,68,0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⚖️ مقارنة مع كادر القسم
                  </button>
                  <button
                    onClick={() => setChartMode('all')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: chartMode === 'all' ? '#8B5CF6' : 'transparent',
                      color: chartMode === 'all' ? '#fff' : '#64748B',
                      boxShadow: chartMode === 'all' ? '0 2px 8px rgba(139,92,246,0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📋 شامل (حاصلين ومقدمين)
                  </button>
                </div>
              </div>
            </div>

              {/* Chart Canvas */}
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={meeeStats.deptData} margin={{ top: 25, right: 15, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="mieeCertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="mieeDeptStaffGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0F2044" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="mieeAppliedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#0F2044', fontSize: 11, fontWeight: 800 }} 
                    axisLine={{ stroke: '#E2E8F0' }} 
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip content={<MeeeCustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '0.85rem', fontWeight: 800 }}
                    iconType="circle"
                  />

                  {chartMode === 'certified' && (
                    <Bar 
                      dataKey="certified" 
                      name="عدد الحاصلين على الشهادة (MIEE)" 
                      fill="url(#mieeCertGrad)" 
                      radius={[10, 10, 0, 0]} 
                      maxBarSize={48}
                    >
                      <LabelList 
                        dataKey="certified" 
                        position="top" 
                        fill="#059669" 
                        fontWeight={900} 
                        fontSize={12} 
                        formatter={(v: any) => v > 0 ? `${v} 🎓` : ''} 
                      />
                    </Bar>
                  )}

                  {chartMode === 'comparison' && (
                    <>
                      <Bar 
                        dataKey="certified" 
                        name="الحاصلين على الشهادة" 
                        fill="url(#mieeCertGrad)" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={32}
                      >
                        <LabelList dataKey="certified" position="top" fill="#059669" fontWeight={900} fontSize={11} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar 
                        dataKey="deptTeachersCount" 
                        name="إجمالي كادر القسم" 
                        fill="url(#mieeDeptStaffGrad)" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={32}
                      >
                        <LabelList dataKey="deptTeachersCount" position="top" fill="#0F2044" fontWeight={900} fontSize={11} />
                      </Bar>
                    </>
                  )}

                  {chartMode === 'all' && (
                    <>
                      <Bar 
                        dataKey="certified" 
                        name="حصل على الشهادة (معتمد)" 
                        stackId="a" 
                        fill="url(#mieeCertGrad)" 
                        radius={[0, 0, 0, 0]} 
                        maxBarSize={42} 
                      />
                      <Bar 
                        dataKey="applied" 
                        name="تم التقديم (قيد المتابعة)" 
                        stackId="a" 
                        fill="url(#mieeAppliedGrad)" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={42} 
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>

              {/* Quick Summary Pill Bar under Chart */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>🏆 القسم المتصدر (الأعلى نسبة إنجاز):</span>
                  <strong style={{ color: '#0F2044', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    {topDept ? `${topDept.name} (${topDept.certifiedRate}% — ${topDept.certified} من أصل ${topDept.deptTeachersCount} معلماً)` : 'لا يوجد'}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>🎯 معدل النجاح للمتقدمين:</span>
                  <strong style={{ color: '#10B981', background: '#D1FAE5', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                    {meeeStats.applicantSuccessRate}% ({meeeStats.certified} من {meeeStats.total})
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Circular School-Wide Coverage Gauge & Goal */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.65rem', borderRadius: '14px', background: '#EDE9FE', color: '#8B5CF6' }}>
                    <Target size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                      مؤشر التغطية المدرسية (MIEE)
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, margin: '0.15rem 0 0 0' }}>
                      نسبة الحاصلين من إجمالي معلمي المدرسة
                    </p>
                  </div>
                </div>

                {/* Donut Chart with Center Percentage */}
                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={schoolCoverageDonutData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={65} 
                        outerRadius={95} 
                        paddingAngle={4} 
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        {schoolCoverageDonutData.map((entry: any, index: number) => (
                          <Cell key={`donut-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} معلماً`, '']} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered KPI inside Donut */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>{meeeStats.certRate}%</h2>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981', margin: '0.1rem 0 0 0' }}>تغطية الكادر</p>
                  </div>
                </div>

                {/* Donut Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#ECFDF5', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontWeight: 800, color: '#065F46' }}>حصل على الشهادة MIEE:</span>
                    </div>
                    <strong style={{ color: '#065F46', fontWeight: 900 }}>{meeeStats.certified} ({meeeStats.certRate}%)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#FEF3C7', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                      <span style={{ fontWeight: 800, color: '#92400E' }}>تم التقديم (قيد المتابعة):</span>
                    </div>
                    <strong style={{ color: '#92400E', fontWeight: 900 }}>{meeeStats.applied} ({meeeStats.totalSchoolTeachers > 0 ? Math.round((meeeStats.applied / meeeStats.totalSchoolTeachers) * 100) : 0}%)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: '#F8FAFC', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CBD5E1' }} />
                      <span style={{ fontWeight: 700, color: '#64748B' }}>باقي معلمي المدرسة:</span>
                    </div>
                    <strong style={{ color: '#64748B', fontWeight: 800 }}>{Math.max(0, meeeStats.totalSchoolTeachers - meeeStats.total)} معلماً</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '14px' }}>
                <Users size={18} color="#0F2044" />
                <span style={{ fontSize: '0.8rem', color: '#0F2044', fontWeight: 800 }}>
                  إجمالي معلمي المدرسة: {meeeStats.totalSchoolTeachers} معلماً
                </span>
              </div>
            </div>
          </div>

          {/* 3. Detailed Department Breakdown Progress Cards */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '12px', background: '#F8FAFC', color: '#0F2044' }}><BarChartIcon size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                    🏅 لوحة إنجاز الأقسام الفردية في شهادة MIEE
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, margin: '0.15rem 0 0 0' }}>
                    تحليل تفصيلي لنسبة الحاصلين والمتقدمين مقارنة بكادر كل قسم
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', background: '#F1F5F9', padding: '0.35rem 0.8rem', borderRadius: '10px' }}>
                عدد الأقسام: {meeeStats.deptData.length}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {meeeStats.deptData.map((dept: any) => {
                const isTop = topDept && (topDept.name === dept.name || (dept.certifiedRate === topDept.certifiedRate && dept.certifiedRate > 0));
                return (
                  <div 
                    key={dept.name} 
                    style={{ 
                      background: isTop ? 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)' : '#F8FAFC', 
                      padding: '1.25rem', 
                      borderRadius: '18px', 
                      border: isTop ? '2px solid #86EFAC' : '1px solid #E2E8F0', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2044' }}>{dept.name}</span>
                        {isTop && (
                          <span style={{ background: '#10B981', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                            ⭐ المتصدر ({dept.certifiedRate}%)
                          </span>
                        )}
                        {dept.evaluation && (
                          <span style={{
                            background: dept.evaluation.bg,
                            color: dept.evaluation.color,
                            border: `1px solid ${dept.evaluation.border}`,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '6px'
                          }}>
                            {dept.evaluation.label}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F2044', background: '#E2E8F0', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                        كادر القسم: {dept.deptTeachersCount}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, gap: '0.5rem' }}>
                      <span style={{ color: '#065F46', background: '#D1FAE5', padding: '0.25rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BadgeCheck size={14} /> حاصلين: {dept.certified} ({dept.certifiedRate}%)
                      </span>
                      <span style={{ color: '#92400E', background: '#FEF3C7', padding: '0.25rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> مقدمين: {dept.applied} ({dept.appliedRate}%)
                      </span>
                    </div>

                    {/* Dual Color Progress Bar */}
                    <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '5px', overflow: 'hidden', display: 'flex', position: 'relative' }}>
                      {dept.deptTeachersCount > 0 && dept.certified > 0 && (
                        <div 
                          style={{
                            width: `${(dept.certified / dept.deptTeachersCount) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #059669, #10B981)',
                            borderRadius: dept.applied === 0 ? '5px' : '5px 0 0 5px'
                          }} 
                          title={`حاصلين على الشهادة: ${dept.certifiedRate}%`} 
                        />
                      )}
                      {dept.deptTeachersCount > 0 && dept.applied > 0 && (
                        <div 
                          style={{
                            width: `${(dept.applied / dept.deptTeachersCount) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #D97706, #F59E0B)',
                            borderRadius: dept.certified === 0 ? '5px' : '0 5px 5px 0'
                          }} 
                          title={`مقدمين للشهادة: ${dept.appliedRate}%`} 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '700px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder={'\u0628\u062d\u062b \u0639\u0646 \u0645\u0639\u0644\u0645...'} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem', fontWeight: 600 }} 
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.8rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontWeight: 700, minWidth: '140px' }}>
            <option value="all">{'\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a'}</option>
            <option value={'\u062a\u0645 \u0627\u0644\u062a\u0642\u062f\u064a\u0645'}>{'\u062a\u0645 \u0627\u0644\u062a\u0642\u062f\u064a\u0645'}</option>
            <option value={'\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629'}>{'\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629'}</option>
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ padding: '0.8rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontWeight: 700, minWidth: '140px' }}>
            <option value="all">{'\u0643\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645'}</option>
            {(Array.from(new Set(meeeRecords.filter((r: MeeeRecord) => r.academicYear === filterYear).map((r: MeeeRecord) => resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)))) as string[]).filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {canEdit && (
          <button 
            onClick={onAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.5rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, border: 'none', color: '#fff', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
          >
            <Plus size={20} /> {'\u0625\u0636\u0627\u0641\u0629 \u0633\u062c\u0644 MEEE'}
          </button>
        )}
        <button 
            onClick={() => setIsCertifiedReportOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.8rem 1.4rem', borderRadius: '14px', cursor: 'pointer',
            fontWeight: 800, border: 'none', color: '#fff',
            background: 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)',
            boxShadow: '0 4px 14px rgba(2,132,199,0.3)', fontSize: '0.85rem'
          }}
        >
          <FileText size={18} /> {'تقرير معلّمي مايكروسوفت المبدعين الخبراء (MIEE PDF)'}
        </button>
        <button 
          onClick={() => setIsCertifiedReportOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.25rem', borderRadius: '14px', cursor: 'pointer', fontWeight: 700, border: '1px solid #E2E8F0', color: '#0F2044', background: '#fff' }}
        >
          <Printer size={18} /> {'طباعة التقرير (Portrait)'}
        </button>
      </div>

      {/* Data Table */}
      <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead style={{ background: '#0F2044', color: '#ffffff' }}>
            <tr style={{ background: '#0F2044', color: '#ffffff' }}>
              {['\u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0644\u0645', '\u0627\u0644\u0642\u0633\u0645', '\u0627\u0644\u062d\u0627\u0644\u0629', '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0642\u062f\u064a\u0645', '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062d\u0635\u0648\u0644', '\u0645\u0644\u0627\u062d\u0638\u0627\u062a', '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a'].map(h => (
                <th key={h} style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', color: '#ffffff', fontWeight: 900, background: '#0F2044' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                {meeeStats.total === 0 ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a MEEE \u0628\u0639\u062f. \u0627\u0636\u063a\u0637 "\u0625\u0636\u0627\u0641\u0629 \u0633\u062c\u0644 MEEE" \u0644\u0644\u0628\u062f\u0621.' : '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0641\u0644\u0627\u062a\u0631 \u0627\u0644\u0645\u062d\u062f\u062f\u0629.'}
              </td></tr>
            )}
            {filteredRecords.map((r: MeeeRecord) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="table-row">
                <td style={{ padding: '1.2rem 1rem', fontWeight: 900, color: '#0F2044' }}>{r.teacherName}</td>
                <td style={{ padding: '1.2rem 1rem', fontWeight: 700 }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</td>
                <td style={{ padding: '1.2rem 1rem' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                    padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, 
                    background: r.status === '\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629' ? '#D1FAE5' : '#FEF3C7', 
                    color: r.status === '\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629' ? '#065F46' : '#92400E' 
                  }}>
                    {r.status === '\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629' ? <BadgeCheck size={14} /> : <Clock size={14} />} {r.status}
                  </span>
                </td>
                <td style={{ padding: '1.2rem 1rem', fontWeight: 700, color: '#64748B' }}>{r.applicationDate}</td>
                <td style={{ padding: '1.2rem 1rem', fontWeight: 700, color: r.certificationDate ? '#10B981' : '#94A3B8' }}>{r.certificationDate || '-'}</td>
                <td style={{ padding: '1.2rem 1rem', fontSize: '0.85rem', color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '-'}</td>
                <td style={{ padding: '1.2rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {canEdit && <button onClick={() => onEdit(r)} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#1E40AF' }}><Edit2 size={16} /></button>}
                    {canDelete && <button onClick={() => onDelete(r.id)} style={{ padding: '0.5rem', borderRadius: '10px', border: '1px solid #FEE2E2', background: '#fff', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Certified Teachers PDF Report Modal */}
      <MeeeCertifiedReportModal
        isOpen={isCertifiedReportOpen}
        onClose={() => setIsCertifiedReportOpen(false)}
        meeeRecords={meeeRecords}
        meeeStats={meeeStats}
        teachers={teachers}
        departments={departments}
        filterYear={filterYear}
      />
    </div>
  );
}

function MeeeForm({ record, onSave, onClose }: { record: MeeeRecord | null; onSave: (r: MeeeRecord) => void; onClose: () => void }) {
  const [teachers, setTeachersLocal] = useState<any[]>([]);
  const [departments, setDepartmentsLocal] = useState<any[]>([]);
  const [useManualName, setUseManualName] = useState(!record?.teacherId || false);

  useEffect(() => {
    Promise.all([db.getTeachers(), db.getDepartments()])
      .then(([t, d]) => { setTeachersLocal(t); setDepartmentsLocal(d); });
  }, []);
  
  const MEEE_DEPT_OPTIONS = [
    'اللغة العربية', 'التربية الإسلامية', 'الحاسوب', 'الرياضيات',
    'اللغة الإنجليزية', 'STEM', 'مختبر الطاقة', 'مختبر التصنيع الرقمي',
    'مختبر الروبوت', 'الدراسات الاجتماعية', 'إداري', 'أخرى'
  ];

  const [fd, setFd] = useState<Partial<MeeeRecord>>(record || {
    id: `MEEE-${generateId().slice(0, 6)}`,
    teacherId: '',
    teacherName: '',
    department: '',
    status: 'تم التقديم',
    applicationDate: new Date().toISOString().split('T')[0],
    certificationDate: '',
    academicYear: '2026-2027',
    notes: '',
    updatedAt: new Date().toISOString()
  });

  const handleTeacherChange = (teacherId: string) => {
    if (teacherId === '__manual__') {
      setUseManualName(true);
      setFd({ ...fd, teacherId: '', teacherName: '', department: '' });
      return;
    }
    const teacher = teachers.find((t: any) => t.id === teacherId);
    if (teacher) {
      const deptName = getDeptName(teacher.departmentId, departments);
      setFd({ ...fd, teacherId, teacherName: teacher.nameAr, department: deptName });
      setUseManualName(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setFd({ 
      ...fd, 
      status: status as MeeeRecord['status'],
      certificationDate: status === 'حصل على الشهادة' ? (fd.certificationDate || new Date().toISOString().split('T')[0]) : ''
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#fff', borderRadius: '32px', width: '95%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={24} color="#fff" />
            <h3 style={{ fontWeight: 900, color: '#fff', margin: 0 }}>{record ? 'تعديل سجل MEEE' : 'إضافة سجل MEEE جديد'}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSave({ ...fd, updatedAt: new Date().toISOString() } as MeeeRecord); }} style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {/* Toggle: select from list OR enter manually */}
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <button type="button"
                onClick={() => setUseManualName(false)}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer',
                  background: !useManualName ? '#0F2044' : '#F1F5F9', color: !useManualName ? '#fff' : '#64748B' }}>
                اختر من قائمة المعلمين
              </button>
              <button type="button"
                onClick={() => { setUseManualName(true); setFd({ ...fd, teacherId: '', teacherName: '', department: '' }); }}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer',
                  background: useManualName ? '#0F2044' : '#F1F5F9', color: useManualName ? '#fff' : '#64748B' }}>
                إدخال اسم يدوي (إداري / أخرى)
              </button>
            </div>

            {!useManualName ? (
              <div style={{ gridColumn: 'span 2' }}>
                <FormLabel>اختر المعلم</FormLabel>
                <select 
                  value={fd.teacherId} 
                  onChange={e => handleTeacherChange(e.target.value)} 
                  className="form-input" 
                  required={!useManualName}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}
                >
                  <option value="">اختر المعلم...</option>
                  {teachers.filter((t: any) => t.status === 'active').map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nameAr} - {getDeptName(t.departmentId, departments)}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div style={{ gridColumn: 'span 2' }}>
                  <FormLabel>اسم الموظف / الإداري *</FormLabel>
                  <input
                    value={fd.teacherName}
                    onChange={e => setFd({ ...fd, teacherName: e.target.value })}
                    className="form-input"
                    required={useManualName}
                    placeholder="أدخل الاسم كاملاً..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <FormLabel>القسم *</FormLabel>
                  <select
                    value={fd.department}
                    onChange={e => setFd({ ...fd, department: e.target.value })}
                    required={useManualName}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}
                  >
                    <option value="">اختر القسم...</option>
                    {MEEE_DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}

            {fd.teacherName && (
              <div style={{ gridColumn: 'span 2', background: '#F0FDF4', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #BBF7D0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>
                  {fd.teacherName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#0F2044', fontSize: '1.05rem' }}>{fd.teacherName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{fd.department || 'القسم غير محدد'}</div>
                </div>
              </div>
            )}

            <div>
              <FormLabel>حالة الشهادة</FormLabel>
              <select 
                value={fd.status} 
                onChange={e => handleStatusChange(e.target.value)} 
                style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}
              >
                <option value={'تم التقديم'}>{'تم التقديم'}</option>
                <option value={'حصل على الشهادة'}>{'حصل على الشهادة'}</option>
              </select>
            </div>

            <div>
              <FormLabel>{'العام الدراسي'}</FormLabel>
              <select value={fd.academicYear} onChange={e => setFd({...fd, academicYear: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <FormLabel>{'\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0642\u062f\u064a\u0645'}</FormLabel>
              <input type="date" value={fd.applicationDate} onChange={e => setFd({...fd, applicationDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }} />
            </div>

            {fd.status === '\u062d\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629' && (
              <div>
                <FormLabel>{'\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0634\u0647\u0627\u062f\u0629'}</FormLabel>
                <input type="date" value={fd.certificationDate} onChange={e => setFd({...fd, certificationDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }} />
              </div>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <FormLabel>{'\u0645\u0644\u0627\u062d\u0638\u0627\u062a'}</FormLabel>
              <textarea value={fd.notes} onChange={e => setFd({...fd, notes: e.target.value})} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600, resize: 'vertical' }} placeholder={'\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629...'} />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.8rem 2rem', borderRadius: '14px', border: '1px solid #E2E8F0', fontWeight: 800, cursor: 'pointer', background: '#fff' }}>{'\u0625\u0644\u063a\u0627\u0621'}</button>
            <button type="submit" style={{ padding: '0.8rem 3rem', background: '#0F2044', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>{'\u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== COMPREHENSIVE PD REPORT ====================
function ComprehensivePDReport({ workshops, individualRecords, meeeRecords, teachers, departments, filterYear, dashboardStats, chartsData, meeeStats, onClose }: any) {
  const yearWorkshops = workshops.filter((w: any) => w.academicYear === filterYear);
  const yearIndividual = individualRecords.filter((r: any) => r.academicYear === filterYear);
  const yearMeee = meeeRecords.filter((r: any) => r.academicYear === filterYear);
  const certified = yearMeee.filter((r: any) => r.status === 'حصل على الشهادة');
  const applied = yearMeee.filter((r: any) => r.status === 'تم التقديم');

  // SVG Bar Chart helper
  const SvgBar = ({ data, colors }: { data: { name: string; value: number }[]; colors?: string[] }) => {
    if (!data.length) return <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>لا توجد بيانات كافية</p>;
    const svgW = 620, svgH = 180;
    const padL = 36, padR = 12, padT = 18, padB = 40;
    const cW = svgW - padL - padR, cH = svgH - padT - padB;
    const maxV = Math.max(...data.map(d => d.value), 1);
    const bW = Math.min((cW / data.length) * 0.55, 34);
    const gW = cW / data.length;
    const defColors = ['#0369A1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];
    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH} style={{ display: 'block', overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
        {[0,1,2,3,4].map(i => { const y = padT + cH - (i/4)*cH; return <line key={i} x1={padL} x2={padL+cW} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />; })}
        {data.map((d, i) => {
          const bH = (d.value / maxV) * cH;
          const cx = padL + i * gW + gW / 2;
          const bc = (colors || defColors)[i % (colors || defColors).length];
          const shortName = d.name.length > 10 ? d.name.slice(0, 9) + '…' : d.name;
          return (
            <g key={i}>
              <rect x={cx - bW/2} y={padT + cH - bH} width={bW} height={bH} fill={bc} rx={3} />
              {d.value > 0 && <text x={cx} y={padT + cH - bH - 4} textAnchor="middle" fontSize={8} fill={bc} fontWeight={800}>{d.value}</text>}
              <text x={cx} y={padT + cH + 13} textAnchor="middle" fontSize={7.5} fill="#64748B" fontWeight={700}>{shortName}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={padT+cH} stroke="#CBD5E1" />
        <line x1={padL} x2={padL+cW} y1={padT+cH} y2={padT+cH} stroke="#CBD5E1" />
      </svg>
    );
  };

  const PBar = ({ v }: { v: number }) => {
    const c = v >= 80 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          <div style={{ width: `${v}%`, height: '100%', background: c, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: c, width: '32px' }}>{v}%</span>
      </div>
    );
  };

  // Unique teachers from individual records
  const uniqueTeachers = [...new Set(yearIndividual.map((r: any) => r.traineeNameAr))];

  // Workshop category distribution
  const catMap: Record<string, number> = {};
  yearWorkshops.forEach((w: any) => { if (w.category) catMap[w.category] = (catMap[w.category] || 0) + 1; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Individual skill category distribution
  const skillMap: Record<string, number> = {};
  yearIndividual.forEach((r: any) => { if (r.skillCategory) skillMap[r.skillCategory] = (skillMap[r.skillCategory] || 0) + 1; });
  const skillData = Object.entries(skillMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Monthly distribution for workshops
  const MONTHS_AR = ['أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو'];
  const monthlyWorkshopData = MONTHS_AR.map(m => ({
    name: m,
    value: yearWorkshops.filter((w: any) => (w.month || '').includes(m.slice(0, 4))).length
  })).filter(d => d.value > 0);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = document.getElementById('comprehensive-pd-report-container');
      if (!el) {
        window.print();
        return;
      }
      if (document.fonts) await document.fonts.ready;
      const canvas = await html2canvas(el, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1080,
        onclone: async (clonedDoc) => {
          if ((clonedDoc as any).fonts) await (clonedDoc as any).fonts.ready;
          const clonedEl = clonedDoc.getElementById('comprehensive-pd-report-container');
          if (clonedEl) {
            clonedEl.style.width = '1040px';
            clonedEl.style.maxWidth = '1040px';
            clonedEl.style.margin = '0 auto';
            clonedEl.style.boxShadow = 'none';
          }
        }
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const imgWidth = 194;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 8;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 16);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 16);
      }
      pdf.save(`التقرير_الشامل_السنوي_للتطوير_المهني_${filterYear}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl' }}>
      {/* Screen Controls */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={20} color="#0F2044" />
          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0F2044' }}>التقرير الشامل السنوي — التطوير المهني والتمكين الرقمي {filterYear}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: isExportingPdf ? 'not-allowed' : 'pointer',
              opacity: isExportingPdf ? 0.7 : 1
            }}
          >
            <Download size={16} /> {isExportingPdf ? 'جاري التصدير...' : 'حفظ PDF عالي الدقة (A4)'}
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F2044', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
            <Printer size={16} /> طباعة ورقية
          </button>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
            <X size={16} /> رجوع
          </button>
        </div>
      </div>

      {/* ===== PRINTABLE REPORT ===== */}
      <div id="comprehensive-pd-report-container" className="printable-report" style={{ border: '1px solid #CBD5E1', padding: '1.5rem', background: '#ffffff', minHeight: '1000px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <img src="/ministry-logo.png" alt="وزارة التعليم والتعليم العالي" style={{ height: '85px', maxWidth: '175px', objectFit: 'contain' }} />
          <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '85px', maxWidth: '175px', objectFit: 'contain' }} />
        </div>
        <div style={{ background: '#0F2044', borderRadius: '10px', padding: '0.75rem 1.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', textAlign: 'center', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', margin: 0, textAlign: 'center' }}>التقرير الشامل السنوي — التطوير المهني والتمكين الرقمي</h1>
          <span style={{ color: '#BAE6FD' }}>|</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textAlign: 'center' }}>العام الأكاديمي {filterYear}</span>
        </div>

        {/* ─── KPI Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.65rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'ورش العمل الجماعية', value: dashboardStats.total, color: '#0F2044' },
            { label: 'جلسات التدريب الفردي', value: dashboardStats.totalInd, color: '#0369A1' },
            { label: 'معلمون مستفيدون (فردي)', value: dashboardStats.uniqueTeachersInd, color: '#10B981' },
            { label: 'ساعات التدريب الجماعي', value: dashboardStats.totalHours, color: '#F59E0B' },
            { label: 'ساعات الدعم الفردي', value: dashboardStats.totalIndHours, color: '#8B5CF6' },
            { label: 'حاصلون على MEEE', value: certified.length, color: '#EC4899' },
          ].map(({ label, value, color }, i) => (
            <div key={i} style={{ 
              border: '1px solid #E2E8F0', borderTop: `4px solid ${color}`, borderRadius: '10px', 
              padding: '0.65rem 0.4rem', textAlign: 'center', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '65px', boxSizing: 'border-box',
              printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' 
            }}>
              <p style={{ fontSize: '0.62rem', color: '#64748B', margin: 0, fontWeight: 800, textAlign: 'center', lineHeight: 1.25 }}>{label}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color, margin: '0.2rem 0 0', textAlign: 'center' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ─── SECTION 1: Workshops Distribution Chart ─── */}
        {catData.length > 0 && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.75rem', background: '#F8FAFC' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.75rem', borderBottom: '2px solid #0F2044', paddingBottom: '0.4rem' }}>📊 توزيع ورش العمل حسب التصنيف</h4>
            <SvgBar data={catData} />
          </div>
        )}

        {/* ─── SECTION 2: Individual Skills Chart ─── */}
        {skillData.length > 0 && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.75rem', background: '#F8FAFC' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.75rem', borderBottom: '2px solid #0F2044', paddingBottom: '0.4rem' }}>💡 توزيع جلسات التدريب الفردي حسب نوع المهارة</h4>
            <SvgBar data={skillData} colors={['#10B981','#0369A1','#F59E0B','#EF4444','#8B5CF6','#EC4899']} />
          </div>
        )}

        {/* ─── SECTION 3: Workshops Table ─── */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.85rem' }}>
            ١. سجل ورش العمل الجماعية ({yearWorkshops.length} ورشة)
          </h4>
          {yearWorkshops.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '1rem' }}>لا توجد ورش مسجلة لهذا العام</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  {['#','عنوان الورشة','التاريخ','المكان','المدرب','الفئة المستهدفة','التصنيف','الساعات','الحالة'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 0.7rem', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearWorkshops.map((w: any, i: number) => (
                  <tr key={w.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2044', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{w.titleAr || w.nameAr || '-'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{w.date || w.month || '-'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#0284C7', fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word' }}>{w.venue || w.location || '-'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{w.facilitatorName || w.trainer || '-'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {w.targetAudience || w.targetGroup || '-'}
                      {w.targetAudience === 'الطلاب' && w.targetClasses ? ` (${w.targetClasses})` : ''}
                    </td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{w.category || '-'}</td>
                    <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800 }}>{w.hours || '-'}</td>
                    <td style={{ padding: '0.35rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <span style={{
                        background: w.status === 'موثق' ? '#D1FAE5' : w.status === 'تم التنفيذ' ? '#DBEAFE' : '#FEF3C7',
                        color: w.status === 'موثق' ? '#065F46' : w.status === 'تم التنفيذ' ? '#1E40AF' : '#92400E',
                        padding: '0.18rem 0.55rem', borderRadius: '5px', fontSize: '0.66rem', fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2,
                        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
                      }}>{w.status || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  <td colSpan={7} style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center', fontSize: '0.82rem' }}>الإجمالي</td>
                  <td style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center' }}>{dashboardStats.totalHours} ساعة</td>
                  <td style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center' }}>{yearWorkshops.length} ورشة</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ─── SECTION 4: Individual Training Table ─── */}
        <div style={{ marginBottom: '2rem', pageBreakBefore: 'always' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.85rem' }}>
            ٢. سجل جلسات التدريب والتمكين الفردي ({yearIndividual.length} جلسة)
          </h4>
          {yearIndividual.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '1rem' }}>لا توجد جلسات فردية مسجلة لهذا العام</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  {['#','اسم المعلم','القسم','المهارة المقدمة','التصنيف','التاريخ','المدة','طريقة الدعم','الحالة'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 0.7rem', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearIndividual.map((r: any, i: number) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2044', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{r.traineeNameAr || '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.department || '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{r.skillProvided || '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.skillCategory || '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.trainingDate || '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 700 }}>{r.durationMinutes ? `${r.durationMinutes} د` : '-'}</td>
                    <td style={{ padding: '0.5rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.deliveryMethod || r.trainingType || '-'}</td>
                    <td style={{ padding: '0.35rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <span style={{
                        background: r.signatureStatus === 'موثق' ? '#D1FAE5' : '#FEF3C7',
                        color: r.signatureStatus === 'موثق' ? '#065F46' : '#92400E',
                        padding: '0.18rem 0.55rem', borderRadius: '5px', fontSize: '0.66rem', fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2,
                        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact'
                      }}>{r.signatureStatus || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  <td colSpan={6} style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center', fontSize: '0.82rem' }}>الإجمالي</td>
                  <td style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center' }}>{dashboardStats.totalIndHours * 60} د</td>
                  <td colSpan={2} style={{ padding: '0.65rem', border: '1px solid #1e3a5f', fontWeight: 900, textAlign: 'center' }}>{yearIndividual.length} جلسة — {dashboardStats.uniqueTeachersInd} معلم</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ─── SECTION 5: MEEE Report ─── */}
        {yearMeee.length > 0 && (
          <div style={{ marginBottom: '2rem', pageBreakBefore: 'always' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', borderBottom: '2.5px solid #0F2044', paddingBottom: '0.4rem', marginBottom: '0.85rem' }}>
              ٣. تقرير شهادة MEEE — Microsoft Educator Expert Exchange
            </h4>
            {/* MEEE KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'إجمالي المعلمين الحاصلين على الشهادة', value: certified.length, color: '#0F2044' },
                { label: 'تم التقديم', value: applied.length, color: '#F59E0B' },
                { label: 'حصل على الشهادة', value: certified.length, color: '#10B981' },
                { label: 'نسبة الحصول', value: `${yearMeee.length > 0 ? Math.round(certified.length / yearMeee.length * 100) : 0}%`, color: '#8B5CF6' },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ border: '1px solid #E2E8F0', borderTop: `4px solid ${color}`, borderRadius: '10px', padding: '0.85rem', textAlign: 'center', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                  <p style={{ fontSize: '0.68rem', color: '#64748B', margin: 0, fontWeight: 800 }}>{label}</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 900, color, margin: '0.25rem 0 0' }}>{value}</p>
                </div>
              ))}
            </div>
            {/* MEEE Dept Table */}
            {meeeStats?.deptData?.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                    {['القسم','إجمالي الكادر','تم التقديم','نسبة التقديم','حصل على الشهادة','نسبة الاعتماد بالقسم','التقييم المؤسسي','مؤشر الأداء'].map(h => (
                      <th key={h} style={{ padding: '0.65rem 0.7rem', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meeeStats.deptData.map((dept: any, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', fontWeight: 700, textAlign: 'right' }}>{dept.name}</td>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 700 }}>{dept.deptTeachersCount}</td>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#D97706', fontWeight: 800 }}>{dept.applied}</td>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#D97706', fontWeight: 800 }}>{dept.appliedRate}%</td>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#059669', fontWeight: 800 }}>{dept.certified}</td>
                      <td style={{ padding: '0.55rem 0.7rem', border: '1px solid #E2E8F0', textAlign: 'center', color: dept.certifiedRate >= 70 ? '#059669' : dept.certifiedRate >= 50 ? '#0369A1' : '#7C3AED', fontWeight: 800 }}>{dept.certifiedRate}%</td>
                      <td style={{ padding: '0.4rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          background: dept.evaluation?.bg || '#F1F5F9',
                          color: dept.evaluation?.color || '#64748B',
                          border: `1px solid ${dept.evaluation?.border || '#CBD5E1'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap'
                        }}>
                          {dept.evaluation?.label || `${dept.certifiedRate}%`}
                        </span>
                      </td>
                      <td style={{ padding: '0.45rem 0.7rem', border: '1px solid #E2E8F0' }}><PBar v={dept.certifiedRate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Certified Teachers */}
            {certified.length > 0 && (
              <>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#065F46', margin: '1.25rem 0 0.6rem', borderBottom: '1.5px solid #10B981', paddingBottom: '0.3rem' }}>✅ المعلمون الحاصلون على شهادة MEEE ({certified.length})</h5>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      {['#','اسم المعلم','القسم','تاريخ التقديم','تاريخ الحصول','ملاحظات'].map(h => (
                        <th key={h} style={{ padding: '0.6rem', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 700, color: '#fff' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {certified.map((r: any, i: number) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#F0FDF4' : '#fff' }}>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800 }}>{i + 1}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', fontWeight: 800, color: '#0F2044' }}>{r.teacherName}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>{r.applicationDate}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', color: '#10B981', fontWeight: 800 }}>{r.certificationDate || '-'}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.7rem', color: '#64748B' }}>{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {/* Applied Teachers */}
            {applied.length > 0 && (
              <>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#92400E', margin: '1.25rem 0 0.6rem', borderBottom: '1.5px solid #F59E0B', paddingBottom: '0.3rem' }}>⏳ المعلمون المتقدمون لشهادة MEEE ({applied.length})</h5>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                      {['#','اسم المعلم','القسم','تاريخ التقديم','ملاحظات'].map(h => (
                        <th key={h} style={{ padding: '0.6rem', border: '1px solid #1e3a5f', textAlign: 'center', fontWeight: 700, color: '#fff' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applied.map((r: any, i: number) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#FFFBEB' : '#fff' }}>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800 }}>{i + 1}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', fontWeight: 800, color: '#0F2044' }}>{r.teacherName}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>{r.applicationDate}</td>
                        <td style={{ padding: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.7rem', color: '#64748B' }}>{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}



        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ textAlign: 'center', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.80rem', width: '100%', textAlign: 'center' }}>منسق المشاريع الإلكترونية</p>
            <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
            <p style={{ fontSize: '0.80rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>أحمد عادل طبيشات</p>
          </div>
          <div style={{ textAlign: 'center', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.80rem', width: '100%', textAlign: 'center' }}>النائب الأكاديمي</p>
            <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
            <p style={{ fontSize: '0.80rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>د. راني التوم</p>
          </div>
          <div style={{ textAlign: 'center', width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontWeight: 800, borderBottom: '1px solid #000', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.80rem', width: '100%', textAlign: 'center' }}>مدير المدرسة</p>
            <img src="/principal-signature.png" alt="توقيع مدير المدرسة" style={{ height: '36px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
            <p style={{ fontSize: '0.80rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>محمد علي مندني العمادي</p>
          </div>
        </div>
      </div>
    </div>
  );
}
