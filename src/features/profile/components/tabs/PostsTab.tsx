
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { Post, type PostData } from "@/features/post";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface PostsTabProps {
    posts: PostData[];
    t: TranslateFn;
}

export const PostsTab = ({ posts, t }: PostsTabProps) => (
    <div className="flex flex-col gap-4 animate-fade-in">
        {posts.length > 0 ? (
            posts.map((post) => <Post key={post.id} post={post} />)
        ) : (
            <div className="bg-surface-hover/20 border border-border/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
                    <FontAwesomeIcon icon={faCommentDots} />
                </div>
                <h4 className="text-lg font-bold text-text">{t("profile.emptyPosts")}</h4>
                <p className="text-sm text-text-faint max-w-md">{t("profile.createFirstPost")}</p>
            </div>
        )}
    </div>
);
