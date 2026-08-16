import { useEffect, type RefObject } from "react";

/**
 * Calls `onOutside` when a click happens outside of `ref`.
 * Replaces ad-hoc global window listeners scattered across a component.
 */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void, active = true) {
    useEffect(() => {
        if (!active) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onOutside();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [ref, onOutside, active]);
}
