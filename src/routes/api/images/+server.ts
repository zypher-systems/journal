import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { db } from '$lib/db';
import { images } from '$lib/db/schema';

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB
const MAX_DIMENSION = 1600;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function uploadsDir(): string {
	return process.env.UPLOADS_DIR ?? 'data/uploads';
}

export const POST: RequestHandler = async ({ locals, request }) => {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) error(400, 'No file provided');
	if (file.size > MAX_UPLOAD_BYTES) error(413, 'Image too large (12 MB max)');

	const type = file.type.split(';')[0];
	if (!ALLOWED.has(type)) error(415, 'Only jpeg, png, webp, gif or avif images are supported');

	const buffer = Buffer.from(await file.arrayBuffer());

	let pipeline = sharp(buffer, { failOn: 'error' }).rotate();
	const meta = await pipeline.metadata();
	let width = meta.width ?? 0;
	let height = meta.height ?? 0;

	// Resize large photos; keep small ones as-is. GIFs skip processing to preserve animation.
	let outBuffer: Buffer = buffer;
	if (type !== 'image/gif') {
		if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
			pipeline = pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside' });
		}
		outBuffer = await pipeline.webp({ quality: 82 }).toBuffer();
		const outMeta = await sharp(outBuffer).metadata();
		width = outMeta.width ?? width;
		height = outMeta.height ?? height;
	}

	const id = randomUUID();
	const dir = path.join(uploadsDir(), locals.user!.id);
	await mkdir(dir, { recursive: true });
	const filename = type === 'image/gif' ? `${id}.gif` : `${id}.webp`;
	await writeFile(path.join(dir, filename), outBuffer);

	await db.insert(images).values({
		id,
		userId: locals.user!.id,
		path: `${locals.user!.id}/${filename}`,
		width,
		height
	});

	return json({ id, url: `/api/images/${id}`, width, height }, { status: 201 });
};
