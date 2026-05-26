'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
}

interface ChatWidgetProps {
  projectId: string;
  currentUser: CurrentUser;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ projectId, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenMsgId, setLastSeenMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load channels once
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/channels`)
      .then((r) => r.json())
      .then((data: Channel[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setChannels(data);
          setActiveChannel(data[0]);
        }
      })
      .catch(() => {});
  }, [projectId]);

  const loadMessages = useCallback(async (channelId: string, silent = false) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setMessages(data);

      // Count unread when panel closed
      if (!isOpen && data.length > 0) {
        const lastId = data[data.length - 1].id;
        if (lastSeenMsgId && lastId !== lastSeenMsgId) {
          const lastSeenIdx = data.findIndex((m) => m.id === lastSeenMsgId);
          setUnreadCount(lastSeenIdx === -1 ? data.length : data.length - lastSeenIdx - 1);
        }
      }
    } catch {
      // silently ignore poll errors
    }
  }, [isOpen, lastSeenMsgId]);

  // Poll messages when channel is active
  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);

    pollRef.current = setInterval(() => {
      loadMessages(activeChannel.id, true);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeChannel, loadMessages]);

  // Scroll to bottom when messages update and panel is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastId = messages[messages.length - 1].id;
      setLastSeenMsgId(lastId);
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChannel || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic
    const tempMsg: Message = {
      id: '__temp__' + Date.now(),
      content,
      createdAt: new Date().toISOString(),
      userId: currentUser.id,
      user: { id: currentUser.id, fullName: currentUser.fullName, avatarUrl: null },
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch(`/api/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      await loadMessages(activeChannel.id);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div className="chat-widget-panel">
          {/* Header */}
          <div className="chat-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#68D391',
                  boxShadow: '0 0 6px #68D391',
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>
                Командный чат
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {messages.length} сообщ.
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: '2px 6px',
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              ✕
            </button>
          </div>

          {/* Channel tabs */}
          {channels.length > 1 && (
            <div className="chat-channels-tabs">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  className={`chat-channel-tab${activeChannel?.id === ch.id ? ' active' : ''}`}
                  onClick={() => setActiveChannel(ch)}
                >
                  # {ch.name}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages-area">
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontSize: 13 }}>Напишите первое сообщение команде</span>
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.userId === currentUser.id;
              return (
                <div key={msg.id} className={`chat-message${isOwn ? ' own' : ''}`}>
                  {!isOwn && (
                    <div className="chat-message-avatar" title={msg.user.fullName}>
                      {getInitials(msg.user.fullName)}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {!isOwn && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4 }}>
                        {msg.user.fullName}
                      </span>
                    )}
                    <div className={`chat-message-bubble ${isOwn ? 'own' : 'other'}`}>
                      {msg.content}
                    </div>
                    <span className="chat-message-meta" style={{ paddingLeft: isOwn ? 0 : 4, paddingRight: isOwn ? 4 : 0 }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение... (Enter — отправить)"
              rows={1}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                color: '#fff',
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                resize: 'none',
                flex: 1,
                minHeight: 36,
                maxHeight: 100,
                lineHeight: '1.5',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        className={`chat-widget-bubble${unreadCount > 0 ? ' has-unread' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        title="Командный чат"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              fill="rgba(255,255,255,0.15)"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="11" r="1" fill="#fff" />
            <circle cx="12" cy="11" r="1" fill="#fff" />
            <circle cx="16" cy="11" r="1" fill="#fff" />
          </svg>
        )}

        {unreadCount > 0 && !isOpen && (
          <span className="chat-unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
};
