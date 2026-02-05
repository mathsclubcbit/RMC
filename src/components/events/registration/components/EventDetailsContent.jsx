'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Info, Calendar, Trophy, Phone } from 'lucide-react';

/**
 * Event themes section
 */
function ThemesSection({ themes }) {
    if (!themes?.length) return null;

    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-sm">
                Themes & Tracks
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
                {themes.map((theme, i) => (
                    <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 text-white/90 text-sm flex items-center gap-3 hover:border-teal/30 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                        {theme}
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * Event timeline/stages section
 */
function TimelineSection({ stages }) {
    if (!stages?.length) return null;

    return (
        <div className="py-2">
            <h4 className="flex items-center gap-2 text-teal font-bold mb-8 uppercase tracking-wider text-sm pl-2">
                <Calendar className="w-4 h-4" /> Event Journey
            </h4>
            <div className="space-y-0 relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal/50 via-teal/20 to-transparent" />

                {stages.map((stage, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="relative pl-12 pb-8 last:pb-0 group"
                    >
                        {/* Dot */}
                        <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-[#0f111a] border border-teal/30 z-10 flex items-center justify-center group-hover:scale-110 group-hover:border-teal transition-all shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                            <div className="w-3 h-3 rounded-full bg-teal" />
                        </div>

                        {/* Content */}
                        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5 hover:border-teal/30 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(45,212,191,0.05)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <h5 className="text-white font-bold text-lg">{stage.name}</h5>
                                <span className="text-teal font-mono text-[10px] bg-teal/10 px-3 py-1 rounded-full border border-teal/20 text-center w-max whitespace-nowrap">
                                    {stage.date}
                                </span>
                            </div>
                            {stage.description && (
                                <div className="text-white/70 text-sm mb-4 leading-relaxed space-y-1">
                                    {stage.description.includes('•') ? (
                                        stage.description.split('•').map((point, idx) => (
                                            point.trim() && (
                                                <div key={idx} className="flex gap-2 items-start">
                                                    <span className="text-teal mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                                                    <span>{point.trim()}</span>
                                                </div>
                                            )
                                        ))
                                    ) : (
                                        <p>{stage.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/**
 * Prize pool section
 */
function PrizesSection({ prizes }) {
    if (!prizes || (!prizes.winner && !prizes.runnerUp)) return null;

    return (
        <div className="py-2">
            <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-xs pl-2 opacity-80">
                <Trophy className="w-3.5 h-3.5" /> Prize Pool
            </h4>
            <div className="flex flex-wrap gap-3">
                {prizes.winner && (
                    <div className="flex-1 min-w-[140px] bg-gradient-to-br from-yellow-500/10 to-transparent px-4 py-3 rounded-xl border border-yellow-500/20 text-center shadow-[0_0_15px_rgba(234,179,8,0.1)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:border-yellow-500/40 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Trophy className="w-5 h-5 text-yellow-500/80 mx-auto mb-1.5 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                        <div className="text-yellow-200/90 font-bold text-xs uppercase tracking-wide mb-0.5 relative z-10">Winner</div>
                        <div className="text-white font-medium text-sm relative z-10">{prizes.winner}</div>
                    </div>
                )}
                {prizes.runnerUp && (
                    <div className="flex-1 min-w-[140px] bg-white/[0.03] px-4 py-3 rounded-xl border border-white/10 text-center">
                        <Trophy className="w-5 h-5 text-gray-400/80 mx-auto mb-1.5" />
                        <div className="text-gray-300/90 font-bold text-xs uppercase tracking-wide mb-0.5">Runner Up</div>
                        <div className="text-white font-medium text-sm">{prizes.runnerUp}</div>
                    </div>
                )}
                {prizes.participation && (
                    <div className="flex-1 min-w-[140px] bg-teal/5 px-4 py-3 rounded-xl border border-teal/10 text-center">
                        <Trophy className="w-5 h-5 text-teal/80 mx-auto mb-1.5" />
                        <div className="text-teal/90 font-bold text-xs uppercase tracking-wide mb-0.5">Perks</div>
                        <div className="text-white font-medium text-sm">{prizes.participation}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * EventDetailsContent - Displays event description, themes, timeline, prizes, rules, and contacts
 * @param {{ event: object, isHackathonOrIdeathon: boolean }} props
 */
function EventDetailsContent({ event, isHackathonOrIdeathon = false }) {
    if (!event) return null;

    return (
        <div className="space-y-8">
            {/* Description / About - Glassmorphic Card */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-teal/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <FileText className="w-24 h-24 text-teal" />
                </div>
                <h4 className="flex items-center gap-2 text-teal font-bold mb-4 uppercase tracking-wider text-sm relative z-10">
                    <FileText className="w-4 h-4" /> About The Event
                </h4>
                <p className="text-white/80 leading-relaxed text-sm md:text-base whitespace-pre-line relative z-10 font-light">
                    {event.description}
                </p>
            </section>

            <ThemesSection themes={event.themes} />
            <TimelineSection stages={event.stages} />
            <PrizesSection prizes={event.prizes} />

            {/* Eligibility */}
            {event.eligibility && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                        <Users className="w-4 h-4" /> Eligibility
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed">{event.eligibility}</p>
                </section>
            )}

            {/* Rules */}
            {event.rules?.length > 0 && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-3 uppercase tracking-wider text-sm">
                        <Info className="w-4 h-4" /> Rules & Guidelines
                    </h4>
                    <ul className="space-y-2">
                        {event.rules.map((rule, i) => (
                            <li key={i} className="flex gap-3 text-sm text-white/70">
                                <span className="text-teal mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                                <span className="leading-relaxed">{rule}</span>
                            </li>
                        ))}
                    </ul>
                    {isHackathonOrIdeathon && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <a
                                href={event?.samplePpt || "/sample-presentation.pptx"}
                                download={!event?.samplePpt}
                                target={event?.samplePpt ? "_blank" : "_self"}
                                rel={event?.samplePpt ? "noopener noreferrer" : ""}
                                className="flex items-center gap-2 text-teal hover:text-teal/80 transition-colors text-sm font-medium w-max"
                            >
                                <FileText className="w-4 h-4" />
                                Download Sample Presentation Format
                            </a>
                        </div>
                    )}
                </section>
            )}

            {/* Contacts */}
            {event.contactOrganizers?.length > 0 && (
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h4 className="flex items-center gap-2 text-teal font-bold mb-6 uppercase tracking-wider text-sm">
                        <Phone className="w-4 h-4" /> Organizers
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {event.contactOrganizers.map((contact, i) => (
                            <div key={i} className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10 hover:border-teal/50 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-emerald-600 text-black flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                    {contact.name[0]}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-white font-medium truncate">{contact.name}</div>
                                    <div className="text-teal/80 text-xs font-mono mt-0.5">{contact.phone}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default memo(EventDetailsContent);
