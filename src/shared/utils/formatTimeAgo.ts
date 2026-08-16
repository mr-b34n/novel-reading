export function formatTimeAgo(timeAgo: string | undefined | null, t: (key: string, options?: Record<string, unknown>) => string): string {
    if (!timeAgo) return t('time.justNow', { defaultValue: t('feed.justNow', { defaultValue: 'Just now' }) });

    const lower = timeAgo.toLowerCase().trim();

    if (lower === 'vừa xong' || lower === 'just now' || lower.includes('vừa xong') || lower.includes('just now')) {
        return t('time.justNow', { defaultValue: t('feed.justNow', { defaultValue: 'Just now' }) });
    }

    // Match numbers and units (minute, hour, day)
    const match = timeAgo.match(/(\d+)\s*(giờ|giờ|hours|hour|phút|phút|minutes|minute|mins|min|ngày|ngày|days|day)\s*(trước|ago)?/i);
    if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        if (unit.startsWith('giờ') || unit.startsWith('giờ') || unit.startsWith('hour')) {
            return t('time.hoursAgo', { count: num, defaultValue: `${num} hours ago` });
        }
        if (unit.startsWith('phút') || unit.startsWith('phút') || unit.startsWith('min')) {
            return t('time.minutesAgo', { count: num, defaultValue: `${num} mins ago` });
        }
        if (unit.startsWith('ngày') || unit.startsWith('ngày') || unit.startsWith('day')) {
            return t('time.daysAgo', { count: num, defaultValue: `${num} days ago` });
        }
    }

    return timeAgo;
}
