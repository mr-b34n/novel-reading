import { useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { type ReportModalProps } from "../types";
import { REPORT_REASONS } from "../constants";
import { adminApi } from "../api/adminApi";

export const ReportModal = ({ postId, author, onClose }: ReportModalProps) => {
    const { t } = useTranslation();
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [details, setDetails] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;
        await adminApi.createReport({
            targetType: "post",
            targetId: String(postId),
            reason: selectedReason,
            description: details,
            targetAuthor: author,
        });
        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-200 flex items-center justify-center animate-fade-in px-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

                <div className="flex flex-row items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30">
                    <h3 className="font-bold text-lg text-text">{t('report.reportPost')}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-4">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-success-500" />
                        <h4 className="font-bold text-xl text-text">{t('report.reportSubmitted')}</h4>
                        <p className="text-center text-text-muted text-sm">
                            {t('report.reportSubmittedDesc')}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col p-5 gap-5">
                        <div>
                            <p className="text-sm text-text-muted mb-3">
                                {t('report.reportingPostBy', { author })}
                            </p>
                            <div className="flex flex-col gap-2">
                                {REPORT_REASONS.map((reason) => (
                                    <label
                                        key={reason}
                                        className="flex items-center gap-3 cursor-pointer group"
                                        onClick={() => setSelectedReason(reason)}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedReason === reason ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'
                                            }`}>
                                            {selectedReason === reason && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className={`text-sm ${selectedReason === reason ? 'text-text font-medium' : 'text-text-muted group-hover:text-text'
                                            }`}>
                                            {reason}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-text">{t('report.additionalDetails')}</label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder={t('report.provideExtraContext')}
                                className="w-full bg-surface-hover border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none h-24"
                            />
                        </div>

                        <div className="flex flex-row gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-full font-semibold text-sm text-text bg-surface-hover hover:bg-border transition-colors"
                            >
                                {t('report.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedReason}
                                className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-colors ${selectedReason
                                    ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm"
                                    : "bg-surface-hover text-text-faint cursor-not-allowed"
                                    }`}
                            >
                                {t('report.submitReport')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}