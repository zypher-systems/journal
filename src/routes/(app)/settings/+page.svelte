<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let name = $state(data.user.name);
</script>

<svelte:head>
	<title>journal · settings</title>
</svelte:head>

<div class="mx-auto max-w-xl px-4 pt-10 sm:px-6" in:fly={{ y: 10, duration: 400 }}>
	<h1 class="font-serif text-3xl text-ink" style="font-variation-settings: 'opsz' 60;">Settings</h1>

	<!-- profile -->
	<section class="mt-8" in:fly={{ y: 10, duration: 400, delay: 60 }}>
		<h2 class="font-mono text-xs tracking-wide text-ink-mute uppercase">profile</h2>
		<form
			method="POST"
			action="?/profile"
			use:enhance
			class="shadow-soft mt-3 space-y-4 rounded-card border border-line-soft bg-raised/80 p-5"
		>
			<label class="block">
				<span class="mb-1.5 block text-sm text-ink-soft">Name</span>
				<input
					bind:value={name}
					name="name"
					class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink transition-colors focus:border-sage focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-ink-soft">Email</span>
				<input
					value={data.user.email}
					disabled
					class="w-full cursor-not-allowed rounded-soft border border-line bg-sunken px-3.5 py-2.5 text-ink-mute"
				/>
			</label>
			<div class="flex items-center justify-end gap-3">
				{#if form?.section === 'profile' && form?.success}
					<span class="text-xs text-sage-deep" in:fade={{ duration: 300 }}>saved</span>
				{/if}
				<button type="submit" class="rounded-full bg-sage-deep px-4 py-2 text-sm font-medium text-paper transition-all duration-300 hover:bg-sage-deep/90 active:scale-95">
					Save
				</button>
			</div>
		</form>
	</section>

	<!-- password -->
	<section class="mt-8" in:fly={{ y: 10, duration: 400, delay: 120 }}>
		<h2 class="font-mono text-xs tracking-wide text-ink-mute uppercase">change password</h2>
		<form
			method="POST"
			action="?/password"
			use:enhance
			class="shadow-soft mt-3 space-y-4 rounded-card border border-line-soft bg-raised/80 p-5"
		>
			<label class="block">
				<span class="mb-1.5 block text-sm text-ink-soft">Current password</span>
				<input
					type="password"
					name="current"
					autocomplete="current-password"
					required
					class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-sage focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm text-ink-soft">New password</span>
				<input
					type="password"
					name="next"
					autocomplete="new-password"
					required
					minlength="8"
					class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-sage focus:outline-none"
				/>
			</label>
			{#if form?.section === 'password' && form?.error}
				<p class="rounded-soft bg-clay/10 px-3 py-2 text-sm text-clay" in:fade={{ duration: 250 }}>{form.error}</p>
			{:else if form?.section === 'password' && form?.success}
				<p class="rounded-soft bg-sage-mist px-3 py-2 text-sm text-sage-deep" in:fade={{ duration: 250 }}>password updated</p>
			{/if}
			<div class="flex justify-end">
				<button type="submit" class="rounded-full border border-line px-4 py-2 text-sm text-ink-soft transition-all duration-300 hover:border-sage hover:text-sage-deep">
					Update password
				</button>
			</div>
		</form>
	</section>

	<!-- data -->
	<section class="mt-8" in:fly={{ y: 10, duration: 400, delay: 180 }}>
		<h2 class="font-mono text-xs tracking-wide text-ink-mute uppercase">your data</h2>
		<div class="shadow-soft mt-3 flex items-center justify-between rounded-card border border-line-soft bg-raised/80 p-5">
			<div>
				<p class="text-sm text-ink">Export everything</p>
				<p class="mt-0.5 text-xs text-ink-mute">All your entries as Markdown, in one zip.</p>
			</div>
			<a
				href="/api/export"
				class="rounded-full border border-line px-4 py-2 text-sm text-ink-soft transition-all duration-300 hover:border-sage hover:text-sage-deep"
			>
				Download
			</a>
		</div>
	</section>
</div>
