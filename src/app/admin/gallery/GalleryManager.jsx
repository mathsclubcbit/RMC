"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Trash2, Upload, Loader2, Plus, Image as ImageIcon, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const CATEGORIES = ["Olympiads", "Workshops", "Fests", "Fun Events", "General"];

export default function GalleryManager() {
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Album State
    const [albums, setAlbums] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState("");
    const [newAlbum, setNewAlbum] = useState({ title: "", description: "", category: "General", date: "" });
    const [coverImage, setCoverImage] = useState(null);
    const [creatingAlbum, setCreatingAlbum] = useState(false);

    // Photos State
    const [files, setFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [activeTab, setActiveTab] = useState("upload"); // 'create' or 'upload' or 'manage'

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const supabase = createClient();

    useEffect(() => {
        fetchAlbums();
    }, []);

    useEffect(() => {
        if (selectedAlbumId) {
            fetchAlbumImages(selectedAlbumId);
        } else {
            setUploadedImages([]);
        }
    }, [selectedAlbumId]);

    const showModal = (title, message, type = "info", onConfirm = null) => {
        setModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchAlbums = async () => {
        const { data, error } = await supabase
            .from('gallery_events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching albums:", error);
        else {
            setAlbums(data || []);
            if (data?.length > 0 && !selectedAlbumId) {
                setSelectedAlbumId(data[0].id);
            }
        }
        setLoading(false);
    };

    const fetchAlbumImages = async (eventId) => {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching images:", error);
        else setUploadedImages(data || []);
    };

    // --- ALBUM CREATION ---
    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbum.title || !coverImage) {
            showModal("Missing Information", "Please provide both an Album Title and a Cover Image.", "error");
            return;
        }

        setCreatingAlbum(true);

        try {
            // 1. Upload Cover Image
            const fileExt = coverImage.name.split('.').pop();
            const fileName = `covers/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(fileName, coverImage);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('gallery')
                .getPublicUrl(fileName);

            // 2. Insert Event Record
            const { data, error: dbError } = await supabase
                .from('gallery_events')
                .insert({
                    title: newAlbum.title,
                    description: newAlbum.description,
                    category: newAlbum.category,
                    event_date: newAlbum.date || new Date().toISOString(),
                    cover_image: publicUrl
                })
                .select()
                .single();

            if (dbError) throw dbError;

            showModal("Success!", "Album Created Successfully.", "success", () => {
                setNewAlbum({ title: "", description: "", category: "General", date: "" });
                setCoverImage(null);
                setActiveTab("upload");
                fetchAlbums();
                setSelectedAlbumId(data.id); // Select the new album
                closeModal();
            });

        } catch (error) {
            console.error("Error creating album:", error);
            showModal("Error", "Failed to create album: " + error.message, "error");
        } finally {
            setCreatingAlbum(false);
        }
    };

    // --- PHOTO UPLOAD ---
    const onDrop = useCallback((acceptedFiles) => {
        setFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }))]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

    const getImageDimensions = (file) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(file);
        });
    };

    const handleUploadPhotos = async () => {
        if (files.length === 0) return;
        if (!selectedAlbumId) {
            showModal("Select Album", "Please select an album first!", "error");
            return;
        }

        setUploading(true);

        try {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${selectedAlbumId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                // Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(fileName);

                // Get Dimensions
                const { width, height } = await getImageDimensions(file);

                // Insert to DB
                return supabase.from('gallery_images').insert({
                    url: publicUrl,
                    width,
                    height,
                    event_id: selectedAlbumId
                });
            });

            await Promise.all(uploadPromises);

            setFiles([]);
            fetchAlbumImages(selectedAlbumId);
            showModal("Upload Complete", "All photos have been successfully uploaded.", "success");

        } catch (error) {
            console.error("Upload error:", error);
            showModal("Upload Error", "There was an error uploading some images.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (id, url) => {
        showModal(
            "Delete Image?",
            "Are you sure you want to delete this image? This action cannot be undone.",
            "confirm",
            async () => {
                // Extract path from URL for storage deletion
                const path = url.split('/gallery/')[1];

                // Delete from Storage
                if (path) {
                    await supabase.storage.from('gallery').remove([path]);
                }

                // Delete from DB
                const { error } = await supabase.from('gallery_images').delete().eq('id', id);

                if (error) {
                    showModal("Error", "Failed to delete image.", "error");
                } else {
                    setUploadedImages(prev => prev.filter(img => img.id !== id));
                    closeModal();
                }
            }
        );
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

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab("upload")}
                    className={cn("px-4 py-2 rounded-lg transition-all", activeTab === "upload" ? "bg-teal-500/20 text-teal-300" : "text-white/60 hover:bg-white/5")}
                >
                    Upload Photos
                </button>
                <button
                    onClick={() => setActiveTab("create")}
                    className={cn("px-4 py-2 rounded-lg transition-all flex items-center gap-2", activeTab === "create" ? "bg-teal-500/20 text-teal-300" : "text-white/60 hover:bg-white/5")}
                >
                    <Plus className="w-4 h-4" /> Create New Album
                </button>
            </div>

            {/* CREATE ALBUM TAB */}
            {activeTab === "create" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Create New Gallery Album</h2>
                    <form onSubmit={handleCreateAlbum} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Album Title</label>
                            <input
                                value={newAlbum.title}
                                onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none"
                                placeholder="e.g. Math Olympiad 2025"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Category</label>
                                <select
                                    value={newAlbum.category}
                                    onChange={e => setNewAlbum({ ...newAlbum, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Event Date</label>
                                <input
                                    type="date"
                                    value={newAlbum.date}
                                    onChange={e => setNewAlbum({ ...newAlbum, date: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Description</label>
                            <textarea
                                value={newAlbum.description}
                                onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-teal-500/50 outline-none h-24"
                                placeholder="Brief description of the event..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Cover Image</label>
                            <div className="border border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:bg-white/5 transition-colors relative">
                                <input
                                    type="file"
                                    onChange={e => setCoverImage(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                                {coverImage ? (
                                    <span className="text-teal-400">{coverImage.name}</span>
                                ) : (
                                    <span className="text-white/40 text-sm">Click to select cover image</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={creatingAlbum}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4"
                        >
                            {creatingAlbum ? "Creating..." : "Create Album"}
                        </button>
                    </form>
                </div>
            )}

            {/* UPLOAD & MANAGE TAB */}
            {activeTab === "upload" && (
                <div className="space-y-8">
                    {/* Album Selector */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Select Album to Manage</label>
                        {loading ? <div className="text-white/50">Loading albums...</div> : (
                            <div className="flex gap-4">
                                <select
                                    value={selectedAlbumId}
                                    onChange={e => setSelectedAlbumId(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                                >
                                    <option value="">-- Select an Album --</option>
                                    {albums.map(album => (
                                        <option key={album.id} value={album.id}>{album.title} ({new Date(album.created_at).toLocaleDateString()})</option>
                                    ))}
                                </select>
                                <button onClick={fetchAlbums} className="p-3 bg-white/10 rounded-lg hover:bg-white/20 text-white"><ImageIcon className="w-5 h-5" /></button>
                            </div>
                        )}
                        {albums.length === 0 && !loading && (
                            <div className="mt-2 text-amber-400 text-sm">No albums found. Create one first!</div>
                        )}
                    </div>

                    {selectedAlbumId && (
                        <>
                            {/* Upload Area */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Add Photos</h3>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300",
                                        isDragActive ? "border-teal-500 bg-teal-500/10" : "border-white/10 hover:border-white/30 bg-black/20"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-10 h-10 text-white/30 mx-auto mb-4" />
                                    <p className="text-white/60 font-mono text-sm">Drag & drop photos here, or click to select</p>
                                    <p className="text-white/30 text-xs mt-2">Supports JPG, PNG, WEBP</p>
                                </div>

                                {/* Preview Queue */}
                                {files.length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {files.map((file, i) => (
                                                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden group">
                                                    <Image src={file.preview} alt="preview" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleUploadPhotos}
                                            disabled={uploading}
                                            className="bg-teal-500 hover:bg-teal-400 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload {files.length} Images
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Existing Images Grid */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4">Gallery Images ({uploadedImages.length})</h3>
                                {uploadedImages.length === 0 ? (
                                    <p className="text-white/30 italic">No images in this album yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {uploadedImages.map((img) => (
                                            <div key={img.id} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                                <Image
                                                    src={img.url}
                                                    alt="uploaded"
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleDeleteImage(img.id, img.url)}
                                                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-[10px] text-white/70 text-center truncate">
                                                    {img.width}x{img.height}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
