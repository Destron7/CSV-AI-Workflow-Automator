import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Dashboard from '../components/dashboard/Dashboard';
import ChatPanel from '../components/dashboard/ChatPanel';
import { useDashboardSession } from '../hooks/useDashboardSession';
import { useCsvSelection } from '../hooks/useCsvSelection';

/**
 * DashboardChat page — uses the CSV uploaded from the Home page.
 *
 * If no file is uploaded, shows a prompt to go back to Home.
 * On first load with a file, auto-sends it to the pipeline.
 * After dashboard loads: 70/30 dashboard+chat layout.
 */
export default function DashboardChat() {
    const { selectedFile, isRestoring } = useCsvSelection();
    const {
        dashboard,
        chatHistory,
        isLoading,
        isFiltering,
        error,
        sendMessage,
        applyFilters,
    } = useDashboardSession();

    const hasSentFile = useRef(false);

    // Auto-send the file to the pipeline on first load (once)
    useEffect(() => {
        if (selectedFile && !dashboard && !hasSentFile.current && !isLoading && !isRestoring) {
            hasSentFile.current = true;
            sendMessage('Give me an overview of this dataset', selectedFile).catch((err) => {
                console.error('Auto-upload failed:', err);
                hasSentFile.current = false; // allow retry
            });
        }
    }, [selectedFile, dashboard, isLoading, isRestoring, sendMessage]);

    // Guard: still restoring file from IndexedDB
    if (isRestoring) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center pt-20">
                <p className="text-white/40 text-sm">Loading...</p>
            </div>
        );
    }

    // Guard: no CSV uploaded — prompt user to go to Home
    if (!selectedFile) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 pt-24 text-foreground">
                <div className="bg-card p-10 rounded-xl shadow-2xl max-w-md text-center border border-border/40">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">No CSV Uploaded</h2>
                    <p className="text-muted-foreground mb-6">
                        Please upload a CSV file on the Home page first to generate a dashboard.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center py-3 px-6 rounded-lg text-lg font-semibold text-black bg-white hover:bg-gray-200 transition duration-300"
                    >
                        Go to Home Page
                    </Link>
                </div>
            </div>
        );
    }

    // Pipeline is running — show loading state
    if (!dashboard) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center pt-20 gap-4">
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/60 text-sm">Analyzing your data and generating dashboard...</p>
                {error && (
                    <div className="max-w-xl mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Dashboard loaded — two-column layout
    const handleChatSend = async (question) => {
        try {
            await sendMessage(question);
        } catch (err) {
            console.error('Chat send failed:', err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pt-20">
            <div className="container mx-auto px-4">
                <div className="flex gap-5 h-[calc(100vh-6rem)]">
                    {/* Left: Dashboard (70%) */}
                    <div className="w-[70%] overflow-y-auto pr-2 custom-scrollbar relative">
                        {isFiltering && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                                <div className="flex bg-black/80 px-4 py-2 rounded-full items-center gap-3 shadow-xl">
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-white font-medium">Applying Filters...</span>
                                </div>
                            </div>
                        )}
                        <Dashboard 
                            payload={dashboard} 
                            onApplyFilters={applyFilters} 
                            isFiltering={isFiltering} 
                        />
                    </div>

                    {/* Right: Chat Panel (30%) */}
                    <div className="w-[30%] min-w-[320px]">
                        <ChatPanel
                            chatHistory={chatHistory}
                            onSend={handleChatSend}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
