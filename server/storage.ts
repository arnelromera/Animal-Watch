import { db } from "./db";
import {
  animals,
  observations,
  type Animal,
  type InsertAnimal,
  type UpdateAnimalRequest,
  type Observation,
  type InsertObservation,
  type AnimalWithObservations
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAnimals(): Promise<Animal[]>;
  getAnimal(id: number): Promise<AnimalWithObservations | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, updates: UpdateAnimalRequest): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  
  createObservation(animalId: number, observation: InsertObservation): Promise<Observation>;
}

export class DatabaseStorage implements IStorage {
  async getAnimals(): Promise<Animal[]> {
    return await db.select().from(animals).orderBy(desc(animals.lastSeenAt));
  }

  async getAnimal(id: number): Promise<AnimalWithObservations | undefined> {
    const animalRows = await db.select().from(animals).where(eq(animals.id, id));
    if (animalRows.length === 0) return undefined;
    
    const obsRows = await db.select().from(observations).where(eq(observations.animalId, id)).orderBy(desc(observations.observedAt));
    
    return {
      ...animalRows[0],
      observations: obsRows
    };
  }

  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const [animal] = await db.insert(animals).values(insertAnimal).returning();
    return animal;
  }

  async updateAnimal(id: number, updates: UpdateAnimalRequest): Promise<Animal | undefined> {
    const [updated] = await db.update(animals)
      .set({ ...updates, lastSeenAt: new Date() }) // automatically update lastSeenAt if edited
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
    
    // update lastSeenAt for the animal
    await db.update(animals).set({ lastSeenAt: new Date() }).where(eq(animals.id, animalId));
    
    return observation;
  }
}

export const storage = new DatabaseStorage();
