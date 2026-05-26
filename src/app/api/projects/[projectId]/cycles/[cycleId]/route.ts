import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ projectId: string; cycleId: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { projectId, cycleId } = await params;
    const membership = await db.projectMember.findFirst({ where: { projectId, userId: user.id } });
    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, status, startDate, endDate } = body;

    // If activating this sprint, deactivate all others in the project
    if (status === 'ACTIVE') {
      await db.cycle.updateMany({
        where: { projectId, status: 'ACTIVE' },
        data: { status: 'PLANNING' },
      });
    }

    const updated = await db.cycle.update({
      where: { id: cycleId },
      data: {
        ...(name        !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status      !== undefined && { status }),
        ...(startDate   !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate     !== undefined && { endDate:   endDate   ? new Date(endDate)   : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update cycle error:', error);
    return NextResponse.json({ error: 'Ошибка обновления спринта' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { projectId, cycleId } = await params;
    const membership = await db.projectMember.findFirst({ where: { projectId, userId: user.id } });
    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    // Unlink tasks from this cycle before deleting
    await db.task.updateMany({ where: { cycleId }, data: { cycleId: null } });
    await db.cycle.delete({ where: { id: cycleId } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Delete cycle error:', error);
    return NextResponse.json({ error: 'Ошибка удаления спринта' }, { status: 500 });
  }
}
