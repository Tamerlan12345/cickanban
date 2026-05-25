'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if already authenticated on load
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, fullName };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Что-то пошло не так');
      }

      // Success - Redirect
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #120c2b 0%, #070512 100%)',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Logo size="lg" className="mb-8" style={{ marginBottom: '32px' }} />

        <div style={{ width: '100%', marginTop: '24px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {isLogin ? 'Войти в ScramBan' : 'Создать аккаунт'}
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: '28px',
            }}
          >
            {isLogin ? 'Введите свои учетные данные для доступа к доске' : 'Зарегистрируйтесь, чтобы начать работу с проектом'}
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(229, 0, 26, 0.15)',
                border: '1px solid var(--centras-red)',
                color: '#FF6B6B',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Имя и Фамилия</label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="premium-input"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email адрес</label>
              <input
                type="email"
                placeholder="work@centras.kz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input"
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="premium-btn"
              disabled={loading}
              style={{
                marginTop: '10px',
                height: '44px',
                fontSize: '15px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : isLogin ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            {isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                color: 'var(--centras-red)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isLogin ? 'Создать' : 'Войти'}
            </span>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
