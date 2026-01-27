"use client";

import { useActionState } from "react";
import { adminLoginAction } from "../actions";

const initialState = { error: "" };

export default function AdminLoginPage() {
    const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

    return (
        <div className="min-h-[100dvh] bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl p-8">
                <h1 className="text-2xl font-semibold text-white mb-2">Admin Login</h1>
                <p className="text-white/60 text-sm mb-6">Sign in to access QR verification.</p>

                {state?.error ? (
                    <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        {state.error}
                    </div>
                ) : null}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-xs text-white/60 mb-2">Username</label>
                        <input
                            name="username"
                            autoComplete="username"
                            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                            placeholder="admin"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-white/60 mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full rounded-xl bg-teal text-black font-bold uppercase tracking-widest text-xs py-3 disabled:opacity-70"
                    >
                        {pending ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
