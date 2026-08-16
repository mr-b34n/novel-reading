import { create } from "zustand";
import { type NotificationState, type NotificationItem } from "../types";
import { INITIAL_NOTIFICATIONS } from "../constants";

export * from "../types";

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: INITIAL_NOTIFICATIONS,

    addNotification: (notificationData) => {
        const newNotif: NotificationItem = {
            id: notificationData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: notificationData.userId || "user-current",
            type: notificationData.type,
            referenceId: notificationData.referenceId || "ref-unknown",
            message: notificationData.message,
            isRead: notificationData.isRead ?? false,
            createdAt: notificationData.createdAt || new Date().toISOString(),
            title: notificationData.title || getTitleForType(notificationData.type),
            avatarUrl: notificationData.avatarUrl || getAvatarForType(notificationData.type),
            link: notificationData.link || getLinkForType(notificationData.type, notificationData.referenceId),
        };

        set((state) => ({
            notifications: [newNotif, ...state.notifications],
        }));

        return newNotif;
    },

    listNotifications: (userId = "user-current") => {
        const all = get().notifications;
        if (!userId) return all;
        return all.filter((n) => n.userId === userId || n.userId === "user-current");
    },

    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            ),
        })),

    markAllAsRead: (userId = "user-current") =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                (!userId || n.userId === userId || n.userId === "user-current")
                    ? { ...n, isRead: true }
                    : n
            ),
        })),

    deleteNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),

    clearAll: () => set({ notifications: [] }),

    setNotifications: (newNotifs) => set({ notifications: newNotifs }),
}));

function getTitleForType(type: string): string {
    switch (type) {
        case "comment":
            return "Bình luận mới trên bài viết";
        case "reply":
            return "Phản hồi mới cho bình luận";
        case "like":
            return "Bài viết đã nhận được lượt thích";
        case "community":
            return "Cập nhật cộng đồng";
        case "mention":
            return "Bạn vừa được nhắc đến";
        default:
            return "Thông báo mới";
    }
}

function getAvatarForType(type: string): string {
    switch (type) {
        case "comment":
        case "reply":
            return "https://api.dicebear.com/7.x/avataaars/svg?seed=Commenter";
        case "like":
            return "https://api.dicebear.com/7.x/avataaars/svg?seed=Liker";
        case "community":
            return "https://api.dicebear.com/7.x/identicon/svg?seed=Community";
        default:
            return "https://api.dicebear.com/7.x/bottts/svg?seed=System";
    }
}

function getLinkForType(type: string, refId?: string): string {
    if (type === "community") return refId ? `/community/${refId}` : "/community";
    if (type === "comment" || type === "reply" || type === "like") {
        return refId ? `/post/${refId}` : "/";
    }
    return "/";
}
