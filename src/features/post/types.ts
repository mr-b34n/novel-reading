import { type UserRank } from "./helpers/userRanks";

export interface PostFileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
}

export interface PostData {
    id: string | number;
    author: string;
    authorAvatar: string;
    authorRank?: UserRank;
    gameTag?: string;
    timeAgo: string;
    title: string;
    content: string;
    images?: string[];
    files?: PostFileAttachment[];
    tags: string[];
    likes: number;
    comments: number;
    tab?: "foryou" | "following" | "hot";
    privacy: "public" | "friends" | "private";
    pinned?: boolean;
    allowComments?: boolean;
    isSpoiler?: boolean;
}

export interface PostDraft {
    id: string;
    title: string;
    content: string;
    privacy: "public" | "friends" | "private";
    allowComments: boolean;
    pinned: boolean;
    isSpoiler?: boolean;
    communityId: string | number | null;
    updatedAt: string;
}

export interface PostsState {
    posts: PostData[];
    addPost: (post: PostData) => void;
    updatePost: (id: string | number, updates: Partial<PostData>) => void;
    deletePost: (id: string | number) => void;
    getPostById: (id: string | number) => PostData | undefined;
}

export interface DraftsState {
    drafts: PostDraft[];
    saveDraft: (draft: Omit<PostDraft, "id" | "updatedAt"> & { id?: string }) => string;
    deleteDraft: (id: string) => void;
    clearDrafts: () => void;
}
