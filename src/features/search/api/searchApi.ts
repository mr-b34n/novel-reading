import { performSearchAPI } from "../helpers/performSearch";
import { type SearchTabCategory, type SearchResponse, type SearchUser } from "../types";
import { type Post } from "@/features/post/types";
import { type CommunityData } from "@/features/community/types";
import { type GameData } from "@/features/game/types";

export async function fetchSearchResults(
    query: string,
    type: SearchTabCategory = "all",
    page: number = 1,
    size: number = 10,
    clientContext?: {
        posts?: Post[];
        communities?: CommunityData[];
        users?: SearchUser[];
        customGames?: GameData[];
    }
): Promise<SearchResponse> {
    try {
        const params = new URLSearchParams({
            q: query,
            type,
            page: String(page),
            size: String(size),
        });

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
            const data = (await res.json()) as SearchResponse;
            if (data && typeof data.success === "boolean") {
                return data;
            }
        }
    } catch {
        // Fallback to in-memory search if API call fails or runs purely client-side
    }

    return performSearchAPI(
        query,
        type,
        page,
        size,
        clientContext?.posts,
        clientContext?.communities,
        clientContext?.users,
        clientContext?.customGames
    );
}
