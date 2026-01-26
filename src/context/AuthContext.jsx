"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setPermissions(null);
                }
            } catch (error) {
                console.error("Session error:", error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setPermissions(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileError) {
                console.error("Profile fetch error:", profileError);
                // If profile doesn't exist, create a basic one from user data
                setProfile({ id: userId, role: 'member' });
                setPermissions(null);
                return;
            }

            setProfile(profileData);

            // Fetch delegated permissions if user is VP, GS, or JS
            const delegatedRoles = ["vice_president", "general_secretary", "joint_secretary"];
            if (delegatedRoles.includes(profileData.role)) {
                const { data: permData } = await supabase
                    .from("delegated_permissions")
                    .select("*")
                    .eq("user_id", userId)
                    .single();

                setPermissions(permData || { can_manage_teams: false, can_manage_members: false });
            } else if (profileData.role === "president") {
                // President has all permissions
                setPermissions({ can_manage_teams: true, can_manage_members: true });
            } else {
                setPermissions(null);
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            setProfile({ id: userId, role: 'member' });
            setPermissions(null);
        }
    };

    const signIn = async (email, password) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        setLoading(false);
        return { data, error };
    };

    const signOut = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (!error) {
            setUser(null);
            setProfile(null);
            setPermissions(null);
        }
        setLoading(false);
        return { error };
    };

    // Helper functions for permission checks
    const isPresident = () => profile?.role === "president";
    const isCoreCouncil = () => ["president", "vice_president", "general_secretary", "joint_secretary", "faculty"].includes(profile?.role);
    const isHead = () => profile?.role === "head";
    const canManageTeams = () => isPresident() || permissions?.can_manage_teams;
    const canManageMembers = () => isPresident() || permissions?.can_manage_members;

    const value = {
        user,
        profile,
        permissions,
        loading,
        signIn,
        signOut,
        isPresident,
        isCoreCouncil,
        isHead,
        canManageTeams,
        canManageMembers,
        refreshProfile: () => user && fetchProfile(user.id)
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
