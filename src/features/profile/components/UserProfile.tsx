import React, { useState } from "react";
import { useTranslation } from "@/shared/hooks/useTranslate";
import { useAuthStore } from "@/features/auth";
import { usePostsStore, getCurrentAuthor } from "@/features/post";
import { getUserRankConfig, getRankLabel } from "@/features/post/helpers/userRanks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSpinner, faExclamationTriangle, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

import { ImageCropperModal } from "./ImageCropperModal";
import { BadgeSelectorModal } from "./BadgeSelectorModal";
import { EditProfileModal } from "./EditProfileModal";
import { ProfileHero } from "./ProfileHero";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileTabBar } from "./ProfileTabBar";

import {
    DEFAULT_COVER, DEFAULT_GEAR, LIBRARY_GAMES,
    INITIAL_FRIENDS, INITIAL_FRIEND_REQUESTS, INITIAL_GUESTBOOK, getBadgeCatalogue,
} from "../constants";
import type { FriendEntry, FriendRequest, ProfileTab, ProfileIdentity } from "../types";
import { useProfileIdentity } from "../hooks/useProfileIdentity";
import { FriendsTab } from "./tabs/FriendsTab";
import { LibraryTab } from "./tabs/LibraryTab";
import { PostsTab } from "./tabs/PostsTab";
import { GuestbookTab } from "./tabs/GuestbookTab";
import { BookmarkList } from "@/features/bookmark";

interface UserProfileProps {
    userId: string;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
    const { t, language } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const customAvatar = useAuthStore((state) => state.customAvatar);
    const setCustomAvatar = useAuthStore((state) => state.setCustomAvatar);
    const mockLogin = useAuthStore((state) => state.mockLogin);
    const isLoggedIn = !!user || mockLogin;
    const currentAuthor = getCurrentAuthor();

    const isOwnProfile =
        isLoggedIn &&
        (!userId || userId === "demo" || userId === "me" || userId === user?.id ||
        userId === currentAuthor || userId === `@${currentAuthor.toLowerCase().replace(/\s+/g, "_")}`);

    const showBookmarks = isOwnProfile && isLoggedIn;

    const { identity, setIdentity } = useProfileIdentity({ userId, isOwnProfile, currentAuthor });

