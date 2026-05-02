'use client';
import { useState, useEffect } from 'react';
import { db, User } from '@/lib/data';
import LoginPage from '@/components/LoginPage';
import AppShell from '@/components/AppShell';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = db.getCurrentUser();
    setUser(saved);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0F2044' }}>
        <div style={{ textAlign:'center', color:'white' }}>
          <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>🏫</div>
          <p style={{ fontFamily:'IBM Plex Sans Arabic, Arial, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={(u) => { db.setCurrentUser(u); setUser(u); }} />;
  }

  return <AppShell user={user} onLogout={() => { db.setCurrentUser(null); setUser(null); }} />;
}
