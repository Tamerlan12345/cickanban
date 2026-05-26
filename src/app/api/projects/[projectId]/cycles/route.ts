import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ projectId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { projectId } = await params;

    const membership = await db.projectMember.findFirst({ where: { projectId, userId: user.id } });
    if (!membership) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

    const cycles = await db.cycle.findMany({
      where: { projectId },
      include: {
        tasks: {
          select: { id: true, status: true, points: true, title: true, priority: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Augment each cycle with progress stats
    const augmented = cycles.map((c) => {
      const total = c.tasks.length;
      const done  = c.tasks.filter((t) => t.status === 'DONE').length;
      const totalSP = c.tasks.reduce((s, t) => s + (t.points || 0), 0);
      const doneSP  = c.tasks.filter((t) => t.status === 'DONE').reduce((s, t) => s + (t.points || 0), 0);
      return {
        ...c,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        taskCount: total,
        doneCount: done,
        totalSP,
        doneSP,
      };
    });

    return NextResponse.json(augmented);
  } catch (error: any) {
    console.error('Fetch cycles error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки спринтов' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const { projectId } = await params;
    const membership = await db.projectMember.findFirst({ where: { projectId, userId: user.id } });
    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const { name, description, startDate, endDate } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });

    const cycle = await db.cycle.create({
      data: {
        name: name.trim(),
        description: description || null,
        status: 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId,
      },
    });

    return NextResponse.json(cycle);
  } catch (error: any) {
    console.error('Create cycle error:', error);
    return NextResponse.json({ error: 'Ошибка создания спринта' }, { status: 500 });
  }
}
