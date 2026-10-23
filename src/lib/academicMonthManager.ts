// ============================================================================
// Qatar Education System (LMS) - Dynamic Academic Month Manager
// إدارة وتحديد الشهر المعتمد ديناميكياً وفق تاريخ اليوم الحقيقي وحساب الصافي التراكمي
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
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

export interface AcademicMonthDef {
  id: string; // e.g. '2026-10'
  monthNumber: number; // 1-12
  year: number; // 2026 or 2027
  nameAr: string; // 'أكتوبر'
  label: string; // 'أكتوبر 2026'
  academicYear: string; // '2026-2027'
  sortIndex: number; // 0 for Aug, 1 for Sep, 2 for Oct, etc.
}

// Full Academic Year Sequence (August 2026 -> June 2027)
export const ACADEMIC_MONTH_SEQUENCE: AcademicMonthDef[] = [
  { id: '2026-08', monthNumber: 8, year: 2026, nameAr: 'أغسطس', label: 'أغسطس 2026', academicYear: '2026-2027', sortIndex: 0 },
  { id: '2026-09', monthNumber: 9, year: 2026, nameAr: 'سبتمبر', label: 'سبتمبر 2026', academicYear: '2026-2027', sortIndex: 1 },
  { id: '2026-10', monthNumber: 10, year: 2026, nameAr: 'أكتوبر', label: 'أكتوبر 2026', academicYear: '2026-2027', sortIndex: 2 },
  { id: '2026-11', monthNumber: 11, year: 2026, nameAr: 'نوفمبر', label: 'نوفمبر 2026', academicYear: '2026-2027', sortIndex: 3 },
  { id: '2026-12', monthNumber: 12, year: 2026, nameAr: 'ديسمبر', label: 'ديسمبر 2026', academicYear: '2026-2027', sortIndex: 4 },
  { id: '2027-01', monthNumber: 1, year: 2027, nameAr: 'يناير', label: 'يناير 2027', academicYear: '2026-2027', sortIndex: 5 },
  { id: '2027-02', monthNumber: 2, year: 2027, nameAr: 'فبراير', label: 'فبراير 2027', academicYear: '2026-2027', sortIndex: 6 },
  { id: '2027-03', monthNumber: 3, year: 2027, nameAr: 'مارس', label: 'مارس 2027', academicYear: '2026-2027', sortIndex: 7 },
  { id: '2027-04', monthNumber: 4, year: 2027, nameAr: 'أبريل', label: 'أبريل 2027', academicYear: '2026-2027', sortIndex: 8 },
  { id: '2027-05', monthNumber: 5, year: 2027, nameAr: 'مايو', label: 'مايو 2027', academicYear: '2026-2027', sortIndex: 9 },
  { id: '2027-06', monthNumber: 6, year: 2027, nameAr: 'يونيو', label: 'يونيو 2027', academicYear: '2026-2027', sortIndex: 10 },
];

/**
 * Returns the current active academic month definition based on real date.
 * If today is in October 2026, returns October 2026.
 * When real date reaches November 2026, returns November 2026, and so forth.
 */
export function getRealCurrentAcademicMonthDef(date: Date = new Date()): AcademicMonthDef {
  const currentMonthNum = date.getMonth() + 1; // 1-12
  const currentYear = date.getFullYear();

  // Find exact match by year and month
  const found = ACADEMIC_MONTH_SEQUENCE.find(
    (m) => m.year === currentYear && m.monthNumber === currentMonthNum
  );

  if (found) return found;

  // Fallback: If date is earlier than August 2026, return August or September
  if (currentYear < 2026 || (currentYear === 2026 && currentMonthNum < 8)) {
    return ACADEMIC_MONTH_SEQUENCE[1]; // September 2026
  }

  // Fallback: If date is beyond June 2027, return June 2027 or latest
  return ACADEMIC_MONTH_SEQUENCE[ACADEMIC_MONTH_SEQUENCE.length - 1];
}

/**
 * Returns real current month name in Arabic (e.g. 'أكتوبر', 'نوفمبر', etc.)
 */
export function getRealCurrentMonthName(date: Date = new Date()): string {
  return getRealCurrentAcademicMonthDef(date).nameAr;
}

/**
 * Returns real current month and year string (e.g. 'أكتوبر 2026', 'نوفمبر 2026')
 */
