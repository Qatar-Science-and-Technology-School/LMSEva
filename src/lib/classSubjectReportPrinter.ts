import {
  SEPTEMBER_2026_LMS_METRICS,
  GRADE_LEVEL_LMS_STATS,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
} from './data';

interface PrintClassSubjectReportOptions {
  monthName?: string;
  academicYear?: string;
}

export function printClassSubjectMonthlyReport(options: PrintClassSubjectReportOptions = {}) {
  const { monthName = 'سبتمبر 2026', academicYear = '2026-2027' } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير الشهري الشامل.');
    return;
  }

  // Sorted sections
  const sortedSections = [...SECTIONS_LMS_STATS].sort((a, b) => a.rank - b.rank);
  const topSections = sortedSections.slice(0, 5);
  const bottomSections = sortedSections.slice(-5).reverse();

  // Grade 12 Sections for action plan
  const grade12Sections = sortedSections.filter(s => s.grade.includes('الثاني عشر'));

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>التقرير الشهري الشامل لتحليل الشعب والمواد - ${monthName} ${academicYear}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }

          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ffffff;
            color: #1E293B;
            direction: rtl;
            font-size: 10.5px;
            line-height: 1.4;
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

          /* Official Header */
          .official-header {
            display: flex;
            justifyContent: space-between;
            align-items: center;
            border-bottom: 2.5px solid #0F2044;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }

          .header-logo {
            height: 60px;
            object-fit: contain;
          }

          .header-text {
            text-align: center;
          }

          .header-text .country-title {
            font-size: 11px;
            font-weight: 800;
            color: #0F2044;
            margin-bottom: 2px;
          }

          .header-text .school-title {
            font-size: 14px;
            font-weight: 900;
            color: #0F2044;
            letter-spacing: -0.2px;
          }

          .header-text .dept-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0096C7;
          }

          .header-text .doc-title {
            font-size: 12px;
            font-weight: 900;
            color: #0F2044;
            background: #F1F5F9;
            padding: 3px 12px;
            border-radius: 999px;
            display: inline-block;
            margin-top: 4px;
            border: 1px solid #CBD5E1;
          }

          .meta-bar {
            display: flex;
            justifyContent: space-between;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 9.5px;
            margin-bottom: 10px;
            color: #475569;
          }

          .meta-bar strong {
            color: #0F2044;
          }

          /* KPI Grid */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }

          .kpi-card {
            background: #fff;
            border: 1.5px solid #E2E8F0;
            border-radius: 6px;
            padding: 6px 4px;
            text-align: center;
          }

          .kpi-title {
            font-size: 8.5px;
            color: #64748B;
            font-weight: 700;
            margin-bottom: 2px;
          }

          .kpi-val {
            font-size: 13px;
            font-weight: 900;
            line-height: 1.1;
          }

          .kpi-sub {
            font-size: 7.5px;
            color: #94A3B8;
            margin-top: 2px;
          }

          /* Section Titles */
          .section-title {
            font-size: 11px;
            font-weight: 900;
            color: #0F2044;
            background: linear-gradient(90deg, #F1F5F9 0%, #FFFFFF 100%);
            border-right: 4px solid #0096C7;
            padding: 4px 8px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justifyContent: space-between;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 10px;
          }

          th {
            background: #0F2044;
            color: #ffffff;
            font-weight: 800;
            padding: 4px 5px;
            text-align: right;
            border: 1px solid #0F2044;
            white-space: nowrap;
          }

          th.text-center, td.text-center {
            text-align: center;
          }

          td {
            padding: 3.5px 5px;
            border: 1px solid #CBD5E1;
            vertical-align: middle;
          }

          tr:nth-child(even) {
            background-color: #F8FAFC;
          }

          /* Badges */
          .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 8px;
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
            padding: 8px 6px;
          }

          .sig-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #0F2044;
            margin-bottom: 2px;
          }

          .sig-name {
            font-size: 10px;
            font-weight: 900;
            color: #0F2044;
            margin-bottom: 4px;
          }

          .sig-img-container {
            height: 44px;
            display: flex;
            align-items: center;
            justifyContent: center;
          }

          .sig-img {
            max-height: 42px;
            max-width: 130px;
            object-fit: contain;
          }

          .school-stamp-box {
            height: 42px;
            border: 1.5px dashed #94A3B8;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            font-size: 8.5px;
            font-weight: 700;
          }

          .footer-note {
            margin-top: 8px;
            font-size: 8px;
            color: #94A3B8;
            text-align: center;
          }
        </style>
      </head>
      <body>

        <!-- ══════════════════════════════════════════════════════════
             PAGE 1: الغلاف والملخص التنفيذي ومؤشرات المراحل والشعب المتميزة
        ══════════════════════════════════════════════════════════ -->
        <div class="avoid-break">
          <!-- Official Letterhead -->
          <div class="official-header">
            <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
            <div class="header-text">
              <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
              <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
              <div class="dept-title">قسم التعليم الإلكتروني والحلول الرقمية</div>
              <div class="doc-title">التقرير الشهري الشامل لتحليل الشعب والمواد الدراسية (QES)</div>
            </div>
            <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
          </div>

          <!-- Metadata Bar -->
          <div class="meta-bar">
            <div>الفترة: <strong>شهر ${monthName}</strong></div>
            <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
            <div>تاريخ الاعتماد: <strong>27 سبتمبر 2026</strong></div>
            <div>كود التقرير: <strong>QES-SEC-SUB-2026-09</strong></div>
          </div>

          <!-- KPI Summary Cards -->
          <div class="kpi-grid">
            <div class="kpi-card" style="border-top: 3px solid #0F2044;">
              <div class="kpi-title">إجمالي الشعب</div>
              <div class="kpi-val" style="color: #0F2044;">${SEPTEMBER_2026_LMS_METRICS.totalSections} شعبة</div>
              <div class="kpi-sub">صفوف (7، 9، 10، 11، 12)</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #0284C7;">
              <div class="kpi-title">المواد المرصودة</div>
              <div class="kpi-val" style="color: #0284C7;">${SEPTEMBER_2026_LMS_METRICS.totalSubjects} مادة</div>
              <div class="kpi-sub">تخصصية ومختبرات</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #10B981;">
              <div class="kpi-title">التسليمات المحلولة</div>
              <div class="kpi-val" style="color: #10B981;">${SEPTEMBER_2026_LMS_METRICS.totalSubmissions.toLocaleString('ar-QA')}</div>
              <div class="kpi-sub">حل التقييمات</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #0D9488;">
              <div class="kpi-title">نسبة حل التقييمات</div>
              <div class="kpi-val" style="color: #0D9488;">${SEPTEMBER_2026_LMS_METRICS.weightedSolveRate}%</div>
              <div class="kpi-sub">معدل عام للشعب</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #7C3AED;">
              <div class="kpi-title">إنجاز التصحيح</div>
              <div class="kpi-val" style="color: #7C3AED;">${SEPTEMBER_2026_LMS_METRICS.gradingRate}%</div>
              <div class="kpi-sub">${SEPTEMBER_2026_LMS_METRICS.gradedSubmissions} مصححاً</div>
            </div>
            <div class="kpi-card" style="border-top: 3px solid #D97706;">
              <div class="kpi-title">تفعيل الدروس</div>
              <div class="kpi-val" style="color: #D97706;">${SEPTEMBER_2026_LMS_METRICS.lessonsVisiblePercent}%</div>
              <div class="kpi-sub">${SEPTEMBER_2026_LMS_METRICS.lessonsVisible} من ${SEPTEMBER_2026_LMS_METRICS.totalLessons}</div>
            </div>
          </div>

          <!-- Section 1: مؤشرات الصفوف والمراحل الدراسية -->
          <div class="section-title">
            <span>🏫 أولاً: تحليل مؤشرات التفاعل حسب الصفوف والمراحل الدراسية</span>
            <span style="font-size: 8.5px; color: #64748B;">مقارنة شاملة بين الصفوف الخمسة</span>
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
                <th>الحالة والملاحظات التوجيهية</th>
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

          <!-- Two-column Top & Bottom Highlights -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
            <!-- Top 5 -->
            <div>
              <div class="section-title" style="border-right-color: #10B981;">
                <span>🥇 أعلى 5 شعب أداءً في حل التقييمات</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th class="text-center" style="width: 25px;">م</th>
                    <th>الشعبة</th>
                    <th>الصف</th>
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
                      <td class="text-center" style="font-weight: 900; color: #166534;">${s.solveRate}%</td>
                      <td class="text-center"><span class="badge badge-excellent">${s.evalClass}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Bottom 5 -->
            <div>
              <div class="section-title" style="border-right-color: #EF4444;">
                <span>⚠️ الشعب ذات الأولوية بالدعم والمتابعة</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th class="text-center" style="width: 25px;">م</th>
                    <th>الشعبة</th>
                    <th>الصف</th>
                    <th class="text-center">نسبة الحل</th>
                    <th>المادة الأضعف</th>
                  </tr>
                </thead>
                <tbody>
                  ${bottomSections.map(s => `
                    <tr>
                      <td class="text-center" style="font-weight: 800;">#${s.rank}</td>
                      <td style="font-weight: 900; color: #0F2044;">شعبة ${s.section}</td>
                      <td>${s.grade}</td>
                      <td class="text-center" style="font-weight: 900; color: #991B1B;">${s.solveRate}%</td>
                      <td style="font-size: 8px; color: #7F1D1D;">${s.weakestEvalSubject}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             PAGE 2: الكشف الشامل لترتيب الشعب الـ 19 كاملة
        ══════════════════════════════════════════════════════════ -->
        <div class="page-break avoid-break">
          <div class="section-title" style="border-right-color: #0F2044;">
            <span>📋 ثانياً: الكشف التقييمي الشامل للشعب الدراسية الـ 19 مرتبة حسب نسبة الحل</span>
            <span style="font-size: 8.5px; color: #64748B;">بيانات رسمية معتمدة من نظام قطر للتعليم</span>
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
                  <td style="font-size: 8px; color: ${s.solveRate < 60 ? '#7F1D1D' : '#475569'};">${s.weakestEvalSubject}</td>
                  <td class="text-center">
                    <span class="badge ${s.solveRate >= 75 ? 'badge-excellent' : s.solveRate >= 60 ? 'badge-good' : s.solveRate >= 45 ? 'badge-warning' : 'badge-critical'}">
                      ${s.evalClass}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             PAGE 3: تشخيص المواد الـ 18 + خطة التدخل + الاعتمادات الرسمية
        ══════════════════════════════════════════════════════════ -->
        <div class="page-break avoid-break">
          <div class="section-title" style="border-right-color: #0284C7;">
            <span>📚 ثالثاً: تحليل مؤشرات المواد الدراسية الـ 18</span>
            <span style="font-size: 8.5px; color: #64748B;">معدلات التسليم والتصحيح والتصنيف الأكاديمي</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="text-center">م</th>
                <th>المادة الدراسية</th>
                <th class="text-center" style="width: 70px;">إجمالي التسليمات</th>
                <th class="text-center" style="width: 65px;">نسبة الحل</th>
                <th class="text-center" style="width: 65px;">نسبة التصحيح</th>
                <th class="text-center" style="width: 80px;">التصنيف</th>
                <th>التوجيه الإداري الموصى به</th>
              </tr>
            </thead>
            <tbody>
              ${SUBJECTS_LMS_STATS.map((sub, idx) => `
                <tr>
                  <td class="text-center" style="font-weight: 800;">${idx + 1}</td>
                  <td style="font-weight: 900; color: #0F2044;">${sub.name}</td>
                  <td class="text-center" style="font-weight: 800;">${sub.submissions}</td>
                  <td class="text-center" style="font-weight: 900; color: ${sub.solveRate >= 75 ? '#166534' : sub.solveRate >= 60 ? '#0284C7' : '#991B1B'};">
                    ${sub.solveRate}%
                  </td>
                  <td class="text-center" style="font-weight: 800;">${sub.gradingRate}%</td>
                  <td class="text-center">
                    <span class="badge ${sub.solveRate >= 75 ? 'badge-excellent' : sub.solveRate >= 60 ? 'badge-good' : 'badge-warning'}">
                      ${sub.solveRate >= 75 ? 'متميز' : sub.solveRate >= 60 ? 'مستقر' : 'يحتاج دعم'}
                    </span>
                  </td>
                  <td style="font-size: 8px; color: #475569;">
                    ${sub.solveRate < 60 ? 'تفعيل الإسناد المباشر والمتابعة الحثيثة للطلاب المتأخرين' : 'استمرار وتيرة التقييمات الأسبوعية والتصحيح الفوري'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Grade 12 Intervention Plan -->
          <div style="margin-top: 8px;">
            <div class="section-title" style="border-right-color: #DC2626;">
              <span>🚨 رابعاً: خطة التدخل العاجل لشعب الصف الثاني عشر (الأولوية القصوى)</span>
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
                    <td style="font-size: 8px; color: #1E293B;">
                      حصر الطلاب غير المسلمين والتنسيق مع معلم <strong>${s.weakestEvalSubject}</strong> وتخصيص حصة للمتابعة.
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Official Signatures Block: STRICTLY Principal Name above official signature image -->
          <div class="signatures-container avoid-break">
            <!-- 1. Ahmad -->
            <div class="sig-box">
              <div class="sig-title">إعداد وتدقيق التقرير</div>
              <div class="sig-name">م. أحمد عادل طبيشات</div>
              <div style="font-size: 8px; color: #64748B; margin-bottom: 2px;">منسق المشاريع والتعليم الإلكتروني</div>
              <div class="sig-img-container">
                <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد عادل طبيشات" />
              </div>
            </div>

            <!-- 2. Rani -->
            <div class="sig-box">
              <div class="sig-title">مراجعة واعتماد</div>
              <div class="sig-name">د. راني التوم</div>
              <div style="font-size: 8px; color: #64748B; margin-bottom: 2px;">النائب الأكاديمي للمدرسة</div>
              <div class="sig-img-container">
                <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
              </div>
            </div>

            <!-- 3. School Principal: STRICTLY Mohammad Ali Mandani Al-Emadi with signature UNDERNEATH -->
            <div class="sig-box" style="border: 1.5px solid #0F2044;">
              <div class="sig-title">يعتمد، مدير المدرسة</div>
              <div class="sig-name" style="font-size: 10.5px; color: #0F2044;">محمد علي مندني العمادي</div>
              <div style="font-size: 8px; color: #64748B; margin-bottom: 2px;">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
              <div class="sig-img-container">
                <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة محمد علي مندني العمادي" />
              </div>
            </div>
          </div>

          <div class="footer-note">
            نظام متابعة وتقييم نظام قطر للتعليم والمنصات التعليمية الرقمية (QES) — مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
          </div>
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
