"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Template({ children }) {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/coordinator') || pathname.startsWith('/network');

    // Dashboard routes need to break out of the transform context (framer-motion) 
    // to allow 'fixed' elements (like the bottom dock) to work relative to the viewport.
    if (isDashboard) {
        return <div className="min-h-screen">{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for "premium" feel
            }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}
