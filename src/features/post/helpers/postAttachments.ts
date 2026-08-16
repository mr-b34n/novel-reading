
import type { PostData, PostFileAttachment } from "../types";

import { isBlobUrl } from "./postAttachmentLimits";

export interface EditableAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
    kind: "image" | "file";
}

export function postToEditableAttachments(post: Pick<PostData, "images" | "files">): EditableAttachment[] {
    const images: EditableAttachment[] = (post.images ?? []).map((url, index) => ({
        id: `existing-image-${index}`,
        name: `image-${index + 1}.jpg`,
        url,
        size: 0,
        mimeType: "image/jpeg",
        kind: "image",
    }));

    const files: EditableAttachment[] = (post.files ?? []).map((file) => ({
        ...file,
        kind: "file",
    }));

    return [...images, ...files];
}

export function attachmentsToPostData(attachments: EditableAttachment[]): {
    images: string[];
    files: PostFileAttachment[];
} {
    return {
        images: attachments.filter((a) => a.kind === "image").map((a) => a.url),
        files: attachments
            .filter((a) => a.kind === "file")
            .map(({ id, name, url, size, mimeType }) => ({ id, name, url, size, mimeType })),
    };
}

export function createAttachmentFromFile(file: File, kind: "image" | "file"): EditableAttachment {
    return {
        id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        kind,
    };
}

export function revokeAttachmentUrl(url: string) {
    if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
}

export function revokeAttachmentUrls(attachments: EditableAttachment[]) {
    attachments.forEach((a) => revokeAttachmentUrl(a.url));
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read attachment"));
        reader.readAsDataURL(blob);
    });
}

async function resolveAttachmentUrl(url: string): Promise<string> {
    if (isBlobUrl(url)) {
        return blobUrlToDataUrl(url);
    }
    return url;
}

export async function prepareAttachmentsForSave(attachments: EditableAttachment[]): Promise<{
    images: string[];
    files: PostFileAttachment[];
}> {
    const images: string[] = [];
    const files: PostFileAttachment[] = [];

    for (const attachment of attachments) {
        const url = await resolveAttachmentUrl(attachment.url);

        if (attachment.kind === "image") {
            images.push(url);
        } else {
            files.push({
                id: attachment.id,
                name: attachment.name,
                url,
                size: attachment.size,
                mimeType: attachment.mimeType,
            });
        }
    }

    return { images, files };
}
