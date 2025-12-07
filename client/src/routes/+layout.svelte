<script lang="js">
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();

  const queryClient = new QueryClient();
</script>

<svelte:head>
  <title>JNFO</title>
  <link rel="icon" href={favicon} />
  <meta
    name="description"
    content="Real-time status dashboard for any Jellyfin server"
  />
  <meta name="theme-color" content="#0a0a0a" />
</svelte:head>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
