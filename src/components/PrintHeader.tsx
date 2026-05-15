'use client';
import { SCHOOL_NAME } from '@/lib/data';

interface Props {
  title: string;
  subtitle?: string;
}

export default function PrintHeader({ title, subtitle }: Props) {
  const today = new Date().toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '2px solid #0F2044', paddingBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>دولة قطر</p>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>وزارة التربية والتعليم والتعليم العالي</p>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{SCHOOL_NAME}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img src="/school-logo.png" alt="Logo" style={{ height: '80px', width: 'auto' }} />
        </div>
        <div style={{ textAlign: 'left', fontSize: '0.75rem', color: '#64748B' }}>
          <p style={{ margin: 0 }}>التاريخ: {today}</p>
          <p style={{ margin: 0 }}>نظام متابعة المعلمين</p>
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#0F2044' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: '1rem', color: '#475569' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
