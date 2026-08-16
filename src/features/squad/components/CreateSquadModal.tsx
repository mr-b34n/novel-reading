import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faUsers, faGamepad, faMicrophone, faTag, faLink, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { useSquadStore } from "../store/useSquadStore";
import { GAME_OPTIONS, QUICK_TAGS, VOICE_OPTIONS } from "../constants";
import { type SquadVoiceType } from "../types";

interface CreateSquadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateSquadModal = ({ isOpen, onClose }: CreateSquadModalProps) => {
    const { t } = useTranslation();
    const addSquad = useSquadStore((state) => state.addSquad);

    const [name, setName] = useState("");
    const [game, setGame] = useState(GAME_OPTIONS[0]);
    const [customGame, setCustomGame] = useState("");
    const [maxMembers, setMaxMembers] = useState(5);
    const [voice, setVoice] = useState<SquadVoiceType>("Discord Required");
    const [roomCode, setRoomCode] = useState("");
    const [discordUrl, setDiscordUrl] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>(["🤝 Tìm Đồng Đội"]);
    const [tagInput, setTagInput] = useState("");

    if (!isOpen) return null;

    const handleToggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter((t) => t !== tag));
        } else if (tags.length < 5) {
            setTags([...tags, tag]);
        }
    };

    const handleAddCustomTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim()) && tags.length < 5) {
                setTags([...tags, tagInput.trim()]);
                setTagInput("");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalGame = game === "Khác..." ? customGame || "Gaming" : game;

        if (!name.trim() || !description.trim()) {
            return;
        }

        addSquad({
            name: name.trim(),
            game: finalGame,
            description: description.trim(),
            tags,
            maxMembers: Number(maxMembers),
            voice,
            roomCode: roomCode.trim() || undefined,
            discordUrl: discordUrl.trim() || undefined,
        });

        onClose();
        setName("");
        setDescription("");
        setRoomCode("");
        setDiscordUrl("");
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text">{t('squad.createTitle')}</h3>
                            <p className="text-xs text-text-muted">{t('squad.createSubtitle')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-hover hover:bg-surface-active text-text-muted hover:text-text flex items-center justify-center transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text uppercase tracking-wider">
                            {t('squad.nameLabel')} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={t('squad.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary transition-colors font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faGamepad} className="text-primary" />
                                {t('squad.gameLabel')}
                            </label>
                            <select
                                value={game}
                                onChange={(e) => setGame(e.target.value)}
                                className="w-full bg-surface-hover border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors font-medium cursor-pointer"
                            >
                                {GAME_OPTIONS.map((g) => (
                                    <option key={g} value={g} className="bg-surface text-text">
                                        {g}
                                    </option>
                                ))}
                            </select>
                            {game === "Khác..." && (
                                <input
                                    type="text"
                                    placeholder={t('squad.customGamePlaceholder')}
                                    value={customGame}
                                    onChange={(e) => setCustomGame(e.target.value)}
                                    className="mt-2 w-full bg-surface-hover border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary font-medium"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center justify-between">
                                <span>{t('squad.maxMembers')}</span>
                                <span className="text-primary font-extrabold text-sm">{t('squad.membersCount', { count: maxMembers })}</span>
                            </label>
                            <input
                                type="range"
                                min={2}
                                max={10}
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                                className="w-full accent-primary h-2 bg-surface-hover rounded-lg cursor-pointer mt-3"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-text-faint px-1">
                                <span>2 (Duo)</span>
                                <span>5 (Squad)</span>
                                <span>10 (Guild/Raid)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faMicrophone} className="text-emerald-500" />
                            {t('squad.voiceChannel')}
                        </label>
                        <select
                            value={voice}
                            onChange={(e) => setVoice(e.target.value as SquadVoiceType)}
                            className="w-full bg-surface-hover border border-border rounded-xl px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors font-medium cursor-pointer"
                        >
                            {VOICE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-surface text-text font-bold">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faLink} className="text-primary" />
                                {t('squad.roomCode')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('squad.roomCodePlaceholder')}
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary font-medium"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faLink} className="text-indigo-400" />
                                {t('squad.discordLink')}
                            </label>
                            <input
                                type="url"
                                placeholder="https://discord.gg/..."
                                value={discordUrl}
                                onChange={(e) => setDiscordUrl(e.target.value)}
                                className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text uppercase tracking-wider">
                            {t('squad.description')} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder={t('squad.descPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-surface-hover border border-border rounded-xl p-3.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary transition-colors resize-none font-medium"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faTag} className="text-amber-500" />
                            {t('squad.tagsLabel')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_TAGS.map((tag) => {
                                const isSelected = tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleToggleTag(tag)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-surface-hover text-text-muted border-border hover:border-text-faint"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                placeholder={t('squad.customTagPlaceholder')}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddCustomTag}
                                className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2 text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-primary font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text font-bold text-sm transition-colors"
                        >
                            {t('squad.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>{t('squad.createButton')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
