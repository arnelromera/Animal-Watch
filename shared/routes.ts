import { z } from 'zod';
import { insertAnimalSchema, insertObservationSchema, insertTransactionSchema, insertUserSchema, animals, observations, transactions, users, categories, insertCategorySchema, feedInventory, insertFeedInventorySchema, medicalSupplies, insertMedicalSupplySchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/users/:id/reset-password' as const,
      responses: {
        200: z.object({ message: z.string(), temporaryPassword: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    recover: {
      method: 'POST' as const,
      path: '/api/users/recover' as const,
      input: z.object({ email: z.string().email(), username: z.string().optional() }),
      responses: {
        200: z.object({ message: z.string(), username: z.string().optional() }),
        404: errorSchemas.notFound,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    current: {
      method: 'GET' as const,
      path: '/api/users/current' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
    updateCurrent: {
      method: 'PATCH' as const,
      path: '/api/users/current' as const,
      input: insertUserSchema.partial().extend({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional()
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories' as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/categories/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  animals: {
    list: {
      method: 'GET' as const,
      path: '/api/animals' as const,
      responses: {
        200: z.array(z.custom<typeof animals.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/animals/:id' as const,
      responses: {
        200: z.custom<typeof animals.$inferSelect & { observations?: typeof observations.$inferSelect[], transactions?: typeof transactions.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/animals' as const,
      input: insertAnimalSchema,
      responses: {
        201: z.custom<typeof animals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/animals/:id' as const,
      input: insertAnimalSchema.partial(),
      responses: {
        200: z.custom<typeof animals.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/animals/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  observations: {
    create: {
      method: 'POST' as const,
      path: '/api/animals/:animalId/observations' as const,
      input: insertObservationSchema.omit({ animalId: true }),
      responses: {
        201: z.custom<typeof observations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  finances: {
    list: {
      method: 'GET' as const,
      path: '/api/finances' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect & { animal?: typeof animals.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/finances' as const,
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/finances/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  feedInventory: {
    list: {
      method: 'GET' as const,
      path: '/api/feed-inventory' as const,
      responses: {
        200: z.array(z.custom<typeof feedInventory.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/feed-inventory' as const,
      input: insertFeedInventorySchema,
      responses: {
        201: z.custom<typeof feedInventory.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/feed-inventory/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  medicalSupplies: {
    list: {
      method: 'GET' as const,
      path: '/api/medical-supplies' as const,
      responses: {
        200: z.array(z.custom<typeof medicalSupplies.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/medical-supplies' as const,
      input: insertMedicalSupplySchema,
      responses: {
        201: z.custom<typeof medicalSupplies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/medical-supplies/:id' as const,
      input: insertMedicalSupplySchema.partial(),
      responses: {
        200: z.custom<typeof medicalSupplies.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/medical-supplies/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginInput = z.infer<typeof api.users.login.input>;
export type UserInput = z.infer<typeof api.users.updateCurrent.input>;
export type CreateUserInput = z.infer<typeof api.users.create.input>;
export type AnimalInput = z.infer<typeof api.animals.create.input>;
export type AnimalUpdateInput = z.infer<typeof api.animals.update.input>;
export type ObservationInput = z.infer<typeof api.observations.create.input>;
export type TransactionInput = z.infer<typeof api.finances.create.input>;
export type CategoryInput = z.infer<typeof api.categories.create.input>;
export type FeedInventoryInput = z.infer<typeof api.feedInventory.create.input>;
export type MedicalSupplyInput = z.infer<typeof api.medicalSupplies.create.input>;
