import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faSearch, faCrown, faShieldHalved, faUserCheck, faUser, faUserMinus, faUserShield } from "@fortawesome/free-solid-svg-icons";
import type { CommunityData, CommunityMember } from "../types";
import { getCurrentAuthor } from "@/features/post";
import { useAuthStore } from "@/features/auth";

interface MemberListModalProps {
    community: CommunityData;
    isOwnerOrAdmin: boolean;
    onClose: () => void;
    onUpdateMembers?: (updatedMembers: CommunityMember[]) => void;
}

const DEFAULT_MEMBERS: CommunityMember[] = [
    {
        username: "ghostrider",
        displayName: "Ghost Rider",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=GhostRider",
        role: "owner",
        joinedAt: "12/05/2025",
    },
    {
        username: "tactical_xeno",
        displayName: "Xeno Tactical",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=XenoTactical",
        role: "admin",
        joinedAt: "18/06/2025",
    },
    {
        username: "cyber_ninja",
        displayName: "Cyber Ninja",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=CyberNinja",
        role: "mod",
        joinedAt: "02/08/2025",
    },
    {
        username: "phoenix_down",
        displayName: "Phoenix Down",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=PhoenixDown",
        role: "member",
        joinedAt: "10/01/2026",
    },
    {
        username: "shadow_blade",
        displayName: "Shadow Blade",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ShadowBlade",
        role: "member",
        joinedAt: "14/02/2026",
    },
];

export const MemberListModal: React.FC<MemberListModalProps> = ({
    community,
    isOwnerOrAdmin,
    onClose,
    onUpdateMembers,
}) => {
    const authorUsername = getCurrentAuthor();
    const { user, customAvatar } = useAuthStore.getState();
    const currentDisplayName = user?.user_metadata?.full_name || user?.username || authorUsername;
    const currentAvatar = customAvatar || user?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorUsername}`;

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "member">("all");

    const [members, setMembers] = useState<CommunityMember[]>(() => {
        if (community.memberList && community.memberList.length > 0) {
            return community.memberList.map((m) => ({
                username: m.username || "anonymous",
                displayName: m.displayName || m.username || "Thành viên",
                avatar: m.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.username || "anon"}`,
                role: m.role || "member",
                joinedAt: m.joinedAt || "Gần đây",
            }));
        }
        // Include current user if joined
        const base = [...DEFAULT_MEMBERS];
        if (community.joined && !base.some((m) => m.username === authorUsername)) {
            base.unshift({
                username: authorUsername,
                displayName: currentDisplayName,
                avatar: currentAvatar,
                role: community.owner === authorUsername ? "owner" : "member",
                joinedAt: "Vừa xong",
            });
        }
        return base;
    });

    const handleRoleChange = (targetUsername: string, newRole: "admin" | "mod" | "member") => {
        const updated = members.map((m) => (m.username === targetUsername ? { ...m, role: newRole } : m));
        setMembers(updated);
        if (onUpdateMembers) onUpdateMembers(updated);
    };

    const handleKickMember = (targetUsername: string) => {
        const updated = members.filter((m) => m.username !== targetUsername);
        setMembers(updated);
        if (onUpdateMembers) onUpdateMembers(updated);
    };

    const filtered = members.filter((m) => {
        const dName = (m.displayName || m.username || "").toLowerCase();
        const uName = (m.username || "").toLowerCase();
        const searchLower = (search || "").toLowerCase();
        const matchesSearch = dName.includes(searchLower) || uName.includes(searchLower);

        if (roleFilter === "staff") return matchesSearch && (m.role === "owner" || m.role === "admin" || m.role === "mod");
        if (roleFilter === "member") return matchesSearch && m.role === "member";
        return matchesSearch;
    });

    const getRoleBadge = (role: CommunityMember["role"]) => {
        switch (role) {
            case "owner":
                return (
                    <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                        <FontAwesomeIcon icon={faCrown} className="text-[9px]" />
                        <span>OWNER</span>
                    </span>
                );
            case "admin":
                return (
                    <span className="bg-rose-500/15 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                        <FontAwesomeIcon icon={faUserShield} className="text-[9px]" />
                        <span>ADMIN</span>
                    </span>
                );
            case "mod":
                return (
                    <span className="bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" />
                        <span>MOD</span>
                    </span>
                );
            default:
                return (
                    <span className="bg-surface-hover text-text-muted border border-border px-2 py-0.5 rounded-md text-[10px] font-bold">
                        THÀNH VIÊN
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUserCheck} className="text-primary" />
                        <h3 className="text-lg font-extrabold text-text">Danh Sách Thành Viên</h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-black">
                            {members.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-border flex flex-col gap-3 bg-surface-hover/30">
                    <div className="relative">
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint text-xs"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm thành viên..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-bg text-xs font-semibold text-text focus:outline-none focus:border-primary transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setRoleFilter("all")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                roleFilter === "all" ? "bg-primary text-white shadow-xs" : "bg-surface hover:bg-surface-hover text-text-muted"
                            }`}
                        >
                            Tất cả ({members.length})
                        </button>
                        <button
                            onClick={() => setRoleFilter("staff")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                roleFilter === "staff" ? "bg-primary text-white shadow-xs" : "bg-surface hover:bg-surface-hover text-text-muted"
                            }`}
                        >
                            Ban quản trị ({members.filter((m) => m.role !== "member").length})
                        </button>
                        <button
                            onClick={() => setRoleFilter("member")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                roleFilter === "member" ? "bg-primary text-white shadow-xs" : "bg-surface hover:bg-surface-hover text-text-muted"
                            }`}
                        >
                            Thành viên ({members.filter((m) => m.role === "member").length})
                        </button>
                    </div>
                </div>

                {/* Member List */}
                <div className="p-4 flex flex-col gap-2.5 overflow-y-auto flex-1">
                    {filtered.length > 0 ? (
                        filtered.map((m) => (
                            <div
                                key={m.username}
                                className="p-3 rounded-2xl bg-surface-hover/50 border border-border/40 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden shrink-0">
                                        <img
                                            src={m.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.username}`}
                                            alt={m.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-extrabold text-text truncate">{m.displayName}</span>
                                            {getRoleBadge(m.role)}
                                        </div>
                                        <span className="text-[11px] text-text-faint font-medium">@{m.username}</span>
                                    </div>
                                </div>

                                {/* Admin / Mod actions */}
                                {isOwnerOrAdmin && m.role !== "owner" && m.username !== authorUsername && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {m.role === "member" && (
                                            <button
                                                onClick={() => handleRoleChange(m.username, "mod")}
                                                className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold border border-primary/20 transition-all cursor-pointer"
                                                title="Thăng cấp làm MOD"
                                            >
                                                + MOD
                                            </button>
                                        )}
                                        {m.role === "mod" && (
                                            <button
                                                onClick={() => handleRoleChange(m.username, "member")}
                                                className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-hover text-text-muted text-[11px] font-bold border border-border transition-all cursor-pointer"
                                                title="Hạ cấp xuống thành viên"
                                            >
                                                - MOD
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleKickMember(m.username)}
                                            className="w-7 h-7 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all cursor-pointer"
                                            title="Mời ra khỏi nhóm"
                                        >
                                            <FontAwesomeIcon icon={faUserMinus} className="text-xs" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
                            <FontAwesomeIcon icon={faUser} className="text-2xl text-text-faint mb-1" />
                            <span>Không tìm thấy thành viên phù hợp</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
