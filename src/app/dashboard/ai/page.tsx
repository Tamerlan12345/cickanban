'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface Insights {
  healthSummary: string;
  bottlenecks: string[];
  recommendations: string[];
  isMock?: boolean;
}

export default function AICoachPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Dashboard Insights
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Chat panel toggle & chat states
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Привет! Я проанализировал ваш проект и составил дашборд. 🧠\nЕсли у вас есть конкретные вопросы по задачам, нагрузке или планированию спринта — напишите мне ниже!',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProjectId = localStorage.getItem('selected_project_id');
    if (savedProjectId) {
      setProjectId(savedProjectId);
    }
  }, []);

  const loadInsights = async (projId: string) => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projId }),
      });
      if (res.ok) {
        setInsights(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadInsights(projectId);
    }
  }, [projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showChat) {
      scrollToBottom();
    }
  }, [messages, showChat]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !projectId || chatLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        throw new Error('Ошибка сервера');
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'К сожалению, произошла ошибка при получении ответа от ИИ.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
            🧠 Интеллектуальный дашборд PM
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Автоматический аудит проекта и инсайты от Gemini AI</p>
        </div>
        {projectId && (
          <button onClick={() => loadInsights(projectId)} disabled={insightsLoading} className="premium-btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
            {insightsLoading ? '⏳ Обновление...' : '🔄 Обновить аудит'}
          </button>
        )}
      </div>

      {insightsLoading ? (
        /* Loading skeleton */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ height: '120px', padding: '24px', animation: 'skeleton-pulse 1.5s infinite alternate' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="glass-card" style={{ height: '220px', animation: 'skeleton-pulse 1.5s infinite alternate' }} />
            <div className="glass-card" style={{ height: '220px', animation: 'skeleton-pulse 1.5s infinite alternate' }} />
          </div>
        </div>
      ) : insights ? (
        /* Dashboard Content */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Health Summary Card */}
          <div
            className="glass-card"
            style={{
              padding: '24px 30px',
              borderLeft: '4px solid var(--centras-blue)',
              boxShadow: 'var(--glow-blue)',
              background: 'rgba(30, 60, 255, 0.02)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📈 Здоровье проекта (Project Health)
            </h3>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {insights.healthSummary}
            </p>
          </div>

          {/* Grid for Bottlenecks & Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Bottlenecks Card */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔥 Риски и Узкие места (Bottlenecks)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {insights.bottlenecks.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(229, 0, 26, 0.04)',
                      border: '1px solid rgba(229, 0, 26, 0.15)',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#FEB2B2',
                      lineHeight: '1.5',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Card */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💡 Рекомендации ИИ по процессам
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {insights.recommendations.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(122, 27, 140, 0.04)',
                      border: '1px solid rgba(122, 27, 140, 0.15)',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      color: '#E9D8FD',
                      lineHeight: '1.5',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--centras-violet)', fontSize: '16px' }}>✨</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible Chat Assistant */}
          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Toggle Header */}
            <div
              onClick={() => setShowChat(!showChat)}
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                💬 Задать уточняющие вопросы ассистенту Gemini
              </h3>
              <span style={{ transition: 'transform 0.2s', transform: showChat ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </div>

            {/* Chat Body */}
            {showChat && (
              <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Messages log */}
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.15)',
                    padding: '16px',
                    borderRadius: '8px',
                  }}
                >
                  {messages.map((msg, index) => {
                    const isAI = msg.sender === 'ai';
                    return (
                      <div key={index} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
                        <div
                          style={{
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: isAI ? 'var(--bg-card)' : 'var(--centras-gradient)',
                            border: isAI ? '1px solid var(--border-color)' : 'none',
                            color: '#fff',
                            fontSize: '13.5px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '4px', height: '4px', background: 'var(--centras-violet)', borderRadius: '50%', animation: 'chat-loading-pulse 0.8s infinite alternate' }} />
                      <div style={{ width: '4px', height: '4px', background: 'var(--centras-violet)', borderRadius: '50%', animation: 'chat-loading-pulse 0.8s infinite alternate 0.2s' }} />
                      <div style={{ width: '4px', height: '4px', background: 'var(--centras-violet)', borderRadius: '50%', animation: 'chat-loading-pulse 0.8s infinite alternate 0.4s' }} />
                      <span>ИИ печатает ответ...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(input);
                  }}
                  style={{ display: 'flex', gap: '10px' }}
                >
                  <input
                    type="text"
                    placeholder="Например: Какая задача больше всего тормозит прогресс?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="premium-input"
                    style={{ flexGrow: 1 }}
                    disabled={chatLoading}
                  />
                  <button type="submit" className="premium-btn" disabled={chatLoading || !input.trim()}>
                    Отправить
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Не удалось загрузить инсайты. Проверьте настройки проекта.
        </div>
      )}

      <style jsx global>{`
        @keyframes skeleton-pulse {
          from {
            opacity: 0.3;
          }
          to {
            opacity: 0.7;
          }
        }
        @keyframes chat-loading-pulse {
          from {
            transform: scale(0.8);
            opacity: 0.4;
          }
          to {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
