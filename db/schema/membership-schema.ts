
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { challenges } from "./challenge-schema";

export const challengeMembers = pgTable(
  "challenge_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    joinedAt: timestamp("joined_at")
      .defaultNow()
      .notNull(),
      leftAt: timestamp("left_at"),
  },
  (table) => [
    uniqueIndex("challenge_members_challenge_user_unique").on(
      table.challengeId,
      table.userId
    ),

    index("challenge_members_user_id_idx").on(table.userId),
  ]
);
