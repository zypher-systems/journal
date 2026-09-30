#!/usr/bin/env node
/**
 * Create (or reset) an admin account from the command line.
 *   node scripts/create-admin.mjs <email> <name> <password>
 */
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const [email, name, password] = process.argv.slice(2);

if (!email || !password || password.length < 8) {
	console.error('usage: node scripts/create-admin.mjs <email> <name> <password (min 8 chars)>');
	process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL ?? 'postgres://journal:journal@localhost:5432/journal', {
	max: 1
});

const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
const result = await sql`
	insert into users (email, name, password_hash, role)
	values (${email.toLowerCase()}, ${name || 'Admin'}, ${passwordHash}, 'admin')
	on conflict (email) do update
	set password_hash = excluded.password_hash, deactivated = false
	returning id, email`;

console.log(`admin ready: ${result[0].email}`);
await sql.end();
