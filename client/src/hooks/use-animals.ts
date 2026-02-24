import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AnimalInput, type AnimalUpdateInput, type ObservationInput } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useAnimals() {
  return useQuery({
    queryKey: [api.animals.list.path],
    queryFn: async () => {
      const res = await fetch(api.animals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch animals");
      const data = await res.json();
      return parseWithLogging<any>(api.animals.list.responses[200], data, "animals.list");
    },
  });
}

export function useAnimal(id: number) {
  return useQuery({
    queryKey: [api.animals.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.animals.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch animal details");
      const data = await res.json();
      return parseWithLogging<any>(api.animals.get.responses[200], data, "animals.get");
    },
    enabled: !!id,
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnimalInput) => {
      const validated = api.animals.create.input.parse(data);
      const res = await fetch(api.animals.create.path, {
        method: api.animals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create animal");
      }
      return parseWithLogging<any>(api.animals.create.responses[201], await res.json(), "animals.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.animals.list.path] });
    },
  });
}

export function useUpdateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AnimalUpdateInput }) => {
      const validated = api.animals.update.input.parse(data);
      const url = buildUrl(api.animals.update.path, { id });
      const res = await fetch(url, {
        method: api.animals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        if (res.status === 404) throw new Error("Animal not found");
        throw new Error("Failed to update animal");
      }
      return parseWithLogging<any>(api.animals.update.responses[200], await res.json(), "animals.update");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.animals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.animals.get.path, variables.id] });
    },
  });
}

export function useDeleteAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.animals.delete.path, { id });
      const res = await fetch(url, {
        method: api.animals.delete.method,
        credentials: "include",
      });
      if (res.status === 404) throw new Error("Animal not found");
      if (!res.ok) throw new Error("Failed to delete animal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.animals.list.path] });
    },
  });
}

export function useCreateObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ animalId, data }: { animalId: number; data: ObservationInput }) => {
      const validated = api.observations.create.input.parse(data);
      const url = buildUrl(api.observations.create.path, { animalId });
      const res = await fetch(url, {
        method: api.observations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create observation");
      }
      return parseWithLogging<any>(api.observations.create.responses[201], await res.json(), "observations.create");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.animals.get.path, variables.animalId] });
      // Might also affect dashboard stats/last seen, so invalidate list
      queryClient.invalidateQueries({ queryKey: [api.animals.list.path] });
    },
  });
}
