
import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  date,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const challengeVisibility = pgEnum("challenge_visibility", [
  "public",
  "private",
]);

export const challengeStatus = pgEnum("challenge_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 120 }).notNull(),

    description: text("description").notNull(),

    category: varchar("category", { length: 50 }),

    visibility: challengeVisibility("visibility")
      .notNull()
      .default("public"),

    status: challengeStatus("status")
      .notNull()
      .default("draft"),

    startDate: date("start_date").notNull(),

    endDate: date("end_date"),

    maxParticipants: integer("max_participants"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("challenges_creator_id_idx").on(table.creatorId),

    index("challenges_visibility_status_idx").on(
      table.visibility,
      table.status
    ),

    check(
      "challenges_end_date_check",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),

    check(
      "challenges_max_participants_check",
      sql`${table.maxParticipants} IS NULL OR ${table.maxParticipants} > 0`
    ),
  ]
);
