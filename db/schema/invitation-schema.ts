
import { sql } from "drizzle-orm";

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { challenges } from "./challenge-schema";

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);

export const challengeInvitations = pgTable(
  "challenge_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, {
        onDelete: "cascade",
      }),

    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    inviteeId: text("invitee_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    status: invitationStatus("status")
      .notNull()
      .default("pending"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    respondedAt: timestamp("responded_at"),
  },
  (table) => [
    index("challenge_invitations_invitee_idx").on(
      table.inviteeId,
      table.status
    ),

    index("challenge_invitations_challenge_idx").on(
      table.challengeId
    ),

    uniqueIndex("challenge_invitations_pending_unique")
      .on(table.challengeId, table.inviteeId)
      .where(sql`${table.status} = 'pending'`),
  ]
);
