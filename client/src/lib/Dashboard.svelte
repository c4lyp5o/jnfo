<script lang="js">
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { createQuery } from "@tanstack/svelte-query";

  import Streams from "./components/Streams.svelte";
  import { fmt, formatDate } from "./utils/format";

  const query = createQuery(() => ({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard");
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    refetchInterval: 5000,
  }));

  let movieIndex = $state(0);
  let episodeIndex = $state(0);
  let musicIndex = $state(0);

  let playingItem = $state(null);

  const playMovie = (movie) => {
    playingItem = movie;
  };

  const closePlayer = () => {
    playingItem = null;
  };

  onMount(() => {
    const interval = setInterval(() => {
      const lib = query.data?.library?.latest;

      if (!lib) return;

      if (lib.movies?.length > 1) {
        movieIndex = (movieIndex + 1) % lib.movies.length;
      }

      if (lib.episodes?.length > 1) {
        episodeIndex = (episodeIndex + 1) % lib.episodes.length;
      }

      if (lib.music?.length > 1) {
        musicIndex = (musicIndex + 1) % lib.music.length;
      }
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<div
  class="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10 font-sans selection:bg-purple-500/30"
>
  <!-- Header -->
  <header
    class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-white mb-1">JNFO</h1>
      <p class="text-neutral-500 text-sm">
        {query.data?.system?.serverName || "Jellyfin Media Server"}
      </p>
    </div>
    <div
      class="flex items-center gap-3 bg-neutral-900/50 px-4 py-2 rounded-full border border-neutral-800"
    >
      <div aria-live="polite">
        <div
          class="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]
    {query.isError
            ? 'bg-red-500'
            : query.isFetching
              ? 'bg-yellow-400'
              : 'bg-green-500 animate-pulse'}"
        ></div>
      </div>

      <span
        class="text-xs font-medium tracking-wide uppercase text-neutral-400"
      >
        {#if query.isError}
          Connection Lost
        {:else if query.isLoading}
          Connecting...
        {:else}
          System Operational
        {/if}
      </span>
    </div>
  </header>

  {#if query.isError}
    <div
      class="p-6 bg-red-950/30 border border-red-500/50 rounded-xl text-red-200"
    >
      System Malfunction
    </div>
  {:else if query.data}
    <!-- Streams -->
    <section class="mb-12">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
        <span
          class="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] animate-pulse"
        ></span>
        Now Playing ({query.data.activeStreams.length})
      </h2>

      {#if query.data.activeStreams.length === 0}
        <div
          class="flex flex-col items-center justify-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed"
        >
          <p class="text-neutral-500 font-medium">Server Idle</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {#each query.data.activeStreams as stream}
            <Streams {stream} />
          {/each}
        </div>
      {/if}
    </section>

    <!-- Server Items -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Movies Stats -->
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-88 group hover:border-blue-500/50 transition-colors relative overflow-hidden"
      >
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <h3
              class="text-blue-400 text-xs font-bold uppercase tracking-wider"
            >
              Movies
            </h3>
            <svg
              class="w-5 h-5 text-blue-900"
              fill="currentColor"
              viewBox="0 0 24 24"
              ><path
                d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"
              /></svg
            >
          </div>
          <p class="text-5xl font-bold text-white tracking-tight">
            {fmt(query.data.library.MovieCount)}
          </p>
          <p class="text-sm text-neutral-500 mt-1">Titles in library</p>
        </div>

        <!-- Latest Movies -->
        {#if query.data.library.latest.movies && query.data.library.latest.movies.length > 0}
          <div class="relative z-10 mt-6">
            <div class="flex justify-between items-end mb-3">
              <p
                class="text-[10px] text-neutral-500 uppercase font-bold tracking-widest"
              >
                Latest Movies
              </p>

              <!-- carousel indicators -->
              <div class="flex gap-1">
                {#each query.data.library.latest.movies as _, i}
                  <div
                    class="h-1 rounded-full transition-all duration-300 {i ===
                    movieIndex
                      ? 'w-4 bg-blue-500'
                      : 'w-1 bg-neutral-700'}"
                  ></div>
                {/each}
              </div>
            </div>

            <div
              class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors"
              role="button"
              tabindex="0"
              onclick={() =>
                playMovie(query.data.library.latest.movies[movieIndex])}
              onkeydown={(e) =>
                e.key === "Enter" &&
                playMovie(query.data.library.latest.movies[movieIndex])}
            >
              <!-- taller aspect ratio for vertical box art -->
              <div class="w-full relative">
                {#key movieIndex}
                  <img
                    src={query.data.library.latest.movies[movieIndex].image}
                    alt={query.data.library.latest.movies[movieIndex].title}
                    loading="lazy"
                    decoding="async"
                    class="w-full h-auto object-contain animate-fade-in"
                  />
                {/key}
              </div>

              <div class="p-3 bg-neutral-800/50">
                {#key movieIndex}
                  <div class="animate-slide-up">
                    <p
                      class="text-xs font-bold uppercase tracking-wider mb-0.5 line-clamp-1 text-blue-400"
                    >
                      MOVIE
                    </p>
                    <h4 class="text-white font-semibold text-sm line-clamp-1">
                      {query.data.library.latest.movies[movieIndex].title}
                    </h4>
                    <p class="text-xs text-neutral-400">
                      {query.data.library.latest.movies[movieIndex].year ||
                        "Unknown"}
                    </p>
                  </div>
                {/key}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- TV Shows Stats -->
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-88 group hover:border-purple-500/50 transition-colors relative overflow-hidden"
      >
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <h3
              class="text-purple-400 text-xs font-bold uppercase tracking-wider"
            >
              TV Shows
            </h3>
            <svg
              class="w-5 h-5 text-purple-900"
              fill="currentColor"
              viewBox="0 0 24 24"
              ><path
                d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"
              /></svg
            >
          </div>
          <p class="text-5xl font-bold text-white tracking-tight">
            {fmt(query.data.library.SeriesCount)}
          </p>
          <p class="text-sm text-purple-400/80 mt-1 font-medium">
            {fmt(query.data.library.EpisodeCount)} Episodes
          </p>
        </div>

        <!-- Latest TV Shows -->
        {#if query.data.library.latest.episodes && query.data.library.latest.episodes.length > 0}
          <div class="relative z-10 mt-6">
            <div class="flex justify-between items-end mb-3">
              <p
                class="text-[10px] text-neutral-500 uppercase font-bold tracking-widest"
              >
                Latest TV Shows
              </p>

              <!-- carousel indicators -->
              <div class="flex gap-1">
                {#each query.data.library.latest.episodes as _, i}
                  <div
                    class="h-1 rounded-full transition-all duration-300 {i ===
                    episodeIndex
                      ? 'w-4 bg-purple-500'
                      : 'w-1 bg-neutral-700'}"
                  ></div>
                {/each}
              </div>
            </div>

            <div
              class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors"
            >
              <!-- taller aspect ratio for vertical box art -->
              <div class="w-full relative">
                {#key episodeIndex}
                  <img
                    src={query.data.library.latest.episodes[episodeIndex].image}
                    alt={query.data.library.latest.episodes[episodeIndex].title}
                    loading="lazy"
                    decoding="async"
                    class="w-full h-auto object-contain animate-fade-in"
                  />
                {/key}
              </div>

              <div class="p-3 bg-neutral-800/50">
                {#key episodeIndex}
                  <div class="animate-slide-up">
                    <p
                      class="text-xs font-bold uppercase tracking-wider mb-0.5 line-clamp-1
         {query.data.library.latest.episodes[episodeIndex].type === 'Series'
                        ? 'text-green-400'
                        : 'text-purple-400'}"
                    >
                      {query.data.library.latest.episodes[episodeIndex].series}
                    </p>
                    <h4 class="text-white font-semibold text-sm line-clamp-1">
                      {query.data.library.latest.episodes[episodeIndex].title}
                    </h4>
                    <p class="text-xs text-neutral-400">
                      {new Date(
                        query.data.library.latest.episodes[episodeIndex].date,
                      ).getFullYear() || "Unknown"}
                    </p>
                  </div>
                {/key}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Music Stats -->
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-88 group hover:border-pink-500/50 transition-colors relative overflow-hidden"
      >
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <h3
              class="text-pink-400 text-xs font-bold uppercase tracking-wider"
            >
              Music
            </h3>
            <svg
              class="w-5 h-5 text-pink-900"
              fill="currentColor"
              viewBox="0 0 24 24"
              ><path
                d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
              /></svg
            >
          </div>
          <p class="text-5xl font-bold text-white tracking-tight">
            {fmt(query.data.library.SongCount)}
          </p>
          <p class="text-sm text-pink-400/80 mt-1 font-medium">
            {fmt(query.data.library.AlbumCount)} Albums
          </p>
        </div>

        <!-- Latest Music -->
        {#if query.data.library.latest.music && query.data.library.latest.music.length > 0}
          <div class="relative z-10 mt-6">
            <div class="flex justify-between items-end mb-3">
              <p
                class="text-[10px] text-neutral-500 uppercase font-bold tracking-widest"
              >
                Latest Music
              </p>

              <!-- carousel indicators -->
              <div class="flex gap-1">
                {#each query.data.library.latest.music as _, i}
                  <div
                    class="h-1 rounded-full transition-all duration-300 {i ===
                    movieIndex
                      ? 'w-4 bg-pink-500'
                      : 'w-1 bg-neutral-700'}"
                  ></div>
                {/each}
              </div>
            </div>

            <div
              class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors"
            >
              <!-- taller aspect ratio for vertical box art -->
              <div class="w-full relative">
                {#key musicIndex}
                  <img
                    src={query.data.library.latest.music[musicIndex].image}
                    alt={query.data.library.latest.music[musicIndex].title}
                    loading="lazy"
                    decoding="async"
                    class="w-full h-auto object-contain animate-fade-in"
                  />
                {/key}
              </div>

              <div class="p-3 bg-neutral-800/50">
                {#key musicIndex}
                  <div class="animate-slide-up">
                    <p
                      class="text-xs font-bold uppercase tracking-wider mb-0.5 line-clamp-1 text-pink-500"
                    >
                      {query.data.library.latest.music[musicIndex].artist}
                    </p>
                    <h4 class="text-white font-semibold text-sm line-clamp-1">
                      {query.data.library.latest.music[musicIndex].title}
                    </h4>
                    <p class="text-xs text-neutral-400">
                      {query.data.library.latest.music[musicIndex].year ||
                        "Unknown"}
                    </p>
                  </div>
                {/key}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Users Stats -->
    <div
      class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-lg"
    >
      <div
        class="p-6 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Just Browsing
          </h3>
          <span
            class="text-xs text-neutral-500 uppercase tracking-wider font-bold"
            >{query.data.recentBrowsers.length} Active</span
          >
        </div>

        {#if query.data.recentBrowsers.length === 0}
          <div
            class="h-40 flex items-center justify-center text-neutral-600 text-sm italic"
          >
            No one is browsing right now.
          </div>
        {:else}
          <ul class="space-y-4">
            {#each query.data.recentBrowsers as browser}
              <li class="flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300"
                  >
                    {browser.user.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p class="text-sm text-white font-medium">{browser.user}</p>
                    <p class="text-xs text-neutral-500">
                      Browsing on {browser.device}
                    </p>
                  </div>
                </div>
                <div
                  class="text-[10px] uppercase font-bold text-blue-500/50 group-hover:text-blue-400 transition-colors border border-blue-900/30 px-1.5 py-0.5 rounded"
                >
                  Live
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="p-6 bg-neutral-950/30">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-neutral-300 font-semibold">Users List</h3>
          <span
            class="text-xs text-neutral-500 uppercase tracking-wider font-bold"
            >{query.data.userRoster.length} Registered</span
          >
        </div>

        <div class="h-64 overflow-y-auto pr-2 custom-scrollbar">
          <ul class="space-y-1">
            {#each query.data.userRoster as user}
              <li
                class="flex items-center justify-between p-2 rounded hover:bg-neutral-800/50 transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <!-- <img 
                      src={`http://localhost:8096/Users/${user.id}/Images/Primary`} 
                      alt={user.name}
                      class="w-8 h-8 rounded-full bg-neutral-800 object-cover"
                      onerror={(e) => e.currentTarget.style.display = 'none'}
                   />  -->
                  <div class="flex flex-col">
                    <span
                      class="text-sm text-neutral-300 group-hover:text-white transition-colors"
                    >
                      {user.name}
                      {#if user.isAdmin}<span
                          class="text-[9px] ml-1 bg-red-900/50 text-red-200 px-1 rounded"
                          >ADMIN</span
                        >{/if}
                    </span>
                  </div>
                </div>

                <span
                  class="text-xs text-neutral-600 group-hover:text-neutral-400"
                >
                  Last seen: {formatDate(user.lastActive)}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    </div>

    <!-- Server Stats -->
    <footer
      class="mt-12 pt-6 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600"
    >
      <div class="flex gap-4">
        <span
          >Version: <strong class="text-neutral-400"
            >{query.data.system.version}</strong
          ></span
        >
        <span
          >OS: <strong class="text-neutral-400"
            >{query.data.system.os || "Windows"}</strong
          ></span
        >
      </div>
      <div>
        {query.data?.system?.serverName || "JNFO"} &copy; 2025
      </div>
    </footer>
  {/if}
</div>

{#if playingItem}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-10"
    transition:fade={{ duration: 200 }}
    onclick={closePlayer}
    role="dialog"
    tabindex="0"
    aria-modal="true"
  >
    <button
      class="absolute top-6 right-6 z-50 p-2 bg-neutral-800/50 hover:bg-neutral-700 text-white rounded-full transition-colors"
      onclick={closePlayer}
      aria-label="Play Button"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        ></path></svg
      >
    </button>

    <div
      class="w-full max-w-7xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-neutral-800"
      transition:scale={{ start: 0.95, duration: 200 }}
      role="document"
    >
      {#if query.data?.config}
        <video class="w-full h-full" controls autoplay playsinline>
          <source
            src={`${query.data.config.publicUrl}/Videos/${playingItem.id}/stream.mp4?static=false&api_key=${query.data.config.token}`}
            type="video/mp4"
          />
          Your browser does not support HTML5 video.
        </video>
      {/if}

      <div
        class="absolute top-0 left-0 w-full p-8 bg-gradient-to-b from-black/90 to-transparent pointer-events-none transition-opacity duration-500 hover:opacity-0"
      >
        <h2 class="text-3xl font-bold text-white drop-shadow-md">
          {playingItem.title}
        </h2>
        <p class="text-neutral-300 font-medium">{playingItem.year}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom Scrollbar for the user list to keep it sleek */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Simple Fade Animation */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(1.05);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }

  /* Text Slide Up Animation */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slideUp 0.4s ease-out forwards;
  }
</style>
