import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShareNodes,
    faCheck,
    faCircleInfo,
    faDesktop,
    faCode,
    faBuilding,
    faEye,
    faFire,
    faArrowLeft,
    faComments,
    faFolderPlus,
    faNewspaper,
    faGamepad,
} from "@fortawesome/free-solid-svg-icons";
import { faSteam } from "@fortawesome/free-brands-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { Lightbox } from "@/shared/components/ui/Lightbox";
import { useGameStore } from "../store/useGameStore";
import { usePostsStore, Post } from "@/features/post";

interface GameDetailProps {
    slug: string;
}

export const GameDetail = ({ slug }: GameDetailProps) => {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const isVietnamese = lang === "vi";

    // 1. Get game data by slug from store
    const getGameBySlug = useGameStore((state) => state.getGameBySlug);
    const game = useMemo(() => getGameBySlug(slug), [slug, getGameBySlug]);

    // 2. Store hooks
    const followedSlugs = useGameStore((state) => state.followedSlugs);
    const isFollowing = followedSlugs.includes((game?.slug || slug).toLowerCase());
    const toggleFollowGame = useGameStore((state) => state.toggleFollowGame);

    // 3. Related Posts
    const allPosts = usePostsStore((state) => state.posts);
    const relatedPosts = useMemo(() => {
        if (!game) return [];
        const gameNameLower = (game.name || "").toLowerCase();
        const gameTagLower = (game.tag || game.name || "").toLowerCase();
        const gameSlugLower = (game.slug || "").toLowerCase();
        const communityIdLower = (game.communityId || "").toString().toLowerCase();

        return allPosts.filter((p) => {
            const postTag = (p.gameTag || "").toLowerCase();
            const postCommunity = (p.communityId || "").toString().toLowerCase();
            const postTags = (p.tags || []).map((t) => t.toLowerCase());

            return (
                postTag.includes(gameTagLower) ||
                gameTagLower.includes(postTag) ||
                (communityIdLower && postCommunity === communityIdLower) ||
                postTags.some(
                    (tag) =>
                        tag.includes(gameSlugLower) ||
                        tag.includes(gameTagLower) ||
                        tag.includes(gameNameLower)
                )
            );
        });
    }, [allPosts, game]);

    // 4. UI States
    const [sysReqType, setSysReqType] = useState<"minimum" | "recommended">("minimum");
    const [copied, setCopied] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Handlers
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // Localized text resolvers
    const descriptionText = isVietnamese ? (game.descriptionVi || game.description) : game.description;
    const featuresList = isVietnamese ? (game.featuresVi || game.features) : game.features;

    return (
        <div className="w-full pb-20 animate-fade-in">
            {/* Back Navigation & Header Title */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate({ to: "/" })}
                        className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-muted hover:text-text transition-all shadow-sm cursor-pointer"
                        title={t('common.back', { defaultValue: "Quay lại" })}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>
                        <h1 className="font-bold text-xl sm:text-2xl text-text flex items-center gap-2">
                            {game.name}
                            {game.genre?.[0] && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {game.genre[0]}
                                </span>
                            )}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-text border border-border flex items-center justify-center shadow-sm transition-all relative cursor-pointer"
                        title={t('common.share', { defaultValue: "Chia sẻ" })}
                    >
                        <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} className={copied ? "text-emerald-500" : ""} />
                        {copied && (
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-surface border border-border px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-400 shadow-lg whitespace-nowrap animate-fade-in z-20">
                                {t('game.shared', { defaultValue: "Đã sao chép liên kết!" })}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* HERO BANNER & POSTER HEADER SECTION */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-border bg-surface shadow-md mb-8">
                {/* Backdrop Banner Image */}
                <div className="absolute inset-0 h-72 sm:h-96 w-full overflow-hidden pointer-events-none">
                    <img
                        src={game.bannerUrl || game.logoUrl}
                        alt={game.name}
                        className="w-full h-full object-cover object-top sm:object-center opacity-90"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
                    <div className="absolute inset-0 bg-linear-to-r from-surface/40 via-transparent to-transparent" />
                </div>

                {/* Banner Artwork Spacer */}
                <div className="h-32 sm:h-44 w-full relative z-10" />

                {/* Content Overlay */}
                <div className="relative z-10 p-5 sm:p-8 pt-0 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        {/* Poster Logo + Title & Genres */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-surface bg-surface shadow-2xl shrink-0 p-1">
                                <img
                                    src={game.logoUrl}
                                    alt={game.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>

                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    {game.genre?.map((g) => (
                                        <span key={g} className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-surface/90 backdrop-blur-md text-text-muted border border-border/60 shadow-sm">
                                            {g}
                                        </span>
                                    ))}
                                    {game.activePlayers !== undefined && game.activePlayers > 0 && (
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            {t('game.activePlayers', { count: game.activePlayers.toLocaleString() })}
                                        </span>
                                    )}
                                </div>
                                
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight drop-shadow-sm">
                                    {game.name}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Game Specs Bar: Developer, Publisher, Release Date, Platforms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4 px-5 bg-surface-hover/60 rounded-2xl border border-border/60 text-xs sm:text-sm">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-text-faint flex items-center gap-1.5 mb-1">
                                <FontAwesomeIcon icon={faBuilding} className="text-primary shrink-0" />
                                <span>{t('game.developer', { defaultValue: "Nhà phát triển" })}</span>
                            </span>
                            <span className="font-semibold text-text leading-snug break-words">{game.developer}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-text-faint flex items-center gap-1.5 mb-1">
                                <FontAwesomeIcon icon={faCode} className="text-brand-400 shrink-0" />
                                <span>{t('game.publisher', { defaultValue: "Nhà xuất bản" })}</span>
                            </span>
                            <span className="font-semibold text-text leading-snug break-words">{game.publisher}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-text-faint flex items-center gap-1.5 mb-1">
                                <FontAwesomeIcon icon={faCircleInfo} className="text-amber-400 shrink-0" />
                                <span>{t('game.releaseDate', { defaultValue: "Ngày phát hành" })}</span>
                            </span>
                            <span className="font-semibold text-text leading-snug break-words">{game.releaseDate}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-text-faint flex items-center gap-1.5 mb-1">
                                <FontAwesomeIcon icon={faDesktop} className="text-emerald-400 shrink-0" />
                                <span>{t('game.platforms', { defaultValue: "Nền tảng" })}</span>
                            </span>
                            <span className="font-semibold text-text leading-snug break-words">{game.platforms?.join(", ")}</span>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => toggleFollowGame(game.slug)}
                                className={`flex-1 sm:flex-initial px-4.5 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                                    isFollowing
                                        ? "bg-primary text-white hover:bg-primary-hover shadow-primary/25"
                                        : "bg-surface-hover hover:bg-border/80 text-text border border-border"
                                }`}
                            >
                                <FontAwesomeIcon icon={isFollowing ? faCheck : faFolderPlus} className={isFollowing ? "text-white" : "text-primary"} />
                                <span>{isFollowing ? t('game.following', { defaultValue: "Đã theo dõi" }) : t('game.follow', { defaultValue: "Theo dõi" })}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => window.open(game.steamUrl || `https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`, '_blank')}
                                className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl font-semibold text-sm bg-surface-hover hover:bg-border/80 text-text border border-border flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faSteam} className="text-text-muted text-base" />
                                <span>{t('game.steamStore', { defaultValue: "Cửa hàng Steam" })}</span>
                            </button>

                            {game.communityId && (
                                <button
                                    type="button"
                                    onClick={() => navigate({ to: `/community/${game.communityId}` })}
                                    className="flex-1 sm:flex-initial px-4.5 py-2 rounded-xl font-semibold text-sm bg-accent-500 hover:bg-accent-600 text-white flex items-center justify-center gap-2 shadow-md shadow-accent-500/25 transition-all cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faComments} />
                                    <span>{t('game.joinCommunity', { defaultValue: "Tham gia Cộng đồng" })}</span>
                                </button>
                            )}
                        </div>

                        <div className="text-xs font-semibold text-text-muted self-center ml-auto hidden md:flex items-center gap-2 bg-surface-hover px-3.5 py-2 rounded-xl border border-border/60">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>{t('game.verifiedHub', { defaultValue: "Trang thông tin chính thức" })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT LAYOUT */}
            <div className="flex flex-col gap-8 min-w-0">
                {/* 1. GAME STORY & FEATURES CARD */}
                <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                        <h3 className="font-bold text-lg sm:text-xl text-text flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                                <FontAwesomeIcon icon={faCircleInfo} />
                            </span>
                            <span>{t('game.tabOverview', { defaultValue: "Tổng quan" })} & Features</span>
                        </h3>
                        {game.genre?.[0] && (
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full shrink-0">
                                {game.genre.join(" • ")}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-text-muted text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                        {descriptionText}
                    </p>

                    {featuresList && featuresList.length > 0 && (
                        <div>
                            <h4 className="font-bold text-text text-base mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFire} className="text-amber-500" />
                                <span>{t('game.featuresTitle', { defaultValue: "Đặc điểm nổi bật" })}</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {featuresList.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-hover/50 border border-border/50 text-sm text-text-muted">
                                        <span className="w-6 h-6 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                        </span>
                                        <span className="font-medium text-text break-words">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screenshots Gallery */}
                    {game.screenshots && game.screenshots.length > 0 && (
                        <div className="pt-6 border-t border-border/60">
                            <h4 className="font-bold text-text text-base mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faDesktop} className="text-primary" />
                                <span>{t('game.screenshotsTitle', { defaultValue: "Hình ảnh xem trước" })}</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {game.screenshots.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setLightboxIndex(idx)}
                                        className="rounded-2xl overflow-hidden border border-border/80 group aspect-video relative bg-surface-hover shadow-sm cursor-pointer"
                                    >
                                        <img src={img} alt={`${game.name} screenshot ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <FontAwesomeIcon icon={faEye} className="text-white text-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. SYSTEM REQUIREMENTS CARD */}
                {game.systemReqs && (
                    <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                            <h3 className="font-bold text-lg sm:text-xl text-text flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-brand-400/10 text-brand-400 flex items-center justify-center text-sm shrink-0">
                                    <FontAwesomeIcon icon={faCode} />
                                </span>
                                <span>{t('game.systemReqsTitle', { defaultValue: "Cấu hình hệ thống" })}</span>
                            </h3>
                            <div className="grid grid-cols-2 p-1 bg-surface-hover rounded-xl border border-border/80 w-full sm:w-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSysReqType("minimum")}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center ${sysReqType === "minimum" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"}`}
                                >
                                    {t('game.minimumReqs', { defaultValue: "Tối thiểu" })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSysReqType("recommended")}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center ${sysReqType === "recommended" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"}`}
                                >
                                    {t('game.recommendedReqs', { defaultValue: "Khuyên dùng" })}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(game.systemReqs[sysReqType]).map(([key, val]) => (
                                <div key={key} className="flex flex-col p-4 rounded-2xl bg-surface-hover/40 border border-border/50">
                                    <span className="font-semibold uppercase tracking-wider text-text-faint text-[11px] mb-1">{key}</span>
                                    <span className="text-text font-medium text-sm leading-relaxed break-words">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. RELATED POSTS SECTION */}
                <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-base shrink-0 border border-primary/20">
                                <FontAwesomeIcon icon={faNewspaper} />
                            </span>
                            <div>
                                <h3 className="font-bold text-lg sm:text-xl text-text flex items-center gap-2">
                                    <span>{t('game.relatedPosts', { defaultValue: "Bài viết liên quan" })}</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                        {relatedPosts.length}
                                    </span>
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {t('game.relatedPostsSub', { defaultValue: "Các bài thảo luận & cập nhật mới nhất từ cộng đồng về " }) + game.name}
                                </p>
                            </div>
                        </div>

                        {game.communityId && (
                            <button
                                type="button"
                                onClick={() => navigate({ to: `/community/${game.communityId}` })}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface-hover hover:bg-border/80 text-text border border-border transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faComments} />
                                <span>{t('game.viewCommunityFeed', { defaultValue: "Xem Bảng tin Cộng đồng" })}</span>
                            </button>
                        )}
                    </div>

                    {relatedPosts.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {relatedPosts.map((post) => (
                                <Post key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="w-full bg-surface-hover/30 rounded-2xl border border-border/60 p-8 text-center text-text-muted flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-text-faint text-xl">
                                <FontAwesomeIcon icon={faGamepad} />
                            </div>
                            <span className="font-semibold text-sm">
                                {t('game.noRelatedPosts', { defaultValue: "Chưa có bài viết liên quan cho trò chơi này." })}
                            </span>
                            <p className="text-xs text-text-faint max-w-sm">
                                {t('game.noRelatedPostsSub', { defaultValue: "Hãy là người đầu tiên thảo luận hoặc đăng tin tức về trò chơi này!" })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox for Screenshots */}
            {lightboxIndex !== null && game.screenshots && game.screenshots.length > 0 && (
                <Lightbox
                    images={game.screenshots}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
};
