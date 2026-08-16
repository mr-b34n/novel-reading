import {
    CS2_LOGO as cs2Logo,
    RDR2_LOGO as rdr2Logo,
    RAFT_LOGO as raftLogo,
    CS2_POSTER as cs2Poster,
    RAFT_POSTER as raftPoster,
    RDR2_POSTER as rdr2Poster,
    CS2_SCREENSHOTS,
    RDR2_SCREENSHOTS,
    RAFT_SCREENSHOTS
} from "@/shared/constants/images";

import { faCompass, faFire, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { type CommunityData, type CommunityTabKey } from "./types";

export const TAG_CLASSES = [
    "bg-surface-hover/70 text-text-muted border border-border/50 hover:bg-surface-hover transition-colors",
];

export const BANNER_GRADIENTS = [
    "from-brand-500/60 via-brand-400/20 to-transparent",
    "from-accent-500/60 via-accent-400/20 to-transparent",
    "from-success-500/60 via-success-400/20 to-transparent",
    "from-tag-5/60 via-tag-5/20 to-transparent",
];

export const COMMUNITY_TABS: { key: CommunityTabKey; label: string; icon: typeof faCompass }[] = [
    { key: "discover", label: "Khám phá", icon: faCompass },
    { key: "trending", label: "Thịnh hành", icon: faFire },
    { key: "joined", label: "Đã tham gia", icon: faLayerGroup },
];

export const INITIAL_COMMUNITIES: CommunityData[] = [
    {
        id: "raft",
        name: "Raft",
        logo: raftLogo,
        backdrop: raftPoster,
        category: "Survival",
        description:
            "Cộng đồng chính thức của Raft: mẹo sinh tồn, base build, farming route và ý tưởng thiết kế trên biển.",
        members: 24540,
        onlineNow: 416,
        tags: ["raft", "survival", "coop"],
        joined: true,
        featured: true,
    },
    {
        id: "cs2",
        name: "Counter Strike 2",
        logo: cs2Logo,
        backdrop: cs2Poster,
        category: "FPS",
        description:
            "Cộng đồng chính thức của CS2: chiến thuật, patch notes, tuyển quân và highlight clip.",
        members: 76190,
        onlineNow: 1614,
        tags: ["cs2", "esports", "fps"],
        joined: false,
        featured: true,
    },
    {
        id: "rdr2",
        name: "Red Dead Redemption 2",
        logo: rdr2Logo,
        backdrop: rdr2Poster,
        category: "Open World",
        description:
            "Cộng đồng chính thức của Red Dead Redemption 2: ảnh đẹp, build nhân vật và chuyện miền viễn Tây.",
        members: 9750,
        onlineNow: 128,
        tags: ["rdr2", "openworld", "story"],
        joined: false,
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk 2077",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Cyberpunk&backgroundColor=ff0055",
        backdrop: CS2_SCREENSHOTS[2],
        category: "RPG",
        description:
            "Khám phá Night City: hướng dẫn build Cyberware, mod đồ hoạ ray-tracing, cốt truyện Phantom Liberty và góc chụp ảnh cực chất.",
        members: 58200,
        onlineNow: 1240,
        tags: ["cyberpunk", "rpg", "scifi", "mods"],
        joined: false,
        featured: true,
    },
    {
        id: "eldenring",
        name: "Elden Ring",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=EldenRing&backgroundColor=d4af37",
        backdrop: RDR2_SCREENSHOTS[1],
        category: "Soulslike",
        description:
            "Hội Tarnished chinh phục Lands Between & Shadow of the Erdtree: hướng dẫn đánh boss, build vũ khí PvP/PvE và thảo luận lore bí ẩn.",
        members: 89400,
        onlineNow: 2350,
        tags: ["eldenring", "soulslike", "bossfight", "rpg"],
        joined: true,
        featured: false,
    },
    {
        id: "valorant",
        name: "Valorant",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Valorant&backgroundColor=ff4655",
        backdrop: CS2_SCREENSHOTS[1],
        category: "FPS",
        description:
            "Cộng đồng Valorant Việt Nam: chia sẻ lineup súng/skill, tìm squad leo rank, thảo luận meta Agent và giải đấu VCT.",
        members: 64100,
        onlineNow: 1890,
        tags: ["valorant", "fps", "riotgames", "rank"],
        joined: false,
        featured: false,
    },
    {
        id: "wukong",
        name: "Black Myth: Wukong",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Wukong&backgroundColor=ff8800",
        backdrop: RDR2_SCREENSHOTS[2],
        category: "Action RPG",
        description:
            "Hành trình Tây Du: hướng dẫn hạ gục Yêu Vương, build pháp bảo & phép thuật, bí mật ẩn trong các chương và lore thần thoại.",
        members: 42300,
        onlineNow: 980,
        tags: ["wukong", "actionrpg", "bosses", "mythology"],
        joined: false,
        featured: false,
    },
    {
        id: "gtav",
        name: "Grand Theft Auto V & Online",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=GTAV&backgroundColor=22aa22",
        backdrop: RDR2_SCREENSHOTS[0],
        category: "Open World",
        description:
            "Cộng đồng GTA Online & Roleplay (FiveM): tìm crew làm Heist, giao lưu xe cộ, hướng dẫn mod server và tin tức GTA VI.",
        members: 112500,
        onlineNow: 3120,
        tags: ["gtav", "gtaonline", "roleplay", "openworld"],
        joined: true,
        featured: true,
    },
    {
        id: "minecraft",
        name: "Minecraft Builders & Redstone",
        logo: "https://api.dicebear.com/7.x/identicon/svg?seed=Minecraft&backgroundColor=338833",
        backdrop: RAFT_SCREENSHOTS[1],
        category: "Sandbox",
        description:
            "Thế giới khối vuông kỳ diệu: khoe công trình kiến trúc mega-build, cỗ máy Redstone tự động, chia sẻ seed map và server sinh tồn.",
        members: 95000,
        onlineNow: 2150,
        tags: ["minecraft", "sandbox", "building", "redstone"],
        joined: false,
        featured: false,
    },
];

export const formatCompactNumber = (num: number): string => {
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'k';
    }
    return num.toString();
};

