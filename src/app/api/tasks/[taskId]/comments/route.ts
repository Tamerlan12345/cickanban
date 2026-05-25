import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ taskId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { taskId } = await params;

    const comments = await db.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке комментариев' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 });
    }

    const comment = await db.taskComment.create({
      data: {
        content,
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при добавлении комментария' },
      { status: 500 }
    );
  }
}
