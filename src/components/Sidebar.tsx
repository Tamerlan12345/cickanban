'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';

interface Project {
  id: string;
  name: string;
  description: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface SidebarProps {
  user: User;
  projects: Project[];
}

export const Sidebar: React.FC<SidebarProps> = ({ user, projects }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      // Auto-select first project
      const savedProjectId = localStorage.getItem('selected_project_id');
      const savedProject = projects.find((p) => p.id === savedProjectId);
      
      const project = savedProject || projects[0];
      setSelectedProject(project);
      localStorage.setItem('selected_project_id', project.id);
    }
  }, [projects, selectedProject]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || null;
    setSelectedProject(project);
    if (project) {
      localStorage.setItem('selected_project_id', project.id);
      router.refresh();
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/auth');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: '📋 Панель управления', path: '/dashboard' },
    { label: '📊 Kanban-доска', path: '/dashboard/board' },
    { label: '📈 ScramBan AI', path: '/dashboard/ai' },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        width: '280px',
        height: '100vh',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
      }}
    >
      {/* Brand logo */}
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <Logo size="sm" />
      </div>

      {/* Project info (read-only) */}
      <div style={{ marginBottom: '28px', paddingLeft: '8px' }}>
        <label
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Активный Проект
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14.5px',
            fontWeight: 600,
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          🚀 {selectedProject ? selectedProject.name : 'Centras ScramBan Project'}
        </div>
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <label
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '4px',
            display: 'block',
            paddingLeft: '8px',
          }}
        >
          Навигация
        </label>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'var(--centras-gradient)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                boxShadow: isActive ? 'var(--glow-blue)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile card & logout */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--centras-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: '#fff',
            }}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="premium-btn-secondary"
          style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          🚪 Выйти из системы
        </button>
      </div>
    </div>
  );
};
