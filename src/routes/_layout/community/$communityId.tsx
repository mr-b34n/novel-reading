import { useState, useMemo } from 'react';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, faComments, faCircleQuestion, faBook, faShieldHalved, faImages, 
    faCalendarDays, faFileLines, faCircleInfo, faDownload, faLink, faFire, 
    faClock, faStar, faPlus, faThumbtack, faEye, faGlobe, faGamepad, 
    faMagnifyingGlass, faBell, faCheck, faXmark, faTrophy, faPaperPlane, 
    faCircle, faHouse, faCompass, faPoll, faMessage,
    faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useCommunitiesStore } from '@/features/community';
import { INITIAL_COMMUNITIES } from '@/features/community/constants';
import { useThemeStore } from '@/shared/store/useThemeStore';

export const Route = createFileRoute('/_layout/community/$communityId')({
    component: CommunityDetailPage,
});

interface Thread {
    id: string;
    title: string;
    category: string;
    categoryLabelVi: string;
    categoryLabelEn: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    repliesCount: number;
    viewsCount: number;
    createdAtVi: string;
    createdAtEn: string;
    isPinned?: boolean;
    tagVi?: string;
    tagEn?: string;
    content?: string;
}

interface CategoryCard {
    id: string;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    threadsCount: string;
    icon: typeof faComments;
    color: string;
}

interface Contributor {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    points: number;
}

interface UpcomingEvent {
    id: string;
    titleVi: string;
    titleEn: string;
    dateVi: string;
    dateEn: string;
    thumbnail: string;
    attendees: number;
}

