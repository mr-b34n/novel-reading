import { create } from "zustand";
import { type AuthState, type AuthUser } from "../types";

export * from "../types";

const ACCESS_TOKEN_KEY = "indieg_access_token";
const REFRESH_TOKEN_KEY = "indieg_refresh_token";
const AUTH_USER_KEY = "indieg_auth_user";

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true,
    mockLogin: false,
    customAvatar: typeof window !== "undefined" ? localStorage.getItem("user_custom_avatar") : null,

    setCustomAvatar: (avatar) => {
        if (typeof window !== "undefined") {
            if (avatar) {
                localStorage.setItem("user_custom_avatar", avatar);
            } else {
                localStorage.removeItem("user_custom_avatar");
            }
        }
        set({ customAvatar: avatar });
    },

    initializeAuth: () => {
        if (typeof window === "undefined") return;

        try {
            const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            const savedUser = localStorage.getItem(AUTH_USER_KEY);
            const isMocked = localStorage.getItem("indieg_mock_login") === "true";

            if (savedUser && savedToken) {
                const parsedUser: AuthUser = JSON.parse(savedUser);
                set({
                    user: parsedUser,
                    accessToken: savedToken,
                    refreshToken: savedRefreshToken || "mock_refresh_token_" + Date.now(),
                    mockLogin: isMocked,
                    loading: false,
                });
            } else if (isMocked) {
                const defaultUser: AuthUser = {
                    id: "usr_gamer_demo_1",
                    email: "gamer@indieg.com",
                    username: "IndieGamer",
                    avatar_url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150",
                    isVerified: true,
                    role: 'admin',
                };
                set({
                    user: defaultUser,
                    accessToken: "mock_access_token_demo",
                    refreshToken: "mock_refresh_token_demo",
                    mockLogin: true,
                    loading: false,
                });
            } else {
                set({ user: null, accessToken: null, refreshToken: null, loading: false });
            }
        } catch {
            set({ user: null, accessToken: null, refreshToken: null, loading: false });
        }
    },

    login: (userData: AuthUser, accessToken?: string, refreshToken?: string) => {
        const token = accessToken || "access_token_" + Math.random().toString(36).substring(2);
        const refToken = refreshToken || "refresh_token_" + Math.random().toString(36).substring(2);

        if (typeof window !== "undefined") {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
            localStorage.setItem(REFRESH_TOKEN_KEY, refToken);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
            localStorage.setItem("indieg_mock_login", "true");
        }

        set({
            user: userData,
            accessToken: token,
            refreshToken: refToken,
            mockLogin: true,
            loading: false,
        });
    },

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem("indieg_mock_login");
        }

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            mockLogin: false,
            loading: false,
        });
    },

    refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        const newAccessToken = "refreshed_access_token_" + Date.now();
        const newRefreshToken = "refreshed_refresh_token_" + Date.now();

        if (typeof window !== "undefined") {
            localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

        return true;
    },

    toggleMockLogin: () => {
        const { mockLogin, user } = get();
        if (!mockLogin || !user) {
            const demoUser: AuthUser = {
                id: "usr_gamer_demo_1",
                email: "gamer@indieg.com",
                username: "IndieGamer",
                avatar_url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150",
                isVerified: true,
                role: 'admin',
            };
            get().login(demoUser);
        } else {
            get().logout();
        }
    },

    verifyEmail: async (code: string) => {
        await new Promise((r) => setTimeout(r, 600));
        if (code === "123456" || code.trim().length === 6) {
            const { user } = get();
            if (user) {
                const updatedUser = { ...user, isVerified: true };
                get().login(updatedUser, get().accessToken || undefined, get().refreshToken || undefined);
            }
            return { success: true };
        }
        return { success: false, error: "Mã xác thực không đúng hoặc đã hết hạn (Mã thử nghiệm: 123456)." };
    },

    forgotPassword: async (email: string) => {
        await new Promise((r) => setTimeout(r, 600));
        if (!email.includes("@")) {
            return { success: false, error: "Địa chỉ email không hợp lệ." };
        }
        return { success: true };
    },

    resetPassword: async (password: string) => {
        await new Promise((r) => setTimeout(r, 600));
        if (password.length < 8) {
            return { success: false, error: "Mật khẩu phải chứa ít nhất 8 ký tự." };
        }
        return { success: true };
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        await new Promise((r) => setTimeout(r, 600));
        if (!currentPassword) {
            return { success: false, error: "Vui lòng nhập mật khẩu hiện tại." };
        }
        if (newPassword.length < 8) {
            return { success: false, error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
        }
        return { success: true };
    },
}));
