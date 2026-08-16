export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES = 4;
export const MAX_FILES = 3;

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
export const FILE_ACCEPT =
    ".pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.json,.mp4,.webm,.mp3,.wav";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function formatFileSize(bytes: number): string {
    if (bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateAttachment(file: File, kind: "image" | "file"): string | null {
    if (file.size > MAX_ATTACHMENT_SIZE) {
        return `"${file.name}" exceeds the 5 MB limit (${formatFileSize(file.size)}).`;
    }

    if (kind === "image") {
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            return `"${file.name}" is not a supported image. Use JPG, PNG, GIF, or WEBP.`;
        }
    } else if (file.type.startsWith("image/")) {
        return `"${file.name}" is an image — use the image button instead.`;
    }

    return null;
}

export function isBlobUrl(url: string): boolean {
    return url.startsWith("blob:");
}
