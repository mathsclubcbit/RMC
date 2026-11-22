"use client";

import AdminNav from "./AdminNav";
import { LoadingProvider, useLoading } from "@/context/LoadingContext";
import MathLoading from "@/components/ui/MathLoading";
import { AnimatePresence } from "framer-motion";

function AdminLayoutInner({ children }) {
    const { isPageLoading } = useLoading();

    return (
        <div className="min-h-screen bg-black text-white">
            <AnimatePresence>
                {isPageLoading && <MathLoading key="admin-nav-loader" message="Navigating Admin..." />}
            </AnimatePresence>
            <AdminNav />
            <main className="relative z-10 pb-32 md:pb-8">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <LoadingProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </LoadingProvider>
    );
}
