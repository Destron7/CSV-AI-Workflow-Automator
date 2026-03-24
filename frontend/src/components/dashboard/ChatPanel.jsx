import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlowingEffect } from '../ui/glowing-effect';

/**
 * ChatPanel — persistent chat UI alongside the dashboard.
 * Shows scrollable messages with auto-scroll, thinking indicator, and input.
 */
export default function ChatPanel({ chatHistory, onSend, isLoading }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSend(input.trim());
        setInput('');
    };

    return (
        <div className="group relative flex flex-col h-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
            <div className="relative z-10 flex flex-col h-full overflow-hidden rounded-xl">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-white font-medium text-sm">Chat with your data</h3>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
                    {(!chatHistory || chatHistory.length === 0) && !isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-white/30 text-sm text-center">
                                Ask questions about your data.<br />
                                The AI has full context of your dashboard.
                            </p>
                        </div>
                    )}

                    {chatHistory && chatHistory.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                            )}
                            <div
                                className={`
                                    max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-white/10 text-white ml-auto'
                                        : 'bg-white/[0.04] text-white/80 border border-white/5'
                                    }
                                `}
                            >
                                {/* Render markdown-like content with whitespace preserved */}
                                <div className="prose prose-sm prose-invert max-w-none break-words">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-white/60" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Thinking indicator */}
                    {isLoading && (
                        <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="bg-white/[0.04] border border-white/5 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                                    <span className="text-white/50 text-sm">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 shrink-0">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your data..."
                            disabled={isLoading}
                            className="
                                w-full px-4 py-3 pr-12
                                rounded-lg bg-white/5 border border-white/10
                                text-white text-sm placeholder-white/30
                                focus:outline-none focus:border-white/25 focus:bg-white/[0.07]
                                transition-all duration-200
                                disabled:opacity-50
                                m-0
                            "
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="
                                absolute right-2 shrink-0
                                w-8 h-8 rounded-md
                                flex items-center justify-center
                                bg-emerald-500 hover:bg-emerald-400
                                disabled:bg-white/10 disabled:cursor-not-allowed
                                transition-colors duration-200
                            "
                        >
                            <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
