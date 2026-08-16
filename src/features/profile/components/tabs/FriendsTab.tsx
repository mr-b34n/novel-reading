import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers, faUserPlus, faSearch, faUserCheck, faChevronDown, faUserXmark, faBan, faClock, faCheck, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useClickOutside } from "../../hooks/useClickOutside";
import type { FriendEntry, FriendRequest } from "../../types";
import { RAFT_LOGO as raftLogo } from "@/shared/constants/images";

interface FriendsTabProps {
    friends: FriendEntry[];
    requests: FriendRequest[];
    onToggleFriend: (name: string) => void;
    onBlockFriend: (name: string) => void;
    onAcceptRequest: (req: FriendRequest) => void;
    onDeclineRequest: (id: string) => void;
    t: (key: string, opts?: Record<string, unknown>) => string;
}

const FriendCardMenu = ({
    isFriend, onUnfriend, onBlock, t,
}: { isFriend: boolean; onUnfriend: () => void; onBlock: () => void; t: FriendsTabProps["t"] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => setOpen(false), open);

    if (!isFriend) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20 shadow-xs"
            >
                <FontAwesomeIcon icon={faUserCheck} />
                <span>{t("profile.friendAdded")}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ml-0.5 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface rounded-2xl shadow-xl border border-border/40 p-1.5 z-50 flex flex-col gap-1 animate-scale-up">
                    <button
                        onClick={(e) => { e.stopPropagation(); onUnfriend(); setOpen(false); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-text hover:bg-surface-hover transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faUserXmark} className="text-amber-500 w-3.5 text-center" />
                        <span>{t("profile.unfriend")}</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onBlock(); setOpen(false); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faBan} className="w-3.5 text-center" />
                        <span>{t("profile.blockUser")}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const FriendsTab = ({ friends, requests, onToggleFriend, onBlockFriend, onAcceptRequest, onDeclineRequest, t }: FriendsTabProps) => {
    const navigate = useNavigate();
    const [subTab, setSubTab] = useState<"list" | "requests">("list");
    const [search, setSearch] = useState("");

    const visibleFriends = friends.filter((f) => f.isFriend && f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-hover/30 p-3 rounded-2xl border border-border/20">
                <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border/20">
                    <button
                        onClick={() => setSubTab("list")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${subTab === "list" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"}`}
                    >
                        <FontAwesomeIcon icon={faUsers} />
                        <span>{t("profile.friendsWidgetTitle")} ({friends.length})</span>
                    </button>
                    <button
                        onClick={() => setSubTab("requests")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${subTab === "requests" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"}`}
                    >
                        <FontAwesomeIcon icon={faUserPlus} />
                        <span>{t("profile.friendRequests")}</span>
                        {requests.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>

                {subTab === "list" && (
                    <div className="relative flex-1 sm:max-w-xs">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint text-xs pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("profile.searchFriends")}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface text-text text-xs font-semibold focus:outline-none border border-border/30 focus:border-primary transition-all"
                        />
                    </div>
                )}
            </div>

            {subTab === "list" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {visibleFriends.length > 0 ? (
                        visibleFriends.map((f) => (
                            <div key={f.name} className="bg-surface-hover/30 border border-border/20 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all group hover:border-primary/30 relative">
                                <div
                                    onClick={() => navigate({ to: "/profile/$userId", params: { userId: `@${f.name.toLowerCase().replace(/\s+/g, "_")}` } })}
                                    className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                                >
                                    <div className="relative shrink-0">
                                        <img src={f.logo || raftLogo} alt={f.name} className="w-14 h-14 rounded-2xl object-cover group-hover:scale-105 transition-transform shadow-xs" />
                                        <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-surface ${f.status === "online" ? "bg-emerald-500" : f.status === "in-game" ? "bg-amber-400" : "bg-neutral-500"}`} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="font-extrabold text-text text-base truncate group-hover:text-primary transition-colors">{f.name}</h4>
                                        <span className="text-xs font-semibold text-primary truncate mt-0.5">{f.game || (f.status === "online" ? t("profile.statusOnline") : t("profile.statusOffline"))}</span>
                                        <span className="text-[11px] text-text-faint mt-0.5">ID: @{f.name.toLowerCase()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 relative">
                                    {f.isFriend ? (
                                        <FriendCardMenu isFriend={f.isFriend} onUnfriend={() => onToggleFriend(f.name)} onBlock={() => onBlockFriend(f.name)} t={t} />
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleFriend(f.name); }}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-primary text-white hover:bg-primary-hover shadow-sm"
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} />
                                            <span>{t("profile.addFriend")}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-surface-hover/20 border border-border/20 rounded-3xl p-10 text-center text-text-faint text-sm flex flex-col items-center gap-3">
                            <FontAwesomeIcon icon={faUsers} className="text-3xl text-text-faint/50" />
                            <span>{t("profile.noFriendsFound")}</span>
                        </div>
                    )}
                </div>
            )}

            {subTab === "requests" && (
                <div className="flex flex-col gap-3.5 animate-fade-in">
                    {requests.length > 0 ? (
                        requests.map((req) => (
                            <div key={req.id} className="bg-surface-hover/30 border border-border/20 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <img src={req.logo || raftLogo} alt={req.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-xs" />
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="font-extrabold text-text text-base truncate">{req.name}</h4>
                                        <span className="text-xs font-semibold text-primary mt-0.5">{req.game || "Game"}</span>
                                        <span className="text-[11px] text-text-faint mt-0.5 flex items-center gap-1">
                                            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                            <span>{req.time}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => onAcceptRequest(req)}
                                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                        <span>{t("profile.accept")}</span>
                                    </button>
                                    <button
                                        onClick={() => onDeclineRequest(req.id)}
                                        className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-text text-xs font-bold transition-all border border-border/30 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                        <span>{t("profile.decline")}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-surface-hover/20 border border-border/20 rounded-3xl p-10 text-center text-text-faint text-sm flex flex-col items-center gap-3">
                            <FontAwesomeIcon icon={faUserCheck} className="text-3xl text-text-faint/50" />
                            <span>{t("profile.noFriendRequests")}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
