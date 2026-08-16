export interface GameGuide {
    id: string;
    title: string;
    titleVi?: string;
    author: string;
    authorAvatar: string;
    rank?: string;
    category: "tactics" | "builds" | "secrets" | "general";
    content: string;
    contentVi?: string;
    likes: number;
    views: number;
    date: string;
}

export interface GameReview {
    id: string;
    author: string;
    authorAvatar: string;
    rating: number; // 1 to 5
    hoursPlayed: string;
    content: string;
    contentVi?: string;
    date: string;
    recommended: boolean;
    likes: number;
}

export interface GameSystemReqs {
    minimum: {
        os: string;
        cpu: string;
        gpu: string;
        ram: string;
        storage: string;
    };
    recommended: {
        os: string;
        cpu: string;
        gpu: string;
        ram: string;
        storage: string;
    };
}

export interface GamePatchNote {
    id: string;
    version: string;
    title: string;
    titleVi?: string;
    date: string;
    summary: string;
    summaryVi?: string;
    type: "major" | "patch" | "hotfix" | "event";
    postId?: number; // Optional link to community post id
}

export interface GameData {
    slug: string; // The primary slug e.g. "counter-strike-2"
    id?: string; // Optional backwards compatibility (usually same as slug or community id)
    aliases?: string[]; // E.g. ["cs2", "counter_strike_2"]
    name: string; // E.g. "Counter Strike 2"
    tag: string; // Matching post.gameTag e.g. "Counter Strike 2" or "Raft"
    communityId?: string; // Link to /community/$communityId if exists e.g. "cs2", "rdr2", "raft"
    steamUrl?: string; // Direct link to Steam Store page
    developer: string;
    publisher: string;
    releaseDate: string;
    platforms: string[];
    genre: string[];
    ratingScore: number; // e.g. 4.8
    totalReviewsCount: number; // e.g. 142050
    sentiment: "Overwhelmingly Positive" | "Very Positive" | "Positive" | "Mixed";
    sentimentVi?: string;
    activePlayers: number; // e.g. 842150
    logoUrl: string;
    bannerUrl?: string;
    description: string;
    descriptionVi?: string;
    features: string[];
    featuresVi?: string[];
    screenshots: string[];
    systemReqs?: GameSystemReqs;
    guides: GameGuide[];
    reviews: GameReview[];
    patchNotes?: GamePatchNote[];
}


