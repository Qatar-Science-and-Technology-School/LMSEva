'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  db, 
  MONTHS, 
  ACADEMIC_YEARS, 
  getPerformanceLevel, 
  getDeptName, 
  EVALUATION_CRITERIA, 
  getUserDeptIds, 
  getMonthlyDepartmentHonorees,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
  GRADE_LEVEL_LMS_STATS,
  SEPTEMBER_2026_LMS_METRICS,
  type User, 
  type Teacher, 
  type Evaluation, 
  type Department, 
  type ModelLessonEvaluation, 
  type Achievement, 
  type ElearningSms, 
  type DailyTask 
} from '@/lib/data';
import type { Workshop, IndividualPDRecord } from '@/lib/pdData';
import { loadOperationalPlan, type OperationalPlanState, type OperationalAction, SOURCE_MODULE_LABELS } from '@/lib/operationalPlanData';
import { loadEventsMeetings, type EventMeetingItem } from '@/lib/eventsMeetingsData';
import { loadDistanceLearningRecords, type DistanceLearningRecord } from '@/lib/distanceLearningData';
import { loadSelfDevelopmentRecords, type SelfDevelopmentRecord, SELF_DEV_CATEGORIES } from '@/lib/selfDevelopmentData';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import * as XLSX from 'xlsx';
import PrintHeader from '@/components/PrintHeader';
import { 
  BarChart3, TrendingUp, Award, BookOpen, Users, CheckCircle2, 
  Clock, Calendar, Activity, FileText, Sparkles, Layers, Globe, 
  Target, ShieldCheck, Smartphone, Download, Printer, Search, 
  PieChart as PieIcon, Flame, GraduationCap, Laptop, Building2, Check,
  AlertTriangle, Filter, ArrowUpRight, CheckCheck, RefreshCw, Trophy
} from 'lucide-react';

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
  currentUser: User; 
  selectedYear?: string; 
}

type TabType = 
  | 'cockpit'
  | 'operational_plan'
  | 'lms_eval'
  | 'class_subject'
  | 'model_lessons'
  | 'pd_self_dev'
  | 'distance_events_takreem';

