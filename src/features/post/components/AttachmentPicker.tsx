import { useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faImage, faPaperclip, faXmark } from "@fortawesome/free-solid-svg-icons";
import { createAttachmentFromFile, revokeAttachmentUrl, type EditableAttachment } from "../helpers/postAttachments";
import { FILE_ACCEPT, formatFileSize, IMAGE_ACCEPT, MAX_ATTACHMENT_SIZE, MAX_FILES, MAX_IMAGES, validateAttachment } from "../helpers/postAttachmentLimits";

interface AttachmentPickerProps {
    attachments: EditableAttachment[];
    onChange: (attachments: EditableAttachment[]) => void;
    showToolbar?: boolean;
    compactToolbar?: boolean;
    toolbarTrailing?: ReactNode;
    className?: string;
}

export function AttachmentPicker({
    attachments,
    onChange,
    showToolbar = true,
    compactToolbar = false,
    toolbarTrailing,
    className = "",
}: AttachmentPickerProps) {
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createdUrlsRef = useRef<Set<string>>(new Set());

    const imageCount = attachments.filter((a) => a.kind === "image").length;
    const fileCount = attachments.filter((a) => a.kind === "file").length;

    if (attachments.length === 0 && error !== null) {
        setError(null);
    }

    const addFiles = (files: FileList | null, kind: "image" | "file") => {
        if (!files || files.length === 0) return;

        const list = Array.from(files);
        const maxCount = kind === "image" ? MAX_IMAGES : MAX_FILES;
        const currentCount = kind === "image" ? imageCount : fileCount;
        const remaining = maxCount - currentCount;

        if (remaining <= 0) {
            setError(
                kind === "image"
                    ? `You can attach up to ${MAX_IMAGES} images.`
                    : `You can attach up to ${MAX_FILES} files.`
            );
            return;
        }

        const next = [...attachments];
        let added = 0;

        for (const file of list) {
            if (added >= remaining) {
                setError(
                    kind === "image"
                        ? `Only ${MAX_IMAGES} images allowed.`
                        : `Only ${MAX_FILES} files allowed.`
                );
                break;
            }

            const validationError = validateAttachment(file, kind);
            if (validationError) {
                setError(validationError);
                continue;
            }

            const attachment = createAttachmentFromFile(file, kind);
            createdUrlsRef.current.add(attachment.url);
            next.push(attachment);
            added++;
            setError(null);
        }

        if (added > 0) onChange(next);
    };

    const removeAttachment = (id: string) => {
        const target = attachments.find((a) => a.id === id);
        if (target && createdUrlsRef.current.has(target.url)) {
            revokeAttachmentUrl(target.url);
            createdUrlsRef.current.delete(target.url);
        }
        onChange(attachments.filter((a) => a.id !== id));
        setError(null);
    };

    const images = attachments.filter((a) => a.kind === "image");
    const files = attachments.filter((a) => a.kind === "file");

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <input
                ref={imageInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                    addFiles(e.target.files, "image");
                    e.target.value = "";
                }}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                    addFiles(e.target.files, "file");
                    e.target.value = "";
                }}
            />

            {attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                    {images.length > 0 && (
                        <div className="flex flex-row gap-2 flex-wrap">
                            {images.map((img) => (
                                <div key={img.id} className="relative group">
                                    <img
                                        src={img.url}
                                        alt={img.name}
                                        className="w-20 h-20 object-cover rounded-xl border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(img.id)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted hover:text-accent-500 hover:border-accent-500/50 shadow-sm"
                                        title="Remove image"
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex flex-row items-center gap-2 px-3 py-2 rounded-xl bg-surface-hover border border-border"
                                >
                                    <FontAwesomeIcon icon={faFile} className="text-primary text-sm shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text truncate">{file.name}</p>
                                        <p className="text-[10px] text-text-faint">{formatFileSize(file.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(file.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full text-text-faint hover:text-accent-500 hover:bg-surface transition-colors shrink-0"
                                        title="Remove file"
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-xs text-accent-500 font-medium">{error}</p>
            )}

            <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                    showToolbar
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
                aria-hidden={!showToolbar}
            >
                <div className={`min-h-0 ${showToolbar ? "overflow-visible" : "overflow-hidden"}`}>
                    <div className="flex flex-row items-center justify-between gap-2">
                        <div className="flex flex-row items-center gap-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={imageCount >= MAX_IMAGES || !showToolbar}
                                tabIndex={showToolbar ? 0 : -1}
                                title={`Add image (max ${MAX_IMAGES}, ${formatFileSize(MAX_ATTACHMENT_SIZE)} each)`}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-primary transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faImage} className="text-[15px]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={fileCount >= MAX_FILES || !showToolbar}
                                tabIndex={showToolbar ? 0 : -1}
                                title={`Add file (max ${MAX_FILES}, ${formatFileSize(MAX_ATTACHMENT_SIZE)} each)`}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-primary transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faPaperclip} className="text-[15px]" />
                            </button>
                            {!compactToolbar && (
                                <span className="text-[10px] text-text-faint ml-1 truncate">
                                    Max {formatFileSize(MAX_ATTACHMENT_SIZE)} · {MAX_IMAGES} imgs · {MAX_FILES} files
                                </span>
                            )}
                        </div>
                        {toolbarTrailing}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AttachmentToolbarButtons({
    onOpenImage,
    onOpenFile,
    canAddImage,
    canAddFile,
}: {
    onOpenImage: () => void;
    onOpenFile: () => void;
    canAddImage: boolean;
    canAddFile: boolean;
}) {
    return (
        <div className="flex flex-row items-center gap-1">
            <button
                type="button"
                onClick={onOpenImage}
                disabled={!canAddImage}
                title={`Add image (max ${MAX_IMAGES}, ${formatFileSize(MAX_ATTACHMENT_SIZE)} each)`}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <FontAwesomeIcon icon={faImage} className="text-[15px]" />
            </button>
            <button
                type="button"
                onClick={onOpenFile}
                disabled={!canAddFile}
                title={`Add file (max ${MAX_FILES}, ${formatFileSize(MAX_ATTACHMENT_SIZE)} each)`}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <FontAwesomeIcon icon={faPaperclip} className="text-[15px]" />
            </button>
        </div>
    );
}
