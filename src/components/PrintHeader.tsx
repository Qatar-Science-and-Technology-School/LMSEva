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
    <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '2.5px solid #0F2044', paddingBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '160px', height: '75px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {!hideLogos && <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" style={{ height: '75px', objectFit: 'contain' }} />}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>نظام متابعة المعلمين | التاريخ: {today}</p>
        </div>
        <div style={{ width: '160px', height: '75px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {!hideLogos && <img src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" style={{ height: '75px', objectFit: 'contain' }} />}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#0F2044' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: '1rem', color: '#0F2044', fontWeight: 700 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
