import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { ArrowUpIcon, Bot, Square } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PIPELINE_LABEL = "Qwen 2.5 Coder → Llama 3.2";


function useAutoResizeTextarea({ minHeight, maxHeight }) {
    const textareaRef = useRef(null);

    const adjustHeight = useCallback(
        (reset) => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }
            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) textarea.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

// A single chat message bubble
function ChatMessage({ message }) {
    const isUser = message.role === "user";
    return (
        <div className={cn("flex gap-3 mb-6", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white/70" />
                </div>
            )}
            <div
                className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    isUser
                        ? "max-w-[80%] bg-white text-black rounded-br-sm"
                        : "max-w-full overflow-x-auto bg-white/10 border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm"
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div
                        className={cn(
                            "prose prose-sm prose-invert max-w-none",
                            "prose-headings:text-white prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5",
                            "prose-p:text-white/90 prose-p:my-1.5 prose-p:leading-relaxed",
                            "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
                            "prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:text-white/90",
                            "prose-code:text-emerald-400 prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
                            "prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:my-2",
                            "prose-strong:text-white prose-em:text-white/80",
                            "prose-table:border-collapse prose-th:border prose-th:border-white/15 prose-th:px-3 prose-th:py-1.5 prose-th:bg-white/5 prose-th:text-white/90 prose-td:border prose-td:border-white/10 prose-td:px-3 prose-td:py-1.5 prose-td:text-white/80",
                            "prose-blockquote:border-l-2 prose-blockquote:border-white/20 prose-blockquote:text-white/70 prose-blockquote:my-2",
                            "prose-hr:border-white/10"
                        )}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}

// localStorage helpers for chat messages only
const STORAGE_KEYS = {
    MESSAGES: "csvChat_messages",
    SESSION_ID: "csvChat_sessionId",
    CSV_INFO: "csvChat_csvInfo",
};

function loadFromStorage(key, fallback = null) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage full — silently ignore */ }
}