    const [activeTab, setActiveTab] = useState<ProfileTab>("library");
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);
    const [rawCoverSrc, setRawCoverSrc] = useState<string | null>(null);
    const [customBg, setCustomBg] = useState<string>(DEFAULT_COVER);

    const [showEditModal, setShowEditModal] = useState(false);
    const [profileLocation, setProfileLocation] = useState("Vietnam / SEA");
    const isLoading = false;
    const isError = userId === "error" || userId === "not-found";

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isEditingGear, setIsEditingGear] = useState(false);
    const [gearData, setGearData] = useState<Record<string, string>>(DEFAULT_GEAR);

    const [showBadgeSelector, setShowBadgeSelector] = useState(false);
    const badges = getBadgeCatalogue(t);
    const [selectedBadgeId, setSelectedBadgeId] = useState<string>("clutch");
    const equippedBadge = badges.find((b) => b.id === selectedBadgeId) || badges[0];

    const triggerToast = () => {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    // ---- Guestbook ----
    const [guestbookComments, setGuestbookComments] = useState(INITIAL_GUESTBOOK);
    const [newCommentText, setNewCommentText] = useState("");

    const avatarUrl =
        isOwnProfile && customAvatar ? customAvatar
        : isOwnProfile && user?.user_metadata?.avatar_url ? user.user_metadata.avatar_url
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.name}`;

    const handleAddGuestbook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        setGuestbookComments((prev) => [
            { id: `c-${Date.now()}`, author: currentAuthor, avatar: avatarUrl, date: "Vừa xong", content: newCommentText, likes: 0, isLiked: false },
            ...prev,
        ]);
        setNewCommentText("");
    };

    const toggleLikeComment = (id: string) => {
        setGuestbookComments((prev) => prev.map((c) => (c.id === id ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c)));
    };

    // ---- Friends ----
    const [friendsList, setFriendsList] = useState<FriendEntry[]>(INITIAL_FRIENDS);
    const [friendRequestsList, setFriendRequestsList] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS);
    const [isBlocked, setIsBlocked] = useState(false);

    const isFriend = friendsList.some((f) => f.name === identity.name && f.isFriend);

    const toggleFriend = (name: string) => {
        setFriendsList((prev) => {
            const exists = prev.some((f) => f.name === name && f.isFriend);
            if (!exists) {
                const inList = prev.some((f) => f.name === name);
                if (inList) return prev.map((f) => (f.name === name ? { ...f, isFriend: true } : f));
                return [{ name, game: "Online", logo: null, status: "online", isFriend: true }, ...prev];
            }
            return prev.filter((f) => f.name !== name);
        });
        triggerToast();
    };

    const blockFriend = (name: string) => {
        setFriendsList((prev) => prev.filter((f) => f.name !== name));
        triggerToast();
    };

    const handleAcceptRequest = (req: FriendRequest) => {
        setFriendsList((prev) => [{ name: req.name, game: req.game || "Online", logo: req.logo, status: "online", isFriend: true }, ...prev]);
        setFriendRequestsList((prev) => prev.filter((r) => r.id !== req.id));
        triggerToast();
    };

    const handleDeclineRequest = (id: string) => {
        setFriendRequestsList((prev) => prev.filter((r) => r.id !== id));
        triggerToast();
    };

    // ---- Posts ----
    const posts = usePostsStore((state) => state.posts);
    const userPosts = posts.filter((p) => p.author === identity.name || p.author === currentAuthor);
    const displayPosts = userPosts.length > 0 ? userPosts : posts.slice(0, 2);

    const forumRank = getUserRankConfig(identity.name);
    const forumRankNode = (
        <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${forumRank.classes}`} title="Danh hiệu kiến thức diễn đàn">
            <FontAwesomeIcon icon={forumRank.icon} />
            <span>{getRankLabel(forumRank, language)}</span>
            {forumRank.isVerifiedExpert && <FontAwesomeIcon icon={faCheckCircle} className="text-sky-400 ml-0.5" title="Được Admin/Dev duyệt" />}
        </span>
    );

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-primary" />
                <p className="text-sm font-bold text-text-muted">Đang tải thông tin hồ sơ...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full max-w-lg mx-auto my-12 p-8 rounded-3xl bg-surface border border-rose-500/30 flex flex-col items-center text-center gap-4 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <h3 className="text-xl font-extrabold text-text">Không tìm thấy hồ sơ người dùng</h3>
                <p className="text-sm text-text-muted">Hồ sơ người dùng này không tồn tại, đã bị xóa hoặc đường dẫn không chính xác.</p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center gap-2 transition-all cursor-pointer"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại</span>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto flex flex-col gap-6 pb-20 animate-fade-in">
            {showSuccessToast && (
                <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-slide-left">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-lg" />
                    <span className="font-semibold text-sm">{t("profile.editSuccess")}</span>
                </div>
            )}

            {showEditModal && (
                <EditProfileModal
                    identity={identity}
                    location={profileLocation}
                    onSave={(updated, newLoc) => {
                        setIdentity((prev: ProfileIdentity) => ({ ...prev, ...updated }));
                        setProfileLocation(newLoc);
                        setShowEditModal(false);
                        triggerToast();
                    }}
                    onClose={() => setShowEditModal(false)}
                    onSelectAvatarFile={(file) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => ev.target?.result && setRawAvatarSrc(ev.target.result as string);
                        reader.readAsDataURL(file);
                    }}
                    onSelectCoverFile={(file) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => ev.target?.result && setRawCoverSrc(ev.target.result as string);
                        reader.readAsDataURL(file);
                    }}
                    t={t}
                />
            )}

            {showBadgeSelector && (
                <BadgeSelectorModal
                    badges={badges}
                    selectedBadgeId={selectedBadgeId}
                    onSelect={(id) => { setSelectedBadgeId(id); setShowBadgeSelector(false); triggerToast(); }}
                    onClose={() => setShowBadgeSelector(false)}
                    t={t}
                />
            )}

            <ProfileHero
                coverSrc={customBg}
                avatarUrl={avatarUrl}
                isOwnProfile={isOwnProfile}
                identity={identity}
                onIdentityChange={(next) => setIdentity((prev: ProfileIdentity) => ({ ...prev, ...next }))}
                equippedBadge={equippedBadge}
                forumRankNode={forumRankNode}
                isFriend={isFriend}
                isBlocked={isBlocked}
                onSelectCoverFile={(file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => ev.target?.result && setRawCoverSrc(ev.target.result as string);
                    reader.readAsDataURL(file);
                }}
                onSelectAvatarFile={(file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => ev.target?.result && setRawAvatarSrc(ev.target.result as string);
                    reader.readAsDataURL(file);
                }}
                onSaveIdentity={triggerToast}
                onOpenBadgeSelector={() => setShowBadgeSelector(true)}
                onOpenEditModal={() => setShowEditModal(true)}
                onAddFriend={() => toggleFriend(identity.name)}
                onUnfriend={() => toggleFriend(identity.name)}
                onBlock={() => { setIsBlocked(true); triggerToast(); }}
                onUnblock={() => { setIsBlocked(false); triggerToast(); }}
                location={profileLocation}
                joinedDate="Tháng 6, 2026"
                reputationPercent={98}
                t={t}
            />

            {rawCoverSrc && (
                <ImageCropperModal
                    rawImageSrc={rawCoverSrc}
                    onClose={() => setRawCoverSrc(null)}
                    onSave={(url) => { setCustomBg(url); setRawCoverSrc(null); triggerToast(); }}
                    aspectRatio={3}
                    title={t("profile.uploadCover", { defaultValue: "Căn chỉnh ảnh bìa" })}
                    outputWidth={1200}
                />
            )}

            {rawAvatarSrc && (
                <ImageCropperModal
                    rawImageSrc={rawAvatarSrc}
                    onClose={() => setRawAvatarSrc(null)}
                    onSave={(url) => { setCustomAvatar(url); setRawAvatarSrc(null); triggerToast(); }}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-start">
                {/* Sticky player card sidebar */}
                <div className="lg:col-span-4 lg:sticky lg:top-6">
                    <ProfileSidebar
                        isOwnProfile={isOwnProfile}
                        bio={identity.bio}
                        onBioChange={(bio) => setIdentity((prev: ProfileIdentity) => ({ ...prev, bio }))}
                        isEditingBio={isEditingBio}
                        onToggleEditBio={() => setIsEditingBio((v) => !v)}
                        onSaveBio={() => { setIsEditingBio(false); triggerToast(); }}
                        gearData={gearData}
                        onGearChange={(key, value) => setGearData((prev: Record<string, string>) => ({ ...prev, [key]: value }))}
                        isEditingGear={isEditingGear}
                        onToggleEditGear={() => setIsEditingGear((v) => !v)}
                        onSaveGear={() => { setIsEditingGear(false); triggerToast(); }}
                        t={t}
                    />
                </div>

                <div className="lg:col-span-8 flex flex-col gap-0 w-full">
                    <ProfileTabBar activeTab={activeTab} onChange={setActiveTab} friendsCount={friendsList.length} showBookmarks={showBookmarks} t={t} />

                    <div className="pt-5 transition-all duration-300 min-h-[480px]">
                        {activeTab === "library" && <LibraryTab games={LIBRARY_GAMES} t={t} />}
                        {activeTab === "posts" && <PostsTab posts={displayPosts} t={t} />}
                        {activeTab === "friends" && (
                            <FriendsTab
                                friends={friendsList}
                                requests={friendRequestsList}
                                onToggleFriend={toggleFriend}
                                onBlockFriend={blockFriend}
                                onAcceptRequest={handleAcceptRequest}
                                onDeclineRequest={handleDeclineRequest}
                                t={t}
                            />
                        )}
                        {activeTab === "bookmarks" && showBookmarks && <BookmarkList />}
                        {activeTab === "guestbook" && (
                            <GuestbookTab
                                comments={guestbookComments}
                                newCommentText={newCommentText}
                                onChangeNewComment={setNewCommentText}
                                onSubmit={handleAddGuestbook}
                                onToggleLike={toggleLikeComment}
                                displayName={identity.name}
                                t={t}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
