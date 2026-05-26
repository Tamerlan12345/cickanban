'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';

interface Project { id: string; name: string; description: string; role: string; }
interface User { id: string; email: string; fullName: string; role: string; }

interface SidebarProps {
  user: User;
  projects: Project[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  {
    label: 'Обзор',
    path: '/dashboard',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="nav-icon">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    label: 'Доска',
    path: '/dashboard/board',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="nav-icon">
        <rect x="3" y="3" width="5" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="10" y="3" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="17" y="3" width="4" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    label: 'Спринты',
    path: '/dashboard/sprints',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="nav-icon">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Аналитика',
    path: '/dashboard/ai',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="nav-icon">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ user, projects, isMobileOpen, onMobileClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('selected_project_id') : null;
      const project = projects.find((p) => p.id === savedId) || projects[0];
      setSelectedProject(project);
      localStorage.setItem('selected_project_id', project.id);
    }
  }, [projects, selectedProject]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) { router.push('/auth'); router.refresh(); }
    } catch {}
  };

  const navigate = (path: string) => {
    router.push(path);
    onMobileClose?.();
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.path;
    return pathname.startsWith(item.path);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <aside className={`sidebar${isMobileOpen ? ' mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <Logo size="sm" />
      </div>

      {/* Active project chip */}
      <div style={{ padding: '12px 16px 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--centras-gradient)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedProject?.name || 'Centras ScramBan'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Навигация</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-nav-item${isActive(item) ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {isActive(item) && (
              <div
                style={{
                  marginLeft: 'auto',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--centras-violet)',
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-avatar">{getInitials(user.fullName)}</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.fullName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 1 }}>
              {user.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="premium-btn-secondary"
          style={{ width: '100%', padding: '8px 14px', fontSize: 13, justifyContent: 'center', gap: 8 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Выйти
        </button>
      </div>
    </aside>
  );
};
