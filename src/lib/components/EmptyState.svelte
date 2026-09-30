<script lang="ts">
	import { fade } from 'svelte/transition';

	let {
		title,
		body = '',
		href = '',
		action = ''
	}: { title: string; body?: string; href?: string; action?: string } = $props();
</script>

<div
	class="rounded-card border border-dashed border-line px-6 py-12 text-center"
	in:fade={{ duration: 500 }}
>
	<p class="font-serif italic text-lg text-ink-soft">{title}</p>
	{#if body}
		<p class="mt-2 text-sm text-ink-mute">
			{body}
			{#if href && action}
				<a href={href} class="text-sage-deep underline underline-offset-2">{action}</a>
			{/if}
		</p>
	{:else if href && action}
		<p class="mt-2 text-sm text-ink-mute">
			<a href={href} class="text-sage-deep underline underline-offset-2">{action}</a>
		</p>
	{/if}
</div>
