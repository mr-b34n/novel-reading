export interface BookmarksState {
    bookmarkedIds: (string | number)[];
    isBookmarked: (id: string | number) => boolean;
    toggleBookmark: (id: string | number) => void;
    addBookmark: (id: string | number) => void;
    removeBookmark: (id: string | number) => void;
}
