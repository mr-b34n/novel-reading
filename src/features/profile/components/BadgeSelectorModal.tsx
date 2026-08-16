
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faAward, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import type { Badge } from "../types";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface BadgeSelectorModalProps {
    badges: Badge[];
    selectedBadgeId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    t: TranslateFn;
}

export const BadgeSelectorModal = ({ badges, selectedBadgeId, onSelect, onClose, t }: BadgeSelectorModalProps) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-surface rounded-3xl p-6 max-w-2xl w-full flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                    <h4 className="text-lg font-bold text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faAward} className="text-amber-400" />
                        <span>{t("profile.equippedBadgeTitle")}</span>
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">{t("profile.selectBadgeDesc")}</p>
                </div>
                <button onClick={onClose} className="text-text-faint hover:text-text cursor-pointer p-1" aria-label="Đóng">
                    <FontAwesomeIcon icon={faXmark} className="text-lg" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto p-2.5">
                {badges.map((b) => {
                    const isSelected = b.id === selectedBadgeId;
                    return (
                        <div
                            key={b.id}
                            onClick={() => onSelect(b.id)}
                            className={`p-4 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 relative border ${
                                isSelected ? "bg-primary/15 shadow-md border-primary ring-2 ring-primary/40" : "bg-surface-hover/60 hover:bg-surface-hover border-border/20"
                            }`}
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${b.color}`}>
                                <FontAwesomeIcon icon={b.icon} />
                            </div>
                            <div className="flex flex-col gap-1 min-w-0 pr-6">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">{b.badgeText}</span>
                                <h5 className="font-bold text-text text-sm">{b.title}</h5>
                                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{b.desc}</p>
                            </div>
                            {isSelected && (
                                <span className="absolute top-3 right-3 text-primary text-base" title="Đang trang bị">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs text-text-faint">{t("profile.allBadgesUnlocked")}</span>
                <button onClick={onClose} className="px-5 py-2 rounded-xl bg-surface-hover hover:bg-border text-text font-bold text-xs transition-colors cursor-pointer">
                    {t("profile.close")}
                </button>
            </div>
        </div>
    </div>
);
