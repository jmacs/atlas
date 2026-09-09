import {index, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const schedulerActions = sqliteTable(
  'scheduler_actions',
  {
    id: text().primaryKey(),
    type: text().notNull(),
    payload: text({mode: 'json'}).$type<Record<string, unknown>>().notNull(),
    status: text({enum: ['queued', 'running', 'succeeded', 'failed', 'interrupted']}).notNull(),
    queuedAt: text('queued_at').notNull(),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    result: text({mode: 'json'}).$type<unknown>(),
    error: text({mode: 'json'}).$type<{message: string; stack?: string}>(),
  },
  (table) => [
    index('scheduler_actions_queue_idx').on(table.status, table.queuedAt, table.id),
    index('scheduler_actions_retention_idx').on(table.status, table.finishedAt, table.id),
  ],
);
