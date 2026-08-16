import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouterGenerator } from "@tanstack/router-plugin/vite";

function searchApiPlugin(): Plugin {
	return {
		name: "search-api-plugin",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url && req.url.startsWith("/api/search")) {
					try {
						const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
						const q = (url.searchParams.get("q") || "").trim();
						const type = (url.searchParams.get("type") || "all").toLowerCase();
						const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
						const size = Math.min(50, Math.max(1, parseInt(url.searchParams.get("size") || "10", 10) || 10));

						const posts = [
							{
								id: 1,
								author: { name: "User123", avatar: "/assets/game-avatar.png" },
								title: "Setup base ngoài khơi cực chill sau 40 ngày sinh tồn",
								content: "Cuối cùng cũng build xong base 3 tầng trong Raft.",
								likes: 24,
								commentsCount: 8,
								timestamp: "2 giờ trước",
								communityName: "Raft Survivalist",
								hashtags: ["#raft", "#survival"],
							},
							{
								id: 2,
								author: { name: "GhostRider", avatar: "/assets/game-avatar.png" },
								title: "Bản mod đồ hoạ 4K mới ra, chạy siêu mượt cho RDR2",
								content: "Vừa test bản mod textures mới cho Red Dead Redemption 2.",
								likes: 56,
								commentsCount: 19,
								timestamp: "5 giờ trước",
								communityName: "Red Dead Vietnam",
								hashtags: ["#rdr2", "#mods"],
							},
							{
								id: 3,
								author: { name: "TacticalGamer", avatar: "/assets/game-avatar.png" },
								title: "Tips aim training cho người mới lên Premier CS2",
								content: "Luyện tập Crosshair placement và Counter-strafe trong Counter-Strike 2.",
								likes: 112,
								commentsCount: 43,
								timestamp: "1 ngày trước",
								communityName: "CS2 Competitive Hub",
								hashtags: ["#cs2", "#esports"],
							},
						];

						const users = [
							{ id: "ghostrider", name: "GhostRider", username: "@ghostrider", avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80", bio: "Red Dead Redemption 2 enthusiast. Outlaw by day, sheriff by night.", status: "online", game: "Red Dead Redemption 2", isFriend: true },
							{ id: "tactical_xeno", name: "TacticalXeno", username: "@tactical_xeno", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80", bio: "Pro CS2 competitive player & tactical leader.", status: "in-game", game: "Counter-Strike 2", isFriend: true },
							{ id: "nightowl", name: "NightOwl", username: "@nightowl", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80", bio: "Raft Hardcore survivor & building floating fortresses.", status: "online", game: "Raft Hardcore", isFriend: true },
							{ id: "user123", name: "User123", username: "@user123", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80", bio: "Survival game builder, streamer and content creator.", status: "online", game: "Raft", isFriend: false },
							{ id: "s1mple_olex", name: "S1mple_Olex", username: "@s1mple_olex", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80", bio: "CS2 Premier 20k+ Elo AWP main.", status: "in-game", game: "Counter-Strike 2", isFriend: false },
						];

						const communities = [
							{ id: "cs2-vn", name: "CS2 Vietnam Competitive", logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80", category: "FPS", description: "Cộng đồng Counter-Strike 2 Việt Nam. Tìm team, trao đổi skin và thảo luận giải đấu.", members: 42500 },
							{ id: "rdr2-outlaws", name: "Red Dead Redemption 2 - Vietnam Outlaws", logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=80", category: "Open World", description: "Hội người chơi RDR2 & Red Dead Online. Chia sẻ khoảnh khắc, mod đồ họa.", members: 28900 },
							{ id: "raft-ocean", name: "Raft Ocean Explorers", logo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&auto=format&fit=crop&q=80", category: "Survival", description: "Giao lưu, tìm đồng đội xây bè và sinh tồn trên đại dương Raft Hardcore.", members: 15400 },
						];

						const games = [
							{ slug: "cs2", name: "Counter-Strike 2", genre: ["FPS", "Esports"], developer: "Valve", publisher: "Valve", ratingScore: 4.8, description: "Tựa game bắn súng góc nhìn thứ nhất eSports hàng đầu thế giới.", bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80" },
							{ slug: "rdr2", name: "Red Dead Redemption 2", genre: ["Open World", "Action RPG"], developer: "Rockstar Games", publisher: "Rockstar Games", ratingScore: 4.9, description: "Kiệt tác thế giới mở viễn tây từ Rockstar Games.", bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&auto=format&fit=crop&q=80" },
							{ slug: "raft", name: "Raft", genre: ["Survival", "Co-op"], developer: "Redbeet Interactive", publisher: "Axolot Games", ratingScore: 4.7, description: "Sinh tồn trên bè giữa đại dương mênh mông.", bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80" },
						];

						const filterTerm = q.toLowerCase();

						const matchedPosts = filterTerm ? posts.filter(p => p.title.toLowerCase().includes(filterTerm) || p.content.toLowerCase().includes(filterTerm) || p.author.name.toLowerCase().includes(filterTerm) || p.hashtags.some(h => h.toLowerCase().includes(filterTerm))) : [];
						const matchedUsers = filterTerm ? users.filter(u => u.name.toLowerCase().includes(filterTerm) || u.username.toLowerCase().includes(filterTerm) || u.bio.toLowerCase().includes(filterTerm)) : [];
						const matchedCommunities = filterTerm ? communities.filter(c => c.name.toLowerCase().includes(filterTerm) || c.description.toLowerCase().includes(filterTerm) || c.category.toLowerCase().includes(filterTerm)) : [];
						const matchedGames = filterTerm ? games.filter(g => g.name.toLowerCase().includes(filterTerm) || g.developer.toLowerCase().includes(filterTerm) || g.genre.some(gen => gen.toLowerCase().includes(filterTerm))) : [];

						const meta = {
							totalPosts: matchedPosts.length,
							totalUsers: matchedUsers.length,
							totalCommunities: matchedCommunities.length,
							totalGames: matchedGames.length,
						};

						let totalItems = 0;
						let resPosts: unknown[] = [];
						let resUsers: unknown[] = [];
						let resCommunities: unknown[] = [];
						let resGames: unknown[] = [];

						const startIndex = (page - 1) * size;
						const endIndex = startIndex + size;

						if (type === "posts") {
							totalItems = matchedPosts.length;
							resPosts = matchedPosts.slice(startIndex, endIndex);
						} else if (type === "users") {
							totalItems = matchedUsers.length;
							resUsers = matchedUsers.slice(startIndex, endIndex);
						} else if (type === "communities") {
							totalItems = matchedCommunities.length;
							resCommunities = matchedCommunities.slice(startIndex, endIndex);
						} else if (type === "games") {
							totalItems = matchedGames.length;
							resGames = matchedGames.slice(startIndex, endIndex);
						} else {
							totalItems = meta.totalPosts + meta.totalUsers + meta.totalCommunities + meta.totalGames;
							resPosts = matchedPosts.slice(0, Math.ceil(size / 4));
							resUsers = matchedUsers.slice(0, Math.ceil(size / 4));
							resCommunities = matchedCommunities.slice(0, Math.ceil(size / 4));
							resGames = matchedGames.slice(0, Math.ceil(size / 4));
						}

						const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / size);

						res.setHeader("Content-Type", "application/json");
						res.end(JSON.stringify({
							success: true,
							query: q,
							type,
							pagination: {
								page,
								size,
								total: totalItems,
								totalPages,
								hasMore: page < totalPages
							},
							data: {
								posts: resPosts,
								users: resUsers,
								communities: resCommunities,
								games: resGames
							},
							meta
						}));
						return;
					} catch (e) {
						res.statusCode = 500;
						res.end(JSON.stringify({ success: false, error: String(e) }));
						return;
					}
				}
				next();
			});
		}
	};
}

let backendNotifications = [
	{
		id: "notif-1",
		userId: "user-current",
		type: "like",
		referenceId: "post-1",
		title: "GamerX99 đã thích bài viết của bạn",
		message: "Chê Counter-Strike 2 hack nhiều quá, Valve tính làm gì đây? 😂",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerX99",
		createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		isRead: false,
		link: "/post/1",
	},
	{
		id: "notif-2",
		userId: "user-current",
		type: "comment",
		referenceId: "post-2",
		title: "NeoCyber đã bình luận bài viết của bạn",
		message: "\"Cảm ơn bạn đã chia sẻ tips build thuyền trong Raft, cực kỳ hữu ích luôn!\"",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeoCyber",
		createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		isRead: false,
		link: "/post/2",
	},
	{
		id: "notif-3",
		userId: "user-current",
		type: "system",
		referenceId: "game-cs2",
		title: "Thông báo hệ thống từ Valve",
		message: "Counter-Strike 2 vừa phát hành bản cập nhật mới (Armory Patch). Vào xem ngay các thay đổi vũ khí và skin!",
		avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Valve",
		createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		isRead: false,
		link: "/game/counter-strike-2",
	},
	{
		id: "notif-4",
		userId: "user-current",
		type: "community",
		referenceId: "comm-cs2-vn",
		title: "Sự kiện Cộng đồng",
		message: "Chào mừng những đồng đội mới tham gia cùng bạn trên cộng đồng CS2 Vietnam Competitive!",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shouko",
		createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		isRead: true,
		link: "/community",
	},
];

function notificationApiPlugin(): Plugin {
	return {
		name: "notification-api-plugin",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url && req.url.startsWith("/api/notifications")) {
					res.setHeader("Content-Type", "application/json");

					if (req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendNotifications }));
					}

					if (req.method === "POST") {
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							try {
								const data = JSON.parse(body || "{}");
								const newNotif = {
									id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
									userId: data.userId || "user-current",
									type: data.type || "system",
									referenceId: data.referenceId || "ref-1",
									message: data.message || "Thông báo mới",
									isRead: false,
									createdAt: new Date().toISOString(),
									title: data.title || "Thông báo mới",
									avatarUrl: data.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Notif",
									link: data.link || "/",
								};
								backendNotifications.unshift(newNotif);
								return res.end(JSON.stringify({ success: true, data: newNotif }));
							} catch (e) {
								res.statusCode = 400;
								return res.end(JSON.stringify({ success: false, error: String(e) }));
							}
						});
						return;
					}

					if (req.method === "PUT" && req.url.includes("/read-all")) {
						backendNotifications = backendNotifications.map((n) => ({ ...n, isRead: true }));
						return res.end(JSON.stringify({ success: true }));
					}

					if (req.method === "PUT" && req.url.includes("/read")) {
						const parts = req.url.split("/");
						const id = parts[parts.length - 2];
						backendNotifications = backendNotifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
						return res.end(JSON.stringify({ success: true }));
					}
				}
				next();
			});
		}
	};
}

