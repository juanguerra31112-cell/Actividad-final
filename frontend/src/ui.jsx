import React from 'react';

// ── Badge de estado ──────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active:       { label: 'Activo',        bg: 'rgba(0,229,255,.12)', color: '#00e5ff', dot: '#00e5ff' },
    registration: { label: 'Inscripciones', bg: 'rgba(34,197,94,.12)', color: '#22c55e', dot: '#22c55e' },
    finished:     { label: 'Finalizado',    bg: 'rgba(139,144,168,.1)', color: '#8b90a8', dot: '#545870' },
    live:         { label: 'EN VIVO',       bg: 'rgba(239,68,68,.15)', color: '#ef4444', dot: '#ef4444' },
    pending:      { label: 'Pendiente',     bg: 'rgba(245,158,11,.1)', color: '#f59e0b', dot: '#f59e0b' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      background: s.bg, color: s.color,
      fontFamily:'var(--font-cond)', fontWeight:600, fontSize:11, letterSpacing:'0.08em',
      padding:'3px 9px', borderRadius:4, textTransform:'uppercase' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: s.dot,
        animation: status === 'live' ? 'pulse-dot 1.2s ease infinite' : 'none' }}/>
      {s.label}
    </span>
  );
}

// ── Card base ────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, hover = false }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg1)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      transition: 'border-color .2s, transform .15s',
      cursor: onClick ? 'pointer' : 'default',
      ...(hover ? { ':hover': { borderColor: 'var(--border2)' } } : {}),
      ...style
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}}
    >
      {children}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, accent = false, sub }) {
  return (
    <Card style={{ display:'flex', alignItems:'center', gap:14,
      borderColor: accent ? 'rgba(0,229,255,.2)' : 'var(--border)',
      animation: 'glow-pulse 3s ease infinite',
      animationPlayState: accent ? 'running' : 'paused' }}>
      <div style={{ fontSize:22, width:44, height:44, borderRadius:10,
        background: accent ? 'rgba(0,229,255,.08)' : 'var(--bg3)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:700,
          color: accent ? 'var(--accent)' : 'var(--text)', lineHeight:1 }}>
          {value}
        </div>
        <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--font-cond)',
          letterSpacing:'0.04em', marginTop:3 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', style = {}, disabled }) {
  const variants = {
    primary: { background:'var(--accent)', color:'#000', border:'none' },
    secondary: { background:'transparent', color:'var(--text)', border:'0.5px solid var(--border2)' },
    danger: { background:'rgba(239,68,68,.1)', color:'var(--red)', border:'0.5px solid rgba(239,68,68,.3)' },
    ghost: { background:'transparent', color:'var(--text2)', border:'none' },
  };
  const sizes = {
    sm: { fontSize:12, padding:'5px 12px', borderRadius:6 },
    md: { fontSize:13, padding:'8px 18px', borderRadius:8 },
    lg: { fontSize:14, padding:'11px 24px', borderRadius:10 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      fontFamily:'var(--font-cond)', fontWeight:600, letterSpacing:'0.04em',
      cursor: disabled ? 'not-allowed' : 'pointer', display:'inline-flex',
      alignItems:'center', gap:6, transition:'all .15s', opacity: disabled ? .5 : 1, ...style
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '.85'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

// ── Input / Select ───────────────────────────────────────────────────────────
const inputBase = {
  background:'var(--bg3)', border:'0.5px solid var(--border2)',
  borderRadius:'var(--radius)', padding:'9px 12px', color:'var(--text)',
  fontFamily:'var(--font-body)', fontSize:13, width:'100%',
  outline:'none', transition:'border-color .15s',
};
export function Input({ label, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:11, fontFamily:'var(--font-cond)',
        color:'var(--text2)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</label>}
      <input {...props} style={{ ...inputBase, ...props.style }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border2)'}/>
    </div>
  );
}
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:11, fontFamily:'var(--font-cond)',
        color:'var(--text2)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</label>}
      <select {...props} style={{ ...inputBase, cursor:'pointer', ...props.style }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border2)'}>
        {children}
      </select>
    </div>
  );
}
export function Textarea({ label, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:11, fontFamily:'var(--font-cond)',
        color:'var(--text2)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</label>}
      <textarea {...props} style={{ ...inputBase, resize:'vertical', minHeight:80, ...props.style }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border2)'}/>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
      backdropFilter:'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg1)', border:'0.5px solid var(--border2)',
        borderRadius:16, padding:'1.5rem', width:'100%', maxWidth:480,
        maxHeight:'90vh', overflowY:'auto', animation:'slide-in .2s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700,
            color:'var(--accent)', letterSpacing:'0.03em' }}>{title}</h2>
          <Btn variant="ghost" size="sm" onClick={onClose} style={{ fontSize:18, padding:'4px 8px' }}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem 1rem', color:'var(--text3)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:16, color:'var(--text2)', marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:12 }}>{sub}</div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'1.25rem' }}>
      <div>
        <h2 style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700,
          letterSpacing:'0.03em', lineHeight:1.1 }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
