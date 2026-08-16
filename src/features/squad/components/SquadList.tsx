import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faPlus,
    faSearch,
    faGamepad,
    faFilter,
    faRocket,
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { faHubspot } from "@fortawesome/free-brands-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { useAuthStore } from "@/features/auth";
import { useSquadStore } from "../store/useSquadStore";
import { useGameStore } from "@/features/game/store/useGameStore";
import { GAME_FILTERS } from "../constants";
import { SquadCard } from "./SquadCard";
import { CreateSquadModal } from "./CreateSquadModal";

export const SquadList = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;

    const {
        squads,
        activeTab,
        filterGame,
        searchQuery,
        setActiveTab,
        setFilterGame,
        setSearchQuery,
    } = useSquadStore();
    const followedSlugs = useGameStore((state) => state.followedSlugs);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [showAllGames, setShowAllGames] = useState(false);

    const displayedGames = useMemo(() => {
        if (showAllGames) return GAME_FILTERS;
        const defaultPlayedGames = ["CS2", "Valorant", "League of Legends", "Dota 2", "PUBG", "Red Dead Redemption 2"];
        return GAME_FILTERS.filter((game) => {
            if (game === "all" || game === filterGame) return true;
            const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const isFollowed = followedSlugs.some((s) => s.includes(slug) || slug.includes(s));
            if (isFollowed) return true;
            if (followedSlugs.length === 0 && defaultPlayedGames.includes(game)) return true;
            return false;
        });
    }, [showAllGames, filterGame, followedSlugs]);

    const filteredSquads = squads.filter((squad) => {
        if (activeTab === "my-squads" && !squad.isMySquad) return false;
        if (filterGame !== "all" && squad.game !== filterGame) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = squad.name.toLowerCase().includes(q);
            const matchGame = squad.game.toLowerCase().includes(q);
            const matchDesc = squad.description.toLowerCase().includes(q);
            const matchTags = squad.tags.some((t) => t.toLowerCase().includes(q));
            if (!matchName && !matchGame && !matchDesc && !matchTags) return false;
        }
        return true;
    });

    const mySquadsCount = squads.filter((sq) => sq.isMySquad).length;

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12">
            <div className="w-full bg-gradient-to-r from-primary/15 via-surface to-accent-500/15 border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex flex-col gap-2 max-w-2xl z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <FontAwesomeIcon icon={faHubspot} />
                            {t('squad.heroBadge')}
                        </span>
                        <span className="text-xs font-semibold text-text-muted">{t('squad.squadSubtitle')}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight leading-tight">
                        {t('squad.heroTitle')}
                    </h1>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {t('squad.squadDesc')}
                    </p>
                </div>

                {isLoggedIn && (
                    <div className="shrink-0 z-10 w-full sm:w-auto flex justify-center sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-base" />
                            <span>{t('squad.createButton')}</span>
                        </button>
                    </div>
                )}

                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-1.5 bg-surface-hover/80 p-1.5 rounded-xl border border-border/80 overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setActiveTab("explore")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === "explore"
                                ? "bg-surface shadow-sm border border-border/50 text-text"
                                : "text-text-muted hover:text-text hover:bg-surface/50 border border-transparent"
                        }`}
                    >
                        <FontAwesomeIcon icon={faRocket} className={activeTab === "explore" ? "text-primary" : ""} />
                        <span>{t('squad.exploreTab')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "explore" ? "bg-primary/10 text-primary" : "bg-border text-text-muted"}`}>
                            {squads.length}
                        </span>
                    </button>

                    {isLoggedIn && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("my-squads")}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === "my-squads"
                                    ? "bg-surface shadow-sm border border-border/50 text-text"
                                    : "text-text-muted hover:text-text hover:bg-surface/50 border border-transparent"
                            }`}
                        >
                            <FontAwesomeIcon icon={faUsers} className={activeTab === "my-squads" ? "text-primary" : ""} />
                            <span>{t('squad.mySquadsTab')}</span>
                            {mySquadsCount > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    activeTab === "my-squads" ? "bg-primary/10 text-primary" : "bg-border text-text-muted"
                                }`}>
                                    {mySquadsCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div className="relative w-full sm:w-72">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint text-sm" />
                    <input
                        type="text"
                        placeholder={t('squad.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-hover border border-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary font-medium transition-colors"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                        <FontAwesomeIcon icon={faGamepad} className="text-primary" />
                        <span>{t('squad.filterGame')}</span>
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-extrabold border border-primary/20">
                            {filterGame === "all" ? `🔥 ${t('squad.allGames')}` : filterGame}
                        </span>
                        {filterGame !== "all" && (
                            <button
                                type="button"
                                onClick={() => setFilterGame("all")}
                                className="text-[11px] text-text-faint hover:text-rose-500 underline ml-1 cursor-pointer"
                            >
                                {t('squad.clearFilter')}
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAllGames(!showAllGames)}
                        className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-text border border-border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                        <span>{showAllGames ? t('squad.collapse') : t('squad.allGamesCount', { count: GAME_FILTERS.length - 1 })}</span>
                        <FontAwesomeIcon icon={showAllGames ? faChevronUp : faChevronDown} className="text-[10px]" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-hover/50 rounded-2xl border border-border/60 animate-fade-in">
                    {displayedGames.map((game) => (
                        <button
                            key={game}
                            type="button"
                            onClick={() => setFilterGame(game)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                                filterGame === game
                                    ? "bg-primary text-white border-primary shadow-2xs"
                                    : "bg-surface hover:bg-surface-hover text-text-muted border-border"
                            }`}
                        >
                            {game === "all" ? `🔥 ${t('squad.allGames')}` : game}
                        </button>
                    ))}
                </div>
            </div>

            {filteredSquads.length > 0 ? (
                <div className="flex flex-col gap-4 mt-2">
                    {filteredSquads.map((squad) => (
                        <SquadCard key={squad.id} squad={squad} />
                    ))}
                </div>
            ) : (
                <div className="w-full bg-surface border border-border/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 my-4">
                    <div className="w-16 h-16 rounded-3xl bg-surface-hover text-text-faint flex items-center justify-center text-3xl">
                        <FontAwesomeIcon icon={faFilter} />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-bold text-text">{t('squad.emptyTitle')}</h3>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {t('squad.emptyDesc')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>{t('squad.createNow')}</span>
                    </button>
                </div>
            )}

            <CreateSquadModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
};
