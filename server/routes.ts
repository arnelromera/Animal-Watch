import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertFeedInventorySchema, insertMedicalSupplySchema } from "@shared/schema";

// Simple in-memory session tracking for development
let currentUserId: number | null = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.animals.list.path, async (req, res) => {
    const animals = await storage.getAnimals();
    res.json(animals);
  });

  app.get(api.animals.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const animal = await storage.getAnimal(id);
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
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create animal" });
    }
  });

  app.put(api.animals.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const input = api.animals.update.input.parse(req.body);
      const animal = await storage.updateAnimal(id, input);
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
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to update animal" });
    }
  });

  app.delete(api.animals.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const success = await storage.deleteAnimal(id);
    if (!success) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    res.status(204).end();
  });

  app.post(api.observations.create.path, async (req, res) => {
    try {
      const animalId = Number(req.params.animalId);
      if (isNaN(animalId)) return res.status(400).json({ message: "Invalid ID" });

      const input = api.observations.create.input.parse(req.body);
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
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create observation" });
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
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create transaction" });
    }
  });

  app.delete(api.finances.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const success = await storage.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(204).end();
  });

  // Inventory & Medical routes
  app.get(api.feedInventory.list.path, async (req, res) => {
    const items = await storage.getFeedInventory();
    res.json(items);
  });

  app.post(api.feedInventory.create.path, async (req, res) => {
    try {
      const input = api.feedInventory.create.input.parse(req.body);
      const item = await storage.createFeedInventory(input);
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating feed inventory:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create inventory item" });
    }
  });

  app.delete(api.feedInventory.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteFeedInventory(id);
    res.status(204).end();
  });

  app.get(api.medicalSupplies.list.path, async (req, res) => {
    const supplies = await storage.getMedicalSupplies();
    res.json(supplies);
  });

  app.post(api.medicalSupplies.create.path, async (req, res) => {
    try {
      const input = api.medicalSupplies.create.input.parse(req.body);
      const item = await storage.createMedicalSupply(input);
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating medical supply:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create medical supply" });
    }
  });

  app.patch(api.medicalSupplies.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.medicalSupplies.update.input.parse(req.body);
      const item = await storage.updateMedicalSupply(id, input);
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: "Failed to update medical supply" });
    }
  });

  app.delete(api.medicalSupplies.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteMedicalSupply(id);
    res.status(204).end();
  });

  // User routes - Specific "current" routes MUST come before generic ":id" routes
  app.get("/api/users/current", async (req, res) => {
    if (currentUserId === null) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const user = await storage.getUser(currentUserId);
    if (!user) {
      currentUserId = null;
      return res.status(401).json({ message: "User session invalid" });
    }
    res.json(user);
  });

  app.patch("/api/users/current", async (req, res) => {
    if (currentUserId === null) {
      return res.status(401).json({ message: "Not logged in" });
    }

    try {
      const { newPassword, currentPassword, ...userData } = api.users.updateCurrent.input.parse(req.body);

      const updates: any = { ...userData };
      if (newPassword) {
        updates.password = newPassword;
      }

      const updated = await storage.updateUser(currentUserId, updates);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to update profile" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create user" });
    }
  });

  app.patch(api.users.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const input = api.users.update.input.parse(req.body);
      const updated = await storage.updateUser(id, input);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to update user" });
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).end();
  });

  app.post(api.users.resetPassword.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const tempPassword = Math.random().toString(36).slice(-8);
      await storage.updateUser(id, { password: tempPassword });

      res.json({
        message: `Password reset successfully for ${user.fullName}`,
        temporaryPassword: tempPassword
      });
    } catch (err) {
      res.status(400).json({ message: "Failed to reset password" });
    }
  });

  app.post(api.users.recover.path, async (req, res) => {
    try {
      const { email, username } = api.users.recover.input.parse(req.body);
      const allUsers = await storage.getUsers();

      if (username) {
        const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase() && u.username === username);
        if (!user) return res.status(404).json({ message: "No user found with these details" });
        return res.json({ message: "Password reset request sent to administrator" });
      } else {
        const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) return res.status(404).json({ message: "No user found with this email address" });
        return res.json({ message: "Username located", username: user.username });
      }
    } catch (err) {
      res.status(400).json({ message: "Invalid request details" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    currentUserId = user.id;
    res.json(user);
  });

  app.post("/api/logout", (req, res) => {
    currentUserId = null;
    res.json({ message: "Logged out successfully" });
  });

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: err instanceof Error ? err.message : "Failed to create category" });
    }
  });

  app.patch("/api/categories/type", async (req, res) => {
    try {
      const { oldType, newType } = req.body;
      if (!oldType || !newType) return res.status(400).json({ message: "Old and new types are required" });

      const success = await storage.updateCategoryType(oldType, newType);
      if (!success) return res.status(404).json({ message: "Category type not found" });

      res.json({ message: "Category type updated successfully" });
    } catch (err) {
      res.status(400).json({ message: "Failed to update category type" });
    }
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const success = await storage.deleteCategory(id);
    if (!success) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(204).end();
  });

  // seed initial data
  const usersList = await storage.getUsers();
  if (usersList.length === 0) {
    await storage.createUser({
      username: "admin",
      password: "password",
      fullName: "Rodrigo Dela Cruz",
      role: "Farm Administrator",
      email: "rodrigo@farm.com",
      bio: "Chief Operations Officer for AR Farm Monitoring."
    });

    await storage.createUser({
      username: "jdoe",
      password: "password",
      fullName: "John Doe",
      role: "Staff",
      email: "john@farm.com",
      bio: "Field operations specialist."
    });

    await storage.createUser({
      username: "msmith",
      password: "password",
      fullName: "Maria Smith",
      role: "Veterinarian",
      email: "maria@vet.com",
      bio: "Livestock health and welfare expert."
    });
  }

  const animalsList = await storage.getAnimals();
  if (animalsList.length === 0) {
    await storage.createAnimal({
      name: "2024 Alpha Flock",
      species: "chicken",
      count: 50,
      pricePerLivestock: "10.00",
      healthStatus: "Healthy",
      location: "Coop A",
      startDate: new Date("2024-01-15"),
      imageUrl: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop"
    });

    await storage.createAnimal({
      name: "2023 Legacy Herd",
      species: "cow",
      count: 12,
      pricePerLivestock: "1150.00",
      healthStatus: "Healthy",
      location: "East Pasture",
      startDate: new Date("2023-05-20"),
      imageUrl: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&auto=format&fit=crop"
    });
  }

  const categoriesList = await storage.getCategories();
  const defaultCategories = [
    { type: 'species', name: 'Pig' },
    { type: 'species', name: 'Goat' },
    { type: 'species', name: 'Chicken' },
    { type: 'species', name: 'Cow' },
    { type: 'health_status', name: 'Healthy' },
    { type: 'health_status', name: 'Injured' },
    { type: 'health_status', name: 'Sick' },
    { type: 'health_status', name: 'Monitoring' },
    { type: 'health_status', name: 'Unknown' },
    { type: 'expense_category', name: 'Events' },
    { type: 'expense_category', name: 'Feed' },
    { type: 'expense_category', name: 'Gas and Electric' },
    { type: 'expense_category', name: 'General Supplies' },
    { type: 'expense_category', name: 'Labor and Employment' },
    { type: 'expense_category', name: 'Medication and Vaccines' },
    { type: 'expense_category', name: 'Others' },
    { type: 'expense_category', name: 'Purchase of Livestock' },
    { type: 'income_category', name: 'Sale of Pig' },
    { type: 'income_category', name: 'Sale of Goat' },
    { type: 'income_category', name: 'Sale of Chicken' },
    { type: 'income_category', name: 'Sale of Cow' },
    { type: 'feed_unit', name: 'kg' },
    { type: 'feed_unit', name: 'g' },
    { type: 'feed_unit', name: 'lbs' },
    { type: 'feed_unit', name: 'bags' },
    { type: 'feed_unit', name: 'portions' },
    { type: 'feed_unit', name: 'liters' },
    { type: 'med_unit', name: 'ml' },
    { type: 'med_unit', name: 'vials' },
    { type: 'med_unit', name: 'pills' },
  ];

  for (const cat of defaultCategories) {
    const exists = categoriesList.some(c => c.type === cat.type && c.name === cat.name);
    if (!exists) {
      await storage.createCategory(cat);
    }
  }

  return httpServer;
}
