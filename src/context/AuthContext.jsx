"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);

    // Create Ref for profile and user to be used in auth listener without dependencies
    const profileRef = useRef(profile);
    const userRef = useRef(user);

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Create supabase client once using useMemo
    const supabase = useMemo(() => createClient(), []);

    // Track in-flight requests to prevent double fetching
    const fetchPromises = useRef(new Map());

    // Unified, iterative fetchProfile function
    const fetchProfile = useCallback(async (userId) => {
        const fetchKey = userId;

        // Return existing promise if one is already in flight
        if (fetchPromises.current.has(fetchKey)) {
            console.log(`Using in-flight promise for user: ${userId}`);
            return fetchPromises.current.get(fetchKey);
        }

        const promise = (async () => {
            let lastError;
            // Retry loop: up to 3 attempts (0, 1, 2)
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (!supabase) throw new Error("Supabase client not initialized");

                    // Race condition: 5s timeout vs Supabase request
                    const { data: profileData, error } = await Promise.race([
                        supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", userId)
                            .single(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000))
                    ]);

                    if (error) throw error;

                    console.log("Profile fetched successfully:", profileData?.role);
                    setProfile(profileData);

                    // Set permissions based on role
                    if (profileData.role === "president") {
                        setPermissions({ can_manage_teams: true, can_manage_members: true });
                    } else if (["vice_president", "general_secretary", "joint_secretary"].includes(profileData.role)) {
                        const { data: permData } = await supabase
                            .from("delegated_permissions")
                            .select("*")
                            .eq("user_id", userId)
                            .single();
                        setPermissions(permData || { can_manage_teams: false, can_manage_members: false });
                    } else {
                        setPermissions(null);
                    }

                    return; // Success! Exit the function.

                } catch (err) {
                    if (err?.code === 'PGRST116') {
                        setProfile(null);
                        setPermissions(null);
                        return;
                    }
                    lastError = err;
                    if (attempt < 2) {
                        const delay = Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            console.error("All profile fetch attempts failed.", lastError);
        })();

        fetchPromises.current.set(fetchKey, promise);
        promise.finally(() => {
            fetchPromises.current.delete(fetchKey);
        });
        return promise;
    }, [supabase]);

    const signIn = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            if (error) {
                setLoading(false);
                return { data: null, error };
            }
            if (data?.user) {
                await fetchProfile(data.user.id);
            }
            setLoading(false);
            return { data, error: null };
        } catch (error) {
            setLoading(false);
            return { data: null, error };
        }
    }, [supabase, fetchProfile]);

    const signOut = useCallback(async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setPermissions(null);
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const isPresident = useCallback(() => profile?.role === "president", [profile?.role]);
    const isCoreCouncil = useCallback(() => ["president", "vice_president", "general_secretary", "joint_secretary", "faculty"].includes(profile?.role), [profile?.role]);
    const isHead = useCallback(() => profile?.role === "head", [profile?.role]);
    const canManageTeams = useCallback(() => isPresident() || permissions?.can_manage_teams, [isPresident, permissions?.can_manage_teams]);
    const canManageMembers = useCallback(() => isPresident() || permissions?.can_manage_members, [isPresident, permissions?.can_manage_members]);

    const signUp = useCallback(async (email, password, options = {}) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password, options });
            setLoading(false);
            return { data, error };
        } catch (error) {
            setLoading(false);
            return { data: null, error };
        }
    }, [supabase]);

    const refreshProfile = useCallback(() => user && fetchProfile(user.id), [user, fetchProfile]);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            if (!supabase) {
                if (isMounted) {
                    setLoading(false);
                    setAuthReady(true);
                }
                return;
            }
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    if (isMounted) {
                        setLoading(false);
                        setAuthReady(true);
                    }
                }
                // Note: we let onAuthStateChange handle the profile fetch if session exists
            } catch (error) {
                if (isMounted) {
                    setLoading(false);
                    setAuthReady(true);
                }
            }
        };

        initializeAuth();

        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                if (event === 'SIGNED_OUT' || !session) {
                    setUser(null);
                    setProfile(null);
                    setPermissions(null);
                    setLoading(false);
                    setAuthReady(true);
                    return;
                }

                // Logic partially restored: State updates only
                if (userRef.current?.id === session.user.id && profileRef.current) {
                    setLoading(false);
                    setAuthReady(true);
                    return;
                }

                setUser(session.user);

                // UNBLOCK UI: Set ready immediately, fetch profile in background
                if (isMounted) {
                    setLoading(false);
                    setAuthReady(true);
                }

                // Defer profile fetch to next tick to avoid initialization race conditions during build
                setTimeout(() => {
                    if (isMounted && session?.user?.id) {
                        fetchProfile(session.user.id).catch(err =>
                            console.error("Background profile fetch failed:", err)
                        );
                    }
                }, 0);
            }
        );

        return () => {
            isMounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const value = {
        user,
        profile,
        permissions,
        loading,
        authReady,
        signIn,
        signUp,
        signOut,
        isPresident,
        isCoreCouncil,
        isHead,
        canManageTeams,
        canManageMembers,
        refreshProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
