
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { challenges } from "./challenge-schema";
import { user } from "./auth-schema";

export const challengeTasks = pgTable(
  "challenge_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 120 }).notNull(),

    description: text("description"),

    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("challenge_tasks_challenge_id_idx").on(table.challengeId),
  ]
);
