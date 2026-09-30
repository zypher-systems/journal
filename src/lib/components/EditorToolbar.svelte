<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Editor } from '@tiptap/core';

	let {
		editor,
		uploading = false,
		onUpload
	}: {
		editor: Editor | null;
		uploading?: boolean;
		onUpload?: (file: File) => Promise<{ url: string } | null>;
	} = $props();

	type Btn = {
		label: string;
		title: string;
		active?: boolean;
		run: () => void;
		kbd?: string;
	};

	let buttons = $derived.by<Array<Btn>>(() => {
		const e = editor;
		if (!e) return [];
		return [
			{
				label: 'B',
				title: 'Bold (⌘B)',
				active: e.isActive('bold'),
				run: () => e.chain().focus().toggleBold().run()
			},
			{
				label: 'I',
				title: 'Italic (⌘I)',
				active: e.isActive('italic'),
				run: () => e.chain().focus().toggleItalic().run()
			},
			{
				label: 'S',
				title: 'Strikethrough',
				active: e.isActive('strike'),
				run: () => e.chain().focus().toggleStrike().run()
			},
			{
				label: '“”',
				title: 'Quote',
				active: e.isActive('blockquote'),
				run: () => e.chain().focus().toggleBlockquote().run()
			},
			{
				label: 'H',
				title: 'Heading',
				active: e.isActive('heading', { level: 2 }),
				run: () => e.chain().focus().toggleHeading({ level: 2 }).run()
			},
			{
				label: '•',
				title: 'Bulleted list',
				active: e.isActive('bulletList'),
				run: () => e.chain().focus().toggleBulletList().run()
			},
			{
				label: '1.',
				title: 'Numbered list',
				active: e.isActive('orderedList'),
				run: () => e.chain().focus().toggleOrderedList().run()
			},
			{
				label: '⌥',
				title: 'Divider (···)',
				run: () => e.chain().focus().setHorizontalRule().run()
			}
		];
	});

	let fileInput: HTMLInputElement | undefined = $state();

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const upload = onUpload ?? (await import('$lib/client/images')).uploadImage;
		const result = await upload(file);
		if (result) editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
	}
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-3 sm:px-4">
	<div
		class="glass shadow-soft pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 overflow-x-auto rounded-full px-1.5 py-1.5 sm:max-w-none sm:px-2"
		in:fly={{ y: 16, duration: 500, delay: 200 }}
	>
		{#each buttons as b (b.title)}
			<button
				type="button"
				title={b.title}
				onclick={b.run}
				class="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm transition-all duration-200
					{b.active
						? 'bg-sage-mist font-semibold text-ink'
						: 'text-ink-soft hover:bg-sage-mist/60 hover:text-ink'}"
				aria-pressed={b.active}
			>
				{#if b.label === 'B'}
					<strong class="font-serif text-base">B</strong>
				{:else if b.label === 'I'}
					<em class="font-serif text-base">I</em>
				{:else if b.label === 'S'}
					<s class="font-serif text-base">S</s>
				{:else}
					<span class="font-serif text-base">{b.label}</span>
				{/if}
			</button>
		{/each}

		<span class="mx-1 h-4 w-px bg-line"></span>

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={onFile}
		/>
		<button
			type="button"
			title="Add a photo"
			onclick={() => fileInput?.click()}
			disabled={uploading}
			class="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-ink-soft transition-all duration-200
				hover:bg-sage-mist/60 hover:text-ink disabled:opacity-40"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect x="3" y="3" width="18" height="18" rx="3" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-4.35-4.35a1.5 1.5 0 0 0-2.12 0L5 20" />
			</svg>
		</button>
	</div>
</div>

