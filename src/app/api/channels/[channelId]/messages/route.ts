import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

type Params = Promise<{ channelId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { channelId } = await params;

    // Check project membership via channel -> project -> membership
    const channel = await db.chatChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Канал не найден' }, { status: 404 });
    }

    const membership = await db.projectMember.findFirst({
      where: { projectId: channel.projectId, userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Нет доступа к чату' }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { channelId },
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

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при загрузке сообщений' },
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

    const { channelId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 });
    }

    // Check membership
    const channel = await db.chatChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Канал не найден' }, { status: 404 });
    }

    const membership = await db.projectMember.findFirst({
      where: { projectId: channel.projectId, userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Нет доступа к чату' }, { status: 403 });
    }

    const message = await db.message.create({
      data: {
        content,
        channelId,
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

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка при отправке сообщения' },
      { status: 500 }
    );
  }
}
