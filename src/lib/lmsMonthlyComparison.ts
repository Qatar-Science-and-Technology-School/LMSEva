// ============================================================================
// Qatar Education System (LMS) - Month-over-Month Comparative Analysis
// تحليل مقارنة الأشهر واستخراج صافي نمو إنجاز شهر أكتوبر
// المعادلة المعتمدة: (التقرير التراكمي لشهر أكتوبر - تقرير شهر سبتمبر = صافي إنجاز شهر أكتوبر)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
// إعداد: م. أحمد عادل طبيشات — منسق المشاريع الإلكترونية
// ============================================================================

import {
  SEPTEMBER_2026_LMS_METRICS,
  SEPTEMBER_2026_LMS_TEACHERS,
  GRADE_LEVEL_LMS_STATS,
  TOP_10_INDEX_TEACHERS,
  DEPARTMENT_CHAMPIONS_10,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
} from './lmsReportSeptember2026';

import {
  OCTOBER_2026_LMS_METRICS,
  OCTOBER_2026_LMS_TEACHERS,
  OCTOBER_GRADE_LEVEL_LMS_STATS,
  OCTOBER_TOP_10_INDEX_TEACHERS,
  OCTOBER_DEPARTMENT_CHAMPIONS_10,
  OCTOBER_SECTIONS_LMS_STATS,
  OCTOBER_SUBJECTS_LMS_STATS,
} from './lmsReportOctober2026';

// ── 1. ملخص المقارنة العامة والمؤشرات الصافية (LMS Overview Comparison) ──
export const LMS_MONTHLY_OVERVIEW_COMPARISON = {
  // بيانات سبتمبر التراكمية
  september: {
    label: 'سبتمبر 2026 (تراكمي التقرير الأول)',
    reportDate: '27 سبتمبر 2026',
    totalLessons: 1460,
    visibleLessons: 796,
    hiddenLessons: 664,
    visiblePercent: 54.5,
    validLessons: 1445,
    validPercent: 99.0,
    assessmentsCreated: 249,
    assessmentsAssigned: 249,
    submissionsTotal: 2440,
    submissionsGraded: 1921,
    submissionsPending: 519,
    gradingRate: 78.7,
    solveRate: 66.7,
    teachersCount: 42,
    teachers100Grading: 5,
    teachers100Lessons: 15,
    sectionsCount: 19,
  },

  // بيانات أكتوبر التراكمية (التقرير التجميعي الصادر 23 أكتوبر)
  octoberCumulative: {
    label: 'أكتوبر 2026 (تقرير تجميعي تراكمي)',
    reportDate: '23 أكتوبر 2026',
    totalLessons: 3026,
    visibleLessons: 1245,
    hiddenLessons: 1781,
    visiblePercent: 41.1,
    validLessons: 3008,
    validPercent: 99.4,
    assessmentsCreated: 287,
    assessmentsAssigned: 248,
    submissionsTotal: 2417,
    submissionsGraded: 1972,
    submissionsPending: 445,
    gradingRate: 81.6,
    solveRate: 57.5,
    teachersCount: 47,
    teachers100Grading: 11,
    teachers100Lessons: 8,
    sectionsCount: 20,
  },

  // صافي إنجاز شهر أكتوبر المنفصل = (تراكمي أكتوبر - تراكمي سبتمبر)
  octoberNet: {
    label: 'صافي إنجاز شهر أكتوبر 2026 (أكتوبر - سبتمبر)',
    period: 'فترة 1 - 23 أكتوبر 2026',
    netTotalLessons: 3026 - 1460, // +1,566 درساً جديداً
    netTotalLessonsGrowthPercent: Number((((3026 - 1460) / 1460) * 100).toFixed(1)), // +107.3%
    netVisibleLessons: 1245 - 796, // +449 درساً ظاهراً جديداً
    netVisibleLessonsGrowthPercent: Number((((1245 - 796) / 796) * 100).toFixed(1)), // +56.4%
    netHiddenLessons: 1781 - 664, // +1,117 درساً مخفياً جديداً
    netAssessmentsCreated: 287 - 249, // +38 تقييماً منشأ جديداً
    netGradedSubmissions: 1972 - 1921, // +51 تسليماً إضافياً مصححاً
    pendingChange: 445 - 519, // -74 تسليماً معلقاً (تم تصحيحها وإنجازها)
    gradingRateChange: Number((81.6 - 78.7).toFixed(1)), // +2.9% تحسن في نسبة التصحيح
    solveRateChange: Number((57.5 - 66.7).toFixed(1)), // -9.2% تغير طبيعي بعد إضافة اختبارات منتصف الفصل
    teachersChange: 47 - 42, // +5 معلمين إضافيين نشطين
    sectionsChange: 20 - 19, // +1 شعبة دراسية مضافة حديثاً (11/5)
    teachers100GradingChange: 11 - 5, // +6 معلمين جدد حققوا 100% تصحيح
  },
};

