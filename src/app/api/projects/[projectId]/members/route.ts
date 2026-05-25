import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ projectId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check project membership
    const membership = await db.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Нет доступа к проекту' }, { status: 403 });
    }

    const members = await db.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.fullName,
        avatarUrl: m.user.avatarUrl,
        projectRole: m.role,
      }))
    );
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке участников' },
      { status: 500 }
    );
  }
}
