<script lang="ts">
	import { fly } from 'svelte/transition';
	import { formatLong } from '$lib/dates';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>journal · {formatLong(data.date)}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6" in:fly={{ y: 12, duration: 450 }}>
	<a href="/" class="rounded-full px-2 py-1 text-sm text-ink-mute transition-colors duration-300 hover:text-sage-deep">
		← journal
	</a>

	<h1 class="font-serif mt-4 text-2xl text-ink" style="font-variation-settings: 'opsz' 60;">
		{formatLong(data.date)}
	</h1>

	{#if data.items.length === 0}
		<div class="mt-10">
			<EmptyState
				title="Nothing was written this day."
				body="The page is still waiting."
				href="/new"
				action="Write now →"
			/>
		</div>
	{:else}
		<div class="mt-8 grid gap-4 sm:grid-cols-2">
			{#each data.items as item (item.entry.id)}
				<EntryCard {item} />
			{/each}
		</div>
	{/if}
</div>
