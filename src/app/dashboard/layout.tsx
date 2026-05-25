import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch projects user belongs to
  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  const projects = memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    description: m.project.description || '',
    role: m.role,
  }));

  // If somehow user has no projects, create a default one (fallback)
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
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'PM',
      },
    });

    projects.push({
      id: project.id,
      name: project.name,
      description: project.description || '',
      role: 'PM',
    });
  }

  const sanitizedUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#070512' }}>
      <Sidebar user={sanitizedUser} projects={projects} />
      <main
        style={{
          flexGrow: 1,
          height: '100vh',
          overflowY: 'auto',
          background: 'radial-gradient(circle at top left, #0d0924 0%, #070512 100%)',
          position: 'relative',
        }}
      >
        {children}
      </main>
    </div>
  );
}
