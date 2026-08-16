import {
    faUsers, faUserGroup, faHouse, faGamepad,
    faAngleDown, faGear, faShieldHalved,
    faUserCircle, faCompass
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import { useNavigate, useLocation } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth";
import { useGameStore } from "@/features/game";
import { getCurrentAuthor } from "@/features/post";
import { useTranslation } from "@/shared/hooks/useTranslate";

const navItem = `
    w-full flex flex-row items-center gap-2.5 px-3 py-2
    rounded-xl text-xs sm:text-sm font-bold text-text-muted
    bg-transparent hover:bg-surface-hover hover:text-text
    transition-all duration-150 cursor-pointer select-none
`;
const navItemActive = `
    w-full flex flex-row items-center gap-2.5 px-3 py-2
    rounded-xl text-xs sm:text-sm font-extrabold
    bg-primary-soft text-primary shadow-xs cursor-pointer select-none
`;
const sectionLabel = `
    px-3 pt-3 pb-1
    text-[10px] font-black uppercase tracking-wider text-text-faint/80
`;

export const LeftBar = () => {
    const quickAccessSlugs = useGameStore((state) => state.quickAccessSlugs);
    const games = useGameStore((state) => state.games);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const {t} = useTranslation();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const customAvatar = useAuthStore((state) => state.customAvatar);
    const isLoggedIn = !!user || mockLogin;
    const isAdmin = user?.role === "admin" || isLoggedIn;

    const [gamesDrop, setGamesDrop] = useState<boolean>(true);

    const isHomeActive = pathname === "/" || pathname.startsWith("/post");
    const isExploreActive = pathname.startsWith("/explore");
    const isCommunityActive = pathname.startsWith("/community");
    const isSquadActive = pathname.startsWith("/squad");
    const isSettingsActive = pathname.startsWith("/settings");
    const isAdminActive = pathname.startsWith("/admin");
    const isGameSectionActive = pathname.startsWith("/game");

    const displayName = getCurrentAuthor();
    const avatarUrl =
        customAvatar ??
        user?.user_metadata?.avatar_url ??
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

    const handleProfileClick = () => {
        navigate({ to: "/profile/$userId", params: { userId: "me" } });
    };

    return (
        <div className="
            w-full flex flex-col overflow-hidden
            bg-surface border border-border/80
            rounded-xl shadow-xs
        ">

            {isLoggedIn ? (
                <button
                    type="button"
                    onClick={handleProfileClick}
                    className="flex flex-row items-center gap-2.5 px-3 py-2.5
                        border-b border-border w-full text-left
                        cursor-pointer hover:bg-surface-hover transition-colors duration-150"
                >
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-8 h-8 rounded-full ring-2 ring-primary/30 shrink-0 object-cover"
                    />
                    <div className="flex flex-col leading-tight min-w-0 flex-1">
                        <p className="font-semibold text-xs sm:text-sm text-text truncate">{displayName}</p>
                        <p className="text-[11px] text-text-faint">
                            {user ? t('common.viewProfile') : t('common.signedInDemo')}
                        </p>
                    </div>
                </button>
            ) : (
                <div className="flex flex-col items-center gap-2.5 px-3 py-3.5 border-b border-border text-center">
                    <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
                        <FontAwesomeIcon icon={faUserCircle} className="text-xl text-text-faint" />
                    </div>
                    <div>
                        <p className="font-semibold text-xs sm:text-sm text-text">{t('authenticate.notLoginRemindTitle')}</p>
                        <p className="text-[11px] text-text-faint mt-0.5 leading-relaxed">
                            {t('authenticate.notLoginRemindDetail')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate({ to: "/auth" })}
                        className="w-full px-3 py-1.5 rounded-full text-xs font-semibold
                            bg-primary text-white hover:bg-primary-hover
                            shadow-[0_2px_10px_rgba(124,77,255,0.35)]
                            transition-colors duration-150 cursor-pointer"
                    >
                        {t('authenticate.login')}
                    </button>
                </div>
            )}

            <p className={sectionLabel}>{t('common.menu')}</p>
            <div className="flex flex-col gap-1 px-2 pb-1">
                <button
                    type="button"
                    onClick={() => navigate({to: "/"})}
                    className={isHomeActive ? navItemActive : navItem}
                >
                    <FontAwesomeIcon icon={faHouse} className="w-4 shrink-0" />
                    <span>{t('common.home')}</span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate({to: "/explore"})}
                    className={isExploreActive ? navItemActive : navItem}
                >
                    <FontAwesomeIcon icon={faCompass} className="w-4 shrink-0" />
                    <span>{t('common.explore', { defaultValue: 'Explore' })}</span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate({ to: "/community" })}
                    className={isCommunityActive ? navItemActive : navItem}
                >
                    <FontAwesomeIcon icon={faUsers} className="w-4 shrink-0" />
                    <span>{t('common.community')}</span>
                </button>

                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={() => navigate({ to: "/squad" })}
                        className={isSquadActive ? navItemActive : navItem}
                    >
                        <FontAwesomeIcon icon={faUserGroup} className="w-4 shrink-0" />
                        <span>{t('common.squad')}</span>
                    </button>
                )}
            </div>

            {isLoggedIn && (
                <>
                    <p className={sectionLabel}>{t('common.library')}</p>
                    <div className="flex flex-col gap-1 px-2 pb-1.5">
                        <button
                            type="button"
                            onClick={() => setGamesDrop(!gamesDrop)}
                            className={`${isGameSectionActive ? navItemActive : navItem} justify-between ${gamesDrop && !isGameSectionActive ? "bg-surface-hover text-text" : ""}`}
                        >
                            <div className="flex flex-row items-center gap-2.5">
                                <FontAwesomeIcon icon={faGamepad} className="w-4 shrink-0" />
                                <span>{t('common.game')}</span>
                            </div>
                            <FontAwesomeIcon
                                icon={faAngleDown}
                                className={`text-xs text-text-faint transition-transform duration-200
                                    ${gamesDrop ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                                gamesDrop
                                    ? "grid-rows-[1fr] opacity-100"
                                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                            }`}
                            aria-hidden={!gamesDrop}
                        >
                            <div className="overflow-hidden min-h-0">
                                <div className="flex flex-col gap-0.5 pl-8 pr-2 pb-1">
                                    {quickAccessSlugs.map((slug) => {
                                        const g = games.find(item => item.slug === slug || item.id === slug);
                                        if (!g) return null;
                                        const isThisGameActive = pathname.startsWith(`/game/${slug}`);
                                        return (
                                            <div
                                                key={slug}
                                                onClick={() => navigate({ to: `/game/${slug}` })}
                                                className={`flex flex-row items-center gap-2 px-2 py-1.5
                                                    rounded-lg text-xs sm:text-sm
                                                    hover:bg-surface-hover
                                                    transition-colors duration-150 cursor-pointer
                                                    ${isThisGameActive ? "text-primary font-bold bg-primary-soft/60" : "text-text-muted"}`}
                                            >
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={g.logoUrl}
                                                        alt={g.name}
                                                        className="w-3.5 h-3.5 rounded object-cover"
                                                    />
                                                    {isThisGameActive && (
                                                        <span className="absolute -top-0.5 -right-0.5
                                                            w-1.5 h-1.5 rounded-full bg-primary
                                                            ring-1 ring-surface" />
                                                    )}
                                                </div>
                                                <span className="truncate">{g.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="border-t border-border px-2 py-1.5 mt-2 flex flex-col gap-1">
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => navigate({ to: "/admin" })}
                        className={`${isAdminActive ? navItemActive : navItem}`}
                    >
                        <FontAwesomeIcon icon={faShieldHalved} className="w-4 shrink-0 text-amber-500" />
                        <span>Admin UI</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => navigate({to: "/settings"})}
                    className={`${isSettingsActive ? navItemActive : navItem}`}
                >
                    <FontAwesomeIcon icon={faGear} className="w-4 shrink-0" />
                    <span>{t('common.settings')}</span>
                </button>
            </div>
        </div>
    )
}
