<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { formatMedium } from '$lib/dates';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data } = $props();

	let q = $state(data.q);
</script>

<svelte:head>
	<title>journal · search</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-10 sm:px-6" in:fly={{ y: 10, duration: 400 }}>
	<h1 class="font-serif text-3xl text-ink" style="font-variation-settings: 'opsz' 60;">Search</h1>

	<form method="GET" class="mt-6">
		<div class="glass shadow-soft flex items-center gap-2 rounded-full px-4 py-2.5 transition-shadow duration-300 focus-within:shadow-soft">
			<svg class="h-4 w-4 shrink-0 text-ink-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="11" cy="11" r="7" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="search"
				name="q"
				bind:value={q}
				placeholder="search your entries…"
				autocomplete="off"
				class="w-full bg-transparent text-ink placeholder:text-ink-mute/70 focus:outline-none"
			/>
			{#if data.q}
				<a href="/search" class="shrink-0 text-xs text-ink-mute transition-colors hover:text-ink">clear</a>
			{/if}
		</div>
	</form>

	{#if data.q}
		<p class="mt-6 font-mono text-[11px] text-ink-mute">
			{data.results.length === 0 ? 'no' : data.results.length} result{data.results.length === 1 ? '' : 's'} for
			<span class="text-ink-soft">“{data.q}”</span>
		</p>

		{#if data.results.length === 0}
			<div class="mt-4">
				<EmptyState
					title="Nothing matched."
					body="Try a different word, or a name you used in a title."
				/>
			</div>
		{:else}
			<div class="mt-4 space-y-4">
				{#each data.results as r, i (r.entry.id)}
					<a
						href="/entry/{r.entry.id}"
						class="shadow-soft block rounded-card border border-line-soft bg-raised/80 px-5 py-4 transition-all duration-500 hover:border-sage/40"
						in:fly={{ y: 12, duration: 400, delay: Math.min(i * 60, 300) }}
					>
						<div class="flex items-baseline justify-between gap-3">
							<h2 class="font-serif text-base text-ink" style="font-variation-settings: 'opsz' 40;">
								{#if r.entry.title}{r.entry.title}{:else}<span class="italic text-ink-soft">an untitled entry</span>{/if}
							</h2>
							<span class="font-mono text-[10px] whitespace-nowrap text-ink-mute tabular">{formatMedium(r.entry.entryDate)}</span>
						</div>
						<p class="search-snippet font-serif mt-1.5 text-[15px] leading-relaxed text-ink-soft">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped in searchEntries; only <mark> tags remain -->
							{@html r.snippet}
						</p>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<p class="mt-8 text-center font-serif text-sm italic text-ink-mute" in:fade={{ duration: 600 }}>
			Search everything you've ever written here.
		</p>
	{/if}
</div>
