import { db } from "./db";
import {
  animals,
  observations,
  transactions,
  feeds,
  users,
  categories,
  feedInventory,
  type Animal,
  type InsertAnimal,
  type UpdateAnimalRequest,
  type Observation,
  type InsertObservation,
  type AnimalWithObservations,
  type Transaction,
  type InsertTransaction,
  type Feed,
  type InsertFeed,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type FeedInventory,
  type InsertFeedInventory
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAnimals(): Promise<Animal[]>;
  getAnimal(id: number): Promise<AnimalWithObservations | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, updates: UpdateAnimalRequest): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  
  createObservation(animalId: number, observation: InsertObservation): Promise<Observation>;

  getTransactions(): Promise<(Transaction & { animal?: Animal })[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;

  getFeeds(): Promise<(Feed & { animal?: Animal })[]>;
  createFeed(animalId: number, feed: InsertFeed): Promise<Feed>;

  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;

  getFeedInventory(): Promise<FeedInventory[]>;
  updateFeedStock(id: number, quantity: string): Promise<FeedInventory | undefined>;
  createFeedInventory(item: InsertFeedInventory): Promise<FeedInventory>;
  deleteFeedInventory(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAnimals(): Promise<Animal[]> {
    return await db.select().from(animals).orderBy(desc(animals.lastSeenAt));
  }

  async getAnimal(id: number): Promise<AnimalWithObservations | undefined> {
    const animalRows = await db.select().from(animals).where(eq(animals.id, id));
    if (animalRows.length === 0) return undefined;
    
    const obsRows = await db.select().from(observations).where(eq(observations.animalId, id)).orderBy(desc(observations.observedAt));
    const feedRows = await db.select().from(feeds).where(eq(feeds.animalId, id)).orderBy(desc(feeds.fedAt));
    const transactionRows = await db.select().from(transactions).where(eq(transactions.animalId, id)).orderBy(desc(transactions.date));
    
    return {
      ...animalRows[0],
      observations: obsRows,
      feeds: feedRows,
      transactions: transactionRows
    };
  }

  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const [animal] = await db.insert(animals).values({
      ...insertAnimal,
      startDate: insertAnimal.startDate ? new Date(insertAnimal.startDate) : new Date(),
    }).returning();
    
    // Automatically create a transaction for the livestock purchase
    const totalCost = (parseFloat(insertAnimal.pricePerLivestock || "0") * (insertAnimal.count || 1)).toString();
    await db.insert(transactions).values({
      animalId: animal.id,
      description: `Purchase of ${animal.count} ${animal.species}`,
      amount: totalCost,
      type: "expense",
      category: "purchase of livestock",
      units: (insertAnimal.count || 1).toString(),
      pricePerUnit: insertAnimal.pricePerLivestock || "0",
      date: animal.startDate
    });

    return animal;
  }

  async updateAnimal(id: number, updates: UpdateAnimalRequest): Promise<Animal | undefined> {
    const preparedUpdates = { ...updates };
    if (preparedUpdates.startDate && typeof preparedUpdates.startDate === 'string') {
      preparedUpdates.startDate = new Date(preparedUpdates.startDate);
    }

    const [updated] = await db.update(animals)
      .set({ 
        ...preparedUpdates, 
        lastSeenAt: new Date(),
      })
      .where(eq(animals.id, id))
      .returning();
    return updated;
  }

  async deleteAnimal(id: number): Promise<boolean> {
    await db.delete(transactions).where(eq(transactions.animalId, id));
    const [deleted] = await db.delete(animals).where(eq(animals.id, id)).returning();
    return !!deleted;
  }

  async createObservation(animalId: number, insertObservation: InsertObservation): Promise<Observation> {
    const [observation] = await db.insert(observations).values({ ...insertObservation, animalId }).returning();
    await db.update(animals).set({ lastSeenAt: new Date() }).where(eq(animals.id, animalId));
    return observation;
  }

  async getTransactions(): Promise<(Transaction & { animal?: Animal })[]> {
    const rows = await db.select({
      transaction: transactions,
      animal: animals
    })
    .from(transactions)
    .leftJoin(animals, eq(transactions.animalId, animals.id))
    .orderBy(desc(transactions.date));

    return rows.map(r => ({
      ...r.transaction,
      animal: r.animal || undefined
    }));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();

    if (transaction.type === 'income' && transaction.animalId) {
      const animalRows = await db.select().from(animals).where(eq(animals.id, transaction.animalId));
      if (animalRows.length > 0) {
        const deduction = Math.floor(parseFloat(transaction.units || "1"));
        const newCount = Math.max(0, animalRows[0].count - deduction);

        await db.update(animals)
          .set({ count: newCount })
          .where(eq(animals.id, transaction.animalId));
      }
    }

    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const [deleted] = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return !!deleted;
  }

  async getFeeds(): Promise<(Feed & { animal?: Animal })[]> {
    const rows = await db.select({
      feed: feeds,
      animal: animals
    })
    .from(feeds)
    .leftJoin(animals, eq(feeds.animalId, animals.id))
    .orderBy(desc(feeds.fedAt));

    return rows.map(r => ({
      ...r.feed,
      animal: r.animal || undefined
    }));
  }

  async createFeed(animalId: number, insertFeed: InsertFeed): Promise<Feed> {
    const [feed] = await db.insert(feeds).values({ ...insertFeed, animalId }).returning();
    
    // Update inventory if it exists
    const inventory = await db.select().from(feedInventory).where(eq(feedInventory.name, insertFeed.foodType));
    if (inventory.length > 0) {
      const currentQty = parseFloat(inventory[0].quantity);
      const consumedQty = parseFloat(insertFeed.quantity);
      const newQty = Math.max(0, currentQty - consumedQty).toString();

      await db.update(feedInventory)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(feedInventory.id, inventory[0].id));
    }

    // Automatically create a transaction for the feed cost
    await db.insert(transactions).values({
      animalId,
      description: `Feed: ${insertFeed.foodType}`,
      amount: insertFeed.totalCost,
      type: "expense",
      category: "feed",
      units: insertFeed.quantity,
      pricePerUnit: insertFeed.pricePerUnit,
      date: feed.fedAt
    });

    return feed;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.updatedAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return !!deleted;
  }

  async getFeedInventory(): Promise<FeedInventory[]> {
    return await db.select().from(feedInventory).orderBy(desc(feedInventory.updatedAt));
  }

  async updateFeedStock(id: number, quantity: string): Promise<FeedInventory | undefined> {
    const [updated] = await db.update(feedInventory)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(feedInventory.id, id))
      .returning();
    return updated;
  }

  async createFeedInventory(item: InsertFeedInventory): Promise<FeedInventory> {
    const [newItem] = await db.insert(feedInventory).values(item).returning();
    return newItem;
  }

  async deleteFeedInventory(id: number): Promise<boolean> {
    const [deleted] = await db.delete(feedInventory).where(eq(feedInventory.id, id)).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
