import { Montserrat, Inter, Playfair_Display, JetBrains_Mono, Cormorant_Garamond, Cinzel } from "next/font/google"; // [NEW IMPORTS]
import "./globals.css";
import "./globals.css";

// ... existing fonts ...

const cormorant = Cormorant_Garamond({
    variable: "--font-cormorant",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    display: "swap",
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["400", "600", "700", "900"],
    display: "swap",
});

const jetbrains = JetBrains_Mono({
    variable: "--font-jetbrains",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap",
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


import CustomCursor from "@/components/ui/CustomCursor";
import Preloader from "@/components/ui/Preloader";
import ConditionalShell from "@/components/layout/ConditionalShell";

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="scroll-smooth" suppressHydrationWarning>
            <body
                className={`${montserrat.variable} ${inter.variable} ${playfair.variable} ${jetbrains.variable} ${cormorant.variable} ${cinzel.variable} antialiased min-h-screen flex flex-col bg-[#020617] text-foreground`}
            >
                <CustomCursor />
                <Preloader />
                <ConditionalShell>
                    {children}
                </ConditionalShell>
            </body>
        </html>
    );
}
