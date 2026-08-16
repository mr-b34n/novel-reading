import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { 
    faGear, 
    faThumbtack, 
    faComment, 
    faImage,
    faPaperPlane,
    faChevronDown,
    faCheck,
    faUsers,
    faEyeSlash
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useTranslation } from "@/shared/hooks/useTranslate";

import { createAttachmentFromFile, revokeAttachmentUrls, type EditableAttachment } from "@/features/post/helpers/postAttachments";
import { useAuthStore } from "@/features/auth";
import { useCommunitiesStore, type CommunityData } from "@/features/community";
import { AttachmentPicker, useDraftsStore } from "@/features/post";
import { type CreatePostPayload } from "../types";
import { HASHTAG_REGEX, MAX_TEXTAREA_HEIGHT } from "../constants";

const extractHashtags = (text: string): string[] => {
    const matches = text.match(HASHTAG_REGEX) ?? [];
    const seen = new Set<string>();
    matches.forEach((m) => seen.add(m.slice(1)));
    return Array.from(seen);
};

const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, i) =>
        /^#[^\s#]+$/.test(part) ? (
            <span key={i} className="text-primary font-semibold">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
};

const ToggleSwitch = ({
    checked,
    onChange,
    label,
    icon,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    icon: typeof faComment;
}) => (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-text">
            <FontAwesomeIcon icon={icon} className="w-3 text-text-faint" />
            {label}
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                checked ? "bg-primary" : "bg-surface-hover"
            }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-4" : "translate-x-1"
                }`}
            />
        </button>
    </div>
);

const PostSettingsMenu = ({
    allowComments,
    onAllowCommentsChange,
    pinned,
    onPinnedChange,
    isSpoiler,
    onSpoilerChange,
}: {
    allowComments: boolean;
    onAllowCommentsChange: (v: boolean) => void;
    pinned: boolean;
    onPinnedChange: (v: boolean) => void;
    isSpoiler: boolean;
    onSpoilerChange: (v: boolean) => void;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
            top: rect.bottom + 6,
            left: Math.max(12, rect.right - 220),
        });
    };

    useEffect(() => {
        if (!open) return;
        updatePosition();
        const handleScrollOrResize = () => updatePosition();
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        return () => {
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
                menuRef.current &&
                !menuRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className="relative shrink-0">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`p-2 rounded-xl text-xs font-semibold hover:bg-surface-hover text-text-muted transition-colors cursor-pointer ${
                    open ? "bg-surface-hover text-text" : ""
                }`}
                title={t('feed.settings')}
            >
                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
            </button>

            {open &&
                coords &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{ top: coords.top, left: coords.left }}
                        className="fixed z-[9999] w-56 rounded-2xl bg-surface shadow-xl p-1.5 flex flex-col gap-1 text-xs animate-scale-up"
                    >
                        <ToggleSwitch
                            checked={allowComments}
                            onChange={onAllowCommentsChange}
                            label={t('feed.allowComments')}
                            icon={faComment}
                        />
                        <ToggleSwitch
                            checked={pinned}
                            onChange={onPinnedChange}
                            label={t('feed.pinPost')}
                            icon={faThumbtack}
                        />
                        <ToggleSwitch
                            checked={isSpoiler}
                            onChange={onSpoilerChange}
                            label={t('feed.spoiler')}
                            icon={faEyeSlash}
                        />
                    </div>,
                    document.body
                )}
        </div>
    );
};

const CommunitySelector = ({
    value,
    onChange,
    communities,
}: {
    value: number | string | null;
    onChange: (id: number | string | null) => void;
    communities: CommunityData[];
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCommunity = useMemo(
        () => communities.find((c) => c.id === value) || null,
        [communities, value]
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 w-full relative" ref={dropdownRef}>
            <span className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                <span>{t('feed.selectCommunityRequired')}</span>
                <span className="text-rose-500">*</span>
            </span>

            {/* Dropdown Button Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isOpen
                        ? "border-primary ring-2 ring-primary/20 bg-surface shadow-xs"
                        : selectedCommunity
                        ? "border-border/80 bg-surface hover:bg-surface-hover text-text"
                        : "border-rose-500/40 bg-rose-500/5 text-text-muted hover:bg-rose-500/10"
                }`}
            >
                {selectedCommunity ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <img
                            src={selectedCommunity.logo}
                            alt={selectedCommunity.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate font-bold text-text">{selectedCommunity.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-text-muted">
                        <FontAwesomeIcon icon={faUsers} className="text-text-faint text-xs" />
                        <span>{t('feed.selectCommunityPlaceholder')}</span>
                    </div>
                )}
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-xs text-text-faint transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border/80 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-fade-in p-1 flex flex-col gap-0.5">
                    {communities.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-faint text-center">
                            {t('feed.noCommunitiesJoined')}
                        </div>
                    ) : (
                        communities.map((c) => {
                            const isSelected = c.id === value;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(c.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                        isSelected
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "hover:bg-surface-hover text-text"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                            src={c.logo}
                                            alt={c.name}
                                            className="w-6 h-6 rounded-full object-cover shrink-0"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate font-bold leading-tight">{c.name}</span>
                                            {c.membersCount && (
                                                <span className="text-[10px] text-text-faint">
                                                    {c.membersCount.toLocaleString()} thành viên
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <FontAwesomeIcon icon={faCheck} className="text-primary text-xs shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

interface CreatePostBoxProps {
    onPostCreated?: (payload: CreatePostPayload) => void;
    defaultCommunityId?: number | string | null;
    hideCommunitySelector?: boolean;
    initialTitle?: string;
    initialContent?: string;
}

export const CreatePostBox = ({
    onPostCreated,
    defaultCommunityId = null,
    hideCommunitySelector = false,
    initialTitle = "",
    initialContent = "",
}: CreatePostBoxProps) => {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const avatarUrl = user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80";

    const { communities } = useCommunitiesStore();
    const joinedCommunities = useMemo(() => {
        const joined = communities.filter((c) => c.joined || (c as CommunityData & { isJoined?: boolean }).isJoined);
        return joined.length > 0 ? joined : communities;
    }, [communities]);

    const saveDraft = useDraftsStore((s) => s.saveDraft);

    const drafts = useDraftsStore((s) => s.drafts);

    const [isExpanded, setExpanded] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [manualTags, setManualTags] = useState("");
    const [communityId, setCommunityId] = useState<number | string | null>(defaultCommunityId);
    const [allowComments, setAllowComments] = useState(true);
    const [pinned, setPinned] = useState(false);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [attachments, setAttachments] = useState<EditableAttachment[]>([]);
    const [isPosting, setIsPosting] = useState(false);

    // Load draft if available and no initial data provided (once on mount)
    const hasLoadedDraft = useRef(false);
    useEffect(() => {
        if (!hasLoadedDraft.current && !initialTitle && !initialContent && drafts.length > 0) {
            const draft = drafts[0];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (draft.title) setTitle(draft.title);
            if (draft.content) {
                setContent(draft.content);
            }
            if (draft.communityId) setCommunityId(draft.communityId);
            if (draft.isSpoiler !== undefined) setIsSpoiler(draft.isSpoiler);
            hasLoadedDraft.current = true;
        }
    }, [drafts, initialTitle, initialContent]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const isActive = isExpanded;

    // Auto-save draft silently when user closes/collapses or when component unmounts with non-empty content
    useEffect(() => {
        return () => {
            if (content.trim() || title.trim()) {
                saveDraft({
                    title,
                    content,
                    communityId,
                    attachments,
                    privacy: "public",
                    allowComments,
                    pinned,
                });
            }
        };
    }, [content, title, communityId, attachments, allowComments, pinned, saveDraft]);

    useEffect(() => {
        if (initialTitle) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(initialTitle);
        }
        if (initialContent) {
            setContent(initialContent);
        }
    }, [initialTitle, initialContent]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
        el.style.height = `${nextHeight}px`;
    }, [content, isExpanded]);

    const handleTextareaScroll = () => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleQuickImageClick = () => {
        setExpanded(true);
        setTimeout(() => {
            imageInputRef.current?.click();
        }, 50);
    };

    const handleQuickImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newAttachments: EditableAttachment[] = [];
        Array.from(files).forEach((file) => {
            const isImage = file.type.startsWith("image/");
            newAttachments.push(createAttachmentFromFile(file, isImage ? "image" : "file"));
        });
        setAttachments((prev) => [...prev, ...newAttachments]);
        e.target.value = "";
    };

    const canPost = communityId !== null && communityId !== undefined && (content.trim().length > 0 || title.trim().length > 0 || attachments.length > 0) && !isPosting;

    const handlePost = async () => {
        if (!canPost) return;
        setIsPosting(true);

        const contentHashtags = extractHashtags(content);
        const splitManualTags = manualTags
            .split(/[, ]+/)
            .filter(t => t.trim().length > 0)
            .map(t => t.startsWith('#') ? t.slice(1) : t);
        
        const combinedTags = Array.from(new Set([...contentHashtags, ...splitManualTags]));

        const payload: CreatePostPayload = {
            title: title.trim() || undefined,
            content: content.trim(),
            communityId: communityId ?? undefined,
            privacy: "public",
            allowComments,
            pinned,
            isSpoiler,
            tags: combinedTags,
            attachments,
        };

        try {
            onPostCreated?.(payload);
            setTitle("");
            setContent("");
            setManualTags("");
            setAttachments([]);
            setExpanded(false);
        } finally {
            setIsPosting(false);
        }
    };

    const handleCancel = () => {
        if (content.trim() || title.trim()) {
            saveDraft({
                title,
                content,
                communityId,
                attachments,
                privacy: "public",
                allowComments,
                pinned,
            });
        }
        setTitle("");
        setContent("");
        revokeAttachmentUrls(attachments);
        setAttachments([]);
        setExpanded(false);
    };

    return (
        <div
            id="create-post"
            className="
                relative z-20
                w-full p-4 sm:p-5
                bg-surface/95 backdrop-blur-md
                rounded-2xl sm:rounded-3xl
                shadow-sm hover:shadow-md
                transition-all duration-300 ease-out
                flex flex-col gap-3
            "
        >
            {/* Hidden Input for Quick Image Button */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleQuickImageChange}
                className="hidden"
            />

            {/* Top User Info & Input Area */}
            <div className="flex gap-3 items-start">
                <div className="relative shrink-0">
                    <img
                        src={avatarUrl}
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shadow-xs"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface" title="Online" />
                </div>

                <div className="flex flex-col gap-2.5 w-full min-w-0">
                    {/* Community Selector & Title when active */}
                    <div
                        className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
                            isActive
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0 -mb-2 pointer-events-none"
                        }`}
                        aria-hidden={!isActive}
                    >
                        <div className={`min-h-0 flex flex-col gap-2 ${isActive ? "overflow-visible" : "overflow-hidden"}`}>
                            <div className="flex flex-col sm:flex-row gap-2">
                                {!hideCommunitySelector && (
                                    <div className="flex-1 min-w-0">
                                        <CommunitySelector
                                            value={communityId}
                                            onChange={setCommunityId}
                                            communities={joinedCommunities}
                                        />
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('feed.postTitle') || "Tiêu đề bài viết (không bắt buộc)..."}
                                tabIndex={isActive ? 0 : -1}
                                className="w-full h-10 px-3.5 bg-surface-hover/80 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all text-text placeholder:text-text-faint"
                            />

                            <input
                                type="text"
                                value={manualTags}
                                onChange={(e) => setManualTags(e.target.value)}
                                placeholder={t('feed.tagsPlaceholder')}
                                tabIndex={isActive ? 0 : -1}
                                className="w-full h-10 px-3.5 bg-surface-hover/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all text-primary placeholder:text-text-faint"
                            />
                        </div>
                    </div>

                    {/* Main Textarea Container */}
                    <div
                        className={`relative w-full bg-surface-hover/80 rounded-2xl transition-all duration-200 ease-out focus-within:ring-2 focus-within:ring-primary/15 ${
                            isActive ? "min-h-24" : "min-h-11"
                        }`}
                    >
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onScroll={handleTextareaScroll}
                            onFocus={() => setExpanded(true)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
                            }}
                            placeholder={t('feed.whatOnMind')}
                            rows={1}
                            className={`block w-full px-3.5 bg-transparent border-none outline-none text-sm font-medium text-transparent caret-text placeholder:text-text-faint resize-none leading-relaxed transition-[padding] duration-200 ease-out ${
                                isActive ? "min-h-24 py-3" : "min-h-11 py-2.5"
                            }`}
                        />
                        <div
                            ref={highlightRef}
                            aria-hidden
                            className={`absolute inset-0 px-3.5 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-text transition-[padding] duration-200 ease-out ${
                                isActive ? "py-3" : "py-2.5"
                            }`}
                        >
                            {renderHighlightedContent(content)}
                            {content.endsWith("\n") ? "\u200b" : null}
                        </div>
                    </div>

                    {/* Unexpanded Quick Action Shortcuts */}
                    {!isActive && (
                        <div className="flex items-center gap-1.5 sm:gap-2 pt-1 overflow-x-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={handleQuickImageClick}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text text-xs font-bold transition-all cursor-pointer shrink-0"
                            >
                                <FontAwesomeIcon icon={faImage} className="text-emerald-500 text-xs" />
                                <span>{t('feed.mediaButton')}</span>
                            </button>
                        </div>
                    )}

                    {/* Attachment Picker & Bottom Action Bar */}
                    <AttachmentPicker
                        attachments={attachments}
                        onChange={setAttachments}
                        showToolbar={isActive}
                        compactToolbar
                        className="gap-2 pt-1"
                        toolbarTrailing={
                            <div className="flex items-center gap-2 shrink-0">
                                {isActive && (
                                    <PostSettingsMenu
                                        allowComments={allowComments}
                                        onAllowCommentsChange={setAllowComments}
                                        pinned={pinned}
                                        onPinnedChange={setPinned}
                                        isSpoiler={isSpoiler}
                                        onSpoilerChange={setIsSpoiler}
                                    />
                                )}

                                {isActive && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface-hover text-text-muted hover:text-text transition-all cursor-pointer"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handlePost}
                                    disabled={!canPost}
                                    className={`shrink-0 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                                        canPost
                                            ? "bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0"
                                            : "bg-surface-hover text-text-faint cursor-not-allowed"
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                                    <span>{isPosting ? t('common.loading') : t('feed.postButton')}</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    );
};
