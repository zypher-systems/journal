import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url =
	process.env.DATABASE_URL ?? 'postgres://journal:journal@localhost:5432/journal';

// Postgres notices (e.g. a search made only of stop words) are informational, not log-worthy.
const client = postgres(url, { max: 10, onnotice: () => {} });

export const db = drizzle(client, { schema });

export { schema };
