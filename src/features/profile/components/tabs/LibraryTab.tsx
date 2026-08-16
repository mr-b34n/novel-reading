import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFire } from "@fortawesome/free-solid-svg-icons";
import type { LibraryGame } from "../../types";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface LibraryTabProps {
    games: LibraryGame[];
    t: TranslateFn;
}

const glowFromTag = (tagColor: string) => {
    if (tagColor.includes("emerald")) return "bg-emerald-400";
    if (tagColor.includes("amber"))   return "bg-amber-400";
    if (tagColor.includes("cyan"))    return "bg-cyan-400";
    if (tagColor.includes("rose"))    return "bg-rose-400";
    return "bg-primary";
};

export const LibraryTab = ({ games, t }: LibraryTabProps) => (
    <div className="flex flex-col gap-3 animate-fade-in">
        {games.map((game) => {
            const bar = glowFromTag(game.tagColor);

            return (
                <div
                    key={game.name}
                    className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-surface-hover/40 border border-border/20 hover:border-border/50 hover:bg-surface-hover/70 transition-all duration-200"
                >
                    {/* Logo */}
                    <img
                        src={game.logo}
                        alt={game.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1 gap-1">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="font-bold text-text text-sm truncate group-hover:text-primary transition-colors">
                                {game.name}
                            </h4>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${game.tagColor}`}>
                                {game.rank}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                                <FontAwesomeIcon icon={faFire} className="text-[10px]" />
                                {game.hours} {t("profile.hoursPlayedLabel")}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-faint">
                                <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                {game.lastPlayed}
                            </span>
                        </div>
                        {/* Thin accent bar */}
                        <div className="h-0.5 w-full rounded-full bg-border/30 mt-0.5">
                            <div className={`h-full w-1/3 rounded-full ${bar} opacity-60`} />
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);
