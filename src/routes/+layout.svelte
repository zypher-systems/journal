<script>
	import '../app.css';
	// Self-hosted variable fonts — bundled by Vite, no external requests.
	import '@fontsource-variable/newsreader/opsz.css';
	import '@fontsource-variable/newsreader/opsz-italic.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import Header from '$lib/components/Header.svelte';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	let { data, children } = $props();

	// The fixed formatting bar only exists on the compose screens.
	let composing = $derived(
		page.url.pathname === '/new' || /^\/entry\/[^/]+\/edit$/.test(page.url.pathname)
	);

	let footerEl = $state();

	// Bar offset (bottom-6) + bar height + gap. Same sum as .page-footer.is-composing.
	const COMPOSE_CLEARANCE_REM = 1.5 + 2.875 + 1.35;

	// If the sign-off would sit in the formatting bar, slide it up. The bar is
	// fixed, so a short entry leaves the tagline in that band until you scroll.
	$effect(() => {
		const footer = footerEl;
		if (!footer || !composing) {
			if (footer) footer.style.transform = '';
			return;
		}

		const place = () => {
			const tag = footer.querySelector('[data-tagline]');
			const rule = footer.querySelector('.rule');
			if (!tag) return;
			const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
			const limit = window.innerHeight - COMPOSE_CLEARANCE_REM * rootPx;
			const ty = new DOMMatrix(getComputedStyle(footer).transform).m42 || 0;
			const top = (rule ?? tag).getBoundingClientRect().top - ty;
			const bottom = tag.getBoundingClientRect().bottom - ty;
			const shift = top < window.innerHeight && bottom > limit ? bottom - limit : 0;
			const next = shift > 0.5 ? `translateY(${-shift}px)` : '';
			if (footer.style.transform !== next) footer.style.transform = next;
		};

		place();
		window.addEventListener('scroll', place, { passive: true });
		window.addEventListener('resize', place);
		const observed = new ResizeObserver(place);
		observed.observe(document.documentElement);
		return () => {
			window.removeEventListener('scroll', place);
			window.removeEventListener('resize', place);
			observed.disconnect();
			footer.style.transform = '';
		};
	});

	// Buttery cross-document view transitions (no-op where unsupported).
	onNavigate(() => {
		if (
			typeof document === 'undefined' ||
			!document.startViewTransition ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition(() => {
				resolve();
			});
		});
	});
</script>

<svelte:head>
	<title>journal</title>
</svelte:head>

<div class="grain wash relative min-h-dvh flex flex-col">
	{#if data.user}
		<Header user={data.user} />
	{/if}

	<main class="relative z-[1] flex-1">
		{@render children()}
	</main>

	<footer
		bind:this={footerEl}
		class="page-footer relative z-[1] px-4 pt-8 text-center text-ink-mute select-none"
		class:is-composing={composing}
	>
		{#if data.user}
			<div class="rule mx-auto mb-4 max-w-xs" aria-hidden="true">···</div>
			<span data-tagline class="font-serif italic text-sm">write often, gently</span>
		{/if}
	</footer>
</div>