// ── 1.1. المقارنة الشاملة لكافة أشهر العام الأكاديمي 2026-2027م (التراكمي وصافي الإنجاز الشهري) ──
export interface FullYearMonthlyComparisonItem {
  monthId: string;
  monthName: string;
  year: number;
  label: string;
  reportDate: string;
  isCertified: boolean;
  isCurrentActive: boolean;
  statusBadge: {
    label: string;
    color: string;
    bg: string;
  };
  cumulative: {
    totalLessons: number;
    visibleLessons: number;
    visiblePercent: number;
    hiddenLessons: number;
    validLessons: number;
    validPercent: number;
    assessmentsCreated: number;
    submissionsTotal: number;
    submissionsGraded: number;
    submissionsPending: number;
    gradingRate: number;
    solveRate: number;
    teachersCount: number;
    teachers100Grading: number;
    sectionsCount: number;
  };
  net: {
    netTotalLessons: number;
    netTotalLessonsGrowthPercent: number;
    netVisibleLessons: number;
    netVisibleGrowthPercent: number;
    netAssessments: number;
    netGradedSubmissions: number;
    pendingChange: number;
    gradingRateChange: number;
    teachers100GradingChange: number;
    solveRateChange: number;
    teachersCountChange: number;
  };
  impactSummary: string;
}

