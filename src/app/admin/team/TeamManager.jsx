"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Trash2, Upload, Loader2, Plus, User, Linkedin, Mail } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";

const TEAM_CATEGORIES = [
    "Faculty Advisor",
    "Core Matrix",
    "Technical",
    "Design Team",
    "Visual Media",
    "PR Team",
    "Team" // Generic 'Team' category mentioned in prompt
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
        category: "Core Matrix",
        linkedin: "",
        email: "",
        caption: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.category || !imageFile) {
            showModal("Missing Info", "Name, Category, and Image are required.", "error");
            return;
        }

        setSubmitting(true);

        try {
            // 1. Upload Image to Cloudinary
            const publicUrl = await uploadToCloudinary(imageFile);

            // 2. Insert Record
            const { error: dbError } = await supabase
                .from('rmc_council')
                .insert({
                    name: formData.name,
                    position: formData.category === 'Faculty Advisor' ? null : formData.position,
                    category: formData.category,
                    linkedin_url: formData.linkedin,
                    email: formData.email,
                    caption: formData.caption,
                    image_url: publicUrl,
                    priority_order: 0 // Default priority
                });

            if (dbError) throw dbError;

            showModal("Success", "Team member added successfully!", "success", () => {
                setFormData({ name: "", position: "", category: "Core Matrix", linkedin: "", email: "", caption: "" });
                setImageFile(null);
                setImagePreview(null);
                setActiveTab("list");
                fetchMembers();
                closeModal();
            });

        } catch (error) {
            console.error("Error adding member:", error);
            showModal("Error", "Failed to add member: " + error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, imageUrl) => {
        showModal("Delete Member?", "Are you sure? This cannot be undone.", "confirm", async () => {
            // Try to delete image if possible (optional but good for cleanup)
            if (imageUrl) {
                const path = imageUrl.split('/gallery/')[1];
                if (path) await supabase.storage.from('gallery').remove([path]);
            }

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
                    className={cn("px-4 py-2 rounded-lg transition-all", activeTab === "list" ? "bg-teal-500/20 text-teal-300" : "text-white/60 hover:bg-white/5")}
                >
                    Manage Team
                </button>
                <button
                    onClick={() => setActiveTab("add")}
                    className={cn("px-4 py-2 rounded-lg transition-all flex items-center gap-2", activeTab === "add" ? "bg-teal-500/20 text-teal-300" : "text-white/60 hover:bg-white/5")}
                >
                    <Plus className="w-4 h-4" /> Add Member
                </button>
            </div>

            {activeTab === "add" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-3xl">
                    <h2 className="text-xl font-bold text-white mb-6">Add New Team Member</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Image Upload */}
                        <div className="flex justify-center">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative transition-all",
                                    isDragActive ? "border-teal-500 bg-teal-500/10" : "border-white/20 hover:border-white/40 bg-black/20"
                                )}
                            >
                                <input {...getInputProps()} />
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <Plus className="w-6 h-6 text-white/40 mx-auto mb-1" />
                                        <span className="text-[10px] text-white/40">Upload Photo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Full Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                                >
                                    {TEAM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Position (Hidden for Faculty Advisor) */}
                        {formData.category !== "Faculty Advisor" && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Position / Role</label>
                                <input
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none"
                                    placeholder="e.g. Technical Lead"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">LinkedIn URL</label>
                                <input
                                    value={formData.linkedin}
                                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email Address</label>
                                <input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Caption / Quote</label>
                            <textarea
                                value={formData.caption}
                                onChange={e => setFormData({ ...formData, caption: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none h-24"
                                placeholder="A short bio or quote..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add to Team
                        </button>
                    </form>
                </div>
            )}

            {activeTab === "list" && (
                <div className="space-y-6">
                    {loading && <div className="text-white/50">Loading team...</div>}
                    {!loading && members.length === 0 && <div className="text-white/50">No team members found.</div>}

                    {/* Group by Category for Admin View - Simplified list */}
                    <div className="grid gap-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl group hover:border-teal/30 transition-colors">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black/50">
                                    {member.image_url ? (
                                        <Image src={member.image_url} alt={member.name} fill className="object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 m-3 text-white/20" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold truncate">{member.name}</h4>
                                    <p className="text-white/40 text-xs truncate">
                                        <span className="text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded mr-2">{member.category}</span>
                                        {member.position && <span>{member.position}</span>}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(member.id, member.image_url)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
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
