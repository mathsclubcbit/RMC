/**
 * Upload certificate image buffer to Cloudinary (using existing RMC unsigned upload preset)
 * Provides permanent, high-speed CDN image URLs without OAuth or Drive quota limitations.
 */
export async function uploadCertificateToCloudinary(
  imageBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxvh4vchx';
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'RMCIMAGES';

  if (!cloudName) {
    return null;
  }

  try {
    const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    const cleanPublicId = fileName.replace(/\.[^/.]+$/, '');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          upload_preset: preset,
          folder: 'certificates',
          public_id: cleanPublicId,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Cloudinary] Upload failed:', errText);
      return null;
    }

    const data = await response.json();
    return data.secure_url || null;
  } catch (err: any) {
    console.warn('[Cloudinary] Upload exception:', err.message);
    return null;
  }
}

