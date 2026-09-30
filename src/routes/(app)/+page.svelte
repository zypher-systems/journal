<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Heatmap from '$lib/components/Heatmap.svelte';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TagLink from '$lib/components/TagLink.svelte';
	import { formatLong, greeting } from '$lib/dates';

	let { data } = $props();

	const moreHref = data.timeline.nextCursor
		? `/?before=${data.timeline.nextCursor.entryDate}&beforeCreated=${encodeURIComponent(
				data.timeline.nextCursor.createdAt
			)}`
		: null;
</script>

<svelte:head>
	<title>journal</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
	<!-- Greeting — date is the page -->
	<section in:fly={{ y: 12, duration: 550 }}>
		<p class="font-mono text-[11px] tracking-[0.16em] text-ink-mute uppercase">
			{greeting()}, {data.user?.name}
		</p>
		<h1
			class="font-serif mt-2 text-4xl leading-[1.15] text-ink sm:text-5xl"
			style="font-variation-settings: 'opsz' 72; letter-spacing: -0.02em;"
		>
			{formatLong(data.today)}
		</h1>
		<div class="rule mt-6 max-w-md" aria-hidden="true">···</div>
	</section>

	<!-- Stats as a margin note + heatmap -->
	<section class="mt-8" in:fly={{ y: 12, duration: 550, delay: 80 }}>
		<p class="mb-4 font-serif text-[15px] italic leading-relaxed text-ink-mute">
			<span class="text-sage-deep not-italic tabular">{data.stats.currentStreak}</span>
			day streak
			<span class="mx-2 text-line">·</span>
			<span class="tabular text-ink-soft">{data.stats.totalEntries}</span>
			entries
			<span class="mx-2 text-line">·</span>
			<span class="tabular text-ink-soft">{data.stats.totalWords.toLocaleString()}</span>
			words
			<span class="mx-2 text-line">·</span>
			longest
			<span class="tabular">{data.stats.longestStreak}</span>
		</p>
		<div class="rounded-card border border-line-soft/80 bg-raised/40 px-4 py-4 sm:px-5">
			<Heatmap days={data.days} today={data.today} />
		</div>
	</section>

	<!-- Prompt — slip of paper, not another card -->
	<section class="mt-10" in:fly={{ y: 12, duration: 550, delay: 140 }}>
		<a
			href="/new"
			class="group glow relative block px-1 py-2 transition-colors duration-500"
		>
			<p class="font-mono text-[11px] tracking-[0.16em] text-sage-deep uppercase">today's prompt</p>
			<p
				class="font-serif mt-2 text-xl italic leading-snug text-ink sm:text-[1.35rem]"
				style="font-variation-settings: 'opsz' 48;"
			>
				{data.prompt}
			</p>
			<p class="mt-3 text-sm text-ink-mute transition-colors duration-300 group-hover:text-sage-deep">
				Write with this prompt →
			</p>
		</a>
	</section>

	<div class="rule my-10" aria-hidden="true">···</div>

	<!-- Timeline -->
	{#if data.tags.length > 0}
		<section in:fly={{ y: 10, duration: 500, delay: 200 }}>
			<div class="flex flex-wrap gap-1.5">
				{#each data.tags as tag (tag)}
					<TagLink name={tag} class="px-2.5 py-1" />
				{/each}
			</div>
		</section>
	{/if}

	<section class="mt-8">
		<h2 class="font-mono text-[11px] tracking-[0.16em] text-ink-mute uppercase mb-5">entries</h2>

		{#if data.timeline.items.length === 0}
			<EmptyState
				title="Your pages are still blank."
				body="The first one is the hardest. A prompt is waiting above, or start from a quiet page."
				href="/new"
				action="Begin →"
			/>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.timeline.items as item (item.entry.id)}
					<EntryCard {item} />
				{/each}
			</div>

			{#if moreHref}
				<div class="mt-8 text-center" in:fade={{ duration: 400 }}>
					<a
						href={moreHref}
						class="inline-block rounded-full border border-line px-5 py-2 text-sm text-ink-soft transition-all duration-300
							hover:border-sage hover:text-sage-deep hover:shadow-soft"
					>
						Older entries
					</a>
				</div>
			{/if}
		{/if}
	</section>
</div>
