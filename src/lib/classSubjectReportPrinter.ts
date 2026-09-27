import {
  SEPTEMBER_2026_LMS_METRICS,
  GRADE_LEVEL_LMS_STATS,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
} from './data';

interface PrintReportOptions {
  monthName?: string;
  academicYear?: string;
}

// Common A3 Landscape (0 Margins) CSS Stylesheet
const COMMON_A3_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A3 landscape;
    margin: 0 !important;
  }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #ffffff;
    color: #1E293B;
    direction: rtl;
    font-size: 11px;
    line-height: 1.4;
    margin: 0 !important;
    padding: 10mm 14mm !important;
  }

  .page-container {
    width: 100%;
    min-height: 100%;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
    padding-top: 10px;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Official Header (Centered & Organized) */
  .official-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-bottom: 2.5px solid #0F2044;
    padding-bottom: 10px;
    margin-bottom: 12px;
    gap: 6px;
  }

  .header-logos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-bottom: 3px;
  }

  .header-logo {
    height: 58px;
    object-fit: contain;
  }

  .header-logos-divider {
    width: 1px;
    height: 40px;
    background: #CBD5E1;
  }

  .header-text {
    text-align: center;
  }

  .header-text .country-title {
    font-size: 11.5px;
    font-weight: 800;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .header-text .school-title {
    font-size: 15.5px;
    font-weight: 900;
    color: #0F2044;
    letter-spacing: -0.2px;
  }

  .header-text .dept-title {
    font-size: 11px;
    font-weight: 800;
    color: #0096C7;
  }

  .header-text .doc-title {
    font-size: 12.5px;
    font-weight: 900;
    color: #0F2044;
    background: #F1F5F9;
    padding: 3px 18px;
    border-radius: 999px;
    display: inline-block;
    margin-top: 4px;
    border: 1.5px solid #CBD5E1;
  }

  .meta-bar {
    display: flex;
    justifyContent: space-between;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 10px;
    margin-bottom: 12px;
    color: #475569;
  }

  .meta-bar strong {
    color: #0F2044;
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }

  .kpi-card {
    background: #fff;
    border: 1.5px solid #E2E8F0;
    border-radius: 8px;
    padding: 7px 6px;
    text-align: center;
  }

  .kpi-title {
    font-size: 9px;
    color: #64748B;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .kpi-val {
    font-size: 14px;
    font-weight: 900;
    line-height: 1.1;
  }

  .kpi-sub {
    font-size: 8px;
    color: #94A3B8;
    margin-top: 2px;
  }

  /* Section Titles */
  .section-title {
    font-size: 11.5px;
    font-weight: 900;
    color: #0F2044;
    background: linear-gradient(90deg, #F1F5F9 0%, #FFFFFF 100%);
    border-right: 4px solid #0096C7;
    padding: 5px 10px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justifyContent: space-between;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
    margin-bottom: 12px;
  }

  th {
    background: #0F2044;
    color: #ffffff;
    font-weight: 800;
    padding: 5px 6px;
    text-align: right;
    border: 1px solid #0F2044;
    white-space: nowrap;
  }

  th.text-center, td.text-center {
    text-align: center;
  }

  td {
    padding: 4.5px 6px;
    border: 1px solid #CBD5E1;
    vertical-align: middle;
  }

  tr:nth-child(even) {
    background-color: #F8FAFC;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 800;
    font-size: 8.5px;
    text-align: center;
  }

  .badge-excellent {
    background: #DCFCE7;
    color: #166534;
    border: 1px solid #BBF7D0;
  }

  .badge-good {
    background: #E0F2FE;
    color: #0369A1;
    border: 1px solid #BAE6FD;
  }

  .badge-warning {
    background: #FEF3C7;
    color: #B45309;
    border: 1px solid #FDE68A;
  }

  .badge-critical {
    background: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FECACA;
  }

  /* Signatures Box */
  .signatures-container {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 2px solid #0F2044;
    display: flex;
    justifyContent: space-between;
    align-items: flex-start;
  }

  .sig-box {
    text-align: center;
    width: 30%;
    background: #FAFAFA;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 8px 10px;
  }

  .sig-title {
    font-size: 10px;
    font-weight: 800;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .sig-name {
    font-size: 10.5px;
    font-weight: 900;
    color: #0F2044;
    margin-bottom: 3px;
  }

  .sig-role {
    font-size: 8.5px;
    color: #64748B;
    margin-bottom: 3px;
  }

  .sig-img-container {
    height: 44px;
    display: flex;
    align-items: center;
    justifyContent: center;
  }

  .sig-img {
    max-height: 42px;
    max-width: 140px;
    object-fit: contain;
  }

  .footer-note {
    margin-top: 8px;
    font-size: 8.5px;
    color: #94A3B8;
    text-align: center;
  }
`;

// Common Signatures HTML snippet (Principal name strictly above signature)
const COMMON_SIGNATURES_HTML = `
  <div class="signatures-container avoid-break">
    <!-- 1. Ahmad -->
    <div class="sig-box">
      <div class="sig-title">إعداد وتدقيق التقرير</div>
      <div class="sig-name">م. أحمد عادل طبيشات</div>
      <div class="sig-role">منسق المشاريع والتعليم الإلكتروني</div>
      <div class="sig-img-container">
        <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد عادل طبيشات" />
      </div>
    </div>

    <!-- 2. Rani -->
    <div class="sig-box">
      <div class="sig-title">مراجعة واعتماد</div>
      <div class="sig-name">د. راني التوم</div>
      <div class="sig-role">النائب الأكاديمي للمدرسة</div>
      <div class="sig-img-container">
        <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
      </div>
    </div>

    <!-- 3. School Principal: STRICTLY Mohammad Ali Mandani Al-Emadi with signature UNDERNEATH -->
    <div class="sig-box" style="border: 1.5px solid #0F2044; background: #FFFFFF;">
      <div class="sig-title">يعتمد، مدير المدرسة</div>
      <div class="sig-name" style="font-size: 11px; color: #0F2044;">محمد علي مندني العمادي</div>
      <div class="sig-role">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
      <div class="sig-img-container">
        <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة محمد علي مندني العمادي" />
      </div>
    </div>
  </div>
  <div class="footer-note">
    نظام متابعة وتقييم نظام قطر للتعليم والمنصات التعليمية الرقمية (QES) — مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
  </div>
`;

function openA3PrintWindow(title: string, bodyContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>${COMMON_A3_STYLES}</style>
      </head>
      <body>
        <div class="page-container">
          ${bodyContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. التقرير الشهري الشامل (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printClassSubjectMonthlyReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;
  const sortedSections = [...SECTIONS_LMS_STATS].sort((a, b) => a.rank - b.rank);
  const grade12Sections = sortedSections.filter(s => s.grade.includes('الثاني عشر'));

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">التقرير الشهري الشامل لتحليل الشعب والمواد الدراسية (QES)</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>الفترة المعتمدة: <strong>شهر ${monthName}</strong></div>
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>تاريخ التقرير: <strong>27 سبتمبر 2026</strong></div>
      <div>كود التقرير: <strong>QES-REP-FULL-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="border-top: 3px solid #0F2044;">
        <div class="kpi-title">إجمالي الشعب</div>
        <div class="kpi-val" style="color: #0F2044;">${SEPTEMBER_2026_LMS_METRICS.totalSections} شعبة</div>
        <div class="kpi-sub">5 صفوف دراسية</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #0284C7;">
        <div class="kpi-title">المواد الدراسية</div>
        <div class="kpi-val" style="color: #0284C7;">${SEPTEMBER_2026_LMS_METRICS.totalSubjects} مادة</div>
        <div class="kpi-sub">تخصصية وأكاديمية</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #10B981;">
        <div class="kpi-title">التسليمات المحلولة</div>
        <div class="kpi-val" style="color: #10B981;">${SEPTEMBER_2026_LMS_METRICS.totalSubmissions.toLocaleString('ar-QA')}</div>
        <div class="kpi-sub">تسليم طلابي</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #0D9488;">
        <div class="kpi-title">نسبة حل التقييمات</div>
        <div class="kpi-val" style="color: #0D9488;">${SEPTEMBER_2026_LMS_METRICS.weightedSolveRate}%</div>
        <div class="kpi-sub">المعدل العام للشعب</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #7C3AED;">
        <div class="kpi-title">إنجاز التصحيح</div>
        <div class="kpi-val" style="color: #7C3AED;">${SEPTEMBER_2026_LMS_METRICS.gradingRate}%</div>
        <div class="kpi-sub">${SEPTEMBER_2026_LMS_METRICS.gradedSubmissions} مصححاً</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #D97706;">
        <div class="kpi-title">تفعيل ونشر الدروس</div>
        <div class="kpi-val" style="color: #D97706;">${SEPTEMBER_2026_LMS_METRICS.lessonsVisiblePercent}%</div>
        <div class="kpi-sub">${SEPTEMBER_2026_LMS_METRICS.lessonsVisible} من ${SEPTEMBER_2026_LMS_METRICS.totalLessons}</div>
      </div>
    </div>

    <!-- Section 1: مؤشرات الصفوف الـ 5 -->
    <div class="section-title">
      <span>🏫 أولاً: تحليل مؤشرات التفاعل حسب الصفوف والمراحل الدراسية</span>
      <span style="font-size: 9px; color: #64748B;">توزيع شامل للصفوف (7، 9، 10، 11، 12)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">م</th>
          <th>الصف الدراسي</th>
          <th class="text-center">عدد الشعب</th>
          <th class="text-center">إجمالي التسليمات</th>
          <th class="text-center">نسبة الحل المرجحة</th>
          <th class="text-center">نسبة التصحيح</th>
          <th class="text-center">تغطية التقييمات</th>
          <th class="text-center">تفعيل الدروس</th>
          <th>الملاحظات التوجيهية</th>
        </tr>
      </thead>
      <tbody>
        ${GRADE_LEVEL_LMS_STATS.map((g, idx) => `
          <tr>
            <td class="text-center" style="font-weight: 800;">${idx + 1}</td>
            <td style="font-weight: 800; color: #0F2044;">${g.grade}</td>
            <td class="text-center">${g.sectionsCount} شعب</td>
            <td class="text-center" style="font-weight: 800;">${g.submissions}</td>
            <td class="text-center" style="font-weight: 900; color: ${g.solveRate >= 70 ? '#166534' : g.solveRate >= 50 ? '#0284C7' : '#991B1B'};">${g.solveRate}%</td>
            <td class="text-center" style="font-weight: 800;">${g.gradingRate}%</td>
            <td class="text-center">${g.evalRatio} (${g.evalPercent}%)</td>
            <td class="text-center">${g.lessonsRatio} (${g.lessonVisibilityRate}%)</td>
            <td style="font-size: 8.5px; color: ${g.grade.includes('الثاني عشر') ? '#991B1B; font-weight: 700;' : '#475569;'}">
              ${g.grade.includes('الثاني عشر') ? '⚠️ يتطلب تدخلاً ميدانياً عاجلاً لرفع تسليمات الطلاب' : 'مؤشرات مستقرة مع استمرار المتابعة الأسبوعية'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Section 2: الشعب الـ 19 -->
    <div class="section-title" style="border-right-color: #10B981; margin-top: 10px;">
      <span>📋 ثانياً: الكشف التقييمي الشامل للشعب الدراسية الـ 19 مرتبة حسب نسبة الحل</span>
      <span style="font-size: 9px; color: #64748B;">بيانات رسمية معتمدة من نظام قطر للتعليم</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">الترتيب</th>
          <th style="width: 70px;">الشعبة</th>
          <th style="width: 95px;">الصف الدراسي</th>
          <th class="text-center" style="width: 50px;">الطلاب</th>
          <th class="text-center" style="width: 60px;">التسليمات</th>
          <th class="text-center" style="width: 60px;">نسبة الحل</th>
          <th class="text-center" style="width: 65px;">نسبة التصحيح</th>
          <th class="text-center" style="width: 60px;">الدروس المرئية</th>
          <th>المادة الأضعف بالحل</th>
          <th class="text-center" style="width: 80px;">التصنيف الأكاديمي</th>
        </tr>
      </thead>
      <tbody>
        ${sortedSections.map(s => `
          <tr>
            <td class="text-center" style="font-weight: 800; color: ${s.rank <= 3 ? '#D97706' : '#64748B'};">
              ${s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : `#${s.rank}`}
            </td>
            <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section}</td>
            <td>${s.grade}</td>
            <td class="text-center">${s.studentsCount}</td>
            <td class="text-center" style="font-weight: 800;">${s.submissions}</td>
            <td class="text-center" style="font-weight: 900; color: ${s.solveRate >= 75 ? '#166534' : s.solveRate >= 60 ? '#0284C7' : '#991B1B'};">
              ${s.solveRate}%
            </td>
            <td class="text-center" style="font-weight: 800;">${s.gradingRate}%</td>
            <td class="text-center">${s.lessonVisiblePercent}%</td>
            <td style="font-size: 8.5px; color: ${s.solveRate < 60 ? '#7F1D1D' : '#475569'};">${s.weakestEvalSubject}</td>
            <td class="text-center">
              <span class="badge ${s.solveRate >= 75 ? 'badge-excellent' : s.solveRate >= 60 ? 'badge-good' : s.solveRate >= 45 ? 'badge-warning' : 'badge-critical'}">
                ${s.evalClass}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Section 3: خطة الثاني عشر + التوقيعات -->
    <div style="margin-top: 10px;">
      <div class="section-title" style="border-right-color: #DC2626;">
        <span>🚨 ثالثاً: خطة التدخل العاجل لشعب الصف الثاني عشر (الأولوية القصوى)</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>الشعبة المستهدفة</th>
            <th class="text-center">نسبة الحل الحالية</th>
            <th class="text-center">التسليمات</th>
            <th class="text-center">المستهدف للحل</th>
            <th class="text-center">مستهدف التصحيح</th>
            <th>الإجراء التنفيذي المباشر</th>
          </tr>
        </thead>
        <tbody>
          ${grade12Sections.map(s => `
            <tr>
              <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section} (${s.grade})</td>
              <td class="text-center" style="font-weight: 900; color: #991B1B;">${s.solveRate}%</td>
              <td class="text-center">${s.submissions}</td>
              <td class="text-center" style="font-weight: 900; color: #166534;">85% فما فوق</td>
              <td class="text-center" style="font-weight: 900; color: #0284C7;">100% بدون معلقات</td>
              <td style="font-size: 8.5px; color: #1E293B;">
                حصر الطلاب غير المسلمين والتنسيق مع معلم <strong>${s.weakestEvalSubject}</strong> وتخصيص حصة للمتابعة.
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`التقرير الشهري الشامل لتحليل الشعب والمواد (A3) - ${monthName}`, content);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. تقرير تحليل الشعب الدراسية الـ 19 (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printSectionsReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;
  const sortedSections = [...SECTIONS_LMS_STATS].sort((a, b) => a.rank - b.rank);
  const topSections = sortedSections.slice(0, 5);
  const bottomSections = sortedSections.slice(-5).reverse();

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">التقرير التحليلي الشامل لأداء الشعب الدراسية الـ 19 (نظام قطر للتعليم)</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>الفترة: <strong>شهر ${monthName}</strong></div>
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>كود التقرير: <strong>QES-REP-SECTIONS-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>تاريخ الاعتماد: <strong>27 سبتمبر 2026</strong></div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="border-top: 3px solid #0F2044;">
        <div class="kpi-title">إجمالي الشعب</div>
        <div class="kpi-val" style="color: #0F2044;">19 شعبة</div>
        <div class="kpi-sub">الصفوف (7، 9، 10، 11، 12)</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #10B981;">
        <div class="kpi-title">أعلى شعبة إنجازاً</div>
        <div class="kpi-val" style="color: #10B981;">92.3%</div>
        <div class="kpi-sub">شعبة 10-1 (المتصدرة)</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #0284C7;">
        <div class="kpi-title">الشعب المتميزة</div>
        <div class="kpi-val" style="color: #0284C7;">5 شعب</div>
        <div class="kpi-sub">نسبة حل تفوق 80%</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #DC2626;">
        <div class="kpi-title">الشعب ذات الأولوية بالدعم</div>
        <div class="kpi-val" style="color: #DC2626;">5 شعب</div>
        <div class="kpi-sub">شعب الصف الثاني عشر</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #7C3AED;">
        <div class="kpi-title">معدل الحل العام للشعب</div>
        <div class="kpi-val" style="color: #7C3AED;">66.7%</div>
        <div class="kpi-sub">2,440 تسليماً</div>
      </div>
    </div>

    <!-- Highlights Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
      <!-- Top 5 -->
      <div>
        <div class="section-title" style="border-right-color: #10B981;">
          <span>🥇 الخمس شعب الأوائل في نسب حل التقييمات</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25px;">م</th>
              <th>الشعبة</th>
              <th>الصف</th>
              <th class="text-center">الطلاب</th>
              <th class="text-center">التسليمات</th>
              <th class="text-center">نسبة الحل</th>
              <th class="text-center">التصنيف</th>
            </tr>
          </thead>
          <tbody>
            ${topSections.map(s => `
              <tr>
                <td class="text-center" style="font-weight: 800;">#${s.rank}</td>
                <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section}</td>
                <td>${s.grade}</td>
                <td class="text-center">${s.studentsCount}</td>
                <td class="text-center">${s.submissions}</td>
                <td class="text-center" style="font-weight: 900; color: #166534;">${s.solveRate}%</td>
                <td class="text-center"><span class="badge badge-excellent">${s.evalClass}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Bottom 5 -->
      <div>
        <div class="section-title" style="border-right-color: #DC2626;">
          <span>⚠️ الشعب التي تحتاج لتدخل سريع ومتابعة ميدانية</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 25px;">م</th>
              <th>الشعبة</th>
              <th>الصف</th>
              <th class="text-center">الطلاب</th>
              <th class="text-center">التسليمات</th>
              <th class="text-center">نسبة الحل</th>
              <th>المادة الأضعف حلًا</th>
            </tr>
          </thead>
          <tbody>
            ${bottomSections.map(s => `
              <tr>
                <td class="text-center" style="font-weight: 800;">#${s.rank}</td>
                <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section}</td>
                <td>${s.grade}</td>
                <td class="text-center">${s.studentsCount}</td>
                <td class="text-center">${s.submissions}</td>
                <td class="text-center" style="font-weight: 900; color: #991B1B;">${s.solveRate}%</td>
                <td style="font-size: 8.5px; color: #7F1D1D; font-weight: 700;">${s.weakestEvalSubject}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Full 19 Sections Table -->
    <div class="section-title" style="border-right-color: #0F2044;">
      <span>📋 الكشف الكامل للشعب الـ 19 بجميع مؤشرات التقييمات والدروس والتصحيح</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">الترتيب</th>
          <th>الشعبة</th>
          <th>الصف الدراسي</th>
          <th class="text-center">الطلاب</th>
          <th class="text-center">مواد التقييم</th>
          <th class="text-center">التقييمات</th>
          <th class="text-center">التسليمات</th>
          <th class="text-center">نسبة الحل</th>
          <th class="text-center">نسبة التصحيح</th>
          <th class="text-center">المعلقات</th>
          <th class="text-center">الدروس المرئية</th>
          <th class="text-center">نسبة الظهور</th>
          <th>المادة الأضعف بالتقييمات</th>
          <th class="text-center">التصنيف الإداري</th>
        </tr>
      </thead>
      <tbody>
        ${sortedSections.map(s => `
          <tr>
            <td class="text-center" style="font-weight: 800; color: ${s.rank <= 3 ? '#D97706' : '#64748B'};">
              ${s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : `#${s.rank}`}
            </td>
            <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section}</td>
            <td>${s.grade}</td>
            <td class="text-center">${s.studentsCount}</td>
            <td class="text-center">${s.evalSubjectsCount}</td>
            <td class="text-center">${s.evalCount}</td>
            <td class="text-center" style="font-weight: 800;">${s.submissions}</td>
            <td class="text-center" style="font-weight: 900; color: ${s.solveRate >= 75 ? '#166534' : s.solveRate >= 60 ? '#0284C7' : '#991B1B'};">
              ${s.solveRate}%
            </td>
            <td class="text-center" style="font-weight: 800;">${s.gradingRate}%</td>
            <td class="text-center" style="font-weight: 800; color: ${s.ungraded > 0 ? '#DC2626' : '#166534'};">${s.ungraded}</td>
            <td class="text-center">${s.lessonVisible} / ${s.lessonTotal}</td>
            <td class="text-center">${s.lessonVisiblePercent}%</td>
            <td style="font-size: 8.5px; color: ${s.solveRate < 60 ? '#7F1D1D' : '#475569'};">${s.weakestEvalSubject}</td>
            <td class="text-center">
              <span class="badge ${s.solveRate >= 75 ? 'badge-excellent' : s.solveRate >= 60 ? 'badge-good' : s.solveRate >= 45 ? 'badge-warning' : 'badge-critical'}">
                ${s.evalClass}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`تقرير تحليل الشعب الدراسية الـ 19 (A3) - ${monthName}`, content);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. تقرير تحليل المواد الدراسية الـ 18 (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printSubjectsReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">التقرير التحليلي الشامل لأداء المواد الدراسية الـ 18 (نظام قطر للتعليم)</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>الفترة: <strong>شهر ${monthName}</strong></div>
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>كود التقرير: <strong>QES-REP-SUBJECTS-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>تاريخ الاعتماد: <strong>27 سبتمبر 2026</strong></div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="border-top: 3px solid #0284C7;">
        <div class="kpi-title">إجمالي المواد المرصودة</div>
        <div class="kpi-val" style="color: #0284C7;">18 مادة</div>
        <div class="kpi-sub">تخصصية وأكاديمية</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #10B981;">
        <div class="kpi-title">أعلى المواد نسبة حل</div>
        <div class="kpi-val" style="color: #10B981;">الأحياء (88.5%)</div>
        <div class="kpi-sub">تليها مادة STEM (86.3%)</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #7C3AED;">
        <div class="kpi-title">المواد ذات التصحيح الكامل</div>
        <div class="kpi-val" style="color: #7C3AED;">100%</div>
        <div class="kpi-sub">التربية البدنية والفنون</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #D97706;">
        <div class="kpi-title">المواد ذات الأولوية بالدعم</div>
        <div class="kpi-val" style="color: #D97706;">3 مواد</div>
        <div class="kpi-sub">نسبة حل أقل من 60%</div>
      </div>
    </div>

    <!-- Full 18 Subjects Table -->
    <div class="section-title" style="border-right-color: #0284C7;">
      <span>📚 الكشف التفصيلي لمؤشرات المواد الدراسية الـ 18 عبر نظام قطر للتعليم</span>
      <span style="font-size: 9px; color: #64748B;">بيانات تفاعلية كاملة مع نسب التصحيح وظهور الدروس</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">م</th>
          <th>المادة الدراسية</th>
          <th class="text-center">المعلمون</th>
          <th class="text-center">سجلات التقييم</th>
          <th class="text-center">التقييمات</th>
          <th class="text-center">التسليمات</th>
          <th class="text-center">نسبة الحل</th>
          <th class="text-center">نسبة التصحيح</th>
          <th class="text-center">المعلقات</th>
          <th class="text-center">الدروس (مرئي / كلي)</th>
          <th class="text-center">نسبة ظهور الدروس</th>
          <th class="text-center">التصنيف</th>
          <th>التوصية الأكاديمية والتوجيه الميداني</th>
        </tr>
      </thead>
      <tbody>
        ${SUBJECTS_LMS_STATS.map((sub, idx) => `
          <tr>
            <td class="text-center" style="font-weight: 800;">${idx + 1}</td>
            <td style="font-weight: 900; color: #0F2044;">${sub.name}</td>
            <td class="text-center">${sub.teachersCount}</td>
            <td class="text-center">${sub.evalRecords}</td>
            <td class="text-center">${sub.evalsCount}</td>
            <td class="text-center" style="font-weight: 800;">${sub.submissions}</td>
            <td class="text-center" style="font-weight: 900; color: ${sub.solveRate >= 75 ? '#166534' : sub.solveRate >= 60 ? '#0284C7' : '#991B1B'};">
              ${sub.solveRate}%
            </td>
            <td class="text-center" style="font-weight: 800;">${sub.gradingRate}%</td>
            <td class="text-center" style="font-weight: 800; color: ${sub.ungraded > 0 ? '#DC2626' : '#166534'};">${sub.ungraded}</td>
            <td class="text-center">${sub.lessonVisible} / ${sub.lessonTotal}</td>
            <td class="text-center">${sub.lessonVisibilityRate}%</td>
            <td class="text-center">
              <span class="badge ${sub.solveRate >= 75 ? 'badge-excellent' : sub.solveRate >= 60 ? 'badge-good' : 'badge-warning'}">
                ${sub.solveRate >= 75 ? 'متميز 🌟' : sub.solveRate >= 60 ? 'مستقر 👍' : 'يحتاج دعم ⚠️'}
              </span>
            </td>
            <td style="font-size: 8.5px; color: #475569;">
              ${sub.solveRate < 60 ? 'تفعيل الإسناد الفوري وحصر الطلاب المتأخرين بالتعاون مع المنسق' : 'المحافظة على وتيرة رفع التقييمات الأسبوعية والتصحيح المنتظم'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`تقرير تحليل المواد الدراسية الـ 18 (A3) - ${monthName}`, content);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. تقرير مقارنة الصفوف والمراحل الدراسية (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printGradesReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">التقرير التحليلي المقارن للصفوف والمراحل الدراسية (نظام قطر للتعليم)</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>الفترة: <strong>شهر ${monthName}</strong></div>
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>كود التقرير: <strong>QES-REP-GRADES-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>تاريخ الاعتماد: <strong>27 سبتمبر 2026</strong></div>
    </div>

    <!-- 5 Grade Cards Grid -->
    <div class="kpi-grid" style="grid-template-columns: repeat(5, 1fr);">
      ${GRADE_LEVEL_LMS_STATS.map(g => `
        <div class="kpi-card" style="border-top: 3px solid ${g.solveRate >= 70 ? '#10B981' : g.solveRate >= 50 ? '#0284C7' : '#DC2626'};">
          <div class="kpi-title" style="font-size: 11px; font-weight: 900; color: #0F2044;">${g.grade}</div>
          <div class="kpi-val" style="color: ${g.solveRate >= 70 ? '#166534' : g.solveRate >= 50 ? '#0284C7' : '#991B1B'};">${g.solveRate}% حل</div>
          <div class="kpi-sub">${g.sectionsCount} شعب · ${g.submissions} تسليماً</div>
          <div style="margin-top: 4px; font-size: 8.5px; color: #475569;">تصحيح: <strong>${g.gradingRate}%</strong></div>
        </div>
      `).join('')}
    </div>

    <!-- Detailed Grade Comparison Matrix -->
    <div class="section-title" style="border-right-color: #0F2044;">
      <span>📊 المقارنة المعيارية الشاملة لمؤشرات الصفوف الخمسة (السابع، التاسع، العاشر، الحادي عشر، الثاني عشر)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">م</th>
          <th>الصف الدراسي</th>
          <th class="text-center">الشعب</th>
          <th class="text-center">المعلمون</th>
          <th class="text-center">سجلات التقييم</th>
          <th class="text-center">إجمالي التقييمات</th>
          <th class="text-center">التسليمات المحلولة</th>
          <th class="text-center">نسبة الحل المرجحة</th>
          <th class="text-center">نسبة التصحيح</th>
          <th class="text-center">التسليمات المعلقة</th>
          <th class="text-center">الدروس (مرئي / كلي)</th>
          <th class="text-center">نسبة ظهور الدروس</th>
          <th>التشخيص والتوجيهات الأكاديمية</th>
        </tr>
      </thead>
      <tbody>
        ${GRADE_LEVEL_LMS_STATS.map((g, idx) => `
          <tr>
            <td class="text-center" style="font-weight: 800;">${idx + 1}</td>
            <td style="font-weight: 900; color: #0F2044; font-size: 11px;">${g.grade}</td>
            <td class="text-center font-bold">${g.sectionsCount} شعب</td>
            <td class="text-center">${g.evalTeachers} معلم</td>
            <td class="text-center">${g.evalRecords}</td>
            <td class="text-center">${g.evalsCount}</td>
            <td class="text-center" style="font-weight: 900;">${g.submissions}</td>
            <td class="text-center" style="font-weight: 900; color: ${g.solveRate >= 70 ? '#166534' : g.solveRate >= 50 ? '#0284C7' : '#991B1B'}; font-size: 11px;">
              ${g.solveRate}%
            </td>
            <td class="text-center font-bold">${g.gradingRate}%</td>
            <td class="text-center" style="font-weight: 800; color: ${g.ungraded > 0 ? '#DC2626' : '#166534'};">${g.ungraded}</td>
            <td class="text-center">${g.visibleLessons} / ${g.totalLessons}</td>
            <td class="text-center">${g.lessonVisibilityRate}%</td>
            <td style="font-size: 8.5px; color: ${g.grade.includes('الثاني عشر') ? '#991B1B; font-weight: 800;' : '#475569;'}">
              ${g.grade.includes('الثاني عشر') ? '⚠️ أولوية قصوى: تدني نسبة الحل (43.3%) مع وجود 78 تسليماً معلقاً يتطلب تدخلاً ميدانياً' : 'أداء أكاديمي مستقر مع استمرار تعزيز تسليمات الواجبات الأسبوعية'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`تقرير مقارنة الصفوف والمراحل الدراسية (A3) - ${monthName}`, content);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. تقرير مصفوفة الرصد البصري والشعب والمواد (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printMatrixReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">مصفوفة الرصد البصري والتقاطع الأكاديمي للشعب والمواد (Heatmap Matrix)</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>الفترة: <strong>شهر ${monthName}</strong></div>
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>كود التقرير: <strong>QES-REP-MATRIX-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>تاريخ الاعتماد: <strong>27 سبتمبر 2026</strong></div>
    </div>

    <!-- Legend -->
    <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 9.5px; background: #F8FAFC; padding: 6px 12px; border-radius: 6px; border: 1px solid #E2E8F0;">
      <span style="font-weight: 800; color: #0F2044;">دلالات الألوان في المصفوفة:</span>
      <span style="color: #166534; font-weight: 800;">🟢 أخضر: نسبة حل متميزة (≥ 75%)</span>
      <span style="color: #0369A1; font-weight: 800;">🔵 أزرق: أداء مستقر وجيد (60% - 74%)</span>
      <span style="color: #B45309; font-weight: 800;">🟡 أصفر: أداء متوسط بحاجة لمتابعة (45% - 59%)</span>
      <span style="color: #991B1B; font-weight: 800;">🔴 أحمر: أداء متدنٍ وبحاجة لتدخل عاجل (&lt; 45%)</span>
    </div>

    <!-- Matrix Cards Grid for A3 Landscape Printout -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
      ${SECTIONS_LMS_STATS.map(s => {
        const isGrade12 = s.grade === 'الصف 12';
        return `
          <div style="background: ${isGrade12 ? '#FFF5F5' : '#FFFFFF'}; border: 1.5px solid ${isGrade12 ? '#FCA5A5' : '#CBD5E1'}; border-radius: 8px; padding: 7px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #0F2044; font-size: 11px;">شعبة ${s.section}</strong>
              <span class="badge ${s.solveRate >= 75 ? 'badge-excellent' : s.solveRate >= 60 ? 'badge-good' : s.solveRate >= 45 ? 'badge-warning' : 'badge-critical'}" style="font-size: 10px;">
                ${s.solveRate}%
              </span>
            </div>
            <div style="font-size: 8.5px; color: #64748B; margin-bottom: 4px;">
              ${s.grade} · ${s.studentsCount} طلاب · تسليمات: <strong>${s.submissions}</strong>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; margin-bottom: 4px;">
              <div style="font-size: 7.5px; color: #94A3B8;">المادة الأضعف حلًا:</div>
              <strong style="font-size: 8.5px; color: #B91C1C;">${s.weakestEvalSubject}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; color: #475569;">
              <span>تصحيح: <strong>${s.gradingRate}%</strong></span>
              <span>معلق: <strong style="color: ${s.ungraded > 0 ? '#DC2626' : '#166534'}">${s.ungraded}</strong></span>
              <span>دروس: <strong>${s.lessonVisiblePercent}%</strong></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`مصفوفة الرصد البصري والشعب والمواد (A3) - ${monthName}`, content);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. تقرير خطة التدخل العاجل لشعب الصف الثاني عشر (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printActionPlanReport(options: PrintReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;
  const grade12Sections = SECTIONS_LMS_STATS.filter(s => s.grade === 'الصف 12');

  const content = `
    <!-- Header (Centered & Organized) -->
    <div class="official-header">
      <div class="header-logos">
        <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
        <div class="header-logos-divider"></div>
        <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
      </div>
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">التقرير التنفيذي لخطة التدخل الميداني العاجل لطلبة الصف الثاني عشر</div>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>المرحلة المستهدفة: <strong>الصف الثاني عشر (بكافة شعبه)</strong></div>
      <div>الفترة: <strong>شهر ${monthName} — خطة معالجة لشهر أكتوبر 2026</strong></div>
      <div>كود التقرير: <strong>QES-REP-ACTIONPLAN-A3</strong></div>
      <div>المقاس: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>حالة الاعتماد: <strong>تدخل إداري عاجل</strong></div>
    </div>

    <!-- Diagnostic Banner -->
    <div style="background: #FFF5F5; border: 2px solid #EF4444; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; color: #7F1D1D;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 16px;">🚨</span>
        <strong style="font-size: 12px; color: #991B1B;">التشخيص الميداني لحالة الصف الثاني عشر (27 سبتمبر 2026):</strong>
      </div>
      <p style="font-size: 9.5px; line-height: 1.5; margin: 0; color: #991B1B;">
        تُظهر المؤشرات تدنياً حاداً في تفاعل طلبة الثاني عشر حيث بلغت نسبة الحل <strong>43.3% فقط</strong> وإجمالي التسليمات <strong>141 تسليماً فقط</strong> مقابل 731 تسليماً بالصف العاشر و 653 بالصف التاسع، مع وجود <strong>78 تسليماً معلقاً</strong> لدى المعلمين دون تصحيح بنسبة إنجاز 44.7%، واختفاء <strong>293 درساً</strong> (63.6% من الدروس غير مرئية للطلبة).
      </p>
    </div>

    <!-- 4 Action Pillars Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;">
      <div style="background: #fff; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px 10px;">
        <strong style="font-size: 10px; color: #0F2044; display: block; margin-bottom: 4px;">1️⃣ التواصل المباشر مع أولياء الأمور</strong>
        <p style="font-size: 8.5px; color: #475569; line-height: 1.4; margin: 0;">
          تفعيل خدمة الرسائل النصية القصيرة (SMS) وإرسال تنبيهات للطلبة المتأخرين في حل تقييمات مواد التربية الإسلامية واللغة الإنجليزية والفيزياء والتاريخ.
        </p>
      </div>

      <div style="background: #fff; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px 10px;">
        <strong style="font-size: 10px; color: #0F2044; display: block; margin-bottom: 4px;">2️⃣ إلزام المعلمين بتصفير المعلقات</strong>
        <p style="font-size: 8.5px; color: #475569; line-height: 1.4; margin: 0;">
          متابعة المعلمين لتصحيح الـ 78 تسليماً المعلقة فوراً، وإظهار الدروس الخفية الـ 293 لتكون متاحة للطلبة للاستذكار والاستعداد لاختبارات منتصف الفصل.
        </p>
      </div>

      <div style="background: #fff; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px 10px;">
        <strong style="font-size: 10px; color: #0F2044; display: block; margin-bottom: 4px;">3️⃣ جلسات توجيه وإرشاد أكاديمي</strong>
        <p style="font-size: 8.5px; color: #475569; line-height: 1.4; margin: 0;">
          عقد لقاءات توجيهية لشعب الثاني عشر والتأكيد على احتساب التفاعل والحل بالمنصة كجزء رئيسي من درجات أعمال الفصل والتقييم المستمر.
        </p>
      </div>
    </div>

    <!-- Target Comparison Table -->
    <div class="section-title" style="border-right-color: #DC2626;">
      <span>🎯 مصفوفة مقارنة الوضع الحالي والمستهدف لشعب الصف الثاني عشر لشهر أكتوبر 2026</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>الشعبة</th>
          <th class="text-center">نسبة الحل الحالية</th>
          <th class="text-center">التسليمات الحالية</th>
          <th class="text-center">نسبة التصحيح الحالية</th>
          <th class="text-center">نسبة الحل المستهدفة</th>
          <th class="text-center">معدل التصحيح المطلوب</th>
          <th>المادة الأضعف حلًا</th>
          <th>الإجراء التنفيذي المباشر والمسؤولية</th>
        </tr>
      </thead>
      <tbody>
        ${grade12Sections.map(s => `
          <tr>
            <td style="font-weight: 900; color: #0F2044; font-size: 10.5px;">شعبة ${s.section}</td>
            <td class="text-center" style="font-weight: 900; color: #DC2626; font-size: 11px;">${s.solveRate}%</td>
            <td class="text-center font-bold">${s.submissions}</td>
            <td class="text-center font-bold">${s.gradingRate}%</td>
            <td class="text-center" style="font-weight: 900; color: #166534; font-size: 11px;">85% فما فوق</td>
            <td class="text-center" style="font-weight: 900; color: #0284C7; font-size: 11px;">100% بدون معلقات</td>
            <td style="font-size: 9px; color: #B91C1C; font-weight: 800;">${s.weakestEvalSubject}</td>
            <td style="font-size: 8.5px; color: #1E293B;">
              حصر أسماء المتغيبين، متابعة معلم المادة، وإلزام الطلاب بحل التقييمات في المختبر المدرسي.
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${COMMON_SIGNATURES_HTML}
  `;

  openA3PrintWindow(`خطة التدخل العاجل لشعب الصف الثاني عشر (A3) - ${monthName}`, content);
}
