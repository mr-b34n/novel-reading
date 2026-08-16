import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faEyeSlash,
    faSpinner,
    faArrowLeft,
    faGamepad,
    faUsers,
    faShieldHalved,
    faSun,
    faMoon,
    faWandMagicSparkles,
    faRightToBracket,
    faUserPlus,
    faEnvelope,
    faUser,
    faKey,
    faUserCheck,
    faExclamationTriangle,
    faPaperPlane,
    faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { useState } from 'react';

import { STRENGTH_LEVELS, validatePassword, type PasswordValidationResult } from '../features/auth/helpers/passwordValidator';
import { useThemeStore } from '@/shared/store/useThemeStore';
import { useAuthStore, type AuthMode } from '@/features/auth';

const AuthPage = () => {
    const navigate = useNavigate();
    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const language = useThemeStore((state) => state.language);
    const toggleLanguage = useThemeStore((state) => state.toggleLanguage);
    const loginStoreAction = useAuthStore((state) => state.login);
    const toggleMockLogin = useAuthStore((state) => state.toggleMockLogin);

    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isPasswordMatched, setIsPasswordMatched] = useState(true);

    // Error & Success Feedback states
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        otpCode: "",
    });

    const EMPTY_PASSWORD_STATE: PasswordValidationResult = {
        requirements: [],
        score: 0,
        isAllValid: false,
        strengthConfig: STRENGTH_LEVELS[1],
        isEmpty: true,
    };

    const [pwdState, setPwdState] = useState<PasswordValidationResult>(EMPTY_PASSWORD_STATE);

    const switchMode = async (newMode: AuthMode) => {
        setMode(newMode);
        setServerError(null);
        setSuccessMessage(null);
        setFormData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            otpCode: "",
        });
        setIsShowPassword(false);
        const result = await validatePassword("");
        setPwdState(result);
        setIsPasswordMatched(true);
    };

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        setServerError(null);

        if (id === "password") {
            const result = await validatePassword(value);
            setPwdState(result);
        }

        if (id === "confirmPassword") {
            setIsPasswordMatched(true);
        }
    };

    const handleGuestLogin = () => {
        setIsLoading(true);
        setServerError(null);
        setTimeout(() => {
            toggleMockLogin();
            setIsLoading(false);
            navigate({ to: "/" });
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError(null);
        setSuccessMessage(null);

        // --- LOGIN FLOW ---
        if (mode === 'login') {
            if (!formData.email.trim()) {
                setServerError("Vui lòng nhập email hoặc tên đăng nhập.");
                return;
            }
            if (!formData.password) {
                setServerError("Vui lòng nhập mật khẩu.");
                return;
            }

            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 800));
                // Simulate invalid credentials test if password is 'wrong'
                if (formData.password === "error") {
                    setServerError("Mật khẩu không chính xác. Vui lòng kiểm tra lại.");
                    setIsLoading(false);
                    return;
                }

                const userObj = {
                    id: "usr_" + Math.random().toString(36).substring(2, 9),
                    email: formData.email,
                    username: formData.email.split("@")[0] || "IndiePlayer",
                    isVerified: true,
                };
                loginStoreAction(userObj);
                setSuccessMessage("Đăng nhập thành công! Đang chuyển hướng...");
                setTimeout(() => {
                    navigate({ to: "/" });
                }, 600);
            } catch {
                setServerError("Đã xảy ra lỗi kết nối hệ thống. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- REGISTER FLOW ---
        if (mode === 'register') {
            if (!formData.username.trim()) {
                setServerError("Vui lòng nhập tên người dùng.");
                return;
            }
            if (!formData.email.includes("@")) {
                setServerError("Địa chỉ email không hợp lệ.");
                return;
            }

            const isPasswordValid = pwdState.requirements.every((req) => req.isMet);
            if (!isPasswordValid) {
                setServerError("Mật khẩu chưa đạt đủ yêu cầu độ mạnh.");
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setIsPasswordMatched(false);
                setServerError("Mật khẩu xác nhận không trùng khớp.");
                return;
            }

            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 800));
                setSuccessMessage("Đăng ký thành công! Đã gửi mã xác nhận 6 chữ số tới email của bạn.");
                setTimeout(() => {
                    setMode('verify-email');
                }, 1000);
            } catch {
                setServerError("Không thể tạo tài khoản lúc này. Thử lại sau.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- FORGOT PASSWORD FLOW ---
        if (mode === 'forgot-password') {
            if (!formData.email.includes("@")) {
                setServerError("Vui lòng nhập địa chỉ email hợp lệ.");
                return;
            }

            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 800));
                setSuccessMessage("Link & mã khôi phục mật khẩu đã gửi tới " + formData.email + ". Hãy nhập mã bên dưới!");
                setTimeout(() => {
                    setMode('reset-password');
                }, 1200);
            } catch {
                setServerError("Không thể gửi email khôi phục. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- VERIFY EMAIL FLOW ---
        if (mode === 'verify-email') {
            if (formData.otpCode.trim().length !== 6) {
                setServerError("Vui lòng nhập đủ mã OTP 6 chữ số (Mã thử nghiệm: 123456).");
                return;
            }

            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 800));
                if (formData.otpCode !== "123456" && formData.otpCode.trim().length !== 6) {
                    setServerError("Mã xác thực không chính xác. Mã đúng thử nghiệm là: 123456");
                    setIsLoading(false);
                    return;
                }

                setSuccessMessage("Xác thực email thành công! Tài khoản của bạn đã sẵn sàng.");
                const verifiedUser = {
                    id: "usr_v_" + Math.random().toString(36).substring(2, 9),
                    email: formData.email || "gamer@indieg.com",
                    username: formData.username || "VerifiedGamer",
                    isVerified: true,
                };
                loginStoreAction(verifiedUser);
                setTimeout(() => {
                    navigate({ to: "/" });
                }, 800);
            } catch {
                setServerError("Xác thực thất bại. Vui lòng kiểm tra lại mã.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- RESET PASSWORD FLOW ---
        if (mode === 'reset-password') {
            const isPasswordValid = pwdState.requirements.every((req) => req.isMet);
            if (!isPasswordValid) {
                setServerError("Mật khẩu mới chưa đủ độ mạnh yêu cầu.");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setIsPasswordMatched(false);
                setServerError("Mật khẩu xác nhận không trùng khớp.");
                return;
            }

            setIsLoading(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 800));
                setSuccessMessage("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
                setTimeout(() => {
                    switchMode('login');
                }, 1200);
            } catch {
                setServerError("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
            return;
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-bg text-text flex flex-col justify-between overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-160 h-160 bg-primary/20 dark:bg-primary/25 rounded-full blur-[140px]" />
                <div className="absolute top-1/2 -right-40 w-160 h-160 bg-accent-500/15 dark:bg-accent-500/20 rounded-full blur-[140px]" />
                <div className="absolute -bottom-40 left-1/3 w-140 h-140 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px]" />
            </div>

            {/* Top Navigation Header */}
            <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
                {/* Brand Logo */}
                <button
                    onClick={() => navigate({ to: "/" })}
                    className="flex items-center gap-3 group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                        <FontAwesomeIcon icon={faGamepad} className="text-xl" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-primary">
                            IndieG
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-faint -mt-1">
                            Gaming Hub
                        </span>
                    </div>
                </button>

                {/* Right Controls */}
                <div className="flex items-center gap-2 sm:gap-3 bg-surface/80 backdrop-blur-md border border-border p-1.5 rounded-full shadow-md">
                    <button
                        onClick={() => navigate({ to: "/" })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        <span className="hidden sm:inline">Trang chủ</span>
                    </button>

                    <div className="w-px h-4 bg-border" />

                    <button
                        onClick={toggleLanguage}
                        title="Đổi ngôn ngữ"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                        {language.toUpperCase()}
                    </button>

                    <button
                        onClick={toggleTheme}
                        title="Đổi giao diện sáng/tối"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={theme === "light" ? faSun : faMoon} className="text-sm" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex items-center justify-center">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* LEFT SIDE: Slogans & Info */}
                    <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold shadow-xs">
                            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-amber-400 text-xs" />
                            <span>Gaming Social Hub • Connect & Play</span>
                        </div>

                        <div className="flex flex-col gap-3 max-w-2xl">
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-text leading-tight sm:leading-none">
                                Connect Your <span className="text-primary">Squad</span>.<br />
                                Elevate Your <span className="text-amber-500">Game</span>.
                            </h1>
                            <p className="text-sm sm:text-base text-text-muted max-w-md leading-relaxed">
                                Nền tảng kết nối đồng đội & cộng đồng game thủ thế hệ mới.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-2">
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-primary/40 hover:bg-surface transition-all shadow-xs group text-left">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-sm font-extrabold text-text group-hover:text-primary transition-colors">
                                        Connect Your Squad
                                    </h3>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Tìm kiếm đồng đội chuẩn gu, kết nối squad tức thì.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-primary/40 hover:bg-surface transition-all shadow-xs group text-left">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faGamepad} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-sm font-extrabold text-text group-hover:text-primary transition-colors">
                                        Elevate Your Game
                                    </h3>
                                    <p className="text-xs text-text-muted leading-relaxed">
                                        Nâng tầm trải nghiệm gaming cùng cộng đồng.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Auth Card */}
                    <div className="lg:col-span-5 w-full max-w-md mx-auto">
                        <div className="relative rounded-3xl bg-surface/80 backdrop-blur-xl border border-border shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
                            
                            {/* Card Header */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <h2 className="text-xl sm:text-2xl font-black text-text">
                                            {mode === 'login' && "Đăng Nhập IndieG"}
                                            {mode === 'register' && "Tạo Tài Khoản Mới"}
                                            {mode === 'forgot-password' && "Khôi Phục Mật Khẩu"}
                                            {mode === 'verify-email' && "Xác Thực Địa Chỉ Email"}
                                            {mode === 'reset-password' && "Đặt Mật Khẩu Mới"}
                                        </h2>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {mode === 'login' && "Chào mừng bạn trở lại! Hãy nhập thông tin để chiến game."}
                                            {mode === 'register' && "Gia nhập ngay hôm nay để mở khóa toàn bộ tính năng."}
                                            {mode === 'forgot-password' && "Nhập địa chỉ email để nhận mã xác nhận đặt lại mật khẩu."}
                                            {mode === 'verify-email' && "Nhập mã OTP 6 chữ số đã được gửi tới email của bạn."}
                                            {mode === 'reset-password' && "Tạo mật khẩu mới an toàn cho tài khoản của bạn."}
                                        </p>
                                    </div>
                                </div>

                                {/* Mode Switcher Tabs for Login/Register */}
                                {(mode === 'login' || mode === 'register') && (
                                    <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-hover/80 border border-border text-xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => switchMode('login')}
                                            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                                mode === 'login'
                                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                                    : "text-text-muted hover:text-text"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faRightToBracket} className="text-xs" />
                                            <span>Đăng Nhập</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => switchMode('register')}
                                            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                                mode === 'register'
                                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                                    : "text-text-muted hover:text-text"
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
                                            <span>Đăng Ký</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Alert Banner: Error State */}
                            {serverError && (
                                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-sm shrink-0 mt-0.5" />
                                    <span>{serverError}</span>
                                </div>
                            )}

                            {/* Alert Banner: Success State */}
                            {successMessage && (
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
                                    <FontAwesomeIcon icon={faCircleCheck} className="text-sm shrink-0 mt-0.5" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Main Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                
                                {/* Username (Register) */}
                                {mode === 'register' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="username" className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faUser} className="text-primary text-xs" />
                                            <span>Tên người dùng (Username)</span>
                                        </label>
                                        <div className="flex items-center w-full rounded-2xl h-11 border border-border bg-bg/60 px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <input
                                                id="username"
                                                type="text"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="VD: ProGamer99"
                                                disabled={isLoading}
                                                className="w-full h-full focus:outline-none bg-transparent text-sm text-text placeholder:text-text-faint font-medium disabled:opacity-50"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email Address (Login, Register, Forgot Password) */}
                                {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="email" className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faEnvelope} className="text-primary text-xs" />
                                            <span>Địa chỉ Email</span>
                                        </label>
                                        <div className="flex items-center w-full rounded-2xl h-11 border border-border bg-bg/60 px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="gamer@indieg.com"
                                                disabled={isLoading}
                                                className="w-full h-full focus:outline-none bg-transparent text-sm text-text placeholder:text-text-faint font-medium disabled:opacity-50"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Password Field (Login, Register, Reset Password) */}
                                {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faKey} className="text-primary text-xs" />
                                                <span>{mode === 'reset-password' ? 'Mật khẩu mới' : 'Mật khẩu'}</span>
                                            </label>
                                            {mode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => switchMode('forgot-password')}
                                                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                                >
                                                    Quên mật khẩu?
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2 w-full rounded-2xl h-11 border border-border bg-bg/60 px-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <input
                                                id="password"
                                                type={isShowPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                className="w-full h-full focus:outline-none bg-transparent text-sm text-text placeholder:text-text-faint font-medium disabled:opacity-50"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsShowPassword(!isShowPassword)}
                                                className="text-text-faint hover:text-text p-1 text-xs cursor-pointer"
                                            >
                                                <FontAwesomeIcon icon={isShowPassword ? faEye : faEyeSlash} />
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {(mode === 'register' || mode === 'reset-password') && (
                                            <div className="flex flex-col gap-2 mt-1 p-3 rounded-2xl border border-border bg-bg/80 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-semibold ${pwdState.isEmpty ? "text-text-faint" : pwdState.strengthConfig.color}`}>
                                                        Độ mạnh: <span className="font-bold">{pwdState.isEmpty ? "Chưa nhập" : pwdState.strengthConfig.label}</span>
                                                    </span>
                                                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-28">
                                                        {[1, 2, 3, 4].map((level) => (
                                                            <div
                                                                key={level}
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    level <= (pwdState.score <= 1 ? 1 : pwdState.score)
                                                                        ? pwdState.strengthConfig.bg
                                                                        : "bg-surface-hover"
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-border/60 text-[11px]">
                                                    {pwdState.requirements.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-1.5">
                                                            <FontAwesomeIcon
                                                                icon={faCircleCheck}
                                                                className={item.isMet ? "text-emerald-500" : "text-text-faint"}
                                                            />
                                                            <span className={item.isMet ? "text-text font-medium" : "text-text-faint"}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Confirm Password (Register, Reset Password) */}
                                {(mode === 'register' || mode === 'reset-password') && (
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="confirmPassword" className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-xs" />
                                            <span>Xác nhận mật khẩu</span>
                                        </label>
                                        <div
                                            className={`flex items-center w-full rounded-2xl h-11 border px-3.5 transition-all ${
                                                isPasswordMatched
                                                    ? "border-border bg-bg/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                                                    : "border-rose-500 bg-rose-500/10"
                                            }`}
                                        >
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                disabled={isLoading}
                                                className="w-full h-full focus:outline-none bg-transparent text-sm text-text placeholder:text-text-faint font-medium disabled:opacity-50"
                                                required
                                            />
                                        </div>
                                        {!isPasswordMatched && (
                                            <p className="text-rose-500 text-xs font-bold mt-0.5">
                                                Mật khẩu xác nhận không trùng khớp!
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* OTP Field (Verify Email) */}
                                {mode === 'verify-email' && (
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="otpCode" className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faLock} className="text-primary text-xs" />
                                            <span>Mã OTP xác thực 6 chữ số</span>
                                        </label>
                                        <div className="flex items-center w-full rounded-2xl h-12 border border-border bg-bg/60 px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <input
                                                id="otpCode"
                                                type="text"
                                                maxLength={6}
                                                value={formData.otpCode}
                                                onChange={handleInputChange}
                                                placeholder="123456"
                                                disabled={isLoading}
                                                className="w-full h-full focus:outline-none bg-transparent text-center tracking-[0.5em] font-mono text-lg font-bold text-text disabled:opacity-50"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-text-faint text-center">
                                            Mã thử nghiệm demo: <span className="font-mono font-bold text-primary">123456</span>
                                        </p>
                                    </div>
                                )}

                                {/* Action Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-extrabold shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : mode === 'login' ? (
                                        <>
                                            <FontAwesomeIcon icon={faRightToBracket} />
                                            <span>Đăng Nhập Ngay</span>
                                        </>
                                    ) : mode === 'register' ? (
                                        <>
                                            <FontAwesomeIcon icon={faUserPlus} />
                                            <span>Tạo Tài Khoản Mới</span>
                                        </>
                                    ) : mode === 'forgot-password' ? (
                                        <>
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                            <span>Gửi Mã Khôi Phục</span>
                                        </>
                                    ) : mode === 'verify-email' ? (
                                        <>
                                            <FontAwesomeIcon icon={faCircleCheck} />
                                            <span>Xác Nhận Email</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faLock} />
                                            <span>Lưu Mật Khẩu Mới</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Back to Login Link for secondary modes */}
                            {(mode === 'forgot-password' || mode === 'verify-email' || mode === 'reset-password') && (
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="text-xs font-bold text-text-muted hover:text-primary transition-colors text-center cursor-pointer py-1"
                                >
                                    ← Quay lại trang Đăng Nhập
                                </button>
                            )}

                            {/* Quick Guest Access (Demo) */}
                            {(mode === 'login' || mode === 'register') && (
                                <>
                                    <div className="relative w-full flex items-center justify-center my-0.5">
                                        <div className="w-full h-px bg-border" />
                                        <span className="absolute bg-surface px-3 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                                            Hoặc
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGuestLogin}
                                        className="w-full py-2.5 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                                    >
                                        <FontAwesomeIcon icon={faUserCheck} />
                                        <span>Trải Nghiệm Nhanh (Khách Demo)</span>
                                    </button>
                                </>
                            )}

                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-20 w-full border-t border-border/50 py-4 text-center text-xs text-text-faint">
                <p>© 2026 IndieG Gaming Hub. Tất cả quyền được bảo lưu.</p>
            </footer>
        </div>
    );
};

export const Route = createFileRoute('/auth')({
    beforeLoad: () => {
        const { user, mockLogin } = useAuthStore.getState();

        if (user || mockLogin) {
            throw redirect({
                to: '/',
                replace: true
            });
        }
    },
    component: AuthPage,
});
