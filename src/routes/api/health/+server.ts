import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';

/** Healthy only when the database answers, so the container check reflects it. */
export const GET: RequestHandler = async () => {
	let ok = true;
	try {
		await db.execute(sql`select 1`);
	} catch {
		ok = false;
	}
	return new Response(JSON.stringify({ ok, at: new Date().toISOString() }), {
		status: ok ? 200 : 503,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
	});
};
