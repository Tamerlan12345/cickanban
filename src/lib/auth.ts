import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { db } from './db';

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