let backendReports = [
	{
		id: "rep-101",
		reporterId: "user-2",
		targetType: "post" as const,
		targetId: "post-1",
		reason: "Spam or misleading",
		description: "Bài viết chứa link bài đăng quảng cáo sai sự thật",
		status: "pending" as const,
		createdAt: new Date(Date.now() - 3600000).toISOString(),
		targetTitle: "Nhận ngay 1000 VP Valorant miễn phí",
		targetAuthor: "Scammer_Pro",
	},
	{
		id: "rep-102",
		reporterId: "user-3",
		targetType: "comment" as const,
		targetId: "comment-45",
		reason: "Harassment or bullying",
		description: "Bình luận xúc phạm người chơi khác",
		status: "pending" as const,
		createdAt: new Date(Date.now() - 7200000).toISOString(),
		targetTitle: "Comment #45 trên bài CS2",
		targetAuthor: "ToxicPlayer",
	},
];

let backendAdminUsers = [
	{
		id: "u-1",
		name: "Admin Tổng",
		username: "admin_master",
		email: "admin@gamehub.vn",
		avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AdminMaster",
		isBanned: false,
		suspendedUntil: null,
		role: "admin" as const,
		createdAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "u-2",
		name: "GamerX99",
		username: "gamerx99",
		email: "gamerx99@gmail.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerX99",
		isBanned: false,
		suspendedUntil: null,
		role: "moderator" as const,
		createdAt: "2024-02-15T00:00:00.000Z",
	},
	{
		id: "u-3",
		name: "Scammer_Pro",
		username: "scammer_pro",
		email: "scam@cheat.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Scammer",
		isBanned: true,
		suspendedUntil: null,
		role: "user" as const,
		createdAt: "2024-03-01T00:00:00.000Z",
	},
	{
		id: "u-4",
		name: "ToxicPlayer",
		username: "toxic_player",
		email: "toxic@rage.com",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Toxic",
		isBanned: false,
		suspendedUntil: "2026-08-21T00:00:00.000Z",
		role: "user" as const,
		createdAt: "2024-03-10T00:00:00.000Z",
	},
];

