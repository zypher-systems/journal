import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { images } from '$lib/db/schema';

const MIME: Record<string, string> = {
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.avif': 'image/avif'
};

export const GET: RequestHandler = async ({ locals, params }) => {
	const [image] = await db
		.select()
		.from(images)
		.where(and(eq(images.id, params.id), eq(images.userId, locals.user!.id)))
		.limit(1);

	if (!image) error(404, 'Image not found');

	const full = path.join(process.env.UPLOADS_DIR ?? 'data/uploads', image.path);
	let size: number;
	try {
		size = (await stat(full)).size;
	} catch {
		error(404, 'Image not found');
	}

	const type = MIME[path.extname(full)] ?? 'application/octet-stream';
	const stream = createReadStream(full);
	return new Response(stream as unknown as ReadableStream, {
		headers: {
			'content-type': type,
			'content-length': String(size),
			'cache-control': 'private, max-age=31536000, immutable'
		}
	});
};
