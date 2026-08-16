import { faBookmark } from "@fortawesome/free-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useTranslation } from "@/shared/hooks/useTranslate";

import { getCurrentAuthor, Post, usePostsStore, type PostData } from "@/features/post";
import { useBookmarksStore } from "../store/useBookmarkStore";


export const BookmarkList = () => {
    const { t } = useTranslation();
    const posts = usePostsStore((state) => state.posts);
    const updatePost = usePostsStore((state) => state.updatePost);
    const deletePost = usePostsStore((state) => state.deletePost);

    const bookmarkedIds = useBookmarksStore((state) => state.bookmarkedIds);
    const removeBookmark = useBookmarksStore((state) => state.removeBookmark);
    const currentAuthor = getCurrentAuthor();

    const handleEditPost = (id: string | number, data: Partial<PostData>) => {
        updatePost(id, {
            ...data,
            title: data.title || (data.content ? data.content.slice(0, 80) + (data.content.length > 80 ? "..." : "") : ""),
        });
    };

    const handleUnfollowAuthor = () => {};

    const bookmarkedPosts = bookmarkedIds
        .map((id) => posts.find((p) => p.id.toString() === id.toString()))
        .filter((p): p is PostData => Boolean(p));

    return (
        <div className="w-full flex flex-col gap-3">
            {bookmarkedPosts.length > 0 ? (
                bookmarkedPosts.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                        isOwner={post.author === currentAuthor}
                        onDelete={(id) => {
                            deletePost(id);
                            removeBookmark(id);
                        }}
                        onEdit={handleEditPost}
                        onUnfollowAuthor={handleUnfollowAuthor}
                    />
                ))
            ) : (
                <div className="
                    w-full flex flex-col items-center justify-center gap-2 p-10
                    bg-surface/90 backdrop-blur-md border border-border rounded-2xl
                    text-text-muted text-sm
                ">
                    <FontAwesomeIcon icon={faBookmark} className="text-2xl text-text-faint mb-1" />
                    <p className="font-semibold text-text">{t('bookmark.emptyTitle')}</p>
                    <p className="text-text-faint text-center">{t('bookmark.emptyDesc')}</p>
                </div>
            )}
        </div>
    );
}