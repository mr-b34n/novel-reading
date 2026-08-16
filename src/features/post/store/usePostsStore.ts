import { create } from "zustand";
import { type PostsState } from "../types";
import { ALL_POSTS } from "../mockPosts";

export const usePostsStore = create<PostsState>((set, get) => ({
    posts: ALL_POSTS,

    addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

    updatePost: (id, updates) =>
        set((state) => ({
            posts: state.posts.map((p) =>
                p.id.toString() === id.toString() ? { ...p, ...updates } : p
            ),
        })),

    deletePost: (id) =>
        set((state) => ({
            posts: state.posts.filter((p) => p.id.toString() !== id.toString()),
        })),

    getPostById: (id) =>
        get().posts.find((p) => p.id.toString() === id.toString()),
}));
