
import {
  pgTable,
  uuid,
  date,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { challengeMembers } from "./membership-schema";
import { challengeTasks } from "./task-schema";

export const challengeCheckins = pgTable(
  "challenge_checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    membershipId: uuid("membership_id")
      .notNull()
      .references(() => challengeMembers.id, {
        onDelete: "cascade",
      }),

    taskId: uuid("task_id")
      .notNull()
      .references(() => challengeTasks.id, {
        onDelete: "cascade",
      }),

    // Date in the challenge's local calendar
    checkinDate: date("checkin_date", {
      mode: "string",
    }).notNull(),

    note: text("note"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // One completion per task, participant and date
    uniqueIndex("challenge_checkins_membership_task_date_unique")
      .on(table.membershipId, table.taskId, table.checkinDate),

    index("challenge_checkins_membership_date_idx")
      .on(table.membershipId, table.checkinDate),

    index("challenge_checkins_task_id_idx")
      .on(table.taskId),
  ],
);
