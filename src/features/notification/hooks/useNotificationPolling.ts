import { useEffect } from "react";
import { notificationApi } from "../api/notificationApi";

/**
 * Hook to perform polling for notifications (MVP acceptable mechanism).
 * Automatically refetches notifications every `intervalMs` milliseconds.
 */
export function useNotificationPolling(intervalMs: number = 15000, userId: string = "user-current") {
    useEffect(() => {
        // Initial fetch
        void notificationApi.getNotifications(userId);

        // Polling interval
        const timer = setInterval(() => {
            void notificationApi.getNotifications(userId);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [intervalMs, userId]);
}
