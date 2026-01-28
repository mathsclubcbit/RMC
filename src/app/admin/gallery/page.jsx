import GalleryManager from "./GalleryManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Admin - Gallery Management",
};

export default function AdminGalleryPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-teal-400">Gallery Management</h1>
                        <p className="text-white/40 mt-1">Upload and manage photos for the gallery page.</p>
                    </div>
                </header>

                <GalleryManager />
            </div>
        </div>
    );
}
