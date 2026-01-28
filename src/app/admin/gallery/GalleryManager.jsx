"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const CATEGORIES = ["Olympiads", "Workshops", "Fests", "Fun Events"];

export default function GalleryManager() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [uploadCategory, setUploadCategory] = useState("Olympiads");
    const supabase = createClient();

    const fetchImages = useCallback(async () => {
        setLoading(true);
        let query = supabase.from("gallery_images").select("*").order("created_at", { ascending: false });

        if (selectedCategory !== "All") {
            query = query.eq("category", selectedCategory);
        }

        const { data, error } = await query;
        if (error) console.error("Error fetching images:", error);
        else setImages(data || []);
        setLoading(false);
    }, [supabase, selectedCategory]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const onDrop = useCallback(async (acceptedFiles) => {
        setUploading(true);
        let successCount = 0;

        for (const file of acceptedFiles) {
            try {
                // 1. Get Image Dimensions
                const dimensions = await new Promise((resolve) => {
                    const img = new window.Image();
                    img.onload = () => resolve({ width: img.width, height: img.height });
                    img.src = URL.createObjectURL(file);
                });

                // 2. Upload to Storage
                const fileExt = file.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("gallery")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data: publicUrlData } = supabase.storage
                    .from("gallery")
                    .getPublicUrl(filePath);

                // 4. Insert to DB
                const { error: dbError } = await supabase
                    .from("gallery_images")
                    .insert({
                        url: publicUrlData.publicUrl,
                        caption: file.name,
                        category: uploadCategory,
                        width: dimensions.width,
                        height: dimensions.height,
                    });

                if (dbError) throw dbError;
                successCount++;
            } catch (error) {
                console.error("Upload failed for file:", file.name, error);
            }
        }

        setUploading(false);
        if (successCount > 0) fetchImages();
    }, [supabase, uploadCategory, fetchImages]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true
    });

    const handleDelete = async (id, url) => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        // Extract filename from URL for storage deletion
        // URL format: .../gallery/fileName
        const fileName = url.split("/").pop();

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage.from("gallery").remove([fileName]);
        if (storageError) console.error("Storage delete error:", storageError);

        // 2. Delete from DB
        const { error: dbError } = await supabase.from("gallery_images").delete().eq("id", id);
        if (dbError) {
            alert("Failed to delete database record");
            console.error("DB delete error:", dbError);
        } else {
            setImages(images.filter((img) => img.id !== id));
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Upload Photos</h2>

                <div className="mb-4">
                    <label className="text-sm text-white/70 block mb-2">Category for these uploads:</label>
                    <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white bg-black focus:outline-none focus:border-teal-500"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? "border-teal-500 bg-teal-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                        }`}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                            <p className="text-white/60">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-white/40" />
                            <p className="text-white/60">
                                {isDragActive ? "Drop the files here..." : "Drag 'n' drop some files here, or click to select files"}
                            </p>
                            <p className="text-xs text-white/30">Supports multiple files</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Management */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Manage Gallery</h2>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white bg-black focus:outline-none focus:border-teal-500 text-sm"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="text-center py-20 text-white/30 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No images found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((img) => (
                            <div key={img.id} className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden border border-white/10">
                                <Image
                                    src={img.url}
                                    alt={img.caption || "Gallery Image"}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-xs text-white/80 font-mono mb-2 truncate">{img.category}</p>
                                    <button
                                        onClick={() => handleDelete(img.id, img.url)}
                                        className="w-full flex items-center justify-center gap-2 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs font-bold transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
