import { z } from 'zod';
import { insertAnimalSchema, insertObservationSchema, insertTransactionSchema, insertFeedSchema, animals, observations, transactions, feeds } from './schema';

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
        200: z.custom<typeof animals.$inferSelect & { observations?: typeof observations.$inferSelect[], feeds?: typeof feeds.$inferSelect[] }>(),
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
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
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
  feeds: {
    list: {
      method: 'GET' as const,
      path: '/api/feeds' as const,
      responses: {
        200: z.array(z.custom<typeof feeds.$inferSelect & { animal?: typeof animals.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/animals/:animalId/feeds' as const,
      input: insertFeedSchema.omit({ animalId: true }),
      responses: {
        201: z.custom<typeof feeds.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  }
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

export type AnimalInput = z.infer<typeof api.animals.create.input>;
export type AnimalUpdateInput = z.infer<typeof api.animals.update.input>;
export type ObservationInput = z.infer<typeof api.observations.create.input>;
export type TransactionInput = z.infer<typeof api.finances.create.input>;
export type FeedInput = z.infer<typeof api.feeds.create.input>;