export const FULL_YEAR_2026_2027_LMS_MONTHLY_COMPARISONS: FullYearMonthlyComparisonItem[] = [
  {
    monthId: '2026-09',
    monthName: 'سبتمبر',
    year: 2026,
    label: 'سبتمبر 2026',
    reportDate: '27 سبتمبر 2026',
    isCertified: true,
    isCurrentActive: false,
    statusBadge: { label: 'معتمد ومكتمل', color: '#065F46', bg: '#DCFCE7' },
    cumulative: {
      totalLessons: 1460,
      visibleLessons: 796,
      visiblePercent: 54.5,
      hiddenLessons: 664,
      validLessons: 1445,
      validPercent: 99.0,
      assessmentsCreated: 249,
      submissionsTotal: 2440,
      submissionsGraded: 1921,
      submissionsPending: 519,
      gradingRate: 78.7,
      solveRate: 66.7,
      teachersCount: 42,
      teachers100Grading: 5,
      sectionsCount: 19,
    },
    net: {
      netTotalLessons: 1460,
      netTotalLessonsGrowthPercent: 100,
      netVisibleLessons: 796,
      netVisibleGrowthPercent: 100,
      netAssessments: 249,
      netGradedSubmissions: 1921,
      pendingChange: 0,
      gradingRateChange: 0,
      teachers100GradingChange: 5,
      solveRateChange: 0,
      teachersCountChange: 42,
    },
    impactSummary: 'التقرير التأسيسي الأول واعتماد انطلاق المنصة للعام الأكاديمي',
  },
  {
    monthId: '2026-10',
    monthName: 'أكتوبر',
    year: 2026,
    label: 'أكتوبر 2026',
    reportDate: '23 أكتوبر 2026',
    isCertified: true,
    isCurrentActive: true,
    statusBadge: { label: 'الشهر المعتمد حالياً', color: '#0F2044', bg: '#00B4D8' },
    cumulative: {
      totalLessons: 3026,
      visibleLessons: 1245,
      visiblePercent: 41.1,
      hiddenLessons: 1781,
      validLessons: 3008,
      validPercent: 99.4,
      assessmentsCreated: 287,
      submissionsTotal: 2417,
      submissionsGraded: 1972,
      submissionsPending: 445,
      gradingRate: 81.6,
      solveRate: 57.5,
      teachersCount: 47,
      teachers100Grading: 11,
      sectionsCount: 20,
    },
    net: {
      netTotalLessons: 1566,
      netTotalLessonsGrowthPercent: 107.3,
      netVisibleLessons: 449,
      netVisibleGrowthPercent: 56.4,
      netAssessments: 38,
      netGradedSubmissions: 51,
      pendingChange: -74,
      gradingRateChange: 2.9,
      teachers100GradingChange: 6,
      solveRateChange: -9.2,
      teachersCountChange: 5,
    },
    impactSummary: 'نمو فائق (+1,566 درساً)، تحسن التصحيح لـ 81.6%، ومضاعفة المعلمين 100%',
  },
  {
    monthId: '2026-11',
    monthName: 'نوفمبر',
    year: 2026,
    label: 'نوفمبر 2026',
    reportDate: 'نهاية نوفمبر 2026',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'بانتظار كشوف الشهر', color: '#92400E', bg: '#FEF3C7' },
    cumulative: {
      totalLessons: 0,
      visibleLessons: 0,
      visiblePercent: 0,
      hiddenLessons: 0,
      validLessons: 0,
      validPercent: 0,
      assessmentsCreated: 0,
      submissionsTotal: 0,
      submissionsGraded: 0,
      submissionsPending: 0,
      gradingRate: 0,
      solveRate: 0,
      teachersCount: 47,
      teachers100Grading: 0,
      sectionsCount: 20,
    },
    net: {
      netTotalLessons: 0,
      netTotalLessonsGrowthPercent: 0,
      netVisibleLessons: 0,
      netVisibleGrowthPercent: 0,
      netAssessments: 0,
      netGradedSubmissions: 0,
      pendingChange: 0,
      gradingRateChange: 0,
      teachers100GradingChange: 0,
      solveRateChange: 0,
      teachersCountChange: 0,
    },
    impactSummary: 'مجدول / بانتظار استلام التقرير التجميعي لشهر نوفمبر عند حلوله',
  },
  {
    monthId: '2026-12',
    monthName: 'ديسمبر',
    year: 2026,
    label: 'ديسمبر 2026',
    reportDate: 'نهاية ديسمبر 2026',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'نهاية الفصل الدراسي الأول واختبارات نهاية الفصل',
  },
  {
    monthId: '2027-01',
    monthName: 'يناير',
    year: 2027,
    label: 'يناير 2027',
    reportDate: 'نهاية يناير 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'انطلاق الفصل الدراسي الثاني والخطط التشغيلية المحدثة',
  },
  {
    monthId: '2027-02',
    monthName: 'فبراير',
    year: 2027,
    label: 'فبراير 2027',
    reportDate: 'نهاية فبراير 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'متابعة الخطط الدراسية وورش ومشاريع STEM المتقدمة',
  },
  {
    monthId: '2027-03',
    monthName: 'مارس',
    year: 2027,
    label: 'مارس 2027',
    reportDate: 'نهاية مارس 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'متابعة منتصف الفصل الدراسي الثاني واختبارات منتصف الفصل',
  },
  {
    monthId: '2027-04',
    monthName: 'أبريل',
    year: 2027,
    label: 'أبريل 2027',
    reportDate: 'نهاية أبريل 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'تكثيف التقييمات الإثرائية ودروس المشاهدة والأنشطة الرقمية',
  },
  {
    monthId: '2027-05',
    monthName: 'مايو',
    year: 2027,
    label: 'مايو 2027',
    reportDate: 'نهاية مايو 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'الاستعداد لاختبارات نهاية العام والأبحاث العلمية والتكريم الختامي',
  },
  {
    monthId: '2027-06',
    monthName: 'يونيو',
    year: 2027,
    label: 'يونيو 2027',
    reportDate: 'نهاية يونيو 2027',
    isCertified: false,
    isCurrentActive: false,
    statusBadge: { label: 'مجدول لاحقاً', color: '#64748B', bg: '#F1F5F9' },
    cumulative: { totalLessons: 0, visibleLessons: 0, visiblePercent: 0, hiddenLessons: 0, validLessons: 0, validPercent: 0, assessmentsCreated: 0, submissionsTotal: 0, submissionsGraded: 0, submissionsPending: 0, gradingRate: 0, solveRate: 0, teachersCount: 47, teachers100Grading: 0, sectionsCount: 20 },
    net: { netTotalLessons: 0, netTotalLessonsGrowthPercent: 0, netVisibleLessons: 0, netVisibleGrowthPercent: 0, netAssessments: 0, netGradedSubmissions: 0, pendingChange: 0, gradingRateChange: 0, teachers100GradingChange: 0, solveRateChange: 0, teachersCountChange: 0 },
    impactSummary: 'التقرير السنوي الختامي للعام الأكاديمي 2026-2027م',
  },
];

