import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faComments, faUsers, faCommentDots, faBookmark } from "@fortawesome/free-solid-svg-icons";
import type { ProfileTab } from "../types";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface ProfileTabBarProps {
    activeTab: ProfileTab;
    onChange: (tab: ProfileTab) => void;
    friendsCount: number;
    showBookmarks?: boolean;
    t: TranslateFn;
}

/**
 * Underline-style tab bar inspired by Twitter/Linear.
 * A sliding border-bottom indicator moves between tabs.
 */
export const ProfileTabBar = ({ activeTab, onChange, friendsCount, showBookmarks = true, t }: ProfileTabBarProps) => {
    const tabs: { id: ProfileTab; label: string; icon: typeof faGamepad; count?: number }[] = [
        { id: "library",   label: t("profile.tabs.library"),       icon: faGamepad },
        { id: "posts",     label: t("profile.tabs.posts"),         icon: faComments },
        { id: "friends",   label: t("profile.friendsWidgetTitle"), icon: faUsers, count: friendsCount },
        ...(showBookmarks ? [{ id: "bookmarks" as ProfileTab, label: t("common.bookmark"), icon: faBookmark }] : []),
        { id: "guestbook", label: t("profile.guestbookTitle"),     icon: faCommentDots },
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const btn = btnRefs.current[activeTab];
        const container = containerRef.current;
        if (btn && container) {
            const br = btn.getBoundingClientRect();
            const cr = container.getBoundingClientRect();
            setIndicator({ left: br.left - cr.left, width: br.width });
        }
    }, [activeTab, friendsCount]);

    return (
        <div className="relative border-b border-border/30">
            <div
                ref={containerRef}
                role="tablist"
                className="flex items-center gap-0 overflow-x-auto scrollbar-none"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            ref={(el) => { btnRefs.current[tab.id] = el; }}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`relative flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                isActive ? "text-text" : "text-text-faint hover:text-text-muted"
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={tab.icon}
                                className={`text-sm transition-colors ${isActive ? "text-primary" : ""}`}
                            />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none transition-colors ${
                                    isActive ? "bg-primary/15 text-primary" : "bg-surface-hover text-text-faint"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sliding underline indicator */}
            <div
                className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ left: indicator.left, width: indicator.width }}
            />
        </div>
    );
};
