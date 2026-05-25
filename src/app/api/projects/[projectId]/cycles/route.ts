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

    const membership = await db.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Нет доступа к проекту' }, { status: 403 });
    }

    const cycles = await db.cycle.findMany({
      where: { projectId },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(cycles);
  } catch (error: any) {
    console.error('Fetch cycles error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке спринтов' },
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

    const membership = await db.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });

    if (!membership || membership.role === 'GUEST') {
      return NextResponse.json({ error: 'Недостаточно прав для создания спринта' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Название спринта обязательно' }, { status: 400 });
    }

    const cycle = await db.cycle.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId,
      },
    });

    return NextResponse.json(cycle);
  } catch (error: any) {
    console.error('Create cycle error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при создании спринта' },
      { status: 500 }
    );
  }
}
