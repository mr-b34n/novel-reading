export type CommunityTabKey = "discover" | "trending" | "joined";

export interface CommunityMember {
    username: string;
    displayName: string;
    avatar?: string;
    role: "owner" | "admin" | "mod" | "member";
    joinedAt: string;
}

export interface CommunityData {
    id: string | number;
    name: string;
    logo: string;
    backdrop: string;
    category: string;
    description: string;
    members: number;
    onlineNow: number;
    tags: string[];
    joined: boolean;
    featured?: boolean;
    owner?: string;
    admins?: string[];
    mods?: string[];
    rules?: string[];
    memberList?: CommunityMember[];
}

export interface CommunitiesState {
    communities: CommunityData[];
    toggleJoin: (id: string | number) => void;
    getCommunityById: (id: string | number) => CommunityData | undefined;
    addCommunity: (community: CommunityData) => void;
    updateCommunity: (id: string | number, data: Partial<CommunityData>) => void;
    deleteCommunity: (id: string | number) => void;
}
