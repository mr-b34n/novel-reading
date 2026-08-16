import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck, faXmark, faCamera, faPen, faAward,
    faUserPlus, faUserCheck, faChevronDown, faUserXmark, faEllipsisV, faBan,
    faImage, faSliders, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth";
import { useClickOutside } from "../hooks/useClickOutside";
import type { Badge, ProfileIdentity, ProfileStatus } from "../types";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface ProfileHeroProps {
    coverSrc: string;
    avatarUrl: string;
    isOwnProfile: boolean;
    identity: ProfileIdentity;
    onIdentityChange: (next: Partial<ProfileIdentity>) => void;
    equippedBadge: Badge;
    forumRankNode: React.ReactNode;
    isFriend: boolean;
    isBlocked: boolean;
    onSelectCoverFile: (file: File) => void;
    onSelectAvatarFile: (file: File) => void;
    onSaveIdentity: () => void;
    onOpenBadgeSelector: () => void;
    onOpenEditModal?: () => void;
    onAddFriend: () => void;
    onUnfriend: () => void;
    onBlock: () => void;
    onUnblock: () => void;
    location: string;
    joinedDate: string;
    reputationPercent: number;
    t: TranslateFn;
}

const STATUS_OPTIONS: { val: ProfileStatus; label: string; color: string }[] = [
    { val: "online",  label: "Online",  color: "bg-emerald-500" },
    { val: "in-game", label: "In‑Game", color: "bg-primary" },
    { val: "offline", label: "Offline", color: "bg-neutral-500" },
];

const statusCfg = (s: ProfileStatus) =>
    STATUS_OPTIONS.find((o) => o.val === s) ?? STATUS_OPTIONS[2];

