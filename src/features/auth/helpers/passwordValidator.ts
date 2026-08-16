
import { type ValidationRule, type PasswordValidationResult } from "../types";
import { STRENGTH_LEVELS } from "../constants";

export * from "../types";
export * from "../constants";

export const validatePassword = async (password: string): Promise<PasswordValidationResult> => {

    const {default: zxcvbn} = await import('zxcvbn');

    const rules = [
        { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
        { id: 'uppercase', label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
        { id: 'lowercase', label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
        { id: 'number', label: 'Contains a number', test: (p: string) => /\d/.test(p) },
        { id: 'special', label: 'Contains a special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
    ];

    const requirements: ValidationRule[] = rules.map((rule) => ({
        id: rule.id,
        label: rule.label,
        isMet: rule.test(password),
    }));

    const zxcvbnResult = zxcvbn(password);

    const normalizedScore = zxcvbnResult.score <= 1 ? 1 : zxcvbnResult.score;

    return {
        requirements,
        isEmpty: password.length < 1,
        score: zxcvbnResult.score,
        isAllValid: requirements.every((r) => r.isMet),
        strengthConfig: STRENGTH_LEVELS[normalizedScore as keyof typeof STRENGTH_LEVELS]
    };
};