// ── 2. مقارنة الشعب الدراسية: تراكمي vs صافي شهر أكتوبر ──
export interface SectionMonthlyComparisonItem {
  section: string;
  grade: string;
  studentsCount: number;
  sepTotalLessons: number;
  octTotalLessons: number;
  netLessonsAdded: number; // (أكتوبر - سبتمبر)
  sepVisibleLessons: number;
  octVisibleLessons: number;
  netVisibleAdded: number; // الدروس الظاهرة الجديدة بأكتوبر
  sepSolveRate: number;
  octSolveRate: number;
  solveRateDelta: number; // الفارق بالنقاط المئوية
  sepGradingRate: number;
  octGradingRate: number;
  gradingRateDelta: number; // الفارق بالنقاط المئوية
  octSubmissions: number;
  evalClass: string;
  performanceSummary: string;
  isNewSection?: boolean;
}

export const LMS_SECTIONS_MONTHLY_COMPARISON: SectionMonthlyComparisonItem[] = OCTOBER_SECTIONS_LMS_STATS.map((octSec) => {
  const sepSec = SECTIONS_LMS_STATS.find((s) => s.section === octSec.section);
  const isNew = !sepSec;

  const sepTotalLessons = sepSec ? sepSec.lessonTotal : 0;
  const octTotalLessons = octSec.lessonTotal;
  const netLessonsAdded = isNew ? octTotalLessons : octTotalLessons - sepTotalLessons;

  const sepVisibleLessons = sepSec ? sepSec.lessonVisible : 0;
  const octVisibleLessons = octSec.lessonVisible;
  const netVisibleAdded = isNew ? octVisibleLessons : octVisibleLessons - sepVisibleLessons;

  const sepSolveRate = sepSec ? sepSec.solveRate : 0;
  const octSolveRate = octSec.solveRate;
  const solveRateDelta = isNew ? 0 : Number((octSolveRate - sepSolveRate).toFixed(1));

  const sepGradingRate = sepSec ? sepSec.gradingRate : 0;
  const octGradingRate = octSec.gradingRate;
  const gradingRateDelta = isNew ? 0 : Number((octGradingRate - sepGradingRate).toFixed(1));

  let performanceSummary = 'أداء متوازن';
  if (isNew) {
    performanceSummary = 'شعبة مضافة حديثاً في أكتوبر';
  } else if (netLessonsAdded >= 90 && gradingRateDelta >= 5) {
    performanceSummary = 'نمو متميز في الدروس وتحسن بالتصحيح 🚀';
  } else if (gradingRateDelta >= 10) {
    performanceSummary = 'قفزة نوعية في إنجاز التصحيح 📈';
  } else if (netLessonsAdded >= 100) {
    performanceSummary = 'إضافة مكثفة للدروس الإلكترونية 📚';
  } else if (octSolveRate >= 80) {
    performanceSummary = 'تفاعل طلابي استثنائي في التقييمات ⭐';
  }

  return {
    section: octSec.section,
    grade: octSec.grade,
    studentsCount: octSec.studentsCount,
    sepTotalLessons,
    octTotalLessons,
    netLessonsAdded,
    sepVisibleLessons,
    octVisibleLessons,
    netVisibleAdded,
    sepSolveRate,
    octSolveRate,
    solveRateDelta,
    sepGradingRate,
    octGradingRate,
    gradingRateDelta,
    octSubmissions: octSec.submissions,
    evalClass: octSec.evalClass,
    performanceSummary,
    isNewSection: isNew,
  };
});

