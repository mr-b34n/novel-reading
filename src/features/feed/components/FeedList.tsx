import { useEffect, useMemo, useRef, useState } from "react"
import { 
    faInbox, 
    faSpinner, 
    faCircleCheck, 
    faExclamationTriangle,
    faXmark
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useTranslation } from "@/shared/hooks/useTranslate"

import { DEFAULT_AVATAR as avatarGame } from "@/shared/constants/images";
import { prepareAttachmentsForSave } from "@/features/post/helpers/postAttachments";
import { useAuthStore } from "@/features/auth";
import { getCurrentAuthor, Post, usePostsStore, type PostData } from "@/features/post";

import { useCommunitiesStore } from "@/features/community";
import { CreatePostBox, type CreatePostPayload } from "./CreatePostBox";
import { type PostDataWithSettings } from "../types";

export const FeedList = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;

    const posts = usePostsStore((state) => state.posts);
    const addPost = usePostsStore((state) => state.addPost);
    const updatePost = usePostsStore((state) => state.updatePost);
    const deletePost = usePostsStore((state) => state.deletePost);

    const [hiddenAuthors, setHiddenAuthors] = useState<string[]>([]);
    const [displayLimit, setDisplayLimit] = useState(4);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const currentAuthor = getCurrentAuthor();
    const getCommunityById = useCommunitiesStore((state) => state.getCommunityById);

    const handleCreatePost = async ({ title, content, attachments, privacy, tags, allowComments, pinned, communityId }: CreatePostPayload) => {
        setSubmitError(null);
        try {
            const { images, files } = await prepareAttachmentsForSave(attachments);
            const community = getCommunityById(communityId);

            const newPost: PostDataWithSettings = {
                id: Date.now(),
                author: currentAuthor,
                authorAvatar: avatarGame,
                gameTag: community?.name ?? "General",
                timeAgo: t('feed.justNow') || "Vừa xong",
                title: title || content.slice(0, 80) + (content.length > 80 ? "..." : ""),
                content,
                images: images.length > 0 ? images : undefined,
                files: files.length > 0 ? files : undefined,
                tags,
                likes: 0,
                comments: 0,
                privacy,
                allowComments,
                pinned,
                communityId,
            };
            addPost(newPost);
        } catch {
            setSubmitError("Đã có lỗi xảy ra khi đăng bài. Vui lòng thử lại!");
        }
    };

    const handleEditPost = (id: string | number, data: Partial<PostData>) => {
        updatePost(id, {
            ...data,
            title: data.title || (data.content ? data.content.slice(0, 80) + (data.content.length > 80 ? "..." : "") : ""),
        });
    };

    const handleUnfollowAuthor = (author: string) => {
        setHiddenAuthors((prev) => [...prev, author]);
    };

    const filteredPosts = useMemo(() => {
        return posts.filter((p) => {
            if (hiddenAuthors.includes(p.author)) return false;
            return true;
        })
        .slice()
        .sort((a, b) => Number(!!(b as PostDataWithSettings).pinned) - Number(!!(a as PostDataWithSettings).pinned));
    }, [posts, hiddenAuthors]);

    const displayedPosts = filteredPosts.slice(0, displayLimit);
    const hasMore = displayLimit < filteredPosts.length;

    useEffect(() => {
        if (!hasMore || isLoadingMore) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setDisplayLimit((prev) => prev + 4);
                        setIsLoadingMore(false);
                    }, 800);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore]);

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Submit Error Banner */}
            {submitError && (
                <div className="w-full flex items-center justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-500 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>{submitError}</span>
                    </div>
                    <button onClick={() => setSubmitError(null)} className="hover:opacity-80 p-1 cursor-pointer">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {/* Create Post Area */}
            {isLoggedIn && <CreatePostBox onPostCreated={handleCreatePost} />}

            {/* Error State Display */}
            {hasError ? (
                <div className="w-full flex flex-col items-center justify-center gap-3 p-8 bg-surface/90 border border-rose-500/30 rounded-2xl text-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-rose-500" />
                    <p className="font-bold text-text text-sm">Đã xảy ra lỗi khi tải nguồn cấp bài viết</p>
                    <button
                        onClick={() => setHasError(false)}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            ) : displayedPosts.length > 0 ? (
                /* Posts Feed */
                <>
                    {displayedPosts.map((post) => (
                        <Post
                            key={post.id}
                            post={post}
                            isOwner={post.author === currentAuthor}
                            onDelete={deletePost}
                            onEdit={handleEditPost}
                            onUnfollowAuthor={handleUnfollowAuthor}
                        />
                    ))}

                    {/* Pagination / Infinite Scroll Sentinel */}
                    <div ref={sentinelRef} className="w-full py-4 flex flex-col items-center justify-center gap-2">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-surface/90 border border-border rounded-full shadow-xs text-sm font-semibold text-primary animate-pulse">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" />
                                <span>{t('feed.loadingMore') || "Đang tải thêm..."}</span>
                            </div>
                        )}
                        {!isLoadingMore && hasMore && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLoadingMore(true);
                                    setTimeout(() => {
                                        setDisplayLimit((prev) => prev + 3);
                                        setIsLoadingMore(false);
                                    }, 400);
                                }}
                                className="px-5 py-2 text-xs font-semibold text-text-muted hover:text-text bg-surface-hover hover:bg-border/60 border border-border rounded-full transition-all cursor-pointer"
                            >
                                {t('feed.loadMoreCount', { count: filteredPosts.length - displayLimit }) || `Tải thêm (${filteredPosts.length - displayLimit})`}
                            </button>
                        )}
                        {!hasMore && filteredPosts.length > 4 && (
                            <div className="flex items-center gap-2 text-xs text-text-faint py-3 font-medium bg-surface/50 border border-border/50 rounded-xl px-4">
                                <FontAwesomeIcon icon={faCircleCheck} className="text-primary" />
                                <span>{t('feed.allLoaded') || "Đã hiển thị tất cả bài viết"}</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Empty Feed State */
                <div className="w-full flex flex-col items-center justify-center gap-3 p-10 bg-surface/90 backdrop-blur-md border border-border rounded-2xl text-text-muted text-sm text-center">
                    <FontAwesomeIcon icon={faInbox} className="text-3xl text-text-faint" />
                    <p className="font-bold text-text">
                        {t('feed.emptyTitle') || "Chưa có bài viết nào"}
                    </p>
                    <p className="text-text-faint text-xs max-w-sm">
                        {t('feed.emptyDesc') || "Hãy là người đầu tiên tạo bài viết để chia sẻ cùng cộng đồng!"}
                    </p>
                </div>
            )}
        </div>
    );
}

