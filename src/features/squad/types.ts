export type SquadVoiceType = "Discord Required" | "In-game Voice" | "Optional" | "No Mic";

export type SquadStatus = "recruiting" | "full" | "in-game";

export type SquadMemberRole = "Leader" | "Member";

export type SquadMemberStatus = "online" | "in-game" | "offline";

export interface SquadMember {
    id: string;
    username: string;
    avatar: string;
    role: SquadMemberRole;
    status: SquadMemberStatus;
    playtime?: string;
}

export interface Squad {
    id: string;
    name: string;
    game: string;
    gameLogo?: string;
    description: string;
    tags: string[];
    currentMembers: number;
    maxMembers: number;
    voice: SquadVoiceType;
    isMySquad: boolean;
    members: SquadMember[];
    roomCode?: string;
    discordUrl?: string;
    createdAt: string;
    status: SquadStatus;
}

export interface CreateSquadInput {
    name: string;
    game: string;
    description: string;
    tags: string[];
    maxMembers: number;
    voice: SquadVoiceType;
    roomCode?: string;
    discordUrl?: string;
}

export interface SquadState {
    squads: Squad[];
    activeTab: "explore" | "my-squads";
    filterGame: string;
    searchQuery: string;
    setActiveTab: (tab: "explore" | "my-squads") => void;
    setFilterGame: (game: string) => void;
    setSearchQuery: (query: string) => void;
    addSquad: (newSquadData: CreateSquadInput) => void;
    joinSquad: (squadId: string) => void;
    leaveSquad: (squadId: string) => void;
    kickMember: (squadId: string, memberUsername: string) => void;
    deleteSquad: (squadId: string) => void;
    toggleSquadStatus: (squadId: string) => void;
}
