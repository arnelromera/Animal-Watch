import { db } from "./db";
import {
  animals,
  observations,
  transactions,
  feeds,
  type Animal,
  type InsertAnimal,
  type UpdateAnimalRequest,
  type Observation,
  type InsertObservation,
  type AnimalWithObservations,
  type Transaction,
  type InsertTransaction,
  type Feed,
  type InsertFeed
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
    
    // Automatically create a transaction for the feed cost
    await db.insert(transactions).values({
      animalId,
      description: `Feed: ${insertFeed.foodType}`,
      amount: insertFeed.totalCost,
      type: "expense",
      category: "feed",
      units: insertFeed.quantity,
      pricePerUnit: insertFeed.pricePerUnit,
      date: new Date()
    });

    return feed;
  }
}

export const storage = new DatabaseStorage();
