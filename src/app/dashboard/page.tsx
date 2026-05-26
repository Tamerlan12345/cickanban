import React from 'react';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Find user's active project
  const membership = await db.projectMember.findFirst({
    where: { userId: user.id },
    include: { project: true },
  });

  const project = membership?.project;

  // If no project (should not happen due to layout), show placeholder
  if (!project) {
    return (
      <div style={{ padding: '40px', color: '#fff' }}>
        <h2>Проект не найден</h2>
      </div>
    );
  }

  // Load stats
  const tasks = await db.task.findMany({
    where: { projectId: project.id },
  });

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
  const donePoints = tasks.filter((t) => t.status === 'DONE').reduce((sum, t) => sum + (t.points || 0), 0);

  // My tasks
  const myTasks = await db.task.findMany({
    where: { projectId: project.id, assigneeId: user.id },
    take: 5,
    orderBy: { updatedAt: 'desc' },
  });

  // Active cycle
  const activeCycle = await db.cycle.findFirst({
    where: { projectId: project.id },
    orderBy: { startDate: 'desc' },
  });

  const cycleTasks = activeCycle ? tasks.filter((t) => t.cycleId === activeCycle.id) : [];
  const cycleDoneTasks = cycleTasks.filter((t) => t.status === 'DONE');
  const cycleProgress = cycleTasks.length > 0 ? Math.round((cycleDoneTasks.length / cycleTasks.length) * 100) : 0;

  // Priority stats
  const urgentCount = tasks.filter((t) => t.priority === 'URGENT').length;
  const highCount = tasks.filter((t) => t.priority === 'HIGH').length;
  const mediumCount = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowCount = tasks.filter((t) => t.priority === 'LOW').length;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Привет, {user.fullName}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Добро пожаловать в рабочее пространство <strong style={{ color: '#fff' }}>{project.name}</strong>.
          </p>
        </div>
        <Link href="/dashboard/board" className="premium-btn" style={{ textDecoration: 'none' }}>
          📋 Перейти к Kanban-доске
        </Link>
      </div>

      {/* Stats Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Всего Задач</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{totalTasks}</span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--centras-gradient)' }}></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>В работе</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{inProgressTasks}</span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--status-in-progress)' }}></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>На проверке</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{reviewTasks}</span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${totalTasks > 0 ? (reviewTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--status-review)' }}></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Завершено Story Points</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{donePoints} <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 400 }}>/ {totalPoints} SP</span></span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0}%`, height: '100%', background: 'var(--status-done)' }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Active Sprint Progress */}
          {activeCycle && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                    🏃‍♂️ {activeCycle.name}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Сроки: {activeCycle.startDate ? new Date(activeCycle.startDate).toLocaleDateString() : '—'} - {activeCycle.endDate ? new Date(activeCycle.endDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--centras-blue)' }}>{cycleProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${cycleProgress}%`, height: '100%', background: 'var(--centras-gradient)', borderRadius: '4px', boxShadow: 'var(--glow-blue)' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Всего задач в спринте: <strong>{cycleTasks.length}</strong></span>
                <span>Выполнено: <strong>{cycleDoneTasks.length}</strong></span>
              </div>
            </div>
          )}

          {/* User's assigned tasks */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>
              🎯 Мои Задачи ({myTasks.length})
            </h3>
            {myTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{task.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Сложность: {task.points} SP | Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: {
                            TODO: 'rgba(49, 130, 206, 0.15)',
                            IN_PROGRESS: 'rgba(221, 107, 32, 0.15)',
                            REVIEW: 'rgba(128, 90, 213, 0.15)',
                            DONE: 'rgba(56, 161, 105, 0.15)',
                          }[task.status] || 'rgba(255,255,255,0.1)',
                          color: {
                            TODO: '#63B3ED',
                            IN_PROGRESS: '#F6AD55',
                            REVIEW: '#B794F4',
                            DONE: '#68D391',
                          }[task.status] || '#FFF',
                          border: `1px solid ${{
                            TODO: 'var(--status-todo)',
                            IN_PROGRESS: 'var(--status-in-progress)',
                            REVIEW: 'var(--status-review)',
                            DONE: 'var(--status-done)',
                          }[task.status]}`,
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                У вас пока нет назначенных задач. Посмотрите доску, чтобы назначить себе задачи!
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Priorities Breakdown */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
              📊 Приоритеты задач
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Urgent */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>🚨 Критический (Urgent)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{urgentCount}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTasks > 0 ? (urgentCount / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--priority-urgent)' }}></div>
                </div>
              </div>

              {/* High */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>🟠 Высокий (High)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{highCount}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTasks > 0 ? (highCount / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--priority-high)' }}></div>
                </div>
              </div>

              {/* Medium */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>🟡 Средний (Medium)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{mediumCount}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTasks > 0 ? (mediumCount / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--priority-medium)' }}></div>
                </div>
              </div>

              {/* Low */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>🔵 Низкий (Low)</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{lowCount}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalTasks > 0 ? (lowCount / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--priority-low)' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
              Быстрые действия
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/dashboard/board?create=true"
                className="dashboard-action-btn-violet"
              >
                ➕ Создать новую задачу
              </Link>
              <Link
                href="/dashboard/chat"
                className="dashboard-action-btn-blue"
              >
                💬 Написать команде в чат
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
