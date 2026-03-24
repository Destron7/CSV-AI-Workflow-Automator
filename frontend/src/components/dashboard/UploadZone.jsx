import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, Send } from 'lucide-react';

/**
 * UploadZone — drag-and-drop CSV upload with initial question input.
 * Shown only when no dashboard has been loaded yet.
 */
export default function UploadZone({ onUpload, isLoading }) {
    const [file, setFile] = useState(null);
    const [question, setQuestion] = useState('Give me an overview of this dataset');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.name.endsWith('.csv')) {
            setFile(dropped);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.name.endsWith('.csv')) {
            setFile(selected);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file || !question.trim()) return;
        onUpload(file, question.trim());
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl space-y-6"
            >
                {/* Drop Zone */}
                <div
                    role="button"
                    tabIndex={0}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
                    className={`
                        relative flex flex-col items-center justify-center
                        rounded-2xl border-2 border-dashed p-12 cursor-pointer
                        transition-all duration-300
                        ${isDragging
                            ? 'border-emerald-400 bg-emerald-400/5 scale-[1.02]'
                            : file
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-white/20 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.06]'
                        }
                    `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {file ? (
                        <>
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                            </div>
                            <p className="text-white font-medium text-lg">{file.name}</p>
                            <p className="text-white/50 text-sm mt-1">
                                {(file.size / 1024).toFixed(1)} KB — click to change
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Upload className="w-7 h-7 text-white/40" />
                            </div>
                            <p className="text-white/70 font-medium text-lg">
                                Drop your CSV file here
                            </p>
                            <p className="text-white/40 text-sm mt-1">
                                or click to browse
                            </p>
                        </>
                    )}
                </div>

                {/* Question Input */}
                <div className="relative">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask an initial question about your data..."
                        disabled={isLoading}
                        className="
                            w-full px-5 py-4 pr-14
                            rounded-xl bg-white/[0.06] border border-white/10
                            text-white placeholder-white/30
                            focus:outline-none focus:border-white/30 focus:bg-white/[0.08]
                            transition-all duration-200
                            disabled:opacity-50
                        "
                    />
                    <button
                        type="submit"
                        disabled={!file || !question.trim() || isLoading}
                        className="
                            absolute right-3 top-1/2 -translate-y-1/2
                            w-10 h-10 rounded-lg
                            flex items-center justify-center
                            bg-emerald-500 hover:bg-emerald-400
                            disabled:bg-white/10 disabled:cursor-not-allowed
                            transition-colors duration-200
                        "
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="flex items-center justify-center gap-3 py-4">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                        <span className="text-white/60 text-sm">
                            Analyzing your data and generating dashboard...
                        </span>
                    </div>
                )}
            </form>
        </div>
    );
}
