import {
    type Report,
    type AdminUser,
    type AdminCommunity,
    type AdminContentItem,
    type AdminGame,
    type AdminSystemSettings
} from "../types";

export interface CreateReportPayload {
    reporterId?: string;
    targetType: "post" | "comment" | "user";
    targetId: string;
    reason: string;
    description?: string;
    targetTitle?: string;
    targetAuthor?: string;
}

export const adminApi = {
    // 0. Dashboard Stats
    async getDashboardStats(adminRole: string = "admin"): Promise<{
        success: boolean;
        data?: {
            usersCount: number;
            postsCount: number;
            commentsCount: number;
            communitiesCount: number;
            pendingReportsCount: number;
            growth: {
                userGrowthPercent: number;
                postVelocityPercent: number;
                resolutionRatePercent: number;
                activeCommunitiesPercent: number;
            };
        };
        error?: string;
    }> {
        try {
            const res = await fetch("/api/admin/stats", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error loading dashboard stats" };
        }
    },

    // 1. Reports Management
    async createReport(payload: CreateReportPayload): Promise<{ success: boolean; data?: Report; error?: string }> {
        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error creating report" };
        }
    },

    async listReports(adminRole: string = "admin"): Promise<{ success: boolean; data?: Report[]; error?: string }> {
        try {
            const res = await fetch("/api/admin/reports", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error listing reports" };
        }
    },

    async assignReport(reportId: string, assignedTo: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: Report; error?: string }> {
        try {
            const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/assign`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ assignedTo }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error assigning report" };
        }
    },

    async resolveReport(reportId: string, resolvedBy: string = "admin-1", adminRole: string = "admin"): Promise<{ success: boolean; data?: Report; error?: string }> {
        try {
            const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ resolvedBy }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error resolving report" };
        }
    },

    async rejectReport(reportId: string, resolvedBy: string = "admin-1", adminRole: string = "admin"): Promise<{ success: boolean; data?: Report; error?: string }> {
        try {
            const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ resolvedBy }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error rejecting report" };
        }
    },

    // 2. User Management
    async listUsers(query: string = "", adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
        try {
            const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error listing users" };
        }
    },

    async banUser(userId: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/ban`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error banning user" };
        }
    },

    async unbanUser(userId: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/unban`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error unbanning user" };
        }
    },

    async suspendUser(userId: string, days: number, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/suspend`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ days }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error suspending user" };
        }
    },

    async updateUserRole(userId: string, role: "admin" | "moderator" | "user", adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ role }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error updating user role" };
        }
    },

    // 3. Community Management
    async listCommunities(adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminCommunity[]; error?: string }> {
        try {
            const res = await fetch("/api/admin/communities", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error listing communities" };
        }
    },

    async toggleCommunityDisable(communityId: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminCommunity; error?: string }> {
        try {
            const res = await fetch(`/api/admin/communities/${encodeURIComponent(communityId)}/toggle-disable`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error toggling community" };
        }
    },

    async updateCommunityModerators(communityId: string, moderators: string[], adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminCommunity; error?: string }> {
        try {
            const res = await fetch(`/api/admin/communities/${encodeURIComponent(communityId)}/moderators`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ moderators }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error updating moderators" };
        }
    },

    async transferCommunityOwnership(communityId: string, newOwnerId: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminCommunity; error?: string }> {
        try {
            const res = await fetch(`/api/admin/communities/${encodeURIComponent(communityId)}/transfer-owner`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify({ newOwnerId }),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error transferring community ownership" };
        }
    },

    // 4. Content Management (Posts & Comments)
    async listContent(adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminContentItem[]; error?: string }> {
        try {
            const res = await fetch("/api/admin/content", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error listing content" };
        }
    },

    async deletePost(postId: string, adminRole: string = "admin"): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error deleting post" };
        }
    },

    async restorePost(postId: string, adminRole: string = "admin"): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}/restore`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error restoring post" };
        }
    },

    async deleteComment(commentId: string, adminRole: string = "admin"): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const res = await fetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error deleting comment" };
        }
    },

    async restoreComment(commentId: string, adminRole: string = "admin"): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const res = await fetch(`/api/admin/comments/${encodeURIComponent(commentId)}/restore`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error restoring comment" };
        }
    },

    // 5. Games Management
    async listGames(adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminGame[]; error?: string }> {
        try {
            const res = await fetch("/api/admin/games", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error listing games" };
        }
    },

    async createGame(game: Omit<AdminGame, "id" | "isDisabled">, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminGame; error?: string }> {
        try {
            const res = await fetch("/api/admin/games", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify(game),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error creating game" };
        }
    },

    async updateGame(gameId: string, game: Partial<AdminGame>, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminGame; error?: string }> {
        try {
            const res = await fetch(`/api/admin/games/${encodeURIComponent(gameId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify(game),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error updating game" };
        }
    },

    async deleteGame(gameId: string, adminRole: string = "admin"): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const res = await fetch(`/api/admin/games/${encodeURIComponent(gameId)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error deleting game" };
        }
    },

    async toggleGameDisable(gameId: string, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminGame; error?: string }> {
        try {
            const res = await fetch(`/api/admin/games/${encodeURIComponent(gameId)}/toggle-disable`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error toggling game status" };
        }
    },

    // 6. Admin System Settings
    async getSettings(adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminSystemSettings; error?: string }> {
        try {
            const res = await fetch("/api/admin/settings", {
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error fetching settings" };
        }
    },

    async updateSettings(settings: Partial<AdminSystemSettings>, adminRole: string = "admin"): Promise<{ success: boolean; data?: AdminSystemSettings; error?: string }> {
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-user-role": adminRole },
                body: JSON.stringify(settings),
            });
            return await res.json();
        } catch {
            return { success: false, error: "Network error updating settings" };
        }
    },
};
