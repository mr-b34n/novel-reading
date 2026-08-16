export interface AuthUser {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    isVerified?: boolean;
    createdAt?: string;
    role?: 'admin' | 'moderator' | 'user';
}

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'verify-email' | 'reset-password';

export interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    mockLogin: boolean;
    customAvatar: string | null;
    setCustomAvatar: (avatar: string | null) => void;
    initializeAuth: () => void;
    login: (userData: AuthUser, accessToken?: string, refreshToken?: string) => void;
    logout: () => void;
    refreshTokens: () => Promise<boolean>;
    toggleMockLogin: () => void;
    verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ValidationRule {
    id: string;
    label: string;
    isMet: boolean;
}

export interface PasswordStrengthConfig {
    label: string;
    color: string;
    bg: string;
}

export interface PasswordValidationResult {
    requirements: ValidationRule[];
    score: number;
    isAllValid: boolean;
    strengthConfig: PasswordStrengthConfig;
    isEmpty: boolean;
}

