import { useState, useMemo } from "react";
import { FRIEND_PROFILES } from "../constants";
import type { ProfileIdentity } from "../types";

interface UseProfileIdentityArgs {
    userId: string;
    isOwnProfile: boolean;
    currentAuthor: string;
}

/**
 * Resolves display identity (name/username/bio/status) for the profile being viewed,
 * and keeps local editable copies in sync whenever the viewed profile changes.
 *
 * Note: syncing state from a derived value must happen in an effect, not during
 * render (the original component compared a `profileKey` and called setState
 * inline in the render body, which is a React anti-pattern).
 */
export function useProfileIdentity({ userId, isOwnProfile, currentAuthor }: UseProfileIdentityArgs) {
    const initial = useMemo<ProfileIdentity>(() => {
        if (isOwnProfile) {
            return {
                name: currentAuthor,
                username: `@${currentAuthor.toLowerCase().replace(/\s+/g, "_")}`,
                bio: "FPS Veteran | Raft survival architect | Looking for squad in CS2 Premier & Red Dead Redemption 2. Let's party up!",
                status: "online",
            };
        }
        const cleanId = userId?.replace(/^@/, "").toLowerCase() || "";
        return (
            FRIEND_PROFILES[cleanId] || {
                name: userId?.replace(/^@/, "") || "TacticalXeno",
                username: userId?.startsWith("@") ? userId : `@${userId || "tactical_xeno"}`,
                bio: "Pro competitive player & tactical leader. Always online for high rank pushes!",
                status: "online",
            }
        );
    }, [userId, isOwnProfile, currentAuthor]);

    const [prevInitial, setPrevInitial] = useState<ProfileIdentity>(initial);
    const [identity, setIdentity] = useState<ProfileIdentity>(initial);

    if (initial !== prevInitial) {
        setPrevInitial(initial);
        setIdentity(initial);
    }

    return { identity, setIdentity };
}
