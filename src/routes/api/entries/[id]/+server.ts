import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteEntry, updateEntry } from '$lib/server/entries';
import { parseEntryPayload } from '$lib/server/entry-payload';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const entry = await updateEntry(locals.user!.id, params.id, parseEntryPayload(body));
	if (!entry) error(404, 'Entry not found');
	return json({ id: entry.id });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const ok = await deleteEntry(locals.user!.id, params.id);
	if (!ok) error(404, 'Entry not found');
	return json({ ok: true });
};
