import { faArrowTrendUp, faCalendarDay, faUsers, faBolt } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useNavigate } from "@tanstack/react-router"

import {
    RAFT_LOGO as raftLogo,
    RDR2_LOGO as rdr2Logo,
    CS2_LOGO as cs2Logo,
    DEFAULT_AVATAR as avatarGame
} from "@/shared/constants/images";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { useAuthStore } from "@/features/auth";

const Panel = ({ children }: { children: React.ReactNode }) => (
    <div className="
        w-full flex flex-col overflow-hidden
        bg-surface border border-border/80
        rounded-xl shadow-xs
    ">
        {children}
    </div>
);

const SectionTitle = ({ icon, label, extra }: { icon: typeof faArrowTrendUp; label: string; extra?: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 border-b border-border/40 mb-1">
        <FontAwesomeIcon icon={icon} className="text-xs text-primary" />
        <span className="text-[11px] font-black uppercase tracking-wider text-text-muted/90 flex-1">{label}</span>
        {extra}
    </div>
);

const FRIEND_LIST = [
    { name: "GhostRider",    game: "Red Dead 2",    slug: "red-dead-redemption-2", logo: rdr2Logo, status: "online",  playtime: "2h 14m" },
    { name: "TacticalXeno",  game: "CS2 — Rank S",  slug: "counter-strike-2", logo: cs2Logo,  status: "online",  playtime: "45m"    },
    { name: "NightOwl",      game: "Raft",           slug: "raft", logo: raftLogo, status: "online",  playtime: "1h 03m" },
    { name: "Maplestrike",   game: null,             slug: null, logo: null,     status: "offline", playtime: null     },
];

const TRENDING_POSTS = [
    {
        id: 1,
        postId: 5,
        title: "Patch 1.6 just dropped – what are your thoughts?",
        game: "CS2",
        slug: "counter-strike-2",
        gameLogo: cs2Logo,
        replies: 142,
        heat: "🔥 Hot",
    },
    {
        id: 2,
        postId: 6,
        title: "Best farming spot after the loot cave nerf?",
        game: "Raft",
        slug: "raft",
        gameLogo: raftLogo,
        replies: 87,
        heat: "⚡ Rising",
    },
    {
        id: 3,
        postId: 3,
        title: "Legendary run – Red Harlow tribute build",
        game: "RDR 2",
        slug: "red-dead-redemption-2",
        gameLogo: rdr2Logo,
        replies: 61,
        heat: "⭐ Popular",
    },
];


const EVENTS = [
    { id: 1, label: "CS2 Major — Quarterfinals", date: "Jul 20", color: "bg-rose-500" },
    { id: 2, label: "IndieG Community Game Night", date: "Jul 22", color: "bg-primary" },
    { id: 3, label: "Raft Summer Fest Update", date: "Jul 25", color: "bg-emerald-500" },
];

export const RightBar = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;

    const onlineFriends = FRIEND_LIST.filter((m) => m.status === "online");
    const onlineCount = onlineFriends.length;

    return (
        <div className="w-full flex flex-col gap-2.5">
            {isLoggedIn && (
                <Panel>
                    <SectionTitle
                        icon={faUsers}
                        label={t('squad.friendsTitle')}
                    />
                    <div className="flex flex-col pb-2 px-1.5 gap-1">
                        {onlineCount > 0 ? (
                            onlineFriends.map((m) => (
                                <div
                                    key={m.name}
                                    onClick={() => navigate({ to: "/profile/$userId", params: { userId: `@${m.name.toLowerCase().replace(/\s+/g, "_")}` } })}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={avatarGame}
                                            alt={m.name}
                                            className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40"
                                        />
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-surface bg-emerald-500" />
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-bold truncate text-text group-hover:text-primary transition-colors">
                                             {m.name}
                                         </p>
                                         {m.game ? (
                                             <div
                                                 onClick={(e) => {
                                                     if (m.slug) {
                                                         e.stopPropagation();
                                                         navigate({ to: `/game/${m.slug}` });
                                                     }
                                                 }}
                                                 className="flex items-center gap-1.5 mt-0.5 hover:text-primary cursor-pointer"
                                             >
                                                 {m.logo && <img src={m.logo} alt="" className="w-2.5 h-2.5 rounded object-cover opacity-80" />}
                                                 <p className="text-[11px] font-semibold text-text-muted truncate hover:underline">{m.game}</p>
                                             </div>
                                         ) : (
                                             <p className="text-[11px] font-medium text-text-faint">{t('common.online')}</p>
                                         )}
                                     </div>

                                     {m.playtime && (
                                         <span className="text-[10px] font-semibold text-text-muted bg-surface-hover px-1.5 py-0.5 rounded-md shrink-0">
                                             {m.playtime}
                                         </span>
                                     )}
                                </div>
                            ))
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center text-center py-3 px-2 gap-1.5 rounded-lg group"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                </div>
                                <p className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                                    {t('squad.noFriendsOnline')}
                                </p>
                                <p className="text-[10px] text-text-faint leading-relaxed">
                                    {t('squad.inviteFriendsDesc')}
                                </p>
                            </div>
                        )}
                    </div>
                </Panel>
            )}

            <Panel>
                <SectionTitle icon={faArrowTrendUp} label={t('common.trending')} />
                <div className="flex flex-col pb-1.5 px-1.5 gap-0.5">
                    {TRENDING_POSTS.map((post, i) => (
                        <div
                            key={post.id}
                            onClick={() => navigate({ to: "/post/$postId", params: { postId: post.postId.toString() } })}
                            className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                        >
                            <p className={`text-[11px] font-black w-3 text-center pt-0.5 shrink-0 ${i === 0 ? "text-rose-500" : i === 1 ? "text-amber-500" : "text-text-faint"}`}>
                                {i + 1}
                            </p>

                            <img src={post.gameLogo} alt={post.game} className="w-6 h-6 rounded-md object-cover shrink-0 ring-1 ring-border" />

                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold text-text leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                    {post.title}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span
                                        onClick={(e) => {
                                            if (post.slug) {
                                                e.stopPropagation();
                                                navigate({ to: `/game/${post.slug}` });
                                            }
                                        }}
                                        className="font-bold text-text-muted hover:text-primary hover:underline cursor-pointer"
                                    >
                                        {post.game}
                                    </span>
                                    <span>·</span>
                                    <FontAwesomeIcon icon={faUsers} className="text-[9px] text-text-faint" />
                                    <span className="font-medium text-text-faint">{t('post.repliesCount', { count: post.replies })}</span>
                                    <span className="ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-hover text-text-muted">{post.heat}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel>
                <SectionTitle icon={faCalendarDay} label={t('common.upcoming')} />
                <div className="flex flex-col pb-2.5 px-3 gap-2">
                    {EVENTS.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <div className={`w-1 h-6 rounded-full shrink-0 ${ev.color}`} />
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold text-text group-hover:text-primary transition-colors leading-tight truncate">
                                    {ev.label}
                                </p>
                                <p className="text-[11px] font-semibold text-text-muted">{ev.date}</p>
                            </div>
                            <FontAwesomeIcon icon={faBolt} className="text-[10px] text-text-faint group-hover:text-primary transition-colors shrink-0" />
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    )
}
