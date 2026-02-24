import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
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

export const animalsRelations = relations(animals, ({ many }) => ({
  observations: many(observations),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  animal: one(animals, {
    fields: [observations.animalId],
    references: [animals.id],
  }),
}));

export const insertAnimalSchema = createInsertSchema(animals).omit({ id: true });
export const insertObservationSchema = createInsertSchema(observations).omit({ id: true, observedAt: true });

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type UpdateAnimalRequest = Partial<InsertAnimal>;

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;

export type AnimalWithObservations = Animal & {
  observations?: Observation[];
};
