import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faUsers, faLayerGroup, faImage, faPlus, faTag, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useCommunitiesStore } from "../store/useCommunitiesStore";
import type { CommunityData } from "../types";
import { getCurrentAuthor } from "@/features/post";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth";

const CATEGORY_OPTIONS = ["FPS", "RPG", "MOBA", "Survival", "Open World", "Strategy", "Sports", "MMORPG", "Casual", "Fighting"];

const DEFAULT_LOGOS = [
    "https://api.dicebear.com/7.x/identicon/svg?seed=GamingHub1&backgroundColor=6366f1",
    "https://api.dicebear.com/7.x/identicon/svg?seed=ValorantSEA&backgroundColor=ff4655",
    "https://api.dicebear.com/7.x/identicon/svg?seed=AnimeGamer&backgroundColor=ec4899",
    "https://api.dicebear.com/7.x/identicon/svg?seed=Dota2Community&backgroundColor=3b82f6",
    "https://api.dicebear.com/7.x/identicon/svg?seed=CyberClub&backgroundColor=10b981",
];

const DEFAULT_BACKDROPS = [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
];

interface CreateCommunityModalProps {
    onClose: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const addCommunity = useCommunitiesStore((state) => state.addCommunity);
    const user = useAuthStore((state) => state.user);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("FPS");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [logo, setLogo] = useState(DEFAULT_LOGOS[0]);
    const [backdrop, setBackdrop] = useState(DEFAULT_BACKDROPS[0]);
    const [rulesInput, setRulesInput] = useState(
        "1. Tôn trọng tất cả các thành viên trong cộng đồng.\n2. Không đả kích, toxic hoặc xúc phạm cá nhân.\n3. Không đăng bài quảng cáo rác (spam)."
    );

    // Safety check: if user is not admin/moderator, close modal immediately
    const canCreate = user?.role === 'admin' || user?.role === 'moderator';
    
    React.useEffect(() => {
        if (!canCreate) {
            onClose();
        }
    }, [canCreate, onClose]);

    if (!canCreate) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const authorUsername = getCurrentAuthor();
        const { user, customAvatar } = useAuthStore.getState();
        const displayName = user?.user_metadata?.full_name || user?.username || authorUsername;
        const avatar = customAvatar || user?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorUsername}`;

        const newId = `comm_${Date.now()}`;
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
        const rules = rulesInput
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean);

        const newComm: CommunityData = {
            id: newId,
            name: name.trim(),
            logo,
            backdrop,
            category,
            description: description.trim() || `Cộng đồng ${name.trim()} - Nơi kết nối các game thủ yêu thích ${category}.`,
            members: 1,
            onlineNow: 1,
            tags: tags.length > 0 ? tags : [name.trim().toLowerCase(), category.toLowerCase()],
            joined: true,
            featured: false,
            owner: authorUsername,
            admins: [authorUsername],
            rules: rules.length > 0 ? rules : ["Tôn trọng mọi người trong cộng đồng", "Không đả kích hay gây tranh cãi toxic"],
            memberList: [
                {
                    username: authorUsername,
                    displayName,
                    avatar,
                    role: "owner",
                    joinedAt: "Vừa xong",
                },
            ],
        };

        addCommunity(newComm);
        onClose();
        navigate({ to: "/community/$communityId", params: { communityId: newId } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faUsers} className="text-primary" />
                        <span>Tạo Cộng Đồng Mới</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* Body form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                    {/* Community Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                            <span>Tên cộng đồng</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Valorant Vietnam Esports"
                            className="h-11 px-3.5 rounded-2xl border border-border bg-bg text-sm text-text font-semibold focus:outline-none focus:border-primary transition-all"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faLayerGroup} className="text-primary text-xs" />
                            <span>Thể loại Game</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-11 px-3.5 rounded-2xl border border-border bg-bg text-sm text-text font-semibold focus:outline-none focus:border-primary cursor-pointer transition-all"
                        >
                            {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted">Mô tả ngắn</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Giới thiệu mục tiêu, phong cách chơi hoặc chủ đề thảo luận chính của cộng đồng..."
                            className="p-3.5 rounded-2xl border border-border bg-bg text-sm text-text font-medium focus:outline-none focus:border-primary resize-none transition-all"
                        />
                    </div>

                    {/* Logo preset selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faImage} className="text-primary text-xs" />
                            <span>Biểu tượng (Logo)</span>
                        </label>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {DEFAULT_LOGOS.map((url, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setLogo(url)}
                                    className={`w-12 h-12 rounded-2xl border-2 overflow-hidden transition-all shrink-0 cursor-pointer ${
                                        logo === url ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Backdrop preset selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faImage} className="text-amber-500 text-xs" />
                            <span>Ảnh bìa (Backdrop)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DEFAULT_BACKDROPS.map((url, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setBackdrop(url)}
                                    className={`h-16 rounded-xl border-2 overflow-hidden transition-all shrink-0 cursor-pointer relative ${
                                        backdrop === url ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <img src={url} alt={`Backdrop ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faTag} className="text-primary text-xs" />
                            <span>Thẻ tìm kiếm (Tags, phân cách bằng dấu phẩy)</span>
                        </label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="fps, esports, gaming, recruitment"
                            className="h-11 px-3.5 rounded-2xl border border-border bg-bg text-sm text-text font-semibold focus:outline-none focus:border-primary transition-all"
                        />
                    </div>

                    {/* Rules */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500 text-xs" />
                            <span>Nội quy cộng đồng (mỗi dòng 1 quy tắc)</span>
                        </label>
                        <textarea
                            value={rulesInput}
                            onChange={(e) => setRulesInput(e.target.value)}
                            rows={3}
                            className="p-3.5 rounded-2xl border border-border bg-bg text-xs text-text font-medium focus:outline-none focus:border-primary resize-none transition-all leading-relaxed"
                        />
                    </div>

                    {/* Submit button */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-2xl bg-surface-hover text-text-muted text-xs font-bold hover:text-text transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-extrabold shadow-md shadow-primary/25 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Tạo cộng đồng</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
