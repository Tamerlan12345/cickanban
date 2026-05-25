import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ taskId: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { taskId } = await params;

    // Find the task
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Check project membership
    const membership = await db.projectMember.findFirst({
      where: { projectId: task.projectId, userId: user.id },
    });

    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав для редактирования задачи' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, priority, points, dueDate, assigneeId, cycleId, aiEstimate, subtasks } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (points !== undefined) updateData.points = parseInt(points) || 0;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (cycleId !== undefined) updateData.cycleId = cycleId || null;
    if (aiEstimate !== undefined) updateData.aiEstimate = aiEstimate;
    if (subtasks !== undefined) updateData.subtasks = subtasks;

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
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

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при обновлении задачи' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { taskId } = await params;

    // Find the task
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Check project membership and roles
    const membership = await db.projectMember.findFirst({
      where: { projectId: task.projectId, userId: user.id },
    });

    if (!membership || (membership.role !== 'PM' && task.creatorId !== user.id)) {
      return NextResponse.json({ error: 'Недостаточно прав для удаления задачи' }, { status: 403 });
    }

    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при удалении задачи' },
      { status: 500 }
    );
  }
}
