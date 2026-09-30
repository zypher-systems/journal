<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { formatLong, formatWords } from '$lib/dates';
	import { enhance } from '$app/forms';
	import TagLink from '$lib/components/TagLink.svelte';

	let { data } = $props();

	let confirming = $state(false);
</script>

<svelte:head>
	<title>journal · {data.entry.title ?? formatLong(data.entry.entryDate)}</title>
</svelte:head>

<article
	class="mx-auto max-w-3xl px-4 pt-8 sm:px-6"
	in:fly={{ y: 14, duration: 500 }}
	style="view-transition-name: entry-{data.entry.id}"
>
	<div class="flex flex-wrap items-center justify-between gap-3" in:fade={{ duration: 500, delay: 100 }}>
		<a href="/" class="rounded-full px-2 py-1 text-sm text-ink-mute transition-colors duration-300 hover:text-sage-deep">
			← journal
		</a>

		<div class="flex items-center gap-2">
			{#if confirming}
			<form
				method="POST"
				action="?/delete"
				use:enhance
				class="flex items-center gap-2"
				out:fade={{ duration: 150 }}
			>
				<span class="text-xs text-clay">delete this entry?</span>
				<button type="submit" class="rounded-full bg-clay/15 px-3 py-1.5 text-xs font-medium text-clay transition-colors hover:bg-clay/25">
					yes, delete
				</button>
			</form>
			{/if}
			<button
				type="button"
				onclick={() => (confirming = !confirming)}
				class="rounded-full px-2.5 py-1.5 text-xs text-ink-mute transition-colors duration-300 hover:text-clay"
				aria-label="Delete entry"
			>
				delete
			</button>
			<a
				href="/entry/{data.entry.id}/edit"
				class="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft transition-all duration-300
					hover:border-sage hover:text-sage-deep hover:shadow-soft"
			>
				Edit
			</a>
		</div>
	</div>

	<header class="glow mt-6">
		<p class="font-mono text-[11px] tracking-[0.12em] text-ink-mute uppercase tabular">
			{formatLong(data.entry.entryDate)}
			<span class="mx-1.5 text-line">·</span>
			{formatWords(data.entry.wordCount)}
		</p>
		{#if data.entry.title}
			<h1
				class="font-serif mt-3 text-4xl text-ink"
				style="font-variation-settings: 'opsz' 72; letter-spacing: -0.015em; line-height: 1.15;"
			>
				{data.entry.title}
			</h1>
		{/if}
		<div class="rule mt-5 max-w-sm" aria-hidden="true">···</div>
		{#if data.tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-1.5">
				{#each data.tags as tag (tag)}
					<TagLink name={tag} />
				{/each}
			</div>
		{/if}
	</header>

	<div class="prose-entry is-reading mt-10">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- content is rendered from our own editor's sanitized schema -->
		{@html data.html}
	</div>
</article>