export function CommunityDetailPage() {
    let communityId = "raft";
    try {
        const params = useParams({ strict: false });
        if (params && params.communityId) {
            communityId = params.communityId;
        }
    } catch {
        communityId = "raft";
    }

    const navigate = useNavigate();
    const language = useThemeStore((state) => state.language);
    const isVi = language === "vi";

    const communities = useCommunitiesStore((state) => state.communities);
    const toggleJoin = useCommunitiesStore((state) => state.toggleJoin);

    // Fetch or fallback community object
    const community = useMemo(() => {
        const found = communities.find((c) => c.id === communityId || c.slug === communityId || c.id.toString() === communityId);
        if (found) return found;
        const initialFound = INITIAL_COMMUNITIES.find((c) => c.id === communityId || c.slug === communityId);
        if (initialFound) return initialFound;
        return {
            id: communityId,
            name: communityId.charAt(0).toUpperCase() + communityId.slice(1),
            slug: communityId,
            description: "Cộng đồng chính thức dành cho game thủ: trao đổi kinh nghiệm, mẹo chơi, thiết kế và tin tức mới nhất.",
            bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
            avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
            members: 24500,
            onlineNow: 416,
            joined: true,
            featured: true,
            rules: [
                "Tôn trọng các thành viên khác trong cộng đồng",
                "Không đăng tải thông tin sai sự thật hoặc lừa đảo",
                "Đặt tiêu đề bài viết rõ ràng, đúng danh mục",
                "Không quảng cáo thương mại hoặc spam link bẩn",
            ]
        };
    }, [communityId, communities]);

    const isJoined = community.joined;
    const [isFollowing, setIsFollowing] = useState(false);
    const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);

    // Navigation & Filtering States
    const [navFilter, setNavFilter] = useState<string>("all");
    const [sortMode, setSortMode] = useState<"hot" | "new" | "unanswered" | "top">("hot");
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Create Discussion Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("general");
    const [newContent, setNewContent] = useState("");
    const [isSubmittingThread, setIsSubmittingThread] = useState(false);

    // Realtime Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
        { id: "m1", user: "@ghoststrider", text: "Ai rảnh farm shark tooth cùng mình không?", time: "12:04" },
        { id: "m2", user: "@tactical_xeno", text: "Guide base 3 tầng mới ra hay vãi!", time: "12:05" },
        { id: "m3", user: "@ocean_lover", text: "Server đang online nha anh em!", time: "12:06" },
    ]);
    const [newChatInput, setNewChatInput] = useState("");

    // Contributors Time Filter
    const [contribTimeframe, setContribTimeframe] = useState<"week" | "month" | "all">("week");

    // Sample Categories Data
    const categoriesData: CategoryCard[] = [
        {
            id: "general",
            titleVi: "Thảo luận chung",
            titleEn: "General Discussion",
            descVi: "Trò chuyện, hỏi đáp và trao đổi tự do",
            descEn: "General chat, Q&A, and discussions",
            threadsCount: "1.2K",
            icon: faComments,
            color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        },
        {
            id: "guides",
            titleVi: "Guides & Tips",
            titleEn: "Guides & Tips",
            descVi: "Chia sẻ bí quyết, mẹo sinh tồn & cẩm nang",
            descEn: "Survival secrets, guides, and walkthroughs",
            threadsCount: "850",
            icon: faBook,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        },
        {
            id: "base",
            titleVi: "Base Building",
            titleEn: "Base Building",
            descVi: "Ý tưởng thiết kế căn cứ & trang trí",
            descEn: "Base design ideas and decoration showcases",
            threadsCount: "620",
            icon: faHouse,
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        },
        {
            id: "gameplay",
            titleVi: "Gameplay Help",
            titleEn: "Gameplay Help",
            descVi: "Giải đáp thắc mắc nhiệm vụ & lỗi game",
            descEn: "Quest help, troubleshooting, and gameplay Q&A",
            threadsCount: "980",
            icon: faCircleQuestion,
            color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        },
        {
            id: "showcase",
            titleVi: "Showcase",
            titleEn: "Showcase",
            descVi: "Khoe thành quả, hình ảnh & video đẹp",
            descEn: "Share creations, screenshots, and artwork",
            threadsCount: "430",
            icon: faImages,
            color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        },
    ];

    // Sample Pinned Threads
    const pinnedThreadsData: Thread[] = [
        {
            id: "pin-1",
            title: `${community.name} Community Rules & Guidelines`,
            category: "general",
            categoryLabelVi: "Nội quy",
            categoryLabelEn: "Rules",
            authorName: "Ghost Strider",
            authorHandle: "@ghoststrider",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ghoststrider",
            repliesCount: 12,
            viewsCount: 1240,
            createdAtVi: "10 Tháng 5",
            createdAtEn: "May 10",
            isPinned: true,
            tagVi: "Thông báo",
            tagEn: "Announcement",
        },
        {
            id: "pin-2",
            title: `${community.name} 1.0 Update — Everything You Need to Know`,
            category: "guides",
            categoryLabelVi: "Tin tức",
            categoryLabelEn: "News",
            authorName: "Tactical Xeno",
            authorHandle: "@tactical_xeno",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tactical_xeno",
            repliesCount: 28,
            viewsCount: 2150,
            createdAtVi: "05 Tháng 5",
            createdAtEn: "May 5",
            isPinned: true,
            tagVi: "Tin tức",
            tagEn: "News",
        },
        {
            id: "pin-3",
            title: `Community Event: Build Your Dream Base in ${community.name}!`,
            category: "showcase",
            categoryLabelVi: "Sự kiện",
            categoryLabelEn: "Event",
            authorName: "Mod Team",
            authorHandle: "@mod_team",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=modteam",
            repliesCount: 15,
            viewsCount: 980,
            createdAtVi: "28 Tháng 4",
            createdAtEn: "Apr 28",
            isPinned: true,
            tagVi: "Sự kiện",
            tagEn: "Event",
        },
    ];

    // Recent Discussions
    const [recentThreads, setRecentThreads] = useState<Thread[]>([
        {
            id: "th-1",
            title: "Auto-farming route cho late game — Tối ưu tài nguyên cực đỉnh",
            category: "guides",
            categoryLabelVi: "Guides & Tips",
            categoryLabelEn: "Guides & Tips",
            authorName: "User 123",
            authorHandle: "@user123",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user123",
            repliesCount: 15,
            viewsCount: 342,
            createdAtVi: "5 phút trước",
            createdAtEn: "5m ago",
        },
        {
            id: "th-2",
            title: "Base 3 tầng — Layout tối ưu không gian chăn nuôi & trồng trọt",
            category: "base",
            categoryLabelVi: "Base Building",
            categoryLabelEn: "Base Building",
            authorName: "Builder VN",
            authorHandle: "@builderVN",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=builderVN",
            repliesCount: 8,
            viewsCount: 210,
            createdAtVi: "1 giờ trước",
            createdAtEn: "1h ago",
        },
        {
            id: "th-3",
            title: "Shark respawn có phải ngẫu nhiên không hay theo mốc thời gian?",
            category: "gameplay",
            categoryLabelVi: "Gameplay Help",
            categoryLabelEn: "Gameplay Help",
            authorName: "Newbie Raft",
            authorHandle: "@newbie_raft",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=newbie_raft",
            repliesCount: 6,
            viewsCount: 156,
            createdAtVi: "2 giờ trước",
            createdAtEn: "2h ago",
        },
        {
            id: "th-4",
            title: "Sunset view from our 4-player raft base 🌅 Check out this panorama!",
            category: "showcase",
            categoryLabelVi: "Showcase",
            categoryLabelEn: "Showcase",
            authorName: "Photo Raft",
            authorHandle: "@photo_raft",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=photo_raft",
            repliesCount: 23,
            viewsCount: 820,
            createdAtVi: "3 giờ trước",
            createdAtEn: "3h ago",
        },
        {
            id: "th-5",
            title: "Có nên xây Engine Controls ở tầng trệt không hay đưa lên cao?",
            category: "general",
            categoryLabelVi: "Thảo luận chung",
            categoryLabelEn: "General Discussion",
            authorName: "Captain Jack",
            authorHandle: "@captain_jack",
            authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=captainjack",
            repliesCount: 11,
            viewsCount: 405,
            createdAtVi: "5 giờ trước",
            createdAtEn: "5h ago",
        },
    ]);

    // Contributors Data
    const contributorsData: Contributor[] = [
        { id: "c1", name: "Ghost Strider", handle: "@ghoststrider", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ghoststrider", points: 420 },
        { id: "c2", name: "Tactical Xeno", handle: "@tactical_xeno", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tactical_xeno", points: 380 },
        { id: "c3", name: "Ocean Lover", handle: "@ocean_lover", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ocean_lover", points: 300 },
        { id: "c4", name: "Raft Master", handle: "@raftmaster", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=raftmaster", points: 260 },
        { id: "c5", name: "Builder VN", handle: "@builderVN", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=builderVN", points: 230 },
    ];

    // Upcoming Events Data
    const upcomingEventsData: UpcomingEvent[] = [
        {
            id: "ev-1",
            titleVi: `${community.name} Base Building Contest 2025`,
            titleEn: `${community.name} Base Building Contest 2025`,
            dateVi: "20 Tháng 5, 2025 • 19:00",
            dateEn: "May 20, 2025 • 7:00 PM",
            thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80",
            attendees: 142,
        },
        {
            id: "ev-2",
            titleVi: "Update 1.1 Q&A Discussion with Mods",
            titleEn: "Update 1.1 Q&A Discussion with Mods",
            dateVi: "25 Tháng 5, 2025 • 20:00",
            dateEn: "May 25, 2025 • 8:00 PM",
            thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80",
            attendees: 89,
        },
    ];

    // Filtered Recent Threads
    const filteredThreads = useMemo(() => {
        let result = [...recentThreads];

        if (activeCategoryFilter) {
            result = result.filter((t) => t.category === activeCategoryFilter);
        }

        if (navFilter !== "all" && navFilter !== "overview") {
            if (navFilter === "qa") result = result.filter((t) => t.category === "gameplay");
            if (navFilter === "guides") result = result.filter((t) => t.category === "guides");
            if (navFilter === "showcase") result = result.filter((t) => t.category === "showcase");
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (t) => t.title.toLowerCase().includes(q) || t.authorName.toLowerCase().includes(q)
            );
        }

        if (sortMode === "new") {
            result.reverse();
        } else if (sortMode === "top") {
            result.sort((a, b) => b.viewsCount - a.viewsCount);
        } else if (sortMode === "unanswered") {
            result.sort((a, b) => a.repliesCount - b.repliesCount);
        }

        return result;
    }, [recentThreads, activeCategoryFilter, navFilter, searchQuery, sortMode]);

    // Handle Create Discussion
    const handlePublishDiscussion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setIsSubmittingThread(true);
        setTimeout(() => {
            const createdThread: Thread = {
                id: `th-new-${Date.now()}`,
                title: newTitle,
                category: newCategory,
                categoryLabelVi: categoriesData.find((c) => c.id === newCategory)?.titleVi || "Thảo luận",
                categoryLabelEn: categoriesData.find((c) => c.id === newCategory)?.titleEn || "Discussion",
                authorName: "Bạn (You)",
                authorHandle: "@current_user",
                authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=currentuser",
                repliesCount: 0,
                viewsCount: 1,
                createdAtVi: "Vừa xong",
                createdAtEn: "Just now",
                content: newContent,
            };

            setRecentThreads([createdThread, ...recentThreads]);
            setNewTitle("");
            setNewContent("");
            setIsSubmittingThread(false);
            setIsCreateModalOpen(false);
        }, 500);
    };

    const handleSendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatInput.trim()) return;
        setChatMessages([
            ...chatMessages,
            { id: `cm-${Date.now()}`, user: "@You", text: newChatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ]);
        setNewChatInput("");
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-4 font-sans text-text animate-fade-in pb-12">
            
            {/* 2. GLOBAL / COMMUNITY SUB-NAVBAR HEADER */}
            <div className="bg-surface border border-border/80 rounded-lg p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
                    <div className="flex items-center gap-2 pr-3 border-r border-border/60 shrink-0 font-black text-sm text-primary uppercase tracking-wider">
                        <FontAwesomeIcon icon={faCompass} className="text-base" />
                        <span>COMMUNITIES</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold">
                        <button 
                            onClick={() => navigate({ to: "/" })}
                            className="px-2.5 py-1.5 rounded-md hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faHouse} />
                            <span>{isVi ? "Trang chủ" : "Home"}</span>
                        </button>
                        <button 
                            onClick={() => navigate({ to: "/explore" })}
                            className="px-2.5 py-1.5 rounded-md hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faCompass} />
                            <span>{isVi ? "Khám phá" : "Explore"}</span>
                        </button>
                        
                        {/* Switch Community Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                                className="px-2.5 py-1.5 rounded-md bg-primary/10 text-primary font-bold flex items-center gap-1.5 hover:bg-primary/20 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faUsers} />
                                <span>{community.name} Hub</span>
                                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                            </button>

                            {showCommunityDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCommunityDropdown(false)} />
                                    <div className="absolute left-0 top-full mt-1.5 w-56 bg-surface border border-border/80 rounded-lg shadow-xl z-50 p-1 space-y-0.5">
                                        <div className="px-3 py-1.5 text-[10px] font-black uppercase text-text-muted border-b border-border/50 mb-1">
                                            {isVi ? "Đổi cộng đồng" : "Switch Community"}
                                        </div>
                                        {INITIAL_COMMUNITIES.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    navigate({ to: "/community/$communityId", params: { communityId: c.id } });
                                                    setShowCommunityDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-left transition-colors cursor-pointer ${
                                                    c.id === community.id ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text"
                                                }`}
                                            >
                                                <img src={c.logo} alt={c.name} className="w-5 h-5 rounded object-cover" />
                                                <span className="truncate">{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                    <div className="relative w-full sm:w-64">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isVi ? `Tìm kiếm trong ${community.name}...` : `Search ${community.name} community...`}
                            className="w-full bg-surface-hover/60 border border-border/70 rounded-md pl-8 pr-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary placeholder:text-text-muted/60"
                        />
                    </div>
                    <button className="w-8 h-8 rounded-md border border-border/70 bg-surface hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors text-xs shrink-0">
                        <FontAwesomeIcon icon={faBell} />
                    </button>
                </div>
            </div>

            {/* 1. MAIN 3-COLUMN LAYOUT: 240px | minmax(0, 1fr) | 280px */}
            <div className="flex flex-col lg:flex-row gap-5 items-start w-full min-w-0">
                
                {/* 3. LEFT SIDEBAR — COMMUNITY IDENTITY & NAVIGATION (240px) */}
                <div className="w-full lg:w-[240px] shrink-0 space-y-4">
                    
                    {/* Identity Card */}
                    <div className="bg-surface border border-border/80 rounded-lg overflow-hidden shadow-xs">
                        <div className="relative h-20 bg-neutral-800">
                            <img src={community.backdrop || community.bannerUrl || community.logo} alt={community.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                        </div>

                        <div className="p-3.5 pt-0 relative space-y-3">
                            <div className="-mt-7 flex items-end justify-between">
                                <img 
                                    src={community.logo || community.avatarUrl} 
                                    alt={community.name} 
                                    className="w-12 h-12 rounded-lg object-cover border-2 border-surface shadow-md bg-surface shrink-0" 
                                />
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                    Official
                                </span>
                            </div>

                            <div>
                                <h2 className="font-extrabold text-base text-text tracking-tight">{community.name}</h2>
                                <p className="text-[11px] text-text-muted leading-snug mt-1">
                                    {community.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-text-muted font-bold pt-1 border-t border-border/50">
                                <span className="flex items-center gap-1">
                                    <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                                    {(community.members || 24500).toLocaleString()}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-emerald-500">
                                    <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
                                    {community.onlineNow || 416} Online
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => toggleJoin(community.id)}
                                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                        isJoined 
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20" 
                                            : "bg-primary hover:bg-primary-hover text-white shadow-xs"
                                    }`}
                                >
                                    {isJoined ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : <FontAwesomeIcon icon={faPlus} className="text-[10px]" />}
                                    <span>{isJoined ? (isVi ? "Đã tham gia" : "Joined") : (isVi ? "Tham gia" : "Join")}</span>
                                </button>

                                <button
                                    onClick={() => setIsFollowing(!isFollowing)}
                                    className={`py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
                                        isFollowing 
                                            ? "border-primary text-primary bg-primary/10" 
                                            : "border-border/70 hover:bg-surface-hover text-text-muted hover:text-text"
                                    }`}
                                >
                                    {isFollowing ? (isVi ? "Đang theo dõi" : "Following") : (isVi ? "Theo dõi" : "Follow")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Community Navigation Menu */}
                    <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-3">
                        {/* Section 1: Overview */}
                        <div className="space-y-0.5">
                            <button
                                onClick={() => { setNavFilter("all"); setActiveCategoryFilter(null); }}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                                    navFilter === "all" && !activeCategoryFilter 
                                        ? "bg-primary/10 text-primary border-l-2 border-primary" 
                                        : "hover:bg-surface-hover text-text-muted hover:text-text"
                                }`}
                            >
                                <FontAwesomeIcon icon={faHouse} className="text-xs shrink-0 w-4" />
                                <span>{isVi ? "Tổng quan (Overview)" : "Overview"}</span>
                            </button>
                        </div>

                        {/* Section 2: DISCUSSIONS */}
                        <div className="space-y-1">
                            <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-text-muted/70">
                                DISCUSSIONS
                            </div>
                            <div className="space-y-0.5">
                                {[
                                    { id: "all", labelVi: "Tất cả bài thảo luận", labelEn: "All Discussions", icon: faComments },
                                    { id: "qa", labelVi: "Hỏi đáp & Trợ giúp", labelEn: "Q&A / Help", icon: faCircleQuestion },
                                    { id: "guides", labelVi: "Guides & Tutorials", labelEn: "Guides & Tutorials", icon: faBook },
                                    { id: "showcase", labelVi: "Showcase căn cứ", labelEn: "Showcase", icon: faImages },
                                    { id: "events", labelVi: "Sự kiện cộng đồng", labelEn: "Events", icon: faCalendarDays },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setNavFilter(item.id)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                                            navFilter === item.id 
                                                ? "bg-primary/10 text-primary font-bold" 
                                                : "text-text-muted hover:text-text hover:bg-surface-hover font-medium"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FontAwesomeIcon icon={item.icon} className="text-xs shrink-0 w-4" />
                                            <span className="truncate">{isVi ? item.labelVi : item.labelEn}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 3: RESOURCES */}
                        <div className="space-y-1">
                            <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-text-muted/70">
                                RESOURCES
                            </div>
                            <div className="space-y-0.5">
                                <a href="#wiki" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors">
                                    <FontAwesomeIcon icon={faFileLines} className="text-xs shrink-0 w-4" />
                                    <span>Wiki & Guides</span>
                                </a>
                                <a href="#downloads" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors">
                                    <FontAwesomeIcon icon={faDownload} className="text-xs shrink-0 w-4" />
                                    <span>Downloads</span>
                                </a>
                                <a href="#links" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors">
                                    <FontAwesomeIcon icon={faLink} className="text-xs shrink-0 w-4" />
                                    <span>Links</span>
                                </a>
                            </div>
                        </div>

                        {/* Section 4: ABOUT */}
                        <div className="space-y-1 border-t border-border/50 pt-2">
                            <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-text-muted/70">
                                ABOUT
                            </div>
                            <div className="space-y-0.5">
                                <a href="#rules" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors">
                                    <FontAwesomeIcon icon={faShieldHalved} className="text-xs shrink-0 w-4" />
                                    <span>{isVi ? "Nội quy" : "Rules"}</span>
                                </a>
                                <a href="#about" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-text hover:bg-surface-hover font-medium transition-colors">
                                    <FontAwesomeIcon icon={faCircleInfo} className="text-xs shrink-0 w-4" />
                                    <span>{isVi ? "Về chúng tôi" : "About Us"}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. CENTER AREA — COMMUNITY CONTENT */}
                <div className="flex-1 w-full min-w-0 space-y-4">
                    
                    {/* 5. Compact Hero Banner (150-180px) */}
                    <div className="relative h-40 sm:h-44 rounded-lg overflow-hidden border border-border/80 shadow-xs bg-neutral-900">
                        <img 
                            src={community.backdrop || community.bannerUrl || community.logo} 
                            alt={community.name} 
                            className="w-full h-full object-cover opacity-85" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={community.logo || community.avatarUrl} 
                                    alt={community.name} 
                                    className="w-12 h-12 rounded-lg border-2 border-white/20 object-cover shadow-lg shrink-0" 
                                />
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                        <span>{community.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-primary/80 text-white font-bold uppercase tracking-wider">
                                            Game Hub
                                        </span>
                                    </h1>
                                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                                        {isVi ? `Cộng đồng trao đổi, hỏi đáp & hướng dẫn cho game thủ ${community.name}` : `Official community hub for ${community.name} discussions, guides & showcases`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Community Toolbar */}
                    <div className="bg-surface border border-border/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                        {/* Sort Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {[
                                { id: "hot", labelVi: "Hot", labelEn: "Hot", icon: faFire },
                                { id: "new", labelVi: "Mới nhất", labelEn: "New", icon: faClock },
                                { id: "unanswered", labelVi: "Chưa trả lời", labelEn: "Unanswered", icon: faCircleQuestion },
                                { id: "top", labelVi: "Top bầu chọn", labelEn: "Top", icon: faStar },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSortMode(s.id as typeof sortMode)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                        sortMode === s.id 
                                            ? "bg-primary text-white shadow-xs" 
                                            : "bg-surface-hover/60 text-text-muted hover:text-text border border-border/50"
                                    }`}
                                >
                                    <FontAwesomeIcon icon={s.icon} className="text-[11px]" />
                                    <span>{isVi ? s.labelVi : s.labelEn}</span>
                                </button>
                            ))}
                        </div>

                        {/* Action Button: Start a Discussion */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>{isVi ? "+ Tạo bài thảo luận" : "+ Start a Discussion"}</span>
                        </button>
                    </div>

                    {/* 6. Categories Cards Grid */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold uppercase tracking-wider text-text-muted">
                                {isVi ? "Danh mục thảo luận (Categories)" : "Categories"}
                            </span>
                            {activeCategoryFilter && (
                                <button
                                    onClick={() => setActiveCategoryFilter(null)}
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                >
                                    {isVi ? "Xóa bộ lọc" : "Clear filter"}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                            {categoriesData.map((cat) => {
                                const isSelected = activeCategoryFilter === cat.id;
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => setActiveCategoryFilter(isSelected ? null : cat.id)}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                            isSelected
                                                ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                                                : "bg-surface border-border/80 hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs border ${cat.color}`}>
                                                <FontAwesomeIcon icon={cat.icon} />
                                            </div>
                                            <span className="text-[10px] font-bold text-text-muted bg-surface-hover px-1.5 py-0.5 rounded border border-border/50">
                                                {cat.threadsCount} threads
                                            </span>
                                        </div>

                                        <div>
                                            <div className="font-bold text-xs text-text truncate">
                                                {isVi ? cat.titleVi : cat.titleEn}
                                            </div>
                                            <div className="text-[10px] text-text-muted/80 truncate mt-0.5">
                                                {isVi ? cat.descVi : cat.descEn}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 7. Pinned Threads Section */}
                    <div className="bg-surface border border-border/80 rounded-lg p-3.5 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-text flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faThumbtack} className="text-primary text-xs" />
                                <span>{isVi ? "📌 Bài viết đã ghim (Pinned Threads)" : "📌 Pinned Threads"}</span>
                            </span>
                        </div>

                        <div className="divide-y divide-border/50 border border-border/60 rounded-md overflow-hidden bg-surface-hover/20">
                            {pinnedThreadsData.map((pin) => (
                                <div key={pin.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-hover/40 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <FontAwesomeIcon icon={faThumbtack} className="text-primary text-xs shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-bold text-text hover:text-primary truncate transition-colors flex items-center gap-2">
                                                <span>{pin.title}</span>
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                    {isVi ? pin.tagVi : pin.tagEn}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-text-muted mt-0.5 truncate">
                                                by <strong className="text-text">{pin.authorHandle}</strong> • {isVi ? pin.createdAtVi : pin.createdAtEn}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[11px] text-text-muted shrink-0 font-medium">
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faComments} className="text-[10px]" />
                                            {pin.repliesCount}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                            {pin.viewsCount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 8. Recent Discussions Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold uppercase tracking-wider text-text-muted">
                                {isVi ? "Thảo luận gần đây (Recent Discussions)" : "Recent Discussions"}
                            </span>
                            <span className="text-[10px] text-text-muted">{filteredThreads.length} threads</span>
                        </div>

                        {filteredThreads.length === 0 ? (
                            <div className="p-8 text-center bg-surface border border-dashed border-border/80 rounded-lg text-text-muted text-xs">
                                {isVi ? "Không tìm thấy bài thảo luận nào phù hợp." : "No discussions found matching criteria."}
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50 border border-border/80 bg-surface rounded-lg overflow-hidden shadow-xs">
                                {filteredThreads.map((th) => (
                                    <div key={th.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-hover/30 transition-colors cursor-pointer">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <img src={th.authorAvatar} alt={th.authorName} className="w-8 h-8 rounded-full object-cover border border-border/60 shrink-0 mt-0.5" />
                                            <div className="min-w-0 space-y-0.5">
                                                <div className="font-bold text-text hover:text-primary transition-colors line-clamp-1">
                                                    {th.title}
                                                </div>
                                                <div className="text-[10px] text-text-muted flex items-center gap-2 truncate">
                                                    <span>by <strong className="text-text font-semibold">{th.authorHandle}</strong></span>
                                                    <span>•</span>
                                                    <span className="px-1.5 py-0.2 rounded bg-surface-hover border border-border/50 text-text font-semibold">
                                                        {isVi ? th.categoryLabelVi : th.categoryLabelEn}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-text-muted shrink-0 font-medium">
                                            <span className="flex items-center gap-1" title="Bình luận">
                                                <FontAwesomeIcon icon={faComments} className="text-[10px]" />
                                                {th.repliesCount}
                                            </span>
                                            <span className="flex items-center gap-1" title="Lượt xem">
                                                <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                                {th.viewsCount}
                                            </span>
                                            <span className="text-[10px] text-text-muted/70 w-14 text-right">
                                                {isVi ? th.createdAtVi : th.createdAtEn}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* 9. RIGHT SIDEBAR — COMMUNITY INFORMATION HUB (280px) */}
                <div className="w-full lg:w-[280px] shrink-0 space-y-4">
                    
                    {/* 9.1 About Game */}
                    <div className="bg-surface border border-border/80 rounded-lg p-4 space-y-3 shadow-xs">
                        <div className="font-extrabold text-xs uppercase tracking-wider text-text flex items-center gap-1.5 border-b border-border/50 pb-2">
                            <FontAwesomeIcon icon={faGamepad} className="text-primary" />
                            <span>{isVi ? `Về tựa game ${community.name}` : `About ${community.name}`}</span>
                        </div>

                        <p className="text-xs text-text-muted leading-relaxed">
                            {community.description}
                        </p>

                        <div className="space-y-1.5 text-xs pt-1 border-t border-border/50 font-semibold">
                            <a href="https://raft-game.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                                <span>Official Website</span>
                            </a>
                            <a href="https://store.steampowered.com/app/648800/Raft/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <FontAwesomeIcon icon={faGamepad} className="text-xs" />
                                <span>Steam Store Page</span>
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                            {["Survival", "Crafting", "Multiplayer", "Open World"].map((tag) => (
                                <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-hover border border-border/60 text-text-muted">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 10. Top Contributors */}
                    <div className="bg-surface border border-border/80 rounded-lg p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="font-extrabold text-xs uppercase tracking-wider text-text flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faTrophy} className="text-amber-500" />
                                <span>Top Contributors</span>
                            </span>
                            
                            <div className="flex items-center gap-0.5 bg-surface-hover p-0.5 rounded text-[10px]">
                                {[
                                    { id: "week", label: "Week" },
                                    { id: "month", label: "Month" },
                                    { id: "all", label: "All" },
                                ].map((tf) => (
                                    <button
                                        key={tf.id}
                                        onClick={() => setContribTimeframe(tf.id as typeof contribTimeframe)}
                                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                            contribTimeframe === tf.id ? "bg-primary text-white" : "text-text-muted hover:text-text"
                                        }`}
                                    >
                                        {tf.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {contributorsData.map((c, idx) => (
                                <div key={c.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-4 text-center font-black text-[10px] ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-neutral-400" : idx === 2 ? "text-amber-700" : "text-text-muted"}`}>
                                            {idx + 1}
                                        </span>
                                        <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover border border-border/50 shrink-0" />
                                        <span className="font-bold text-text truncate">{c.handle}</span>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-primary shrink-0">
                                        {c.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full text-center text-xs font-bold text-primary hover:underline pt-1 block">
                            {isVi ? "Xem bảng xếp hạng" : "View Leaderboard"}
                        </button>
                    </div>

                    {/* 11. Members Online & Realtime Chat */}
                    <div className="bg-surface border border-border/80 rounded-lg p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="font-extrabold text-xs uppercase tracking-wider text-text flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faCircle} className="text-emerald-500 text-[8px]" />
                                <span>Members Online</span>
                            </span>
                            <span className="text-xs font-bold text-emerald-500">🟢 {community.onlineNow || 416}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden">
                                {contributorsData.slice(0, 4).map((c) => (
                                    <img key={c.id} src={c.avatar} alt={c.name} className="inline-block h-7 w-7 rounded-full ring-2 ring-surface object-cover" />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-text-muted">+408 online</span>
                        </div>

                        <p className="text-[11px] text-text-muted leading-tight">
                            {isVi ? "Thảo luận trực tiếp đang diễn ra sôi nổi!" : "Active discussions happening now!"}
                        </p>

                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <FontAwesomeIcon icon={faMessage} />
                            <span>{isVi ? "Tham gia Chat trực tuyến" : "Join Community Chat"}</span>
                        </button>
                    </div>

                    {/* 12. Upcoming Events */}
                    <div className="bg-surface border border-border/80 rounded-lg p-4 space-y-3 shadow-xs">
                        <div className="font-extrabold text-xs uppercase tracking-wider text-text flex items-center gap-1.5 border-b border-border/50 pb-2">
                            <FontAwesomeIcon icon={faCalendarDays} className="text-primary" />
                            <span>Upcoming Events</span>
                        </div>

                        <div className="space-y-2.5">
                            {upcomingEventsData.map((ev) => (
                                <div key={ev.id} className="flex gap-2.5 items-center text-xs p-2 rounded-md bg-surface-hover/50 border border-border/50">
                                    <img src={ev.thumbnail} alt={ev.titleVi} className="w-12 h-12 rounded object-cover shrink-0 border border-border/40" />
                                    <div className="min-w-0">
                                        <div className="font-bold text-text truncate">{isVi ? ev.titleVi : ev.titleEn}</div>
                                        <div className="text-[10px] text-text-muted mt-0.5">{isVi ? ev.dateVi : ev.dateEn}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full text-center text-xs font-bold text-primary hover:underline block pt-1">
                            {isVi ? "Xem tất cả sự kiện" : "View All Events"}
                        </button>
                    </div>

                </div>

            </div>

            {/* 13. CREATE DISCUSSION MODAL COMPOSER */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-surface border border-border/80 w-full max-w-lg p-5 rounded-lg space-y-4 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <span className="font-extrabold text-sm text-text flex items-center gap-2">
                                <FontAwesomeIcon icon={faPlus} className="text-primary" />
                                {isVi ? "Tạo bài thảo luận mới (Start a Discussion)" : "Start a Discussion"}
                            </span>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-7 h-7 rounded border border-border/60 flex items-center justify-center text-text-muted hover:text-text cursor-pointer text-xs"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <form onSubmit={handlePublishDiscussion} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text block">{isVi ? "Tiêu đề bài thảo luận:" : "Title:"}</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder={isVi ? "Nhập tiêu đề rõ ràng, xúc tích..." : "Enter a clear thread title..."}
                                    className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text block">{isVi ? "Danh mục (Category):" : "Category:"}</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs font-bold text-text focus:outline-none focus:border-primary"
                                >
                                    {categoriesData.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {isVi ? cat.titleVi : cat.titleEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text block">{isVi ? "Nội dung bài viết:" : "Content:"}</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder={isVi ? "Viết chi tiết câu hỏi, kinh nghiệm hoặc thiết kế của bạn..." : "Write details about your question, guide or showcase..."}
                                    className="w-full bg-surface-hover/50 border border-border/60 rounded p-2 text-xs text-text focus:outline-none focus:border-primary resize-y"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button type="button" className="px-2.5 py-1.5 rounded border border-border/60 text-xs font-bold text-text-muted hover:text-text cursor-pointer flex items-center gap-1">
                                    <FontAwesomeIcon icon={faImages} />
                                    <span>+ Image</span>
                                </button>
                                <button type="button" className="px-2.5 py-1.5 rounded border border-border/60 text-xs font-bold text-text-muted hover:text-text cursor-pointer flex items-center gap-1">
                                    <FontAwesomeIcon icon={faPoll} />
                                    <span>+ Poll</span>
                                </button>
                                <button type="button" className="px-2.5 py-1.5 rounded border border-border/60 text-xs font-bold text-text-muted hover:text-text cursor-pointer flex items-center gap-1">
                                    <FontAwesomeIcon icon={faLink} />
                                    <span>+ Link</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded border border-border/60 bg-surface hover:bg-surface-hover text-xs font-bold cursor-pointer"
                                >
                                    {isVi ? "Hủy" : "Cancel"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingThread}
                                    className="px-5 py-2 rounded bg-primary hover:bg-primary-hover text-white text-xs font-extrabold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                                >
                                    {isSubmittingThread ? (isVi ? "Đang đăng..." : "Publishing...") : (isVi ? "Đăng bài thảo luận" : "Publish Discussion")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REALTIME CHAT DRAWER / MODAL */}
            {isChatOpen && (
                <div className="fixed bottom-4 right-4 z-50 w-80 bg-surface border border-border/80 rounded-lg shadow-2xl overflow-hidden space-y-0">
                    <div className="p-3 bg-primary text-white font-extrabold text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faMessage} />
                            <span>{community.name} Live Community Chat</span>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="text-white hover:opacity-80 cursor-pointer">
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>

                    <div className="p-3 space-y-2 h-64 overflow-y-auto bg-surface-hover/20 text-xs">
                        {chatMessages.map((m) => (
                            <div key={m.id} className="space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] text-text-muted font-bold">
                                    <span>{m.user}</span>
                                    <span>{m.time}</span>
                                </div>
                                <div className="p-2 rounded bg-surface border border-border/50 text-text">
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="p-2 border-t border-border/60 flex items-center gap-1.5 bg-surface">
                        <input
                            type="text"
                            value={newChatInput}
                            onChange={(e) => setNewChatInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-surface-hover border border-border/60 rounded px-2 py-1 text-xs text-text focus:outline-none"
                        />
                        <button type="submit" className="px-2.5 py-1 rounded bg-primary text-white text-xs font-bold cursor-pointer">
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}
