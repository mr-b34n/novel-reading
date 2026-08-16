/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from '../locales/vi';
import { en } from '../locales/en';
import { useThemeStore } from '../store/useThemeStore';

const dictionary: Record<string, any> = { vi, en };

/** Shared type for the `t()` translation function returned by useTranslation. */
export type TranslateFn = (path: string, params?: Record<string, any>) => string;

export const useTranslation = () => {
    const language = useThemeStore((state) => state.language);

    const t: TranslateFn = (path, params) => {
        const keys = path.split('.');
        let current: any = dictionary[language] || dictionary.vi;

        for (const key of keys) {
            if (current && current[key] !== undefined) {
                current = current[key];
            } else {
                return path;
            }
        }

        if (typeof current !== 'string') {
            return path;
        }

        let result = current;
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
            });
        }

        return result;
    };

    return { t, language, lang: language };
};