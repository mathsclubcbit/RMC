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

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                // Get the current session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session error:", error);
                    if (isMounted) {
                        setLoading(false);
                        setAuthReady(true);
                    }
                    return;
                }

                // If no session, we're ready (logged out state)
                if (!session && isMounted) {
                    setLoading(false);
                    setAuthReady(true);
                }

                // If session exists, we let onAuthStateChange handle the profile fetch
            } catch (error) {
                console.warn("Auth initialization error:", error);
                if (isMounted) {
                    setLoading(false);
                    setAuthReady(true);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event);

                if (!isMounted) return;

                if (event === 'SIGNED_OUT' || !session) {
                    setUser(null);
                    setProfile(null);
                    setPermissions(null);
                    setLoading(false);
                    setAuthReady(true);
                    return;
                }

                // If user is already set and same ID, and we have a profile, don't refetch
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

                // Fetch profile in background (don't await)
                fetchProfile(session.user.id).catch(err =>
                    console.error("Background profile fetch failed:", err)
                );
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

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
                    console.log(`Fetching profile for user: ${userId} (Attempt ${attempt + 1})`);

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
                    // Check for specific Supabase error codes
                    // PGRST116: The result contains 0 rows (Profile not found)
                    if (err?.code === 'PGRST116') {
                        console.warn("Profile not found for user (PGRST116). Stopping retries.");
                        // Treat as success but with null profile
                        setProfile(null);
                        setPermissions(null);
                        return;
                    }

                    console.warn(`Profile fetch attempt ${attempt + 1} failed:`, err.message || err);
                    lastError = err;

                    // Wait before retrying (exponential backoff: 1s, 2s)
                    if (attempt < 2) {
                        const delay = Math.pow(2, attempt) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // If we exit the loop, all attempts failed
            console.error("All profile fetch attempts failed. User logged in without profile data.", lastError);
            // We do NOT set a dummy "member" profile here. 
            // We leave profile as null. The UI should handle this state (e.g. show restricted view or loading).
        })();

        // Store promise in map
        fetchPromises.current.set(fetchKey, promise);

        // Cleanup map when promise completes (success or fail)
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

            // Wait for profile to be fetched
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
            // setAuthReady(true);
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Helper functions for permission checks
    const isPresident = useCallback(() => profile?.role === "president", [profile?.role]);
    const isCoreCouncil = useCallback(() => ["president", "vice_president", "general_secretary", "joint_secretary", "faculty"].includes(profile?.role), [profile?.role]);
    const isHead = useCallback(() => profile?.role === "head", [profile?.role]);
    const canManageTeams = useCallback(() => isPresident() || permissions?.can_manage_teams, [isPresident, permissions?.can_manage_teams]);
    const canManageMembers = useCallback(() => isPresident() || permissions?.can_manage_members, [isPresident, permissions?.can_manage_members]);

    const signUp = useCallback(async (email, password, options = {}) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options
            });
            setLoading(false);
            return { data, error };
        } catch (error) {
            setLoading(false);
            return { data: null, error };
        }
    }, [supabase]);

    const refreshProfile = useCallback(() => user && fetchProfile(user.id), [user, fetchProfile]);

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
