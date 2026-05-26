'use client';

import React, { useState, useEffect } from 'react';

interface CycleTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  points: number;
}

interface Cycle {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  tasks: CycleTask[];
  progress: number;
  taskCount: number;
  doneCount: number;
  totalSP: number;
  doneSP: number;
}

interface BacklogTask {
  id: string;
  title: string;
  priority: string;
  points: number;
  status: string;
  cycleId: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PLANNING:  { label: 'Планируется', cls: 'badge-planning' },
  ACTIVE:    { label: 'Активен',     cls: 'badge-active' },
  COMPLETED: { label: 'Завершён',    cls: 'badge-completed' },
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: '#FC8181', HIGH: '#F6AD55', MEDIUM: '#F6E05E', LOW: '#63B3ED', NONE: '#718096',
};

export default function SprintsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [backlog, setBacklog] = useState<BacklogTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [creating, setCreating] = useState(false);

  // Expanded sprint (to show task list)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign task to sprint modal
  const [assignModal, setAssignModal] = useState<{ cycleId: string; cycleName: string } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('selected_project_id');
    if (id) setProjectId(id);
  }, []);

  const loadData = async (pid: string) => {
    setLoading(true);
    try {
      const [cyclesRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${pid}/cycles`),
        fetch(`/api/projects/${pid}/tasks`),
      ]);
      if (cyclesRes.ok) setCycles(await cyclesRes.json());
      if (tasksRes.ok) {
        const tasks: BacklogTask[] = await tasksRes.json();
        setBacklog(tasks);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (projectId) loadData(projectId);
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !projectId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc, startDate: newStart || null, endDate: newEnd || null }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName(''); setNewDesc(''); setNewStart(''); setNewEnd('');
        loadData(projectId);
      }
    } finally { setCreating(false); }
  };

  const updateCycleStatus = async (cycleId: string, status: string) => {
    if (!projectId) return;
    await fetch(`/api/projects/${projectId}/cycles/${cycleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadData(projectId);
  };

  const deleteCycle = async (cycleId: string) => {
    if (!projectId || !confirm('Удалить этот спринт? Задачи останутся в проекте.')) return;
    await fetch(`/api/projects/${projectId}/cycles/${cycleId}`, { method: 'DELETE' });
    loadData(projectId);
  };

  const assignTaskToCycle = async (taskId: string, cycleId: string | null) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleId }),
    });
    if (projectId) loadData(projectId);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const activeSprintCount = cycles.filter((c) => c.status === 'ACTIVE').length;
  const backlogUnassigned = backlog.filter((t) => !t.cycleId && t.status !== 'DONE');

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="sprint-card" style={{ height: 100, animation: 'skeleton-pulse 1.5s infinite alternate' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: 960, margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
            Управление спринтами
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {cycles.length} спринт{cycles.length !== 1 ? 'ов' : ''} · {activeSprintCount > 0 ? `${activeSprintCount} активен` : 'нет активных'}
          </p>
        </div>
        <button className="premium-btn" onClick={() => setShowCreate(true)} style={{ gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Новый спринт
        </button>
      </div>

      {/* Sprint list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
        {cycles.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed var(--border-color)',
              borderRadius: 16,
              color: 'var(--text-muted)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>Спринты не созданы</p>
            <p style={{ fontSize: 13 }}>Создайте первый спринт, чтобы начать планирование</p>
          </div>
        ) : (
          cycles.map((cycle) => {
            const daysLeft = getDaysLeft(cycle.endDate);
            const isExpanded = expandedId === cycle.id;
            const meta = STATUS_META[cycle.status] || STATUS_META.PLANNING;

            return (
              <div
                key={cycle.id}
                className={`sprint-card${cycle.status === 'ACTIVE' ? ' active-sprint' : ''}`}
              >
                {/* Sprint card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: 0 }}>
                        {cycle.name}
                      </h3>
                    </div>

                    {cycle.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                        {cycle.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: 14 }}>
                      <span>
                        <span style={{ color: 'var(--text-secondary)' }}>Начало:</span> {formatDate(cycle.startDate)}
                      </span>
                      <span>
                        <span style={{ color: 'var(--text-secondary)' }}>Конец:</span> {formatDate(cycle.endDate)}
                      </span>
                      {cycle.status === 'ACTIVE' && daysLeft !== null && (
                        <span style={{ color: daysLeft < 0 ? '#FC8181' : daysLeft <= 3 ? '#F6AD55' : '#68D391' }}>
                          {daysLeft < 0 ? `Просрочен на ${Math.abs(daysLeft)} д.` : daysLeft === 0 ? 'Последний день!' : `Осталось ${daysLeft} д.`}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="progress-bar-track" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${cycle.progress}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cycle.progress === 100 ? '#68D391' : '#fff', minWidth: 36 }}>
                        {cycle.progress}%
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {cycle.doneCount}/{cycle.taskCount} задач · {cycle.doneSP}/{cycle.totalSP} SP
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    {cycle.status === 'PLANNING' && (
                      <button
                        className="premium-btn premium-btn-sm"
                        onClick={() => updateCycleStatus(cycle.id, 'ACTIVE')}
                      >
                        ▶ Начать
                      </button>
                    )}
                    {cycle.status === 'ACTIVE' && (
                      <>
                        <button
                          className="premium-btn premium-btn-sm"
                          onClick={() => setAssignModal({ cycleId: cycle.id, cycleName: cycle.name })}
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)' }}
                        >
                          + Задачи
                        </button>
                        <button
                          className="premium-btn-secondary premium-btn-sm"
                          onClick={() => updateCycleStatus(cycle.id, 'COMPLETED')}
                        >
                          ✓ Завершить
                        </button>
                      </>
                    )}
                    {cycle.status === 'COMPLETED' && (
                      <span style={{ fontSize: 12, color: '#68D391', fontWeight: 600 }}>✓ Закрыт</span>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : cycle.id)}
                      className="premium-btn-secondary premium-btn-sm"
                      style={{ fontSize: 11 }}
                    >
                      {isExpanded ? '▲ Скрыть' : '▼ Задачи'}
                    </button>
                    <button
                      onClick={() => deleteCycle(cycle.id)}
                      className="premium-btn-danger premium-btn-sm"
                      style={{ padding: '5px 10px' }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {/* Expanded task list */}
                {isExpanded && cycle.tasks.length > 0 && (
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cycle.tasks.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: PRIORITY_COLOR[t.priority] || '#718096',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ flex: 1, color: t.status === 'DONE' ? 'var(--text-muted)' : '#fff', textDecoration: t.status === 'DONE' ? 'line-through' : 'none' }}>
                            {t.title}
                          </span>
                          {t.points > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                              {t.points} SP
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 600,
                              background: {
                                TODO: 'rgba(49,130,206,0.15)', IN_PROGRESS: 'rgba(221,107,32,0.15)',
                                REVIEW: 'rgba(128,90,213,0.15)', DONE: 'rgba(56,161,105,0.15)',
                                BACKLOG: 'rgba(74,85,104,0.15)',
                              }[t.status] || 'rgba(255,255,255,0.05)',
                              color: {
                                TODO: '#63B3ED', IN_PROGRESS: '#F6AD55',
                                REVIEW: '#B794F4', DONE: '#68D391', BACKLOG: '#A0AEC0',
                              }[t.status] || '#fff',
                            }}
                          >
                            {t.status}
                          </span>
                          <button
                            onClick={() => assignTaskToCycle(t.id, null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
                            title="Убрать из спринта"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && cycle.tasks.length === 0 && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    В этом спринте нет задач. Назначьте задачи из бэклога.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Backlog section */}
      {backlogUnassigned.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
              <rect x="3" y="10" width="18" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
              <rect x="3" y="17" width="12" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            Бэклог — без спринта ({backlogUnassigned.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {backlogUnassigned.slice(0, 20).map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: PRIORITY_COLOR[task.priority] || '#718096',
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, color: '#fff' }}>{task.title}</span>
                {task.points > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                    {task.points} SP
                  </span>
                )}
                {/* Quick-assign to active sprint */}
                {cycles.filter((c) => c.status === 'ACTIVE').map((c) => (
                  <button
                    key={c.id}
                    onClick={() => assignTaskToCycle(task.id, c.id)}
                    className="premium-btn-secondary premium-btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    → {c.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Sprint Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
                Новый спринт
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Название *
                </label>
                <input
                  type="text"
                  placeholder="Sprint 1 — Авторизация и онбординг"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="premium-input"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Описание
                </label>
                <textarea
                  placeholder="Цели спринта..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="premium-input"
                  rows={3}
                  style={{ resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Начало
                  </label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="premium-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Завершение
                  </label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="premium-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="premium-btn-secondary" onClick={() => setShowCreate(false)}>
                  Отмена
                </button>
                <button type="submit" className="premium-btn" disabled={creating || !newName.trim()}>
                  {creating ? 'Создаю...' : 'Создать спринт'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
