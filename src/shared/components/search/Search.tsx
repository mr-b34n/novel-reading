import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faXmark,
    faGamepad,
    faUsers,
    faFileLines,
    faArrowRight,
    faHistory,
    faTrash,
    faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { usePostsStore } from "@/features/post";
import { useCommunitiesStore } from "@/features/community";
import { useSquadStore } from "@/features/squad";
import { performSearch } from "@/features/search";
import { formatCompactNumber } from "@/features/community/constants";

const RECENT_SEARCHES_KEY = "gamerhub_recent_searches";

export const Search = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState("");
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (saved) return JSON.parse(saved);
        } catch {
            // ignore
        }
        return ["CS2 update patch", "Raft co-op tips", "RDR2 mods"];
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Data stores
    const { posts } = usePostsStore();
    const { communities } = useCommunitiesStore();
    const { squads } = useSquadStore();

    const saveRecentSearch = (query: string) => {
        const clean = query.trim();
        if (!clean) return;
        const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
        setRecentSearches(updated);
        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {
            // ignore
        }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {
            // ignore
        }
    };

    const removeRecentSearch = (term: string) => {
        const updated = recentSearches.filter((s) => s !== term);
        setRecentSearches(updated);
        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {
            // ignore
        }
    };

    // Keyboard shortcut '/'
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Perform Search for live preview
    const searchResults = useMemo(() => {
        return performSearch(value, posts, communities, squads);
    }, [value, posts, communities, squads]);

    const handleExecuteSearch = (queryToSearch?: string) => {
        const query = (queryToSearch !== undefined ? queryToSearch : value).trim();
        if (!query) return;

        saveRecentSearch(query);
        setFocused(false);
        inputRef.current?.blur();

        navigate({
            to: "/search",
            search: { q: query, tab: "all" },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleExecuteSearch();
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-full md:max-w-md">
            {/* Search Input Bar */}
            <div
                className={`
                flex flex-row items-center gap-2.5 px-4 py-2 sm:py-2.5
                w-full
                bg-surface hover:bg-surface-hover backdrop-blur-md
                border-2 rounded-full
                shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                dark:shadow-[0_2px_14px_rgba(0,0,0,0.28)]
                transition-all duration-200 cursor-text
                ${
                    focused
                        ? "border-primary bg-surface shadow-[0_4px_20px_rgba(124,77,255,0.18)]"
                        : "border-border/60 hover:border-primary/40 dark:hover:border-primary/40"
                }
            `}
                onClick={() => inputRef.current?.focus()}
            >
                <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className={`text-sm shrink-0 transition-colors duration-150 ${
                        focused ? "text-primary" : "text-text-faint"
                    }`}
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        // Delay blur to allow clicks on dropdown items
                        setTimeout(() => setFocused(false), 200);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t("search.placeholder")}
                    className="w-full focus:outline-none bg-transparent text-sm text-text placeholder:text-text-faint"
                />

                {!focused && !value && (
                    <kbd className="hidden sm:flex shrink-0 items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-text-faint border border-border bg-surface-hover">
                        /
                    </kbd>
                )}

                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            setValue("");
                            inputRef.current?.focus();
                        }}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-text-faint hover:text-text hover:bg-surface-hover transition-colors text-xs cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                )}
            </div>

            {/* Dropdown Popover */}
            {focused && (
                <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="
                        absolute top-full left-0 mt-2 w-full z-40
                        bg-surface/95 backdrop-blur-md
                        border border-border
                        rounded-2xl overflow-hidden
                        shadow-2xl max-h-[75vh] overflow-y-auto animate-scale-up
                    "
                >
                    {/* Scenario A: Live search results when typing */}
                    {value.trim() ? (
                        <div className="flex flex-col py-2">
                            {searchResults.totalCount === 0 ? (
                                <div className="p-6 text-center text-xs text-text-muted">
                                    Không tìm thấy kết quả phù hợp cho "<span className="text-text font-bold">{value}</span>"
                                </div>
                            ) : (
                                <>
                                    {/* Games preview */}
                                    {(searchResults.games || []).length > 0 && (
                                        <div className="flex flex-col border-b border-border/60 pb-2 mb-2">
                                            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faGamepad} className="text-primary" />
                                                <span>Tựa game ({(searchResults.games || []).length})</span>
                                            </p>
                                            {searchResults.games.slice(0, 3).map((game) => (
                                                <button
                                                    key={game.id}
                                                    onClick={() => {
                                                        saveRecentSearch(game.name);
                                                        setFocused(false);
                                                        navigate({ to: `/game/${game.slug}` });
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover text-left transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={game.bannerUrl || game.logoUrl}
                                                        alt={game.name}
                                                        className="w-8 h-10 rounded-lg object-cover shrink-0"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-text truncate">
                                                            {game.name}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted">
                                                            {Array.isArray(game.genre) ? game.genre.join(", ") : (game.genre || "")} • ★ {game.ratingScore ?? 5}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Communities preview */}
                                    {(searchResults.communities || []).length > 0 && (
                                        <div className="flex flex-col border-b border-border/60 pb-2 mb-2">
                                            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faUsers} className="text-emerald-500" />
                                                <span>Cộng đồng ({(searchResults.communities || []).length})</span>
                                            </p>
                                            {searchResults.communities.slice(0, 3).map((comm) => (
                                                <button
                                                    key={comm.id}
                                                    onClick={() => {
                                                        saveRecentSearch(comm.name);
                                                        setFocused(false);
                                                        navigate({ to: `/community/${comm.id}` });
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover text-left transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={comm.logo}
                                                        alt={comm.name}
                                                        className="w-8 h-8 rounded-xl object-cover shrink-0 border border-border"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-text truncate">
                                                            {comm.name}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted">
                                                            {formatCompactNumber(comm.members)} thành viên • {comm.category}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Users preview */}
                                    {(searchResults.users || []).length > 0 && (
                                        <div className="flex flex-col border-b border-border/60 pb-2 mb-2">
                                            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faUser} className="text-cyan-500" />
                                                <span>Người dùng ({(searchResults.users || []).length})</span>
                                            </p>
                                            {searchResults.users.slice(0, 3).map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        saveRecentSearch(u.name);
                                                        setFocused(false);
                                                        navigate({ to: "/profile" });
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover text-left transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={u.avatar}
                                                        alt={u.name}
                                                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-text truncate">
                                                            {u.name}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted truncate">
                                                            {u.username} {u.game ? `• 🎮 ${u.game}` : ""}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Posts preview */}
                                    {(searchResults.posts || []).length > 0 && (
                                        <div className="flex flex-col pb-2">
                                            <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faFileLines} className="text-rose-500" />
                                                <span>Thảo luận & Bài viết ({(searchResults.posts || []).length})</span>
                                            </p>
                                            {searchResults.posts.slice(0, 3).map((post) => (
                                                <button
                                                    key={post.id}
                                                    onClick={() => {
                                                        saveRecentSearch(post.title || post.content.slice(0, 20));
                                                        setFocused(false);
                                                        navigate({ to: `/post/${post.id}` });
                                                    }}
                                                    className="flex flex-col gap-0.5 px-4 py-2 hover:bg-surface-hover text-left transition-colors cursor-pointer"
                                                >
                                                    <span className="text-xs font-bold text-text line-clamp-1">
                                                        {post.title || post.content}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted">
                                                        Đăng bởi {post.author.name} {post.communityName ? `trong ${post.communityName}` : ""}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Submit All Link */}
                                    <button
                                        type="button"
                                        onClick={() => handleExecuteSearch()}
                                        className="flex items-center justify-between px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer border-t border-primary/20"
                                    >
                                        <span>Xem tất cả {searchResults.totalCount} kết quả cho "{value}"</span>
                                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Scenario B: Recent Searches when focused but value is empty */
                        <div className="flex flex-col py-2">
                            <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faHistory} className="text-xs" />
                                    <span>Lịch sử tìm kiếm</span>
                                </span>
                                {recentSearches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearRecentSearches}
                                        className="text-[10px] font-semibold text-text-faint hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                                        <span>Xóa tất cả</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col">
                                {recentSearches.length > 0 ? (
                                    recentSearches.map((item) => (
                                        <div
                                            key={item}
                                            className="group/item flex items-center justify-between px-4 py-2 text-xs text-text hover:bg-surface-hover transition-colors"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setValue(item);
                                                    handleExecuteSearch(item);
                                                }}
                                                className="flex items-center gap-2.5 flex-1 text-left min-w-0 cursor-pointer"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faMagnifyingGlass}
                                                    className="text-xs text-text-faint shrink-0"
                                                />
                                                <span className="truncate text-text-muted group-hover/item:text-text font-medium">
                                                    {item}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeRecentSearch(item)}
                                                className="opacity-0 group-hover/item:opacity-100 p-1 text-text-faint hover:text-rose-500 transition-opacity text-xs cursor-pointer ml-2"
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-xs text-text-faint italic">
                                        Chưa có lịch sử tìm kiếm.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
