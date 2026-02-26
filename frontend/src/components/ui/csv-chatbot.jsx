import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { ArrowUpIcon, Paperclip, Bot, ChevronDown, Square } from "lucide-react";
import axios from "axios";

const AVAILABLE_MODELS = [
    { value: "llama3.1:8b", label: "Llama 3.1 8B" },
];


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
        <div className={cn("flex gap-3 mb-4", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white/70" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                    isUser
                        ? "bg-white text-black rounded-br-sm"
                        : "bg-white/10 border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm"
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.code && (
                    <div className="mt-3 p-2 rounded-lg bg-black/30 border border-white/10">
                        <p className="text-xs text-white/40 mb-1 font-mono">code executed</p>
                        <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                            {message.code}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export function CsvChatbot({ uploadedFile }) {
    const [value, setValue] = useState("");
    const [selectedModel, setSelectedModel] = useState("llama3.1:8b");
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const [localFile, setLocalFile] = useState(uploadedFile || null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const hasFile = !!localFile;

    // Auto-scroll to newest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith(".csv")) {
            setLocalFile(file);
            setMessages([]);
            setError(null);
        } else {
            setError("Please select a valid .csv file.");
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleSend = async () => {
        if (!value.trim() || !hasFile) return;

        const userMessage = value.trim();
        setValue("");
        adjustHeight(true);
        setError(null);

        setMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
        ]);
        setIsLoading(true);

        // Create a fresh AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const formData = new FormData();
            formData.append("message", userMessage);
            formData.append("model_name", selectedModel);
            formData.append("file", localFile);

            const response = await axios.post(
                "http://localhost:8000/api/v1/chat/",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    signal: controller.signal,
                }
            );

            const { answer, executed_code } = response.data;
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: answer,
                    code: executed_code !== "Code execution details are internal to the Zero-Shot reasoning trace."
                        ? executed_code
                        : null,
                },
            ]);
        } catch (err) {
            if (axios.isCancel(err) || err.name === "CanceledError") {
                // Request was aborted by the user — remove the typing indicator silently
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

    const selectedModelLabel = AVAILABLE_MODELS.find((m) => m.value === selectedModel)?.label;

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

                {/* Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsModelOpen((o) => !o)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/80 text-sm hover:bg-white/10 transition-all"
                    >
                        <Bot className="w-4 h-4 text-white/60" />
                        {selectedModelLabel}
                        <ChevronDown className={cn("w-3 h-3 text-white/40 transition-transform", isModelOpen && "rotate-180")} />
                    </button>
                    {isModelOpen && (
                        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                            {AVAILABLE_MODELS.map((model) => (
                                <button
                                    key={model.value}
                                    onClick={() => { setSelectedModel(model.value); setIsModelOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                                        selectedModel === model.value
                                            ? "bg-white/15 text-white"
                                            : "text-white/60 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {model.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CSV Upload Banner — shown when no file */}
            {!hasFile && (
                <div
                    className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 cursor-pointer hover:bg-white/8 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="rounded-full bg-white/10 p-4 group-hover:bg-white/15 transition-all">
                        <Paperclip className="w-7 h-7 text-white/50" />
                    </div>
                    <div className="text-center">
                        <p className="text-white/80 font-medium">Upload a CSV file to start chatting</p>
                        <p className="text-white/40 text-sm mt-1">Click here or drag & drop a .csv file</p>
                    </div>
                </div>
            )}

            {/* Chat area */}
            {hasFile && (
                <>
                    {/* File badge */}
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                        <Paperclip className="w-3.5 h-3.5 text-white/50" />
                        <span className="text-xs text-white/60 font-medium truncate max-w-[200px]">{localFile.name}</span>
                        <button
                            onClick={() => { setLocalFile(null); setMessages([]); }}
                            className="ml-1 text-white/30 hover:text-white/70 transition-colors text-xs"
                        >✕</button>
                    </div>

                    {/* Messages scroll area */}
                    <div className="flex-1 overflow-y-auto pr-2 mb-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                <Bot className="w-10 h-10 text-white/20" />
                                <p className="text-white/40 text-sm">
                                    Ask anything about <span className="text-white/60 font-medium">{localFile.name}</span>
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
                            placeholder="Ask a question about your data..."
                            disabled={isLoading}
                            className={cn(
                                "w-full px-4 py-3 resize-none bg-transparent border-none text-white text-sm",
                                "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-white/30 min-h-[60px]",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                            style={{ overflow: "hidden" }}
                        />
                        <div className="flex items-center justify-between px-3 pb-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-xs"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                Change CSV
                            </button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
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
                                    disabled={!value.trim()}
                                    className={cn(
                                        "p-2 rounded-xl border transition-all",
                                        value.trim()
                                            ? "bg-white text-black border-transparent hover:bg-white/90"
                                            : "bg-transparent text-white/20 border-white/10 cursor-not-allowed"
                                    )}
                                >
                                    <ArrowUpIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

