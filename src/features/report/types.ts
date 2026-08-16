export type ReportTargetType = "post" | "comment" | "user";
export type ReportStatus = "pending" | "resolved" | "rejected";

export interface Report {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string;
    status: ReportStatus;
    assignedTo?: string;
    resolvedBy?: string;
    createdAt: string;
    resolvedAt?: string;
    targetTitle?: string;
    targetAuthor?: string;
}

export interface AdminUser {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    isBanned: boolean;
    suspendedUntil?: string | null;
    role: "admin" | "moderator" | "user";
    createdAt?: string;
}

export interface AdminCommunity {
    id: string;
    name: string;
    category: string;
    description: string;
    logo: string;
    membersCount: number;
    moderators: string[];
    ownerId: string;
    isDisabled: boolean;
    createdAt: string;
}

export interface AdminContentItem {
    id: string;
    type: "post" | "comment";
    title?: string;
    content: string;
    authorId: string;
    authorName: string;
    isDeleted: boolean;
    createdAt: string;
    reportsCount: number;
}

export interface AdminGame {
    id: string;
    slug: string;
    name: string;
    genre: string[];
    developer: string;
    publisher: string;
    bannerUrl: string;
    isDisabled: boolean;
}

export interface AdminSystemSettings {
    general: {
        systemName: string;
        systemEmail: string;
        defaultLanguage: string;
    };
    registration: {
        allowRegistration: boolean;
        requireEmailVerification: boolean;
        defaultRole: "user" | "moderator";
    };
    moderation: {
        autoFlagThreshold: number;
        maxReportsPerDay: number;
        autoHideReportedContent: boolean;
    };
    content: {
        maxUploadMB: number;
        allowImages: boolean;
        nsfwFilterEnabled: boolean;
    };
    notifications: {
        systemBroadcast: string;
        adminAlertEmail: boolean;
    };
    security: {
        require2FA: boolean;
        sessionTimeoutMinutes: number;
        rateLimitPerMin: number;
    };
    maintenance: {
        maintenanceMode: boolean;
        maintenanceNotice: string;
    };
    featureFlags: {
        enableAIAssistant: boolean;
        enableLiveChat: boolean;
        enableSquadFinder: boolean;
        enableGuildTournaments: boolean;
    };
}

export interface ReportModalProps {
    postId: string | number;
    author: string;
    onClose: () => void;
}
