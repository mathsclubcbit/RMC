import { Montserrat, Inter, Playfair_Display, JetBrains_Mono, Cormorant_Garamond, Cinzel } from "next/font/google"; // [NEW IMPORTS]
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["400", "600", "700", "900"],
});

const jetbrains = JetBrains_Mono({
    variable: "--font-jetbrains",
    subsets: ["latin"],
    weight: ["400", "500"],
});

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    title: "RMC - Ramanujan Math Club | CBIT",
    description: "Where Numbers Tell Stories - Celebrating Mathematical Excellence at CBIT. Join us for events, workshops, competitions, and more!",
    keywords: ["math club", "CBIT", "Ramanujan", "mathematics", "competitions", "events"],
    authors: [{ name: "RMC CBIT" }],
    icons: {
        icon: "/RMC logo-circular.png",
        shortcut: "/RMC logo-circular.png",
        apple: "/RMC logo-circular.png",
    },
    openGraph: {
        title: "RMC - Ramanujan Math Club | CBIT",
        description: "Where Numbers Tell Stories - Celebrating Mathematical Excellence",
        type: "website",
        images: ["/RMC logo-circular.png"],
    },
};

import SmoothScroll from "@/components/ui/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";
import Preloader from "@/components/ui/Preloader";

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="scroll-smooth" suppressHydrationWarning>
            <body
                className={`${montserrat.variable} ${inter.variable} ${playfair.variable} ${jetbrains.variable} ${cormorant.variable} ${cinzel.variable} antialiased min-h-screen flex flex-col bg-background text-foreground`}
            >
                {/* <NoiseOverlay /> */}
                <CustomCursor />
                <Preloader />
                <SmoothScroll>
                    <Header />
                    <main className="flex-1 w-full overflow-x-hidden">
                        {children}
                    </main>
                    <Footer />
                </SmoothScroll>
            </body>
        </html>
    );
}
