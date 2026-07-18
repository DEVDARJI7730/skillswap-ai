'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/store/app-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export const ChatView: React.FC = () => {
  const { user, setActiveTab } = useApp();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/chats/list');
      setConversations(res.data);
      if (res.data.length > 0 && !activeChat) {
        handleSelectChat(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Set up WebSocket Connection
  useEffect(() => {
    if (!user) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsProto = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const cleanBase = baseUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}://${cleanBase}/api/ws/${user.id}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Chat WebSocket connected.');
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message') {
        if (activeChat && payload.chat_id === activeChat.id) {
          setMessages((prev) => [...prev, payload.message]);
          // Mark as seen
          socket.send(JSON.stringify({ type: 'seen', chat_id: activeChat.id }));
        }
      } else if (payload.type === 'typing' && activeChat && payload.chat_id === activeChat.id) {
        if (payload.sender_id !== user.id) {
          setRecipientTyping(payload.is_typing);
        }
      } else if (payload.type === 'seen' && activeChat && payload.chat_id === activeChat.id) {
        setMessages((prev) => prev.map((m) => m.sender_id !== user.id ? m : { ...m, seen: true }));
      } else if (payload.type === 'edit' && activeChat && payload.chat_id === activeChat.id) {
        setMessages((prev) => prev.map((m) => m.id === payload.message_id ? { ...m, text: payload.text, edited: true } : m));
      } else if (payload.type === 'delete' && activeChat && payload.chat_id === activeChat.id) {
        setMessages((prev) => prev.map((m) => m.id === payload.message_id ? { ...m, text: 'This message was deleted.', deleted: true } : m));
      }
    };

    socket.onclose = () => {
      console.log('Chat WebSocket disconnected.');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user, activeChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recipientTyping]);

  const handleSelectChat = async (chat: any) => {
    setActiveChat(chat);
    setRecipientTyping(false);
    try {
      const res = await api.get(`/api/chats/${chat.id}/messages`);
      setMessages(res.data);
      // Trigger seen
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'seen', chat_id: chat.id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !ws || !activeChat) return;

    const payload = {
      type: 'message',
      chat_id: activeChat.id,
      text: textInput,
    };
    ws.send(JSON.stringify(payload));
    setTextInput('');

    // Trigger stop typing
    handleTyping(false);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!ws || !activeChat) return;
    setTyping(isTyping);
    ws.send(JSON.stringify({
      type: 'typing',
      chat_id: activeChat.id,
      is_typing: isTyping
    }));
  };

  const handleTriggerMeeting = async () => {
    if (!activeChat) return;
    try {
      const res = await api.post('/api/chats/meeting', { chat_id: activeChat.id });
      // Send meeting link as message
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          chat_id: activeChat.id,
          text: `Join Video Call: ${res.data.jitsi_link}`,
          media_url: res.data.jitsi_link,
          media_type: 'meeting'
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMsg = (msgId: string) => {
    if (!ws || !activeChat) return;
    ws.send(JSON.stringify({
      type: 'delete',
      chat_id: activeChat.id,
      message_id: msgId
    }));
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live SkillSwap Chat</h2>
        <p className="text-sm text-slate-655 dark:text-slate-350 font-medium">Collaborate in real time, run video pair sessions, and exchange files.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Left column: conversations list */}
        <Card className="flex flex-col gap-4 border-slate-800 p-4 h-full overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-200">Conversations</h3>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl gap-2.5 my-2">
              <span className="text-xl">💬</span>
              <div className="flex flex-col gap-1 items-center">
                <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">No Active Chats</h4>
                <p className="text-[9px] text-slate-650 dark:text-slate-400 leading-relaxed max-w-[150px]">
                  Match with a peer to initialize a chat room.
                </p>
                <button
                  onClick={() => setActiveTab('matches')}
                  className="mt-2 py-1.5 px-3 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow"
                >
                  Find Matches →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((c) => {
                const isActive = activeChat?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChat(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? 'bg-indigo-600/10 border-indigo-500'
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Avatar src={c.recipient?.profile?.avatar_url} alt={c.recipient?.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{c.recipient?.profile?.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">@{c.recipient?.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right column: active conversation messages */}
        <Card className="md:col-span-2 flex flex-col border-slate-800 p-0 h-full overflow-hidden">
          {activeChat ? (
            <div className="flex flex-col h-full">
              {/* Active Recipient Header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <Avatar src={activeChat.recipient?.profile?.avatar_url} alt={activeChat.recipient?.username} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{activeChat.recipient?.profile?.name}</h4>
                    <span className="text-[10px] text-slate-400">Online</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleTriggerMeeting}>
                    📹 Launch Meet
                  </Button>
                </div>
              </div>

              {/* Messages log */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  
                  if (m.sender_id === 'system' || m.media_type === 'meeting') {
                    return (
                      <div key={m.id} className="flex justify-center my-2">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-lg text-center flex flex-col items-center gap-1.5 max-w-sm">
                          <span>{m.text}</span>
                          {m.media_url && (
                            <a
                              href={m.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded shadow transition-all"
                            >
                              Join Jitsi Video Call
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col gap-1 max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-750'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 px-1">
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <span>• {m.seen ? 'Read' : 'Sent'}</span>}
                          {isMe && !m.deleted && (
                            <button
                              onClick={() => handleDeleteMsg(m.id)}
                              className="hover:text-red-400 cursor-pointer transition-allml-1"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {recipientTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/50 text-slate-400 text-xs px-3 py-1.5 rounded-lg rounded-tl-none border border-slate-750">
                      typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={() => handleTyping(true)}
                  onBlur={() => handleTyping(false)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 text-xs border rounded-lg focus:outline-none transition-all duration-200 glass-input"
                />
                <Button type="submit" size="sm">
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 text-slate-500 dark:text-slate-400 text-sm h-full gap-4">
              <div className="p-4 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400 rounded-full border border-indigo-500/10">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">No Active Conversation</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select an active chat thread from the left menu to start messaging.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default ChatView;
