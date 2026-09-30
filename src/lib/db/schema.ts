import { sql } from 'drizzle-orm';
import {
	boolean,
	customType,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'member']);

/** Raw tsvector column for full-text search. */
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: userRole('role').notNull().default('member'),
	/** 'system' | 'light' | 'dark' */
	themePreference: text('theme_preference').notNull().default('system'),
	deactivated: boolean('deactivated').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable(
	'sessions',
	{
		/** sha256 hash of the cookie token; the raw token never touches the db. */
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const entries = pgTable(
	'entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		/** Optional title, kept out of the Tiptap doc. */
		title: text('title'),
		/** Tiptap JSON document. */
		content: jsonb('content').notNull(),
		/** Flattened plain text (generated client-side) feeding the tsvector. */
		plainText: text('plain_text').notNull(),
		entryDate: date('entry_date').notNull(),
		wordCount: integer('word_count').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		searchVector: tsvector('search_vector').generatedAlwaysAs(
			sql`to_tsvector('english', "plain_text")`
		)
	},
	(t) => [
		index('entries_user_date_idx').on(t.userId, t.entryDate),
		index('entries_user_created_idx').on(t.userId, t.createdAt),
		index('entries_search_idx').using('gin', t.searchVector)
	]
);

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull()
	},
	(t) => [uniqueIndex('tags_user_name_idx').on(t.userId, t.name)]
);

export const entryTags = pgTable(
	'entry_tags',
	{
		entryId: uuid('entry_id')
			.notNull()
			.references(() => entries.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.entryId, t.tagId] })]
);

export const images = pgTable('images', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	/** File name inside the uploads dir. */
	path: text('path').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const prompts = pgTable('prompts', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	body: text('body').notNull().unique()
});

export type User = typeof users.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
