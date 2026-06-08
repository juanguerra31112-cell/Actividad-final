import React, { useState, useEffect, useCallback } from 'react';
import { api } from './db.js';
import { StatusBadge, Card, StatCard, Btn, Input, Select, Textarea, Modal, Empty, SectionHeader } from './ui.jsx';

// ── Hook genérico para fetch asíncrono ────────────────────────────────────────
function useFetch(fetchFn, deps = []) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchFn()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, deps); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ h = 60, radius = 10, mb = 10 }) {
  return (
    <div style={{ height: h, borderRadius: radius, marginBottom: mb,
      background: 'linear-gradient(90deg,var(--bg3) 25%,var(--bg1) 50%,var(--bg3) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease infinite' }} />
  );
}

// ── Error inline ──────────────────────────────────────────────────────────────
function InlineError({ message, onRetry }) {
  return (
    <div style={{ background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.25)',
      borderRadius: 10, padding: '1rem 1.25rem', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--red)', marginBottom: 2 }}>
          Error al cargar datos
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          {message} — verifica que el backend esté corriendo en localhost:3001
        </div>
      </div>
      {onRetry && <Btn variant="danger" size="sm" onClick={onRetry}>Reintentar</Btn>}
    </div>
  );
}

// ── Toast de notificación ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: ['rgba(34,197,94,.12)', '#22c55e'], error: ['rgba(239,68,68,.12)', '#ef4444'] };
  const [bg, col] = colors[type] || colors.success;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      background: bg, border: `0.5px solid ${col}`, borderRadius: 10,
      padding: '10px 16px', color: col, fontFamily: 'var(--font-cond)',
      fontSize: 13, fontWeight: 600, animation: 'slide-in .2s ease',
      maxWidth: 320, backdropFilter: 'blur(8px)' }}>
      {msg}
    </div>
  );
}