let backendAdminCommunities = [
	{
		id: "comm-cs2-vn",
		name: "CS2 Vietnam Competitive",
		category: "FPS",
		description: "Cộng đồng Counter-Strike 2 Việt Nam. Tìm team, trao đổi skin và thảo luận giải đấu.",
		logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80",
		membersCount: 42500,
		moderators: ["u-1", "u-2"],
		ownerId: "u-1",
		isDisabled: false,
		createdAt: "2024-01-10T00:00:00.000Z",
	},
	{
		id: "comm-rdr2-outlaws",
		name: "Red Dead Redemption 2 - Vietnam Outlaws",
		category: "Open World",
		description: "Hội người chơi RDR2 & Red Dead Online. Chia sẻ khoảnh khắc, mod đồ họa.",
		logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=80",
		membersCount: 28900,
		moderators: ["u-2"],
		ownerId: "u-2",
		isDisabled: false,
		createdAt: "2024-01-20T00:00:00.000Z",
	},
	{
		id: "comm-raft-ocean",
		name: "Raft Ocean Explorers",
		category: "Survival",
		description: "Giao lưu, tìm đồng đội xây bè và sinh tồn trên đại dương Raft Hardcore.",
		logo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&auto=format&fit=crop&q=80",
		membersCount: 15400,
		moderators: ["u-4"],
		ownerId: "u-4",
		isDisabled: false,
		createdAt: "2024-02-01T00:00:00.000Z",
	},
];

