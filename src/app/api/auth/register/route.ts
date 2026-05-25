import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Пожалуйста, заполните все поля' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    
    // Determine user role (first registered user is ADMIN, others are MEMBER)
    const usersCount = await db.user.count();
    const role = usersCount === 0 ? 'ADMIN' : 'MEMBER';

    // Create user in database
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
      },
    });

    // Onboarding: Create a default Workspace and Project for the first workspace setup
    const workspace = await db.workspace.create({
      data: {
        name: 'Centras Insurance Workspace',
        slug: 'centras-insurance-' + Math.random().toString(36).substring(2, 7),
      },
    });

    const project = await db.project.create({
      data: {
        name: 'Centras ScramBan Project',
        description: 'Основная Kanban-доска для отслеживания задач отдела страхования.',
        workspaceId: workspace.id,
      },
    });

    // Add user as PM to the project
    await db.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'PM',
      },
    });

    // Create default Chat Channels
    const generalChannel = await db.chatChannel.create({
      data: {
        name: 'Общий чат команды',
        type: 'PROJECT',
        projectId: project.id,
      },
    });

    const boardChannel = await db.chatChannel.create({
      data: {
        name: 'Чат Scrum/Kanban доски',
        type: 'BOARD',
        projectId: project.id,
      },
    });

    // Create a default Cycle (Sprint 1)
    await db.cycle.create({
      data: {
        name: 'Спринт 1: Старт проекта',
        description: 'Первый запуск ScramBan процессов',
        projectId: project.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days later
      },
    });

    // Create JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      project: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при регистрации' },
      { status: 500 }
    );
  }
}
