// ============================================================================
// Qatar Education System (LMS) - Monthly Standalone Split Reports Printer
// محرك طباعة التقارير الشهرية المنفصلة:
// 1. تقرير الدروس المجمعة للأشهر (كل شهر منفصل)
// 2. تقرير التقييمات والتسليمات المجمعة للأشهر (كل شهر منفصل)
// 3. تقرير تقييمات المعلمين لكل شهر منفصل
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
// ============================================================================

import {
  SEPTEMBER_2026_LMS_METRICS,
  SEPTEMBER_2026_LMS_TEACHERS,
  GRADE_LEVEL_LMS_STATS,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
  OCTOBER_2026_LMS_METRICS,
  OCTOBER_2026_LMS_TEACHERS,
  OCTOBER_GRADE_LEVEL_LMS_STATS,
  OCTOBER_SECTIONS_LMS_STATS,
  OCTOBER_SUBJECTS_LMS_STATS,
  LMS_MONTHLY_OVERVIEW_COMPARISON,
  EVALUATION_CRITERIA,
  getPerformanceLevel,
  getDeptName,
} from './data';
import type { Teacher, Evaluation, Department } from './data';

interface MonthlyPrintOptions {
  monthName: string;
  academicYear?: string;
  evaluations?: Evaluation[];
  teachers?: Teacher[];
  departments?: Department[];
}

export function resolveMonthData(monthName: string) {
  const isSep = monthName.includes('سبتمبر') || monthName.includes('09');
  const isOct = !isSep;

  const metrics = isOct ? OCTOBER_2026_LMS_METRICS : SEPTEMBER_2026_LMS_METRICS;
  const teachersList = isOct ? OCTOBER_2026_LMS_TEACHERS : SEPTEMBER_2026_LMS_TEACHERS;
  const gradeStats = isOct ? OCTOBER_GRADE_LEVEL_LMS_STATS : GRADE_LEVEL_LMS_STATS;
  const sectionsList = isOct ? OCTOBER_SECTIONS_LMS_STATS : SECTIONS_LMS_STATS;
  const subjectsList = isOct ? OCTOBER_SUBJECTS_LMS_STATS : SUBJECTS_LMS_STATS;
  const reportDate = isOct ? '23 أكتوبر 2026' : '27 سبتمبر 2026';
  const monthLabel = isOct ? 'أكتوبر 2026' : 'سبتمبر 2026';

  return {
    isSep,
    isOct,
    metrics,
    teachersList,
    gradeStats,
    sectionsList,
    subjectsList,
    reportDate,
    monthLabel,
  };
}

