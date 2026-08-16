import { useState, useEffect } from "react";
import { 
    faStar, 
    faChevronLeft, 
    faChevronRight,
    faGamepad,
    faFire,
    faWandMagicSparkles
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/shared/hooks/useTranslate";

export interface VietnamGame {
    id: string;
    name: string;
    developer: string;
    genre: string;
    status: string;
    rating: string;
    releaseDate: string;
    descriptionVi: string;
    descriptionEn: string;
    bannerUrl: string;
    tags: string[];
    accentColor: string;
    linkSlug?: string;
}

const VIETNAM_GAMES: VietnamGame[] = [
    {
        id: "vn-1",
        name: "Thần Trùng (The Death)",
        developer: "DUT Studio",
        genre: "Kinh Dị Tâm Lý / Tâm Linh Việt",
        status: "Đã Ra Mắt",
        rating: "4.9",
        releaseDate: "Mới Cập Nhật 2026",
        descriptionVi: "Trải nghiệm không gian Hà Nội thập niên 90 âm u kỳ bí với những câu chuyện tâm linh, truyền thuyết đô thị Việt Nam gây sốt cộng đồng.",
        descriptionEn: "Psychological horror set in 1990s Hanoi exploring authentic Vietnamese folklore and urban legends.",
        bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop",
        tags: ["Kinh Dị Việt", "Hà Nội 1990s", "DUT Studio"],
        accentColor: "from-rose-600/90 via-red-900/80 to-black/90",
        linkSlug: "than-trung"
    },
    {
        id: "vn-2",
        name: "Hoa (Ghibli Style Indie)",
        developer: "Skrollcat Studio",
        genre: "Phiêu Lưu / Giải Đố Nghệ Thuật",
        status: "Đoạt Giải Quốc Tế",
        rating: "4.95",
        releaseDate: "Bản Siêu Đẹp 4K",
        descriptionVi: "Tuyệt phẩm indie Việt Nam với đồ họa vẽ tay thủ công đẹp ảo diệu phong cách Ghibli và âm hưởng piano êm dịu.",
        descriptionEn: "Award-winning Vietnamese indie game featuring breathtaking hand-drawn artwork and relaxing piano soundtrack.",
        bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
        tags: ["Đồ Họa Vẽ Tay", "Ghibli", "Thư Giãn"],
        accentColor: "from-emerald-600/90 via-teal-900/80 to-black/90",
        linkSlug: "hoa"
    },
    {
        id: "vn-3",
        name: "Thần Điện - Huyền Thoại Việt",
        developer: "Cỏ Mềm Team",
        genre: "Nhập Vai Cổ Tích / Thần Thoại",
        status: "Sắp Ra Mắt 2026",
        rating: "4.8",
        releaseDate: "Q4 2026",
        descriptionVi: "Hành trình tái hiện câu chuyện Sơn Tinh Thủy Tinh & các vị thần sử Việt bằng công nghệ đồ họa Unreal Engine 5 đỉnh cao.",
        descriptionEn: "Epic action RPG bringing Vietnamese mythology & Son Tinh Thuy Tinh legends into modern UE5 graphics.",
        bannerUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop",
        tags: ["Unreal Engine 5", "Sơn Tinh Thủy Tinh", "Sắp Ra Mắt"],
        accentColor: "from-amber-600/90 via-orange-900/80 to-black/90"
    },
    {
        id: "vn-4",
        name: "7554: Điện Biên Phủ Remastered",
        developer: "Emobi Games",
        genre: "Bắn Súng Lịch Sử Việt Nam",
        status: "Bản Nâng Cấp HD",
        rating: "4.7",
        releaseDate: "Phiên Bản Kỷ Niệm",
        descriptionVi: "Hào hùng trận chiến lịch sử Điện Biên Phủ lừng lẫy. Tái hiện tinh thần quả cảm của các chiến sĩ quân đội nhân dân Việt Nam.",
        descriptionEn: "Historical Vietnam War FPS game remastered celebrating heroic history and nation-building spirit.",
        bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
        tags: ["Bắn Súng Lịch Sử", "Điện Biên Phủ", "Hào Hùng"],
        accentColor: "from-blue-600/90 via-indigo-900/80 to-black/90"
    }
];

export const VietnamGamesBanner = () => {
    const { lang, t } = useTranslation();
    const navigate = useNavigate();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % VIETNAM_GAMES.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [isHovered]);

    const currentGame = VIETNAM_GAMES[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % VIETNAM_GAMES.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + VIETNAM_GAMES.length) % VIETNAM_GAMES.length);
    };

    return (
        <div 
            className="w-full flex flex-col gap-3 my-2 select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header section badge */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-rose-500/15 text-rose-500 font-extrabold text-sm shadow-xs">
                        🇻🇳
                    </span>
                    <div className="flex flex-col">
                        <h2 className="text-base sm:text-lg font-black text-text tracking-tight flex items-center gap-2">
                            <span>{t('explore.vietnamGames.title')}</span>
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                HOT INDIE VIỆT
                            </span>
                        </h2>
                        <p className="text-xs text-text-muted font-medium">
                            {t('explore.vietnamGames.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Counter & Indicator */}
                <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted">
                        {currentIndex + 1} / {VIETNAM_GAMES.length}
                    </span>
                    <div className="flex items-center gap-1">
                        {VIETNAM_GAMES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === currentIndex ? "w-6 bg-rose-500" : "w-2 bg-border hover:bg-text-faint"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Banner Main Showcase */}
            <div className="relative w-full h-[260px] sm:h-[300px] rounded-3xl overflow-hidden shadow-xl border border-border/60 group bg-surface">
                {/* Background Banner Image */}
                <img
                    key={currentGame.id}
                    src={currentGame.bannerUrl}
                    alt={currentGame.name}
                    className="absolute inset-0 w-full h-full object-cover object-center scale-100 group-hover:scale-105 transition-all duration-700 ease-out"
                />

                {/* Dynamic Gradient Overlays */}
                <div className={`absolute inset-0 bg-gradient-to-r ${currentGame.accentColor} opacity-35 transition-all duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent h-[50%] top-auto bottom-0" />

                {/* Left & Right Nav Controls */}
                <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-110"
                    title="Trước"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-110"
                    title="Tiếp theo"
                >
                    <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                </button>

                {/* Banner Content Container */}
                <div className="relative z-10 w-full h-full p-5 sm:p-8 flex flex-col justify-between">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <FontAwesomeIcon icon={faGamepad} className="text-rose-400" />
                                {currentGame.developer}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                                {currentGame.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-amber-400 font-extrabold text-xs">
                                <FontAwesomeIcon icon={faStar} />
                                {currentGame.rating}
                            </span>
                            <span className="hidden md:inline-block px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium">
                                {currentGame.releaseDate}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Details & Call To Action */}
                    <div className="flex flex-col gap-2 max-w-3xl">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            {currentGame.tags.map((tag) => (
                                <span key={tag} className="text-[10px] font-bold text-white/90 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                            {currentGame.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-white/90 font-medium line-clamp-2 leading-relaxed drop-shadow-xs max-w-2xl">
                            {lang === "vi" ? currentGame.descriptionVi : currentGame.descriptionEn}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (currentGame.linkSlug) {
                                        navigate({ to: `/game/${currentGame.linkSlug}` });
                                    } else {
                                        navigate({ to: "/community" });
                                    }
                                }}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-rose-500/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                            >
                                <FontAwesomeIcon icon={faFire} />
                                <span>{t('explore.vietnamGames.exploreBtn')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate({ to: "/community" })}
                                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer hidden sm:flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faWandMagicSparkles} />
                                <span>{t('explore.vietnamGames.discussBtn')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
