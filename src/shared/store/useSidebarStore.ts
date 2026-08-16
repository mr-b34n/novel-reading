import { create } from 'zustand';

interface SidebarState {
    isLeftOpen: boolean;
    isRightOpen: boolean;
    openLeft: () => void;
    closeLeft: () => void;
    toggleLeft: () => void;
    openRight: () => void;
    closeRight: () => void;
    toggleRight: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isLeftOpen: false,
    isRightOpen: false,
    openLeft: () => set({ isLeftOpen: true, isRightOpen: false }),
    closeLeft: () => set({ isLeftOpen: false }),
    toggleLeft: () => set((state) => ({ isLeftOpen: !state.isLeftOpen, isRightOpen: false })),
    openRight: () => set({ isRightOpen: true, isLeftOpen: false }),
    closeRight: () => set({ isRightOpen: false }),
    toggleRight: () => set((state) => ({ isRightOpen: !state.isRightOpen, isLeftOpen: false })),
}));
