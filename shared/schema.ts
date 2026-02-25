import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  age: integer("age"),
  healthStatus: text("health_status").notNull().default("Unknown"), // e.g. Healthy, Sick, Injured, Unknown
  location: text("location").notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  imageUrl: text("image_url"),
});

export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").references(() => animals.id, { onDelete: "cascade" }).notNull(),
  notes: text("notes").notNull(),
  observerName: text("observer_name").notNull(),
  observedAt: timestamp("observed_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // using numeric for currency
  type: text("type").notNull(), // 'income' or 'expense'
  category: text("category").notNull(), // e.g., 'food', 'medical', 'equipment', 'donation'
  date: timestamp("date").defaultNow().notNull(),
});

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").references(() => animals.id, { onDelete: "cascade" }).notNull(),
  foodType: text("food_type").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // e.g., kg, lbs, portions
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  fedAt: timestamp("fed_at").defaultNow().notNull(),
});

export const animalsRelations = relations(animals, ({ many }) => ({
  observations: many(observations),
  feeds: many(feeds),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  animal: one(animals, {
    fields: [observations.animalId],
    references: [animals.id],
  }),
}));

export const feedsRelations = relations(feeds, ({ one }) => ({
  animal: one(animals, {
    fields: [feeds.animalId],
    references: [animals.id],
  }),
}));

export const insertAnimalSchema = createInsertSchema(animals).omit({ id: true });
export const insertObservationSchema = createInsertSchema(observations).omit({ id: true, observedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export const insertFeedSchema = createInsertSchema(feeds).omit({ id: true, fedAt: true });

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type UpdateAnimalRequest = Partial<InsertAnimal>;

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Feed = typeof feeds.$inferSelect;
export type InsertFeed = z.infer<typeof insertFeedSchema>;

export type AnimalWithObservations = Animal & {
  observations?: Observation[];
  feeds?: Feed[];
};
