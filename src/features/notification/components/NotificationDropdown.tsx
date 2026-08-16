import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHeart,
    faComment,
    faUserPlus,
    faBell,
    faBullhorn,
    faCheckDouble,
    faTrash,
    faXmark,
    faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { useNotificationStore } from "../store/useNotificationStore";
import type { NotificationItem, NotificationType } from "../types";

interface NotificationDropdownProps {
    onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const notifications = useNotificationStore((state) => state.notifications);
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
    const deleteNotification = useNotificationStore((state) => state.deleteNotification);
    const clearAll = useNotificationStore((state) => state.clearAll);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const filteredNotifications = filter === "all"
        ? notifications
        : notifications.filter((n) => !n.isRead);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleItemClick = (item: NotificationItem) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }
        if (item.link) {
            if (item.link.startsWith("/")) {
                // @ts-expect-error - Dynamic route navigation from notification link
                navigate({ to: item.link });
            } else {
                window.open(item.link, "_blank", "noopener,noreferrer");
            }
            onClose();
        }
    };

    const getIconForType = (type: NotificationType) => {
        switch (type) {
            case "like":
                return <div className="w-7 h-7 rounded-full bg-like/15 text-like flex items-center justify-center text-xs shrink-0"><FontAwesomeIcon icon={faHeart} /></div>;
            case "comment":
                return <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs shrink-0"><FontAwesomeIcon icon={faComment} /></div>;
            case "follow":
                return <div className="w-7 h-7 rounded-full bg-accent-500/15 text-accent-500 flex items-center justify-center text-xs shrink-0"><FontAwesomeIcon icon={faUserPlus} /></div>;
            case "system":
                return <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs shrink-0"><FontAwesomeIcon icon={faBullhorn} /></div>;
            default:
                return <div className="w-7 h-7 rounded-full bg-border/50 text-text-muted flex items-center justify-center text-xs shrink-0"><FontAwesomeIcon icon={faBell} /></div>;
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="fixed sm:absolute top-14 sm:top-12 right-2 sm:right-0 w-[calc(100vw-1rem)] sm:w-96 max-h-[80vh] bg-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-text">{t('notification.title')}</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                            {unreadCount} {t('notification.new')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            title={t('notification.markAllRead')}
                            className="p-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faCheckDouble} />
                            <span className="hidden sm:inline">{t('notification.readAll')}</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full hover:bg-border/50 text-text-muted hover:text-text flex items-center justify-center text-sm transition-colors cursor-pointer ml-1"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/80 text-xs font-semibold">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                        filter === "all"
                            ? "bg-primary text-white"
                            : "bg-bg text-text-muted hover:text-text"
                    }`}
                >
                    {t('notification.all', { count: notifications.length })}
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                        filter === "unread"
                            ? "bg-primary text-white"
                            : "bg-bg text-text-muted hover:text-text"
                    }`}
                >
                    {t('notification.unreadCount', { count: unreadCount })}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40 scrollbar-thin max-h-[60vh]">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-text-faint text-lg mb-2">
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <p className="font-bold text-text-muted text-sm">{t('notification.empty')}</p>
                        <p className="text-xs text-text-faint mt-0.5">
                            {filter === "unread" ? t('notification.emptyUnread') : t('notification.emptyAll')}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer relative group ${
                                !item.isRead ? "bg-primary-soft/40 hover:bg-primary-soft/60" : "hover:bg-surface-hover/60"
                            }`}
                        >
                            <div className="relative shrink-0">
                                {item.avatarUrl ? (
                                    <img
                                        src={item.avatarUrl}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                                    />
                                ) : (
                                    getIconForType(item.type)
                                )}
                                <div className="absolute -bottom-1 -right-1">
                                    {getIconForType(item.type)}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-xs font-bold text-text line-clamp-1">
                                    {item.title}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                                    {item.message}
                                </p>
                                <p className="text-[10px] font-semibold text-text-faint mt-1.5">
                                    {item.timestamp}
                                </p>
                            </div>

                            <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                                {!item.isRead && (
                                    <span className="text-[8px] text-primary">
                                        <FontAwesomeIcon icon={faCircle} />
                                    </span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(item.id);
                                    }}
                                    title={t('notification.deleteTitle')}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-faint hover:text-like transition-opacity text-xs cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="p-2 border-t border-border bg-surface-hover/30 flex justify-between items-center text-xs">
                    <button
                        onClick={clearAll}
                        className="text-text-faint hover:text-like transition-colors px-2 py-1 rounded cursor-pointer"
                    >
                        {t('notification.deleteAll')}
                    </button>
                    <span className="text-text-faint text-[11px] px-2">
                        {t('notification.clickToView')}
                    </span>
                </div>
            )}
        </div>
    );
}
