import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/middleware"; // wait, verifyJwt is in middleware.js, maybe it's not exported. Actually, let's use src/lib/jwt.js
import { verifyToken } from "@/lib/jwt";
import { createAdminClient } from "@/lib/supabase/server";
import TeamDashboardClient from "./TeamDashboardClient";

export const metadata = {
    title: "Team Dashboard | RMC",
};

export default async function TeamDashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('team_token')?.value;

    if (!token) {
        redirect("/team/login");
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'team') {
        redirect("/team/login");
    }

    const teamName = payload.team;

    // Fetch applicants who selected this team
    const supabase = createAdminClient();
    const { data: applicants, error } = await supabase
        .from("recruitment_applications")
        .select("*")
        .ilike("team", `%${teamName}%`)
        .order("applied_at", { ascending: false });

    if (error) {
        console.error("Error fetching team applicants:", error);
    }

    return (
        <div className="max-w-7xl mx-auto w-full">
            <div className="mb-8 border-b border-white/10 pb-6">
                <h1 className="text-3xl font-serif text-white mb-2">Team {teamName}</h1>
                <p className="text-white/50 text-sm font-mono uppercase tracking-widest">
                    Applicant Management Dashboard
                </p>
            </div>
            
            <TeamDashboardClient initialApplicants={applicants || []} teamName={teamName} />
        </div>
    );
}
