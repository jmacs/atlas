import {randomUUID} from 'node:crypto';
import {and, asc, count, desc, eq, inArray, lt, notInArray} from 'drizzle-orm';
import type {NodeSQLiteDatabase} from 'drizzle-orm/node-sqlite';
import {db} from '#lib/database/client.ts';
import {schedulerActions} from '#lib/database/schema/scheduler.ts';
import type {ActionError, JsonValue} from './contracts.ts';

export type ActionRecord = typeof schedulerActions.$inferSelect;
export type ActionStatus = ActionRecord['status'];
export type ActionOutcome = {
  status: 'succeeded' | 'failed' | 'interrupted';
  result: JsonValue | null;
  error: ActionError | null;
};

export function isTerminal(status: ActionStatus) {
  return status !== 'queued' && status !== 'running';
}

export function createActionRepository(database: NodeSQLiteDatabase) {
  return {
    insertAction(type: string, payload: Record<string, unknown>) {
      const id = randomUUID();
      database
        .insert(schedulerActions)
        .values({
          id,
          type,
          payload,
          status: 'queued',
          queuedAt: new Date().toISOString(),
        })
        .run();
      return id;
    },
    getAction(id: string) {
      return database.select().from(schedulerActions).where(eq(schedulerActions.id, id)).get();
    },
    listActions(requestedPage = 1) {
      const pageSize = 20;
      const completed = notInArray(schedulerActions.status, ['queued', 'running']);
      const total = database.select({value: count()}).from(schedulerActions).where(completed).get()!
        .value;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const validPage = Number.isSafeInteger(requestedPage) ? requestedPage : 1;
      const page = Math.max(1, Math.min(validPage, pageCount));
      const active = database
        .select()
        .from(schedulerActions)
        .where(inArray(schedulerActions.status, ['queued', 'running']))
        .orderBy(asc(schedulerActions.queuedAt), asc(schedulerActions.id))
        .all();
      const history = database
        .select()
        .from(schedulerActions)
        .where(completed)
        .orderBy(desc(schedulerActions.finishedAt), desc(schedulerActions.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all();
      return {active, history, page, pageCount};
    },
    listExpiredActions(finishedBefore: string, limit: number) {
      return database
        .select()
        .from(schedulerActions)
        .where(
          and(
            inArray(schedulerActions.status, ['succeeded', 'failed', 'interrupted']),
            lt(schedulerActions.finishedAt, finishedBefore),
          ),
        )
        .orderBy(asc(schedulerActions.finishedAt), asc(schedulerActions.id))
        .limit(limit)
        .all();
    },
    deleteAction(id: string) {
      return database
        .delete(schedulerActions)
        .where(
          and(
            eq(schedulerActions.id, id),
            inArray(schedulerActions.status, ['succeeded', 'failed', 'interrupted']),
          ),
        )
        .run().changes;
    },
    claimNextAction() {
      return database.transaction(
        (tx) => {
          const action = tx
            .select()
            .from(schedulerActions)
            .where(eq(schedulerActions.status, 'queued'))
            .orderBy(asc(schedulerActions.queuedAt), asc(schedulerActions.id))
            .limit(1)
            .get();
          if (!action) {
            return undefined;
          }
          const claimed = tx
            .update(schedulerActions)
            .set({status: 'running', startedAt: new Date().toISOString()})
            .where(and(eq(schedulerActions.id, action.id), eq(schedulerActions.status, 'queued')))
            .returning()
            .get();
          if (!claimed) {
            throw new Error('Action claim was not persisted');
          }
          return claimed;
        },
        {behavior: 'immediate'},
      );
    },
    finishAction(id: string, outcome: ActionOutcome) {
      const updated = database
        .update(schedulerActions)
        .set({...outcome, result: outcome.result ?? null, finishedAt: new Date().toISOString()})
        .where(and(eq(schedulerActions.id, id), eq(schedulerActions.status, 'running')))
        .run();
      if (updated.changes !== 1) {
        throw new Error(`Could not finalize action ${id}`);
      }
    },
    recoverRunningActions() {
      database
        .update(schedulerActions)
        .set({
          status: 'interrupted',
          finishedAt: new Date().toISOString(),
          error: {
            message:
              'Atlas stopped before completion could be established. External effects may have occurred.',
          },
        })
        .where(eq(schedulerActions.status, 'running'))
        .run();
    },
  };
}

export type ActionRepository = ReturnType<typeof createActionRepository>;
export const actionRepository = createActionRepository(db);
