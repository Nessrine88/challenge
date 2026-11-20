import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { challenges } from "./challenge-schema";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Who receives the notification
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Who triggered it (the creator who removed someone, or the member who left)
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),

  challengeId: uuid("challenge_id").references(() => challenges.id, {
    onDelete: "cascade",
  }),

  type: text("type", {
    enum: ["member_left", "member_removed", "removed_from_challenge"],
  }).notNull(),

  // Message is stored as a snapshot so it still reads correctly if names change
  message: text("message").notNull(),

  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});