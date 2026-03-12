import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("Farm Administrator"),
  email: text("email"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // This will be used for "Flock Name"
  species: text("species").notNull(), // Select: pig, goat, chicken, cow
  count: integer("count").notNull().default(1), // Number of animals
  pricePerLivestock: numeric("price_per_livestock", { precision: 10, scale: 2 }).notNull().default("0"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  healthStatus: text("health_status").notNull().default("Healthy"),
  location: text("location").notNull(),
  notes: text("notes"), // General notes
  imageUrl: text("image_url"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
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
  animalId: integer("animal_id").references(() => animals.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  category: text("category").notNull(),
  units: numeric("units", { precision: 10, scale: 2 }).default("1"),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).default("0"),
  attachments: text("attachments"), // Comma separated URLs
  note: text("note"),
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

// New table for dynamic categories/options
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'species', 'health_status', 'income_category', 'expense_category'
  name: text("name").notNull(),
});

// New table for feed inventory tracking
export const feedInventory = pgTable("feed_inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Starter Mash', 'Grower Pellets'
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull(), // e.g., 'kg', 'bags'
  minThreshold: numeric("min_threshold", { precision: 10, scale: 2 }).notNull().default("10"), // Warning level
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const animalsRelations = relations(animals, ({ many }) => ({
  observations: many(observations),
  feeds: many(feeds),
  transactions: many(transactions),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  animal: one(animals, {
    fields: [observations.animalId],
    references: [animals.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  animal: one(animals, {
    fields: [transactions.animalId],
    references: [animals.id],
  }),
}));

export const feedsRelations = relations(feeds, ({ one }) => ({
  animal: one(animals, {
    fields: [feeds.animalId],
    references: [animals.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, updatedAt: true });
export const insertAnimalSchema = createInsertSchema(animals, {
  startDate: z.coerce.date(),
}).omit({ id: true });
export const insertObservationSchema = createInsertSchema(observations).omit({ id: true, observedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
}).omit({ id: true });
export const insertFeedSchema = createInsertSchema(feeds).omit({ id: true, fedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertFeedInventorySchema = createInsertSchema(feedInventory).omit({ id: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type UpdateAnimalRequest = Partial<InsertAnimal>;

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Feed = typeof feeds.$inferSelect;
export type InsertFeed = z.infer<typeof insertFeedSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type FeedInventory = typeof feedInventory.$inferSelect;
export type InsertFeedInventory = z.infer<typeof insertFeedInventorySchema>;

export type AnimalWithObservations = Animal & {
  observations?: Observation[];
  feeds?: Feed[];
  transactions?: Transaction[];
};
