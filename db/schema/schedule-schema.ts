
import {
  pgEnum,
  pgTable,
  uuid,
  smallint,
  varchar,
  timestamp,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { challengeTasks } from "./task-schema";

export const scheduleFrequency = pgEnum("schedule_frequency", [
  "daily",
  "selected_days",
]);

export const challengeSchedules = pgTable(
  "challenge_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    taskId: uuid("task_id")
      .notNull()
      .references(() => challengeTasks.id, {
        onDelete: "cascade",
      }),

    frequency: scheduleFrequency("frequency")
      .notNull()
      .default("daily"),

    // JavaScript weekday convention:
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    weekdays: smallint("weekdays").array().notNull().default([]),

    timezone: varchar("timezone", { length: 64 })
      .notNull()
      .default("UTC"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("challenge_schedules_task_id_unique").on(table.taskId),

    check(
      "challenge_schedules_weekdays_check",
      sql`(
        (${table.frequency} = 'daily' AND cardinality(${table.weekdays}) = 0)
        OR
        (
          ${table.frequency} = 'selected_days'
          AND cardinality(${table.weekdays}) BETWEEN 1 AND 7
          AND ${table.weekdays} <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
        )
      )`,
    ),
  ],
);
