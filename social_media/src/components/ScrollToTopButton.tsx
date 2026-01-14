"use client";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollToTop } from "@/hooks/useScrollToTop";



export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const { scrollToTop } = useScrollToTop();
    

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 z-50",
                "bg-blue-500 hover:bg-blue-600 text-white active:scale-90",
                "border border-white/20 dark:border-gray-800",
                isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-50 pointer-events-none"
            )}
            aria-label="Scroll to top"
        >
            <ChevronUp size={24} strokeWidth={3} />
        </button>
    );
}