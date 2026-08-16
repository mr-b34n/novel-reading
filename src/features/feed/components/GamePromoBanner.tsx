import { useState, useEffect } from "react";
import { 
    faStar, 
    faUsers, 
    faChevronLeft, 
    faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { INITIAL_GAMES } from "@/features/game/constants";

export const GamePromoBanner = () => {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();

    // 7 game nổi bật trên banner
    const promoGames = INITIAL_GAMES.filter(g => 
        ["counter-strike-2", "black-myth-wukong", "elden-ring", "cyberpunk-2077", "red-dead-redemption-2", "raft", "grand-theft-auto-v"].includes(g.slug)
    );

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered || promoGames.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % promoGames.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isHovered, promoGames.length]);

    if (!promoGames.length) return null;

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % promoGames.length);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + promoGames.length) % promoGames.length);
    };

    // Hàm tính toán vị trí tương đối (-3 đến +3) của card trong vòng lặp 3D Carousel
    const getCircularOffset = (index: number, current: number, total: number) => {
        let offset = (index - current) % total;
        const half = Math.floor(total / 2);
        if (offset > half) offset -= total;
        else if (offset < -half) offset += total;
        return offset;
    };

    // Hàm lấy style và vị trí CSS cho từng card dựa trên offset
    const getCardStyle = (offset: number) => {
        if (offset === 0) {
            // Card chính giữa: Nằm trên cùng (z-20), scale chuẩn 100%
            return {
                className: "left-1/2 -translate-x-1/2 z-20 scale-100 opacity-100 shadow-2xl cursor-pointer pointer-events-auto",
                isCenter: true
            };
        } else if (offset === -1) {
            // Card bên trái: Cùng kích thước cố định nhưng scale nhỏ lại và nằm dưới (z-10)
            return {
                className: "left-[13%] sm:left-[17%] -translate-x-1/2 z-10 scale-[0.85] opacity-75 hover:opacity-95 shadow-lg cursor-pointer pointer-events-auto",
                isCenter: false
            };
        } else if (offset === 1) {
            // Card bên phải: Cùng kích thước cố định nhưng scale nhỏ lại và nằm dưới (z-10)
            return {
                className: "left-[87%] sm:left-[83%] -translate-x-1/2 z-10 scale-[0.85] opacity-75 hover:opacity-95 shadow-lg cursor-pointer pointer-events-auto",
                isCenter: false
            };
        } else if (offset < -1) {
            // Card ẩn ngoài rìa bên trái
            return {
                className: "left-[-35%] -translate-x-1/2 z-0 scale-[0.70] opacity-0 pointer-events-none",
                isCenter: false
            };
        } else {
            // Card ẩn ngoài rìa bên phải
            return {
                className: "left-[135%] -translate-x-1/2 z-0 scale-[0.70] opacity-0 pointer-events-none",
                isCenter: false
            };
        }
    };

    return (
        <div 
            className="w-full flex flex-col gap-2.5 my-1 select-none relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 3D Carousel Container với chiều cao cố định tuyệt đối (không bao giờ bị thay đổi height) */}
            <div className="w-full relative overflow-hidden h-[230px] sm:h-[280px] flex items-center justify-center my-2">
                {/* Left navigation button - Height bằng cả thẻ, không bo góc, không border */}
                <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-14 bg-black/45 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-xs flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl group/btn"
                    title={t('common.prev')}
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="transition-transform group-hover/btn:-translate-x-0.5 text-base sm:text-lg" />
                </button>

                {/* Right navigation button - Height bằng cả thẻ, không bo góc, không border */}
                <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-14 bg-black/45 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-xs flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl group/btn"
                    title={t('common.next')}
                >
                    <FontAwesomeIcon icon={faChevronRight} className="transition-transform group-hover/btn:translate-x-0.5 text-base sm:text-lg" />
                </button>

                {/* Render tất cả card với cùng một kích thước cố định để không bị tràn/nhảy text khi di chuyển */}
                {promoGames.map((game, index) => {
                    const offset = getCircularOffset(index, currentIndex, promoGames.length);
                    const style = getCardStyle(offset);
                    const description = lang === "vi" ? (game.descriptionVi || game.description) : game.description;

                    const handleCardClick = () => {
                        if (offset === 0) {
                            navigate({ to: `/game/${game.slug}` });
                        } else if (offset === -1) {
                            handlePrev();
                        } else if (offset === 1) {
                            handleNext();
                        }
                    };

                    return (
                        <div
                            key={game.slug}
                            onClick={handleCardClick}
                            className={`absolute top-0 bottom-0 h-full w-[78%] sm:w-[66%] max-w-[800px] transition-all duration-600 ease-in-out rounded-2xl overflow-hidden bg-surface flex flex-col justify-end ${style.className}`}
                            title={game.name}
                        >
                            {/* Background Image */}
                            <img 
                                src={game.bannerUrl || game.logoUrl} 
                                alt={game.name}
                                className={`absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ${
                                    style.isCenter ? "group-hover:scale-105 opacity-90 dark:opacity-85" : "opacity-80"
                                }`}
                            />

                            {/* Overlays tối ưu để không che đi bg img quá nhiều */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent h-[45%] top-auto bottom-0 pointer-events-none" />
                            <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

                            {/* Content bên trong thẻ - Cấu trúc cố định giống hệt nhau cho tất cả các thẻ để không bao giờ bị nhảy hay tràn chữ khi chuyển animation */}
                            <div className="relative z-10 flex flex-col justify-end p-4 sm:p-6 text-left w-full pointer-events-none">
                                <div className="flex flex-col gap-1 sm:gap-1.5 max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                        <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md truncate">
                                            {game.name}
                                        </h3>
                                        {game.ratingScore && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold shrink-0 shadow-sm">
                                                <FontAwesomeIcon icon={faStar} />
                                                {game.ratingScore}
                                            </span>
                                        )}
                                    </div>

                                    {/* Genres & Active Players */}
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-200 font-medium">
                                        {game.genre && game.genre.slice(0, 3).map((g, idx) => (
                                            <span key={idx} className="bg-white/15 px-2 py-0.5 rounded-md text-white/90 font-semibold shadow-xs">
                                                {g}
                                            </span>
                                        ))}
                                        {game.activePlayers && (
                                            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                                <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                                                {t('game.activePlayers', { count: game.activePlayers.toLocaleString() })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description snippet gọn gàng */}
                                    <p className="text-xs sm:text-sm text-gray-200 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-relaxed drop-shadow-sm">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Bar: Simple Transition Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                {promoGames.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === currentIndex 
                                ? "w-6 bg-primary" 
                                : "w-1.5 bg-border sm:bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


