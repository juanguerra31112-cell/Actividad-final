import React, { useState, useEffect } from 'react';
import { Dashboard, Tournaments, Bracket, Players, Notifications } from './views.jsx';
import { api } from './db.js';

const NAV_ITEMS = [
  { id:'dashboard',     label:'Dashboard',       icon:'⊞' },
  { id:'tournaments',   label:'Torneos',          icon:'🏆' },
  { id:'bracket',       label:'Bracket',          icon:'⚡' },
  { id:'players',       label:'Jugadores',        icon:'👥' },
  { id:'notifications', label:'Notificaciones',   icon:'🔔' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [unread, setUnread] = useState(0);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      try { setUnread(await api.getUnreadCount()); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (v) => setView(v);

  const views = { dashboard: Dashboard, tournaments: Tournaments, bracket: Bracket, players: Players, notifications: Notifications };
  const ViewComponent = views[view];

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'var(--font-body)' }}>

      {/* Sidebar */}
      <aside style={{
        width: sideOpen ? 220 : 60, flexShrink:0, transition:'width .25s ease',
        background:'var(--bg1)', borderRight:'0.5px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: sideOpen ? '1.25rem 1.25rem 1rem' : '1.25rem 0 1rem',
          borderBottom:'0.5px solid var(--border)', display:'flex',
          alignItems:'center', gap:10, justifyContent: sideOpen ? 'flex-start' : 'center' }}>
          <div style={{ width:32, height:32, borderRadius:8,
            background:'linear-gradient(135deg,var(--accent),var(--accent2))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-head)', fontWeight:700, fontSize:16, color:'#000', flexShrink:0 }}>A</div>
          {sideOpen && (
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
                letterSpacing:'0.08em', lineHeight:1 }}>ARENACORE</div>
              <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-cond)',
                letterSpacing:'0.1em', textTransform:'uppercase' }}>Tournament Manager</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.75rem 0', overflowY:'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                title={!sideOpen ? item.label : undefined}
                style={{
                  width:'100%', display:'flex', alignItems:'center',
                  gap:10, padding: sideOpen ? '9px 16px' : '9px 0',
                  justifyContent: sideOpen ? 'flex-start' : 'center',
                  background: active ? 'rgba(0,229,255,.08)' : 'transparent',
                  border:'none', borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  cursor:'pointer', transition:'all .15s', position:'relative',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,.03)'; e.currentTarget.style.color='var(--text)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text2)'; }}}>
                <span style={{ fontSize:17, flexShrink:0, position:'relative' }}>
                  {item.icon}
                  {item.id === 'notifications' && unread > 0 && (
                    <span style={{ position:'absolute', top:-4, right:-4, minWidth:14, height:14,
                      background:'var(--red)', borderRadius:7, fontSize:8, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontFamily:'var(--font-cond)', padding:'0 3px' }}>
                      {unread}
                    </span>
                  )}
                </span>
                {sideOpen && (
                  <span style={{ fontFamily:'var(--font-cond)', fontSize:13, fontWeight:600,
                    letterSpacing:'0.03em', whiteSpace:'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Toggle + User */}
        <div style={{ borderTop:'0.5px solid var(--border)', padding: sideOpen ? '0.75rem 1rem' : '0.75rem 0',
          display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => setSideOpen(o => !o)} style={{
            background:'transparent', border:'0.5px solid var(--border)',
            borderRadius:6, padding:'6px', cursor:'pointer', color:'var(--text3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .15s', alignSelf: sideOpen ? 'flex-end' : 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}>
            <span style={{ fontSize:12, transform: sideOpen ? 'none' : 'rotate(180deg)', transition:'transform .25s' }}>◀</span>
          </button>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%',
                background:'linear-gradient(135deg,var(--accent2),var(--accent))',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>A</div>
              <div>
                <div style={{ fontFamily:'var(--font-head)', fontSize:12, fontWeight:600 }}>Admin</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Organizador</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* Topbar */}
        <div style={{ borderBottom:'0.5px solid var(--border)', padding:'0.85rem 1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'var(--bg1)', position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'var(--font-cond)', fontSize:11, color:'var(--text3)',
              letterSpacing:'0.08em', textTransform:'uppercase' }}>
              {NAV_ITEMS.find(n => n.id === view)?.label}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Live indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11,
              color:'var(--red)', fontFamily:'var(--font-cond)', fontWeight:600 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)',
                animation:'pulse-dot 1s ease infinite', display:'inline-block' }}/>
              1 EN VIVO
            </div>
            <button onClick={() => navigate('notifications')}
              style={{ position:'relative', background:'transparent', border:'none',
                cursor:'pointer', fontSize:17, padding:4 }}>
              🔔
              {unread > 0 && (
                <span style={{ position:'absolute', top:-2, right:-2, width:14, height:14,
                  background:'var(--red)', borderRadius:7, fontSize:8, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontFamily:'var(--font-cond)' }}>
                  {unread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* View content */}
        <div style={{ flex:1, padding:'1.5rem', minHeight:0 }}>
          <ViewComponent onNavigate={navigate} />
        </div>
      </main>
    </div>
  );
}
