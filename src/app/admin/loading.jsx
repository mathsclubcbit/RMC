export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white/90">Loading Admin Console...</h3>
                    <p className="text-sm text-white/50 animate-pulse">Fetching live data from database</p>
                </div>
            </div>
        </div>
    );
}
