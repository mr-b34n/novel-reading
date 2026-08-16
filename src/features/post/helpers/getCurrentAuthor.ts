import { useAuthStore } from "@/features/auth";


export const getCurrentAuthor = (): string => {
    const { user } = useAuthStore.getState();
    const username = user?.user_metadata?.username;
    if (typeof username === "string" && username.trim()) return username.trim();
    if (user?.email) return user.email.split("@")[0];
    return "You";
};
