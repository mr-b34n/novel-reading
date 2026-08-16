import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartOutline } from "@fortawesome/free-regular-svg-icons";
import { faHeart as faHeartSolid, faReply, faImage, faFaceSmile, faXmark, faLock, faEllipsis, faTrash, faFlag, faCopy, faCheck, faPen, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/shared/hooks/useTranslate";

import { DEFAULT_AVATAR as avatarUser } from "@/shared/constants/images";
import { useAuthStore } from "@/features/auth";
import { usePostsStore } from "../store/usePostsStore";
import { ReportModal } from "@/features/report";
import { getCurrentAuthor } from "../helpers/getCurrentAuthor";
import { getUserRankConfig, getRankLabel } from "../helpers/userRanks";
import { formatTimeAgo } from "@/shared/utils/formatTimeAgo";
import EmojiBox from "@/shared/components/ui/EmojiBox";
import { notificationApi } from "@/features/notification";


const MAX_COMMENT_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const COMMENT_IMAGE_ACCEPT = "image/*";

export interface CommentData {
    id: string | number;
    author: string;
    authorAvatar: string;
    content: string;
    timeAgo: string;
    likes: number;
    image?: string; // URL ảnh đính kèm (nếu có)
    replies?: CommentData[]; // 👈 Bổ sung danh sách reply con
    pinned?: boolean; // 👈 Ghim bình luận
}

interface CommentSectionProps {
    postId: string;
}

interface CommentItemProps {
    comment: CommentData;
    isLoggedIn: boolean;
    isCommentsAllowed?: boolean;
    sortBy?: "top" | "newest";
    onAddReply: (parentId: string | number, text: string, image?: string) => void;
    onDeleteComment?: (commentId: string | number) => void;
    onEditComment?: (commentId: string | number, newContent: string) => void;
    onTogglePinComment?: (commentId: string | number) => void;
}

/**
 * Hook nhỏ gọn xử lý chọn/validate/preview 1 ảnh đính kèm cho ô nhập bình luận.
 * Giới hạn: chỉ ảnh, tối đa MAX_COMMENT_IMAGE_SIZE, không cho phép file khác.
 */
function useCommentImageAttachment() {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelect = (selected: File | null) => {
        if (!selected) return;

        if (!selected.type.startsWith("image/")) {
            setError(t('comment.errorOnlyImage'));
            return;
        }

        if (selected.size > MAX_COMMENT_IMAGE_SIZE) {
            setError(t('comment.errorMaxSize'));
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);

        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
        setError(null);
    };

    const clear = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const openPicker = () => inputRef.current?.click();

    
    
    const toDataUrl = (): Promise<string | undefined> => {
        return new Promise((resolve) => {
            if (!file) {
                resolve(undefined);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(file);
        });
    };

    return { previewUrl, error, inputRef, handleSelect, clear, openPicker, toDataUrl };
}

const CommentImageInput = ({ inputRef, onSelect }: { inputRef: React.RefObject<HTMLInputElement | null>; onSelect: (file: File | null) => void }) => (
    <input
        ref={inputRef}
        type="file"
        accept={COMMENT_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
            onSelect(e.target.files?.[0] ?? null);
            e.target.value = "";
        }}
    />
);

const CommentImagePreview = ({ url, onRemove }: { url: string; onRemove: () => void }) => {
    const { t } = useTranslation();
    return (
        <div className="relative w-20 h-20 group">
            <img src={url} alt={t('comment.attachedImage')} className="w-20 h-20 object-cover rounded-xl border border-border" />
            <button
                type="button"
                onClick={onRemove}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted hover:text-accent-500 hover:border-accent-500/50 shadow-sm"
                title={t('comment.removeImage')}
            >
                <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
            </button>
        </div>
    );
};

const renderCommentContent = (text: string) => {
    if (!text) return null;
    return <span>{text}</span>;
};

const sortComments = (list: CommentData[], sort: "top" | "newest" = "top"): CommentData[] => {
    return [...list]
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
            if (sort === "top") {
                return (b.likes || 0) - (a.likes || 0);
            } else {
                return b.id.toString().localeCompare(a.id.toString(), undefined, { numeric: true });
            }
        })
        .map((item) => {
            if (item.replies && item.replies.length > 0) {
                return { ...item, replies: sortComments(item.replies, sort) };
            }
            return item;
        });
};

