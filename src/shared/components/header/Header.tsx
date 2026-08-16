import { useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useSidebarStore } from "../../store/useSidebarStore";
import { useNotificationStore, NotificationDropdown, useNotificationPolling } from '@/features/notification';
import { useTranslation } from '@/shared/hooks/useTranslate';
import { Search } from '../search/Search';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserCircle,
    faBell,
    faSignOutAlt,
    faBars,
    faGamepad,
    faHouse
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from '@/features/auth';

const floatCard = `
    bg-surface/90 backdrop-blur-md
    border border-border
    shadow-[0_4px_16px_rgba(0,0,0,0.07)]
    dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]
    transition-all duration-200 ease-out
`;

export const Header = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const toggleMockLogin = useAuthStore((state) => state.toggleMockLogin);
    const isLoggedIn = !!user || mockLogin;
    const navigate = useNavigate();

    const toggleLeft = useSidebarStore((state) => state.toggleLeft);
    const toggleRight = useSidebarStore((state) => state.toggleRight);
    const { pathname } = useLocation();
    const hideSidebars = 
        pathname.startsWith('/settings') || 
        pathname.startsWith('/profile') || 
        pathname.startsWith('/explore') || 
        pathname.startsWith('/game') ||
        (pathname.startsWith('/community/') && pathname !== '/community');

    const [showNotifications, setShowNotifications] = useState(false);
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useNotificationPolling(15000);

    return (
        <header className="w-full sticky top-0 z-[60] flex flex-wrap md:flex-nowrap items-center justify-between gap-3 px-2 sm:px-4 py-2 sm:py-3 bg-bg/80 backdrop-blur-lg border-b border-border/50">

            {/* LEFT: Logo & Mobile Toggle */}
            <div className="flex items-center gap-2 shrink-0">
                {!hideSidebars && (
                    <button
                        onClick={toggleLeft}
                        title={t('common.menu')}
                        className={`lg:hidden shrink-0 ${floatCard} w-9 h-9 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary hover:bg-primary-soft transition-colors cursor-pointer`}
                    >
                        <FontAwesomeIcon icon={faBars} className="text-sm sm:text-base" />
                    </button>
                )}
                <div
                    className={`shrink-0 ${floatCard} rounded-xl sm:rounded-2xl px-4 sm:px-5 py-1.5 sm:py-2
                        cursor-pointer hover:-translate-y-0.5
                        hover:shadow-[0_6px_24px_rgba(124,77,255,0.18)]`}
                    onClick={() => navigate({ to: '/' })}
                >
                    <p className="text-xl sm:text-2xl font-black tracking-tight text-primary select-none">
                        IndieG
                    </p>
                </div>
            </div>

            {/* CENTER: Search Bar */}
            <div className="w-full md:w-auto flex-1 max-w-xl mx-auto flex justify-center">
                <div className="w-full max-w-sm md:max-w-full">
                    <Search />
                </div>
            </div>

            {/* RIGHT: Actions */}
            <div className={`shrink-0 ${floatCard} rounded-full px-2 sm:px-3 py-1.5 sm:py-2
                flex flex-row items-center gap-1.5`}>
                {!hideSidebars && (
                    <button
                        onClick={toggleRight}
                        title={t('common.openExplore')}
                        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full
                            text-primary bg-primary/10 hover:bg-primary/20
                            transition-colors duration-150 cursor-pointer shrink-0"
                    >
                        <FontAwesomeIcon icon={faGamepad} className="text-xs sm:text-sm" />
                    </button>
                )}

                {hideSidebars && (
                    <button
                        onClick={() => navigate({ to: '/' })}
                        title={t('common.home')}
                        className="w-9 h-9 flex items-center justify-center rounded-full
                            text-text-muted hover:bg-primary-soft hover:text-primary
                            transition-colors duration-150 cursor-pointer shrink-0"
                    >
                        <FontAwesomeIcon icon={faHouse} className="text-sm" />
                    </button>
                )}

                {isLoggedIn && (
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            title={t('notification.title')}
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                text-text-muted
                                hover:bg-primary-soft hover:text-primary
                                transition-colors duration-150 cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faBell} className="text-sm" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-like ring-2 ring-surface" />
                            )}
                        </button>
                        {showNotifications && (
                            <NotificationDropdown onClose={() => setShowNotifications(false)} />
                        )}
                    </div>
                )}

                <div className="relative group/dev hidden sm:block shrink-0">
                    <button
                        onClick={toggleMockLogin}
                        title={isLoggedIn ? "[DEV] Mock Logout" : "[DEV] Mock Login"}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer
                            ${isLoggedIn
                                ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-text-muted hover:bg-amber-500/20 hover:text-amber-500"
                            }`}
                    >
                        <FontAwesomeIcon icon={isLoggedIn ? faSignOutAlt : faUserCircle} />
                    </button>
                    <span className="pointer-events-none absolute -top-1 -right-1 text-[9px] font-black text-amber-500 bg-amber-500/15 px-0.5 rounded">
                        DEV
                    </span>
                </div>

                {!isLoggedIn && (
                    <button
                        onClick={() => navigate({ to: "/auth" })}
                        className="h-9 px-4 sm:px-5 ml-1 flex items-center justify-center rounded-full
                            bg-primary text-white font-semibold text-xs sm:text-sm
                            hover:bg-primary-hover shadow-sm transition-colors duration-150 cursor-pointer shrink-0"
                    >
                        {t('authenticate.login')}
                    </button>
                )}
            </div>
        </header>
    )
}