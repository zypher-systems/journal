import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { deleteEntry, getEntry } from '$lib/server/entries';

const extensions = [
	StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
	Typography,
	Link,
	Image
];

export const load: PageServerLoad = async ({ locals, params }) => {
	const found = await getEntry(locals.user!.id, params.id);
	if (!found) error(404, 'Entry not found');
	return {
		entry: found.entry,
		tags: found.tags,
		html: generateHTML(found.entry.content as Parameters<typeof generateHTML>[0], extensions)
	};
};

export const actions: Actions = {
	delete: async ({ locals, params }) => {
		await deleteEntry(locals.user!.id, params.id);
		redirect(302, '/');
	}
};