let backendContentItems = [
	{
		id: "post-1",
		type: "post" as const,
		title: "Setup base ngoài khơi cực chill sau 40 ngày sinh tồn",
		content: "Cuối cùng cũng build xong base 3 tầng trong Raft. Mọi người cho ý kiến về phòng chứa đồ nhé!",
		authorId: "u-2",
		authorName: "GamerX99",
		isDeleted: false,
		createdAt: new Date(Date.now() - 7200000).toISOString(),
		reportsCount: 1,
	},
	{
		id: "post-2",
		type: "post" as const,
		title: "Nhận ngay 1000 VP Valorant miễn phí",
		content: "Truy cập ngay link https://free-vp-scam.cheat để nhận skin súng rồng múa lửa miễn phí!",
		authorId: "u-3",
		authorName: "Scammer_Pro",
		isDeleted: true,
		createdAt: new Date(Date.now() - 14400000).toISOString(),
		reportsCount: 5,
	},
	{
		id: "comment-45",
		type: "comment" as const,
		content: "Bớt nói nhảm đi đồ noob, chơi game như gà không biết ngắm nhắm!",
		authorId: "u-4",
		authorName: "ToxicPlayer",
		isDeleted: false,
		createdAt: new Date(Date.now() - 3600000).toISOString(),
		reportsCount: 2,
	},
];

