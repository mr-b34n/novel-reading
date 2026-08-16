import { create } from "zustand";
import { type CommunitiesState } from "../types";
import { INITIAL_COMMUNITIES } from "../constants";
import { notificationApi } from "@/features/notification";

export * from "../types";

export const useCommunitiesStore = create<CommunitiesState>((set, get) => ({
    communities: INITIAL_COMMUNITIES,
    toggleJoin: (id) => {
        const targetComm = get().communities.find((c) => c.id === id);
        const newJoinedState = targetComm ? !targetComm.joined : true;

        set((state) => ({
            communities: state.communities.map((c) =>
                c.id === id
                    ? {
                          ...c,
                          joined: !c.joined,
                          members: c.joined ? c.members - 1 : c.members + 1,
                      }
                    : c
            ),
        }));

        if (targetComm) {
            void notificationApi.createNotification({
                type: "community",
                referenceId: String(id),
                title: "Thành viên Cộng đồng",
                message: newJoinedState
                    ? `Bạn đã gia nhập cộng đồng "${targetComm.name}"`
                    : `Bạn đã rời khỏi cộng đồng "${targetComm.name}"`,
                link: `/community/${id}`,
                avatarUrl: targetComm.logo,
            });
        }
    },
    getCommunityById: (id) => get().communities.find((c) => c.id === id),
    addCommunity: (community) =>
        set((state) => ({ communities: [community, ...state.communities] })),
    updateCommunity: (id, data) =>
        set((state) => ({
            communities: state.communities.map((c) =>
                c.id === id ? { ...c, ...data } : c
            ),
        })),
    deleteCommunity: (id) =>
        set((state) => ({
            communities: state.communities.filter((c) => c.id !== id),
        })),
}));
