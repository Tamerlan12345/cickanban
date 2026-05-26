'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWidget } from './ChatWidget';
import { Logo } from './Logo';

interface User { id: string; email: string; fullName: string; role: string; }
interface Project { id: string; name: string; description: string; role: string; }

interface DashboardShellProps {
  user: User;
  projects: Project[];
  activeProjectId: string;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  user,
  projects,
  activeProjectId,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay${mobileSidebarOpen ? ' active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        user={user}
        projects={projects}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        {/* Mobile Header */}
        <header className="mobile-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Открыть меню"
          >
            <span />
            <span />
            <span />
          </button>
          <Logo size="sm" />
          <div style={{ width: 32 }} />
        </header>

        {/* Page Content */}
        <main className="app-main">
          {children}
        </main>
      </div>

      {/* Floating Chat Widget */}
      {activeProjectId && (
        <ChatWidget
          projectId={activeProjectId}
          currentUser={{
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          }}
        />
      )}
    </div>
  );
};
