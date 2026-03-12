import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UserInput } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useUser() {
  return useQuery({
    queryKey: [api.users.current.path],
    queryFn: async () => {
      const res = await fetch(api.users.current.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return parseWithLogging<any>(api.users.current.responses[200], data, "users.current");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserInput) => {
      const res = await fetch(api.users.updateCurrent.path, {
        method: api.users.updateCurrent.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return parseWithLogging<any>(api.users.updateCurrent.responses[200], await res.json(), "users.updateCurrent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.current.path] });
    },
  });
}
