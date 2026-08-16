import { create } from "zustand";
import { type BookmarksState } from "../types";
import { INITIAL_BOOKMARK_IDS } from "../constants";

export * from "../types";

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
    bookmarkedIds: INITIAL_BOOKMARK_IDS,

    isBookmarked: (id) =>
        get().bookmarkedIds.some((b) => b.toString() === id.toString()),

    toggleBookmark: (id) =>
        set((state) => {
            const exists = state.bookmarkedIds.some((b) => b.toString() === id.toString());
            return {
                bookmarkedIds: exists
                    ? state.bookmarkedIds.filter((b) => b.toString() !== id.toString())
                    : [id, ...state.bookmarkedIds],
            };
        }),

    addBookmark: (id) =>
        set((state) =>
            state.bookmarkedIds.some((b) => b.toString() === id.toString())
                ? state
                : { bookmarkedIds: [id, ...state.bookmarkedIds] }
        ),

    removeBookmark: (id) =>
        set((state) => ({
            bookmarkedIds: state.bookmarkedIds.filter((b) => b.toString() !== id.toString()),
        })),
}));