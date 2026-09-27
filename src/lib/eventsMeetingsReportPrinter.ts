// =============================================================================
// محرك طباعة التقارير الرسمية ومحاضر الفعاليات والاجتماعات
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني
// =============================================================================

import {
  EventMeetingItem,
  EVENT_TYPE_CONFIG,
  EVENT_NATURE_CONFIG,
  EVENT_STATUS_CONFIG,
} from './eventsMeetingsData';

interface PrintOptions {
  title?: string;
  subtitle?: string;
  academicYear?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// أنماط الطباعة المشتركة (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
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
    height: 65px;
    object-fit: contain;
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
    font-size: 15px;
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
    padding: 3px 14px;
    border-radius: 999px;
    display: inline-block;
    margin-top: 4px;
    border: 1px solid #CBD5E1;
  }

  /* Meta Bar */
  .meta-bar {
    display: flex;
    justifyContent: space-between;
    align-items: center;
    background: #F8FAFC;
    border: 1.5px solid #CBD5E1;
    border-radius: 8px;
    padding: 6px 14px;
    margin-bottom: 12px;
    font-size: 9.5px;
  }

  .meta-bar strong {
    color: #0F2044;
  }

  /* KPIs Cards */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .kpi-card {
    background: #FAFAFA;
    border: 1.5px solid #CBD5E1;
    border-radius: 8px;
    padding: 6px 8px;
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

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
    margin-bottom: 12px;
  }

  th {
    background: #0F2044;
    color: #ffffff;
    font-weight: 800;
    padding: 6px 6px;
    text-align: right;
    border: 1px solid #0F2044;
    white-space: nowrap;
  }

  th.text-center, td.text-center {
    text-align: center;
  }

  td {
    padding: 5px 6px;
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
    font-size: 8px;
    text-align: center;
    white-space: nowrap;
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
    justify-content: center;
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

// ─────────────────────────────────────────────────────────────────────────────
// أنماط طباعة المحضر الفردي (A4 Portrait - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_A4_SINGLE_STYLES = `
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
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #ffffff;
    color: #1E293B;
    direction: rtl;
    font-size: 11px;
    line-height: 1.5;
    margin: 0 !important;
    padding: 12mm 15mm !important;
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
    margin-bottom: 14px;
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

  /* Info Grid */
  .info-box {
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 12px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
    font-size: 10px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .info-label {
    color: #64748B;
    font-weight: 700;
    min-width: 90px;
  }

  .info-val {
    color: #0F2044;
    font-weight: 800;
  }

  /* Section Card */
  .section-card {
    border: 1.5px solid #CBD5E1;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #ffffff;
  }

  .section-card-title {
    font-size: 11px;
    font-weight: 900;
    color: #0F2044;
    border-bottom: 1.5px solid #E2E8F0;
    padding-bottom: 4px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bullet-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .bullet-list li {
    font-size: 10px;
    color: #334155;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    line-height: 1.4;
  }

  .bullet-list li::before {
    content: "•";
    color: #0284C7;
    font-size: 14px;
    line-height: 1;
    font-weight: 900;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 5px;
    font-weight: 800;
    font-size: 9px;
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
    width: 31%;
    background: #FAFAFA;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 8px 10px;
  }

  .sig-title {
    font-size: 9.5px;
    font-weight: 800;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .sig-name {
    font-size: 10.5px;
    font-weight: 900;
    color: #0F2044;
    margin-bottom: 2px;
  }

  .sig-role {
    font-size: 8px;
    color: #64748B;
    margin-bottom: 2px;
  }

  .sig-img-container {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sig-img {
    max-height: 38px;
    max-width: 130px;
    object-fit: contain;
  }

  .footer-note {
    margin-top: 8px;
    font-size: 8px;
    color: #94A3B8;
    text-align: center;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// التوقيعات الرسمية الثلاثية المشتركة
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_SIGNATURES_HTML = `
  <div class="signatures-container avoid-break">
    <!-- 1. Ahmad -->
    <div class="sig-box">
      <div class="sig-title">إعداد وتوثيق الفعالية / الاجتماع</div>
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
    وثيقة رسمية معتمدة صادرة عن مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — وزارة التربية والتعليم والتعليم العالي
  </div>
`;

// Helper: Open print window
function openPrintWindow(docTitle: string, content: string, styles: string) {
  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>${styles}</style>
      </head>
      <body>
        ${content}
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
// 1. التقرير الرسمي الشامل للفعاليات والاجتماعات (A3 Landscape - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printComprehensiveEventsMeetingsReport(
  items: EventMeetingItem[],
  options: PrintOptions = {}
) {
  const {
    title = 'التقرير الرسمي الشامل لحصر وتوثيق الفعاليات والاجتماعات المدرسية',
    academicYear = '2026-2027',
  } = options;

  const totalEvents = items.length;
  const meetingsCount = items.filter(i => i.category === 'اجتماع').length;
  const eventsCount = items.filter(i => i.category === 'فعالية').length;
  const studentSupervisionCount = items.filter(i => i.nature === 'إشراف على طلاب').length;
  const workMeetingsCount = items.filter(i => i.nature === 'اجتماع عمل').length;
  const totalBeneficiaries = items.reduce((acc, curr) => acc + (curr.participantsCount || 0), 0);
  const completedCount = items.filter(i => i.status === 'مكتملة').length;

  const content = `
    <!-- Header -->
    <div class="official-header">
      <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم المشاريع والتعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">${title}</div>
      </div>
      <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
    </div>

    <!-- Metadata Bar -->
    <div class="meta-bar">
      <div>العام الأكاديمي: <strong>${academicYear}</strong></div>
      <div>كود الوثيقة: <strong>QES-REP-EVENTS-MEETINGS-A3</strong></div>
      <div>المقاس المعتمد: <strong>A3 Landscape (0 Margins)</strong></div>
      <div>إجمالي السجلات: <strong>${totalEvents} فعالية واجتماع</strong></div>
      <div>تاريخ إصدار التقرير: <strong>${new Date().toLocaleDateString('ar-QA')}</strong></div>
      <div>حالة الاعتماد: <strong>معتمد رسمياً من الإدارة المدرسية</strong></div>
    </div>

    <!-- KPIs Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="border-top: 3px solid #0F2044;">
        <div class="kpi-title">إجمالي الفعاليات والاجتماعات</div>
        <div class="kpi-val" style="color: #0F2044;">${totalEvents}</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #0284C7;">
        <div class="kpi-title">اجتماعات العمل الرسمية</div>
        <div class="kpi-val" style="color: #0284C7;">${meetingsCount}</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #10B981;">
        <div class="kpi-title">فعاليات الإشراف على الطلاب</div>
        <div class="kpi-val" style="color: #10B981;">${studentSupervisionCount}</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #F59E0B;">
        <div class="kpi-title">الفعاليات والأنشطة العامة</div>
        <div class="kpi-val" style="color: #F59E0B;">${eventsCount}</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #8B5CF6;">
        <div class="kpi-title">إجمالي المشاركين والطلاب</div>
        <div class="kpi-val" style="color: #8B5CF6;">${totalBeneficiaries}</div>
      </div>
      <div class="kpi-card" style="border-top: 3px solid #16A34A;">
        <div class="kpi-title">الفعاليات المكتملة والموثقة</div>
        <div class="kpi-val" style="color: #16A34A;">${completedCount} (${totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0}%)</div>
      </div>
    </div>

    <!-- Comprehensive Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 32px;" class="text-center">#</th>
          <th>العنوان والموضوع</th>
          <th class="text-center" style="width: 65px;">التصنيف</th>
          <th class="text-center" style="width: 100px;">النوع</th>
          <th class="text-center" style="width: 95px;">طبيعة الفعالية</th>
          <th style="width: 80px;">التاريخ</th>
          <th style="width: 140px;">المقر والمكان</th>
          <th style="width: 130px;">الفئة والمشاركون</th>
          <th class="text-center" style="width: 45px;">العدد</th>
          <th>أهداف الفعالية / الاجتماع</th>
          <th>أبرز المخرجات والقرارات</th>
          <th class="text-center" style="width: 75px;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const typeConf = EVENT_TYPE_CONFIG[it.type] || EVENT_TYPE_CONFIG['داخلي'];
          const natureConf = EVENT_NATURE_CONFIG[it.nature] || EVENT_NATURE_CONFIG['اجتماع عمل'];
          const statusConf = EVENT_STATUS_CONFIG[it.status] || EVENT_STATUS_CONFIG['مكتملة'];

          return `
            <tr>
              <td class="text-center font-bold" style="color: #64748B;">${idx + 1}</td>
              <td>
                <strong style="color: #0F2044; font-size: 9.5px; display: block;">${it.title}</strong>
                <span style="font-size: 8px; color: #64748B;">المنسق المسؤول: ${it.organizer}</span>
              </td>
              <td class="text-center">
                <span class="badge" style="background: ${it.category === 'اجتماع' ? '#E0F2FE' : '#EDE9FE'}; color: ${it.category === 'اجتماع' ? '#0369A1' : '#7C3AED'};">
                  ${it.category}
                </span>
              </td>
              <td class="text-center">
                <span class="badge" style="background: ${typeConf.bg}; color: ${typeConf.color}; border: 1px solid ${typeConf.border};">
                  ${typeConf.icon} ${typeConf.label}
                </span>
              </td>
              <td class="text-center">
                <span class="badge" style="background: ${natureConf.bg}; color: ${natureConf.color};">
                  ${natureConf.icon} ${natureConf.label}
                </span>
              </td>
              <td style="font-size: 8.5px; font-weight: 700; color: #0F2044;">${it.date}</td>
              <td style="font-size: 8.5px; color: #334155;">${it.location}</td>
              <td style="font-size: 8px; color: #475569;">${it.targetAudience}</td>
              <td class="text-center font-bold" style="color: #0F2044; font-size: 9.5px;">${it.participantsCount}</td>
              <td style="font-size: 8px; color: #1E293B;">
                <ul style="margin: 0; padding-right: 12px;">
                  ${(it.objectives || []).slice(0, 3).map(ob => `<li>${ob}</li>`).join('')}
                </ul>
              </td>
              <td style="font-size: 8px; color: #166534;">
                <ul style="margin: 0; padding-right: 12px;">
                  ${(it.outcomes || []).slice(0, 2).map(out => `<li>${out}</li>`).join('')}
                </ul>
              </td>
              <td class="text-center">
                <span class="badge" style="background: ${statusConf.bg}; color: ${statusConf.color};">
                  ${statusConf.icon} ${statusConf.label}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    ${COMMON_SIGNATURES_HTML}
  `;

  openPrintWindow(`التقرير الشامل للفعاليات والاجتماعات (A3) - ${academicYear}`, content, COMMON_A3_STYLES);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. محضر اجتماع رسمي / تقرير فعالية رسمي فردي (A4 Portrait - 0 Margins)
// ─────────────────────────────────────────────────────────────────────────────
export function printSingleEventMeetingReport(item: EventMeetingItem) {
  const isMeeting = item.category === 'اجتماع';
  const docTypeLabel = isMeeting ? 'محضر اجتماع رسمي' : 'تقرير توثيق فعالية مدرسية';
  const typeConf = EVENT_TYPE_CONFIG[item.type] || EVENT_TYPE_CONFIG['داخلي'];
  const natureConf = EVENT_NATURE_CONFIG[item.nature] || EVENT_NATURE_CONFIG['اجتماع عمل'];
  const statusConf = EVENT_STATUS_CONFIG[item.status] || EVENT_STATUS_CONFIG['مكتملة'];

  const content = `
    <!-- Header -->
    <div class="official-header">
      <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
      <div class="header-text">
        <div class="country-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
        <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="dept-title">قسم المشاريع والتعليم الإلكتروني والحلول الرقمية</div>
        <div class="doc-title">${docTypeLabel} (${item.id})</div>
      </div>
      <img class="header-logo" src="/school-logo.png" alt="شعار المدرسة" />
    </div>

    <!-- Title Bar -->
    <div style="background: linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%); color: #ffffff; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 style="font-size: 13px; font-weight: 900; margin: 0 0 2px;">${item.title}</h2>
        <span style="font-size: 9px; color: #BAE6FD;">العام الأكاديمي: ${item.academicYear} | كود الوثيقة: QES-DOC-${item.id}</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <span class="badge" style="background: ${typeConf.bg}; color: ${typeConf.color};">
          ${typeConf.icon} ${typeConf.label}
        </span>
        <span class="badge" style="background: ${natureConf.bg}; color: ${natureConf.color};">
          ${natureConf.icon} ${natureConf.label}
        </span>
      </div>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <div class="info-item">
        <span class="info-label">📅 تاريخ الانعقاد:</span>
        <span class="info-val">${item.date}</span>
      </div>
      <div class="info-item">
        <span class="info-label">⏰ التوقيت والمدة:</span>
        <span class="info-val">${item.time || 'خلال ساعات الدوام الرسمي'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">📍 المقر والمكان:</span>
        <span class="info-val">${item.location}</span>
      </div>
      <div class="info-item">
        <span class="info-label">👤 الجهة والمسؤول:</span>
        <span class="info-val">${item.organizer}</span>
      </div>
      <div class="info-item">
        <span class="info-label">👥 الفئة المستهدفة:</span>
        <span class="info-val">${item.targetAudience}</span>
      </div>
      <div class="info-item">
        <span class="info-label">📊 عدد الحضور / الطلاب:</span>
        <span class="info-val" style="color: #0284C7;">${item.participantsCount} مشاركاً</span>
      </div>
      <div class="info-item">
        <span class="info-label">🔖 حالة الفعالية:</span>
        <span class="badge" style="background: ${statusConf.bg}; color: ${statusConf.color}; font-size: 9px;">
          ${statusConf.icon} ${statusConf.label}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">📋 طبيعة الفعالية:</span>
        <span class="info-val">${item.nature}</span>
      </div>
    </div>

    <!-- Objectives (أهداف الفعالية / أهداف الاجتماع) -->
    <div class="section-card">
      <div class="section-card-title">
        <span>🎯</span>
        <span>${isMeeting ? 'أهداف الاجتماع ومبررات الانعقاد' : 'أهداف الفعالية المدرسية'}</span>
      </div>
      <ul class="bullet-list">
        ${(item.objectives || []).map(obj => `<li>${obj}</li>`).join('')}
      </ul>
    </div>

    <!-- Agenda (جدول الأعمال / المحاور) -->
    ${item.agenda && item.agenda.length > 0 ? `
      <div class="section-card">
        <div class="section-card-title">
          <span>📋</span>
          <span>${isMeeting ? 'جدول الأعمال والمحاور المطروحة للمناقشة' : 'برنامج الفعالية والأنشطة المنفذة'}</span>
        </div>
        <ul class="bullet-list">
          ${item.agenda.map(ag => `<li>${ag}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- Outcomes & Recommendations (المخرجات والقرارات) -->
    <div class="section-card" style="border-color: #BBF7D0; background: #F0FDF4;">
      <div class="section-card-title" style="color: #166534; border-bottom-color: #DCFCE7;">
        <span>💡</span>
        <span>${isMeeting ? 'القرارات المتخذة والتكليفات والتوصيات' : 'مخرجات الفعالية والتوصيات الختامية'}</span>
      </div>
      <ul class="bullet-list">
        ${(item.outcomes || []).map(out => `<li style="color: #166534;"><strong>•</strong> ${out}</li>`).join('')}
      </ul>
    </div>

    ${item.notes ? `
      <div class="section-card" style="background: #FFFBEB; border-color: #FDE68A;">
        <div class="section-card-title" style="color: #B45309; border-bottom-color: #FEF3C7;">
          <span>📝</span>
          <span>ملاحظات إضافية وتوثيق ميداني</span>
        </div>
        <p style="font-size: 9.5px; color: #78350F; margin: 0; line-height: 1.4;">${item.notes}</p>
      </div>
    ` : ''}

    ${COMMON_SIGNATURES_HTML}
  `;

  openPrintWindow(`${docTypeLabel} - ${item.title}`, content, COMMON_A4_SINGLE_STYLES);
}
