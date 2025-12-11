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

// utils
const formatTicksToHMS = (ticks) => {
	const totalSeconds = Math.floor(ticks / 10000000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	if (hours > 0) {
		return [hours, minutes, seconds]
			.map((v) => String(v).padStart(2, "0"))
			.join(":");
	} else {
		return [minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
	}
};

const app = new Elysia()
	.use(cors())
	.get("/api/v1/dashboard", async () => {
		try {
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

			const [latestMovieRes, latestEpisodesRes, latestMusicRes] =
				await Promise.all([
					fetch(
						`${JELLYFIN_URL}/Users/${adminId}/Items/Latest?Limit=10&IncludeItemTypes=Movie`,
						{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
					),
					fetch(
						`${JELLYFIN_URL}/Users/${adminId}/Items/Latest?Limit=10&IncludeItemTypes=Episode`,
						{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
					),
					fetch(
						`${JELLYFIN_URL}/Users/${adminId}/Items/Latest?Limit=10&IncludeItemTypes=Audio`,
						{ headers: { "X-Emby-Token": JELLYFIN_API_KEY } },
					),
				]);

			const latestMovies = await latestMovieRes.json();
			const latestEpisodes = await latestEpisodesRes.json();
			const latestMusic = await latestMusicRes.json();

			const now = new Date();

			const movieCarousel = latestMovies
				.map((m) => ({
					id: m.Id,
					title: m.Name,
					year: m.ProductionYear,
					image: `${JELLYFIN_URL}/Items/${m.Id}/Images/Primary?fillWidth=400&quality=90`,
				}))
				.sort((a, b) => b.year - a.year);

			// 3. Map & Sort TV Episodes
			const episodeCarousel = latestEpisodes
				.map((e) => {
					// LOGIC: Handle Series vs Episode differences
					const isEpisode = e.Type === "Episode";

					return {
						id: e.Id,
						// If it's an episode, use its name. If it's a Series, use the Series Name.
						title: isEpisode ? e.Name : e.Name,

						// If it's an episode, show the Parent Name. If it's a Series, label it "New Series".
						series: isEpisode ? e.SeriesName : "New Series Premiere",

						year: e.ProductionYear,
						date: e.PremiereDate,

						// Series often use 'Primary' or 'Thumb', Episodes use 'Primary'
						image: `${JELLYFIN_URL}/Items/${e.Id}/Images/Primary?fillWidth=400&quality=90`,

						// Pass the type to frontend so we can maybe style 'New Series' differently
						type: e.Type,
					};
				})
				.sort((a, b) => new Date(b.date) - new Date(a.date));

			// 4. Map & Sort Music
			const musicCarousel = latestMusic
				.map((m) => ({
					id: m.Id,
					title: m.Name,
					artist: m.AlbumArtist || m.Artists?.[0] || "Unknown",
					album: m.AlbumName,
					year: m.ProductionYear,
					image: `${JELLYFIN_URL}/Items/${m.Id}/Images/Primary?fillWidth=400&quality=90`,
				}))
				.sort((a, b) => b.year - a.year);

			const activeStreams = sessions
				.sort((a, b) => {
					// Sort by username first
					const userCompare = a.UserName.localeCompare(b.UserName);
					if (userCompare !== 0) return userCompare;

					// If usernames are equal, sort by the now-playing item's title
					const aTitle = a.NowPlayingItem?.Name ?? "";
					const bTitle = b.NowPlayingItem?.Name ?? "";
					return aTitle.localeCompare(bTitle);
				})
				.filter((s) => s.NowPlayingItem)
				.map((s) => {
					const item = s.NowPlayingItem;
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
						type: item.Type, // 'Movie', 'Episode', 'Audio', etc.
						title: item.Name,
						year: item.ProductionYear,
						// conditionals for series info
						seriesName: item.SeriesName || null,
						seasonNumber: item.SeasonName || null,
						// episodeNumber: item.IndexNumber || null, // soon
						albumName: item.Album || null,
						artistName: item.AlbumArtist || null,
						// Use Backdrop if available, otherwise Primary
						image: `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop/0?maxWidth=800`,
						device: `${s.Client} (${s.DeviceName})`,
						status: s.PlayState.IsPaused ? "Paused" : "Playing",
						method: s.PlayState.PlayMethod, // 'DirectPlay' or 'DirectStream' etc.
						// convert ticks to hh:mm:ss
						totalTicks: formatTicksToHMS(totalTicks),
						currentTicks: formatTicksToHMS(currentTicks),
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

			return {
				config: {
					publicUrl: JELLYFIN_URL,
					token: JELLYFIN_API_KEY,
				},
				system: {
					serverName: systemInfo.ServerName,
					version: systemInfo.Version,
					os: systemInfo.OperatingSystem,
				},
				library: {
					...counts,
					latest: {
						movies: movieCarousel,
						episodes: episodeCarousel,
						music: musicCarousel,
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
