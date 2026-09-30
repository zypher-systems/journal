<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, type EditorOptions } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Typography from '@tiptap/extension-typography';
	import Placeholder from '@tiptap/extension-placeholder';
	import CharacterCount from '@tiptap/extension-character-count';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';

	let {
		initialContent,
		placeholder = "What's on your mind?",
		onchange,
		onready,
		autofocus = true
	}: {
		initialContent?: unknown;
		placeholder?: string;
		onchange?: (payload: { json: unknown; text: string; isEmpty: boolean; wordCount: number }) => void;
		onready?: (editor: Editor) => void;
		autofocus?: boolean;
	} = $props();

	let editor = $state<Editor | null>(null);
	let host: HTMLDivElement | undefined = $state();

	const extensions = [
		StarterKit.configure({
			heading: { levels: [1, 2, 3] },
			codeBlock: { HTMLAttributes: { class: '' } }
		}),
		Typography,
		Link.configure({ openOnClick: false, autolink: true }),
		Image.configure({ inline: false, allowBase64: false }),
		Placeholder.configure({ placeholder }),
		CharacterCount
	];

	onMount(() => {
		editor = new Editor({
			element: host,
			extensions,
			content: (initialContent as EditorOptions['content']) ?? {
				type: 'doc',
				content: [{ type: 'paragraph' }]
			},
			autofocus: autofocus ? 'end' : false,
			editorProps: {
				attributes: {
					class: 'prose-entry focus:outline-none mx-auto',
					spellcheck: 'true'
				}
			},
			onUpdate: ({ editor }) => {
				onchange?.({
					json: editor.getJSON(),
					text: editor.getText(),
					isEmpty: editor.isEmpty,
					wordCount: editor.storage.characterCount.words()
				});
			}
		});
		onready?.(editor);
	});

	onDestroy(() => editor?.destroy());

	// Imperative access for the parent page.
	export function getEditor(): Editor | null {
		return editor;
	}
	export function insertText(text: string) {
		editor?.chain().focus().insertContentAt(editor.state.selection.to, text).run();
	}
	export function insertImage(src: string, alt?: string) {
		editor?.chain().focus().setImage({ src, alt }).run();
	}
</script>

<div bind:this={host} class="editor-host"></div>

<style>
	.editor-host :global(.ProseMirror) {
		padding-bottom: 30vh; /* room to breathe at the end of long entries */
	}
</style>
