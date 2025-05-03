import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { images } from "./images";
import { users } from "./users";
import { relations } from 'drizzle-orm';

export const imageHistory = pgTable("image_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageId: integer("image_id").notNull().references(() => images.id),
  changeType: text("change_type").notNull(),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageHistoryRelations = relations(imageHistory, ({ one }) => ({
  image: one(images, {
    fields: [imageHistory.imageId],
    references: [images.id],
  }),
  changedByUser: one(users, {
    fields: [imageHistory.changedBy],
    references: [users.id],
  }),
})); 