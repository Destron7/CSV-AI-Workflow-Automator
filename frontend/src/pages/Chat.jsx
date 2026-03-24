import React from 'react';
import { Link } from 'react-router-dom';
import { CsvChatbot } from '../components/ui/csv-chatbot';
import { useCsvSelection } from '../hooks/useCsvSelection';
import { Upload } from 'lucide-react';

export default function Chat() {
    const { selectedFile } = useCsvSelection();

    // Guard: no CSV uploaded
    if (!selectedFile) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 pt-24 text-foreground">
                <div className="bg-card p-10 rounded-xl shadow-2xl max-w-md text-center border border-border/40">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">No CSV Uploaded</h2>
                    <p className="text-muted-foreground mb-6">
                        Please upload a CSV file on the Home page first to start chatting with your data.
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

    return (
        <div className="h-screen overflow-hidden bg-transparent text-foreground">
            <div className="container px-4 md:px-6 pt-20 h-full">
                <CsvChatbot sharedFile={selectedFile} />
            </div>
        </div>
    );
}
