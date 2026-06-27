import Header from "@/components/layout/Header";

export const metadata = {
    title: "Team Head Portal | RMC",
};

export default function TeamLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#060606] text-white flex flex-col font-sans selection:bg-teal/30">
            <Header />
            <main className="flex-1 flex flex-col relative z-10 pt-24 sm:pt-32 px-4 pb-12 sm:pb-24">
                {children}
            </main>
        </div>
    );
}