function clearChatStorage() {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * CsvChatbot now receives the file from the shared Redux state via props.
 * It no longer has its own upload UI — the CSV is uploaded on the Home page.
 */
export function CsvChatbot({ sharedFile }) {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState(
        () => loadFromStorage(STORAGE_KEYS.MESSAGES, [])
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Session state
    const [sessionId, setSessionId] = useState(
        () => loadFromStorage(STORAGE_KEYS.SESSION_ID)
    );
    const [csvInfo, setCsvInfo] = useState(
        () => loadFromStorage(STORAGE_KEYS.CSV_INFO)
    );

    // Track which file the current session belongs to
    const [sessionFileName, setSessionFileName] = useState(
        () => loadFromStorage("csvChat_sessionFileName")
    );

    // ── Persist state changes to localStorage ──
    useEffect(() => { saveToStorage(STORAGE_KEYS.MESSAGES, messages); }, [messages]);
    useEffect(() => { saveToStorage(STORAGE_KEYS.SESSION_ID, sessionId); }, [sessionId]);
    useEffect(() => { saveToStorage(STORAGE_KEYS.CSV_INFO, csvInfo); }, [csvInfo]);
    useEffect(() => { saveToStorage("csvChat_sessionFileName", sessionFileName); }, [sessionFileName]);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const hasSession = !!sessionId;

    // Auto-scroll to newest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Upload CSV to create a dual-agent session
    const uploadCSV = useCallback(async (file) => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setSessionId(null);
        setCsvInfo(null);
        setMessages([]);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post(
                "http://localhost:8000/api/v1/chat/upload",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            const { session_id, columns, row_count, models_used } = response.data;
            setSessionId(session_id);
            setCsvInfo({ columns, row_count, models_used });
            setSessionFileName(file.name);
        } catch (err) {
            const detail = err?.response?.data?.detail || err.message || "Upload failed.";
            setError(detail);
            setMessages([{ role: "assistant", content: `⚠️ Upload Error: ${detail}` }]);
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Auto-upload when a shared file arrives — always re-create session to ensure
    // the backend has the full dataset (backend sessions are in-memory, don't survive restarts)
    useEffect(() => {
        if (sharedFile) {
            uploadCSV(sharedFile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sharedFile]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleSend = async () => {
        if (!value.trim() || !hasSession) return;

        const userMessage = value.trim();
        setValue("");
        adjustHeight(true);
        setError(null);

        setMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
        ]);
        setIsLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await axios.post(
                "http://localhost:8000/api/v1/chat/ask",
                {
                    session_id: sessionId,
                    question: userMessage,
                },
                { signal: controller.signal }
            );

            const { answer } = response.data;
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: answer },
            ]);
        } catch (err) {
            if (axios.isCancel(err) || err.name === "CanceledError") {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "⏹ Generation stopped." },
                ]);
            } else {
                const detail = err?.response?.data?.detail || err.message || "Something went wrong.";
                setError(detail);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `⚠️ Error: ${detail}` },
                ]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewSession = () => {
        // Clean up the backend session
        if (sessionId) {
            axios.delete(`http://localhost:8000/api/v1/chat/${sessionId}`).catch(() => { });
        }
        setSessionId(null);
        setCsvInfo(null);
        setMessages([]);
        setSessionFileName(null);
        clearChatStorage();
        // Re-upload the current shared file
        if (sharedFile) {
            uploadCSV(sharedFile);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto h-[calc(100vh-180px)] min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">CSV Chat</h1>
                    <p className="text-sm text-white/50 mt-0.5">
                        Ask any question about your data in plain language
                    </p>
                </div>

                {/* Pipeline Badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/60 text-xs">
                    <Bot className="w-4 h-4 text-white/40" />
                    <span>{csvInfo?.models_used || PIPELINE_LABEL}</span>
                </div>
            </div>

            {/* File badge + session info */}
            {sharedFile && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                    <span className="text-xs text-white/60 font-medium truncate max-w-[200px]">📂 {sharedFile.name}</span>
                    {csvInfo && (
                        <span className="text-xs text-white/40">
                            · {csvInfo.row_count} rows · {csvInfo.columns.length} cols
                        </span>
                    )}
                    {isUploading && (
                        <span className="text-xs text-yellow-400/80 animate-pulse">Initializing…</span>
                    )}
                    <button
                        onClick={handleNewSession}
                        className="ml-1 text-white/30 hover:text-white/70 transition-colors text-xs"
                        title="Reset chat session"
                    >🔄</button>
                </div>
            )}

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto pr-2 mb-3 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <Bot className="w-10 h-10 text-white/20" />
                        {isUploading ? (
                            <p className="text-white/40 text-sm animate-pulse">
                                Setting up your session…
                            </p>
                        ) : (
                            <>
                                <p className="text-white/40 text-sm">
                                    Ask anything about <span className="text-white/60 font-medium">{sharedFile?.name}</span>
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center mt-2">
                                    {["What are the columns?", "Give me a summary", "Any null values?", "Top 5 rows?"].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => { setValue(q); textareaRef.current?.focus(); }}
                                            className="px-3 py-1.5 text-xs rounded-full border border-white/10 text-white/50 hover:border-white/30 hover:text-white/80 bg-white/5 transition-all"
                                        >{q}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                {isLoading && (
                    <div className="flex gap-3 mb-4 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white/70" />
                        </div>
                        <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm backdrop-blur-sm px-4 py-3">
                            <div className="flex gap-1 items-center h-5">
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input box */}
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={hasSession ? "Ask a question about your data..." : "Waiting for session to initialize..."}
                    disabled={isLoading || !hasSession}
                    className={cn(
                        "w-full px-4 py-3 resize-none bg-transparent border-none text-white text-sm",
                        "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                        "placeholder:text-white/30 min-h-[60px]",
                        (isLoading || !hasSession) && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ overflow: "hidden" }}
                />
                <div className="flex items-center justify-end px-3 pb-3">
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={handleStop}
                            className="p-2 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all"
                            title="Stop generation"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!value.trim() || !hasSession}
                            className={cn(
                                "p-2 rounded-xl border transition-all",
                                value.trim() && hasSession
                                    ? "bg-white text-black border-transparent hover:bg-white/90"
                                    : "bg-transparent text-white/20 border-white/10 cursor-not-allowed"
                            )}
                        >
                            <ArrowUpIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
