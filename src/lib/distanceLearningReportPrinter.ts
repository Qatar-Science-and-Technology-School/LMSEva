// =============================================================================
// محرك طباعة التقارير الرسمية وإفادات التعلم عن بعد (Distance Learning Print Engine)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني
// معايير الطباعة: A3 / A4 Landscape مع هوامش 0 Margins والترويسة والتوقيعات الرسمية
// =============================================================================

import {
  DistanceLearningRecord,
  TeacherDistanceLesson,
  REASON_CONFIG,
  STATUS_CONFIG,
  sortTeacherDistanceLessons,
} from './distanceLearningData';

interface PrintReportOptions {
  title?: string;
  subtitle?: string;
  academicYear?: string;
  filterLabel?: string;
  reportDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. تقرير شامل لسجلات التعلم عن بعد (Comprehensive Official Report)
// ─────────────────────────────────────────────────────────────────────────────
export function printComprehensiveDistanceLearningReport(
  records: DistanceLearningRecord[],
  options: PrintReportOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const academicYear = options.academicYear || '2026-2027';
  const reportDate = options.reportDate || new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // الإحصاءات السريعة
  const totalRecords = records.length;
  const uniqueStudents = new Set(records.map(r => r.studentName)).size;
  const totalDays = records.reduce((sum, r) => sum + (r.daysCount || 0), 0);
  const medicalCount = records.filter(r => r.reason === 'عذر طبي').length;
  const competitionCount = records.filter(r => r.reason === 'السفر لمسابقة').length;
  const conferenceCount = records.filter(r => r.reason === 'السفر لمؤتمر').length;
  const dlDayCount = records.filter(r => r.reason === 'يوم التعلم عن بعد').length;
  const completedCount = records.filter(r => r.status === 'مكتمل' || r.status === 'معتمد').length;
  const avgCommitment = totalRecords > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.commitmentRate || 95), 0) / totalRecords)
    : 0;

  // إنشاء أسطر الجدول
  const rowsHtml = records.map((rec, idx) => {
    const reasonCfg = REASON_CONFIG[rec.reason] || { label: rec.reason, color: '#334155', bgColor: '#F1F5F9' };
    const statusCfg = STATUS_CONFIG[rec.status] || { label: rec.status, color: '#334155', bgColor: '#F1F5F9' };
    const subjectsStr = Array.isArray(rec.subjects) && rec.subjects.length > 0
      ? rec.subjects.slice(0, 3).join('، ') + (rec.subjects.length > 3 ? ` (+${rec.subjects.length - 3})` : '')
      : 'كافة المواد';

    return `
      <tr>
        <td class="text-center bold">${idx + 1}</td>
        <td class="bold text-primary">${rec.studentName}</td>
        <td class="text-center bold badge-cell">
          <span class="grade-badge">${rec.gradeSection || `${rec.grade} - ${rec.section}`}</span>
        </td>
        <td>
          <div class="event-title">${rec.eventTitle}</div>
          ${rec.reasonDetails ? `<div class="sub-text">${rec.reasonDetails}</div>` : ''}
        </td>
        <td class="text-center">
          <span class="reason-pill" style="background: ${reasonCfg.bgColor}; color: ${reasonCfg.color}; border: 1px solid ${reasonCfg.borderColor || reasonCfg.color}40;">
            ${rec.reason}
          </span>
        </td>
        <td class="text-center font-num">
          ${rec.fromDate} <span class="arrow-sep">←</span> ${rec.toDate}
        </td>
        <td class="text-center bold font-num" style="color: #0F2044; font-size: 10pt;">
          ${rec.daysCount} ${rec.daysCount === 1 ? 'يوم' : 'أيام'}
        </td>
        <td style="font-size: 8pt; color: #475569;">
          ${subjectsStr}
        </td>
        <td class="text-center">
          <span class="status-pill" style="background: ${statusCfg.bgColor}; color: ${statusCfg.color}; border: 1px solid ${statusCfg.borderColor || statusCfg.color}40;">
            ${statusCfg.label}
          </span>
        </td>
        <td class="text-center font-num bold" style="color: ${avgCommitment >= 90 ? '#059669' : '#D97706'};">
          ${rec.commitmentRate || 95}%
        </td>
        <td style="font-size: 8pt; color: #334155;">
          ${rec.notes || 'تم الالتزام بالخطة الدراسية المعتمدة'}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير سجلات ومتابعة التعلم عن بعد - ${academicYear}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
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
            font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: #0F172A;
            direction: rtl;
            padding: 10mm 14mm !important;
            margin: 0 !important;
            font-size: 9pt;
            line-height: 1.45;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Header */
          .official-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2.5px solid #0F2044;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .header-logo-box {
            width: 190px;
            display: flex;
            align-items: center;
          }
          .header-logo {
            height: 68px;
            max-width: 180px;
            object-fit: contain;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 15px;
          }
          .header-banner {
            display: inline-block;
            background: linear-gradient(135deg, #0F2044 0%, #0369A1 100%);
            color: #ffffff;
            padding: 8px 26px;
            border-radius: 8px;
            font-size: 13pt;
            font-weight: 900;
            box-shadow: 0 2px 6px rgba(15,32,68,0.15);
          }
          .header-subinfo {
            margin-top: 6px;
            font-size: 8.5pt;
            color: #475569;
            font-weight: 700;
          }
          /* Summary stats bar */
          .stats-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 6px 14px;
            margin-bottom: 12px;
            font-size: 8.5pt;
            font-weight: 700;
            color: #334155;
            flex-wrap: wrap;
            gap: 6px;
          }
          .stats-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          /* Table */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            border: 1.5px solid #0F2044;
            margin-bottom: 14px;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          th {
            background: #0F2044;
            color: #ffffff;
            padding: 7px 6px;
            font-weight: 800;
            border: 1px solid #1E293B;
            font-size: 8.5pt;
            text-align: right;
          }
          th.text-center, td.text-center {
            text-align: center;
          }
          td {
            border: 1px solid #CBD5E1;
            padding: 6px 6px;
            vertical-align: middle;
            font-size: 8.2pt;
          }
          tr:nth-child(even) td {
            background-color: #F8FAFC;
          }
          .bold {
            font-weight: 800;
          }
          .text-primary {
            color: #0F2044;
          }
          .font-num {
            font-family: inherit;
            direction: ltr;
            display: inline-block;
          }
          .grade-badge {
            display: inline-block;
            background: #0F2044;
            color: #ffffff;
            font-weight: 800;
            font-size: 8pt;
            padding: 2px 7px;
            border-radius: 4px;
          }
          .event-title {
            font-weight: 800;
            color: #1E293B;
            line-height: 1.3;
          }
          .sub-text {
            font-size: 7.5pt;
            color: #64748B;
            margin-top: 2px;
          }
          .reason-pill {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 800;
            white-space: nowrap;
          }
          .status-pill {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 800;
            white-space: nowrap;
          }
          .arrow-sep {
            color: #94A3B8;
            margin: 0 2px;
          }
          /* Signatures Footer */
          .signatures-container {
            margin-top: 14mm;
            padding-top: 8px;
            border-top: 2px solid #0F2044;
            display: flex;
            justifyContent: space-between;
            align-items: flex-start;
            page-break-inside: avoid;
            break-inside: avoid;
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
            font-size: 8.5pt;
            font-weight: 800;
            color: #0F2044;
            border-bottom: 1.5px solid #0F2044;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .sig-name {
            font-size: 8.5pt;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 2px;
          }
          .sig-role {
            font-size: 7.5pt;
            color: #64748B;
            margin-bottom: 3px;
          }
          .sig-img-container {
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sig-img {
            max-height: 40px;
            max-width: 140px;
            object-fit: contain;
          }
          .footer-note {
            margin-top: 8px;
            font-size: 7.5pt;
            color: #94A3B8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="official-header avoid-break">
          <div class="header-logo-box" style="justify-content: flex-start;">
            <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" class="header-logo" />
          </div>
          <div class="header-center">
            <div class="header-banner">
              سجل ومتابعة التعلم عن بعد | العام الأكاديمي: ${academicYear}
            </div>
            <div class="header-subinfo">
              مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — قسم المشاريع والحلول الرقمية والتعليم الإلكتروني
            </div>
          </div>
          <div class="header-logo-box" style="justify-content: flex-end;">
            <img src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" class="header-logo" />
          </div>
        </div>

        <!-- Meta / KPI Bar -->
        <div class="stats-bar avoid-break">
          <span class="stats-pill">📊 إجمالي السجلات: <strong>${totalRecords} حالة</strong></span>
          <span class="stats-pill">👨‍🎓 إجمالي الطلاب: <strong>${uniqueStudents} طالب</strong></span>
          <span class="stats-pill">🗓️ إجمالي أيام التعلم عن بعد: <strong>${totalDays} يوم</strong></span>
          <span class="stats-pill" style="color: #DC2626;">🏥 عذر طبي: <strong>${medicalCount}</strong></span>
          <span class="stats-pill" style="color: #D97706;">🏆 مسابقات: <strong>${competitionCount}</strong></span>
          <span class="stats-pill" style="color: #2563EB;">🌐 مؤتمرات: <strong>${conferenceCount}</strong></span>
          <span class="stats-pill" style="color: #059669;">💻 يوم التعلم عن بعد: <strong>${dlDayCount}</strong></span>
          <span class="stats-pill" style="color: #0F2044;">📈 متوسط الالتزام: <strong>${avgCommitment}%</strong></span>
          <span class="stats-pill" style="color: #64748B;">تاريخ الاستخراج: <strong>${reportDate}</strong></span>
        </div>

        <!-- Official Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="text-center">م.</th>
              <th style="width: 170px;">اسم الطالب</th>
              <th style="width: 75px;" class="text-center">الصف/الشعبة</th>
              <th style="min-width: 250px;">فعالية / موضوع التعلم عن بعد</th>
              <th style="width: 125px;" class="text-center">السبب</th>
              <th style="width: 155px;" class="text-center">الفترة الزمنية</th>
              <th style="width: 75px;" class="text-center">عدد الأيام</th>
              <th style="width: 150px;">المواد المشمولة</th>
              <th style="width: 85px;" class="text-center">الحالة</th>
              <th style="width: 65px;" class="text-center">الالتزام</th>
              <th style="min-width: 180px;">ملاحظات وقرار الاعتماد</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Signatures Footer -->
        <div class="signatures-container avoid-break">
          <!-- 1. Coordinator -->
          <div class="sig-box">
            <div class="sig-title">إعداد وتوثيق السجل</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <div class="sig-role">منسق المشاريع والتعليم الإلكتروني</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد عادل طبيشات" />
            </div>
          </div>

          <!-- 2. Academic Vice Principal -->
          <div class="sig-box">
            <div class="sig-title">مراجعة وتدقيق</div>
            <div class="sig-name">د. راني التوم</div>
            <div class="sig-role">النائب الأكاديمي للمدرسة</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
            </div>
          </div>

          <!-- 3. School Principal -->
          <div class="sig-box" style="border: 1.5px solid #0F2044; background: #FFFFFF;">
            <div class="sig-title">يعتمد، مدير المدرسة</div>
            <div class="sig-name" style="font-size: 9pt; color: #0F2044;">محمد علي مندني العمادي</div>
            <div class="sig-role">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة محمد علي مندني العمادي" />
            </div>
          </div>
        </div>

        <div class="footer-note">
          وثيقة رسمية معتمدة صادرة عن مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — وزارة التربية والتعليم والتعليم العالي
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
  `;

  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    window.print();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. إفادة / تقرير حالة فردي للطالب (Individual Student Certificate)
// ─────────────────────────────────────────────────────────────────────────────
export function printStudentDistanceLearningCertificate(
  record: DistanceLearningRecord,
  options: PrintReportOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const academicYear = options.academicYear || record.academicYear || '2026-2027';
  const reportDate = options.reportDate || new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reasonCfg = REASON_CONFIG[record.reason] || { label: record.reason, color: '#334155', bgColor: '#F1F5F9' };
  const subjectsList = Array.isArray(record.subjects) && record.subjects.length > 0
    ? record.subjects.map(s => `<li>${s}</li>`).join('')
    : '<li>كافة المواد الأكاديمية المقررة بالجدول المدرسي</li>';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>إفادة تعلم عن بعد - ${record.studentName} - ${academicYear}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
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
            margin: 0 !important;
          }
          body {
            font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #0F172A;
            direction: rtl;
            padding: 14mm 16mm !important;
            margin: 0 !important;
            font-size: 10pt;
            line-height: 1.6;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .official-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2.5px solid #0F2044;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .header-logo-box {
            width: 160px;
            display: flex;
            align-items: center;
          }
          .header-logo {
            height: 60px;
            max-width: 150px;
            object-fit: contain;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 10px;
          }
          .header-banner {
            display: inline-block;
            background: linear-gradient(135deg, #0F2044 0%, #0369A1 100%);
            color: #ffffff;
            padding: 6px 20px;
            border-radius: 8px;
            font-size: 13pt;
            font-weight: 900;
          }
          .cert-title {
            text-align: center;
            margin: 15px 0 10px;
            font-size: 15pt;
            font-weight: 900;
            color: #0F2044;
            text-decoration: underline;
            text-underline-offset: 6px;
          }
          .cert-intro {
            font-size: 10.5pt;
            color: #334155;
            margin-bottom: 16px;
            line-height: 1.7;
          }
          .info-card {
            background: #F8FAFC;
            border: 1.5px solid #CBD5E1;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 16px;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 10pt;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            width: 180px;
            font-weight: 800;
            color: #0F2044;
          }
          .info-value {
            flex: 1;
            font-weight: 600;
            color: #1E293B;
          }
          .subjects-box {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            margin: 12px 0;
          }
          .subjects-box ul {
            margin: 5px 20px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }
          /* Signatures Footer */
          .signatures-container {
            margin-top: 20mm;
            padding-top: 12px;
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
            font-size: 8.5pt;
            font-weight: 800;
            color: #0F2044;
            border-bottom: 1.5px solid #0F2044;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .sig-name {
            font-size: 8.5pt;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 2px;
          }
          .sig-role {
            font-size: 7.5pt;
            color: #64748B;
            margin-bottom: 3px;
          }
          .sig-img-container {
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sig-img {
            max-height: 40px;
            max-width: 140px;
            object-fit: contain;
          }
          .footer-note {
            margin-top: 10px;
            font-size: 8pt;
            color: #94A3B8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="official-header avoid-break">
          <div class="header-logo-box" style="justify-content: flex-start;">
            <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" class="header-logo" />
          </div>
          <div class="header-center">
            <div class="header-banner">
              إفادة متابعة تعلم عن بعد معتمدة
            </div>
            <div style="font-size: 8.5pt; color: #475569; font-weight: 700; margin-top: 4px;">
              العام الأكاديمي: ${academicYear}
            </div>
          </div>
          <div class="header-logo-box" style="justify-content: flex-end;">
            <img src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" class="header-logo" />
          </div>
        </div>

        <div class="cert-title">إفادة رسمية بمتابعة حصص ومهام التعلم عن بعد</div>

        <p class="cert-intro">
          تشهد إدارة مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين بأن الطالب الموضح بياناته أدناه قد شارك وانتظم في نظام التعلم عن بعد المعتمد خلال الفترة الزمنية المحددة، وذلك وفق الضوابط واللوائح الأكاديمية الرسمية المعتمدة من وزارة التربية والتعليم والتعليم العالي:
        </p>

        <div class="info-card avoid-break">
          <div class="info-row">
            <div class="info-label">اسم الطالب:</div>
            <div class="info-value" style="font-size: 11pt; color: #0F2044; font-weight: 900;">${record.studentName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">الصف والشعبة:</div>
            <div class="info-value">${record.grade} — الشعبة (${record.section}) [${record.gradeSection}]</div>
          </div>
          <div class="info-row">
            <div class="info-label">فعالية التعلم عن بعد:</div>
            <div class="info-value" style="font-weight: 800;">${record.eventTitle}</div>
          </div>
          <div class="info-row">
            <div class="info-label">سبب التعلم عن بعد:</div>
            <div class="info-value">
              <span style="background: ${reasonCfg.bgColor}; color: ${reasonCfg.color}; padding: 2px 8px; border-radius: 4px; font-weight: 800;">
                ${record.reason}
              </span>
              ${record.reasonDetails ? ` — ${record.reasonDetails}` : ''}
            </div>
          </div>
          <div class="info-row">
            <div class="info-label">فترة التعلم عن بعد:</div>
            <div class="info-value">
              من تاريخ: <strong>${record.fromDate}</strong> إلى تاريخ: <strong>${record.toDate}</strong> (بإجمالي <strong>${record.daysCount}</strong> أيام)
            </div>
          </div>
          <div class="info-row">
            <div class="info-label">المنصة المعتمدة:</div>
            <div class="info-value">${record.platform || 'نظام قطر للتعليم و Microsoft Teams'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">المشرف والمتابع:</div>
            <div class="info-value">${record.supervisor || 'قسم المشاريع والتعليم الإلكتروني'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">نسبة الإنجاز والالتزام:</div>
            <div class="info-value" style="color: #059669; font-weight: 800;">${record.commitmentRate || 95}% (التزام متميز)</div>
          </div>
          <div class="info-row">
            <div class="info-label">حالة السجل:</div>
            <div class="info-value" style="color: #2563EB; font-weight: 800;">${record.status} رسمياً</div>
          </div>
        </div>

        <div class="subjects-box avoid-break">
          <div style="font-weight: 800; color: #0F2044; margin-bottom: 4px;">المواد والمسارات الدراسية التي تمت متابعتها عن بعد:</div>
          <ul>
            ${subjectsList}
          </ul>
        </div>

        ${record.notes ? `
          <div style="background: #F1F5F9; border-right: 4px solid #0F2044; padding: 8px 12px; margin-bottom: 14px; font-size: 9pt;">
            <strong>ملاحظات وتوصيات اللجنة:</strong> ${record.notes}
          </div>
        ` : ''}

        <!-- Signatures Footer -->
        <div class="signatures-container avoid-break">
          <!-- 1. Coordinator -->
          <div class="sig-box">
            <div class="sig-title">إعداد وتوثيق الإفادة</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <div class="sig-role">منسق المشاريع والتعليم الإلكتروني</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد عادل طبيشات" />
            </div>
          </div>

          <!-- 2. Academic Vice Principal -->
          <div class="sig-box">
            <div class="sig-title">مراجعة وتدقيق</div>
            <div class="sig-name">د. راني التوم</div>
            <div class="sig-role">النائب الأكاديمي للمدرسة</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
            </div>
          </div>

          <!-- 3. School Principal -->
          <div class="sig-box" style="border: 1.5px solid #0F2044; background: #FFFFFF;">
            <div class="sig-title">يعتمد، مدير المدرسة</div>
            <div class="sig-name" style="font-size: 9pt; color: #0F2044;">محمد علي مندني العمادي</div>
            <div class="sig-role">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
            <div class="sig-img-container">
              <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة محمد علي مندني العمادي" />
            </div>
          </div>
        </div>

        <div class="footer-note">
          حررت هذه الإفادة بناءً على السجلات الرسمية المعتمدة في ${reportDate} — كود التحقق: DL-QSTSS-${record.id}
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
  `;

  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    window.print();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. طباعة تقرير جدول حصص التعلم عن بعد (روابط Microsoft Teams) لإرساله للطلاب
// ─────────────────────────────────────────────────────────────────────────────
export function printTeacherDistanceLessonsScheduleReport(
  rawLessons: TeacherDistanceLesson[],
  options: {
    title?: string;
    subtitle?: string;
    academicYear?: string;
    filterLabel?: string;
    teacherOnlyName?: string;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const lessons = sortTeacherDistanceLessons(rawLessons);
  const academicYear = options.academicYear || '2026-2027';
  const reportDate = new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalLessons = lessons.length;
  const uniqueTeachers = new Set(lessons.map(l => l.teacherNameAr)).size;
  const uniqueSections = new Set(lessons.map(l => l.gradeSection)).size;
  const uniqueSubjects = new Set(lessons.map(l => l.subject)).size;

  const reportTitle =
    options.title ||
    (options.teacherOnlyName
      ? `جدول حصص التعلم عن بعد (Microsoft Teams) — المعلم: ${options.teacherOnlyName}`
      : 'جدول حصص التعلم عن بعد المعتمد للطلاب (روابط Microsoft Teams)');

  const reportSubtitle =
    options.subtitle ||
    `دليل روابط الحصص التفاعلية المباشرة عبر منصة Microsoft Teams — العام الأكاديمي ${academicYear}${
      options.filterLabel ? ` (${options.filterLabel})` : ''
    }`;

  const rowsHtml = lessons
    .map((l, idx) => {
      const cleanLink = (l.teamsLink || '').trim();
      const statusColor =
        l.status === 'جارية الآن'
          ? { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' }
          : l.status === 'تم التنفيذ'
          ? { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' }
          : l.status === 'ملغاة'
          ? { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }
          : { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };

      return `
      <tr>
        <td class="text-center bold">${idx + 1}</td>
        <td class="text-center">
          <div class="bold" style="color:#0F2044;">${l.dayName || ''}</div>
          <div class="font-num" style="font-size:8pt; color:#64748B;">${l.date || ''}</div>
        </td>
        <td class="text-center">
          <div class="bold" style="color:#0369A1;">${l.period || ''}</div>
          <div class="font-num" style="font-size:8pt; color:#475569;" dir="ltr">${l.startTime || ''} - ${l.endTime || ''}</div>
        </td>
        <td class="text-center">
          <span class="grade-badge">${l.gradeSection || `${l.grade} / ${l.section}`}</span>
        </td>
        <td class="bold" style="color:#0F2044;">${l.subject || '-'}</td>
        <td>
          <div class="bold" style="color:#0F2044;">${l.teacherNameAr || '-'}</div>
          <div style="font-size:7.5pt; color:#64748B;">${l.departmentName || ''}</div>
        </td>
        <td>
          <div class="bold" style="color:#1E293B;">${l.lessonTitle || 'حصة تعلم عن بعد'}</div>
          ${l.studentNotes ? `<div style="font-size:7.5pt; color:#475569; margin-top:2px;">📌 ${l.studentNotes}</div>` : ''}
        </td>
        <td class="text-center" style="min-width:190px;">
          ${
            cleanLink
              ? `<a href="${cleanLink}" target="_blank" rel="noopener noreferrer" class="teams-btn">
                   🎥 انقر هنا للدخول إلى الحصة (Teams)
                 </a>
                 <div class="link-url" dir="ltr">${cleanLink.length > 52 ? cleanLink.slice(0, 52) + '...' : cleanLink}</div>`
              : `<span style="color:#94A3B8; font-size:8pt;">لم يتم إرفاق الرابط</span>`
          }
        </td>
        <td class="text-center">
          <span class="status-pill" style="background:${statusColor.bg}; color:${statusColor.text}; border:1px solid ${statusColor.border};">
            ${l.status || 'مجدولة'}
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${reportTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm !important;
          }
          body {
            font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #0F2044;
            padding: 10px 14px;
            direction: rtl;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0F2044;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .header-center {
            text-align: center;
          }
          .header-center .country { font-size: 10pt; font-weight: 800; color: #0F2044; }
          .header-center .ministry { font-size: 9.5pt; font-weight: 800; color: #475569; }
          .header-center .school { font-size: 12pt; font-weight: 900; color: #0F2044; margin-top: 2px; }
          .header-center .dept { font-size: 8.5pt; font-weight: 700; color: #0284C7; margin-top: 2px; }
          .title-banner {
            background: linear-gradient(135deg, #0F2044 0%, #1E3A8A 60%, #4F46E5 100%);
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 10px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-banner h1 { font-size: 13pt; font-weight: 900; margin-bottom: 2px; }
          .title-banner p { font-size: 8.5pt; color: #E0E7FF; font-weight: 600; }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 12px;
          }
          .kpi-card {
            background: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-top: 3px solid #4F46E5;
            border-radius: 8px;
            padding: 6px 10px;
            text-align: center;
          }
          .kpi-card .lbl { font-size: 7.5pt; font-weight: 800; color: #64748B; }
          .kpi-card .val { font-size: 13pt; font-weight: 900; color: #0F2044; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 14px;
          }
          th {
            background: #0F2044;
            color: #ffffff;
            font-weight: 800;
            padding: 7px 6px;
            border: 1px solid #0F2044;
            text-align: center;
          }
          td {
            padding: 6px 6px;
            border: 1px solid #CBD5E1;
            vertical-align: middle;
          }
          tr:nth-child(even) td { background: #F8FAFC; }
          .text-center { text-align: center; }
          .bold { font-weight: 800; }
          .font-num { font-family: 'Cairo', monospace; }
          .grade-badge {
            display: inline-block;
            background: #EFF6FF;
            color: #1D4ED8;
            border: 1px solid #BFDBFE;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 900;
            font-size: 8.5pt;
          }
          .teams-btn {
            display: inline-block;
            background: #4F46E5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 8pt;
          }
          .link-url {
            font-size: 6.5pt;
            color: #4F46E5;
            margin-top: 2px;
            word-break: break-all;
          }
          .status-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 7.5pt;
            font-weight: 800;
          }
          .student-notice {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            border-right: 4px solid #2563EB;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 8pt;
            color: #1E3A8A;
            margin-bottom: 14px;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 2px dashed #CBD5E1;
            text-align: center;
            page-break-inside: avoid;
          }
          .sig-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 8px;
          }
          .sig-title { font-size: 7.5pt; color: #64748B; font-weight: 700; }
          .sig-name { font-size: 9pt; color: #0F2044; font-weight: 900; margin: 2px 0; }
          .sig-role { font-size: 7pt; color: #64748B; }
          .sig-img { height: 34px; object-fit: contain; margin-top: 3px; }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div><img src="/ministry-logo.png" alt="وزارة التربية والتعليم" style="height:64px; object-fit:contain;" onerror="this.style.display='none'" /></div>
          <div class="header-center">
            <div class="country">دولة قـطـر</div>
            <div class="ministry">وزارة التربية والتعليم والتعليم العالي</div>
            <div class="school">مدرسة قطر للعلوم والتكنولوجيا الإعدادية الثانوية للبنين - أم السنيم</div>
            <div class="dept">قسم التعليم الإلكتروني والحلول الرقمية — منظومة التعلم عن بعد (Microsoft Teams)</div>
          </div>
          <div><img src="/school-logo.png" alt="شعار المدرسة" style="height:64px; object-fit:contain;" onerror="this.style.display='none'" /></div>
        </div>

        <div class="title-banner">
          <div>
            <h1>${reportTitle}</h1>
            <p>${reportSubtitle}</p>
          </div>
          <div style="text-align:left; font-size:8pt;">
            <div>تاريخ الإصدار: <strong>${reportDate}</strong></div>
            <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="lbl">إجمالي حصص التعلم عن بعد</div>
            <div class="val">${totalLessons} حصة</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">عدد المعلمين المشاركين</div>
            <div class="val">${uniqueTeachers} معلم</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">عدد الشعب والفصول</div>
            <div class="val">${uniqueSections} شعبة</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">المواد الدراسية</div>
            <div class="val">${uniqueSubjects} مادة</div>
          </div>
        </div>

        <div class="student-notice">
          <strong>📢 إرشادات هامة للطلاب وأولياء الأمور:</strong>
          يرجى الضغط على زر <strong>"انقر هنا للدخول إلى الحصة (Teams)"</strong> المقابل لكل حصة في الموعد المحدد، مع التأكد من تسجيل الدخول بحساب الطالب الرسمي في منصة Microsoft Teams قبل بدء الحصة بـ 5 دقائق.
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:32px;">#</th>
              <th style="width:95px;">اليوم والتاريخ</th>
              <th style="width:105px;">الحصة والوقت</th>
              <th style="width:85px;">الصف والشعبة</th>
              <th style="width:110px;">المادة الدراسية</th>
              <th style="width:140px;">اسم المعلم</th>
              <th>عنوان الدرس وملاحظات الطلاب</th>
              <th style="width:210px;">رابط الحصة المباشر (Link From Teams)</th>
              <th style="width:75px;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${
              rowsHtml ||
              `<tr><td colspan="9" class="text-center" style="padding:20px; color:#64748B; font-weight:700;">لا توجد حصص تعلم عن بعد مسجلة حالياً ضمن هذا الفلتر.</td></tr>`
            }
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">إعداد وتنسيق الجدول</div>
            <div class="sig-name">م. أحمد عادل طبيشات</div>
            <div class="sig-role">منسق المشاريع والتعليم الإلكتروني</div>
            <img class="sig-img" src="/signature-ahmad.png" alt="توقيع المنسق" onerror="this.style.display='none'" />
          </div>
          <div class="sig-box">
            <div class="sig-title">مراجعة وإشراف أكاديمي</div>
            <div class="sig-name">د. راني التوم</div>
            <div class="sig-role">النائب الأكاديمي للمدرسة</div>
            <img class="sig-img" src="/signature-rani.png" alt="توقيع النائب الأكاديمي" onerror="this.style.display='none'" />
          </div>
          <div class="sig-box" style="border:1.5px solid #0F2044; background:#fff;">
            <div class="sig-title">يعتمد، مدير المدرسة</div>
            <div class="sig-name">محمد علي مندني العمادي</div>
            <div class="sig-role">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
            <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة" onerror="this.style.display='none'" />
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
  `;

  const printWindow = window.open('', '_blank', 'width=1150,height=850');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    window.print();
  }
}

