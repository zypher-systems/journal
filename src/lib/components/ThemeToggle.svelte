<script lang="ts">
	type Theme = 'system' | 'light' | 'dark';

	let { initial = 'system' }: { initial?: string } = $props();

	let current = $state<Theme>('system');

	function asTheme(value: string | null | undefined): Theme {
		return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
	}

	$effect(() => {
		current = asTheme(localStorage.getItem('journal-theme') ?? initial);
	});

	const labels: Record<string, string> = {
		system: 'System theme',
		light: 'Light theme',
		dark: 'Dark theme'
	};

	function apply(theme: 'system' | 'light' | 'dark') {
		localStorage.setItem('journal-theme', theme);
		document.cookie = `journal-theme=${encodeURIComponent(theme)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		const dark =
			theme === 'dark' ||
			(theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', dark);
	}

	function cycle() {
		const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
		const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system';
		current = next;
		apply(next);
		// Persist quietly; failing is non-fatal.
		void fetch('/api/preferences', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ theme: next })
		}).catch(() => {});
	}
</script>

<button
	type="button"
	onclick={cycle}
	aria-label={labels[current]}
	title={labels[current]}
	class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-all duration-300
		hover:bg-sage-mist/60 hover:text-ink active:scale-95"
>
	{#if current === 'light'}
		<!-- sun -->
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	{:else if current === 'dark'}
		<!-- moon -->
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{:else}
		<!-- half sun (system) -->
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2" />
		</svg>
	{/if}
</button>
