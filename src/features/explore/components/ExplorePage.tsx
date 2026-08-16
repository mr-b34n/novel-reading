import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFire, faArrowTrendUp, faHeart, faTrophy,
    faCalendarDay, faBolt, faPlay, faGamepad
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { GamePromoBanner } from "@/features/feed/components/GamePromoBanner";
import { VietnamGamesBanner } from "./VietnamGamesBanner";

// --- MOCK DATA ---
const TRENDING_TAGS = [
    { id: 1, label: "#ValorantChampions", color: "bg-rose-500/20 text-rose-500", icon: faTrophy },
    { id: 2, label: "#SteamSummerSale", color: "bg-blue-500/20 text-blue-500", icon: faBolt },
    { id: 3, label: "#GTA6Trailer", color: "bg-amber-500/20 text-amber-500", icon: faPlay },
    { id: 4, label: "#WholesomeGaming", color: "bg-emerald-500/20 text-emerald-500", icon: faHeart },
    { id: 5, label: "#IndieGems", color: "bg-purple-500/20 text-purple-400", icon: faFire },
    { id: 6, label: "#EldenRingDLC", color: "bg-indigo-500/20 text-indigo-400", icon: faGamepad },
];

const EVENTS = [
    {
        id: "ev1",
        title: "Summer Game Fest 2026",
        desc: "Watch the biggest reveals live. Drops enabled!",
        date: "Tháng 8 15 - 18",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
        tags: ["Live Event", "Giveaway"],
        color: "from-blue-600/80 to-purple-600/80"
    },
    {
        id: "ev2",
        title: "CS2 Major Championship",
        desc: "Quarter-finals starting today.",
        date: "Hôm nay, 19:00",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
        tags: ["Esports", "Tournament"],
        color: "from-orange-600/80 to-rose-600/80"
    },
    {
        id: "ev3",
        title: "Steam Next Fest",
        desc: "Play hundreds of free demos.",
        date: "Đang diễn ra",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop",
        tags: ["Festival", "Demos"],
        color: "from-emerald-600/80 to-teal-600/80"
    }
];

const VIRAL_POSTS = [
    {
        id: "p1",
        author: "NeoMatrix",
        title: "I finally beat Malenia after 342 tries. Here's my reaction.",
        type: "video",
        image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=600&auto=format&fit=crop",
        likes: "24.5K",
        colSpan: "md:col-span-2 md:row-span-2",
        bg: "bg-surface-hover/50"
    },
    {
        id: "p2",
        author: "CozyGamerGirl",
        title: "My stardew valley farm year 5! 🌻",
        type: "image",
        image: "https://images.unsplash.com/photo-1593305841991-0537e6916730?q=80&w=600&auto=format&fit=crop",
        likes: "12K",
        colSpan: "md:col-span-1 md:row-span-1",
        bg: "bg-emerald-500/10 border-emerald-500/30"
    },
    {
        id: "p3",
        author: "TechReviewer",
        title: "RTX 6090 Leaks - It's massive.",
        type: "news",
        image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=600&auto=format&fit=crop",
        likes: "8.2K",
        colSpan: "md:col-span-1 md:row-span-1",
        bg: "bg-surface-hover/50"
    },
    {
        id: "p4",
        author: "IndieDev101",
        title: "Just released my first game on Steam! AMA.",
        type: "discussion",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
        likes: "45K",
        colSpan: "md:col-span-2 md:row-span-1",
        bg: "bg-primary/10 border-primary/30"
    },
    {
        id: "p5",
        author: "EsportsGod",
        title: "The nastiest flick shot in history.",
        type: "video",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
        likes: "150K",
        colSpan: "md:col-span-1 md:row-span-2",
        bg: "bg-surface-hover/50"
    },
    {
        id: "p6",
        author: "MemeLord",
        title: "When the boss goes to phase 2 but you have no healing potions.",
        type: "image",
        image: "https://images.unsplash.com/photo-1563223126-7c9c0b116fb8?q=80&w=600&auto=format&fit=crop",
        likes: "88K",
        colSpan: "md:col-span-2 md:row-span-1",
        bg: "bg-surface-hover/50"
    }
];

export const ExplorePage = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20 animate-fade-in p-2 sm:p-0">
            {/* ── Page Header ── */}
            <div className="flex items-center gap-4 mt-4 px-4 sm:px-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight flex items-center gap-3">
                        {t('explore.title')}
                        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary rotate-12">
                            <FontAwesomeIcon icon={faArrowTrendUp} className="text-xl" />
                        </div>
                    </h1>
                    <p className="text-text-muted text-sm font-medium">{t('explore.subtitle')}</p>
                </div>
            </div>

            {/* ── Banner (Global Games Promo) ── */}
            <div className="-mx-2 sm:mx-0">
                <GamePromoBanner />
            </div>

            {/* ── Banner (Game Việt Nam Mới) ── */}
            <div className="-mx-2 sm:mx-0">
                <VietnamGamesBanner />
            </div>

            {/* ── Events Hero (Asymmetric Grid) ── */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDay} className="text-primary" />
                        {t('explore.ongoingEvents')}
                    </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {EVENTS.map((ev, idx) => (
                        <div 
                            key={ev.id} 
                            className={`relative rounded-3xl overflow-hidden group cursor-pointer h-64 sm:h-72 ${idx === 0 ? "lg:col-span-2" : "lg:col-span-1"}`}
                        >
                            <img 
                                src={ev.image} 
                                alt={ev.title} 
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${ev.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                            
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                                <div className="flex gap-2 mb-3">
                                    {ev.tags.map(t => (
                                        <span key={t} className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2 group-hover:-translate-y-1 transition-transform duration-300">
                                    {ev.title}
                                </h3>
                                <p className="text-white/80 text-sm font-medium line-clamp-2 mb-3 group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                                    {ev.desc}
                                </p>
                                <span className="inline-block px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white text-xs font-bold w-fit group-hover:-translate-y-1 transition-transform duration-300 delay-100">
                                    {ev.date}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Trending Tags (Pills) ── */}
            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {TRENDING_TAGS.map(tag => (
                        <button 
                            key={tag.id} 
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${tag.color} font-bold text-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer border border-transparent`}
                        >
                            <FontAwesomeIcon icon={tag.icon} />
                            {tag.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Bento Grid: Hottest & Viral ── */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                        {t('explore.viral')}
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[240px]">
                    {VIRAL_POSTS.map(post => (
                        <div 
                            key={post.id}
                            className={`relative rounded-3xl overflow-hidden group cursor-pointer border border-border/20 ${post.colSpan} ${post.bg}`}
                        >
                            {post.image && (
                                <img 
                                    src={post.image} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                                    alt=""
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 rounded-full bg-surface/80 backdrop-blur-md text-text text-xs font-bold shadow-sm">
                                        @{post.author}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold backdrop-blur-md">
                                        <FontAwesomeIcon icon={faHeart} />
                                        {post.likes}
                                    </span>
                                </div>
                                
                                <div>
                                    {post.type === 'video' && (
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-primary/30">
                                            <FontAwesomeIcon icon={faPlay} className="ml-1" />
                                        </div>
                                    )}
                                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug group-hover:text-primary-100 transition-colors">
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