export const ProfileHero = ({
    coverSrc, avatarUrl, isOwnProfile, identity, onIdentityChange, equippedBadge, forumRankNode,
    isFriend, isBlocked, onSelectCoverFile, onSelectAvatarFile, onSaveIdentity, onOpenBadgeSelector,
    onOpenEditModal, onAddFriend, onUnfriend, onBlock, onUnblock, location, joinedDate, reputationPercent, t,
}: ProfileHeroProps) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [showFriendMenu, setShowFriendMenu] = useState(false);

    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;

    const handleProtectedAction = (action: () => void) => {
        if (!isLoggedIn) {
            navigate({ to: "/auth" });
            return;
        }
        action();
    };

    const statusMenuRef = useRef<HTMLDivElement>(null);
    const friendMenuRef = useRef<HTMLDivElement>(null);
    useClickOutside(statusMenuRef, () => setIsEditingStatus(false), isEditingStatus);
    useClickOutside(friendMenuRef, () => setShowFriendMenu(false), showFriendMenu);

    const cfg = statusCfg(identity.status);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ isolation: "isolate" }}>

            {/* ── Cover ─────────────────────────────────────────── */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <img
                    src={coverSrc}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover object-center scale-105"
                    style={{ filter: "brightness(0.95) saturate(1.05)" }}
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent h-[45%] top-auto bottom-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                {/* Back button */}
                <button
                    onClick={() => window.history.back()}
                    className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10 hover:bg-black/60 hover:scale-105 transition-all shadow-lg cursor-pointer"
                    title={t("common.back")}
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                </button>

                {/* Cover upload */}
                {isOwnProfile && (
                    <label
                        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/15 hover:bg-black/70 transition-all cursor-pointer"
                        title={t("profile.uploadCover")}
                    >
                        <FontAwesomeIcon icon={faImage} className="text-primary text-xs" />
                        <span>{t("profile.uploadCover")}</span>
                        <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectCoverFile(f); e.target.value = ""; }}
                        />
                    </label>
                )}

                {/* ── Identity strip (lives inside cover, pinned bottom) ── */}
                <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 pb-5 flex flex-col sm:flex-row items-end sm:items-end justify-between gap-4">

                    {/* Left: avatar + name */}
                    <div className="flex items-end gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0 group">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl"
                                style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.5)" }}
                            >
                                <img src={avatarUrl} alt={identity.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Avatar upload overlay */}
                            {isOwnProfile && (
                                <label className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer gap-1">
                                    <FontAwesomeIcon icon={faCamera} className="text-lg" />
                                    <span>{t("profile.changeAvatar")}</span>
                                    <input type="file" accept="image/*" className="hidden"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectAvatarFile(f); e.target.value = ""; }}
                                    />
                                </label>
                            )}

                            {/* Status dot */}
                            <div className="absolute -bottom-1 -right-1" ref={statusMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => isOwnProfile && setIsEditingStatus((v) => !v)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg ring-2 ring-black/30 ${cfg.color} ${isOwnProfile ? "cursor-pointer hover:brightness-110" : "cursor-default"}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                                    <span>{cfg.label}</span>
                                    {isOwnProfile && <FontAwesomeIcon icon={faSliders} className="text-[8px] opacity-70" />}
                                </button>

                                {isEditingStatus && isOwnProfile && (
                                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#1a1c2e] border border-white/10 rounded-xl p-1.5 shadow-2xl z-30 flex flex-col gap-0.5 animate-fade-in">
                                        {STATUS_OPTIONS.map((s) => (
                                            <button key={s.val}
                                                onClick={() => { onIdentityChange({ status: s.val }); setIsEditingStatus(false); onSaveIdentity(); }}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors text-left"
                                            >
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                                                <span>{s.label}</span>
                                                {identity.status === s.val && <FontAwesomeIcon icon={faCheck} className="ml-auto text-primary text-[10px]" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name / username / badges */}
                        <div className="flex flex-col gap-1.5 pb-1">
                            {isEditingName ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <input type="text" value={identity.name}
                                        onChange={(e) => onIdentityChange({ name: e.target.value })}
                                        className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white font-black text-lg w-40 focus:outline-none ring-1 ring-primary/60 placeholder:text-white/40"
                                        placeholder="Display name"
                                    />
                                    <input type="text" value={identity.username}
                                        onChange={(e) => onIdentityChange({ username: e.target.value })}
                                        className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 font-semibold text-sm w-32 focus:outline-none ring-1 ring-primary/60 placeholder:text-white/30"
                                        placeholder="@username"
                                    />
                                    <button onClick={() => { setIsEditingName(false); onSaveIdentity(); }}
                                        className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs hover:brightness-110 transition"
                                    ><FontAwesomeIcon icon={faCheck} /></button>
                                    <button onClick={() => setIsEditingName(false)}
                                        className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs hover:bg-white/20 transition"
                                    ><FontAwesomeIcon icon={faXmark} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm leading-none">
                                            {identity.name}
                                        </h1>
                                        {isOwnProfile && (
                                            <button onClick={() => setIsEditingName(true)}
                                                className="w-6 h-6 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center text-xs transition"
                                                title={t("profile.editName")}
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/55 font-semibold tracking-wide">{identity.username}</p>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${equippedBadge.color}`}>
                                            <FontAwesomeIcon icon={equippedBadge.icon} />
                                            <span>{equippedBadge.badgeText}</span>
                                        </span>
                                        {forumRankNode}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pb-1">
                        {isOwnProfile ? (
                            <>
                                {onOpenEditModal && (
                                    <button onClick={onOpenEditModal}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 transition-all shadow-md cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faPen} />
                                        <span>Chỉnh sửa hồ sơ</span>
                                    </button>
                                )}
                                <button onClick={onOpenBadgeSelector}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white text-xs font-bold border border-white/15 hover:bg-white/20 transition-all cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faAward} className="text-amber-300" />
                                    <span>{t("profile.changeBadge")}</span>
                                </button>
                            </>
                        ) : isBlocked ? (
                            <button onClick={onUnblock}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                            >
                                <FontAwesomeIcon icon={faBan} />
                                <span>{t("profile.unblockSuccess")}</span>
                            </button>
                        ) : (
                            <div className="relative flex items-center gap-1.5" ref={friendMenuRef}>
                                {isFriend ? (
                                    <button
                                        onClick={() => handleProtectedAction(() => setShowFriendMenu((v) => !v))}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} />
                                        <span>{t("profile.friendAdded")}</span>
                                        <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ${showFriendMenu ? "rotate-180" : ""}`} />
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => handleProtectedAction(onAddFriend)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg"
                                            style={{ boxShadow: "0 4px 20px -4px var(--color-primary)" }}
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} />
                                            <span>{t("profile.addFriend")}</span>
                                        </button>
                                        <button onClick={() => handleProtectedAction(() => setShowFriendMenu((v) => !v))}
                                            className="w-8 h-8 rounded-xl bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center text-sm transition-all border border-white/10"
                                        >
                                            <FontAwesomeIcon icon={faEllipsisV} />
                                        </button>
                                    </>
                                )}

                                {showFriendMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-[#1a1c2e] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-scale-up">
                                        {isFriend && (
                                            <button
                                                onClick={() => { onUnfriend(); setShowFriendMenu(false); }}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors text-left"
                                            >
                                                <FontAwesomeIcon icon={faUserXmark} className="text-amber-400 w-4" />
                                                <span>{t("profile.unfriend")}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { onBlock(); setShowFriendMenu(false); }}
                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                        >
                                            <FontAwesomeIcon icon={faBan} className="w-4" />
                                            <span>{t("profile.blockUser")}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats bar ────────────────────────────────────────── */}
            <div className="w-full bg-surface border-t border-border/30 px-5 sm:px-8 py-3 flex items-center gap-6 sm:gap-10 flex-wrap">
                <Stat value={`${reputationPercent}%`} label="Reputation" accent="text-amber-400" />
                <div className="w-px h-6 bg-border/40 hidden sm:block" />
                <Stat value={location} label="Region" accent="text-text" />
                <div className="w-px h-6 bg-border/40 hidden sm:block" />
                <Stat value={joinedDate} label="Member since" accent="text-text" />
            </div>
        </div>
    );
};

const Stat = ({ value, label, accent }: { value: string; label: string; accent: string }) => (
    <div className="flex items-baseline gap-2">
        <span className={`text-sm font-black ${accent}`}>{value}</span>
        <span className="text-xs text-text-faint font-semibold">{label}</span>
    </div>
);
