<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	let { form, data } = $props();
	let email = $state(form?.email ?? '');

	const motion = (d: number) =>
		window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: d };
</script>

<svelte:head>
	<title>journal · sign in</title>
</svelte:head>

<div class="relative flex min-h-dvh flex-col items-center justify-center px-4">
	<!-- sage glow -->
	<div
		class="pointer-events-none absolute inset-0 -z-10"
		style="background: radial-gradient(38rem 26rem at 50% 30%, var(--glow), transparent 70%)"
	></div>

	<div
		class="w-full max-w-sm"
		in:fade={motion(700)}
	>
		<div class="mb-10 text-center" in:fly={{ y: 10, duration: 500, delay: 80 }}>
			<p class="font-serif italic text-sage-deep" style="font-variation-settings: 'opsz' 60; font-size: 1.05rem">a quiet place to write</p>
			<h1 class="font-serif italic tracking-tight text-ink" style="font-variation-settings: 'opsz' 72; font-size: 3.25rem; line-height: 1.1">
				journal<span class="text-sage">.</span>
			</h1>
			<div class="rule mx-auto mt-5 max-w-[12rem]" aria-hidden="true">···</div>
		</div>

		<form method="POST" class="glass shadow-soft rounded-card space-y-4 p-6" in:fly={{ y: 14, duration: 550, delay: 160 }}>
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

			<label class="block">
				<span class="mb-1.5 block text-sm font-medium text-ink-soft">Email</span>
				<input
					type="email"
					name="email"
					autocomplete="email"
					required
					bind:value={email}
					class="w-full rounded-soft border border-line bg-raised px-3.5 py-2.5 text-ink transition-colors duration-300
						placeholder:text-ink-mute/70 focus:border-sage focus:outline-none"
					placeholder="you@example.com"
				/>
			</label>

			<label class="block">
				<span class="mb-1.5 block text-sm font-medium text-ink-soft">Password</span>
				<input
					type="password"
					name="password"
					autocomplete="current-password"
					required
					class="w-full rounded-soft border border-line bg-raised px-3.5 py-2.5 text-ink transition-colors duration-300
						placeholder:text-ink-mute/70 focus:border-sage focus:outline-none"
					placeholder="••••••••"
				/>
			</label>

			{#if form?.error}
				<p class="rounded-soft bg-clay/10 px-3 py-2 text-sm text-clay" transition:fade={{ duration: 250 }}>
					{form.error}
				</p>
			{/if}

			<button
				type="submit"
				class="w-full rounded-full bg-sage-deep px-4 py-2.5 font-medium text-paper transition-all duration-300
					hover:bg-sage-deep/90 hover:shadow-soft active:scale-[0.98]"
			>
				Sign in
			</button>
		</form>

		<p class="mt-6 text-center text-xs text-ink-mute" in:fly={{ y: 10, duration: 500, delay: 260 }}>
			Accounts are created by your journal's admin.
		</p>
	</div>
</div>
