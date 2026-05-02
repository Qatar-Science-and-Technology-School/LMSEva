'use client';
import { useState } from 'react';
import { db, SCHOOL_NAME, DESIGNER_CREDIT } from '@/lib/data';
import type { User } from '@/lib/data';

interface Props { onLogin: (user: User) => void; }

const QUICK_LOGINS = [
  { label: '👤 مدير النظام',           email: 'a.tubaishat1704@education.qa', password: 'admin123'    },
  { label: '🏫 النائب الأكاديمي',      email: 'r.altoum1512@education.qa',    password: 'leader123'   },
  { label: '📐 يامن فرح - رياضيات',   email: 'y.farah2507@education.qa',     password: 'QSTSS@2026'  },
  { label: '📖 أسعد ناعس - عربي',     email: 'n.asaad0108@education.qa',     password: 'QSTSS@2026'  },
  { label: '☪️ ماهر علوان - إسلامية', email: 'm.elwan2704@education.qa',     password: 'QSTSS@2026'  },
  { label: '💻 عيسى سويدان - حاسوب', email: 'e.sweidan0601@education.qa',    password: 'QSTSS@2026'  },
  { label: '🔬 المختبرات التخصصية',   email: 'm.salameh1301@education.qa',   password: 'QSTSS@2026'  },
  { label: '🤖 أحمد فارس - STEM',    email: 'a.faris1404@education.qa',     password: 'QSTSS@2026'  },
  { label: '🇬🇧 يوسف دحمان - إنجليزي', email: 'y.dahman0209@education.qa',    password: 'QSTSS@2026'  },
];

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => {
      const user = db.login(email, password);
      if (user) { onLogin(user); }
      else { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة'); }
      setLoading(false);
    }, 500);
  };

  const quickFill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="login-page" style={{ flexDirection: 'column', gap: '1.5rem' }}>
      {/* bg blobs */}
      <div style={{ position:'absolute', top:'10%', left:'10%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* School Logo */}
      <div className="fade-in" style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'center' }}>
        <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:'20px', padding:'14px 28px', boxShadow:'0 8px 32px rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src="/school-logo.png" alt={SCHOOL_NAME}
            style={{ height:'100px', width:'auto', maxWidth:'480px', objectFit:'contain' }} />
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card fade-in">
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0F2044', margin:'0 0 0.25rem', lineHeight:1.3 }}>
            متابعة المعلمين لنظام قطر للتعليم
          </h1>
          <p style={{ fontSize:'0.72rem', color:'#64748B', margin:0, lineHeight:1.5 }}>
            {SCHOOL_NAME}
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:'1rem' }}>
            <label className="form-label">البريد الإلكتروني أو اسم المستخدم</label>
            <input type="text" className="form-input" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="example@education.qa" required />
          </div>
          <div style={{ marginBottom:'1.25rem' }}>
            <label className="form-label">كلمة المرور</label>
            <input type="password" className="form-input" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom:'1rem' }}>⚠️ {error}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'0.75rem' }}>
            {loading ? '⏳ جاري تسجيل الدخول...' : '🔐 تسجيل الدخول'}
          </button>
        </form>

        {/* Quick login */}
        <div style={{ marginTop:'1.5rem', borderTop:'1px solid #E2E8F0', paddingTop:'1.25rem' }}>
          <p style={{ fontSize:'0.72rem', color:'#94A3B8', textAlign:'center', marginBottom:'0.75rem', fontWeight:600 }}>
            دخول سريع للتجربة
          </p>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {QUICK_LOGINS.map(q => (
              <button key={q.email} onClick={() => quickFill(q.email, q.password)}
                className="btn btn-ghost"
                style={{ flex:1, fontSize:'0.7rem', justifyContent:'center', minWidth:'100px' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:'0.65rem', color:'#CBD5E1', marginTop:'1.25rem', marginBottom:0 }}>
          © 2025-2026 {SCHOOL_NAME}
        </p>
        <p style={{ textAlign:'center', fontSize:'0.62rem', color:'#94A3B8', marginTop:'0.25rem', marginBottom:0 }}>
          {DESIGNER_CREDIT}
        </p>
      </div>
    </div>
  );
}