const CommentItem = ({
    comment,
    isLoggedIn,
    isCommentsAllowed = true,
    sortBy = "top",
    onAddReply,
    onDeleteComment,
    onEditComment,
    onTogglePinComment,
}: CommentItemProps) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [showSubEmoji, setShowSubEmoji] = useState(false);
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
    const replyImage = useCommentImageAttachment();
    const navigate = useNavigate();
    const { t } = useTranslation();

    
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [copied, setCopied] = useState(false);

    const currentAuthor = getCurrentAuthor();
    const isAuthor = comment.author === currentAuthor || comment.author === "You";

    const toggleLike = () => {
        if (!isLoggedIn) {
            navigate({ to: "/auth" });
            return;
        }
        setLiked((prev) => !prev);
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    const handleReplyClick = () => {
        if (!isLoggedIn) {
            navigate({ to: "/auth" });
            return;
        }
        setIsReplying((prev) => !prev);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReplyText(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleSubmitSubReply = async () => {
        if (!replyText.trim() && !replyImage.previewUrl) return;
        const imageDataUrl = await replyImage.toDataUrl();
        onAddReply(comment.id, replyText.trim(), imageDataUrl);
        setReplyText("");
        replyImage.clear();
        setIsReplying(false);
        if (replyTextareaRef.current) replyTextareaRef.current.style.height = "auto";
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(comment.content);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setShowMenu(false);
        }, 1500);
    };

    const handleSaveEdit = () => {
        if (!editText.trim()) return;
        if (onEditComment) {
            onEditComment(comment.id, editText.trim());
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (onDeleteComment) {
            onDeleteComment(comment.id);
        }
        setShowMenu(false);
    };

    const handleTogglePin = () => {
        if (onTogglePinComment) {
            onTogglePinComment(comment.id);
        }
        setShowMenu(false);
    };

    return (
        <div className={`flex flex-col w-full animate-fade-in group ${showMenu ? "relative z-[100]" : "relative has-[.menu-dropdown]:z-[100]"}`}>
            <div className="flex flex-row items-start gap-3 w-full">
                <img
                    src={comment.authorAvatar}
                    alt={comment.author}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                />

                <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <div className="flex flex-col">
                        <div className="flex flex-row items-center justify-between gap-2">
                            <div className="flex flex-row items-center gap-2 flex-wrap">
                                <p className={`font-bold text-[14px] hover:underline cursor-pointer ${getUserRankConfig(comment.author).textColor}`}>
                                    {comment.author}
                                </p>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getUserRankConfig(comment.author).classes}`}>
                                    <FontAwesomeIcon icon={getUserRankConfig(comment.author).icon} className="mr-1" />
                                    {getRankLabel(getUserRankConfig(comment.author))}
                                </span>
                                <span className="text-xs text-text-faint">· {formatTimeAgo(comment.timeAgo, t)}</span>
                                {comment.pinned && (
                                    <span 
                                        className="inline-flex items-center justify-center w-5 h-5 text-primary bg-primary/10 rounded-full"
                                        title={t('comment.pinnedBadge')}
                                    >
                                        <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className={`relative shrink-0 ${showMenu ? "z-[100]" : ""}`}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu((prev) => !prev);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-text-faint hover:text-text hover:bg-surface-hover transition-colors opacity-70 group-hover:opacity-100 focus:opacity-100"
                                    title={t('comment.options')}
                                >
                                    <FontAwesomeIcon icon={faEllipsis} className="text-xs" />
                                </button>

                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                            }}
                                        />
                                        <div className="menu-dropdown absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.45)] z-50 overflow-hidden animate-fade-in py-1">
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-left"
                                            >
                                                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-3.5 ${copied ? "text-success-500" : ""}`} />
                                                <span>{copied ? t('comment.copied') : t('comment.copy')}</span>
                                            </button>

                                            {isAuthor && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditText(comment.content);
                                                        setIsEditing(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-left"
                                                >
                                                    <FontAwesomeIcon icon={faPen} className="w-3.5" />
                                                    <span>{t('comment.edit')}</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleTogglePin}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-left"
                                            >
                                                <FontAwesomeIcon icon={faThumbtack} className="w-3.5" />
                                                <span>{comment.pinned ? t('comment.unpin') : t('comment.pin')}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowReportModal(true);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-left border-t border-border/40 mt-0.5 pt-2"
                                            >
                                                <FontAwesomeIcon icon={faFlag} className="w-3.5 text-accent-500" />
                                                <span>{t('comment.report')}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-accent-500 hover:bg-surface-hover transition-colors text-left font-medium border-t border-border/40 mt-0.5 pt-2"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="w-3.5" />
                                                <span>{t('comment.delete')}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex flex-col gap-2 mt-1.5 p-2.5 bg-surface-hover/50 border border-border/80 rounded-xl animate-fade-in">
                                <textarea
                                    value={editText}
                                    onChange={(e) => {
                                        setEditText(e.target.value);
                                        e.target.style.height = "auto";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full bg-transparent text-sm text-text resize-none focus:outline-none min-h-12"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 pt-1 border-t border-border/40">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1 rounded-full text-xs font-semibold text-text-muted hover:bg-surface transition-colors"
                                    >
                                        {t('comment.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={!editText.trim()}
                                        className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                    >
                                        {t('comment.save')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[14px] text-text mt-0.5 leading-snug whitespace-pre-wrap break-words">
                                {renderCommentContent(comment.content)}
                            </p>
                        )}
                        {comment.image && (
                            <img
                                src={comment.image}
                                alt={t('comment.attachedImage')}
                                className="mt-2 max-w-[220px] max-h-56 object-cover rounded-xl border border-border cursor-pointer hover:opacity-95 transition-opacity"
                            />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row items-center gap-5 mt-1 text-xs font-medium text-text-faint">
                        <button 
                            onClick={toggleLike} 
                            className={`flex flex-row items-center gap-1.5 hover:text-like transition-colors ${liked ? "text-like" : ""}`}
                        >
                            <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartOutline} className="text-xs" />
                            <span>{likeCount > 0 ? likeCount : ""}</span>
                        </button>

                        {isCommentsAllowed && (
                            <button 
                                onClick={handleReplyClick}
                                className={`flex flex-row items-center gap-1.5 hover:text-primary transition-colors ${isReplying ? "text-primary font-semibold" : ""}`}
                            >
                                <FontAwesomeIcon icon={faReply} className="text-xs" />
                                <span>{t('comment.replyBtn')}</span>
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {isReplying && isCommentsAllowed && (
                        <div className="flex flex-col gap-2 mt-3 p-3 bg-surface hover:bg-surface-hover/30 border border-border/60 rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 shadow-sm transition-all duration-200 animate-fade-in">
                            <textarea
                                ref={replyTextareaRef}
                                value={replyText}
                                onChange={handleInput}
                                placeholder={t('comment.placeholderReply', { author: comment.author })}
                                className="w-full bg-transparent text-sm text-text placeholder:text-text-faint resize-none overflow-hidden focus:outline-none min-h-[24px]"
                                rows={1}
                                autoFocus
                            />

                            <CommentImageInput inputRef={replyImage.inputRef} onSelect={replyImage.handleSelect} />

                            {replyImage.previewUrl && (
                                <CommentImagePreview url={replyImage.previewUrl} onRemove={replyImage.clear} />
                            )}
                            {replyImage.error && (
                                <p className="text-xs text-accent-500 font-medium">{replyImage.error}</p>
                            )}

                            <div className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={replyImage.openPicker}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition-colors"
                                    title={t('comment.attachImage')}
                                >
                                    <FontAwesomeIcon icon={faImage} className="text-sm" />
                                </button>

                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => setShowSubEmoji((prev) => !prev)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition-colors" 
                                        title="Add emoji"
                                    >
                                        <FontAwesomeIcon icon={faFaceSmile} className="text-sm" />
                                    </button>
                                    <EmojiBox
                                        isOpen={showSubEmoji}
                                        onClose={() => setShowSubEmoji(false)}
                                        onSelect={(_id, char) => {
                                            setReplyText((prev) => prev + char);
                                            setShowSubEmoji(false);
                                        }}
                                    />
                                </div>

                                <div className="flex flex-row gap-2">
                                    <button
                                        onClick={() => {
                                            setIsReplying(false);
                                            replyImage.clear();
                                        }}
                                        className="px-3 py-1 rounded-full text-xs font-semibold text-text-muted hover:bg-surface-hover transition-colors"
                                    >
                                        {t('comment.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSubmitSubReply}
                                        disabled={!replyText.trim() && !replyImage.previewUrl}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                            replyText.trim() || replyImage.previewUrl
                                                ? "bg-primary text-white hover:bg-primary-hover"
                                                : "bg-surface-hover text-text-faint cursor-not-allowed"
                                        }`}
                                    >
                                        {t('comment.replyBtn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-border/40 flex flex-col gap-4 mt-3">
                    {sortComments(comment.replies, sortBy).map((subCmt) => (
                        <CommentItem
                            key={subCmt.id}
                            comment={subCmt}
                            isLoggedIn={isLoggedIn}
                            isCommentsAllowed={isCommentsAllowed}
                            sortBy={sortBy}
                            onAddReply={onAddReply}
                            onDeleteComment={onDeleteComment}
                            onEditComment={onEditComment}
                            onTogglePinComment={onTogglePinComment}
                        />
                    ))}
                </div>
            )}

            {showReportModal && (
                <ReportModal
                    postId={`comment-${comment.id}`}
                    author={comment.author}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </div>
    );
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
    const { t } = useTranslation();
    const [showMainEmoji, setShowMainEmoji] = useState(false);
    const post = usePostsStore((state) => state.getPostById(postId));
    const isCommentsAllowed = post?.allowComments !== false;
    const [commentText, setCommentText] = useState("");
    const [sortBy, setSortBy] = useState<"top" | "newest">("top");
    const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
    const mainImage = useCommentImageAttachment();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;
    const navigate = useNavigate();

    
    const [comments, setComments] = useState<CommentData[]>([
        {
            id: 1,
            author: "ProGamer99",
            authorAvatar: avatarUser,
            content: "Wow, layout đẹp quá bạn ơi! Có chia sẻ preset không?",
            timeAgo: "2 giờ trước",
            likes: 5,
            replies: [
                {
                    id: "1-1",
                    author: "DevCreator",
                    authorAvatar: avatarUser,
                    content: "Cảm ơn bạn! Mình dùng TailwindCSS kết hợp custom config thôi nhé.",
                    timeAgo: "1 giờ trước",
                    likes: 3,
                },
            ],
        },
        {
            id: 2,
            author: "ChillVibes",
            authorAvatar: avatarUser,
            content: "Nhìn cái này muốn tải game lại chơi luôn quá :D",
            timeAgo: "1 giờ trước",
            likes: 2,
        },
        {
            id: 3,
            author: getCurrentAuthor(),
            authorAvatar: avatarUser,
            content: "Bài viết rất chất lượng, mình đã ghim và xin phép lưu lại nhé!",
            timeAgo: "30 phút trước",
            likes: 10,
            pinned: true,
        },
    ]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCommentText(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    
    const addReplyToTree = (
        list: CommentData[],
        parentId: string | number,
        newReply: CommentData
    ): CommentData[] => {
        return list.map((cmt) => {
            if (cmt.id === parentId) {
                return {
                    ...cmt,
                    replies: [...(cmt.replies || []), newReply],
                };
            }
            if (cmt.replies && cmt.replies.length > 0) {
                return {
                    ...cmt,
                    replies: addReplyToTree(cmt.replies, parentId, newReply),
                };
            }
            return cmt;
        });
    };

    
    const handleMainReplySubmit = async () => {
        if (!commentText.trim() && !mainImage.previewUrl) return;
        const textContent = commentText.trim();
        const imageDataUrl = await mainImage.toDataUrl();
        const newComment: CommentData = {
            id: `${postId}-${Date.now()}`,
            author: getCurrentAuthor(),
            authorAvatar: avatarUser,
            content: textContent,
            timeAgo: "Vừa xong",
            likes: 0,
            image: imageDataUrl,
        };
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
        mainImage.clear();
        if (mainTextareaRef.current) mainTextareaRef.current.style.height = "auto";

        void notificationApi.createNotification({
            type: "comment",
            referenceId: String(postId),
            title: "Bình luận mới trên bài viết",
            message: textContent ? `Bạn đã đăng bình luận: "${textContent.slice(0, 40)}${textContent.length > 40 ? "..." : ""}"` : "Bạn đã đính kèm ảnh trong bình luận",
            link: `/post/${postId}`,
        });
    };

    
    const handleAddSubReply = (parentId: string | number, text: string, image?: string) => {
        const newSubReply: CommentData = {
            id: `sub-${Date.now()}`,
            author: getCurrentAuthor(),
            authorAvatar: avatarUser,
            content: text,
            timeAgo: "Vừa xong",
            likes: 0,
            image,
        };
        setComments((prev) => addReplyToTree(prev, parentId, newSubReply));

        void notificationApi.createNotification({
            type: "reply",
            referenceId: String(postId),
            title: "Phản hồi mới cho bình luận",
            message: `Bạn đã trả lời: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`,
            link: `/post/${postId}`,
        });
    };

    const canSubmitMain = commentText.trim().length > 0 || !!mainImage.previewUrl;

    const removeCommentFromTree = (list: CommentData[], targetId: string | number): CommentData[] => {
        return list
            .filter((item) => item.id !== targetId)
            .map((item) => {
                if (item.replies && item.replies.length > 0) {
                    return { ...item, replies: removeCommentFromTree(item.replies, targetId) };
                }
                return item;
            });
    };

    const editCommentInTree = (list: CommentData[], targetId: string | number, newContent: string): CommentData[] => {
        return list.map((item) => {
            if (item.id === targetId) {
                return { ...item, content: newContent };
            }
            if (item.replies && item.replies.length > 0) {
                return { ...item, replies: editCommentInTree(item.replies, targetId, newContent) };
            }
            return item;
        });
    };

    const togglePinCommentInTree = (list: CommentData[], targetId: string | number): CommentData[] => {
        return list.map((item) => {
            if (item.id === targetId) {
                return { ...item, pinned: !item.pinned };
            }
            if (item.replies && item.replies.length > 0) {
                return { ...item, replies: togglePinCommentInTree(item.replies, targetId) };
            }
            return item;
        });
    };

    const handleDeleteComment = (commentId: string | number) => {
        setComments((prev) => removeCommentFromTree(prev, commentId));
    };

    const handleEditComment = (commentId: string | number, newContent: string) => {
        setComments((prev) => editCommentInTree(prev, commentId, newContent));
    };

    const handleTogglePinComment = (commentId: string | number) => {
        setComments((prev) => togglePinCommentInTree(prev, commentId));
    };

    return (
        <div className="w-full flex flex-col pt-4 mt-2 border-t border-border">
            <div className="flex items-center justify-between px-4 mb-4">
                <h3 className="font-bold text-lg text-text">
                    {t('comment.title')} <span className="text-text-muted font-normal text-base ml-1">{comments.length}</span>
                </h3>
                {comments.length > 0 && (
                    <div className="flex items-center gap-1 bg-surface-hover/70 p-1 rounded-xl border border-border/60 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setSortBy("top")}
                            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                sortBy === "top" ? "bg-surface text-primary shadow-sm font-bold" : "text-text-muted hover:text-text"
                            }`}
                        >
                            <span>{t('comment.sortTop')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortBy("newest")}
                            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                                sortBy === "newest" ? "bg-surface text-primary shadow-sm font-bold" : "text-text-muted hover:text-text"
                            }`}
                        >
                            <span>{t('comment.sortNewest')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex flex-row gap-3 px-4 mb-6">
                {!isCommentsAllowed ? (
                    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface-hover/50 rounded-xl border border-border">
                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted mb-2 shadow-sm">
                            <FontAwesomeIcon icon={faLock} className="text-base" />
                        </div>
                        <p className="font-bold text-text mb-1">{t('comment.disabledTitle')}</p>
                        <p className="text-sm text-text-muted text-center">{t('comment.disabledDesc')}</p>
                    </div>
                ) : isLoggedIn ? (
                    <>
                        <img src={avatarUser} alt="You" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-border shrink-0" />
                        <div className="flex flex-col flex-1 gap-2 bg-surface hover:bg-surface-hover/30 border border-border/80 rounded-xl p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200">
                            <textarea
                                ref={mainTextareaRef}
                                value={commentText}
                                onChange={handleInput}
                                placeholder={t('comment.placeholderMain')}
                                className="w-full bg-transparent text-sm sm:text-[15px] text-text placeholder:text-text-faint resize-none overflow-hidden focus:outline-none min-h-[24px]"
                                rows={1}
                            />

                            <CommentImageInput inputRef={mainImage.inputRef} onSelect={mainImage.handleSelect} />

                            {mainImage.previewUrl && (
                                <CommentImagePreview url={mainImage.previewUrl} onRemove={mainImage.clear} />
                            )}
                            {mainImage.error && (
                                <p className="text-xs text-accent-500 font-medium">{mainImage.error}</p>
                            )}

                            <div className="flex flex-row justify-between items-center pt-2 border-t border-border/60">
                                <div className="flex flex-row gap-1">
                                    <button
                                        type="button"
                                        onClick={mainImage.openPicker}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition-colors"
                                        title={t('comment.attachImage')}
                                    >
                                        <FontAwesomeIcon icon={faImage} className="text-sm" />
                                    </button>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setShowMainEmoji((prev) => !prev)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition-colors" 
                                            title="Add emoji"
                                        >
                                            <FontAwesomeIcon icon={faFaceSmile} className="text-sm" />
                                        </button>
                                        <EmojiBox
                                            isOpen={showMainEmoji}
                                            onClose={() => setShowMainEmoji(false)}
                                            onSelect={(_id, char) => {
                                                setCommentText((prev) => prev + char);
                                                setShowMainEmoji(false);
                                            }}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleMainReplySubmit}
                                    disabled={!canSubmitMain}
                                    className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                                        canSubmitMain 
                                        ? "bg-primary text-white hover:bg-primary-hover" 
                                        : "bg-surface-hover text-text-faint cursor-not-allowed"
                                    }`}
                                >
                                    {t('comment.replyBtn')}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center p-6 bg-surface-hover/50 rounded-xl border border-border">
                        <p className="font-semibold text-text mb-2">{t('comment.joinTitle')}</p>
                        <p className="text-sm text-text-muted mb-4">{t('comment.joinDesc')}</p>
                        <button 
                            onClick={() => navigate({ to: "/auth" })}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors shadow-sm"
                        >
                            {t('comment.loginSign')}
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-6 px-4 pb-4">
                {sortComments(comments, sortBy).map((cmt) => (
                    <CommentItem
                        key={cmt.id}
                        comment={cmt}
                        isLoggedIn={isLoggedIn}
                        isCommentsAllowed={isCommentsAllowed}
                        sortBy={sortBy}
                        onAddReply={handleAddSubReply}
                        onDeleteComment={handleDeleteComment}
                        onEditComment={handleEditComment}
                        onTogglePinComment={handleTogglePinComment}
                    />
                ))}
            </div>
        </div>
    );
};