'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  X,
  Loader2,
  ChevronDown,
  Trash2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface AishaChatProps {
  onClose?: () => void;
  embedded?: boolean;
  useUnified?: boolean;
}

export default function AishaChat({ onClose, embedded, useUnified }: AishaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);
  const streamRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const connectStream = useCallback(() => {
    if (!conversationId || useUnified) return;

    if (streamRef.current) streamRef.current.close();

    const url = `${API_BASE_URL}/api/aisha/stream/${conversationId}`;
    const es = new EventSource(url);
    streamRef.current = es;

    es.onopen = () => setStreamConnected(true);
    es.onerror = () => {
      setStreamConnected(false);
      setTimeout(connectStream, 5000);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.message.id > lastMessageIdRef.current) {
          setMessages((prev) => [...prev, data.message]);
          lastMessageIdRef.current = data.message.id;
          scrollToBottom();
        }
      } catch (err) {
        console.error('SSE Parse Error:', err);
      }
    };
  }, [conversationId, scrollToBottom, useUnified]);

  useEffect(() => {
    if (conversationId && !useUnified) connectStream();
    return () => streamRef.current?.close();
  }, [conversationId, connectStream, useUnified]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setError(null);

    const tempId = Date.now();
    const optimistic: Message = {
      id: tempId,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const endpoint = useUnified ? '/api/unified/chat' : '/api/aisha/chat';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          platform: 'web',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      if (useUnified) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response || data.message || "Request received.",
        };
        setMessages((prev) => [...prev, aiMessage]);
        scrollToBottom();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errMsg);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    streamRef.current?.close();
    setMessages([]);
    setConversationId(null);
    lastMessageIdRef.current = 0;
    setError(null);
  };

  const containerClasses = embedded
    ? 'flex flex-col h-full'
    : 'fixed bottom-32 right-10 w-[400px] h-[600px] flex flex-col bg-[#121212] border border-[#1F1F1F] shadow-2xl z-50 overflow-hidden rounded-sm';

  return (
    <motion.div
      initial={embedded ? false : { opacity: 0, y: 20 }}
      animate={embedded ? undefined : { opacity: 1, y: 0 }}
      exit={embedded ? undefined : { opacity: 0, y: 20 }}
      className={containerClasses}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F1F1F] shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-white font-bold text-[11px] uppercase tracking-widest leading-tight">
              {useUnified ? 'Aisha Unified' : 'Aisha'}
            </h3>
            <p className="text-gray-500 text-[9px] uppercase tracking-widest leading-tight mt-0.5">
              {useUnified ? 'Autonomous Controller' : (streamConnected ? 'Online' : 'Connecting...')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 bg-[#1F1F1F] flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-bold text-[11px] uppercase tracking-widest mb-3">Initialize Interaction</h4>
            <p className="text-gray-500 text-xs leading-relaxed font-light tracking-wide mb-8">
              {useUnified
                ? "Unified workforce orchestrator. Execute complex tasks across AG Associates systems."
                : "Legal processing agent. Ask about case status or document drafting."}
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {(useUnified ? [
                'Status of my workforce',
                'Check cloudrun servers',
                'Verify latest filings',
              ] : [
                'Status of my cases',
                'Draft rental agreement',
                'Show recent activities',
              ]).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 p-4 border border-[#1F1F1F] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-[#1F1F1F]' : 'border border-[#1F1F1F]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={`max-w-[85%] text-xs leading-relaxed tracking-wide ${
                msg.role === 'user' ? 'text-white text-right' : 'text-gray-400'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-4">
            <div className="w-7 h-7 border border-[#1F1F1F] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 h-7">
              <div className="w-1 h-1 bg-white animate-pulse" />
              <div className="w-1 h-1 bg-white animate-pulse [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-white animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/50">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#1F1F1F] p-6 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 border border-[#1F1F1F] px-4 py-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="INPUT COMMAND..."
            className="flex-1 bg-transparent text-white placeholder-gray-700 text-[10px] font-bold uppercase tracking-[0.2em] py-3 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="text-gray-500 hover:text-white disabled:opacity-20 transition-colors"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
