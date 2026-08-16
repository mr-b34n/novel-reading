import { useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faComment, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import type { PostData, PostFileAttachment } from "./Post";
import { postToEditableAttachments, prepareAttachmentsForSave, revokeAttachmentUrls, type EditableAttachment } from "../helpers/postAttachments";
import { AttachmentPicker } from "./AttachmentPicker";
import { useTranslation } from "@/shared/hooks/useTranslate";

interface EditPostModalProps {
    initialTitle: string;
    initialContent: string;
    initialAttachments?: Pick<PostData, "images" | "files">;
    initialPrivacy?: "public" | "friends" | "private";
    initialAllowComments?: boolean;
    initialPinned?: boolean;
    onClose: () => void;
    onSave: (data: {
        title: string;
        content: string;
        images?: string[];
        files?: PostFileAttachment[];
        privacy?: "public" | "friends" | "private";
        allowComments?: boolean;
        pinned?: boolean;
    }) => void;
}

export const EditPostModal = ({
    initialTitle,
    initialContent,
    initialAttachments,
    initialPrivacy,
    initialAllowComments,
    initialPinned,
    onClose,
    onSave,
}: EditPostModalProps) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [attachments, setAttachments] = useState<EditableAttachment[]>(() =>
        initialAttachments ? postToEditableAttachments(initialAttachments) : []
    );
    const [privacy] = useState<"public" | "friends" | "private">(initialPrivacy ?? "public");
    const [allowComments, setAllowComments] = useState<boolean>(initialAllowComments ?? true);
    const [pinned, setPinned] = useState<boolean>(initialPinned ?? false);
    const [isSaving, setIsSaving] = useState(false);

    const canSave = content.trim().length > 0 && !isSaving;

    const handleSave = async () => {
        if (!canSave) return;

        setIsSaving(true);
        try {
            const { images, files } = await prepareAttachmentsForSave(attachments);
            revokeAttachmentUrls(attachments);
            onSave({
                title: title.trim(),
                content: content.trim(),
                images,
                files,
                privacy,
                allowComments,
                pinned,
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        revokeAttachmentUrls(attachments);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-200 flex items-center justify-center animate-fade-in px-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
            />

            <div className="relative w-full max-w-lg max-h-[90vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                <div className="flex flex-row items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30 shrink-0">
                    <h3 className="font-bold text-lg text-text">{t('post.edit')}</h3>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="flex flex-col p-5 gap-4 overflow-y-auto no-scrollbar">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="edit-post-title" className="text-sm font-semibold text-text">
                            {t('feed.postTitle')}
                        </label>
                        <input
                            id="edit-post-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('feed.postTitle')}
                            className="w-full h-10 px-4 bg-surface-hover border border-border rounded-xl text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="edit-post-content" className="text-sm font-semibold text-text">
                            {t('feed.whatOnMind')}
                        </label>
                        <textarea
                            id="edit-post-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('feed.whatOnMind')}
                            className="w-full bg-surface-hover border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none h-32"
                        />
                    </div>

                    <AttachmentPicker
                        attachments={attachments}
                        onChange={setAttachments}
                    />

                    <div className="flex flex-col gap-2.5 pt-2 border-t border-border/80">
                        <label className="text-sm font-semibold text-text">{t('post.postSettings')}</label>

                        <div className="flex flex-col gap-3 bg-surface-hover/40 p-3.5 rounded-xl border border-border/60">
                            <div className="flex items-center justify-between py-0.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text">
                                    <FontAwesomeIcon icon={faComment} className="w-3.5 text-text-muted" />
                                    <span>{t('feed.allowComments')}</span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={allowComments}
                                    onClick={() => setAllowComments(!allowComments)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                        allowComments ? "bg-primary" : "bg-border text-text-faint"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                            allowComments ? "translate-x-4" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-0.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text">
                                    <FontAwesomeIcon icon={faThumbtack} className="w-3.5 text-text-muted" />
                                    <span>{t('feed.pinned')}</span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={pinned}
                                    onClick={() => setPinned(!pinned)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                        pinned ? "bg-primary" : "bg-border text-text-faint"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                            pinned ? "translate-x-4" : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3 pt-2">
                        <button
                            onClick={handleClose}
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-full font-semibold text-sm text-text bg-surface-hover hover:bg-border transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!canSave}
                            className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-colors cursor-pointer ${
                                canSave
                                    ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
                                    : "bg-surface-hover text-text-faint cursor-not-allowed"
                            }`}
                        >
                            {isSaving ? t('common.loading') : t('post.saveEdit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
