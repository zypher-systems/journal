<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import ThemeToggle from './ThemeToggle.svelte';

	let { user } = $props<{ user: { name: string; role: string; themePreference?: string } }>();

	const nav = [
		{ href: '/', label: 'Journal' },
		{ href: '/search', label: 'Search' }
	];

	const isAdmin = $derived(user.role === 'admin');
	let menuOpen = $state(false);

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<svelte:window
	onclick={(e) => {
		if (menuOpen && !(e.target instanceof Element && e.target.closest('[data-nav-menu]'))) {
			menuOpen = false;
		}
	}}
/>

<header
	class="sticky top-0 z-40 glass border-x-0 border-t-0 border-b border-line-soft"
	in:fade
>
	<div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5 sm:px-6">
		<a
			href="/"
			class="group mr-1 font-serif text-2xl italic tracking-tight text-ink transition-colors duration-300 hover:text-sage-deep"
			style="font-variation-settings: 'opsz' 50;"
		>
			journal<span class="text-sage transition-opacity duration-300 group-hover:opacity-100 opacity-70">.</span>
		</a>

		<nav class="ml-2 hidden items-center gap-1 sm:flex" aria-label="Primary">
			{#each nav as item (item.href)}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					class="rounded-full px-3 py-1.5 text-sm transition-all duration-300
						{active
							? 'bg-sage-mist font-medium text-ink'
							: 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'}"
				>
					{item.label}
				</a>
			{/each}
			{#if isAdmin}
				{@const active = page.url.pathname.startsWith('/admin')}
				<a
					href="/admin"
					class="rounded-full px-3 py-1.5 text-sm transition-all duration-300
						{active
							? 'bg-sage-mist font-medium text-ink'
							: 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'}"
				>
					People
				</a>
			{/if}
		</nav>

		<div class="ml-auto flex items-center gap-1.5">
			<div class="relative sm:hidden" data-nav-menu>
				<button
					type="button"
					class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-all duration-300 hover:bg-sage-mist/60 hover:text-ink active:scale-95"
					aria-label="Open menu"
					aria-expanded={menuOpen}
					aria-controls="mobile-nav"
					onclick={(e) => {
						e.stopPropagation();
						menuOpen = !menuOpen;
					}}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
						<path d="M4 7h16M4 12h16M4 17h16" />
					</svg>
				</button>
				{#if menuOpen}
					<nav
						id="mobile-nav"
						class="shadow-soft absolute top-full right-0 z-50 mt-2 min-w-40 rounded-card border border-line-soft bg-raised/95 p-1.5"
						aria-label="Primary"
						in:fade={{ duration: 120 }}
					>
						{#each nav as item (item.href)}
							<a
								href={item.href}
								onclick={closeMenu}
								class="block rounded-soft px-3 py-2 text-sm transition-colors
									{isActive(item.href) ? 'bg-sage-mist font-medium text-ink' : 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'}"
							>
								{item.label}
							</a>
						{/each}
						{#if isAdmin}
							<a
								href="/admin"
								onclick={closeMenu}
								class="block rounded-soft px-3 py-2 text-sm transition-colors
									{page.url.pathname.startsWith('/admin')
										? 'bg-sage-mist font-medium text-ink'
										: 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'}"
							>
								People
							</a>
						{/if}
					</nav>
				{/if}
			</div>

			<ThemeToggle initial={user.themePreference} />

			<a
				href="/new"
				class="group flex items-center gap-1.5 rounded-full bg-sage-deep px-3.5 py-1.5 text-sm font-medium text-paper transition-all duration-300
					hover:bg-sage-deep/90 hover:shadow-soft active:scale-95"
				aria-label="Write a new entry"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M12 20h9" />
					<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
				</svg>
				<span class="hidden sm:inline">Write</span>
			</a>

			<a
				href="/settings"
				class="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-all duration-300 hover:bg-sage-mist/60 hover:text-ink active:scale-95"
				aria-label="Settings"
			>
				<span class="font-serif text-base font-medium" style="font-variation-settings: 'opsz' 50;" title={user.name}>
					{user.name.trim().charAt(0).toUpperCase()}
				</span>
			</a>

			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex h-8 w-8 items-center justify-center rounded-full text-ink-mute transition-all duration-300 hover:bg-sage-mist/60 hover:text-ink active:scale-95"
					aria-label="Sign out"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<path d="m16 17 5-5-5-5" />
						<path d="M21 12H9" />
					</svg>
				</button>
			</form>
		</div>
	</div>
</header>
