import React, { useRef, useEffect } from 'react';

const REACTIONS = [
    { id: 'like', char: '👍', delay: 'delay-[0ms]' },
    { id: 'love', char: '❤️', delay: 'delay-[40ms]' },
    { id: 'haha', char: '😂', delay: 'delay-[80ms]' },
    { id: 'wow', char: '😮', delay: 'delay-[120ms]' },
    { id: 'sad', char: '😢', delay: 'delay-[160ms]' },
    { id: 'angry', char: '😡', delay: 'delay-[200ms]' }
];

interface ReactionPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (reactionId: string, char: string) => void;
}

const EmojiBox: React.FC<ReactionPickerProps> = ({ isOpen, onClose, onSelect }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full left-0 z-50 p-1.5 mb-3 
                        bg-surface border border-border rounded-full 
                        shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
                        min-w-max flex items-center gap-1.5 px-2
                        animate-in fade-in zoom-in-75 slide-in-from-bottom-2 
                        duration-200 ease-out origin-bottom-left"
        >
            {REACTIONS.map((react) => (
                <button
                    key={react.id}
                    type="button"
                    onClick={() => onSelect(react.id, react.char)}
                    className={`relative flex items-center justify-center p-2 text-[28px] leading-none
                        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                        origin-bottom transform-gpu
                        hover:-translate-y-1 hover:scale-[1.5]
                        focus:outline-none
                        ${react.delay}`}
                >
                    <span className="block transform transition-transform duration-300 pointer-events-none">
                        {react.char}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default EmojiBox;
