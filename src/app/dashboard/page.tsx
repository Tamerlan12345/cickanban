import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const membership = await db.projectMember.findFirst({
    where: { userId: user.id },
    include: { project: true },
  });
  const project = membership?.project;

  if (!project) {
    return (
      <div style={{ padding: 40, color: '#fff' }}>
        <h2>Проект не найден</h2>
      </div>
    );
  }

  const tasks = await db.task.findMany({ where: { projectId: project.id } });

  const total    = tasks.length;
  const inProg   = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const review   = tasks.filter((t) => t.status === 'REVIEW').length;
  const done     = tasks.filter((t) => t.status === 'DONE').length;
  const backlog  = tasks.filter((t) => t.status === 'BACKLOG').length;

  const totalSP = tasks.reduce((s, t) => s + (t.points || 0), 0);
  const doneSP  = tasks.filter((t) => t.status === 'DONE').reduce((s, t) => s + (t.points || 0), 0);
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  const myTasks = await db.task.findMany({
    where: { projectId: project.id, assigneeId: user.id, status: { not: 'DONE' } },
    take: 6,
    orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
  });

  const activeCycle = await db.cycle.findFirst({
    where: { projectId: project.id, status: 'ACTIVE' },
    include: { tasks: { select: { id: true, status: true, points: true } } },
  });

  const cycleTotal    = activeCycle?.tasks.length || 0;
  const cycleDone     = activeCycle?.tasks.filter((t) => t.status === 'DONE').length || 0;
  const cycleSPDone   = activeCycle?.tasks.filter((t) => t.status === 'DONE').reduce((s, t) => s + (t.points || 0), 0) || 0;
  const cycleSPTotal  = activeCycle?.tasks.reduce((s, t) => s + (t.points || 0), 0) || 0;
  const cycleProgress = cycleTotal > 0 ? Math.round((cycleDone / cycleTotal) * 100) : 0;

  const urgentCount = tasks.filter((t) => t.priority === 'URGENT').length;
  const highCount   = tasks.filter((t) => t.priority === 'HIGH').length;
  const medCount    = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowCount    = tasks.filter((t) => t.priority === 'LOW').length;

  const firstNamepart = user.fullName.split(' ')[0];

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    TODO:        { bg: 'rgba(49,130,206,0.15)',  color: '#63B3ED', label: 'К выполнению' },
    IN_PROGRESS: { bg: 'rgba(221,107,32,0.15)', color: '#F6AD55', label: 'В работе' },
    REVIEW:      { bg: 'rgba(128,90,213,0.15)', color: '#B794F4', label: 'Проверка' },
    BACKLOG:     { bg: 'rgba(74,85,104,0.15)',  color: '#A0AEC0', label: 'Бэклог' },
    DONE:        { bg: 'rgba(56,161,105,0.15)', color: '#68D391', label: 'Готово' },
  };

  const PRIORITY_DOT: Record<string, string> = {
    URGENT: '#FC8181', HIGH: '#F6AD55', MEDIUM: '#F6E05E', LOW: '#63B3ED', NONE: '#718096',
  };

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }} className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
            Привет, {firstNamepart}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {project.name} · {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/dashboard/board" className="premium-btn" style={{ textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="5" height="18" rx="1.5" stroke="#fff" strokeWidth="1.8" />
            <rect x="10" y="3" width="5" height="12" rx="1.5" stroke="#fff" strokeWidth="1.8" />
            <rect x="17" y="3" width="4" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8" />
          </svg>
          Открыть доску
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Всего задач',      value: total,    sub: `${backlog} в бэклоге`,   color: 'var(--centras-blue)', pct: 100 },
          { label: 'В работе',         value: inProg,   sub: `+ ${review} на проверке`, color: '#F6AD55',            pct: total > 0 ? (inProg / total) * 100 : 0 },
          { label: 'Завершено',        value: done,     sub: `${completion}% от всех`,  color: '#68D391',            pct: completion },
          { label: 'Story Points',     value: `${doneSP}/${totalSP}`, sub: 'выполнено', color: 'var(--centras-violet)', pct: totalSP > 0 ? (doneSP / totalSP) * 100 : 0 },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {card.label}
            </span>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{card.value}</span>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${card.pct}%`, background: card.color }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Active sprint */}
          {activeCycle ? (
            <div className="sprint-card active-sprint">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-active">Активный спринт</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{activeCycle.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {activeCycle.startDate ? new Date(activeCycle.startDate).toLocaleDateString('ru-RU') : '—'}
                    {' — '}
                    {activeCycle.endDate ? new Date(activeCycle.endDate).toLocaleDateString('ru-RU') : '—'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: cycleProgress === 100 ? '#68D391' : '#fff' }}>{cycleProgress}%</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cycleDone}/{cycleTotal} задач</div>
                </div>
              </div>
              <div className="progress-bar-track" style={{ height: 8, marginBottom: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${cycleProgress}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>SP: <strong style={{ color: '#fff' }}>{cycleSPDone}/{cycleSPTotal}</strong></span>
                <span>Оставшиеся: <strong style={{ color: '#fff' }}>{cycleTotal - cycleDone}</strong></span>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border-color)',
                borderRadius: 14,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Нет активного спринта</p>
                <Link href="/dashboard/sprints" style={{ fontSize: 13, color: 'var(--centras-violet)', textDecoration: 'none', fontWeight: 600 }}>
                  Создать и запустить спринт →
                </Link>
              </div>
            </div>
          )}

          {/* My tasks */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Мои задачи</h3>
              <Link href="/dashboard/board" style={{ fontSize: 12, color: 'var(--centras-violet)', textDecoration: 'none', fontWeight: 600 }}>
                Все →
              </Link>
            </div>
            {myTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myTasks.map((t) => {
                  const st = STATUS_STYLE[t.status] || STATUS_STYLE.TODO;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 10,
                        transition: 'border-color 0.15s',
                      }}
                      className="task-row"
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: PRIORITY_DOT[t.priority] || '#718096',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.points > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                            {t.points} SP
                          </span>
                        )}
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, fontWeight: 600, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Нет активных задач — отличный день!
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Priority breakdown */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 20 }}>По приоритетам</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Критический', count: urgentCount, color: '#FC8181' },
                { label: 'Высокий',     count: highCount,   color: '#F6AD55' },
                { label: 'Средний',     count: medCount,    color: '#F6E05E' },
                { label: 'Низкий',      count: lowCount,    color: '#63B3ED' },
              ].map((p) => (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                      {p.label}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{p.count}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Быстрые действия</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/dashboard/board" className="dashboard-action-btn-violet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Создать задачу
              </Link>
              <Link href="/dashboard/sprints" className="dashboard-action-btn-blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Управление спринтами
              </Link>
              <Link href="/dashboard/ai" className="dashboard-action-btn-violet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Аналитика проекта
              </Link>
            </div>
          </div>

          {/* Status distribution */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Распределение</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Бэклог',    count: backlog,                                              color: '#4A5568' },
                { label: 'К выполн.',  count: tasks.filter((t) => t.status === 'TODO').length,     color: '#3182CE' },
                { label: 'В работе',  count: inProg,                                               color: '#DD6B20' },
                { label: 'Проверка',  count: review,                                               color: '#805AD5' },
                { label: 'Готово',    count: done,                                                 color: '#38A169' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.count}</span>
                  <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
