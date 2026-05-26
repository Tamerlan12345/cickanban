import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Регистрация новых пользователей отключена.' },
    { status: 400 }
  );
}