// ── Hook de toast ─────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => setToast({ msg, type, key: Date.now() });
  const hide = () => setToast(null);
  return { toast, show, hide };
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard({ onNavigate }) {
  const { data: stats,   loading: lStats,  error: eStats,   reload: rStats }   = useFetch(() => api.getStats());
  const { data: tours,   loading: lTours,  error: eTours,   reload: rTours }   = useFetch(() => api.getTournaments());
  const { data: matches, loading: lMatch,  error: eMatch,   reload: rMatch }   = useFetch(() => api.getMatches(1));
  const { data: players, loading: lPlay }                                       = useFetch(() => api.getPlayers(1));

  const liveMatches  = matches?.filter(m => m.status === 'live') || [];
  const recentTours  = tours?.slice(0, 3) || [];
  const getPlayerName = (id) => players?.find(p => p.id === id)?.name || '—';

  return (
    <div style={{ animation: 'slide-in .3s ease' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,rgba(0,229,255,.06) 0%,rgba(124,58,237,.06) 100%)',
        border: '0.5px solid rgba(0,229,255,.15)', borderRadius: 16,
        padding: '1.5rem 2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 24, top: -20, width: 180, height: 180,
          background: 'radial-gradient(circle,rgba(0,229,255,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, letterSpacing: '0.04em' }}>
          Bienvenido a <span style={{ color: 'var(--accent)' }}>ARENACORE</span>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
          Plataforma de gestión de torneos · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
          <Btn onClick={() => onNavigate('tournaments')}>+ Nuevo Torneo</Btn>
          <Btn variant="secondary" onClick={() => onNavigate('bracket')}>Ver Bracket ↗</Btn>
        </div>
      </div>

      {/* Stats */}
      {eStats && <InlineError message={eStats} onRetry={rStats} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: '1.5rem' }}>
        {lStats
          ? [1,2,3,4,5].map(i => <Skeleton key={i} h={76} radius={14} mb={0} />)
          : <>
              <StatCard icon="🏆" label="Torneos Totales"  value={stats?.totalTournaments || 0} />
              <StatCard icon="⚡" label="Torneos Activos"  value={stats?.activeTournaments || 0} accent />
              <StatCard icon="👤" label="Jugadores"        value={stats?.totalPlayers || 0} />
              <StatCard icon="🎮" label="Partidas Jugadas" value={stats?.matchesPlayed || 0} />
              <StatCard icon="🔴" label="En Vivo Ahora"    value={stats?.liveMatches || 0} />
            </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Live matches */}
        <div>
          <SectionHeader title="Partidas en Vivo" sub={`${liveMatches.length} activas ahora`} />
          {eMatch && <InlineError message={eMatch} onRetry={rMatch} />}
          {lMatch
            ? [1,2].map(i => <Skeleton key={i} h={80} />)
            : liveMatches.length === 0
              ? <Empty icon="🎮" title="Sin partidas en vivo" sub="Las partidas activas aparecerán aquí" />
              : liveMatches.map(m => (
                <Card key={m.id} style={{ marginBottom: 10, borderColor: 'rgba(239,68,68,.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusBadge status="live" />
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-cond)' }}>Ronda {m.round}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600 }}>
                      {m.player1Name || getPlayerName(m.player1)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>VS</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600 }}>
                      {m.player2Name || getPlayerName(m.player2)}
                    </span>
                  </div>
                </Card>
              ))}
        </div>

        {/* Torneos recientes */}
        <div>
          <SectionHeader title="Torneos Recientes"
            action={<Btn variant="ghost" size="sm" onClick={() => onNavigate('tournaments')}>Ver todos →</Btn>} />
          {eTours && <InlineError message={eTours} onRetry={rTours} />}
          {lTours
            ? [1,2,3].map(i => <Skeleton key={i} h={70} />)
            : recentTours.map(t => (
              <Card key={t.id} onClick={() => onNavigate('tournaments')} style={{ marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t.game} · {t.prizePool || '—'}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TORNEOS
// ─────────────────────────────────────────────────────────────────────────────
export function Tournaments({ onNavigate }) {
  const { data: tournaments, loading, error, reload } = useFetch(() => api.getTournaments());
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('all');
  const [saving, setSaving]       = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [form, setForm] = useState({
    name: '', game: '', format: 'single_elimination', maxPlayers: 8,
    prizePool: '', startDate: '', description: '',
  });

  const all      = tournaments || [];
  const filtered = filter === 'all' ? all : all.filter(t => t.status === filter);

  const handleCreate = async () => {
    if (!form.name || !form.game) return;
    setSaving(true);
    try {
      await api.createTournament(form);
      showToast('✅ Torneo creado exitosamente');
      setShowModal(false);
      setForm({ name: '', game: '', format: 'single_elimination', maxPlayers: 8, prizePool: '', startDate: '', description: '' });
      reload();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  const tabs = [
    { key: 'all',          label: 'Todos' },
    { key: 'active',       label: 'Activos' },
    { key: 'registration', label: 'Inscripciones' },
    { key: 'finished',     label: 'Finalizados' },
  ];

  return (
    <div style={{ animation: 'slide-in .3s ease' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} key={toast.key} />}

      <SectionHeader title="Torneos" sub={`${all.length} torneos registrados`}
        action={<Btn onClick={() => setShowModal(true)}>+ Crear Torneo</Btn>} />

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem',
        borderBottom: '0.5px solid var(--border)', paddingBottom: 12, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
            padding: '5px 14px', borderRadius: 6, border: '0.5px solid',
            borderColor:  filter === t.key ? 'var(--accent)' : 'var(--border)',
            background:   filter === t.key ? 'rgba(0,229,255,.08)' : 'transparent',
            color:        filter === t.key ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {error  && <InlineError message={error} onRetry={reload} />}
      {loading && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {[1,2,3].map(i => <Skeleton key={i} h={200} />)}
      </div>}

      {!loading && !error && (
        filtered.length === 0
          ? <Empty icon="🏆" title="Sin torneos" sub="Crea tu primer torneo con el botón de arriba" />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {filtered.map(t => (
                <TournamentCard key={t.id} t={t} onNavigate={onNavigate}
                  onRefresh={reload} onToast={showToast} />
              ))}
            </div>
          )
      )}

      {showModal && (
        <Modal title="Crear Torneo" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Nombre del torneo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Liga Valorant..." />
            <Input label="Juego" value={form.game} onChange={e => setForm({ ...form, game: e.target.value })} placeholder="Valorant, FIFA 25..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Select label="Formato" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                <option value="single_elimination">Eliminación simple</option>
                <option value="double_elimination">Eliminación doble</option>
                <option value="round_robin">Round Robin</option>
              </Select>
              <Select label="Máx. jugadores" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: +e.target.value })}>
                {[4, 8, 16, 32].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Premio" value={form.prizePool} onChange={e => setForm({ ...form, prizePool: e.target.value })} placeholder="$500.000 COP" />
              <Input label="Fecha inicio" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción del torneo..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
              <Btn onClick={handleCreate} disabled={!form.name || !form.game || saving}>
                {saving ? 'Creando...' : 'Crear Torneo'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TournamentCard({ t, onNavigate, onRefresh, onToast }) {
  const [busy, setBusy] = useState(false);
  const pct = Math.round(((t.playerCount || 0) / (t.maxPlayers || 8)) * 100);

  const advance = async () => {
    const next = t.status === 'registration' ? 'active' : 'finished';
    setBusy(true);
    try {
      await api.updateTournamentStatus(t.id, next);
      onToast(`✅ Torneo ${next === 'active' ? 'iniciado' : 'finalizado'}`);
      onRefresh();
    } catch (e) {
      onToast('❌ ' + e.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t.game}</div>
        </div>
        <StatusBadge status={t.status} />
      </div>
      {t.description && <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{t.description}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Formato',   t.format === 'single_elimination' ? 'Elim. Simple' : t.format === 'double_elimination' ? 'Elim. Doble' : 'Round Robin'],
          ['Premio',    t.prizePool || '—'],
          ['Inicio',    t.startDate || '—'],
          ['Jugadores', `${t.playerCount || 0}/${t.maxPlayers || 8}`],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-cond)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
          <span>Inscripciones</span><span>{pct}%</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2, transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" size="sm" onClick={() => onNavigate('bracket')} style={{ flex: 1 }}>Ver Bracket</Btn>
        {t.status !== 'finished' && (
          <Btn size="sm" onClick={advance} disabled={busy} style={{ flex: 1 }}>
            {busy ? '...' : t.status === 'registration' ? 'Iniciar' : 'Finalizar'}
          </Btn>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRACKET
// ─────────────────────────────────────────────────────────────────────────────
export function Bracket() {
  const TOURNAMENT_ID = 1;
  const { data: matches, loading, error, reload } = useFetch(() => api.getMatches(TOURNAMENT_ID));
  const { data: players } = useFetch(() => api.getPlayers(TOURNAMENT_ID));
  const [selected, setSelected] = useState(null);
  const [scores, setScores]     = useState({ s1: '', s2: '' });
  const [saving, setSaving]     = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const getPlayer = (id) => players?.find(p => p.id === id);
  const rounds    = [...new Set((matches || []).map(m => m.round))].sort((a, b) => a - b);

  const handleSaveScore = async () => {
    if (!selected || scores.s1 === '' || scores.s2 === '') return;
    setSaving(true);
    try {
      await api.updateScore(selected.id, scores.s1, scores.s2);
      showToast('✅ Resultado guardado');
      setSelected(null);
      setScores({ s1: '', s2: '' });
      reload();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  const handleSetLive = async (matchId) => {
    try {
      await api.setMatchLive(matchId);
      showToast('🔴 Partida marcada como EN VIVO');
      reload();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    }
  };

  return (
    <div style={{ animation: 'slide-in .3s ease' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} key={toast.key} />}
      <SectionHeader title="Bracket del Torneo" sub="Liga Valorant Medellín — Eliminación Simple"
        action={<Btn variant="secondary" size="sm" onClick={reload}>↺ Actualizar</Btn>} />

      {error   && <InlineError message={error} onRetry={reload} />}
      {loading && <div style={{ display: 'flex', gap: 12 }}>{[1,2,3].map(i => <Skeleton key={i} h={300} radius={14} mb={0} />)}</div>}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
            {rounds.map((round, ri) => (
              <div key={round} style={{ minWidth: 210, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 600,
                  color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  textAlign: 'center', marginBottom: 12, padding: '4px 0',
                  borderBottom: '0.5px solid var(--border)' }}>
                  {round === 1 ? 'Cuartos' : round === 2 ? 'Semifinal' : 'Gran Final'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column',
                  gap:        round === 1 ? 12 : round === 2 ? 60 : 120,
                  paddingTop: round === 1 ? 0  : round === 2 ? 24 : 72 }}>
                  {(matches || []).filter(m => m.round === round).map(m => (
                    <BracketMatch key={m.id} match={m} getPlayer={getPlayer}
                      onClick={() => { setSelected(m); setScores({ s1: m.score1 ?? '', s2: m.score2 ?? '' }); }}
                      onSetLive={() => handleSetLive(m.id)}
                      isLast={ri === rounds.length - 1} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: '1rem', flexWrap: 'wrap' }}>
            {[['var(--red)', 'En vivo'], ['var(--green)', 'Finalizado'], ['var(--accent3)', 'Pendiente'], ['var(--text3)', 'Por definir']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <Modal title={`Resultado — Ronda ${selected.round}`} onClose={() => setSelected(null)}>
          {(!selected.player1 && !selected.player1Name)
            ? <Empty icon="⏳" title="Jugadores no definidos" sub="Esta partida aún no tiene participantes asignados" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-cond)', marginBottom: 4 }}>JUGADOR 1</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600 }}>
                      {selected.player1Name || getPlayer(selected.player1)?.name || '—'}
                    </div>
                    <Input style={{ marginTop: 8 }} type="number" placeholder="0" value={scores.s1}
                      onChange={e => setScores({ ...scores, s1: e.target.value })} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'var(--text3)', paddingBottom: 8 }}>VS</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-cond)', marginBottom: 4 }}>JUGADOR 2</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 600 }}>
                      {selected.player2Name || getPlayer(selected.player2)?.name || '—'}
                    </div>
                    <Input style={{ marginTop: 8 }} type="number" placeholder="0" value={scores.s2}
                      onChange={e => setScores({ ...scores, s2: e.target.value })} />
                  </div>
                </div>
                {selected.status === 'pending' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Btn variant="secondary" size="sm" onClick={() => { handleSetLive(selected.id); setSelected(null); }}>
                      🔴 Marcar como EN VIVO
                    </Btn>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => setSelected(null)}>Cancelar</Btn>
                  <Btn onClick={handleSaveScore} disabled={scores.s1 === '' || scores.s2 === '' || saving}>
                    {saving ? 'Guardando...' : 'Guardar Resultado'}
                  </Btn>
                </div>
              </div>
            )}
        </Modal>
      )}
    </div>
  );
}

function BracketMatch({ match, getPlayer, onClick, onSetLive }) {
  const p1 = getPlayer(match.player1);
  const p2 = getPlayer(match.player2);
  const borderColor = match.status === 'live' ? 'rgba(239,68,68,.4)' : match.status === 'finished' ? 'rgba(34,197,94,.25)' : 'var(--border)';

  const PlayerRow = ({ player, name, score, isWinner }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 10px', background: isWinner ? 'rgba(0,229,255,.06)' : 'transparent', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isWinner && <span style={{ color: 'var(--accent)', fontSize: 10 }}>▶</span>}
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600,
          color: player || name ? (isWinner ? 'var(--accent)' : 'var(--text)') : 'var(--text3)' }}>
          {name || player?.name || 'Por definir'}
        </span>
      </div>
      {score !== null && score !== undefined && score !== '' && (
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
          color: isWinner ? 'var(--accent)' : 'var(--text2)' }}>{score}</span>
      )}
    </div>
  );

  return (
    <div onClick={onClick} style={{ background: 'var(--bg1)', border: `0.5px solid ${borderColor}`,
      borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'all .15s', minWidth: 190 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.transform = 'scale(1)'; }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg3)',
        borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-cond)', color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Ronda {match.round}
        </span>
        <StatusBadge status={match.status} />
      </div>
      <PlayerRow player={p1} name={match.player1Name} score={match.score1} isWinner={match.winner === match.player1} />
      <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 10px' }} />
      <PlayerRow player={p2} name={match.player2Name} score={match.score2} isWinner={match.winner === match.player2} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JUGADORES
// ─────────────────────────────────────────────────────────────────────────────
export function Players() {
  const { data: players,     loading: lPlay, error: ePlay, reload: rPlay } = useFetch(() => api.getPlayers());
  const { data: tournaments, loading: lTour }                               = useFetch(() => api.getTournaments());
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', game: 'Valorant', rank: 'Oro', tournamentId: '1' });

  const all      = players || [];
  const filtered = all.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.game || '').toLowerCase().includes(search.toLowerCase())
  );
  const ranks = ['Bronce','Plata','Oro','Platino','Diamante','Inmortal','Radiante','División 1','División 2','División 3'];

  const handleRegister = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      await api.registerPlayer(form);
      showToast('✅ Jugador registrado');
      setShowModal(false);
      setForm({ name: '', email: '', game: 'Valorant', rank: 'Oro', tournamentId: '1' });
      rPlay();
    } catch (e) {
      showToast('❌ ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ animation: 'slide-in .3s ease' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} key={toast.key} />}

      <SectionHeader title="Jugadores" sub={`${all.length} jugadores registrados`}
        action={<Btn onClick={() => setShowModal(true)}>+ Registrar Jugador</Btn>} />

      <div style={{ marginBottom: '1.25rem' }}>
        <Input placeholder="Buscar por nombre o juego..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      {ePlay && <InlineError message={ePlay} onRetry={rPlay} />}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Jugador','Juego','Rango','Torneo','W','L','Win %'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10,
                  fontFamily: 'var(--font-cond)', color: 'var(--text3)', fontWeight: 600,
                  letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lPlay
              ? [1,2,3,4].map(i => (
                <tr key={i}><td colSpan={7} style={{ padding: '6px 14px' }}><Skeleton h={36} radius={6} mb={0} /></td></tr>
              ))
              : filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Sin resultados</td></tr>
                : filtered.map((p, i) => {
                  const total = (p.wins || 0) + (p.losses || 0);
                  const wp    = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '0.5px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)'}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%',
                            background: `hsl(${p.name.charCodeAt(0) * 7},50%,30%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>{p.game}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 600,
                          background: 'rgba(124,58,237,.12)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4 }}>{p.rank}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)' }}>{p.tournamentName || '—'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-head)', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>{p.wins || 0}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-head)', fontSize: 13, color: 'var(--red)',   fontWeight: 600 }}>{p.losses || 0}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 3, background: 'var(--bg3)', borderRadius: 2, minWidth: 40 }}>
                            <div style={{ height: '100%', width: `${wp}%`,
                              background: wp >= 70 ? 'var(--green)' : wp >= 40 ? 'var(--accent3)' : 'var(--red)', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 28 }}>{wp}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <Modal title="Registrar Jugador" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Nombre / Gamertag" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ElDiablo99" />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jugador@mail.com" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Juego" value={form.game} onChange={e => setForm({ ...form, game: e.target.value })} placeholder="Valorant" />
              <Select label="Rango" value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })}>
                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <Select label="Torneo" value={form.tournamentId} onChange={e => setForm({ ...form, tournamentId: e.target.value })}>
              {lTour
                ? <option>Cargando...</option>
                : (tournaments || []).filter(t => t.status !== 'finished').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </Select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
              <Btn onClick={handleRegister} disabled={!form.name || !form.email || saving}>
                {saving ? 'Registrando...' : 'Registrar'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────
export function Notifications() {
  const { data, loading, error, reload } = useFetch(() => api.getNotifications());
  const { toast, show: showToast, hide: hideToast } = useToast();

  const notifs = data?.notifications || [];

  const markRead = async (id) => {
    try {
      await api.markRead(id);
      reload();
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  };

  const markAll = async () => {
    try {
      await api.markAllRead();
      showToast('✅ Todas marcadas como leídas');
      reload();
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
  };

  const icons = { match: '🎮', result: '🏆', system: '📢' };

  return (
    <div style={{ animation: 'slide-in .3s ease' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} key={toast.key} />}

      <SectionHeader title="Notificaciones"
        sub={`${notifs.filter(n => !n.read).length} sin leer`}
        action={<Btn variant="ghost" size="sm" onClick={markAll}>Marcar todas como leídas</Btn>} />

      {error   && <InlineError message={error} onRetry={reload} />}
      {loading && [1,2,3].map(i => <Skeleton key={i} h={64} />)}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
          {notifs.length === 0
            ? <Empty icon="🔔" title="Sin notificaciones" sub="Las notificaciones del torneo aparecerán aquí" />
            : notifs.map(n => (
              <Card key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'center',
                opacity: n.read ? .6 : 1, borderColor: !n.read ? 'rgba(0,229,255,.2)' : 'var(--border)' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{icons[n.type] || '📢'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: n.read ? 'var(--text2)' : 'var(--text)', fontWeight: n.read ? 400 : 500 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{n.time}</div>
                </div>
                {!n.read && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 1.5s ease infinite' }} />
                    <Btn variant="ghost" size="sm" onClick={() => markRead(n.id)}>Leer</Btn>
                  </div>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
