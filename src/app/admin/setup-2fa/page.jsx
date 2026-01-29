"use client";

import { useActionState, useState } from "react";
import { generateTotpSecretAction } from "@/app/admin/actions";
import { Shield, Eye, EyeOff, Copy } from "lucide-react";

const initialState = { secret: "", qrCode: "" };

export default function Setup2FAPage() {
    const [state, formAction, pending] = useActionState(generateTotpSecretAction, initialState);
    const [showSecret, setShowSecret] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <header className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Setup 2FA</h1>
                    <p className="text-white/50 text-sm">
                        Connect Google Authenticator to secure your admin account.
                    </p>
                </header>

                {!state.secret ? (
                    <form action={formAction}>
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                            {pending ? "Generating keys..." : "Generate New Secret"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-xl mx-auto w-fit">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={state.qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                        </div>

                        {/* Secret Key Display */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-white/40 block text-center">Your Secret Key</label>
                            <div className="relative group">
                                <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-indigo-300 font-mono tracking-wider break-all">
                                    {showSecret ? state.secret : "•••• •••• •••• ••••"}
                                </div>
                                <button
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white transition-colors"
                                >
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <h3 className="text-amber-400 text-sm font-bold mb-1">⚠️ Important Action Required</h3>
                            <p className="text-amber-200/70 text-xs leading-relaxed">
                                You must add this secret to your Vercel/System environment variables immediately.
                            </p>
                            <div className="mt-3 bg-black/40 rounded-lg p-3 flex items-center justify-between border border-amber-500/10">
                                <code className="text-xs text-amber-100 font-mono">ADMIN_TOTP_SECRET={state.secret}</code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`ADMIN_TOTP_SECRET=${state.secret}`)}
                                    className="p-1.5 text-amber-200/50 hover:text-amber-200 transition-colors"
                                    title="Copy env string"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <a href="/admin/login" className="text-sm text-white/40 hover:text-white transition-colors">
                                Return to Login
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
