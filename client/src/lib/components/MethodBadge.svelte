<script lang="js">
  export let method;

  const styles = {
    DirectPlay: "bg-green-500/20 text-green-400 border-green-500/30",
    DirectStream: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Transcode: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  // fallback if unknown
  let cls =
    styles[method] ?? "bg-neutral-700 text-neutral-300 border-neutral-600";
</script>

<span
  class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border {cls}"
>
  {method}
</span>