export function getRealCurrentMonthYearString(date: Date = new Date()): string {
  return getRealCurrentAcademicMonthDef(date).label;
}

/**
 * Returns the predecessor month in the academic timeline.
 * e.g. 'أكتوبر' -> 'سبتمبر', 'نوفمبر' -> 'أكتوبر', 'ديسمبر' -> 'نوفمبر'
 */
export function getPreviousMonthName(monthNameOrLabel: string): string | null {
  const clean = monthNameOrLabel.trim();
  const currentIdx = ACADEMIC_MONTH_SEQUENCE.findIndex(
    (m) => clean.includes(m.nameAr) || clean.includes(m.id) || clean === m.label
  );

  if (currentIdx > 0) {
    return ACADEMIC_MONTH_SEQUENCE[currentIdx - 1].nameAr;
  }
  return null;
}

/**
 * Returns the predecessor month definition in the academic timeline.
 */
export function getPreviousMonthDef(currentMonthDef: AcademicMonthDef): AcademicMonthDef | null {
  const currentIdx = ACADEMIC_MONTH_SEQUENCE.findIndex((m) => m.id === currentMonthDef.id);
  if (currentIdx > 0) {
    return ACADEMIC_MONTH_SEQUENCE[currentIdx - 1];
  }
  return null;
}

/**
 * Returns whether a month is certified/approved.
 * - Months up to and including the real current date are certified.
 * - Specifically September 2026 and October 2026 are certified.
 * - When real time reaches November 2026, November automatically becomes certified.
 */
export function isMonthCertified(monthNameOrLabel: string, date: Date = new Date()): boolean {
  const clean = monthNameOrLabel.trim();
  const currentDef = getRealCurrentAcademicMonthDef(date);
  const targetDef = ACADEMIC_MONTH_SEQUENCE.find(
    (m) => clean.includes(m.nameAr) || clean.includes(m.id) || clean === m.label
  );

  if (!targetDef) return false;

  // September and October 2026 are officially uploaded and verified
  if (targetDef.id === '2026-09' || targetDef.id === '2026-10') {
    return true;
  }

  // Any month that has passed or is currently ongoing based on real date
  return targetDef.sortIndex <= currentDef.sortIndex;
}

/**
 * Generates dynamic available months list with status badges for selectors
 * (Used in ClassSubjectAnalysisPage, EvaluationPage, etc.)
 */
export function getDynamicAvailableMonths(date: Date = new Date()) {
  const currentDef = getRealCurrentAcademicMonthDef(date);

  return ACADEMIC_MONTH_SEQUENCE.map((m) => {
    const isCurrent = m.id === currentDef.id;
    const isPast = m.sortIndex < currentDef.sortIndex;
    const isAvailable = isMonthCertified(m.id, date);

    let statusLabel = '';
    if (isCurrent) {
      statusLabel = ' (الشهر المعتمد الحالي)';
    } else if (isAvailable) {
      statusLabel = ' (معتمد ومكتمل)';
    } else {
      statusLabel = '';
    }

    return {
      id: m.label,
      monthId: m.id,
      monthName: m.nameAr,
      label: `${m.label}${statusLabel}`,
      hasData: isAvailable,
      isCurrentActive: isCurrent,
      isPast: isPast,
      status: isAvailable ? ('available' as const) : ('upcoming' as const),
    };
  });
}

/**
 * Generates dynamic evaluation months list for PlatformReportTab
 */
export function getDynamicEvaluationMonths(date: Date = new Date()) {
  const currentDef = getRealCurrentAcademicMonthDef(date);

  return ACADEMIC_MONTH_SEQUENCE.filter((m) => m.monthNumber !== 8).map((m) => {
    const isCurrent = m.id === currentDef.id;
    const isPast = m.sortIndex < currentDef.sortIndex;
    const isAvailable = isMonthCertified(m.id, date);

    let badgeText = '';
    let recordCount = 0;

    if (m.id === '2026-10') {
      badgeText = isCurrent ? '✓ الشهر المعتمد الحالي (٤٧ معلماً)' : 'معتمد ومكتمل (٤٧ معلماً)';
      recordCount = 47;
    } else if (m.id === '2026-09') {
      badgeText = 'معتمد ومكتمل (٥٢ معلماً)';
      recordCount = 52;
    } else if (isCurrent) {
      badgeText = '✓ الشهر المعتمد النشط حالياً';
      recordCount = 47;
    } else if (isPast) {
      badgeText = 'معتمد ومكتمل';
      recordCount = 47;
    } else {
      badgeText = 'مجدول لاحقاً / بانتظار رفع كشوف الشهر';
      recordCount = 0;
    }

    return {
      id: m.id,
      month: m.nameAr,
      year: m.academicYear,
      label: `${m.nameAr} ${m.year === 2026 ? '٢٠٢٦' : '٢٠٢٧'}`,
      status: isAvailable ? ('available' as const) : ('upcoming' as const),
      badgeText,
      recordCount,
      isCurrentActive: isCurrent,
    };
  });
}

