import React from 'react';
import { CsvChatbot } from '../components/ui/csv-chatbot';

export default function Chat() {
    return (
        <div className="h-screen overflow-hidden bg-transparent text-foreground">
            <div className="container px-4 md:px-6 pt-20 h-full">
                <CsvChatbot />
            </div>
        </div>
    );
}
