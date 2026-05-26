import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import { DashboardShell } from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth');

  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: { select: { id: true, name: true, description: true } },
    },
  });

  let projects = memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    description: m.project.description || '',
    role: m.role,
  }));

  // Auto-create project if user has none
  if (projects.length === 0) {
    const workspace = await db.workspace.create({
      data: {
        name: 'Centras Workspace',
        slug: 'centras-' + Math.random().toString(36).substring(2, 7),
      },
    });
    const project = await db.project.create({
      data: {
        name: 'Centras ScramBan Project',
        description: 'Панель отслеживания задач и Scrum/Kanban процессов.',
        workspaceId: workspace.id,
      },
    });
    await db.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: 'PM' },
    });
    projects = [{ id: project.id, name: project.name, description: project.description || '', role: 'PM' }];
  }

  const sanitizedUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  const activeProjectId = projects[0]?.id || '';

  return (
    <DashboardShell
      user={sanitizedUser}
      projects={projects}
      activeProjectId={activeProjectId}
    >
      {children}
    </DashboardShell>
  );
}
