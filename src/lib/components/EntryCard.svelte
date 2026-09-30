<script lang="ts">
	import { formatMedium } from '$lib/dates';
	import TagLink from './TagLink.svelte';

	let { item }: { item: { entry: { id: string; title: string | null; entryDate: string; wordCount: number; plainText: string }; tags: string[] } } = $props();
</script>

<article
	class="entry-leaf group rounded-card border border-line-soft p-5 transition-all duration-500
		hover:-translate-y-0.5 hover:border-sage/40"
	style="view-transition-name: entry-{item.entry.id}"
>
	<p class="font-mono text-[10px] tracking-[0.12em] text-ink-mute uppercase tabular">
		{formatMedium(item.entry.entryDate)}
		<span class="mx-1.5 text-line">·</span>
		{item.entry.wordCount}w
	</p>

	<a href="/entry/{item.entry.id}" class="mt-2 block">
		<h3
			class="font-serif text-lg text-ink transition-colors duration-300 group-hover:text-sage-deep"
			style="font-variation-settings: 'opsz' 40;"
		>
			{#if item.entry.title}
				{item.entry.title}
			{:else}
				<span class="text-ink-soft italic">{formatMedium(item.entry.entryDate)}</span>
			{/if}
		</h3>

		<p class="mt-2 line-clamp-3 font-serif text-[15px] leading-relaxed text-ink-soft">
			{item.entry.plainText.split('\n')[0]?.slice(0, 200) || '(empty entry)'}
		</p>
	</a>

	{#if item.tags.length > 0}
		<div class="mt-3.5 flex min-w-0 flex-wrap gap-1.5">
			{#each item.tags.slice(0, 3) as tag (tag)}
				<TagLink name={tag} class="px-2 text-[10px]" />
			{/each}
			{#if item.tags.length > 3}
				<span class="font-mono text-[10px] text-ink-mute">+{item.tags.length - 3}</span>
			{/if}
		</div>
	{/if}
</article>
