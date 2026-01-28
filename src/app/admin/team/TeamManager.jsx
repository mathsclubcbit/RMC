"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Trash2, Upload, Loader2, Plus, User, Linkedin, Mail, BadgeCheck, AlertTriangle, Pencil, X } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";

const TEAM_CATEGORIES = [
    "Faculty Advisor",
    "Core Committee",
    "Technical",
    "Design Team",
    "Visual Media",
    "PR Team",
    "Team"
];

export default function TeamManager() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [members, setMembers] = useState([]);
    const [activeTab, setActiveTab] = useState("list"); // 'list' or 'add'

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        position: "",
        category: "Core Committee",
        linkedin: "",
        email: "",
        caption: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Edit State
    const [editingId, setEditingId] = useState(null);

    // Modal State
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });

    const supabase = createClient();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        const { data, error } = await supabase
            .from('rmc_council')
            .select('*')
            .order('priority_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching members:", error);
        else setMembers(data || []);
        setLoading(false);
    };

    const showModal = (title, message, type = "info", onConfirm = null) => {
        setModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    // Image Dropzone
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            position: member.position || "",
            category: member.category,
            linkedin: member.linkedin_url || "",
            email: member.email || "",
            caption: member.caption || ""
        });
        setImagePreview(member.image_url);
        setImageFile(null); // Reset file input, we rely on preview if no new file
        setEditingId(member.id);
        setActiveTab("add");

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setFormData({ name: "", position: "", category: "Core Committee", linkedin: "", email: "", caption: "" });
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
        setActiveTab("list");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Image is required for NEW members, optional for updates (keep existing)
        if (!formData.name || !formData.category) {
            showModal("Missing Info", "Name and Category are required.", "error");
            return;
        }
        if (!editingId && !imageFile) {
            showModal("Missing Image", "Please upload a profile photo.", "error");
            return;
        }

        setSubmitting(true);

        try {
            let publicUrl = null;

            // 1. Upload Image to Cloudinary IF changed
            if (imageFile) {
                publicUrl = await uploadToCloudinary(imageFile);
            }

            const payload = {
                name: formData.name,
                position: formData.category === 'Faculty Advisor' ? null : formData.position,
                category: formData.category,
                linkedin_url: formData.linkedin,
                email: formData.email,
                caption: formData.caption,
            };

            // Only update image_url if a new one was uploaded
            if (publicUrl) {
                payload.image_url = publicUrl;
            }

            if (editingId) {
                // UPDATE Existing
                const { error: dbError } = await supabase
                    .from('rmc_council')
                    .update(payload)
                    .eq('id', editingId);

                if (dbError) throw dbError;

                showModal("Updated", "Member details updated successfully.", "success", () => {
                    cancelEdit(); // Resets form and switches tab
                    fetchMembers();
                    closeModal();
                });

            } else {
                // INSERT New
                // Ensure image_url is set for new records (it was validated above, but strictly)
                if (!payload.image_url && publicUrl) payload.image_url = publicUrl;
                // If logic somehow failed (shouldn't due to validation), publicUrl is required
                if (!payload.image_url) throw new Error("Image upload failed");

                const { error: dbError } = await supabase
                    .from('rmc_council')
                    .insert({
                        ...payload,
                        priority_order: 0, // Default priority
                        image_url: publicUrl // Explicitly set
                    });

                if (dbError) throw dbError;

                showModal("Success", "Team member added successfully!", "success", () => {
                    cancelEdit();
                    fetchMembers();
                    closeModal();
                });
            }

        } catch (error) {
            console.error("Error saving member:", error);
            showModal("Error", "Failed to save: " + error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, imageUrl) => {
        showModal("Delete Member?", "Are you sure? This cannot be undone.", "confirm", async () => {
            // Try to delete image logic removed/simplified as per user request to just "Delete"
            // Cloudinary images usually require API key on backend to delete, which we might not have exposed here.
            // We just delete the record.

            const { error } = await supabase.from('rmc_council').delete().eq('id', id);
            if (error) {
                showModal("Error", "Failed to delete member.", "error");
            } else {
                setMembers(prev => prev.filter(m => m.id !== id));
                closeModal();
            }
        });
    };

    return (
        <div className="space-y-8">
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText={modal.type === 'confirm' ? 'Delete' : 'OK'}
                isDangerous={modal.type === 'confirm'}
            />

            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab("list")}
                    className={cn(
                        "px-4 py-2 rounded-xl transition-all font-medium text-sm",
                        activeTab === "list"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                >
                    Manage Team
                </button>
                <button
                    onClick={() => {
                        cancelEdit(); // Reset edit state if clicking "Add Member" manually
                        setActiveTab("add");
                    }}
                    className={cn(
                        "px-4 py-2 rounded-xl transition-all font-medium text-sm flex items-center gap-2",
                        activeTab === "add"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <Plus className="w-4 h-4" /> {editingId ? "Edit Member" : "Add Member"}
                </button>
            </div>

            {activeTab === "add" && (
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 max-w-3xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {editingId ? "Edit Team Member" : "Add New Team Member"}
                        </h2>
                        {editingId && (
                            <button onClick={cancelEdit} className="text-xs text-white/40 hover:text-white hover:underline">
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Image Upload */}
                        <div className="flex justify-center">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "w-36 h-36 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative transition-all group",
                                    isDragActive ? "border-indigo-500 bg-indigo-500/10 scale-105" : "border-white/20 hover:border-indigo-500/50 bg-black/40"
                                )}
                            >
                                <input {...getInputProps()} />
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center p-2 group-hover:scale-110 transition-transform">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                            <Upload className="w-5 h-5 text-white/50" />
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-white/40">Upload Photo</span>
                                    </div>
                                )}
                                {imagePreview && (
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-center text-[9px] uppercase tracking-widest text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Change
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Full Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500/50 outline-none transition-all focus:bg-indigo-500/5"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Category</label>
                                <div className="relative">
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl p-3 px-4 text-white outline-none focus:border-indigo-500/50 transition-all focus:bg-indigo-500/5"
                                    >
                                        {TEAM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Position (Hidden for Faculty Advisor) */}
                        <div className={cn("transition-all duration-300", formData.category === "Faculty Advisor" ? "opacity-30 pointer-events-none" : "opacity-100")}>
                            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Position / Role</label>
                            <input
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                disabled={formData.category === "Faculty Advisor"}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500/50 outline-none transition-all focus:bg-indigo-500/5 disabled:opacity-50"
                                placeholder={formData.category === "Faculty Advisor" ? "Faculty Advisor (Automatic)" : "e.g. Technical Lead"}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">LinkedIn URL</label>
                                <div className="relative">
                                    <input
                                        value={formData.linkedin}
                                        onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-indigo-500/50 outline-none transition-all focus:bg-indigo-500/5"
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Email Address</label>
                                <div className="relative">
                                    <input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-indigo-500/50 outline-none transition-all focus:bg-indigo-500/5"
                                        placeholder="email@example.com"
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Caption / Quote</label>
                            <textarea
                                value={formData.caption}
                                onChange={e => setFormData({ ...formData, caption: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500/50 outline-none h-24 transition-all focus:bg-indigo-500/5 resize-none"
                                placeholder="A short bio or quote..."
                            />
                        </div>

                        <div className="flex gap-4">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-6 py-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <BadgeCheck className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {editingId ? "Update Member" : "Add to Team"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === "list" && (
                <div className="space-y-6">
                    {loading && <div className="text-white/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading team...</div>}
                    {!loading && members.length === 0 && <div className="flex items-center gap-2 text-amber-400/80"><AlertTriangle className="w-4 h-4" /> No team members found.</div>}

                    {/* Team List */}
                    <div className="grid gap-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-5 bg-white/[0.03] border border-white/10 p-4 pr-6 rounded-2xl group hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all">
                                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black/50 border border-white/10">
                                    {member.image_url ? (
                                        <Image src={member.image_url} alt={member.name} fill className="object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 m-4 text-white/20" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold truncate text-lg">{member.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                            {member.category}
                                        </span>
                                        {member.position && (
                                            <span className="text-white/40 text-sm truncate border-l border-white/10 pl-2">
                                                {member.position}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-colors border border-indigo-500/10 hover:border-indigo-500/20"
                                        title="Edit Member"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id, member.image_url)}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors border border-red-500/10 hover:border-red-500/20"
                                        title="Delete Member"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
