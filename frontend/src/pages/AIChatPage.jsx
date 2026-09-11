/**
 * pages/AIChatPage.jsx — AI Accounting Assistant Interface
 * Pocket C.A. Frontend
 *
 * An interactive, conversational financial advisor powered by Google Gemini and local analytics.
 *
 * Features:
 * - Real-time financial context injection (user's transactions, summary, category breakdown).
 * - Clean Markdown formatting (tables, headers, bold text, blockquotes) via react-markdown.
 * - Interactive suggested prompt pills for instant exploration.
 * - Automatic scrolling to new messages and typing indicator.
 * - Session history management with Clear Chat option.
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Sparkles, Trash2, User as UserIcon, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendChatMessage, streamChatMessage } from '../services/aiService';

const SUGGESTED_PROMPTS = [
  { icon: '💰', text: 'How much did I spend this month?', label: 'Monthly Spending' },
  { icon: '📊', text: 'What is my biggest expense category?', label: 'Top Expenses' },
  { icon: '💼', text: 'Give me a summary of my finances.', label: 'Executive Summary' },
  { icon: '✂️', text: 'How can I reduce my spending?', label: 'Savings Advice' },
  { icon: '📐', text: 'Suggest a monthly 50/30/20 budget plan.', label: 'Budget Plan' },
  { icon: '🏆', text: 'What are my highest transactions?', label: 'Peak Records' },
];

const AIChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages or loading state change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle sending a message
  const handleSend = async (customPrompt = null) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const trimmed = textToSend.trim();
    if (trimmed.length > 1000) {
      toast.error('Message is too long (max 1000 characters)');
      return;
    }

    // Add user message to UI immediately
    const userMsg = { id: Date.now(), sender: 'user', text: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customPrompt) setInput('');
    setLoading(true);

    // Create a placeholder message for the AI response
    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, sender: 'ai', text: '', timestamp: new Date() }
    ]);

    try {
      // Format history for backend API
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Stream the response
      await streamChatMessage(trimmed, historyPayload, (chunk) => {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunk } : msg
          )
        );
      });
    } catch (err) {
      console.error('[AI Chat Error]', err);
      const errMsg = err?.message || 'Failed to connect to AI assistant.';
      toast.error(errMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          text: `⚠️ **Notice**: I encountered an issue processing your request: *${errMsg}*`,
          isError: true,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    toast.success('Chat history cleared');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            AI Accounting Assistant <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Analyze spending, explore category breakdowns, and get personalized financial advice
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--color-success)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Financial Context
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: 'var(--color-bg-hover)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-secondary)',
              }}
              title="Clear current session history"
            >
              <Trash2 size={14} />
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Card */}
      <div
        className="glass-card flex flex-col relative overflow-hidden"
        style={{
          height: 'calc(100vh - 210px)',
          minHeight: '520px',
          maxHeight: '800px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Background Subtle Glow Blob */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: 'var(--color-primary)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{ background: 'var(--color-secondary)' }}
        />

        {/* Chat Header Bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b z-10 relative"
          style={{
            borderColor: 'var(--color-bg-border)',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              }}
            >
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                Pocket C.A. Advisor
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Certified AI Accountant ● Always Private to You
              </p>
            </div>
          </div>
        </div>

        {/* Messages Body Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 relative">
          {messages.length === 0 ? (
            /* Welcome Hero & Suggested Prompts */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                <Bot size={34} style={{ color: 'var(--color-primary)' }} />
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                How can I assist with your finances today?
              </h3>
              <p className="text-sm max-w-md mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                I am connected directly to your transaction records and monthly summary. Ask me anything to get personalized insights, budgeting rules, and cost-cutting advice.
              </p>

              <div className="w-full">
                <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  ✨ Suggested Financial Topics
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(item.text)}
                      disabled={loading}
                      className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all duration-200 group relative overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.transform = 'translateY(0px)';
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                          {item.label}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {item.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Message List */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                  style={{
                    background: msg.sender === 'user'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {msg.sender === 'user' ? (
                    <UserIcon size={16} style={{ color: 'var(--color-text-primary)' }} />
                  ) : (
                    <Bot size={18} color="#fff" />
                  )}
                </div>

                {/* Message Content Bubble */}
                <div
                  className={`p-4 rounded-3xl text-sm leading-relaxed overflow-x-auto ${
                    msg.sender === 'user'
                      ? 'rounded-tr-none text-white font-medium shadow-md'
                      : 'rounded-tl-none glass-card shadow-lg'
                  }`}
                  style={{
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                      : 'rgba(30, 41, 59, 0.65)',
                    border: msg.sender === 'user'
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--color-text-primary)',
                  }}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="markdown-content space-y-3">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold text-indigo-400 mt-2 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold text-indigo-300 mt-2 mb-1 border-b border-white/10 pb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-indigo-200 mt-2 mb-1 flex items-center gap-1.5">{children}</h3>,
                          h4: ({ children }) => <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mt-2">{children}</h4>,
                          p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0 text-slate-200">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-indigo-300">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-300 pl-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-300 pl-2">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/10 px-3.5 py-2.5 rounded-r-xl my-3 text-xs italic text-indigo-200">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                              <table className="w-full text-left border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-slate-800/80 p-2.5 font-semibold text-indigo-300 border-b border-white/10">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="p-2.5 border-b border-white/5 text-slate-300 last:border-0">
                              {children}
                            </td>
                          ),
                          code: ({ children }) => (
                            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Timestamp & Error badge */}
                  <div className="flex items-center justify-between mt-2 pt-1 text-[10px] opacity-60">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.isError && <span className="text-rose-400 font-semibold">Error Response</span>}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing / Loading Skeleton */}
          {loading && (
            <div className="flex gap-3 max-w-md mr-auto animate-pulse">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div
                className="p-4 rounded-3xl rounded-tl-none glass-card flex items-center gap-3"
                style={{
                  background: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Analyzing your financial records...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Footer */}
        <div
          className="p-4 border-t z-10 relative"
          style={{
            borderColor: 'var(--color-bg-border)',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="max-w-4xl mx-auto space-y-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-200 shadow-inner"
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <MessageSquare size={18} style={{ color: 'var(--color-text-muted)' }} className="ml-1 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Ask your AI Chartered Accountant anything about your finances..."
                className="flex-1 bg-transparent text-sm outline-none px-2 py-1 placeholder:text-slate-500"
                style={{ color: 'var(--color-text-primary)' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shrink-0 ${
                  !input.trim() || loading
                    ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                    : 'text-white hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]'
                }`}
                style={{
                  background:
                    !input.trim() || loading
                      ? undefined
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                }}
              >
                <span>Send</span>
                <Send size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-[11px] text-center px-4" style={{ color: 'var(--color-text-muted)' }}>
              🔒 Your transaction records are analyzed securely in real time. Never share sensitive bank passwords or PINs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
