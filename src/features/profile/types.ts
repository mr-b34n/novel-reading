import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type ProfileStatus = "online" | "in-game" | "offline";
export type ProfileTab = "library" | "posts" | "guestbook" | "friends" | "bookmarks";

export interface Badge {
    id: string;
    title: string;
    desc: string;
    icon: IconDefinition;
    color: string;
    badgeText: string;
}

export interface GearCategory {
    value: string;
    label: string;
    icon: IconDefinition;
    color: string;
}

export interface LibraryGame {
    name: string;
    logo: string;
    hours: number;
    lastPlayed: string;
    achievements: number;
    totalAchievements: number;
    keyStat: string;
    rank: string;
    mvpCount: string;
    kdRatio: string;
    tagColor: string;
}

export interface FriendEntry {
    name: string;
    game: string | null;
    logo: string | null;
    status: ProfileStatus | "offline";
    isFriend: boolean;
}

export interface FriendRequest {
    id: string;
    name: string;
    game: string | null;
    logo: string | null;
    time: string;
}

export interface GuestbookComment {
    id: string;
    author: string;
    avatar: string;
    date: string;
    content: string;
    likes: number;
    isLiked: boolean;
}

export interface ProfileIdentity {
    name: string;
    username: string;
    bio: string;
    status: ProfileStatus;
}
