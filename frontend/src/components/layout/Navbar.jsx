import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "../ui/navigation-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { Link, useLocation } from 'react-router-dom';
import { cn } from "../../lib/utils";
import { Menu, Package2 } from "lucide-react";

const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/csv-cleaning", label: "Data Cleaning" },
    { href: "/csv-analysis", label: "Analysis" },
];

export default function Navbar() {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Show navbar when mouse is within top 20px of screen
            if (e.clientY < 20) {
                setIsVisible(true);
            }
            // Hide navbar when mouse moves down (unless hovering the navbar itself, handled by onMouseEnter)
            else if (e.clientY > 100 && !e.target.closest('header')) {
                setIsVisible(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <header
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            className={cn(
                "fixed top-0 z-50 w-full border-b border-white/10 bg-black transition-transform duration-500 ease-in-out",
                isVisible ? "translate-y-0" : "-translate-y-full delay-500"
            )}
        >
            <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
                {/* Left side (Logo) */}
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
                        <Package2 className="h-6 w-6 text-white" />
                        <span className="hidden sm:inline-block">
                            AI Automator
                        </span>
                    </Link>
                </div>

                {/* Center (Navigation) */}
                <div className="flex-1 flex justify-center">
                    {/* Mobile menu trigger (visible only on mobile) */}
                    <div className="md:hidden">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    className="group h-9 w-9 text-white hover:text-white"
                                    variant="ghost"
                                    size="icon"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-48 p-2 border-white/10 bg-black text-white">
                                <nav className="flex flex-col gap-2">
                                    {navigationLinks.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.href}
                                            className={cn(
                                                "block px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-white/80",
                                                location.pathname === link.href ? "text-white" : "text-gray-400"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Desktop Nav */}
                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList className="gap-1">
                            {navigationLinks.map((link, index) => (
                                <NavigationMenuItem key={index}>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={link.href}
                                            className={cn(
                                                "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-white focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                                                location.pathname === link.href ? "text-white font-semibold" : "text-gray-400"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right side (Action Button) - Removed for now */}
                {/* <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="hidden sm:inline-flex bg-white text-black hover:bg-gray-200">
                        <Link to="/get-started">New Workflow</Link>
                    </Button>
                </div> */}
            </div>
        </header>
    )
}
