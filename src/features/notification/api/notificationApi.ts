import { type NotificationEntity } from "../types";
import { useNotificationStore } from "../store/useNotificationStore";

export interface CreateNotificationParams {
    userId?: string;
    type: "comment" | "reply" | "like" | "community" | "mention" | "system";
    referenceId: string;
    message: string;
    title?: string;
    avatarUrl?: string;
    link?: string;
}

/**
 * Service & Repository API layer for Notifications.
 * Handles fetching, creating, and marking read status.
 */
export const notificationApi = {
    /**
     * Get all notifications for a specific user
     */
    async getNotifications(userId: string = "user-current"): Promise<NotificationEntity[]> {
        try {
            const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    useNotificationStore.getState().setNotifications(data.data);
                    return data.data;
                }
            }
        } catch {
            // Fallback to client-side Zustand store if server API not reachable
        }
        return useNotificationStore.getState().listNotifications(userId);
    },

    /**
     * Create a new notification (e.g. triggered by comment, reply, like, or community join)
     */
    async createNotification(params: CreateNotificationParams): Promise<NotificationEntity> {
        const payload = {
            userId: params.userId || "user-current",
            type: params.type,
            referenceId: params.referenceId,
            message: params.message,
            title: params.title,
            avatarUrl: params.avatarUrl,
            link: params.link,
        };

        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    useNotificationStore.getState().addNotification(data.data);
                    return data.data;
                }
            }
        } catch {
            // Fallback to client store
        }

        return useNotificationStore.getState().addNotification(payload);
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string): Promise<void> {
        useNotificationStore.getState().markAsRead(id);
        try {
            await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
                method: "PUT",
            });
        } catch {
            // Handled in store
        }
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string = "user-current"): Promise<void> {
        useNotificationStore.getState().markAllAsRead(userId);
        try {
            await fetch(`/api/notifications/read-all`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
        } catch {
            // Handled in store
        }
    },
};
