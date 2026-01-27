"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminScanPage() {
    const router = useRouter();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "rmc-qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                const id = String(decodedText || "").trim();
                if (!id) return;

                scanner
                    .clear()
                    .catch(() => {})
                    .finally(() => {
                        router.push(`/admin/ticket/${encodeURIComponent(id)}`);
                    });
            },
            () => {
                // ignore per-frame errors
            }
        );

        return () => {
            scanner.clear().catch(() => {});
        };
    }, [router]);

    return (
        <div className="min-h-[100dvh] bg-black p-6">
            <div className="max-w-3xl mx-auto pt-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-white">Admin QR Scanner</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/admin/events" className="text-white/60 hover:text-white text-sm">
                            Manage Events
                        </Link>
                        <Link href="/" className="text-white/60 hover:text-white text-sm">
                            Back to Home
                        </Link>
                    </div>
                </div>

                <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <p className="text-white/60 text-sm">Point the camera at the participant&apos;s QR code.</p>
                    </div>
                    <div className="p-4">
                        <div id="rmc-qr-reader" className="rounded-xl overflow-hidden bg-black" />
                    </div>
                </div>
            </div>
        </div>
    );
}
