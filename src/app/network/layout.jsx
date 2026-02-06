"use client";

// import { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
// import { LoadingProvider, useLoading } from "@/context/LoadingContext";
// import NetworkLoading from "@/components/network/NetworkLoading";
// import { AnimatePresence } from "framer-motion";

export default function NetworkLayout({ children }) {
    return (
        <AuthProvider>
            <div className="h-screen bg-[#020617] relative overflow-hidden selection:bg-teal/20 selection:text-teal font-[family-name:var(--font-montserrat)]">
                {children}
            </div>
        </AuthProvider>
    );
}
