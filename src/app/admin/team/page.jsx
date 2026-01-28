import TeamManager from "./TeamManager";

export default function AdminTeamPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Team Management</h1>
            <p className="text-white/40 mb-8">Manage council members, faculty advisors, and team structure.</p>
            <TeamManager />
        </div>
    );
}
