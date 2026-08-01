// Force Rebuild
import { Montserrat, Inter, Playfair_Display, JetBrains_Mono, Cormorant_Garamond, Cinzel, Julius_Sans_One } from "next/font/google"; // [NEW IMPORTS]
import "./globals.css";

// ... existing fonts ...

// Critical fonts - preloaded for above-the-fold content
const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
    preload: true, // Preload critical font
    adjustFontFallback: true, // Better fallback matching
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    display: "swap",
    preload: true, // Preload critical font
    adjustFontFallback: true,
});

// Decorative fonts - use optional to prevent layout shift if slow to load
const cormorant = Cormorant_Garamond({
    variable: "--font-cormorant",
    subsets: ["latin"],
    weight: ["400", "600"],  // Reduced from 5 weights to 2
    display: "optional",
    adjustFontFallback: true,
});

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "700"],  // Reduced from 4 weights to 2
    display: "optional",
    adjustFontFallback: true,
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["400", "700"],  // Reduced from 4 weights to 2
    display: "optional",
    adjustFontFallback: true,
});

const jetbrains = JetBrains_Mono({
    variable: "--font-jetbrains",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "optional", // Changed from swap
    adjustFontFallback: true,
});

const julius = Julius_Sans_One({
    variable: "--font-julius",
    subsets: ["latin"],
    weight: "400",
    display: "optional", // Changed from swap
    adjustFontFallback: true,
});

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    title: "RMC - Ramanujan Math Club | CBIT",
    description: "Where Numbers Tell Stories - Celebrating Mathematical Excellence at CBIT. Join us for events, workshops, competitions, and more!",
    keywords: ["math club", "CBIT", "Ramanujan", "mathematics", "competitions", "events"],
    authors: [{ name: "RMC CBIT" }],
    icons: {
        icon: "/full logo.png",
        shortcut: "/full logo.png",
        apple: "/full logo.png",
    },
    openGraph: {
        title: "RMC - Ramanujan Math Club | CBIT",
        description: "Where Numbers Tell Stories - Celebrating Mathematical Excellence",
        type: "website",
        images: ["/full logo.png"],
    },
};


import ClientOverlays from "@/components/layout/ClientOverlays";
import ConditionalShell from "@/components/layout/ConditionalShell";
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
            <body
                className={`${montserrat.variable} ${inter.variable} ${playfair.variable} ${jetbrains.variable} ${cormorant.variable} ${cinzel.variable} ${julius.variable} antialiased min-h-screen flex flex-col bg-[#020617] text-foreground`}
            >
                {/* Skip to main content link for accessibility */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-teal focus:text-black focus:rounded-lg focus:font-bold"
                >
                    Skip to main content
                </a>

                {/* Google Analytics */}
                <GoogleAnalytics gaId="G-RW1J9Q3X7X" />

                <ClientOverlays />
                <ConditionalShell>
                    <main id="main-content">
                        {children}
                    </main>
                </ConditionalShell>
            </body>
        </html>
    );
}