// ── 3. مقارنة المراحل والصفوف الدراسية (Grade Level Comparison) ──
export interface GradeMonthlyComparisonItem {
  grade: string;
  sectionsCountSep: number;
  sectionsCountOct: number;
  sepTotalLessons: number;
  octTotalLessons: number;
  netLessonsAdded: number; // (أكتوبر - سبتمبر)
  sepVisiblePercent: number;
  octVisiblePercent: number;
  visiblePercentDelta: number;
  sepSolveRate: number;
  octSolveRate: number;
  solveRateDelta: number;
  sepEvalCount: number;
  octEvalCount: number;
  netEvalAdded: number;
}

export const LMS_GRADES_MONTHLY_COMPARISON: GradeMonthlyComparisonItem[] = OCTOBER_GRADE_LEVEL_LMS_STATS.map((octG) => {
  const sepG = GRADE_LEVEL_LMS_STATS.find((g) => g.grade === octG.grade);
  const sepTotalLessons = sepG ? sepG.totalLessons : 0;
  const octTotalLessons = octG.totalLessons;
  const netLessonsAdded = octTotalLessons - sepTotalLessons;

  const sepVisiblePercent = sepG ? sepG.lessonsPercent : 0;
  const octVisiblePercent = octG.lessonsPercent;
  const visiblePercentDelta = Number((octVisiblePercent - sepVisiblePercent).toFixed(1));

  const sepSolveRate = sepG ? sepG.solveRate : 0;
  const octSolveRate = octG.solveRate;
  const solveRateDelta = Number((octSolveRate - sepSolveRate).toFixed(1));

  const sepEvalCount = sepG ? sepG.evalsCount : 0;
  const octEvalCount = octG.evalsCount;
  const netEvalAdded = octEvalCount - sepEvalCount;

  return {
    grade: octG.grade,
    sectionsCountSep: sepG ? sepG.sectionsCount : 0,
    sectionsCountOct: octG.sectionsCount,
    sepTotalLessons,
    octTotalLessons,
    netLessonsAdded,
    sepVisiblePercent,
    octVisiblePercent,
    visiblePercentDelta,
    sepSolveRate,
    octSolveRate,
    solveRateDelta,
    sepEvalCount,
    octEvalCount,
    netEvalAdded,
  };
});

// ── 4. مقارنة المواد الدراسية ومعدل الإضافة الصافي (Subject Comparison) ──
export interface SubjectMonthlyComparisonItem {
  name: string;
  sepTotalLessons: number;
  octTotalLessons: number;
  netLessonsAdded: number; // (أكتوبر - سبتمبر)
  sepVisiblePercent: number;
  octVisiblePercent: number;
  sepSolveRate: number;
  octSolveRate: number;
  octSubmissions: number;
}

