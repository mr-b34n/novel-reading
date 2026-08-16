import { create } from "zustand";
import { type GameData, type GameGuide, type GameReview } from "../types";
import { INITIAL_GAMES, getGameBySlug as fallbackGetGameBySlug } from "../constants";

const STORAGE_KEY = "indieg_games_data";

const loadInitialGames = (): GameData[] => {
    if (typeof window === "undefined") return INITIAL_GAMES;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // Fallback to INITIAL_GAMES on parse error
    }
    return INITIAL_GAMES;
};

const saveGamesToStorage = (games: GameData[]) => {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        } catch {
            // Ignore quota errors
        }
    }
};

interface GameStoreState {
    games: GameData[];
    followedSlugs: string[];
    quickAccessSlugs: string[];
    customGuides: Record<string, GameGuide[]>; // slug -> guides
    customReviews: Record<string, GameReview[]>; // slug -> reviews
    
    getGameBySlug: (slug: string) => GameData;
    addGame: (game: GameData) => void;
    updateGame: (slug: string, updates: Partial<GameData>) => void;
    deleteGame: (slug: string) => void;

    toggleFollowGame: (slug: string) => void;
    setQuickAccessSlugs: (slugs: string[]) => void;
    isFollowing: (slug: string) => boolean;
    addGuide: (slug: string, guide: Omit<GameGuide, "id" | "date" | "likes" | "views">) => void;
    addReview: (slug: string, review: Omit<GameReview, "id" | "date" | "likes">) => void;
    likeGuide: (slug: string, guideId: string) => void;
    likeReview: (slug: string, reviewId: string) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
    games: loadInitialGames(),
    followedSlugs: ["counter-strike-2", "raft", "red-dead-redemption-2", "grand-theft-auto-v", "elden-ring"],
    quickAccessSlugs: ["raft", "red-dead-redemption-2", "counter-strike-2", "grand-theft-auto-v"],
    customGuides: {},
    customReviews: {},

    getGameBySlug: (slug: string) => {
        if (!slug) return get().games[0] || INITIAL_GAMES[0];
        const cleanSlug = slug.trim().toLowerCase();
        const found = get().games.find(
            (g) =>
                g.slug === cleanSlug ||
                g.id === cleanSlug ||
                g.aliases?.includes(cleanSlug) ||
                g.tag.toLowerCase() === cleanSlug.replace(/-/g, " ")
        );
        if (found) return found;
        return fallbackGetGameBySlug(cleanSlug);
    },

    addGame: (newGame: GameData) => {
        set((state) => {
            const exists = state.games.some((g) => g.slug === newGame.slug);
            const updated = exists
                ? state.games.map((g) => (g.slug === newGame.slug ? { ...g, ...newGame } : g))
                : [newGame, ...state.games];
            saveGamesToStorage(updated);
            return { games: updated };
        });
    },

    updateGame: (slug: string, updates: Partial<GameData>) => {
        const cleanSlug = slug.trim().toLowerCase();
        set((state) => {
            const updated = state.games.map((g) =>
                g.slug === cleanSlug || g.id === cleanSlug ? { ...g, ...updates } : g
            );
            saveGamesToStorage(updated);
            return { games: updated };
        });
    },

    deleteGame: (slug: string) => {
        const cleanSlug = slug.trim().toLowerCase();
        set((state) => {
            const updated = state.games.filter((g) => g.slug !== cleanSlug && g.id !== cleanSlug);
            saveGamesToStorage(updated);
            return { games: updated };
        });
    },

    toggleFollowGame: (slug: string) => {
        const cleanSlug = slug.toLowerCase();
        set((state) => {
            const exists = state.followedSlugs.includes(cleanSlug);
            return {
                followedSlugs: exists
                    ? state.followedSlugs.filter((s) => s !== cleanSlug)
                    : [...state.followedSlugs, cleanSlug],
            };
        });
    },

    setQuickAccessSlugs: (slugs: string[]) => {
        set({ quickAccessSlugs: slugs.slice(0, 4) });
    },

    isFollowing: (slug: string) => {
        return get().followedSlugs.includes(slug.toLowerCase());
    },

    addGuide: (slug, guide) => {
        const cleanSlug = slug.toLowerCase();
        const newGuide: GameGuide = {
            ...guide,
            id: `guide-custom-${Date.now()}`,
            likes: 1,
            views: 1,
            date: "Vừa xong",
        };
        set((state) => ({
            customGuides: {
                ...state.customGuides,
                [cleanSlug]: [newGuide, ...(state.customGuides[cleanSlug] || [])],
            },
        }));
    },

    addReview: (slug, review) => {
        const cleanSlug = slug.toLowerCase();
        const newReview: GameReview = {
            ...review,
            id: `rev-custom-${Date.now()}`,
            likes: 1,
            date: "Vừa xong",
        };
        set((state) => ({
            customReviews: {
                ...state.customReviews,
                [cleanSlug]: [newReview, ...(state.customReviews[cleanSlug] || [])],
            },
        }));
    },

    likeGuide: (slug, guideId) => {
        const cleanSlug = slug.toLowerCase();
        set((state) => {
            const list = state.customGuides[cleanSlug] || [];
            const updated = list.map((g) => (g.id === guideId ? { ...g, likes: g.likes + 1 } : g));
            return {
                customGuides: {
                    ...state.customGuides,
                    [cleanSlug]: updated,
                },
            };
        });
    },

    likeReview: (slug, reviewId) => {
        const cleanSlug = slug.toLowerCase();
        set((state) => {
            const list = state.customReviews[cleanSlug] || [];
            const updated = list.map((r) => (r.id === reviewId ? { ...r, likes: r.likes + 1 } : r));
            return {
                customReviews: {
                    ...state.customReviews,
                    [cleanSlug]: updated,
                },
            };
        });
    },
}));

