import { INITIAL_GAMES } from "@/features/game/constants";
import { type GameData } from "@/features/game/types";
import { type CommunityData } from "@/features/community/types";
import { type Post } from "@/features/post/types";
import { MOCK_USERS } from "../mockUsers";
import {
    type SearchUser,
    type SearchTabCategory,
    type SearchResponse,
    type SearchResults,
} from "../types";

export function performSearchAPI(
    query: string,
    type: SearchTabCategory = "all",
    page: number = 1,
    size: number = 10,
    allPosts: Post[] = [],
    allCommunities: CommunityData[] = [],
    allUsers: SearchUser[] = MOCK_USERS,
    customGames: GameData[] = []
): SearchResponse {
    const q = (query || "").trim().toLowerCase();
    const currentPage = Math.max(1, page);
    const pageSize = Math.min(50, Math.max(1, size));

    const safePosts = Array.isArray(allPosts) ? allPosts : [];
    const safeCommunities = Array.isArray(allCommunities) ? allCommunities : [];
    const safeUsers = Array.isArray(allUsers) && allUsers.length > 0 ? allUsers : MOCK_USERS;
    const safeCustomGames = Array.isArray(customGames) ? customGames : [];

    // Empty query handling or invalid validation
    if (!q) {
        return {
            success: true,
            query: "",
            type,
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
        };
    }

    // 1. Target: Games
    const gamesList = [
        ...INITIAL_GAMES,
        ...safeCustomGames.filter(
            (cg) => cg && cg.slug && !INITIAL_GAMES.some((g) => g.slug === cg.slug)
        ),
    ];
    const matchedGames = gamesList.filter((game) => {
        if (!game) return false;
        const nameMatch = game.name?.toLowerCase().includes(q) ?? false;
        const tagMatch =
            (game as Record<string, unknown>).tags &&
            Array.isArray((game as Record<string, unknown>).tags)
                ? ((game as Record<string, unknown>).tags as unknown[]).some(
                      (t) => typeof t === "string" && t.toLowerCase().includes(q)
                  )
                : false;
        const genreMatch = Array.isArray(game.genre)
            ? game.genre.some((g) => typeof g === "string" && g.toLowerCase().includes(q))
            : typeof game.genre === "string"
            ? (game.genre as string).toLowerCase().includes(q)
            : false;
        const devMatch = typeof game.developer === "string" ? game.developer.toLowerCase().includes(q) : false;
        const pubMatch = typeof game.publisher === "string" ? game.publisher.toLowerCase().includes(q) : false;
        const descMatch = typeof game.description === "string" ? game.description.toLowerCase().includes(q) : false;
        return nameMatch || tagMatch || genreMatch || devMatch || pubMatch || descMatch;
    });

    // 2. Target: Communities
    const matchedCommunities = safeCommunities.filter((c) => {
        if (!c) return false;
        const nameMatch = c.name?.toLowerCase().includes(q) ?? false;
        const descMatch = c.description?.toLowerCase().includes(q) ?? false;
        const catMatch = c.category?.toLowerCase().includes(q) ?? false;
        const tagMatch = c.tags?.some((t) => t?.toLowerCase().includes(q)) ?? false;
        return nameMatch || descMatch || catMatch || tagMatch;
    });

    // 3. Target: Posts
    const matchedPosts = safePosts.filter((post) => {
        if (!post) return false;
        const titleMatch = post.title?.toLowerCase().includes(q) ?? false;
        const contentMatch = post.content?.toLowerCase().includes(q) ?? false;
        const authorMatch = post.author?.name?.toLowerCase().includes(q) ?? false;
        const hashtagMatch = post.hashtags?.some((h) => h?.toLowerCase().includes(q)) ?? false;
        const communityMatch = post.communityName?.toLowerCase().includes(q) ?? false;
        return titleMatch || contentMatch || authorMatch || hashtagMatch || communityMatch;
    });

    // 4. Target: Users
    const matchedUsers = safeUsers.filter((u) => {
        if (!u) return false;
        const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
        const userMatch = u.username?.toLowerCase().includes(q) ?? false;
        const bioMatch = u.bio?.toLowerCase().includes(q) ?? false;
        const gameMatch = u.game?.toLowerCase().includes(q) ?? false;
        return nameMatch || userMatch || bioMatch || gameMatch;
    });

    const meta = {
        totalPosts: matchedPosts.length,
        totalUsers: matchedUsers.length,
        totalCommunities: matchedCommunities.length,
        totalGames: matchedGames.length,
    };

    let totalItems: number;
    let paginatedPosts: Post[] = [];
    let paginatedUsers: SearchUser[] = [];
    let paginatedCommunities: CommunityData[] = [];
    let paginatedGames: GameData[] = [];

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    if (type === "posts") {
        totalItems = matchedPosts.length;
        paginatedPosts = matchedPosts.slice(startIndex, endIndex);
    } else if (type === "users") {
        totalItems = matchedUsers.length;
        paginatedUsers = matchedUsers.slice(startIndex, endIndex);
    } else if (type === "communities") {
        totalItems = matchedCommunities.length;
        paginatedCommunities = matchedCommunities.slice(startIndex, endIndex);
    } else if (type === "games") {
        totalItems = matchedGames.length;
        paginatedGames = matchedGames.slice(startIndex, endIndex);
    } else {
        totalItems = meta.totalPosts + meta.totalUsers + meta.totalCommunities + meta.totalGames;
        paginatedPosts = matchedPosts.slice(0, Math.ceil(pageSize / 4));
        paginatedUsers = matchedUsers.slice(0, Math.ceil(pageSize / 4));
        paginatedCommunities = matchedCommunities.slice(0, Math.ceil(pageSize / 4));
        paginatedGames = matchedGames.slice(0, Math.ceil(pageSize / 4));
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const hasMore = currentPage < totalPages;

    return {
        success: true,
        query: q,
        type,
        pagination: {
            page: currentPage,
            size: pageSize,
            total: totalItems,
            totalPages: totalItems === 0 ? 0 : totalPages,
            hasMore: totalItems === 0 ? false : hasMore,
        },
        data: {
            posts: paginatedPosts,
            users: paginatedUsers,
            communities: paginatedCommunities,
            games: paginatedGames,
        },
        meta,
    };
}

export function performSearch(
    query: string,
    allPosts: Post[] = [],
    allCommunities: CommunityData[] = [],
    _allSquads: unknown[] = [],
    customGames: GameData[] = []
): SearchResults {
    void _allSquads;
    const res = performSearchAPI(query, "all", 1, 50, allPosts, allCommunities, MOCK_USERS, customGames);
    return {
        games: res.data.games || [],
        communities: res.data.communities || [],
        posts: res.data.posts || [],
        users: res.data.users || [],
        squads: [],
        totalCount: res.pagination.total || 0,
    };
}
