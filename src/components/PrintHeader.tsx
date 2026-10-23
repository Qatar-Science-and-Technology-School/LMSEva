'use client';

interface Props {
  title: string;
  subtitle?: string;
  hideLogos?: boolean;
}

export default function PrintHeader({ title, subtitle, hideLogos }: Props) {
  const today = new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="print-only" style={{ marginBottom: '1.5rem', borderBottom: '2.5px solid #0F2044', paddingBottom: '1rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ width: '175px', height: '78px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {!hideLogos && <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" style={{ height: '78px', objectFit: 'contain' }} />}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
          <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0F2044', letterSpacing: '0.2px' }}>
            دولة قطر — وزارة التربية والتعليم والتعليم العالي
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0284C7', marginTop: '0.2rem' }}>
            مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginTop: '0.15rem' }}>
            قسم المشاريع والتعليم الإلكتروني والحلول الرقمية | تاريخ الإصدار: {today}
          </div>
        </div>
        <div style={{ width: '175px', height: '78px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {!hideLogos && <img src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" style={{ height: '78px', objectFit: 'contain' }} />}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
        borderRadius: '10px',
        padding: '0.75rem 1.4rem',
        textAlign: 'center',
        color: '#FFFFFF',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' }}>{title}</h1>
        {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: '#BAE6FD', fontWeight: 700 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
