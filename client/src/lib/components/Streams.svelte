<script lang="js">
  import MethodBadge from "./MethodBadge.svelte";
  import { clamp } from "../utils/format";

  let { stream } = $props();
</script>

<div
  class="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl group"
>
  <!-- Background image -->
  <div class="absolute inset-0">
    <img
      src={stream.image}
      alt={stream.title}
      loading="lazy"
      decoding="async"
      class="w-full h-full object-cover opacity-30 blur-sm group-hover:blur-0 group-hover:opacity-40 transition-all duration-700 will-change-[opacity,filter]"
    />
    <div
      class="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/80 to-transparent"
    ></div>
  </div>

  <div class="relative p-6 z-10">
    <!-- User + Method -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-white border border-neutral-600 shadow-md"
        >
          {stream.user.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p class="font-bold text-white leading-none text-sm">{stream.user}</p>
          <p class="text-xs text-neutral-400 mt-1 max-w-72">{stream.device}</p>
        </div>
      </div>
      <MethodBadge method={stream.method} />
    </div>

    <!-- Title + Type Info -->
    <div class="mb-6">
      <h3
        class="text-xl md:text-2xl font-bold text-white line-clamp-1"
        title={stream.title}
      >
        {stream.title}
      </h3>

      {#if stream.type === "Episode"}
        <div class="flex items-center gap-2 mt-1">
          <svg
            class="w-4 h-4 text-purple-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p class="text-sm text-neutral-400 line-clamp-1">
            {stream.seriesName}
          </p>
        </div>
      {:else if stream.type === "Audio"}
        <div class="flex items-center gap-2 mt-1">
          <svg
            class="w-4 h-4 text-pink-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
            />
          </svg>
          <p class="text-sm text-neutral-400 line-clamp-1">
            {stream.artistName} • {stream.albumName}
          </p>
        </div>
      {:else}
        <p class="text-sm text-neutral-500 mt-1">{stream.year || "Movie"}</p>
      {/if}
    </div>

    <!-- Progress -->
    <div class="space-y-2">
      <div
        class="flex justify-between text-xs font-medium text-neutral-400 font-mono"
      >
        <span>{stream.status}</span>
        <span>{stream.currentTicks} / {stream.totalTicks}</span>
      </div>
      <div class="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
        <div
          class="h-full {stream.status === 'Paused'
            ? 'bg-yellow-500'
            : 'bg-red-600'} transition-all duration-1000 ease-out"
          style="width: {clamp(stream.progress)}%"
        ></div>
      </div>
    </div>
  </div>
</div>
