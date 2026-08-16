import {
    faGamepad, faCrown, faShieldHalved, faTrophy, faFire, faClock, faMedal,
    faDesktop, faHeadphones, faMicrochip, faComputerMouse, faKeyboard,
    faMicrophone, faLayerGroup, faVolumeHigh, faTv,
} from "@fortawesome/free-solid-svg-icons";
import {
    CS2_BG as cs2Bg, RAFT_LOGO as raftLogo, RDR2_LOGO as rdr2Logo, CS2_LOGO as cs2Logo,
} from "@/shared/constants/images";
import type { Badge, GearCategory, LibraryGame, FriendEntry, FriendRequest, GuestbookComment, ProfileIdentity, ProfileStatus } from "./types";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

export const DEFAULT_COVER = cs2Bg;

/** Badge catalogue. Titles/descriptions are translated at call time via getBadgeCatalogue(t). */
export const getBadgeCatalogue = (t: TranslateFn): Badge[] => [
    { id: "founder", title: t("profile.badges.founderTitle"), desc: t("profile.badges.founderDesc"), icon: faCrown, color: "text-amber-400 bg-amber-400/10 border-amber-400/30", badgeText: "★ FOUNDER" },
    { id: "leader", title: t("profile.badges.leaderTitle"), desc: t("profile.badges.leaderDesc"), icon: faShieldHalved, color: "text-primary bg-primary/10 border-primary/30", badgeText: "🛡️ TACTICAL LEADER" },
    { id: "clutch", title: t("profile.badges.clutchTitle"), desc: t("profile.badges.clutchDesc"), icon: faTrophy, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", badgeText: "🏆 CLUTCH GOD" },
    { id: "outlaw", title: t("profile.badges.outlawTitle"), desc: t("profile.badges.outlawDesc"), icon: faFire, color: "text-rose-400 bg-rose-400/10 border-rose-400/30", badgeText: "🔥 OUTLAW" },
    { id: "nightowl", title: t("profile.badges.nightOwlTitle"), desc: t("profile.badges.nightOwlDesc"), icon: faClock, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30", badgeText: "🦉 NIGHT OWL" },
    { id: "shark", title: t("profile.badges.sharkTitle"), desc: t("profile.badges.sharkDesc"), icon: faMedal, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30", badgeText: "🦈 SHARK HUNTER" },
];

export const GEAR_CATEGORIES: GearCategory[] = [
    { value: "CPU", label: "CPU (Vi xử lý)", icon: faMicrochip, color: "text-sky-400" },
    { value: "GPU", label: "GPU (Card đồ họa)", icon: faTv, color: "text-emerald-400" },
    { value: "Monitor", label: "Monitor (Màn hình)", icon: faDesktop, color: "text-amber-400" },
    { value: "Mouse", label: "Mouse (Chuột gaming)", icon: faComputerMouse, color: "text-rose-400" },
    { value: "Keyboard", label: "Keyboard (Bàn phím)", icon: faKeyboard, color: "text-purple-400" },
    { value: "Headphones", label: "Headphones (Tai nghe)", icon: faHeadphones, color: "text-cyan-400" },
    { value: "Microphone", label: "Microphone (Mic thu âm)", icon: faMicrophone, color: "text-teal-300" },
    { value: "Mousepad", label: "Mousepad (Lót chuột)", icon: faLayerGroup, color: "text-indigo-400" },
    { value: "Audio / DAC", label: "Audio / Soundcard", icon: faVolumeHigh, color: "text-pink-400" },
    { value: "Controller / Other", label: "Controller / Thiết bị khác", icon: faGamepad, color: "text-amber-300" },
];

export const DEFAULT_GEAR: Record<string, string> = {
    CPU: "Intel Core i9-14900K @ 5.8GHz",
    GPU: "NVIDIA GeForce RTX 4090 24GB GDDR6X",
    Monitor: 'ROG Swift 360Hz OLED 27" (1440p 0.03ms)',
    Mouse: "Logitech G Pro X Superlight 2 (800 DPI)",
    Keyboard: "Wooting 60HE+ Custom",
    Headphones: "HyperX Cloud III Wireless",
    Microphone: "Shure SM7B + GoXLR Mini",
    Mousepad: "Artisan Zero FX Soft XL",
    "Audio / DAC": "",
    "Controller / Other": "",
};

export const LIBRARY_GAMES: LibraryGame[] = [
    { name: "Counter-Strike 2", logo: cs2Logo, hours: 840, lastPlayed: "Jul 26, 2026", achievements: 45, totalAchievements: 50, keyStat: "68.4% Winrate", rank: "Premier 18,500 ★", mvpCount: "42 MVP", kdRatio: "1.34 K/D", tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    { name: "Red Dead Redemption 2", logo: rdr2Logo, hours: 260, lastPlayed: "Jul 24, 2026", achievements: 38, totalAchievements: 52, keyStat: "100% Story Done", rank: "Legendary Outlaw", mvpCount: "$12,500 Gold", kdRatio: "Honor: Max", tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    { name: "Raft Hardcore", logo: raftLogo, hours: 140, lastPlayed: "Jul 22, 2026", achievements: 28, totalAchievements: 30, keyStat: "Day 150 Survived", rank: "Master Architect", mvpCount: "Boss Defeated", kdRatio: "0 Deaths", tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    { name: "Valorant", logo: cs2Logo, hours: 195, lastPlayed: "Jul 20, 2026", achievements: 18, totalAchievements: 25, keyStat: "54.2% Winrate", rank: "Ascendant 2", mvpCount: "19 MVP", kdRatio: "1.18 K/D", tagColor: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
];

export const INITIAL_FRIENDS: FriendEntry[] = [
    { name: "GhostRider", game: "Red Dead 2", logo: rdr2Logo, status: "online", isFriend: true },
    { name: "TacticalXeno", game: "Counter-Strike 2", logo: cs2Logo, status: "online", isFriend: true },
    { name: "NightOwl", game: "Raft", logo: raftLogo, status: "online", isFriend: true },
    { name: "Maplestrike", game: null, logo: null, status: "offline", isFriend: true },
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
    { id: "r1", name: "S1mple_Olex", game: "Counter-Strike 2", logo: cs2Logo, time: "10 phút trước" },
    { id: "r2", name: "Arthur_Morgan_99", game: "Red Dead Redemption 2", logo: rdr2Logo, time: "2 giờ trước" },
];

export const INITIAL_GUESTBOOK: GuestbookComment[] = [
    { id: "c1", author: "GhostRider", avatar: rdr2Logo, date: "2 giờ trước", content: "GG WP hôm qua leo rank khét quá bác ơi! Tối nay 8h tiếp tục chiến CS2 nhé 🚀🔥", likes: 5, isLiked: false },
    { id: "c2", author: "NightOwl", avatar: raftLogo, date: "Hôm qua", content: "Xây xong cái lâu đài trên biển trong Raft chưa bro? Nhớ chừa phòng cho tôi đấy 🏝️⛵", likes: 3, isLiked: true },
    { id: "c3", author: "TacticalXeno", avatar: cs2Logo, date: "3 ngày trước", content: "Uy tín 10 điểm! Game thủ nhẫn nại, call team chuẩn chỉ không toxic 👍💯", likes: 12, isLiked: true },
];

export const FRIEND_PROFILES: Record<string, ProfileIdentity> = {
    ghostrider: { name: "GhostRider", username: "@ghostrider", bio: "Red Dead Redemption 2 enthusiast. Outlaw by day, sheriff by night. Always down for lassoing bounties!", status: "online" },
    tactical_xeno: { name: "TacticalXeno", username: "@tactical_xeno", bio: "Pro CS2 competitive player & tactical leader. Always online for high rank pushes!", status: "in-game" },
    nightowl: { name: "NightOwl", username: "@nightowl", bio: "Late night gaming only (1 AM - 5 AM). Raft Hardcore survivor & building floating fortresses.", status: "online" },
    maplestrike: { name: "Maplestrike", username: "@maplestrike", bio: "Casual gamer exploring indie titles and RPGs. Currently offline, catch you on the weekend!", status: "offline" },
};

export const DEFAULT_STRANGER_STATUS: ProfileStatus = "online";
