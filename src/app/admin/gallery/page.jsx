import GalleryManager from "./GalleryManager";
import { isAdminAuthenticated } from "../actions";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Admin - Gallery Management",
};

export default async function AdminGalleryPage() {
    if (!(await isAdminAuthenticated())) {
        redirect("/admin/login");
    }
    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Admin Indigo */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            Admin Console
                        </div>
                        <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                            Gallery Manager
                            <span className="text-indigo-500">.</span>
                        </h1>
                        <p className="mt-2 text-white/50 max-w-xl">
                            Create albums and upload photos for the public gallery.
                        </p>
                    </header>

                    <GalleryManager />
                </div>
            </div>
        </div>
    );
}
