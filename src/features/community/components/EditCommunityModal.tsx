import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCheck, faPen, faTrash, faUsers, faLayerGroup, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useCommunitiesStore } from "../store/useCommunitiesStore";
import type { CommunityData } from "../types";
import { useNavigate } from "@tanstack/react-router";

interface EditCommunityModalProps {
    community: CommunityData;
    onClose: () => void;
}

const CATEGORY_OPTIONS = ["FPS", "RPG", "MOBA", "Survival", "Open World", "Strategy", "Sports", "MMORPG", "Casual", "Fighting"];

export const EditCommunityModal: React.FC<EditCommunityModalProps> = ({ community, onClose }) => {
    const navigate = useNavigate();
    const updateCommunity = useCommunitiesStore((state) => state.updateCommunity);
    const deleteCommunity = useCommunitiesStore((state) => state.deleteCommunity);

    const [name, setName] = useState(community.name);
    const [category, setCategory] = useState(community.category);
    const [description, setDescription] = useState(community.description);
    const [tagsInput, setTagsInput] = useState(community.tags.join(", "));
    const [rulesInput, setRulesInput] = useState(
        community.rules?.join("\n") || "1. Tôn trọng tất cả các thành viên trong cộng đồng.\n2. Không đả kích, toxic hay xúc phạm."
    );
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
        const rules = rulesInput
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean);

        updateCommunity(community.id, {
            name: name.trim() || community.name,
            category,
            description: description.trim(),
            tags,
            rules,
        });

        onClose();
    };

    const handleDelete = () => {
        deleteCommunity(community.id);
        onClose();
        navigate({ to: "/community" });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-extrabold text-text flex items-center gap-2">
                        <FontAwesomeIcon icon={faPen} className="text-primary" />
                        <span>Chỉnh Sửa Cộng Đồng</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                            <span>Tên cộng đồng</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                        <label className="text-xs font-bold text-text-muted">Mô tả cộng đồng</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="p-3.5 rounded-2xl border border-border bg-bg text-sm text-text font-medium focus:outline-none focus:border-primary resize-none transition-all"
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted">Thẻ phân loại (Tags)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
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

                    {/* Danger zone: delete */}
                    <div className="pt-3 border-t border-border/80 flex flex-col gap-2">
                        {showConfirmDelete ? (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-3">
                                <p className="text-xs font-extrabold text-rose-500">
                                    Bạn có chắc chắn muốn xóa cộng đồng này? Hành động này không thể hoàn tác.
                                </p>
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmDelete(false)}
                                        className="px-3 py-1.5 rounded-xl bg-surface text-text-muted text-xs font-bold hover:text-text"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600 shadow-sm"
                                    >
                                        Xác nhận xóa
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowConfirmDelete(true)}
                                className="self-start text-xs font-bold text-rose-500 hover:underline flex items-center gap-1.5 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>Xóa cộng đồng này</span>
                            </button>
                        )}
                    </div>

                    {/* Form actions */}
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
                            <FontAwesomeIcon icon={faCheck} />
                            <span>Lưu thay đổi</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
