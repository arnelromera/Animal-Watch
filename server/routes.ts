import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.animals.list.path, async (req, res) => {
    const animals = await storage.getAnimals();
    res.json(animals);
  });

  app.get(api.animals.get.path, async (req, res) => {
    const animal = await storage.getAnimal(Number(req.params.id));
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    res.json(animal);
  });

  app.post(api.animals.create.path, async (req, res) => {
    try {
      const input = api.animals.create.input.parse(req.body);
      const animal = await storage.createAnimal(input);
      res.status(201).json(animal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.animals.update.path, async (req, res) => {
    try {
      const input = api.animals.update.input.parse(req.body);
      const animal = await storage.updateAnimal(Number(req.params.id), input);
      if (!animal) {
        return res.status(404).json({ message: 'Animal not found' });
      }
      res.json(animal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.animals.delete.path, async (req, res) => {
    const success = await storage.deleteAnimal(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    res.status(204).end();
  });

  app.post(api.observations.create.path, async (req, res) => {
    try {
      const input = api.observations.create.input.parse(req.body);
      const animalId = Number(req.params.animalId);
      const animal = await storage.getAnimal(animalId);
      
      if (!animal) {
         return res.status(404).json({ message: 'Animal not found' });
      }

      const observation = await storage.createObservation(animalId, input);
      res.status(201).json(observation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.finances.list.path, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.post(api.finances.create.path, async (req, res) => {
    try {
      const input = api.finances.create.input.parse(req.body);
      const transaction = await storage.createTransaction(input);
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.finances.delete.path, async (req, res) => {
    const success = await storage.deleteTransaction(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(204).end();
  });

  app.get(api.feeds.list.path, async (req, res) => {
    const feeds = await storage.getFeeds();
    res.json(feeds);
  });

  app.post(api.feeds.create.path, async (req, res) => {
    try {
      const input = api.feeds.create.input.parse(req.body);
      const animalId = Number(req.params.animalId);
      const animal = await storage.getAnimal(animalId);
      
      if (!animal) {
         return res.status(404).json({ message: 'Animal not found' });
      }

      const feed = await storage.createFeed(animalId, input);
      res.status(201).json(feed);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // seed data
  const animalsList = await storage.getAnimals();
  if (animalsList.length === 0) {
    const a1 = await storage.createAnimal({
      name: "Leo",
      species: "Lion",
      age: 5,
      healthStatus: "Healthy",
      location: "Savannah Reserve Sector A",
      imageUrl: "https://images.unsplash.com/photo-1541414779316-d5651fc4c74f?w=800&auto=format&fit=crop"
    });
    const a2 = await storage.createAnimal({
      name: "Bella",
      species: "Elephant",
      age: 12,
      healthStatus: "Injured",
      location: "Watering Hole B",
      imageUrl: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&auto=format&fit=crop"
    });
    
    await storage.createObservation(a1.id, {
      notes: "Appears active and feeding well.",
      observerName: "Dr. Smith"
    });
    await storage.createObservation(a2.id, {
      notes: "Mild limp on the right hind leg, requires monitoring.",
      observerName: "Dr. Jones"
    });
  }

  return httpServer;
}
