<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import Editor from './Editor.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import { todayString } from '$lib/dates';
	import { uploadImage } from '$lib/client/images';

	type Initial = {
		id?: string;
		title: string;
		entryDate: string;
		content?: unknown;
		tags: string[];
	};

	let {
		initial,
		prompt = null,
		suggestions = []
	}: { initial: Initial; prompt?: string | null; suggestions?: string[] } = $props();

	// ── state ──────────────────────────────────────────────
	let entryId = $state(initial.id);
	let title = $state(initial.title);
	let entryDate = $state(initial.entryDate);
	let tagNames = $state<string[]>(initial.tags);
	let tagInput = $state('');
	let editorComponent = $state<ReturnType<typeof Editor> | null>(null);
	let tiptap = $derived(editorComponent?.getEditor() ?? null);

	type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';
	let saveState = $state<SaveState>('clean');
	let savedAt = $state<Date | null>(null);
	let wordCount = $state(0);
	let showPrompt = $state(true);
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	let draft = { json: initial.content, text: '', isEmpty: true, words: 0 };
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let promptInserted = $state(false);

	let canSave = $derived(saveState === 'dirty' || saveState === 'error');

	// ── autosave ────────────────────────────────────────────

	function markDirty() {
		if (saveState === 'clean' || saveState === 'saved') saveState = 'dirty';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, 1400);
	}

	async function save() {
		if (saveState !== 'dirty' && saveState !== 'error') return;
		saveState = 'saving';
		const plainText = (title.trim() ? `${title.trim()}\n\n` : '') + draft.text;
		const payload = {
			title: title.trim() || null,
			content: draft.json,
			plainText,
			wordCount: draft.words,
			entryDate,
			tags: tagNames
		};
		try {
			if (entryId) {
				const res = await fetch(`/api/entries/${entryId}`, {
					method: 'PUT',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (!res.ok) throw new Error();
			} else {
				const res = await fetch('/api/entries', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (!res.ok) throw new Error();
				const data = (await res.json()) as { id: string };
				entryId = data.id;
				// Make refresh/back preserve the entry without remounting the editor.
				history.replaceState(history.state, '', `/entry/${entryId}/edit`);
			}
			saveState = 'saved';
			savedAt = new Date();
		} catch {
			saveState = 'error';
		}
	}

	function onEditorChange(payload: { json: unknown; text: string; isEmpty: boolean; wordCount: number }) {
		draft = { json: payload.json, text: payload.text, isEmpty: payload.isEmpty, words: payload.wordCount };
		wordCount = payload.wordCount;
		markDirty();
	}

	// Cmd/Ctrl+S saves immediately.
	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			if (saveState === 'dirty' || saveState === 'error') void save();
		}
	}

	// Warn on closing the tab with unsaved work.
	$effect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (saveState === 'dirty' || saveState === 'saving') {
				e.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	// Save before in-app navigation.
	beforeNavigate((nav) => {
		if ((saveState === 'dirty' || saveState === 'error') && nav.to?.url.pathname !== `/entry/${entryId}/edit`) {
			void save();
		}
	});

	// ── tags ────────────────────────────────────────────────

	function addTag(raw: string) {
		const n = raw.trim().replace(/^#/, '').replace(/\s+/g, ' ').slice(0, 40);
		if (n && !tagNames.some((t) => t.toLowerCase() === n.toLowerCase())) {
			tagNames = [...tagNames, n];
			markDirty();
		}
		tagInput = '';
	}

	function onTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			if (tagInput.trim()) addTag(tagInput);
		} else if (e.key === 'Backspace' && !tagInput) {
			tagNames = tagNames.slice(0, -1);
			markDirty();
		}
	}

	function removeTag(name: string) {
		tagNames = tagNames.filter((t) => t !== name);
		markDirty();
	}

	function insertPrompt() {
		editorComponent?.insertText(prompt ?? '');
		promptInserted = true;
	}

	async function handleUpload(file: File) {
		uploading = true;
		uploadError = null;
		const result = await uploadImage(file);
		uploading = false;
		if (!result) {
			uploadError = 'Couldn’t add that photo. Try a smaller image, or a different file.';
			return null;
		}
		return result;
	}

	let filteredSuggestions = $derived(
		suggestions.filter(
			(s) => tagInput && s.toLowerCase().startsWith(tagInput.toLowerCase()) && !tagNames.includes(s)
		)
	);

	let statusLabel = $derived.by(() => {
		switch (saveState) {
			case 'dirty':
				return 'writing…';
			case 'saving':
				return 'saving…';
			case 'saved':
				return savedAt
					? `saved ${savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
					: 'saved';
			case 'error':
				return 'couldn’t save — will retry on next edit';
			default:
				return entryId ? 'opened' : 'not saved yet';
		}
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
	<!-- meta row -->
	<div class="mb-6 flex items-center justify-between gap-3" in:fly={{ y: 10, duration: 450 }}>
		<a href="/" class="rounded-full px-2 py-1 text-sm text-ink-mute transition-colors duration-300 hover:text-sage-deep">
			← journal
		</a>

		<div class="flex items-center gap-3">
			<span class="font-mono text-[11px] text-ink-mute tabular">
				{wordCount} {wordCount === 1 ? 'word' : 'words'}
			</span>
			<span
				class="font-mono text-[11px] tabular transition-colors duration-500
					{saveState === 'error' ? 'text-clay' : saveState === 'saved' ? 'text-sage-deep' : 'text-ink-mute'}"
			>
				{statusLabel}
			</span>
			<a
				href="/"
				class="rounded-full bg-sage-deep px-3.5 py-1.5 text-sm font-medium text-paper transition-all duration-300
					hover:bg-sage-deep/90 hover:shadow-soft active:scale-95"
				onclick={(e) => {
					if (canSave) {
						e.preventDefault();
						void save().then(() => { window.location.href = '/'; });
					}
				}}
			>
				Done
			</a>
		</div>
	</div>

	<!-- date + tags -->
	<div class="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2" in:fly={{ y: 10, duration: 450, delay: 60 }}>
		<input
			type="date"
			bind:value={entryDate}
			max={todayString()}
			onchange={markDirty}
			class="rounded-soft border border-transparent bg-transparent px-2 py-1 font-mono text-xs text-ink-soft transition-colors
				hover:border-line focus:border-sage focus:outline-none"
			aria-label="Entry date"
		/>

		<div class="flex flex-wrap items-center gap-1.5">
			{#each tagNames as tag (tag)}
				<span class="group inline-flex items-center gap-1 rounded-full bg-sage-mist/70 px-2.5 py-0.5 font-mono text-[11px] text-ink-soft">
					#{tag}
					<button type="button" onclick={() => removeTag(tag)} aria-label="Remove tag {tag}" class="opacity-40 transition-opacity group-hover:opacity-100 hover:text-clay">×</button>
				</span>
			{/each}
			<input
				bind:value={tagInput}
				onkeydown={onTagKeydown}
				onblur={() => tagInput.trim() && addTag(tagInput)}
				list="tag-suggestions"
				placeholder="add tag…"
				class="w-24 rounded-full border border-transparent bg-transparent px-2 py-0.5 font-mono text-[11px] text-ink-soft transition-colors
					placeholder:text-ink-mute/60 hover:border-line focus:w-32 focus:border-sage focus:outline-none"
				aria-label="Add a tag"
			/>
			<datalist id="tag-suggestions">
				{#each filteredSuggestions as s (s)}
					<option value={s}>#{s}</option>
				{/each}
			</datalist>
		</div>
	</div>

	<!-- prompt -->
	{#if prompt && showPrompt && !promptInserted}
		<div
			class="mb-8 rounded-card border border-sage/25 bg-sage-mist/40 px-5 py-4 transition-all duration-500"
			in:fade={{ duration: 600, delay: 120 }}
			out:fade={{ duration: 250 }}
		>
			<div class="flex items-start justify-between gap-4">
				<p class="font-serif text-lg text-ink italic" style="font-variation-settings: 'opsz' 40;">{prompt}</p>
				<div class="flex shrink-0 items-center gap-2 pt-1">
					<button type="button" onclick={insertPrompt} class="rounded-full border border-sage/40 px-2.5 py-0.5 text-[11px] text-sage-deep transition-colors hover:bg-sage-mist/70">
						write with it
					</button>
					<button type="button" onclick={() => (showPrompt = false)} aria-label="Dismiss prompt" class="text-ink-mute transition-colors hover:text-ink">×</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- title -->
	<input
		bind:value={title}
		oninput={markDirty}
		placeholder="Untitled"
		class="w-full bg-transparent font-serif text-3xl text-ink placeholder:text-ink-mute/50 focus:outline-none"
		style="font-variation-settings: 'opsz' 60; letter-spacing: -0.01em;"
		aria-label="Title"
	/>
	<div class="rule mt-5 max-w-sm" aria-hidden="true">···</div>

	<!-- the page itself -->
	<div class="glow mt-6">
		<Editor
			bind:this={editorComponent}
			initialContent={initial.content}
			onchange={onEditorChange}
		/>
	</div>

	<EditorToolbar editor={tiptap} {uploading} onUpload={handleUpload} />

	{#if uploadError}
		<p
			class="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-md rounded-full bg-clay/15 px-4 py-2 text-center text-sm text-clay"
			role="alert"
		>
			{uploadError}
		</p>
	{/if}
</div>
