import AdminNav from "./AdminNav";

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-black text-white">
            <AdminNav />
            <main className="relative z-10">
                {children}
            </main>
        </div>
    );
}
