import React from 'react';
import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { GlowingEffect } from './glowing-effect';
import { cn } from '../../lib/utils';

export function GoToHomeButton({ className }) {
    const location = useLocation();

    if (location.pathname === '/') {
        return null;
    }

    return (
        <div className={cn("fixed bottom-8 right-8 z-50", className)}>
            <div className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md shadow-lg transition-transform hover:scale-105 active:scale-95 bento-card">
                {/* 
                  The GlowingEffect component inherits rounded geometry, so 
                  rounded-full on the parent ensures the glow is circular. 
                */}
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                />
                
                <Link to="/" className="relative z-10 flex h-full w-full items-center justify-center rounded-full" aria-label="Go to Home">
                    <Home className="h-6 w-6 text-white/80 transition-colors group-hover:text-white" />
                </Link>

                <div className="pointer-events-none absolute inset-0 transform-gpu rounded-full transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
            </div>
        </div>
    );
}

export default GoToHomeButton;
