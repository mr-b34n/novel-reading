import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCheck } from "@fortawesome/free-solid-svg-icons";
import { GEAR_CATEGORIES } from "../constants";
import type { TranslateFn } from "@/shared/hooks/useTranslate";

interface ProfileSidebarProps {
    isOwnProfile: boolean;
    bio: string;
    onBioChange: (bio: string) => void;
    isEditingBio: boolean;
    onToggleEditBio: () => void;
    onSaveBio: () => void;
    gearData: Record<string, string>;
    onGearChange: (key: string, value: string) => void;
    isEditingGear: boolean;
    onToggleEditGear: () => void;
    onSaveGear: () => void;
    t: TranslateFn;
}

// Re-usable card wrapper
const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-surface rounded-2xl p-5">{children}</div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-text-faint mb-3">{children}</p>
);

// Connected platform badges
const PLATFORMS = [
    { label: "Steam",   sub: "Verified",   bg: "bg-[#1b2838]",      text: "text-[#66c0f4]",  icon: "🎮" },
    { label: "Riot",    sub: "VN2 Server", bg: "bg-[#d13639]/10",   text: "text-[#d13639]",  icon: "🔥" },
    { label: "Xbox",    sub: "Live",       bg: "bg-[#107c10]/10",   text: "text-[#5db75d]",  icon: "🎯" },
    { label: "Discord", sub: "Linked",     bg: "bg-purple-500/10",  text: "text-purple-400", icon: "🎧" },
];

export const ProfileSidebar = ({
    isOwnProfile, bio, onBioChange, isEditingBio, onToggleEditBio, onSaveBio,
    gearData, onGearChange, isEditingGear, onToggleEditGear, onSaveGear, t,
}: ProfileSidebarProps) => {
    const filledGear = GEAR_CATEGORIES.filter((cat) => gearData[cat.value]?.trim());

    return (
        <div className="flex flex-col gap-3">

            {/* ── Bio ─────────────────────────────────────────────── */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <SectionLabel>{t("profile.bioTitle")}</SectionLabel>
                    {isOwnProfile && (
                        <button
                            onClick={onToggleEditBio}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:brightness-110 transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                            <span>{t("comment.edit")}</span>
                        </button>
                    )}
                </div>

                {isEditingBio ? (
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={bio}
                            onChange={(e) => onBioChange(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-xl bg-surface-hover text-text text-sm focus:outline-none ring-1 ring-border focus:ring-primary/60 resize-none transition-all"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={onToggleEditBio}
                                className="px-3 py-1.5 rounded-lg bg-surface-hover text-text-muted text-xs font-bold hover:text-text transition cursor-pointer">
                                {t("profile.cancelEdit")}
                            </button>
                            <button onClick={onSaveBio}
                                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-110 transition flex items-center gap-1 cursor-pointer">
                                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                {t("profile.saveEdit")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-text-muted leading-relaxed">
                        {bio || <span className="text-text-faint italic">Chưa có bio.</span>}
                    </p>
                )}

                {/* Connected platforms */}
                <div className="mt-5 pt-4 border-t border-border/30">
                    <SectionLabel>{t("profile.connectedAccounts")}</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                        {PLATFORMS.map((p) => (
                            <div key={p.label}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${p.bg} ${p.text}`}>
                                <span className="text-sm leading-none">{p.icon}</span>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-black leading-none truncate">{p.label}</span>
                                    <span className="text-[10px] font-semibold opacity-70 mt-0.5 truncate">{p.sub}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* ── Gear / Setup ─────────────────────────────────────── */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <SectionLabel>{t("profile.gearSectionTitle")}</SectionLabel>
                    {isOwnProfile && (
                        <button
                            onClick={onToggleEditGear}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:brightness-110 transition cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                            <span>{t("comment.edit")}</span>
                        </button>
                    )}
                </div>

                {isEditingGear ? (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        {GEAR_CATEGORIES.map((cat) => (
                            <div key={cat.value} className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-text-faint flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={cat.icon} className={cat.color} />
                                    <span>{cat.label}</span>
                                </label>
                                <input
                                    type="text"
                                    value={gearData[cat.value] || ""}
                                    onChange={(e) => onGearChange(cat.value, e.target.value)}
                                    placeholder={`${cat.label}...`}
                                    className="px-3 py-2 rounded-xl bg-surface-hover text-text text-xs font-semibold focus:outline-none ring-1 ring-border focus:ring-primary/60 transition-all"
                                />
                            </div>
                        ))}
                        <div className="flex justify-end pt-1">
                            <button onClick={onSaveGear}
                                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-110 transition flex items-center gap-1 cursor-pointer">
                                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                                {t("profile.saveEdit")}
                            </button>
                        </div>
                    </div>
                ) : filledGear.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        {filledGear.map((cat) => (
                            <div key={cat.value}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover/60 transition-colors">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 bg-surface-hover ${cat.color}`}>
                                    <FontAwesomeIcon icon={cat.icon} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-text-faint leading-none">{cat.value}</span>
                                    <span className="text-xs font-semibold text-text mt-0.5 leading-snug truncate">{gearData[cat.value]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-faint italic text-center py-6">
                        {t("profile.noGearListed") || "Chưa có thông tin setup."}
                    </p>
                )}
            </Card>
        </div>
    );
};
