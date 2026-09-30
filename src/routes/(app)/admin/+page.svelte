<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let resetFor = $state<string | null>(null);
	let resetPassword = $state('');
</script>

<svelte:head>
	<title>journal · people</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-10 sm:px-6" in:fly={{ y: 10, duration: 400 }}>
	<h1 class="font-serif text-3xl text-ink" style="font-variation-settings: 'opsz' 60;">People</h1>
	<p class="mt-2 text-sm text-ink-mute">Invite-only: create accounts for the people you write alongside.</p>

	<!-- create -->
	<section class="mt-8" in:fly={{ y: 10, duration: 400, delay: 60 }}>
		<h2 class="font-mono text-xs tracking-wide text-ink-mute uppercase">add someone</h2>
		<form
			method="POST"
			action="?/create"
			use:enhance
			class="shadow-soft mt-3 space-y-4 rounded-card border border-line-soft bg-raised/80 p-5"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1.5 block text-sm text-ink-soft">Name</span>
					<input name="name" required class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-sage focus:outline-none" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm text-ink-soft">Email</span>
					<input type="email" name="email" required class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-sage focus:outline-none" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm text-ink-soft">Temporary password</span>
					<input type="text" name="password" required minlength="8" autocomplete="off" class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink focus:border-sage focus:outline-none" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm text-ink-soft">Role</span>
					<select name="role" class="w-full rounded-soft border border-line bg-paper px-3.5 py-2.5 text-ink focus:border-sage focus:outline-none">
						<option value="member" selected>Member</option>
						<option value="admin">Admin</option>
					</select>
				</label>
			</div>
			{#if form?.section === 'create' && form?.error}
				<p class="rounded-soft bg-clay/10 px-3 py-2 text-sm text-clay" in:fade={{ duration: 250 }}>{form.error}</p>
			{:else if form?.section === 'create' && form?.success}
				<p class="rounded-soft bg-sage-mist px-3 py-2 text-sm text-sage-deep" in:fade={{ duration: 250 }}>account created — share the temporary password privately</p>
			{/if}
			<div class="flex justify-end">
				<button type="submit" class="rounded-full bg-sage-deep px-4 py-2 text-sm font-medium text-paper transition-all duration-300 hover:bg-sage-deep/90 active:scale-95">
					Create account
				</button>
			</div>
		</form>
	</section>

	<!-- roster -->
	<section class="mt-10" in:fly={{ y: 10, duration: 400, delay: 120 }}>
		<h2 class="font-mono text-xs tracking-wide text-ink-mute uppercase">everyone</h2>
		<div class="mt-3 space-y-3">
			{#each data.users as user, i (user.id)}
				<div
					class="shadow-soft flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line-soft bg-raised/80 px-5 py-4
						{user.deactivated ? 'opacity-55' : ''}"
					in:fly={{ y: 12, duration: 400, delay: Math.min(i * 60, 300) }}
				>
					<span class="font-serif flex h-9 w-9 items-center justify-center rounded-full bg-sage-mist text-sm font-medium text-ink">
						{user.name.charAt(0).toUpperCase()}
					</span>
					<div class="min-w-0 flex-1">
						<p class="text-sm text-ink">
							{user.name}
							{#if user.role === 'admin'}
								<span class="ml-1 rounded-full bg-sage-mist px-2 py-0.5 font-mono text-[10px] text-sage-deep">admin</span>
							{/if}
						</p>
						<p class="truncate text-xs text-ink-mute">{user.email} · {user.entryCount} {user.entryCount === 1 ? 'entry' : 'entries'}</p>
					</div>

					<div class="flex items-center gap-2">
						{#if resetFor === user.id}
							<form
								method="POST"
								action="?/reset"
								use:enhance
								class="flex items-center gap-2"
								out:fade={{ duration: 150 }}
							>
								<input type="hidden" name="id" value={user.id} />
								<input
									type="text"
									name="password"
									bind:value={resetPassword}
									placeholder="new password"
									autocomplete="off"
									minlength="8"
									class="w-40 rounded-full border border-line bg-paper px-3 py-1.5 font-mono text-xs text-ink focus:border-sage focus:outline-none"
								/>
								<button type="submit" class="rounded-full bg-sage-deep px-3 py-1.5 text-xs text-paper">set</button>
								<button type="button" onclick={() => (resetFor = null)} class="text-xs text-ink-mute hover:text-ink">cancel</button>
							</form>
						{:else}
							<button
								type="button"
								onclick={() => { resetFor = user.id; resetPassword = ''; }}
								class="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-sage hover:text-sage-deep"
							>
								reset password
							</button>
						{/if}

						{#if user.id !== data.user?.id}
							<form method="POST" action="?/toggle" use:enhance>
								<input type="hidden" name="id" value={user.id} />
								<button
									type="submit"
									class="rounded-full px-3 py-1.5 text-xs transition-colors
										{user.deactivated ? 'text-sage-deep hover:bg-sage-mist/60' : 'text-clay hover:bg-clay/10'}"
								>
									{user.deactivated ? 'reactivate' : 'deactivate'}
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if form?.error && form.section !== 'create'}
			<p class="mt-4 text-center text-sm text-clay" in:fade={{ duration: 250 }}>{form.error}</p>
		{/if}
	</section>
</div>