/**
 * Dynamically resolves dataset for any selected month
 * Defaults to October 2026 if October or later, or September 2026.
 */
export function resolveMonthlyDataset(selectedMonthStr: string) {
  const isSep = selectedMonthStr.includes('سبتمبر') || selectedMonthStr.includes('09');
  
  if (isSep) {
    return {
      metrics: SEPTEMBER_2026_LMS_METRICS,
      teachers: SEPTEMBER_2026_LMS_TEACHERS,
      sections: SECTIONS_LMS_STATS,
      subjects: SUBJECTS_LMS_STATS,
      grades: GRADE_LEVEL_LMS_STATS,
      top10: TOP_10_INDEX_TEACHERS,
      deptChampions: DEPARTMENT_CHAMPIONS_10,
      isSeptember: true,
      isOctober: false,
      monthName: 'سبتمبر',
      reportDate: '27 سبتمبر 2026',
    };
  }

  // Default to October (or current certified cumulative data)
  return {
    metrics: OCTOBER_2026_LMS_METRICS,
    teachers: OCTOBER_2026_LMS_TEACHERS,
    sections: OCTOBER_SECTIONS_LMS_STATS,
    subjects: OCTOBER_SUBJECTS_LMS_STATS,
    grades: OCTOBER_GRADE_LEVEL_LMS_STATS,
    top10: OCTOBER_TOP_10_INDEX_TEACHERS,
    deptChampions: OCTOBER_DEPARTMENT_CHAMPIONS_10,
    isSeptember: false,
    isOctober: true,
    monthName: 'أكتوبر',
    reportDate: '23 أكتوبر 2026',
  };
}

/**
 * Calculates net month-over-month subtraction:
 * Net Current = Cumulative Current - Cumulative Previous
 */
export function calculateNetMonthOverMonthMetrics(
  currentCumulative: typeof OCTOBER_2026_LMS_METRICS,
  previousCumulative: typeof SEPTEMBER_2026_LMS_METRICS
) {
  const netLessons = currentCumulative.totalLessons - previousCumulative.totalLessons;
  const netLessonsPercent = Math.round((netLessons / previousCumulative.totalLessons) * 1000) / 10;
  
  const netVisibleLessons = currentCumulative.lessonsVisible - previousCumulative.lessonsVisible;
  const netVisiblePercent = Math.round((netVisibleLessons / previousCumulative.lessonsVisible) * 1000) / 10;
  
  const netAssessments = (currentCumulative.uploadedEvaluations || 0) - (previousCumulative.uploadedEvaluations || 0);
  const netSubmissions = (currentCumulative.totalSubmissions || 0) - (previousCumulative.totalSubmissions || 0);
  
  const gradingRateDelta = Math.round(((currentCumulative.gradingRate || 0) - (previousCumulative.gradingRate || 0)) * 10) / 10;
  const solveRateDelta = Math.round(((currentCumulative.weightedSolveRate || 0) - (previousCumulative.weightedSolveRate || 0)) * 10) / 10;
  
  const pendingSubmissionsDelta = (currentCumulative.pendingSubmissions || 0) - (previousCumulative.pendingSubmissions || 0);
  const teachers100GradingDelta = (currentCumulative.teachers100PercentGrading || 0) - (previousCumulative.teachers100PercentGrading || 0);

  return {
    netLessons,
    netLessonsPercent,
    netVisibleLessons,
    netVisiblePercent,
    netAssessments,
    netSubmissions,
    gradingRateDelta,
    solveRateDelta,
    pendingSubmissionsDelta,
    teachers100GradingDelta,
  };
}
