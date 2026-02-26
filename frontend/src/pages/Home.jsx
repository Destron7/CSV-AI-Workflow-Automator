import React from 'react';
import { Link } from 'react-router-dom';
import { BentoGrid, BentoCard } from '../components/ui/bento-grid';
import { Button } from '../components/ui/button';
import {
    FileUp,
    Sparkles,
    LineChart,
    MousePointerClick,
    Presentation,
    ArrowRight
} from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-transparent font-sans text-foreground">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium mb-6">
                        🚀 Automate your data workflow
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Data Analytics, <br className="hidden md:block" />
                        Simplified by AI
                    </h1>
                    <p className="mt-4 max-w-[42rem] mx-auto text-muted-foreground text-lg md:text-xl mb-10">
                        Upload your CSV, clean your data, and uncover deep hidden insights in minutes. No coding required.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button asChild size="lg" className="h-12 px-8 text-lg">
                            <Link to="/get-started">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="h-12 px-8 text-lg">
                            <Link to="/csv-analysis">Explore Demo</Link>
                        </Button>
                    </div>
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
                            Everything you need to turn raw data into actionable insights.
                        </p>
                    </div>

                    <BentoGrid className="max-w-5xl mx-auto">
                        {features.map((feature, idx) => (
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

const features = [
    {
        Icon: FileUp,
        name: "Effortless Upload",
        description: "Drag & drop your CSV files. We handle large datasets with ease.",
        href: "/get-started",
        cta: "Start Upload",
        className: "col-span-1 md:col-span-1",
        background: <div className="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl" />,
    },
    {
        Icon: Sparkles,
        name: "Automated Cleaning",
        description: "Instantly fix missing values, duplicates, and formatting errors.",
        href: "/csv-cleaning",
        cta: "Clean Data",
        className: "col-span-1 md:col-span-2",
        background: <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full opacity-20 blur-3xl" />,
    },
    {
        Icon: LineChart,
        name: "Deep Insights",
        description: "Visual exploratory analysis to understand correlations and trends.",
        href: "/csv-analysis",
        cta: "Analyze",
        className: "col-span-1 md:col-span-2",
        background: <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full opacity-20 blur-3xl" />,
    },
    {
        Icon: MousePointerClick,
        name: "Chat with Your Data",
        description: "Ask natural language questions about your CSV using a local AI model. No code, no exports — just answers.",
        href: "/chat",
        cta: "Open Chat",
        className: "col-span-1 md:col-span-1",
        background: <div className="absolute top-10 left-10 w-32 h-32 bg-orange-100 rounded-full opacity-20 blur-2xl" />,
    },
    {
        Icon: Presentation,
        name: "Clear Results",
        description: "Export clean data or view interactive dashboards.",
        href: "/csv-analysis",
        cta: "View Results",
        className: "col-span-1 md:col-span-3",
        background: <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-20" />,
    },
];
