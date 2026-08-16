import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faGamepad,
    faMicrophone,
    faCopy,
    faCheck,
    faRightFromBracket,
    faPlus,
    faLock,
    faCircleDot,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { formatTimeAgo } from "@/shared/utils/formatTimeAgo";
import { useSquadStore } from "../store/useSquadStore";
import { type Squad } from "../types";
import { getUserRankConfig } from "@/features/post/helpers/userRanks";
import { getCurrentAuthor } from "@/features/post/helpers/getCurrentAuthor";

interface SquadCardProps {
    squad: Squad;
}

export const SquadCard = ({ squad }: SquadCardProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;
    const joinSquad = useSquadStore((state) => state.joinSquad);
    const leaveSquad = useSquadStore((state) => state.leaveSquad);
    const kickMember = useSquadStore((state) => state.kickMember);
    const deleteSquad = useSquadStore((state) => state.deleteSquad);
    const toggleSquadStatus = useSquadStore((state) => state.toggleSquadStatus);
    const [copied, setCopied] = useState(false);

    const currentAuthor = getCurrentAuthor();
    const isLeader = squad.members.some((m) => m.username === currentAuthor && m.role === "Leader");

    const handleCopyRoom = () => {
        if (!squad.roomCode) return;
        navigator.clipboard.writeText(squad.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isFull = squad.currentMembers >= squad.maxMembers;
    const progressPercent = Math.min(100, Math.round((squad.currentMembers / squad.maxMembers) * 100));

    return (
        <div
            className={`w-full bg-surface border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 ${
                squad.isMySquad ? "border-primary/60 bg-gradient-to-br from-surface via-surface to-primary/5" : "border-border"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {squad.gameLogo ? (
                        <img src={squad.gameLogo} alt={squad.game} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-border/80 shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                            <FontAwesomeIcon icon={faGamepad} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {squad.game}
                            </span>
                            <span className="text-xs text-text-faint font-medium">· {formatTimeAgo(squad.createdAt, t)}</span>
                            {squad.isMySquad && (
                                <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    {isLeader ? `👑 ${t('squad.managedByYou')}` : `✓ ${t('squad.yourSquad')}`}
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-bold text-text mt-1 truncate hover:text-primary transition-colors cursor-pointer" title={squad.name}>
                            {squad.name}
                        </h3>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                    {squad.status === "recruiting" && !isFull ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <FontAwesomeIcon icon={faCircleDot} className="text-[10px] text-emerald-500" />
                            {t('squad.recruiting')} ({squad.currentMembers}/{squad.maxMembers})
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                            {t('squad.full')} ({squad.maxMembers}/{squad.maxMembers})
                        </span>
                    )}
                </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed line-clamp-2">{squad.description}</p>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-hover text-text-muted border border-border">
                    <FontAwesomeIcon icon={faMicrophone} className="text-emerald-500" />
                    {squad.voice}
                </span>

                {squad.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-semibold text-text-muted bg-surface-hover/70 px-2 py-0.5 rounded-md border border-border/50">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex flex-col gap-2 bg-surface-hover/40 rounded-xl p-3 border border-border/60">
                <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUsers} className="text-primary" />
                        {t('squad.currentMembers')}
                    </span>
                    <span className="text-text-muted">
                        {squad.currentMembers}/{squad.maxMembers} ({progressPercent}%)
                    </span>
                </div>

                <div className="w-full bg-surface-hover rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            isFull ? "bg-rose-500" : squad.isMySquad ? "bg-primary" : "bg-emerald-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {squad.members.map((m) => {
                            const rankConf = getUserRankConfig(m.username);
                            return (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded-lg border border-border/80 text-xs shrink-0 shadow-2xs"
                                    title={`${m.username} (${m.status})`}
                                >
                                    <div className="relative">
                                        <img src={m.avatar} alt={m.username} className="w-5 h-5 rounded-full object-cover ring-1 ring-border" />
                                    </div>
                                    <span className={`font-bold truncate max-w-[80px] ${rankConf.textColor}`}>{m.username}</span>
                                    {m.role === "Leader" ? (
                                        <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold px-1 rounded" title={t('squad.host')}>
                                            👑
                                        </span>
                                    ) : isLeader ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(t('squad.confirmKick', { name: m.username }))) {
                                                    kickMember(squad.id, m.username);
                                                }
                                            }}
                                            className="ml-0.5 w-4 h-4 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center text-[10px] font-bold transition-all"
                                            title={t('squad.kickUser', { name: m.username })}
                                        >
                                            <FontAwesomeIcon icon={faXmark} className="text-[9px]" />
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 min-w-0">
                    {squad.isMySquad ? (
                        <>
                            {squad.roomCode ? (
                                <button
                                    type="button"
                                    onClick={handleCopyRoom}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active text-text text-xs font-bold transition-all border border-border/80 shrink-0"
                                    title={t('squad.copyRoomId')}
                                >
                                    <span className="text-text-muted">ID:</span>
                                    <span className="text-primary font-mono font-extrabold">{squad.roomCode}</span>
                                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? "text-emerald-500" : "text-text-muted"} />
                                </button>
                            ) : (
                                <span className="text-xs text-text-faint italic">{t('squad.noRoomCode')}</span>
                            )}

                            {squad.discordUrl && (
                                <a
                                    href={squad.discordUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors border border-indigo-500/20"
                                >
                                    <span>🎧 Discord</span>
                                </a>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover/70 text-text-muted text-xs font-semibold border border-border/60" title={t('squad.privateInfoTitle')}>
                            <FontAwesomeIcon icon={faLock} className="text-amber-500 text-xs" />
                            <span>{t('squad.joinToView')}</span>
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2">
                    {isLeader ? (
                        <>
                            <button
                                type="button"
                                onClick={() => toggleSquadStatus(squad.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
                                    squad.status === "recruiting"
                                        ? "bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border-amber-500/30 dark:text-amber-400"
                                        : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-500/30 dark:text-emerald-400"
                                }`}
                                title={squad.status === "recruiting" ? t('squad.lockRecruit') : t('squad.unlockRecruit')}
                            >
                                <FontAwesomeIcon icon={squad.status === "recruiting" ? faLock : faCircleDot} />
                                <span>{squad.status === "recruiting" ? t('squad.lock') : t('squad.open')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm(t('squad.confirmDisband', { name: squad.name }))) {
                                        deleteSquad(squad.id);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 border border-rose-500/30"
                                title={t('squad.disband')}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>{t('squad.disband')}</span>
                            </button>
                        </>
                    ) : squad.isMySquad ? (
                        <button
                            type="button"
                            onClick={() => leaveSquad(squad.id)}
                            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 border border-rose-500/30"
                        >
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            <span>{t('squad.leave')}</span>
                        </button>
                    ) : isFull ? (
                        <button
                            type="button"
                            disabled
                            className="px-4 py-2 rounded-xl bg-surface-hover text-text-faint font-bold text-xs cursor-not-allowed flex items-center gap-1.5 border border-border"
                        >
                            <FontAwesomeIcon icon={faLock} />
                            <span>{t('squad.squadFull')}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                if (!isLoggedIn) {
                                    navigate({ to: "/auth" });
                                    return;
                                }
                                joinSquad(squad.id);
                            }}
                            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>{t('squad.join')}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
