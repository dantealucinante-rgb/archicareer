import imageCompression from "browser-image-compression";

type ImageUploadKind = "portfolio" | "post" | "avatar";
export const MAX_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;

const compressionOptions: Record<ImageUploadKind, Parameters<typeof imageCompression>[1]> = {
    portfolio: {
        maxSizeMB: 1.25,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.82,
    },
    post: {
        maxSizeMB: 1.25,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.82,
    },
    avatar: {
        maxSizeMB: 0.75,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.84,
    },
};

function webpName(name: string) {
    const baseName = name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "image";
    return `${baseName}.webp`;
}

export async function compressImageForUpload(file: File, kind: ImageUploadKind) {
    if (!file.type.startsWith("image/")) return file;

    try {
        const compressed = await imageCompression(file, compressionOptions[kind]);
        const result = new File([compressed], webpName(file.name), { type: "image/webp", lastModified: file.lastModified });
        if (result.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("Image is too large, please try a smaller file");
        return result;
    } catch {
        // A browser codec or worker can fail for an unusual image. The server
        // still validates the original file, so preserve the upload path only
        // when it remains within the hard storage cap.
        if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("Image is too large, please try a smaller file");
        return file;
    }
}
