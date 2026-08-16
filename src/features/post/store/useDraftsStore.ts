import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type DraftsState } from "../types";

export * from "../types";

export const useDraftsStore = create<DraftsState>()(
    persist(
        (set) => ({
            drafts: [],

            saveDraft: (draftData) => {
                const id = "latest-draft";
                const now = new Date();
                const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")} - ${now.getDate()}/${now.getMonth() + 1}`;
                
                const newDraft: PostDraft = {
                    ...draftData,
                    id,
                    updatedAt: timeStr,
                };
                set({ drafts: [newDraft] });
                return id;
            },

            deleteDraft: (id) => {
                set((state) => ({
                    drafts: state.drafts.filter((d) => d.id !== id),
                }));
            },

            clearDrafts: () => set({ drafts: [] }),
        }),
        {
            name: "indieg-post-drafts-v1",
        }
    )
);
