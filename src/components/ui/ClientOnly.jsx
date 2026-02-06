"use client";

import { useEffect, useState } from "react";

/**
 * A wrapper component that only renders its children on the client side.
 * This is useful for components that rely on browser-only APIs and cause
 * hydration mismatches or SSR errors.
 */
export default function ClientOnly({ children, fallback = null }) {
    const [hasMounted, setHasMounted] = useState(false);

    // eslint-disable-next-line


    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return fallback;
    }

    return <>{children}</>;
}
