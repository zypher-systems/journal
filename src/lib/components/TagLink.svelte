<script lang="ts">
	import { tagHref } from '$lib/tags';

	let { name, class: className = '' }: { name: string; class?: string } = $props();
</script>

<a
	href={tagHref(name)}
	class="rounded-full bg-sage-mist/70 px-2.5 py-0.5 font-mono text-[11px] text-ink-soft transition-colors duration-300 hover:bg-sage-mist hover:text-ink {className}"
>
	#{name}
</a>
