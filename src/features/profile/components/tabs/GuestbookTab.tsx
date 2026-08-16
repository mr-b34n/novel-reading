import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPaperPlane, faHeart } from "@fortawesome/free-solid-svg-icons";
import type { GuestbookComment } from "../../types";

interface GuestbookTabProps {
    comments: GuestbookComment[];
    newCommentText: string;
    onChangeNewComment: (text: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onToggleLike: (id: string) => void;
    displayName: string;
    t: (key: string, opts?: Record<string, unknown>) => string;
}

/**
 * Chat-wall style guestbook: alternating left/right bubbles instead of
 * uniform cards, so the tab reads like a wall of messages rather than a
 * generic comment list.
 */
export const GuestbookTab = ({ comments, newCommentText, onChangeNewComment, onSubmit, onToggleLike, displayName, t }: GuestbookTabProps) => (
    <div className="flex flex-col gap-5 animate-fade-in">
        <form onSubmit={onSubmit} className="bg-surface-hover/30 border border-border/20 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-text">
                <FontAwesomeIcon icon={faPen} className="text-primary" />
                <span>{t("profile.guestbookFormTitle", { name: displayName })}</span>
            </div>
            <textarea
                value={newCommentText}
                onChange={(e) => onChangeNewComment(e.target.value)}
                rows={3}
                placeholder={t("profile.guestbookPlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-surface text-text text-sm focus:outline-none ring-1 ring-border/30 focus:ring-primary resize-none border border-border/20"
            />
            <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-text-faint">{t("profile.guestbookHint")}</span>
                <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-md cursor-pointer flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>{t("profile.postComment")}</span>
                </button>
            </div>
        </form>

        <div className="flex flex-col gap-4">
            {comments.length > 0 ? (
                comments.map((c, idx) => {
                    const fromRight = idx % 2 === 1;
                    return (
                        <div key={c.id} className={`flex items-start gap-3 max-w-[92%] sm:max-w-[75%] ${fromRight ? "self-end flex-row-reverse" : "self-start"}`}>
                            <img src={c.avatar} alt={c.author} className="w-11 h-11 rounded-full object-cover shrink-0 mt-0.5 shadow-xs" />
                            <div
                                className={`flex flex-col gap-1.5 min-w-0 rounded-3xl px-4 py-3 border shadow-xs ${
                                    fromRight ? "bg-primary/10 border-primary/20 rounded-tr-md" : "bg-surface-hover/40 border-border/20 rounded-tl-md"
                                }`}
                            >
                                <div className={`flex items-center gap-2 ${fromRight ? "flex-row-reverse" : ""}`}>
                                    <h5 className="font-extrabold text-text text-sm">{c.author}</h5>
                                    <span className="text-[11px] text-text-faint">{c.date}</span>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed font-medium">{c.content}</p>
                                <button
                                    onClick={() => onToggleLike(c.id)}
                                    className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                        c.isLiked ? "bg-rose-500/15 text-rose-500" : "bg-surface text-text-muted hover:text-text border border-border/20"
                                    } ${fromRight ? "self-end" : ""}`}
                                >
                                    <FontAwesomeIcon icon={faHeart} className={c.isLiked ? "animate-bounce" : ""} />
                                    <span>{c.likes > 0 ? c.likes : t("profile.likeBtn")}</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="bg-surface-hover/20 border border-border/20 rounded-3xl p-8 text-center text-text-faint text-sm">
                    {t("profile.noComments")}
                </div>
            )}
        </div>
    </div>
);
