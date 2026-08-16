import { type GameData } from "@/features/game/types";
import { type CommunityData } from "@/features/community/types";
import { type Post } from "@/features/post/types";

export type SearchTabCategory = "all" | "games" | "communities" | "posts" | "users";

export interface SearchUser {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
    status: "online" | "in-game" | "offline";
    game?: string | null;
    isFriend?: boolean;
}

export interface PaginationInfo {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

export interface SearchMeta {
    totalPosts: number;
    totalUsers: number;
    totalCommunities: number;
    totalGames: number;
}

export interface SearchResults {
    games: GameData[];
    communities: CommunityData[];
    posts: Post[];
    users: SearchUser[];
    squads?: unknown[];
    totalCount: number;
}

export interface SearchResponse {
    success: boolean;
    query: string;
    type: SearchTabCategory;
    pagination: PaginationInfo;
    data: {
        posts: Post[];
        users: SearchUser[];
        communities: CommunityData[];
        games: GameData[];
    };
    meta: SearchMeta;
    error?: string;
}
