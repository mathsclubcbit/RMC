"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    Folder,
    FolderPlus,
    Plus,
    Link as LinkIcon,
    FileText,
    FileCode,
    ExternalLink,
    Trash2,
    Loader2,
    X,
    Search,
    ChevronRight,
    ArrowLeft,
    UploadCloud,
    Download
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const TYPE_CONFIG = {
    link: { label: "Link", icon: LinkIcon, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    file: { label: "File", icon: FileText, color: "bg-green-500/20 text-green-400 border-green-500/30" },
    template: { label: "Template", icon: FileCode, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
};

function CreateFolderModal({ parentId, onClose, onSuccess }) {
    const { profile } = useAuth();
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase.from("folders").insert({
                name: name.trim(),
                parent_id: parentId || null,
                created_by: profile.id
            });
            if (error) throw error;
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6"
            >
                <h2 className="text-xl font-bold text-white mb-4">Create New Folder</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        autoFocus
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Folder Name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal/50"
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-white/50 hover:text-white">Cancel</button>
                        <button type="submit" disabled={!name.trim() || saving} className="flex-1 bg-teal text-black font-bold rounded-xl disabled:opacity-50">
                            {saving ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function AddResourceModal({ folderId, onClose, onSuccess }) {
    const { profile } = useAuth();
    const [mode, setMode] = useState("link");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!title.trim()) return setError("Title required");

        setUploading(true);

        try {
            let finalUrl = url;
            let driveFileId = null;
            let resourceType = mode === 'file' ? 'file' : 'link';

            if (mode === "file") {
                if (!file) throw new Error("Please select a file");

                const initRes = await fetch("/api/network/resources/upload/get-url", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type
                    })
                });

                const initData = await initRes.json();
                if (!initRes.ok) throw new Error(initData.error || "Failed to initiate upload");

                const uploadUrl = initData.uploadUrl;

                const uploadRes = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: {
                        'Content-Type': file.type
                    },
                    body: file
                });

                if (!uploadRes.ok) throw new Error("Failed to upload file to Drive");

                const driveData = await uploadRes.json();

                finalUrl = driveData.webViewLink;
                driveFileId = driveData.id;
            } else {
                if (!url.trim()) throw new Error("URL required");
            }

            const { error: dbError } = await supabase.from("resources").insert({
                title: title.trim(),
                description: description.trim(),
                type: resourceType,
                url: finalUrl,
                drive_file_id: driveFileId,
                folder_id: folderId || null,
                created_by: profile.id
            });

            if (dbError) throw dbError;
            onSuccess();

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Add Resource</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-white/50 hover:text-white" /></button>
                </div>

                <div className="p-6">
                    <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setMode("link")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "link" ? "bg-teal text-black shadow-lg" : "text-white/50 hover:text-white"}`}
                        >
                            External Link
                        </button>
                        <button
                            onClick={() => setMode("file")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "file" ? "bg-teal text-black shadow-lg" : "text-white/50 hover:text-white"}`}
                        >
                            Upload File
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

                        <div>
                            <label className="text-xs uppercase text-white/40 font-bold mb-1 block">Title</label>
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Advanced Calculus Paper"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase text-white/40 font-bold mb-1 block">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Optional details..."
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal/50 resize-none"
                            />
                        </div>

                        {mode === "link" ? (
                            <div>
                                <label className="text-xs uppercase text-white/40 font-bold mb-1 block">URL</label>
                                <input
                                    value={url} onChange={e => setUrl(e.target.value)}
                                    placeholder="https://instagram.com/reel/..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-teal/50"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs uppercase text-white/40 font-bold mb-1 block">File (PDF, Doc, Zip)</label>
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-teal/30 transition-colors relative">
                                    <input
                                        type="file"
                                        onChange={e => setFile(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <UploadCloud className="w-8 h-8 text-teal mx-auto mb-2" />
                                    {file ? (
                                        <p className="text-teal font-medium">{file.name}</p>
                                    ) : (
                                        <p className="text-white/40 text-sm">Click or drag file to upload</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full mt-4 bg-teal text-black font-bold py-3 rounded-xl hover:bg-teal/80 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {uploading && <Loader2 className="animate-spin w-4 h-4" />}
                            {uploading ? "Processing..." : "Add Resource"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function ResourcesClient() {
    if (typeof window === 'undefined') return null;
    const { profile, isPresident } = useAuth();

    const [folders, setFolders] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "Home" }]);

    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: "confirm",
        title: "",
        message: "",
        onConfirm: null
    });

    const showAlert = (title, message, type = "success") => {
        setStatusModal({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm, isDangerous = false) => {
        setStatusModal({ isOpen: true, title, message, type: "confirm", onConfirm, isDangerous });
    };

    const supabase = useMemo(() => createClient(), []);

    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            let folderQuery = supabase
                .from("folders")
                .select("*")
                .order("name", { ascending: true });

            let resourceQuery = supabase
                .from("resources")
                .select(`
                    *,
                    creator:created_by (full_name, email)
                `)
                .order("created_at", { ascending: false });

            if (searchQuery.trim()) {
                const term = `%${searchQuery.trim()}%`;
                folderQuery = folderQuery.ilike("name", term);
                resourceQuery = resourceQuery.or(`title.ilike.${term},description.ilike.${term}`);
            } else {
                if (currentFolder?.id) {
                    folderQuery = folderQuery.eq("parent_id", currentFolder.id);
                    resourceQuery = resourceQuery.eq("folder_id", currentFolder.id);
                } else {
                    folderQuery = folderQuery.is("parent_id", null);
                    resourceQuery = resourceQuery.is("folder_id", null);
                }
            }

            const [{ data: folderData }, { data: resourceData }] = await Promise.all([
                folderQuery,
                resourceQuery
            ]);

            setFolders(folderData || []);
            setResources(resourceData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            showAlert("Error", "Failed to load resources.", "error");
        } finally {
            setLoading(false);
        }
    }, [profile?.id, supabase, currentFolder, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleEnterFolder = (folder) => {
        setCurrentFolder(folder);
        setBreadcrumbs(prev => [...prev, folder]);
    };

    const handleNavigateBreadcrumb = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolder(newBreadcrumbs[index].id ? newBreadcrumbs[index] : null);
    };

    const handleNavigateUp = () => {
        if (breadcrumbs.length > 1) {
            handleNavigateBreadcrumb(breadcrumbs.length - 2);
        }
    };

    const handleDeleteResource = async (resourceId) => {
        showConfirm(
            "Delete Resource",
            "Are you sure? This database record will be removed. (Note: Drive files might need manual cleanup if not owned by service account)",
            async () => {
                try {
                    const { error } = await supabase.from("resources").delete().eq("id", resourceId);
                    if (error) throw error;
                    fetchData();
                    showAlert("Deleted", "Resource removed.", "success");
                } catch (err) {
                    console.error(err);
                    showAlert("Error", "Failed to delete.", "error");
                }
            },
            true
        );
    };

    const handleDeleteFolder = async (folderId) => {
        showConfirm(
            "Delete Folder",
            "Warning: This will delete the folder AND ALL its contents (subfolders and resources). This cannot be undone.",
            async () => {
                try {
                    const { error } = await supabase.from("folders").delete().eq("id", folderId);
                    if (error) throw error;
                    fetchData();
                    showAlert("Deleted", "Folder removed.", "success");
                } catch (err) {
                    console.error(err);
                    showAlert("Error", "Failed to delete folder.", "error");
                }
            },
            true
        );
    };

    const filteredContent = useMemo(() => {
        const filteredResources = resources.filter(r => {
            const matchesType = filterType === "all" || r.type === filterType;
            return matchesType;
        });

        return { folders, resources: filteredResources };
    }, [filterType, folders, resources]);

    return (
        <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-14 overflow-y-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                        Resources
                    </h1>
                    <p className="text-white/50">
                        Central knowledge base: Papers, Reels, Docs & Templates
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFolderModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                    >
                        <FolderPlus className="w-5 h-5" />
                        New Folder
                    </button>
                    <button
                        onClick={() => setShowResourceModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Resource
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 text-sm overflow-x-auto pb-2">
                {currentFolder && (
                    <button onClick={handleNavigateUp} className="mr-2 p-1 hover:bg-white/10 rounded-lg">
                        <ArrowLeft className="w-4 h-4 text-white/70" />
                    </button>
                )}
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center whitespace-nowrap">
                        <button
                            onClick={() => handleNavigateBreadcrumb(index)}
                            className={`hover:text-teal transition-colors ${index === breadcrumbs.length - 1 ? "text-white font-bold" : "text-white/50"
                                }`}
                        >
                            {crumb.name}
                        </button>
                        {index < breadcrumbs.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-white/30 mx-1" />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in current folder..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                    />
                </div>
                <div className="flex gap-2 text-sm">
                    {["all", "link", "file"].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-4 py-2 rounded-xl capitalize transition-colors ${filterType === t
                                ? "bg-teal/20 text-teal border border-teal/30"
                                : "bg-white/5 text-white/50 hover:text-white"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-teal animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredContent.folders.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredContent.folders.map(folder => (
                                <motion.div
                                    key={folder.id}
                                    layout
                                    onDoubleClick={() => handleEnterFolder(folder)}
                                    className="group cursor-pointer bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 hover:border-teal/30 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Folder className="w-8 h-8 text-teal/80 fill-teal/20" />
                                        {(isPresident() || folder.created_by === profile?.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-white font-medium truncate" title={folder.name}>
                                        {folder.name}
                                    </h3>
                                    <p className="text-white/30 text-xs mt-1">Folder</p>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {filteredContent.resources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredContent.resources.map((resource, index) => {
                                const typeConfig = TYPE_CONFIG[resource.type] || TYPE_CONFIG.link;
                                const Icon = typeConfig.icon;

                                return (
                                    <motion.div
                                        key={resource.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-teal/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[0]}`}>
                                                <Icon className={`w-5 h-5 ${typeConfig.color.split(' ')[1]}`} />
                                            </div>
                                            <div className="flex gap-2">
                                                {(isPresident() || resource.created_by === profile?.id) && (
                                                    <button
                                                        onClick={() => handleDeleteResource(resource.id)}
                                                        className="p-1.5 text-white/30 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-white font-medium mb-1 line-clamp-1" title={resource.title}>
                                            {resource.title}
                                        </h3>
                                        <p className="text-white/40 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                            {resource.description || "No description provided."}
                                        </p>

                                        <div className="pt-4 border-t border-white/5">
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-teal/20 hover:text-teal rounded-xl text-white/70 text-sm transition-colors"
                                            >
                                                {resource.type === 'file' ? (
                                                    <>
                                                        <Download className="w-4 h-4" /> View / Download
                                                    </>
                                                ) : (
                                                    <>
                                                        <ExternalLink className="w-4 h-4" /> Open Link
                                                    </>
                                                )}
                                            </a>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        filteredContent.folders.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <FolderPlus className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                <h3 className="text-xl text-white/50 mb-2">This folder is empty</h3>
                                <p className="text-white/30">Start by creating a folder or adding a resource.</p>
                            </div>
                        )
                    )}
                </div>
            )}

            <AnimatePresence>
                {showFolderModal && (
                    <CreateFolderModal
                        parentId={currentFolder?.id}
                        onClose={() => setShowFolderModal(false)}
                        onSuccess={() => { setShowFolderModal(false); fetchData(); }}
                    />
                )}
                {showResourceModal && (
                    <AddResourceModal
                        folderId={currentFolder?.id}
                        onClose={() => setShowResourceModal(false)}
                        onSuccess={() => { setShowResourceModal(false); fetchData(); }}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal {...statusModal} onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} />
        </main>
    );
}
