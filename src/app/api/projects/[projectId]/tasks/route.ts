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

    // Fetch tasks
    const tasks = await db.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        cycle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке задач' },
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

    const { projectId } = await params;

    // Check membership and role
    const membership = await db.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });

    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав для создания задачи' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, priority, points, dueDate, assigneeId, cycleId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно' }, { status: 400 });
    }

    // Create task
    const task = await db.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'NONE',
        points: points ? parseInt(points) : 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        cycleId: cycleId || null,
        creatorId: user.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при создании задачи' },
      { status: 500 }
    );
  }
}
