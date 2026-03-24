import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BentoGrid, BentoCard } from '../components/ui/bento-grid';
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { useCsvSelection } from '../hooks/useCsvSelection';
import {
    FileUp,
    Sparkles,
    LineChart,
    MousePointerClick,
    Presentation,
    Upload,
    CheckCircle2,
    X,
} from 'lucide-react';

export default function Home() {
    const {
        selectedFile,
        csvColumns,
        csvRowCount,
        handleFileUpload,
        clearGlobalCsv,
        isProcessing,
    } = useCsvSelection();

    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const hasFile = !!selectedFile;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        setUploadError('');
        if (!file) return;
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setUploadError('Please select a valid CSV file (.csv)');
            return;
        }
        handleFileUpload(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveFile = () => {
        clearGlobalCsv();
        setUploadError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="min-h-screen flex flex-col bg-transparent font-sans text-foreground">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium mb-6">
                        🚀 Automate your data workflow
                    </div>
                    <div className="h-[100px] md:h-[130px] lg:h-[150px] mb-6 flex items-center justify-center">
                        <GooeyText
                            texts={["Data Analytics,", "Simplified by AI"]}
                            morphTime={1.5}
                            cooldownTime={0.5}
                            className="font-extrabold"
                            textClassName="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
                        />
                    </div>
                    <p className="mt-4 max-w-[42rem] mx-auto text-muted-foreground text-lg md:text-xl mb-10">
                        Upload your CSV, clean your data, and uncover deep hidden insights in minutes. No coding required.
                    </p>

                    {/* Upload Zone */}
                    {!hasFile ? (
                        <div className="max-w-xl mx-auto">
                            <div
                                className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group
                                    ${dragActive
                                        ? 'border-primary bg-primary/10 scale-[1.02]'
                                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8'
                                    }`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    id="homeUploadCsv"
                                />
                                <div className={`rounded-full p-4 transition-all duration-300 ${dragActive ? 'bg-primary/20' : 'bg-white/10 group-hover:bg-white/15'}`}>
                                    <Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-primary' : 'text-white/50'}`} />
                                </div>
                                <div>
                                    <p className="text-white/90 font-semibold text-lg">
                                        {dragActive ? 'Drop your CSV here' : 'Upload a CSV to get started'}
                                    </p>
                                    <p className="text-white/40 text-sm mt-1">
                                        Click here or drag & drop a .csv file
                                    </p>
                                </div>
                                {isProcessing && (
                                    <div className="flex items-center gap-2 text-sm text-yellow-400/80 animate-pulse">
                                        <svg className="animate-spin h-4 w-4 border-2 border-t-2 border-yellow-400 rounded-full" viewBox="0 0 24 24"></svg>
                                        Parsing CSV…
                                    </div>
                                )}
                            </div>
                            {uploadError && (
                                <p className="mt-3 text-sm text-destructive">{uploadError}</p>
                            )}
                        </div>
                    ) : (
                        /* File Loaded Banner */
                        <div className="max-w-xl mx-auto">
                            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full p-2.5 bg-emerald-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold truncate max-w-[250px]">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-white/50 text-sm">
                                            {csvRowCount.toLocaleString()} rows · {csvColumns.length} columns
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                                    title="Remove file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
            </section>

            {/* Features Section (Bento Grid) */}
            <section id="features" className="py-20 bg-transparent">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Powerful Features</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {hasFile
                                ? 'Your data is loaded — pick a feature to get started.'
                                : 'Upload a CSV above to unlock all features.'}
                        </p>
                    </div>

                    <BentoGrid className="max-w-5xl mx-auto">
                        {getFeatures(hasFile).map((feature, idx) => (
                            <BentoCard key={idx} {...feature} />
                        ))}
                    </BentoGrid>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-transparent border-t border-white/10">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">About This Project</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        The AI Workflow Automator is built using a modern tech stack (React, FastAPI, Pandas) to demonstrate
                        the power of automating complex data tasks. Designed for efficiency and ease of use.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-black/20 backdrop-blur-sm border-t border-white/10">
                <div className="container text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} AI Workflow Automator. Built with ❤️.</p>
                </div>
            </footer>
        </div>
    );
}

function getFeatures(hasFile) {
    const disabledClass = !hasFile ? 'opacity-50 pointer-events-none' : '';
    return [
        {
            Icon: FileUp,
            name: "Effortless Upload",
            description: hasFile ? "✓ Your CSV is loaded and ready to go." : "Drag & drop your CSV files. We handle large datasets with ease.",
            href: "/",
            cta: hasFile ? "Loaded" : "Upload above",
            className: `col-span-1 md:col-span-1`,
            background: <div className="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl" />,
        },
        {
            Icon: Sparkles,
            name: "Automated Cleaning",
            description: "Instantly fix missing values, duplicates, and formatting errors.",
            href: hasFile ? "/csv-cleaning" : "#",
            cta: hasFile ? "Clean Data" : "Upload CSV first",
            className: `col-span-1 md:col-span-2 ${disabledClass}`,
            background: <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full opacity-20 blur-3xl" />,
        },
        {
            Icon: LineChart,
            name: "Deep Insights",
            description: "Visual exploratory analysis to understand correlations and trends.",
            href: hasFile ? "/csv-analysis" : "#",
            cta: hasFile ? "Analyze" : "Upload CSV first",
            className: `col-span-1 md:col-span-2 ${disabledClass}`,
            background: <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full opacity-20 blur-3xl" />,
        },
        {
            Icon: MousePointerClick,
            name: "Chat with Your Data",
            description: "Ask natural language questions about your CSV using a local AI model. No code, no exports — just answers.",
            href: hasFile ? "/chat" : "#",
            cta: hasFile ? "Open Chat" : "Upload CSV first",
            className: `col-span-1 md:col-span-1 ${disabledClass}`,
            background: <div className="absolute top-10 left-10 w-32 h-32 bg-orange-100 rounded-full opacity-20 blur-2xl" />,
        },
        {
            Icon: Presentation,
            name: "Clear Results",
            description: "View auto-generated interactive dashboards with charts, filters, and AI-powered Q&A.",
            href: hasFile ? "/dashboard" : "#",
            cta: hasFile ? "View Dashboard" : "Upload CSV first",
            className: `col-span-1 md:col-span-3 ${disabledClass}`,
            background: <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-20" />,
        },
    ];
}
