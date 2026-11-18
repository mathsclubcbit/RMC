"use client";

import { useActionState } from "react";
import { adminLoginAction } from "../actions";

const initialState = { error: "" };

export default function AdminLoginPage() {
    const [state, formAction, pending] = useActionState(adminLoginAction, initialState);
    const step = state?.step === 2 ? 2 : 1;

    return (
        <div className="min-h-[100dvh] bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl p-8 transition-all duration-500">
                <h1 className="text-2xl font-semibold text-white mb-2">
                    {step === 1 ? "Admin Login" : "Two-Factor Auth"}
                </h1>
                <p className="text-white/60 text-sm mb-6">
                    {step === 1 ? "Sign in to access admin console." : "Enter the code from Google Authenticator."}
                </p>

                {state?.error ? (
                    <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                        {state.error}
                    </div>
                ) : null}

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="step" value={step} />

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div>
                                <label className="block text-xs text-white/60 mb-2">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30 transition-colors"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs text-white/60 mb-2">Authenticator Code</label>
                                <input
                                    name="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="\d*"
                                    maxLength={6}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all"
                                    placeholder="000 000"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full rounded-xl bg-teal text-black font-bold uppercase tracking-widest text-xs py-3 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-teal-400 transition-all mt-2"
                    >
                        {pending ? "Verifying..." : (step === 1 ? "Sign In" : "Verify Code")}
                    </button>

                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="w-full text-xs text-white/40 hover:text-white mt-4 transition-colors"
                        >
                            Cancel and Go Back
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
