import Link from "next/link";
import SpotlightCard from "./SpotlightCard";
import { Clock, MapPin, Calendar, ArrowRight } from "lucide-react";

const colorVariants = {
    teal: "teal",
    lime: "lime",
    coral: "coral",
    orange: "orange",
};

export default function EventCard({ event, color = "teal" }) {
    const { title, date, time, location, description, status, links, participants, category } = event;
    const themeColor = colorVariants[color] || "teal";

    const statusStyles = {
        upcoming: "bg-lime/20 text-lime border-lime/20",
        ongoing: "bg-coral/20 text-coral border-coral/20",
        completed: "bg-white/10 text-muted border-white/10",
        registration: "bg-orange/20 text-orange border-orange/20 animate-pulse",
    };

    // Determine status if not provided (assume completed if nothing else)
    const displayStatus = status || "completed";

    return (
        <SpotlightCard className={`bg-black/40 border border-white/10 p-6 rounded-2xl h-full flex flex-col group hover:border-${themeColor}/50 transition-colors`}>
            <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${statusStyles[displayStatus] || statusStyles.completed} uppercase tracking-wider`}>
                    {category || displayStatus}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted font-mono">
                    <Calendar className="w-3 h-3" /> {date}
                </span>
            </div>

            <h3 className={`text-xl font-bold font-serif mb-3 text-foreground group-hover:text-${themeColor} transition-colors`}>
                {title}
            </h3>

            {description && (
                <p className="text-muted text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">{description}</p>
            )}

            <div className="space-y-2 mb-6 border-t border-white/5 pt-4 mt-auto">
                {time && (
                    <div className="flex items-center gap-2 text-sm text-muted/80">
                        <Clock className={`w-4 h-4 text-${themeColor}`} />
                        <span>{time}</span>
                    </div>
                )}
                {location && (
                    <div className="flex items-center gap-2 text-sm text-muted/80">
                        <MapPin className={`w-4 h-4 text-${themeColor}`} />
                        <span>{location}</span>
                    </div>
                )}
                {participants && (
                    <div className="flex items-center gap-2 text-sm text-muted/80">
                        <span className={`text-${themeColor} font-bold`}>👥</span>
                        <span>{participants} Participants</span>
                    </div>
                )}
            </div>

            {links && links.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {links.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link}
                            target="_blank"
                            className={`w-full py-2 rounded-xl bg-white/5 hover:bg-${themeColor}/20 border border-white/10 hover:border-${themeColor}/50 text-center font-medium text-xs transition-all flex items-center justify-center gap-2 group-hover:text-white`}
                        >
                            {links.length === 1 ? "View Docs / Report" : `Link ${idx + 1}`} <ArrowRight className="w-3 h-3" />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-center font-medium text-sm text-muted/50 cursor-not-allowed">
                    No Links Available
                </div>
            )}
        </SpotlightCard>
    );
}
