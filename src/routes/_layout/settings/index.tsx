import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faShieldHalved, faGlobe, faBug, faLightbulb, faCheckCircle, faArrowLeft, faBan, faGamepad, faCheck,
    faEye, faBell, faLaptop, faMobileScreen, faExclamationTriangle,
    faUserClock, faArrowUp, faArrowDown, faSun, faMoon, faLanguage,
    faChevronRight, faXmark, faSliders
} from '@fortawesome/free-solid-svg-icons';
import { useThemeStore } from '@/shared/store/useThemeStore';
import { useGameStore } from '@/features/game';
import { INITIAL_GAMES } from '@/features/game/constants';

export const Route = createFileRoute('/_layout/settings/')({
    component: SettingsPage,
});

interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
    icon: typeof faLaptop | typeof faMobileScreen;
}

interface BlockedUser {
    id: string;
    name: string;
    username: string;
    avatar: string;
    blockedAt: string;
    reason: string;
}

export function SettingsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<
        "general" | "quickAccess" | "privacy" | "notifications" | "account" | "blocked" | "feedback" | "danger"
    >("general");

    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const language = useThemeStore((state) => state.language);
    const toggleLanguage = useThemeStore((state) => state.toggleLanguage);

    // 1. Quick Access
    const quickAccessSlugs = useGameStore((state) => state.quickAccessSlugs);
    const setQuickAccessSlugs = useGameStore((state) => state.setQuickAccessSlugs);
    const [tempSelectedSlugs, setTempSelectedSlugs] = useState<string[]>(quickAccessSlugs);
    const [saveQuickAccessSuccess, setSaveQuickAccessSuccess] = useState(false);

    // 2. Privacy Settings
    const [privacy, setPrivacy] = useState({
        profileVisibility: "public" as "public" | "friends" | "private",
        onlineStatus: true,
        gameLibraryVisibility: "public" as "public" | "friends" | "private",
    });

    // 3. Notifications Settings
    const [notifications, setNotifications] = useState({
        comments: true,
        replies: true,
        likes: true,
        mentions: true,
        communityActivity: false,
    });

    // 4. Account & Security
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [currentEmail, setCurrentEmail] = useState("user.indieg@gmail.com");
    const [newEmail, setNewEmail] = useState("");
    const [emailPasswordConfirm, setEmailPasswordConfirm] = useState("");
    const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);

    const [changePwdState, setChangePwdState] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [changePwdLoading, setChangePwdLoading] = useState(false);
    const [changePwdError, setChangePwdError] = useState<string | null>(null);
    const [changePwdSuccess, setChangePwdSuccess] = useState<string | null>(null);

    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
        {
            id: "sess-1",
            device: "Windows PC",
            browser: "Chrome 128.0",
            location: "TP. Hồ Chí Minh, Việt Nam",
            ip: "113.161.42.12",
            lastActive: "Đang hoạt động (Thiết bị này)",
            isCurrent: true,
            icon: faLaptop,
        },
        {
            id: "sess-2",
            device: "iPhone 15 Pro",
            browser: "Safari Mobile",
            location: "Đà Nẵng, Việt Nam",
            ip: "14.232.180.88",
            lastActive: "2 giờ trước",
            isCurrent: false,
            icon: faMobileScreen,
        },
        {
            id: "sess-3",
            device: "MacBook Air M2",
            browser: "Firefox 129.0",
            location: "Hà Nội, Việt Nam",
            ip: "118.70.12.99",
            lastActive: "3 ngày trước",
            isCurrent: false,
            icon: faLaptop,
        },
    ]);

    // 5. Blocked Users
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
        {
            id: "u-blocked-1",
            name: "ToxicGamer99",
            username: "toxic99",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ToxicGamer99",
            blockedAt: "2024-07-12",
            reason: "Spam / Ngôn từ đả kích",
        },
        {
            id: "u-blocked-2",
            name: "ScammerBot",
            username: "scammer_xyz",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ScammerBot",
            blockedAt: "2024-08-01",
            reason: "Lừa đảo / Phishing link",
        },
    ]);

    // 6. Feedback
    const [feedbackType, setFeedbackType] = useState<"bug" | "idea">("bug");
    const [feedbackTitle, setFeedbackTitle] = useState("");
    const [feedbackDescription, setFeedbackDescription] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isFeedbackSuccess, setIsFeedbackSuccess] = useState(false);

    // 7. Danger Zone Modals
    const [dangerModal, setDangerModal] = useState<{
        open: boolean;
        type: "deactivate" | "delete" | null;
        confirmText: string;
    }>({ open: false, type: null, confirmText: "" });
    const [dangerAlertMsg, setDangerAlertMsg] = useState<string | null>(null);

    // Handlers
    const handleSaveQuickAccess = () => {
        setQuickAccessSlugs(tempSelectedSlugs);
        setSaveQuickAccessSuccess(true);
        setTimeout(() => setSaveQuickAccessSuccess(false), 2500);
    };

    const moveQuickAccessGame = (slug: string, direction: "up" | "down") => {
        const index = tempSelectedSlugs.indexOf(slug);
        if (index === -1) return;
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === tempSelectedSlugs.length - 1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        const newArr = [...tempSelectedSlugs];
        const temp = newArr[index];
        newArr[index] = newArr[targetIndex];
        newArr[targetIndex] = temp;
        setTempSelectedSlugs(newArr);
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangePwdError(null);
        setChangePwdSuccess(null);

        if (!changePwdState.currentPassword) {
            setChangePwdError("Vui lòng nhập mật khẩu hiện tại!");
            return;
        }
        if (changePwdState.newPassword.length < 8) {
            setChangePwdError("Mật khẩu mới phải có ít nhất 8 ký tự!");
            return;
        }
        if (changePwdState.newPassword !== changePwdState.confirmPassword) {
            setChangePwdError("Mật khẩu xác nhận không trùng khớp!");
            return;
        }

        setChangePwdLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 600));
            setChangePwdSuccess("Đổi mật khẩu thành công!");
            setChangePwdState({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch {
            setChangePwdError("Không thể cập nhật mật khẩu. Vui lòng thử lại.");
        } finally {
            setChangePwdLoading(false);
        }
    };

    const handleChangeEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.includes("@")) {
            setEmailSuccessMsg("Vui lòng nhập địa chỉ email hợp lệ!");
            return;
        }
        if (!emailPasswordConfirm) {
            setEmailSuccessMsg("Vui lòng nhập mật khẩu hiện tại để xác nhận đổi email!");
            return;
        }
        setCurrentEmail(newEmail);
        setIsEmailVerified(false);
        setNewEmail("");
        setEmailPasswordConfirm("");
        setEmailSuccessMsg("Đã cập nhật email thành công! Vui lòng kiểm tra hòm thư để xác thực.");
        setTimeout(() => setEmailSuccessMsg(null), 4000);
    };

    const handleSendVerificationEmail = () => {
        setIsEmailVerified(true);
        setEmailSuccessMsg(`Đã gửi email xác thực đến ${currentEmail}. Email đã được xác minh thành công!`);
        setTimeout(() => setEmailSuccessMsg(null), 4000);
    };

    const handleRevokeSession = (sessionId: string) => {
        setActiveSessions(activeSessions.filter((s) => s.id !== sessionId));
    };

    const handleLogoutAllOtherSessions = () => {
        setActiveSessions(activeSessions.filter((s) => s.isCurrent));
    };

    const handleUnblockUser = (userId: string) => {
        setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
    };

    const handleSubmitFeedback = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingFeedback(true);
        setTimeout(() => {
            setIsSubmittingFeedback(false);
            setIsFeedbackSuccess(true);
            setTimeout(() => {
                setIsFeedbackSuccess(false);
                setFeedbackTitle("");
                setFeedbackDescription("");
            }, 3000);
        }, 600);
    };

    const handleConfirmDangerAction = () => {
        if (dangerModal.type === "deactivate") {
            if (dangerModal.confirmText.trim().toUpperCase() !== "TAM NGUNG") {
                setDangerAlertMsg('Vui lòng gõ chính xác cụm từ "TAM NGUNG"!');
                return;
            }
            alert("Tài khoản của bạn đã được tạm ngưng thành công.");
            setDangerModal({ open: false, type: null, confirmText: "" });
            setDangerAlertMsg(null);
        } else if (dangerModal.type === "delete") {
            if (dangerModal.confirmText.trim().toUpperCase() !== "XOA TAI KHOAN") {
                setDangerAlertMsg('Vui lòng gõ chính xác cụm từ "XOA TAI KHOAN"!');
                return;
            }
            alert("Tài khoản của bạn đã được xóa vĩnh viễn.");
            setDangerModal({ open: false, type: null, confirmText: "" });
            setDangerAlertMsg(null);
        }
    };

    const navTabs = [
        { id: "general", label: "Giao diện & Ngôn ngữ", icon: faGlobe, desc: "Chủ đề, ngôn ngữ hệ thống" },
        { id: "quickAccess", label: "Game yêu thích", icon: faGamepad, desc: "Lối tắt menu chính" },
        { id: "privacy", label: "Quyền riêng tư", icon: faEye, desc: "Chế độ hiển thị cá nhân" },
        { id: "notifications", label: "Thông báo", icon: faBell, desc: "Tương tác, nhắc tên" },
        { id: "account", label: "Tài khoản & Bảo mật", icon: faShieldHalved, desc: "Mật khẩu, Email, Session" },
        { id: "blocked", label: "Người dùng đã chặn", icon: faBan, desc: "Quản lý danh sách chặn" },
        { id: "feedback", label: "Báo lỗi & Đóng góp", icon: faBug, desc: "Gửi ý kiến phản hồi" },
        { id: "danger", label: "Vùng nguy hiểm", icon: faExclamationTriangle, desc: "Khóa hoặc xóa tài khoản", isDanger: true },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-text">
            {/* Header - Sleek & Compact Panel Header (6px/8px corners) */}
            <div className="bg-surface border border-border/80 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <button 
                        onClick={() => navigate({ to: "/" })}
                        className="w-9 h-9 rounded-md bg-surface-hover/80 border border-border/70 hover:border-primary/60 text-text hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Quay lại Trang chủ"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">
                                User Preferences
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text mt-0.5 tracking-tight">
                            Cài đặt hệ thống
                        </h1>
                    </div>
                </div>
                <div className="text-xs text-text-muted flex items-center gap-2 bg-surface-hover/40 px-3 py-1.5 rounded-md border border-border/50 self-start sm:self-auto">
                    <FontAwesomeIcon icon={faSliders} className="text-primary" />
                    <span>Tuỳ chỉnh tài khoản & cá nhân hóa</span>
                </div>
            </div>

            {/* Layout Grid: Left Clean Navigation Deck + Right Content Frame */}
            <div className="flex flex-col lg:flex-row gap-5 items-start w-full min-w-0">
                
                {/* Left Navigation Deck */}
                <div className="w-full lg:w-72 shrink-0 bg-surface border border-border/80 rounded-lg p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-text-muted/80 border-b border-border/40 mb-1">
                        Danh mục cài đặt
                    </div>

                    <div className="space-y-0.5">
                        {navTabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer text-left border-l-4 ${
                                        isActive
                                            ? tab.isDanger
                                                ? "bg-rose-500/15 border-rose-500 text-rose-500 font-semibold"
                                                : "bg-primary/10 border-primary text-primary font-semibold"
                                            : tab.isDanger
                                            ? "border-transparent hover:bg-rose-500/10 text-rose-500 font-medium"
                                            : "border-transparent hover:bg-surface-hover/80 text-text-muted hover:text-text font-medium"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <FontAwesomeIcon 
                                            icon={tab.icon} 
                                            className={`text-xs shrink-0 w-4 text-center ${
                                                isActive 
                                                    ? tab.isDanger ? "text-rose-500" : "text-primary" 
                                                    : "text-text-muted"
                                            }`} 
                                        />
                                        <span className="text-xs tracking-tight truncate flex-1 min-w-0">{tab.label}</span>
                                    </div>
                                    <FontAwesomeIcon 
                                        icon={faChevronRight} 
                                        className={`text-[10px] shrink-0 ml-1 ${isActive ? (tab.isDanger ? "text-rose-500" : "text-primary") : "text-text-muted/40"}`} 
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content Panel (Stable & Clean, Fixed Dimensions) */}
                <div className="flex-1 w-full min-w-0 bg-surface border border-border/80 rounded-lg p-5 sm:p-6 min-h-[480px]">
                    
                    {/* TAB 1: GENERAL */}
                    {activeTab === "general" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGlobe} className="text-primary text-sm" />
                                    <span>Giao diện & Ngôn ngữ</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Tùy chỉnh chủ đề hiển thị và ngôn ngữ giao diện</p>
                            </div>

                            <div className="space-y-4">
                                {/* Theme */}
                                <div className="p-4 rounded-md border border-border/70 bg-surface-hover/20 space-y-3">
                                    <div className="text-xs font-bold text-text">Chế độ giao diện (Appearance Mode)</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={toggleTheme}
                                            className={`p-3 rounded-md border text-left cursor-pointer transition-colors flex items-center justify-between ${
                                                theme === 'dark' 
                                                    ? "border-primary bg-primary/10 text-text font-bold" 
                                                    : "border-border/60 bg-surface hover:bg-surface-hover text-text-muted"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FontAwesomeIcon icon={faMoon} className="text-primary text-sm" />
                                                <span className="text-xs">Chế độ Tối (Dark)</span>
                                            </div>
                                            {theme === 'dark' && <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />}
                                        </button>

                                        <button
                                            onClick={toggleTheme}
                                            className={`p-3 rounded-md border text-left cursor-pointer transition-colors flex items-center justify-between ${
                                                theme === 'light' 
                                                    ? "border-primary bg-primary/10 text-text font-bold" 
                                                    : "border-border/60 bg-surface hover:bg-surface-hover text-text-muted"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FontAwesomeIcon icon={faSun} className="text-amber-500 text-sm" />
                                                <span className="text-xs">Chế độ Sáng (Light)</span>
                                            </div>
                                            {theme === 'light' && <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="p-4 rounded-md border border-border/70 bg-surface-hover/20 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-text">Ngôn ngữ hiển thị (Language)</div>
                                        <div className="text-[11px] text-text-muted mt-0.5">
                                            Ngôn ngữ hiện tại: {language === 'vi' ? 'Tiếng Việt' : 'English'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleLanguage}
                                        className="px-3 py-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold cursor-pointer flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faLanguage} />
                                        <span>Đổi ({language === 'vi' ? 'EN' : 'VI'})</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: QUICK ACCESS */}
                    {activeTab === "quickAccess" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGamepad} className="text-primary text-sm" />
                                    <span>Lối tắt Game yêu thích (Quick Access)</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Ghim tối đa 4 tựa game lên menu điều hướng nhanh</p>
                            </div>

                            {saveQuickAccessSuccess && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-md text-xs font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span>Đã cập nhật lối tắt thành công!</span>
                                </div>
                            )}

                            {/* Pinned Items */}
                            {tempSelectedSlugs.length > 0 && (
                                <div className="p-3.5 rounded-md border border-primary/30 bg-primary/5 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                                        <span>Danh sách đã ghim ({tempSelectedSlugs.length}/4)</span>
                                        <span className="text-[10px] text-text-muted">Đổi thứ tự bằng nút mũi tên</span>
                                    </div>

                                    <div className="divide-y divide-border/50 border border-border/60 bg-surface rounded-md overflow-hidden">
                                        {tempSelectedSlugs.map((slug, idx) => {
                                            const gameObj = INITIAL_GAMES.find((g) => g.slug === slug);
                                            if (!gameObj) return null;
                                            return (
                                                <div key={slug} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-5 h-5 rounded bg-primary text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <img src={gameObj.logoUrl} alt={gameObj.name} className="w-7 h-7 rounded object-cover border border-border/40 shrink-0" />
                                                        <span className="font-bold text-text truncate">{gameObj.name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            disabled={idx === 0}
                                                            onClick={() => moveQuickAccessGame(slug, "up")}
                                                            className="w-6 h-6 rounded border border-border/60 hover:bg-surface-hover disabled:opacity-20 cursor-pointer flex items-center justify-center text-[10px]"
                                                        >
                                                            <FontAwesomeIcon icon={faArrowUp} />
                                                        </button>
                                                        <button
                                                            disabled={idx === tempSelectedSlugs.length - 1}
                                                            onClick={() => moveQuickAccessGame(slug, "down")}
                                                            className="w-6 h-6 rounded border border-border/60 hover:bg-surface-hover disabled:opacity-20 cursor-pointer flex items-center justify-center text-[10px]"
                                                        >
                                                            <FontAwesomeIcon icon={faArrowDown} />
                                                        </button>
                                                        <button
                                                            onClick={() => setTempSelectedSlugs(tempSelectedSlugs.filter((s) => s !== slug))}
                                                            className="px-2 py-0.5 rounded border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold ml-1"
                                                        >
                                                            Gỡ
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Game List */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted block">Chọn game để ghim:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {INITIAL_GAMES.map((game) => {
                                        const isSelected = tempSelectedSlugs.includes(game.slug);
                                        const canSelect = isSelected || tempSelectedSlugs.length < 4;

                                        return (
                                            <div
                                                key={game.slug}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setTempSelectedSlugs(tempSelectedSlugs.filter((s) => s !== game.slug));
                                                    } else if (canSelect) {
                                                        setTempSelectedSlugs([...tempSelectedSlugs, game.slug]);
                                                    }
                                                }}
                                                className={`p-2.5 rounded-md border transition-colors cursor-pointer flex items-center justify-between ${
                                                    isSelected
                                                        ? "bg-primary/10 border-primary text-text font-bold"
                                                        : "bg-surface border-border/60 hover:border-border text-text-muted"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img src={game.logoUrl} alt={game.name} className="w-7 h-7 rounded object-cover shrink-0 border border-border/40" />
                                                    <span className="text-xs font-bold text-text truncate">{game.name}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-primary border-primary text-white" : "border-border/60 bg-surface"}`}>
                                                    {isSelected && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                <span className="text-xs text-text-muted">Đã chọn: <strong className="text-primary">{tempSelectedSlugs.length}/4</strong></span>
                                <button
                                    onClick={handleSaveQuickAccess}
                                    className="px-5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Lưu cài đặt
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PRIVACY */}
                    {activeTab === "privacy" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faEye} className="text-primary text-sm" />
                                    <span>Quyền riêng tư (Privacy)</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Kiểm soát quyền xem hồ sơ và trạng thái cá nhân</p>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 rounded-md bg-surface border border-border/70 space-y-1.5">
                                    <label className="text-xs font-bold text-text block">Quyền xem Hồ sơ cá nhân</label>
                                    <select
                                        value={privacy.profileVisibility}
                                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as "public" | "friends" | "private" })}
                                        className="w-full bg-surface-hover/50 border border-border/60 text-text rounded-md p-2 text-xs font-bold focus:outline-none focus:border-primary"
                                    >
                                        <option value="public">Công khai (Tất cả mọi người)</option>
                                        <option value="friends">Chỉ bạn bè</option>
                                        <option value="private">Riêng tư (Chỉ mình tôi)</option>
                                    </select>
                                </div>

                                <div className="p-3.5 rounded-md bg-surface border border-border/70 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-text">Trạng thái trực tuyến</div>
                                        <div className="text-[11px] text-text-muted">Hiển thị khi bạn đang online</div>
                                    </div>
                                    <button
                                        onClick={() => setPrivacy({ ...privacy, onlineStatus: !privacy.onlineStatus })}
                                        className={`px-3 py-1 rounded-md border text-xs font-bold cursor-pointer transition-colors ${
                                            privacy.onlineStatus
                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                                : "border-border/60 bg-surface-hover text-text-muted"
                                        }`}
                                    >
                                        {privacy.onlineStatus ? "Bật" : "Tắt"}
                                    </button>
                                </div>

                                <div className="p-3.5 rounded-md bg-surface border border-border/70 space-y-1.5">
                                    <label className="text-xs font-bold text-text block">Hiển thị Tủ game & Thành tích</label>
                                    <select
                                        value={privacy.gameLibraryVisibility}
                                        onChange={(e) => setPrivacy({ ...privacy, gameLibraryVisibility: e.target.value as "public" | "friends" | "private" })}
                                        className="w-full bg-surface-hover/50 border border-border/60 text-text rounded-md p-2 text-xs font-bold focus:outline-none focus:border-primary"
                                    >
                                        <option value="public">Công khai</option>
                                        <option value="friends">Chỉ bạn bè</option>
                                        <option value="private">Riêng tư</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: NOTIFICATIONS */}
                    {activeTab === "notifications" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBell} className="text-primary text-sm" />
                                    <span>Cài đặt Thông báo</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Tùy chọn tương tác muốn nhận thông báo</p>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { key: "comments", label: "Bình luận mới trong bài viết" },
                                    { key: "replies", label: "Phản hồi bình luận của bạn" },
                                    { key: "likes", label: "Lượt thích bài viết & bình luận" },
                                    { key: "mentions", label: "Thẻ nhắc tên (@Mentions)" },
                                    { key: "communityActivity", label: "Hoạt động từ Cộng đồng" },
                                ].map((item) => {
                                    const isChecked = notifications[item.key as keyof typeof notifications];
                                    return (
                                        <div
                                            key={item.key}
                                            onClick={() => setNotifications({ ...notifications, [item.key]: !isChecked })}
                                            className={`p-3 rounded-md border flex items-center justify-between cursor-pointer transition-colors ${
                                                isChecked 
                                                    ? "bg-primary/5 border-primary/40 text-text font-bold" 
                                                    : "bg-surface border-border/60 text-text-muted hover:border-border"
                                            }`}
                                        >
                                            <span className="text-xs font-medium">{item.label}</span>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? "bg-primary border-primary text-white" : "border-border/60 bg-surface"}`}>
                                                {isChecked && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: ACCOUNT & SECURITY */}
                    {activeTab === "account" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-sm" />
                                    <span>Tài khoản & Bảo mật</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Quản lý Email, mật khẩu và phiên làm việc</p>
                            </div>

                            {emailSuccessMsg && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-md text-xs font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span>{emailSuccessMsg}</span>
                                </div>
                            )}

                            {/* Email Card */}
                            <div className="p-4 rounded-md bg-surface border border-border/70 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-text-muted">Email tài khoản</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isEmailVerified ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/30"}`}>
                                        {isEmailVerified ? "Đã xác minh" : "Chưa xác minh"}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded bg-surface-hover/50 border border-border/50 text-xs font-bold text-text">
                                    {currentEmail}
                                </div>

                                {!isEmailVerified && (
                                    <button
                                        onClick={handleSendVerificationEmail}
                                        className="w-full py-1.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors font-bold text-xs cursor-pointer"
                                    >
                                        Gửi email xác thực
                                    </button>
                                )}

                                <form onSubmit={handleChangeEmailSubmit} className="space-y-2 pt-2 border-t border-border/50">
                                    <div className="text-xs font-bold text-text-muted">Đổi Email:</div>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Email mới..."
                                        className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="password"
                                        value={emailPasswordConfirm}
                                        onChange={(e) => setEmailPasswordConfirm(e.target.value)}
                                        placeholder="Mật khẩu hiện tại..."
                                        className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-2 rounded bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer transition-colors"
                                    >
                                        Cập nhật Email
                                    </button>
                                </form>
                            </div>

                            {/* Password Card */}
                            <form onSubmit={handleChangePasswordSubmit} className="p-4 rounded-md bg-surface border border-border/70 space-y-3">
                                <div className="text-xs font-bold uppercase text-text-muted">Đổi mật khẩu</div>

                                {changePwdError && (
                                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                                        {changePwdError}
                                    </div>
                                )}
                                {changePwdSuccess && (
                                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <span>{changePwdSuccess}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        value={changePwdState.currentPassword}
                                        onChange={(e) => setChangePwdState({ ...changePwdState, currentPassword: e.target.value })}
                                        placeholder="Mật khẩu hiện tại..."
                                        className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="password"
                                        value={changePwdState.newPassword}
                                        onChange={(e) => setChangePwdState({ ...changePwdState, newPassword: e.target.value })}
                                        placeholder="Mật khẩu mới (≥8 ký tự)..."
                                        className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="password"
                                        value={changePwdState.confirmPassword}
                                        onChange={(e) => setChangePwdState({ ...changePwdState, confirmPassword: e.target.value })}
                                        placeholder="Xác nhận mật khẩu mới..."
                                        className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={changePwdLoading}
                                    className="w-full py-2 rounded bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                                >
                                    {changePwdLoading ? "Đang xử lý..." : "Cập nhật Mật khẩu"}
                                </button>
                            </form>

                            {/* Active Sessions */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-text-muted">Phiên làm việc ({activeSessions.length}):</span>
                                    <button
                                        onClick={handleLogoutAllOtherSessions}
                                        className="px-2 py-0.5 rounded border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
                                    >
                                        Đăng xuất thiết bị khác
                                    </button>
                                </div>

                                <div className="divide-y divide-border/40 border border-border/60 bg-surface rounded-md overflow-hidden">
                                    {activeSessions.map((s) => (
                                        <div key={s.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <FontAwesomeIcon icon={s.icon} className="text-primary text-sm shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-text flex items-center gap-1.5 truncate">
                                                        <span>{s.device} ({s.browser})</span>
                                                        {s.isCurrent && (
                                                            <span className="bg-emerald-500 text-white text-[8px] px-1 rounded font-extrabold uppercase">Hiện tại</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-text-muted truncate">
                                                        {s.location} • IP: {s.ip}
                                                    </div>
                                                </div>
                                            </div>

                                            {!s.isCurrent && (
                                                <button
                                                    onClick={() => handleRevokeSession(s.id)}
                                                    className="px-2 py-1 rounded border border-border/60 hover:border-rose-500 hover:text-rose-500 text-text-muted transition-colors cursor-pointer text-[10px] shrink-0"
                                                >
                                                    Đăng xuất
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: BLOCKED USERS */}
                    {activeTab === "blocked" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBan} className="text-primary text-sm" />
                                    <span>Danh sách đã chặn</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Quản lý người dùng bị chặn tương tác</p>
                            </div>

                            {blockedUsers.length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-border/60 rounded-md text-text-muted text-xs">
                                    Bạn chưa chặn người dùng nào.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40 border border-border/60 bg-surface rounded-md overflow-hidden">
                                    {blockedUsers.map((u) => (
                                        <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded object-cover border border-border/40 shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="font-bold text-xs text-text truncate">{u.name} (@{u.username})</div>
                                                    <div className="text-[10px] text-text-muted truncate">Lý do: {u.reason}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleUnblockUser(u.id)}
                                                className="px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer font-bold text-xs shrink-0"
                                            >
                                                Bỏ chặn
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 7: FEEDBACK */}
                    {activeTab === "feedback" && (
                        <div className="space-y-5">
                            <div className="border-b border-border/60 pb-3">
                                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBug} className="text-primary text-sm" />
                                    <span>Gửi Báo lỗi & Đóng góp</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Gửi phản hồi trực tiếp đến Ban Quản Trị</p>
                            </div>

                            {isFeedbackSuccess && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-md text-xs font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <span>Cảm ơn bạn! Phản hồi đã được gửi thành công.</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmitFeedback} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text block">Loại phản hồi:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFeedbackType("bug")}
                                            className={`p-2.5 rounded-md border text-xs font-bold transition-colors cursor-pointer ${
                                                feedbackType === "bug"
                                                    ? "bg-rose-500/10 border-rose-500/50 text-rose-500"
                                                    : "bg-surface border-border/60 text-text-muted"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faBug} className="mr-1.5" /> Báo lỗi kỹ thuật
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFeedbackType("idea")}
                                            className={`p-2.5 rounded-md border text-xs font-bold transition-colors cursor-pointer ${
                                                feedbackType === "idea"
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-surface border-border/60 text-text-muted"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faLightbulb} className="mr-1.5" /> Đóng góp ý tưởng
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text block">Tiêu đề:</label>
                                    <input
                                        type="text"
                                        required
                                        value={feedbackTitle}
                                        onChange={(e) => setFeedbackTitle(e.target.value)}
                                        placeholder="Tiêu đề ngắn gọn..."
                                        className="w-full bg-surface border border-border/60 rounded-md p-2 text-xs text-text focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text block">Nội dung chi tiết:</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={feedbackDescription}
                                        onChange={(e) => setFeedbackDescription(e.target.value)}
                                        placeholder="Mô tả nội dung..."
                                        className="w-full bg-surface border border-border/60 rounded-md p-2 text-xs text-text focus:outline-none focus:border-primary resize-y"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingFeedback}
                                    className="w-full py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                                >
                                    {isSubmittingFeedback ? "Đang gửi..." : "Gửi phản hồi"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 8: DANGER ZONE */}
                    {activeTab === "danger" && (
                        <div className="space-y-5">
                            <div className="border-b border-rose-500/30 pb-3">
                                <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span>Vùng nguy hiểm (Danger Zone)</span>
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">Thao tác ảnh hưởng trực tiếp đến trạng thái tài khoản</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Deactivate */}
                                <div className="p-4 rounded-md bg-surface border border-rose-500/30 space-y-2">
                                    <div className="font-bold text-xs text-text flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUserClock} className="text-amber-500" />
                                        <span>Tạm ngưng tài khoản</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted">
                                        Ẩn tài khoản tạm thời. Kích hoạt lại bằng cách đăng nhập lại.
                                    </p>
                                    <button
                                        onClick={() => setDangerModal({ open: true, type: "deactivate", confirmText: "" })}
                                        className="w-full py-2 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors font-bold text-xs cursor-pointer"
                                    >
                                        Tạm ngưng
                                    </button>
                                </div>

                                {/* Delete */}
                                <div className="p-4 rounded-md bg-surface border border-rose-500/40 space-y-2">
                                    <div className="font-bold text-xs text-rose-500 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faBan} />
                                        <span>Xóa tài khoản vĩnh viễn</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted">
                                        Xóa toàn bộ dữ liệu cá nhân vĩnh viễn không thể khôi phục.
                                    </p>
                                    <button
                                        onClick={() => setDangerModal({ open: true, type: "delete", confirmText: "" })}
                                        className="w-full py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors font-bold text-xs cursor-pointer"
                                    >
                                        Xóa tài khoản
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DANGER MODAL */}
            {dangerModal.open && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-surface border border-rose-500/50 w-full max-w-md p-5 rounded-lg space-y-3 shadow-xl relative">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <span className="font-bold text-rose-500 text-xs uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {dangerModal.type === "deactivate" ? "Xác nhận Tạm ngưng" : "Xác nhận Xóa tài khoản"}
                            </span>
                            <button
                                onClick={() => setDangerModal({ open: false, type: null, confirmText: "" })}
                                className="w-6 h-6 rounded border border-border/60 flex items-center justify-center text-text-muted hover:text-text cursor-pointer text-xs"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {dangerAlertMsg && (
                            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                                {dangerAlertMsg}
                            </div>
                        )}

                        <p className="text-xs text-text">
                            {dangerModal.type === "deactivate"
                                ? 'Nhập "TAM NGUNG" để xác nhận tạm ngưng:'
                                : 'Thao tác không thể khôi phục. Nhập "XOA TAI KHOAN" để xác nhận:'}
                        </p>

                        <input
                            type="text"
                            value={dangerModal.confirmText}
                            onChange={(e) => setDangerModal({ ...dangerModal, confirmText: e.target.value })}
                            placeholder={dangerModal.type === "deactivate" ? "TAM NGUNG" : "XOA TAI KHOAN"}
                            className="w-full bg-surface-hover/50 border border-rose-500/50 p-2 rounded-md text-xs font-bold tracking-wider text-center text-text uppercase focus:outline-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                            <button
                                onClick={() => setDangerModal({ open: false, type: null, confirmText: "" })}
                                className="px-3 py-1.5 rounded border border-border/60 bg-surface hover:bg-surface-hover text-xs font-bold cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDangerAction}
                                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
