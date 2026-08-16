import { useState, useEffect, useTransition } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faGamepad,
    faUsers,
    faFileLines,
    faUserCheck,
    faUserPlus,
    faXmark,
    faCheck,
    faPlus,
    faChevronRight,
    faFilter,
    faWandMagicSparkles,
    faChevronLeft,
    faUser,
    faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { usePostsStore } from "@/features/post";
import { useCommunitiesStore } from "@/features/community";
import { useGameStore } from "@/features/game";
import { fetchSearchResults } from "../api/searchApi";
import { MOCK_USERS } from "../mockUsers";
import { type SearchTabCategory, type SearchResponse, type SearchUser } from "../types";
import { formatCompactNumber } from "@/features/community/constants";

const POPULAR_TAGS = [
    "#cs2",
    "#fps",
    "#survival",
    "#raft",
    "#esports",
    "#rdr2",
    "#ghostrider",
    "#s1mple",
    "#highlight",
    "#mods",
];

export const SearchResultsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const searchParams = useSearch({ strict: false }) as {
        q?: string;
        tab?: SearchTabCategory;
        type?: SearchTabCategory;
        page?: number;
        size?: number;
    };

    const initialQuery = searchParams.q || "";
    const activeTab = searchParams.type || searchParams.tab || "all";
    const currentPage = Number(searchParams.page) || 1;
    const pageSize = Number(searchParams.size) || 10;

    const [inputValue, setInputValue] = useState(initialQuery);
    const [, startTransition] = useTransition();

    // Data stores for client fallback context
    const { posts } = usePostsStore();
    const { communities, toggleJoinCommunity } = useCommunitiesStore();
    const { followedSlugs, toggleFollowGame } = useGameStore();

    // Local state for friends management in user search results
    const [usersList, setUsersList] = useState<SearchUser[]>(MOCK_USERS);

    // Response state from API
    const [searchData, setSearchData] = useState<SearchResponse>({
        success: true,
        query: initialQuery,
        type: activeTab,
        pagination: {
            page: currentPage,
            size: pageSize,
            total: 0,
            totalPages: 0,
            hasMore: false,
        },
        data: {
            posts: [],
            users: [],
            communities: [],
            games: [],
        },
        meta: {
            totalPosts: 0,
            totalUsers: 0,
            totalCommunities: 0,
            totalGames: 0,
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    // Sync input value when route search params change
    useEffect(() => {
        if (searchParams.q !== undefined) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInputValue(searchParams.q);
        }
    }, [searchParams.q]);

    // Fetch search results from /api/search
    useEffect(() => {
        let isMounted = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);

        fetchSearchResults(initialQuery, activeTab, currentPage, pageSize, {
            posts,
            communities,
            users: usersList,
        }).then((res) => {
            if (isMounted) {
                setSearchData(res);
                setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [initialQuery, activeTab, currentPage, pageSize, posts, communities, usersList]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = inputValue.trim();
        startTransition(() => {
            navigate({
                to: "/search",
                search: { q: clean, type: activeTab, page: 1, size: pageSize },
            });
        });
    };

    const handleTagClick = (tag: string) => {
        const cleanTag = tag.replace("#", "");
        setInputValue(cleanTag);
        startTransition(() => {
            navigate({
                to: "/search",
                search: { q: cleanTag, type: "all", page: 1, size: pageSize },
            });
        });
    };

    const handleTabChange = (type: SearchTabCategory) => {
        startTransition(() => {
            navigate({
                to: "/search",
                search: { q: inputValue, type, page: 1, size: pageSize },
            });
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > searchData.pagination.totalPages) return;
        startTransition(() => {
            navigate({
                to: "/search",
                search: { q: inputValue, type: activeTab, page: newPage, size: pageSize },
            });
        });
    };

    const handleSizeChange = (newSize: number) => {
        startTransition(() => {
            navigate({
                to: "/search",
                search: { q: inputValue, type: activeTab, page: 1, size: newSize },
            });
        });
    };

    const toggleFriendStatus = (userId: string) => {
        setUsersList((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, isFriend: !u.isFriend } : u))
        );
    };

    const tabsList: {
        key: SearchTabCategory;
        label: string;
        icon: import("@fortawesome/fontawesome-svg-core").IconDefinition;
        count: number;
    }[] = [
        { key: "all", label: t("search.tabAll"), icon: faFilter, count: searchData.pagination.total },
        { key: "games", label: t("search.tabGames"), icon: faGamepad, count: searchData.meta.totalGames },
        { key: "communities", label: t("search.tabCommunities"), icon: faUsers, count: searchData.meta.totalCommunities },
        { key: "posts", label: t("search.tabPosts"), icon: faFileLines, count: searchData.meta.totalPosts },
        { key: "users", label: t("search.tabUsers"), icon: faUser, count: searchData.meta.totalUsers },
    ];

    const { posts: resPosts, users: resUsers, communities: resCommunities, games: resGames } = searchData.data;

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-4 px-3 sm:px-6">
            {/* Top Search Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-surface p-5 sm:p-8 shadow-lg border border-border">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-text">
                                {t("search.title")}
                            </h1>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-hover border border-border text-[11px] font-bold text-text-muted">
                            <FontAwesomeIcon icon={faGlobe} className="text-primary" />
                            <span>GET /api/search</span>
                        </div>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                        <div className="flex items-center gap-2 w-full bg-surface-hover/80 border border-border rounded-2xl px-4 py-3 shadow-inner focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-text-faint text-base" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={t("search.placeholder")}
                                className="w-full bg-transparent text-text placeholder:text-text-faint text-sm sm:text-base font-medium focus:outline-none"
                            />
                            {inputValue && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputValue("");
                                        startTransition(() => {
                                            navigate({ to: "/search", search: { q: "", type: activeTab, page: 1, size: pageSize } });
                                        });
                                    }}
                                    className="p-1 rounded-full text-text-faint hover:text-text hover:bg-surface transition-colors text-xs"
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="shrink-0 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                            >
                                {t("search.searchBtn")}
                            </button>
                        </div>
                    </form>

                    {/* Popular Tags */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-xs font-bold text-text-faint flex items-center gap-1 shrink-0">
                            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-amber-400 text-xs" />
                            {t("search.hotKeywords")}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {POPULAR_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagClick(tag)}
                                    className="px-2.5 py-1 rounded-full bg-surface-hover hover:bg-primary/10 hover:text-primary text-text-muted text-xs font-semibold transition-all cursor-pointer"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Category Tabs (Games, Communities, Posts, Users) */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-2 shrink-0">
                    {tabsList.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                        : "bg-surface hover:bg-surface-hover text-text-muted hover:text-text border border-border"
                                }`}
                            >
                                <FontAwesomeIcon icon={tab.icon} className={isActive ? "text-white" : "text-text-faint"} />
                                <span>{tab.label}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        isActive ? "bg-white/20 text-white" : "bg-surface-hover text-text-faint"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Page Size selector */}
                <div className="hidden md:flex items-center gap-2 shrink-0 text-xs font-medium text-text-muted bg-surface px-3 py-1.5 rounded-2xl border border-border">
                    <span>{t("search.pageSize")}:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => handleSizeChange(Number(e.target.value))}
                        className="bg-transparent text-text font-bold focus:outline-none cursor-pointer"
                    >
                        <option value={5} className="bg-surface text-text">5</option>
                        <option value={10} className="bg-surface text-text">10</option>
                        <option value={20} className="bg-surface text-text">20</option>
                    </select>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="flex items-center justify-center p-8 text-primary gap-2 font-bold text-sm">
                    <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Đang tìm kiếm...</span>
                </div>
            )}

            {/* Results Section */}
            {!isLoading && (
                !inputValue.trim() ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-3xl border border-border text-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-2">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </div>
                        <h3 className="text-lg font-bold text-text">Hãy nhập từ khóa để tìm kiếm</h3>
                        <p className="text-sm text-text-muted max-w-md">
                            Bạn có thể tìm kiếm tựa game, cộng đồng thảo luận, bài viết kinh nghiệm hoặc tài khoản người dùng trên hệ thống.
                        </p>
                    </div>
                ) : searchData.pagination.total === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-3xl border border-border text-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl font-bold mb-2">
                            <FontAwesomeIcon icon={faXmark} />
                        </div>
                        <h3 className="text-lg font-bold text-text">{t("search.noResultsTitle")}</h3>
                        <p className="text-sm text-text-muted max-w-md">
                            {t("search.noResultsDesc")}
                        </p>
                    </div>
                ) : (
                <div className="flex flex-col gap-8">
                    {/* 🎮 GAMES SECTION */}
                    {(activeTab === "all" || activeTab === "games") && resGames.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGamepad} className="text-primary" />
                                    <span>Games ({searchData.meta.totalGames})</span>
                                </h2>
                                {activeTab === "all" && searchData.meta.totalGames > 3 && (
                                    <button
                                        onClick={() => handleTabChange("games")}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Xem tất cả</span>
                                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                {resGames.map((game) => {
                                    const isFollowed = followedSlugs.includes(game.slug.toLowerCase());
                                    return (
                                        <div
                                            key={game.slug}
                                            onClick={() => navigate({ to: `/game/${game.slug}` })}
                                            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer shadow-xs hover:shadow-md"
                                        >
                                            <div className="flex gap-3">
                                                <img
                                                    src={game.bannerUrl || game.logoUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80"}
                                                    alt={game.name}
                                                    className="w-16 h-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                                                />
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                                        {Array.isArray(game.genre) ? game.genre.join(", ") : game.genre || ""}
                                                    </span>
                                                    <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
                                                        {game.name}
                                                    </h3>
                                                    <p className="text-xs text-text-muted line-clamp-2">
                                                        {game.descriptionVi || game.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/60">
                                                <span className="text-[11px] font-medium text-text-faint">
                                                    ★ {game.ratingScore ?? 5} / 5
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFollowGame(game.slug);
                                                    }}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                        isFollowed
                                                            ? "bg-surface-hover text-text-muted hover:text-text"
                                                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={isFollowed ? faCheck : faPlus} className="text-[10px]" />
                                                    <span>{isFollowed ? "Đã theo dõi" : "Theo dõi"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 🌐 COMMUNITIES SECTION */}
                    {(activeTab === "all" || activeTab === "communities") && resCommunities.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUsers} className="text-emerald-500" />
                                    <span>Cộng Đồng ({searchData.meta.totalCommunities})</span>
                                </h2>
                                {activeTab === "all" && searchData.meta.totalCommunities > 3 && (
                                    <button
                                        onClick={() => handleTabChange("communities")}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Xem tất cả</span>
                                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                {resCommunities.map((comm) => {
                                    return (
                                        <div
                                            key={comm.id}
                                            onClick={() => navigate({ to: `/community/${comm.id}` })}
                                            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer shadow-xs hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={comm.logo || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80"}
                                                    alt={comm.name}
                                                    className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-border group-hover:scale-105 transition-transform"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors truncate">
                                                        {comm.name}
                                                    </h3>
                                                    <span className="text-[11px] text-text-muted">
                                                        {formatCompactNumber(comm.members)} thành viên
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-text-muted mt-2 line-clamp-2">
                                                {comm.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/60">
                                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    {comm.category}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleJoinCommunity(comm.id);
                                                    }}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                        comm.joined
                                                            ? "bg-surface-hover text-text-muted hover:text-text"
                                                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={comm.joined ? faCheck : faPlus} className="text-[10px]" />
                                                    <span>{comm.joined ? "Đã tham gia" : "Tham gia"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 👤 USERS SECTION (Target: Users) */}
                    {(activeTab === "all" || activeTab === "users") && resUsers.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUser} className="text-cyan-500" />
                                    <span>{t("search.usersTitle", { count: searchData.meta.totalUsers })}</span>
                                </h2>
                                {activeTab === "all" && searchData.meta.totalUsers > 4 && (
                                    <button
                                        onClick={() => handleTabChange("users")}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Xem tất cả</span>
                                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {resUsers.map((u) => {
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => navigate({ to: "/profile" })}
                                            className="group flex flex-col justify-between p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer shadow-xs hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={u.avatar}
                                                            alt={u.name}
                                                            className="w-12 h-12 rounded-2xl object-cover border border-border group-hover:scale-105 transition-transform"
                                                        />
                                                        <span
                                                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                                                                u.status === "online"
                                                                    ? "bg-emerald-500"
                                                                    : u.status === "in-game"
                                                                    ? "bg-amber-500"
                                                                    : "bg-gray-400"
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors truncate">
                                                            {u.name}
                                                        </h3>
                                                        <span className="text-xs text-text-faint font-medium">
                                                            {u.username}
                                                        </span>
                                                        {u.game && (
                                                            <span className="text-[10px] font-bold text-amber-500 mt-0.5">
                                                                🎮 {u.game}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFriendStatus(u.id);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                                        u.isFriend
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={u.isFriend ? faUserCheck : faUserPlus} className="text-[10px]" />
                                                    <span>{u.isFriend ? t("search.friend") : t("search.addFriend")}</span>
                                                </button>
                                            </div>

                                            {u.bio && (
                                                <p className="text-xs text-text-muted mt-2.5 line-clamp-2 leading-relaxed">
                                                    {u.bio}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-end pt-3 mt-2 border-t border-border/60">
                                                <span className="text-xs font-bold text-primary hover:underline">
                                                    {t("search.viewProfile")} →
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 📝 POSTS SECTION */}
                    {(activeTab === "all" || activeTab === "posts") && resPosts.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileLines} className="text-rose-500" />
                                    <span>Bài Viết ({searchData.meta.totalPosts})</span>
                                </h2>
                                {activeTab === "all" && searchData.meta.totalPosts > 5 && (
                                    <button
                                        onClick={() => handleTabChange("posts")}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Xem tất cả</span>
                                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {resPosts.map((post) => {
                                    return (
                                        <div
                                            key={post.id}
                                            onClick={() => navigate({ to: `/post/${post.id}` })}
                                            className="group flex flex-col p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-border transition-all cursor-pointer shadow-xs hover:shadow-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <img
                                                        src={post.author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"}
                                                        alt={post.author.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                                                            {post.author.name}
                                                        </span>
                                                        <span className="text-[10px] text-text-faint">
                                                            {post.timestamp}
                                                        </span>
                                                    </div>
                                                </div>

                                                {post.communityName && (
                                                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                                                        {post.communityName}
                                                    </span>
                                                )}
                                            </div>

                                            {post.title && (
                                                <h3 className="text-sm font-bold text-text mt-2.5 line-clamp-1">
                                                    {post.title}
                                                </h3>
                                            )}

                                            <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                                                {post.content}
                                            </p>

                                            <div className="flex items-center gap-4 pt-3 mt-2 text-xs text-text-faint font-medium">
                                                <span>❤️ {post.likes} Lượt thích</span>
                                                <span>💬 {post.commentsCount || 0} Bình luận</span>
                                                {post.hashtags && post.hashtags.length > 0 && (
                                                    <div className="flex items-center gap-1.5 ml-auto">
                                                        {post.hashtags.map((h) => (
                                                            <span key={h} className="text-[10px] font-semibold text-primary">
                                                                {h}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {searchData.pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border mt-4">
                            <span className="text-xs font-medium text-text-muted">
                                {t("search.pagination", {
                                    page: searchData.pagination.page,
                                    totalPages: searchData.pagination.totalPages,
                                    total: searchData.pagination.total,
                                })}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={searchData.pagination.page <= 1}
                                    onClick={() => handlePageChange(searchData.pagination.page - 1)}
                                    className="px-3 py-1.5 rounded-xl bg-surface-hover border border-border text-xs font-bold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                                    <span>{t("search.prevPage")}</span>
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: searchData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => handlePageChange(p)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                p === searchData.pagination.page
                                                    ? "bg-primary text-white"
                                                    : "bg-surface-hover text-text-muted hover:text-text"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    disabled={!searchData.pagination.hasMore}
                                    onClick={() => handlePageChange(searchData.pagination.page + 1)}
                                    className="px-3 py-1.5 rounded-xl bg-surface-hover border border-border text-xs font-bold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>{t("search.nextPage")}</span>
                                    <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
            )}
        </div>
    );
};
