import { create } from "zustand";
import {
    CS2_LOGO as cs2Logo,
    RAFT_LOGO as raftLogo,
    RDR2_LOGO as rdr2Logo,
    DEFAULT_AVATAR as avatarDefault
} from "@/shared/constants/images";
import { getCurrentAuthor } from "@/features/post/helpers/getCurrentAuthor";
import { useNotificationStore } from "@/features/notification/store/useNotificationStore";
import { type Squad, type SquadState } from "../types";
import { INITIAL_SQUADS } from "../constants";

export * from "../types";

export const useSquadStore = create<SquadState>((set) => ({
    squads: INITIAL_SQUADS,
    activeTab: "explore",
    filterGame: "all",
    searchQuery: "",

    setActiveTab: (tab) => set({ activeTab: tab }),
    setFilterGame: (game) => set({ filterGame: game }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    addSquad: (newSquadData) => {
        const currentAuthor = getCurrentAuthor();
        const newSquad: Squad = {
            id: `squad-${Date.now()}`,
            name: newSquadData.name,
            game: newSquadData.game,
            gameLogo: newSquadData.game.includes("CS2") || newSquadData.game.includes("Counter") ? cs2Logo : newSquadData.game.includes("Raft") ? raftLogo : rdr2Logo,
            description: newSquadData.description,
            tags: newSquadData.tags.length > 0 ? newSquadData.tags : ["🤝 Tìm Đồng Đội", newSquadData.game],
            currentMembers: 1,
            maxMembers: newSquadData.maxMembers,
            voice: newSquadData.voice,
            isMySquad: true,
            roomCode: newSquadData.roomCode || `#SQUAD-${Math.floor(1000 + Math.random() * 9000)}`,
            discordUrl: newSquadData.discordUrl,
            createdAt: "Vừa xong",
            status: "recruiting",
            members: [
                {
                    id: `m-${Date.now()}`,
                    username: currentAuthor,
                    avatar: avatarDefault,
                    role: "Leader",
                    status: "online",
                    playtime: "Vừa tạo",
                },
            ],
        };

        set((state) => ({
            squads: [newSquad, ...state.squads],
            activeTab: "my-squads",
        }));

        useNotificationStore.getState().addNotification({
            type: "system",
            title: "Tạo tổ đội thành công!",
            message: `Bạn đã tạo tổ đội "${newSquad.name}" và đang tuyển thành viên.`,
            timestamp: "Vừa xong",
            link: "/squad",
        });
    },

    joinSquad: (squadId) => {
        const currentAuthor = getCurrentAuthor();
        let joinedName = "";

        set((state) => {
            const updatedSquads = state.squads.map((sq) => {
                if (sq.id !== squadId) return sq;
                if (sq.isMySquad || sq.currentMembers >= sq.maxMembers) return sq;

                joinedName = sq.name;
                const newMember: SquadMember = {
                    id: `m-${Date.now()}`,
                    username: currentAuthor,
                    avatar: avatarDefault,
                    role: "Member",
                    status: "online",
                    playtime: "Vừa tham gia",
                };

                const newCount = sq.currentMembers + 1;
                return {
                    ...sq,
                    isMySquad: true,
                    currentMembers: newCount,
                    status: newCount >= sq.maxMembers ? "full" : "recruiting",
                    members: [...sq.members, newMember],
                };
            });
            return { squads: updatedSquads };
        });

        if (joinedName) {
            useNotificationStore.getState().addNotification({
                type: "system",
                title: "Tham gia tổ đội thành công!",
                message: `Chào mừng bạn gia nhập tổ đội "${joinedName}". Hãy kết nối voice chat cùng đồng đội!`,
                timestamp: "Vừa xong",
                link: "/squad",
            });
        }
    },

    leaveSquad: (squadId) => {
        const currentAuthor = getCurrentAuthor();
        set((state) => {
            const updatedSquads = state.squads.map((sq) => {
                if (sq.id !== squadId || !sq.isMySquad) return sq;
                const filteredMembers = sq.members.filter((m) => m.username !== currentAuthor);
                const newCount = Math.max(0, sq.currentMembers - 1);
                return {
                    ...sq,
                    isMySquad: false,
                    currentMembers: newCount,
                    status: "recruiting",
                    members: filteredMembers,
                };
            });
            return { squads: updatedSquads };
        });
    },

    kickMember: (squadId, memberUsername) => {
        set((state) => {
            const updatedSquads = state.squads.map((sq) => {
                if (sq.id !== squadId) return sq;
                const filteredMembers = sq.members.filter((m) => m.username !== memberUsername);
                const newCount = Math.max(0, sq.currentMembers - 1);
                return {
                    ...sq,
                    currentMembers: newCount,
                    status: "recruiting",
                    members: filteredMembers,
                };
            });
            return { squads: updatedSquads };
        });

        useNotificationStore.getState().addNotification({
            type: "system",
            title: "Đã trục xuất thành viên",
            message: `Bạn đã kick @${memberUsername} ra khỏi tổ đội.`,
            timestamp: "Vừa xong",
            link: "/squad",
        });
    },

    deleteSquad: (squadId) => {
        let deletedName = "";
        set((state) => {
            const sq = state.squads.find((s) => s.id === squadId);
            if (sq) deletedName = sq.name;
            return {
                squads: state.squads.filter((s) => s.id !== squadId),
            };
        });

        if (deletedName) {
            useNotificationStore.getState().addNotification({
                type: "system",
                title: "Đã giải tán tổ đội",
                message: `Tổ đội "${deletedName}" đã được giải tán thành công.`,
                timestamp: "Vừa xong",
                link: "/squad",
            });
        }
    },

    toggleSquadStatus: (squadId) => {
        set((state) => {
            const updatedSquads = state.squads.map((sq) => {
                if (sq.id !== squadId) return sq;
                const newStatus = sq.status === "recruiting" ? "full" : "recruiting";
                return {
                    ...sq,
                    status: newStatus,
                };
            });
            return { squads: updatedSquads };
        });
    },
}));
