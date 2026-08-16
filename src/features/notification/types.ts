export type NotificationType = "comment" | "reply" | "like" | "community" | "mention" | "system";

export interface NotificationEntity {
    id: string;
    userId: string;
    type: NotificationType;
    referenceId: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    title?: string;
    avatarUrl?: string;
    link?: string;
}

export type NotificationItem = NotificationEntity;

export interface NotificationState {
    notifications: NotificationItem[];
    addNotification: (
        notification: Partial<NotificationEntity> & {
            type: NotificationType;
            message: string;
        }
    ) => NotificationItem;
    listNotifications: (userId?: string) => NotificationItem[];
    markAsRead: (id: string) => void;
    markAllAsRead: (userId?: string) => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
    setNotifications: (notifications: NotificationItem[]) => void;
}