let backendAdminGames = [
	{
		id: "game-1",
		slug: "cs2",
		name: "Counter-Strike 2",
		genre: ["FPS", "Esports"],
		developer: "Valve",
		publisher: "Valve",
		bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80",
		isDisabled: false,
	},
	{
		id: "game-2",
		slug: "rdr2",
		name: "Red Dead Redemption 2",
		genre: ["Open World", "Action RPG"],
		developer: "Rockstar Games",
		publisher: "Rockstar Games",
		bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&auto=format&fit=crop&q=80",
		isDisabled: false,
	},
	{
		id: "game-3",
		slug: "raft",
		name: "Raft",
		genre: ["Survival", "Co-op"],
		developer: "Redbeet Interactive",
		publisher: "Axolot Games",
		bannerUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80",
		isDisabled: false,
	},
];

let backendSystemSettings = {
	general: {
		systemName: "IndieG Admin Portal",
		systemEmail: "admin@indieg.com",
		defaultLanguage: "vi",
	},
	registration: {
		allowRegistration: true,
		requireEmailVerification: true,
		defaultRole: "user" as const,
	},
	moderation: {
		autoFlagThreshold: 3,
		maxReportsPerDay: 10,
		autoHideReportedContent: true,
	},
	content: {
		maxUploadMB: 10,
		allowImages: true,
		nsfwFilterEnabled: true,
	},
	notifications: {
		systemBroadcast: "Chào mừng bạn đến với mạng xã hội IndieG - Nơi kết nối game thủ!",
		adminAlertEmail: true,
	},
	security: {
		require2FA: true,
		sessionTimeoutMinutes: 60,
		rateLimitPerMin: 120,
	},
	maintenance: {
		maintenanceMode: false,
		maintenanceNotice: "Hệ thống đang bảo trì định kỳ để nâng cấp máy chủ.",
	},
	featureFlags: {
		enableAIAssistant: true,
		enableLiveChat: true,
		enableSquadFinder: true,
		enableGuildTournaments: false,
	},
};

