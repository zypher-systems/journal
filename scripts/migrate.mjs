#!/usr/bin/env node
/**
 * Startup migration: applies Drizzle migrations, seeds the prompt list,
 * and bootstraps the first admin from ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD.
 * Safe to run repeatedly.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { hash } from '@node-rs/argon2';

const url = process.env.DATABASE_URL ?? 'postgres://journal:journal@localhost:5432/journal';
const retries = Number(process.env.MIGRATE_RETRIES ?? 20);

// 1. Wait for Postgres to accept connections.
let sql;
for (let attempt = 1; attempt <= retries; attempt++) {
	try {
		sql = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
		await sql`select 1`;
		break;
	} catch (err) {
		if (attempt === retries) {
			console.error('database never became ready:', err.message);
			process.exit(1);
		}
		await new Promise((r) => setTimeout(r, 2000));
	}
}

try {
	// 2. Apply migrations (idempotent).
	const migrationsFolder = path.resolve('migrations');
	try {
		await readdir(migrationsFolder);
	} catch {
		console.error('no migrations folder found — skipping schema apply');
	}
	if (sql) {
		const db = drizzle(sql);
		await migrate(db, { migrationsFolder });
		console.log('migrations applied');
	}

	// 3. Seed prompts.
	const promptsFile = path.resolve('src/lib/data/prompts.json');
	const prompts = JSON.parse(await readFile(promptsFile, 'utf8'));
	for (const body of prompts) {
		await sql`insert into prompts (body) values (${body}) on conflict (body) do nothing`;
	}
	console.log(`${prompts.length} prompts ensured`);

	// 4. Bootstrap first admin (only if no users exist yet).
	const [{ count }] = await sql`select count(*)::int as count from users`;
	if (count === 0) {
		const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
		const name = process.env.ADMIN_NAME?.trim() || 'Admin';
		const password = process.env.ADMIN_PASSWORD;
		if (email && password && password.length >= 8) {
			const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
			await sql`insert into users (email, name, password_hash, role) values (${email}, ${name}, ${passwordHash}, 'admin')`;
			console.log(`admin account created for ${email}`);
		} else {
			console.log('no users yet and no ADMIN_EMAIL/ADMIN_PASSWORD set — create one with: node scripts/create-admin.mjs');
		}
	}
} catch (err) {
	console.error('startup migration failed:', err);
	process.exit(1);
} finally {
	await sql?.end();
}
