export default function CoordinatorLoading() {
    return (
        <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-teal-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white/90">Loading Dashboard...</h3>
                    <p className="text-sm text-white/50 animate-pulse">Syncing with event data</p>
                </div>
            </div>
        </div>
    );
}
