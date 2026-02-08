"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Trash2, Upload, Loader2, Plus, Image as ImageIcon, CheckCircle, AlertTriangle, FolderX } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { uploadToCloudinary } from "@/lib/cloudinary";

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

    const fetchAlbums = useCallback(async () => {
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
    }, [supabase, selectedAlbumId]);

    const fetchAlbumImages = useCallback(async (eventId) => {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching images:", error);
        else setUploadedImages(data || []);
    }, [supabase]);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    useEffect(() => {
        if (selectedAlbumId) {
            fetchAlbumImages(selectedAlbumId);
        } else {
            setUploadedImages([]);
        }
    }, [selectedAlbumId, fetchAlbumImages]);

    const showModal = (title, message, type = "info", onConfirm = null) => {
        setModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
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
            // 1. Upload Cover Image to Cloudinary
            const publicUrl = await uploadToCloudinary(coverImage);

            // 2. Insert Event Record via API (uses service role)
            const response = await fetch('/api/gallery/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newAlbum.title,
                    description: newAlbum.description,
                    category: newAlbum.category,
                    event_date: newAlbum.date || new Date().toISOString(),
                    cover_image: publicUrl
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to create album');
            const data = result.data;

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
        let successCount = 0;
        let failCount = 0;

        try {
            console.log(`Starting upload of ${files.length} photos to album ${selectedAlbumId}`);

            for (const file of files) {
                try {
                    // Upload to Cloudinary
                    const publicUrl = await uploadToCloudinary(file);
                    console.log("Uploaded to Cloudinary:", publicUrl);

                    // Get Dimensions
                    const { width, height } = await getImageDimensions(file);

                    // Insert to DB via API (uses service role)
                    const response = await fetch('/api/gallery/images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: publicUrl,
                            width,
                            height,
                            event_id: selectedAlbumId
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.error("Database insert error:", errData.error);
                        failCount++;
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    console.error("Individual file upload error:", err);
                    failCount++;
                }
            }

            setFiles([]);
            fetchAlbumImages(selectedAlbumId);

            if (failCount === 0) {
                showModal("Upload Complete", `Successfully uploaded ${successCount} photos.`, "success");
            } else {
                showModal("Upload Finished", `Uploaded ${successCount} photos. ${failCount} failed. Check console for details.`, successCount > 0 ? "info" : "error");
            }

        } catch (error) {
            console.error("Batch upload error:", error);
            showModal("Upload Error", "There was an error processing the upload batch.", "error");
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
                try {
                    // Delete from DB via API
                    const response = await fetch(`/api/gallery/images?id=${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        console.error("Error deleting image from DB:", errData.error);
                        showModal("Error", "Failed to delete image entry from database.", "error");
                    } else {
                        // If using Supabase Storage (legacy), try to remove, but don't fail if it's not there
                        if (url.includes('storage.googleapis.com') || url.includes('/storage/v1/object/public/')) {
                            const path = url.split('/gallery/')[1];
                            if (path) {
                                await supabase.storage.from('gallery').remove([path]);
                            }
                        }

                        setUploadedImages(prev => prev.filter(img => img.id !== id));
                        closeModal();
                    }
                } catch (err) {
                    console.error("Delete operation failed:", err);
                    showModal("Error", "An unexpected error occurred while deleting.", "error");
                }
            }
        );
    };

    const handleDeleteAlbum = async () => {
        if (!selectedAlbumId) return;

        const selectedAlbum = albums.find(a => a.id === selectedAlbumId);
        const albumTitle = selectedAlbum?.title || "this album";
        const imageCount = uploadedImages.length;

        showModal(
            "Delete Album?",
            `Are you sure you want to delete "${albumTitle}"?\n\n${imageCount > 0 ? `This will also permanently delete ${imageCount} image${imageCount !== 1 ? 's' : ''}.` : 'This album has no images.'}\n\nThis action cannot be undone.`,
            "confirm",
            async () => {
                try {
                    // Delete album and all its images via API (handles both in one call)
                    const response = await fetch(`/api/gallery/events?id=${selectedAlbumId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || "Failed to delete album");
                    }

                    // 3. Clear state and refresh
                    setSelectedAlbumId("");
                    setUploadedImages([]);
                    await fetchAlbums();

                    // 4. Close confirmation modal first, then show success after a tick
                    closeModal();
                    setTimeout(() => {
                        showModal("Success!", `Album "${albumTitle}" has been deleted.`, "success");
                    }, 100);

                } catch (error) {
                    console.error("Error deleting album:", error);
                    showModal("Error", error.message || "Failed to delete album.", "error");
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
                    className={cn(
                        "px-4 py-2 rounded-xl transition-all font-medium text-sm",
                        activeTab === "upload"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                >
                    Manage & Upload
                </button>
                <button
                    onClick={() => setActiveTab("create")}
                    className={cn(
                        "px-4 py-2 rounded-xl transition-all font-medium text-sm flex items-center gap-2",
                        activeTab === "create"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <Plus className="w-4 h-4" /> Create New Album
                </button>
            </div>

            {/* CREATE ALBUM TAB */}
            {activeTab === "create" && (
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Create New Gallery Album</h2>
                    <form onSubmit={handleCreateAlbum} className="space-y-5">
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Album Title</label>
                            <input
                                value={newAlbum.title}
                                onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500/50 outline-none transition-all focus:bg-indigo-500/5"
                                placeholder="e.g. Math Olympiad 2025"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Category</label>
                                <select
                                    value={newAlbum.category}
                                    onChange={e => setNewAlbum({ ...newAlbum, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500/50 transition-all focus:bg-indigo-500/5"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Event Date</label>
                                <input
                                    type="date"
                                    value={newAlbum.date}
                                    onChange={e => setNewAlbum({ ...newAlbum, date: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500/50 transition-all focus:bg-indigo-500/5 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Description</label>
                            <textarea
                                value={newAlbum.description}
                                onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500/50 outline-none h-24 transition-all focus:bg-indigo-500/5 resize-none"
                                placeholder="Brief description of the event..."
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Cover Image</label>
                            <div className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 hover:border-white/30 transition-all relative group">
                                <input
                                    type="file"
                                    onChange={e => setCoverImage(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    accept="image/*"
                                />
                                <div className="pointer-events-none">
                                    {coverImage ? (
                                        <div className="flex items-center justify-center gap-2 text-indigo-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">{coverImage.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                                            Click to select cover image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={creatingAlbum}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                        >
                            {creatingAlbum ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</span> : "Create Album"}
                        </button>
                    </form>
                </div>
            )}

            {/* UPLOAD & MANAGE TAB */}
            {activeTab === "upload" && (
                <div className="space-y-8">
                    {/* Album Selector */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <label className="block text-[11px] uppercase tracking-widest text-white/50 mb-2 font-mono">Select Album to Manage</label>
                        {loading ? <div className="text-white/50 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading albums...</div> : (
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedAlbumId}
                                        onChange={e => setSelectedAlbumId(e.target.value)}
                                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl p-3 px-4 text-white outline-none focus:border-indigo-500/50 transition-all"
                                    >
                                        <option value="">-- Select an Album --</option>
                                        {albums.map(album => (
                                            <option key={album.id} value={album.id}>{album.title} ({new Date(album.created_at).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        ▼
                                    </div>
                                </div>
                                <button
                                    onClick={fetchAlbums}
                                    title="Refresh albums"
                                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-all"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                {selectedAlbumId && (
                                    <button
                                        onClick={handleDeleteAlbum}
                                        title="Delete album"
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                                    >
                                        <FolderX className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        {albums.length === 0 && !loading && (
                            <div className="mt-3 text-amber-400 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> No albums found. Create one first!
                            </div>
                        )}
                    </div>

                    {selectedAlbumId && (
                        <>
                            {/* Upload Area */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Add Photos</h3>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group",
                                        isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-indigo-500/50 bg-black/20 hover:bg-black/30"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                                        <Upload className={cn("w-8 h-8 transition-colors", isDragActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/60")} />
                                    </div>
                                    <p className="text-white/80 font-medium">Drag & drop photos here, or click to select</p>
                                    <p className="text-white/40 text-xs mt-2 font-mono">Supports high-res JPG, PNG, WEBP</p>
                                </div>

                                {/* Preview Queue */}
                                {files.length > 0 && (
                                    <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex flex-wrap gap-3 mb-6">
                                            {files.map((file, i) => (
                                                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-white/10">
                                                    <Image src={file.preview} alt="preview" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleUploadPhotos}
                                            disabled={uploading}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload {files.length} Images
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Existing Images Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Gallery Images <span className="text-white/40 text-lg font-normal ml-2">({uploadedImages.length})</span></h3>
                                </div>

                                {uploadedImages.length === 0 ? (
                                    <div className="text-center py-12 rounded-3xl border border-dashed border-white/10">
                                        <p className="text-white/30 italic">No images in this album yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {uploadedImages.map((img) => (
                                            <div key={img.id} className="relative group aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-sm">
                                                <Image
                                                    src={img.url}
                                                    alt="uploaded"
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <button
                                                        onClick={() => handleDeleteImage(img.id, img.url)}
                                                        className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 hover:border-red-500/50"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[10px] text-white/70 text-center truncate font-mono">
                                                    {img.width} × {img.height}
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