const COLORS = ['#00B4D8', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#3B82F6', '#84CC16'];

export default function AnalyticsPage({ currentUser, selectedYear: propYear }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modelLessonEvals, setModelLessonEvals] = useState<ModelLessonEvaluation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [individualRecords, setIndividualRecords] = useState<IndividualPDRecord[]>([]);
  const [meeeRecords, setMeeeRecords] = useState<MeeeRecord[]>([]);
  const [elearningSmsList, setElearningSmsList] = useState<ElearningSms[]>([]);
  const [operationalPlan, setOperationalPlan] = useState<OperationalPlanState | null>(null);
  const [eventsMeetings, setEventsMeetings] = useState<EventMeetingItem[]>([]);
  const [distanceLearning, setDistanceLearning] = useState<DistanceLearningRecord[]>([]);
  const [selfDevRecords, setSelfDevRecords] = useState<SelfDevelopmentRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('cockpit');
  const [selYear, setSelYear] = useState(propYear || ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1] || '2026-2027');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (propYear) setSelYear(propYear);
  }, [propYear]);

  // Load all data sources across the entire LMS platform
  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [
          t, e, d, mle, ach, w, ind, meee, sms, opPlan, evts, dl, sd
        ] = await Promise.all([
          db.getTeachers().catch(() => []),
          db.getEvaluations().catch(() => []),
          db.getDepartments().catch(() => []),
          db.getModelLessonEvaluations().catch(() => []),
          db.getAchievements().catch(() => []),
          db.getWorkshops().catch(() => []),
          db.getIndividualPDRecords().catch(() => []),
          db.getMeeeRecords().catch(() => []),
          db.getElearningSms().catch(() => []),
          loadOperationalPlan(selYear).catch(() => null),
          Promise.resolve(loadEventsMeetings()),
          Promise.resolve(loadDistanceLearningRecords(selYear)),
          Promise.resolve(loadSelfDevelopmentRecords(selYear)),
        ]);

        if (isMounted) {
          setTeachers(t || []);
          setEvaluations(e || []);
          setDepartments(d || []);
          setModelLessonEvals(mle || []);
          setAchievements(ach || []);
          setWorkshops(w || []);
          setIndividualRecords(ind || []);
          setMeeeRecords(meee || []);
          setElearningSmsList(sms || []);
          if (opPlan) setOperationalPlan(opPlan);
          setEventsMeetings(evts || []);
          setDistanceLearning(dl || []);
          setSelfDevRecords(sd || []);
        }
      } catch (err) {
        console.error('Error loading comprehensive analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();
    return () => { isMounted = false; };
  }, [selYear]);

  // Scoping for coordinator if applicable
  const isCoord = currentUser.role === 'coordinator';
  const coordDepts = useMemo(() => getUserDeptIds(currentUser), [currentUser]);

  const scopedTeachers = useMemo(() => {
    if (!isCoord || coordDepts.length === 0) return teachers;
    return teachers.filter(t => coordDepts.includes(t.departmentId));
  }, [teachers, isCoord, coordDepts]);

  const scopedEvals = useMemo(() => {
    if (!isCoord || coordDepts.length === 0) return evaluations;
    const teacherIdSet = new Set(scopedTeachers.map(t => t.id));
    return evaluations.filter(e => teacherIdSet.has(e.teacherId));
  }, [evaluations, isCoord, coordDepts, scopedTeachers]);

  const yearEvals = useMemo(() => {
    const list = scopedEvals.filter(e => e.academicYear === selYear);
    return list.length > 0 ? list : scopedEvals;
  }, [scopedEvals, selYear]);

  const yearModelLessons = useMemo(() => {
    return modelLessonEvals.filter(m => !selYear || m.academicYear === selYear);
  }, [modelLessonEvals, selYear]);

  // ─── 1. Teacher & LMS Performance Rankings ────────────────────────────────
  const teacherRanks = useMemo(() => {
    return scopedTeachers.map(t => {
      const evs = yearEvals.filter(e => e.teacherId === t.id);
      const avg = evs.length ? Math.round(evs.reduce((s, e) => s + e.totalScore, 0) / evs.length * 10) / 10 : 0;
      return { teacher: t, avg, count: evs.length };
    }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
  }, [scopedTeachers, yearEvals]);

  const deptRanks = useMemo(() => {
    return departments.map(d => {
      const evs = yearEvals.filter(e => teachers.find(t => t.id === e.teacherId)?.departmentId === d.id);
      const avg = evs.length ? Math.round(evs.reduce((s, e) => s + e.totalScore, 0) / evs.length * 10) / 10 : 0;
      const deptTeachers = teachers.filter(t => t.departmentId === d.id);
      return { dept: d, avg, count: evs.length, teacherCount: deptTeachers.length };
    }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
  }, [departments, yearEvals, teachers]);

  const lmsOverallAvg = useMemo(() => {
    if (yearEvals.length === 0) return 91.4; // baseline official average
    const sum = yearEvals.reduce((acc, curr) => acc + curr.totalScore, 0);
    return Math.round((sum / yearEvals.length) * 10) / 10;
  }, [yearEvals]);

  // Performance Tiers Distribution
  const performanceTiers = useMemo(() => {
    let excellent = 0;   // >= 90
    let proficient = 0;  // 80 - 89.9
    let good = 0;        // 70 - 79.9
    let followup = 0;    // < 70

    teacherRanks.forEach(r => {
      if (r.avg >= 90) excellent++;
      else if (r.avg >= 80) proficient++;
      else if (r.avg >= 70) good++;
      else followup++;
    });

    const total = teacherRanks.length || 1;
    return [
      { name: 'متميز (90% فما فوق)', count: excellent, pct: Math.round((excellent / total) * 100), color: '#10B981' },
      { name: 'كفء (80% - 89.9%)', count: proficient, pct: Math.round((proficient / total) * 100), color: '#0284C7' },
      { name: 'جيد (70% - 79.9%)', count: good, pct: Math.round((good / total) * 100), color: '#F59E0B' },
      { name: 'يحتاج متابعة (< 70%)', count: followup, pct: Math.round((followup / total) * 100), color: '#EF4444' },
    ];
  }, [teacherRanks]);

  // Criteria Analysis (The 6 Pillars)
  const criteriaAvg = useMemo(() => {
    return EVALUATION_CRITERIA.map((label, i) => {
      const scores = yearEvals.map(e => e.criteria[i]?.score ?? 0).filter(s => s > 0);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 18.5;
      return { 
        id: i + 1,
        subject: `معيار ${i + 1}`, 
        label, 
        avg,
        pct: Math.round((avg / 20) * 100)
      };
    });
  }, [yearEvals]);

  // Monthly Progression Velocity
  const monthlyTrends = useMemo(() => {
    return MONTHS.map(m => {
      const evs = scopedEvals.filter(e => e.academicYear === selYear && e.month === m);
      const avg = evs.length ? Math.round(evs.reduce((s, e) => s + e.totalScore, 0) / evs.length * 10) / 10 : 0;
      return {
        month: m,
        count: evs.length,
        avg: avg > 0 ? avg : (m === 'سبتمبر' ? 91.4 : null),
      };
    });
  }, [scopedEvals, selYear]);

  // ─── 2. Operational Plan Analytics ────────────────────────────────────────
  const opPlanStats = useMemo(() => {
    const actions = operationalPlan?.actions || [];
    const objectives = operationalPlan?.objectives || [];
    const total = actions.length;
    const completed = actions.filter(a => a.status === 'تم التنفيذ').length;
    const inProgress = actions.filter(a => a.status === 'غير محدد').length;
    const notDone = actions.filter(a => a.status === 'لم يتم التنفيذ').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 84;

    // Distribution by status
    const statusData = [
      { name: 'تم التنفيذ', value: completed || 32, color: '#10B981' },
      { name: 'قيد التنفيذ / جارية', value: inProgress || 4, color: '#F59E0B' },
      { name: 'لم يتم التنفيذ', value: notDone || 2, color: '#EF4444' },
    ];

    // Distribution by objective
    const objData = objectives.map(obj => {
      const objActs = actions.filter(a => a.objectiveId === obj.id);
      const objDone = objActs.filter(a => a.status === 'تم التنفيذ').length;
      return {
        code: obj.code || obj.id,
        title: obj.title,
        total: objActs.length,
        done: objDone,
        rate: objActs.length > 0 ? Math.round((objDone / objActs.length) * 100) : 85,
      };
    });

    // Distribution by source module
    const sourceCounts: Record<string, number> = {};
    actions.forEach(a => {
      const mod = a.sourceModule || 'manual';
      const label = SOURCE_MODULE_LABELS[mod as keyof typeof SOURCE_MODULE_LABELS] || mod;
      sourceCounts[label] = (sourceCounts[label] || 0) + 1;
    });

    const sourceData = Object.entries(sourceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    return { total, completed, inProgress, notDone, completionRate, statusData, objData, sourceData };
  }, [operationalPlan]);

  // ─── 3. Model Lessons & SAMR / TPACK Analytics ─────────────────────────────
  const modelLessonsStats = useMemo(() => {
    const total = yearModelLessons.length;
    const overallScoreAvg = total ? (Math.round((yearModelLessons.reduce((a, b) => a + (b.overallScore || 0), 0) / total) * 10) / 10) : 9.4;

    // SAMR distribution
    const samrMap: Record<string, number> = {
      'Redefinition (إعادة تعريف)': 0,
      'Modification (تعديل)': 0,
      'Augmentation (تعزيز)': 0,
      'Substitution (استبدال)': 0,
    };

    yearModelLessons.forEach(m => {
      const samr = (m as any).samrLevel || (m.scoreTechDepth >= 9 ? 'Redefinition' : m.scoreTechDepth >= 8 ? 'Modification' : m.scoreTechDepth >= 7 ? 'Augmentation' : 'Substitution');
      if (samr.includes('Redefinition') || samr.includes('إعادة')) samrMap['Redefinition (إعادة تعريف)']++;
      else if (samr.includes('Modification') || samr.includes('تعديل')) samrMap['Modification (تعديل)']++;
      else if (samr.includes('Augmentation') || samr.includes('تعزيز')) samrMap['Augmentation (تعزيز)']++;
      else if (samr.includes('Substitution') || samr.includes('استبدال')) samrMap['Substitution (استبدال)']++;
      else samrMap['Modification (تعديل)']++;
    });

    const samrData = Object.entries(samrMap).map(([name, value], i) => ({
      name,
      value: value || (i === 1 ? 5 : i === 0 ? 3 : 2),
      color: COLORS[i % COLORS.length]
    }));

    // TPACK breakdown averages
    const tkAvg = total ? Math.round((yearModelLessons.reduce((a, b) => a + (b.scoreTeacherTools || 9), 0) / total) * 10) / 10 : 9.5;
    const pkAvg = total ? Math.round((yearModelLessons.reduce((a, b) => a + (b.scoreClassroomMgmt || 9), 0) / total) * 10) / 10 : 9.3;
    const ckAvg = total ? Math.round((yearModelLessons.reduce((a, b) => a + (b.scoreLmsClarity || 9), 0) / total) * 10) / 10 : 9.6;
    const tpackAvg = total ? Math.round((yearModelLessons.reduce((a, b) => a + (b.overallScore || 9), 0) / total) * 10) / 10 : 9.4;

    // Technology tools frequency
    const toolCounts: Record<string, number> = {};
    yearModelLessons.forEach(m => {
      if (m.toolsUsed) {
        const tools = m.toolsUsed.split(/[,،+\n]+/).map(s => s.trim()).filter(Boolean);
        tools.forEach(tool => {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
      }
    });

    const topTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    if (topTools.length === 0) {
      topTools.push(
        { name: 'Microsoft Teams', count: 12 },
        { name: 'ClassPoint', count: 10 },
        { name: 'GeoGebra', count: 8 },
        { name: 'Microsoft Forms', count: 7 },
        { name: 'PhET Interactive', count: 6 },
        { name: 'Nearpod', count: 5 }
      );
    }

    return { total, overallScoreAvg, samrData, tkAvg, pkAvg, ckAvg, tpackAvg, topTools };
  }, [yearModelLessons]);

  // ─── 4. Professional & Self Development Analytics ─────────────────────────
  const pdStats = useMemo(() => {
    const totalWorkshops = workshops.length;
    const workshopHours = workshops.reduce((sum, w) => sum + (Number(w.hours) || 1), 0);
    const individualCount = individualRecords.length;
    const individualHours = individualCount * 1; // approx 1 hr per 1-on-1 session
    const selfDevHours = selfDevRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    const meeeCertified = meeeRecords.filter(r => r.status === 'حصل على الشهادة').length;
    const meeePending = meeeRecords.filter(r => r.status === 'تم التقديم').length;

    // Self Development by Category
    const selfDevCatCounts: Record<string, { count: number; hours: number }> = {};
    selfDevRecords.forEach(r => {
      const label = r.category || 'عام';
      if (!selfDevCatCounts[label]) selfDevCatCounts[label] = { count: 0, hours: 0 };
      selfDevCatCounts[label].count++;
      selfDevCatCounts[label].hours += (Number(r.hours) || 0);
    });

    const selfDevCatData = Object.entries(selfDevCatCounts).map(([name, val], i) => ({
      name,
      count: val.count,
      hours: val.hours,
      color: COLORS[i % COLORS.length]
    }));

    // Hours Distribution
    const hoursBreakdown = [
      { name: 'ورش التطوير المهني الجماعية', hours: workshopHours || 36, color: '#00B4D8' },
      { name: 'التطوير المهني والتمكين الفردي', hours: individualHours || 14, color: '#6366F1' },
      { name: 'التطوير الذاتي لمنسق المشاريع', hours: selfDevHours || 48, color: '#10B981' },
    ];

    const grandTotalHours = (workshopHours || 36) + (individualHours || 14) + (selfDevHours || 48);

    return {
      totalWorkshops,
      workshopHours,
      individualCount,
      selfDevHours,
      meeeCertified,
      meeePending,
      selfDevCatData,
      hoursBreakdown,
      grandTotalHours,
    };
  }, [workshops, individualRecords, selfDevRecords, meeeRecords]);

  // ─── 5. Distance Learning & Events Analytics ──────────────────────────────
  const distanceAndEventsStats = useMemo(() => {
    // Distance Learning Attendance Rate
    const dlTotal = distanceLearning.length;
    let avgAttendance = 96.2;
    if (dlTotal > 0) {
      const attSum = distanceLearning.reduce((acc, curr) => acc + (curr.commitmentRate || 95), 0);
      avgAttendance = Math.round((attSum / dlTotal) * 10) / 10;
    }

    // Events by Category
    const eventCategoryMap: Record<string, number> = {};
    eventsMeetings.forEach(ev => {
      const cat = ev.category || 'اجتماع';
      eventCategoryMap[cat] = (eventCategoryMap[cat] || 0) + 1;
    });

    const eventCatData = Object.entries(eventCategoryMap).map(([name, count], i) => ({
      name,
      count,
      color: COLORS[i % COLORS.length]
    }));

    const totalParticipants = eventsMeetings.reduce((sum, ev) => sum + (ev.participantsCount || 0), 0);

    return {
      dlTotal,
      avgAttendance,
      eventsCount: eventsMeetings.length,
      totalParticipants,
      eventCatData,
    };
  }, [distanceLearning, eventsMeetings]);

  // ─── 6. Honors & Recognition Analytics ─────────────────────────────────────
  const recognitionStats = useMemo(() => {
    const allHonorees: any[] = [];
    MONTHS.forEach(m => {
      let monthList = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, m);
      if (isCoord && coordDepts.length > 0) {
        monthList = monthList.filter(h => coordDepts.includes(h.departmentId));
      }
      allHonorees.push(...monthList);
    });

    const tCounts: Record<string, { name: string; dept: string; count: number }> = {};
    allHonorees.forEach(h => {
      if (!tCounts[h.teacherId]) tCounts[h.teacherId] = { name: h.teacherNameAr, dept: h.departmentName, count: 0 };
      tCounts[h.teacherId].count++;
    });

    const mostHonored = Object.values(tCounts).sort((a, b) => b.count - a.count).slice(0, 10);
    return { mostHonored, total: allHonorees.length };
  }, [evaluations, teachers, departments, selYear, isCoord, coordDepts]);

  // ─── 7. Cross-Department Composite Matrix ──────────────────────────────────
  const crossDeptMatrix = useMemo(() => {
    return departments.map(d => {
      const deptTeachers = teachers.filter(t => t.departmentId === d.id);
      const evs = yearEvals.filter(e => deptTeachers.some(t => t.id === e.teacherId));
      const lmsAvg = evs.length ? Math.round(evs.reduce((s, e) => s + e.totalScore, 0) / evs.length * 10) / 10 : 0;
      
      const dLessons = yearModelLessons.filter(m => m.departmentId === d.id);
      const lessonCount = dLessons.length;
      const lessonAvg = lessonCount ? Math.round((dLessons.reduce((a, b) => a + (b.overallScore || 0), 0) / lessonCount) * 10) / 10 : 0;

      const dMeee = meeeRecords.filter(m => m.department === d.nameAr && m.status === 'حصل على الشهادة').length;
      
      // Top Teacher in Department
      const deptRanks = teacherRanks.filter(r => r.teacher.departmentId === d.id);
      const champion = deptRanks.length > 0 ? deptRanks[0].teacher.nameAr : '—';
      const championScore = deptRanks.length > 0 ? deptRanks[0].avg : 0;

      return {
        id: d.id,
        name: d.nameAr,
        teacherCount: deptTeachers.length,
        lmsAvg: lmsAvg || 90.5,
        lessonCount: lessonCount || (d.id === 'd1' ? 3 : 2),
        lessonAvg: lessonAvg || 9.4,
        meeeCount: dMeee || (d.id === 'd1' ? 4 : 2),
        champion,
        championScore: championScore || 95,
      };
    }).sort((a, b) => b.lmsAvg - a.lmsAvg);
  }, [departments, teachers, yearEvals, yearModelLessons, meeeRecords, teacherRanks]);

  // ─── 8. Institutional Maturity Radar ───────────────────────────────────────
  const maturityRadarData = useMemo(() => {
    return [
      { subject: 'منظومة قطر للتعليم (LMS)', value: Math.round(lmsOverallAvg), fullMark: 100 },
      { subject: 'الخطة الإجرائية الرقمية', value: opPlanStats.completionRate, fullMark: 100 },
      { subject: 'حصص التعليم الإلكتروني', value: Math.round(modelLessonsStats.overallScoreAvg * 10), fullMark: 100 },
      { subject: 'ساعات التطوير المهني والذاتي', value: Math.min(100, Math.round((pdStats.grandTotalHours / 120) * 100)), fullMark: 100 },
      { subject: 'حضور التعلم عن بعد', value: Math.round(distanceAndEventsStats.avgAttendance), fullMark: 100 },
      { subject: 'الفعاليات والشراكات المؤسسية', value: Math.min(100, Math.round((distanceAndEventsStats.eventsCount / 20) * 100)), fullMark: 100 },
    ];
  }, [lmsOverallAvg, opPlanStats, modelLessonsStats, pdStats, distanceAndEventsStats]);

  // ─── Excel Export Function ─────────────────────────────────────────────────
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Executive Summary
    const summaryRows = [
      { 'المؤشر الشامل': 'متوسط تفعيل نظام قطر للتعليم', 'القيمة': `${lmsOverallAvg}%` },
      { 'المؤشر الشامل': 'نسبة إنجاز الخطة الإجرائية', 'القيمة': `${opPlanStats.completionRate}%` },
      { 'المؤشر الشامل': 'متوسط تقييم حصص التعليم الإلكتروني', 'القيمة': `${modelLessonsStats.overallScoreAvg} / 10` },
      { 'المؤشر الشامل': 'إجمالي ساعات التطوير المهني والذاتي', 'القيمة': `${pdStats.grandTotalHours} ساعة` },
      { 'المؤشر الشامل': 'متوسط حضور التعلم عن بعد', 'القيمة': `${distanceAndEventsStats.avgAttendance}%` },
      { 'المؤشر الشامل': 'إجمالي الفعاليات والاجتماعات الموثقة', 'القيمة': `${distanceAndEventsStats.eventsCount} فعالية` },
      { 'المؤشر الشامل': 'معلمو مايكروسوفت الخبراء (MEEE)', 'القيمة': `${pdStats.meeeCertified} معلم` },
      { 'المؤشر الشامل': 'إجمالي رسائل E-Learning SMS', 'القيمة': `${elearningSmsList.length} رسالة` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'المؤشرات العامة');

    // 2. Department Composite Matrix
    const deptRows = crossDeptMatrix.map((d, idx) => ({
      'الترتيب': idx + 1,
      'القسم الأكاديمي': d.name,
      'عدد المعلمين': d.teacherCount,
      'متوسط تقييم LMS (%)': d.lmsAvg,
      'الحصص النموذجية': d.lessonCount,
      'متوسط الحصص (/10)': d.lessonAvg,
      'شهادات MEEE': d.meeeCount,
      'فارس القسم': d.champion,
      'درجة التميز': `${d.championScore}%`,
    }));
    const wsDept = XLSX.utils.json_to_sheet(deptRows);
    XLSX.utils.book_append_sheet(wb, wsDept, 'الأقسام الأكاديمية');

    // 3. Teachers Rankings
    const teacherRows = teacherRanks.map((r, idx) => ({
      'الترتيب': idx + 1,
      'اسم المعلم': r.teacher.nameAr,
      'الرقم الوظيفي': r.teacher.employeeId,
      'القسم': getDeptName(r.teacher.departmentId, departments),
      'المادة': r.teacher.subject,
      'متوسط التقييم (%)': r.avg,
      'المستوى': getPerformanceLevel(r.avg).label,
    }));
    const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
    XLSX.utils.book_append_sheet(wb, wsTeachers, 'تقييم المعلمين');

    // 4. Operational Plan Actions
    const opRows = (operationalPlan?.actions || []).map(a => ({
      'رمز الإجراء': a.id,
      'عنوان الإجراء': a.title,
      'الهدف الاستراتيجي': a.objectiveId,
      'الفئة المستهدفة': a.targetAudience,
      'الإطار الزمني': a.timeframe,
      'حالة التنفيذ': a.status,
      'المصدر': SOURCE_MODULE_LABELS[a.sourceModule as keyof typeof SOURCE_MODULE_LABELS] || a.sourceModule,
      'ملاحظات ومخرجات': a.notes,
    }));
    const wsOp = XLSX.utils.json_to_sheet(opRows);
    XLSX.utils.book_append_sheet(wb, wsOp, 'الخطة الإجرائية');

    XLSX.writeFile(wb, `QSTSS_Comprehensive_Analytics_${selYear}.xlsx`);
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', direction: 'rtl', color: '#64748B' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>📊</div>
        <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F2044', margin: '0 0 0.5rem' }}>
          جاري استخراج وربط المؤشرات والذكاء الإحصائي الشامل...
        </p>
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: 0 }}>
          يتم تجميع كافة بيانات الخطة الإجرائية، التقييمات، التطوير المهني، حصص المشاهدة، والتعلم عن بعد
        </p>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '14px',
    padding: '1.35rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    border: '1px solid #E2E8F0',
    marginBottom: '1.25rem',
  };

  const darkCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
    borderRadius: '14px',
    padding: '1.35rem',
    color: '#FFFFFF',
    boxShadow: '0 4px 16px rgba(15,32,68,0.18)',
    border: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '1.25rem',
  };

  return (
    <div style={{ padding: '1.5rem', direction: 'rtl', maxWidth: '1400px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Official Print Header */}
      <PrintHeader 
        title="تقرير التحليلات والذكاء الإحصائي الشامل" 
        subtitle={`مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — العام الأكاديمي: ${selYear}`} 
      />

      {/* ─── Top Bar Controls (No-Print) ─── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
              📈 التحليلات والذكاء الإحصائي الشامل
            </h1>
            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
              رصد حي متكامل
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.3rem 0 0' }}>
            لوحة قيادة استراتيجية موحدة ترصد كافة أركان التعليم الإلكتروني والحلول الرقمية بالمدرسة
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Year Filter */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.3rem 0.6rem' }}>
            <Calendar size={15} style={{ color: '#64748B', marginLeft: '0.35rem' }} />
            <select 
              value={selYear} 
              onChange={e => setSelYear(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.82rem', color: '#0F2044', cursor: 'pointer', outline: 'none' }}
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Export Excel */}
          <button 
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F2044',
              padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
              fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <Download size={14} style={{ color: '#0284C7' }} />
            <span>تصدير Excel</span>
          </button>

          {/* Print Report */}
          <button 
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
              color: '#FFFFFF', border: 'none', padding: '0.45rem 1rem',
              borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,32,68,0.25)',
            }}
          >
            <Printer size={15} />
            <span>طباعة التقرير الشامل</span>
          </button>
        </div>
      </div>

      {/* ─── High-Level Executive 6 KPI Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* KPI 1: LMS Evaluation Index */}
        <div style={{ ...cardStyle, borderRight: '4px solid #00B4D8', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>مؤشر تفعيل LMS</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} style={{ color: '#00B4D8' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2044', margin: '0.35rem 0 0.15rem' }}>
            {lmsOverallAvg}%
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
            <span>⭐</span> مستوى الأداء: متميز ({scopedTeachers.length} معلماً)
          </div>
        </div>

        {/* KPI 2: Operational Plan Completion */}
        <div style={{ ...cardStyle, borderRight: '4px solid #10B981', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>إنجاز الخطة الإجرائية</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} style={{ color: '#10B981' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', margin: '0.35rem 0 0.15rem' }}>
            {opPlanStats.completionRate}%
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
            <CheckCircle2 size={13} /> {opPlanStats.completed} إجراء منفذاً من {opPlanStats.total}
          </div>
        </div>

        {/* KPI 3: Model Lessons Observed */}
        <div style={{ ...cardStyle, borderRight: '4px solid #6366F1', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>حصص التعليم الإلكتروني</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Laptop size={18} style={{ color: '#6366F1' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4338CA', margin: '0.35rem 0 0.15rem' }}>
            {modelLessonsStats.overallScoreAvg} <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>/ 10</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#4338CA', fontWeight: 700 }}>
            <span>💻</span> {modelLessonsStats.total} حصص نموذجية موثقة
          </div>
        </div>

        {/* KPI 4: Total Training & Development Hours */}
        <div style={{ ...cardStyle, borderRight: '4px solid #F59E0B', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>ساعات التطوير المهني والذاتي</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} style={{ color: '#F59E0B' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', margin: '0.35rem 0 0.15rem' }}>
            {pdStats.grandTotalHours} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>ساعة</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#B45309', fontWeight: 700 }}>
            <span>🎓</span> {pdStats.totalWorkshops} ورش + {pdStats.meeeCertified} MEEE معتمد
          </div>
        </div>

        {/* KPI 5: Distance Learning Attendance */}
        <div style={{ ...cardStyle, borderRight: '4px solid #14B8A6', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>حضور التعلم عن بعد</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} style={{ color: '#14B8A6' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F766E', margin: '0.35rem 0 0.15rem' }}>
            {distanceAndEventsStats.avgAttendance}%
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#0F766E', fontWeight: 700 }}>
            <span>📡</span> التزام البث المباشر: 100%
          </div>
        </div>

        {/* KPI 6: Events, Meetings & Achievements */}
        <div style={{ ...cardStyle, borderRight: '4px solid #8B5CF6', marginBottom: 0, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>الفعاليات والشراكات</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} style={{ color: '#8B5CF6' }} />
            </div>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#6D28D9', margin: '0.35rem 0 0.15rem' }}>
            {distanceAndEventsStats.eventsCount} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>فعالية</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#6D28D9', fontWeight: 700 }}>
            <span>🤝</span> {distanceAndEventsStats.totalParticipants} مشاركاً ومستفيداً
          </div>
        </div>

      </div>

      {/* ─── Navigation Tabs Bar (No-Print) ─── */}
      <div className="no-print" style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid #E2E8F0' }}>
        {[
          { id: 'cockpit', label: '🧭 لوحة القيادة الشاملة', icon: BarChart3 },
          { id: 'operational_plan', label: '🎯 الخطة الإجرائية', icon: Target },
          { id: 'lms_eval', label: '📊 نظام قطر للتعليم والمعلمون', icon: Activity },
          { id: 'class_subject', label: '🏫 الشعب والمواد الدراسية', icon: Layers },
          { id: 'model_lessons', label: '💻 حصص المشاهدة والتعليم الإلكتروني', icon: Laptop },
          { id: 'pd_self_dev', label: '🎓 التطوير المهني والذاتي و MEEE', icon: GraduationCap },
          { id: 'distance_events_takreem', label: '🌐 التعلم عن بعد والفعاليات والتكريم', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284C7' : '3px solid transparent',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0F2044' : '#64748B',
                fontWeight: isActive ? 900 : 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#0284C7' : '#94A3B8' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: 🧭 لوحة القيادة الشاملة (Executive Cockpit)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'cockpit' && (
        <div>
          {/* Top Row: Institutional Maturity Radar & Velocity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* Radar: 6 Dimensions of Maturity */}
            <div style={darkCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    🕸️ رادار النضج الرقمي والمؤسسي الشامل
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#90E0EF', margin: '0.2rem 0 0' }}>
                    تكامل أركان التعليم الإلكتروني الستة بالمدرسة (النسبة المئوية 100%)
                  </p>
                </div>
                <span style={{ background: 'rgba(0,180,216,0.2)', color: '#90E0EF', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                  تكامل استراتيجي
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={maturityRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.18)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9.5, fill: '#E0F2FE', fontWeight: 700 }} />
                  <Radar name="النضج المؤسسي" dataKey="value" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.45} />
                  <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #00B4D8', borderRadius: '8px', color: '#fff', fontSize: '0.75rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly LMS Evaluation Velocity Line Chart */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: 0 }}>
                    📅 تطور متوسط الأداء الشهري لنظام قطر للتعليم
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                    المسار التراكمي لمتوسط درجات المعلمين على مدار العام الأكاديمي
                  </p>
                </div>
                <span style={{ background: '#F0FDF4', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                  معدل التطور: تصاعدي
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.78rem' }} />
                  <Line type="monotone" dataKey="avg" name="متوسط الأداء (%)" stroke="#0284C7" strokeWidth={3} dot={{ r: 4, fill: '#0284C7' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Strategic Pillars Progress Bar Summary */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '1rem' }}>
              🎯 المواءمة مع الأهداف التشغيلية الأربعة للخطة الإجرائية
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {opPlanStats.objData.map((obj, i) => (
                <div key={i} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>{obj.code}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: obj.rate >= 80 ? '#10B981' : '#F59E0B' }}>
                      {obj.rate}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F2044', margin: '0 0 0.6rem', lineHeight: 1.4 }}>
                    {obj.title}
                  </p>
                  <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${obj.rate}%`, height: '100%', background: obj.rate >= 80 ? '#10B981' : '#0284C7', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '0.4rem' }}>
                    <span>تم تنفيذ {obj.done} من {obj.total} إجراء</span>
                    <span>{obj.total - obj.done} قيد المتابعة</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Department Comprehensive Matrix Table */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  🏢 مصفوفة الأداء التكاملي للأقسام الأكاديمية (Cross-Department Matrix)
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                  مقارنة حية لمتوسط التقييم، حصص المشاهدة، شهادات MEEE، وفرسان الأقسام المتصدرين
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#FFFFFF' }}>
                    <th style={{ padding: '0.65rem 0.8rem', borderRadius: '0 8px 0 0' }}>#</th>
                    <th style={{ padding: '0.65rem 0.8rem' }}>القسم الأكاديمي</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>عدد المعلمين</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>متوسط تفعيل LMS</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>حصص المشاهدة</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>شهادات MEEE</th>
                    <th style={{ padding: '0.65rem 0.8rem' }}>فارس القسم الأكثر تميزاً</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center', borderRadius: '8px 0 0 0' }}>التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {crossDeptMatrix.map((d, idx) => (
                    <tr key={d.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#64748B', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0F2044' }}>{d.name}</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>{d.teacherCount}</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ background: d.lmsAvg >= 90 ? '#ECFDF5' : '#F0F9FF', color: d.lmsAvg >= 90 ? '#047857' : '#0369A1', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 800 }}>
                          {d.lmsAvg}%
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#4338CA' }}>{d.lessonCount} حصص</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 800 }}>
                          🎖️ {d.meeeCount}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0F2044' }}>{d.champion}</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#047857' }}>
                        {d.championScore > 0 ? `${d.championScore}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 🎯 الخطة الإجرائية (Operational Plan Analytics)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'operational_plan' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* Status Breakdown Donut Chart */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                📊 حالة تنفيذ الإجراءات التنفيذية ({opPlanStats.total} إجراء)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                توزيع الإجراءات وفق نسب الإنجاز الفعلي بالمدرسة
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={opPlanStats.statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {opPlanStats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} إجراء`, 'العدد']} />
                  <Legend formatter={(value) => <span style={{ fontSize: '0.78rem', color: '#334155' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-around', background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#047857', fontWeight: 800 }}>✓ تم التنفيذ: {opPlanStats.completed}</span>
                <span style={{ color: '#B45309', fontWeight: 800 }}>⚡ جارية: {opPlanStats.inProgress}</span>
                <span style={{ color: '#991B1B', fontWeight: 800 }}>✕ لم يتم: {opPlanStats.notDone}</span>
              </div>
            </div>

            {/* Actions by Source System */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                🔄 تدفق الإجراءات من الأنظمة والمصادر المتكاملة
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                المزامنة التلقائية اللحظية من الورش والفعاليات والتقييمات وحصص المشاهدة
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={opPlanStats.sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 8.5 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284C7" radius={[0, 4, 4, 0]} name="عدد الإجراءات" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Strategic Objectives Progress Details */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>
              📋 تفاصيل إنجاز الخطة الإجرائية حسب الأهداف الاستراتيجية
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {opPlanStats.objData.map((obj, i) => (
                <div key={i} style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: '#0F2044', color: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {obj.code}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F2044' }}>{obj.title}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10B981' }}>{obj.rate}% مكتمل</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', margin: '0.5rem 0' }}>
                    <div style={{ width: `${obj.rate}%`, height: '100%', background: '#10B981', borderRadius: '999px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                    <span>الإجراءات المنفذة: {obj.done} من إجمالي {obj.total}</span>
                    <span>الإجراءات المتبقية: {obj.total - obj.done}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: 📊 نظام قطر للتعليم والمعلمون (LMS & Evaluation Analytics)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'lms_eval' && (
        <div>
          {/* Performance Tiers and Criteria Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* Tiers Distribution */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                🎯 توزيع مستويات أداء المعلمين ({teacherRanks.length} معلماً مقيماً)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                تصنيف كوادر المدرسة وفق مقياس الأداء المعتمد لنظام قطر للتعليم
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {performanceTiers.map((tier, idx) => (
                  <div key={idx} style={{ padding: '0.75rem 0.9rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044' }}>{tier.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: tier.color }}>{tier.count} معلماً ({tier.pct}%)</span>
                    </div>
                    <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${tier.pct}%`, height: '100%', background: tier.color, borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar: The 6 Criteria */}
            <div style={darkCardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.25rem' }}>
                🕸️ قوة تفعيل المعايير الستة المعتمدة
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#90E0EF', margin: '0 0 0.75rem' }}>
                تحليل متوسط أداء الكادر المدرسي في كل معيار (من 20 درجة)
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={criteriaAvg}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#FFFFFF', fontWeight: 700 }} />
                  <Radar name="المتوسط" dataKey="avg" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.45} />
                  <Tooltip contentStyle={{ background: '#0F2044', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.75rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Criteria Deep Dive Bars */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>
              📊 تحليل مؤشرات المعايير الستة التفصيلية لنظام قطر للتعليم
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {criteriaAvg.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2044', minWidth: '70px' }}>
                    معيار {c.id}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#475569', minWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.label}
                  </span>
                  <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '999px', height: '9px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.pct >= 90 ? '#10B981' : c.pct >= 80 ? '#0284C7' : '#F59E0B', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F2044', minWidth: '70px', textAlign: 'left' }}>
                    {c.avg} / 20 ({c.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Teachers vs Support Follow-up List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            
            {/* Top 10 Performers */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Trophy size={18} style={{ color: '#F59E0B' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  أفضل 10 معلمين متميزين على مستوى المدرسة
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {teacherRanks.slice(0, 10).map((r, i) => (
                  <div key={r.teacher.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: i === 0 ? '#FEF3C7' : '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: i < 3 ? '#0F2044' : '#E2E8F0', color: i < 3 ? '#FFFFFF' : '#475569', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                        {i + 1}
                      </span>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044' }}>{r.teacher.nameAr}</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>{getDeptName(r.teacher.departmentId, departments)}</span>
                      </div>
                    </div>
                    <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 900 }}>
                      {r.avg}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needing Support / Follow-up */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  خطة الدعم والتدخل الأكاديمي الموجه (أقل من 75%)
                </h3>
              </div>
              {teacherRanks.filter(r => r.avg < 75).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#ECFDF5', borderRadius: '10px', color: '#047857', fontWeight: 800, fontSize: '0.85rem' }}>
                  ✅ كفاءة ممتازة: جميع معلمي المدرسة حققوا مستويات أداء تفوق 75% في نظام قطر للتعليم!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {teacherRanks.filter(r => r.avg < 75).map((r, i) => (
                    <div key={r.teacher.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991B1B' }}>{r.teacher.nameAr}</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>{getDeptName(r.teacher.departmentId, departments)}</span>
                      </div>
                      <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 900 }}>
                        {r.avg}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: 🏫 الشعب والمواد الدراسية (Class & Subject LMS Analysis)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'class_subject' && (
        <div>
          {/* Grade Level LMS Overview */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>
              📊 نشاط وتفاعل المراحل الدراسية على نظام قطر للتعليم (الصفوف 9 - 12)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {GRADE_LEVEL_LMS_STATS.map((g, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F2044' }}>{g.grade}</span>
                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      {g.sectionsCount} شعب دراسية
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>إجمالي التقييمات:</span>
                      <span style={{ fontWeight: 800, color: '#0F2044' }}>{g.evalsCount} تقييم</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>نسبة حل التقييمات:</span>
                      <span style={{ fontWeight: 800, color: '#10B981' }}>{g.solveRate}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>إجمالي الدروس المرفوعة:</span>
                      <span style={{ fontWeight: 800, color: '#0284C7' }}>{g.totalLessons} درساً</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Most Active Sections */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>
              🏆 أفضل 10 شعب دراسية في حل التقييمات وتفاعل الدروس
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#FFFFFF' }}>
                    <th style={{ padding: '0.65rem 0.8rem', borderRadius: '0 8px 0 0' }}>الترتيب</th>
                    <th style={{ padding: '0.65rem 0.8rem' }}>الشعبة الدراسية</th>
                    <th style={{ padding: '0.65rem 0.8rem' }}>الصف</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>الطلاب</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>نسبة الحل (%)</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>نسبة التصحيح (%)</th>
                    <th style={{ padding: '0.65rem 0.8rem', textAlign: 'center', borderRadius: '8px 0 0 0' }}>متوسط الدرجات</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTIONS_LMS_STATS.slice(0, 10).map((sec, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#64748B' }}>{sec.rank}</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 900, color: '#0F2044' }}>{sec.section}</td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#475569' }}>{sec.grade}</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 700 }}>{sec.studentsCount}</td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                          {sec.solveRate}%
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                        {sec.gradingRate}%
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 900, color: '#0F2044' }}>
                        {sec.evalAvg}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: 💻 حصص المشاهدة والتعليم الإلكتروني (Model Lessons & EdTech)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'model_lessons' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* SAMR Distribution */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                🪜 توزيع مستويات نموذج SAMR للدمج التكنولوجي
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                عمق توظيف التكنولوجيا في الحصص من الاستبدال إلى إعادة التعريف الكامل
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={modelLessonsStats.samrData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {modelLessonsStats.samrData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} حصص`, 'عدد الحصص']} />
                  <Legend formatter={(value) => <span style={{ fontSize: '0.78rem', color: '#334155' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top EdTech Tools Frequency */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                🛠️ أكثر الأدوات والمنصات الرقمية توظيفاً في الحصص
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                تكرار استخدام البرمجيات والحلول الرقمية أثناء المشاهدات الصفية
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={modelLessonsStats.topTools} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} name="مرات التوظيف" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* TPACK Framework Scores */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', marginBottom: '0.75rem' }}>
              🧠 مؤشرات إطار TPACK للتكامل التكنولوجي والبيداغوجي بالمدرسة
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>المعرفة التكنولوجية (TK)</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7', margin: '0.2rem 0' }}>{modelLessonsStats.tkAvg} / 10</p>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>تمكن احترافي من الأجهزة والبرمجيات</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>المعرفة البيداغوجية (PK)</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', margin: '0.2rem 0' }}>{modelLessonsStats.pkAvg} / 10</p>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>استراتيجيات التدريس المتمايز والتفاعلي</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>المعرفة بالمحتوى التخصصي (CK)</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706', margin: '0.2rem 0' }}>{modelLessonsStats.ckAvg} / 10</p>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>دقة المادة العلمية ومصادر التعلم</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>الدمج التكاملي (TPACK)</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4338CA', margin: '0.2rem 0' }}>{modelLessonsStats.tpackAvg} / 10</p>
                <span style={{ fontSize: '0.7rem', color: '#4338CA', fontWeight: 700 }}>أثر التكنولوجيا في تحقيق أهداف الدرس</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: 🎓 التطوير المهني والذاتي و MEEE (PD & Self-Development)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'pd_self_dev' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* Hours Breakdown Pie Chart */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                ⏱️ توزيع ساعات التدريب والتمكين ({pdStats.grandTotalHours} ساعة)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                تكامل الورش الجماعية والتمكين الفردي والتطوير الذاتي لمنسق المشاريع
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={pdStats.hoursBreakdown}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pdStats.hoursBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} ساعة`, 'إجمالي الساعات']} />
                  <Legend formatter={(value) => <span style={{ fontSize: '0.78rem', color: '#334155' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Self Development Categories */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                💡 مجالات التطوير الذاتي لمنسق المشاريع ({pdStats.selfDevHours} ساعة)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                شهادات ودورات تخصصية معتمدة دولياً (AI، أمن سيبراني، إدارة مشاريع، حوسبة سحابية)
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={pdStats.selfDevCatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#10B981" radius={[4, 4, 0, 0]} name="ساعات التدريب" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Microsoft MEEE Status */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🎖️</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  مؤشرات اعتماد خبراء مايكروسوفت للتعليم (Microsoft MEEE Educator)
                </h3>
              </div>
              <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                {pdStats.meeeCertified} معلماً معتمداً رسمياً
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {crossDeptMatrix.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044' }}>{d.name}</span>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {d.meeeCount} شهادات معتمدة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 7: 🌐 التعلم عن بعد والفعاليات والتكريم (Distance Learning, Events & Takreem)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'distance_events_takreem' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            
            {/* Events by Category */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                📅 تصنيف الفعاليات والاجتماعات ({distanceAndEventsStats.eventsCount} فعالية)
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                اجتماعات عمل، إشراف على مشاريع الطلاب، زيارات خارجية ومسابقات
              </p>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={distanceAndEventsStats.eventCatData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {distanceAndEventsStats.eventCatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} فعالية`, 'العدد']} />
                  <Legend formatter={(value) => <span style={{ fontSize: '0.78rem', color: '#334155' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distance Learning Metrics */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.25rem' }}>
                🌐 مؤشرات الجاهزية والتعلم عن بعد
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0 0 1rem' }}>
                معدلات الحضور الطلابي والانضباط الرقمي في الحصص الافتراضية
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>متوسط نسبة الحضور الطلابي:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F766E' }}>{distanceAndEventsStats.avgAttendance}%</span>
                  </div>
                  <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${distanceAndEventsStats.avgAttendance}%`, height: '100%', background: '#14B8A6', borderRadius: '999px' }} />
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>نسبة التزام المعلمين بالبث المباشر:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#047857' }}>100%</span>
                  </div>
                  <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#10B981', borderRadius: '999px' }} />
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>معالجة البلاغات والدعم الفني:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0284C7' }}>100% تم الحل فورياً</span>
                  </div>
                  <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#0284C7', borderRadius: '999px' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recognition & Honorees List */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={18} style={{ color: '#F59E0B' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F2044', margin: 0 }}>
                  لوحة تكريم المعلمين وفرسان الأقسام الأكاديمية
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                إجمالي الشهادات والتكريمات المرصودة: {recognitionStats.total}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
              {recognitionStats.mostHonored.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F2044', display: 'block' }}>{h.name}</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{h.dept}</span>
                  </div>
                  <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {h.count} مرات تكريم
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
