// src/routes/_layout.tsx
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Header } from '@/shared/components/header/Header'
import { LeftBar } from '@/shared/components/sidebars/LeftBar'
import { RightBar } from '@/shared/components/sidebars/RightBar'
import { useSidebarStore } from '@/shared/store/useSidebarStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from '@/shared/hooks/useTranslate'

export const Route = createFileRoute('/_layout')({
    component: MainLayout,
})

function MainLayout() {
    const { t } = useTranslation()
    // 1. Lấy thông tin route hiện tại
    const { pathname } = useLocation()
    
    // 2. Ref trỏ đến container chứa thanh cuộn
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const isLeftOpen = useSidebarStore((state) => state.isLeftOpen)
    const isRightOpen = useSidebarStore((state) => state.isRightOpen)
    const closeLeft = useSidebarStore((state) => state.closeLeft)
    const closeRight = useSidebarStore((state) => state.closeRight)

    // 3. Mỗi khi chuyển trang (pathname thay đổi), cuộn container về top và đóng sidebar
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
        closeLeft()
        closeRight()
    }, [pathname, closeLeft, closeRight])

    const hideSidebars = 
        pathname.startsWith('/settings') || 
        pathname.startsWith('/profile') || 
        pathname.startsWith('/explore') || 
        pathname.startsWith('/game') ||
        pathname.startsWith('/admin') ||
        (pathname.startsWith('/community') && pathname !== '/community')

    return (
        <div className="flex flex-col relative w-full h-screen overflow-hidden bg-bg text-text">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none select-none">
                <div className="absolute -top-32 -left-32 w-125 h-125 bg-primary/10 dark:bg-primary/15 rounded-full blur-[100px]" />
                <div className="absolute -bottom-32 -right-32 w-125 h-125 bg-accent-500/8 dark:bg-accent-500/12 rounded-full blur-[100px]" />
            </div>

            <Header />

            {/* Mobile Left Sidebar */}
            {!hideSidebars && isLeftOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                        onClick={closeLeft}
                    />
                    <aside className="relative w-72 max-w-[85vw] h-full bg-surface border-r border-border p-4 overflow-y-auto z-10 shadow-2xl animate-slide-right">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                            <p className="font-extrabold text-primary text-lg">Navigation</p>
                            <button onClick={closeLeft} className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:text-text cursor-pointer">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <LeftBar />
                    </aside>
                </div>
            )}

            {/* Mobile Right Sidebar */}
            {!hideSidebars && isRightOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden flex justify-end">
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                        onClick={closeRight}
                    />
                    <aside className="relative w-72 max-w-[85vw] h-full bg-surface border-l border-border p-4 overflow-y-auto z-10 shadow-2xl animate-slide-left">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                            <p className="font-extrabold text-primary text-lg">{t('common.exploreSquad')}</p>
                            <button onClick={closeRight} className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:text-text cursor-pointer">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <RightBar />
                    </aside>
                </div>
            )}

            
            <div 
                ref={scrollContainerRef} 
                className="relative flex-1 overflow-y-scroll [scrollbar-gutter:stable] overflow-x-hidden w-full"
            >
                <div className={`w-full ${hideSidebars ? 'max-w-[1280px]' : 'max-w-[1536px]'} mx-auto flex flex-row items-start gap-4 xl:gap-6 px-3 sm:px-6 py-3 pb-12`}>
                    
                    {/* Left Sidebar */}
                    {!hideSidebars && (
                        <aside className="hidden lg:block shrink-0 w-64 xl:w-[280px] sticky top-2 max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-none">
                            <LeftBar />
                        </aside>
                    )}

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <Outlet />
                    </main>

                    {/* Right Sidebar */}
                    {!hideSidebars && (
                        <aside className="hidden lg:block shrink-0 w-64 xl:w-[280px] sticky top-2 max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-none">
                            <RightBar />
                        </aside>
                    )}

                </div>
            </div>
        </div>
    )
}