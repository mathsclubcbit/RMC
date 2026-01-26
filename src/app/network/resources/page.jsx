"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    FolderOpen,
    Plus,
    Link as LinkIcon,
    FileText,
    FileCode,
    ExternalLink,
    Trash2,
    Loader2,
    X,
    Search
} from "lucide-react";

const TYPE_CONFIG = {
    link: { label: "Link", icon: LinkIcon, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    file: { label: "File", icon: FileText, color: "bg-green-500/20 text-green-400 border-green-500/30" },
    template: { label: "Template", icon: FileCode, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
};

export default function ResourcesPage() {
    const { profile, isPresident } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const supabase = createClient();

    useEffect(() => {
        fetchResources();

        // Realtime subscription
        const channel = supabase
            .channel("resources-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, fetchResources)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchResources = async () => {
        try {
            const { data, error } = await supabase
                .from("resources")
                .select(`
                    *,
                    creator:created_by (full_name, email)
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setResources(data || []);
        } catch (error) {
            console.error("Error fetching resources:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (resourceId) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;

        try {
            const { error } = await supabase.from("resources").delete().eq("id", resourceId);
            if (error) throw error;
            fetchResources();
        } catch (error) {
            console.error("Error deleting resource:", error);
            alert("Failed to delete resource");
        }
    };

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || resource.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Resources
                        </h1>
                        <p className="text-white/50">
                            Shared documents, templates, and important links
                        </p>
                    </div>

                    {isPresident() && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Resource
                        </button>
                    )}
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4 mb-6"
                >
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType("all")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === "all"
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            All
                        </button>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setFilterType(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === key
                                        ? config.color
                                        : "text-white/50 hover:text-white"
                                    }`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Resources Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-teal animate-spin" />
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="text-center py-20">
                        <FolderOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl text-white/50 mb-2">No Resources Found</h3>
                        <p className="text-white/30">
                            {searchQuery || filterType !== "all" ? "Try adjusting your search or filters" : "Add your first resource"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResources.map((resource, index) => {
                            const typeConfig = TYPE_CONFIG[resource.type] || TYPE_CONFIG.link;
                            const Icon = typeConfig.icon;

                            return (
                                <motion.div
                                    key={resource.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-teal/20 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[0]}`}>
                                            <Icon className={`w-5 h-5 ${typeConfig.color.split(' ')[1]}`} />
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest rounded-full border ${typeConfig.color}`}>
                                            {typeConfig.label}
                                        </span>
                                    </div>

                                    <h3 className="text-white font-medium mb-2 line-clamp-1">{resource.title}</h3>
                                    {resource.description && (
                                        <p className="text-white/40 text-sm mb-4 line-clamp-2">{resource.description}</p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                        {resource.url && (
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-teal text-sm hover:underline"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Open
                                            </a>
                                        )}

                                        {isPresident() && (
                                            <button
                                                onClick={() => handleDelete(resource.id)}
                                                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {showModal && (
                    <AddResourceModal
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false);
                            fetchResources();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AddResourceModal({ onClose, onSuccess }) {
    const { profile } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("link");
    const [url, setUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        if (!url.trim()) {
            setError("URL is required");
            return;
        }

        setSaving(true);

        try {
            const { error: insertError } = await supabase
                .from("resources")
                .insert({
                    title: title.trim(),
                    description: description.trim() || null,
                    type,
                    url: url.trim(),
                    created_by: profile.id
                });

            if (insertError) throw insertError;
            onSuccess();
        } catch (err) {
            console.error("Error creating resource:", err);
            setError(err.message || "Failed to create resource");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">Add Resource</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Resource title"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setType(key)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm ${type === key
                                                ? config.color
                                                : "bg-white/5 border-white/10 text-white/50"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            URL *
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "Add Resource"
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