export const LMS_SUBJECTS_MONTHLY_COMPARISON: SubjectMonthlyComparisonItem[] = OCTOBER_SUBJECTS_LMS_STATS.map((octSub) => {
  const sepSub = SUBJECTS_LMS_STATS.find((s) => s.name === octSub.name);
  const sepTotalLessons = sepSub ? ((sepSub as any).lessonTotal ?? 0) : 0;
  const octTotalLessons = (octSub as any).lessonTotal ?? 0;
  const netLessonsAdded = octTotalLessons - sepTotalLessons;

  return {
    name: octSub.name,
    sepTotalLessons,
    octTotalLessons,
    netLessonsAdded,
    sepVisiblePercent: sepSub ? ((sepSub as any).lessonVisibilityRate ?? 0) : 0,
    octVisiblePercent: (octSub as any).lessonVisibilityRate ?? 0,
    sepSolveRate: sepSub ? sepSub.solveRate : 0,
    octSolveRate: octSub.solveRate,
    octSubmissions: octSub.submissions,
  };
});

// ── 5. تطور لوحة الشرف والتكريم بين سبتمبر وأكتوبر (Takreem Evolution) ──
export const LMS_TAKREEM_MONTHLY_EVOLUTION = {
  // فرسان الأقسام الذين حافظوا على تميزهم وصدارتهم في كلا الشهرين
  consistentChampions: [
    { teacherName: 'ابراهيم جمعه', department: 'اللغة العربية', status: 'حافظ على صدارة المدرسة والقسم في كلا الشهرين (98.4 في سبتمبر -> 98.8 في أكتوبر)' },
    { teacherName: 'الحسن علي', department: 'التربية الإسلامية', status: 'حافظ على المركز المتقدم والوصافة في كلا الشهرين (94.5 في سبتمبر -> 98.4 في أكتوبر)' },
    { teacherName: 'د. أوزغور', department: 'التكنولوجيا واللغات', status: 'تميز مستمر واستيفاء كامل للمؤشرات في كلا الشهرين (92.5 في سبتمبر -> 95.8 في أكتوبر)' },
    { teacherName: 'أحمد إبراهيم سليم', department: 'الرياضيات', status: 'صدارة قسم الرياضيات للشهر الثاني على التوالي وتصحيح 100% لكافة التسليمات' },
  ],

  // فرسان صاعدون للتكريم لشهر أكتوبر لأول مرة
  risingChampionsInOctober: [
    { teacherName: 'محمد عبدالسلام الكفري', department: 'العلوم (الأحياء)', score: 96.1, rank: 'المركز الخامس على المدرسة وبطل قسم العلوم' },
    { teacherName: 'أحمد محمد عبدالرحمن', department: 'الدراسات الاجتماعية', score: 97.2, rank: 'المركز الثالث على المدرسة وبطل الدراسات الاجتماعية' },
    { teacherName: 'حسام شبل', department: 'اللغة الإنجليزية', score: 95.8, rank: 'المركز السادس على المدرسة وبطل اللغة الإنجليزية' },
    { teacherName: 'محمد حسن النجار', department: 'التربية البدنية', score: 94.2, rank: 'المركز التاسع على المدرسة وبطل قسم التربية البدنية' },
    { teacherName: 'أحمد محمد عبدالعزيز', department: 'العلوم (الفيزياء)', score: 93.8, rank: 'المركز العاشر على المدرسة ومتميز في الدروس المستوفية' },
    { teacherName: 'عماد أصلان', department: 'الرياضيات', score: 94.6, rank: 'المركز الثامن على المدرسة وتصحيح 100% للتسليمات' },
  ],

  // مقارنة العشرة الأوائل بين الشهرين
  top10Comparison: {
    september: TOP_10_INDEX_TEACHERS,
    october: OCTOBER_TOP_10_INDEX_TEACHERS,
  },
};
