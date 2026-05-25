'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface CurrentUser {
  id: string;
  fullName: string;
}

export default function ChatPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  // Load project & User info
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selected_project_id');
    if (savedProjectId) {
      setProjectId(savedProjectId);
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      });
  }, []);

  const loadChannels = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/channels`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (data.length > 0) {
          setSelectedChannel(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadChannels();
    }
  }, [projectId]);

  // Load messages for selected channel
  const loadMessages = async (silent = false) => {
    if (!selectedChannel) return;
    try {
      const res = await fetch(`/api/channels/${selectedChannel.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();

      // Clear existing polling
      if (pollingRef.current) clearInterval(pollingRef.current);

      // Start real-time polling every 3 seconds
      pollingRef.current = setInterval(() => {
        loadMessages(true);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Post message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChannel || !currentUser) return;

    const tempContent = input;
    setInput('');

    // Optimistic Update
    const tempMessage: Message = {
      id: Math.random().toString(),
      content: tempContent,
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        avatarUrl: null,
      },
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/channels/${selectedChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempContent }),
      });

      if (!res.ok) {
        throw new Error('Ошибка отправки');
      }
      // Reload messages to get proper ID and timestamps
      loadMessages(true);
    } catch (e) {
      console.error(e);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInput(tempContent);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h3>Загрузка каналов чата...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }} className="fade-in">
      {/* Channels Sidebar within Chat tab */}
      <div
        className="glass-panel"
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          height: '100%',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '20px', paddingLeft: '8px' }}>
          💬 Каналы общения
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {channels.map((chan) => {
            const isSelected = selectedChannel?.id === chan.id;
            return (
              <button
                key={chan.id}
                onClick={() => setSelectedChannel(chan)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '14.5px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: isSelected ? '3px solid var(--centras-red)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {chan.type === 'PROJECT' ? '📢 ' : '📋 '} {chan.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Pane */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '30px' }}>
        {selectedChannel ? (
          <>
            {/* Chat header */}
            <div
              style={{
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                {selectedChannel.name}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedChannel.type === 'PROJECT' ? 'Проектный канал общения' : 'Канал обсуждения канбан-доски'}
              </span>
            </div>

            {/* Messages scroll area */}
            <div
              className="glass-panel"
              style={{
                flexGrow: 1,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 260px)',
                background: 'rgba(0,0,0,0.1)',
                marginBottom: '20px',
              }}
            >
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = currentUser ? msg.userId === currentUser.id : false;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      {!isMe && (
                        <div
                          title={msg.user.fullName}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--centras-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {msg.user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          maxWidth: '70%',
                        }}
                      >
                        {!isMe && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                            {msg.user.fullName}
                          </span>
                        )}
                        <div
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            background: isMe ? 'var(--centras-gradient)' : 'var(--bg-card)',
                            color: '#fff',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            wordBreak: 'break-word',
                            border: isMe ? 'none' : '1px solid var(--border-color)',
                          }}
                        >
                          {msg.content}
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: 'var(--text-muted)',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            paddingRight: isMe ? '4px' : '0',
                            paddingLeft: isMe ? '0' : '4px',
                          }}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Сообщений пока нет. Будьте первым, кто напишет!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder={`Написать в ${selectedChannel.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="premium-input"
                style={{ flexGrow: 1, height: '48px', fontSize: '15px' }}
              />
              <button
                type="submit"
                className="premium-btn"
                style={{ width: '120px', height: '48px' }}
                disabled={!input.trim()}
              >
                Отправить
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <h3>Пожалуйста, создайте или выберите канал для общения</h3>
          </div>
        )}
      </div>
    </div>
  );
}
