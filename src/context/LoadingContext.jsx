"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
    const [isPageLoading, setIsPageLoading] = useState(false);
    const pathname = usePathname();

    // Reset loading state when the pathname actually changes
    useEffect(() => {
        if (!isPageLoading) return;

        const timer = setTimeout(() => {
            setIsPageLoading(false);
        }, 800); // Cinematic minimum duration

        return () => clearTimeout(timer);
    }, [pathname, isPageLoading]);

    const startLoading = () => setIsPageLoading(true);
    const stopLoading = () => setIsPageLoading(false);

    return (
        <LoadingContext.Provider value={{ isPageLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    return useContext(LoadingContext);
}
