import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Пожалуйста, укажите email и пароль' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

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

    // Find user's first project to redirect
    const membership = await db.projectMember.findFirst({
      where: { userId: user.id },
      include: { project: true },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      project: membership ? { id: membership.projectId, name: membership.project.name } : null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при входе' },
      { status: 500 }
    );
  }
}
