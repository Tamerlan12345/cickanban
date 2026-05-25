import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get user's projects
    const memberships = await db.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            workspaceId: true,
          },
        },
      },
    });

    return NextResponse.json({
      authenticated: true,
      user,
      projects: memberships.map((m) => ({
        id: m.project.id,
        name: m.project.name,
        description: m.project.description,
        role: m.role,
      })),
    });
  } catch (error) {
    console.error('API Auth Me error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при получении данных сессии' },
      { status: 500 }
    );
  }
}
