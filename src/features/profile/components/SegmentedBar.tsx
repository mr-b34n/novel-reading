
interface SegmentedBarProps {
    /** value from 0 to 100 */
    percent: number;
    segments?: number;
    colorClass?: string;
    trackClass?: string;
    size?: "sm" | "md";
}

/**
 * Signature visual motif of this profile: a chunky, segmented "ammo/health bar"
 * style progress indicator instead of a smooth gradient bar. Used for
 * achievement completion and reputation to give the page a consistent,
 * game-HUD identity rather than generic SaaS progress bars.
 */
export const SegmentedBar = ({ percent, segments = 12, colorClass = "bg-primary", trackClass = "bg-surface-hover", size = "md" }: SegmentedBarProps) => {
    const filled = Math.round((percent / 100) * segments);
    const height = size === "sm" ? "h-1.5" : "h-2.5";

    return (
        <div className={`w-full flex gap-[3px] ${height}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    className={`flex-1 rounded-[2px] transition-colors duration-300 ${i < filled ? colorClass : trackClass} border border-black/10`}
                />
            ))}
        </div>
    );
};
