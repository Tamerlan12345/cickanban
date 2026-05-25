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

    const channels = await db.chatChannel.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(channels);
  } catch (error: any) {
    console.error('Fetch channels error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке каналов чата' },
      { status: 500 }
    );
  }
}
