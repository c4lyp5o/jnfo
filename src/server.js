import { Elysia, file } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";

const JELLYFIN_URL = process.env.JELLYFIN_URL;
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY;
const PORT = process.env.PORT || 5000;

if (!JELLYFIN_URL || !JELLYFIN_API_KEY) {
	console.error("Error: JELLYFIN_URL and JELLYFIN_API_KEY must be set.");
	process.exit(1);
}

const app = new Elysia()
	.use(cors())
	.get("/api/v1/dashboard", async () => {
		try {
			// 1. Fetch Raw Data
			const [sessionsRes, countsRes, usersRes, systemRes] = await Promise.all([
				fetch(`${JELLYFIN_URL}/Sessions`, {
					headers: { "X-Emby-Token": JELLYFIN_API_KEY },
				}),
				fetch(`${JELLYFIN_URL}/Items/Counts`, {
					headers: { "X-Emby-Token": JELLYFIN_API_KEY },
				}),
				fetch(`${JELLYFIN_URL}/Users`, {
					headers: { "X-Emby-Token": JELLYFIN_API_KEY },
				}),
				fetch(`${JELLYFIN_URL}/System/Info`, {
					headers: { "X-Emby-Token": JELLYFIN_API_KEY },
				}),
			]);

			const sessions = await sessionsRes.json();
			const counts = await countsRes.json();
			const users = await usersRes.json();
			const systemInfo = await systemRes.json();

			const adminUser = users.find((u) => u.Policy.IsAdministrator);
			const adminId = adminUser ? adminUser.Id : users[0].Id;

			const [latestMovieRes, latestEpRes, latestMusicRes] = await Promise.all([
				fetch(
					`${JELLYFIN_URL}/Users/${adminId}/Items/Latest?Limit=1&IncludeItemTypes=Movie`,
					{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
				),
				fetch(
					`${JELLYFIN_URL}/Users/${adminId}/Items/Latest?Limit=1&IncludeItemTypes=Series`,
					{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
				),
				fetch(
					`${JELLYFIN_URL}/Users/${adminUser.Id}/Items/Latest?Limit=1&IncludeItemTypes=Audio`,
					{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
				),
			]);

			const latestMovie = (await latestMovieRes.json())[0];
			const latestEp = (await latestEpRes.json())[0];
			const latestMusic = (await latestMusicRes.json())[0];

			const now = new Date();

			const activeStreams = sessions
				.filter((s) => s.NowPlayingItem)
				.map((s) => {
					// Calculate percentage: (Current Ticks / Total Ticks) * 100
					const totalTicks = s.NowPlayingItem.RunTimeTicks;
					const currentTicks = s.PlayState.PositionTicks;
					const progress = totalTicks
						? Math.round((currentTicks / totalTicks) * 100)
						: 0;

					return {
						id: s.Id,
						user: s.UserName,
						userImage: `${JELLYFIN_URL}/Users/${s.UserId}/Images/Primary`, // User Avatar
						title: s.NowPlayingItem.Name,
						// Use Backdrop if available, otherwise Primary
						image: `${JELLYFIN_URL}/Items/${s.NowPlayingItem.Id}/Images/Backdrop/0?maxWidth=800`,
						device: `${s.Client} (${s.DeviceName})`,
						status: s.PlayState.IsPaused ? "Paused" : "Playing",
						method: s.PlayState.PlayMethod, // 'DirectPlay' or 'Transcode'
						progress: progress,
					};
				});

			const recentBrowsers = sessions
				.filter((s) => {
					if (s.NowPlayingItem) return false; // Already counted in streams
					if (s.Client.toLowerCase().includes("jellyseerr")) return false; // Ignore bots

					const lastActive = new Date(s.LastActivityDate);
					const diffMins = (now.getTime() - lastActive.getTime()) / 60000;
					return diffMins < 20; // Only show users active in last 20 mins
				})
				.map((s) => ({
					user: s.UserName,
					device: s.DeviceName,
					client: s.Client,
				}));

			const userRoster = users
				.sort((a, b) => b.LastActivityDate.localeCompare(a.LastActivityDate))
				.map((u) => ({
					id: u.Id,
					name: u.Name,
					lastActive: u.LastActivityDate,
					isAdmin: u.Policy.IsAdministrator,
				}));

			const getImg = (item, type = "Primary") =>
				item
					? `${JELLYFIN_URL}/Items/${item.Id}/Images/${type}?maxWidth=400`
					: null;

			return {
				system: {
					serverName: systemInfo.ServerName,
					version: systemInfo.Version,
					os: systemInfo.OperatingSystem,
				},
				library: {
					...counts,
					latest: {
						movie: latestMovie
							? {
									title: latestMovie.Name,
									year: latestMovie.ProductionYear,
									image:
										getImg(latestMovie, "Backdrop") ||
										getImg(latestMovie, "Primary"),
								}
							: null,
						episode: latestEp
							? {
									title: latestEp.Name,
									year: latestEp.PremiereDate
										? new Date(latestEp.PremiereDate).getFullYear()
										: "N/A",
									image: getImg(latestEp, "Primary"), // Episodes usually have Primary images (thumbnails)
								}
							: null,
						music: latestMusic
							? {
									title: latestMusic.Name,
									artist: latestMusic.AlbumArtist || latestMusic.Artists[0],
									image: getImg(latestMusic, "Primary"), // Album art
								}
							: null,
					},
				},
				activeStreams,
				recentBrowsers,
				totalSessions: sessions.length,
				userRoster,
			};
		} catch (error) {
			console.error(error);
			return { error: "Failed to fetch data" };
		}
	})
	.use(
		staticPlugin({
			assets: "dist/_app",
			prefix: "/_app",
		}),
	)
	.use(
		staticPlugin({
			assets: "dist",
			prefix: "/",
		}),
	)
	.get("/", () => file("./dist/index.html"))
	.get("*", ({ status }) => {
		status(404, { message: "Not found" });
	})
	.listen(PORT);

console.log(
	`[app] JNFO is running at ${app.server?.hostname}:${app.server?.port}`,
);