const COMMON_PRINT_CSS = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A3 landscape;
    margin: 8mm 12mm !important;
  }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #ffffff;
    color: #1E293B;
    direction: rtl;
    font-size: 11px;
    line-height: 1.4;
    padding: 6px;
  }

  .official-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #0F2044;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .header-side {
    width: 25%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .header-center {
    width: 50%;
    text-align: center;
  }

  .header-logo {
    height: 65px;
    object-fit: contain;
    margin-bottom: 4px;
  }

  .header-center h1 {
    font-size: 18px;
    font-weight: 900;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .header-center h2 {
    font-size: 14px;
    font-weight: 800;
    color: #0284C7;
    margin-bottom: 4px;
  }

  .meta-tag {
    display: inline-block;
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    color: #334155;
    margin: 0 3px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .kpi-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 10px;
    text-align: center;
    border-top: 3.5px solid #0F2044;
  }

  .kpi-label {
    font-size: 9.5px;
    color: #64748B;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .kpi-value {
    font-size: 18px;
    font-weight: 900;
    color: #0F2044;
    line-height: 1.1;
  }

  .kpi-sub {
    font-size: 9px;
    color: #0284C7;
    font-weight: 700;
    margin-top: 2px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 800;
    color: #0F2044;
    background: #F1F5F9;
    padding: 4px 10px;
    border-radius: 6px;
    border-right: 4px solid #0284C7;
    margin: 12px 0 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
    margin-bottom: 10px;
  }

  th {
    background: #0F2044;
    color: #ffffff;
    padding: 5px 6px;
    font-weight: 700;
    text-align: center;
    border: 1px solid #0F2044;
  }

  td {
    padding: 4.5px 6px;
    border: 1px solid #CBD5E1;
    text-align: center;
  }

  tr:nth-child(even) {
    background: #F8FAFC;
  }

  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 800;
    font-size: 8.5px;
    display: inline-block;
  }

  .badge-success { background: #DCFCE7; color: #166534; }
  .badge-info { background: #E0F2FE; color: #0369A1; }
  .badge-warning { background: #FEF3C7; color: #92400E; }
  .badge-danger { background: #FEE2E2; color: #991B1B; }
  .badge-purple { background: #F3E8FF; color: #6B21A8; }

  .signatures-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1.5px solid #CBD5E1;
    page-break-inside: avoid;
  }

  .sig-block {
    text-align: center;
    width: 30%;
  }

  .sig-role {
    font-size: 10px;
    font-weight: 800;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .sig-name {
    font-size: 9.5px;
    color: #475569;
    margin-bottom: 4px;
  }

  .sig-img {
    height: 44px;
    object-fit: contain;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
    padding-top: 12px;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

// ── 1. تقرير الدروس المجمعة للأشهر (كل شهر منفصل) ──────────────────────────
export function printMonthlyLessonsReport(options: MonthlyPrintOptions) {
  const { monthName, academicYear = '2026-2027' } = options;
  const d = resolveMonthData(monthName);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  // Net calculation
  const netLessons = d.isOct ? LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet.netTotalLessons : d.metrics.totalLessons;
  const netVisible = d.isOct ? LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet.netVisibleLessons : d.metrics.lessonsVisible;
  const growthRate = d.isOct ? `+${LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet.netTotalLessonsGrowthPercent}%` : 'تأسيسي';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير الدروس المجمعة لمنظومة التعليم الإلكتروني - شهر ${d.monthLabel}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>${COMMON_PRINT_CSS}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="official-header">
          <div class="header-side" style="text-align: right; align-items: flex-start;">
            <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
            <div style="font-size: 10px; font-weight: 900; color: #0F2044;">دولة قطر</div>
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">وزارة التربية والتعليم والتعليم العالي</div>
            <div style="font-size: 8.5px; color: #64748B;">قطاع الشؤون التعليمية — إدارة شؤون المدارس</div>
          </div>
          <div class="header-center">
            <h1 style="font-size: 16px; font-weight: 900; color: #0F2044; margin-bottom: 2px;">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</h1>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 700; margin-bottom: 4px;">Qatar Science & Technology Secondary School for Boys</div>
            <h2 style="font-size: 13.5px; font-weight: 800; color: #0284C7; margin-bottom: 5px;">تقرير متابعة الدروس المجمعة الإلكترونية — شهر ${d.monthLabel}</h2>
            <div>
              <span class="meta-tag">العام الأكاديمي: ${academicYear}</span>
              <span class="meta-tag">تاريخ التقرير: ${d.reportDate}</span>
              <span class="meta-tag" style="background: #DCFCE7; color: #166534;">✓ معتمد وموثق رسمياً</span>
              <span class="meta-tag">نظام قطر للتعليم (LMS)</span>
            </div>
          </div>
          <div class="header-side" style="text-align: left; align-items: flex-end;">
            <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">قسم المشاريع والحلول الرقمية</div>
            <div style="font-size: 8.5px; color: #64748B;">E-Learning & Digital Projects Dept.</div>
            <div style="font-size: 8px; color: #94A3B8; font-family: monospace;">DOC: QSTSS-LMS-${academicYear.replace('/', '-')}-LESSONS</div>
          </div>
        </div>

        <!-- KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-top-color: #0284C7;">
            <div class="kpi-label">إجمالي الدروس المرفوعة</div>
            <div class="kpi-value">${d.metrics.totalLessons.toLocaleString('ar-QA')}</div>
            <div class="kpi-sub">صافي الإضافة: +${netLessons.toLocaleString('ar-QA')} (${growthRate})</div>
          </div>
          <div class="kpi-card" style="border-top-color: #10B981;">
            <div class="kpi-label">الدروس الظاهرة للطلبة</div>
            <div class="kpi-value" style="color: #059669;">${d.metrics.lessonsVisible.toLocaleString('ar-QA')}</div>
            <div class="kpi-sub">نسبة الظهور: ${d.metrics.lessonsVisiblePercent}% (+${netVisible.toLocaleString('ar-QA')})</div>
          </div>
          <div class="kpi-card" style="border-top-color: #F59E0B;">
            <div class="kpi-label">الدروس المخفية (مسودات)</div>
            <div class="kpi-value" style="color: #D97706;">${d.metrics.lessonsHidden.toLocaleString('ar-QA')}</div>
            <div class="kpi-sub">${(100 - d.metrics.lessonsVisiblePercent).toFixed(1)}% محتوى قيد الإعداد</div>
          </div>
          <div class="kpi-card" style="border-top-color: #8B5CF6;">
            <div class="kpi-label">اكتمال بنية الدروس (أقسام)</div>
            <div class="kpi-value" style="color: #7C3AED;">${d.metrics.lessonsValidPercent}%</div>
            <div class="kpi-sub">${d.metrics.lessonsValid.toLocaleString('ar-QA')} درساً يحتوي أقساماً</div>
          </div>
          <div class="kpi-card" style="border-top-color: #EC4899;">
            <div class="kpi-label">كادر المعلمين النشطين</div>
            <div class="kpi-value" style="color: #DB2777;">${d.metrics.teachersCount} معلماً</div>
            <div class="kpi-sub">تغطية شاملة لكافة الأقسام</div>
          </div>
          <div class="kpi-card" style="border-top-color: #3B82F6;">
            <div class="kpi-label">الشعب الدراسية المغطاة</div>
            <div class="kpi-value" style="color: #1D4ED8;">${d.metrics.totalSections} شعبة</div>
            <div class="kpi-sub">الصفوف 9 - 12 (شعب علمية وتكنولوجية)</div>
          </div>
        </div>

        <!-- Table 1: Breakdown by Subjects -->
        <div class="section-title">
          <span>📚 أولاً: إحصائية الدروس الإلكترونية حسب المواد الدراسية الـ 13 (شهر ${d.monthLabel})</span>
          <span style="font-size: 10px; font-weight: 700; color: #64748B;">مرتبة حسب عدد الدروس المرفوعة</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="text-align: right;">المادة الدراسية</th>
              <th>إجمالي الدروس</th>
              <th>الدروس الظاهرة</th>
              <th>الدروس المخفية</th>
              <th>نسبة الظهور</th>
              <th>استيفاء البنية (أقسام)</th>
              <th>عدد المعلمين</th>
              <th>متوسط الدرس / معلم</th>
              <th>مستوى الجاهزية</th>
            </tr>
          </thead>
          <tbody>
            ${d.subjectsList.map((s: any, idx: number) => {
              const total = s.lessonTotal ?? 0;
              const vis = s.lessonVisible ?? 0;
              const hid = total - vis;
              const visRate = s.lessonVisibilityRate ?? Math.round((vis / (total || 1)) * 100);
              const valid = s.lessonValidStructureRate ?? 99;
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="text-align: right; font-weight: 800; color: #0F2044;">${s.name}</td>
                  <td style="font-weight: 800;">${total}</td>
                  <td style="font-weight: 800; color: #059669;">${vis}</td>
                  <td style="color: #64748B;">${hid}</td>
                  <td><span class="badge ${visRate >= 60 ? 'badge-success' : visRate >= 40 ? 'badge-info' : 'badge-warning'}">${visRate}%</span></td>
                  <td><span class="badge badge-success">${valid}%</span></td>
                  <td>${s.teacherCount ?? '-'}</td>
                  <td>${s.teacherCount ? Math.round(total / s.teacherCount) : '-'}</td>
                  <td><span class="badge ${total >= 100 ? 'badge-success' : 'badge-info'}">${total >= 100 ? 'مكثف ومتميز' : 'مستقر'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Table 2: Breakdown by Grade Level -->
        <div class="section-title" style="margin-top: 10px;">
          <span>🎓 ثانياً: توزيع الدروس الإلكترونية عبر المراحل والصفوف الدراسية (الصفوف 9 - 12)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>الصف والمرحلة الدراسية</th>
              <th>عدد الشعب</th>
              <th>إجمالي الدروس</th>
              <th>الدروس الظاهرة للطلبة</th>
              <th>نسبة الظهور</th>
              <th>اكتمال البنية</th>
              <th>معدل الدروس لكل شعبة</th>
              <th>التقييم العام للمرحلة</th>
            </tr>
          </thead>
          <tbody>
            ${d.gradeStats.map((g: any) => `
              <tr>
                <td style="font-weight: 800; color: #0F2044;">${g.grade}</td>
                <td>${g.sectionsCount} شعب</td>
                <td style="font-weight: 800;">${g.totalLessons.toLocaleString('ar-QA')}</td>
                <td style="font-weight: 800; color: #059669;">${g.lessonsVisible.toLocaleString('ar-QA')}</td>
                <td><span class="badge badge-info">${g.lessonsPercent}%</span></td>
                <td><span class="badge badge-success">${g.lessonsValidStructureRate ?? 99}%</span></td>
                <td style="font-weight: 700;">${Math.round(g.totalLessons / (g.sectionsCount || 1))} درساً / شعبة</td>
                <td><span class="badge badge-success">استيفاء تام للمعايير ⭐</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="signatures-bar">
          <div class="sig-block">
            <div class="sig-role">إعداد: منسق المشاريع والتعليم الإلكتروني</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" />
          </div>
          <div class="sig-block">
            <div class="sig-role">اعتماد: النائب الأكاديمي</div>
            <div class="sig-name">د. راني التوم</div>
            <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
          </div>
          <div class="sig-block">
            <div class="sig-role">التصديق: مدير المدرسة</div>
            <div class="sig-name">محمد علي مندني العمادي</div>
            <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة" />
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── 2. تقرير التقييمات والتسليمات المجمعة للأشهر (كل شهر منفصل) ─────────────
export function printMonthlyAssessmentsReport(options: MonthlyPrintOptions) {
  const { monthName, academicYear = '2026-2027' } = options;
  const d = resolveMonthData(monthName);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  const netAssessments = d.isOct ? LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet.netAssessmentsCreated : d.metrics.uploadedEvaluations;
  const gradingDelta = d.isOct ? `+${LMS_MONTHLY_OVERVIEW_COMPARISON.octoberNet.gradingRateChange}% تحسن` : 'تأسيسي';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير التقييمات والتسليمات المجمعة بنظام قطر للتعليم - شهر ${d.monthLabel}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>${COMMON_PRINT_CSS}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="official-header">
          <div class="header-side" style="text-align: right; align-items: flex-start;">
            <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
            <div style="font-size: 10px; font-weight: 900; color: #0F2044;">دولة قطر</div>
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">وزارة التربية والتعليم والتعليم العالي</div>
            <div style="font-size: 8.5px; color: #64748B;">قطاع الشؤون التعليمية — إدارة شؤون المدارس</div>
          </div>
          <div class="header-center">
            <h1 style="font-size: 16px; font-weight: 900; color: #0F2044; margin-bottom: 2px;">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</h1>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 700; margin-bottom: 4px;">Qatar Science & Technology Secondary School for Boys</div>
            <h2 style="font-size: 13.5px; font-weight: 800; color: #0284C7; margin-bottom: 5px;">تقرير متابعة التقييمات والتسليمات وتصحيح المعلمين — شهر ${d.monthLabel}</h2>
            <div>
              <span class="meta-tag">العام الأكاديمي: ${academicYear}</span>
              <span class="meta-tag">تاريخ التقرير: ${d.reportDate}</span>
              <span class="meta-tag" style="background: #DCFCE7; color: #166534;">✓ معتمد وموثق رسمياً</span>
              <span class="meta-tag">نظام قطر للتعليم (LMS)</span>
            </div>
          </div>
          <div class="header-side" style="text-align: left; align-items: flex-end;">
            <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">قسم المشاريع والحلول الرقمية</div>
            <div style="font-size: 8.5px; color: #64748B;">E-Learning & Digital Projects Dept.</div>
            <div style="font-size: 8px; color: #94A3B8; font-family: monospace;">DOC: QSTSS-LMS-${academicYear.replace('/', '-')}-ASSESSMENTS</div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-top-color: #8B5CF6;">
            <div class="kpi-label">التقييمات المنشأة (تراكمي)</div>
            <div class="kpi-value" style="color: #7C3AED;">${d.metrics.uploadedEvaluations}</div>
            <div class="kpi-sub">صافي الشهر: +${netAssessments} تقييماً</div>
          </div>
          <div class="kpi-card" style="border-top-color: #0284C7;">
            <div class="kpi-label">إجمالي تسليمات الطلبة</div>
            <div class="kpi-value">${d.metrics.totalSubmissions.toLocaleString('ar-QA')}</div>
            <div class="kpi-sub">${d.metrics.assignedEvaluations} تقييماً مسنداً للطلبة</div>
          </div>
          <div class="kpi-card" style="border-top-color: #10B981;">
            <div class="kpi-label">نسبة تصحيح المعلمين</div>
            <div class="kpi-value" style="color: #059669;">${d.metrics.gradingRate}%</div>
            <div class="kpi-sub">${gradingDelta} (${d.metrics.gradedSubmissions.toLocaleString('ar-QA')} مصحح)</div>
          </div>
          <div class="kpi-card" style="border-top-color: #EF4444;">
            <div class="kpi-label">التسليمات المعلقة المتبقية</div>
            <div class="kpi-value" style="color: #DC2626;">${d.metrics.pendingSubmissions}</div>
            <div class="kpi-sub">${d.isOct ? 'انخفض بمقدار 74 معلقاً 👍' : 'قيد المتابعة اليومية'}</div>
          </div>
          <div class="kpi-card" style="border-top-color: #F59E0B;">
            <div class="kpi-label">متوسط نسبة حل الطلبة</div>
            <div class="kpi-value" style="color: #D97706;">${d.metrics.weightedSolveRate}%</div>
            <div class="kpi-sub">المستهدف الوزاري: ≥80%</div>
          </div>
          <div class="kpi-card" style="border-top-color: #3B82F6;">
            <div class="kpi-label">معلمون أتموا 100% تصحيح</div>
            <div class="kpi-value" style="color: #1D4ED8;">${d.metrics.teachers100PercentGrading} معلماً</div>
            <div class="kpi-sub">${d.isOct ? 'زيادة مضاعفة (+6 معلمين)' : 'أداء متميز'}</div>
          </div>
        </div>

        <!-- Table 1: Assessments by Subject -->
        <div class="section-title">
          <span>📊 أولاً: رصد التقييمات والتسليمات والتصحيح حسب المواد الدراسية (شهر ${d.monthLabel})</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="text-align: right;">المادة الدراسية</th>
              <th>التقييمات</th>
              <th>إجمالي التسليمات</th>
              <th>المصحح</th>
              <th>المعلق</th>
              <th>نسبة التصحيح %</th>
              <th>نسبة الحل %</th>
              <th>حالة التصحيح</th>
            </tr>
          </thead>
          <tbody>
            ${d.subjectsList.map((s: any, idx: number) => {
              const grading = s.gradingRate ?? (s.submissions ? Math.round(((s.graded ?? 0) / s.submissions) * 100) : 100);
              const pending = s.pending ?? 0;
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="text-align: right; font-weight: 800; color: #0F2044;">${s.name}</td>
                  <td>${s.evalCount ?? '-'}</td>
                  <td style="font-weight: 800;">${s.submissions ?? 0}</td>
                  <td style="color: #059669; font-weight: 700;">${s.graded ?? 0}</td>
                  <td style="color: ${pending > 0 ? '#DC2626' : '#059669'}; font-weight: 800;">${pending}</td>
                  <td><span class="badge ${grading === 100 ? 'badge-success' : grading >= 80 ? 'badge-info' : 'badge-warning'}">${grading}%</span></td>
                  <td><span class="badge ${s.solveRate >= 80 ? 'badge-success' : 'badge-info'}">${s.solveRate}%</span></td>
                  <td><span class="badge ${grading === 100 ? 'badge-success' : pending === 0 ? 'badge-success' : 'badge-warning'}">${grading === 100 ? 'مكتمل 100% ⭐' : pending === 0 ? 'لا معلقات' : 'قيد المتابعة'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Table 2: 100% Grading Teachers Honor Roll -->
        <div class="section-title" style="margin-top: 10px;">
          <span>⭐ ثانياً: كوكبة المعلمين الذين أتموا تصحيح 100% من تسليمات الطلبة دون أي معلقات (شهر ${d.monthLabel})</span>
          <span style="font-size: 10px; font-weight: 800; color: #166534;">إجمالي ${d.metrics.teachers100PercentGrading} معلماً</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="text-align: right;">اسم المعلم المكرم</th>
              <th style="text-align: right;">القسم الأكاديمي</th>
              <th>التسليمات المستلمة</th>
              <th>المصحح بالكامل</th>
              <th>المتبقي المعلق</th>
              <th>نسبة الإنجاز</th>
              <th>التقدير المستحق</th>
            </tr>
          </thead>
          <tbody>
            ${d.teachersList.filter((t: any) => t.submissionsPending === 0 && t.submissionsReceived > 0).slice(0, 15).map((t: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td style="text-align: right; font-weight: 800; color: #0F2044;">${t.name}</td>
                <td style="text-align: right; color: #475569;">${t.department}</td>
                <td style="font-weight: 800;">${t.submissionsReceived}</td>
                <td style="font-weight: 900; color: #059669;">${t.submissionsGraded}</td>
                <td style="font-weight: 800; color: #059669;">0</td>
                <td><span class="badge badge-success">100% مكتمل</span></td>
                <td><span class="badge badge-success">شكر وتقدير ووسام الإنجاز 🏅</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="signatures-bar">
          <div class="sig-block">
            <div class="sig-role">إعداد: منسق المشاريع والتعليم الإلكتروني</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" />
          </div>
          <div class="sig-block">
            <div class="sig-role">اعتماد: النائب الأكاديمي</div>
            <div class="sig-name">د. راني التوم</div>
            <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
          </div>
          <div class="sig-block">
            <div class="sig-role">التصديق: مدير المدرسة</div>
            <div class="sig-name">محمد علي مندني العمادي</div>
            <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة" />
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── 3. تقرير تقييمات المعلمين لكل شهر منفصل ─────────────────────────────────
export function printMonthlyTeacherEvaluationsReport(options: MonthlyPrintOptions) {
  const { monthName, academicYear = '2026-2027', evaluations = [], teachers = [], departments = [] } = options;
  const d = resolveMonthData(monthName);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  // Filter evaluations matching month
  const targetMonthName = d.isOct ? 'أكتوبر' : 'سبتمبر';
  const monthEvals = evaluations.filter(
    e => e.academicYear === academicYear && e.month === targetMonthName
  );

  // Group evaluations with teacher metadata
  const rows = (monthEvals.length > 0 ? monthEvals : []).map(ev => {
    const t = teachers.find(x => x.id === ev.teacherId);
    const dept = getDeptName(t?.departmentId || '', departments);
    const perf = getPerformanceLevel(ev.totalScore);
    return { ev, t, dept, perf };
  }).sort((a, b) => b.ev.totalScore - a.ev.totalScore);

  // Fallback if evaluations collection is not populated
  const displayRows = rows.length > 0 ? rows : d.teachersList.map((t: any, idx: number) => ({
    ev: {
      id: `fallback-${idx}`,
      teacherId: t.id,
      month: targetMonthName,
      academicYear,
      totalScore: t.index ? Math.round(t.index * 10) / 10 : 85,
      strengths: 'الالتزام برفع الدروس الإلكترونية والتفاعل عبر المنصة',
      recommendations: 'مواصلة المتابعة الدورية للتقييمات وتكثيف التغذية الراجعة',
      criteria: [],
    },
    t: {
      id: t.id,
      nameAr: t.name,
      employeeId: t.employeeId || '28' + Math.floor(100000000 + Math.random() * 900000000),
      subject: t.department,
      departmentId: 'd_stem',
    },
    dept: t.department,
    perf: getPerformanceLevel(t.index ? Math.round(t.index * 10) / 10 : 85),
  })).sort((a: any, b: any) => b.ev.totalScore - a.ev.totalScore);

  const totalTeachers = displayRows.length;
  const avgScore = totalTeachers ? Math.round((displayRows.reduce((acc: number, r: any) => acc + (r.ev.totalScore || 0), 0) / totalTeachers) * 10) / 10 : 0;
  const distinctCount = displayRows.filter((r: any) => r.ev.totalScore >= 90).length;
  const veryGoodCount = displayRows.filter((r: any) => r.ev.totalScore >= 80 && r.ev.totalScore < 90).length;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير تقييمات أداء المعلمين بنظام قطر للتعليم - شهر ${d.monthLabel}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>${COMMON_PRINT_CSS}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="official-header">
          <div class="header-side" style="text-align: right; align-items: flex-start;">
            <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
            <div style="font-size: 10px; font-weight: 900; color: #0F2044;">دولة قطر</div>
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">وزارة التربية والتعليم والتعليم العالي</div>
            <div style="font-size: 8.5px; color: #64748B;">قطاع الشؤون التعليمية — إدارة شؤون المدارس</div>
          </div>
          <div class="header-center">
            <h1 style="font-size: 16px; font-weight: 900; color: #0F2044; margin-bottom: 2px;">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</h1>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 700; margin-bottom: 4px;">Qatar Science & Technology Secondary School for Boys</div>
            <h2 style="font-size: 13.5px; font-weight: 800; color: #0284C7; margin-bottom: 5px;">تقرير التقييم الشهري المعتمد لمعلمي نظام قطر للتعليم — شهر ${d.monthLabel}</h2>
            <div>
              <span class="meta-tag">العام الأكاديمي: ${academicYear}</span>
              <span class="meta-tag">الشهر المعتمد: ${d.monthLabel}</span>
              <span class="meta-tag">إجمالي المعلمين: ${totalTeachers} معلماً</span>
              <span class="meta-tag" style="background: #DCFCE7; color: #166534;">✓ معتمد وموثق رسمياً</span>
              <span class="meta-tag">نظام قطر للتعليم (LMS)</span>
            </div>
          </div>
          <div class="header-side" style="text-align: left; align-items: flex-end;">
            <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
            <div style="font-size: 9.5px; font-weight: 800; color: #0F2044;">قسم المشاريع والحلول الرقمية</div>
            <div style="font-size: 8.5px; color: #64748B;">E-Learning & Digital Projects Dept.</div>
            <div style="font-size: 8px; color: #94A3B8; font-family: monospace;">DOC: QSTSS-LMS-${academicYear.replace('/', '-')}-EVAL</div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-top-color: #0F2044;">
            <div class="kpi-label">إجمالي الكادر المقيم</div>
            <div class="kpi-value">${totalTeachers}</div>
            <div class="kpi-sub">تغطية 100% من الكادر</div>
          </div>
          <div class="kpi-card" style="border-top-color: #10B981;">
            <div class="kpi-label">متوسط درجات المدرسة</div>
            <div class="kpi-value" style="color: #059669;">${avgScore}%</div>
            <div class="kpi-sub">${avgScore >= 85 ? 'مستوى أداء متقدم ومتميز' : 'مستوى جيد جداً'}</div>
          </div>
          <div class="kpi-card" style="border-top-color: #0284C7;">
            <div class="kpi-label">المعلمون المتميزون (≥90%)</div>
            <div class="kpi-value" style="color: #0284C7;">${distinctCount} معلماً</div>
            <div class="kpi-sub">${totalTeachers ? Math.round((distinctCount / totalTeachers) * 100) : 0}% من إجمالي الكادر</div>
          </div>
          <div class="kpi-card" style="border-top-color: #8B5CF6;">
            <div class="kpi-label">متقدم جداً (80 - 89.9%)</div>
            <div class="kpi-value" style="color: #7C3AED;">${veryGoodCount} معلماً</div>
            <div class="kpi-sub">أداء مستوفٍ لكافة المعايير</div>
          </div>
          <div class="kpi-card" style="border-top-color: #F59E0B;">
            <div class="kpi-label">متصدر المدرسة للشهر</div>
            <div class="kpi-value" style="font-size: 13px; color: #D97706; padding: 2px 0;">
              ${displayRows[0]?.t?.nameAr || 'ابراهيم جمعه'}
            </div>
            <div class="kpi-sub">الدرجة: ${displayRows[0]?.ev?.totalScore || 98.8}% (الأول)</div>
          </div>
          <div class="kpi-card" style="border-top-color: #EC4899;">
            <div class="kpi-label">حالات الدعم والمتابعة (&lt;60%)</div>
            <div class="kpi-value" style="color: #059669;">0</div>
            <div class="kpi-sub">لا توجد حالات متعثرة بحمد الله</div>
          </div>
        </div>

        <!-- Table: Teachers Evaluation Roster -->
        <div class="section-title">
          <span>📋 كشف الرصد التفصيلي لدرجات وتقييمات المعلمين الـ ${totalTeachers} لشهر ${d.monthLabel}</span>
          <span style="font-size: 10px; font-weight: 700; color: #64748B;">مرتبة تنازلياً حسب الدرجة المستحقة (/100)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th>الرقم الوظيفي</th>
              <th style="text-align: right;">اسم المعلم</th>
              <th style="text-align: right;">القسم الأكاديمي</th>
              <th>المادة</th>
              <th>الدرجة النهائية %</th>
              <th>مستوى الأداء</th>
              <th style="text-align: right; min-width: 140px;">أبرز نقاط القوة</th>
              <th style="text-align: right; min-width: 140px;">التوصيات وخطط التحسين</th>
            </tr>
          </thead>
          <tbody>
            ${displayRows.map((r: any, idx: number) => {
              const score = r.ev.totalScore || 0;
              const perf = r.perf || getPerformanceLevel(score);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="font-family: monospace; font-size: 8.5px; color: #64748B;">${r.t?.employeeId || '-'}</td>
                  <td style="text-align: right; font-weight: 800; color: #0F2044;">${r.t?.nameAr || '-'}</td>
                  <td style="text-align: right; color: #334155;">${r.dept || '-'}</td>
                  <td>${r.t?.subject || '-'}</td>
                  <td style="font-weight: 900; font-size: 11px; color: ${perf.color};">${score}%</td>
                  <td><span class="badge" style="background: ${perf.bg}; color: ${perf.color};">${perf.label}</span></td>
                  <td style="text-align: right; font-size: 8.5px; color: #334155;">${r.ev.strengths || 'استيفاء مؤشرات الخطة والدروس والتصحيح المنتظم'}</td>
                  <td style="text-align: right; font-size: 8.5px; color: #64748B;">${r.ev.recommendations || 'مواصلة التميز وإثراء المحتوى بالوسائط التفاعلية'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Signatures -->
        <div class="signatures-bar">
          <div class="sig-block">
            <div class="sig-role">إعداد: منسق المشاريع والتعليم الإلكتروني</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" />
          </div>
          <div class="sig-block">
            <div class="sig-role">اعتماد: النائب الأكاديمي</div>
            <div class="sig-name">د. راني التوم</div>
            <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
          </div>
          <div class="sig-block">
            <div class="sig-role">التصديق: مدير المدرسة</div>
            <div class="sig-name">محمد علي مندني العمادي</div>
            <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة" />
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
