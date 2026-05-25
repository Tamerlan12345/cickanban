'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  points: number;
  aiEstimate: string | null;
  dueDate: string | null;
  assigneeId: string | null;
  cycleId: string | null;
  subtasks: string | null; // JSON String
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  creator?: {
    id: string;
    fullName: string;
  };
  cycle?: {
    id: string;
    name: string;
  } | null;
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  projectRole: string;
}

interface Cycle {
  id: string;
  name: string;
}

export default function BoardPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  // View modes: 'kanban' or 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');

  // Collapsible list groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Drag states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modals / Details states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // Subtasks list in active task
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Create Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('TODO');
  const [newPriority, setNewPriority] = useState('NONE');
  const [newPoints, setNewPoints] = useState(0);
  const [newAssignee, setNewAssignee] = useState('');
  const [newCycle, setNewCycle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // AI loading states
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiBreakdownLoading, setAiBreakdownLoading] = useState(false);

  // Autosave status indicator
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>('saved');

  useEffect(() => {
    const savedProjectId = localStorage.getItem('selected_project_id');
    if (savedProjectId) {
      setProjectId(savedProjectId);
    } else {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.projects && data.projects.length > 0) {
            setProjectId(data.projects[0].id);
            localStorage.setItem('selected_project_id', data.projects[0].id);
          } else {
            setLoading(false);
          }
        });
    }
  }, []);

  const loadBoardData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [tasksRes, membersRes, cyclesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/cycles`),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (cyclesRes.ok) setCycles(await cyclesRes.json());
    } catch (e) {
      console.error('Error loading board data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadBoardData();
    }
  }, [projectId]);

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    // Optimistic Update
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1 || tasks[taskIndex].status === targetStatus) return;

    const oldStatus = tasks[taskIndex].status;
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex].status = targetStatus;
    setTasks(updatedTasks);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (err) {
      console.error(err);
      // Revert if error
      const revertedTasks = [...tasks];
      const revIndex = revertedTasks.findIndex((t) => t.id === taskId);
      if (revIndex !== -1) {
        revertedTasks[revIndex].status = oldStatus;
        setTasks(revertedTasks);
      }
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          status: newStatus,
          priority: newPriority,
          points: newPoints,
          dueDate: newDueDate || null,
          assigneeId: newAssignee || null,
          cycleId: newCycle || null,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewStatus('TODO');
        setNewPriority('NONE');
        setNewPoints(0);
        setNewAssignee('');
        setNewCycle('');
        setNewDueDate('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load Task comments
  const loadComments = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectTask = (task: Task) => {
    setSelectedTask(task);
    setComments([]);
    setNewComment('');
    
    const parsedSubtasks = task.subtasks ? JSON.parse(task.subtasks) : [];
    setSubtasks(parsedSubtasks);

    loadComments(task.id);
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const added = await res.json();
        setComments((prev) => [...prev, added]);
        setNewComment('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run Gemini AI estimation
  const handleAIEstimate = async () => {
    if (!selectedTask) return;
    setAiEstimating(true);

    try {
      const res = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const justificationText = `ИИ Рекомендовал ${data.points} SP: ${data.justification}`;
        
        handlePropertyChange('points', data.points);
        handlePropertyChange('aiEstimate', justificationText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiEstimating(false);
    }
  };

  // Run Gemini AI decomposition
  const handleAIBreakdown = async () => {
    if (!selectedTask) return;
    setAiBreakdownLoading(true);

    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const formatted: Subtask[] = (data.subtasks || []).map((subTitle: string) => ({
          id: Math.random().toString(36).substring(2, 9),
          title: subTitle,
          completed: false,
        }));
        
        const mergedSubtasks = [...subtasks, ...formatted];
        setSubtasks(mergedSubtasks);
        
        const subtasksJson = JSON.stringify(mergedSubtasks);
        handlePropertyChange('subtasks', subtasksJson);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiBreakdownLoading(false);
    }
  };

  // Property Autosave mechanism
  const handlePropertyChange = async (key: string, value: any) => {
    if (!selectedTask) return;

    setSaveStatus('saving');

    let updatedTask = { ...selectedTask, [key]: value };

    if (key === 'assigneeId') {
      const assigneeObj = members.find((m) => m.id === value) || null;
      updatedTask.assignee = assigneeObj ? {
        id: assigneeObj.id,
        fullName: assigneeObj.fullName,
        email: assigneeObj.email,
        avatarUrl: assigneeObj.avatarUrl
      } : null;
    }

    setSelectedTask(updatedTask);

    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? { ...t, ...updatedTask } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) throw new Error('Failed autosaving');
      
      setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setSaveStatus(null);
    }
  };

  // Manage Subtasks locally and save
  const toggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((sub) =>
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    );
    setSubtasks(updated);
    handlePropertyChange('subtasks', JSON.stringify(updated));
  };

  const deleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((sub) => sub.id !== subtaskId);
    setSubtasks(updated);
    handlePropertyChange('subtasks', JSON.stringify(updated));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    handlePropertyChange('subtasks', JSON.stringify(updated));
  };

  // Collapsible headers for List View
  const toggleGroupCollapse = (status: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  // Task filtering logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'ALL' || task.assigneeId === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const columns = [
    { title: '📥 Беклог (Backlog)', status: 'BACKLOG', icon: '📥', color: 'var(--status-backlog)' },
    { title: '📋 К выполнению (To Do)', status: 'TODO', icon: '📋', color: 'var(--status-todo)' },
    { title: '⚙️ В работе (In Progress)', status: 'IN_PROGRESS', icon: '⚙️', color: 'var(--status-in-progress)' },
    { title: '👀 На проверке (Review)', status: 'REVIEW', icon: '👀', color: 'var(--status-review)' },
    { title: '✅ Выполнено (Done)', status: 'DONE', icon: '✅', color: 'var(--status-done)' },
  ];

  const getPriorityLabel = (priority: string) => {
    const pMap: Record<string, string> = {
      URGENT: '🚨 Критический',
      HIGH: '🟠 Высокий',
      MEDIUM: '🟡 Средний',
      LOW: '🔵 Низкий',
      NONE: '⚫ Без приор.',
    };
    return pMap[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      URGENT: '#E53E3E',
      HIGH: '#DD6B20',
      MEDIUM: '#D69E2E',
      LOW: '#3182CE',
      NONE: 'var(--text-muted)',
    };
    return colorMap[priority] || '#fff';
  };

  if (loading && tasks.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h3>Загрузка доски...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '30px' }}>
      {/* Board Top Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            Centras ScramBan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Панель управления задачами команды</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* View Toggles */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: viewMode === 'kanban' ? 'var(--centras-gradient)' : 'transparent',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📊 Доска
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--centras-gradient)' : 'transparent',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📋 Список
            </button>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="premium-btn">
            ➕ Создать задачу
          </button>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          padding: '12px 18px',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          borderRadius: '10px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="🔍 Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="premium-input"
            style={{ width: '100%', paddingLeft: '32px', height: '36px' }}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Приоритет:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="premium-input"
            style={{ height: '36px', padding: '0 10px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
          >
            <option value="ALL" style={{ background: '#0b081a' }}>Все</option>
            <option value="URGENT" style={{ background: '#0b081a' }}>🚨 Критический</option>
            <option value="HIGH" style={{ background: '#0b081a' }}>🟠 Высокий</option>
            <option value="MEDIUM" style={{ background: '#0b081a' }}>🟡 Средний</option>
            <option value="LOW" style={{ background: '#0b081a' }}>🔵 Низкий</option>
            <option value="NONE" style={{ background: '#0b081a' }}>⚫ Без приоритета</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Исполнитель:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="premium-input"
            style={{ height: '36px', padding: '0 10px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
          >
            <option value="ALL" style={{ background: '#0b081a' }}>Все участники</option>
            {members.map((member) => (
              <option key={member.id} value={member.id} style={{ background: '#0b081a' }}>
                👤 {member.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Reset filter button */}
        {(searchQuery || filterPriority !== 'ALL' || filterAssignee !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterPriority('ALL');
              setFilterAssignee('ALL');
            }}
            className="premium-btn-secondary"
            style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Main Board View: Kanban vs List */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexGrow: 1,
              overflowX: 'auto',
              alignItems: 'stretch',
              paddingBottom: '20px',
            }}
          >
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);
              const isOver = dragOverColumn === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className="glass-panel"
                  style={{
                    width: '320px',
                    flexShrink: 0,
                    borderRadius: '16px',
                    background: isOver ? 'rgba(38, 28, 74, 0.55)' : 'var(--bg-panel)',
                    borderColor: isOver ? 'var(--centras-violet)' : 'var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 12px',
                    maxHeight: 'calc(100vh - 240px)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: col.color }}>{col.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>{col.title.split(' ')[1]}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexGrow: 1, padding: '4px' }}>
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => selectTask(task)}
                        className="glass-card"
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          cursor: 'grab',
                          opacity: draggedTaskId === task.id ? 0.4 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: '1.4' }}>
                          {task.title}
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: `${getPriorityColor(task.priority)}22`,
                                color: getPriorityColor(task.priority),
                              }}
                            >
                              {task.priority !== 'NONE' ? task.priority : 'Без приор.'}
                            </span>

                            {task.points > 0 && (
                              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(122, 27, 140, 0.15)', color: '#D6BCFA', padding: '2px 6px', borderRadius: '4px', border: '1px dashed rgba(122, 27, 140, 0.4)' }}>
                                ⚡ {task.points} SP
                              </span>
                            )}
                          </div>

                          {task.assignee ? (
                            <div
                              title={task.assignee.fullName}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'var(--centras-gradient)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {task.assignee.fullName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                              👤
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);
              const isCollapsed = collapsedGroups[col.status];

              return (
                <div key={col.status} className="glass-panel" style={{ borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroupCollapse(col.status)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#fff' }}>
                        {col.icon} {col.title.split(' ')[1]}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Group Items list */}
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '14px', gap: '8px' }}>
                      {colTasks.length > 0 ? (
                        colTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => selectTask(task)}
                            className="glass-card"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexGrow: 1 }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                {task.title}
                              </span>
                              
                              {task.subtasks && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  ({JSON.parse(task.subtasks).filter((s: Subtask) => s.completed).length} / {JSON.parse(task.subtasks).length} подзадач)
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: `${getPriorityColor(task.priority)}15`,
                                  color: getPriorityColor(task.priority),
                                }}
                              >
                                {getPriorityLabel(task.priority)}
                              </span>

                              {task.points > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(122, 27, 140, 0.15)', color: '#D6BCFA', padding: '4px 8px', borderRadius: '4px' }}>
                                  ⚡ {task.points} SP
                                </span>
                              )}

                              {task.dueDate && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  📅 {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}

                              {task.assignee ? (
                                <div
                                  title={task.assignee.fullName}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--centras-gradient)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {task.assignee.fullName.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                                  👤
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          В этой колонке нет задач.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel" style={{ width: '540px', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Создать новую задачу</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Название задачи</label>
                <input
                  type="text"
                  placeholder="Например, разработка ЛК страхового брокера"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="premium-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Описание</label>
                <textarea
                  placeholder="Добавьте детальное описание..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="premium-input"
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Статус</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="premium-input">
                    <option value="BACKLOG" style={{ background: '#0b081a' }}>Беклог</option>
                    <option value="TODO" style={{ background: '#0b081a' }}>К выполнению</option>
                    <option value="IN_PROGRESS" style={{ background: '#0b081a' }}>В работе</option>
                    <option value="REVIEW" style={{ background: '#0b081a' }}>На проверке</option>
                    <option value="DONE" style={{ background: '#0b081a' }}>Выполнено</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Приоритет</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="premium-input">
                    <option value="NONE" style={{ background: '#0b081a' }}>Нет</option>
                    <option value="LOW" style={{ background: '#0b081a' }}>Низкий</option>
                    <option value="MEDIUM" style={{ background: '#0b081a' }}>Средний</option>
                    <option value="HIGH" style={{ background: '#0b081a' }}>Высокий</option>
                    <option value="URGENT" style={{ background: '#0b081a' }}>Критический</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Исполнитель</label>
                  <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="premium-input">
                    <option value="" style={{ background: '#0b081a' }}>Не назначен</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id} style={{ background: '#0b081a' }}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Спринт</label>
                  <select value={newCycle} onChange={(e) => setNewCycle(e.target.value)} className="premium-input">
                    <option value="" style={{ background: '#0b081a' }}>Вне спринта</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id} style={{ background: '#0b081a' }}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Сложность (Story Points)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                    className="premium-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Срок сдачи (Due Date)</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="premium-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="premium-btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="premium-btn">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Side Sheet */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 998,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '850px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 0 0 0',
              animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Toolbar with Pulsing Autosave Status Dot */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 24px 16px 24px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Детали задачи #{selectedTask.id.substring(0, 8)}
                </span>
                
                {/* Glowing Autosave Dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: saveStatus === 'saving' ? 'var(--centras-violet)' : saveStatus === 'saved' ? 'var(--status-done)' : 'rgba(255,255,255,0.2)',
                      boxShadow: saveStatus === 'saving' ? '0 0 8px var(--centras-violet)' : saveStatus === 'saved' ? '0 0 8px var(--status-done)' : 'none',
                      animation: saveStatus === 'saving' ? 'pulse-saving 1s infinite alternate' : 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {saveStatus === 'saving' ? 'Синхронизация...' : 'Сохранено'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Split Content Area */}
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
              {/* Left Column: Title, Description, Checklist, Comments */}
              <div
                style={{
                  width: '60%',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  overflowY: 'auto',
                  borderRight: '1px solid var(--border-color)',
                  height: '100%',
                }}
              >
                {/* Title */}
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => handlePropertyChange('title', e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: 700,
                    width: '100%',
                  }}
                />

                {/* Description */}
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    Описание задачи
                  </label>
                  <textarea
                    value={selectedTask.description || ''}
                    onChange={(e) => handlePropertyChange('description', e.target.value)}
                    placeholder="Добавьте подробное описание этой задачи..."
                    className="premium-input"
                    rows={4}
                    style={{ width: '100%', resize: 'none', background: 'rgba(255,255,255,0.01)' }}
                  />
                </div>

                {/* Checklist with Invites for Gemini AI */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Чек-лист подзадач ({subtasks.filter((s) => s.completed).length} / {subtasks.length})
                    </label>
                    {subtasks.length > 0 && (
                      <button
                        onClick={handleAIBreakdown}
                        disabled={aiBreakdownLoading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--centras-violet)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {aiBreakdownLoading ? '⏳ Дополнение...' : '🪄 ИИ дополнить'}
                      </button>
                    )}
                  </div>

                  {subtasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => toggleSubtask(sub.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '13px', color: sub.completed ? 'var(--text-muted)' : '#fff', textDecoration: sub.completed ? 'line-through' : 'none' }}>
                              {sub.title}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteSubtask(sub.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--centras-red)', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Beautiful Empty State with Gemini AI generation invite (Know-how) */
                    <div
                      onClick={handleAIBreakdown}
                      style={{
                        padding: '24px 16px',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '16px',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--centras-violet)';
                        e.currentTarget.style.background = 'rgba(122, 27, 140, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {aiBreakdownLoading ? '⏳ ИИ анализирует и разбивает задачу...' : '🪄 Описание длинное. Разбить на подзадачи с помощью Gemini ИИ?'}
                    </div>
                  )}

                  <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Добавить пункт подзадачи..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="premium-input"
                      style={{ flexGrow: 1, height: '36px', fontSize: '13px' }}
                    />
                    <button type="submit" className="premium-btn" style={{ height: '36px', padding: '0 14px' }}>
                      Добавить
                    </button>
                  </form>
                </div>

                {/* Task Comments */}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '200px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                    Обсуждение задачи
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      overflowY: 'auto',
                      flexGrow: 1,
                      maxHeight: '220px',
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <strong style={{ color: 'var(--centras-blue)' }}>{comment.user.fullName}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#fff', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px' }}>
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Нет комментариев. Начните обсуждение!
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Напишите комментарий..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="premium-input"
                      style={{ flexGrow: 1, height: '36px' }}
                    />
                    <button type="submit" className="premium-btn" style={{ height: '36px' }}>
                      Отправить
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Properties Sidebar with Autosave inputs */}
              <div
                style={{
                  width: '40%',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  overflowY: 'auto',
                  height: '100%',
                }}
              >
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Свойства
                </h4>

                {/* Status selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Статус</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handlePropertyChange('status', e.target.value)}
                    className="premium-input"
                  >
                    <option value="BACKLOG" style={{ background: '#0b081a' }}>📥 Беклог</option>
                    <option value="TODO" style={{ background: '#0b081a' }}>📋 К выполнению</option>
                    <option value="IN_PROGRESS" style={{ background: '#0b081a' }}>⚙️ В работе</option>
                    <option value="REVIEW" style={{ background: '#0b081a' }}>👀 На проверке</option>
                    <option value="DONE" style={{ background: '#0b081a' }}>✅ Выполнено</option>
                  </select>
                </div>

                {/* Priority selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Приоритет</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => handlePropertyChange('priority', e.target.value)}
                    className="premium-input"
                  >
                    <option value="NONE" style={{ background: '#0b081a' }}>⚫ Без приоритета</option>
                    <option value="LOW" style={{ background: '#0b081a' }}>🔵 Низкий</option>
                    <option value="MEDIUM" style={{ background: '#0b081a' }}>🟡 Средний</option>
                    <option value="HIGH" style={{ background: '#0b081a' }}>🟠 Высокий</option>
                    <option value="URGENT" style={{ background: '#0b081a' }}>🚨 Критический</option>
                  </select>
                </div>

                {/* Assignee selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Исполнитель</label>
                  <select
                    value={selectedTask.assigneeId || ''}
                    onChange={(e) => handlePropertyChange('assigneeId', e.target.value || null)}
                    className="premium-input"
                  >
                    <option value="" style={{ background: '#0b081a' }}>Не назначен</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id} style={{ background: '#0b081a' }}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sprint selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Спринт</label>
                  <select
                    value={selectedTask.cycleId || ''}
                    onChange={(e) => handlePropertyChange('cycleId', e.target.value || null)}
                    className="premium-input"
                  >
                    <option value="" style={{ background: '#0b081a' }}>Вне спринта</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id} style={{ background: '#0b081a' }}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Story Points with integrated Gemini wand icon (Know-how) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Сложность (Story Points)</label>
                    <button
                      onClick={handleAIEstimate}
                      disabled={aiEstimating}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--centras-violet)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Получить оценку ИИ Gemini на основе названия и описания"
                    >
                      {aiEstimating ? '⏳...' : '🪄 ИИ оценить'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={selectedTask.points}
                    onChange={(e) => handlePropertyChange('points', parseInt(e.target.value) || 0)}
                    className="premium-input"
                  />
                  {selectedTask.aiEstimate && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        background: 'rgba(122, 27, 140, 0.06)',
                        border: '1px dashed rgba(122, 27, 140, 0.3)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        marginTop: '4px',
                        lineHeight: '1.4',
                      }}
                      title={selectedTask.aiEstimate}
                    >
                      💡 {selectedTask.aiEstimate.replace(/^(ИИ Рекомендация:|ИИ Рекомендовал\s\d+\sSP:)/, '').substring(0, 75)}...
                    </div>
                  )}
                </div>

                {/* Due date picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Срок сдачи (Due Date)</label>
                  <input
                    type="date"
                    value={selectedTask.dueDate ? selectedTask.dueDate.substring(0, 10) : ''}
                    onChange={(e) => handlePropertyChange('dueDate', e.target.value || null)}
                    className="premium-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes pulse-saving {
          from {
            opacity: 0.4;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
