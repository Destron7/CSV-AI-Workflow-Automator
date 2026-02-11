
import React, { useState, useRef } from "react";
import { cn } from "../../lib/utils";

import { GlowingEffect } from "./glowing-effect";

const GlowingCard = ({ children, className }) => {
    return (
        <div
            className={cn(
                "relative rounded-xl border border-white/10 bg-black",
                className
            )}
        >
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
            />

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
};

export { GlowingCard };
