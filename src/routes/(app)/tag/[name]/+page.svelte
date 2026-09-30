<script lang="ts">
	import { fly } from 'svelte/transition';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>journal · #{data.name}</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6" in:fly={{ y: 12, duration: 450 }}>
	<a href="/" class="rounded-full px-2 py-1 text-sm text-ink-mute transition-colors duration-300 hover:text-sage-deep">
		← journal
	</a>

	<p class="font-mono mt-4 text-xs tracking-wide text-ink-mute uppercase">tag</p>
	<h1 class="font-serif mt-1 text-3xl text-ink" style="font-variation-settings: 'opsz' 60;">
		#{data.name}
	</h1>
	<p class="font-mono mt-2 text-[11px] text-ink-mute">
		{data.items.length === 0 ? 'no' : data.items.length}
		{data.items.length === 1 ? 'entry' : 'entries'}
	</p>

	<section class="mt-8">
		{#if data.items.length === 0}
			<EmptyState
				title="Nothing carries this tag yet."
				body="Write something and add it, or pick another tag from home."
				href="/new"
				action="Write →"
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.items as item (item.entry.id)}
					<EntryCard {item} />
				{/each}
			</div>
		{/if}
	</section>
</div>
