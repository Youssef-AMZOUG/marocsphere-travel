import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, ArrowLeft, Lock, Sparkles, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUGGESTIONS = [
  "What's the best time to visit Marrakech?",
  "Is Chefchaouen safe for solo travelers?",
  "What to eat in Fes?",
  "Tips for bargaining in the souk?",
  "Best day trip from Marrakech?",
];

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [usage, setUsage] = useState({ current: 0, limit: 5, unlimited: false });
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    checkUsage();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, sending]);

  const checkUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/usage/check/ai_chat_messages_per_day`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setUsage({
        current: res.data.current,
        limit: res.data.limit,
        unlimited: res.data.limit === -1
      });
      setLimitReached(!res.data.allowed);
    } catch (err) {
      console.error('Usage check failed:', err);
    }
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || sending) return;

    // Check if limit reached
    if (limitReached) {
      toast.error(t('chat.limitReached'));
      return;
    }

    setInput('');
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      
      // Track usage first
      if (token) {
        await axios.post(`${API}/usage/track/ai_chat_messages_per_day`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      const res = await axios.post(`${API}/chat/send`, { content, session_id: sessionId }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setSessionId(res.data.session_id);
      const aiMsg = { id: `ai-${Date.now()}`, role: 'ai', content: res.data.reply, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      // Update usage after successful message
      checkUsage();
    } catch (err) {
      if (err.response?.status === 403) {
        setLimitReached(true);
        toast.error(t('chat.limitReached'));
      } else {
        const errMsg = { id: `err-${Date.now()}`, role: 'ai', content: "I'm having trouble responding right now. Please try again.", created_at: new Date().toISOString() };
        setMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const remainingMessages = usage.unlimited ? '∞' : Math.max(0, usage.limit - usage.current);

  return (
    <div data-testid="chat-page" className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">MarocSphere AI</h2>
              <p className="text-white/70 text-xs">{t('chat.title')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Usage Counter */}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 text-saffron-300" />
              <span className="text-white text-xs font-medium">
                {remainingMessages} {t('chat.messagesLeft')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
              <span className="text-white/70 text-xs">Online</span>
            </div>
          </div>
        </div>

        {/* Limit Reached Banner */}
        {limitReached && (
          <div className="bg-gradient-to-r from-saffron-50 to-amber-50 border-b border-saffron-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-saffron-600" />
              <div>
                <p className="text-sm font-semibold text-saffron-700">{t('chat.limitReached')}</p>
                <p className="text-xs text-saffron-600">{t('chat.limitMessage')}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/subscription')}
              size="sm"
              className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-full text-xs px-4"
            >
              <Crown className="w-3.5 h-3.5 mr-1" />
              Upgrade
            </Button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50" role="log" aria-label="Chat messages" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="text-5xl mb-4">🇲🇦</div>
              <p className="text-midnight-500 font-semibold mb-1">Ask me anything about Morocco!</p>
              <p className="text-stone-400 text-sm mb-6">I can help with travel tips, safety, food, culture and more.</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    data-testid={`suggestion-${s.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => sendMessage(s)}
                    disabled={limitReached}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-terracotta-400 hover:text-terracotta-600 transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="w-7 h-7 rounded-full bg-terracotta-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-terracotta-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-terracotta-500 text-white rounded-br-sm'
                  : 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {DOMPurify.sanitize(msg.content, { ALLOWED_TAGS: [] })}
                </p>
                <time className="text-[10px] opacity-50 mt-1.5 block">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-terracotta-100 flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-terracotta-600" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-stone-300 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-stone-300 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-stone-300 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-stone-100 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              data-testid="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={limitReached ? t('chat.limitReached') : "Ask about Morocco..."}
              disabled={limitReached}
              maxLength={2000}
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 text-sm transition bg-stone-50 disabled:bg-stone-100 disabled:cursor-not-allowed"
              aria-label="Type your message"
            />
            <Button
              data-testid="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending || limitReached}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl px-4 disabled:opacity-40 btn-press"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between mt-1.5 px-1">
            <span className="text-[10px] text-stone-300">{input.length}/2000</span>
            {!usage.unlimited && (
              <span className={`text-[10px] ${limitReached ? 'text-red-400' : 'text-stone-400'}`}>
                {usage.current}/{usage.limit} messages today
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