function adminApiPlugin(): Plugin {
	return {
		name: "admin-api-plugin",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url || "";

				// Handle create report (public route for logged in users)
				if (url.startsWith("/api/reports") && req.method === "POST") {
					res.setHeader("Content-Type", "application/json");
					let body = "";
					req.on("data", (chunk) => { body += chunk; });
					req.on("end", () => {
						try {
							const data = JSON.parse(body || "{}");
							const newReport = {
								id: `rep-${Date.now()}`,
								reporterId: data.reporterId || "user-current",
								targetType: data.targetType || "post",
								targetId: String(data.targetId || "1"),
								reason: data.reason || "Misconduct",
								description: data.description || "",
								status: "pending" as const,
								createdAt: new Date().toISOString(),
								targetTitle: data.targetTitle || `Target #${data.targetId}`,
								targetAuthor: data.targetAuthor || "Unknown",
							};
							backendReports.unshift(newReport);
							return res.end(JSON.stringify({ success: true, data: newReport }));
						} catch (e) {
							res.statusCode = 400;
							return res.end(JSON.stringify({ success: false, error: String(e) }));
						}
					});
					return;
				}

				// Authorization verification for ALL admin endpoints
				if (url.startsWith("/api/admin")) {
					res.setHeader("Content-Type", "application/json");
					const userRole = req.headers["x-user-role"];
					if (userRole !== "admin") {
						res.statusCode = 403;
						return res.end(JSON.stringify({
							success: false,
							error: "Access denied: ADMIN role required on backend authorization verification."
						}));
					}

					// Stats
					if (url.startsWith("/api/admin/stats") && req.method === "GET") {
						const pendingReportsCount = backendReports.filter(r => r.status === "pending").length;
						return res.end(JSON.stringify({
							success: true,
							data: {
								usersCount: backendAdminUsers.length,
								postsCount: backendContentItems.filter(c => c.type === "post").length,
								commentsCount: backendContentItems.filter(c => c.type === "comment").length,
								communitiesCount: backendAdminCommunities.length,
								pendingReportsCount,
								growth: {
									userGrowthPercent: 18.5,
									postVelocityPercent: 24.2,
									resolutionRatePercent: 92.5,
									activeCommunitiesPercent: 87.0,
								}
							}
						}));
					}

					// List Reports
					if (url.startsWith("/api/admin/reports") && req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendReports }));
					}

					// Assign Report
					if (url.includes("/reports/") && url.endsWith("/assign") && req.method === "PUT") {
						const parts = url.split("/");
						const id = parts[parts.length - 2];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const { assignedTo } = JSON.parse(body || "{}");
							let found = null;
							backendReports = backendReports.map((r) => {
								if (r.id === id) {
									found = { ...r, assignedTo };
									return found;
								}
								return r;
							});
							return res.end(JSON.stringify({ success: true, data: found }));
						});
						return;
					}

					// Resolve Report
					if (url.includes("/reports/") && url.endsWith("/resolve") && req.method === "PUT") {
						const parts = url.split("/");
						const id = parts[parts.length - 2];
						let foundReport = null;
						backendReports = backendReports.map((r) => {
							if (r.id === id) {
								foundReport = {
									...r,
									status: "resolved" as const,
									resolvedBy: "admin_master",
									resolvedAt: new Date().toISOString(),
								};
								return foundReport;
							}
							return r;
						});
						return res.end(JSON.stringify({ success: true, data: foundReport }));
					}

					// Reject Report
					if (url.includes("/reports/") && url.endsWith("/reject") && req.method === "PUT") {
						const parts = url.split("/");
						const id = parts[parts.length - 2];
						let foundReport = null;
						backendReports = backendReports.map((r) => {
							if (r.id === id) {
								foundReport = {
									...r,
									status: "rejected" as const,
									resolvedBy: "admin_master",
									resolvedAt: new Date().toISOString(),
								};
								return foundReport;
							}
							return r;
						});
						return res.end(JSON.stringify({ success: true, data: foundReport }));
					}

					// Communities
					if (url.startsWith("/api/admin/communities") && req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendAdminCommunities }));
					}

					if (url.includes("/communities/") && url.endsWith("/toggle-disable") && req.method === "PUT") {
						const parts = url.split("/");
						const commId = parts[parts.length - 2];
						let updated = null;
						backendAdminCommunities = backendAdminCommunities.map(c => {
							if (c.id === commId) {
								updated = { ...c, isDisabled: !c.isDisabled };
								return updated;
							}
							return c;
						});
						return res.end(JSON.stringify({ success: true, data: updated }));
					}

					if (url.includes("/communities/") && url.endsWith("/moderators") && req.method === "PUT") {
						const parts = url.split("/");
						const commId = parts[parts.length - 2];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const { moderators } = JSON.parse(body || "{}");
							let updated = null;
							backendAdminCommunities = backendAdminCommunities.map(c => {
								if (c.id === commId) {
									updated = { ...c, moderators };
									return updated;
								}
								return c;
							});
							return res.end(JSON.stringify({ success: true, data: updated }));
						});
						return;
					}

					if (url.includes("/communities/") && url.endsWith("/transfer-owner") && req.method === "PUT") {
						const parts = url.split("/");
						const commId = parts[parts.length - 2];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const { newOwnerId } = JSON.parse(body || "{}");
							let updated = null;
							backendAdminCommunities = backendAdminCommunities.map(c => {
								if (c.id === commId) {
									updated = { ...c, ownerId: newOwnerId };
									return updated;
								}
								return c;
							});
							return res.end(JSON.stringify({ success: true, data: updated }));
						});
						return;
					}

					// Content List
					if (url.startsWith("/api/admin/content") && req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendContentItems }));
					}

					// Delete / Restore Post
					if (url.startsWith("/api/admin/posts/") && req.method === "DELETE") {
						const parts = url.split("/");
						const postId = parts[parts.length - 1];
						backendContentItems = backendContentItems.map(item => item.id === postId ? { ...item, isDeleted: true } : item);
						backendReports = backendReports.filter((r) => !(r.targetType === "post" && r.targetId === postId));
						return res.end(JSON.stringify({ success: true, message: `Post ${postId} deleted by admin.` }));
					}

					if (url.startsWith("/api/admin/posts/") && url.endsWith("/restore") && req.method === "PUT") {
						const parts = url.split("/");
						const postId = parts[parts.length - 2];
						backendContentItems = backendContentItems.map(item => item.id === postId ? { ...item, isDeleted: false } : item);
						return res.end(JSON.stringify({ success: true, message: `Post ${postId} restored.` }));
					}

					// Delete / Restore Comment
					if (url.startsWith("/api/admin/comments/") && req.method === "DELETE") {
						const parts = url.split("/");
						const commentId = parts[parts.length - 1];
						backendContentItems = backendContentItems.map(item => item.id === commentId ? { ...item, isDeleted: true } : item);
						backendReports = backendReports.filter((r) => !(r.targetType === "comment" && r.targetId === commentId));
						return res.end(JSON.stringify({ success: true, message: `Comment ${commentId} deleted by admin.` }));
					}

					if (url.startsWith("/api/admin/comments/") && url.endsWith("/restore") && req.method === "PUT") {
						const parts = url.split("/");
						const commentId = parts[parts.length - 2];
						backendContentItems = backendContentItems.map(item => item.id === commentId ? { ...item, isDeleted: false } : item);
						return res.end(JSON.stringify({ success: true, message: `Comment ${commentId} restored.` }));
					}

					// Games
					if (url.startsWith("/api/admin/games") && req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendAdminGames }));
					}

					if (url.startsWith("/api/admin/games") && req.method === "POST") {
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const newGame = JSON.parse(body || "{}");
							const created = {
								...newGame,
								id: `game-${Date.now()}`,
								isDisabled: false,
							};
							backendAdminGames.push(created);
							return res.end(JSON.stringify({ success: true, data: created }));
						});
						return;
					}

					if (url.includes("/games/") && url.endsWith("/toggle-disable") && req.method === "PUT") {
						const parts = url.split("/");
						const gameId = parts[parts.length - 2];
						let updated = null;
						backendAdminGames = backendAdminGames.map(g => {
							if (g.id === gameId) {
								updated = { ...g, isDisabled: !g.isDisabled };
								return updated;
							}
							return g;
						});
						return res.end(JSON.stringify({ success: true, data: updated }));
					}

					if (url.startsWith("/api/admin/games/") && req.method === "PUT") {
						const parts = url.split("/");
						const gameId = parts[parts.length - 1];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const payload = JSON.parse(body || "{}");
							let updated = null;
							backendAdminGames = backendAdminGames.map(g => {
								if (g.id === gameId) {
									updated = { ...g, ...payload };
									return updated;
								}
								return g;
							});
							return res.end(JSON.stringify({ success: true, data: updated }));
						});
						return;
					}

					if (url.startsWith("/api/admin/games/") && req.method === "DELETE") {
						const parts = url.split("/");
						const gameId = parts[parts.length - 1];
						backendAdminGames = backendAdminGames.filter(g => g.id !== gameId);
						return res.end(JSON.stringify({ success: true, message: `Game ${gameId} deleted.` }));
					}

					// Settings
					if (url.startsWith("/api/admin/settings") && req.method === "GET") {
						return res.end(JSON.stringify({ success: true, data: backendSystemSettings }));
					}

					if (url.startsWith("/api/admin/settings") && req.method === "PUT") {
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const payload = JSON.parse(body || "{}");
							backendSystemSettings = {
								...backendSystemSettings,
								...payload,
							};
							return res.end(JSON.stringify({ success: true, data: backendSystemSettings }));
						});
						return;
					}

					// List & Search Users
					if (url.startsWith("/api/admin/users") && req.method === "GET") {
						const searchParams = new URL(url, "http://localhost:3000").searchParams;
						const q = (searchParams.get("q") || "").toLowerCase();
						const filtered = backendAdminUsers.filter((u) =>
							u.name.toLowerCase().includes(q) ||
							u.username.toLowerCase().includes(q) ||
							u.email.toLowerCase().includes(q)
						);
						return res.end(JSON.stringify({ success: true, data: filtered }));
					}

					// Ban User
					if (url.includes("/users/") && url.endsWith("/ban") && req.method === "PUT") {
						const parts = url.split("/");
						const userId = parts[parts.length - 2];
						let updatedUser = null;
						backendAdminUsers = backendAdminUsers.map((u) => {
							if (u.id === userId) {
								updatedUser = { ...u, isBanned: true };
								return updatedUser;
							}
							return u;
						});
						return res.end(JSON.stringify({ success: true, data: updatedUser }));
					}

					// Unban User
					if (url.includes("/users/") && url.endsWith("/unban") && req.method === "PUT") {
						const parts = url.split("/");
						const userId = parts[parts.length - 2];
						let updatedUser = null;
						backendAdminUsers = backendAdminUsers.map((u) => {
							if (u.id === userId) {
								updatedUser = { ...u, isBanned: false, suspendedUntil: null };
								return updatedUser;
							}
							return u;
						});
						return res.end(JSON.stringify({ success: true, data: updatedUser }));
					}

					// Suspend User
					if (url.includes("/users/") && url.endsWith("/suspend") && req.method === "PUT") {
						const parts = url.split("/");
						const userId = parts[parts.length - 2];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const { days } = JSON.parse(body || "{}");
							const until = new Date(Date.now() + days * 86400000).toISOString();
							let updatedUser = null;
							backendAdminUsers = backendAdminUsers.map((u) => {
								if (u.id === userId) {
									updatedUser = { ...u, suspendedUntil: until };
									return updatedUser;
								}
								return u;
							});
							return res.end(JSON.stringify({ success: true, data: updatedUser }));
						});
						return;
					}

					// Role Update
					if (url.includes("/users/") && url.endsWith("/role") && req.method === "PUT") {
						const parts = url.split("/");
						const userId = parts[parts.length - 2];
						let body = "";
						req.on("data", (chunk) => { body += chunk; });
						req.on("end", () => {
							const { role } = JSON.parse(body || "{}");
							let updatedUser = null;
							backendAdminUsers = backendAdminUsers.map((u) => {
								if (u.id === userId) {
									updatedUser = { ...u, role };
									return updatedUser;
								}
								return u;
							});
							return res.end(JSON.stringify({ success: true, data: updatedUser }));
						});
						return;
					}
				}

				next();
			});
		}
	};
}

export default defineConfig({
	server: {
		host: "0.0.0.0",
		port: 3000,
		allowedHosts: true,
	},
	plugins: [
		searchApiPlugin(),
		notificationApiPlugin(),
		adminApiPlugin(),
		tanstackRouterGenerator({
			routesDirectory: "./src/routes",
			generatedRouteTree: "./src/routeTree.gen.ts",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/features": path.resolve(__dirname, "./src/features"),
			"@/shared": path.resolve(__dirname, "./src/shared"),
			"@/app": path.resolve(__dirname, "./src/app"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes("node_modules")) return;
					if (
						id.includes("node_modules/react/") ||
						id.includes("node_modules/react-dom/")
					)
						return "vendor-react";
					if (id.includes("node_modules/@supabase/"))
						return "vendor-supabase";
					if (id.includes("node_modules/@tanstack/"))
						return "vendor-router";
					if (id.includes("node_modules/@fortawesome/"))
						return "vendor-fontawesome";
					if (id.includes("node_modules/zxcvbn/"))
						return "vendor-zxcvbn";
					return "vendor";
				},
			},
		},
		chunkSizeWarningLimit: 500,
	},
});