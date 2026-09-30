import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createEntry } from '$lib/server/entries';
import { parseEntryPayload } from '$lib/server/entry-payload';

export const POST: RequestHandler = async ({ locals, request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const entry = await createEntry(locals.user!.id, parseEntryPayload(body));
	return json({ id: entry.id }, { status: 201 });
};
