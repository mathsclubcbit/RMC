"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Upload,
    ExternalLink,
    GripVertical,
    ChevronUp,
    ChevronDown,
    FolderPlus,
    Link as LinkIcon,
    Loader2
} from "lucide-react";

export default function AdminHubPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal states
    const [editingLink, setEditingLink] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [linkForm, setLinkForm] = useState({ name: "", url: "", image: "" });
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchHub = useCallback(async () => {
        try {
            const res = await fetch("/api/hub");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch {
            setError("Failed to load hub data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHub();
    }, [fetchHub]);

    const saveHub = async (newCategories) => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/hub", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories: newCategories }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setCategories(newCategories);
            setSuccess("Saved!");
            setTimeout(() => setSuccess(""), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Category operations
    const addCategory = () => {
        if (!newCategoryName.trim()) return;
        const newCat = {
            id: `cat-${Date.now()}`,
            name: newCategoryName.trim(),
            links: [],
        };
        saveHub([...categories, newCat]);
        setNewCategoryName("");
    };

    const deleteCategory = (catId) => {
        if (!confirm("Delete this category and all its links?")) return;
        saveHub(categories.filter((c) => c.id !== catId));
    };

    const moveCategoryUp = (index) => {
        if (index === 0) return;
        const newCats = [...categories];
        [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
        saveHub(newCats);
    };

    const moveCategoryDown = (index) => {
        if (index === categories.length - 1) return;
        const newCats = [...categories];
        [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
        saveHub(newCats);
    };

    // Link operations
    const openAddLink = (catId) => {
        setEditingLink({ catId, isNew: true });
        setLinkForm({ name: "", url: "", image: "" });
    };

    const openEditLink = (catId, link) => {
        setEditingLink({ catId, linkId: link.id, isNew: false });
        setLinkForm({ name: link.name, url: link.url, image: link.image || "" });
    };

    const saveLink = () => {
        if (!linkForm.name.trim() || !linkForm.url.trim()) {
            setError("Name and URL are required");
            return;
        }

        const newCategories = categories.map((cat) => {
            if (cat.id !== editingLink.catId) return cat;

            if (editingLink.isNew) {
                return {
                    ...cat,
                    links: [
                        ...cat.links,
                        {
                            id: `link-${Date.now()}`,
                            name: linkForm.name.trim(),
                            url: linkForm.url.trim(),
                            image: linkForm.image,
                        },
                    ],
                };
            } else {
                return {
                    ...cat,
                    links: cat.links.map((l) =>
                        l.id === editingLink.linkId
                            ? { ...l, name: linkForm.name.trim(), url: linkForm.url.trim(), image: linkForm.image }
                            : l
                    ),
                };
            }
        });

        saveHub(newCategories);
        setEditingLink(null);
    };

    const deleteLink = (catId, linkId) => {
        if (!confirm("Delete this link?")) return;
        const newCategories = categories.map((cat) =>
            cat.id === catId ? { ...cat, links: cat.links.filter((l) => l.id !== linkId) } : cat
        );
        saveHub(newCategories);
    };

    const moveLinkUp = (catId, index) => {
        if (index === 0) return;
        const newCategories = categories.map((cat) => {
            if (cat.id !== catId) return cat;
            const newLinks = [...cat.links];
            [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
            return { ...cat, links: newLinks };
        });
        saveHub(newCategories);
    };

    const moveLinkDown = (catId, index, totalLinks) => {
        if (index === totalLinks - 1) return;
        const newCategories = categories.map((cat) => {
            if (cat.id !== catId) return cat;
            const newLinks = [...cat.links];
            [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
            return { ...cat, links: newLinks };
        });
        saveHub(newCategories);
    };

    // Image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError("Image must be under 2MB");
            return;
        }

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/hub/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Upload failed");

            setLinkForm((prev) => ({ ...prev, image: data.url }));
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Hub Manager</h1>
                        <p className="text-sm text-white/50">Manage your LinkTree-style page</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/hub"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
                        >
                            <ExternalLink className="w-4 h-4" /> Preview
                        </Link>
                        {saving && (
                            <div className="flex items-center gap-2 text-teal-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </div>
                        )}
                        {success && <span className="text-teal-400 text-sm">{success}</span>}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center justify-between">
                        {error}
                        <button onClick={() => setError("")} className="p-1 hover:bg-white/10 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Add Category */}
                <div className="mb-8 flex gap-3">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCategory()}
                        placeholder="New category name (e.g., Shruthi 2026)"
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-teal-400/50 outline-none"
                    />
                    <button
                        onClick={addCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-6 py-3 rounded-xl bg-teal-400 text-black font-semibold hover:bg-teal-300 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        <FolderPlus className="w-4 h-4" /> Add Category
                    </button>
                </div>

                {/* Categories */}
                {categories.length === 0 ? (
                    <div className="text-center py-20 text-white/40">
                        <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No categories yet. Create one above!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {categories.map((cat, catIndex) => (
                            <motion.div
                                key={cat.id}
                                layout
                                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
                            >
                                {/* Category Header */}
                                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-white/30" />
                                        <h2 className="text-lg font-semibold">{cat.name}</h2>
                                        <span className="text-xs text-white/40">({cat.links.length} links)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moveCategoryUp(catIndex)}
                                            disabled={catIndex === 0}
                                            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveCategoryDown(catIndex)}
                                            disabled={catIndex === categories.length - 1}
                                            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(cat.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="p-4 space-y-3">
                                    {cat.links.map((link, linkIndex) => (
                                        <div
                                            key={link.id}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition group"
                                        >
                                            {/* Image */}
                                            <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                                {link.image ? (
                                                    <Image
                                                        src={link.image}
                                                        alt={link.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                                        <LinkIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{link.name}</h3>
                                                <p className="text-sm text-white/40 truncate">{link.url}</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => moveLinkUp(cat.id, linkIndex)}
                                                    disabled={linkIndex === 0}
                                                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveLinkDown(cat.id, linkIndex, cat.links.length)}
                                                    disabled={linkIndex === cat.links.length - 1}
                                                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditLink(cat.id, link)}
                                                    className="p-2 rounded-lg hover:bg-white/10"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteLink(cat.id, link.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Link Button */}
                                    <button
                                        onClick={() => openAddLink(cat.id)}
                                        className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 hover:border-teal-400/30 hover:bg-teal-400/5 text-white/50 hover:text-teal-400 transition flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Link
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Link Modal */}
            <AnimatePresence>
                {editingLink && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setEditingLink(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold">
                                    {editingLink.isNew ? "Add New Link" : "Edit Link"}
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Thumbnail Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                            {linkForm.image ? (
                                                <Image
                                                    src={linkForm.image}
                                                    alt="Preview"
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer text-center text-sm">
                                                {uploadingImage ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                                    </span>
                                                ) : (
                                                    "Choose Image"
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">Link Name *</label>
                                    <input
                                        type="text"
                                        value={linkForm.name}
                                        onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                                        placeholder="e.g., Math Heist Registration"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-teal-400/50 outline-none"
                                    />
                                </div>

                                {/* URL */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60">URL *</label>
                                    <input
                                        type="url"
                                        value={linkForm.url}
                                        onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                                        placeholder="https://... or /register/event-id"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-teal-400/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingLink(null)}
                                    className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveLink}
                                    disabled={!linkForm.name.trim() || !linkForm.url.trim()}
                                    className="px-6 py-2.5 rounded-xl bg-teal-400 text-black font-semibold hover:bg-teal-300 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save Link
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
