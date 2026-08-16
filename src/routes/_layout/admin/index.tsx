import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShieldHalved,
    faUsers,
    faFlag,
    faSearch,
    faCheckCircle,
    faTrash,
    faXmark,
    faExclamationTriangle,
    faLock,
    faFilter,
    faClock,
    faRotateRight,
    faEye,
    faUser,
    faShieldCat,
    faGamepad,
    faUsersGear,
    faFileLines,
    faGear,
    faChartLine,
    faPlus,
    faPenToSquare,
    faRotateLeft,
    faUserShield,
    faBullhorn,
    faSliders,
    faCrown,
} from "@fortawesome/free-solid-svg-icons";
import {
    adminApi,
    type Report,
    type AdminUser,
    type AdminCommunity,
    type AdminContentItem,
    type AdminGame,
    type AdminSystemSettings,
} from "@/features/report";
import { useAuthStore } from "@/features/auth";

export const Route = createFileRoute("/_layout/admin/")({
    component: AdminPage,
});

type TabType = "dashboard" | "users" | "communities" | "content" | "reports" | "games" | "settings";

function AdminPage() {
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const currentUserRole = user?.role || (mockLogin ? "admin" : "user");
    const isAdmin = currentUserRole === "admin";

    const [activeTab, setActiveTab] = useState<TabType>("dashboard");

    // Message Alerts
    const [authError, setAuthError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Data States
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{
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
    } | null>(null);

    const [usersList, setUsersList] = useState<AdminUser[]>([]);
    const [communitiesList, setCommunitiesList] = useState<AdminCommunity[]>([]);
    const [contentList, setContentList] = useState<AdminContentItem[]>([]);
    const [reportsList, setReportsList] = useState<Report[]>([]);
    const [gamesList, setGamesList] = useState<AdminGame[]>([]);
    const [settings, setSettings] = useState<AdminSystemSettings | null>(null);

    // Filter States
    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
    const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "banned" | "suspended">("all");

    const [communitySearch, setCommunitySearch] = useState("");
    const [contentSearch, setContentSearch] = useState("");
    const [contentTypeFilter, setContentTypeFilter] = useState<"all" | "post" | "comment" | "deleted">("all");

    const [reportStatusFilter, setReportStatusFilter] = useState<"all" | "pending" | "resolved" | "rejected">("pending");
    const [reportTypeFilter, setReportTypeFilter] = useState<"all" | "post" | "comment" | "user">("all");

    const [gameSearch, setGameSearch] = useState("");

    // Modal States
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [selectedCommunity, setSelectedCommunity] = useState<AdminCommunity | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [gameModal, setGameModal] = useState<{ open: boolean; game: AdminGame | null }>({ open: false, game: null });
    const [gameForm, setGameForm] = useState({ slug: "", name: "", genre: "", developer: "", publisher: "", bannerUrl: "" });

    const showMessage = (msg: string) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3500);
    };

    // Global Data Loader
    const loadAllData = async () => {
        setLoading(true);
        setAuthError(null);

        const [statsRes, userRes, commRes, contRes, repRes, gameRes, setRes] = await Promise.all([
            adminApi.getDashboardStats(currentUserRole),
            adminApi.listUsers("", currentUserRole),
            adminApi.listCommunities(currentUserRole),
            adminApi.listContent(currentUserRole),
            adminApi.listReports(currentUserRole),
            adminApi.listGames(currentUserRole),
            adminApi.getSettings(currentUserRole),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (userRes.success && userRes.data) setUsersList(userRes.data);
        if (commRes.success && commRes.data) setCommunitiesList(commRes.data);
        if (contRes.success && contRes.data) setContentList(contRes.data);
        if (repRes.success && repRes.data) setReportsList(repRes.data);
        if (gameRes.success && gameRes.data) setGamesList(gameRes.data);
        if (setRes.success && setRes.data) setSettings(setRes.data);

        if (statsRes.error) setAuthError(statsRes.error);

        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        const fetchInitial = async () => {
            if (!isMounted) return;
            await loadAllData();
        };
        void fetchInitial();
        return () => { isMounted = false; };
    }, [currentUserRole]);

    // User Management Handlers
    const handleBan = async (userId: string) => {
        const res = await adminApi.banUser(userId, currentUserRole);
        if (res.success && res.data) {
            showMessage(`Đã khóa tài khoản (${userId})`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleUnban = async (userId: string) => {
        const res = await adminApi.unbanUser(userId, currentUserRole);
        if (res.success && res.data) {
            showMessage(`Đã mở khóa tài khoản (${userId})`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleSuspend = async (userId: string, days: number) => {
        const res = await adminApi.suspendUser(userId, days, currentUserRole);
        if (res.success) {
            showMessage(`Đã tạm khóa tài khoản (${userId}) trong ${days} ngày`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleRoleChange = async (userId: string, newRole: "admin" | "moderator" | "user") => {
        const res = await adminApi.updateUserRole(userId, newRole, currentUserRole);
        if (res.success) {
            showMessage(`Đã cập nhật vai trò của ${userId} thành ${newRole.toUpperCase()}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    // Community Handlers
    const handleToggleCommunity = async (commId: string) => {
        const res = await adminApi.toggleCommunityDisable(commId, currentUserRole);
        if (res.success) {
            showMessage(`Đã cập nhật trạng thái cộng đồng ${commId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleAddModerator = async (commId: string, currentMods: string[]) => {
        const newModId = window.prompt("Nhập ID người dùng muốn bổ nhiệm làm Moderator:");
        if (!newModId) return;
        if (currentMods.includes(newModId)) {
            alert("Người dùng này đã là Moderator!");
            return;
        }
        const updatedMods = [...currentMods, newModId];
        const res = await adminApi.updateCommunityModerators(commId, updatedMods, currentUserRole);
        if (res.success) {
            showMessage(`Đã thêm Moderator ${newModId} vào cộng đồng`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleRemoveModerator = async (commId: string, currentMods: string[], targetModId: string) => {
        const updatedMods = currentMods.filter(m => m !== targetModId);
        const res = await adminApi.updateCommunityModerators(commId, updatedMods, currentUserRole);
        if (res.success) {
            showMessage(`Đã xóa Moderator ${targetModId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleTransferOwnership = async (commId: string) => {
        const newOwnerId = window.prompt("Nhập ID người dùng làm Trưởng cộng đồng (Owner) mới:");
        if (!newOwnerId) return;
        const res = await adminApi.transferCommunityOwnership(commId, newOwnerId, currentUserRole);
        if (res.success) {
            showMessage(`Đã chuyển quyền Owner cộng đồng ${commId} cho ${newOwnerId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    // Content Handlers
    const handleDeletePost = async (postId: string) => {
        if (!window.confirm(`Xác nhận xóa bài viết (${postId})?`)) return;
        const res = await adminApi.deletePost(postId, currentUserRole);
        if (res.success) {
            showMessage(`Đã xóa bài viết ${postId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleRestorePost = async (postId: string) => {
        const res = await adminApi.restorePost(postId, currentUserRole);
        if (res.success) {
            showMessage(`Đã khôi phục bài viết ${postId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm(`Xác nhận xóa bình luận (${commentId})?`)) return;
        const res = await adminApi.deleteComment(commentId, currentUserRole);
        if (res.success) {
            showMessage(`Đã xóa bình luận ${commentId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleRestoreComment = async (commentId: string) => {
        const res = await adminApi.restoreComment(commentId, currentUserRole);
        if (res.success) {
            showMessage(`Đã khôi phục bình luận ${commentId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    // Report Handlers
    const handleAssignReport = async (reportId: string) => {
        const assignee = window.prompt("Nhập ID quản trị viên phân công xử lý (vd: admin_master, mod_1):", "admin_master");
        if (!assignee) return;
        const res = await adminApi.assignReport(reportId, assignee, currentUserRole);
        if (res.success) {
            showMessage(`Đã phân công báo cáo #${reportId} cho ${assignee}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleResolveReport = async (reportId: string) => {
        const res = await adminApi.resolveReport(reportId, user?.id || "admin_master", currentUserRole);
        if (res.success) {
            showMessage(`Đã duyệt báo cáo #${reportId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleRejectReport = async (reportId: string) => {
        const res = await adminApi.rejectReport(reportId, user?.id || "admin_master", currentUserRole);
        if (res.success) {
            showMessage(`Đã bác bỏ báo cáo #${reportId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    // Game Handlers
    const handleOpenGameModal = (game: AdminGame | null) => {
        if (game) {
            setGameModal({ open: true, game });
            setGameForm({
                slug: game.slug,
                name: game.name,
                genre: game.genre.join(", "),
                developer: game.developer,
                publisher: game.publisher,
                bannerUrl: game.bannerUrl,
            });
        } else {
            setGameModal({ open: true, game: null });
            setGameForm({ slug: "", name: "", genre: "", developer: "", publisher: "", bannerUrl: "" });
        }
    };

    const handleSaveGame = async (e: React.FormEvent) => {
        e.preventDefault();
        const genreArray = gameForm.genre.split(",").map(g => g.trim()).filter(Boolean);

        if (gameModal.game) {
            const res = await adminApi.updateGame(gameModal.game.id, {
                slug: gameForm.slug,
                name: gameForm.name,
                genre: genreArray,
                developer: gameForm.developer,
                publisher: gameForm.publisher,
                bannerUrl: gameForm.bannerUrl,
            }, currentUserRole);
            if (res.success) {
                showMessage(`Đã cập nhật tựa game ${gameForm.name}`);
                setGameModal({ open: false, game: null });
                void loadAllData();
            } else if (res.error) setAuthError(res.error);
        } else {
            const res = await adminApi.createGame({
                slug: gameForm.slug,
                name: gameForm.name,
                genre: genreArray,
                developer: gameForm.developer,
                publisher: gameForm.publisher,
                bannerUrl: gameForm.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80",
            }, currentUserRole);
            if (res.success) {
                showMessage(`Đã thêm mới tựa game ${gameForm.name}`);
                setGameModal({ open: false, game: null });
                void loadAllData();
            } else if (res.error) setAuthError(res.error);
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        if (!window.confirm(`Xác nhận xóa tựa game (${gameId})?`)) return;
        const res = await adminApi.deleteGame(gameId, currentUserRole);
        if (res.success) {
            showMessage(`Đã xóa game ${gameId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    const handleToggleGame = async (gameId: string) => {
        const res = await adminApi.toggleGameDisable(gameId, currentUserRole);
        if (res.success) {
            showMessage(`Đã cập nhật trạng thái game ${gameId}`);
            void loadAllData();
        } else if (res.error) setAuthError(res.error);
    };

    // Settings Handler
    const handleUpdateSettings = async (newSettings: Partial<AdminSystemSettings>) => {
        const res = await adminApi.updateSettings(newSettings, currentUserRole);
        if (res.success && res.data) {
            setSettings(res.data);
            showMessage("Đã lưu cấu hình Admin thành công");
        } else if (res.error) setAuthError(res.error);
    };

    // Computed Filters
    const filteredUsers = useMemo(() => {
        return usersList.filter((u) => {
            const q = userSearch.toLowerCase().trim();
            const matchQ = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
            const isSuspended = u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
            const matchStatus =
                userStatusFilter === "all" ||
                (userStatusFilter === "banned" && u.isBanned) ||
                (userStatusFilter === "suspended" && isSuspended) ||
                (userStatusFilter === "active" && !u.isBanned && !isSuspended);
            return matchQ && matchRole && matchStatus;
        });
    }, [usersList, userSearch, userRoleFilter, userStatusFilter]);

    const filteredCommunities = useMemo(() => {
        return communitiesList.filter((c) => {
            const q = communitySearch.toLowerCase().trim();
            return !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
        });
    }, [communitiesList, communitySearch]);

    const filteredContent = useMemo(() => {
        return contentList.filter((c) => {
            const q = contentSearch.toLowerCase().trim();
            const matchQ = !q || (c.title && c.title.toLowerCase().includes(q)) || c.content.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q);
            const matchType =
                contentTypeFilter === "all" ||
                (contentTypeFilter === "post" && c.type === "post" && !c.isDeleted) ||
                (contentTypeFilter === "comment" && c.type === "comment" && !c.isDeleted) ||
                (contentTypeFilter === "deleted" && c.isDeleted);
            return matchQ && matchType;
        });
    }, [contentList, contentSearch, contentTypeFilter]);

    const filteredReports = useMemo(() => {
        return reportsList.filter((r) => {
            const matchStatus = reportStatusFilter === "all" || r.status === reportStatusFilter;
            const matchType = reportTypeFilter === "all" || r.targetType === reportTypeFilter;
            return matchStatus && matchType;
        });
    }, [reportsList, reportStatusFilter, reportTypeFilter]);

    const filteredGames = useMemo(() => {
        return gamesList.filter((g) => {
            const q = gameSearch.toLowerCase().trim();
            return !q || g.name.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q) || g.genre.some(gen => gen.toLowerCase().includes(q));
        });
    }, [gamesList, gameSearch]);

    // Security Gate check
    if (!isAdmin) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 my-12 border border-rose-500/50 bg-surface text-text font-mono">
                <div className="flex items-center gap-3 border-b border-rose-500/30 pb-4">
                    <FontAwesomeIcon icon={faShieldCat} className="text-3xl text-rose-500" />
                    <div>
                        <h1 className="text-lg font-black uppercase text-rose-500">TRUY CẬP BỊ HẠN CHẾ (403 FORBIDDEN)</h1>
                        <p className="text-xs text-text-muted mt-0.5">Admin Security Gate</p>
                    </div>
                </div>
                <div className="py-6 space-y-4 text-xs">
                    <p className="text-text font-semibold">Trang quản trị chỉ dành riêng cho tài khoản có vai trò <span className="text-primary font-bold">ADMIN</span>.</p>
                    <div className="bg-surface-hover p-4 border border-border space-y-2">
                        <div>Vai trò hiện tại của bạn: <strong className="uppercase text-amber-500">{currentUserRole}</strong></div>
                        <div className="text-text-muted text-[11px]">Mọi thao tác API backend sẽ bị chặn từ chối nếu không truyền đúng token phân quyền admin.</div>
                    </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end">
                    <a href="/" className="px-4 py-2 border border-border bg-surface hover:bg-surface-hover text-xs font-bold transition-colors">
                        Trở về trang chủ
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-text">
            {/* Header Section */}
            <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-6 bg-primary"></span>
                        <h1 className="text-xl font-bold uppercase tracking-wider text-text flex items-center gap-2">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-base" />
                            Admin Console & Management
                        </h1>
                    </div>
                    <p className="text-xs text-text-muted mt-1 font-mono">
                        System Control Center / Operations & Moderation
                    </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                    <button
                        onClick={() => void loadAllData()}
                        className="px-3 py-1.5 border border-border bg-surface hover:bg-surface-hover transition-colors text-text-muted hover:text-text flex items-center gap-2 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faRotateRight} className={loading ? "animate-spin text-primary" : ""} />
                        <span>REFRESH DATA</span>
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-surface">
                        <FontAwesomeIcon icon={faLock} className="text-emerald-500 text-[11px]" />
                        <span className="text-text-muted">ROLE:</span>
                        <span className="font-extrabold text-primary uppercase">{currentUserRole}</span>
                    </div>
                </div>
            </div>

            {/* Alert Notices */}
            {authError && (
                <div className="flex items-center gap-3 bg-rose-500/10 border-l-4 border-rose-500 text-rose-500 p-3 text-xs font-mono">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="shrink-0" />
                    <span>{authError}</span>
                </div>
            )}

            {actionMessage && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-500 p-3 text-xs font-mono">
                    <FontAwesomeIcon icon={faCheckCircle} className="shrink-0" />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Main Navigation Tabs */}
            <div className="border-b border-border flex flex-wrap items-center gap-2 sm:gap-6 font-mono text-xs font-bold overflow-x-auto pb-1">
                {[
                    { key: "dashboard", label: "DASHBOARD", icon: faChartLine },
                    { key: "users", label: `NGƯỜI DÙNG (${usersList.length})`, icon: faUsers },
                    { key: "communities", label: `CỘNG ĐỒNG (${communitiesList.length})`, icon: faUsersGear },
                    { key: "content", label: `NỘI DUNG (${contentList.length})`, icon: faFileLines },
                    { key: "reports", label: `BÁO CÁO (${reportsList.length})`, icon: faFlag, badge: stats?.pendingReportsCount },
                    { key: "games", label: `GAME (${gamesList.length})`, icon: faGamepad },
                    { key: "settings", label: "CẤU HÌNH ADMIN", icon: faGear },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as TabType)}
                        className={`pb-3 pt-1 transition-colors relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === tab.key
                                ? "text-primary border-b-2 border-primary font-black"
                                : "text-text-muted hover:text-text"
                        }`}
                    >
                        <FontAwesomeIcon icon={tab.icon} />
                        <span>{tab.label}</span>
                        {tab.badge ? (
                            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 font-mono">
                                {tab.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* Linear Metric Banner */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 border border-border divide-x divide-y lg:divide-y-0 divide-border bg-surface text-xs font-mono">
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-text-muted uppercase text-[11px]">Người dùng</div>
                                <div className="text-2xl font-black text-text mt-1">{stats?.usersCount || usersList.length}</div>
                            </div>
                            <FontAwesomeIcon icon={faUsers} className="text-cyan-500/40 text-xl" />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-text-muted uppercase text-[11px]">Bài viết</div>
                                <div className="text-2xl font-black text-text mt-1">{stats?.postsCount || contentList.filter(c=>c.type==='post').length}</div>
                            </div>
                            <FontAwesomeIcon icon={faFileLines} className="text-indigo-500/40 text-xl" />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-text-muted uppercase text-[11px]">Bình luận</div>
                                <div className="text-2xl font-black text-text mt-1">{stats?.commentsCount || contentList.filter(c=>c.type==='comment').length}</div>
                            </div>
                            <FontAwesomeIcon icon={faSliders} className="text-emerald-500/40 text-xl" />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-text-muted uppercase text-[11px]">Cộng đồng</div>
                                <div className="text-2xl font-black text-text mt-1">{stats?.communitiesCount || communitiesList.length}</div>
                            </div>
                            <FontAwesomeIcon icon={faUsersGear} className="text-amber-500/40 text-xl" />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-text-muted uppercase text-[11px]">Chờ xử lý</div>
                                <div className="text-2xl font-black text-rose-500 mt-1">{stats?.pendingReportsCount || 0}</div>
                            </div>
                            <FontAwesomeIcon icon={faClock} className="text-rose-500/40 text-xl" />
                        </div>
                    </div>

                    {/* Growth & Statistics Section */}
                    <div className="border border-border p-4 bg-surface space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3 font-mono font-bold text-xs uppercase text-primary">
                            <FontAwesomeIcon icon={faChartLine} />
                            <span>Chỉ số tăng trưởng & Hiệu suất hệ thống (Growth & Statistics)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
                            <div className="p-3 border border-border bg-surface-hover/30 space-y-1">
                                <div className="text-text-muted text-[11px]">Tăng trưởng người dùng mới</div>
                                <div className="text-xl font-bold text-emerald-500">+{stats?.growth.userGrowthPercent}%</div>
                                <div className="text-[10px] text-text-muted">So với tuần trước</div>
                            </div>

                            <div className="p-3 border border-border bg-surface-hover/30 space-y-1">
                                <div className="text-text-muted text-[11px]">Tốc độ tạo nội dung</div>
                                <div className="text-xl font-bold text-indigo-500">+{stats?.growth.postVelocityPercent}%</div>
                                <div className="text-[10px] text-text-muted">Bài viết & bình luận/ngày</div>
                            </div>

                            <div className="p-3 border border-border bg-surface-hover/30 space-y-1">
                                <div className="text-text-muted text-[11px]">Tỷ lệ giải quyết báo cáo</div>
                                <div className="text-xl font-bold text-amber-500">{stats?.growth.resolutionRatePercent}%</div>
                                <div className="text-[10px] text-text-muted">Đã duyệt / bác bỏ thành công</div>
                            </div>

                            <div className="p-3 border border-border bg-surface-hover/30 space-y-1">
                                <div className="text-text-muted text-[11px]">Cộng đồng đang hoạt động</div>
                                <div className="text-xl font-bold text-cyan-500">{stats?.growth.activeCommunitiesPercent}%</div>
                                <div className="text-[10px] text-text-muted">Không bị vô hiệu hóa</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary flex justify-between items-center">
                                <span>BÁO CÁO MỚI CHỜ XỬ LÝ</span>
                                <button onClick={() => setActiveTab("reports")} className="text-[11px] hover:underline cursor-pointer">Xem tất cả &rarr;</button>
                            </div>
                            <div className="divide-y divide-border">
                                {reportsList.filter(r => r.status === "pending").slice(0, 3).map(r => (
                                    <div key={r.id} className="py-2 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-text">#{r.id} — {r.reason}</div>
                                            <div className="text-[11px] text-text-muted">Loại: {r.targetType.toUpperCase()} | Tác giả: {r.targetAuthor}</div>
                                        </div>
                                        <button onClick={() => { setSelectedReport(r); setActiveTab("reports"); }} className="px-2 py-1 border border-border hover:bg-surface-hover text-[11px]">
                                            Xử lý
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary flex justify-between items-center">
                                <span>CỘNG ĐỒNG NỔI BẬT</span>
                                <button onClick={() => setActiveTab("communities")} className="text-[11px] hover:underline cursor-pointer">Quản lý &rarr;</button>
                            </div>
                            <div className="divide-y divide-border">
                                {communitiesList.slice(0, 3).map(c => (
                                    <div key={c.id} className="py-2 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-text">{c.name}</div>
                                            <div className="text-[11px] text-text-muted">{c.membersCount.toLocaleString()} thành viên | Trưởng: {c.ownerId}</div>
                                        </div>
                                        <span className={`text-[10px] border px-1.5 py-0.5 ${c.isDisabled ? "border-rose-500 text-rose-500" : "border-emerald-500 text-emerald-500"}`}>
                                            {c.isDisabled ? "DISABLED" : "ACTIVE"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: USERS */}
            {activeTab === "users" && (
                <div className="space-y-4 font-mono text-xs">
                    {/* Search & Filter Toolbar */}
                    <div className="border border-border p-3 bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-72">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Tìm theo tên, username, email..."
                                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="bg-surface border border-border text-text px-2 py-1 focus:outline-none focus:border-primary"
                            >
                                <option value="all">TẤT CẢ VAI TRÒ</option>
                                <option value="admin">ADMIN</option>
                                <option value="moderator">MODERATOR</option>
                                <option value="user">USER</option>
                            </select>

                            <div className="flex items-center gap-1">
                                {(["all", "active", "banned", "suspended"] as const).map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setUserStatusFilter(st)}
                                        className={`px-2 py-1 border transition-colors cursor-pointer uppercase text-[11px] ${
                                            userStatusFilter === st
                                                ? "border-primary bg-primary text-white font-bold"
                                                : "border-border bg-surface-hover text-text-muted hover:text-text"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="border border-border bg-surface overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-hover text-text-muted border-b border-border uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="p-3">NGƯỜI DÙNG</th>
                                    <th className="p-3">EMAIL</th>
                                    <th className="p-3">VAI TRÒ</th>
                                    <th className="p-3">TRẠNG THÁI</th>
                                    <th className="p-3 text-right">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredUsers.map((u) => {
                                    const isSuspended = u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
                                    return (
                                        <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar} alt={u.name} className="w-7 h-7 object-cover border border-border shrink-0" />
                                                    <div>
                                                        <div className="font-bold text-text">{u.name}</div>
                                                        <div className="text-[11px] text-text-muted">@{u.username} (ID: {u.id})</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-text-muted text-[11px]">{u.email}</td>
                                            <td className="p-3">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => void handleRoleChange(u.id, e.target.value as "admin" | "moderator" | "user")}
                                                    className="bg-surface border border-border text-text text-[11px] px-1 py-0.5 focus:outline-none focus:border-primary uppercase font-bold"
                                                >
                                                    <option value="admin">ADMIN</option>
                                                    <option value="moderator">MODERATOR</option>
                                                    <option value="user">USER</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                {u.isBanned ? (
                                                    <span className="border border-rose-500 text-rose-500 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase">BANNED</span>
                                                ) : isSuspended ? (
                                                    <span className="border border-amber-500 text-amber-500 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase" title={`Tạm khóa tới ${u.suspendedUntil}`}>
                                                        SUSPENDED
                                                    </span>
                                                ) : (
                                                    <span className="border border-emerald-500 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase">ACTIVE</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setSelectedUser(u)}
                                                        className="px-2 py-1 border border-border hover:bg-surface-hover text-text transition-colors cursor-pointer text-[11px]"
                                                        title="Xem hồ sơ & báo cáo liên quan"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} /> Detail
                                                    </button>

                                                    <button
                                                        onClick={() => void handleSuspend(u.id, 7)}
                                                        className="px-2 py-1 border border-amber-500/60 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer text-[11px]"
                                                        title="Tạm khóa 7 ngày"
                                                    >
                                                        Suspend (7d)
                                                    </button>

                                                    {u.isBanned ? (
                                                        <button onClick={() => void handleUnban(u.id)} className="px-2 py-1 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-[11px]">
                                                            Unban
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => void handleBan(u.id)} className="px-2 py-1 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-[11px]">
                                                            Ban
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: COMMUNITIES */}
            {activeTab === "communities" && (
                <div className="space-y-4 font-mono text-xs">
                    <div className="border border-border p-3 bg-surface flex items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={communitySearch}
                                onChange={(e) => setCommunitySearch(e.target.value)}
                                placeholder="Tìm tên cộng đồng, thể loại..."
                                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="border border-border bg-surface divide-y divide-border">
                        {filteredCommunities.map((c) => (
                            <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/50">
                                <div className="flex items-start gap-3">
                                    <img src={c.logo} alt={c.name} className="w-10 h-10 object-cover border border-border shrink-0" />
                                    <div>
                                        <div className="font-bold text-text flex items-center gap-2">
                                            <span>{c.name}</span>
                                            <span className="border border-border px-1.5 py-0.2 text-[10px] text-text-muted uppercase">{c.category}</span>
                                            {c.isDisabled && <span className="border border-rose-500 text-rose-500 px-1.5 py-0.2 text-[10px] font-bold">DISABLED</span>}
                                        </div>
                                        <p className="text-text-muted text-[11px] mt-0.5">{c.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted mt-2">
                                            <span>Thành viên: <strong className="text-text">{c.membersCount.toLocaleString()}</strong></span>
                                            <span>Owner ID: <strong className="text-primary">{c.ownerId}</strong></span>
                                            <span>Mods: <strong className="text-text">{c.moderators.join(", ")}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                                    <button
                                        onClick={() => setSelectedCommunity(c)}
                                        className="px-2.5 py-1.5 border border-border hover:bg-surface-hover text-text transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faEye} /> Chi tiết
                                    </button>

                                    <button
                                        onClick={() => void handleAddModerator(c.id, c.moderators)}
                                        className="px-2.5 py-1.5 border border-indigo-500/50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        + Thêm Mod
                                    </button>

                                    {c.moderators.length > 0 && (
                                        <button
                                            onClick={() => {
                                                const target = prompt(`Nhập ID Moderator muốn gỡ khỏi ${c.name} (Danh sách: ${c.moderators.join(", ")}):`);
                                                if (target) void handleRemoveModerator(c.id, c.moderators, target);
                                            }}
                                            className="px-2.5 py-1.5 border border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                        >
                                            - Gỡ Mod
                                        </button>
                                    )}

                                    <button
                                        onClick={() => void handleTransferOwnership(c.id)}
                                        className="px-2.5 py-1.5 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faCrown} /> Đổi Owner
                                    </button>

                                    <button
                                        onClick={() => void handleToggleCommunity(c.id)}
                                        className={`px-2.5 py-1.5 border transition-colors cursor-pointer font-bold ${
                                            c.isDisabled
                                                ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                : "border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white"
                                        }`}
                                    >
                                        {c.isDisabled ? "Kích hoạt" : "Vô hiệu hóa"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: CONTENT */}
            {activeTab === "content" && (
                <div className="space-y-4 font-mono text-xs">
                    <div className="border border-border p-3 bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={contentSearch}
                                onChange={(e) => setContentSearch(e.target.value)}
                                placeholder="Tìm bài viết, bình luận, tác giả..."
                                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            {(["all", "post", "comment", "deleted"] as const).map((tp) => (
                                <button
                                    key={tp}
                                    onClick={() => setContentTypeFilter(tp)}
                                    className={`px-2.5 py-1 border transition-colors cursor-pointer uppercase text-[11px] ${
                                        contentTypeFilter === tp
                                            ? "border-primary bg-primary text-white font-bold"
                                            : "border-border bg-surface-hover text-text-muted hover:text-text"
                                    }`}
                                >
                                    {tp === "deleted" ? "Đã Xóa" : tp}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border border-border bg-surface divide-y divide-border">
                        {filteredContent.map((item) => (
                            <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/50">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="border border-border px-1.5 py-0.2 text-[10px] text-text-muted uppercase">#{item.id}</span>
                                        <span className={`border px-1.5 py-0.2 text-[10px] uppercase font-bold ${
                                            item.type === "post" ? "border-indigo-500 text-indigo-500" : "border-amber-500 text-amber-500"
                                        }`}>
                                            {item.type}
                                        </span>
                                        {item.isDeleted && (
                                            <span className="border border-rose-500 bg-rose-500/10 text-rose-500 px-1.5 py-0.2 text-[10px] font-bold uppercase">
                                                ĐÃ XÓA (DELETED)
                                            </span>
                                        )}
                                        {item.reportsCount > 0 && (
                                            <span className="border border-amber-500 text-amber-500 px-1.5 py-0.2 text-[10px] font-bold">
                                                {item.reportsCount} Reports
                                            </span>
                                        )}
                                    </div>

                                    {item.title && <div className="font-bold text-text text-sm">{item.title}</div>}
                                    <p className="text-text-muted text-xs italic">"{item.content}"</p>

                                    <div className="flex items-center gap-4 text-[11px] text-text-muted">
                                        <span>Tác giả: <strong className="text-text">{item.authorName}</strong> (ID: {item.authorId})</span>
                                        <span>Ngày tạo: {new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                                    {item.isDeleted ? (
                                        <button
                                            onClick={() => item.type === "post" ? void handleRestorePost(item.id) : void handleRestoreComment(item.id)}
                                            className="px-3 py-1.5 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <FontAwesomeIcon icon={faRotateLeft} /> Khôi phục
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => item.type === "post" ? void handleDeletePost(item.id) : void handleDeleteComment(item.id)}
                                            className="px-3 py-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Xóa
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: REPORTS */}
            {activeTab === "reports" && (
                <div className="space-y-4 font-mono text-xs">
                    <div className="border border-border p-3 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-text-muted flex items-center gap-1"><FontAwesomeIcon icon={faFilter} /> Trạng thái:</span>
                            {(["pending", "all", "resolved", "rejected"] as const).map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setReportStatusFilter(st)}
                                    className={`px-2.5 py-1 border transition-colors cursor-pointer capitalize ${
                                        reportStatusFilter === st
                                            ? "border-primary bg-primary text-white font-bold"
                                            : "border-border bg-surface-hover text-text-muted hover:text-text"
                                    }`}
                                >
                                    {st === "pending" ? "Chờ duyệt" : st === "resolved" ? "Đã duyệt" : st === "rejected" ? "Từ chối" : "Tất cả"}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-muted">Loại đối tượng:</span>
                            <select
                                value={reportTypeFilter}
                                onChange={(e) => setReportTypeFilter(e.target.value as "all" | "post" | "comment" | "user")}
                                className="bg-surface border border-border text-text px-2 py-1 font-mono focus:outline-none focus:border-primary"
                            >
                                <option value="all">TẤT CẢ LOẠI</option>
                                <option value="post">POST</option>
                                <option value="comment">COMMENT</option>
                                <option value="user">USER</option>
                            </select>
                        </div>
                    </div>

                    <div className="border border-border divide-y divide-border bg-surface">
                        {filteredReports.map((rep) => (
                            <div key={rep.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/50">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-surface-hover border border-border px-1.5 py-0.5 text-text-muted text-[11px]">#{rep.id}</span>
                                        <span className="border border-indigo-500/40 text-indigo-500 uppercase font-bold px-1.5 py-0.5 text-[10px]">{rep.targetType}</span>
                                        <span className={`border px-1.5 py-0.5 text-[10px] font-bold ${
                                            rep.status === "pending" ? "border-amber-500 text-amber-500" : rep.status === "resolved" ? "border-emerald-500 text-emerald-500" : "border-rose-500 text-rose-500"
                                        }`}>
                                            {rep.status.toUpperCase()}
                                        </span>
                                        {rep.assignedTo && <span className="border border-cyan-500 text-cyan-500 px-1.5 py-0.5 text-[10px]">Phân công: {rep.assignedTo}</span>}
                                    </div>

                                    <div className="text-sm font-semibold text-text">
                                        {rep.reason} {rep.targetTitle && <span className="text-text-muted font-normal">— "{rep.targetTitle}"</span>}
                                    </div>
                                    {rep.description && <p className="text-xs text-text-muted border-l-2 border-primary/50 pl-3 py-0.5 italic">"{rep.description}"</p>}

                                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-muted">
                                        <span>Target ID: <strong className="text-text">{rep.targetId}</strong></span>
                                        <span>Tác giả: <strong className="text-text">{rep.targetAuthor}</strong></span>
                                        <span>Người báo cáo: <strong className="text-text">{rep.reporterId}</strong></span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                                    <button onClick={() => setSelectedReport(rep)} className="px-2.5 py-1.5 border border-border hover:bg-surface-hover text-text">
                                        <FontAwesomeIcon icon={faEye} /> Xem
                                    </button>

                                    <button onClick={() => void handleAssignReport(rep.id)} className="px-2.5 py-1.5 border border-indigo-500/50 text-indigo-500 hover:bg-indigo-500 hover:text-white">
                                        <FontAwesomeIcon icon={faUserShield} /> Assign
                                    </button>

                                    {rep.status === "pending" && (
                                        <>
                                            <button onClick={() => void handleResolveReport(rep.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                                Duyệt
                                            </button>
                                            <button onClick={() => void handleRejectReport(rep.id)} className="px-3 py-1.5 border border-border hover:bg-surface-hover text-text-muted">
                                                Bác bỏ
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 6: GAMES */}
            {activeTab === "games" && (
                <div className="space-y-4 font-mono text-xs">
                    <div className="border border-border p-3 bg-surface flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={gameSearch}
                                onChange={(e) => setGameSearch(e.target.value)}
                                placeholder="Tìm tựa game, nhà phát triển..."
                                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                            />
                        </div>

                        <button
                            onClick={() => handleOpenGameModal(null)}
                            className="px-4 py-2 bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Thêm Game Mới</span>
                        </button>
                    </div>

                    <div className="border border-border bg-surface divide-y divide-border">
                        {filteredGames.map((g) => (
                            <div key={g.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-hover/50">
                                <div className="flex items-start gap-3">
                                    <img src={g.bannerUrl} alt={g.name} className="w-16 h-10 object-cover border border-border shrink-0" />
                                    <div>
                                        <div className="font-bold text-text flex items-center gap-2">
                                            <span>{g.name}</span>
                                            <span className="text-text-muted text-[11px]">({g.slug})</span>
                                            {g.isDisabled && <span className="border border-rose-500 text-rose-500 px-1.5 py-0.2 text-[10px] font-bold">DISABLED</span>}
                                        </div>
                                        <div className="text-text-muted text-[11px] mt-0.5">
                                            Thể loại: <strong className="text-text">{g.genre.join(", ")}</strong> | Nhà phát triển: <strong className="text-text">{g.developer}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                                    <button
                                        onClick={() => handleOpenGameModal(g)}
                                        className="px-2.5 py-1.5 border border-border hover:bg-surface-hover text-text transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} /> Chỉnh sửa
                                    </button>

                                    <button
                                        onClick={() => void handleToggleGame(g.id)}
                                        className={`px-2.5 py-1.5 border transition-colors cursor-pointer font-bold ${
                                            g.isDisabled
                                                ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                : "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                                        }`}
                                    >
                                        {g.isDisabled ? "Kích hoạt" : "Tạm ngưng"}
                                    </button>

                                    <button
                                        onClick={() => void handleDeleteGame(g.id)}
                                        className="px-2.5 py-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 7: ADMIN SETTINGS */}
            {activeTab === "settings" && settings && (
                <div className="space-y-6 font-mono text-xs">
                    {/* 1. General Settings */}
                    <div className="border border-border p-4 bg-surface space-y-3">
                        <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                            <FontAwesomeIcon icon={faGear} /> 1. Cấu hình Chung (General Settings)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-text-muted mb-1">Tên hệ thống (System Name):</label>
                                <input
                                    type="text"
                                    value={settings.general.systemName}
                                    onChange={(e) => setSettings({ ...settings, general: { ...settings.general, systemName: e.target.value } })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Email hệ thống (System Email):</label>
                                <input
                                    type="email"
                                    value={settings.general.systemEmail}
                                    onChange={(e) => setSettings({ ...settings, general: { ...settings.general, systemEmail: e.target.value } })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Ngôn ngữ mặc định:</label>
                                <select
                                    value={settings.general.defaultLanguage}
                                    onChange={(e) => setSettings({ ...settings, general: { ...settings.general, defaultLanguage: e.target.value } })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                >
                                    <option value="vi">Tiếng Việt (VI)</option>
                                    <option value="en">English (EN)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Registration Settings */}
                    <div className="border border-border p-4 bg-surface space-y-3">
                        <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                            <FontAwesomeIcon icon={faUserShield} /> 2. Cấu hình Đăng ký (Registration Settings)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                <input
                                    type="checkbox"
                                    checked={settings.registration.allowRegistration}
                                    onChange={(e) => setSettings({ ...settings, registration: { ...settings.registration, allowRegistration: e.target.checked } })}
                                />
                                <span>Cho phép đăng ký mới</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                <input
                                    type="checkbox"
                                    checked={settings.registration.requireEmailVerification}
                                    onChange={(e) => setSettings({ ...settings, registration: { ...settings.registration, requireEmailVerification: e.target.checked } })}
                                />
                                <span>Yêu cầu xác thực Email</span>
                            </label>

                            <div>
                                <label className="block text-text-muted mb-1">Vai trò mặc định người dùng mới:</label>
                                <select
                                    value={settings.registration.defaultRole}
                                    onChange={(e) => setSettings({ ...settings, registration: { ...settings.registration, defaultRole: e.target.value as "user" | "moderator" } })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                >
                                    <option value="user">USER</option>
                                    <option value="moderator">MODERATOR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Moderation & 4. Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faShieldHalved} /> 3. Quy tắc Kiểm duyệt (Moderation Rules)
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-text-muted mb-1">Ngưỡng tự động gắn cờ (Auto-flag threshold):</label>
                                    <input
                                        type="number"
                                        value={settings.moderation.autoFlagThreshold}
                                        onChange={(e) => setSettings({ ...settings, moderation: { ...settings.moderation, autoFlagThreshold: parseInt(e.target.value) || 3 } })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                    <input
                                        type="checkbox"
                                        checked={settings.moderation.autoHideReportedContent}
                                        onChange={(e) => setSettings({ ...settings, moderation: { ...settings.moderation, autoHideReportedContent: e.target.checked } })}
                                    />
                                    <span>Tự động ẩn bài viết khi vượt ngưỡng báo cáo</span>
                                </label>
                            </div>
                        </div>

                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faFileLines} /> 4. Cấu hình Nội dung (Content Settings)
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-text-muted mb-1">Kích thước file tải lên tối đa (MB):</label>
                                    <input
                                        type="number"
                                        value={settings.content.maxUploadMB}
                                        onChange={(e) => setSettings({ ...settings, content: { ...settings.content, maxUploadMB: parseInt(e.target.value) || 10 } })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                    <input
                                        type="checkbox"
                                        checked={settings.content.nsfwFilterEnabled}
                                        onChange={(e) => setSettings({ ...settings, content: { ...settings.content, nsfwFilterEnabled: e.target.checked } })}
                                    />
                                    <span>Kích hoạt bộ lọc NSFW tự động</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 5. Notifications & 6. Security */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faBullhorn} /> 5. Thông báo Toàn hệ thống (Notifications)
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Thông báo Broadcast gửi tất cả user:</label>
                                <textarea
                                    value={settings.notifications.systemBroadcast}
                                    onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, systemBroadcast: e.target.value } })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary h-20"
                                />
                            </div>
                        </div>

                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-primary uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faLock} /> 6. Bảo mật Admin (Security Settings)
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                    <input
                                        type="checkbox"
                                        checked={settings.security.require2FA}
                                        onChange={(e) => setSettings({ ...settings, security: { ...settings.security, require2FA: e.target.checked } })}
                                    />
                                    <span>Bắt buộc 2FA cho tài khoản Admin & Mod</span>
                                </label>
                                <div>
                                    <label className="block text-text-muted mb-1">Giới hạn Rate Limit (requests/phút):</label>
                                    <input
                                        type="number"
                                        value={settings.security.rateLimitPerMin}
                                        onChange={(e) => setSettings({ ...settings, security: { ...settings.security, rateLimitPerMin: parseInt(e.target.value) || 120 } })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 7. Maintenance & 8. Feature Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-rose-500 uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} /> 7. Chế độ Bảo trì (Maintenance)
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-rose-500/50 bg-rose-500/10 text-rose-500 font-bold">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenance.maintenanceMode}
                                        onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, maintenanceMode: e.target.checked } })}
                                    />
                                    <span>BẬT CHẾ ĐỘ BẢO TRÌ HỆ THỐNG</span>
                                </label>
                                <div>
                                    <label className="block text-text-muted mb-1">Thông báo bảo trì hiển thị với user:</label>
                                    <input
                                        type="text"
                                        value={settings.maintenance.maintenanceNotice}
                                        onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, maintenanceNotice: e.target.value } })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-border p-4 bg-surface space-y-3">
                            <div className="font-bold border-b border-border pb-2 text-indigo-500 uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faSliders} /> 8. Feature Flags (Bật/tắt tính năng)
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: "enableAIAssistant", label: "AI Assistant" },
                                    { key: "enableLiveChat", label: "Live Chat Engine" },
                                    { key: "enableSquadFinder", label: "Squad Matchmaking" },
                                    { key: "enableGuildTournaments", label: "Guild Tournaments" },
                                ].map((flag) => (
                                    <label key={flag.key} className="flex items-center gap-2 cursor-pointer p-2 border border-border bg-surface-hover/20">
                                        <input
                                            type="checkbox"
                                            checked={settings.featureFlags[flag.key as keyof typeof settings.featureFlags]}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                featureFlags: {
                                                    ...settings.featureFlags,
                                                    [flag.key]: e.target.checked
                                                }
                                            })}
                                        />
                                        <span>{flag.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 flex justify-end">
                        <button
                            onClick={() => void handleUpdateSettings(settings)}
                            className="px-6 py-2.5 bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-2 text-xs"
                        >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            <span>LƯU CẤU HÌNH QUẢN TRỊ</span>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 1: USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-lg p-6 space-y-4 font-mono text-xs text-text shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2 font-bold uppercase text-primary">
                                <FontAwesomeIcon icon={faUser} />
                                <span>THÔNG TIN NGƯỜI DÙNG</span>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-text-muted hover:text-text cursor-pointer p-1">
                                <FontAwesomeIcon icon={faXmark} className="text-base" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4 pt-2">
                            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-16 h-16 object-cover border border-border shrink-0" />
                            <div className="space-y-1">
                                <h3 className="text-base font-extrabold text-text">{selectedUser.name}</h3>
                                <p className="text-text-muted">@{selectedUser.username}</p>
                                <p className="text-text-muted">{selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="border border-border divide-y divide-border bg-surface-hover/50 p-3 space-y-1">
                            <div className="flex justify-between py-1"><span className="text-text-muted">USER ID:</span><span className="font-bold">{selectedUser.id}</span></div>
                            <div className="flex justify-between py-1"><span className="text-text-muted">VAI TRÒ:</span><span className="font-extrabold uppercase text-primary">{selectedUser.role}</span></div>
                            <div className="flex justify-between py-1">
                                <span className="text-text-muted">TRẠNG THÁI:</span>
                                <span className={`font-extrabold ${selectedUser.isBanned ? "text-rose-500" : "text-emerald-500"}`}>
                                    {selectedUser.isBanned ? "BANNED" : "ACTIVE"}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-border pt-3 flex items-center justify-between">
                            <button onClick={() => setSelectedUser(null)} className="px-4 py-2 border border-border hover:bg-surface-hover font-bold">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: COMMUNITY DETAIL MODAL */}
            {selectedCommunity && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-lg p-6 space-y-4 font-mono text-xs text-text shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2 font-bold uppercase text-primary">
                                <FontAwesomeIcon icon={faUsersGear} />
                                <span>CHI TIẾT CỘNG ĐỒNG</span>
                            </div>
                            <button onClick={() => setSelectedCommunity(null)} className="text-text-muted hover:text-text cursor-pointer p-1">
                                <FontAwesomeIcon icon={faXmark} className="text-base" />
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            <img src={selectedCommunity.logo} alt={selectedCommunity.name} className="w-16 h-16 object-cover border border-border shrink-0" />
                            <div className="space-y-1">
                                <h3 className="text-base font-extrabold text-text">{selectedCommunity.name}</h3>
                                <p className="text-text-muted">{selectedCommunity.description}</p>
                            </div>
                        </div>

                        <div className="border border-border divide-y divide-border p-3 bg-surface-hover/30">
                            <div className="flex justify-between py-1"><span className="text-text-muted">ID:</span><span className="font-bold">{selectedCommunity.id}</span></div>
                            <div className="flex justify-between py-1"><span className="text-text-muted">Thành viên:</span><span className="font-bold">{selectedCommunity.membersCount.toLocaleString()}</span></div>
                            <div className="flex justify-between py-1"><span className="text-text-muted">Owner ID:</span><span className="font-bold text-primary">{selectedCommunity.ownerId}</span></div>
                            <div className="flex justify-between py-1"><span className="text-text-muted">Moderators:</span><span className="font-bold">{selectedCommunity.moderators.join(", ")}</span></div>
                        </div>

                        <div className="border-t border-border pt-3 flex justify-end">
                            <button onClick={() => setSelectedCommunity(null)} className="px-4 py-2 border border-border hover:bg-surface-hover font-bold">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: REPORT DETAIL MODAL */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border w-full max-w-xl p-6 space-y-4 font-mono text-xs text-text shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2 font-bold uppercase text-primary">
                                <FontAwesomeIcon icon={faFlag} />
                                <span>BÁO CÁO VI PHẠM #{selectedReport.id}</span>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-text-muted hover:text-text cursor-pointer p-1">
                                <FontAwesomeIcon icon={faXmark} className="text-base" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="border border-border bg-surface-hover/40 p-3 space-y-2">
                                <div><strong className="text-text-muted">Lý do:</strong> <span className="font-bold">{selectedReport.reason}</span></div>
                                {selectedReport.targetTitle && <div><strong className="text-text-muted">Tiêu đề:</strong> <span>{selectedReport.targetTitle}</span></div>}
                                {selectedReport.description && <div className="border-l-2 border-amber-500 pl-3 italic">"{selectedReport.description}"</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted border border-border p-2">
                                <div>Target ID: <span className="font-bold text-text">{selectedReport.targetId}</span></div>
                                <div>Tác giả: <span className="font-bold text-text">{selectedReport.targetAuthor || "N/A"}</span></div>
                                <div>Người báo cáo: <span className="font-bold text-text">{selectedReport.reporterId}</span></div>
                                <div>Assignee: <span className="font-bold text-primary">{selectedReport.assignedTo || "Unassigned"}</span></div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-3 flex justify-end gap-2">
                            <button onClick={() => setSelectedReport(null)} className="px-4 py-2 border border-border hover:bg-surface-hover font-bold">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: GAME CREATE / EDIT MODAL */}
            {gameModal.open && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <form onSubmit={(e) => void handleSaveGame(e)} className="bg-surface border border-border w-full max-w-lg p-6 space-y-4 font-mono text-xs text-text shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2 font-bold uppercase text-primary">
                                <FontAwesomeIcon icon={faGamepad} />
                                <span>{gameModal.game ? "CHỈNH SỬA TỰA GAME" : "THÊM GAME MỚI"}</span>
                            </div>
                            <button type="button" onClick={() => setGameModal({ open: false, game: null })} className="text-text-muted hover:text-text cursor-pointer p-1">
                                <FontAwesomeIcon icon={faXmark} className="text-base" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-text-muted mb-1">Tên Tựa Game:</label>
                                <input
                                    type="text"
                                    required
                                    value={gameForm.name}
                                    onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Slug (đường dẫn):</label>
                                <input
                                    type="text"
                                    required
                                    value={gameForm.slug}
                                    onChange={(e) => setGameForm({ ...gameForm, slug: e.target.value })}
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Thể loại (phân cách bằng dấu phẩy):</label>
                                <input
                                    type="text"
                                    required
                                    value={gameForm.genre}
                                    onChange={(e) => setGameForm({ ...gameForm, genre: e.target.value })}
                                    placeholder="FPS, Esports, Action"
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-text-muted mb-1">Nhà phát triển:</label>
                                    <input
                                        type="text"
                                        required
                                        value={gameForm.developer}
                                        onChange={(e) => setGameForm({ ...gameForm, developer: e.target.value })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-muted mb-1">Nhà phát hành:</label>
                                    <input
                                        type="text"
                                        required
                                        value={gameForm.publisher}
                                        onChange={(e) => setGameForm({ ...gameForm, publisher: e.target.value })}
                                        className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-text-muted mb-1">Ảnh Bìa URL (Banner Image):</label>
                                <input
                                    type="url"
                                    value={gameForm.bannerUrl}
                                    onChange={(e) => setGameForm({ ...gameForm, bannerUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full p-2 bg-surface border border-border text-text focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setGameModal({ open: false, game: null })} className="px-4 py-2 border border-border hover:bg-surface-hover font-bold">
                                Hủy
                            </button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold hover:bg-primary-hover">
                                Lưu Tựa Game
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
