// ============================================================================
// Official School Appreciation Certificate Printing Utility
// مدرسة قطر للعلوم والتكنولوجيا الإعدادية الثانوية للبنين
// ============================================================================

const PRINCIPAL_SIGNATURE_BASE64 = "data:image/png;base64,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";

export interface CertificatePrintOptions {
  teacherNameAr: string;
  departmentName: string;
  academicYear?: string;
  month?: string;
  totalScore?: number;
  recognitionReason?: string;
  subject?: string;
  badgeTitle?: string;
}

export function printTeacherCertificate(options: CertificatePrintOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const {
    teacherNameAr,
    departmentName,
    academicYear = '2026-2027',
    month = 'سبتمبر',
    totalScore,
    recognitionReason,
    subject,
    badgeTitle = 'المعلم المتميز في نظام قطر للتعليم',
  } = options;

  const formattedDate = new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reasonText = recognitionReason || 
    `تقديرًا لجهوده الاستثنائية وتفوقه في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية، وتحقيق أعلى مؤشرات الأداء والإنجاز الأكاديمي لشهر ${month} للعام الأكاديمي ${academicYear}.`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>شهادة شكر وتقدير - ${teacherNameAr}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Alexandria:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          body { 
            font-family: 'Tajawal', sans-serif; 
            text-align: center; 
            background: #e2e8f0; 
            color: #1E2438; 
            -webkit-font-smoothing: antialiased;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .cert-container {
            width: 287mm;
            height: 200mm;
            max-width: 100%;
            margin: 0 auto;
            position: relative;
            background: #fff;
            border-radius: 6px;
            box-shadow: 0 15px 35px rgba(30,36,56,0.18);
            box-sizing: border-box;
          }
          .cert { 
            position: relative;
            width: 100%;
            height: 100%;
            padding: 16px 32px; 
            background-color: #f7f9fd;
            background-image: 
              radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.97) 25%, rgba(245, 248, 254, 0.93) 65%, rgba(235, 241, 252, 0.88) 100%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='103.92' viewBox='0 0 60 103.92'%3E%3Cpath d='M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z M30 34.64 L60 51.96 L60 86.6 L30 103.92 L0 86.6 L0 51.96 Z' fill='none' stroke='%233D52A0' stroke-width='0.7' stroke-opacity='0.045'/%3E%3C/svg%3E");
            border: 5px solid #1E2438; 
            border-radius: 6px;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .cert::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border: 1.5px solid #3D52A0;
            pointer-events: none;
            border-radius: 4px;
          }
          .cert::after { 
            content: ''; 
            position: absolute; 
            top: 10px; left: 10px; right: 10px; bottom: 10px; 
            border: 1px dashed rgba(112, 121, 156, 0.45); 
            border-radius: 3px;
            pointer-events: none; 
          }
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 450px;
            height: 450px;
            pointer-events: none;
            opacity: 0.055;
            z-index: 1;
          }
          .corner-ornament {
            position: absolute;
            width: 40px;
            height: 40px;
            pointer-events: none;
            z-index: 2;
          }
          .corner-tl { top: 12px; left: 12px; }
          .corner-tr { top: 12px; right: 12px; transform: scaleX(-1); }
          .corner-bl { bottom: 12px; left: 12px; transform: scaleY(-1); }
          .corner-br { bottom: 12px; right: 12px; transform: scale(-1); }

          .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px 8px;
            border-bottom: 1.5px solid rgba(61, 82, 160, 0.25);
            margin-bottom: 4px;
            position: relative;
            z-index: 3;
            flex-shrink: 0;
          }
          .header-logos img {
            height: 76px;
            max-width: 240px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(30,36,56,0.06));
          }
          .header-center-crest {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .crest-stars {
            color: #3D52A0;
            font-size: 14px;
            letter-spacing: 5px;
            margin-bottom: 2px;
          }
          .crest-label {
            font-family: 'Alexandria', sans-serif;
            font-size: 11.5px;
            font-weight: 700;
            color: #1E2438;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .divider-svg {
            display: block;
            margin: 6px auto;
            max-width: 300px;
          }

          .cert-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-size: 15px;
            line-height: 1.75;
            color: #1E293B;
            margin: 0;
            position: relative;
            z-index: 3;
            padding: 0 15px;
          }
          .cert-intro {
            font-family: 'Amiri', 'Tajawal', serif;
            color: #1E2438;
            font-weight: 700;
            line-height: 1.45;
            margin: -6px auto 6px;
            max-width: 960px;
          }
          .cert-intro-main {
            font-size: 30px;
            font-weight: 800;
            color: #1E2438;
            margin-bottom: 3px;
          }
          .cert-intro-main strong {
            color: #3D52A0;
            font-weight: 900;
            font-size: 31px;
          }
          .cert-intro-sub {
            font-size: 24px;
            color: #334155;
            font-weight: 700;
          }
          .teacher-name-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #EFF4FA 100%);
            border: 1.5px solid #CBD5E1;
            border-top: 2.5px solid #3D52A0;
            border-bottom: 2.5px solid #3D52A0;
            border-radius: 40px;
            padding: 4px 36px;
            margin: 6px 0;
            box-shadow: 0 4px 12px rgba(30,36,56,0.06);
          }
          .teacher-name {
            font-family: 'Amiri', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1E2438;
            letter-spacing: 0.5px;
          }
          .teacher-ornament {
            color: #3D52A0;
            font-size: 18px;
          }
          .cert-text {
            font-size: 15px;
            color: #334155;
            line-height: 1.8;
            max-width: 880px;
            margin: 6px auto 0;
          }
          .highlight-dept {
            color: #1E2438;
            font-weight: 800;
            font-size: 15.5px;
          }
          .score-badge {
            display: inline-block;
            background: linear-gradient(135deg, #EFF4FB 0%, #DBEAFE 100%);
            color: #1E2438;
            border: 1.5px solid #3D52A0;
            border-radius: 6px;
            padding: 3px 16px;
            font-weight: 800;
            font-size: 14px;
            margin-top: 6px;
          }
          .cert-footer { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-top: 6px; 
            padding: 0 25px 2px;
            position: relative;
            z-index: 3;
            flex-shrink: 0;
          }
          .sig-block { 
            text-align: center; 
            min-width: 220px;
          }
          .sig-title { 
            font-weight: 800; 
            color: #1E2438; 
            font-size: 14.5px;
            margin-bottom: 2px;
          }
          .sig-name { 
            color: #0F2044; 
            font-size: 15px; 
            font-weight: 800;
            margin-bottom: 2px;
          }
          .date-block {
            font-size: 12.5px;
            font-weight: 700;
            color: #475569;
            padding-bottom: 6px;
            text-align: right;
          }
          .sig-img-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 52px;
            margin-top: 1px;
          }
          .principal-sig-img {
            max-height: 52px;
            max-width: 220px;
            object-fit: contain;
            display: block;
          }
          @media print {
            html, body { 
              background: #fff !important; 
              padding: 0 !important; 
              margin: 0 !important;
              width: 297mm !important;
              height: 210mm !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cert-container {
              box-shadow: none !important;
              border-radius: 0 !important;
              width: 297mm !important;
              height: 210mm !important;
              max-width: 297mm !important;
              max-height: 210mm !important;
              margin: 0 !important;
              padding: 5mm !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .cert {
              width: 100% !important;
              height: 100% !important;
              border-width: 5px !important;
              padding: 16px 30px !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="cert">
            <!-- STEM Faceted Watermark from School Logo -->
            <div class="watermark-container">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" fill="none" stroke="#3D52A0" stroke-width="2"/>
                <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="none" stroke="#3D52A0" stroke-width="1.5"/>
                <line x1="100" y1="10" x2="100" y2="190" stroke="#3D52A0" stroke-width="1.2"/>
                <line x1="20" y1="55" x2="180" y2="145" stroke="#3D52A0" stroke-width="1.2"/>
                <line x1="20" y1="145" x2="180" y2="55" stroke="#3D52A0" stroke-width="1.2"/>
              </svg>
            </div>

            <!-- Four Corner Geometric Motifs -->
            <svg class="corner-ornament corner-tl" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-tr" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-bl" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-br" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>

            <!-- Header with Logos -->
            <div class="header-logos">
              <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
              <div class="header-center-crest">
                <div class="crest-stars">★ ★ ★ ★ ★</div>
                <div class="crest-label">${badgeTitle}</div>
              </div>
              <img src="/school-logo.png" alt="شعار المدرسة" />
            </div>

            <!-- Certificate Body -->
            <div class="cert-body">
              <div class="cert-intro">
                <div class="cert-intro-main">تَتَقَدَّمُ إِدَارَةُ <strong>مَدْرَسَةِ قَطَرَ لِلْعُلُومِ وَالتِّكْنُولُوجِيَا الإِعْدَادِيَّةِ الثَّانَوِيَّةِ لِلْبَنِين</strong></div>
                <div class="cert-intro-sub">بِجَزِيلِ الشُّكْرِ وَالتَّقْدِيرِ وَعَظِيمِ الاِمْتِنَانِ لِلْمُعَلِّمِ الفَاضِلِ:</div>
              </div>

              <div class="teacher-name-wrapper">
                <span class="teacher-ornament">✦</span>
                <span class="teacher-name">${teacherNameAr}</span>
                <span class="teacher-ornament">✦</span>
              </div>

              <!-- Sleek Modern Divider -->
              <svg class="divider-svg" viewBox="0 0 300 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 8H115" stroke="#3D52A0" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M185 8H290" stroke="#3D52A0" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="125" cy="8" r="2" fill="#3D52A0"/>
                <circle cx="175" cy="8" r="2" fill="#3D52A0"/>
                <polygon points="150,2 156,8 150,14 144,8" fill="#1E2438"/>
                <polygon points="150,4.5 153.5,8 150,11.5 146.5,8" fill="#3D52A0"/>
              </svg>

              <div class="cert-text">
                ${reasonText}
                <br/>
                بقسم <span class="highlight-dept">${departmentName}</span> ${subject ? `(${subject})` : ''}
              </div>

              ${totalScore ? `<div class="score-badge">المعدل العام التقييمي: ${totalScore}%</div>` : ''}
            </div>

            <!-- Signatures: School Principal ONLY -->
            <div class="cert-footer">
              <div class="date-block">
                التاريخ: ${formattedDate}
              </div>
              <div class="sig-block">
                <div class="sig-title">مدير المدرسة</div>
                <div class="sig-name">محمد علي مندني العمادي</div>
                <div class="sig-img-container">
                  <img src="${PRINCIPAL_SIGNATURE_BASE64}" alt="توقيع مدير المدرسة" class="principal-sig-img" />
                </div>
              </div>
            </div>
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

export function printBatchCertificates(certificates: CertificatePrintOptions[]) {
  if (!certificates || certificates.length === 0) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة الشهادات.');
    return;
  }

  const formattedDate = new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certsHtml = certificates.map((cert, index) => {
    const {
      teacherNameAr,
      departmentName,
      academicYear = '2026-2027',
      month = 'سبتمبر',
      totalScore,
      recognitionReason,
      subject,
      badgeTitle = 'المعلم المتميز في نظام قطر للتعليم',
    } = cert;

    const reasonText = recognitionReason || 
      `تقديرًا لجهوده الاستثنائية وتفوقه في تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية، وتحقيق أعلى مؤشرات الأداء والإنجاز الأكاديمي لشهر ${month} للعام الأكاديمي ${academicYear}.`;

    return `
      <div class="cert-page ${index === certificates.length - 1 ? 'last-page' : ''}">
        <div class="cert-container">
          <div class="cert">
            <!-- STEM Faceted Watermark from School Logo -->
            <div class="watermark-container">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" fill="none" stroke="#3D52A0" stroke-width="2"/>
                <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" fill="none" stroke="#3D52A0" stroke-width="1.5"/>
                <line x1="100" y1="10" x2="100" y2="190" stroke="#3D52A0" stroke-width="1.2"/>
                <line x1="20" y1="55" x2="180" y2="145" stroke="#3D52A0" stroke-width="1.2"/>
                <line x1="20" y1="145" x2="180" y2="55" stroke="#3D52A0" stroke-width="1.2"/>
              </svg>
            </div>

            <!-- Four Corner Geometric Motifs -->
            <svg class="corner-ornament corner-tl" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-tr" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-bl" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>
            <svg class="corner-ornament corner-br" viewBox="0 0 40 40">
              <path d="M4 4 L36 4 L36 10 L10 10 L10 36 L4 36 Z" fill="#1E2438"/>
              <path d="M14 14 L30 14 L30 18 L18 18 L18 30 L14 30 Z" fill="#3D52A0"/>
              <circle cx="25" cy="25" r="2.5" fill="#3D52A0"/>
            </svg>

            <!-- Header with Logos -->
            <div class="header-logos">
              <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
              <div class="header-center-crest">
                <div class="crest-stars">★ ★ ★ ★ ★</div>
                <div class="crest-label">${badgeTitle}</div>
              </div>
              <img src="/school-logo.png" alt="شعار المدرسة" />
            </div>

            <!-- Certificate Body -->
            <div class="cert-body">
              <div class="cert-intro">
                <div class="cert-intro-main">تَتَقَدَّمُ إِدَارَةُ <strong>مَدْرَسَةِ قَطَرَ لِلْعُلُومِ وَالتِّكْنُولُوجِيَا الإِعْدَادِيَّةِ الثَّانَوِيَّةِ لِلْبَنِين</strong></div>
                <div class="cert-intro-sub">بِجَزِيلِ الشُّكْرِ وَالتَّقْدِيرِ وَعَظِيمِ الاِمْتِنَانِ لِلْمُعَلِّمِ الفَاضِلِ:</div>
              </div>

              <div class="teacher-name-wrapper">
                <span class="teacher-ornament">✦</span>
                <span class="teacher-name">${teacherNameAr}</span>
                <span class="teacher-ornament">✦</span>
              </div>

              <!-- Sleek Modern Divider -->
              <svg class="divider-svg" viewBox="0 0 300 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 8H115" stroke="#3D52A0" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M185 8H290" stroke="#3D52A0" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="125" cy="8" r="2" fill="#3D52A0"/>
                <circle cx="175" cy="8" r="2" fill="#3D52A0"/>
                <polygon points="150,2 156,8 150,14 144,8" fill="#1E2438"/>
                <polygon points="150,4.5 153.5,8 150,11.5 146.5,8" fill="#3D52A0"/>
              </svg>

              <div class="cert-text">
                ${reasonText}
                <br/>
                بقسم <span class="highlight-dept">${departmentName}</span> ${subject ? `(${subject})` : ''}
              </div>

              ${totalScore ? `<div class="score-badge">المعدل العام التقييمي: ${totalScore}%</div>` : ''}
            </div>

            <!-- Signatures: School Principal ONLY -->
            <div class="cert-footer">
              <div class="date-block">
                التاريخ: ${formattedDate}
              </div>
              <div class="sig-block">
                <div class="sig-title">مدير المدرسة</div>
                <div class="sig-name">محمد علي مندني العمادي</div>
                <div class="sig-img-container">
                  <img src="${PRINCIPAL_SIGNATURE_BASE64}" alt="توقيع مدير المدرسة" class="principal-sig-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>طباعة شهادات التكريم المجمعة (${certificates.length} شهادات)</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Alexandria:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #e2e8f0;
          }
          body { 
            font-family: 'Tajawal', sans-serif; 
            text-align: center; 
            color: #1E2438; 
            -webkit-font-smoothing: antialiased;
            padding: 20px 10px;
          }
          .cert-page {
            width: 287mm;
            height: 200mm;
            max-width: 100%;
            margin: 0 auto 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
          }
          .cert-page.last-page {
            margin-bottom: 0;
            page-break-after: avoid;
            break-after: avoid;
          }
          .cert-container {
            width: 100%;
            height: 100%;
            position: relative;
            background: #fff;
            border-radius: 6px;
            box-shadow: 0 15px 35px rgba(30,36,56,0.18);
            box-sizing: border-box;
          }
          .cert { 
            position: relative;
            width: 100%;
            height: 100%;
            padding: 16px 32px; 
            background-color: #f7f9fd;
            background-image: 
              radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.97) 25%, rgba(245, 248, 254, 0.93) 65%, rgba(235, 241, 252, 0.88) 100%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='103.92' viewBox='0 0 60 103.92'%3E%3Cpath d='M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z M30 34.64 L60 51.96 L60 86.6 L30 103.92 L0 86.6 L0 51.96 Z' fill='none' stroke='%233D52A0' stroke-width='0.7' stroke-opacity='0.045'/%3E%3C/svg%3E");
            border: 5px solid #1E2438; 
            border-radius: 6px;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .cert::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border: 1.5px solid #3D52A0;
            pointer-events: none;
            border-radius: 4px;
          }
          .cert::after { 
            content: ''; 
            position: absolute; 
            top: 10px; left: 10px; right: 10px; bottom: 10px; 
            border: 1px dashed rgba(112, 121, 156, 0.45); 
            border-radius: 3px;
            pointer-events: none; 
          }
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 450px;
            height: 450px;
            pointer-events: none;
            opacity: 0.055;
            z-index: 1;
          }
          .corner-ornament {
            position: absolute;
            width: 40px;
            height: 40px;
            pointer-events: none;
            z-index: 2;
          }
          .corner-tl { top: 12px; left: 12px; }
          .corner-tr { top: 12px; right: 12px; transform: scaleX(-1); }
          .corner-bl { bottom: 12px; left: 12px; transform: scaleY(-1); }
          .corner-br { bottom: 12px; right: 12px; transform: scale(-1); }

          .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px 8px;
            border-bottom: 1.5px solid rgba(61, 82, 160, 0.25);
            margin-bottom: 4px;
            position: relative;
            z-index: 3;
            flex-shrink: 0;
          }
          .header-logos img {
            height: 76px;
            max-width: 240px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(30,36,56,0.06));
          }
          .header-center-crest {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .crest-stars {
            color: #3D52A0;
            font-size: 14px;
            letter-spacing: 5px;
            margin-bottom: 2px;
          }
          .crest-label {
            font-family: 'Alexandria', sans-serif;
            font-size: 11.5px;
            font-weight: 700;
            color: #1E2438;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .divider-svg {
            display: block;
            margin: 6px auto;
            max-width: 300px;
          }

          .cert-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-size: 15px;
            line-height: 1.75;
            color: #1E293B;
            margin: 0;
            position: relative;
            z-index: 3;
            padding: 0 15px;
          }
          .cert-intro {
            font-family: 'Amiri', 'Tajawal', serif;
            color: #1E2438;
            font-weight: 700;
            line-height: 1.45;
            margin: -6px auto 6px;
            max-width: 960px;
          }
          .cert-intro-main {
            font-size: 30px;
            font-weight: 800;
            color: #1E2438;
            margin-bottom: 3px;
          }
          .cert-intro-main strong {
            color: #3D52A0;
            font-weight: 900;
            font-size: 31px;
          }
          .cert-intro-sub {
            font-size: 24px;
            color: #334155;
            font-weight: 700;
          }
          .teacher-name-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #EFF4FA 100%);
            border: 1.5px solid #CBD5E1;
            border-top: 2.5px solid #3D52A0;
            border-bottom: 2.5px solid #3D52A0;
            border-radius: 40px;
            padding: 4px 36px;
            margin: 6px 0;
            box-shadow: 0 4px 12px rgba(30,36,56,0.06);
          }
          .teacher-name {
            font-family: 'Amiri', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1E2438;
            letter-spacing: 0.5px;
          }
          .teacher-ornament {
            color: #3D52A0;
            font-size: 18px;
          }
          .cert-text {
            font-size: 15px;
            color: #334155;
            line-height: 1.8;
            max-width: 880px;
            margin: 6px auto 0;
          }
          .highlight-dept {
            color: #1E2438;
            font-weight: 800;
            font-size: 15.5px;
          }
          .score-badge {
            display: inline-block;
            background: linear-gradient(135deg, #EFF4FB 0%, #DBEAFE 100%);
            color: #1E2438;
            border: 1.5px solid #3D52A0;
            border-radius: 6px;
            padding: 3px 16px;
            font-weight: 800;
            font-size: 14px;
            margin-top: 6px;
          }
          .cert-footer { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-top: 6px; 
            padding: 0 25px 2px;
            position: relative;
            z-index: 3;
            flex-shrink: 0;
          }
          .sig-block { 
            text-align: center; 
            min-width: 220px;
          }
          .sig-title { 
            font-weight: 800; 
            color: #1E2438; 
            font-size: 14.5px;
            margin-bottom: 2px;
          }
          .sig-name { 
            color: #0F2044; 
            font-size: 15px; 
            font-weight: 800;
            margin-bottom: 2px;
          }
          .date-block {
            font-size: 12.5px;
            font-weight: 700;
            color: #475569;
            padding-bottom: 6px;
            text-align: right;
          }
          .sig-img-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 52px;
            margin-top: 1px;
          }
          .principal-sig-img {
            max-height: 52px;
            max-width: 220px;
            object-fit: contain;
            display: block;
          }

          @media print {
            html, body { 
              background: #fff !important; 
              padding: 0 !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cert-page {
              width: 297mm !important;
              height: 210mm !important;
              max-width: 297mm !important;
              max-height: 210mm !important;
              margin: 0 !important;
              padding: 5mm !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .cert-page.last-page {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .cert-container {
              box-shadow: none !important;
              border-radius: 0 !important;
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              max-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cert {
              width: 100% !important;
              height: 100% !important;
              border-width: 5px !important;
              padding: 16px 30px !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
            }
          }
        </style>
      </head>
      <body>
        ${certsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 700);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
