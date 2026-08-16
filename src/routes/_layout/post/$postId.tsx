import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/shared/hooks/useTheme';
import { CommentSection, getCurrentAuthor, Post, usePostsStore, type PostData } from '@/features/post';

export const Route = createFileRoute('/_layout/post/$postId')({
    component: PostDetail,
})

function PostDetail() {
    useTheme("Home");

    const { postId } = Route.useParams();
    const navigate = useNavigate();
    const router = useRouter();

    const post = usePostsStore((state) => state.getPostById(postId));
    const updatePost = usePostsStore((state) => state.updatePost);
    const deletePost = usePostsStore((state) => state.deletePost);
    const currentAuthor = getCurrentAuthor();

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.history.back();
        } else {
            navigate({ to: '/' });
        }
    };

    const handleEditPost = (id: string | number, data: Partial<PostData>) => {
        updatePost(id, {
            ...data,
            title: data.title || (data.content ? data.content.slice(0, 80) + (data.content.length > 80 ? "..." : "") : ""),
        });
    };

    const handleDeletePost = (id: string | number) => {
        deletePost(id);
        handleGoBack();
    };

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-bg text-text">
                <p>Post not found</p>
                <button onClick={handleGoBack} className="mt-4 text-primary underline">Go back</button>
            </div>
        );
    }

    return (
        <main className="flex-1 min-w-0">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 pb-12 animate-fade-in">

                <div className="w-full flex flex-row items-center gap-3 mb-2 px-1">
                    <button
                        onClick={handleGoBack}
                        className="
                                    w-10 h-10 flex items-center justify-center rounded-full
                                    bg-surface/50 backdrop-blur-sm border border-border/50
                                    text-text-muted hover:bg-surface hover:text-text hover:border-border
                                    shadow-sm
                                    transition-all duration-200
                                ">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <span className="text-sm font-bold text-text-muted tracking-wide uppercase">Post</span>
                </div>

                <div className="w-full">
                    <Post
                        post={post}
                        isOwner={post.author === currentAuthor}
                        isDetailView
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                    />
                </div>

                <CommentSection postId={postId} />
            </div>
        </main>
    )
}
