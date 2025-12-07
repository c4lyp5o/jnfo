<script lang="js">
import { createQuery } from "@tanstack/svelte-query";

const query = createQuery(() => ({
	queryKey: ["dashboard-stats"],
	queryFn: async () => {
		const res = await fetch("/api/v1/dashboard");
		if (!res.ok) throw new Error("Network error");
		return res.json();
	},
	refetchInterval: 5000,
}));

const fmt = (n) => new Intl.NumberFormat().format(n || 0);

const formatDate = (dateString) => {
	if (!dateString) return "Never";
	return new Date(dateString).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10 font-sans selection:bg-purple-500/30">
  
  <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-white mb-1">Mission Control</h1>
      <p class="text-neutral-500 text-sm">{query.data?.system?.serverName || 'Jellyfin Media Server'}</p>
    </div>
    <div class="flex items-center gap-3 bg-neutral-900/50 px-4 py-2 rounded-full border border-neutral-800">
      <div class="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] {query.isFetching ? 'bg-yellow-400 text-yellow-400' : 'bg-green-500 text-green-500'} transition-colors duration-500"></div>
      <span class="text-xs font-medium tracking-wide uppercase text-neutral-400">
        {query.isFetching ? 'Syncing...' : 'System Operational'}
      </span>
    </div>
  </header>

  {#if query.isError}
    <div class="p-6 bg-red-950/30 border border-red-500/50 rounded-xl text-red-200">System Malfunction</div>
  {:else if query.data}

    <section class="mb-12">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
        <span class="w-1 h-5 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"></span>
        Now Playing ({query.data.activeStreams.length})
      </h2>

      {#if query.data.activeStreams.length === 0}
        <div class="flex flex-col items-center justify-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed">
          <p class="text-neutral-500 font-medium">Server Idle</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {#each query.data.activeStreams as stream}
            <div class="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl group">
              <div class="absolute inset-0">
                <img src={stream.image} alt="backdrop" class="w-full h-full object-cover opacity-30 blur-sm group-hover:blur-0 group-hover:opacity-40 transition-all duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
              </div>

              <div class="relative p-6 z-10">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-white border border-neutral-600">
                      {stream.user.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p class="font-bold text-white leading-none">{stream.user}</p>
                      <p class="text-xs text-neutral-400 mt-1">{stream.device}</p>
                    </div>
                  </div>

                  <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border {stream.method === 'DirectPlay' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}">
                    {stream.method}
                  </span>
                </div>

                <h3 class="text-2xl font-bold text-white mb-6 line-clamp-1">{stream.title}</h3>

                <div class="space-y-2">
                  <div class="flex justify-between text-xs font-medium text-neutral-400">
                    <span>{stream.status}</span>
                    <span>{stream.progress}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      class="h-full {stream.status === 'Paused' ? 'bg-yellow-500' : 'bg-red-600'} transition-all duration-1000" 
                      style="width: {stream.progress}%"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
  <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-[22rem] group hover:border-blue-500/50 transition-colors relative overflow-hidden">
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-blue-400 text-xs font-bold uppercase tracking-wider">Movies</h3>
        <svg class="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
      </div>
      <p class="text-5xl font-bold text-white tracking-tight">{fmt(query.data.library.MovieCount)}</p>
      <p class="text-sm text-neutral-500 mt-1">Titles in library</p>
    </div>

    {#if query.data.library.latest.movie}
      <div class="relative z-10 mt-6">
        <p class="text-[10px] text-neutral-500 uppercase font-bold mb-3 tracking-widest">Latest Movie</p>
        
        <div class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors">
          <div class="aspect-video w-full relative">
            <img 
              src={query.data.library.latest.movie.image} 
              alt={query.data.library.latest.movie.title}
              class="w-full h-full object-cover"
            />
          </div>
          
          <div class="p-3 bg-neutral-800/50">
            <h4 class="text-white font-semibold text-sm line-clamp-1">{query.data.library.latest.movie.title}</h4>
            <p class="text-xs text-neutral-400">{query.data.library.latest.movie.year || 'Unknown Year'}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-[22rem] group hover:border-purple-500/50 transition-colors relative overflow-hidden">
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-purple-400 text-xs font-bold uppercase tracking-wider">TV Shows</h3>
        <svg class="w-5 h-5 text-purple-900" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
      </div>
      <p class="text-5xl font-bold text-white tracking-tight">{fmt(query.data.library.SeriesCount)}</p>
      <p class="text-sm text-purple-400/80 mt-1 font-medium">{fmt(query.data.library.EpisodeCount)} Episodes</p>
    </div>

    {#if query.data.library.latest.episode}
      <div class="relative z-10 mt-6">
        <p class="text-[10px] text-neutral-500 uppercase font-bold mb-3 tracking-widest">Latest Episode</p>
        
        <div class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors">
          <div class="aspect-video w-full relative">
            <img 
              src={query.data.library.latest.episode.image}
              alt={query.data.library.latest.episode.title}
              class="w-full h-full object-cover"
            />
          </div>
          
          <div class="p-3 bg-neutral-800/50">
            <h4 class="text-white font-semibold text-sm line-clamp-1">{query.data.library.latest.episode.title}</h4>
            <p class="text-xs text-neutral-400">{query.data.library.latest.episode.year}</p>
          </div>
        </div>
       
      </div>
    {/if}
  </div>

  <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-[22rem] group hover:border-pink-500/50 transition-colors relative overflow-hidden">
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-pink-400 text-xs font-bold uppercase tracking-wider">Music</h3>
        <svg class="w-5 h-5 text-pink-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
      </div>
      <p class="text-5xl font-bold text-white tracking-tight">{fmt(query.data.library.SongCount)}</p>
      <p class="text-sm text-pink-400/80 mt-1 font-medium">{fmt(query.data.library.AlbumCount)} Albums</p>
    </div>

    {#if query.data.library.latest.music}
      <div class="relative z-10 mt-6">
        <p class="text-[10px] text-neutral-500 uppercase font-bold mb-3 tracking-widest">Latest Music</p>

        <div class="bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-neutral-600 transition-colors">
          <div class="aspect-video w-full relative">
            <img 
              src={query.data.library.latest.music.image} 
              alt={query.data.library.latest.music.title}
              class="w-full h-full object-cover"
            />
          </div>
          
          <div class="p-3 bg-neutral-800/50">
            <h4 class="text-white font-semibold text-sm line-clamp-1">{query.data.library.latest.music.title}</h4>
            <p class="text-xs text-neutral-400">{query.data.library.latest.music.artist}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  </div>

    <div class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-lg">
      
      <div class="p-6 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Just Browsing
          </h3>
          <span class="text-xs text-neutral-500 uppercase tracking-wider font-bold">{query.data.recentBrowsers.length} Active</span>
        </div>

        {#if query.data.recentBrowsers.length === 0}
          <div class="h-40 flex items-center justify-center text-neutral-600 text-sm italic">
            No one is browsing right now.
          </div>
        {:else}
          <ul class="space-y-4">
            {#each query.data.recentBrowsers as browser}
              <li class="flex items-center justify-between group">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                    {browser.user.slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <p class="text-sm text-white font-medium">{browser.user}</p>
                    <p class="text-xs text-neutral-500">Browsing on {browser.device}</p>
                  </div>
                </div>
                <div class="text-[10px] uppercase font-bold text-blue-500/50 group-hover:text-blue-400 transition-colors border border-blue-900/30 px-1.5 py-0.5 rounded">
                  Live
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="p-6 bg-neutral-950/30">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-neutral-300 font-semibold">User Roster</h3>
          <span class="text-xs text-neutral-500 uppercase tracking-wider font-bold">{query.data.userRoster.length} Registered</span>
        </div>

        <div class="h-64 overflow-y-auto pr-2 custom-scrollbar">
          <ul class="space-y-1">
            {#each query.data.userRoster as user}
              <li class="flex items-center justify-between p-2 rounded hover:bg-neutral-800/50 transition-colors group">
                <div class="flex items-center gap-3">
                   <!-- <img 
                      src={`http://localhost:8096/Users/${user.id}/Images/Primary`} 
                      alt={user.name}
                      class="w-8 h-8 rounded-full bg-neutral-800 object-cover"
                      onerror={(e) => e.currentTarget.style.display = 'none'}
                   />  -->
                   <div class="flex flex-col">
                      <span class="text-sm text-neutral-300 group-hover:text-white transition-colors">
                        {user.name} 
                        {#if user.isAdmin}<span class="text-[9px] ml-1 bg-red-900/50 text-red-200 px-1 rounded">ADMIN</span>{/if}
                      </span>
                   </div>
                </div>
                
                <span class="text-xs text-neutral-600 group-hover:text-neutral-400">
                  {formatDate(user.lastActive)}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </div>

    </div>

    <footer class="mt-12 pt-6 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-600">
        <div class="flex gap-4">
            <span>Version: <strong class="text-neutral-400">{query.data.system.version}</strong></span>
            <span>OS: <strong class="text-neutral-400">{query.data.system.os || "Windows"}</strong></span>
        </div>
        <div>
            {query.data?.system?.serverName || 'JNFO'} &copy; 2025
        </div>
    </footer>

  {/if}
</div>

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
</style>